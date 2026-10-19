/**
 * 骰子模块 —— 纯函数，Node 可测，可在浏览器/小程序运行。
 * 支持注入随机源，便于单元测试与"命运锚点"（可复骰）系统。
 */

/** 生成 [min, max] 闭区间整数 */
export function rollDie(min = 1, max = 6, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** 掷 n 个 s 面骰，返回 { dice: number[], total: number } */
export function roll(n = 2, s = 6, rng = Math.random) {
  const dice = [];
  for (let i = 0; i < n; i++) dice.push(rollDie(1, s, rng));
  const total = dice.reduce((a, b) => a + b, 0);
  return { dice, total };
}

/**
 * 记忆判定：2d6 + 修正
 * 2-6 失败(记忆-1) / 7-9 部分成功 / 10+ 完全成功
 */
export function memoryCheck(modifier = 0, rng = Math.random) {
  const r = roll(2, 6, rng);
  const total = r.total + modifier;
  let tier;
  if (total >= 10) tier = 'full';
  else if (total >= 7) tier = 'partial';
  else tier = 'fail';
  return { dice: r.dice, modifier, sum: r.total, total, tier };
}

/** Oracle 1d6 + 调整（-1 极不可能 / +1 很可能发生），钳制到 [1,6] */
export function oracleRoll(adjust = 0, rng = Math.random) {
  const raw = rollDie(1, 6, rng);
  const clamped = Math.min(6, Math.max(1, raw + adjust));
  return { raw, adjust, clamped };
}

/** 结局 2d6 */
export function endingRoll(rng = Math.random) {
  const r = roll(2, 6, rng);
  let tier;
  if (r.total <= 4) tier = 'eternal';
  else if (r.total <= 7) tier = 'echo';
  else if (r.total <= 10) tier = 'flame';
  else tier = 'aswritten';
  return { dice: r.dice, total: r.total, tier };
}

/** 从数组随机取一（不修改原数组） */
export function pick(arr, rng = Math.random) {
  if (!arr || !arr.length) return undefined;
  return arr[Math.floor(rng() * arr.length)];
}

/** 从数组随机取 n 个不重复元素 */
export function pickMany(arr, n, rng = Math.random) {
  const pool = (arr || []).slice();
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/** 以权重取一项：items 为 [{ weight, ... }] */
export function pickWeighted(items, rng = Math.random) {
  const total = items.reduce((a, x) => a + (x.weight || 1), 0);
  let r = rng() * total;
  for (const x of items) {
    r -= x.weight || 1;
    if (r <= 0) return x;
  }
  return items[items.length - 1];
}