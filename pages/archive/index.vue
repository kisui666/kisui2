<template>
  <view class="page">
    <view class="navbar">
      <text class="navbar-brand">轮回档案</text>
      <text class="nav-btn" @click="showRules = true">轮回机制</text>
    </view>

    <!-- 总览 -->
    <view class="section">
      <view class="panel stats-panel">
        <view class="big-stat">
          <text class="big-num gold">{{ reincarnation }}</text>
          <text class="big-label">本存档轮回次数</text>
        </view>
        <view class="mini-grid">
          <view class="mini"><text class="mini-num mem">{{ fragments.length }}</text><text class="mini-label">记忆碎片</text></view>
          <view class="mini"><text class="mini-num ember">{{ endings.length }}</text><text class="mini-label">历史结局</text></view>
          <view class="mini"><text class="mini-num gold">{{ archive.totalTurns }}</text><text class="mini-label">累计轮次</text></view>
          <view class="mini"><text class="mini-num tide">{{ archive.totalReincarnations }}</text><text class="mini-label">累计轮回</text></view>
        </view>
      </view>
    </view>

    <!-- 当前轮回状态 -->
    <view class="section" v-if="character">
      <view class="section-title"><text class="h2">当前轮回</text></view>
      <view class="panel">
        <view class="kv"><text class="k">旅者</text><text class="v">{{ character.name }} · {{ character.identityName }}</text></view>
        <view class="kv"><text class="k">轮回序号</text><text class="v">第 {{ reincarnation + 1 }} 次启程</text></view>
        <view class="kv"><text class="k">状态</text><text class="v">记忆 {{ character.memory }}/10　侵蚀 {{ character.tide }}/10　火种 {{ character.flame }}/12</text></view>
        <view class="kv oracle-kv"><text class="k gold">神谕</text><text class="v serif or">「{{ character.oracle }}」</text></view>
      </view>
    </view>

    <!-- 记忆碎片 -->
    <view class="section">
      <view class="section-title"><text class="h2">记忆碎片</text></view>
      <view v-if="!fragments.length" class="empty-box">
        <text class="empty-ico">◈</text>
        <text class="dim">还没有碎片。每一次轮回都会为你留下一条关键信息——
          这是翁法罗斯对你的馈赠。</text>
      </view>
      <view v-for="(f, i) in fragList" :key="f.id" class="panel frag-card">
        <view class="row-between">
          <view>
            <text class="tag tag-mem">碎片 {{ fragments.length - i }}</text>
            <text class="frag-label">{{ f.label }}</text>
          </view>
          <text class="tag" :class="f.flameAt > 0 ? 'tag-gold' : ''">{{ f.flameAt }}/12 火种时</text>
        </view>
        <text class="frag-note">{{ f.note }}</text>
        <text class="frag-time">{{ fmtTime(f.time) }}</text>
      </view>
    </view>

    <!-- 历史结局 -->
    <view class="section">
      <view class="section-title"><text class="h2">历史结局</text></view>
      <view v-if="!endings.length" class="empty-box">
        <text class="empty-ico">✒</text>
        <text class="dim">你还没有写下结局。回到"逐火"，随时可以收束故事。</text>
      </view>
      <view v-for="(e, i) in endingList" :key="i" class="panel end-card" @click="openEnding(e)">
        <view class="row-between">
          <text class="h3 gold serif">{{ e.name }}</text>
          <text class="tag" :class="tierClass(e.tier)">{{ e.dice ? '2d6=' + e.total : '主动收束' }}</text>
        </view>
        <text class="end-text">{{ e.text }}</text>
        <view class="end-meta">
          <text class="sub">{{ e.character.name }} · 轮回 {{ e.reincarnation }} 次 · {{ e.historyCount }} 轮</text>
          <text class="sub">{{ fmtTime(e.time) }}</text>
        </view>
      </view>
    </view>

    <!-- 管理 -->
    <view class="section" style="margin-top: 20rpx">
      <view class="btn btn-ghost btn-block" @click="goJournal">阅读完整日志</view>
      <view class="btn btn-dim btn-block" style="margin-top: 16rpx" @click="askReset('save')">
        重开一世（清空当前存档，保留档案）
      </view>
      <view class="btn btn-danger btn-block" style="margin-top: 16rpx" @click="askReset('all')">
        抹除全部轮回痕迹（清空所有数据）
      </view>
    </view>

    <!-- 轮回机制说明 -->
    <view class="mask" v-if="showRules" @click.self="showRules = false">
      <view class="sheet">
        <text class="h2">轮回机制</text>
        <view class="rule"></view>
        <text class="mech">角色死亡或侵蚀满值时，世界重置：</text>
        <view class="mech-item"><text class="dot">•</text><text>记忆值恢复为 10，侵蚀清零</text></view>
        <view class="mech-item"><text class="dot">•</text><text>保留火种数量和神谕</text></view>
        <view class="mech-item"><text class="dot">•</text><text>获得一条记忆碎片（上一轮的关键信息）</text></view>
        <view class="mech-item"><text class="dot">•</text><text>重新生成起始地点和初始遭遇</text></view>
        <view class="rule"></view>
        <text class="serif gold center-block">轮回不是失败，而是翁法罗斯的常态。每一次回归，你都比上次更接近真相。</text>
        <view class="btn btn-ghost btn-block" style="margin-top: 30rpx" @click="showRules = false">明白了</view>
      </view>
    </view>

    <!-- 重置确认 -->
    <view class="mask" v-if="resetKind" @click.self="resetKind = ''">
      <view class="sheet center">
        <text class="h2">{{ resetKind === 'all' ? '抹除全部数据？' : '重开一世？' }}</text>
        <text class="dim block-text">
          {{ resetKind === 'all'
            ? '所有结局、记忆碎片、日志都会被删除，翁法罗斯将忘记你曾来过。'
            : '当前角色与日志将被清空，历史结局与碎片档案会保留。' }}
        </text>
        <view class="btn btn-danger btn-block" style="margin-top: 30rpx" @click="doReset">确认</view>
        <view class="btn btn-dim btn-block" style="margin-top: 16rpx" @click="resetKind = ''">取消</view>
      </view>
    </view>

    <view class="toast" v-if="G.ui.toast">{{ G.ui.toast.text }}</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { G, actions } from '../../src/store.js'

const showRules = ref(false)
const resetKind = ref('')

const archive = computed(() => G.archive)
const character = computed(() => G.save.character)
const reincarnation = computed(() => G.save.reincarnation)
const fragments = computed(() => (character.value && character.value.fragments) || [])
const fragList = computed(() => fragments.value.slice().reverse())
const endings = computed(() => G.archive.endings)
const endingList = computed(() => endings.value.slice().reverse())

function tierClass(t) {
  return t === 'aswritten' ? 'tag-gold' : t === 'flame' ? 'tag-ok' : 'tag-tide'
}
function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function openEnding() {
  uni.navigateTo({ url: '/pages/ending/index' })
}
function goJournal() {
  uni.switchTab({ url: '/pages/journal/index' })
}
function askReset(kind) {
  resetKind.value = kind
}
function doReset() {
  if (resetKind.value === 'all') actions.resetAll()
  else actions.hardReset()
  resetKind.value = ''
  actions.toast('数据已清空')
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
  color: var(--ink-3);
}

.stats-panel {
  display: flex;
  align-items: center;
  gap: 30rpx;
}
.big-stat {
  text-align: center;
  flex-shrink: 0;
}
.big-num {
  font-size: 90rpx;
  font-weight: 700;
  display: block;
  text-shadow: 0 0 34rpx rgba(242, 197, 114, 0.5);
}
.big-label {
  font-size: 22rpx;
  color: var(--ink-3);
}
.mini-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}
.mini {
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid var(--line-soft);
  border-radius: 12rpx;
  padding: 14rpx;
  text-align: center;
}
.mini-num {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}
.mini-label {
  display: block;
  font-size: 20rpx;
  color: var(--ink-3);
  margin-top: 2rpx;
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
.or {
  color: #f6e6c6;
}

.empty-box {
  text-align: center;
  padding: 50rpx 30rpx;
}
.empty-ico {
  display: block;
  font-size: 64rpx;
  color: var(--gold);
  opacity: 0.55;
  margin-bottom: 16rpx;
}
.empty-box .dim {
  font-size: 25rpx;
  line-height: 1.8;
}

.frag-card,
.end-card {
  margin-bottom: 18rpx;
}
.frag-label {
  font-size: 27rpx;
  color: var(--ink);
  font-weight: 600;
  margin-left: 14rpx;
}
.frag-note {
  display: block;
  font-size: 25rpx;
  color: var(--ink-2);
  line-height: 1.75;
  margin-top: 12rpx;
}
.frag-time {
  display: block;
  font-size: 20rpx;
  color: var(--ink-3);
  margin-top: 8rpx;
}
.end-text {
  display: block;
  font-size: 25rpx;
  color: var(--ink-2);
  margin-top: 10rpx;
}
.end-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 10rpx;
}

.row-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.mech {
  display: block;
  font-size: 26rpx;
  color: var(--ink);
  margin-bottom: 10rpx;
}
.mech-item {
  display: flex;
  gap: 14rpx;
  padding: 8rpx 0;
  font-size: 25rpx;
  color: var(--ink-2);
}
.dot {
  color: var(--gold);
}
.center-block {
  display: block;
  text-align: center;
  font-size: 27rpx;
  line-height: 1.9;
}
.block-text {
  display: block;
  font-size: 25rpx;
  color: var(--ink-2);
  line-height: 1.8;
  margin-top: 16rpx;
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