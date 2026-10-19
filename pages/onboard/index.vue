<template>
  <view class="page">
    <view class="navbar">
      <text class="navbar-back" @click="back">‹ 返回</text>
      <text class="navbar-title">踏上逐火之旅</text>
      <text class="navbar-meta">步骤 {{ step }}/3</text>
    </view>

    <!-- 步骤指示 -->
    <view class="steps">
      <view v-for="(s, i) in ['身份', '角色卡', '神谕']" :key="i" class="step-item">
        <view class="step-dot" :class="{ on: step > i, now: step === i + 1 }">
          <text>{{ step > i + 1 ? '✓' : i + 1 }}</text>
        </view>
        <text class="step-name" :class="{ on: step >= i + 1 }">{{ s }}</text>
        <view class="step-line" v-if="i < 2" :class="{ on: step > i + 1 }"></view>
      </view>
    </view>

    <!-- ============ 步骤 1：选择身份 ============ -->
    <view class="section" v-if="step === 1">
      <view class="section-title"><text class="h2">一、选择身份</text></view>
      <text class="sub">你的存在方式，决定你看待轮回的角度</text>

      <view
        v-for="it in identities"
        :key="it.id"
        class="id-card"
        :class="{ picked: form.identityId === it.id }"
        @click="form.identityId = it.id"
      >
        <view class="id-head">
          <text class="id-name serif">{{ it.name }}</text>
          <text class="id-epithet">{{ it.epithet }}</text>
          <view class="id-check" v-if="form.identityId === it.id">✓</view>
        </view>
        <text class="id-desc">{{ it.desc }}</text>
        <view class="id-foot">
          <text class="tag tag-gold">{{ it.trait }}</text>
          <text class="tag tag-tide">{{ insightShort(it.insight) }}</text>
        </view>
      </view>
    </view>

    <!-- ============ 步骤 2：填写角色卡 ============ -->
    <view class="section" v-if="step === 2">
      <view class="section-title"><text class="h2">二、填写角色卡</text></view>

      <view class="panel">
        <view class="field-label" style="margin-top: 0">【姓名】</view>
        <input class="input" v-model="form.name" :maxlength="12" placeholder="你在翁法罗斯的名字" placeholder-class="ph" />

        <view class="field-label">【命途倾向】</view>
        <view class="path-row">
          <view
            v-for="p in paths"
            :key="p.id"
            class="path-chip"
            :class="{ active: form.pathId === p.id }"
            @click="form.pathId = p.id"
          >
            <text class="path-name">{{ p.name }}</text>
            <text class="path-desc">{{ p.desc }}</text>
          </view>
        </view>

        <view class="field-label">【属性修正】初始任选两项 +1</view>
        <view class="attr-pick">
          <view
            v-for="a in attrs"
            :key="a.id"
            class="attr-block"
            :class="{ on: form.attrs.includes(a.id) }"
            @click="toggleAttr(a.id)"
          >
            <text class="attr-plus">{{ form.attrs.includes(a.id) ? '+1' : '+0' }}</text>
            <text class="attr-name">{{ a.name }}</text>
          </view>
        </view>
        <text v-if="form.attrs.length !== 2" class="warn">需恰好选择 2 项（已选 {{ form.attrs.length }}）</text>

        <view class="field-label">【执念】角色最想完成的一件事</view>
        <textarea
          class="textarea"
          v-model="form.obsession"
          :maxlength="60"
          placeholder="例如：把她的名字从权杖的删除名单里找回来"
          placeholder-class="ph"
          auto-height
        />
        <text class="hint">执念达成后可安然收束故事（结束条件之一）</text>
      </view>
    </view>

    <!-- ============ 步骤 3：生成神谕 ============ -->
    <view class="section" v-if="step === 3">
      <view class="section-title"><text class="h2">三、生成神谕</text></view>
      <text class="sub">掷 1d6，从神谕表抽取一条关于结局的预言</text>

      <view class="panel oracle-stage center">
        <template v-if="!rolledOracle">
          <text class="oracle-symbol">◈</text>
          <text class="dim" style="display: block; margin-top: 10rpx">
            神谕一旦写下，将与你一同穿越每一次轮回
          </text>
          <view class="btn btn-primary pulse" style="margin: 34rpx auto 0; width: 340rpx" @click="rollOracle">
            掷 1d6 生成神谕
          </view>
        </template>
        <template v-else>
          <view class="dice-row">
            <view class="dice dice-total dice-anim">{{ oracleResult.roll }}</view>
          </view>
          <text class="oracle-text serif fade-in">「{{ oracleResult.text }}」</text>
          <view class="tag tag-gold" style="margin-top: 18rpx">
            {{ oracleResult.source === 'book' ? '规则书原典' : '翁法洛斯扩展' }}
          </view>
          <text class="sub" style="display: block; margin-top: 24rpx">与你同行的身份</text>
          <view class="summary">
            <view class="kv"><text class="k">姓名</text><text class="v">{{ form.name || '无名者' }}</text></view>
            <view class="kv"><text class="k">身份</text><text class="v">{{ pickedIdentity.name }}</text></view>
            <view class="kv"><text class="k">命途</text><text class="v">{{ pickedPath.name }}</text></view>
            <view class="kv"><text class="k">属性</text><text class="v">{{ attrSummary }}</text></view>
            <view class="kv"><text class="k">初始火种</text><text class="v">{{ pickedIdentity.bonus && pickedIdentity.bonus.flame ? '+1' : '0' }}</text></view>
            <view class="kv"><text class="k">执念</text><text class="v">{{ form.obsession || '（未写下）' }}</text></view>
          </view>
          <view class="btn btn-primary btn-block" style="margin-top: 30rpx" @click="begin">
            开始逐火
          </view>
        </template>
      </view>
    </view>

    <!-- 底部导航 -->
    <view class="footer" v-if="step < 3">
      <view class="btn btn-dim" style="width: 200rpx" @click="step > 1 ? (step -= 1) : back()">上一步</view>
      <view class="btn btn-primary" style="flex: 1; margin-left: 20rpx" @click="next">下一步</view>
    </view>
    <view class="footer" v-else>
      <view class="btn btn-dim" style="width: 200rpx" @click="step -= 1">上一步</view>
      <view class="btn btn-ghost" style="flex: 1; margin-left: 20rpx" @click="reroll" v-if="rolledOracle">重掷神谕</view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { IDENTITIES, PATHS, ATTRS, ORACLES } from '../../src/tables.js'
import { rollOracleForStart } from '../../src/engine.js'
import { G, actions } from '../../src/store.js'

const identities = IDENTITIES
const paths = PATHS
const attrs = ATTRS

const step = ref(1)
const rolledOracle = ref(null)
const oracleResult = ref(null)

const form = reactive({
  name: '',
  identityId: IDENTITIES[0].id,
  pathId: PATHS[0].id,
  attrs: ['investigate', 'combat'],
  obsession: ''
})

const pickedIdentity = computed(() => IDENTITIES.find((x) => x.id === form.identityId) || IDENTITIES[0])
const pickedPath = computed(() => PATHS.find((x) => x.id === form.pathId) || PATHS[0])
const attrSummary = computed(() =>
  ATTRS.filter((a) => form.attrs.includes(a.id))
    .map((a) => a.name + ' +1')
    .join('　') || '未选择'
)

function insightShort(i) {
  return { oracle: '神谕感知', steady: '记忆稳定', past: '读取过去', tide: '感知黑潮' }[i] || ''
}

function toggleAttr(id) {
  const i = form.attrs.indexOf(id)
  if (i >= 0) form.attrs.splice(i, 1)
  else if (form.attrs.length < 2) form.attrs.push(id)
  else actions.toast('初始只能选两项')
}

function next() {
  if (step.value === 1) {
    if (!form.identityId) return actions.toast('请先选择身份')
  }
  if (step.value === 2) {
    if (form.attrs.length !== 2) return actions.toast('属性需恰好选择 2 项')
    if (!form.name.trim()) form.name = '无名者'
  }
  step.value += 1
  if (step.value === 3 && !rolledOracle.value) rollOracle()
}

function rollOracle() {
  const identity = pickedIdentity.value
  const res = rollOracleForStart(identity, Math.random)
  const table = ORACLES
  const found = table.find((o) => o.text === res.text) || table[0]
  oracleResult.value = { roll: res.roll, text: res.text, source: found.source }
  rolledOracle.value = true
}
function reroll() {
  rolledOracle.value = false
  rollOracle()
}

function begin() {
  actions.newGame({
    name: form.name.trim() || '无名者',
    identityId: form.identityId,
    pathId: form.pathId,
    attrs: form.attrs.slice(),
    obsession: form.obsession.trim()
  })
  actions.toast('逐火之旅开始', 1500)
  uni.switchTab({ url: '/pages/game/index' })
}

function back() {
  uni.navigateBack({
    fail: () => uni.switchTab({ url: '/pages/game/index' })
  })
}
</script>

<style scoped>
.navbar-meta {
  font-size: 24rpx;
  color: var(--ink-3);
}
.steps {
  display: flex;
  padding: 10rpx 60rpx 30rpx;
  align-items: center;
}
.step-item {
  display: flex;
  align-items: center;
  flex: 1;
}
.step-item:last-child {
  flex: 0;
}
.step-dot {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid var(--line-soft);
  color: var(--ink-3);
  font-size: 24rpx;
}
.step-dot.on {
  background: rgba(242, 197, 114, 0.15);
  border-color: rgba(242, 197, 114, 0.5);
  color: var(--gold);
}
.step-dot.now {
  background: var(--gold);
  color: #2a1804;
  font-weight: 700;
}
.step-name {
  font-size: 23rpx;
  color: var(--ink-3);
  margin-left: 10rpx;
}
.step-name.on {
  color: var(--ink);
}
.step-line {
  flex: 1;
  height: 2rpx;
  background: var(--line-soft);
  margin: 0 16rpx;
}
.step-line.on {
  background: rgba(242, 197, 114, 0.5);
}

/* 身份卡 */
.id-card {
  background: linear-gradient(155deg, rgba(36, 26, 61, 0.8), rgba(16, 11, 30, 0.85));
  border: 1rpx solid var(--line-soft);
  border-radius: 20rpx;
  padding: 26rpx;
  margin-top: 22rpx;
  position: relative;
  transition: all 0.2s ease;
}
.id-card.picked {
  border-color: rgba(242, 197, 114, 0.75);
  background: linear-gradient(155deg, rgba(74, 54, 20, 0.5), rgba(24, 16, 42, 0.9));
  box-shadow: 0 0 34rpx rgba(242, 197, 114, 0.22);
}
.id-head {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  flex-wrap: wrap;
}
.id-name {
  font-size: 33rpx;
  color: var(--gold);
  font-weight: 700;
}
.id-epithet {
  font-size: 23rpx;
  color: var(--ink-3);
}
.id-check {
  margin-left: auto;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: var(--gold);
  color: #2a1804;
  font-size: 26rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.id-desc {
  display: block;
  font-size: 25rpx;
  color: var(--ink-2);
  line-height: 1.8;
  margin: 14rpx 0 16rpx;
}
.id-foot {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

/* 命途 */
.path-row {
  display: flex;
  gap: 14rpx;
}
.path-chip {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid var(--line-soft);
  border-radius: 14rpx;
  padding: 16rpx 14rpx;
}
.path-chip.active {
  border-color: rgba(127, 212, 255, 0.65);
  background: rgba(127, 212, 255, 0.1);
}
.path-name {
  display: block;
  font-size: 27rpx;
  color: var(--ink);
  font-weight: 700;
  text-align: center;
}
.path-chip.active .path-name {
  color: var(--mem);
}
.path-desc {
  display: block;
  font-size: 20rpx;
  color: var(--ink-3);
  text-align: center;
  margin-top: 6rpx;
}

.attr-pick {
  display: flex;
  gap: 14rpx;
}
.attr-block {
  flex: 1;
  text-align: center;
  padding: 22rpx 10rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid var(--line-soft);
}
.attr-block.on {
  border-color: rgba(127, 212, 255, 0.65);
  background: rgba(127, 212, 255, 0.1);
}
.attr-plus {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--ink-3);
}
.attr-block.on .attr-plus {
  color: var(--mem);
}
.attr-name {
  display: block;
  font-size: 24rpx;
  color: var(--ink-2);
  margin-top: 6rpx;
}
.warn {
  display: block;
  font-size: 23rpx;
  color: var(--blood);
  margin-top: 12rpx;
}
.hint {
  display: block;
  font-size: 22rpx;
  color: var(--ink-3);
  margin-top: 10rpx;
}
.ph {
  color: var(--ink-3);
}

/* 神谕舞台 */
.oracle-stage {
  padding: 50rpx 30rpx;
}
.oracle-symbol {
  font-size: 90rpx;
  color: var(--gold);
  display: block;
}
.oracle-text {
  display: block;
  font-size: 34rpx;
  color: #f6e6c6;
  line-height: 1.9;
  margin-top: 30rpx;
}
.summary {
  margin-top: 24rpx;
  text-align: left;
}
.kv {
  display: flex;
  gap: 20rpx;
  padding: 10rpx 0;
  border-bottom: 1rpx dashed var(--line-soft);
}
.kv .k {
  width: 150rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: var(--ink-3);
}
.kv .v {
  flex: 1;
  font-size: 25rpx;
  color: var(--ink);
}

.footer {
  display: flex;
  padding: 40rpx 36rpx 60rpx;
}
</style>