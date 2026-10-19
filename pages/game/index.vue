<template>
  <view class="page">
    <!-- 自定义导航 -->
    <view class="navbar">
      <text class="nav-brand">翁法罗斯</text>
      <view class="nav-right">
        <text class="nav-meta" @click="goCodex">图鉴</text>
        <text class="nav-meta" @click="openArchiveModal">轮回 {{ reincarnation }}</text>
        <text class="nav-meta gold" @click="toggleStat">状态</text>
      </view>
    </view>

    <!-- 未创建角色：引导 -->
    <view v-if="!ready" class="section empty">
      <view class="panel center">
        <text class="h2 serif">权杖正在等一个名字</text>
        <view class="rule"></view>
        <text class="dim block-text">
          翁法罗斯，别称"永恒之地"，本质是星体计算机"帝皇权杖δ-me13"运行的模拟世界。
          十二泰坦编织命运，黑潮侵蚀大地，黄金裔背负火种，踏上逐火之旅。
        </text>
        <view class="btn btn-primary btn-block" style="margin-top: 40rpx" @click="goOnboard">
          踏上逐火之旅
        </view>
        <text class="sub" style="display: block; margin-top: 24rpx">
          角色卡 · 记忆判定 · 轮回机制 · Oracle · 结局生成
        </text>
      </view>
    </view>

    <template v-else>
      <!-- 角色状态卡 -->
      <view class="section">
        <view class="panel stat-panel" :class="{ 'panel-danger': tideDanger }">
          <view class="stat-head">
            <view>
              <text class="h3">{{ ch.name }}</text>
              <text class="tag tag-gold" style="margin-left: 14rpx">{{
                ch.identityName
              }}</text>
              <text class="tag tag-mem" style="margin-left: 8rpx">{{ ch.pathName }}</text>
            </view>
            <text class="sub">第 {{ turn + 1 }} 轮</text>
          </view>

          <view class="stat-grid">
            <view class="stat-item">
              <view class="stat-row">
                <text class="stat-label mem">记忆值</text>
                <text class="stat-num mem">{{ ch.memory }}/10</text>
              </view>
              <view class="stat-bar">
                <view class="stat-fill fill-mem" :style="{ width: (ch.memory / 10) * 100 + '%' }"></view>
              </view>
            </view>

            <view class="stat-item">
              <view class="stat-row">
                <text class="stat-label gold">火种</text>
                <text class="stat-num gold">{{ ch.flame }}/12</text>
              </view>
              <view class="stat-bar">
                <view class="stat-fill fill-flame" :style="{ width: (ch.flame / 12) * 100 + '%' }"></view>
              </view>
              <!-- 十二泰坦火种槽位 -->
              <view class="titan-grid">
                <view
                  v-for="t in titanSlots"
                  :key="t.id"
                  class="titan-slot"
                  :class="{ owned: t.owned }"
                  @click="openTrial(t)"
                >
                  <text class="titan-domain">{{ t.owned ? t.domain : '·' }}</text>
                </view>
              </view>
              <text class="hint-line" @click="openTrial(null)">点击槽位发起泰坦试炼 →</text>
            </view>

            <view class="stat-item">
              <view class="stat-row">
                <text class="stat-label tide">黑潮侵蚀</text>
                <text class="stat-num" :class="tideDanger ? 'tide blink' : 'tide'"
                  >{{ ch.tide }}/10</text
                >
              </view>
              <view class="stat-bar">
                <view
                  class="stat-fill fill-tide"
                  :style="{ width: (ch.tide / 10) * 100 + '%' }"
                ></view>
              </view>
              <text class="tide-stage" :class="'stage-' + tideStage.tone"
                >【{{ tideStage.name }}】{{ tideStage.text }}</text
              >
              <text v-if="tideCritical" class="warning">临界：此后每次行动侵蚀自动 +1</text>
              <text v-else class="hint-line">侵蚀 ≥{{ tideThreshold }} 进入临界；=10 触发轮回</text>
            </view>
          </view>

          <!-- 展开的状态明细 -->
          <view v-if="statOpen" class="stat-detail fade-in">
            <view class="rule"></view>
            <view class="kv"><text class="k">命途</text><text class="v">{{ ch.pathName }}</text></view>
            <view class="kv"><text class="k">属性</text><text class="v">{{ attrText }}</text></view>
            <view class="kv"><text class="k">执念</text><text class="v">{{ ch.obsession || '（未写下）' }}</text></view>
            <view class="kv">
              <text class="k">记忆碎片</text>
              <text class="v">{{ ch.fragments.length }} 枚</text>
            </view>
            <view class="kv">
              <text class="k">同行者</text>
              <text class="v">{{ companionText }}</text>
            </view>
            <view class="kv">
              <text class="k gold">神权恩泽</text>
              <text class="v gold">{{ boonText }}</text>
            </view>
            <view class="kv oracle-kv">
              <text class="k gold">神谕</text>
              <text class="v serif oracle-text">「{{ ch.oracle }}」</text>
            </view>
            <view class="kv">
              <text class="k">身份洞察</text>
              <text class="v">{{ insightText }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 场景卡 -->
      <view class="section" v-if="scene">
        <view class="section-title"><text class="h2">当前场景</text></view>
        <view class="panel scene-panel">
          <view class="scene-head">
            <text class="scene-name serif">{{ scene.location.name }}</text>
            <text class="tag tag-tide">{{ scene.location.vibe }}</text>
          </view>
          <text class="scene-text">{{ scene.location.scene }}</text>
          <view class="rule"></view>
          <view class="scene-detail">
            <text class="sub gold">场景细节</text>
            <text class="scene-text">{{ scene.location.prompt }}</text>
          </view>
          <view v-if="scene.encounter" class="enc-box">
            <text class="tag tag-blood">{{ scene.encounter.tag }}</text>
            <text class="enc-name">遭遇 · {{ scene.encounter.name }}</text>
            <text class="scene-text" style="margin-top: 8rpx">{{ scene.encounter.text }}</text>
            <text class="enc-action">{{ scene.encounter.action }}</text>
          </view>
          <view v-if="words" class="words-line">
            <text class="sub">灵感词：</text>
            <text class="tag tag-gold">{{ words.action }}</text>
            <text class="sub"> × </text>
            <text class="tag tag-gold">{{ words.theme }}</text>
          </view>
          <!-- 同行者 chips -->
          <view v-if="companions.length" class="comp-line">
            <text class="sub">同行：</text>
            <text v-for="c in companions" :key="c.id" class="tag tag-mem comp-chip" :title="c.perkText"
              >{{ c.name }}·{{ c.domain }}</text
            >
          </view>
        </view>

        <!-- 黄金裔邂逅 -->
        <view class="panel heir-panel fade-in" v-if="heirMeet">
          <text class="tag tag-gold">邂逅 · {{ heirMeet.title }}</text>
          <text class="enc-name serif">{{ heirMeet.name }}</text>
          <text class="scene-text" style="margin-top: 8rpx">{{ heirMeet.meetText }}</text>
          <text class="enc-action">{{ heirMeet.joinLine }}</text>
          <view class="heir-btns">
            <view class="btn btn-primary" style="flex: 1" @click="onInviteHeir">邀请同行</view>
            <view class="btn btn-dim" style="flex: 1" @click="onDeclineHeir">婉拒</view>
          </view>
          <text class="hint-line">结伴后获得永续同伴加成：{{ heirMeet.perkText }}</text>
        </view>
      </view>

      <!-- 骰子结果 -->
      <view class="section" v-if="diceVisible">
        <view class="panel dice-panel center fade-in">
          <text class="sub">{{ diceTitle }}</text>
          <view class="dice-row" style="margin-top: 16rpx">
            <view
              v-for="(d, i) in uiDice"
              :key="i"
              class="dice dice-anim"
              :class="diceClass"
              :style="{ animationDelay: i * 0.12 + 's' }"
              >{{ d }}</view
            >
          </view>
          <text v-if="showTotal" class="dice-sum">{{ diceSumText }}</text>
          <!-- 轮回的馈赠：碎片重掷 -->
          <view v-if="rerollable" class="reroll-box fade-in">
            <text class="reroll-tip">轮回的馈赠：可用一枚记忆碎片改写这次失败</text>
            <view class="reroll-btns">
              <view class="btn btn-primary reroll-btn" @click="onReroll">
                {{ rerollFree ? '时之回溯 · 免费重掷' : '消耗碎片重掷' }}
              </view>
              <view class="btn btn-dim reroll-btn" @click="skipReroll">接受结果</view>
            </view>
          </view>
          <!-- 赛飞儿：黑潮重掷 -->
          <view v-if="tideRerollable" class="reroll-box fade-in">
            <text class="reroll-tip">赛飞儿抛了抛眉："这把不算，我帮你换一个骰面？"</text>
            <view class="reroll-btns">
              <view class="btn btn-primary reroll-btn" @click="onRerollTide">重掷黑潮检定</view>
              <view class="btn btn-dim reroll-btn" @click="skipRerollTide">不用了</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 会话叙述 -->
      <view class="section">
        <view class="section-title"><text class="h2">冒险日志 · 当前会话</text></view>
        <scroll-view scroll-y class="feed" :scroll-into-view="scrollInto" scroll-with-animation>
          <view
            v-for="m in session"
            :key="m.id"
            :id="'msg-' + m.id"
            class="msg"
            :class="'msg-' + m.kind"
          >
            <view class="msg-tag" v-if="m.tag">{{ m.tag }}</view>
            <text
              class="msg-text"
              :class="{ 'msg-text-serif': m.kind === 'oracle' }"
              >{{ m.text }}</text
            >
          </view>
        </scroll-view>
      </view>

      <!-- 建议行动 -->
      <view class="section">
        <view class="section-title"><text class="h2">你可以</text></view>
        <view
          v-for="(s, i) in suggestions"
          :key="i"
          class="choice"
          @click="onSuggestion(s)"
        >
          <text class="choice-idx">{{ '①②③'[i] || i + 1 }}</text>
          <text class="choice-text">{{ s.text }}</text>
          <text class="tag tag-mem" v-if="s.attr">{{ attrName(s.attr) }}+1</text>
        </view>
      </view>

      <!-- 自由输入 -->
      <view class="section">
        <view class="free-box">
          <textarea
            class="textarea"
            v-model="freeText"
            :maxlength="120"
            placeholder="自由描述你想做的事……"
            placeholder-class="ph"
            auto-height
          />
          <view class="free-attr">
            <text
              v-for="a in attrOptions"
              :key="a.id"
              class="attr-chip"
              :class="{ active: freeAttr === a.id }"
              @click="freeAttr = freeAttr === a.id ? '' : a.id"
              >{{ a.name }}{{ ch.attrs[a.id] > 0 ? '+1' : '' }}</text
            >
          </view>
          <view class="btn btn-primary btn-block" @click="submitFree">执行行动</view>
        </view>
      </view>

      <!-- 快捷行动 -->
      <view class="section">
        <view class="action-grid">
          <view class="act-btn" @click="openOracle">
            <text class="act-ico">◈</text><text class="act-name">Oracle</text>
            <text class="act-desc">向权杖提问</text>
          </view>
          <view class="act-btn" @click="doTravel">
            <text class="act-ico">➤</text><text class="act-name">移动</text>
            <text class="act-desc">前往新场景</text>
          </view>
          <view class="act-btn" @click="doRest">
            <text class="act-ico">☾</text><text class="act-name">休整</text>
            <text class="act-desc">记忆 +1</text>
          </view>
          <view class="act-btn" @click="doPast">
            <text class="act-ico">◉</text><text class="act-name">追忆</text>
            <text class="act-desc">读取旧影像</text>
          </view>
          <view class="act-btn" @click="doWords">
            <text class="act-ico">✎</text><text class="act-name">灵感</text>
            <text class="act-desc">抽随机词</text>
          </view>
          <view class="act-btn" @click="openTrial(null)">
            <text class="act-ico">✦</text><text class="act-name">试炼</text>
            <text class="act-desc">泰坦火种</text>
          </view>
          <view class="act-btn" @click="tideRoll">
            <text class="act-ico">◐</text><text class="act-name">黑潮</text>
            <text class="act-desc">手动检定</text>
          </view>
          <view class="act-btn act-finish" @click="askFinish">
            <text class="act-ico">✒</text><text class="act-name">如我所书</text>
            <text class="act-desc">收束故事</text>
          </view>
        </view>
      </view>

      <!-- 结束条件提示 -->
      <view class="section" v-if="endHints.length">
        <view class="panel panel-tight end-hint">
          <text class="tag tag-gold">可结束</text>
          <text v-for="(e, i) in endHints" :key="i" class="end-text">{{ e.text }}</text>
        </view>
      </view>

      <!-- 执念达成入口 -->
      <view class="section" v-if="ch.obsession && !ch.obsessionDone">
        <view class="btn btn-ghost btn-block" @click="markObsession">我的执念已达成</view>
      </view>
    </template>

    <!-- Oracle 弹层 -->
    <view class="mask" v-if="modal === 'oracle'" @click.self="closeModal">
      <view class="sheet">
        <text class="h2">Oracle · 记忆回响</text>
        <text class="sub" style="display: block; margin-top: 8rpx">
          对世界提出一个问题，掷 1d6 得到回响
        </text>
        <view class="rule"></view>
        <textarea
          class="textarea"
          v-model="question"
          :maxlength="60"
          placeholder="例如：这一次轮回，我还活着吗？"
          placeholder-class="ph"
          auto-height
        />
        <view class="field-label">可能性调整</view>
        <view class="adj-row">
          <text
            v-for="a in [-1, 0, 1]"
            :key="a"
            class="attr-chip"
            :class="{ active: adj === a }"
            @click="adj = a"
            >{{ a > 0 ? '+' + a : a }} {{ a === 0 ? '常规' : a > 0 ? '很可能' : '极不可能' }}</text
          >
        </view>
        <view class="btn btn-primary btn-block" style="margin-top: 30rpx" @click="submitOracle">
          掷骰求问
        </view>
        <view class="btn btn-dim btn-block" style="margin-top: 16rpx" @click="closeModal">取消</view>
      </view>
    </view>

    <!-- 轮回档案弹层 -->
    <view class="mask" v-if="modal === 'archive'" @click.self="closeModal">
      <view class="sheet">
        <text class="h2">轮回记录</text>
        <view class="rule"></view>
        <view class="kv"><text class="k">轮回次数</text><text class="v">{{ reincarnation }}</text></view>
        <view class="kv"><text class="k">记忆碎片</text><text class="v">{{ fragments.length }} 枚</text></view>
        <view class="kv"><text class="k">已进行轮次</text><text class="v">{{ turn }}</text></view>
        <view class="kv"><text class="k">历史结局</text><text class="v">{{ endings.length }} 个</text></view>
        <view v-if="fragments.length" class="frag-list">
          <view v-for="f in fragments.slice().reverse()" :key="f.id" class="frag-item">
            <text class="tag tag-mem">{{ f.label }}</text>
            <text class="frag-note">{{ f.note }}</text>
          </view>
        </view>
        <view v-else class="dim center" style="padding: 30rpx 0">
          还没有碎片——你尚未经历轮回，或你注定与众不同。
        </view>
        <view class="btn btn-ghost btn-block" style="margin-top: 20rpx" @click="goArchive">查看完整档案</view>
        <view class="btn btn-dim btn-block" style="margin-top: 16rpx" @click="closeModal">关闭</view>
      </view>
    </view>

    <!-- 结束确认 -->
    <view class="mask" v-if="modal === 'finish'" @click.self="closeModal">
      <view class="sheet center">
        <text class="h2 serif">写下"如我所书"？</text>
        <text class="dim block-text" style="margin-top: 16rpx">
          为故事画上句号。系统将掷 2d6 生成结局类型；也可选择放弃掷骰，
          直接以「如我所书」收束。
        </text>
        <view class="btn btn-primary btn-block" style="margin-top: 30rpx" @click="finishWithRoll">
          掷 2d6 生成结局
        </view>
        <view class="btn btn-ghost btn-block" style="margin-top: 16rpx" @click="finishManual">
          直接写下"如我所书"
        </view>
        <view class="btn btn-dim btn-block" style="margin-top: 16rpx" @click="closeModal">再想想</view>
      </view>
    </view>

    <!-- 泰坦试炼弹层 -->
    <view class="mask" v-if="modal === 'trial'" @click.self="closeModal">
      <view class="sheet trial-sheet">
        <text class="h2 serif">十二泰坦试炼</text>
        <text class="sub" style="display: block; margin-top: 8rpx">
          逐火之旅的终点，是十二神权的认可。选择一位泰坦，接受祂的试炼。
        </text>
        <view class="rule"></view>
        <!-- 泰坦选择网格 -->
        <view class="trial-grid">
          <view
            v-for="t in TITAN_FLAMES"
            :key="t.id"
            class="trial-card"
            :class="{ owned: ch.titans && ch.titans.includes(t.id), active: trialTitan && trialTitan.id === t.id }"
            @click="pickTrial(t)"
          >
            <text class="trial-domain">{{ t.domain }}</text>
            <text class="trial-name">{{ t.name }}</text>
          </view>
        </view>
        <!-- 选中试炼详情 -->
        <view v-if="trialTitan" class="trial-detail fade-in">
          <view class="kv">
            <text class="k gold">试炼</text>
            <text class="v">记忆判定（{{ attrName(trialTitan.trialAttr) }}{{ ch.attrs && ch.attrs[trialTitan.trialAttr] > 0 ? '+1' : '' }}）</text>
          </view>
          <text class="trial-text">{{ trialTitan.trialText }}</text>
          <text class="enc-action">{{ trialTitan.trialAsk }}</text>
          <view class="kv" style="margin-top: 14rpx">
            <text class="k gold">神权恩泽</text>
            <text class="v gold">{{ trialTitan.boonText }}</text>
          </view>
          <text class="hint-line">
            完全成功得火种无代价；部分成功得火种但侵蚀+1{{ hasTalanton ? '（天秤已免除）' : '' }}；失败记忆受损且侵蚀+1，本轮回不可再试。
          </text>
          <view
            class="btn btn-primary btn-block"
            style="margin-top: 20rpx"
            :class="{ 'btn-dim': ch.titans && ch.titans.includes(trialTitan.id) }"
            @click="submitTrial"
          >
            {{ ch.titans && ch.titans.includes(trialTitan.id) ? '火种已在手中' : '接受试炼' }}
          </view>
        </view>
        <view v-else class="dim center" style="padding: 26rpx 0">
          已点亮 {{ (ch.titans || []).length }}/12 · 点击上方泰坦查看试炼
        </view>
        <view class="btn btn-dim btn-block" style="margin-top: 16rpx" @click="closeModal">离开圣殿</view>
      </view>
    </view>

    <!-- Toast -->
    <view class="toast" v-if="toast">{{ toast.text }}</view>
  </view>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { onShow, onLaunch } from '@dcloudio/uni-app'
import { G, actions } from '../../src/store.js'
import { ATTRS, SUGGESTIONS, RULES_BOOK, TITAN_FLAMES, HEIRS, tideStageOf } from '../../src/tables.js'
import * as E from '../../src/engine.js'

const freeText = ref('')
const freeAttr = ref('')
const question = ref('')
const adj = ref(0)
const statOpen = ref(false)
const scrollInto = ref('')
const trialTitan = ref(null)

/* ---- computed ---- */
const save = computed(() => G.save)
const ready = computed(() => !!G.save.created && !!G.save.character)
const ch = computed(() => G.save.character || {})
const scene = computed(() => G.save.scene)
const session = computed(() => G.save.session)
const suggestions = computed(() => G.save.suggestions || [])
const words = computed(() => G.save.scene && G.save.scene.words)
const turn = computed(() => G.save.turn)
const reincarnation = computed(() => G.save.reincarnation)
const fragments = computed(() => (ch.value.fragments || []))
const endings = computed(() => G.archive.endings)
const toast = computed(() => G.ui.toast)
const modal = computed(() => G.ui.modal)
const uiDice = computed(() => G.ui.dice)
const attrOptions = ATTRS
const tideDanger = computed(() => (ch.value.tide || 0) >= 8)

/* ---- 泰坦火种 / 同行者 ---- */
const titanSlots = computed(() =>
  TITAN_FLAMES.map((t) => ({
    id: t.id,
    domain: t.domain,
    name: t.name,
    owned: (ch.value.titans || []).includes(t.id)
  }))
)
const companions = computed(() =>
  (ch.value.companions || [])
    .map((id) => HEIRS.find((h) => h.id === id))
    .filter(Boolean)
)
const companionText = computed(() =>
  companions.value.length ? companions.value.map((c) => c.name).join('、') : '（独行中——邂逅黄金裔可结伴）'
)
const boonText = computed(() => {
  const list = (ch.value.titans || [])
    .map((id) => TITAN_FLAMES.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => t.boonText)
  return list.length ? list.join('；') : '（尚未点亮任何神权）'
})
const hasTalanton = computed(() => E.hasBoon(ch.value, 'trialNoTide'))
const heirMeet = computed(() => scene.value && scene.value.heirMeet)
const tideStage = computed(() => tideStageOf(ch.value.tide || 0))
const tideThreshold = computed(() => E.tideAutoThreshold(ch.value))
const tideCritical = computed(() => (ch.value.tide || 0) >= tideThreshold.value)
const rerollable = computed(() => G.save.rerollable)
const rerollFree = computed(() => E.isRerollFree(ch.value))
const tideRerollable = computed(() => G.save.tideRerollable)

const diceVisible = computed(() => uiDice.value && uiDice.value.length > 0)
const diceTitle = computed(() => {
  const ck = G.save.lastCheck
  if (ck) return `记忆判定 ${ck.dice.join(' + ')} + ${ck.modifier} = ${ck.total}`
  if (G.save.lastOracle) return `Oracle 1d6`
  if (G.save.lastTide) return `黑潮检定 1d6`
  return '掷骰'
})
const diceClass = computed(() => {
  if (G.save.lastTide) return 'dice-tide'
  if (G.save.lastOracle) return ''
  return 'dice-mem'
})
const showTotal = computed(() => !!(G.save.lastCheck && G.save.lastCheck.dice))
const diceSumText = computed(() => {
  const ck = G.save.lastCheck
  if (!ck) return ''
  const tier = ck.tier === 'full' ? '完全成功' : ck.tier === 'partial' ? '部分成功' : '失败'
  return `${ck.total} · ${tier}`
})

const attrText = computed(() => {
  const c = ch.value
  if (!c.attrs) return ''
  return ATTRS.map((a) => `${a.name} +${c.attrs[a.id] || 0}`).join('　')
})

const insightText = computed(() => {
  const map = {
    oracle: '神谕感知：Oracle 掷骰视为 +1',
    steady: '记忆稳定：不受轮回束缚，记忆归零时稳定于 5',
    past: '读取过去：进入新场景可免费追忆（不触发黑潮）',
    tide: '感知黑潮：可规避极端黑潮（1d6=1 时无效）'
  }
  return map[ch.value.insight] || '无'
})

const endHints = computed(() => {
  if (!ready.value) return []
  return E.checkEndConditions(ch.value)
})

/* 消息滚动到底 */
watch(
  () => session.value.length,
  async () => {
    await nextTick()
    const last = session.value[session.value.length - 1]
    if (last) scrollInto.value = 'msg-' + last.id
  }
)

/* ---- actions ---- */
function onSuggestion(s) {
  if (s.kind === 'oracle') return openOracle()
  if (s.kind === 'travel') return doTravel()
  if (s.kind === 'rest') return doRest()
  if (s.kind === 'past') return doPast()
  freeText.value = s.text
  freeAttr.value = s.attr || ''
  submitFree()
}

function submitFree() {
  const text = freeText.value.trim()
  if (!text) {
    actions.toast('先写下你想做的事')
    return
  }
  actions.freeAction(text, freeAttr.value || null)
  freeText.value = ''
  freeAttr.value = ''
}

function openOracle() {
  G.ui.modal = 'oracle'
}
function closeModal() {
  actions.closeModal()
}
function submitOracle() {
  const q = question.value.trim()
  actions.doOracle(q || undefined, adj.value)
  question.value = ''
  adj.value = 0
  actions.closeModal()
}

function doTravel() {
  actions.travel()
  actions.toast('抵达新场景')
}
function doRest() {
  actions.rest()
}
function doPast() {
  actions.readPast()
}
function doWords() {
  actions.drawWords()
}

/* ---- 泰坦试炼 ---- */
function openTrial(t) {
  trialTitan.value = t && TITAN_FLAMES.find((x) => x.id === t.id) ? t : null
  G.ui.modal = 'trial'
}
function pickTrial(t) {
  trialTitan.value = t
}
function submitTrial() {
  const t = trialTitan.value
  if (!t) return
  if ((ch.value.titans || []).includes(t.id)) {
    actions.toast('这位泰坦的火种已在你手中')
    return
  }
  if ((G.save.failedTrials || []).includes(t.id)) {
    actions.toast('本轮回中，祂已收回注视')
    return
  }
  actions.doTrial(t.id)
  if (ch.value.flame >= 12) {
    actions.toast('十二枚火种齐聚——再创世已可触发！', 2600)
    actions.closeModal()
  } else if (ch.value.titans && ch.value.titans.includes(t.id)) {
    actions.toast(`「${t.domain}」神权恩泽已生效`, 2400)
  }
}

/* ---- 黄金裔结伴 ---- */
function onInviteHeir() {
  actions.inviteHeir()
}
function onDeclineHeir() {
  actions.declineHeir()
}

/* ---- 重掷 ---- */
function onReroll() {
  actions.rerollCheck()
}
function skipReroll() {
  G.save.rerollable = null
}
function onRerollTide() {
  actions.rerollTide()
}
function skipRerollTide() {
  G.save.tideRerollable = false
  actions.persist()
}

function tideRoll() {
  actions.doTideCheck()
}
function markObsession() {
  actions.markObsessionDone()
  actions.toast('执念已了，可以收束故事了', 2400)
}

function askFinish() {
  G.ui.modal = 'finish'
}
function finishWithRoll() {
  actions.closeModal()
  const ending = actions.finish(false)
  if (ending) uni.navigateTo({ url: '/pages/ending/index' })
}
function finishManual() {
  actions.closeModal()
  const ending = actions.finish(true)
  if (ending) uni.navigateTo({ url: '/pages/ending/index' })
}

function openArchiveModal() {
  G.ui.modal = 'archive'
}
function goOnboard() {
  uni.navigateTo({ url: '/pages/onboard/index' })
}
function goArchive() {
  actions.closeModal()
  uni.switchTab({ url: '/pages/archive/index' })
}
function goCodex() {
  uni.switchTab({ url: '/pages/codex/index' })
}
function toggleStat() {
  statOpen.value = !statOpen.value
}
function attrName(id) {
  const a = ATTRS.find((x) => x.id === id)
  return a ? a.name : id
}

onShow(() => {
  actions.migrate()
})
</script>

<style scoped>
.nav-brand {
  font-size: 34rpx;
  letter-spacing: 8rpx;
  color: var(--gold);
  font-weight: 700;
}
.nav-right {
  display: flex;
  gap: 28rpx;
}
.nav-meta {
  font-size: 24rpx;
  color: var(--ink-3);
  letter-spacing: 2rpx;
}
.empty {
  padding-top: 120rpx;
}
.block-text {
  display: block;
  font-size: 26rpx;
  color: var(--ink-2);
  line-height: 1.9;
  text-align: left;
  margin-top: 16rpx;
}

.stat-panel.panel-danger {
  border-color: rgba(255, 93, 108, 0.5);
}
.stat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22rpx;
}
.stat-grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6rpx;
}
.stat-label {
  font-size: 23rpx;
  letter-spacing: 3rpx;
}
.stat-num {
  font-size: 24rpx;
  font-weight: 700;
}
.stat-num.blink {
  color: var(--blood);
  animation: blink-a 1.1s ease-in-out infinite;
}
@keyframes blink-a {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
.warning {
  display: block;
  font-size: 21rpx;
  color: var(--blood);
  margin-top: 6rpx;
}
.hint-line {
  display: block;
  font-size: 20rpx;
  color: var(--ink-3);
  margin-top: 6rpx;
}

/* ---- 十二泰坦火种槽位 ---- */
.titan-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8rpx;
  margin-top: 12rpx;
}
.titan-slot {
  height: 56rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid var(--line-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.titan-slot .titan-domain {
  font-size: 20rpx;
  color: var(--ink-3);
}
.titan-slot.owned {
  background: linear-gradient(135deg, rgba(242, 197, 114, 0.28), rgba(242, 197, 114, 0.1));
  border-color: rgba(242, 197, 114, 0.55);
  box-shadow: 0 0 10rpx rgba(242, 197, 114, 0.25);
}
.titan-slot.owned .titan-domain {
  color: var(--gold);
  font-weight: 600;
}

/* ---- 黑潮阶段 ---- */
.tide-stage {
  display: block;
  font-size: 20rpx;
  margin-top: 6rpx;
  line-height: 1.5;
}
.tide-stage.stage-far {
  color: var(--ink-3);
}
.tide-stage.stage-near {
  color: #d9a441;
}
.tide-stage.stage-crisis {
  color: var(--blood);
}
.tide-stage.stage-doom {
  color: var(--blood);
  font-weight: 700;
  animation: blink 1.4s ease-in-out infinite;
}

/* ---- 同行者 chips ---- */
.comp-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx;
  margin-top: 14rpx;
}
.comp-chip {
  font-size: 20rpx;
}

/* ---- 黄金裔邂逅 ---- */
.heir-panel {
  margin-top: 16rpx;
  border: 1rpx solid rgba(242, 197, 114, 0.35);
}
.heir-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
}

/* ---- 重掷 ---- */
.reroll-box {
  margin-top: 18rpx;
  padding: 16rpx;
  border: 1rpx dashed rgba(242, 197, 114, 0.5);
  border-radius: 12rpx;
  background: rgba(242, 197, 114, 0.06);
}
.reroll-tip {
  display: block;
  font-size: 21rpx;
  color: var(--gold);
  line-height: 1.5;
}
.reroll-btns {
  display: flex;
  gap: 14rpx;
  margin-top: 14rpx;
}
.reroll-btn {
  flex: 1;
}

/* ---- 泰坦试炼弹层 ---- */
.trial-sheet {
  max-height: 82vh;
  overflow-y: auto;
}
.trial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-top: 6rpx;
}
.trial-card {
  border: 1rpx solid var(--line-soft);
  border-radius: 12rpx;
  padding: 14rpx 8rpx;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
}
.trial-card .trial-domain {
  display: block;
  font-size: 19rpx;
  color: var(--ink-3);
}
.trial-card .trial-name {
  display: block;
  font-size: 25rpx;
  color: var(--ink);
  margin-top: 4rpx;
}
.trial-card.owned {
  border-color: rgba(242, 197, 114, 0.55);
  background: rgba(242, 197, 114, 0.1);
}
.trial-card.owned .trial-name {
  color: var(--gold);
}
.trial-card.active {
  border-color: var(--gold);
  box-shadow: 0 0 14rpx rgba(242, 197, 114, 0.35);
}
.trial-detail {
  margin-top: 18rpx;
  padding-top: 4rpx;
}
.trial-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--ink-2);
  margin-top: 10rpx;
}
.trial-detail .enc-action {
  display: block;
  margin-top: 8rpx;
}
.stat-detail {
  margin-top: 6rpx;
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
.oracle-kv .oracle-text {
  color: #f6e6c6;
  font-size: 27rpx;
}

.scene-panel {
  background: linear-gradient(155deg, rgba(43, 31, 72, 0.9), rgba(16, 11, 30, 0.94));
}
.scene-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 14rpx;
}
.scene-name {
  font-size: 34rpx;
  color: var(--gold);
  font-weight: 700;
}
.scene-text {
  display: block;
  font-size: 26rpx;
  color: var(--ink-2);
  line-height: 1.85;
}
.scene-detail {
  margin-bottom: 6rpx;
}
.enc-box {
  margin-top: 14rpx;
  padding: 20rpx;
  background: rgba(255, 93, 108, 0.07);
  border: 1rpx solid rgba(255, 93, 108, 0.25);
  border-radius: 14rpx;
}
.enc-name {
  font-size: 27rpx;
  color: var(--ink);
  font-weight: 600;
  margin-left: 14rpx;
}
.enc-action {
  display: block;
  font-size: 25rpx;
  color: var(--ember);
  margin-top: 12rpx;
  line-height: 1.7;
}
.words-line {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.dice-panel {
  padding: 30rpx 20rpx;
}
.dice-sum {
  display: block;
  margin-top: 18rpx;
  font-size: 30rpx;
  color: var(--gold);
  font-weight: 700;
  letter-spacing: 3rpx;
}

.feed {
  height: 460rpx;
  padding-right: 8rpx;
}

.free-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid var(--line-soft);
  border-radius: 18rpx;
  padding: 22rpx;
}
.ph {
  color: var(--ink-3);
}
.free-attr {
  display: flex;
  gap: 14rpx;
  margin: 16rpx 0 18rpx;
  flex-wrap: wrap;
}
.attr-chip {
  font-size: 23rpx;
  padding: 8rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--line-soft);
  color: var(--ink-3);
  background: rgba(255, 255, 255, 0.03);
}
.attr-chip.active {
  color: var(--mem);
  border-color: rgba(127, 212, 255, 0.6);
  background: rgba(127, 212, 255, 0.12);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14rpx;
}
.act-btn {
  background: rgba(255, 255, 255, 0.045);
  border: 1rpx solid var(--line-soft);
  border-radius: 16rpx;
  padding: 18rpx 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.act-btn:active {
  background: rgba(242, 197, 114, 0.12);
  border-color: rgba(242, 197, 114, 0.45);
}
.act-ico {
  font-size: 34rpx;
  color: var(--gold);
}
.act-name {
  font-size: 24rpx;
  color: var(--ink);
  font-weight: 600;
}
.act-desc {
  font-size: 19rpx;
  color: var(--ink-3);
}
.act-finish {
  border-color: rgba(242, 197, 114, 0.45);
}
.act-finish .act-ico {
  color: var(--ember);
}

.end-hint {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  border-color: rgba(242, 197, 114, 0.5);
}
.end-text {
  font-size: 24rpx;
  color: var(--ink-2);
}

.adj-row {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}
.frag-list {
  margin-top: 20rpx;
}
.frag-item {
  padding: 16rpx 0;
  border-bottom: 1rpx dashed var(--line-soft);
}
.frag-note {
  display: block;
  font-size: 24rpx;
  color: var(--ink-2);
  margin-top: 8rpx;
  line-height: 1.7;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 160rpx;
  transform: translateX(-50%);
  background: rgba(20, 14, 36, 0.96);
  border: 1rpx solid rgba(242, 197, 114, 0.5);
  color: var(--gold);
  font-size: 26rpx;
  padding: 18rpx 40rpx;
  border-radius: 999rpx;
  z-index: 200;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.6);
}
</style>