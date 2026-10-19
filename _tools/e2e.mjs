/**
 * 端到端验证（Edge CDP）：真实浏览器里跑通整个跑团流程。
 *  启动 Edge headless → 打开 H5 构建 → 创建角色 → 行动/判定 → Oracle → 结局 → 各分页
 *  全程截图存到 预览截图/，任一断言失败则退出码非 0。
 *
 * 运行：node _tools/e2e.mjs [baseURL] [port]
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SHOTS = path.join(ROOT, '预览截图')

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.argv[2] || 'http://127.0.0.1:8461/'
const PORT = Number(process.argv[3] || 9333)
const PROFILE = path.join(ROOT, '_tools', '.edge-profile')

let step = 0
const results = []
function check(name, ok, extra = '') {
  results.push({ name, ok, extra })
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${extra ? ' — ' + extra : ''}`)
  if (!ok) process.exitCode = 1
}

/* ---------------- CDP 客户端 ---------------- */
class CDP {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
      }
    })
  }
  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      ws.addEventListener('open', () => resolve(new CDP(ws)), { once: true })
      ws.addEventListener('error', () => reject(new Error('ws connect failed')), { once: true })
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error('CDP timeout: ' + method))
        }
      }, 20000)
    })
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })
    if (r.exceptionDetails) {
      throw new Error(
        'JS异常: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)
      )
    }
    return r.result?.value
  }
  async shot(name) {
    await new Promise((r) => setTimeout(r, 550)) // 等动画
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' })
    const file = path.join(SHOTS, `${String(++step).padStart(2, '0')}-${name}.png`)
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
    console.log(`    📸 ${path.relative(ROOT, file)}`)
    return file
  }
}

/* ---------------- 工具 ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitFor(cdp, expr, timeout = 9000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    try {
      if (await cdp.eval(`!!(${expr})`)) return true
    } catch { /* ignore */ }
    await sleep(250)
  }
  return false
}

/** 点击 textContent 含指定文本的元素（优先交互类选择器，取最精确者） */
const CLICK_TEXT = (needle) => `
(() => {
  const needle = ${JSON.stringify(needle)}
  const interactive = ['button','.btn','.act-btn','.choice','.tab-chip','.filter-chip','.attr-chip',
    '.id-card','.path-chip','.nav-btn','.nav-meta','.navbar-back','.uni-tabbar__item','.word-chip','.filter-chip']
  const pick = (els) => {
    const c = els.filter(el => el.textContent && el.textContent.includes(needle))
    if (!c.length) return null
    c.sort((a, b) => a.textContent.trim().length - b.textContent.trim().length)
    return c[0]
  }
  let el = null
  for (const sel of interactive) {
    el = pick([...document.querySelectorAll(sel)])
    if (el) break
  }
  if (!el) return false
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  return el.textContent.trim().slice(0, 40)
})()`

async function click(cdp, needle, settleMs = 500) {
  const hit = await cdp.eval(CLICK_TEXT(needle))
  if (!hit) throw new Error('未找到可点击元素: ' + needle)
  await sleep(settleMs)
  return hit
}

async function bodyText(cdp) {
  return cdp.eval('document.body.innerText')
}

/* ---------------- 主流程 ---------------- */
async function main() {
  fs.mkdirSync(SHOTS, { recursive: true })
  fs.rmSync(PROFILE, { recursive: true, force: true })

  console.log('\n== 启动 Edge headless ==')
  const edge = spawn(
    EDGE,
    [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      '--window-size=430,932',
      BASE
    ],
    { stdio: 'ignore' }
  )

  let cdp
  try {
    // 等待调试端口
    let targets
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
        targets = await res.json()
        if (targets.length) break
      } catch { /* retry */ }
      await sleep(300)
    }
    if (!targets || !targets.length) throw new Error('调试端口未就绪')
    const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
    cdp = await CDP.connect(page.webSocketDebuggerUrl)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 430, height: 932, deviceScaleFactor: 2, mobile: true
    })
    // 注入错误捕获，然后干净重载一次，确保从头捕获运行时错误
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__e2eErrors = [];
        window.addEventListener('error', e => window.__e2eErrors.push('ERR: ' + (e.message || e.error)));
        window.addEventListener('unhandledrejection', e => window.__e2eErrors.push('REJ: ' + String(e.reason && e.reason.message || e.reason)));
        const ce = console.error.bind(console);
        console.error = (...a) => { window.__e2eErrors.push('CONSOLE: ' + a.map(String).join(' ').slice(0, 300)); ce(...a); };
      `
    })
    await cdp.send('Page.reload', { ignoreCache: true })

    /* ---- 1. 首屏 ---- */
    console.log('\n== 1. 首屏（未创建角色）==')
    const mounted = await waitFor(cdp, `document.body.innerText.includes('权杖正在等一个名字')`)
    check('应用挂载并渲染空状态', mounted)
    check('TabBar 渲染', await cdp.eval(`!!document.querySelector('uni-tabbar')`))
    await cdp.shot('首屏-空状态')

    /* ---- 2. 创建角色 ---- */
    console.log('\n== 2. 角色创建 ==')
    await click(cdp, '踏上逐火之旅')
    check('进入角色创建页', await waitFor(cdp, `document.body.innerText.includes('选择身份')`))
    check('身份卡片渲染', await waitFor(cdp, `document.querySelectorAll('.id-card').length === 4`))
    await sleep(500) // 等待转场动画结束
    const idCount = await cdp.eval(`[...document.querySelectorAll('.id-card')].length`)
    check('四个身份卡片', idCount === 4, `实际 ${idCount}`)
    // 选"忆质残像"（读取过去能力）
    await click(cdp, '忆质残像')
    await sleep(300)
    check('身份可选中（忆质残像）', await cdp.eval(`
      (() => { const p = document.querySelector('.id-card.picked .id-name'); return !!p && p.innerText.includes('忆质残像') })()
    `))
    await cdp.shot('角色创建-身份')
    await click(cdp, '下一步')
    check('进入角色卡步骤', await waitFor(cdp, `document.body.innerText.includes('填写角色卡')`))
    // 输入姓名
    await cdp.eval(`
      (() => {
        const inp = document.querySelector('uni-page input[type=text], input')
        if (!inp) return 'no-input'
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(inp, '丹恒·轮回')
        inp.dispatchEvent(new Event('input', { bubbles: true }))
        return 'ok'
      })()
    `)
    await cdp.shot('角色创建-角色卡')
    await click(cdp, '下一步')
    check('进入神谕步骤并自动掷骰', await waitFor(cdp, `document.body.innerText.includes('生成神谕')`))
    await sleep(700)
    const oracleText = await cdp.eval(`
      (() => {
        const t = document.querySelector('.oracle-text')
        return t ? t.innerText.trim() : ''
      })()
    `)
    check('神谕生成', oracleText.startsWith('「') && oracleText.endsWith('」'), oracleText.slice(0, 40))
    await cdp.shot('角色创建-神谕')
    await click(cdp, '开始逐火')
    check('进入游戏主界面', await waitFor(cdp, `document.body.innerText.includes('记忆值')`))
    const charName = await cdp.eval(
      `(()=>{const e=[...document.querySelectorAll('.h3')].map(x=>x.innerText)[0]||'';return e})()`
    )
    check('角色名显示（v-model 生效）', charName.includes('丹恒'), charName)
    const hasOracle = await cdp.eval(`document.body.innerText.includes('神谕')`)
    check('神谕写入会话', hasOracle)
    await cdp.shot('主界面-初始场景')

    /* ---- 3. 玩家行动 + 记忆判定 + 黑潮检定 ---- */
    console.log('\n== 3. 行动 / 判定 / 黑潮 ==')
    await click(cdp, '谨慎观察周围')
    await sleep(400)
    let txt = await bodyText(cdp)
    check('建议行动触发记忆判定', txt.includes('记忆判定'), '')
    check('黑潮检定执行', txt.includes('黑潮检定'))
    check('骰面渲染', await cdp.eval(`document.querySelectorAll('.dice').length > 0`))
    await cdp.shot('行动-记忆判定与黑潮')

    // 自由输入
    await cdp.eval(`
      (() => {
        const ta = document.querySelector('textarea')
        if (!ta) return 'no-ta'
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
        setter.call(ta, '我向石壁上的神谕铭文伸手')
        ta.dispatchEvent(new Event('input', { bubbles: true }))
        return 'ok'
      })()
    `)
    await click(cdp, '执行行动')
    await sleep(400)
    txt = await bodyText(cdp)
    check('自由行动入会话', txt.includes('向石壁上的神谕铭文伸手'))
    await cdp.shot('行动-自由输入')

    /* ---- 4. Oracle ---- */
    console.log('\n== 4. Oracle 回响 ==')
    await click(cdp, 'Oracle')
    check('Oracle 弹层', await waitFor(cdp, `!!document.querySelector('.mask .sheet') && document.body.innerText.includes('可能性调整')`))
    await cdp.eval(`
      (() => {
        const tas = [...document.querySelectorAll('textarea')]
        const ta = tas[tas.length - 1]
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
        setter.call(ta, '这一次轮回我还能活着离开吗')
        ta.dispatchEvent(new Event('input', { bubbles: true }))
        return 'ok'
      })()
    `)
    await cdp.shot('Oracle-弹层')
    await click(cdp, '掷骰求问')
    check('Oracle 弹层关闭', await waitFor(cdp, `!document.querySelector('.mask .sheet')`, 4000))
    await sleep(300)
    txt = await bodyText(cdp)
    check('Oracle 回响出现', txt.includes('回响'))
    check('提问写入会话', txt.includes('这一次轮回我还能活着离开吗'))
    await cdp.shot('Oracle-回响')

    /* ---- 5. 移动到新场景 ---- */
    console.log('\n== 5. 移动 / 灵感词 / 图鉴 ==')
    await click(cdp, '移动')
    await sleep(500)
    txt = await bodyText(cdp)
    check('移动后场景存在', txt.includes('当前场景'))
    await click(cdp, '灵感')
    await sleep(400)
    txt = await bodyText(cdp)
    check('灵感词抽取', txt.includes('灵感词'))
    await cdp.shot('行动-移动与灵感词')

    /* ---- 6. 图鉴 ---- */
    await click(cdp, '图鉴')
    check('图鉴页', await waitFor(cdp, `document.body.innerText.includes('翁法罗斯图鉴')`))
    const ruleOk = await cdp.eval(`document.body.innerText.includes('记忆判定')`)
    check('规则书内容', ruleOk)
    await cdp.shot('图鉴-规则')
    await click(cdp, '场景·遭遇')
    await sleep(300)
    txt = await bodyText(cdp)
    check('地点表渲染（奥赫玛）', txt.includes('圣城奥赫玛'))
    check('遭遇表渲染（迷迷）', txt.includes('迷迷式记忆体'))
    await cdp.shot('图鉴-场景遭遇')

    /* ---- 7. 日志 ---- */
    console.log('\n== 6. 日志 ==')
    await click(cdp, '逐火')
    await waitFor(cdp, `document.body.innerText.includes('记忆值')`)
    await click(cdp, '日志')
    check('日志页', await waitFor(cdp, `document.body.innerText.includes('冒险日志')`))
    const logCount = await cdp.eval(`document.querySelectorAll('.tl-item').length`)
    check('日志时间线条目 > 0', logCount > 0, `${logCount} 条`)
    await cdp.shot('日志-时间线')

    /* ---- 8. 档案 ---- */
    console.log('\n== 7. 轮回档案 ==')
    await click(cdp, '档案')
    check('档案页', await waitFor(cdp, `document.body.innerText.includes('轮回档案')`))
    await cdp.shot('档案-轮回')
    // 抹除数据 → 回到空状态（后续结局测试用新角色走一遍更完整，这里先测重置）
    await click(cdp, '抹除全部轮回痕迹')
    check('重置确认弹层', await waitFor(cdp, `document.body.innerText.includes('抹除全部数据')`))
    await click(cdp, '确认')
    check('重置执行（弹层关闭）', await waitFor(cdp, `!document.body.innerText.includes('抹除全部数据')`, 4000))

    /* ---- 9. 结局流程（新角色快进） ---- */
    console.log('\n== 8. 结局生成 ==')
    await cdp.eval(`location.hash = '#/pages/onboard/index'`)
    await waitFor(cdp, `document.body.innerText.includes('选择身份')`)
    await click(cdp, '下一步')
    await click(cdp, '下一步')
    await sleep(600)
    await click(cdp, '开始逐火')
    await waitFor(cdp, `document.body.innerText.includes('记忆值')`)
    // 火种凑满
    for (let i = 0; i < 12; i++) await cdp.eval(CLICK_TEXT('火种'))
    await sleep(300)
    txt = await bodyText(cdp)
    check('火种收集至 12/12', txt.includes('12/12'))
    check('结束条件提示出现', txt.includes('再创世') || txt.includes('集齐12枚火种'))
    await cdp.shot('主界面-火种集齐')
    await click(cdp, '如我所书')
    check('收束确认弹层', await waitFor(cdp, `document.body.innerText.includes('掷 2d6 生成结局')`))
    await cdp.shot('收束-确认')
    await click(cdp, '掷 2d6 生成结局')
    check('结局页渲染', await waitFor(cdp, `document.body.innerText.includes('结局') && document.body.innerText.includes('神谕回望')`))
    const endingTxt = await bodyText(cdp)
    const tierOk = ['永劫', '残响', '火种', '如我所书'].some((n) => endingTxt.includes(n))
    check('结局档位正确（2d6 四档之一）', tierOk)
    check('神谕回望展示', endingTxt.includes('神谕'))
    await cdp.shot('结局页')

    /* ---- 10. 持久化 ---- */
    console.log('\n== 9. 持久化 ==')
    const stored = await cdp.eval(`
      (() => {
        try {
          const s = localStorage.getItem('omph.save.v1')
          const a = localStorage.getItem('omph.archive.v1')
          return { hasSave: !!s, hasArchive: !!a, saveLen: s ? s.length : 0, archiveEndings: a ? (JSON.parse(a).endings||[]).length : -1 }
        } catch (e) { return { err: String(e) } }
      })()
    `)
    check('localStorage 存档', stored.hasSave === true, `save=${stored.saveLen}B`)
    check('历史结局写入档案', stored.archiveEndings >= 1, `endings=${stored.archiveEndings}`)
    // 刷新验证恢复
    await cdp.send('Page.reload', { ignoreCache: true })
    await sleep(2500)
    txt = await bodyText(cdp)
    check('刷新后存档恢复（结局保留）', txt.includes('神谕回望') || txt.includes('记忆碎片'))
    await cdp.shot('刷新后恢复')

    /* ---- 11. 控制台错误 ---- */
    console.log('\n== 10. 无 JS 运行时错误 ==')
    const errs = await cdp.eval(`(window.__e2eErrors || [])`)
    check('全程无 JS 运行时/控制台错误', errs.length === 0, errs.length ? errs.slice(0, 5).join(' | ') : `${errs.length} 条`)
  } catch (e) {
    check('E2E 无异常', false, e.message)
    console.error(e)
  } finally {
    try { cdp?.ws?.close() } catch {}
    edge.kill()
    await sleep(400)
    try { fs.rmSync(PROFILE, { recursive: true, force: true }) } catch {}
  }

  /* ---- 汇总 ---- */
  const bad = results.filter((r) => !r.ok)
  console.log('\n──────────────────────────────')
  console.log(bad.length ? `✗ ${bad.length} 项失败 / 通过 ${results.length - bad.length} 项` : `✓ E2E 全部通过：${results.length} 项`)
  console.log('──────────────────────────────\n')
  process.exit(bad.length ? 1 : 0)
}

main()