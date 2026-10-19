/**
 * 翁法罗斯规则数据表 —— 全部来自《翁法罗斯单人剧情跑团规则书》，
 * 并按"更贴合崩坏星穹铁道翁法洛斯剧情"的优化目标扩展。
 *
 * 规则书原表标注 source:'book'；扩展内容标注 source:'exp'。
 * 结构全部为可 JSON 序列化的纯数据。
 */

/* ===================== 身份（规则书 · 角色创建） ===================== */
export const IDENTITIES = [
  {
    id: 'golden',
    name: '黄金裔残影',
    epithet: '流淌金血的英雄碎片',
    trait: '火种 +1，神谕感知',
    bonus: { flame: 1 },
    insight: 'oracle', // 神谕感知：Oracle 掷骰视为 +1 调整
    memoryStable: false,
    tideSense: false,
    readPast: false,
    source: 'book',
    desc:
      '你体内流淌着黄金裔的血。你或许是某位殉道英雄碎裂后留下的一缕残影，背负着一段不属于你的使命。泰坦的火种在你胸腔里轻声发烫。'
  },
  {
    id: 'traveler',
    name: '天外旅人',
    epithet: '误入翁法罗斯的异乡者',
    trait: '记忆稳定，不受轮回束缚',
    bonus: {},
    insight: 'steady', // 记忆稳定：轮回时记忆不减、且免疫一次记忆归零
    memoryStable: true,
    tideSense: false,
    readPast: false,
    source: 'book',
    desc:
      '你来自星辰之间的列车，对这个世界而言是一个"错误"。轮回的洪流冲刷万物，却难以冲散你——你的记忆锚定在翁法罗斯之外。'
  },
  {
    id: 'echo',
    name: '忆质残像',
    epithet: '某段被遗忘记忆的化身',
    trait: '可读取场景中的过去影像',
    bonus: {},
    insight: 'past',
    memoryStable: false,
    tideSense: false,
    readPast: true, // 每次进入新场景可免费"追忆"一次
    source: 'book',
    desc:
      '你不是人，你是一段"记得自己"的记忆。触碰旧物时，往昔会像潮水一样倒灌进你的指尖。'
  },
  {
    id: 'tideborn',
    name: '黑潮之子',
    epithet: '从毁灭方程式中诞生的变量',
    trait: '可感知黑潮动向',
    bonus: {},
    insight: 'tide',
    memoryStable: false,
    tideSense: true, // 可预知黑潮检定，且侵蚀+1 的门槛提高
    readPast: false,
    source: 'book',
    desc:
      '你从黑潮的裂缝中爬出，带着毁灭的气味。你厌恶它，却比任何人都懂它——你能听见黑潮接近时，世界骨骼发出的呻吟。'
  }
];

/* ===================== 命途倾向 ===================== */
export const PATHS = [
  { id: 'remembrance', name: '记忆', desc: '回溯、留存、在遗忘中打捞真相', mod: 'investigate' },
  { id: 'erudition', name: '智识', desc: '推理、破解权杖的语法', mod: 'investigate' },
  { id: 'destruction', name: '毁灭', desc: '以痛楚开辟前路', mod: 'combat' },
  { id: 'others', name: '其他', desc: '你的命途由你自己书写', mod: null }
];

/* ===================== 属性修正（规则书 · 记忆判定） ===================== */
export const ATTRS = [
  { id: 'investigate', name: '调查/推理' },
  { id: 'combat', name: '战斗/武艺' },
  { id: 'social', name: '交涉/魅惑' }
];

/* ===================== 神谕（规则书 1d6） ===================== */
export const ORACLES = [
  { roll: 1, text: '汝将最后一次沐浴，在温热耀眼的黄金中。', source: 'book' },
  { roll: 2, text: '汝将碎作千片，凋零在他乡的土壤。', source: 'book' },
  { roll: 3, text: '终有一日，汝将背后负创而死。', source: 'book' },
  { roll: 4, text: '汝将与贪婪同行，亦将亡于分文。', source: 'book' },
  { roll: 5, text: '花海尽头，生者的魂灵将温暖汝之指尖。', source: 'book' },
  { roll: 6, text: '汝将收梢于花开时，一如终结诞下起始。', source: 'book' },
  /* ---- 扩展神谕：更贴近翁法洛斯"轮回/再创世"母题 ---- */
  { roll: 7, text: '汝所救之人，将在下一次黎明前亲手为汝合眼。', source: 'exp' },
  { roll: 8, text: '火种燃尽之日，汝会发现灰烬里坐着最初的自己。', source: 'exp' },
  { roll: 9, text: '冥河逆流之时，有人会在彼岸唤汝的旧名。', source: 'exp' },
  { roll: 10, text: '汝越是追寻答案，权杖便越是篡改提问的人。', source: 'exp' }
];

/* ===================== 起始地点（规则书 1d8） ===================== */
export const LOCATIONS = [
  {
    roll: 1,
    name: '圣城奥赫玛·云石天宫',
    vibe: '永昼之城，最后的净土',
    source: 'book',
    scene:
      '你从一片金色光尘中醒来，脚下是刻法勒广场的石板。奥赫玛的黎明机器在头顶燃烧，永昼刺眼，远处传来大地兽的蹄声。',
    prompt: '黄金裔的议事厅仍在运转，喷泉里流的不是水，是稀释过的金血。',
    tideBase: 1 // 该地点黑潮检定的侵蚀基础偏移
  },
  {
    roll: 2,
    name: '悬锋城废墟',
    vibe: '战火余烬，石榴汁染红的石阶',
    source: 'book',
    scene:
      '断矛插在焦土里像一片铁森林。悬锋城的城墙塌了一半，石阶上的石榴汁早已干涸成暗褐色——有人在这里流尽了最后的血。',
    prompt: '废墟深处传来金属拖行声，一段未完成的英雄记忆正在游荡。',
    tideBase: 0
  },
  {
    roll: 3,
    name: '命运重渊·雅努萨波利斯',
    vibe: '千门之城，神谕的回声',
    source: 'book',
    scene:
      '千百扇门在你面前层层叠叠地展开，每一扇门后都是同一座城的不同命运。雅努萨波利斯的石壁上，预言文字像活物一样缓缓改写。',
    prompt: '有一扇门的门缝里，漏出不属于这个时代的光。',
    tideBase: 0
  },
  {
    roll: 4,
    name: '哀丽秘榭',
    vibe: '静谧村庄，某段记忆的起点',
    source: 'book',
    scene:
      '炊烟、晒谷场、一只卧在门槛上的老狗。哀丽秘榭安静得像一句被屏住的呼吸——这里的每个人都用同一种表情看着你，仿佛认识你很久。',
    prompt: '村口的井水上浮着一张你的脸，但年龄不对。',
    tideBase: 1
  },
  {
    roll: 5,
    name: '斯缇科西亚·龙骸古城',
    vibe: '冥河环绕，巨龙白骨刺穿庭院',
    source: 'book',
    scene:
      '冥河的水是倒着流的。斯缇科西亚的屋檐下悬着巨龙的肋骨，白骨刺穿了三进庭院，骨缝里长出会发光的蓝色苔藓。',
    prompt: '龙骨的眼眶里，有一团火在跟你对视。',
    tideBase: 1
  },
  {
    roll: 6,
    name: '无名泰坦大墓',
    vibe: '地底深处，封印着被遗忘的神',
    source: 'book',
    scene:
      '墓道两侧的浮雕被人为凿去了面孔。无名泰坦大墓埋着连权杖都懒得记录的神，你每走一步，身后的火把就熄灭一支。',
    prompt: '最深处的棺椁上刻着你的名字，字迹还很新。',
    tideBase: 1
  },
  {
    roll: 7,
    name: '创世涡心',
    vibe: '火种汇聚之处，再创世的起点',
    source: 'book',
    scene:
      '十二道光在涡心交汇，又被搅成一个缓慢旋转的漩涡。创世涡心的空气尝起来像金属和雷雨——这里是世界的源代码，也是它的坟场。',
    prompt: '漩涡中央悬浮着一枚尚未熄灭的火种，它似乎在等你伸手。',
    tideBase: 0
  },
  {
    roll: 8,
    name: '葬忆彼岸·时光归墟',
    vibe: '权杖内核，一切记忆的终点',
    source: 'book',
    scene:
      '没有天空，只有无数发着光的记忆碎片像星尘一样悬浮、坠落、再升起。葬忆彼岸是权杖δ-me13的内核，所有被删除的人生都堆在这里。',
    prompt: '一块碎片主动飘到你面前——那是别人记忆里的你。',
    tideBase: 2
  },
  /* ---- 扩展地点 ---- */
  {
    roll: 9,
    name: '昏晓渡口',
    vibe: '冥河支流的摆渡处，生死交界',
    source: 'exp',
    scene:
      '一条系在骨舟上的缆绳湿漉漉的，摆渡人戴着没有五官的面具。昏晓渡口的钟每隔一分钟敲一次，但没人记得它为谁而鸣。',
    prompt: '摆渡人伸出手，要的不是钱，是一段你愿意交出去的记忆。',
    tideBase: 1
  },
  {
    roll: 10,
    name: '折光回廊·十二试炼场',
    vibe: '黄金裔的成神之路，布满旧日决斗的刻痕',
    source: 'exp',
    scene:
      '回廊的地面嵌满碎裂的盾徽，每一块都属于一个没能走到终点的黄金裔。墙壁上的水镜照出的不是你，而是你可能成为的样子。',
    prompt: '镜中的"你"先一步抬起了手，似乎想说什么。',
    tideBase: 0
  }
];

/* ===================== 遭遇表（规则书 1d8） ===================== */
export const ENCOUNTERS = [
  {
    roll: 1,
    name: '黄金裔残影',
    tag: '记忆',
    source: 'book',
    text:
      '一段未完成的英雄记忆拦住了你。它的胸口有一个透明的洞，却仍在向你讲述一场早已结束的冲锋。',
    action: '它恳求你替它完成最后一件事——你愿意倾听，还是绕开这段不该被打扰的执念？'
  },
  {
    roll: 2,
    name: '泰坦权能残留',
    tag: '神性',
    source: 'book',
    text:
      '环境中涌动着神性力量：石壁渗出金血，火焰凝成静止的花，时间在这里出现明显的褶皱。',
    action: '这股权能可以被引导，也可能灼伤引导者。你想从中取走一点什么？'
  },
  {
    roll: 3,
    name: '黑潮怪物',
    tag: '威胁',
    source: 'book',
    text:
      '被毁灭方程式扭曲的存在从阴影里挤出来——它曾经有名字，现在只剩下对你身上金血的饥饿。',
    action: '它正在逼近。你可以战斗、驱赶，或者尝试读出它残存的本名。'
  },
  {
    roll: 4,
    name: '迷迷式记忆体',
    tag: '奇遇',
    source: 'book',
    text:
      '一个粉色的、似曾相识的身影蹲在角落里数自己的尾巴，它坚持说你欠它一块糖，而且已经欠了三千年。',
    action: '它似乎知道某些关于轮回的内幕——哄它开口，还是甩开它继续赶路？'
  },
  {
    roll: 5,
    name: '追忆残像',
    tag: '线索',
    source: 'book',
    text: '前方的空间像被翻动的书页，浮现出可以读取的过往影像——某人曾在这里做过一个决定。',
    action: '影像正在淡去。你要读取它、留下它，还是把自己的影子也刻进去？'
  },
  {
    roll: 6,
    name: '权杖守卫',
    tag: '系统',
    source: 'book',
    text:
      '来古士派出的系统程序拦住去路，它用毫无起伏的语调宣读你的"异常行为"，并要求你原地回滚。',
    action: '它给了你一次申辩的机会——虽然它并不打算采纳。'
  },
  {
    roll: 7,
    name: '大地兽或奇美拉',
    tag: '生灵',
    source: 'book',
    text:
      '翁法罗斯的原生生物出现在前方：一头驮着半间屋子的大地兽，或是一只正在为晚餐吵架的双头奇美拉。',
    action: '它们对你的态度，取决于你身上金血的气味，还是你兜里的食物。'
  },
  {
    roll: 8,
    name: '神谕铭文',
    tag: '预言',
    source: 'book',
    text: '刻在石壁上的预言文字正在缓慢浮现，最后一句似乎是刚刚才写上去的，墨迹未干。',
    action: '铭文的落款是你的笔迹。你打算读完它，还是在读完之前转身？'
  },
  /* ---- 扩展遭遇 ---- */
  {
    roll: 9,
    name: '摆渡人',
    tag: '交易',
    source: 'exp',
    text:
      '冥河边的摆渡人放下篙，表示可以送你去任何"你曾经活过的地方"——但回程的票要用记忆支付。',
    action: '你想去哪个地方？又愿意为它付多少？'
  },
  {
    roll: 10,
    name: '半神的残躯',
    tag: '神性·危险',
    source: 'exp',
    text:
      '一具已经熄灭的半神跪在地上，双手仍保持着祈祷的姿势。它体内的火种虽已离位，残温依旧灼人。',
    action: '火种的余温可以取暖，也可以点燃什么。你伸手吗？'
  },
  {
    roll: 11,
    name: '上一轮的自己',
    tag: '轮回',
    source: 'exp',
    text:
      '转角处站着一个和你一模一样的身影，衣着不同、伤痕不同，但眼神里的疲惫完全一致。它先开了口："这次别走那条路。"',
    action: '它知道一些你尚未经历的事。信它，还是信你自己？'
  },
  {
    roll: 12,
    name: '黑潮低语',
    tag: '诱惑',
    source: 'exp',
    text:
      '黑潮没有扑上来，它只是"说话"。一个温柔的声音念出了你最想守护的人的名字，并提议做一笔交易。',
    action: '拒绝会失去一条线索；接受则会让侵蚀提前一步。你怎么回？'
  }
];

/* ===================== 随机词表（规则书） ===================== */
export const WORD_ACTIONS = [
  '追寻', '守护', '背叛', '揭示', '缝合', '吞噬', '归还', '终结',
  '隐瞒', '逆转', '献祭', '重逢'
];
export const WORD_THEMES = [
  '火种', '记忆', '门径', '轮回', '黎明', '冥河', '神谕', '金血',
  '执念', '骨钟', '白骨', '初雪'
];

/* 组合示例（规则书给了 1 条，此处补充更多，供"灵感炉"使用） */
export const WORD_EXAMPLES = {
  '追寻+冥河': '你在黑潮中发现了一条通往冥界的暗流，似乎有人曾试图从死亡中带回什么。',
  '守护+黎明': '黎明机器的齿轮间卡着半具躯体，它在你伸手前最后说了一句：别让它停。',
  '背叛+火种': '火种的交接仪式被打断，交出火种的人和接过火种的人，脸上是同一种歉意。',
  '揭示+轮回': '你在石壁上读到一份被反复涂改的名单，每一次轮回都有人被划去，唯独你的名字从未出现。',
  '缝合+记忆': '有人用针线把两段互不相干的记忆缝在一起，想造出一个"更幸福"的自己。',
  '归还+金血': '村口的石像开口，要你归还你根本没拿走的金血——它记得你拿过，哪怕你这一轮才来。',
  '终结+神谕': '神谕的最后一行被烧掉了，烧痕的形状恰好是你出生那年的星图。',
  '吞噬+门径': '那扇门不是通向别处，它在进食；每一个穿过的人都会成为门后风景的一部分。',
  '献祭+执念': '祭坛要求的不是性命，而是你最想完成的那件事——献出去之后，你仍会活着，只是不再想去做了。',
  '重逢+冥河': '冥河上游漂来一张熟识的脸，它睁开眼，叫的是你上一轮用过的名字。'
};

/* ===================== 结局（规则书 2d6） ===================== */
export const ENDINGS = {
  eternal: {
    total: '2-4',
    name: '永劫',
    text: '你成为下一轮循环的起点，神谕被重新书写。',
    source: 'book',
    tone: '轮回',
    detail:
      '你没有死，你变成了"开始"。下一次有人在金色光尘中睁眼，听见的第一个声音将是你的心跳。神谕被重新书写——而执笔的手，是上一轮的你。'
  },
  echo: {
    total: '5-7',
    name: '残响',
    text: '你的故事化为一段追忆残像，被后来的旅人读取。',
    source: 'book',
    tone: '留存',
    detail:
      '你的身影留在了某面石壁上。后来的旅人路过时会驻足片刻，读到你此刻的表情，然后带着一点点你的勇气继续上路。'
  },
  flame: {
    total: '8-10',
    name: '火种',
    text: '你将自己的记忆炼成火种，投入创世涡心。',
    source: 'book',
    tone: '奉献',
    detail:
      '疼痛只持续了一瞬。随后你的每一次回忆都开始发光，十二道光在涡心交汇——世界借着你的记忆，又亮了一寸。'
  },
  aswritten: {
    total: '11-12',
    name: '如我所书',
    text: '你的故事被完整保存，成为翁法罗斯史诗的一页。',
    source: 'book',
    tone: '真结局',
    detail:
      '权杖没能改写你。你的名字、你的失败、你所有不体面的犹豫和孤注一掷的勇敢，一字未删地留在了史诗里——如同你亲手所书。'
  }
};

/* ===================== Oracle 回响（规则书 1d6） ===================== */
export const ORACLE_ANSWERS = [
  { roll: 1, text: '否，且权杖记录了一次异常', tone: 'negative', flag: 'anomaly' },
  { roll: 2, text: '否', tone: 'negative' },
  { roll: 3, text: '否，但你看见一段旧日影像', tone: 'negative', flag: 'vision' },
  { roll: 4, text: '是，但黑潮已靠近', tone: 'positive', flag: 'tide' },
  { roll: 5, text: '是', tone: 'positive' },
  { roll: 6, text: '是，且留下深刻回响', tone: 'positive', flag: 'deep' }
];

/* ===================== 建议行动（游戏流程 · 三个建议行动） ===================== */
export const SUGGESTIONS = [
  { text: '谨慎观察周围，寻找不寻常的细节', attr: 'investigate' },
  { text: '直接上前交涉，问出我想要的答案', attr: 'social' },
  { text: '用最直接的方式解决眼前的障碍', attr: 'combat' },
  { text: '默念神谕，向这个世界提问（Oracle）', attr: null, kind: 'oracle' },
  { text: '追忆此地的过去（读取场景影像）', attr: 'investigate', kind: 'past' },
  { text: '稍作休整，稳住自己的记忆', attr: null, kind: 'rest' },
  { text: '动身前往下一个地点', attr: null, kind: 'travel' }
];

/* ===================== 记忆碎片（轮回奖励，规则书） ===================== */
export const FRAGMENT_LABELS = [
  '关键抉择', '隐藏线索', '重要面孔', '未竟之事', '权杖漏洞', '泰坦遗言'
];

/* ===================== 十二泰坦火种（贴合崩坏星穹铁道翁法洛斯设定） =====================
 * 每枚火种对应一位泰坦与其神权；收集后附带永续"神权恩泽"（engine 按 boonId 生效）。
 * trial 属性 = 该试炼所用的记忆判定属性；trialText 为试炼叙事，trialAsk 为行动问句。
 */
export const TITAN_FLAMES = [
  {
    id: 'kephale', name: '刻法勒', alias: 'Kephale', domain: '负世',
    boonId: 'tideThreshold', boonText: '负世之躯：黑潮临界阈值 5 → 6',
    trialAttr: 'combat',
    trialText: '你来到一位倒跪的巨人面前。祂用双肩扛起一片正在坠落的天空，脊背上的裂痕里流出光。祂不看你，只说：能分担几分？',
    trialAsk: '伸出双手，与祂一同扛起天空。',
    claimText: '天空变轻了一分。刻法勒的火种落入你怀中，温热如初生之日。',
    source: 'hsr'
  },
  {
    id: 'janus', name: '雅努斯', alias: 'Janus', domain: '门径',
    boonId: 'travelTide', boonText: '万径通途：移动后的黑潮检定 +2 修正',
    trialAttr: 'investigate',
    trialText: '千门之城的心脏，无数门扉在你四周开合。每一扇门后都是一条你走过的路，也有一条你错过的。门后传来同一个声音：选吧。',
    trialAsk: '凝视万千门径，找到那条只属于你的。',
    claimText: '一扇门为你彻底敞开。此后万径皆通——雅努斯的火种在门枢上燃烧。',
    source: 'hsr'
  },
  {
    id: 'oronyx', name: '奥洛尼斯', alias: 'Oronyx', domain: '岁月',
    boonId: 'freeReroll', boonText: '时之回溯：每轮回一次，碎片重掷免费',
    trialAttr: 'investigate',
    trialText: '黎明机器的核心，一枚巨大的钟摆在浓稠的时间里缓缓摆动。摆过去，是所有逝去的日子；摆回来，是尚未发生的一切。钟摆中央坐着个孩子，正在打盹。',
    trialAsk: '轻声唤醒祂，请求看一眼"已经改写的昨天"。',
    claimText: '孩子睁眼一笑。昨日与明日在你眼前交换了位置——岁月的火种随钟摆落进你掌心。',
    source: 'hsr'
  },
  {
    id: 'mnestia', name: '墨涅塔', alias: 'Mnestia', domain: '浪漫',
    boonId: 'socialPlus', boonText: '爱之缔织：交涉判定 +1',
    trialAttr: 'social',
    trialText: '一座由金线织成的圣殿，纺织机永不停歇。织出的不是衣袍，是一段段被爱过的证明。纺锤旁放着一张空位，线头正朝你的方向延伸。',
    trialAsk: '接过那根线，织入你自己的牵挂。',
    claimText: '金线自你的指尖缠上心口。你听见有人在千里之外念你的名字——浪漫的火种就此缔成。',
    source: 'hsr'
  },
  {
    id: 'nikador', name: '尼卡多利', alias: 'Nikador', domain: '纷争',
    boonId: 'combatPlus', boonText: '征伐权能：战斗判定 +1',
    trialAttr: 'combat',
    trialText: '断矛如林的废墟中央，一具百米的黄金战躯仍在挥拳。祂早已死去，但纷争不允许战争结束。祂的每一击都在向虚空宣战，火花溅落在你脚边。',
    trialAsk: '不退，不避，向祂报上你的名与战意。',
    claimText: '战躯停下，向你俯首。纷争承认了你——尼卡多利的火种化作一柄悬于你身后的矛影。',
    source: 'hsr'
  },
  {
    id: 'thanatos', name: '塔纳托斯', alias: 'Thanatos', domain: '死亡',
    boonId: 'deathward', boonText: '引渡之恩：每轮回一次，记忆归零免于迷失（回到1）',
    trialAttr: 'social',
    trialText: '冥河在此处变得很浅，浅得能看见河底铺满的名字。彼岸有一盏灯，灯下坐着披纱的身影，正为每一位过河者梳理头发。祂注意到你，为你在岸边也点了一盏。',
    trialAsk: '涉水而过，与祂谈谈你带在身上的那些告别。',
    claimText: '祂替你拂去肩上的尘。"你的名字，还不该写进河底。"——死亡的火种安静地熄在你的胸口，像一次提前的宽恕。',
    source: 'hsr'
  },
  {
    id: 'georios', name: '吉奥里亚', alias: 'Georios', domain: '大地',
    boonId: 'memShield', boonText: '磐岩之护：每轮回首次判定失败，记忆不再受损',
    trialAttr: 'combat',
    trialText: '群山在这里隆起如脊背。每一座山都是一位蜷缩的巨人，鼾声引起季风。最老的那位巨人睁开了半只眼睛，用山体滑坡般缓慢的动作，朝你摊开手掌。',
    trialAsk: '走上祂的掌心，替大地记住一个脚印。',
    claimText: '掌心合拢又张开，你被轻轻放回地面。你的名字从此刻进了岩层——大地的火种沉甸甸地系在你的影子上。',
    source: 'hsr'
  },
  {
    id: 'phagousa', name: '法吉娜', alias: 'Phagousa', domain: '海洋',
    boonId: 'restPlus', boonText: '冥河之息：休整时记忆恢复 +1',
    trialAttr: 'social',
    trialText: '倒流的冥河在此漫成一片浅海。水面上漂着旧信、船骸与整段整段的旧日时光，像一场永不散席的宴会。杯盏自己凑到你面前，斟满发着光的液体。',
    trialAsk: '举杯，饮下一段被大海珍藏的记忆。',
    claimText: '液体滑入喉咙，你尝到潮汐、摇篮曲与久违的安眠——海洋的火种随浪花跃入你的血脉。',
    source: 'hsr'
  },
  {
    id: 'aquila', name: '阿奎拉', alias: 'Aquila', domain: '天空',
    boonId: 'tideRollPlus', boonText: '长风借翼：所有黑潮检定掷骰 +1',
    trialAttr: 'investigate',
    trialText: '永昼之城的上空，风在这里凝成实体。一只由纯粹气流构成的巨翼生物盘旋而下，翼展遮蔽了黎明机器的光。它俯冲向你——却在触碰你之前停住，振翅悬停。',
    trialAsk: '攀上它的背脊，陪它巡完这片天空。',
    claimText: '风从你的衣袖灌入又抽出，从此你呼吸的节律与季风一致——天空的火种在你背后展开成看不见的翼。',
    source: 'hsr'
  },
  {
    id: 'talanton', name: '塔兰顿', alias: 'Talanton', domain: '律法',
    boonId: 'trialNoTide', boonText: '天秤权衡：试炼部分成功不再引入黑潮',
    trialAttr: 'investigate',
    trialText: '一座天平立于万丈深渊之上，两端分别放着"所得"与"所失"。秤盘微微晃动，每一次倾斜都有一段人生被称量后送往前程或送归尘土。天平为你空出了一端。',
    trialAsk: '把你的代价放上去，看看命运如何称量。',
    claimText: '秤杆归平。你的得失被重新记账——律法的火种化作一枚小小的秤砣，坠在你心口最稳的位置。',
    source: 'hsr'
  },
  {
    id: 'zagreus', name: '扎格列斯', alias: 'Zagreus', domain: '诡计',
    boonId: 'trickOnce', boonText: '千面戏法：每轮回一次，判定失败自动改判部分成功',
    trialAttr: 'social',
    trialText: '一座没有观众的剧场，面具挂满穹顶。舞台中央立着一面镜子，镜中的你戴着不属于你的表情，正在鞠躬谢幕。掌声从四面八方的虚空中响起。',
    trialAsk: '对镜行礼，接过那张"更好命的自己的面具"。',
    claimText: '面具贴上脸的瞬间轻若无物。你听见了窃笑——诡计的火种塞进你口袋，像一枚随时会变出奇迹的假币。',
    source: 'hsr'
  },
  {
    id: 'cerces', name: '瑟希斯', alias: 'Cerces', domain: '理性',
    boonId: 'oraclePlus', boonText: '思辨圣殿：Oracle 可能性调整 +1',
    trialAttr: 'investigate',
    trialText: '一座由问句砌成的学院，每一块砖上都刻着无人能答的问题。穹顶悬着两团辩论不休的光——祂们曾是同一位神。见到你，两团光同时安静下来。',
    trialAsk: '提出一个连祂们都未想过的问题。',
    claimText: '两团光同时亮起，为你的问题鼓掌三日。理性与思辨的火种一分为二，又合一地落进你的脑海。',
    source: 'hsr'
  }
];

/* ===================== 黄金裔同行者（贴合崩坏星穹铁道翁法洛斯剧情） =====================
 * 邂逅后结伴同行，提供永续被动加成（engine 按 perkId 生效）。
 */
export const HEIRS = [
  {
    id: 'phainon', name: '白厄', title: '逐火候补生', domain: '负世',
    perkId: 'trialSupport', perkText: '白厄同行：泰坦试炼判定 +1',
    meetText:
      '金发的青年坐在废墟边缘擦拭一把剑，看见你时眼睛亮得像第一次看见黎明。"同行吗？这条路上，多一个人就多一分希望。"他说这话时，你莫名想起某个抱着世界痛哭的背影。',
    joinLine: '「那么，一起去把火种都点亮吧。」',
    source: 'hsr'
  },
  {
    id: 'aglaea', name: '阿格莱雅', title: '缔织者', domain: '浪漫',
    perkId: 'socialPlus', perkText: '阿格莱雅同行：交涉判定 +1',
    meetText:
      '金线的织机在她指尖流转，织出一匹你看不懂星图的锦缎。"言语和丝线一样，"她头也不抬，"织得足够好，就能让最顽固的命运松口。"',
    joinLine: '「你的措辞漏洞百出。跟紧我，别在神明面前失礼。」',
    source: 'hsr'
  },
  {
    id: 'castorice', name: '遐蝶', title: '死亡之影', domain: '死亡',
    perkId: 'deathward', perkText: '遐蝶同行：每轮回一次，记忆归零免于迷失',
    meetText:
      '她站在花丛边缘，周身三步之内寸草不生，蝶群却敢停在她发梢。"别靠近我，"她轻声说，随即又补了一句，声音低得像自言自语，"……但如果你执意同行，我会小心不碰到你。"',
    joinLine: '「死亡与我同形。但我希望，它永远绕开你。」',
    source: 'hsr'
  },
  {
    id: 'mydei', name: '万敌', title: '悬锋继承人', domain: '纷争',
    perkId: 'combatPlus', perkText: '万敌同行：战斗判定 +1',
    meetText:
      '他刚从一群黑潮怪物的残骸里走出来，金血溅了满身，却像刚赴完一场宴。"又来了一个活人？"他瞥你一眼，露出近似厌倦的笑，"很好，希望你能让我尽兴一点。"',
    joinLine: '「跟紧点。倒在半路的同伙，我可懒得埋。」',
    source: 'hsr'
  },
  {
    id: 'hyacine', name: '风堇', title: '云间医士', domain: '天空',
    perkId: 'restPlus', perkText: '风堇同行：休整时记忆恢复 +1',
    meetText:
      '粉发的小小医士从天而降，身后跟着一只毛茸茸的云兽。"受伤了？累了？还是记忆打结了？"她凑近你，眼睛亮晶晶的，"都没关系哦——风会把一切都吹顺的。"',
    joinLine: '「你的伤交给我，前路的风交给我，你只管往前走！」',
    source: 'hsr'
  },
  {
    id: 'tribbie', name: '缇宝', title: '门径之嗣', domain: '门径',
    perkId: 'oraclePlus', perkText: '缇宝同行：Oracle 可能性调整 +1',
    meetText:
      '小小的身影凭空出现在你面前，身后还跟着两个一模一样的自己。"我们替你看过门后的路啦，"三个声音异口同声，"想问什么，我们帮你把话递到门那边去。"',
    joinLine: '「天要黑了哦。别怕，我们给你留门。」',
    source: 'hsr'
  },
  {
    id: 'cipher', name: '赛飞儿', title: '千面盗贼', domain: '诡计',
    perkId: 'tideReroll', perkText: '赛飞儿同行：每轮回一次，黑潮检定可重掷',
    meetText:
      '你摸向口袋——空了。身后传来清脆的笑声，紫发的少女正把你的钱袋抛着玩。"别瞪我呀，"她眨眨眼把袋子丢还给你，"我要是真想偷，你连袋子存在过都会忘掉。"',
    joinLine: '「放心，自己人我只偷别人的东西。比如命运的东西。」',
    source: 'hsr'
  },
  {
    id: 'hysilens', name: '海瑟音', title: '海之乐姬', domain: '海洋',
    perkId: 'pastFree', perkText: '海瑟音同行：追忆不再有代价',
    meetText:
      '倒流的冥河边，有人吹响骨笛。乐声里浮起整座沉没的城邦，与城中所有未被记住的名字。"音乐是记忆的容器，"她放下笛子看你，"而我，恰好会演奏。"',
    joinLine: '「你想听的故事，我用旋律替你保存在过去里。」',
    source: 'hsr'
  },
  {
    id: 'cerydra', name: '刻律德菈', title: '律法执剑人', domain: '律法',
    perkId: 'endingPlus', perkText: '刻律德菈同行：结局掷骰 +1',
    meetText:
      '银甲的女帝立于高台之上检阅残军，目光扫过你时如出鞘一瞬。"勇气可嘉，"她说，"但逐火之旅需要的不止勇气，还需要秩序。宣誓吧，我许你一个更体面的终局。"',
    joinLine: '「从今日起，你的结局由律法担保。」',
    source: 'hsr'
  },
  {
    id: 'anaxa', name: '那刻夏', title: '渎神学者', domain: '理性',
    perkId: 'investigatePlus', perkText: '那刻夏同行：调查判定 +1',
    meetText:
      '他正在神殿的石壁上用炭笔改写铭文，动作快得近乎亵渎。"泰坦不是神，"他不回头，"是这个模拟世界的底层语法。要读懂真相，就得先学会渎神。"',
    joinLine: '「同行可以。但别用\u2018信仰\u2019这种烂变量污染我的推导。」',
    source: 'hsr'
  }
];

/* ===================== 黑潮阶段（侵蚀值具象化） ===================== */
export const TIDE_STAGES = [
  {
    min: 0, max: 3, name: '潮痕',
    text: '黑潮只是远方的低语。地平线上偶尔闪过不该有的影子。',
    tone: 'far'
  },
  {
    min: 4, max: 6, name: '潮涌',
    text: '黑潮漫过了远山。风里有铁锈与海腥味，大地兽开始成群迁徙。',
    tone: 'near'
  },
  {
    min: 7, max: 9, name: '潮噬',
    text: '黑潮已在身后舔舐你的脚印。世界的边缘正在褪色成墨。',
    tone: 'crisis'
  },
  {
    min: 10, max: 10, name: '潮渊',
    text: '你站在黑潮的中心。下一瞬，翁法罗斯将不再记得你。',
    tone: 'doom'
  }
];

/** 遭遇表扩展：黄金裔邂逅（source:'hsr'，由 store 在遭遇抽取时按概率注入） */

/* ===================== 游戏流程（规则书 · 单轮结构） ===================== */
export const ROUND_STEPS = [
  '描述场景：根据地点表生成当前场景，用一两句话描述环境。',
  '玩家行动：玩家自由描述想做什么，或从三个建议行动中选择。',
  '判定结果：需要判定时掷记忆判定；需要回答疑问时问Oracle。',
  '黑潮检定：掷骰决定是否侵蚀+1。',
  '记录日志：将本轮关键事件写入冒险日志。'
];

export const END_CONDITIONS = [
  '集齐12枚火种：触发再创世，生成结局。',
  '完成执念：角色心愿达成，可安然化为忆质。',
  '侵蚀满值且无记忆碎片：彻底迷失，本轮终结。',
  '玩家主动收束：随时可以写下"如我所书"，为故事画上句号。'
];

/* ===================== 快速开局示例（规则书 · 九） ===================== */
export const QUICK_START = {
  scene:
    '你从一片金色光尘中醒来，脚下是刻法勒广场的石板。奥赫玛的黎明机器在头顶燃烧，永昼刺眼。远处传来大地兽的蹄声。',
  status: '记忆10/10，火种0，侵蚀0',
  oracle: '「汝将收梢于花开时，一如终结诞下起始。」',
  choices: [
    '前往云石天宫，寻找黄金裔的踪迹',
    '调查广场上的神谕铭文',
    '跟随大地兽的蹄声，离开奥赫玛'
  ]
};

/* ===================== 规则速查（规则书全文提炼） ===================== */
export const RULES_BOOK = [
  {
    title: '记忆判定',
    body:
      '行动结果不确定时，掷 2d6 + 相关属性修正：2-6 失败且记忆受损(-1记忆值)；7-9 部分成功，达成目标但付出代价；10+ 完全成功，获得额外收益。属性初始任选两项 +1。',
    tone: 'mem'
  },
  {
    title: '黑潮侵蚀',
    body:
      '每次行动结束后掷1d6：1-2 黑潮靠近，侵蚀+1；3-6 无事发生。侵蚀达到 5 时，每次行动后自动+1；达到 10 触发轮回。',
    tone: 'tide'
  },
  {
    title: '轮回机制',
    body:
      '角色死亡或侵蚀满值时世界重置：记忆恢复10、侵蚀清零；保留火种数量与神谕；获得一条记忆碎片(上一轮的关键信息)；重新生成起始地点和初始遭遇。轮回不是失败，而是翁法罗斯的常态。',
    tone: 'gold'
  },
  {
    title: 'Oracle 回响',
    body:
      '对世界有疑问时掷1d6：1 否且权杖记录异常 / 2 否 / 3 否但见旧日影像 / 4 是但黑潮靠近 / 5 是 / 6 是且留下深刻回响。事件很可能发生掷前+1，极不可能掷前-1。',
    tone: 'gold'
  },
  {
    title: '结束条件',
    body:
      '集齐12枚火种触发再创世生成结局；完成执念可安然化为忆质；侵蚀满值且无记忆碎片则彻底迷失；玩家随时可写下"如我所书"主动收束。',
    tone: 'ember'
  }
];

/** 校验：所有 table 数组长度（供测试与维护提示） */
export const TABLE_SIZES = {
  IDENTITIES: IDENTITIES.length,
  ORACLES: ORACLES.length,
  LOCATIONS: LOCATIONS.length,
  ENCOUNTERS: ENCOUNTERS.length,
  ENDINGS: Object.keys(ENDINGS).length,
  ORACLE_ANSWERS: ORACLE_ANSWERS.length,
  TITAN_FLAMES: TITAN_FLAMES.length,
  HEIRS: HEIRS.length,
  TIDE_STAGES: TIDE_STAGES.length
};

/** 按域查询泰坦（供遭遇/试炼联动） */
export function titanById(id) {
  return TITAN_FLAMES.find((t) => t.id === id) || null
}

/** 黑潮阶段查询 */
export function tideStageOf(tide) {
  return TIDE_STAGES.find((s) => tide >= s.min && tide <= s.max) || TIDE_STAGES[0]
}