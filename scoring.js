/**
 * scoring.js — スコア変換・税計算・状態管理
 */

function valueToInternal(value) {
  return (value + 2) * 25
}

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
}

function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentIndex: state.currentIndex,
      tax: state.tax,
      answers: state.answers,
    })
  )
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
  { name: "自民党", scores: { merit_equity: 35, small_big: 45, free_norm: 40, open_protect: 45, now_future: 40 }, color: "#3b82f6" },
  { name: "立憲民主党", scores: { merit_equity: 65, small_big: 65, free_norm: 60, open_protect: 55, now_future: 55 }, color: "#ef4444" },
  { name: "日本維新の会", scores: { merit_equity: 30, small_big: 30, free_norm: 55, open_protect: 50, now_future: 50 }, color: "#22c55e" },
  { name: "公明党", scores: { merit_equity: 55, small_big: 55, free_norm: 45, open_protect: 45, now_future: 50 }, color: "#a855f7" },
  { name: "国民民主党", scores: { merit_equity: 50, small_big: 45, free_norm: 55, open_protect: 50, now_future: 55 }, color: "#f59e0b" },
  { name: "共産党", scores: { merit_equity: 80, small_big: 80, free_norm: 50, open_protect: 60, now_future: 55 }, color: "#dc2626" },
  { name: "れいわ新選組", scores: { merit_equity: 85, small_big: 85, free_norm: 55, open_protect: 55, now_future: 50 }, color: "#ec4899" },
  { name: "社民党", scores: { merit_equity: 75, small_big: 75, free_norm: 60, open_protect: 55, now_future: 55 }, color: "#06b6d4" },
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
    results.push({ name: p.name, match: match, color: p.color, distance: distance })
  }
  results.sort(function (a, b) { return b.match - a.match })
  return results
}
