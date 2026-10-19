<template>
  <view class="page ending-page">
    <view class="navbar">
      <text class="navbar-back" @click="back">‹ 返回</text>
      <text class="navbar-title">结局</text>
      <text class="navbar-meta"></text>
    </view>

    <view v-if="!ending" class="section center" style="padding-top: 140rpx">
      <text class="dim">故事尚未收束。</text>
      <view class="btn btn-ghost" style="margin: 30rpx auto 0; width: 320rpx" @click="back">回到逐火</view>
    </view>

    <template v-else>
      <!-- 结局标题 -->
      <view class="section center">
        <view class="ending-ico">{{ endingEmoji }}</view>
        <text class="ending-name serif">{{ ending.name }}</text>
        <view class="ending-rule"></view>
        <text class="ending-plain">{{ ending.text }}</text>
        <view class="dice-row" style="margin-top: 30rpx" v-if="ending.dice">
          <view class="dice dice-anim" style="animation-delay: 0s">{{ ending.dice[0] }}</view>
          <view class="dice dice-anim" style="animation-delay: 0.15s">{{ ending.dice[1] }}</view>
          <view class="dice dice-total dice-anim" style="animation-delay: 0.3s">{{ ending.total }}</view>
        </view>
        <text class="sub" v-if="ending.dice">2d6 结算 · 档位区间 {{ ending.total && tierRange }}</text>
        <text class="sub" v-else>主动收束 · 未掷骰</text>
      </view>

      <!-- 结局正文 -->
      <view class="section" style="margin-top: 40rpx">
        <view class="panel">
          <text class="ending-detail serif">{{ ending.detail }}</text>
          <text class="ending-detail serif" v-if="ending.titanFlavor" style="margin-top: 14rpx; display: block; color: var(--gold)">{{
            ending.titanFlavor
          }}</text>
          <view class="rule"></view>
          <view class="kv"><text class="k">旅者</text><text class="v">{{ ending.character.name }} · {{ ending.character.identityName }}</text></view>
          <view class="kv"><text class="k">执念</text><text class="v">{{ ending.character.obsession || '（未写下）' }}</text></view>
          <view class="kv"><text class="k">火种</text><text class="v">{{ ending.character.flame }}/12</text></view>
          <view class="kv"><text class="k">同行者</text><text class="v">{{ ending.companions && ending.companions.length ? ending.companions.join('、') : '（独行的逐火者）' }}</text></view>
          <view class="kv"><text class="k">轮回次数</text><text class="v">{{ ending.reincarnation }} 次</text></view>
          <view class="kv"><text class="k">书写轮次</text><text class="v">{{ ending.historyCount }} 轮</text></view>
          <view class="kv oracle-kv"><text class="k gold">神谕</text><text class="v serif oracle-t">「{{ ending.character.oracle }}」</text></view>
        </view>
      </view>

      <!-- 神谕是否应验 -->
      <view class="section" style="margin-top: 26rpx">
        <view class="panel oracle-judge center">
          <text class="sub">神谕回望</text>
          <text class="judge-text serif">
            {{ judgeText }}
          </text>
        </view>
      </view>

      <!-- 操作 -->
      <view class="section" style="margin-top: 40rpx">
        <view class="btn btn-primary btn-block" @click="restart">再次逐火（新的轮回）</view>
        <view class="btn btn-ghost btn-block" style="margin-top: 18rpx" @click="goJournal">阅读冒险日志</view>
        <view class="btn btn-dim btn-block" style="margin-top: 18rpx" @click="goArchive">轮回档案</view>
        <view class="btn btn-dim btn-block" style="margin-top: 18rpx" @click="back">留在这个世界</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { G, actions } from '../../src/store.js'

const ending = computed(() => G.save.finished)

const endingEmoji = computed(() => ({
  eternal: '♾',
  echo: '◐',
  flame: '✦',
  aswritten: '✒'
}[ending.value ? ending.value.tier : ''] || '◈'))

const tierRange = computed(() => {
  const e = ending.value
  if (!e || !e.total) return ''
  const map = { eternal: '2-4', echo: '5-7', flame: '8-10', aswritten: '11-12' }
  return map[e.tier]
})

const judgeText = computed(() => {
  const e = ending.value
  if (!e) return ''
  const text = e.character.oracle || ''
  if (e.tier === 'aswritten')
    return `「${text}」——神谕被你亲手改写，或者说，它等的正是此刻。`
  if (e.tier === 'eternal')
    return `「${text}」——预言指向下一个循环。你还未抵达终点，只是再一次出发。`
  if (e.tier === 'flame')
    return `「${text}」——你的记忆成为火种，神谕在火光中被读完了。`
  return `「${text}」——它应验了一半，剩下一半留给了读到你故事的人。`
})

function back() {
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/game/index' }) })
}
function goJournal() {
  uni.switchTab({ url: '/pages/journal/index' })
}
function goArchive() {
  uni.switchTab({ url: '/pages/archive/index' })
}
function restart() {
  actions.hardReset()
  uni.navigateTo({ url: '/pages/onboard/index' })
}
onLoad(() => {})
</script>

<style scoped>
.ending-page {
  min-height: 100vh;
}
.ending-ico {
  font-size: 96rpx;
  color: var(--gold);
  filter: drop-shadow(0 0 24rpx rgba(242, 197, 114, 0.6));
}
.ending-name {
  display: block;
  font-size: 72rpx;
  font-weight: 700;
  letter-spacing: 16rpx;
  color: var(--gold);
  margin-top: 16rpx;
  text-shadow: 0 0 40rpx rgba(242, 197, 114, 0.45);
}
.ending-rule {
  width: 260rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  margin: 26rpx auto;
}
.ending-plain {
  display: block;
  font-size: 29rpx;
  color: var(--ink-2);
  line-height: 1.8;
}
.ending-detail {
  display: block;
  font-size: 30rpx;
  color: #f6e6c6;
  line-height: 2;
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
.oracle-t {
  color: #f6e6c6;
}
.oracle-judge {
  padding: 34rpx 26rpx;
}
.judge-text {
  display: block;
  font-size: 27rpx;
  color: var(--ink-2);
  line-height: 1.9;
  margin-top: 14rpx;
}
</style>