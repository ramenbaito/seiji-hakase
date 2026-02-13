/**
 * data.js — 質問データ・定数
 */

const STORAGE_KEY = "seiji_hakase_answers"
const TOTAL_QUESTIONS = 15

// 5軸の定義（設計書v2.0）
// ① 分配軸 (merit_equity)   — Merit ↔ Equity
// ② 政府役割軸 (small_big)  — Small ↔ Big
// ③ 共同体軸 (free_norm)    — 自由 ↔ 規範
// ④ 開放軸 (open_protect)   — 開放 ↔ 保護
// ⑤ 時間軸 (now_future)     — 今 ↔ 未来

const QUESTIONS = [
  {
    id: "Q1",
    title: "この街のお金、どこに近づける？",
    subtitle: "同じ街にある2つの現実。どちらに近づきたい？",
    left: {
      icon: "💼👶",
      label: "働く人・子育て",
      desc: "現役世代の負担や支えを中心に考える",
    },
    right: {
      icon: "🏥👴",
      label: "医療・介護の安心",
      desc: "高齢者の安心を厚めに置く",
    },
    axes: ["small_big"],
    taxDelta: { "-2": 8, "-1": 4, "0": 0, "1": -4, "2": -8 },
  },
  {
    id: "Q2",
    title: "同じ街の中で、どこまで支え合う？",
    subtitle: "成果と支え合い。距離感はどっち寄り？",
    left: {
      icon: "💻📈",
      label: "成果を重視",
      desc: "伸びる力を優先する",
    },
    right: {
      icon: "🤝🧑‍🔧",
      label: "支え合いを重視",
      desc: "支える仕組みを厚くする",
    },
    axes: ["merit_equity"],
    taxDelta: { "-2": 6, "-1": 3, "0": 0, "1": -3, "2": -6 },
  },
  {
    id: "Q3",
    title: "子どもの学び、どこまで社会で支える？",
    subtitle: "家庭と社会の役割分担。どこに近づく？",
    left: {
      icon: "👪📘",
      label: "家庭中心",
      desc: "家庭の選択を尊重する",
    },
    right: {
      icon: "🏫👩‍🏫",
      label: "社会で支える",
      desc: "社会で支える範囲を広げる",
    },
    axes: ["merit_equity", "small_big"],
    taxDelta: { "-2": 8, "-1": 4, "0": 0, "1": -4, "2": -8 },
  },
  {
    id: "Q4",
    title: "働き方のルール、どこまで決める？",
    subtitle: "自由に働ける環境と、守られる環境。どちらに近い？",
    left: {
      icon: "🚀💡",
      label: "自由な働き方",
      desc: "個人の裁量や挑戦を広げる",
    },
    right: {
      icon: "🛡️📋",
      label: "ルールで守る",
      desc: "労働者の権利をしっかり守る",
    },
    axes: ["merit_equity", "small_big"],
    taxDelta: { "-2": 6, "-1": 3, "0": 0, "1": -3, "2": -6 },
  },
  {
    id: "Q5",
    title: "医療や年金、どこまで広げる？",
    subtitle: "社会保障の範囲。どのくらいが自分の感覚に近い？",
    left: {
      icon: "💰🏦",
      label: "自分で備える",
      desc: "自己負担を増やして保険料を抑える",
    },
    right: {
      icon: "🏥🤲",
      label: "みんなで支える",
      desc: "負担は増えても手厚い保障にする",
    },
    axes: ["small_big"],
    taxDelta: { "-2": 8, "-1": 4, "0": 0, "1": -4, "2": -8 },
  },
  {
    id: "Q6",
    title: "地方と都市、どうつなぐ？",
    subtitle: "お金や人の流れ。どちらの考えに近い？",
    left: {
      icon: "🏙️📊",
      label: "都市に集中",
      desc: "効率を重視して都市部に投資する",
    },
    right: {
      icon: "🌾🏘️",
      label: "地方を手厚く",
      desc: "地方にも均等に届ける",
    },
    axes: ["open_protect"],
    taxDelta: null,
  },
  {
    id: "Q7",
    title: "環境と経済、どうバランスする？",
    subtitle: "成長と環境保護。どちらに近づきたい？",
    left: {
      icon: "🏭📈",
      label: "経済成長を優先",
      desc: "まず経済を伸ばしてから環境に投資",
    },
    right: {
      icon: "🌱🌍",
      label: "環境を優先",
      desc: "コストをかけてでも環境を守る",
    },
    axes: ["now_future"],
    taxDelta: { "-2": 6, "-1": 3, "0": 0, "1": -3, "2": -6 },
  },
  {
    id: "Q8",
    title: "外国との関わり、どこまで開く？",
    subtitle: "貿易や人の移動。どちらの距離感が近い？",
    left: {
      icon: "🌐✈️",
      label: "もっと開く",
      desc: "自由な貿易・交流を広げる",
    },
    right: {
      icon: "🏯🛡️",
      label: "慎重に守る",
      desc: "国内の産業や文化を守る",
    },
    axes: ["open_protect"],
    taxDelta: null,
  },
  {
    id: "Q9",
    title: "税金の取り方、どう考える？",
    subtitle: "たくさん稼ぐ人ほど多く払う？ みんな同じ割合？",
    left: {
      icon: "📐⚖️",
      label: "同じ割合で",
      desc: "シンプルに一律の税率にする",
    },
    right: {
      icon: "📊🏗️",
      label: "収入に応じて",
      desc: "高収入の人ほど多く負担する",
    },
    axes: ["merit_equity"],
    taxDelta: null,
  },
  {
    id: "Q10",
    title: "安全保障、どこに重心を置く？",
    subtitle: "国の守り方。どちらの考えに近い？",
    left: {
      icon: "🤝🕊️",
      label: "対話・外交中心",
      desc: "話し合いや国際協力で安全を守る",
    },
    right: {
      icon: "🛡️⚔️",
      label: "防衛力を強化",
      desc: "自分の国の力で守れるようにする",
    },
    axes: ["open_protect", "now_future"],
    taxDelta: null,
  },
  {
    id: "Q11",
    title: "エネルギー、何を中心にする？",
    subtitle: "電気の作り方。どちらの方向に近い？",
    left: {
      icon: "⚡🔬",
      label: "安定供給を重視",
      desc: "原子力や火力で安定した電力を確保",
    },
    right: {
      icon: "☀️🌊",
      label: "再生可能エネルギー",
      desc: "太陽光や風力を中心に切り替える",
    },
    axes: ["now_future"],
    taxDelta: null,
  },
  {
    id: "Q12",
    title: "家族のかたち、どう考える？",
    subtitle: "結婚や家族の制度。どちらに近い？",
    left: {
      icon: "🏠📖",
      label: "伝統的な形を大切に",
      desc: "これまでの家族の形を基本にする",
    },
    right: {
      icon: "🌈🤝",
      label: "多様な形を認める",
      desc: "いろいろな家族のあり方を制度で支える",
    },
    axes: ["free_norm"],
    taxDelta: null,
  },
  {
    id: "Q13",
    title: "情報やネット、どこまで自由にする？",
    subtitle: "表現の自由と安全のバランス。どちらに近い？",
    left: {
      icon: "📢🗽",
      label: "自由を広く",
      desc: "発言や表現の自由をできるだけ守る",
    },
    right: {
      icon: "🔒👁️",
      label: "安全を優先",
      desc: "有害な情報は規制して安全を守る",
    },
    axes: ["free_norm"],
    taxDelta: null,
  },
  {
    id: "Q14",
    title: "国の借金、どう向き合う？",
    subtitle: "財政の考え方。どちらに近い？",
    left: {
      icon: "📉✂️",
      label: "支出を減らす",
      desc: "借金を減らすために支出を絞る",
    },
    right: {
      icon: "💸🔧",
      label: "投資を続ける",
      desc: "必要な投資は借金してでも続ける",
    },
    axes: ["now_future", "small_big"],
    taxDelta: null,
  },
  {
    id: "Q15",
    title: "政治への関わり方、どうしたい？",
    subtitle: "市民と政治の距離感。どちらに近い？",
    left: {
      icon: "🗳️👤",
      label: "代表に任せる",
      desc: "選挙で選んだ人に判断を委ねる",
    },
    right: {
      icon: "📣👥",
      label: "もっと直接参加",
      desc: "住民投票や市民参加を増やす",
    },
    axes: ["free_norm", "open_protect"],
    taxDelta: null,
  },
]
