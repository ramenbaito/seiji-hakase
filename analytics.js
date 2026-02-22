/**
 * analytics.js — 利用状況の匿名分析（Google Analytics イベント）
 */
(function () {
  function track(eventName, params) {
    try {
      if (typeof gtag === "function") {
        gtag("event", eventName, params || {})
      }
    } catch (e) {
      // 分析失敗は無視
    }
  }

  window.analyticsTrack = {
    sessionStart: function () {
      track("session_start", { method: "splash" })
    },
    questionView: function (index, questionId) {
      track("question_view", {
        question_index: index + 1,
        question_id: questionId,
        total_questions: 15
      })
    },
    questionAnswer: function (index, questionId, value) {
      track("question_answer", {
        question_index: index + 1,
        question_id: questionId,
        answer_value: value
      })
    },
    quizComplete: function (data) {
      track("quiz_complete", {
        character: data.character,
        top_party: data.topParty,
        match_rate: data.matchRate,
        answered_count: data.answeredCount
      })
    }
  }
})()
