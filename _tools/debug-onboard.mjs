/** 调试：身份页「下一步」点击为何未切换步骤 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9444
const PROFILE = path.join(ROOT, '_tools', '.edge-dbg')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map()
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id)
        this.pending.delete(m.id)
        m.error ? reject(new Error(m.error.message)) : resolve(m.result)
      }
    })
  }
  static connect(url) {
    return new Promise((res, rej) => {
      const ws = new WebSocket(url)
      ws.addEventListener('open', () => res(new CDP(ws)), { once: true })
      ws.addEventListener('error', () => rej(new Error('ws fail')), { once: true })
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)) } }, 15000)
    })
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error('JS异常: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
    return r.result?.value
  }
}

fs.rmSync(PROFILE, { recursive: true, force: true })
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--window-size=430,932', 'http://127.0.0.1:8461/'], { stdio: 'ignore' })

try {
  let targets
  for (let i = 0; i < 40 && !targets?.length; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json() } catch {}
    await sleep(300)
  }
  const page = targets.find((t) => t.type === 'page')
  const cdp = await CDP.connect(page.webSocketDebuggerUrl)
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable')
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__e2eErrors=[];window.addEventListener('error',e=>__e2eErrors.push(e.message));window.addEventListener('unhandledrejection',e=>__e2eErrors.push('REJ:'+e.reason));const ce=console.error.bind(console);console.error=(...a)=>{__e2eErrors.push(a.map(String).join(' '));ce(...a)};`
  })
  await sleep(3000)

  // 进入 onboard
  await cdp.eval(`location.hash = '#/pages/onboard/index'`)
  await sleep(1500)
  console.log('--- onboard? ---', await cdp.eval(`document.body.innerText.includes('选择身份')`))

  const click = async (needle) => cdp.eval(`
    (() => {
      const needle = ${JSON.stringify(needle)}
      const interactive = ['button','.btn','.act-btn','.choice','.tab-chip','.attr-chip','.id-card','.path-chip','.nav-btn','.nav-meta','.navbar-back','.uni-tabbar__item']
      const pick = (els) => { const c = els.filter(el => el.textContent && el.textContent.includes(needle)); if (!c.length) return null; c.sort((a,b)=>a.textContent.trim().length-b.textContent.trim().length); return c[0] }
      let el = null
      for (const sel of interactive) { el = pick([...document.querySelectorAll(sel)]); if (el) break }
      if (!el) return 'NOTFOUND'
      const info = el.tagName + '.' + el.className
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
      return info + ' :: ' + el.textContent.trim().slice(0, 30)
    })()`)

  console.log('选身份:', await click('忆质残像'))
  await sleep(400)
  console.log('picked 卡:', await cdp.eval(`[...document.querySelectorAll('.id-card')].map(c=>c.className.includes('picked')?c.querySelector('.id-name').innerText:'').join('')`))
  console.log('点下一步:', await click('下一步'))
  await sleep(800)
  const txt = await cdp.eval('document.body.innerText')
  console.log('含"二、填写角色卡":', txt.includes('二、填写角色卡'))
  console.log('步骤指示:', await cdp.eval(`[...document.querySelectorAll('.step-dot')].map(d=>d.className).join(' | ')`))
  console.log('可见section:', await cdp.eval(`[...document.querySelectorAll('.section-title .h2')].map(h=>h.innerText).join(' / ')`))
  console.log('页面错误:', JSON.stringify(await cdp.eval(`window.__e2eErrors || []`)))
  // 再点一次
  console.log('再点下一步:', await click('下一步'))
  await sleep(600)
  const txt2 = await cdp.eval('document.body.innerText')
  console.log('第二次后 含角色卡:', txt2.includes('二、填写角色卡'), '| 含神谕步骤:', txt2.includes('三、生成神谕'))
} catch (e) {
  console.error('DEBUG FAIL:', e)
} finally {
  edge.kill(); await sleep(300)
  try { fs.rmSync(PROFILE, { recursive: true, force: true }) } catch {}
}