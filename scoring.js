/**
 * scoring.js — スコア変換・税計算・状態管理
 */

function clampValue(v) {
  var n = parseInt(String(v), 10)
  if (isNaN(n)) return 0
  return Math.max(-2, Math.min(2, n))
}

function getTaxDelta(question, value) {
  if (!question.taxDelta) return 0
  var delta = question.taxDelta[String(value)]
  return typeof delta === "number" ? delta : 0
}

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY)
    var parsed = raw ? safeParse(raw) : null
    if (!parsed || typeof parsed !== "object") {
      return { currentIndex: 0, tax: 0, answers: {} }
    }
    var currentIndex = typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0
    var tax = typeof parsed.tax === "number" ? parsed.tax : 0
    var answers = parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {}
    return {
      currentIndex: Math.max(0, Math.min(QUESTIONS.length - 1, currentIndex)),
      tax: tax,
      answers: answers,
    }
  } catch (e) {
    console.warn("loadState error:", e)
    return { currentIndex: 0, tax: 0, answers: {} }
  }
}

function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentIndex: state.currentIndex,
        tax: state.tax,
        answers: state.answers,
      })
    )
  } catch (e) {
    console.warn("saveState error:", e)
  }
}

function createNewState() {
  return { currentIndex: 0, tax: 0, answers: {} }
}

function recalcTax(answers) {
  var total = 0
  for (var i = 0; i < QUESTIONS.length; i++) {
    var q = QUESTIONS[i]
    var a = answers[q.id]
    if (a && typeof a.value === "number") {
      total += getTaxDelta(q, a.value)
    }
  }
  return total
}

// 5軸スコア計算（各軸 -2〜+2 の平均 → 0〜100 に正規化）
// 左寄り(-2)=0, 中央(0)=50, 右寄り(+2)=100
var AXIS_NAMES = {
  merit_equity: "分配",
  small_big: "政府の役割",
  free_norm: "自由と規範",
  open_protect: "開放と保護",
  now_future: "今と未来",
}

var AXIS_LEFT_LABELS = {
  merit_equity: "成果重視",
  small_big: "小さな政府",
  free_norm: "自由",
  open_protect: "開放",
  now_future: "今を重視",
}

var AXIS_RIGHT_LABELS = {
  merit_equity: "平等重視",
  small_big: "大きな政府",
  free_norm: "規範",
  open_protect: "保護",
  now_future: "未来を重視",
}

function calcAxisScores(answers) {
  var sums = {}
  var counts = {}
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]
  for (var i = 0; i < axes.length; i++) {
    sums[axes[i]] = 0
    counts[axes[i]] = 0
  }
  for (var j = 0; j < QUESTIONS.length; j++) {
    var q = QUESTIONS[j]
    var a = answers[q.id]
    if (!a || typeof a.value !== "number") continue
    if (!q.axes) continue
    for (var k = 0; k < q.axes.length; k++) {
      var axis = q.axes[k]
      sums[axis] += a.value
      counts[axis] += 1
    }
  }
  var scores = {}
  for (var m = 0; m < axes.length; m++) {
    var ax = axes[m]
    if (counts[ax] > 0) {
      scores[ax] = Math.round(((sums[ax] / counts[ax]) + 2) / 4 * 100)
    } else {
      scores[ax] = 50
    }
  }
  return scores
}

// 政党データ（各軸 0〜100）
// ※ 実際の政党の立場を参考にした概算値。誘導目的ではない。
var PARTIES = [
  {
    name: "自民党",
    scores: { merit_equity: 35, small_big: 45, free_norm: 40, open_protect: 45, now_future: 40 },
    color: "#3b82f6",
    url: "https://www.jimin.jp/",
    policyUrl: "https://www.jimin.jp/policy/"
  },
  {
    name: "立憲民主党",
    scores: { merit_equity: 65, small_big: 65, free_norm: 60, open_protect: 55, now_future: 55 },
    color: "#ef4444",
    url: "https://cdp-japan.jp/",
    policyUrl: "https://cdp-japan.jp/policy"
  },
  {
    name: "日本維新の会",
    scores: { merit_equity: 30, small_big: 30, free_norm: 55, open_protect: 50, now_future: 50 },
    color: "#22c55e",
    url: "https://o-ishin.jp/",
    policyUrl: "https://o-ishin.jp/policy/"
  },
  {
    name: "公明党",
    scores: { merit_equity: 55, small_big: 55, free_norm: 45, open_protect: 45, now_future: 50 },
    color: "#a855f7",
    url: "https://www.komei.or.jp/",
    policyUrl: "https://www.komei.or.jp/policy/"
  },
  {
    name: "国民民主党",
    scores: { merit_equity: 50, small_big: 45, free_norm: 55, open_protect: 50, now_future: 55 },
    color: "#f59e0b",
    url: "https://new-kokumin.jp/",
    policyUrl: "https://new-kokumin.jp/policy"
  },
  {
    name: "共産党",
    scores: { merit_equity: 80, small_big: 80, free_norm: 50, open_protect: 60, now_future: 55 },
    color: "#dc2626",
    url: "https://www.jcp.or.jp/",
    policyUrl: "https://www.jcp.or.jp/web_policy/"
  },
  {
    name: "れいわ新選組",
    scores: { merit_equity: 85, small_big: 85, free_norm: 55, open_protect: 55, now_future: 50 },
    color: "#ec4899",
    url: "https://reiwa-shinsengumi.com/",
    policyUrl: "https://reiwa-shinsengumi.com/policy/"
  },
  {
    name: "社民党",
    scores: { merit_equity: 75, small_big: 75, free_norm: 60, open_protect: 55, now_future: 55 },
    color: "#06b6d4",
    url: "https://sdp.or.jp/",
    policyUrl: "https://sdp.or.jp/policy/"
  },
  {
    name: "参政党",
    scores: { merit_equity: 35, small_big: 40, free_norm: 30, open_protect: 20, now_future: 40 },
    color: "#f97316",
    url: "https://www.sanseito.jp/",
    policyUrl: "https://www.sanseito.jp/policy/"
  },
  {
    name: "日本保守党",
    scores: { merit_equity: 30, small_big: 35, free_norm: 25, open_protect: 15, now_future: 35 },
    color: "#1e3a5f",
    url: "https://hoshuto.jp/",
    policyUrl: "https://hoshuto.jp/policy/"
  },
]

function calcPartyDistances(userScores) {
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]
  var results = []
  for (var i = 0; i < PARTIES.length; i++) {
    var p = PARTIES[i]
    var sumSq = 0
    for (var j = 0; j < axes.length; j++) {
      var diff = userScores[axes[j]] - p.scores[axes[j]]
      sumSq += diff * diff
    }
    var distance = Math.sqrt(sumSq)
    var maxDist = Math.sqrt(5 * 100 * 100)
    var match = Math.round(Math.max(0, (1 - distance / maxDist) * 100))
    results.push({ name: p.name, match: match, color: p.color, distance: distance, url: p.url, policyUrl: p.policyUrl })
  }
  results.sort(function (a, b) { return b.match - a.match })
  return results
}

// ═══════════════════════════════════════════════════════════
// キャラクター生成システム
// ═══════════════════════════════════════════════════════════

// 軸マッピング: 内部名 → 仕様書の軸記号
// merit_equity → E（経済: 攻め↔守り）
// small_big    → G（政府: 小さく↔大きく）
// free_norm    → S（共同体: 自由↔規範）
// open_protect → F（開放: 開放↔保護）
// now_future   → D（時間: 今↔未来）

// ベース動物データ（dominant軸 × 方向）
var BASE_ANIMALS = {
  merit_equity: {
    high: { emoji: "🐻", name: "ベア", tag: "慎重な", desc: "守って崩さないタイプ", color: "#8B6914" },
    low: { emoji: "🐂", name: "ブル", tag: "強気の", desc: "伸ばして強くするタイプ", color: "#D4A574" },
    mid: { emoji: "🦊", name: "フォックス", tag: "現実派の", desc: "状況を見て判断するタイプ", color: "#E8853D" }
  },
  small_big: {
    high: { emoji: "🐘", name: "エレファント", tag: "制度派の", desc: "制度で人を守るタイプ", color: "#9CA3AF" },
    low: { emoji: "🦒", name: "ジラフ", tag: "自立派の", desc: "自分の足で立つタイプ", color: "#F5C542" },
    mid: { emoji: "🦉", name: "アウル", tag: "賢明な", desc: "冷静に分析するタイプ", color: "#7C3AED" }
  },
  free_norm: {
    high: { emoji: "🐺", name: "ウルフ", tag: "統率の", desc: "秩序とルールを重んじるタイプ", color: "#6B7280" },
    low: { emoji: "🦦", name: "オター", tag: "自由な", desc: "個人の自由を大切にするタイプ", color: "#60A5FA" },
    mid: { emoji: "🦋", name: "バタフライ", tag: "柔軟な", desc: "状況に合わせて変わるタイプ", color: "#EC4899" }
  },
  open_protect: {
    high: { emoji: "🦅", name: "イーグル", tag: "守護の", desc: "自国の文化と産業を守るタイプ", color: "#92400E" },
    low: { emoji: "🕊️", name: "ダヴ", tag: "協調の", desc: "国際交流と開放を好むタイプ", color: "#E0E7FF" },
    mid: { emoji: "🐧", name: "ペンギン", tag: "社交の", desc: "バランスを取るタイプ", color: "#06B6D4" }
  },
  now_future: {
    high: { emoji: "🦉", name: "アウル", tag: "先見の", desc: "将来を見据えて投資するタイプ", color: "#7C3AED" },
    low: { emoji: "🐿️", name: "リス", tag: "堅実な", desc: "今の暮らしを確実に守るタイプ", color: "#B45309" },
    mid: { emoji: "🐢", name: "タートル", tag: "忍耐の", desc: "じっくり考えるタイプ", color: "#059669" }
  }
}

// 装備アイテム（各軸 × Low/Mid/High）
var EQUIP_ITEMS = {
  merit_equity: {
    low: { emoji: "📈", label: "成長グラフ" },
    mid: { emoji: "⚖️", label: "天秤" },
    high: { emoji: "🛡️", label: "安全網" }
  },
  small_big: {
    low: { emoji: "🧰", label: "自立ツール" },
    mid: { emoji: "🤝", label: "協力の手" },
    high: { emoji: "🏛️", label: "公共の柱" }
  },
  free_norm: {
    low: { emoji: "🎈", label: "自由の風船" },
    mid: { emoji: "🧩", label: "折衷パズル" },
    high: { emoji: "📜", label: "ルールの巻物" }
  },
  open_protect: {
    low: { emoji: "🚢", label: "交易の船" },
    mid: { emoji: "🌐", label: "地球儀" },
    high: { emoji: "🧱", label: "防壁ブロック" }
  },
  now_future: {
    low: { emoji: "🧯", label: "緊急キット" },
    mid: { emoji: "🔁", label: "循環の輪" },
    high: { emoji: "🌱", label: "未来の種" }
  }
}

// スコアの方向を判定
function getDirection(score) {
  if (score <= 39) return "low"
  if (score >= 61) return "high"
  return "mid"
}

// ベース動物を決定（最も強い特徴の軸で決める）
function pickBaseAnimal(axisScores) {
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]
  var maxIntensity = -1
  var dominantAxis = axes[0]

  for (var i = 0; i < axes.length; i++) {
    var intensity = Math.abs((axisScores[axes[i]] || 50) - 50)
    if (intensity > maxIntensity) {
      maxIntensity = intensity
      dominantAxis = axes[i]
    }
  }

  var direction = getDirection(axisScores[dominantAxis] || 50)
  var animal = BASE_ANIMALS[dominantAxis][direction]

  return {
    animal: animal,
    dominantAxis: dominantAxis,
    direction: direction,
    intensity: maxIntensity
  }
}

// 装備アイテムを5軸分生成
function buildItems(axisScores) {
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]
  var items = []
  for (var i = 0; i < axes.length; i++) {
    var dir = getDirection(axisScores[axes[i]] || 50)
    items.push({
      axis: axes[i],
      item: EQUIP_ITEMS[axes[i]][dir]
    })
  }
  return items
}

// フレーバーテキスト生成
function buildFlavorText(base, axisScores) {
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]
  // intensity上位2軸を取得
  var ranked = axes.map(function (ax) {
    return { axis: ax, intensity: Math.abs((axisScores[ax] || 50) - 50), score: axisScores[ax] || 50 }
  }).sort(function (a, b) { return b.intensity - a.intensity })

  var top2 = ranked.slice(0, 2)

  var axisDescMap = {
    merit_equity: {
      low: "競争を通じて成長を重視し、実力主義を信条とする",
      high: "平等と公正を最優先し、社会的安全網を重視する",
      mid: "状況に応じて競争と協調のバランスを取る"
    },
    small_big: {
      low: "小さな政府と自由市場経済を志向し、自己責任を重んじる",
      high: "大きな政府の役割を信じ、手厚い社会保障を求める",
      mid: "政府の役割について現実的なバランスを模索する"
    },
    free_norm: {
      low: "個人の自由と自己決定権を何よりも大切にする",
      high: "社会秩序と共同体のルールを遵守することを重視する",
      mid: "自由と規範の間で柔軟な対応を心がける"
    },
    open_protect: {
      low: "国際協力と文化交流を積極的に推進する",
      high: "自国の文化と産業を守ることを最優先する",
      mid: "開放と保護のバランスを慎重に検討する"
    },
    now_future: {
      low: "現在の経済安定と生活の質を最優先する",
      high: "将来の世代と環境保護に投資することを重視する",
      mid: "現在と未来のニーズをバランス良く配分する"
    }
  }

  var lines = []
  for (var i = 0; i < top2.length; i++) {
    var dir = getDirection(top2[i].score)
    var desc = axisDescMap[top2[i].axis]
    if (desc) {
      lines.push(dir === "mid" ? desc.mid : (dir === "low" ? desc.low : desc.high))
    }
  }

  // 性格の強さに応じた表現を追加
  var intensityText = ""
  if (base.intensity > 30) {
    intensityText = "この傾向は非常に強く、"
  } else if (base.intensity > 15) {
    intensityText = "この傾向は比較的強く、"
  } else {
    intensityText = "この傾向は穏やかですが、"
  }

  return intensityText + lines.join("し、") + "する政治スタンスの持ち主です。"
}

// メインのキャラクター生成関数
function buildCharacter(axisScores) {
  var baseResult = pickBaseAnimal(axisScores)
  var items = buildItems(axisScores)
  var flavorText = buildFlavorText(baseResult, axisScores)

  return {
    animal: baseResult.animal,
    dominantAxis: baseResult.dominantAxis,
    direction: baseResult.direction,
    intensity: baseResult.intensity,
    items: items,
    fullName: baseResult.animal.tag + baseResult.animal.name,
    tagline: baseResult.animal.desc,
    description: flavorText
  }
}
