/**
 * 全局游戏状态 store —— Vue reactive + uni storage 持久化。
 * 页面通过 import { G, actions } from '@/src/store.js' 使用。
 *
 * 存储键:
 *  - omph.save.v1      当前存档（角色 + 会话 + 场景）
 *  - omph.archive.v1   轮回档案（结局史 / 轮回史 / 日志精选）
 */

import { reactive, readonly } from 'vue'
import * as E from './engine.js'
import * as T from './tables.js'
import { pick } from './dice.js'

const SAVE_KEY = 'omph.save.v1'
const ARCHIVE_KEY = 'omph.archive.v1'

/* 黄金裔邂逅概率（每次进入新场景） */
const HEIR_MEET_CHANCE = 0.35
/* 终幕事件触发火种数 */
const FINAL_ARC_FLAME = 9

/* ===================== 存取封装（兼容无 localStorage 环境） ===================== */

function storageGet(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    }
  } catch (e) { /* noop */ }
  try {
    const uniStore = typeof uni !== 'undefined' && uni.getStorageSync
    if (uniStore) {
      const raw = uni.getStorageSync(key)
      if (typeof raw === 'string' && raw) return JSON.parse(raw)
      if (raw && typeof raw === 'object') return raw
    }
  } catch (e) { /* noop */ }
  return null
}

function storageSet(key, value) {
  const json = JSON.stringify(value)
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, json)
  } catch (e) { /* noop */ }
  try {
    if (typeof uni !== 'undefined' && uni.setStorageSync) uni.setStorageSync(key, json)
  } catch (e) { /* noop */ }
}

/* ===================== 初始状态 ===================== */

function emptySave() {
  return {
    created: false,
    character: null,
    scene: null,
    session: [],      // 会话消息 [{id,kind,text,tag,time}]
    suggestions: [],
    words: null,
    pendingCheck: null,   // 待处理的判定（供界面展示骰子）
    lastCheck: null,
    lastOracle: null,
    lastTide: null,
    rerollable: null,     // 可碎片重掷的判定参数
    tideRerollable: false, // 赛飞儿同行：黑潮检定可重掷
    tideStage: '',        // 当前黑潮阶段名
    failedTrials: [],     // 本轮回试炼失败的泰坦（轮回后重新可试）
    history: [],      // 关键事件（进入日志）
    turn: 0,          // 回合数
    reincarnation: 0, // 轮回次数
    finished: null,   // 结局对象
    flags: {}         // 异常标记等
  }
}

function emptyArchive() {
  return {
    endings: [],      // 历史结局
    fragments: [],    // 汇总记忆碎片
    logbook: [],      // 跨轮回日志精选
    totalTurns: 0,
    totalReincarnations: 0,
    firstStarted: Date.now()
  }
}

/* ===================== 响应式全局状态 ===================== */

export const G = reactive({
  save: emptySave(),
  archive: emptyArchive(),
  ui: {
    rolling: false,      // 是否正在掷骰动画
    dice: [],            // 当前展示的骰面
    modal: null,         // 当前弹层名
    toast: null,         // 顶部提示
    tooname: ''
  }
})

/* ===================== 动作 ===================== */

let msgId = 0

export const actions = {
  /* ---------- 持久化 ---------- */
  migrate() {
    const a = storageGet(ARCHIVE_KEY)
    if (a) G.archive = { ...emptyArchive(), ...a }
    const s = storageGet(SAVE_KEY)
    if (s && s.character) {
      G.save = { ...emptySave(), ...s }
      const ch = G.save.character
      // 旧存档迁移：初始化泰坦火种 / 同行者 / 每轮回消耗标记
      if (!Array.isArray(ch.titans)) {
        ch.titans = []
        if (ch.flame > 0) {
          // 旧版手动收集的火种 → 按顺序映射为泰坦火种
          ch.titans = T.TITAN_FLAMES.slice(0, Math.min(ch.flame, 12)).map((t) => t.id)
        }
      }
      if (!Array.isArray(ch.companions)) ch.companions = []
      if (!ch.usedFlags || typeof ch.usedFlags !== 'object') ch.usedFlags = {}
      if (G.save.scene && G.save.scene.words && !G.save.tideStage) {
        G.save.tideStage = T.tideStageOf(ch.tide).name
      }
      if (G.save.rerollable === undefined) G.save.rerollable = null
      if (!Array.isArray(G.save.failedTrials)) G.save.failedTrials = []
      actions.persist()
    }
  },
  persist() {
    storageSet(SAVE_KEY, G.save)
    storageSet(ARCHIVE_KEY, G.archive)
  },

  /* ---------- 角色创建 ---------- */
  newGame(opts) {
    const rng = Math.random
    const ch = E.createCharacter({ ...opts, rng })
    G.save = emptySave()
    G.save.created = true
    G.save.character = ch
    G.save.reincarnation = 0
    G.save.tideStage = '潮痕'
    actions.startScene(true)
    actions.log('system', `你以「${ch.identityName}」的身份踏上逐火之旅。神谕：「${ch.oracle}」`)
    actions.pushMsg('oracle', `神谕显现——「${ch.oracle}」`, '你的结局早已被写好，只是你还未读到那一页')
    actions.persist()
    return ch
  },

  /* ---------- 场景生成 ---------- */
  startScene(fresh = false) {
    const rng = Math.random
    const loc = E.rollLocation(rng)
    let enc = fresh ? E.rollEncounter(rng) : null
    // 黄金裔邂逅：未结伴的黄金裔按概率出现
    let heirMeet = null
    if (G.save.character) {
      const unmet = T.HEIRS.filter((h) => !G.save.character.companions.includes(h.id))
      if (unmet.length && rng() < HEIR_MEET_CHANCE) {
        heirMeet = pick(unmet, rng)
      }
    }
    G.save.scene = {
      location: loc,
      encounter: enc,
      heirMeet,
      words: E.makeWords(rng)
    }
    G.save.suggestions = E.getSuggestions(rng)
    if (fresh) {
      actions.pushMsg('narrator', loc.scene, loc.name + ' · ' + loc.vibe)
      if (enc) actions.pushMsg('narrator', enc.text, '初始遭遇 · ' + enc.name)
      actions.log('scene', `抵达【${loc.name}】——${loc.vibe}`)
      if (enc) actions.log('encounter', `初始遭遇：${enc.name}`)
    }
    actions.persist()
  },

  /* ---------- 黄金裔结伴 ---------- */
  inviteHeir() {
    const scene = G.save.scene
    const heir = scene && scene.heirMeet
    if (!heir || !G.save.character) return null
    if (G.save.character.companions.includes(heir.id)) return null
    G.save.character.companions.push(heir.id)
    actions.pushMsg('narrator', heir.meetText, '邂逅 · ' + heir.name + ' · ' + heir.title)
    actions.pushMsg('player', '邀请同行。', '结伴')
    actions.pushMsg('oracle', heir.joinLine, heir.name + ' 加入了旅程')
    actions.pushMsg('system', `同伴加成：${heir.perkText}`, '同行者')
    actions.log('companion', `与${heir.name}（${heir.title}）结伴同行`)
    G.save.scene.heirMeet = null
    actions.persist()
    return heir
  },
  declineHeir() {
    const heir = G.save.scene && G.save.scene.heirMeet
    if (!heir) return
    actions.pushMsg('player', '婉拒了同行的邀请。', '道别')
    actions.pushMsg('narrator', `${heir.name}微微一笑："后会有期，逐火者。"` + '\n（未结伴的黄金裔以后还会再遇到。）', '别过')
    G.save.scene.heirMeet = null
    actions.persist()
  },

  /* ---------- 泰坦试炼 ---------- */
  doTrial(titanId) {
    const ch = G.save.character
    const titan = T.TITAN_FLAMES.find((t) => t.id === titanId)
    if (!ch || !titan) return null
    if (ch.titans.includes(titan.id)) {
      actions.toast('这位泰坦的火种已在你手中')
      return null
    }
    if ((G.save.failedTrials || []).includes(titan.id)) {
      actions.toast('本轮回中，祂已收回注视')
      return null
    }
    actions.pushMsg('narrator', titan.trialText, `泰坦试炼 · ${titan.domain}·${titan.name}`)
    actions.pushMsg('player', titan.trialAsk, '试炼')
    const res = E.performTrial(ch, titan, Math.random)
    G.save.character = res.character
    G.ui.dice = res.check.dice
    G.save.lastCheck = res.check
    G.save.rerollable = null
    const tierTag = res.check.tier === 'full' ? '完全成功' : res.check.tier === 'partial' ? '部分成功' : '失败'
    actions.pushMsg(
      res.check.tier === 'fail' ? 'tide' : 'oracle',
      `试炼判定：${res.check.outcome}。(${res.check.dice.join('+')}+${res.check.modifier}=${res.check.total})`,
      `泰坦试炼 · ${tierTag}`
    )
    if (res.claimed) {
      actions.pushMsg('oracle', res.titan.claimText, `火种入手 · ${res.titan.domain}`)
      actions.log('flame', `试炼成功，获得「${res.titan.domain}·${res.titan.name}」火种（${G.save.character.flame}/12）`)
      actions.checkFinalArc()
    } else {
      actions.pushMsg('tide', '泰坦收回注视。你在这场试炼中未能证明自己。', '试炼失败')
      actions.log('flame', `试炼「${res.titan.domain}·${res.titan.name}」失败(${res.check.total})`)
      if (!G.save.failedTrials.includes(titan.id)) G.save.failedTrials.push(titan.id)
    }
    if (res.tideDelta > 0) {
      actions.pushMsg('tide', `试炼的代价：黑潮侵蚀 +${res.tideDelta}（当前 ${G.save.character.tide}/10）`, '黑潮侵蚀')
    }
    if (res.memoryCost > 0) {
      actions.pushMsg('tide', '试炼的失败灼伤了记忆，记忆值 -1。', '记忆受损')
    }
    actions.log('trial', `泰坦试炼「${res.titan.domain}」：${tierTag}`)
    // 试炼自带黑潮代价，不再额外触发黑潮检定
    actions.afterAction()
    return res
  },

  /* ---------- 终幕剧情（火种达 9） ---------- */
  checkFinalArc() {
    const ch = G.save.character
    if (!ch || ch.usedFlags.finalArc || ch.flame < FINAL_ARC_FLAME) return
    ch.usedFlags.finalArc = true
    actions.pushMsg('narrator', 
      '当第九道神权在你胸口点亮时，整片天空安静了一瞬。你看见远处站着一个人影——白金色的披风被光刺破，他抱着膝坐在崩坏的大地上，像抱着一个再也无人接收的世界。',
      '终幕 · 始于黎明者'
    )
    actions.pushMsg('oracle',
      '"……你也在数吗？"他抬起头，眼睛里有你见过的所有黎明的残影。"每收集一枚火种，世界就更接近\u2018被重启\u2019一次。你确定要走到最后吗？——走到最后的，从来不是救世主。"',
      '白厄的恳求'
    )
    actions.pushMsg('system',
      '终幕已启：你可以继续集齐十二火种触发再创世，也可以在此刻写下"如我所书"。',
      '抉择时刻'
    )
    actions.log('story', '终幕剧情触发：白厄的恳求（火种达9）')
    actions.persist()
  },

  /* ---------- 消息与日志 ---------- */
  pushMsg(kind, text, tag) {
    G.save.session.push({
      id: ++msgId,
      kind,
      text,
      tag: tag || '',
      time: Date.now()
    })
    if (G.save.session.length > 300) G.save.session.splice(0, 50)
  },
  log(type, text) {
    G.save.turn += 1
    G.save.history.push({
      id: 'h' + G.save.turn + '_' + Date.now().toString(36),
      turn: G.save.turn,
      type,
      text,
      reincarnation: G.save.reincarnation,
      time: Date.now()
    })
    if (G.save.history.length > 200) G.save.history.splice(0, 50)
    G.archive.totalTurns += 1
    actions.persist()
  },

  /* ---------- 核心行动：记忆判定 ---------- */
  doCheck(attrId, extra = 0, flavor = '') {
    const ch = G.save.character
    if (!ch) return null
    let res = E.performCheck(ch, attrId, extra, Math.random)
    // 失败保护恩泽（千面戏法/磐岩之护）
    const eff = E.applyCharacterEffects(ch, res)
    res = eff.check
    G.save.character = eff.character
    // 展示骰面
    G.ui.dice = res.dice
    // 应用
    G.save.character = E.applyCheckResult(G.save.character, res)
    G.save.lastCheck = res
    // 失败且尚有退路 → 允许碎片重掷
    G.save.rerollable =
      res.tier === 'fail' && (G.save.character.fragments || []).length > 0
        ? { attrId, extra, flavor }
        : null
    // 会话叙述
    const tierTag =
      res.tier === 'full' ? '完全成功' : res.tier === 'partial' ? '部分成功' : '失败'
    const tierKind = res.tier === 'fail' ? 'tide' : res.tier === 'full' ? 'oracle' : 'narrator'
    actions.pushMsg(
      tierKind,
      `${flavor ? flavor + ' —— ' : ''}${res.outcome}。(${res.dice.join('+')}+${res.modifier}=${res.total})`,
      '记忆判定 · ' + tierTag
    )
    if (eff.notes.includes('trick')) {
      actions.pushMsg('oracle', '千面戏法揭开——命运的面具下，失败让位于一线转机。', '诡计神权')
    }
    if (eff.notes.includes('shield')) {
      actions.pushMsg('oracle', '大地托住了你下沉的记忆。磐岩之护挡下了这次损伤。', '大地神权')
    }
    if (res.memoryCost > 0) {
      actions.pushMsg('tide', '记忆如沙般从指缝漏走，记忆值 -1。', '记忆受损')
      actions.log('check', `记忆判定失败(${res.total})，记忆 -1`)
    } else {
      actions.log('check', `记忆判定${tierTag}(${res.total})`)
    }
    actions.afterAction()
    return res
  },

  /* ---------- 轮回的馈赠：碎片重掷 ---------- */
  rerollCheck() {
    const ch = G.save.character
    const pending = G.save.rerollable
    if (!ch || !pending) return null
    const free = E.isRerollFree(ch)
    const pay = E.payForReroll(ch, free)
    if (!pay) {
      actions.toast('没有可用的记忆碎片')
      return null
    }
    G.save.character = pay.character
    if (free) {
      actions.pushMsg('oracle', '时之回溯发动——你免费借来一次"昨日的掷骰"。', '岁月神权')
    } else {
      actions.pushMsg('system', '你将一枚记忆碎片按回胸口，换取改写刚刚那一掷的机会。', '轮回的馈赠')
    }
    const prev = G.save.lastCheck
    let res = E.performCheck(G.save.character, pending.attrId, pending.extra, Math.random)
    const eff = E.applyCharacterEffects(G.save.character, res)
    res = eff.check
    G.save.character = eff.character
    G.ui.dice = res.dice
    G.save.character = E.applyCheckResult(G.save.character, res)
    G.save.lastCheck = res
    G.save.rerollable =
      res.tier === 'fail' && (G.save.character.fragments || []).length > 0
        ? { ...pending }
        : null
    const tierTag =
      res.tier === 'full' ? '完全成功' : res.tier === 'partial' ? '部分成功' : '失败'
    actions.pushMsg(
      res.tier === 'fail' ? 'tide' : 'oracle',
      `重掷——${res.outcome}。(${res.dice.join('+')}+${res.modifier}=${res.total}，先前 ${prev.total})`,
      '重掷 · ' + tierTag
    )
    if (res.memoryCost > 0) actions.pushMsg('tide', '记忆 -1。', '记忆受损')
    actions.log('check', `碎片重掷：${prev.total} → ${res.total}（${tierTag}）`)
    actions.afterAction()
    return res
  },

  /* ---------- Oracle ---------- */
  doOracle(question, adjust = 0) {
    const ch = G.save.character
    const res = E.askOracle(ch, adjust, Math.random)
    G.save.lastOracle = res
    G.ui.dice = [res.raw]
    if (question) {
      actions.pushMsg('player', question, '向权杖提问')
    }
    const flagNote = res.answer.flag ? `（${res.answer.flag === 'tide' ? '黑潮已靠近' : res.answer.flag === 'anomaly' ? '权杖记录异常' : res.answer.flag === 'deep' ? '深刻回响' : '旧日影像'}）` : ''
    actions.pushMsg(
      'oracle',
      `回响：${res.answer.text}。${flagNote}`,
      `Oracle · 1d6=${res.raw}${res.adjust ? (res.adjust > 0 ? '+' : '') + res.adjust : ''} → ${res.clamped}`
    )
    // "是，但黑潮已靠近" → 侵蚀+1
    if (res.answer.flag === 'tide') {
      G.save.character = E.applyTide(G.save.character, { totalDelta: 1 })
      actions.pushMsg('tide', '黑潮因这次提问而更近了一步。侵蚀 +1', '黑潮靠近')
    }
    actions.log('oracle', `Oracle：${question || '无题之问'} → ${res.answer.text}`)
    actions.afterAction()
    return res
  },

  /* ---------- 黑潮检定（回合末） ---------- */
  doTideCheck(opts = {}) {
    const ch = G.save.character
    const base = (G.save.scene && G.save.scene.location && G.save.scene.location.tideBase) || 0
    const res = E.tideCheck(ch, base, Math.random, opts)
    // 赛飞儿同行：每轮回一次，可重掷黑潮检定
    if (res.totalDelta > 0 && E.hasPerk(ch, 'tideReroll') && !ch.usedFlags.cipher && !opts.rerolled) {
      G.save.tideRerollable = true
      G.save.lastTide = res
      G.ui.dice = [res.roll]
      actions.pushMsg(
        'tide',
        `黑潮检定 1d6=${res.roll}：黑潮正在靠近。`,
        '赛飞儿可以帮你重掷'
      )
      actions.persist()
      return res
    }
    actions.applyTideResult(res, opts)
    return res
  },

  /* 应用黑潮结果并推送阶段变化 */
  applyTideResult(res, opts = {}) {
    const ch = G.save.character
    G.save.tideRerollable = false
    const before = T.tideStageOf(ch.tide)
    const next = E.applyTide(ch, res)
    G.save.character = next
    G.save.lastTide = res
    G.ui.dice = [res.roll]
    const after = T.tideStageOf(next.tide)
    G.save.tideStage = after.name
    if (res.totalDelta > 0) {
      actions.pushMsg(
        'tide',
        `黑潮检定 1d6=${res.roll}${res.rollBonus ? (res.rollBonus > 0 ? '+' + res.rollBonus : '') : ''}：${res.reason}。侵蚀 +${res.totalDelta}（当前 ${next.tide}/10）`,
        '黑潮侵蚀'
      )
      actions.log('tide', `黑潮侵蚀 +${res.totalDelta}（${res.roll}），当前 ${next.tide}/10`)
    } else {
      actions.pushMsg('system', `黑潮检定 1d6=${res.roll}：${res.reason}。侵蚀不变（${next.tide}/10）`, '黑潮检定')
    }
    if (after.name !== before.name) {
      actions.pushMsg('narrator', after.text, `黑潮阶段 · ${after.name}`)
      actions.log('tide', `黑潮进入【${after.name}】阶段`)
    }
    actions.checkOverflow()
    actions.persist()
  },

  /* 赛飞儿同行：重掷黑潮检定 */
  rerollTide() {
    const ch = G.save.character
    if (!ch || !G.save.tideRerollable) return null
    ch.usedFlags.cipher = true
    actions.pushMsg('player', '"这把不算——换一个骰面。"', '赛飞儿 · 千面盗贼')
    actions.pushMsg('oracle', '赛飞儿指尖一弹，命运的钱币翻到了另一面。', '诡计同伴')
    G.save.character = { ...ch }
    const base = (G.save.scene && G.save.scene.location && G.save.scene.location.tideBase) || 0
    const res = E.tideCheck(G.save.character, base, Math.random, { rerolled: true })
    actions.applyTideResult(res)
    actions.log('tide', `赛飞儿重掷黑潮检定（${res.roll}）`)
    return res
  },

  /* ---------- 回合收尾：按规则书流程（黑潮检定已由 doTideCheck 负责） ---------- */
  afterAction() {
    actions.checkOverflow()
    actions.persist()
  },

  /* ---------- 溢出检查：记忆归零 / 侵蚀满值 → 轮回 ---------- */
  checkOverflow() {
    const ch = G.save.character
    if (!ch) return
    if (ch.tide >= E.RULES.TIDE_MAX) {
      actions.triggerReincarnation('侵蚀达到10，轮回触发')
      return
    }
    if (E.isMemoryLost(ch)) {
      // 天外旅人记忆稳定：免疫一次记忆归零
      if (ch.insight === 'steady') {
        G.save.character.memory = 5
        actions.pushMsg('oracle', '你来自天外，记忆锚定在轮回之外——记忆值稳定在 5。', '记忆稳定')
        return
      }
      // 塔纳托斯神权 / 遐蝶同行：每轮回一次免于迷失
      if (E.hasDeathward(ch)) {
        G.save.character = E.consumeDeathward(ch)
        const who = E.hasPerk(ch, 'deathward') ? '遐蝶轻轻拦住了你的手腕。' : '冥河彼岸的灯为你亮起。'
        actions.pushMsg('oracle', `${who}"你的名字，还不该被河底收藏。"记忆值回到 1。`, '引渡之恩')
        actions.log('check', '死亡保护发动：记忆归零被拦下')
        return
      }
      actions.triggerReincarnation('记忆值归零，迷失')
    }
  },

  /* ---------- 轮回 ---------- */
  triggerReincarnation(reason) {
    const ch = G.save.character
    actions.pushMsg('tide', `${reason}。世界开始倒带——`, '轮回触发')
    const note = actions.buildFragmentNote()
    const { character, fragment } = E.reincarnate(ch, note, Math.random)
    G.save.character = character
    G.save.reincarnation += 1
    G.save.failedTrials = [] // 轮回后泰坦重新愿意注视你
    G.save.tideRerollable = false
    G.save.tideStage = '潮痕'
    G.save.history.push({
      id: 'inc_' + Date.now().toString(36),
      turn: G.save.turn,
      type: 'reincarnation',
      text: `第 ${G.save.reincarnation} 次轮回：${reason}。获得记忆碎片【${fragment.label}】`,
      reincarnation: G.save.reincarnation,
      time: Date.now()
    })
    if (fragment) G.archive.fragments.push(fragment)
    G.archive.totalReincarnations = G.save.reincarnation
    actions.pushMsg('system', `获得记忆碎片【${fragment.label}】：${fragment.note}`, '轮回奖励')
    actions.pushMsg('narrator', '记忆恢复 10/10，侵蚀清零。火种与神谕被完整保留。', '轮回重置')
    // 重新生成起始地点和初始遭遇
    actions.startScene(true)
    actions.persist()
  },

  buildFragmentNote() {
    const h = G.save.history.slice(-6)
    if (!h.length) return ''
    return h.map((x) => x.text).join('；')
  },

  /* ---------- 执念 ---------- */
  markObsessionDone() {
    if (!G.save.character) return
    G.save.character.obsessionDone = true
    actions.pushMsg('oracle', '执念已了。你感到身体正在变得轻盈、透明。', '执念达成')
    actions.log('obsession', `完成执念：${G.save.character.obsession || '(未填写)'}`)
    actions.persist()
  },

  /* ---------- 火种 ---------- */
  gainFlame(n = 1) {
    if (!G.save.character) return
    G.save.character.flame = E.clamp(
      G.save.character.flame + n, 0, E.RULES.FLAME_MAX
    )
    actions.pushMsg('oracle', `火种 +${n}（${G.save.character.flame}/12）`, '黄金之火')
    actions.log('flame', `获得火种 +${n}，当前 ${G.save.character.flame}/12`)
    actions.checkFinalArc()
    actions.persist()
  },

  /* ---------- 场景移动 ---------- */
  travel() {
    actions.pushMsg('player', '动身前往下一个地点。', '移动')
    actions.startScene(false)
    actions.log('travel', `移动至 ${G.save.scene.location.name}`)
    // 每次行动结束后：黑潮检定（移动检定：门径恩泽 +2）
    actions.doTideCheck({ travel: true })
    actions.persist()
  },

  /* ---------- 自由行动入口 ---------- */
  freeAction(text, attrId) {
    if (!text) return
    actions.pushMsg('player', text, '你的行动')
    if (attrId) {
      actions.doCheck(attrId, 0, text.slice(0, 24))
    } else {
      actions.log('action', text)
    }
    // 行动结束 → 黑潮检定
    actions.doTideCheck()
    actions.persist()
  },

  /* ---------- 休整 ---------- */
  rest() {
    const ch = G.save.character
    if (!ch) return
    actions.pushMsg('player', '寻一处安全角落，闭目整理自己的记忆。', '休整')
    const amt = E.restAmount(ch)
    G.save.character.memory = E.clamp(ch.memory + amt, 0, E.RULES.MEMORY_MAX)
    actions.pushMsg('system', `记忆值 +${amt}（${G.save.character.memory}/10）`, amt > 1 ? '安眠之力' : '休整')
    actions.log('rest', `休整：记忆值恢复至 ${G.save.character.memory}/10`)
    actions.doTideCheck()
    actions.persist()
  },

  /* ---------- 追忆（忆质残像 / 海瑟音） ---------- */
  readPast() {
    const ch = G.save.character
    if (!ch) return
    const free = ch.insight === 'past' || E.hasPerk(ch, 'pastFree')
    const kind = ch.insight === 'past' ? '你触碰旧物，往昔倒灌而来。' : E.hasPerk(ch, 'pastFree') ? '海瑟音的笛声替你翻开了此地的旧页。' : '你努力辨认此地残留的旧影。'
    const scene = G.save.scene
    const detail = scene && scene.encounter
      ? `你"看见"了这段空间的过去：${scene.encounter.name}曾在此处发生过什么——${scene.encounter.text}`
      : '你看见一段旧日影像：有人曾在这里驻足很久，最后把什么埋进了土里。'
    actions.pushMsg('player', '读取场景中的过去影像。', '追忆')
    actions.pushMsg('oracle', `${kind}${detail}`, '追忆残像')
    actions.log('past', `追忆${scene && scene.location ? '·' + scene.location.name : ''}`)
    // 残像技能：免费（不触发黑潮检定）；其他身份则触发
    if (!free) actions.doTideCheck()
    actions.persist()
  },

  /* ---------- 随机词（灵感炉） ---------- */
  drawWords() {
    const w = E.makeWords(Math.random)
    G.save.scene.words = w
    const combo = `${w.action}+${w.theme}`
    const example = T.WORD_EXAMPLES[combo]
    actions.pushMsg(
      'oracle',
      `动作词【${w.action}】× 主题词【${w.theme}】${example ? ' —— ' + example : ''}`,
      '灵感炉'
    )
    actions.log('words', `灵感词：${combo}`)
    actions.persist()
    return w
  },

  /* ---------- 结束游戏 ---------- */
  finish(manual = true) {
    if (!G.save.character) return null
    let ending
    if (manual) {
      // 玩家主动收束：直接"如我所书"
      ending = { ...T.ENDINGS.aswritten, dice: null, total: null, tier: 'aswritten', manual: true }
    } else {
      ending = E.makeEnding(G.save.character, Math.random)
    }
    ending.titanFlavor = E.titanFlavorLine(G.save.character)
    ending.companions = (G.save.character.companions || []).map((id) => {
      const h = T.HEIRS.find((x) => x.id === id)
      return h ? h.name : id
    })
    ending.reincarnation = G.save.reincarnation
    ending.character = {
      name: G.save.character.name,
      identityName: G.save.character.identityName,
      obsession: G.save.character.obsession,
      flame: G.save.character.flame,
      oracle: G.save.character.oracle
    }
    ending.historyCount = G.save.history.length
    ending.time = Date.now()
    G.save.finished = ending

    // 写入档案
    G.archive.endings.push(ending)
    G.archive.logbook = G.archive.logbook
      .concat(G.save.history.map((h) => ({ ...h })))
      .slice(-400)
    G.archive.totalReincarnations = Math.max(G.archive.totalReincarnations, G.save.reincarnation)
    actions.persist()
    return ending
  },

  /* ---------- 清档 ---------- */
  hardReset() {
    G.save = emptySave()
    storageSet(SAVE_KEY, G.save)
  },
  resetAll() {
    G.save = emptySave()
    G.archive = emptyArchive()
    storageSet(SAVE_KEY, G.save)
    storageSet(ARCHIVE_KEY, G.archive)
  },

  /* ---------- UI ---------- */
  toast(text, ms = 1800) {
    G.ui.toast = { text, id: Date.now() }
    setTimeout(() => {
      if (G.ui.toast && G.ui.toast.id) G.ui.toast = null
    }, ms)
  },
  openModal(name) { G.ui.modal = name },
  closeModal() { G.ui.modal = null }
}

/* ===================== 迁移入口（App.vue onLaunch 调用） ===================== */
export function migrate() {
  actions.migrate()
}
export function loadGame() {
  actions.migrate()
}
export function saveGame() {
  actions.persist()
}