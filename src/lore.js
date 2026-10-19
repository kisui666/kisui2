/**
 * 翁法罗斯设定词条（图鉴用）
 *
 * source 字段说明：
 *  - 'book'   直接来自《翁法罗斯单人剧情跑团规则书》
 *  - 'hsr'    崩坏：星穹铁道 翁法罗斯篇章的公开设定（通识层，非精确考据）
 *  - 'exp'    本项目为跑团体验所作的扩展演绎
 *
 * 说明：泰坦名录一节标注为考据内容，仅供氛围参考，玩家可自行修订，
 * 请以官方最新剧情为准。
 */

export const GLOSSARY = [
  {
    term: '翁法罗斯',
    alias: 'Amphoreus / 永恒之地',
    source: 'book',
    text:
      '别称"永恒之地"，本质是星体计算机"帝皇权杖δ-me13"运行的模拟世界。十二泰坦编织命运、开辟天地、捏塑生命、引渡灾厄。'
  },
  {
    term: '帝皇权杖 δ-me13',
    alias: '星体计算机',
    source: 'book',
    text:
      '翁法罗斯的运行本体。它模拟出整个世界，记录每一次轮回，并在玩家向 Oracle 提问时留下"异常"标记。葬忆彼岸·时光归墟即其内核。'
  },
  {
    term: '十二泰坦',
    alias: 'Twelve Titans',
    source: 'book',
    text:
      '翁法罗斯的创世神明，拥有实体。他们编织命运、开辟天地、捏塑生命、引渡灾厄。十二道神权构成世界的骨架，也是火种的来源。'
  },
  {
    term: '黄金裔',
    alias: 'Chrysos Heirs',
    source: 'book',
    text:
      '流淌金血的英雄一族。他们背负火种，踏上逐火之旅，以再创世重启世界。玩家身份之一"黄金裔残影"即其碎裂后留下的英雄碎片。'
  },
  {
    term: '逐火之旅',
    alias: 'Flame-Chase Journey',
    source: 'book',
    text:
      '黄金裔为收集十二枚火种、重启世界而踏上的旅途。本跑团的全部玩法都发生在这条路上：你不是在"通关"，而是在"书写"。'
  },
  {
    term: '火种',
    alias: 'Flame / Seed of Rebirth',
    source: 'book',
    text:
      '再创世所需的十二枚神性火种。集齐 12 枚即触发再创世，生成结局。轮回时火种数量会被完整保留——它是你唯一真正带走的东西。'
  },
  {
    term: '黑潮',
    alias: 'Black Tide',
    source: 'book',
    text:
      '如病毒般侵蚀大地的毁灭洪流，吞噬城邦、扭曲生灵。侵蚀值满 10 即触发轮回。侵蚀达到 5 后进入临界，每次行动自动 +1。'
  },
  {
    term: '再创世',
    alias: 'Re-creation',
    source: 'book',
    text:
      '以十二枚火种重启世界的仪式。它是结束，也是开始——正如神谕所言："一如终结诞下起始。"'
  },
  {
    term: '轮回',
    alias: '永劫回归 / Eternal Return',
    source: 'book',
    text:
      '角色死亡或侵蚀满值时世界重置：记忆恢复为 10、侵蚀清零，保留火种与神谕，并获得一条记忆碎片。轮回不是失败，而是翁法罗斯的常态。'
  },
  {
    term: '记忆值',
    alias: 'Memory',
    source: 'book',
    text:
      '初始 10/10。记忆判定失败时 -1，归零则迷失为残影并触发轮回。它是你在翁法罗斯"存在过"的凭证。'
  },
  {
    term: '记忆碎片',
    alias: 'Memory Fragment',
    source: 'book',
    text:
      '每次轮回获得一条上一轮的关键信息。它是穿越轮回的知识，也是"每一次回归，你都比上次更接近真相"的机制表达。'
  },
  {
    term: '神谕',
    alias: 'Oracle / Prophecy',
    source: 'book',
    text:
      '由掷 1d6 生成的、关于结局的预言。神谕会伴随你穿越每一次轮回。结局生成后，界面会回望神谕是否应验。'
  },
  {
    term: 'Oracle 回响',
    alias: '记忆回响',
    source: 'book',
    text:
      '向世界提问时掷 1d6 得到的回答：否 / 是，以及四种附带效果——权杖记录异常、看见旧日影像、黑潮靠近、留下深刻回响。'
  },
  {
    term: '忆质',
    alias: 'Memory Matter',
    source: 'book',
    text:
      '构成记忆的质料。完成执念的角色可安然化为忆质；"忆质残像"身份即为某段被遗忘记忆的化身。'
  },
  {
    term: '命途',
    alias: 'Path',
    source: 'hsr',
    text:
      '角色创建时选择的倾向：记忆、智识、毁灭，或由你自己书写的"其他"。它决定你解决问题的姿态。'
  },
  {
    term: '来古士',
    alias: 'Lygus',
    source: 'book',
    text:
      '权杖守卫的派出者。系统程序会以毫无起伏的语调宣读你的"异常行为"，并要求你原地回滚。'
  },
  {
    term: '迷迷',
    alias: 'Mem',
    source: 'book',
    text: '一个粉色的、似曾相识的身影，坚持说你欠它一块糖，而且已经欠了三千年。',
    exp: true
  },
  {
    term: '大地兽 / 奇美拉',
    alias: '原生生物',
    source: 'book',
    text:
      '翁法罗斯的原生生物。大地兽驮着半间屋子缓行，双头奇美拉会为晚餐吵架——它们是这个世界还活着的证据。'
  },
  {
    term: '创世涡心',
    alias: '火种汇聚之处',
    source: 'book',
    text: '十二道光在此交汇又被搅成漩涡。世界的源代码，也是它的坟场，再创世的起点。'
  },
  {
    term: '葬忆彼岸 · 时光归墟',
    alias: '权杖内核',
    source: 'book',
    text:
      '没有天空，只有无数发光的记忆碎片像星尘一样悬浮坠落。所有被删除的人生都堆在这里——包括你曾经活过的那几轮。'
  }
]

/**
 * 泰坦名录 —— 考据层，仅供氛围参考。
 * 标注 level 为可信度；玩家可自行修订 static 数据而不影响规则引擎。
 */
export const TITANS = {
  note:
    '以下为公开资料中流传较广的泰坦名讳，标注为考据内容，请以官方最新剧情为准。规则引擎并不依赖此表，玩家可自由修订。',
  list: [
    { name: '刻法勒', alias: 'Kephale', domain: '负世之泰坦', level: '较可信' },
    { name: '雅努斯', alias: 'Janus', domain: '门径之泰坦', level: '较可信' },
    { name: '欧洛尼斯', alias: 'Oronyx', domain: '岁月之泰坦', level: '较可信' },
    { name: '尼卡多', alias: 'Nikador', domain: '纷争之泰坦', level: '较可信' },
    { name: '塞纳托斯', alias: 'Thanatos', domain: '死亡之泰坦', level: '较可信' },
    { name: '格奥里奥斯', alias: 'Georios', domain: '大地之泰坦', level: '存疑' },
    { name: '塔兰顿', alias: 'Talanton', domain: '律法/天秤之泰坦', level: '存疑' },
    { name: '墨涅塔', alias: 'Mnestia', domain: '记忆之泰坦', level: '存疑' },
    { name: '扎格列斯', alias: 'Zagreus', domain: '（权能待考）', level: '存疑' },
    { name: '法吉娜', alias: 'Phagousa', domain: '（权能待考）', level: '存疑' }
  ]
}

/** 已确立的地名（规则书 1d8 表 + 扩展） */
export const PLACES_NOTE =
  '规则书收录 8 处起始地点（奥赫玛、悬锋城、雅努萨波利斯、哀丽秘榭、斯缇科西亚、无名泰坦大墓、创世涡心、葬忆彼岸），本项目另扩展 2 处（昏晓渡口、折光回廊），共 10 处。'
