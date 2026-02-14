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
    <svg width="${size}" height="${size * 1.6}" viewBox="0 0 120 200" aria-hidden="true">
      <!-- 髪の毛（後ろ） -->
      <ellipse cx="60" cy="42" rx="32" ry="28" fill="#4A2810"/>
      <path d="M28 45 Q28 70 35 80 L35 55 Z" fill="#3A1E08"/>
      <path d="M92 45 Q92 70 85 80 L85 55 Z" fill="#3A1E08"/>
      
      <!-- 頭 -->
      <ellipse cx="60" cy="52" rx="26" ry="24" fill="#FFDBB4"/>
      
      <!-- 髪の毛（前髪） -->
      <path d="M34 42 Q38 28 50 25 Q55 30 60 24 Q65 30 70 25 Q82 28 86 42 L82 38 Q75 30 68 34 Q63 28 58 34 Q52 28 47 34 Q40 30 38 38 Z" fill="#4A2810"/>
      <path d="M34 42 Q36 48 38 42" fill="#5A3818"/>
      <path d="M86 42 Q84 48 82 42" fill="#5A3818"/>
      
      <!-- 眉毛 -->
      <path d="M42 48 Q48 44 54 48" fill="none" stroke="#3A1E08" stroke-width="2" stroke-linecap="round"/>
      <path d="M66 48 Q72 44 78 48" fill="none" stroke="#3A1E08" stroke-width="2" stroke-linecap="round"/>
      
      <!-- 目（大きなアニメ目） -->
      <ellipse cx="48" cy="56" rx="7" ry="8" fill="#FFF"/>
      <ellipse cx="72" cy="56" rx="7" ry="8" fill="#FFF"/>
      <ellipse cx="49" cy="57" rx="5" ry="6" fill="#2C5F8A"/>
      <ellipse cx="73" cy="57" rx="5" ry="6" fill="#2C5F8A"/>
      <ellipse cx="49" cy="58" rx="3.5" ry="4" fill="#1A3A5A"/>
      <ellipse cx="73" cy="58" rx="3.5" ry="4" fill="#1A3A5A"/>
      <circle cx="46" cy="54" r="2.5" fill="#FFF"/>
      <circle cx="70" cy="54" r="2.5" fill="#FFF"/>
      <circle cx="51" cy="59" r="1.2" fill="#FFF" opacity="0.7"/>
      <circle cx="75" cy="59" r="1.2" fill="#FFF" opacity="0.7"/>
      
      <!-- まつ毛 -->
      <path d="M41 50 Q42 48 44 49" stroke="#1A1A1A" stroke-width="1" fill="none"/>
      <path d="M76 49 Q78 48 79 50" stroke="#1A1A1A" stroke-width="1" fill="none"/>
      
      <!-- 鼻 -->
      <path d="M59 62 Q60 64 61 62" fill="none" stroke="#E8B090" stroke-width="1.2" stroke-linecap="round"/>
      
      <!-- 口（笑顔） -->
      <path d="M52 68 Q60 76 68 68" fill="#E87040" stroke="#D06030" stroke-width="0.8"/>
      <path d="M54 68 Q60 73 66 68" fill="#FFF" opacity="0.6"/>
      
      <!-- ほっぺ -->
      <ellipse cx="38" cy="64" rx="5" ry="3" fill="#FFB4B4" opacity="0.5"/>
      <ellipse cx="82" cy="64" rx="5" ry="3" fill="#FFB4B4" opacity="0.5"/>
      
      <!-- 耳 -->
      <ellipse cx="33" cy="55" rx="4" ry="6" fill="#FFDBB4"/>
      <ellipse cx="33" cy="55" rx="2.5" ry="4" fill="#F0C8A0"/>
      <ellipse cx="87" cy="55" rx="4" ry="6" fill="#FFDBB4"/>
      <ellipse cx="87" cy="55" rx="2.5" ry="4" fill="#F0C8A0"/>
      
      <!-- 首 -->
      <rect x="52" y="74" width="16" height="10" rx="3" fill="#FFDBB4"/>
      
      <!-- ジャケット -->
      <path d="M36 84 Q36 80 44 78 L60 82 L76 78 Q84 80 84 84 L86 140 L34 140 Z" fill="#3A6BA8"/>
      <path d="M60 82 L58 140" stroke="#2A5A98" stroke-width="1"/>
      <path d="M60 82 L62 140" stroke="#2A5A98" stroke-width="1"/>
      
      <!-- 襟 -->
      <path d="M48 78 L60 88 L52 84 Z" fill="#FFF"/>
      <path d="M72 78 L60 88 L68 84 Z" fill="#FFF"/>
      
      <!-- ボタン -->
      <circle cx="60" cy="95" r="2" fill="#FFE66D"/>
      <circle cx="60" cy="108" r="2" fill="#FFE66D"/>
      <circle cx="60" cy="121" r="2" fill="#FFE66D"/>
      
      <!-- 腕 -->
      <path d="M34 84 L20 100 L18 126 Q16 132 22 132 L28 130 L30 106 L36 92" fill="#3A6BA8"/>
      <path d="M86 84 L100 100 L102 126 Q104 132 98 132 L92 130 L90 106 L84 92" fill="#3A6BA8"/>
      
      <!-- 手 -->
      <ellipse cx="22" cy="132" rx="6" ry="5" fill="#FFDBB4"/>
      <ellipse cx="98" cy="132" rx="6" ry="5" fill="#FFDBB4"/>
      
      <!-- ズボン -->
      <path d="M36 138 L38 170 Q39 174 46 174 L54 174 Q56 174 56 170 L58 145 L62 145 L64 170 Q64 174 66 174 L74 174 Q81 174 82 170 L84 138 Z" fill="#2D3748"/>
      
      <!-- 靴 -->
      <path d="M38 172 L36 178 Q34 184 42 184 L56 184 Q58 182 56 178 L54 174" fill="#5A3A20"/>
      <path d="M82 172 L84 178 Q86 184 78 184 L64 184 Q62 182 64 178 L66 174" fill="#5A3A20"/>
      <path d="M36 179 Q44 177 56 179" fill="none" stroke="#4A2A10" stroke-width="0.8"/>
      <path d="M84 179 Q76 177 64 179" fill="none" stroke="#4A2A10" stroke-width="0.8"/>
    </svg>
  `
}

function createNPCSVGS(side, active, intensity, questionId) {
  var baseColor = side === "left" ? "#4ECDC4" : "#FF6B6B"
  var hairColors = side === "left" ? ["#5A3A20", "#2A2A2A", "#8B6914"] : ["#CCCCCC", "#888888", "#AAAAAA"]
  var skinColors = ["#FFDBB4", "#FFDBB4", "#FFDBB4"]

  // 質問テーマ別のカスタマイズ
  var npcStyles = {
    "Q1": {
      left: { hair: ["#5A3A20", "#2A2A2A", "#8B4513"], skin: ["#FFDBB4", "#FFDBB4", "#FFDBB4"], clothes: ["#FF9EAA", "#88CCFF", "#FFE66D"] },
      right: { hair: ["#CCCCCC", "#AAAAAA", "#DDDDDD"], skin: ["#FFDBB4", "#FFDBB4", "#FFDBB4"], clothes: ["#7B8A9E", "#6A7A8E", "#8B9AAE"] }
    },
    "Q4": {
      left: { hair: ["#2A2A2A", "#5A3A20", "#1A1A1A"], skin: ["#FFDBB4", "#FFDBB4", "#FFDBB4"], clothes: ["#2D3748", "#2D3748", "#2D3748"] },
      right: { hair: ["#2A2A2A", "#1A1A1A", "#3A3A3A"], skin: ["#FFDBB4", "#FFDBB4", "#FFDBB4"], clothes: ["#4a5a4a", "#4a5a4a", "#5a6a5a"] }
    },
    "Q6": {
      left: { hair: ["#5A3A20", "#8B6914", "#2A2A2A"], skin: ["#FFDBB4", "#FFDBB4", "#FFDBB4"], clothes: ["#4ECDC4", "#88CCFF", "#FFB74D"] },
      right: { hair: ["#1A1A1A", "#2A2A2A", "#3A3A3A"], skin: ["#FFDBB4", "#FFDBB4", "#FFDBB4"], clothes: ["#2D3748", "#2D3748", "#2D3748"] }
    },
    "Q8": {
      left: { hair: ["#8B4513", "#1A1A1A", "#D4A574"], skin: ["#D4A574", "#8B6914", "#FFDBB4"], clothes: ["#4ECDC4", "#FF9E42", "#9E6BFF"] },
      right: { hair: ["#1A1A1A", "#2A2A2A", "#3A3A3A"], skin: ["#FFDBB4", "#FFDBB4", "#FFDBB4"], clothes: ["#BC002D", "#BC002D", "#BC002D"] }
    }
  }

  var clothesColors = null
  if (questionId && npcStyles[questionId]) {
    var style = npcStyles[questionId][side]
    if (style) {
      hairColors = style.hair
      skinColors = style.skin
      clothesColors = style.clothes
    }
  }
  // intensity: 0=中立, 1=やや, 2=強く → スケール: 0%, 10%, 30%
  var absInt = intensity || 0
  var scalePct = absInt === 2 ? 30 : absInt === 1 ? 10 : 0
  var scale = 1 + scalePct / 100

  // 髪型バリエーション
  var hairStyles = [
    function (hc) { return '<ellipse cx="30" cy="13" rx="16" ry="11" fill="' + hc + '"/><path d="M14 16 Q16 22 18 16" fill="' + hc + '"/><path d="M42 16 Q44 22 46 16" fill="' + hc + '"/>' },
    function (hc) { return '<ellipse cx="30" cy="14" rx="15" ry="10" fill="' + hc + '"/><path d="M15 18 Q18 8 24 14 Q28 8 32 14 Q36 8 40 14 Q44 8 45 18" fill="' + hc + '"/>' },
    function (hc) { return '<ellipse cx="30" cy="14" rx="14" ry="9" fill="' + hc + '"/><path d="M16 17 L18 5 Q30 2 42 5 L44 17" fill="' + hc + '"/>' }
  ]

  var npcs = ""
  for (var i = 0; i < 3; i++) {
    var isMain = i === 1
    var baseW = isMain ? 48 : 34
    var baseH = isMain ? 90 : 65
    var width = Math.round(baseW * (active ? scale : 1))
    var height = Math.round(baseH * (active ? scale : 1))
    var opacity = isMain ? (active ? 1 : 0.7) : (active ? 0.7 : 0.4)
    var sc = skinColors[i]
    var hc = hairColors[i]
    var cc = clothesColors ? clothesColors[i] : (isMain ? baseColor : baseColor + '99')

    // 表情
    var eyes, mouth, cheeks
    if (active) {
      eyes = '<ellipse cx="24" cy="24" rx="3.5" ry="4" fill="#FFF"/><ellipse cx="36" cy="24" rx="3.5" ry="4" fill="#FFF"/>' +
        '<ellipse cx="24.5" cy="25" rx="2.2" ry="2.8" fill="#1A1A1A"/><ellipse cx="36.5" cy="25" rx="2.2" ry="2.8" fill="#1A1A1A"/>' +
        '<circle cx="23" cy="23" r="1.2" fill="#FFF"/><circle cx="35" cy="23" r="1.2" fill="#FFF"/>'
      mouth = '<path d="M25 31 Q30 36 35 31" fill="#E87040" stroke="#D06030" stroke-width="0.5"/>'
      cheeks = '<ellipse cx="19" cy="29" rx="3" ry="1.8" fill="#FFB4B4" opacity="0.5"/><ellipse cx="41" cy="29" rx="3" ry="1.8" fill="#FFB4B4" opacity="0.5"/>'
    } else {
      eyes = '<ellipse cx="24" cy="25" rx="2.5" ry="2" fill="#1A1A1A"/><ellipse cx="36" cy="25" rx="2.5" ry="2" fill="#1A1A1A"/>'
      mouth = '<path d="M27 32 Q30 30 33 32" fill="none" stroke="#C06040" stroke-width="1.2" stroke-linecap="round"/>'
      cheeks = ''
    }
    // 眉
    var brows = '<path d="M21 21 Q24 19 27 21" fill="none" stroke="' + hc + '" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M33 21 Q36 19 39 21" fill="none" stroke="' + hc + '" stroke-width="1.2" stroke-linecap="round"/>'

    npcs += '<svg viewBox="0 0 60 100" style="width:' + width + 'px;height:' + height + 'px;opacity:' + opacity + ';transition:all 0.3s ease-out" aria-hidden="true">' +
      // 髪（後ろ）
      '<ellipse cx="30" cy="18" rx="16" ry="14" fill="' + hc + '"/>' +
      // 頭
      '<ellipse cx="30" cy="22" rx="14" ry="13" fill="' + sc + '"/>' +
      // 髪（前）
      hairStyles[i](hc) +
      // 耳
      '<ellipse cx="16" cy="24" rx="2.5" ry="3.5" fill="' + sc + '"/>' +
      '<ellipse cx="44" cy="24" rx="2.5" ry="3.5" fill="' + sc + '"/>' +
      // 眉・目・口・ほっぺ
      brows + eyes + mouth + cheeks +
      // 鼻
      '<path d="M29 27 Q30 29 31 27" fill="none" stroke="#E0B090" stroke-width="0.8" stroke-linecap="round"/>' +
      // 首
      '<rect x="26" y="34" width="8" height="5" rx="2" fill="' + sc + '"/>' +
      // 体（ジャケット風）
      '<path d="M18 39 Q18 37 22 36 L30 38 L38 36 Q42 37 42 39 L43 62 L17 62 Z" fill="' + cc + '"/>' +
      // 襟
      '<path d="M25 36 L30 41 L27 39 Z" fill="#FFF" opacity="0.6"/>' +
      '<path d="M35 36 L30 41 L33 39 Z" fill="#FFF" opacity="0.6"/>' +
      // 腕
      '<path d="M17 40 L12 50 L13 58 L16 58 L17 50 L18 44" fill="' + cc + '"/>' +
      '<path d="M43 40 L48 50 L47 58 L44 58 L43 50 L42 44" fill="' + cc + '"/>' +
      // 手
      '<ellipse cx="14" cy="59" rx="3" ry="2.5" fill="' + sc + '"/>' +
      '<ellipse cx="46" cy="59" rx="3" ry="2.5" fill="' + sc + '"/>' +
      // ズボン
      '<path d="M18 61 L20 80 L27 80 L29 66 L31 66 L33 80 L40 80 L42 61 Z" fill="#4A5568"/>' +
      // 靴
      '<path d="M19 79 L17 84 Q16 86 22 86 L28 86 Q29 84 27 82" fill="#3A2A1A"/>' +
      '<path d="M41 79 L43 84 Q44 86 38 86 L32 86 Q31 84 33 82" fill="#3A2A1A"/>' +
      '</svg>'
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
      { h: 14, w: 12, color: "#3a4a5a", windows: 1 },
      { h: 22, w: 14, color: "#5a6a7a", windows: 2 },
      { h: 38, w: 22, color: "#e8e8e8", windows: 4, roof: "flat", sign: "🏥 病院", signColor: "#EF5350" },
      { h: 32, w: 16, color: "#d8d8d8", windows: 3 },
      { h: 0 },
      { h: 18, w: 12, color: "#4a5a6a", windows: 2, sign: "薬局", signColor: "#66BB6A" },
      { h: 10, w: 10, color: "#3a4a5a" },
    ],
    "ショッピングモール": [
      { h: 14, w: 12, color: "#4a5a6a", windows: 1, sign: "CAFE", signColor: "#8D6E63" },
      { h: 20, w: 16, color: "#5a5a6a", windows: 2, sign: "SHOP", signColor: "#42A5F5", awning: "#1565C0" },
      { h: 26, w: 28, color: "#6a5a4a", windows: 3, roof: "flat", sign: "MALL", signColor: "#FFE66D", awning: "#E65100" },
      { h: 26, w: 28, color: "#6a5a4a", windows: 3, roof: "flat", awning: "#BF360C" },
      { h: 0 },
      { h: 18, w: 14, color: "#4a5a5a", windows: 2, sign: "雑貨", signColor: "#F48FB1", awning: "#AD1457" },
      { h: 22, w: 16, color: "#5a4a4a", windows: 2, sign: "服屋", signColor: "#CE93D8" },
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
      { h: 14, w: 16, color: "#6a5a4a", windows: 1, sign: "八百屋", signColor: "#4CAF50", awning: "#E65100" },
      { h: 18, w: 14, color: "#5a5a4a", windows: 2, roof: "triangle", roofColor: "#4a4a3a", sign: "本屋", signColor: "#FFE66D" },
      { h: 12, w: 18, color: "#5a4a4a", windows: 1, sign: "魚屋", signColor: "#42A5F5", awning: "#1565C0" },
      { h: 20, w: 16, color: "#4a4a5a", windows: 2, roof: "triangle", roofColor: "#3a3a4a", sign: "定食屋", signColor: "#FF8A65", awning: "#BF360C" },
      { h: 0 },
      { h: 14, w: 14, color: "#5a4a4a", windows: 1, sign: "薬局", signColor: "#81C784", awning: "#2E7D32" },
      { h: 12, w: 16, color: "#4a5a5a", windows: 1, sign: "花屋", signColor: "#F48FB1", awning: "#AD1457" },
      { h: 18, w: 14, color: "#5a5a5a", windows: 2, sign: "パン屋", signColor: "#FFE0B2", awning: "#E65100" },
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
      { h: 22, w: 14, color: "#4a5a6a", windows: 2 },
      { h: 34, w: 16, color: "#5a6a7a", windows: 3, sign: "OFFICE", signColor: "#90CAF9" },
      { h: 42, w: 20, color: "#6a7a8a", windows: 5, roof: "flat", sign: "TOWER", signColor: "#B0BEC5" },
      { h: 38, w: 16, color: "#5a6a7a", windows: 4, roof: "flat" },
      { h: 0 },
      { h: 26, w: 14, color: "#4a5a6a", windows: 3 },
      { h: 20, w: 12, color: "#3a4a5a", windows: 2 },
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
      { h: 18, w: 14, color: "#2a2a3a", windows: 1, sign: "酒屋", signColor: "#FFCC80" },
      { h: 16, w: 30, color: "#3a3a4a", windows: 2, roof: "flat", sign: "🛒 スーパー", signColor: "#EF5350", awning: "#B71C1C" },
      { h: 16, w: 30, color: "#3a3a4a", windows: 2, roof: "flat", awning: "#B71C1C" },
      { h: 0 },
      { h: 20, w: 14, color: "#2a2a3a", windows: 2, sign: "弁当", signColor: "#FFE082" },
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
    var h = b.h * 2
    var details = ""

    // 窓（枠付き）
    var winCount = b.windows || Math.floor(b.h / 8)
    for (var j = 0; j < winCount; j++) {
      var lit = Math.random() > 0.4
      var glowAlpha = lit ? time.windowGlow : time.windowGlow * 0.2
      var wLeft = 15 + (j * 35) % 65
      var wTop = 12 + j * 20
      details += '<div style="position:absolute;left:' + wLeft + '%;top:' + wTop + '%;width:30%;height:16%;border:1.5px solid rgba(255,255,255,0.15);border-radius:1px;background:rgba(255,230,109,' + glowAlpha + ');box-shadow:inset 0 0 2px rgba(0,0,0,0.3)">' +
        '<div style="position:absolute;left:49%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.1)"></div>' +
        '<div style="position:absolute;top:49%;left:0;width:100%;height:1px;background:rgba(255,255,255,0.1)"></div></div>'
    }

    // 屋根
    var roofHtml = ""
    if (b.roof === "triangle") {
      roofHtml = '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:' + (w / 2 + 4) + 'px solid transparent;border-right:' + (w / 2 + 4) + 'px solid transparent;border-bottom:12px solid ' + (b.roofColor || color) + '"></div>'
    }

    // ドア（1階部分）
    var doorHtml = ''
    if (b.h > 10 && !b.isTree) {
      doorHtml = '<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:28%;height:22%;max-height:18px;background:rgba(0,0,0,0.25);border-radius:2px 2px 0 0;border:1px solid rgba(255,255,255,0.08)">' +
        '<div style="position:absolute;right:20%;top:45%;width:2px;height:2px;border-radius:50%;background:rgba(255,230,109,' + (time.windowGlow * 0.5) + ')"></div></div>'
    }

    // 看板（商店街系のみ）
    var signHtml = ''
    if (b.sign) {
      signHtml = '<div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);padding:1px 4px;background:' + (b.signColor || '#FFE66D') + ';border-radius:2px;font-size:5px;color:#333;font-weight:bold;white-space:nowrap;z-index:2">' + b.sign + '</div>'
    }

    // 庇（ひさし）
    var awningHtml = ''
    if (b.awning) {
      awningHtml = '<div style="position:absolute;bottom:22%;left:-4%;width:108%;height:6px;background:' + b.awning + ';border-radius:0 0 3px 3px;box-shadow:0 1px 2px rgba(0,0,0,0.3)"></div>'
    }

    // 壁面テクスチャ
    var wallTexture = 'background:' + color + ';'
    if (b.h > 15) {
      wallTexture += 'background:linear-gradient(180deg, ' + color + ' 0%, ' + color + 'DD 100%);border:1px solid rgba(255,255,255,0.05);'
    }

    return '<div class="building" style="height:' + h + 'px;width:' + w + 'px;' + wallTexture + 'border-radius:2px 2px 0 0">' + roofHtml + details + doorHtml + signHtml + awningHtml + '</div>'
  })
}

function getSceneProps(questionId, value) {
  var leftActive = value < 0
  var rightActive = value > 0
  var props = {
    "Q1": {
      left: '<svg viewBox="0 0 60 60" width="40" height="40"><rect x="15" y="20" width="30" height="30" rx="4" fill="#FF9EAA"/><circle cx="30" cy="16" r="8" fill="#FFDBB4"/><circle cx="30" cy="14" r="5" fill="#5A3A20"/><circle cx="28" cy="16" r="1" fill="#333"/><circle cx="33" cy="16" r="1" fill="#333"/><circle cx="15" cy="42" r="8" fill="#666"/><circle cx="45" cy="42" r="8" fill="#666"/><line x1="15" y1="35" x2="45" y2="35" stroke="#888" stroke-width="2"/></svg>',
      right: '<svg viewBox="0 0 60 60" width="40" height="40"><circle cx="30" cy="18" r="9" fill="#FFDBB4"/><circle cx="30" cy="14" r="6" fill="#CCC"/><circle cx="28" cy="18" r="1" fill="#333"/><circle cx="33" cy="18" r="1" fill="#333"/><rect x="18" y="28" width="24" height="24" rx="4" fill="#7B8A9E"/><line x1="30" y1="52" x2="30" y2="60" stroke="#8B7355" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="60" r="3" fill="#8B7355"/></svg>',
      label: { left: "👶 子育て世代", right: "👴 シニア世代" }
    },
    "Q2": {
      left: '<svg viewBox="0 0 60 50" width="48" height="40"><rect x="5" y="10" width="50" height="30" rx="3" fill="#4a5a3a"/><text x="30" y="29" text-anchor="middle" font-size="8" fill="#FFE66D" font-weight="bold">OPEN</text><rect x="10" y="40" width="10" height="6" rx="1" fill="#8B7355"/><rect x="40" y="40" width="10" height="6" rx="1" fill="#8B7355"/></svg>',
      right: '<svg viewBox="0 0 60 50" width="48" height="40"><rect x="8" y="5" width="44" height="35" rx="3" fill="#5a6a7a"/><text x="30" y="26" text-anchor="middle" font-size="7" fill="#FFF" font-weight="bold">公共事業</text><rect x="15" y="40" width="30" height="6" rx="2" fill="#FFE66D"/><polygon points="10,5 30,0 50,5" fill="#4a5a6a"/></svg>',
      label: { left: "🏪 民間", right: "🏛️ 国の投資" }
    },
    "Q3": {
      left: '<svg viewBox="0 0 50 60" width="36" height="44"><rect x="12" y="30" width="26" height="20" rx="2" fill="#FFD700"/><polygon points="25,5 10,30 40,30" fill="#FFD700"/><circle cx="25" cy="22" r="4" fill="#FFF"/><text x="25" y="25" text-anchor="middle" font-size="6" fill="#FFD700" font-weight="bold">1</text></svg>',
      right: '<svg viewBox="0 0 60 50" width="44" height="36"><circle cx="15" cy="25" r="6" fill="#FFDBB4"/><circle cx="30" cy="25" r="6" fill="#FFDBB4"/><circle cx="45" cy="25" r="6" fill="#FFDBB4"/><line x1="15" y1="35" x2="45" y2="35" stroke="#4ECDC4" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="35" r="4" fill="#FFDBB4"/><circle cx="30" cy="35" r="4" fill="#FFDBB4"/><circle cx="45" cy="35" r="4" fill="#FFDBB4"/></svg>',
      label: { left: "🏆 成果主義", right: "🤝 機会均等" }
    },
    "Q4": {
      left: '<svg viewBox="0 0 60 50" width="44" height="36"><rect x="5" y="10" width="22" height="14" rx="1" fill="#0055A4"/><rect x="5" y="10" width="7" height="14" fill="#FFF"/><rect x="20" y="10" width="7" height="14" fill="#EF4135"/><rect x="33" y="10" width="22" height="14" rx="1" fill="#BC002D"/><circle cx="44" cy="17" r="4" fill="#FFF"/><path d="M20 38 L30 30 L40 38" fill="none" stroke="#4ECDC4" stroke-width="2.5" stroke-linecap="round"/></svg>',
      right: '<svg viewBox="0 0 60 50" width="44" height="36"><polygon points="30,5 35,18 48,18 37,26 41,40 30,32 19,40 23,26 12,18 25,18" fill="#4a5a4a" stroke="#6a7a6a" stroke-width="1"/><rect x="20" y="42" width="20" height="4" rx="1" fill="#5a5a5a"/></svg>',
      label: { left: "🕊️ 外交協力", right: "🛡️ 防衛強化" }
    },
    "Q5": {
      left: '<svg viewBox="0 0 60 50" width="44" height="36"><rect x="20" y="20" width="20" height="25" rx="1" fill="#5588BB"/><polygon points="20,20 30,8 40,20" fill="#5588BB"/><line x1="10" y1="10" x2="10" y2="35" stroke="#888" stroke-width="2"/><path d="M3 14 Q10 8 17 14 Q10 20 3 14" fill="#4ECDC4"/><circle cx="50" cy="12" r="8" fill="#FFE66D" opacity="0.8"/></svg>',
      right: '<svg viewBox="0 0 60 50" width="44" height="36"><rect x="10" y="15" width="18" height="25" rx="1" fill="#6a6a6a"/><rect x="32" y="10" width="18" height="30" rx="1" fill="#5a5a5a"/><path d="M15 10 Q20 3 25 10" fill="#999" stroke="#aaa" stroke-width="1"/><path d="M37 5 Q42 0 47 5" fill="#999" stroke="#aaa" stroke-width="1"/><text x="30" y="48" text-anchor="middle" font-size="6" fill="#FF9E9E">¥</text></svg>',
      label: { left: "🌱 環境優先", right: "🏭 経済優先" }
    },
    "Q6": {
      left: '<svg viewBox="0 0 50 50" width="36" height="36"><rect x="10" y="25" width="30" height="18" rx="2" fill="#555"/><rect x="14" y="28" width="22" height="12" rx="1" fill="#88CCFF"/><circle cx="25" cy="15" r="8" fill="#FFDBB4"/><circle cx="25" cy="12" r="5" fill="#5A3A20"/><rect x="17" y="23" width="16" height="10" rx="2" fill="#4ECDC4"/></svg>',
      right: '<svg viewBox="0 0 50 50" width="36" height="36"><circle cx="25" cy="12" r="8" fill="#FFDBB4"/><rect x="12" y="2" width="26" height="10" rx="5" fill="#FFE66D"/><circle cx="25" cy="10" r="5" fill="#5A3A20"/><rect x="15" y="22" width="20" height="16" rx="2" fill="#2D3748"/><path d="M15 22 L25 18 L35 22" fill="#2D3748"/></svg>',
      label: { left: "💻 フリーランス", right: "👔 正社員" }
    },
    "Q7": {
      left: '<svg viewBox="0 0 60 50" width="44" height="36"><rect x="5" y="15" width="12" height="30" rx="1" fill="#5a6a7a"/><rect x="20" y="8" width="14" height="37" rx="1" fill="#6a7a8a"/><rect x="37" y="12" width="10" height="33" rx="1" fill="#5a6a7a"/><rect x="50" y="18" width="8" height="27" rx="1" fill="#4a5a6a"/></svg>',
      right: '<svg viewBox="0 0 60 50" width="44" height="36"><polygon points="5,35 20,15 35,35" fill="#2a6a2a"/><polygon points="25,35 40,10 55,35" fill="#1a5a1a"/><rect x="10" y="36" width="40" height="8" rx="1" fill="#8B7355"/><path d="M10 40 Q30 38 50 40" fill="#7aaa4a"/></svg>',
      label: { left: "🏙️ 都市集中", right: "🌾 地方支援" }
    },
    "Q8": {
      left: '<svg viewBox="0 0 60 50" width="44" height="36"><circle cx="12" cy="15" r="7" fill="#D4A574"/><circle cx="30" cy="15" r="7" fill="#8B6914"/><circle cx="48" cy="15" r="7" fill="#FFDBB4"/><rect x="5" y="24" width="14" height="12" rx="2" fill="#4ECDC4"/><rect x="23" y="24" width="14" height="12" rx="2" fill="#FF9E42"/><rect x="41" y="24" width="14" height="12" rx="2" fill="#9E6BFF"/><text x="30" y="46" text-anchor="middle" font-size="6" fill="#FFF">🌍</text></svg>',
      right: '<svg viewBox="0 0 60 50" width="44" height="36"><circle cx="20" cy="15" r="7" fill="#FFDBB4"/><circle cx="40" cy="15" r="7" fill="#FFDBB4"/><circle cx="20" cy="12" r="5" fill="#1A1A1A"/><circle cx="40" cy="12" r="5" fill="#2A2A2A"/><rect x="13" y="24" width="14" height="12" rx="2" fill="#BC002D"/><rect x="33" y="24" width="14" height="12" rx="2" fill="#BC002D"/><rect x="18" y="40" width="24" height="3" rx="1" fill="#BC002D"/><circle cx="30" cy="41" r="4" fill="#FFF"/></svg>',
      label: { left: "🌏 多文化共生", right: "🇯🇵 慎重対応" }
    },
    "Q9": {
      left: '<svg viewBox="0 0 50 50" width="36" height="36"><rect x="12" y="8" width="26" height="34" rx="4" fill="#333"/><rect x="14" y="12" width="22" height="24" rx="2" fill="#4488FF"/><circle cx="25" cy="40" r="2" fill="#666"/><text x="25" y="27" text-anchor="middle" font-size="7" fill="#FFF">AI</text></svg>',
      right: '<svg viewBox="0 0 50 50" width="36" height="36"><circle cx="25" cy="22" r="14" fill="none" stroke="#FF6B6B" stroke-width="2.5"/><rect x="18" y="15" width="14" height="14" rx="2" fill="#FFE66D"/><text x="25" y="25" text-anchor="middle" font-size="8" fill="#333" font-weight="bold">🔒</text><rect x="20" y="38" width="10" height="6" rx="1" fill="#888"/></svg>',
      label: { left: "📱 自由活用", right: "🔐 規制整備" }
    },
    "Q10": {
      left: '<svg viewBox="0 0 50 50" width="36" height="36"><rect x="8" y="12" width="34" height="28" rx="3" fill="#E8E8E8"/><text x="25" y="30" text-anchor="middle" font-size="7" fill="#333" font-weight="bold">民間</text><polygon points="8,12 25,3 42,12" fill="#4ECDC4"/></svg>',
      right: '<svg viewBox="0 0 50 50" width="36" height="36"><rect x="10" y="15" width="30" height="22" rx="3" fill="#E8E8E8"/><rect x="20" y="8" width="10" height="10" rx="1" fill="#FF4444"/><text x="25" y="15" text-anchor="middle" font-size="10" fill="#FFF" font-weight="bold">+</text><text x="25" y="32" text-anchor="middle" font-size="5" fill="#333">保険証</text></svg>',
      label: { left: "🏥 民間医療", right: "💳 公的保険" }
    },
    "Q11": {
      left: '<svg viewBox="0 0 50 50" width="36" height="36"><ellipse cx="25" cy="30" rx="14" ry="12" fill="#FFB74D"/><rect x="20" y="15" width="10" height="15" rx="2" fill="#FFB74D"/><text x="25" y="35" text-anchor="middle" font-size="8" fill="#FFF" font-weight="bold">¥</text></svg>',
      right: '<svg viewBox="0 0 50 50" width="36" height="36"><polygon points="25,5 30,20 45,20 33,30 37,45 25,35 13,45 17,30 5,20 20,20" fill="none" stroke="#FFE66D" stroke-width="1.5"/><path d="M10 40 L20 25 L30 32 L40 15" fill="none" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round"/><polygon points="38,13 42,13 40,17" fill="#4ECDC4"/></svg>',
      label: { left: "🏦 財政健全化", right: "📈 積極投資" }
    },
    "Q12": {
      left: '<svg viewBox="0 0 50 50" width="36" height="36"><circle cx="25" cy="20" r="10" fill="#FFD700"/><text x="25" y="24" text-anchor="middle" font-size="10" fill="#333" font-weight="bold">¥</text><path d="M15 35 L25 28 L35 35" fill="none" stroke="#4ECDC4" stroke-width="2.5" stroke-linecap="round"/></svg>',
      right: '<svg viewBox="0 0 50 50" width="36" height="36"><line x1="25" y1="5" x2="25" y2="35" stroke="#888" stroke-width="2"/><polygon points="12,20 25,8 38,20" fill="none" stroke="#888" stroke-width="1.5"/><circle cx="16" cy="28" r="5" fill="#FF6B6B"/><circle cx="34" cy="28" r="5" fill="#4ECDC4"/><text x="16" y="31" text-anchor="middle" font-size="6" fill="#FFF">少</text><text x="34" y="31" text-anchor="middle" font-size="6" fill="#FFF">多</text></svg>',
      label: { left: "💰 自由経済", right: "⚖️ 再分配" }
    },
    "Q13": {
      left: '<svg viewBox="0 0 50 50" width="36" height="36"><rect x="8" y="15" width="34" height="22" rx="10" fill="#4ECDC4" opacity="0.3"/><text x="25" y="30" text-anchor="middle" font-size="12" fill="#FFF">💬</text><path d="M25 37 L20 45" stroke="#4ECDC4" stroke-width="2"/></svg>',
      right: '<svg viewBox="0 0 50 50" width="36" height="36"><rect x="10" y="10" width="30" height="30" rx="3" fill="#2D3748"/><text x="25" y="22" text-anchor="middle" font-size="6" fill="#FFE66D" font-weight="bold">RULE</text><line x1="15" y1="28" x2="35" y2="28" stroke="#FFE66D" stroke-width="1"/><line x1="15" y1="33" x2="30" y2="33" stroke="#FFE66D" stroke-width="1" opacity="0.5"/></svg>',
      label: { left: "📢 表現の自由", right: "📜 ルール整備" }
    },
    "Q14": {
      left: '<svg viewBox="0 0 60 50" width="44" height="36"><rect x="10" y="18" width="40" height="22" rx="2" fill="#4a7aaa"/><path d="M10 18 Q30 8 50 18" fill="#5a8abb"/><rect x="20" y="35" width="20" height="8" rx="1" fill="#8B5A2B"/><rect x="0" y="38" width="60" height="4" fill="#3a6a9a"/></svg>',
      right: '<svg viewBox="0 0 60 50" width="44" height="36"><path d="M20 35 L25 15 L30 25 L35 10 L40 35" fill="none" stroke="#7aaa4a" stroke-width="2"/><rect x="15" y="35" width="30" height="8" rx="1" fill="#8B7355"/><circle cx="30" cy="30" r="3" fill="#FFD700"/><text x="30" y="48" text-anchor="middle" font-size="5" fill="#FFE66D">国産米</text></svg>',
      label: { left: "🚢 自由貿易", right: "🌾 国産保護" }
    },
    "Q15": {
      left: '<svg viewBox="0 0 50 60" width="36" height="44"><circle cx="25" cy="18" r="7" fill="#FFDBB4"/><rect x="18" y="26" width="14" height="16" rx="2" fill="#4ECDC4"/><path d="M15 55 L25 35 L35 55" fill="none" stroke="#888" stroke-width="1.5"/><polygon points="25,5 28,12 22,12" fill="#FFE66D"/></svg>',
      right: '<svg viewBox="0 0 60 50" width="44" height="36"><circle cx="15" cy="18" r="6" fill="#FFDBB4"/><circle cx="30" cy="18" r="6" fill="#FFDBB4"/><circle cx="45" cy="18" r="6" fill="#FFDBB4"/><rect x="9" y="26" width="12" height="10" rx="2" fill="#FF6B6B"/><rect x="24" y="26" width="12" height="10" rx="2" fill="#4ECDC4"/><rect x="39" y="26" width="12" height="10" rx="2" fill="#FFE66D"/><path d="M15 38 Q30 42 45 38" fill="none" stroke="#FF9E9E" stroke-width="2" stroke-linecap="round"/></svg>',
      label: { left: "🧗 自立", right: "🤝 支え合い" }
    }
  }
  var p = props[questionId]
  if (!p) return ''
  var leftOpacity = leftActive ? 1 : (rightActive ? 0.3 : 0.6)
  var rightOpacity = rightActive ? 1 : (leftActive ? 0.3 : 0.6)
  var leftScale = leftActive ? 'scale(1.15)' : 'scale(1)'
  var rightScale = rightActive ? 'scale(1.15)' : 'scale(1)'
  return '<div class="scene-props">' +
    '<div class="scene-prop-left" style="opacity:' + leftOpacity + ';transform:' + leftScale + '">' + p.left + (p.label ? '<span class="scene-prop-label">' + p.label.left + '</span>' : '') + '</div>' +
    '<div class="scene-prop-right" style="opacity:' + rightOpacity + ';transform:' + rightScale + '">' + p.right + (p.label ? '<span class="scene-prop-label">' + p.label.right + '</span>' : '') + '</div>' +
    '</div>'
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
      
      <!-- シーンプロップス -->
      ${getSceneProps(question.id, value)}
      
      <!-- 左キャラクター -->
      <div class="characters-left ${leftActive ? 'active' : ''}">
        ${createNPCSVGS("left", leftActive, leftActive ? Math.abs(value) : 0, question.id)}
      </div>
      
      <!-- 右キャラクター -->
      <div class="characters-right ${rightActive ? 'active' : ''}">
        ${createNPCSVGS("right", rightActive, rightActive ? Math.abs(value) : 0, question.id)}
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
    "0": "現状の政策",
    "1": "ややB寄り →",
    "2": "かなりB寄り →"
  }

  return `
    <div class="quiz-card" style="display:flex;flex-direction:column;gap:16px;width:100%;max-width:680px;animation:slideInRight 0.4s ease-out">
      <!-- ヘッダー -->
      <div class="rpg-header" style="flex-direction:column;align-items:center;gap:4px">
        <div class="rpg-title" style="font-size:21px">
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
      
      <!-- 税金バー（中央基準） -->
      <div class="tax-bar-wrap">
        <span class="tax-bar-label">税負担</span>
        <div class="tax-bar-track">
          <div class="tax-bar-center"></div>
          <div class="tax-bar-fill" style="left:${taxGauge >= 0 ? '50%' : (50 + taxGauge * 5) + '%'};width:${Math.abs(taxGauge) * 5}%;background:${taxGauge >= 0 ? '#FF6B6B' : '#4ECDC4'}"></div>
          <div class="tax-bar-indicator" style="left:${50 + taxGauge * 5}%"></div>
        </div>
        <div class="tax-bar-value">${taxGauge > 0 ? '+' + Math.round(taxGauge * 10) / 10 : taxGauge < 0 ? Math.round(taxGauge * 10) / 10 : '0'}</div>
      </div>
      
      <!-- 現状の政策ポップアップ -->
      <div class="policy-popup" id="policyPopup" style="display:none">
        <div class="policy-popup-content">
          <div class="policy-popup-title">📋 現状の政策</div>
          <p class="policy-popup-text">${escapeHtml(question.currentPolicy || '')}</p>
          <button type="button" class="policy-popup-close" id="policyClose">閉じる</button>
        </div>
      </div>
      
      ${createRPGScene(value, question, idx)}
      
      <!-- ダイアログボックス -->
      <div class="dialogue-box">
        <div class="dialogue-corner tl"></div>
        <div class="dialogue-corner tr"></div>
        <div class="dialogue-corner bl"></div>
        <div class="dialogue-corner br"></div>
        <div class="scene-badge">${getSceneEmoji(question.scene)} ${escapeHtml(question.scene)}</div>
        <h2 class="question-title">${escapeHtml(question.title)}</h2>
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
          <div class="slider-desc ${value === 0 ? 'neutral policy-tap' : value < 0 ? 'left' : 'right'}" ${value === 0 ? 'id="policyTap"' : ''}>${labels[value]}</div>
        </div>
      </div>
      
      <!-- コントロール -->
      <div class="controls">
        <span class="note">💡 正解はありません。迷ったら「現状の政策」でOK！</span>
        <span class="keyboard-hint">⌨️ ←→:調整 A/B:選択 Enter:決定 BS:戻る</span>
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
  var labels = ["実力↔平等", "小さい↔大きい政府", "自由↔規範", "開放↔保護", "現在↔未来"]
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

  // データ点 + 値ラベル
  for (var m = 0; m < n; m++) {
    var val = (scores[axes[m]] || 50) / 100
    var angle = startAngle + m * angleStep
    var x = cx + r * val * Math.cos(angle)
    var y = cy + r * val * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = "#4ECDC4"
    ctx.fill()
    // 値ラベル
    ctx.font = "bold 9px sans-serif"
    ctx.fillStyle = "rgba(78, 205, 196, 0.9)"
    ctx.textAlign = "center"
    var labelY = y + (angle > 0 && angle < Math.PI ? 12 : -10)
    ctx.fillText(Math.round(scores[axes[m]] || 50), x, labelY)
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

  return "あなたは「" + parts[0] + "」タイプ。" + parts[1] + "傾向があり、" + parts[2] + "考え方です。" + parts[3] + "し、" + parts[4] + "でしょう。"
}

function createResultScreen(answers) {
  // answers = { Q1: {value:1, tax:...}, Q2: {value:-1, tax:...}, ... }
  var entries = Object.entries(answers)
  var values = entries.map(function (e) { return e[1].value || 0 })
  var avg = values.length > 0 ? values.reduce(function (s, v) { return s + v }, 0) / values.length : 0
  var level = Math.min(99, 10 + entries.length * 5 + Math.round(Math.abs(avg) * 3))

  // scoring.js の5軸スコア＋政党マッチング＋キャラ生成
  var axisScores = calcAxisScores(answers)
  var partyResults = calcPartyDistances(axisScores)
  var topParty = partyResults[0]
  var character = buildCharacter(axisScores)

  return `
    <div style="display:flex;flex-direction:column;gap:20px;width:100%;max-width:680px">
      <div class="result-header" style="animation:fadeScale 0.5s ease-out">
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
      
      <div class="result-card" style="animation:slideInRight 0.5s ease-out 0.2s both">
        <div class="result-corner tl"></div>
        <div class="result-corner tr"></div>
        <div class="result-corner bl"></div>
        <div class="result-corner br"></div>
        
        <!-- キャラカード -->
        <div class="chara-card" style="border-color:${character.animal.color}40">
          <div class="chara-emoji">${character.animal.emoji}</div>
          <div class="chara-name" style="color:${character.animal.color}">${character.fullName}</div>
          <div class="chara-tagline">${character.tagline}</div>
          <div class="chara-items">
            ${character.items.map(function (it) {
    return '<span class="chara-item" title="' + it.item.label + '">' + it.item.emoji + '</span>'
  }).join('')}
          </div>
          <p class="chara-desc">${character.description}</p>
        </div>
        
        <!-- 政党マッチ -->
        <div class="party-match" style="border:2px solid ${topParty.color}40;background:${topParty.color}08">
          <div class="party-match-label">あなたに最も近い政党</div>
          <a href="${topParty.url}" target="_blank" rel="noopener" class="party-name" style="color:${topParty.color};text-shadow:0 0 15px ${topParty.color}40">${topParty.name}</a>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="${topParty.color}" stroke-width="3" stroke-dasharray="${topParty.match * 0.974} ${97.4 - topParty.match * 0.974}" stroke-dashoffset="24.35" stroke-linecap="round" style="transition:stroke-dasharray 1s ease-out"/>
            </svg>
            <span class="party-desc">マッチ度 ${topParty.match}%</span>
          </div>
        </div>
        
        <!-- レーダーチャート -->
        <div style="display:flex;justify-content:center;padding:8px 0">
          <canvas id="radarChart" width="280" height="280" style="max-width:100%"></canvas>
        </div>
        
        <!-- あなたの傾向 -->
        <div class="tendency-box">
          <div class="summary-label">🧭 あなたの傾向まとめ</div>
          <p class="tendency-text">${character.description}</p>
        </div>
        
        <!-- 5軸スコア -->
        <div class="answer-summary">
          <div class="summary-label">📊 あなたの政治傾向（5つの軸）</div>
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
        <details class="answer-summary">
          <summary class="summary-label" style="cursor:pointer;user-select:none">回答サマリー ▼</summary>
          ${entries.map(function (entry) {
    var id = entry[0], v = entry[1].value || 0
    var posClass = v === 0 ? 'neutral' : v < 0 ? 'left' : 'right'
    var qData = QUESTIONS.find(function (q) { return q.id === id })
    var qTitle = qData ? qData.title : id
    return '<div class="answer-row" title="' + qTitle + '">' +
      '<span class="answer-id">' + id + '</span>' +
      '<div class="answer-bar">' +
      '<div class="answer-center"></div>' +
      '<div class="answer-dot ' + posClass + '" style="left:' + (((v + 2) / 4) * 100) + '%"></div>' +
      '</div>' +
      '<span class="answer-value ' + posClass + '">' + (v > 0 ? '+' + v : v) + '</span>' +
      '</div>'
  }).join('')}
        </details>
        
        <div class="result-divider"></div>
        
        <!-- トップ3政党（大きく表示） -->
        <div class="party-list">
          <div class="summary-label">🏛️ あなたに近い政党 TOP3</div>
          <div class="party-list-note">※ 各政党の公式見解を参考にした概算です</div>
          ${partyResults.slice(0, 3).map(function (p, i) {
    var rank = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
    var partyTips = {
      "自民党": "保守・経済成長重視。長期政権を担う",
      "立憲民主党": "リベラル・社会保障重視。野党第一党",
      "日本維新の会": "改革志向・小さな政府。規制緩和推進",
      "公明党": "中道・福祉重視。与党として連立",
      "国民民主党": "中道・現実路線。対案型野党",
      "共産党": "左派・平等重視。護憲・反戦",
      "れいわ新選組": "左派・再分配重視。消費税廃止を主張",
      "社民党": "社会民主主義。平和・人権重視",
      "参政党": "保守・自主独立路線。食と教育を重視",
      "日本保守党": "保守・伝統重視。国益と安全保障を最優先"
    }
    var tip = partyTips[p.name] || ''
    return '<div class="party-top-card" style="border-color:' + p.color + '30;animation:slideInRight ' + (0.3 + i * 0.1) + 's ease-out both">' +
      '<div class="party-top-rank">' + rank + '</div>' +
      '<a href="' + (p.url || '#') + '" target="_blank" rel="noopener" class="party-top-name" style="color:' + p.color + '">' + p.name + '</a>' +
      '<div class="party-top-bar"><div class="party-row-fill" style="width:' + p.match + '%;background:' + p.color + '"></div></div>' +
      '<span class="party-top-pct" style="color:' + p.color + '">' + p.match + '%</span>' +
      '<div class="party-top-tip">' + tip + '</div>' +
      (p.policyUrl ? '<a href="' + p.policyUrl + '" target="_blank" rel="noopener" class="party-top-policy" style="border-color:' + p.color + '40;color:' + p.color + '">政策を見る →</a>' : '') +
      '</div>'
  }).join('')}
        </div>
        
        <!-- 残りの政党（折りたたみ） -->
        <div class="party-rest-wrap">
          <button type="button" class="party-rest-toggle" id="partyRestToggle">🏛️ 他の政党も見る（${partyResults.length - 3}党）</button>
          <div class="party-rest-list" id="partyRestList" style="display:none">
            ${partyResults.slice(3).map(function (p, i) {
    return '<div class="party-row" style="animation:slideInRight ' + (0.1 + i * 0.05) + 's ease-out">' +
      '<a href="' + (p.url || '#') + '" target="_blank" rel="noopener" class="party-row-name">' + p.name + '</a>' +
      '<div class="party-row-bar">' +
      '<div class="party-row-fill" style="width:' + p.match + '%;background:' + p.color + ';opacity:0.35"></div>' +
      '</div>' +
      '<span class="party-row-pct">' + p.match + '%</span>' +
      '</div>'
  }).join('')}
          </div>
        </div>
      </div>
      
      <div class="result-controls" style="animation:slideInRight 0.5s ease-out 0.4s both">
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

  // EXPバーのカウントアップアニメーション
  var expFill = document.querySelector(".exp-fill")
  if (expFill) {
    expFill.style.width = "0%"
    setTimeout(function () { expFill.style.width = "100%" }, 150)
  }

  // 政党バーのカウントアップアニメーション
  document.querySelectorAll(".party-row-fill").forEach(function (fill) {
    var targetWidth = fill.style.width
    fill.style.width = "0%"
    setTimeout(function () { fill.style.width = targetWidth }, 300)
  })

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

  // 現状の政策ポップアップ
  var policyTap = document.getElementById("policyTap")
  var policyPopup = document.getElementById("policyPopup")
  var policyClose = document.getElementById("policyClose")
  if (policyTap && policyPopup) {
    policyTap.addEventListener("click", function () {
      policyPopup.style.display = "flex"
    })
  }
  if (policyClose && policyPopup) {
    policyClose.addEventListener("click", function () {
      policyPopup.style.display = "none"
    })
  }
  if (policyPopup) {
    policyPopup.addEventListener("click", function (e) {
      if (e.target === policyPopup) policyPopup.style.display = "none"
    })
  }

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
  } else if (e.key === "Backspace") {
    goBack()
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
  var partyToggle = document.getElementById("partyRestToggle")

  if (partyToggle) {
    partyToggle.addEventListener("click", function () {
      var list = document.getElementById("partyRestList")
      if (!list) return
      if (list.style.display === "none") {
        list.style.display = "block"
        partyToggle.textContent = "🏛️ 閉じる"
      } else {
        list.style.display = "none"
        partyToggle.textContent = "🏛️ 他の政党も見る"
      }
    })
  }

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
  var character = buildCharacter(axisScores)
  var itemEmojis = character.items.map(function (it) { return it.item.emoji }).join("")
  var text = "【政治博士】政党診断の結果\n\n" +
    character.animal.emoji + " あなたは「" + character.fullName + "」\n" +
    "🏛️ 最も近い政党: " + topParty.name + "（" + topParty.match + "%）\n" +
    "🎒 装備: " + itemEmojis + "\n\n" +
    "15問で分かる、あなたの政治傾向 👉\n" + window.location.href + "\n\n#政治博士 #政党診断"

  if (navigator.share) {
    navigator.share({ title: "政治博士", text: text }).catch(function () { })
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function () {
      var btn = document.getElementById("shareBtn")
      if (btn) {
        var original = btn.innerHTML
        btn.innerHTML = "✅ コピーしました！"
        btn.style.transform = "scale(1.05)"
        setTimeout(function () { btn.style.transform = "" }, 200)
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
    "0": "現状の政策",
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

  // aria-valuenow更新
  var sliderEl = document.getElementById("slider")
  if (sliderEl) sliderEl.setAttribute("aria-valuenow", value)

  // 中央(0)通過時の触覚フィードバック
  if (value === 0 && navigator.vibrate) {
    navigator.vibrate(10)
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
  }, 250)
}

function goBack() {
  if (isTransitioning || state.currentIndex === 0) return

  isTransitioning = true
  var card = document.querySelector(".quiz-card")
  if (card) {
    card.style.transition = "opacity 0.2s, transform 0.2s"
    card.style.opacity = "0"
    card.style.transform = "translateX(20px)"
  }
  setTimeout(function () {
    isTransitioning = false
    state.currentIndex--
    saveState(state)
    render()
  }, 250)
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

  // ESCキーで閉じる
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && els.fbOverlay && els.fbOverlay.classList.contains("open")) {
      closeFeedback()
    }
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
    var heights = Array.from({ length: 12 }, function (_, i) {
      return i === 5 ? 0 : Math.floor(16 + Math.random() * 30)
    })
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

  // Enterキーでもスタート
  document.addEventListener("keydown", function splashKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      document.removeEventListener("keydown", splashKey)
      dismissSplash()
    }
  })
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
