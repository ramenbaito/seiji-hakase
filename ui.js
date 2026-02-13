/**
 * ui.js — RPG風政治博士クイズ UI
 */

var els = {
  app: document.getElementById("app")
}

var state = loadState()

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function clampValue(value) {
  var v = Number(value)
  if (isNaN(v)) return 0
  return Math.max(-2, Math.min(2, v))
}

function valueToInternal(value) {
  return Math.round(((value + 2) / 4) * 100)
}

function updateTaxGauge(tax) {
  var taxFill = document.getElementById("taxFill")
  var taxValue = document.getElementById("taxValue")
  if (!taxFill || !taxValue) return

  taxValue.textContent = String(tax)
  var maxAbs = 40
  var clamped = Math.max(-maxAbs, Math.min(maxAbs, tax))
  var ratio = clamped / maxAbs
  var widthPct = Math.abs(ratio) * 50
  taxFill.style.width = widthPct + "%"
  if (ratio >= 0) {
    taxFill.style.left = "50%"
    taxFill.style.transform = "translateX(0)"
  } else {
    taxFill.style.left = (50 - widthPct) + "%"
    taxFill.style.transform = "translateX(0)"
  }
}

function updateTaxDeltaHint(delta) {
  var el = document.getElementById("taxDeltaText")
  if (!el) return
  if (delta === 0) {
    el.textContent = "この選択での税変動：なし"
    el.style.color = "rgba(255,255,255,0.4)"
  } else if (delta > 0) {
    el.textContent = "この選択での税変動：+" + delta
    el.style.color = "#ff9a6e"
  } else {
    el.textContent = "この選択での税変動：" + delta
    el.style.color = "#6ea8ff"
  }
}

function createRPGScene(value, question) {
  var leftOpacity = value < 0 ? Math.abs(value / 2) : 0.2
  var rightOpacity = value > 0 ? Math.abs(value / 2) : 0.2
  var mainX = 50 + (value * 15)
  var sceneName = question.sceneName || "政治の街"

  return `
    <div class="rpg-scene">
      <div class="stars">
        ${Array(20).fill(0).map((_, i) =>
    `<div class="star" style="left:${Math.random() * 100}%;top:${Math.random() * 60}%;animation-delay:${Math.random() * 2}s"></div>`
  ).join('')}
      </div>

      <div class="buildings">
        ${[60, 80, 45, 90, 55, 70, 40].map(h =>
    `<div class="building" style="height:${h}px;width:${20 + Math.random() * 15}px"></div>`
  ).join('')}
      </div>

      <div class="ground"></div>
      <div class="road">
        ${Array(5).fill(0).map(() => '<div class="road-line"></div>').join('')}
      </div>

      <div class="scene-label">${escapeHtml(sceneName)}</div>
      <div class="hp-bar">
        <span class="hp-label">HP</span>
        <div class="hp-track">
          <div class="hp-fill"></div>
        </div>
      </div>

      <div class="characters-left" style="opacity:${leftOpacity}">
        <svg width="40" height="60" viewBox="0 0 40 60" class="character">
          <circle cx="20" cy="12" r="6" fill="#FF6B6B"/>
          <rect x="14" y="20" width="12" height="16" fill="#FF6B6B" rx="2"/>
          <rect x="12" y="36" width="4" height="12" fill="#4A5568" rx="1"/>
          <rect x="24" y="36" width="4" height="12" fill="#4A5568" rx="1"/>
          <rect x="11" y="22" width="3" height="10" fill="#FF6B6B" rx="1" transform="rotate(-20 12.5 27)"/>
          <rect x="26" y="22" width="3" height="10" fill="#FF6B6B" rx="1" transform="rotate(20 27.5 27)"/>
          <circle cx="17" cy="11" r="1" fill="#2D3748"/>
          <circle cx="23" cy="11" r="1" fill="#2D3748"/>
          <path d="M 18 14 Q 20 15 22 14" stroke="#2D3748" stroke-width="0.5" fill="none"/>
        </svg>
      </div>

      <div class="characters-right" style="opacity:${rightOpacity}">
        <svg width="40" height="60" viewBox="0 0 40 60" class="character">
          <circle cx="20" cy="12" r="6" fill="#4ECDC4"/>
          <rect x="14" y="20" width="12" height="16" fill="#4ECDC4" rx="2"/>
          <rect x="12" y="36" width="4" height="12" fill="#4A5568" rx="1"/>
          <rect x="24" y="36" width="4" height="12" fill="#4A5568" rx="1"/>
          <rect x="11" y="22" width="3" height="10" fill="#4ECDC4" rx="1" transform="rotate(-20 12.5 27)"/>
          <rect x="26" y="22" width="3" height="10" fill="#4ECDC4" rx="1" transform="rotate(20 27.5 27)"/>
          <circle cx="17" cy="11" r="1" fill="#2D3748"/>
          <circle cx="23" cy="11" r="1" fill="#2D3748"/>
          <path d="M 18 14 Q 20 15 22 14" stroke="#2D3748" stroke-width="0.5" fill="none"/>
        </svg>
      </div>

      <div class="character main" style="left:${mainX}%">
        <svg width="50" height="70" viewBox="0 0 50 70">
          <circle cx="25" cy="15" r="8" fill="#FFE66D"/>
          <rect x="17" y="25" width="16" height="20" fill="#FFE66D" rx="3"/>
          <rect x="15" y="45" width="5" height="15" fill="#4A5568" rx="1"/>
          <rect x="30" y="45" width="5" height="15" fill="#4A5568" rx="1"/>
          <rect x="13" y="28" width="4" height="12" fill="#FFE66D" rx="1" transform="rotate(-25 15 34)"/>
          <rect x="33" y="28" width="4" height="12" fill="#FFE66D" rx="1" transform="rotate(25 35 34)"/>
          <rect x="20" y="7" width="10" height="2" fill="#2D3748"/>
          <rect x="24" y="5" width="2" height="4" fill="#2D3748"/>
          <circle cx="21" cy="13" r="1.5" fill="#2D3748"/>
          <circle cx="29" cy="13" r="1.5" fill="#2D3748"/>
          <circle cx="21" cy="13" r="3" stroke="#2D3748" stroke-width="0.5" fill="none"/>
          <circle cx="29" cy="13" r="3" stroke="#2D3748" stroke-width="0.5" fill="none"/>
          <line x1="24" y1="13" x2="26" y2="13" stroke="#2D3748" stroke-width="0.5"/>
          <path d="M 23 17 Q 25 18 27 17" stroke="#2D3748" stroke-width="0.5" fill="none"/>
        </svg>
      </div>

      <div class="arrow left">←</div>
      <div class="arrow right">→</div>
    </div>
  `
}

function render() {
  var q = QUESTIONS[state.currentIndex]
  var stage = state.currentIndex + 1
  var saved = state.answers[q.id]
  var value = saved && typeof saved.value === "number" ? clampValue(saved.value) : 0

  var leftActive = value < 0
  var rightActive = value > 0
  var progressPct = Math.round((stage / TOTAL_QUESTIONS) * 100)

  var taxPreview = state.tax + getTaxDelta(q, value)
  var narrative = q.narrative || "同じ街に、同時に起きている2つの現実があります。あなたは「どちらに近づくか」だけ決めてください。"
  var sliderDesc = q.descriptions && q.descriptions[value.toString()] ? q.descriptions[value.toString()] : (value === 0 ? '中央' : value < 0 ? q.left.label : q.right.label)

  els.app.innerHTML = `
    <div class="rpg-header">
      <div class="rpg-title">🧓 政治博士 RPG</div>
      <div class="rpg-stage">STAGE ${stage}/${TOTAL_QUESTIONS}</div>
    </div>

    <div class="exp-bar">
      <span class="exp-label">EXP</span>
      <div class="exp-track">
        <div class="exp-fill" style="width:${progressPct}%"></div>
      </div>
      <span class="exp-pct">${progressPct}%</span>
    </div>

    ${createRPGScene(value, q)}

    <div class="question-card">
      <h2 class="question-title">${escapeHtml(q.title)}</h2>
      <p class="question-desc">${escapeHtml(narrative)}</p>
    </div>

    <div class="action-section">
      <div class="action-header">
        <svg class="action-icon" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
        </svg>
        <span class="action-title">行動を選択</span>
      </div>

      <div class="action-buttons">
        <div class="action-btn left ${leftActive ? 'active' : ''}" data-side="left">
          <div class="action-letter">A</div>
          <div class="action-content">
            <div class="action-label">${escapeHtml(q.left.label)}</div>
            <div class="action-hint">${escapeHtml(q.left.hint || q.left.desc || '')}</div>
          </div>
        </div>

        <div class="action-btn right ${rightActive ? 'active' : ''}" data-side="right">
          <div class="action-letter">B</div>
          <div class="action-content">
            <div class="action-label">${escapeHtml(q.right.label)}</div>
            <div class="action-hint">${escapeHtml(q.right.hint || q.right.desc || '')}</div>
          </div>
        </div>
      </div>

      <div class="slider-section">
        <div class="slider-label">どちらに近づける？</div>
        <div class="slider-row">
          <div class="slider-end left ${leftActive ? 'active' : ''}">${escapeHtml(q.left.label)}</div>
          <input type="range" class="rpg-slider" id="slider" min="-2" max="2" step="1" value="${value}" />
          <div class="slider-end right ${rightActive ? 'active' : ''}">${escapeHtml(q.right.label)}</div>
        </div>
        <div class="slider-desc">${escapeHtml(sliderDesc)}</div>
      </div>
    </div>

    <div class="tax-section">
      <div class="tax-label">税金ゲージ</div>
      <div class="tax-bar">
        <div class="center"></div>
        <div class="fill" id="taxFill"></div>
      </div>
      <div class="tax-value" id="taxValue">${taxPreview}</div>
    </div>
    <div class="tax-delta" id="taxDeltaText"></div>

    <div class="controls">
      <div class="note">※ 正解や善悪を示すものではありません。距離感として選んでください。</div>
      <div class="control-buttons">
        <button class="control-btn" id="back" ${state.currentIndex === 0 ? 'disabled' : ''}>戻る</button>
        <button class="control-btn primary" id="next">この選択で進む</button>
      </div>
    </div>
  `

  updateTaxGauge(taxPreview)
  updateTaxDeltaHint(getTaxDelta(q, value))
  bindQuestionEvents()
}

function bindQuestionEvents() {
  var slider = document.getElementById("slider")
  var backBtn = document.getElementById("back")
  var nextBtn = document.getElementById("next")
  var actionBtns = document.querySelectorAll(".action-btn")

  // スライダーイベント
  slider.addEventListener("input", function (e) {
    var v = clampValue(e.target.value)
    var q = QUESTIONS[state.currentIndex]
    var entry = state.answers[q.id] || {}
    state.answers[q.id] = {
      value: v,
      internal: valueToInternal(v),
    }
    saveState(state)
    render()
  })

  // アクションボタンイベント
  actionBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var side = btn.dataset.side
      var v = side === "left" ? -2 : 2
      var q = QUESTIONS[state.currentIndex]

      state.answers[q.id] = {
        value: v,
        internal: valueToInternal(v),
      }
      saveState(state)
      render()
    })
  })

  backBtn.addEventListener("click", function () {
    if (state.currentIndex <= 0) return
    var q = QUESTIONS[state.currentIndex]
    var saved = state.answers[q.id]
    var currentValue = saved && typeof saved.value === "number" ? clampValue(saved.value) : 0
    var delta = getTaxDelta(q, currentValue)
    if (saved && typeof saved.confirmed === "boolean" && saved.confirmed) {
      state.tax -= delta
      state.answers[q.id].confirmed = false
    }
    state.currentIndex -= 1
    saveState(state)
    render()
  })

  nextBtn.addEventListener("click", function () {
    var q = QUESTIONS[state.currentIndex]
    var saved = state.answers[q.id]
    var currentValue = saved && typeof saved.value === "number" ? clampValue(saved.value) : 0
    var delta = getTaxDelta(q, currentValue)

    if (!saved || !saved.confirmed) {
      state.tax += delta
    }

    state.answers[q.id] = {
      value: currentValue,
      internal: valueToInternal(currentValue),
      confirmed: true,
    }

    if (state.currentIndex < QUESTIONS.length - 1) {
      state.currentIndex += 1
      saveState(state)
      render()
      return
    }

    saveState(state)
    renderEnd()
  })
}

function buildRadarSVG(scores) {
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]
  var labels = [AXIS_NAMES.merit_equity, AXIS_NAMES.small_big, AXIS_NAMES.free_norm, AXIS_NAMES.open_protect, AXIS_NAMES.now_future]
  var cx = 150, cy = 150, r = 110
  var n = axes.length
  var angleStep = (2 * Math.PI) / n
  var startAngle = -Math.PI / 2

  function polar(angle, radius) {
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
  }

  var svg = '<svg viewBox="0 0 300 300" width="280" height="280" xmlns="http://www.w3.org/2000/svg">'

  // グリッド線（20%, 40%, 60%, 80%, 100%）
  for (var g = 1; g <= 5; g++) {
    var gr = r * (g / 5)
    var pts = []
    for (var i = 0; i < n; i++) {
      var p = polar(startAngle + i * angleStep, gr)
      pts.push(p.x.toFixed(1) + "," + p.y.toFixed(1))
    }
    svg += '<polygon points="' + pts.join(" ") + '" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>'
  }

  // 軸線
  for (var i = 0; i < n; i++) {
    var p = polar(startAngle + i * angleStep, r)
    svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p.x.toFixed(1) + '" y2="' + p.y.toFixed(1) + '" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>'
  }

  // ユーザーのスコア
  var userPts = []
  for (var i = 0; i < n; i++) {
    var val = scores[axes[i]] / 100
    var p = polar(startAngle + i * angleStep, r * val)
    userPts.push(p.x.toFixed(1) + "," + p.y.toFixed(1))
  }
  svg += '<polygon points="' + userPts.join(" ") + '" fill="rgba(240,192,64,0.2)" stroke="#f0c040" stroke-width="2"/>'

  // 頂点の点
  for (var i = 0; i < n; i++) {
    var val = scores[axes[i]] / 100
    var p = polar(startAngle + i * angleStep, r * val)
    svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4" fill="#f0c040"/>'
  }

  // ラベル
  for (var i = 0; i < n; i++) {
    var p = polar(startAngle + i * angleStep, r + 24)
    var anchor = "middle"
    if (p.x < cx - 10) anchor = "end"
    else if (p.x > cx + 10) anchor = "start"
    svg += '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 4).toFixed(1) + '" text-anchor="' + anchor + '" fill="rgba(255,255,255,0.7)" font-size="11" font-weight="700">' + labels[i] + '</text>'
  }

  svg += '</svg>'
  return svg
}

function renderEnd() {
  var userScores = calcAxisScores(state.answers)
  var partyResults = calcPartyDistances(userScores)
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]

  // キャラクター成長アニメーション
  var characterLevel = Math.floor(state.answers.filter(a => a && a.confirmed).length / 3) + 1

  // 回答サマリー
  var answerRows = ''
  for (var i = 0; i < QUESTIONS.length; i++) {
    var q = QUESTIONS[i]
    var answer = state.answers[q.id]
    if (answer && typeof answer.value === "number") {
      var value = answer.value
      var leftPct = (value + 2) / 4 * 100
      answerRows += `
        <div class="answer-row">
          <div class="answer-id">Q${i + 1}</div>
          <div class="answer-bar">
            <div class="center"></div>
            <div class="answer-dot" style="left:${leftPct}%"></div>
          </div>
          <div class="answer-value ${value < 0 ? 'negative' : value > 0 ? 'positive' : ''}">
            ${value === 0 ? '0' : value < 0 ? value : '+' + value}
          </div>
        </div>
      `
    }
  }

  // 政党マッチング
  var partyHtml = ''
  for (var i = 0; i < Math.min(3, partyResults.length); i++) {
    var p = partyResults[i]
    partyHtml += `
      <div class="result-summary">
        <span class="result-summary-label">${escapeHtml(p.name)}</span>
        <span class="result-summary-value">${p.match}%</span>
      </div>
    `
  }

  els.app.innerHTML = `
    <div class="result-header">
      <div class="result-title">🧓 政治博士 RPG</div>
      <div class="result-stage">COMPLETE</div>
    </div>
    
    <div class="exp-bar">
      <span class="exp-label">EXP</span>
      <div class="exp-track">
        <div class="exp-fill" style="width:100%"></div>
      </div>
      <span class="exp-pct">100%</span>
    </div>
    
    <div class="result-card">
      <div class="result-character">
        <svg width="60" height="80" viewBox="0 0 50 70">
          <circle cx="25" cy="15" r="8" fill="#FFE66D"/>
          <rect x="17" y="25" width="16" height="20" fill="#FFE66D" rx="3"/>
          <rect x="15" y="45" width="5" height="15" fill="#4A5568" rx="1"/>
          <rect x="30" y="45" width="5" height="15" fill="#4A5568" rx="1"/>
          <rect x="13" y="28" width="4" height="12" fill="#FFE66D" rx="1" transform="rotate(-25 15 34)"/>
          <rect x="33" y="28" width="4" height="12" fill="#FFE66D" rx="1" transform="rotate(25 35 34)"/>
          <rect x="20" y="7" width="10" height="2" fill="#2D3748"/>
          <rect x="24" y="5" width="2" height="4" fill="#2D3748"/>
          <circle cx="21" cy="13" r="1.5" fill="#2D3748"/>
          <circle cx="29" cy="13" r="1.5" fill="#2D3748"/>
          <circle cx="21" cy="13" r="3" stroke="#2D3748" stroke-width="0.5" fill="none"/>
          <circle cx="29" cy="13" r="3" stroke="#2D3748" stroke-width="0.5" fill="none"/>
          <line x1="24" y1="13" x2="26" y2="13" stroke="#2D3748" stroke-width="0.5"/>
          <path d="M 23 17 Q 25 18 27 17" stroke="#2D3748" stroke-width="0.5" fill="none"/>
        </svg>
      </div>
      
      <div class="result-title-section">
        <span class="result-name">レベル ${characterLevel} 政治博士</span>
      </div>
      
      <div class="result-desc">15問の回答から、あなたの政治的立場が明らかになりました！</div>
      
      <div class="result-answers">
        ${answerRows}
      </div>
      
      <div class="result-divider"></div>
      
      <div class="result-summary">
        <span class="result-summary-label">最終税金</span>
        <span class="result-summary-value">${state.tax > 0 ? '+' : ''}${state.tax}%</span>
      </div>
      
      ${partyHtml}
    </div>
    
    <div class="result-controls">
      <div class="result-note">※ この結果は診断目的のものではありません</div>
      <button class="result-reset" id="resetAll">
        <span>↻</span>
        <span>もう一度冒険する</span>
      </button>
    </div>
  `

  document.getElementById("resetAll").addEventListener("click", function () {
    localStorage.removeItem(STORAGE_KEY)
    state = loadState()
    render()
  })
}

// フィードバック機能
var FEEDBACK_URL = "https://script.google.com/macros/s/AKfycbxtEHNqu4ZK-vD34TgVE-btkB04mTXi0P8IOdk9LSOJfnF8XNjK8WPOqaoQhYJUcN02rg/exec"

  ; (function initFeedback() {
    var openBtn = document.getElementById("fbOpen")
    var overlay = document.getElementById("fbOverlay")
    var cancelBtn = document.getElementById("fbCancel")
    var sendBtn = document.getElementById("fbSend")
    var textArea = document.getElementById("fbText")
    var statusEl = document.getElementById("fbStatus")

    openBtn.addEventListener("click", function () {
      overlay.classList.add("open")
      textArea.focus()
    })

    cancelBtn.addEventListener("click", function () {
      overlay.classList.remove("open")
      statusEl.textContent = ""
    })

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        overlay.classList.remove("open")
        statusEl.textContent = ""
      }
    })

    var FB_LIMIT_KEY = "seiji_fb_count"
    var FB_MAX_PER_DAY = 3
    var FB_MIN_LENGTH = 5

    function getFbCount() {
      var raw = localStorage.getItem(FB_LIMIT_KEY)
      var parsed = raw ? safeParse(raw) : null
      if (!parsed || parsed.date !== new Date().toISOString().slice(0, 10)) {
        return 0
      }
      return parsed.count || 0
    }

    function incrementFbCount() {
      var today = new Date().toISOString().slice(0, 10)
      var current = getFbCount()
      localStorage.setItem(FB_LIMIT_KEY, JSON.stringify({ date: today, count: current + 1 }))
    }

    sendBtn.addEventListener("click", function () {
      var msg = textArea.value.trim()
      if (!msg) return

      if (msg.length < FB_MIN_LENGTH) {
        statusEl.textContent = "5文字以上で入力してください。"
        statusEl.style.color = "#ff9a6e"
        return
      }

      if (getFbCount() >= FB_MAX_PER_DAY) {
        statusEl.textContent = "本日の送信上限（" + FB_MAX_PER_DAY + "回）に達しました。"
        statusEl.style.color = "#ff9a6e"
        return
      }

      sendBtn.disabled = true
      statusEl.textContent = "送信中..."
      statusEl.style.color = "rgba(255,255,255,0.5)"

      fetch(FEEDBACK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: msg,
          timestamp: new Date().toISOString(),
        }),
      })
        .then(function () {
          incrementFbCount()
          statusEl.textContent = "送信しました！ありがとうございます。"
          statusEl.style.color = "#6ea8ff"
          textArea.value = ""
          setTimeout(function () {
            overlay.classList.remove("open")
            statusEl.textContent = ""
            sendBtn.disabled = false
          }, 1500)
        })
        .catch(function () {
          statusEl.textContent = "送信に失敗しました。もう一度お試しください。"
          statusEl.style.color = "#ff9a6e"
          sendBtn.disabled = false
        })
    })
  })()

  // 起動
  ; (function () {
    var q = QUESTIONS[state.currentIndex]
    if (q && !state.answers[q.id]) {
      state.answers[q.id] = { value: 0, internal: 50 }
      saveState(state)
    }
    render()

    // スプラッシュ画面を1.5秒後に消す
    var splash = document.getElementById("splash")
    if (splash) {
      setTimeout(function () {
        splash.classList.add("hide")
        setTimeout(function () { splash.remove() }, 500)
      }, 1500)
    }
  })()
