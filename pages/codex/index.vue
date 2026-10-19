<template>
  <view class="page">
    <view class="navbar">
      <text class="navbar-brand">翁法罗斯图鉴</text>
      <text class="nav-btn" @click="randomInspiration">灵感炉</text>
    </view>

    <!-- 分类 -->
    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view class="tab-row">
        <text
          v-for="t in tabs"
          :key="t.id"
          class="tab-chip"
          :class="{ on: tab === t.id }"
          @click="tab = t.id"
          >{{ t.name }}</text
        >
      </view>
    </scroll-view>

    <!-- ===== 规则 ===== -->
    <view class="section" v-if="tab === 'rules'">
      <view v-for="(r, i) in rules" :key="i" class="panel" style="margin-bottom: 20rpx">
        <text class="h3" :class="toneClass(r.tone)">{{ r.title }}</text>
        <text class="rule-body">{{ r.body }}</text>
      </view>

      <view class="section-title"><text class="h2">单轮结构</text></view>
      <view class="panel">
        <view v-for="(s, i) in roundSteps" :key="i" class="step-line-item">
          <text class="step-no">{{ i + 1 }}</text>
          <text class="step-txt">{{ s }}</text>
        </view>
      </view>

      <view class="section-title"><text class="h2">记忆判定表</text></view>
      <view class="panel">
        <view class="tbl-row tbl-head">
          <text class="c1">总和</text><text class="c2">结果</text>
        </view>
        <view class="tbl-row"><text class="c1 mem">2-6</text><text class="c2">失败，且记忆受损（-1记忆值）</text></view>
        <view class="tbl-row"><text class="c1 gold">7-9</text><text class="c2">部分成功，达成目标但付出代价</text></view>
        <view class="tbl-row"><text class="c1 gold">10+</text><text class="c2">完全成功，获得额外收益</text></view>
      </view>

      <view class="section-title"><text class="h2">流程要点</text></view>
      <view class="panel">
        <view v-for="(c, i) in endConditions" :key="i" class="cond">
          <text class="cond-ico">◆</text>
          <text class="cond-txt">{{ c }}</text>
        </view>
      </view>
    </view>

    <!-- ===== 身份 ===== -->
    <view class="section" v-if="tab === 'identity'">
      <view v-for="it in identities" :key="it.id" class="panel" style="margin-bottom: 20rpx">
        <view class="row-between">
          <text class="h3 gold">{{ it.name }}</text>
          <text class="sub">{{ it.epithet }}</text>
        </view>
        <text class="rule-body">{{ it.desc }}</text>
        <view style="margin-top: 12rpx">
          <text class="tag tag-gold">{{ it.trait }}</text>
        </view>
      </view>
      <view class="panel">
        <text class="h3">属性修正</text>
        <text class="rule-body">初始任选两项获得 +1：擅长调查/推理、战斗/武艺、交涉/魅惑。判定时掷 2d6 + 相关修正。</text>
      </view>
    </view>

    <!-- ===== 神谕 ===== -->
    <view class="section" v-if="tab === 'oracle'">
      <view class="panel">
        <text class="h3 gold">Oracle 回响（1d6）</text>
        <view class="tbl-row tbl-head"><text class="c1">骰面</text><text class="c2">回响</text></view>
        <view v-for="a in oracleAnswers" :key="a.roll" class="tbl-row">
          <text class="c1" :class="a.tone === 'positive' ? 'gold' : 'mem'">{{ a.roll }}</text>
          <text class="c2">{{ a.text }}</text>
        </view>
        <text class="rule-body">可能性调整：事件很可能发生掷前 +1；极不可能掷前 -1。</text>
      </view>

      <view class="panel" style="margin-top: 20rpx">
        <text class="h3 gold">神谕表（1d6 抽取）</text>
        <view v-for="o in oracles" :key="o.roll" class="oracle-item">
          <text class="oracle-no">{{ o.roll }}</text>
          <text class="oracle-txt serif">「{{ o.text }}」</text>
          <text class="tag" :class="o.source === 'book' ? 'tag-gold' : 'tag-tide'">{{ o.source === 'book' ? '原典' : '扩展' }}</text>
        </view>
      </view>
    </view>

    <!-- ===== 场景 ===== -->
    <view class="section" v-if="tab === 'scene'">
      <view class="section-title" style="margin-top: 10rpx"><text class="h2">起始地点（1d8+）</text></view>
      <view v-for="l in locations" :key="l.roll" class="panel loc-card" style="margin-bottom: 18rpx">
        <view class="row-between">
          <view>
            <text class="h3 gold serif">{{ l.name }}</text>
            <text class="tag tag-tide" style="margin-left: 12rpx">{{ l.vibe }}</text>
          </view>
          <text class="loc-no">{{ l.roll }}</text>
        </view>
        <text class="rule-body">{{ l.scene }}</text>
        <text class="loc-prompt">◇ {{ l.prompt }}</text>
        <text v-if="l.tideBase" class="tag tag-blood" style="margin-top: 10rpx">黑潮活跃 +{{ l.tideBase }}</text>
      </view>

      <view class="section-title"><text class="h2">遭遇表（进入新场景掷）</text></view>
      <view v-for="e in encounters" :key="e.roll" class="panel enc-card" style="margin-bottom: 16rpx">
        <view class="row-between">
          <view>
            <text class="tag tag-blood">{{ e.tag }}</text>
            <text class="enc-title">{{ e.name }}</text>
          </view>
          <text class="loc-no">{{ e.roll }}</text>
        </view>
        <text class="rule-body">{{ e.text }}</text>
        <text class="loc-prompt">▸ {{ e.action }}</text>
      </view>
    </view>

    <!-- ===== 泰坦 · 黄金裔 ===== -->
    <view class="section" v-if="tab === 'titans'">
      <view class="panel" style="margin-bottom: 18rpx">
        <text class="h3 gold">十二泰坦 · 火种与神权</text>
        <text class="rule-body">
          逐火之旅的终点，是十二神权的认可。每一枚火种对应一位泰坦与其神权，
          收集后获得永续「神权恩泽」。
        </text>
      </view>
      <view v-for="t in titans" :key="t.id" class="panel" style="margin-bottom: 16rpx">
        <view class="row-between">
          <view>
            <text class="h3 gold serif">「{{ t.domain }}」{{ t.name }}</text>
            <text class="lore-alias">{{ t.alias }}</text>
          </view>
          <text class="tag" :class="t.source === 'hsr' ? 'tag-gold' : 'tag-tide'">神权</text>
        </view>
        <text class="rule-body">{{ t.trialText }}</text>
        <text class="loc-prompt">▸ {{ t.trialAsk }}</text>
        <view style="margin-top: 10rpx; display: flex; flex-direction: column; gap: 6rpx">
          <text class="tag tag-gold" style="align-self: flex-start">{{ t.boonText }}</text>
          <text class="hint-line">试炼判定：{{ t.trialAttr === 'investigate' ? '调查/推理' : t.trialAttr === 'combat' ? '战斗/武艺' : '交涉/魅惑' }}</text>
        </view>
      </view>

      <view class="panel" style="margin: 20rpx 0 18rpx">
        <text class="h3 gold">黄金裔 · 同行者</text>
        <text class="rule-body">
          旅途中可邂逅黄金裔并邀请结伴。同行者提供永续加成——
          "多一个人，就多一分希望。"
        </text>
      </view>
      <view v-for="h in heirs" :key="h.id" class="panel" style="margin-bottom: 16rpx">
        <view class="row-between">
          <view>
            <text class="h3 gold serif">{{ h.name }}</text>
            <text class="lore-alias">{{ h.title }} · 「{{ h.domain }}」</text>
          </view>
          <text class="tag tag-mem">同行者</text>
        </view>
        <text class="rule-body">{{ h.meetText }}</text>
        <text class="loc-prompt serif">{{ h.joinLine }}</text>
        <view style="margin-top: 10rpx">
          <text class="tag tag-gold">{{ h.perkText }}</text>
        </view>
      </view>
    </view>

    <!-- ===== 结局 ===== -->
    <view class="section" v-if="tab === 'ending'">
      <view class="panel" style="margin-bottom: 18rpx">
        <text class="h3 gold">结局生成器（2d6）</text>
        <text class="rule-body">当游戏结束时，掷 2d6 生成结局类型。</text>
      </view>
      <view v-for="(k, i) in endingKeys" :key="k" class="panel" :class="{ 'panel-true': k === 'aswritten' }">
        <view class="row-between">
          <text class="h3" :class="k === 'aswritten' ? 'gold' : ''">{{ ENDINGS[k].name }}</text>
          <text class="tag tag-gold">{{ ENDINGS[k].total }}</text>
        </view>
        <text class="rule-body">{{ ENDINGS[k].text }}</text>
        <text class="end-detail">{{ ENDINGS[k].detail }}</text>
      </view>
    </view>

    <!-- ===== 词表 ===== -->
    <view class="section" v-if="tab === 'words'">
      <view class="panel">
        <text class="h3 gold">动作词（1d12）</text>
        <view class="word-grid">
          <text v-for="w in wordActions" :key="w" class="word-chip">{{ w }}</text>
        </view>
      </view>
      <view class="panel" style="margin-top: 20rpx">
        <text class="h3 gold">主题词（1d12）</text>
        <view class="word-grid">
          <text v-for="w in wordThemes" :key="w" class="word-chip">{{ w }}</text>
        </view>
      </view>
      <view class="panel" style="margin-top: 20rpx">
        <text class="h3">组合示例</text>
        <view v-for="(v, k) in wordExamples" :key="k" class="ex-item">
          <text class="tag tag-gold">{{ k.replace('+', ' × ') }}</text>
          <text class="ex-txt">{{ v }}</text>
        </view>
      </view>
      <view class="btn btn-primary btn-block" style="margin-top: 26rpx" @click="randomInspiration">抽一组试试</view>
    </view>

    <!-- ===== 设定 ===== -->
    <view class="section" v-if="tab === 'lore'">
      <view class="panel" style="margin-bottom: 20rpx">
        <text class="h3 gold">翁法罗斯 · 设定词条</text>
        <text class="rule-body">共 {{ glossary.length }} 条。标注「原典」者直接来自跑团规则书。</text>
      </view>
      <view v-for="g in glossary" :key="g.term" class="panel" style="margin-bottom: 16rpx">
        <view class="row-between">
          <view>
            <text class="h3 gold serif">{{ g.term }}</text>
            <text class="lore-alias">{{ g.alias }}</text>
          </view>
          <text class="tag" :class="g.source === 'book' ? 'tag-gold' : 'tag-tide'">
            {{ g.source === 'book' ? '原典' : g.source === 'hsr' ? '设定' : '扩展' }}
          </text>
        </view>
        <text class="rule-body">{{ g.text }}</text>
      </view>

      <view class="panel">
        <text class="h3 gold">十二泰坦名录（考据）</text>
        <text class="lore-note">{{ titanLore.note }}</text>
        <view class="tbl-row tbl-head"><text class="c1">名讳</text><text class="t-name">神职</text><text class="c3">可信度</text></view>
        <view v-for="t in titanLore.list" :key="t.alias" class="tbl-row">
          <text class="c1 gold">{{ t.name }}</text>
          <text class="t-name">{{ t.domain }}<text class="dim"> · {{ t.alias }}</text></text>
          <text class="c3" :class="t.level === '较可信' ? 'mem' : 'dim'">{{ t.level }}</text>
        </view>
      </view>

      <view class="panel" style="margin-top: 20rpx">
        <text class="h3">地名一览</text>
        <text class="rule-body">{{ placesNote }}</text>
      </view>
    </view>

    <view class="toast" v-if="G.ui.toast">{{ G.ui.toast.text }}</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { G, actions } from '../../src/store.js'
import {
  RULES_BOOK, ROUND_STEPS, END_CONDITIONS, IDENTITIES, ORACLES, ORACLE_ANSWERS,
  LOCATIONS, ENCOUNTERS, ENDINGS, WORD_ACTIONS, WORD_THEMES, WORD_EXAMPLES,
  TITAN_FLAMES, HEIRS
} from '../../src/tables.js'
import { GLOSSARY, TITANS as TITAN_LORE, PLACES_NOTE } from '../../src/lore.js'

const tab = ref('rules')

const tabs = [
  { id: 'rules', name: '规则' },
  { id: 'identity', name: '身份' },
  { id: 'titans', name: '泰坦·黄金裔' },
  { id: 'oracle', name: '神谕·Oracle' },
  { id: 'scene', name: '场景·遭遇' },
  { id: 'ending', name: '结局' },
  { id: 'words', name: '词表' },
  { id: 'lore', name: '设定' }
]

const titans = TITAN_FLAMES
const heirs = HEIRS
const glossary = GLOSSARY
const titanLore = TITAN_LORE
const placesNote = PLACES_NOTE

const rules = RULES_BOOK
const roundSteps = ROUND_STEPS
const endConditions = END_CONDITIONS
const identities = IDENTITIES
const oracles = ORACLES
const oracleAnswers = ORACLE_ANSWERS
const locations = LOCATIONS
const encounters = ENCOUNTERS
const ENDINGS_REF = ENDINGS // 模板中直接使用导入的 ENDINGS
const endingKeys = ['eternal', 'echo', 'flame', 'aswritten']
const wordActions = WORD_ACTIONS
const wordThemes = WORD_THEMES
const wordExamples = WORD_EXAMPLES

function toneClass(t) {
  return t === 'mem' ? 'mem' : t === 'tide' ? 'tide' : t === 'ember' ? 'ember' : 'gold'
}

function randomInspiration() {
  const w = actions.drawWords()
  actions.toast(`灵感：${w.action} × ${w.theme}`)
}

onShow(() => actions.migrate())
</script>

<style scoped>
.navbar-brand {
  font-size: 34rpx;
  letter-spacing: 6rpx;
  color: var(--gold);
  font-weight: 700;
}
.nav-btn {
  font-size: 24rpx;
  color: var(--gold);
}
.tabs {
  white-space: nowrap;
  padding: 0 36rpx;
}
.tab-row {
  display: flex;
  gap: 14rpx;
  padding-bottom: 10rpx;
}
.tab-chip {
  flex-shrink: 0;
  font-size: 25rpx;
  padding: 10rpx 30rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--line-soft);
  color: var(--ink-3);
  background: rgba(255, 255, 255, 0.03);
}
.tab-chip.on {
  color: #2a1804;
  background: linear-gradient(135deg, #f2c572, #d99b3f);
  border-color: transparent;
  font-weight: 700;
}

.rule-body {
  display: block;
  font-size: 25rpx;
  color: var(--ink-2);
  line-height: 1.85;
  margin-top: 12rpx;
}
.step-line-item {
  display: flex;
  gap: 18rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx dashed var(--line-soft);
}
.step-no {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(242, 197, 114, 0.15);
  color: var(--gold);
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
}
.step-txt {
  flex: 1;
  font-size: 25rpx;
  color: var(--ink-2);
  line-height: 1.7;
}

.tbl-row {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx dashed var(--line-soft);
}
.tbl-head {
  border-bottom: 1rpx solid var(--line);
}
.tbl-head .c1,
.tbl-head .c2 {
  color: var(--ink-3);
  font-size: 22rpx;
}
.c1 {
  width: 130rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--ink);
}
.c2 {
  flex: 1;
  font-size: 25rpx;
  color: var(--ink-2);
}

.cond {
  display: flex;
  gap: 14rpx;
  padding: 12rpx 0;
}
.cond-ico {
  color: var(--ember);
  font-size: 22rpx;
}
.cond-txt {
  flex: 1;
  font-size: 25rpx;
  color: var(--ink-2);
  line-height: 1.7;
}

.row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.oracle-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx dashed var(--line-soft);
}
.oracle-no {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(242, 197, 114, 0.12);
  color: var(--gold);
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.oracle-txt {
  flex: 1;
  font-size: 26rpx;
  color: #f6e6c6;
  line-height: 1.6;
}

.loc-no {
  font-size: 34rpx;
  color: rgba(242, 197, 114, 0.45);
  font-weight: 700;
}
.loc-prompt {
  display: block;
  font-size: 24rpx;
  color: var(--ember);
  margin-top: 10rpx;
  line-height: 1.7;
}
.enc-title {
  font-size: 28rpx;
  color: var(--ink);
  font-weight: 600;
  margin-left: 12rpx;
}
.end-detail {
  display: block;
  font-size: 24rpx;
  color: var(--ink-3);
  margin-top: 10rpx;
  line-height: 1.8;
}
.panel-true {
  border-color: rgba(242, 197, 114, 0.55);
}

.word-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 16rpx;
}
.word-chip {
  font-size: 26rpx;
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(242, 197, 114, 0.1);
  border: 1rpx solid rgba(242, 197, 114, 0.35);
  color: var(--gold);
}
.ex-item {
  padding: 14rpx 0;
  border-bottom: 1rpx dashed var(--line-soft);
}
.ex-txt {
  display: block;
  font-size: 24rpx;
  color: var(--ink-2);
  margin-top: 8rpx;
  line-height: 1.7;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 180rpx;
  transform: translateX(-50%);
  background: rgba(20, 14, 36, 0.96);
  border: 1rpx solid rgba(242, 197, 114, 0.5);
  color: var(--gold);
  font-size: 26rpx;
  padding: 18rpx 40rpx;
  border-radius: 999rpx;
  z-index: 200;
}
</style>