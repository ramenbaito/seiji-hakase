/**
 * ui.js — v0完全移植版 政治博士 RPG UI
 */

// ═══════════════════════════════════════════════════════════
// Global State & Elements
// ═══════════════════════════════════════════════════════════
var els = {
  app: document.getElementById("app"),
  splash: document.getElementById("splash"),
  fbOpen: document.getElementById("fbOpen"),
  fbOverlay: document.getElementById("fbOverlay"),
  fbText: document.getElementById("fbText"),
  fbStatus: document.getElementById("fbStatus"),
  fbSend: document.getElementById("fbSend"),
  fbCancel: document.getElementById("fbCancel")
}

var state = loadState()
var currentLevel = 1
var isTransitioning = false
var starFieldAnimation = null

// ═══════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// clampValue, valueToInternal は scoring.js で定義済み

// ═══════════════════════════════════════════════════════════
// v0風のStarField Canvas
// ═══════════════════════════════════════════════════════════
function createStarField(canvas) {
  if (!canvas) return null

  var ctx = canvas.getContext("2d")
  if (!ctx) return null

  var stars = []
  var animationId = null

  function resize() {
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    initStars()
  }

  function initStars() {
    stars = []
    for (var i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.6,
        r: Math.random() * 2 + 0.5,
        s: Math.random() * 0.02 + 0.005,
        o: Math.random() * Math.PI * 2
      })
    }
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (var i = 0; i < stars.length; i++) {
      var star = stars[i]
      var alpha = (Math.sin(timestamp * star.s + star.o) + 1) / 2 * 0.8 + 0.2

      // 星本体
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,255,240," + alpha + ")"
      ctx.fill()

      // 光晕
      if (star.r > 1.5) {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255,230,109," + (alpha * 0.15) + ")"
        ctx.fill()
      }
    }

    animationId = requestAnimationFrame(draw)
  }

  resize()
  window.addEventListener("resize", resize)
  animationId = requestAnimationFrame(draw)

  return {
    destroy: function () {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      window.removeEventListener("resize", resize)
    }
  }
}

// ═══════════════════════════════════════════════════════════
// v0風のSVGキャラクター
// ═══════════════════════════════════════════════════════════
function createHeroSVG(size) {
  size = size || 80
  return `
    <svg width="${size}" height="${size * 1.6}" viewBox="0 0 120 192" aria-hidden="true">
      <!-- 博士帽 -->
      <path d="M30 36 L60 8 L90 36 Z" fill="#2D3748" stroke="#4A5568" stroke-width="1.5"/>
      <rect x="25" y="34" width="70" height="8" rx="2" fill="#2D3748" stroke="#4A5568" stroke-width="1"/>
      <circle cx="60" cy="20" r="4" fill="#FFE66D"/>
      
      <!-- 頭 -->
      <circle cx="60" cy="60" r="28" fill="#FFDBB4"/>
      
      <!-- メガネ -->
      <rect x="40" y="52" width="16" height="12" rx="3" fill="none" stroke="#4A5568" stroke-width="2.5"/>
      <rect x="64" y="52" width="16" height="12" rx="3" fill="none" stroke="#4A5568" stroke-width="2.5"/>
      <line x1="56" y1="58" x2="64" y2="58" stroke="#4A5568" stroke-width="2"/>
      
      <!-- 目 -->
      <ellipse cx="48" cy="59" rx="4" ry="4.5" fill="#1A1A1A"/>
      <ellipse cx="72" cy="59" rx="4" ry="4.5" fill="#1A1A1A"/>
      <circle cx="50" cy="57" r="1.5" fill="#FFF"/>
      <circle cx="74" cy="57" r="1.5" fill="#FFF"/>
      
      <!-- 口 -->
      <path d="M52 70 Q60 78 68 70" fill="none" stroke="#E87040" stroke-width="2.5" stroke-linecap="round"/>
      
      <!-- ほっぺ -->
      <ellipse cx="38" cy="68" rx="6" ry="3.5" fill="#FFB4B4" opacity="0.45"/>
      <ellipse cx="82" cy="68" rx="6" ry="3.5" fill="#FFB4B4" opacity="0.45"/>
      
      <!-- 体 -->
      <rect x="36" y="90" width="48" height="52" rx="8" fill="#4ECDC4"/>
      <path d="M56 90 L64 90 L62 120 L60 123 L58 120 Z" fill="#45B7A8"/>
      <circle cx="60" cy="98" r="4" fill="#FFE66D"/>
      
      <!-- 腕 -->
      <rect x="20" y="94" width="18" height="36" rx="7" fill="#4ECDC4"/>
      <rect x="82" y="94" width="18" height="36" rx="7" fill="#4ECDC4"/>
      <circle cx="29" cy="132" r="7" fill="#FFDBB4"/>
      <circle cx="91" cy="132" r="7" fill="#FFDBB4"/>
      
      <!-- 足 -->
      <rect x="40" y="140" width="16" height="30" rx="6" fill="#2D3748"/>
      <rect x="64" y="140" width="16" height="30" rx="6" fill="#2D3748"/>
      <ellipse cx="48" cy="172" rx="11" ry="5" fill="#1A1A1A"/>
      <ellipse cx="72" cy="172" rx="11" ry="5" fill="#1A1A1A"/>
    </svg>
  `
}

function createNPCSVGS(side, active, intensity) {
  var baseColor = side === "left" ? "#4ECDC4" : "#FF6B6B"
  var hairColors = side === "left" ? ["#5A3A20", "#2A2A2A", "#8B6914"] : ["#CCCCCC", "#888888", "#AAAAAA"]
  // intensity: 0=中立, 1=やや, 2=強く → スケール: 0%, 10%, 30%
  var absInt = intensity || 0
  var scalePct = absInt === 2 ? 30 : absInt === 1 ? 10 : 0
  var scale = 1 + scalePct / 100
  // active = ユーザーが寄っている → 笑顔、そうでなければ普通/困り顔
  var mouthY = function (main) {
    if (active) return main ? 'M27 28 Q30 34 33 28' : 'M27 27 Q30 31 33 27'
    return main ? 'M27 31 Q30 28 33 31' : 'M27 30 Q30 28 33 30'
  }
  var eyeShape = function () {
    if (active) return '<circle cx="25" cy="23" r="2" fill="#1A1A1A"/><circle cx="35" cy="23" r="2" fill="#1A1A1A"/><circle cx="26" cy="22" r="0.8" fill="#FFF"/><circle cx="36" cy="22" r="0.8" fill="#FFF"/>'
    return '<ellipse cx="25" cy="24" rx="2" ry="1.5" fill="#1A1A1A"/><ellipse cx="35" cy="24" rx="2" ry="1.5" fill="#1A1A1A"/>'
  }
  var cheeks = active ? '<ellipse cx="21" cy="27" rx="3" ry="1.5" fill="#FFB4B4" opacity="0.4"/><ellipse cx="39" cy="27" rx="3" ry="1.5" fill="#FFB4B4" opacity="0.4"/>' : ''

  var npcs = ""
  for (var i = 0; i < 3; i++) {
    var isMain = i === 1
    var baseW = isMain ? 44 : 32
    var baseH = isMain ? 80 : 60
    var width = Math.round(baseW * (active ? scale : 1))
    var height = Math.round(baseH * (active ? scale : 1))
    var opacity = isMain ? (active ? 1 : 0.7) : (active ? 0.7 : 0.4)

    npcs += `
      <svg viewBox="0 0 60 100" style="width:${width}px;height:${height}px;opacity:${opacity};transition:all 0.3s ease-out" aria-hidden="true">
        <circle cx="30" cy="${isMain ? 22 : 14}" r="${isMain ? 16 : 13}" fill="#FFDBB4"/>
        <ellipse cx="30" cy="${isMain ? 12 : 14}" rx="${isMain ? 17 : 14}" ry="${isMain ? 10 : 8}" fill="${hairColors[i]}"/>
        ${eyeShape()}
        <path d="${mouthY(isMain)}" fill="none" stroke="#E87040" stroke-width="1.5" stroke-linecap="round"/>
        ${cheeks}
        <rect x="16" y="40" width="28" height="28" rx="5" fill="${isMain ? baseColor : baseColor + '99'}"/>
        <rect x="19" y="66" width="9" height="18" rx="3" fill="#4A5568"/>
        <rect x="32" y="66" width="9" height="18" rx="3" fill="#4A5568"/>
        <ellipse cx="23" cy="85" rx="6" ry="3" fill="#2D3748"/>
        <ellipse cx="37" cy="85" rx="6" ry="3" fill="#2D3748"/>
      </svg>
    `
  }

  return npcs
}

// ═══════════════════════════════════════════════════════════
// v0風のRPGシーン
// ═══════════════════════════════════════════════════════════
function getTimeOfDay(idx) {
  // Q1(0)=早朝5時 → Q15(14)=深夜23時
  var hour = 5 + Math.round(idx * (18 / 14))
  var min = (idx * 77) % 60 // 疑似的な分（バラけるように）
  var timeStr = hour + ":" + (min < 10 ? "0" : "") + min
  if (hour <= 6) return { label: "早朝", timeStr: timeStr, sky: "linear-gradient(180deg, #1a1a3e 0%, #4a3a6a 30%, #e8a060 70%, #f0c888 100%)", showMoon: false, showSun: true, sunLow: true, stars: false, windowGlow: 0.15 }
  if (hour <= 8) return { label: "朝", timeStr: timeStr, sky: "linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #FFE4B5 100%)", showMoon: false, showSun: true, sunLow: false, stars: false, windowGlow: 0.1 }
  if (hour <= 11) return { label: "午前", timeStr: timeStr, sky: "linear-gradient(180deg, #5BA3D9 0%, #87CEEB 50%, #A8D8FF 100%)", showMoon: false, showSun: true, sunLow: false, stars: false, windowGlow: 0.05 }
  if (hour <= 14) return { label: "昼", timeStr: timeStr, sky: "linear-gradient(180deg, #4A90D9 0%, #6BB5FF 50%, #87CEEB 100%)", showMoon: false, showSun: true, sunLow: false, stars: false, windowGlow: 0.05 }
  if (hour <= 16) return { label: "午後", timeStr: timeStr, sky: "linear-gradient(180deg, #5A8FCE 0%, #87BBDE 50%, #C8A86E 100%)", showMoon: false, showSun: true, sunLow: false, stars: false, windowGlow: 0.1 }
  if (hour <= 18) return { label: "夕方", timeStr: timeStr, sky: "linear-gradient(180deg, #2a1a4a 0%, #c44a20 30%, #f0a040 60%, #ffe880 100%)", showMoon: false, showSun: true, sunLow: true, stars: false, windowGlow: 0.3 }
  if (hour <= 20) return { label: "夜", timeStr: timeStr, sky: "linear-gradient(180deg, #0a1628 0%, #1a2a4a 50%, #2a3a5a 100%)", showMoon: true, showSun: false, sunLow: false, stars: true, windowGlow: 0.6 }
  return { label: "深夜", timeStr: timeStr, sky: "linear-gradient(180deg, #050a14 0%, #0F1923 40%, #1a2744 100%)", showMoon: true, showSun: false, sunLow: false, stars: true, windowGlow: 0.8 }
}

function getSceneEmoji(sceneName) {
  var emojis = {
    "朝の公園": "🌳",
    "朝の商店街": "🏪",
    "学校の正門前": "🏫",
    "港の見える橋の上": "🌉",
    "工場のそばの河川敷": "🏭",
    "オフィスビルの前": "🏢",
    "駅前のロータリー": "🚉",
    "ショッピングモール": "🛒",
    "家のリビング": "🏠",
    "病院の待合室": "🏥",
    "鉄塔の見える丘": "⚡",
    "体育館の前": "🏟️",
    "夜の交差点": "🚦",
    "夜のスーパー": "🌙",
    "深夜の展望台": "🔭"
  }
  return emojis[sceneName] || "📍"
}

function getGroundStyle(sceneName) {
  var grounds = {
    "朝の公園": "linear-gradient(180deg, #2a5a2a 0%, #1a4a1a 100%)",
    "朝の商店街": "linear-gradient(180deg, #3A3D42 0%, #2D3032 100%)",
    "学校の正門前": "linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)",
    "港の見える橋の上": "linear-gradient(180deg, #2a4a6a 0%, #1a3a5a 100%)",
    "工場のそばの河川敷": "linear-gradient(180deg, #3a5a3a 0%, #2a4a2a 100%)",
    "オフィスビルの前": "linear-gradient(180deg, #4a4a50 0%, #3a3a40 100%)",
    "駅前のロータリー": "linear-gradient(180deg, #4a4a4a 0%, #3a3a3a 100%)",
    "ショッピングモール": "linear-gradient(180deg, #5a5050 0%, #4a4040 100%)",
    "家のリビング": "linear-gradient(180deg, #5a4a3a 0%, #4a3a2a 100%)",
    "病院の待合室": "linear-gradient(180deg, #4a4a50 0%, #3a3a40 100%)",
    "鉄塔の見える丘": "linear-gradient(180deg, #2a5a2a 0%, #1a4a1a 100%)",
    "体育館の前": "linear-gradient(180deg, #5a4a3a 0%, #4a3a2a 100%)",
    "夜の交差点": "linear-gradient(180deg, #2a2a30 0%, #1a1a20 100%)",
    "夜のスーパー": "linear-gradient(180deg, #2a2a30 0%, #1a1a20 100%)",
    "深夜の展望台": "linear-gradient(180deg, #1a2a1a 0%, #0a1a0a 100%)"
  }
  return grounds[sceneName] || "linear-gradient(180deg, #3A3D42 0%, #2D3032 100%)"
}

function getGroundLines(sceneName) {
  // 公園・丘・河川敷は草のドット、それ以外は道路の白線
  var grassScenes = ["朝の公園", "工場のそばの河川敷", "鉄塔の見える丘", "深夜の展望台"]
  if (grassScenes.indexOf(sceneName) >= 0) {
    var dots = ""
    for (var i = 0; i < 12; i++) {
      dots += '<div style="position:absolute;left:' + (5 + i * 8) + '%;top:' + (20 + (i * 37) % 60) + '%;width:3px;height:6px;background:rgba(100,180,80,0.3);border-radius:50%"></div>'
    }
    return dots
  }
  // 橋は手すり風
  if (sceneName === "港の見える橋の上") {
    var rails = ""
    for (var j = 0; j < 8; j++) {
      rails += '<div style="position:absolute;left:' + (5 + j * 12) + '%;top:10%;width:2px;height:40%;background:rgba(150,150,160,0.4);border-radius:1px"></div>'
    }
    return '<div style="position:absolute;left:0;right:0;top:8%;height:2px;background:rgba(150,150,160,0.3)"></div>' + rails
  }
  // デフォルト: 道路の白線
  var lines = ""
  for (var k = 0; k < 10; k++) {
    lines += '<div class="road-line" style="left:' + (5 + k * 10) + '%"></div>'
  }
  return lines
}

function getBuildingsForScene(sceneName, time) {
  // 場所ごとの建物パターン定義
  var sceneBuildings = {
    "朝の公園": [
      { h: 8, w: 18, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" }, // 木
      { h: 5, w: 10, color: "#2a5a2a" }, // 低木
      { h: 14, w: 22, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" }, // 大木
      { h: 0 },
      { h: 6, w: 24, color: "#3a3a4a", roof: "flat" }, // ベンチ/東屋
      { h: 0 },
      { h: 10, w: 18, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
      { h: 4, w: 8, color: "#2a5a2a" },
      { h: 12, w: 20, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
    ],
    "学校の正門前": [
      { h: 10, w: 10, color: "#3a4a5a" },
      { h: 30, w: 16, color: "#4a5a6a", windows: 3 }, // 校舎
      { h: 35, w: 18, color: "#4a5a6a", windows: 4, roof: "flat" },
      { h: 30, w: 16, color: "#4a5a6a", windows: 3 },
      { h: 0 },
      { h: 12, w: 8, color: "#5a5a5a" }, // 門柱
      { h: 12, w: 8, color: "#5a5a5a" },
      { h: 0 },
      { h: 20, w: 14, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
    ],
    "病院の待合室": [
      { h: 14, w: 12, color: "#3a4a5a" },
      { h: 22, w: 14, color: "#5a6a7a", windows: 2 },
      { h: 38, w: 20, color: "#e8e8e8", windows: 4, roof: "flat" }, // 病院（白い建物）
      { h: 32, w: 16, color: "#d8d8d8", windows: 3 },
      { h: 0 },
      { h: 18, w: 12, color: "#4a5a6a", windows: 2 },
      { h: 10, w: 10, color: "#3a4a5a" },
    ],
    "ショッピングモール": [
      { h: 12, w: 10, color: "#3a4a5a" },
      { h: 18, w: 14, color: "#5a5a6a", windows: 2 },
      { h: 24, w: 28, color: "#6a5a4a", windows: 3, roof: "flat" }, // モール
      { h: 24, w: 28, color: "#6a5a4a", windows: 3, roof: "flat" },
      { h: 0 },
      { h: 16, w: 12, color: "#4a5a5a", windows: 1 },
      { h: 20, w: 14, color: "#5a4a4a", windows: 2 },
    ],
    "鉄塔の見える丘": [
      { h: 6, w: 14, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
      { h: 8, w: 10, color: "#2a5a2a" },
      { h: 0 },
      { h: 40, w: 6, color: "#7a7a7a" }, // 鉄塔
      { h: 0 },
      { h: 8, w: 10, color: "#2a5a2a" },
      { h: 6, w: 14, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
      { h: 10, w: 18, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
    ],
    "夜の交差点": [
      { h: 20, w: 14, color: "#2a3a4a", windows: 2 },
      { h: 28, w: 16, color: "#3a4a5a", windows: 3 },
      { h: 0 },
      { h: 32, w: 4, color: "#5a5a5a" }, // 信号機
      { h: 0 },
      { h: 24, w: 14, color: "#3a3a4a", windows: 2 },
      { h: 30, w: 16, color: "#2a3a4a", windows: 3 },
      { h: 18, w: 12, color: "#2a2a3a", windows: 1 },
    ],
    "深夜の展望台": [
      { h: 6, w: 12, color: "#1a3a1a" },
      { h: 8, w: 10, color: "#1a3a1a" },
      { h: 0 },
      { h: 20, w: 10, color: "#3a3a4a", roof: "flat" },
      { h: 16, w: 14, color: "#3a3a4a", roof: "flat" },
      { h: 0 },
      { h: 6, w: 10, color: "#1a3a1a" },
      { h: 4, w: 8, color: "#1a3a1a" },
    ],
    "朝の商店街": [
      { h: 14, w: 14, color: "#5a4a3a", windows: 1 },
      { h: 16, w: 12, color: "#4a5a4a", windows: 1, roof: "triangle", roofColor: "#3a4a3a" },
      { h: 12, w: 16, color: "#5a5a4a", windows: 1 },
      { h: 18, w: 14, color: "#4a4a5a", windows: 2, roof: "triangle", roofColor: "#3a3a4a" },
      { h: 0 },
      { h: 14, w: 12, color: "#5a4a4a", windows: 1 },
      { h: 10, w: 14, color: "#4a5a5a", windows: 1, roof: "triangle", roofColor: "#3a4a4a" },
      { h: 16, w: 12, color: "#5a5a5a", windows: 1 },
    ],
    "港の見える橋の上": [
      { h: 4, w: 6, color: "#4a5a6a" },
      { h: 0 },
      { h: 0 },
      { h: 0 },
      { h: 0 },
      { h: 0 },
      { h: 0 },
      { h: 4, w: 6, color: "#4a5a6a" },
    ],
    "工場のそばの河川敷": [
      { h: 8, w: 10, color: "#2a4a2a" },
      { h: 0 },
      { h: 28, w: 12, color: "#5a5a5a", windows: 2 },
      { h: 34, w: 16, color: "#4a4a4a", windows: 3, roof: "flat" },
      { h: 22, w: 8, color: "#6a6a6a" },
      { h: 0 },
      { h: 6, w: 10, color: "#2a4a2a" },
      { h: 10, w: 14, color: "#2a4a2a", roof: "triangle", roofColor: "#1a3a1a" },
    ],
    "オフィスビルの前": [
      { h: 20, w: 12, color: "#4a5a6a", windows: 2 },
      { h: 32, w: 16, color: "#5a6a7a", windows: 3 },
      { h: 40, w: 18, color: "#6a7a8a", windows: 4, roof: "flat" },
      { h: 36, w: 16, color: "#5a6a7a", windows: 3, roof: "flat" },
      { h: 0 },
      { h: 24, w: 14, color: "#4a5a6a", windows: 2 },
      { h: 18, w: 10, color: "#3a4a5a", windows: 1 },
    ],
    "駅前のロータリー": [
      { h: 16, w: 12, color: "#4a4a5a", windows: 1 },
      { h: 22, w: 14, color: "#5a5a6a", windows: 2 },
      { h: 30, w: 20, color: "#5a6a7a", windows: 3, roof: "flat" },
      { h: 0 },
      { h: 8, w: 30, color: "#4a4a4a", roof: "flat" },
      { h: 0 },
      { h: 20, w: 14, color: "#5a5a6a", windows: 2 },
      { h: 14, w: 10, color: "#4a4a5a", windows: 1 },
    ],
    "家のリビング": [
      { h: 12, w: 16, color: "#5a4a3a", roof: "triangle", roofColor: "#4a3a2a" },
      { h: 10, w: 12, color: "#4a4a3a", roof: "triangle", roofColor: "#3a3a2a" },
      { h: 0 },
      { h: 14, w: 18, color: "#5a5a4a", windows: 1, roof: "triangle", roofColor: "#4a4a3a" },
      { h: 0 },
      { h: 10, w: 14, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
      { h: 8, w: 12, color: "#4a4a3a", roof: "triangle", roofColor: "#3a3a2a" },
    ],
    "体育館の前": [
      { h: 10, w: 10, color: "#3a4a5a" },
      { h: 20, w: 28, color: "#5a5a5a", roof: "triangle", roofColor: "#4a4a4a" },
      { h: 0 },
      { h: 12, w: 8, color: "#5a5a5a" },
      { h: 0 },
      { h: 24, w: 16, color: "#4a5a6a", windows: 2, roof: "flat" },
      { h: 8, w: 12, color: "#2a5a2a", roof: "triangle", roofColor: "#1a4a1a" },
    ],
    "夜のスーパー": [
      { h: 18, w: 12, color: "#2a2a3a", windows: 1 },
      { h: 14, w: 28, color: "#3a3a4a", windows: 2, roof: "flat" },
      { h: 14, w: 28, color: "#3a3a4a", windows: 2, roof: "flat" },
      { h: 0 },
      { h: 20, w: 14, color: "#2a2a3a", windows: 2 },
      { h: 12, w: 10, color: "#2a2a2a", windows: 1 },
    ]
  }

  // デフォルトの街並み
  var defaultBuildings = [
    { h: 18, w: 10 }, { h: 26, w: 14 }, { h: 14, w: 10 }, { h: 30, w: 14 },
    { h: 22, w: 12 }, { h: 0 }, { h: 22, w: 12 }, { h: 18, w: 10 },
    { h: 28, w: 14 }, { h: 16, w: 10 }
  ]

  var buildings = sceneBuildings[sceneName] || defaultBuildings

  return buildings.map(function (b) {
    if (!b.h || b.h === 0) return '<div style="width:40px"></div>'
    var w = b.w || (10 + Math.floor(Math.random() * 8))
    var color = b.color || "#1a2a3a"
    var windows = ""
    var winCount = b.windows || Math.floor(b.h / 8)
    for (var j = 0; j < winCount; j++) {
      var lit = Math.random() > 0.4
      var glowAlpha = lit ? time.windowGlow : time.windowGlow * 0.2
      windows += '<div class="building-window" style="left:' + (20 + (j * 37) % 60) + '%;top:' + (15 + j * 22) + '%;background:rgba(255,230,109,' + glowAlpha + ')"></div>'
    }
    var roofHtml = ""
    if (b.roof === "triangle") {
      roofHtml = '<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:' + (w / 2 + 2) + 'px solid transparent;border-right:' + (w / 2 + 2) + 'px solid transparent;border-bottom:10px solid ' + (b.roofColor || color) + '"></div>'
    }
    return '<div class="building" style="height:' + (b.h * 2) + 'px;width:' + w + 'px;background:' + color + '">' + roofHtml + windows + '</div>'
  })
}

function createRPGScene(value, question, idx) {
  var leftActive = value < 0
  var rightActive = value > 0
  var heroX = 50 + value * 12
  var sceneName = question.scene || "政治の街"
  var time = getTimeOfDay(idx || 0)

  return `
    <div class="rpg-scene" style="background:${time.sky}">
      ${time.stars ? '<canvas class="star-canvas" id="starCanvas"></canvas>' : ''}
      
      <!-- 月/太陽 -->
      ${time.showMoon ? '<div class="moon"></div>' : ''}
      ${time.showSun ? '<div class="sun' + (time.sunLow ? ' low' : '') + '"></div>' : ''}
      
      <!-- 建物 -->
      <div class="buildings">
        ${getBuildingsForScene(sceneName, time).join('')}
      </div>
      
      <!-- 地面 -->
      <div class="road" style="background:${getGroundStyle(sceneName)}">
        ${getGroundLines(sceneName)}
      </div>
      
      <!-- シーンラベル -->
      <div class="scene-label">
        <span class="scene-time">${time.timeStr}</span>
        ${escapeHtml(sceneName)}
      </div>
      
      
      <!-- 左キャラクター -->
      <div class="characters-left ${leftActive ? 'active' : ''}">
        ${createNPCSVGS("left", leftActive, leftActive ? Math.abs(value) : 0)}
      </div>
      
      <!-- 右キャラクター -->
      <div class="characters-right ${rightActive ? 'active' : ''}">
        ${createNPCSVGS("right", rightActive, rightActive ? Math.abs(value) : 0)}
      </div>
      
      <!-- 主人公 -->
      <div class="character-main" style="left:${heroX}%">
        ${createHeroSVG(window.innerWidth > 768 ? 80 : 55)}
      </div>
      
      <!-- 矢印 -->
      ${leftActive ? '<div class="arrow-left"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M15 6L9 12L15 18" stroke="#4ECDC4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 6L13 12L19 18" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg></div>' : ''}
      ${rightActive ? '<div class="arrow-right"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 6L11 12L5 18" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg></div>' : ''}
    </div>
  `
}

// ═══════════════════════════════════════════════════════════
// v0風のクイズカード
// ═══════════════════════════════════════════════════════════
function createQuizCard(question, idx, total, initialValue, level, taxGauge) {
  var value = initialValue
  var leftActive = value < 0
  var rightActive = value > 0
  var progressPct = Math.round(((idx + 1) / total) * 100)
  var narrative = question.narrative || "同じ街に、同時に起きている2つの現実があります。あなたは「どちらに近づくか」だけ決めてください。"

  var labels = {
    "-2": "← かなりA寄り",
    "-1": "← ややA寄り",
    "0": "どちらとも言えない",
    "1": "ややB寄り →",
    "2": "かなりB寄り →"
  }

  return `
    <div class="quiz-card" style="display:flex;flex-direction:column;gap:16px;width:100%;max-width:680px;animation:slideInRight 0.4s ease-out">
      <!-- ヘッダー -->
      <div class="rpg-header">
        <div class="rpg-title">
          <span>政治博士</span>
        </div>
        <div class="rpg-stage">
          <div class="progress-dots">${Array.from({ length: total }, function (_, i) {
    var cls = i < idx ? 'done' : i === idx ? 'current' : ''
    return '<span class="pdot ' + cls + '"></span>'
  }).join('')}</div>
          <span>${idx + 1} / ${total}</span>
        </div>
      </div>
      
      <!-- ステータスバー -->
      <div class="status-bars">
        <div class="status-bar">
          <span class="status-label" style="color:#FFE66D">EXP</span>
          <div class="status-track">
            <div class="status-fill exp-fill" style="width:${progressPct}%"></div>
          </div>
          <span class="status-value">${progressPct}%</span>
        </div>
        <div class="status-bar">
          <span class="status-label" style="color:#FF6B6B">TAX</span>
          <div class="status-track">
            <div class="status-fill tax-fill" style="width:${Math.min(100, Math.max(10, 50 + taxGauge * 10))}%"></div>
          </div>
        </div>
      </div>
      
      ${createRPGScene(value, question, idx)}
      
      <!-- ダイアログボックス -->
      <div class="dialogue-box">
        <div class="dialogue-corner tl"></div>
        <div class="dialogue-corner tr"></div>
        <div class="dialogue-corner bl"></div>
        <div class="dialogue-corner br"></div>
        <h2 class="question-title">${getSceneEmoji(question.scene)} ${escapeHtml(question.title)}</h2>
        <p class="question-desc">${escapeHtml(narrative)}</p>
      </div>
      
      <!-- アクションセクション -->
      <div class="action-section">
        <div class="action-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFE66D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          </svg>
          <span class="action-title">行動を選択</span>
        </div>
        
        <div class="action-buttons">
          <button type="button" class="action-btn left ${leftActive ? 'active' : ''}" data-action="select-left">
            <div class="action-letter">A</div>
            <div class="action-content">
              <div class="action-label">${escapeHtml(question.left.label)}</div>
              <div class="action-hint">${escapeHtml(question.left.desc || question.left.hint || '')}</div>
            </div>
          </button>
          
          <button type="button" class="action-btn right ${rightActive ? 'active' : ''}" data-action="select-right">
            <div class="action-letter">B</div>
            <div class="action-content">
              <div class="action-label">${escapeHtml(question.right.label)}</div>
              <div class="action-hint">${escapeHtml(question.right.desc || question.right.hint || '')}</div>
            </div>
          </button>
        </div>
        
        <!-- スライダー -->
        <div class="slider-section">
          <div class="slider-label">微調整</div>
          <div class="slider-row">
            <span class="slider-end left ${leftActive ? 'active' : ''}">${escapeHtml(question.left.label)}</span>
            <input type="range" class="rpg-slider" id="slider" min="-2" max="2" step="1" value="${value}" aria-label="回答スライダー" aria-valuemin="-2" aria-valuemax="2" aria-valuenow="${value}"/>
            <span class="slider-end right ${rightActive ? 'active' : ''}">${escapeHtml(question.right.label)}</span>
          </div>
          <div class="slider-steps">
            <span class="step ${value === -2 ? 'active left' : ''}"></span>
            <span class="step ${value === -1 ? 'active left' : ''}"></span>
            <span class="step center ${value === 0 ? 'active' : ''}"></span>
            <span class="step ${value === 1 ? 'active right' : ''}"></span>
            <span class="step ${value === 2 ? 'active right' : ''}"></span>
          </div>
          <div class="slider-desc ${value === 0 ? 'neutral' : value < 0 ? 'left' : 'right'}">${labels[value]}</div>
        </div>
      </div>
      
      <!-- コントロール -->
      <div class="controls">
        <span class="note">正解はありません。迷ったら「どちらとも言えない」でOK！</span>
        <div class="control-buttons">
          ${idx > 0 ? '<button type="button" class="control-btn" id="backBtn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>戻る</button>' : ''}
          <button type="button" class="control-btn primary" id="nextBtn">
            決定
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
}

// ═══════════════════════════════════════════════════════════
// v0風の結果画面
// ═══════════════════════════════════════════════════════════
function drawRadarChart(canvasId, scores) {
  var canvas = document.getElementById(canvasId)
  if (!canvas) return
  var dpr = window.devicePixelRatio || 1
  var displayW = canvas.clientWidth || 240
  var displayH = canvas.clientHeight || 240
  canvas.width = displayW * dpr
  canvas.height = displayH * dpr
  var ctx = canvas.getContext("2d")
  ctx.scale(dpr, dpr)
  var w = displayW
  var h = displayH
  var cx = w / 2
  var cy = h / 2
  var r = Math.min(cx, cy) - 30

  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]
  var labels = ["分配", "政府", "自由", "開放", "時間"]
  var n = axes.length
  var angleStep = (Math.PI * 2) / n
  var startAngle = -Math.PI / 2

  ctx.clearRect(0, 0, w, h)

  // グリッド線（3段階）
  for (var g = 1; g <= 3; g++) {
    ctx.beginPath()
    var gr = r * g / 3
    for (var i = 0; i <= n; i++) {
      var angle = startAngle + i * angleStep
      var x = cx + gr * Math.cos(angle)
      var y = cy + gr * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = "rgba(255,255,255,0.08)"
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // 軸線
  for (var j = 0; j < n; j++) {
    var angle = startAngle + j * angleStep
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
    ctx.strokeStyle = "rgba(255,255,255,0.1)"
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // データエリア
  ctx.beginPath()
  for (var k = 0; k < n; k++) {
    var val = (scores[axes[k]] || 50) / 100
    var angle = startAngle + k * angleStep
    var x = cx + r * val * Math.cos(angle)
    var y = cy + r * val * Math.sin(angle)
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = "rgba(78, 205, 196, 0.15)"
  ctx.fill()
  ctx.strokeStyle = "rgba(78, 205, 196, 0.7)"
  ctx.lineWidth = 2
  ctx.stroke()

  // データ点
  for (var m = 0; m < n; m++) {
    var val = (scores[axes[m]] || 50) / 100
    var angle = startAngle + m * angleStep
    var x = cx + r * val * Math.cos(angle)
    var y = cy + r * val * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = "#4ECDC4"
    ctx.fill()
  }

  // ラベル
  ctx.font = "11px sans-serif"
  ctx.fillStyle = "rgba(255,255,240,0.6)"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  for (var l = 0; l < n; l++) {
    var angle = startAngle + l * angleStep
    var lx = cx + (r + 18) * Math.cos(angle)
    var ly = cy + (r + 18) * Math.sin(angle)
    ctx.fillText(labels[l], lx, ly)
  }
}

function generateTendencyText(scores) {
  var parts = []
  // merit_equity
  if (scores.merit_equity < 35) parts.push("努力や能力が報われる実力主義を重視")
  else if (scores.merit_equity > 65) parts.push("格差をなくし平等な社会を重視")
  else parts.push("実力と平等のバランスを大切にする")
  // small_big
  if (scores.small_big < 35) parts.push("政府の介入は少なく自由な経済を好む")
  else if (scores.small_big > 65) parts.push("手厚い社会保障や公共サービスを求める")
  else parts.push("政府の役割については中立的")
  // free_norm
  if (scores.free_norm < 35) parts.push("個人の自由を最大限に尊重したい")
  else if (scores.free_norm > 65) parts.push("社会のルールや秩序も大切にしたい")
  else parts.push("自由とルールのバランスを意識している")
  // open_protect
  if (scores.open_protect < 35) parts.push("国際交流や開放的な政策に前向き")
  else if (scores.open_protect > 65) parts.push("日本の文化や産業を守ることを重視")
  else parts.push("開放と保護のどちらも考慮する")
  // now_future
  if (scores.now_future < 35) parts.push("今の暮らしや経済を優先する傾向")
  else if (scores.now_future > 65) parts.push("将来の世代や環境を考える傾向")
  else parts.push("現在と未来のバランスを考える")

  return "あなたは、" + parts[0] + "タイプです。" + parts[1] + "傾向があり、" + parts[2] + "考え方を持っています。また、" + parts[3] + "一方で、" + parts[4] + "があります。"
}

function createResultScreen(answers) {
  // answers = { Q1: {value:1, tax:...}, Q2: {value:-1, tax:...}, ... }
  var entries = Object.entries(answers)
  var values = entries.map(function (e) { return e[1].value || 0 })
  var avg = values.length > 0 ? values.reduce(function (s, v) { return s + v }, 0) / values.length : 0
  var level = Math.min(99, 10 + entries.length * 5 + Math.round(Math.abs(avg) * 3))

  // scoring.js の5軸スコア＋政党マッチングを使用
  var axisScores = calcAxisScores(answers)
  var partyResults = calcPartyDistances(axisScores)
  var topParty = partyResults[0]

  return `
    <div style="display:flex;flex-direction:column;gap:20px;width:100%;max-width:680px">
      <div class="result-header">
        <div class="result-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFE66D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
          <span>QUEST COMPLETE</span>
        </div>
        <div class="result-stage">結果</div>
      </div>
      
      <!-- EXP MAX -->
      <div class="status-bar" style="animation:slideInRight 0.4s ease-out 0.1s both">
        <span class="status-label" style="color:#FFE66D">EXP</span>
        <div class="status-track">
          <div class="status-fill exp-fill" style="width:100%"></div>
        </div>
        <span class="status-value" style="color:#FFE66D;font-weight:700">MAX</span>
      </div>
      
      <div class="result-card" style="animation:slideInRight 0.5s ease-out 0.2s both">
        <div class="result-corner tl"></div>
        <div class="result-corner tr"></div>
        <div class="result-corner bl"></div>
        <div class="result-corner br"></div>
        
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px">
          <div class="result-character">
            ${createHeroSVG(90)}
          </div>
        </div>
        
        <!-- 政党マッチ -->
        <div class="party-match" style="border:2px solid ${topParty.color}40;background:${topParty.color}08">
          <div class="party-match-label">あなたに最も近い政党</div>
          <div class="party-name" style="color:${topParty.color};text-shadow:0 0 15px ${topParty.color}40">${topParty.name}</div>
          <div class="party-desc">マッチ度 ${topParty.match}%</div>
        </div>
        
        <!-- レーダーチャート -->
        <div style="display:flex;justify-content:center;padding:8px 0">
          <canvas id="radarChart" width="240" height="240" style="max-width:100%"></canvas>
        </div>
        
        <!-- あなたの傾向 -->
        <div class="tendency-box">
          <div class="summary-label">あなたの傾向まとめ</div>
          <p class="tendency-text">${generateTendencyText(axisScores)}</p>
        </div>
        
        <!-- 5軸スコア -->
        <div class="answer-summary">
          <div class="summary-label">あなたの政治傾向（5つの軸）</div>
          ${["merit_equity", "small_big", "free_norm", "open_protect", "now_future"].map(function (ax) {
    var score = axisScores[ax]
    var posClass = score < 40 ? 'left' : score > 60 ? 'right' : 'neutral'
    var axisDesc = {
      merit_equity: { left: "実力主義", right: "平等重視" },
      small_big: { left: "小さな政府", right: "大きな政府" },
      free_norm: { left: "自由優先", right: "ルール重視" },
      open_protect: { left: "開放的", right: "保護的" },
      now_future: { left: "今を重視", right: "未来を重視" }
    }
    var desc = axisDesc[ax] || { left: "", right: "" }
    return '<div class="answer-row">' +
      '<span class="answer-id" style="min-width:72px">' + AXIS_NAMES[ax] + '</span>' +
      '<div class="answer-bar">' +
      '<div class="answer-center"></div>' +
      '<div class="answer-dot ' + posClass + '" style="left:' + score + '%"></div>' +
      '</div>' +
      '<span class="answer-value ' + posClass + '">' + score + '</span>' +
      '</div>' +
      '<div class="axis-desc-row">' +
      '<span class="axis-side left">' + desc.left + '</span>' +
      '<span class="axis-side right">' + desc.right + '</span>' +
      '</div>'
  }).join('')}
        </div>
        
        <!-- 回答サマリー -->
        <div class="answer-summary">
          <div class="summary-label">回答サマリー</div>
          ${entries.map(function (entry) {
    var id = entry[0], v = entry[1].value || 0
    var posClass = v === 0 ? 'neutral' : v < 0 ? 'left' : 'right'
    return '<div class="answer-row">' +
      '<span class="answer-id">' + id + '</span>' +
      '<div class="answer-bar">' +
      '<div class="answer-center"></div>' +
      '<div class="answer-dot ' + posClass + '" style="left:' + (((v + 2) / 4) * 100) + '%"></div>' +
      '</div>' +
      '<span class="answer-value ' + posClass + '">' + (v > 0 ? '+' + v : v) + '</span>' +
      '</div>'
  }).join('')}
        </div>
        
        <div class="result-divider"></div>
        
        <!-- 全政党比較 -->
        <div class="party-list">
          <div class="summary-label">全政党マッチング</div>
          <div class="party-list-note">※ 各政党の公式見解を参考にした概算です</div>
          ${partyResults.map(function (p, i) {
    var isTop = i === 0
    var isRunner = i === 1 || i === 2
    var rank = isTop ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''
    var nameStyle = isTop ? 'color:' + p.color + ';font-weight:800' : isRunner ? 'color:' + p.color + ';font-weight:600' : ''
    var fillOpacity = isTop ? 1 : isRunner ? 0.7 : 0.35
    var pctStyle = isTop ? 'color:' + p.color + ';font-weight:800' : isRunner ? 'color:' + p.color + ';font-weight:600' : ''
    var partyTips = {
      "自民党": "保守・経済成長重視。長期政権を担う",
      "立憲民主党": "リベラル・社会保障重視。野党第一党",
      "日本維新の会": "改革志向・小さな政府。規制緩和推進",
      "公明党": "中道・福祉重視。与党として連立",
      "国民民主党": "中道・現実路線。対案型野党",
      "共産党": "左派・平等重視。護憲・反戦",
      "れいわ新選組": "左派・再分配重視。消費税廃止を主張",
      "社民党": "社会民主主義。平和・人権重視"
    }
    var tip = partyTips[p.name] || ''
    return '<div class="party-row" style="animation:slideInRight ' + (0.3 + i * 0.05) + 's ease-out" title="' + tip + '">' +
      '<span class="party-row-name" style="' + nameStyle + '">' + rank + p.name + '</span>' +
      '<div class="party-row-bar">' +
      '<div class="party-row-fill" style="width:' + p.match + '%;background:' + p.color + ';opacity:' + fillOpacity + '"></div>' +
      '</div>' +
      '<span class="party-row-pct" style="' + pctStyle + '">' + p.match + '%</span>' +
      '</div>' +
      (isTop || isRunner ? '<div class="party-tip" style="color:' + (isTop || isRunner ? p.color : 'var(--text-muted)') + '">' + tip + '</div>' : '')
  }).join('')}
        </div>
      </div>
      
      <div class="result-controls">
        <div class="result-disclaimer">
          <p>⚠️ この診断はあくまで参考です。各政党の公式見解を簡略化しており、すべての政策を反映しているわけではありません。</p>
          <p>実際の投票は、候補者の政策や人柄をよく調べてから決めてくださいね。</p>
        </div>
        <div style="display:flex;gap:8px">
          <button type="button" class="result-reset" id="shareBtn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            結果をシェア
          </button>
          <button type="button" class="result-reset" id="resetBtn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            もう一度やる
          </button>
        </div>
      </div>
    </div>
  `
}

// ═══════════════════════════════════════════════════════════
// メインレンダリング関数
// ═══════════════════════════════════════════════════════════
function render() {
  if (isTransitioning) return

  var q = QUESTIONS[state.currentIndex]
  var stage = state.currentIndex + 1
  var saved = state.answers[q.id]
  var value = saved && typeof saved.value === "number" ? clampValue(saved.value) : 0
  var taxGauge = Object.values(state.answers).reduce(function (s, a) { return s + a.value }, 0) / Math.max(1, Object.keys(state.answers).length)

  currentLevel = Math.min(99, 1 + Object.keys(state.answers).length * 5)

  els.app.innerHTML = createQuizCard(q, state.currentIndex, TOTAL_QUESTIONS, value, currentLevel, taxGauge)

  // タイプライター効果（ナラティブ）
  var descEl = document.querySelector(".question-desc")
  if (descEl) {
    var fullText = descEl.textContent
    descEl.textContent = ""
    descEl.style.minHeight = "3em"
    var charIdx = 0
    var typeTimer = setInterval(function () {
      if (charIdx < fullText.length) {
        descEl.textContent += fullText[charIdx]
        charIdx++
      } else {
        clearInterval(typeTimer)
      }
    }, 25)
  }

  // ページトップへスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // StarField初期化（夜のみcanvasが存在する）
  if (starFieldAnimation) {
    starFieldAnimation.destroy()
    starFieldAnimation = null
  }
  var canvas = document.getElementById("starCanvas")
  if (canvas) {
    starFieldAnimation = createStarField(canvas)
  }

  bindQuestionEvents()
}

function renderEnd() {
  if (isTransitioning) return

  els.app.innerHTML = createResultScreen(state.answers)

  // ページトップへスクロール
  window.scrollTo({ top: 0, behavior: 'smooth' })

  if (starFieldAnimation) {
    starFieldAnimation.destroy()
    starFieldAnimation = null
  }

  // レーダーチャート描画
  var axisScores = calcAxisScores(state.answers)
  drawRadarChart("radarChart", axisScores)

  // キーボードリスナー解除
  document.removeEventListener("keydown", handleKeyNav)

  bindResultEvents()
}

// ═══════════════════════════════════════════════════════════
// イベントバインディング
// ═══════════════════════════════════════════════════════════
function bindQuestionEvents() {
  var slider = document.getElementById("slider")
  var backBtn = document.getElementById("backBtn")
  var nextBtn = document.getElementById("nextBtn")

  if (!slider) return

  // スライダーイベント
  slider.addEventListener("input", function () {
    var value = clampValue(this.value)
    updateSliderUI(value)
  })

  // アクションボタン
  document.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var action = this.getAttribute("data-action")
      if (action === "select-left") {
        slider.value = "-2"
        updateSliderUI(-2)
      } else if (action === "select-right") {
        slider.value = "2"
        updateSliderUI(2)
      }
    })
  })

  // 次へボタン
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      confirmAnswer()
    })
  }

  // 戻るボタン
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      goBack()
    })
  }

  // キーボードナビゲーション（重複防止）
  document.removeEventListener("keydown", handleKeyNav)
  document.addEventListener("keydown", handleKeyNav)

  // スワイプジェスチャー
  var touchStartX = 0
  var quizCard = document.querySelector(".quiz-card")
  if (quizCard) {
    quizCard.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].screenX
    }, { passive: true })
    quizCard.addEventListener("touchend", function (e) {
      var touchEndX = e.changedTouches[0].screenX
      var diff = touchEndX - touchStartX
      if (Math.abs(diff) > 60) {
        if (diff < 0) {
          // 左スワイプ → 次へ
          confirmAnswer()
        } else {
          // 右スワイプ → 戻る
          goBack()
        }
      }
    }, { passive: true })
  }
}

function handleKeyNav(e) {
  var slider = document.getElementById("slider")
  if (!slider) return
  if (e.key === "ArrowLeft") {
    slider.value = Math.max(-2, parseInt(slider.value) - 1)
    updateSliderUI(clampValue(slider.value))
    e.preventDefault()
  } else if (e.key === "ArrowRight") {
    slider.value = Math.min(2, parseInt(slider.value) + 1)
    updateSliderUI(clampValue(slider.value))
    e.preventDefault()
  } else if (e.key === "Enter") {
    confirmAnswer()
    e.preventDefault()
  } else if (e.key === "a" || e.key === "A") {
    slider.value = Math.max(-2, parseInt(slider.value) - 1)
    updateSliderUI(clampValue(slider.value))
    e.preventDefault()
  } else if (e.key === "b" || e.key === "B") {
    slider.value = Math.min(2, parseInt(slider.value) + 1)
    updateSliderUI(clampValue(slider.value))
    e.preventDefault()
  }
}

function bindResultEvents() {
  var resetBtn = document.getElementById("resetBtn")
  var shareBtn = document.getElementById("shareBtn")

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      resetQuiz()
    })
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      shareResult()
    })
  }
}

function shareResult() {
  var axisScores = calcAxisScores(state.answers)
  var partyResults = calcPartyDistances(axisScores)
  var topParty = partyResults[0]
  var axes = {
    merit_equity: axisScores.merit_equity < 40 ? "実力主義" : axisScores.merit_equity > 60 ? "平等重視" : "バランス型",
    small_big: axisScores.small_big < 40 ? "小さな政府" : axisScores.small_big > 60 ? "大きな政府" : "中立",
  }
  var text = "【政治博士】政党診断の結果\n\n" +
    "🏛️ 最も近い政党: " + topParty.name + "（" + topParty.match + "%）\n" +
    "📊 " + axes.merit_equity + " / " + axes.small_big + "\n\n" +
    "15問で分かる、あなたの政治傾向 👉\n" + window.location.href

  if (navigator.share) {
    navigator.share({ title: "政治博士", text: text }).catch(function () { })
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function () {
      var btn = document.getElementById("shareBtn")
      if (btn) {
        var original = btn.innerHTML
        btn.innerHTML = "✅ コピーしました！"
        setTimeout(function () { btn.innerHTML = original }, 2000)
      }
    })
  }
}

function updateSliderUI(value) {
  var leftActive = value < 0
  var rightActive = value > 0
  var q = QUESTIONS[state.currentIndex]

  var labels = {
    "-2": "← かなりA寄り",
    "-1": "← ややA寄り",
    "0": "どちらとも言えない",
    "1": "ややB寄り →",
    "2": "かなりB寄り →"
  }

  // アクションボタン更新
  document.querySelectorAll(".action-btn").forEach(function (btn) {
    btn.classList.remove("active")
  })

  if (leftActive) {
    document.querySelector(".action-btn.left").classList.add("active")
  } else if (rightActive) {
    document.querySelector(".action-btn.right").classList.add("active")
  }

  // スライダー端更新
  document.querySelectorAll(".slider-end").forEach(function (end) {
    end.classList.remove("active")
  })

  if (leftActive) {
    document.querySelector(".slider-end.left").classList.add("active")
  } else if (rightActive) {
    document.querySelector(".slider-end.right").classList.add("active")
  }

  // 説明テキスト更新
  var descEl = document.querySelector(".slider-desc")
  if (descEl) {
    var hintText = ""
    if (value < 0 && q.left.hint) hintText = q.left.hint
    else if (value > 0 && q.right.hint) hintText = q.right.hint
    descEl.innerHTML = labels[value] + (hintText ? '<span class="slider-hint">' + escapeHtml(hintText) + '</span>' : '')
    descEl.className = "slider-desc " + (value === 0 ? 'neutral' : value < 0 ? 'left' : 'right')
  }

  // ステップマーク更新
  var steps = document.querySelectorAll(".slider-steps .step")
  if (steps.length === 5) {
    var stepValues = [-2, -1, 0, 1, 2]
    for (var i = 0; i < 5; i++) {
      steps[i].className = "step" + (i === 2 ? " center" : "") +
        (stepValues[i] === value ? (" active" + (value < 0 ? " left" : value > 0 ? " right" : "")) : "")
    }
  }

  // RPGシーン更新
  updateRPGScene(value)
}

function updateRPGScene(value) {
  var leftActive = value < 0
  var rightActive = value > 0
  var heroX = 50 + value * 12

  var leftChars = document.querySelector(".characters-left")
  var rightChars = document.querySelector(".characters-right")
  var hero = document.querySelector(".character-main")
  var leftArrow = document.querySelector(".arrow-left")
  var rightArrow = document.querySelector(".arrow-right")

  // NPC表情をSVGごと再生成（笑顔/困り顔＋サイズ変化）
  var absValue = Math.abs(value)
  if (leftChars) {
    leftChars.className = "characters-left" + (leftActive ? " active" : "")
    leftChars.innerHTML = createNPCSVGS("left", leftActive, leftActive ? absValue : 0)
  }
  if (rightChars) {
    rightChars.className = "characters-right" + (rightActive ? " active" : "")
    rightChars.innerHTML = createNPCSVGS("right", rightActive, rightActive ? absValue : 0)
  }
  if (hero) {
    hero.style.left = heroX + "%"
  }

  // 矢印の表示/非表示
  if (leftArrow) {
    leftArrow.style.display = leftActive ? "block" : "none"
  }
  if (rightArrow) {
    rightArrow.style.display = rightActive ? "block" : "none"
  }

  // 既存の矢印を削除して再生成
  if (leftActive && !leftArrow) {
    var scene = document.querySelector(".rpg-scene")
    if (scene) {
      var arrow = document.createElement("div")
      arrow.className = "arrow-left"
      arrow.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M15 6L9 12L15 18" stroke="#4ECDC4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 6L13 12L19 18" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>'
      scene.appendChild(arrow)
    }
  }

  if (rightActive && !rightArrow) {
    var scene = document.querySelector(".rpg-scene")
    if (scene) {
      var arrow = document.createElement("div")
      arrow.className = "arrow-right"
      arrow.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 6L11 12L5 18" stroke="#FF6B6B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/></svg>'
      scene.appendChild(arrow)
    }
  }
}

function confirmAnswer() {
  if (isTransitioning) return

  var slider = document.getElementById("slider")
  if (!slider) return

  // fade-out効果
  var card = document.querySelector(".quiz-card")
  if (card) {
    card.style.transition = "opacity 0.2s, transform 0.2s"
    card.style.opacity = "0"
    card.style.transform = "translateX(-20px)"
  }

  var value = clampValue(slider.value)
  var q = QUESTIONS[state.currentIndex]

  // 回答保存
  state.answers[q.id] = {
    value: value,
    tax: getTaxDelta(q, value)
  }
  state.tax += getTaxDelta(q, value)
  saveState(state)

  // 次の質問へ
  isTransitioning = true
  setTimeout(function () {
    isTransitioning = false
    if (state.currentIndex < TOTAL_QUESTIONS - 1) {
      state.currentIndex++
      saveState(state)
      render()
    } else {
      renderEnd()
    }
  }, 500)
}

function goBack() {
  if (isTransitioning || state.currentIndex === 0) return

  isTransitioning = true
  var card = document.querySelector(".quiz-card")
  if (card) card.style.animation = "slideInLeft 0.3s ease-out"
  setTimeout(function () {
    isTransitioning = false
    state.currentIndex--
    saveState(state)
    render()
  }, 300)
}

function resetQuiz() {
  if (isTransitioning) return
  if (!confirm("回答をリセットして最初からやり直しますか？")) return

  isTransitioning = true
  setTimeout(function () {
    isTransitioning = false
    state = createNewState()
    saveState(state)
    render()
  }, 400)
}

function showLevelUp() {
  var toast = document.createElement("div")
  toast.className = "level-up-toast"
  toast.textContent = "LEVEL UP! Lv." + currentLevel
  document.body.appendChild(toast)

  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, 1200)
}

// ═══════════════════════════════════════════════════════════
// フィードバック機能
// ═══════════════════════════════════════════════════════════
function bindFeedbackEvents() {
  if (els.fbOpen) els.fbOpen.addEventListener("click", openFeedback)
  if (els.fbCancel) els.fbCancel.addEventListener("click", closeFeedback)
  if (els.fbSend) els.fbSend.addEventListener("click", sendFeedback)
  if (els.fbOverlay) els.fbOverlay.addEventListener("click", function (e) {
    if (e.target === els.fbOverlay) closeFeedback()
  })
}

function openFeedback() {
  if (els.fbOverlay) els.fbOverlay.classList.add("open")
  if (els.fbText) els.fbText.focus()
}

function closeFeedback() {
  if (els.fbOverlay) els.fbOverlay.classList.remove("open")
  if (els.fbText) els.fbText.value = ""
  if (els.fbStatus) els.fbStatus.textContent = ""
}

function sendFeedback() {
  var text = els.fbText ? els.fbText.value.trim() : ""
  if (!text) return

  if (els.fbSend) {
    els.fbSend.disabled = true
    els.fbSend.textContent = "送信中..."
  }
  if (els.fbStatus) els.fbStatus.textContent = "送信中..."

  // Google Apps Scriptに送信（hidden iframe + form submitでCORS完全回避）
  var GAS_URL = "https://script.google.com/macros/s/AKfycbxtEHNqu4ZK-vD34TgVE-btkB04mTXi0P8IOdk9LSOJfnF8XNjK8WPOqaoQhYJUcN02rg/exec"

  var iframeName = "fb_iframe_" + Date.now()
  var iframe = document.createElement("iframe")
  iframe.name = iframeName
  iframe.style.display = "none"
  document.body.appendChild(iframe)

  var form = document.createElement("form")
  form.method = "POST"
  form.action = GAS_URL
  form.target = iframeName
  form.style.display = "none"

  var fields = { feedback: text, timestamp: new Date().toISOString(), url: window.location.href }
  for (var key in fields) {
    var input = document.createElement("input")
    input.type = "hidden"
    input.name = key
    input.value = fields[key]
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()

  // iframeのロード完了を待つ（成功とみなす）
  iframe.onload = function () {
    if (els.fbStatus) els.fbStatus.textContent = "✅ 送信完了！ありがとうございます"
    if (els.fbSend) { els.fbSend.disabled = false; els.fbSend.textContent = "送信" }
    if (els.fbText) els.fbText.value = ""
    setTimeout(closeFeedback, 2000)
    setTimeout(function () {
      document.body.removeChild(iframe)
      document.body.removeChild(form)
    }, 3000)
  }

  // タイムアウト（5秒で成功とみなす — iframeのonloadが発火しない場合のフォールバック）
  setTimeout(function () {
    if (els.fbStatus && els.fbStatus.textContent === "送信中...") {
      els.fbStatus.textContent = "✅ 送信完了！ありがとうございます"
      if (els.fbSend) { els.fbSend.disabled = false; els.fbSend.textContent = "送信" }
      setTimeout(closeFeedback, 2000)
    }
    try { document.body.removeChild(iframe) } catch (e) { }
    try { document.body.removeChild(form) } catch (e) { }
  }, 5000)
}

// ═══════════════════════════════════════════════════════════
// スプラッシュ画面の動的要素生成
// ═══════════════════════════════════════════════════════════
function initSplash() {
  // 星を生成
  var starsContainer = document.getElementById("splashStars")
  if (starsContainer) {
    for (var i = 0; i < 60; i++) {
      var star = document.createElement("div")
      star.className = "splash-star"
      var size = Math.random() * 3 + 1
      star.style.cssText = "width:" + size + "px;height:" + size + "px;" +
        "left:" + (Math.random() * 100) + "%;" +
        "top:" + (Math.random() * 60) + "%;" +
        "animation-delay:" + (Math.random() * 3) + "s;" +
        "animation-duration:" + (1.5 + Math.random() * 2) + "s"
      starsContainer.appendChild(star)
    }
  }

  // 建物を生成
  var buildingsContainer = document.getElementById("splashBuildings")
  if (buildingsContainer) {
    var heights = [24, 36, 18, 42, 28, 0, 30, 20, 38, 22, 32, 16]
    for (var i = 0; i < heights.length; i++) {
      var h = heights[i]
      if (h === 0) {
        var spacer = document.createElement("div")
        spacer.style.width = "30px"
        buildingsContainer.appendChild(spacer)
        continue
      }
      var bld = document.createElement("div")
      bld.className = "splash-building"
      bld.style.cssText = "width:" + (8 + (i % 3) * 4) + "px;height:" + h + "px"
      // 窓
      var numWindows = Math.floor(h / 10)
      for (var j = 0; j < numWindows; j++) {
        var win = document.createElement("div")
        win.className = "splash-building-window"
        win.style.cssText = "left:" + (20 + (j * 40) % 60) + "%;top:" + (12 + j * 24) + "%;" +
          "opacity:" + (Math.random() > 0.4 ? 0.8 : 0.2)
        bld.appendChild(win)
      }
      buildingsContainer.appendChild(bld)
    }
  }

  // スタートボタン
  var startBtn = document.getElementById("splashStart")
  if (startBtn) {
    startBtn.addEventListener("click", function () {
      dismissSplash()
    })
  }
}

function dismissSplash() {
  if (els.splash) {
    els.splash.classList.add("hide")
    setTimeout(function () {
      if (els.splash && els.splash.parentNode) {
        els.splash.parentNode.removeChild(els.splash)
      }
    }, 600)
  }
}

// ═══════════════════════════════════════════════════════════
// 初期化
// ═══════════════════════════════════════════════════════════
function init() {
  // v0風スプラッシュ初期化
  initSplash()

  // 最初のレンダリング
  if (state.currentIndex >= TOTAL_QUESTIONS) {
    renderEnd()
  } else {
    render()
  }

  // フィードバックイベント
  bindFeedbackEvents()
}

// ページ読み込み完了時に初期化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
