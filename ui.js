/**
 * ui.js — 描画・イベント・起動
 */

var els = {
  screen: document.getElementById("screen"),
  progressPill: document.getElementById("progressPill"),
  taxFill: document.getElementById("taxFill"),
  taxValue: document.getElementById("taxValue"),
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

function computeApproachShift(value) {
  var t = value / 2
  var px = 22
  return {
    leftX: Math.round(px * Math.max(0, -t)),
    rightX: Math.round(-px * Math.max(0, t)),
  }
}

function updateTaxGauge(tax) {
  els.taxValue.textContent = String(tax)
  var maxAbs = 40
  var clamped = Math.max(-maxAbs, Math.min(maxAbs, tax))
  var ratio = clamped / maxAbs
  var widthPct = Math.abs(ratio) * 50
  els.taxFill.style.width = widthPct + "%"
  if (ratio >= 0) {
    els.taxFill.style.left = "50%"
    els.taxFill.style.transform = "translateX(0)"
  } else {
    els.taxFill.style.left = (50 - widthPct) + "%"
    els.taxFill.style.transform = "translateX(0)"
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

function render() {
  var q = QUESTIONS[state.currentIndex]
  var stage = state.currentIndex + 1
  var saved = state.answers[q.id]
  var value = saved && typeof saved.value === "number" ? clampValue(saved.value) : 0

  var shift = computeApproachShift(value)
  var leftActive = value < 0
  var rightActive = value > 0
  var progressPct = Math.round((stage / TOTAL_QUESTIONS) * 100)

  els.progressPill.textContent = "Q" + stage + "/" + TOTAL_QUESTIONS

  var taxPreview = state.tax + getTaxDelta(q, value)

  els.screen.innerHTML =
    '<div class="fade">' +
    '<div class="progressRow">' +
    '<div class="bar" aria-hidden="true"><div style="width:' + progressPct + '%"></div></div>' +
    '<div class="progressText">' + progressPct + '%</div>' +
    '</div>' +

    '<h2 class="qTitle">' + escapeHtml(q.title) + '</h2>' +
    '<p class="qSub">' + escapeHtml(q.subtitle) + '</p>' +

    '<div class="choices" style="--lx:' + shift.leftX + 'px; --rx:' + shift.rightX + 'px;">' +
    '<div class="choice" data-side="left" data-active="' + leftActive + '">' +
    '<div class="icon" aria-hidden="true">' + q.left.icon + '</div>' +
    '<div class="meta">' +
    '<div class="label">' + escapeHtml(q.left.label) + '</div>' +
    '<div class="desc">' + escapeHtml(q.left.desc) + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="choice" data-side="right" data-active="' + rightActive + '">' +
    '<div class="icon" aria-hidden="true">' + q.right.icon + '</div>' +
    '<div class="meta">' +
    '<div class="label">' + escapeHtml(q.right.label) + '</div>' +
    '<div class="desc">' + escapeHtml(q.right.desc) + '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +

    '<div class="sliderBlock">' +
    '<div class="sliderHead">' +
    '<div class="hint">どちらに近づける？</div>' +
    '</div>' +
    '<div class="rangeRow">' +
    '<div class="rangeWrap">' +
    '<div class="policyDotLabel">現状の政策</div>' +
    '<div class="policyDot"></div>' +
    '<input id="slider" type="range" min="-2" max="2" step="1" value="' + value + '" aria-label="距離感スライダー" />' +
    '</div>' +
    '<div class="ends">' +
    '<div class="end left ' + (leftActive ? "active" : "") + '">' + escapeHtml(q.left.label) + '</div>' +
    '<div class="end right ' + (rightActive ? "active" : "") + '">' + escapeHtml(q.right.label) + '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +

    '<div class="buttons">' +
    '<button class="btn" id="back" type="button"' + (state.currentIndex === 0 ? " disabled" : "") + '>戻る</button>' +
    '<button class="btn primary" id="next" type="button">この選択で進む</button>' +
    '</div>' +
    '</div>'

  updateTaxGauge(taxPreview)
  updateTaxDeltaHint(getTaxDelta(q, value))
  bindQuestionEvents()
}

function bindQuestionEvents() {
  var slider = document.getElementById("slider")
  var backBtn = document.getElementById("back")
  var nextBtn = document.getElementById("next")

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
  var stage = QUESTIONS.length
  els.progressPill.textContent = "完了"
  updateTaxGauge(state.tax)
  updateTaxDeltaHint(0)

  var userScores = calcAxisScores(state.answers)
  var partyResults = calcPartyDistances(userScores)
  var axes = ["merit_equity", "small_big", "free_norm", "open_protect", "now_future"]

  var radarSVG = buildRadarSVG(userScores)

  // 5軸バー
  var axisHtml = ''
  for (var i = 0; i < axes.length; i++) {
    var ax = axes[i]
    var score = userScores[ax]
    axisHtml +=
      '<div class="axisRow">' +
      '<div class="axisLabel">' + escapeHtml(AXIS_NAMES[ax]) + '</div>' +
      '<div class="axisEnds"><span>' + escapeHtml(AXIS_LEFT_LABELS[ax]) + '</span><span>' + escapeHtml(AXIS_RIGHT_LABELS[ax]) + '</span></div>' +
      '<div class="axisBar"><div class="axisFill" style="width:' + score + '%"></div><div class="axisDot" style="left:' + score + '%"></div></div>' +
      '<div class="axisScore">' + score + '</div>' +
      '</div>'
  }

  // 政党マッチング
  var partyHtml = ''
  for (var i = 0; i < partyResults.length; i++) {
    var p = partyResults[i]
    partyHtml +=
      '<div class="partyRow">' +
      '<div class="partyName">' + escapeHtml(p.name) + '</div>' +
      '<div class="partyBar"><div class="partyFill" style="width:' + p.match + '%;background:' + p.color + '"></div></div>' +
      '<div class="partyPct">' + p.match + '%</div>' +
      '</div>'
  }

  els.screen.innerHTML =
    '<div class="fade">' +
    '<div class="progressRow">' +
    '<div class="bar" aria-hidden="true"><div style="width:100%"></div></div>' +
    '<div class="progressText">100%</div>' +
    '</div>' +

    '<h2 class="qTitle">あなたの政治スタンス</h2>' +
    '<p class="qSub">15問の回答から、5つの軸であなたの立ち位置を分析しました。</p>' +

    '<div class="radarWrap">' + radarSVG + '</div>' +

    '<div class="resultSection">' +
    '<div class="resultHeading">5軸スコア</div>' +
    axisHtml +
    '</div>' +

    '<div class="resultSection">' +
    '<div class="resultHeading">政党との近さ</div>' +
    '<p class="resultNote">※ 概算値です。投票の推奨ではありません。</p>' +
    partyHtml +
    '</div>' +

    '<div class="buttons">' +
    '<button class="btn" id="back" type="button">戻る</button>' +
    '<button class="btn primary" id="resetAll" type="button">もう一度やる</button>' +
    '</div>' +

    '<div class="footnote" style="margin-top:8px">※ この結果は診断目的のものではありません。政党データは概算であり、特定の政党を推奨するものではありません。</div>' +
    '</div>'

  document.getElementById("back").addEventListener("click", function () {
    state.currentIndex = QUESTIONS.length - 1
    saveState(state)
    render()
  })

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
  })()
