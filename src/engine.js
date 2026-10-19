/**
 * 翁法罗斯跑团规则引擎 —— 纯逻辑，Node 可测。
 *
 * 实现规则书全部核心机制：
 *  - 记忆判定 (2d6+修正, 2-6/7-9/10+)
 *  - 黑潮侵蚀 (行动后1d6, 1-2+1; >=5 自动+1; =10 触发轮回)
 *  - 轮回 (记忆/侵蚀重置, 保留火种与神谕, 获记忆碎片, 重置场景)
 *  - Oracle (1d6 + 可能性调整)
 *  - 结局 (2d6, 四档)
 *
 * 所有副作用（骰子源）通过 rng 注入，便于测试与"命运锚点"重掷。
 */

import {
  memoryCheck, oracleRoll, endingRoll, rollDie, roll, pick, pickMany
} from './dice.js'

// 重新导出底层骰子函数，方便页面与测试统一入口
export { memoryCheck, oracleRoll, endingRoll, rollDie, roll, pick, pickMany }
import {
  IDENTITIES, PATHS, ORACLES, LOCATIONS, ENCOUNTERS, ORACLE_ANSWERS,
  ENDINGS, WORD_ACTIONS, WORD_THEMES, SUGGESTIONS, FRAGMENT_LABELS,
  TITAN_FLAMES, HEIRS, TIDE_STAGES
} from './tables.js'

/* ===================== 常量（规则书硬数值） ===================== */
export const RULES = {
  MEMORY_MAX: 10,
  MEMORY_MIN: 0,
  FLAME_MAX: 12,
  TIDE_MAX: 10,
  TIDE_AUTO_FROM: 5,     // 侵蚀 >= 5，每次行动后自动 +1
  ORACLE_ADJUST_RANGE: [-3, 3],
  CHECK_TIERS: { fail: [2, 6], partial: [7, 9], full: [10, 99] },
  DEFAULT_ATTR_BONUS: 2   // 初始任选两项 +1
}

/* ===================== 角色创建 ===================== */

/** 新建角色（规则书 · 角色卡） */
export function createCharacter({
  name = '无名者',
  identityId = IDENTITIES[0].id,
  pathId = 'remembrance',
  attrs = ['investigate', 'combat'],
  obsession = '',
  rng = Math.random
} = {}) {
  const identity = IDENTITIES.find((x) => x.id === identityId) || IDENTITIES[0]
  const path = PATHS.find((x) => x.id === pathId) || PATHS[0]
  const oracle = rollOracleForStart(identity, rng)

  return {
    name,
    identityId: identity.id,
    identityName: identity.name,
    pathId: path.id,
    pathName: path.name,
    // 属性修正：选中项 +1
    attrs: {
      investigate: attrs.includes('investigate') ? 1 : 0,
      combat: attrs.includes('combat') ? 1 : 0,
      social: attrs.includes('social') ? 1 : 0
    },
    memory: RULES.MEMORY_MAX,
    flame: identity.bonus && identity.bonus.flame ? identity.bonus.flame : 0,
    tide: 0,
    obsession: obsession || '',
    oracle: oracle.text,
    oracleRoll: oracle.roll,
    insight: identity.insight,      // 身份洞察（神谕感知/记忆稳定/读取过去/感知黑潮）
    fragments: [],                  // 记忆碎片
    titans: [],                     // 已收集的泰坦火种 id（扩展：十二泰坦）
    companions: [],                 // 同行黄金裔 id（扩展：黄金裔同行者）
    usedFlags: {},                  // 每轮回一次性恩泽的消耗标记
    rounds: 0,                      // 本轮已进行的行动数
    createdAt: Date.now()
  }
}

/* ===================== 神权恩泽 / 同伴加成（扩展） ===================== */

/** 是否持有某泰坦神权恩泽 */
export function hasBoon(character, boonId) {
  if (!character) return false
  return (character.titans || []).some((tid) => {
    const t = TITAN_FLAMES.find((x) => x.id === tid)
    return t && t.boonId === boonId
  })
}

/** 是否有某同伴加成 */
export function hasPerk(character, perkId) {
  if (!character) return false
  return (character.companions || []).some((hid) => {
    const h = HEIRS.find((x) => x.id === hid)
    return h && h.perkId === perkId
  })
}

/** 黑潮临界阈值（负世之躯 5→6） */
export function tideAutoThreshold(character) {
  return hasBoon(character, 'tideThreshold') ? RULES.TIDE_AUTO_FROM + 1 : RULES.TIDE_AUTO_FROM
}

/** 休整恢复量（冥河之息 / 风堇 +1） */
export function restAmount(character) {
  let n = 1
  if (hasBoon(character, 'restPlus')) n += 1
  if (hasPerk(character, 'restPlus')) n += 1
  return n
}

/** 开局神谕：掷1d6从表抽取（可用 identity 加成扩展表） */
export function rollOracleForStart(identity, rng = Math.random) {
  const insightBonus = identity && identity.insight === 'oracle' ? 1 : 0
  const r = rollDie(1, 6, rng)
  const table = ORACLES
  // 神谕感知：从更大的神谕池（10条）中抽取更"深"的预言
  const max = insightBonus ? table.length : 6
  const idx = Math.min(r, max) - 1
  return { roll: r, text: table[idx].text }
}

/* ===================== 记忆判定 ===================== */

/** 属性修正 + 外部加成 + 同伴加成（浪漫泰坦/阿格莱雅 +交涉，纷争泰坦/万敌 +战斗，那刻夏 +调查） */
export function getModifier(character, attrId, extra = 0) {
  const base = (character.attrs && character.attrs[attrId]) || 0
  let perk = 0
  if (attrId === 'social' && (hasBoon(character, 'socialPlus') || hasPerk(character, 'socialPlus'))) perk += 1
  if (attrId === 'combat' && (hasBoon(character, 'combatPlus') || hasPerk(character, 'combatPlus'))) perk += 1
  if (attrId === 'investigate' && hasPerk(character, 'investigatePlus')) perk += 1
  return base + perk + extra
}

/** 执行一次记忆判定，返回结果对象（含叙事落点） */
export function performCheck(character, attrId, extra = 0, rng = Math.random) {
  const modifier = getModifier(character, attrId, extra)
  const res = memoryCheck(modifier, rng)
  let memoryCost = 0
  let outcome
  if (res.tier === 'fail') {
    outcome = '失败，且记忆受损'
    memoryCost = 1
  } else if (res.tier === 'partial') {
    outcome = '部分成功，达成目标但付出代价'
  } else {
    outcome = '完全成功，获得额外收益'
  }
  return { ...res, outcome, memoryCost, attrId }
}

/**
 * 应用角色层面的失败保护恩泽（千面戏法 / 磐岩之护）。
 * 返回 { check, character, notes: [] }，character 的 usedFlags 可能被消耗。
 */
export function applyCharacterEffects(character, check) {
  const c = deepClone(character)
  const notes = []
  if (check.tier === 'fail') {
    // 千面戏法：每轮回一次，失败改判为部分成功（并免除记忆受损）
    if (hasBoon(c, 'trickOnce') && !c.usedFlags.zagreus) {
      c.usedFlags.zagreus = true
      check = {
        ...check,
        tier: 'partial',
        memoryCost: 0,
        outcome: '千面戏法发动：失败被改写为部分成功'
      }
      notes.push('trick')
    }
    // 磐岩之护：每轮回首次判定失败，记忆不再受损
    if (check.memoryCost > 0 && hasBoon(c, 'memShield') && !c.usedFlags.georios) {
      c.usedFlags.georios = true
      check = { ...check, memoryCost: 0 }
      notes.push('shield')
    }
  }
  return { check, character: c, notes }
}

/** 碎片重掷是否免费（时之回溯：每轮回一次免费） */
export function isRerollFree(character) {
  return hasBoon(character, 'freeReroll') && !character.usedFlags.oronyx
}

/** 消耗重掷优惠（免费或碎片），返回新的角色副本 */
export function payForReroll(character, free) {
  const c = deepClone(character)
  if (free) {
    c.usedFlags.oronyx = true
    return { character: c, spentFragment: false }
  }
  if (!c.fragments || c.fragments.length === 0) return null
  c.fragments.pop()
  return { character: c, spentFragment: true }
}

/** 将判定结果应用到角色（扣记忆、可能的火种/侵蚀副作用） */
export function applyCheckResult(character, check) {
  const c = deepClone(character)
  c.memory = clamp(c.memory - check.memoryCost, RULES.MEMORY_MIN, RULES.MEMORY_MAX)
  if (check.tier === 'full') {
    // 完全成功：有机会发现火种线索（不直接+火种，由场景逻辑决定）
    c.lastBonus = true
  } else {
    c.lastBonus = false
  }
  c.rounds += 1
  return c
}

/* ===================== Oracle ===================== */

/** Oracle 询问：1d6 + 可能性调整（思辨圣殿/缇宝同行 各+1） */
export function askOracle(character, adjust = 0, rng = Math.random) {
  let bonus = character && character.insight === 'oracle' ? 1 : 0
  if (hasBoon(character, 'oraclePlus')) bonus += 1
  if (hasPerk(character, 'oraclePlus')) bonus += 1
  const adj = clamp(
    adjust + bonus,
    RULES.ORACLE_ADJUST_RANGE[0],
    RULES.ORACLE_ADJUST_RANGE[1]
  )
  const { raw, clamped } = oracleRoll(adj, rng)
  const answer = ORACLE_ANSWERS[clamped - 1]
  return { raw, adjust: adj, clamped, answer }
}

/* ===================== 黑潮侵蚀 ===================== */

/**
 * 黑潮检定（规则书 · 每次行动结束后掷1d6）
 * opts.travel: 移动后的检定（门径恩泽 +2 修正）
 * 返回 { roll, effectiveRoll, base, delta, auto, triggered }
 */
export function tideCheck(character, locationTideBase = 0, rng = Math.random, opts = {}) {
  const c = character
  let r = rollDie(1, 6, rng)
  const rawRoll = r
  // 长风借翼：所有黑潮检定 +1；万径通途：移动后 +2
  let rollBonus = 0
  if (hasBoon(c, 'tideRollPlus')) rollBonus += 1
  if (opts.travel && hasBoon(c, 'travelTide')) rollBonus += 2
  r = Math.min(6, r + rollBonus)

  let delta = 0
  let reason = ''

  const autoThreshold = tideAutoThreshold(c)
  const willAuto = c.tide >= autoThreshold

  if (r <= 2) {
    delta = 1
    reason = '黑潮靠近'
  } else {
    reason = '无事发生'
  }

  // 身份"黑潮之子"：可感知，基础侵蚀略缓
  if (c.insight === 'tide' && delta > 0 && r === 1) {
    delta = 0
    reason = '你感知到黑潮并提前避开了它'
  }

  // 侵蚀已达阈值：每次行动后自动 +1（叠加在掷骰结果之上）
  let auto = 0
  if (willAuto) {
    auto = 1
    reason += '；侵蚀已过临界，自动+1'
  }

  // 地点基础偏移（扩展：黑潮活跃区）
  const locDelta = locationTideBase || 0

  const totalDelta = delta + auto + locDelta
  return {
    roll: rawRoll,
    effectiveRoll: r,
    rollBonus,
    delta,
    auto,
    locDelta,
    totalDelta,
    triggered: r <= 2,
    reason
  }
}

/** 应用黑潮结果，检查是否触发轮回 */
export function applyTide(character, tideResult) {
  const c = deepClone(character)
  c.tide = clamp(c.tide + tideResult.totalDelta, 0, RULES.TIDE_MAX)
  return c
}

/* ===================== 泰坦试炼（扩展：火种获取的正经玩法） ===================== */

/**
 * 向一位泰坦发起试炼。
 * 判定属性由泰坦决定（白厄同行 +1）：
 *  - 完全成功：获得火种，无代价
 *  - 部分成功：获得火种，但黑潮侵蚀 +1（天秤恩泽可免除）
 *  - 失败：记忆受损，侵蚀 +1，火种不可得（本轮回内不可再试炼同一位）
 * 返回 { check, character, claimed, titan, notes }
 */
export function performTrial(character, titan, rng = Math.random) {
  const c = deepClone(character)
  const extra = hasPerk(c, 'trialSupport') ? 1 : 0
  let check = performCheck(c, titan.trialAttr, extra, rng)

  // 失败保护恩泽（千面戏法 / 磐岩之护）同样适用于试炼
  const eff = applyCharacterEffects(c, check)
  check = eff.check
  let next = eff.character
  const notes = [...eff.notes]

  let claimed = false
  let tideDelta = 0
  let memoryCost = check.memoryCost || 0

  if (check.tier === 'full') {
    claimed = true
  } else if (check.tier === 'partial') {
    claimed = true
    if (!hasBoon(next, 'trialNoTide')) tideDelta = 1
  } else {
    tideDelta = 1
  }

  next.memory = clamp(next.memory - memoryCost, RULES.MEMORY_MIN, RULES.MEMORY_MAX)
  next.tide = clamp(next.tide + tideDelta, 0, RULES.TIDE_MAX)
  next.rounds += 1
  if (claimed && !next.titans.includes(titan.id)) {
    next.titans.push(titan.id)
    next.flame = clamp(next.flame + 1, 0, RULES.FLAME_MAX)
  }
  return { check, character: next, claimed, tideDelta, memoryCost, titan, notes }
}

/* ===================== 轮回（规则书 · 轮回机制） ===================== */

/**
 * 触发轮回：返回新的角色状态 + 轮回事件
 *  - 记忆恢复为 10，侵蚀清零
 *  - 保留火种数量和神谕
 *  - 获得一条记忆碎片（上一轮的关键信息）
 *  - 重新生成起始地点和初始遭遇（由调用方处理场景重置）
 */
export function reincarnate(character, worldNote = '', rng = Math.random) {
  const c = deepClone(character)

  // 提取一条记忆碎片
  const fragment = makeFragment(character, worldNote, rng)
  if (fragment) c.fragments.push(fragment)

  // 重置状态（火种/泰坦/同伴/神谕被完整保留）
  c.memory = RULES.MEMORY_MAX
  c.tide = 0
  c.rounds = 0
  c.usedFlags = {} // 每轮回一次性恩泽重新可用
  c.reincarnation = (c.reincarnation || 0) + 1

  return { character: c, fragment }
}

/** 生成记忆碎片内容 */
export function makeFragment(character, worldNote, rng = Math.random) {
  const label = pick(FRAGMENT_LABELS, rng)
  const note =
    worldNote ||
    `在第${(character.reincarnation || 0) + 1}次轮回中，你于${character.identityName}的身份下，记忆一度跌至 ${character.memory}/10。`
  return {
    id: 'f' + Date.now().toString(36) + Math.floor(rng() * 1e6).toString(36),
    label,
    note,
    flameAt: character.flame,
    time: Date.now()
  }
}

/* ===================== 场景 / 遭遇生成 ===================== */

export function rollLocation(rng = Math.random) {
  return pick(LOCATIONS, rng)
}

export function rollEncounter(rng = Math.random) {
  return pick(ENCOUNTERS, rng)
}

/** 组合出一个完整场景（规则书 · 场景生成） */
export function makeScene(rng = Math.random, location = null) {
  const loc = location || rollLocation(rng)
  const enc = rollEncounter(rng)
  return { location: loc, encounter: enc, time: Date.now() }
}

/** 随机词组合（规则书 · 随机词表） */
export function makeWords(rng = Math.random) {
  return {
    action: pick(WORD_ACTIONS, rng),
    theme: pick(WORD_THEMES, rng)
  }
}

/** 建议行动（取三个） */
export function getSuggestions(rng = Math.random) {
  return pickMany(SUGGESTIONS, 3, rng)
}

/* ===================== 结局生成 ===================== */

/** 死亡/轮回保护是否可用（塔纳托斯恩泽 或 遐蝶同行，每轮回一次） */
export function hasDeathward(character) {
  return (
    (hasBoon(character, 'deathward') || hasPerk(character, 'deathward')) &&
    !character.usedFlags.deathward
  )
}

/** 消耗死亡保护，返回新角色副本 */
export function consumeDeathward(character) {
  const c = deepClone(character)
  c.usedFlags.deathward = true
  c.memory = 1
  return c
}

export function makeEnding(character, rng = Math.random) {
  let { dice, total, tier } = endingRoll(rng)
  // 刻律德菈同行：结局掷骰 +1（律法为你的终局作保）
  let endingBonus = 0
  if (hasPerk(character, 'endingPlus') && total < 12) {
    total += 1
    endingBonus = 1
    dice = [...dice]
    tier = total <= 4 ? 'eternal' : total <= 7 ? 'echo' : total <= 10 ? 'flame' : 'aswritten'
  }
  const ending = ENDINGS[tier]
  return { ...ending, dice, total, endingBonus, tier }
}

/** 根据收集的泰坦火种生成结局定制文本 */
export function titanFlavorLine(character) {
  const ids = character.titans || []
  if (!ids.length) return '你两手空空地走向终点——但这趟旅程本身，已经是你的火种。'
  const domains = ids
    .map((id) => TITAN_FLAMES.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => `「${t.domain}」`)
  return `你携带着${domains.join('')}的火种走向终点，十二神权中已有一部分，永远记得你的名字。`
}

/** 结束条件检查（规则书 · 结束条件） */
export function checkEndConditions(character) {
  const ends = []
  if (character.flame >= RULES.FLAME_MAX) {
    ends.push({ type: 'recreate', text: '集齐12枚火种：触发再创世，生成结局。' })
  }
  if (character.tide >= RULES.TIDE_MAX && (character.fragments || []).length === 0) {
    ends.push({ type: 'lost', text: '侵蚀满值且无记忆碎片：彻底迷失，本轮终结。' })
  }
  if (character.obsession && character.obsessionDone) {
    ends.push({ type: 'obsession', text: '完成执念：角色心愿达成，可安然化为忆质。' })
  }
  return ends
}

/* ===================== 工具 ===================== */

export function deepClone(o) {
  return JSON.parse(JSON.stringify(o))
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/** 记忆值归零保护：返回是否需要强制轮回 */
export function isMemoryLost(character) {
  return character.memory <= RULES.MEMORY_MIN
}