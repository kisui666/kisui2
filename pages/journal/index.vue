<template>
  <view class="page">
    <view class="navbar">
      <text class="navbar-brand">冒险日志</text>
      <view class="nav-right">
        <text class="nav-btn" @click="copyLog">导出</text>
        <text class="nav-btn gold" @click="toggleScope">{{ scope === 'current' ? '看跨轮回' : '看本轮' }}</text>
      </view>
    </view>

    <!-- 概览 -->
    <view class="section">
      <view class="panel panel-tight overview">
        <view class="ov-item">
          <text class="ov-num gold">{{ entries.length }}</text>
          <text class="ov-label">记录条数</text>
        </view>
        <view class="ov-item">
          <text class="ov-num mem">{{ currentRunTurns }}</text>
          <text class="ov-label">本轮轮次</text>
        </view>
        <view class="ov-item">
          <text class="ov-num tide">{{ reincarnation }}</text>
          <text class="ov-label">轮回次数</text>
        </view>
        <view class="ov-item">
          <text class="ov-num ember">{{ flame }}</text>
          <text class="ov-label">火种</text>
        </view>
      </view>
    </view>

    <!-- 过滤 -->
    <view class="section">
      <scroll-view scroll-x class="filters" :show-scrollbar="false">
        <view class="filter-row">
          <text
            v-for="f in filters"
            :key="f.id"
            class="filter-chip"
            :class="{ on: filter === f.id }"
            @click="filter = f.id"
            >{{ f.name }}</text
          >
        </view>
      </scroll-view>
    </view>

    <!-- 时间线 -->
    <view class="section">
      <view v-if="!visible.length" class="empty-box">
        <text class="empty-ico">✒</text>
        <text class="dim">还没有记录。去逐火，写下第一页。</text>
      </view>

      <view v-for="(e, i) in visible" :key="e.id" class="tl-item" :class="'tl-' + e.type">
        <view class="tl-rail">
          <view class="tl-dot"></view>
          <view class="tl-bar" v-if="i < visible.length - 1"></view>
        </view>
        <view class="tl-body">
          <view class="tl-head">
            <text class="tag" :class="tagClass(e.type)">{{ typeLabel(e.type) }}</text>
            <text class="tl-meta">轮次 {{ e.turn }}{{ e.reincarnation ? ' · 第' + e.reincarnation + '轮回' : '' }}</text>
          </view>
          <text class="tl-text">{{ e.text }}</text>
          <text class="tl-time">{{ fmtTime(e.time) }}</text>
        </view>
      </view>
    </view>

    <!-- 导出预览 -->
    <view class="mask" v-if="showExport" @click.self="showExport = false">
      <view class="sheet">
        <text class="h2">如我所书 · 导出</text>
        <text class="sub" style="display: block; margin-top: 8rpx">长按复制，写下属于你的史诗</text>
        <view class="rule"></view>
        <scroll-view scroll-y class="export-box">
          <text class="export-text">{{ exportText }}</text>
        </scroll-view>
        <view class="btn btn-primary btn-block" style="margin-top: 24rpx" @click="copyLog">复制到剪贴板</view>
        <view class="btn btn-dim btn-block" style="margin-top: 16rpx" @click="showExport = false">关闭</view>
      </view>
    </view>

    <view class="toast" v-if="G.ui.toast">{{ G.ui.toast.text }}</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { G, actions } from '../../src/store.js'

const scope = ref('current')
const filter = ref('all')
const showExport = ref(false)

const filters = [
  { id: 'all', name: '全部' },
  { id: 'scene', name: '场景' },
  { id: 'check', name: '判定' },
  { id: 'oracle', name: '神谕' },
  { id: 'tide', name: '黑潮' },
  { id: 'reincarnation', name: '轮回' },
  { id: 'flame', name: '火种' },
  { id: 'battle', name: '事件' }
]

const entries = computed(() =>
  scope.value === 'current' ? G.save.history : G.archive.logbook
)
const visible = computed(() =>
  filter.value === 'all'
    ? entries.value.slice().reverse()
    : entries.value.filter((e) => e.type === filter.value).slice().reverse()
)
const currentRunTurns = computed(() => G.save.history.length)
const reincarnation = computed(() => G.save.reincarnation)
const flame = computed(() => (G.save.character ? G.save.character.flame : 0))

const exportText = computed(() => {
  const ch = G.save.character
  const lines = []
  lines.push('━━━━ 如我所书 · 翁法罗斯史诗 ━━━━')
  lines.push('')
  if (ch) {
    lines.push(`旅者：${ch.name}（${ch.identityName} · ${ch.pathName}命途）`)
    lines.push(`执念：${ch.obsession || '（未写下）'}`)
    lines.push(`神谕：「${ch.oracle}」`)
    lines.push(`火种：${ch.flame}/12　轮回：${G.save.reincarnation} 次`)
    if (ch.fragments && ch.fragments.length) {
      lines.push('')
      lines.push('—— 记忆碎片 ——')
      ch.fragments.forEach((f, i) => lines.push(`${i + 1}.【${f.label}】${f.note}`))
    }
  }
  lines.push('')
  lines.push('—— 冒险日志 ——')
  const list = (scope.value === 'current' ? G.save.history : G.archive.logbook).slice().reverse()
  if (!list.length) lines.push('（暂无记录）')
  list.forEach((e) => {
    const tag = typeLabel(e.type)
    lines.push(`[轮次${e.turn}][${tag}] ${e.text}`)
  })
  if (G.save.finished) {
    lines.push('')
    lines.push(`—— 结局 · ${G.save.finished.name} ——`)
    lines.push(G.save.finished.text)
  }
  lines.push('')
  lines.push('如同你亲手所书。')
  return lines.join('\n')
})

function typeLabel(t) {
  return (
    {
      scene: '场景',
      encounter: '遭遇',
      check: '判定',
      oracle: '神谕',
      tide: '黑潮',
      reincarnation: '轮回',
      flame: '火种',
      action: '行动',
      rest: '休整',
      travel: '移动',
      past: '追忆',
      words: '灵感',
      obsession: '执念',
      system: '系统'
    }[t] || '事件'
  )
}
function tagClass(t) {
  if (t === 'reincarnation' || t === 'tide') return 'tag-tide'
  if (t === 'oracle' || t === 'flame') return 'tag-gold'
  if (t === 'check') return 'tag-mem'
  if (t === 'encounter') return 'tag-blood'
  return ''
}
function fmtTime(ts) {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function toggleScope() {
  scope.value = scope.value === 'current' ? 'archive' : 'current'
  filter.value = 'all'
}
function copyLog() {
  showExport.value = true
  uni.setClipboardData({
    data: exportText.value,
    success: () => actions.toast('已复制"如我所书"全文')
  })
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
.nav-right {
  display: flex;
  gap: 26rpx;
}
.nav-btn {
  font-size: 24rpx;
  color: var(--ink-3);
}
.nav-btn.gold {
  color: var(--gold);
}

.overview {
  display: flex;
}
.ov-item {
  flex: 1;
  text-align: center;
}
.ov-num {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}
.ov-label {
  display: block;
  font-size: 21rpx;
  color: var(--ink-3);
  margin-top: 4rpx;
}

.filters {
  white-space: nowrap;
}
.filter-row {
  display: flex;
  gap: 14rpx;
  padding-bottom: 6rpx;
}
.filter-chip {
  flex-shrink: 0;
  font-size: 23rpx;
  padding: 8rpx 26rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--line-soft);
  color: var(--ink-3);
  background: rgba(255, 255, 255, 0.03);
}
.filter-chip.on {
  color: var(--gold);
  border-color: rgba(242, 197, 114, 0.6);
  background: rgba(242, 197, 114, 0.12);
}

.tl-item {
  display: flex;
  gap: 20rpx;
}
.tl-rail {
  width: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.tl-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: var(--ink-3);
  border: 3rpx solid var(--bg-2);
  margin-top: 8rpx;
  box-shadow: 0 0 12rpx rgba(255, 255, 255, 0.2);
}
.tl-bar {
  flex: 1;
  width: 2rpx;
  background: linear-gradient(180deg, var(--line), transparent);
  margin-top: 6rpx;
}
.tl-reincarnation .tl-dot {
  background: var(--tide);
  box-shadow: 0 0 16rpx rgba(160, 95, 224, 0.9);
}
.tl-oracle .tl-dot,
.tl-flame .tl-dot {
  background: var(--gold);
  box-shadow: 0 0 14rpx rgba(242, 197, 114, 0.8);
}
.tl-check .tl-dot {
  background: var(--mem);
}
.tl-tide .tl-dot {
  background: var(--blood);
}
.tl-body {
  flex: 1;
  padding-bottom: 26rpx;
}
.tl-head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.tl-meta {
  font-size: 21rpx;
  color: var(--ink-3);
}
.tl-text {
  display: block;
  font-size: 26rpx;
  color: var(--ink-2);
  line-height: 1.75;
  margin-top: 8rpx;
}
.tl-time {
  display: block;
  font-size: 20rpx;
  color: var(--ink-3);
  margin-top: 6rpx;
}

.empty-box {
  text-align: center;
  padding: 80rpx 0;
}
.empty-ico {
  display: block;
  font-size: 70rpx;
  color: var(--gold);
  opacity: 0.6;
  margin-bottom: 20rpx;
}

.export-box {
  height: 420rpx;
  background: rgba(0, 0, 0, 0.35);
  border: 1rpx solid var(--line-soft);
  border-radius: 14rpx;
  padding: 22rpx;
  margin-top: 20rpx;
}
.export-text {
  font-size: 23rpx;
  color: var(--ink-2);
  line-height: 1.9;
  white-space: pre-wrap;
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