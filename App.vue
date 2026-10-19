<script>
import { loadGame, saveGame, migrate } from './src/store.js'

export default {
  onLaunch() {
    migrate()
    loadGame()
  },
  onShow() {},
  onHide() {}
}
</script>

<style>
/* ============ 翁法罗斯 · 设计系统 ============ */
page {
  --bg-0: #0b0714;
  --bg-1: #120c20;
  --bg-2: #1a1230;
  --bg-3: #241a3d;
  --line: rgba(242, 197, 114, 0.16);
  --line-soft: rgba(255, 255, 255, 0.07);
  --gold: #f2c572;
  --gold-deep: #d99b3f;
  --gold-glow: rgba(242, 197, 114, 0.35);
  --mem: #7fd4ff;
  --mem-deep: #3f9bd4;
  --ember: #ff8a4c;
  --ember-deep: #e2592a;
  --tide: #a05fe0;
  --tide-deep: #4b2b7a;
  --blood: #ff5d6c;
  --ok: #6fe3a1;
  --ink: #ece6f5;
  --ink-2: #b6aacb;
  --ink-3: #7a6f93;

  background: var(--bg-0);
  color: var(--ink);
  font-size: 28rpx;
  line-height: 1.7;
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Serif SC",
    serif;
}

view,
text,
input,
textarea,
button,
scroll-view {
  box-sizing: border-box;
}

/* ============ 通用排版 ============ */
.h1 {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  color: var(--gold);
}
.h2 {
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  color: var(--gold);
}
.h3 {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--ink);
}
.sub {
  font-size: 24rpx;
  color: var(--ink-3);
  letter-spacing: 2rpx;
}
.dim {
  color: var(--ink-3);
}
.gold {
  color: var(--gold);
}
.mem {
  color: var(--mem);
}
.tide {
  color: var(--tide);
}
.ember {
  color: var(--ember);
}
.center {
  text-align: center;
}
.serif {
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
}

/* ============ 页面骨架 ============ */
.page {
  min-height: 100vh;
  background: radial-gradient(
      120% 70% at 50% -10%,
      rgba(160, 95, 224, 0.18),
      transparent 60%
    ),
    radial-gradient(
      90% 50% at 100% 100%,
      rgba(242, 197, 114, 0.08),
      transparent 60%
    ),
    linear-gradient(180deg, #0b0714 0%, #120c20 55%, #0d0819 100%);
  padding-bottom: 60rpx;
}

.navbar {
  padding: calc(var(--status-bar-height, 44px) + 24rpx) 36rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.navbar-back {
  color: var(--gold);
  font-size: 30rpx;
  padding: 6rpx 18rpx 6rpx 0;
}
.navbar-title {
  font-size: 30rpx;
  letter-spacing: 6rpx;
  color: var(--ink-2);
}

/* ============ 面板 / 卡片 ============ */
.panel {
  background: linear-gradient(
    160deg,
    rgba(36, 26, 61, 0.92),
    rgba(18, 12, 32, 0.92)
  );
  border: 1px solid var(--line);
  border-radius: 20rpx;
  padding: 28rpx;
  position: relative;
  overflow: hidden;
}
.panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 2rpx;
  background: linear-gradient(
    90deg,
    transparent,
    var(--gold-glow),
    transparent
  );
}
.panel-tight {
  padding: 20rpx 24rpx;
}

.rule {
  height: 1rpx;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
  margin: 24rpx 0;
}

/* ============ 按钮 ============ */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 28rpx;
  letter-spacing: 3rpx;
  padding: 0 40rpx;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.btn::after {
  border: none;
}
.btn:active {
  transform: scale(0.97);
}
.btn-primary {
  background: linear-gradient(135deg, #f2c572, #d99b3f);
  color: #2a1804;
  font-weight: 700;
  box-shadow: 0 10rpx 30rpx rgba(242, 197, 114, 0.28);
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--gold);
}
.btn-tide {
  background: linear-gradient(135deg, #a05fe0, #4b2b7a);
  color: #f4ecff;
  font-weight: 600;
}
.btn-danger {
  background: linear-gradient(135deg, #ff5d6c, #a02130);
  color: #fff;
  font-weight: 600;
}
.btn-dim {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line-soft);
  color: var(--ink-2);
}
.btn-sm {
  height: 64rpx;
  line-height: 64rpx;
  font-size: 24rpx;
  padding: 0 26rpx;
}
.btn-block {
  width: 100%;
}
.btn[disabled] {
  opacity: 0.4;
}

/* ============ 徽章 / 标签 ============ */
.tag {
  display: inline-flex;
  align-items: center;
  font-size: 22rpx;
  padding: 4rpx 18rpx;
  border-radius: 999rpx;
  border: 1px solid var(--line-soft);
  color: var(--ink-2);
  background: rgba(255, 255, 255, 0.04);
}
.tag-gold {
  color: var(--gold);
  border-color: rgba(242, 197, 114, 0.45);
  background: rgba(242, 197, 114, 0.1);
}
.tag-mem {
  color: var(--mem);
  border-color: rgba(127, 212, 255, 0.45);
  background: rgba(127, 212, 255, 0.1);
}
.tag-tide {
  color: #d3aaff;
  border-color: rgba(160, 95, 224, 0.5);
  background: rgba(160, 95, 224, 0.14);
}
.tag-blood {
  color: #ffb0b8;
  border-color: rgba(255, 93, 108, 0.5);
  background: rgba(255, 93, 108, 0.12);
}
.tag-ok {
  color: var(--ok);
  border-color: rgba(111, 227, 161, 0.45);
  background: rgba(111, 227, 161, 0.1);
}

/* ============ 状态条 ============ */
.stat-bar {
  height: 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.07);
  overflow: hidden;
}
.stat-fill {
  height: 100%;
  border-radius: 999rpx;
  transition: width 0.5s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.fill-mem {
  background: linear-gradient(90deg, #3f9bd4, #7fd4ff);
}
.fill-tide {
  background: linear-gradient(90deg, #4b2b7a, #a05fe0);
}
.fill-flame {
  background: linear-gradient(90deg, #d99b3f, #fff0c2);
}
.fill-hp {
  background: linear-gradient(90deg, #a02130, #ff8a4c);
}

/* ============ 骰面结果 ============ */
.dice-row {
  display: flex;
  gap: 16rpx;
  justify-content: center;
}
.dice {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 700;
  background: linear-gradient(150deg, #2a2046, #171030);
  border: 1px solid var(--line);
  color: var(--gold);
  box-shadow: inset 0 4rpx 12rpx rgba(0, 0, 0, 0.5);
}
.dice-mem {
  color: var(--mem);
  border-color: rgba(127, 212, 255, 0.5);
}
.dice-tide {
  color: #d3aaff;
  border-color: rgba(160, 95, 224, 0.5);
}
.dice-total {
  width: 110rpx;
  font-size: 50rpx;
  background: linear-gradient(150deg, #4a3614, #241705);
  border-color: rgba(242, 197, 114, 0.6);
  color: var(--gold);
}
@keyframes dice-pop {
  0% {
    transform: translateY(-40rpx) rotate(-25deg) scale(0.4);
    opacity: 0;
  }
  70% {
    transform: translateY(6rpx) rotate(6deg) scale(1.08);
    opacity: 1;
  }
  100% {
    transform: translateY(0) rotate(0) scale(1);
  }
}
.dice-anim {
  animation: dice-pop 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) backwards;
}

/* ============ 结果卡泛光 ============ */
@keyframes glow-in {
  from {
    opacity: 0;
    transform: translateY(18rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-in {
  animation: glow-in 0.4s ease backwards;
}
@keyframes pulse-gold {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(242, 197, 114, 0.35);
  }
  50% {
    box-shadow: 0 0 0 16rpx rgba(242, 197, 114, 0);
  }
}
.pulse {
  animation: pulse-gold 2.4s ease-out infinite;
}

/* ============ 会话文本 ============ */
.msg {
  padding: 22rpx 26rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  border: 1px solid var(--line-soft);
  animation: glow-in 0.35s ease backwards;
}
.msg-narrator {
  background: linear-gradient(
    150deg,
    rgba(36, 26, 61, 0.85),
    rgba(18, 12, 32, 0.85)
  );
  border-color: var(--line);
}
.msg-player {
  background: rgba(127, 212, 255, 0.08);
  border-color: rgba(127, 212, 255, 0.28);
}
.msg-oracle {
  background: linear-gradient(
    150deg,
    rgba(242, 197, 114, 0.12),
    rgba(120, 84, 20, 0.08)
  );
  border-color: rgba(242, 197, 114, 0.42);
}
.msg-tide {
  background: linear-gradient(
    150deg,
    rgba(160, 95, 224, 0.16),
    rgba(45, 24, 78, 0.5)
  );
  border-color: rgba(160, 95, 224, 0.42);
}
.msg-system {
  background: rgba(255, 255, 255, 0.04);
  border-style: dashed;
}
.msg-tag {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--ink-3);
  margin-bottom: 8rpx;
}
.msg-text {
  font-size: 27rpx;
  color: var(--ink);
}
.msg-text-serif {
  font-family: "Noto Serif SC", "STSong", serif;
  font-size: 29rpx;
  color: #f6e6c6;
}

/* ============ 输入 ============ */
.input {
  width: 100%;
  height: 84rpx;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line-soft);
  border-radius: 14rpx;
  padding: 0 24rpx;
  color: var(--ink);
  font-size: 28rpx;
}
.input:focus {
  border-color: rgba(242, 197, 114, 0.5);
}
.input::placeholder {
  color: var(--ink-3);
}
.textarea {
  width: 100%;
  min-height: 140rpx;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--line-soft);
  border-radius: 14rpx;
  padding: 18rpx 24rpx;
  color: var(--ink);
  font-size: 27rpx;
  line-height: 1.6;
}
.field-label {
  font-size: 24rpx;
  color: var(--ink-3);
  letter-spacing: 3rpx;
  margin: 22rpx 0 12rpx;
}

/* ============ 选择块 ============ */
.choice {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid var(--line-soft);
  margin-bottom: 16rpx;
}
.choice:active {
  background: rgba(242, 197, 114, 0.1);
  border-color: rgba(242, 197, 114, 0.4);
}
.choice-idx {
  color: var(--gold);
  font-size: 24rpx;
  font-weight: 700;
  flex-shrink: 0;
}
.choice-text {
  font-size: 26rpx;
  color: var(--ink-2);
  flex: 1;
}

/* ============ 段落 ============ */
.section {
  padding: 0 36rpx;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 40rpx 0 20rpx;
}
.section-title::after {
  content: "";
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, var(--line), transparent);
}

/* 弹层 */
.mask {
  position: fixed;
  inset: 0;
  background: rgba(5, 3, 10, 0.78);
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}
.sheet {
  width: 100%;
  max-height: 78vh;
  overflow-y: auto;
  background: linear-gradient(165deg, #241a3d, #120c20);
  border: 1px solid rgba(242, 197, 114, 0.35);
  border-radius: 26rpx;
  padding: 36rpx 32rpx;
  box-shadow: 0 30rpx 80rpx rgba(0, 0, 0, 0.7);
}

/* 滚动区 */
.scroll-y {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.scroll-y::-webkit-scrollbar {
  width: 6rpx;
}
.scroll-y::-webkit-scrollbar-thumb {
  background: rgba(242, 197, 114, 0.3);
  border-radius: 6rpx;
}
</style>