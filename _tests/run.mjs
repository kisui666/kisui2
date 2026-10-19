/**
 * 规则引擎单元测试（纯 Node 运行：node _tests/run.mjs）
 * 覆盖规则书全部核心机制的边界与不变量。
 */
import assert from 'node:assert/strict'
import * as E from '../src/engine.js'
import * as D from '../src/dice.js'
import * as T from '../src/tables.js'

let passed = 0
const failures = []

function test(name, fn) {
  try {
    fn()
    passed++
    console.log('  ✓ ' + name)
  } catch (e) {
    failures.push({ name, msg: e.message })
    console.log('  ✗ ' + name + '\n      ' + e.message)
  }
}

/** 固定序列随机源 */
function seqRng(values) {
  let i = 0
  return () => {
    const v = values[i % values.length]
    i++
    return v
  }
}
const always = (n) => () => n

console.log('\n== 数据表完整性 ==')
test('四身份齐全且含规则书要求的特质', () => {
  assert.equal(T.IDENTITIES.length, 4)
  assert.ok(T.IDENTITIES.every((i) => i.name && i.trait && i.source === 'book'))
})
test('神谕表含规则书6条 + 扩展', () => {
  assert.ok(T.ORACLES.length >= 6)
  const book = T.ORACLES.filter((o) => o.source === 'book')
  assert.equal(book.length, 6)
  assert.equal(book[0].text, '汝将最后一次沐浴，在温热耀眼的黄金中。')
  assert.equal(book[5].text, '汝将收梢于花开时，一如终结诞下起始。')
})
test('起始地点表含规则书8条（1d8）', () => {
  const book = T.LOCATIONS.filter((l) => l.source === 'book')
  assert.equal(book.length, 8)
  assert.deepEqual(book.map((l) => l.roll), [1, 2, 3, 4, 5, 6, 7, 8])
  assert.ok(T.LOCATIONS.every((l) => l.scene && l.prompt && l.vibe))
})
test('遭遇表含规则书8条（1d8）', () => {
  const book = T.ENCOUNTERS.filter((e) => e.source === 'book')
  assert.equal(book.length, 8)
  assert.deepEqual(book.map((e) => e.roll), [1, 2, 3, 4, 5, 6, 7, 8])
})
test('Oracle 1d6 六种回响齐全且顺序正确', () => {
  assert.equal(T.ORACLE_ANSWERS.length, 6)
  assert.equal(T.ORACLE_ANSWERS[0].roll, 1)
  assert.equal(T.ORACLE_ANSWERS[0].text, '否，且权杖记录了一次异常')
  assert.equal(T.ORACLE_ANSWERS[5].text, '是，且留下深刻回响')
  assert.equal(T.ORACLE_ANSWERS[5].tone, 'positive')
})
test('结局四档（2d6）齐全且总和区间正确', () => {
  assert.deepEqual(
    Object.keys(T.ENDINGS),
    ['eternal', 'echo', 'flame', 'aswritten']
  )
  assert.equal(T.ENDINGS.eternal.total, '2-4')
  assert.equal(T.ENDINGS.aswritten.total, '11-12')
})
test('随机词表：动作词与主题词各≥8', () => {
  assert.ok(T.WORD_ACTIONS.length >= 8)
  assert.ok(T.WORD_THEMES.length >= 8)
})
test('规则书硬数值常量正确', () => {
  assert.equal(E.RULES.MEMORY_MAX, 10)
  assert.equal(E.RULES.FLAME_MAX, 12)
  assert.equal(E.RULES.TIDE_MAX, 10)
  assert.equal(E.RULES.TIDE_AUTO_FROM, 5)
})

console.log('\n== 骰子 ==')
test('rollDie 始终在范围内', () => {
  for (let i = 0; i < 500; i++) {
    const v = D.rollDie(1, 6)
    assert.ok(v >= 1 && v <= 6, '越界: ' + v)
  }
})
test('roll(2,6) 合计 2-12', () => {
  for (let i = 0; i < 500; i++) {
    const r = D.roll(2, 6)
    assert.ok(r.total >= 2 && r.total <= 12)
    assert.equal(r.dice.length, 2)
  }
})
test('随机源可注入（确定性）', () => {
  const r = D.roll(2, 6, seqRng([0.0, 0.99]))
  assert.deepEqual(r.dice, [1, 6])
})
test('pickMany 不重复', () => {
  const out = D.pickMany([1, 2, 3, 4, 5], 3)
  assert.equal(out.length, 3)
  assert.equal(new Set(out).size, 3)
})

console.log('\n== 记忆判定（2d6+修正）==')
test('2-6 失败 → 记忆-1', () => {
  const r = E.memoryCheck(0, always(0)) // 1+1=2
  assert.equal(r.total, 2)
  assert.equal(r.tier, 'fail')
})
test('7-9 部分成功', () => {
  const r = E.memoryCheck(0, seqRng([0.4, 0.55])) // 3+4=7
  assert.equal(r.total, 7)
  assert.equal(r.tier, 'partial')
  const r9 = E.memoryCheck(0, seqRng([0.6, 0.75])) // 4+5=9
  assert.equal(r9.total, 9)
  assert.equal(r9.tier, 'partial')
})
test('10+ 完全成功', () => {
  assert.equal(E.memoryCheck(0, always(0.999)).tier, 'full') // 6+6=12
})
test('修正值计入总数', () => {
  const r = E.memoryCheck(1, always(0.999))
  assert.equal(r.total, 13)
  assert.equal(r.modifier, 1)
})
test('performCheck 失败时 memoryCost=1，其他为0', () => {
  const ch = E.createCharacter({ attrs: [], rng: always(0.1) })
  const fail = E.performCheck(ch, 'combat', 0, always(0.0))
  assert.equal(fail.memoryCost, 1)
  const ok = E.performCheck(ch, 'combat', 0, always(0.999))
  assert.equal(ok.memoryCost, 0)
})
test('applyCheckResult 正确扣记忆并钳制在[0,10]', () => {
  const ch = { ...E.createCharacter({ rng: always(0.1) }), memory: 1 }
  const r = E.performCheck(ch, 'combat', 0, always(0.0))
  const next = E.applyCheckResult(ch, r)
  assert.equal(next.memory, 0)
  // 不修改原对象
  assert.equal(ch.memory, 1)
})
test('属性选择：选中项 +1，未选 0', () => {
  const ch = E.createCharacter({ attrs: ['social'], rng: always(0.1) })
  assert.equal(ch.attrs.social, 1)
  assert.equal(ch.attrs.investigate, 0)
  assert.equal(ch.attrs.combat, 0)
  assert.equal(E.getModifier(ch, 'social'), 1)
  assert.equal(E.getModifier(ch, 'combat', 2), 2)
})

console.log('\n== 角色创建 ==')
test('新角色初始状态符合规则书', () => {
  const ch = E.createCharacter({ rng: always(0.3) })
  assert.equal(ch.memory, 10)
  assert.equal(ch.tide, 0)
  assert.ok(ch.flame >= 0 && ch.flame <= 12)
  assert.ok(ch.oracle.length > 5)
  assert.deepEqual(ch.fragments, [])
  assert.equal(ch.rounds, 0)
})
test('黄金裔残影 火种+1', () => {
  const ch = E.createCharacter({ identityId: 'golden', rng: always(0.3) })
  assert.equal(ch.flame, 1)
  assert.equal(ch.insight, 'oracle')
})
test('各身份 insight 正确映射', () => {
  assert.equal(E.createCharacter({ identityId: 'traveler', rng: always(0) }).insight, 'steady')
  assert.equal(E.createCharacter({ identityId: 'echo', rng: always(0) }).insight, 'past')
  assert.equal(E.createCharacter({ identityId: 'tideborn', rng: always(0) }).insight, 'tide')
})
test('开局神谕取自规则书表', () => {
  const all = new Set(T.ORACLES.map((o) => o.text))
  for (let i = 0; i < 30; i++) {
    const o = E.rollOracleForStart({ insight: null }, always(i / 30))
    assert.ok(all.has(o.text))
  }
})

console.log('\n== Oracle 回响 ==')
test('1d6 回响与表一致', () => {
  const ch = E.createCharacter({ identityId: 'traveler', rng: always(0) })
  const r = E.askOracle(ch, 0, always(0.0)) // raw=1
  assert.equal(r.raw, 1)
  assert.equal(r.answer.text, '否，且权杖记录了一次异常')
  const r6 = E.askOracle(ch, 0, always(0.999)) // raw=6
  assert.equal(r6.answer.tone, 'positive')
})
test('可能性调整生效且钳制[1,6]', () => {
  const ch = E.createCharacter({ rng: always(0) })
  assert.equal(E.askOracle(ch, -3, always(0.0)).clamped, 1)
  assert.equal(E.askOracle(ch, 3, always(0.999)).clamped, 6)
})
test('黄金裔"神谕感知"自带+1', () => {
  const ch = E.createCharacter({ identityId: 'golden', rng: always(0) })
  const r = E.askOracle(ch, 0, always(0.0))
  assert.equal(r.adjust, 1)
  assert.equal(r.clamped, 2)
})

console.log('\n== 黑潮侵蚀 ==')
test('1-2 侵蚀+1，3-6 不变', () => {
  const ch = E.createCharacter({ rng: always(0) })
  const t1 = E.tideCheck(ch, 0, always(0.0)) // 1
  assert.equal(t1.delta, 1)
  const t3 = E.tideCheck(ch, 0, always(0.4)) // ~3
  assert.equal(t3.totalDelta, 0)
})
test('侵蚀≥5 每次行动自动+1（叠加）', () => {
  const ch = { ...E.createCharacter({ rng: always(0) }), tide: 5 }
  const t = E.tideCheck(ch, 0, always(0.9)) // 6 + auto
  assert.equal(t.auto, 1)
  assert.equal(t.totalDelta, 1)
})
test('黑潮之子可规避极端黑潮(r=1)', () => {
  const ch = E.createCharacter({ identityId: 'tideborn', rng: always(0) })
  const t = E.tideCheck(ch, 0, always(0.0))
  assert.equal(t.totalDelta, 0)
})
test('地点 tideBase 叠加', () => {
  const ch = E.createCharacter({ rng: always(0) })
  const t = E.tideCheck(ch, 2, always(0.9)) // 6 -> 0 + loc 2
  assert.equal(t.totalDelta, 2)
})
test('applyTide 钳制在[0,10]', () => {
  const ch = { ...E.createCharacter({ rng: always(0) }), tide: 9 }
  const next = E.applyTide(ch, { totalDelta: 5 })
  assert.equal(next.tide, 10)
})

console.log('\n== 轮回机制 ==')
test('轮回：记忆恢复10、侵蚀清零、保留火种与神谕', () => {
  const ch = {
    ...E.createCharacter({ rng: always(0.2) }),
    memory: 3,
    tide: 10,
    flame: 7
  }
  const oracle = ch.oracle
  const { character: c2, fragment } = E.reincarnate(ch, '测试碎片', always(0.4))
  assert.equal(c2.memory, 10)
  assert.equal(c2.tide, 0)
  assert.equal(c2.flame, 7, '火种必须保留')
  assert.equal(c2.oracle, oracle, '神谕必须保留')
  assert.equal(c2.fragments.length, 1)
  assert.ok(fragment.label && fragment.note)
  assert.equal(c2.reincarnation, 1)
})
test('轮回多次碎片累积', () => {
  let ch = E.createCharacter({ rng: always(0.1) })
  ch = E.reincarnate(ch, 'n1', always(0.1)).character
  ch = E.reincarnate(ch, 'n2', always(0.2)).character
  ch = E.reincarnate(ch, 'n3', always(0.3)).character
  assert.equal(ch.fragments.length, 3)
  assert.equal(ch.reincarnation, 3)
})
test('isMemoryLost 边界', () => {
  const ch = E.createCharacter({ rng: always(0) })
  assert.equal(E.isMemoryLost(ch), false)
  ch.memory = 0
  assert.equal(E.isMemoryLost(ch), true)
})

console.log('\n== 场景 / 遭遇 / 词表 ==')
test('makeScene 返回地点+遭遇', () => {
  const s = E.makeScene(always(0.5))
  assert.ok(s.location && s.location.name)
  assert.ok(s.encounter && s.encounter.name && s.encounter.action)
})
test('makeWords 返回动作词+主题词', () => {
  const w = E.makeWords(always(0.1))
  assert.ok(T.WORD_ACTIONS.includes(w.action))
  assert.ok(T.WORD_THEMES.includes(w.theme))
})
test('getSuggestions 恰好三个且不重复', () => {
  const s = E.getSuggestions(always(0.3))
  assert.equal(s.length, 3)
  assert.equal(new Set(s.map((x) => x.text)).size, 3)
})
test('地点 1-10 都能被抽到（概率健全）', () => {
  const seen = new Set()
  for (let i = 0; i < 600; i++) seen.add(E.rollLocation().roll)
  assert.equal(seen.size, T.LOCATIONS.length)
})
test('遭遇 1-12 都能被抽到（概率健全）', () => {
  const seen = new Set()
  for (let i = 0; i < 900; i++) seen.add(E.rollEncounter().roll)
  assert.equal(seen.size, T.ENCOUNTERS.length)
})

console.log('\n== 结局与结束条件 ==')
test('2d6 结局档位边界', () => {
  assert.equal(E.endingRoll(seqRng([0, 0])).tier, 'eternal')       // 1+1=2
  assert.equal(E.endingRoll(seqRng([0.4, 0.4])).tier, 'echo')      // ~5
  assert.equal(E.endingRoll(seqRng([0.8, 0.8])).tier, 'flame')     // ~10
  assert.equal(E.endingRoll(seqRng([0.999, 0.999])).tier, 'aswritten') // 6+6=12
})
test('makeEnding 返回完整结局对象', () => {
  const ch = E.createCharacter({ rng: always(0) })
  const e = E.makeEnding(ch, always(0.999))
  assert.equal(e.tier, 'aswritten')
  assert.equal(e.name, '如我所书')
  assert.ok(e.text && e.detail)
  assert.deepEqual(e.dice, [6, 6])
})
test('结束条件：12火种 / 满侵蚀无碎片 / 执念完成', () => {
  const ch = E.createCharacter({ rng: always(0) })
  ch.flame = 12
  assert.equal(E.checkEndConditions(ch)[0].type, 'recreate')
  ch.flame = 0
  ch.tide = 10
  assert.equal(E.checkEndConditions(ch)[0].type, 'lost')
  ch.fragments = [{ id: 'x' }]
  assert.equal(E.checkEndConditions(ch).length, 0)
  ch.obsession = '找回她'
  ch.obsessionDone = true
  ch.tide = 0
  assert.equal(E.checkEndConditions(ch)[0].type, 'obsession')
})

console.log('\n== 工具 ==')
test('clamp 正确', () => {
  assert.equal(E.clamp(15, 0, 10), 10)
  assert.equal(E.clamp(-2, 0, 10), 0)
  assert.equal(E.clamp(5, 0, 10), 5)
})
test('deepClone 深拷贝不共享引用', () => {
  const a = { f: [{ id: 1 }] }
  const b = E.deepClone(a)
  b.f.push({ id: 2 })
  assert.equal(a.f.length, 1)
})

console.log('\n== 扩展：十二泰坦 / 黄金裔 / 黑潮阶段 ==')
test('泰坦表 12 位，id 与神权恩泽唯一且文案齐全', () => {
  assert.equal(T.TITAN_FLAMES.length, 12)
  assert.equal(new Set(T.TITAN_FLAMES.map((t) => t.id)).size, 12)
  assert.equal(new Set(T.TITAN_FLAMES.map((t) => t.boonId)).size, 12)
  assert.ok(
    T.TITAN_FLAMES.every(
      (t) =>
        t.trialText && t.trialAsk && t.claimText && t.boonText &&
        ['investigate', 'combat', 'social'].includes(t.trialAttr)
    )
  )
})
test('黄金裔表 10 位，文案与加成齐全', () => {
  assert.equal(T.HEIRS.length, 10)
  assert.ok(T.HEIRS.every((h) => h.meetText && h.joinLine && h.perkText && h.title))
})
test('黑潮阶段边界：0-3潮痕 / 4-6潮涌 / 7-9潮噬 / 10潮渊', () => {
  assert.equal(T.tideStageOf(0).name, '潮痕')
  assert.equal(T.tideStageOf(3).name, '潮痕')
  assert.equal(T.tideStageOf(4).name, '潮涌')
  assert.equal(T.tideStageOf(6).name, '潮涌')
  assert.equal(T.tideStageOf(7).name, '潮噬')
  assert.equal(T.tideStageOf(9).name, '潮噬')
  assert.equal(T.tideStageOf(10).name, '潮渊')
})
test('hasBoon/hasPerk 识别神权与同伴', () => {
  const ch = E.createCharacter({ attrs: [], rng: always(0) })
  assert.equal(E.hasBoon(ch, 'combatPlus'), false)
  assert.equal(E.hasPerk(ch, 'combatPlus'), false)
  ch.titans.push('nikador')
  assert.equal(E.hasBoon(ch, 'combatPlus'), true)
  ch.companions.push('mydei')
  assert.equal(E.hasPerk(ch, 'combatPlus'), true)
})
test('同伴加成进入判定修正：万敌/阿格莱雅/那刻夏', () => {
  const ch = E.createCharacter({ attrs: [], rng: always(0) })
  assert.equal(E.getModifier(ch, 'combat'), 0)
  ch.companions.push('mydei')
  assert.equal(E.getModifier(ch, 'combat'), 1)
  ch.companions.push('aglaea')
  assert.equal(E.getModifier(ch, 'social'), 1)
  ch.companions.push('anaxa')
  assert.equal(E.getModifier(ch, 'investigate'), 1)
})
test('泰坦试炼：完全成功得火种，无代价', () => {
  const ch = E.createCharacter({ attrs: ['combat'], rng: always(0) })
  const baseFlame = ch.flame
  const titan = T.TITAN_FLAMES.find((t) => t.id === 'nikador')
  const res = E.performTrial(ch, titan, seqRng([0.999, 0.999])) // 6+6+1=13 full
  assert.equal(res.check.tier, 'full')
  assert.equal(res.claimed, true)
  assert.equal(res.tideDelta, 0)
  assert.equal(res.memoryCost, 0)
  assert.ok(res.character.titans.includes('nikador'))
  assert.equal(res.character.flame, baseFlame + 1)
  assert.equal(res.character.memory, 10)
  assert.equal(res.character.tide, 0)
})
test('泰坦试炼：部分成功得火种但侵蚀+1；天秤恩泽可免除', () => {
  const ch = E.createCharacter({ attrs: ['combat'], rng: always(0) })
  const titan = T.TITAN_FLAMES.find((t) => t.id === 'nikador')
  const res = E.performTrial(ch, titan, seqRng([0.5, 0.5])) // 4+4+1=9 partial
  assert.equal(res.check.tier, 'partial')
  assert.equal(res.claimed, true)
  assert.equal(res.tideDelta, 1)
  assert.equal(res.character.tide, 1)
  const ch2 = E.createCharacter({ attrs: ['combat'], rng: always(0) })
  ch2.titans.push('talanton') // 律法神权
  const res2 = E.performTrial(ch2, titan, seqRng([0.5, 0.5]))
  assert.equal(res2.claimed, true)
  assert.equal(res2.tideDelta, 0)
  assert.equal(res2.character.tide, 0)
})
test('泰坦试炼：失败记忆受损、侵蚀+1、不得火种', () => {
  const ch = E.createCharacter({ attrs: ['combat'], rng: always(0) })
  const titan = T.TITAN_FLAMES.find((t) => t.id === 'nikador')
  const res = E.performTrial(ch, titan, seqRng([0, 0])) // 1+1+1=3 fail
  assert.equal(res.check.tier, 'fail')
  assert.equal(res.claimed, false)
  assert.equal(res.tideDelta, 1)
  assert.equal(res.memoryCost, 1)
  assert.equal(res.character.memory, 9)
  assert.equal(res.character.tide, 1)
  assert.equal(res.character.titans.length, 0)
})
test('千面戏法：失败自动改判部分成功并免除记忆损失（每轮回一次）', () => {
  const ch = E.createCharacter({ attrs: ['combat'], rng: always(0) })
  ch.titans.push('zagreus')
  const titan = T.TITAN_FLAMES.find((t) => t.id === 'nikador')
  const res = E.performTrial(ch, titan, seqRng([0, 0]))
  assert.equal(res.check.tier, 'partial')
  assert.equal(res.notes.includes('trick'), true)
  assert.equal(res.memoryCost, 0)
  assert.equal(res.character.usedFlags.zagreus, true)
  assert.equal(res.character.memory, 10)
  // 第二次失败不再改判
  const titan2 = T.TITAN_FLAMES.find((t) => t.id === 'kephale')
  const res2 = E.performTrial(res.character, titan2, seqRng([0, 0]))
  assert.equal(res2.check.tier, 'fail')
  assert.equal(res2.claimed, false)
  assert.equal(res2.memoryCost, 1)
})
test('磐岩之护：每轮回首次判定失败记忆不再受损', () => {
  const ch = E.createCharacter({ attrs: [], rng: always(0) })
  ch.titans.push('georios')
  const res = E.performCheck(ch, 'investigate', 0, seqRng([0, 0]))
  const eff = E.applyCharacterEffects(ch, res)
  assert.equal(eff.check.memoryCost, 0)
  assert.equal(eff.notes.includes('shield'), true)
  assert.equal(eff.character.usedFlags.georios, true)
  const res2 = E.performCheck(eff.character, 'investigate', 0, seqRng([0, 0]))
  const eff2 = E.applyCharacterEffects(eff.character, res2)
  assert.equal(eff2.check.memoryCost, 1)
})
test('时之回溯：每轮回一次免费碎片重掷', () => {
  const ch = E.createCharacter({ rng: always(0) })
  ch.fragments.push({ id: 'f1', label: '关键抉择', note: 'n' })
  assert.equal(E.isRerollFree(ch), false)
  ch.titans.push('oronyx')
  assert.equal(E.isRerollFree(ch), true)
  const p1 = E.payForReroll(ch, true)
  assert.equal(p1.spentFragment, false)
  assert.equal(p1.character.usedFlags.oronyx, true)
  assert.equal(E.isRerollFree(p1.character), false)
  const p2 = E.payForReroll(p1.character, false)
  assert.equal(p2.spentFragment, true)
  assert.equal(p2.character.fragments.length, 0)
  assert.equal(E.payForReroll(p2.character, false), null)
})
test('引渡之恩/遐蝶：记忆归零免迷失，每轮回一次', () => {
  const ch = E.createCharacter({ rng: always(0) })
  ch.memory = 0
  assert.equal(E.hasDeathward(ch), false)
  ch.titans.push('thanatos')
  assert.equal(E.hasDeathward(ch), true)
  const c2 = E.consumeDeathward(ch)
  assert.equal(c2.memory, 1)
  assert.equal(c2.usedFlags.deathward, true)
  assert.equal(E.hasDeathward(c2), false)
  const ch3 = E.createCharacter({ rng: always(0) })
  ch3.companions.push('castorice')
  assert.equal(E.hasDeathward(ch3), true)
})
test('长风借翼：黑潮检定+1；万径通途：移动检定再+2', () => {
  const ch = E.createCharacter({ rng: always(0) })
  ch.titans.push('aquila')
  const r1 = E.tideCheck(ch, 0, always(0)) // raw 1 → 1+1=2 触发
  assert.equal(r1.roll, 1)
  assert.equal(r1.rollBonus, 1)
  assert.equal(r1.effectiveRoll, 2)
  ch.titans.push('janus')
  const r2 = E.tideCheck(ch, 0, always(0), { travel: true }) // 1+1+2=4 不触发
  assert.equal(r2.effectiveRoll, 4)
  assert.equal(r2.triggered, false)
})
test('负世之躯：黑潮临界阈值 5→6', () => {
  const chA = E.createCharacter({ rng: always(0) })
  chA.tide = 5
  assert.equal(E.tideAutoThreshold(chA), 5)
  assert.equal(E.tideCheck(chA, 0, always(0.999)).auto, 1)
  chA.titans.push('kephale')
  assert.equal(E.tideAutoThreshold(chA), 6)
  assert.equal(E.tideCheck(chA, 0, always(0.999)).auto, 0)
})
test('休整加成：冥河之息与风堇叠加', () => {
  const ch = E.createCharacter({ rng: always(0) })
  assert.equal(E.restAmount(ch), 1)
  ch.titans.push('phagousa')
  assert.equal(E.restAmount(ch), 2)
  ch.companions.push('hyacine')
  assert.equal(E.restAmount(ch), 3)
})
test('思辨圣殿/缇宝：Oracle 调整+1（可叠加，含身份基础）', () => {
  const ch = E.createCharacter({ rng: always(0) })
  const r1 = E.askOracle(ch, 0, always(0.999))
  const baseAdj = r1.adjust // 含身份洞察加成（always(0) 抽到的身份）
  ch.titans.push('cerces')
  ch.companions.push('tribbie')
  const r2 = E.askOracle(ch, 0, always(0.999))
  assert.equal(r2.adjust, Math.min(3, baseAdj + 2))
  assert.equal(r2.clamped, 6)
  assert.ok(r2.adjust > baseAdj)
})
test('刻律德菈：结局掷骰+1升档', () => {
  const base = E.endingRoll(seqRng([0.33, 0.83]))
  assert.equal(base.total, 7)
  assert.equal(base.tier, 'echo')
  const ch = E.createCharacter({ rng: always(0) })
  ch.companions.push('cerydra')
  const e = E.makeEnding(ch, seqRng([0.33, 0.83]))
  assert.equal(e.endingBonus, 1)
  assert.equal(e.total, 8)
  assert.equal(e.tier, 'flame')
})
test('结局定制文本：根据携带泰坦生成', () => {
  const ch = E.createCharacter({ rng: always(0) })
  assert.ok(E.titanFlavorLine(ch).includes('两手空空'))
  ch.titans.push('kephale', 'thanatos')
  const line = E.titanFlavorLine(ch)
  assert.ok(line.includes('「负世」') && line.includes('「死亡」'))
})
test('轮回重置：恩泽消耗标记清空，火种与同伴保留', () => {
  let ch = E.createCharacter({ rng: always(0) })
  ch.titans.push('zagreus', 'kephale')
  ch.companions.push('mydei')
  ch.usedFlags.zagreus = true
  ch.usedFlags.georios = true
  ch.tide = 9
  ch.memory = 2
  ch = E.reincarnate(ch, 'note', always(0.1)).character
  assert.deepEqual(ch.usedFlags, {})
  assert.equal(ch.titans.length, 2)
  assert.equal(ch.companions.length, 1)
  assert.equal(ch.tide, 0)
  assert.equal(ch.memory, 10)
  assert.equal(ch.fragments.length, 1)
})

console.log('\n== 扩展：store 会话流（结伴 / 重掷 / 终幕 / 阶段） ==')
const { G, actions } = await import('../src/store.js')

test('store：黄金裔邂逅可结伴，同伴入栏', () => {
  actions.newGame({ name: '测试者', identityIdx: 0, obsession: '找回黎明' })
  G.save.scene.heirMeet = T.HEIRS.find((h) => h.id === 'phainon')
  const heir = actions.inviteHeir()
  assert.equal(heir.id, 'phainon')
  assert.ok(G.save.character.companions.includes('phainon'))
  assert.equal(G.save.scene.heirMeet, null)
  assert.ok(E.hasPerk(G.save.character, 'trialSupport'))
  // 婉拒路径
  G.save.scene.heirMeet = T.HEIRS.find((h) => h.id === 'mydei')
  actions.declineHeir()
  assert.equal(G.save.scene.heirMeet, null)
  assert.ok(!G.save.character.companions.includes('mydei'))
})
test('store：失败判定可碎片重掷，重掷消耗一枚碎片', () => {
  actions.newGame({ name: '测试者', identityIdx: 0, obsession: 'x' })
  G.save.character.fragments.push(
    { id: 'f1', label: '关键抉择', note: 'n1' },
    { id: 'f2', label: '隐藏线索', note: 'n2' }
  )
  const origRandom = Math.random
  Math.random = () => 0 // 骰出 1,1 → 必失败
  try {
    actions.doCheck('investigate', 0, '测试判定')
    assert.ok(G.save.rerollable, '失败且持碎片时应可重掷')
    const before = G.save.character.fragments.length
    const res = actions.rerollCheck()
    assert.ok(res)
    assert.equal(res.tier, 'fail')
    assert.equal(G.save.character.fragments.length, before - 1)
    assert.ok(G.save.rerollable, '重掷仍失败且尚有碎片 → 可继续重掷')
    // 无 freeReroll 神权时不得标记 oronyx
    assert.ok(!G.save.character.usedFlags.oronyx)
  } finally {
    Math.random = origRandom
  }
})
test('store：火种达 9 触发终幕事件，且每轮回只触发一次', () => {
  actions.newGame({ name: '测试者', identityIdx: 0, obsession: 'x' })
  G.save.character.usedFlags = {}
  G.save.character.flame = 8
  const n0 = G.save.session.length
  actions.checkFinalArc()
  assert.equal(G.save.session.length, n0)
  G.save.character.flame = 9
  actions.checkFinalArc()
  assert.ok(G.save.session.length > n0, '应推送终幕叙事')
  assert.equal(G.save.character.usedFlags.finalArc, true)
  const n1 = G.save.session.length
  actions.checkFinalArc()
  assert.equal(G.save.session.length, n1)
})
test('store：黑潮跨档推送阶段叙事（潮涌→潮噬）', () => {
  actions.newGame({ name: '测试者', identityIdx: 0, obsession: 'x' })
  G.save.character.tide = 6
  const res = {
    roll: 3, effectiveRoll: 3, rollBonus: 0, delta: 1,
    auto: 0, locDelta: 0, totalDelta: 1, triggered: false, reason: '黑潮靠近'
  }
  const n0 = G.save.session.length
  actions.applyTideResult(res)
  const msgs = G.save.session.slice(n0)
  assert.ok(msgs.some((m) => (m.tag || '').includes('潮噬')), '应推送潮噬阶段叙事')
  assert.equal(G.save.tideStage, '潮噬')
  assert.equal(G.save.character.tide, 7)
})
test('store：赛飞儿同行时侵蚀检定先挂起重掷', () => {
  actions.newGame({ name: '测试者', identityIdx: 0, obsession: 'x' })
  G.save.character.companions.push('cipher')
  const origRandom = Math.random
  Math.random = () => 0 // 1 → 必触发侵蚀
  try {
    actions.doTideCheck({})
    assert.equal(G.save.tideRerollable, true)
    assert.ok(!G.save.character.usedFlags.cipher, '尚未消耗重掷机会')
    const tideBefore = G.save.character.tide
    actions.rerollTide()
    assert.equal(G.save.character.usedFlags.cipher, true)
    assert.equal(G.save.tideRerollable, false)
    assert.ok(G.save.character.tide >= tideBefore) // 重掷后按新结果结算
  } finally {
    Math.random = origRandom
  }
})

/* ===================== 汇总 ===================== */
console.log('\n────────────────────────────')
if (failures.length === 0) {
  console.log(`✓ 全部通过：${passed} 项测试`)
} else {
  console.log(`✗ 失败 ${failures.length} 项 / 通过 ${passed} 项`)
  failures.forEach((f) => console.log('   - ' + f.name + ': ' + f.msg))
}
console.log('────────────────────────────\n')
process.exit(failures.length === 0 ? 0 : 1)