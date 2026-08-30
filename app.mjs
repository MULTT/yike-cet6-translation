import {
  getTrainingSetForDate, gradeSentence, loadLearningState, recordSubmission, saveLearningState,
  STORAGE_KEY, toggleCollocation, toggleMastered, trainingSets, getExtraPractice, getPracticeAdvice, isVerifiedPastPaper,
} from "./core.mjs";
import { deleteAttemptImage, saveAttemptImage, validateImageFile } from "./image-store.mjs";

const content = document.querySelector("#app-content");
const today = new Date();
const dateKey = today.toISOString().slice(0, 10);
let state = loadLearningState(window.localStorage);
let activeView = "practice";
let selectedSetId = getTrainingSetForDate(today).id;
let reviewFilter = "pending";
let pendingPhoto = null;

function currentSet() { return trainingSets.find((set) => set.id === selectedSetId) || trainingSets[0]; }
function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
function persist(next) { state = next; const saved = saveLearningState(state, window.localStorage); if (!saved) toast("浏览器未能保存记录，刷新后可能会丢失。", "warn"); updateShell(); }
function toast(message, style = "") { const item = document.querySelector("#toast-template").content.firstElementChild.cloneNode(true); item.textContent = message; item.classList.add(style); document.body.append(item); setTimeout(() => item.remove(), 3400); }
function updateShell() {
  document.querySelector("#streak").innerHTML = `${state.streak} <em>天</em>`;
  document.querySelector("#mistake-count").textContent = state.mistakes.length;
  document.querySelector("#review-count").textContent = Object.keys(state.collocations).length;
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === activeView));
}
function dayLabel() { return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(today); }
function answersFor(setId) { return state.submissions[setId]?.answers ?? ["", ""]; }
function hasSubmitted(setId) { return Boolean(state.submissions[setId]); }

function renderPractice() {
  const set = currentSet(); const submitted = hasSubmitted(set.id); const answers = answersFor(set.id);
  const examMeta = isVerifiedPastPaper(set) ? `<a class="source-chip" href="${set.exam.sourceUrl}" target="_blank" rel="noreferrer">真题 · ${set.exam.year} 年 ${set.exam.month} 月 ${set.exam.paper} · 查看来源 ↗</a>` : `<div class="source-chip">${set.kind === "prediction" ? "原创预测 · 非真题" : "同主题训练"}</div>`;
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">${dayLabel()} · DAILY PRACTICE</p><h1>今天，译得更准确一点。</h1></div><button type="button" class="day-picker" id="set-picker">第 ${trainingSets.findIndex((item) => item.id === set.id) + 1} 组 <span>⌄</span></button></header>
  <div class="picker-panel" id="picker-panel" hidden>${trainingSets.map((item, index) => `<button type="button" data-set-id="${item.id}" class="${item.id === set.id ? "selected" : ""}"><small>第 ${String(index + 1).padStart(2, "0")} 组</small>${escapeHtml(item.theme)}${hasSubmitted(item.id) ? "<b>已完成</b>" : ""}</button>`).join("")}</div>
  <section class="practice-intro">${examMeta}<div><p class="section-kicker">今日主题</p><h2>${escapeHtml(set.theme)}</h2></div><p>同一段材料中的两句话。先独立完成，再看解析。</p></section>
  <section class="photo-box"><div><p class="section-kicker">手写稿（可选）</p><b>先拍照留档，再把英文补录到下方。</b><small>照片只保存在当前浏览器，支持图片且不超过 8MB。</small></div><label class="photo-upload" for="handwritten-photo">＋ 上传或拍照<input id="handwritten-photo" type="file" accept="image/*" capture="environment" hidden></label><div id="photo-preview">${pendingPhoto ? `<img src="${pendingPhoto.url}" alt="手写译文预览"><button type="button" id="remove-photo">删除照片</button>` : ""}</div></section>
  <form id="practice-form" novalidate>
  <div class="sentence-list">${set.sentences.map((sentence, index) => `<article class="sentence-card ${submitted ? "is-submitted" : ""}"><div class="sentence-index">0${index + 1}</div><div class="sentence-main"><p class="chinese-sentence">${escapeHtml(sentence.chinese)}</p><label for="answer-${index}">你的英文译文 <span>建议 ${index === 0 ? "25–40" : "30–50"} 词</span></label><textarea id="answer-${index}" name="answer-${index}" rows="4" placeholder="在这里写下你的译文…" ${submitted ? "readonly" : ""}>${escapeHtml(answers[index])}</textarea><div class="word-row"><span class="input-error" id="error-${index}"></span><span><b id="word-${index}">${answers[index].trim() ? answers[index].trim().split(/\s+/).length : 0}</b> words</span></div>${submitted ? feedbackHtml(sentence, state.submissions[set.id].results[index]) : ""}</div></article>`).join("")}</div>
  ${submitted ? `<div class="completed-row"><span>✓</span><div><b>这组练习已完成</b><p>已为你沉淀易错点与可复习表达。</p></div><button class="secondary-button" type="button" id="review-now">去复习本</button></div>` : `<div class="submit-row"><p><span>提示</span>提交后才能看到英文参考答案与逐句分析。</p><button class="primary-button" type="submit">提交并查看解析 <span>→</span></button></div>`}
  </form>`;
  bindPracticeEvents(set, submitted);
}

function feedbackHtml(sentence, result) {
  const matched = result.matched.length ? result.matched.map((item) => `<li><span>✓</span>${escapeHtml(item.label)}</li>`).join("") : "<li class=muted>本地规则尚未识别到已覆盖的要点。</li>";
  const missed = result.missed.length ? result.missed.map((item) => `<li><span>!</span><div><b>${escapeHtml(item.label)}</b><p>${escapeHtml(item.advice)}</p></div></li>`).join("") : "<li class=success-line><span>✓</span>这一句的核心要点都已覆盖。</li>";
  const notices = result.notices.map((notice) => `<p class="notice">⌁ ${escapeHtml(notice)}</p>`).join("");
  return `<section class="feedback"><div class="feedback-head"><span>提交后解析</span><strong>${result.coverage}% <em>要点覆盖率</em></strong></div><div class="reference"><p>参考译文</p><blockquote>${escapeHtml(sentence.reference)}</blockquote></div><div class="feedback-grid"><div><h4>已覆盖的要点</h4><ul class="matched-list">${matched}</ul></div><div><h4>建议留意</h4><ul class="missed-list">${missed}</ul></div></div>${notices}<div class="collocation-area"><h4>本句固定搭配</h4><div class="collocation-chips">${sentence.collocations.map((item) => { const saved = state.collocations[item.id]; return `<button type="button" class="collocation-chip ${saved ? "saved" : ""}" data-collocation-id="${item.id}" data-sentence-id="${sentence.id}" title="${escapeHtml(item.meaning)}：${escapeHtml(item.example)}">${saved ? "✓ " : "+ "}${escapeHtml(item.expression)}</button>`; }).join("")}</div><p>点击收藏到复习本；悬停可看含义和例句。</p></div><p class="local-note">本地规则会检查核心表达，但无法识别所有合理的同义改写；请结合参考译文判断。</p></section>`;
}

function bindPracticeEvents(set, submitted) {
  document.querySelector("#set-picker").addEventListener("click", () => { const panel = document.querySelector("#picker-panel"); panel.hidden = !panel.hidden; });
  document.querySelectorAll("[data-set-id]").forEach((button) => button.addEventListener("click", () => { selectedSetId = button.dataset.setId; render(); }));
  if (!submitted) {
    [0, 1].forEach((index) => document.querySelector(`#answer-${index}`).addEventListener("input", (event) => { const words = event.target.value.trim() ? event.target.value.trim().split(/\s+/).length : 0; document.querySelector(`#word-${index}`).textContent = words; document.querySelector(`#error-${index}`).textContent = ""; }));
    document.querySelector("#practice-form").addEventListener("submit", (event) => {
      event.preventDefault(); const answers = [0, 1].map((index) => document.querySelector(`#answer-${index}`).value.trim()); let invalid = false;
      answers.forEach((answer, index) => { if (!answer) { invalid = true; document.querySelector(`#error-${index}`).textContent = "请先完成这一句。"; } });
      if (invalid) { document.querySelector(`#answer-${answers.findIndex((answer) => !answer)}`).focus(); toast("两句话都完成后，才能查看解析。", "warn"); return; }
      const results = set.sentences.map((sentence, index) => gradeSentence(sentence, answers[index]));
      persist(recordSubmission(state, { setId: set.id, date: dateKey, answers, results, imageKey: pendingPhoto?.key || null }));
      if (pendingPhoto?.file) saveAttemptImage(pendingPhoto.key, pendingPhoto.file);
      render(); toast("练习已收下，解析已展开。", "success");
    });
  } else {
    document.querySelector("#review-now").addEventListener("click", () => { activeView = "review"; render(); });
    document.querySelectorAll("[data-collocation-id]").forEach((button) => button.addEventListener("click", () => {
      const sentence = set.sentences.find((item) => item.id === button.dataset.sentenceId); const collocation = sentence.collocations.find((item) => item.id === button.dataset.collocationId);
      if (state.collocations[collocation.id]) { toast("这个搭配已经在复习本中。", "success"); return; }
      persist(toggleCollocation(state, collocation)); renderPractice(); toast("已收进复习本。", "success");
    }));
  }
  document.querySelector("#handwritten-photo")?.addEventListener("change", (event) => { const file = event.target.files[0]; const verdict = validateImageFile(file); if (!verdict.ok) { toast(verdict.message, "warn"); return; } pendingPhoto = { file, key: `photo-${set.id}`, url: URL.createObjectURL(file) }; renderPractice(); });
  document.querySelector("#remove-photo")?.addEventListener("click", async () => { if (pendingPhoto) { URL.revokeObjectURL(pendingPhoto.url); await deleteAttemptImage(pendingPhoto.key); pendingPhoto = null; renderPractice(); } });
}

function renderMistakes() {
  const groups = ["词汇", "搭配", "语法", "表达"].map((category) => ({ category, items: state.mistakes.filter((item) => item.category === category).sort((a, b) => b.count - a.count) }));
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">PERSONAL PATTERNS</p><h1>错误不是标签，<br />是下一次更稳的提醒。</h1></div><div class="big-count"><b>${state.mistakes.length}</b><span>待巩固要点</span></div></header><section class="view-intro"><p class="section-kicker">你的易错点</p><h2>把模糊处，练成自己的句子。</h2><p>每次提交后，未覆盖的评分要点会在这里累计。</p></section>${state.mistakes.length ? `<div class="mistake-grid">${groups.map((group) => `<section class="mistake-group"><div class="group-title"><span>${group.category}</span><b>${group.items.length}</b></div>${group.items.length ? group.items.map((item) => `<article class="mistake-card"><div><b>${escapeHtml(item.label)}</b><p>${escapeHtml(item.advice)}</p></div><span class="frequency">出现 ${item.count} 次</span></article>`).join("") : "<p class=quiet>这一类暂时没有记录。</p>"}</section>`).join("")}</div>` : emptyStateHtml("⌁", "还没有易错点", "完成一次今日训练后，这里会帮你整理值得回看的表达。", "开始今日训练", "practice")}`;
  const advice = getPracticeAdvice(state); if (advice.length) content.insertAdjacentHTML("beforeend", `<section class="practice-intro"><div class="source-chip">接下来怎么练</div><div><p class="section-kicker">针对你的薄弱点</p><h2>${advice.map((item) => `${item.category}：${item.text}`).join("<br>")}</h2></div></section>`);
}

function renderReview() {
  const items = Object.values(state.collocations).filter((item) => reviewFilter === "all" || reviewFilter === "mastered" ? item.mastered : !item.mastered);
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">YOUR PHRASEBOOK</p><h1>每个好表达，<br />都值得再遇见一次。</h1></div><div class="big-count"><b>${Object.keys(state.collocations).length}</b><span>已收藏表达</span></div></header><section class="view-intro review-head"><div><p class="section-kicker">我的复习本</p><h2>从看懂，到真正会用。</h2></div><div class="filter-group" role="group" aria-label="复习状态筛选"><button data-filter="pending" class="${reviewFilter === "pending" ? "active" : ""}">待复习</button><button data-filter="mastered" class="${reviewFilter === "mastered" ? "active" : ""}">已掌握</button><button data-filter="all" class="${reviewFilter === "all" ? "active" : ""}">全部</button></div></section>${items.length ? `<div class="phrase-list">${items.map((item) => `<article class="phrase-card"><div class="phrase-main"><span class="phrase-status ${item.mastered ? "mastered" : ""}">${item.mastered ? "已掌握" : "待复习"}</span><h3>${escapeHtml(item.expression)}</h3><p>${escapeHtml(item.meaning)}</p><blockquote>${escapeHtml(item.example)}</blockquote></div><button type="button" class="master-button ${item.mastered ? "active" : ""}" data-master-id="${item.id}">${item.mastered ? "✓ 已掌握" : "标记为已掌握"}</button></article>`).join("")}</div>` : emptyStateHtml("▱", reviewFilter === "mastered" ? "还没有标记已掌握的表达" : "复习本还是空的", reviewFilter === "mastered" ? "掌握一个搭配后，在这里为它盖个章。" : "完成训练后，点击固定搭配就能把它收进这里。", reviewFilter === "mastered" ? "查看待复习" : "开始今日训练", reviewFilter === "mastered" ? "review" : "practice")}`;
  document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => { reviewFilter = button.dataset.filter; renderReview(); }));
  document.querySelectorAll("[data-master-id]").forEach((button) => button.addEventListener("click", () => { persist(toggleMastered(state, button.dataset.masterId)); renderReview(); toast("复习状态已更新。", "success"); }));
}

function renderLibrary() {
  const cards = trainingSets.map((set) => `<article class="phrase-card"><div class="phrase-main"><span class="phrase-status ${set.kind === "past-paper" ? "mastered" : ""}">${set.kind === "past-paper" ? `${set.exam.year} 年 ${set.exam.month} 月 ${set.exam.paper} 真题` : set.kind === "prediction" ? "原创预测 · 非真题" : "同主题训练"}</span><h3>${escapeHtml(set.theme)}</h3><p>${escapeHtml(set.sourceLabel)}</p></div><button class="master-button" data-library-set="${set.id}">${hasSubmitted(set.id) ? "查看练习" : "开始练习"}</button></article>`).join("");
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">PAPER LIBRARY</p><h1>真题可核验，<br>加练随时开始。</h1></div></header><section class="view-intro"><div><p class="section-kicker">题库</p><h2>真题、训练与预测分开记录。</h2></div></section><div class="phrase-list">${cards}</div>`;
  document.querySelectorAll("[data-library-set]").forEach((button) => button.addEventListener("click", () => { selectedSetId = button.dataset.librarySet; activeView = "practice"; render(); }));
}

function renderReports() {
  const entries = Object.entries(state.submissions).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">MY REPORTS</p><h1>每一次练习，<br>都有迹可循。</h1></div><div class="big-count"><b>${entries.length}</b><span>已完成练习</span></div></header>${entries.length ? `<div class="phrase-list">${entries.map(([setId, entry]) => { const set = trainingSets.find((item) => item.id === setId); const percent = Math.round(entry.results.reduce((sum, item) => sum + item.coverage, 0) / entry.results.length); return `<article class="phrase-card"><div class="phrase-main"><span class="phrase-status">${escapeHtml(set?.sourceLabel || "历史练习")}</span><h3>${escapeHtml(set?.theme || setId)}</h3><p>我的答案：${escapeHtml(entry.answers.join(" / "))}</p><blockquote>要点覆盖率 ${percent}% · ${entry.imageKey ? "已附手写稿" : "文字作答"}</blockquote></div><button class="master-button" data-report-set="${setId}">查看解析</button></article>`; }).join("")}</div>` : emptyStateHtml("◫", "还没有练习报告", "完成一组训练后，你的答案、错误和建议都会沉淀在这里。", "开始今日训练", "practice")}`;
  document.querySelectorAll("[data-report-set]").forEach((button) => button.addEventListener("click", () => { selectedSetId = button.dataset.reportSet; activeView = "practice"; render(); }));
}

function emptyStateHtml(mark, title, copy, action, view) { return `<section class="empty-state"><span>${mark}</span><h2>${title}</h2><p>${copy}</p><button class="primary-button" type="button" data-empty-view="${view}">${action} <i>→</i></button></section>`; }
function bindNav() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { activeView = button.dataset.view; render(); }));
  document.querySelector("#reset-button").addEventListener("click", () => { if (window.confirm("确定要清空所有练习记录、易错点和复习本吗？此操作无法撤销。")) { window.localStorage.removeItem(STORAGE_KEY); state = loadLearningState(window.localStorage); selectedSetId = getTrainingSetForDate(today).id; activeView = "practice"; render(); toast("本地学习记录已重置。", "success"); } });
}
function render() { updateShell(); if (activeView === "practice") renderPractice(); else if (activeView === "mistakes") renderMistakes(); else if (activeView === "library") renderLibrary(); else if (activeView === "reports") renderReports(); else renderReview(); document.querySelectorAll("[data-empty-view]").forEach((button) => button.addEventListener("click", () => { activeView = button.dataset.emptyView; if (activeView === "review") reviewFilter = "pending"; render(); })); }
bindNav(); render();
