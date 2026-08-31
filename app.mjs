import {
  getTrainingSetForDate, gradeSentence, loadLearningState, recordSubmission, saveLearningState,
  STORAGE_KEY, toggleCollocation, toggleMastered, trainingSets, getExtraPractice, getPracticeAdvice, isVerifiedPastPaper,
  canSubmitPassage, fullPassageSets, getExtraPassagePractice, getPassageForDate, gradePassage,
} from "./core.mjs";
import { deleteAttemptImage, saveAttemptImage, validateImageFile } from "./image-store.mjs";
import { buildUserPaperFormData, formatOcrProgress, validateUserPaperUpload } from "./lib/user-paper-upload.mjs";

const content = document.querySelector("#app-content");
const today = new Date();
const dateKey = today.toISOString().slice(0, 10);
let state = loadLearningState(window.localStorage);
let activeView = "practice";
let selectedSetId = getPassageForDate(today).id;
let reviewFilter = "pending";
let pendingPhoto = null;
let pendingUserPaper = null;
let userPapers = [];
let userPapersLoaded = false;
let userPapersError = "";

function currentSet() { return fullPassageSets.find((set) => set.id === selectedSetId) || getPassageForDate(today); }
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
function answersFor(setId) { return state.submissions[setId]?.answer ?? ""; }
function hasSubmitted(setId) { return Boolean(state.submissions[setId]); }

function renderPractice() {
  const set = currentSet(); const submitted = hasSubmitted(set.id); const answer = answersFor(set.id); const submission = state.submissions[set.id];
  const examMeta = isVerifiedPastPaper(set) ? `<a class="source-chip" href="${set.exam.sourceUrl}" target="_blank" rel="noreferrer">真题 · ${set.exam.year} 年 ${set.exam.month} 月 ${escapeHtml(set.exam.paper)} · 查看来源 ↗</a>` : `<div class="source-chip">原创预测 · 非真题</div>`;
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">${dayLabel()} · DAILY PRACTICE</p><h1>今天，完整译完一篇。</h1></div><button type="button" class="day-picker" id="set-picker">题库 <span>⌄</span></button></header>
  <div class="picker-panel" id="picker-panel" hidden>${fullPassageSets.map((item, index) => `<button type="button" data-set-id="${item.id}" class="${item.id === set.id ? "selected" : ""}"><small>第 ${String(index + 1).padStart(2, "0")} 篇 · ${item.kind === "past-paper" ? "可核验真题" : "原创预测"}</small>${escapeHtml(item.theme)}${hasSubmitted(item.id) ? "<b>已完成</b>" : ""}</button>`).join("")}</div>
  <section class="practice-intro">${examMeta}<div><p class="section-kicker">今日整篇翻译</p><h2>${escapeHtml(set.theme)}</h2></div><p>提交前只显示中文全文；完成后展开参考译文与逐句报告。</p></section>
  <section class="sentence-card"><div class="sentence-index">全文</div><div class="sentence-main"><p class="chinese-sentence">${escapeHtml(set.sourceText)}</p></div></section>
  <section class="photo-box"><div><p class="section-kicker">手写稿（可选）</p><b>拍照留档后，请把完整英文补录到下方。</b><small>照片只保存在当前浏览器，支持图片且不超过 8MB。</small></div><label class="photo-upload" for="handwritten-photo">＋ 上传或拍照<input id="handwritten-photo" type="file" accept="image/*" capture="environment" hidden></label><div id="photo-preview">${pendingPhoto ? `<img src="${pendingPhoto.url}" alt="手写译文预览"><button type="button" id="remove-photo">删除照片</button>` : ""}</div></section>
  <form id="practice-form" novalidate><section class="sentence-card"><div class="sentence-index">EN</div><div class="sentence-main"><label for="passage-answer">你的完整英文译文 <span>建议按原文逻辑分段并使用句末标点</span></label><textarea id="passage-answer" rows="12" placeholder="在这里补录整篇英文译文…" ${submitted ? "readonly" : ""}>${escapeHtml(answer)}</textarea><div class="word-row"><span class="input-error" id="input-error"></span><span><b id="word-count">${answer ? answer.split(/\s+/).length : 0}</b> words</span></div></div></section>
  ${submitted ? `<section class="feedback"><div class="feedback-head"><span>整篇总览</span><strong>${submission.coverage}% <em>要点覆盖率</em></strong></div><div class="reference"><p>参考译文（学习版）</p><blockquote>${escapeHtml(set.referenceText)}</blockquote></div><p class="local-note">${submission.alignment === "exact" ? "已按你的英文句末标点逐句对齐。" : "你的分句与原文单元未完全对应，以下按整篇译文给出逐句提示。"}</p>${set.sentences.map((sentence, index) => `<article class="sentence-card"><div class="sentence-index">0${index + 1}</div><div class="sentence-main"><p class="chinese-sentence">${escapeHtml(sentence.sourceText)}</p>${feedbackHtml(sentence, submission.results[index])}</div></article>`).join("")}</section><div class="completed-row"><span>✓</span><div><b>整篇练习已完成</b><p>答案、易错点与搭配已收进本地报告。</p></div><button class="secondary-button" type="button" id="review-now">去复习本</button></div>` : `<div class="submit-row"><p><span>提示</span>照片不能代替英文补录；提交后才能看参考译文。</p><button class="primary-button" type="submit">提交并查看整篇报告 <span>→</span></button></div>`}</form>`;
  bindPracticeEvents(set, submitted);
}

function feedbackHtml(sentence, result) {
  const matched = result.matched.length ? result.matched.map((item) => `<li><span>✓</span>${escapeHtml(item.label)}</li>`).join("") : "<li class=muted>本地规则尚未识别到已覆盖的要点。</li>";
  const missed = result.missed.length ? result.missed.map((item) => `<li><span>!</span><div><b>${escapeHtml(item.label)}</b><p>${escapeHtml(item.advice)}</p></div></li>`).join("") : "<li class=success-line><span>✓</span>这一句的核心要点都已覆盖。</li>";
  const notices = result.notices.map((notice) => `<p class="notice">⌁ ${escapeHtml(notice)}</p>`).join("");
  return `<section class="feedback"><div class="feedback-head"><span>逐句解析</span><strong>${result.coverage}% <em>要点覆盖率</em></strong></div><div class="reference"><p>本句参考译文</p><blockquote>${escapeHtml(sentence.referenceText || sentence.reference)}</blockquote></div><div class="feedback-grid"><div><h4>已覆盖的要点</h4><ul class="matched-list">${matched}</ul></div><div><h4>建议留意</h4><ul class="missed-list">${missed}</ul></div></div>${notices}<div class="collocation-area"><h4>本句固定搭配</h4><div class="collocation-chips">${sentence.collocations.map((item) => { const saved = state.collocations[item.id]; return `<button type="button" class="collocation-chip ${saved ? "saved" : ""}" data-collocation-id="${item.id}" data-sentence-id="${sentence.id}" title="${escapeHtml(item.meaning)}：${escapeHtml(item.example)}">${saved ? "✓ " : "+ "}${escapeHtml(item.expression)}</button>`; }).join("")}</div><p>点击收藏到复习本；悬停可看含义和例句。</p></div><p class="local-note">本地规则会检查核心表达，但无法识别所有合理的同义改写；请结合参考译文判断。</p></section>`;
}

function bindPracticeEvents(set, submitted) {
  document.querySelector("#set-picker").addEventListener("click", () => { const panel = document.querySelector("#picker-panel"); panel.hidden = !panel.hidden; });
  document.querySelectorAll("[data-set-id]").forEach((button) => button.addEventListener("click", () => { selectedSetId = button.dataset.setId; render(); }));
  if (!submitted) {
    document.querySelector("#passage-answer").addEventListener("input", (event) => { const words = event.target.value.trim() ? event.target.value.trim().split(/\s+/).length : 0; document.querySelector("#word-count").textContent = words; document.querySelector("#input-error").textContent = ""; });
    document.querySelector("#practice-form").addEventListener("submit", (event) => {
      event.preventDefault(); const answer = document.querySelector("#passage-answer").value.trim();
      if (!canSubmitPassage(answer)) { document.querySelector("#input-error").textContent = "请先补录完整英文译文。"; document.querySelector("#passage-answer").focus(); toast("补录完整英文后，才能查看解析。", "warn"); return; }
      const report = gradePassage(set, answer);
      persist(recordSubmission(state, { setId: set.id, date: dateKey, answer, ...report, imageKey: pendingPhoto?.key || null }));
      if (pendingPhoto?.file) saveAttemptImage(pendingPhoto.key, pendingPhoto.file);
      render(); toast("整篇练习已收下，报告已展开。", "success");
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
  const cards = fullPassageSets.map((set) => `<article class="phrase-card"><div class="phrase-main"><span class="phrase-status ${set.kind === "past-paper" ? "mastered" : ""}">${set.kind === "past-paper" ? `${set.exam.year} 年 ${set.exam.month} 月 ${set.exam.paper} 真题` : "原创预测 · 非真题"}</span><h3>${escapeHtml(set.theme)}</h3><p>${escapeHtml(set.sourceLabel)} · 整篇翻译</p></div><button class="master-button" data-library-set="${set.id}">${hasSubmitted(set.id) ? "查看报告" : "开始练习"}</button></article>`).join("");
  const uploadedCards = userPapers.length ? userPapers.map((paper) => `<article class="uploaded-paper-card"><a class="uploaded-image-link" href="${userPaperImageUrl(paper)}" target="_blank" rel="noreferrer"><img src="${userPaperImageUrl(paper)}" alt="${paper.year} 年 ${paper.month} 月上传题图"><span>查看原图 ↗</span></a><div><span class="phrase-status">用户上传题目 · ${paper.year} 年 ${paper.month} 月</span><h3>${paper.ocrText ? "已识别并校对的题目" : "题图已保存，待补录文字"}</h3><p>${paper.ocrText ? escapeHtml(paper.ocrText) : "目前仅保存题图；查看原图可直接阅读题目。"}</p></div></article>`).join("") : `<p class="quiet">${userPapersError || "还没有上传题目。可从“上传题目”添加自己的历年题图。"}</p>`;
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">PAPER LIBRARY</p><h1>真题可核验，<br>加练随时开始。</h1></div></header><section class="view-intro"><div><p class="section-kicker">题库</p><h2>真题、训练与预测分开记录。</h2></div></section><div class="phrase-list">${cards}</div><section class="uploaded-library"><div class="section-heading"><div><p class="section-kicker">共享上传题库</p><h2>你补充的题图与识别文字。</h2></div><button class="secondary-button" type="button" data-empty-view="upload">上传题目</button></div><p class="local-note">这里的上传题会在题库中公开展示，请勿上传私人信息。</p><div class="uploaded-paper-list">${userPapersLoaded ? uploadedCards : "<p class=quiet>正在读取已上传的题目…</p>"}</div></section>`;
  document.querySelectorAll("[data-library-set]").forEach((button) => button.addEventListener("click", () => { selectedSetId = button.dataset.librarySet; activeView = "practice"; render(); }));
  if (!userPapersLoaded) loadUserPapers();
}

function userPaperImageUrl(paper) { return `/.netlify/functions/user-papers?image=${encodeURIComponent(paper.id)}`; }

async function loadUserPapers() {
  try {
    const response = await fetch("/.netlify/functions/user-papers");
    if (!response.ok) throw new Error("读取失败");
    const result = await response.json();
    userPapers = Array.isArray(result.papers) ? result.papers : [];
    userPapersError = "";
  } catch {
    userPapersError = "已上传题目暂时无法读取，请稍后再试。";
  } finally {
    userPapersLoaded = true;
    if (activeView === "library") renderLibrary();
  }
}

function renderUpload() {
  const currentYear = today.getFullYear();
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">LOCAL OCR · UPLOAD</p><h1>把你的题图，<br>放进上传题库。</h1></div></header><section class="view-intro"><div><p class="section-kicker">上传题目</p><h2>只填年份、月份，上传图片即可。</h2></div><p>文字识别在浏览器中完成；首次会联网下载开源识别模型，题图不会发送给 OCR 服务。</p></section><form id="user-paper-form" class="upload-form" novalidate><div class="upload-meta"><label>年份<input id="user-paper-year" type="number" inputmode="numeric" min="2000" max="${currentYear}" value="${currentYear}" required></label><label>月份<select id="user-paper-month" required><option value="6">6 月</option><option value="12">12 月</option></select></label></div><section class="photo-box upload-photo-box"><div><p class="section-kicker">题目图片</p><b>拍照或选择一张翻译真题图片。</b><small>支持常见图片格式，最大 8MB；题图将公开保存到在线题库。</small></div><label class="photo-upload" for="user-paper-image">＋ 上传或拍照<input id="user-paper-image" type="file" accept="image/*" capture="environment" hidden></label><div id="user-paper-preview" class="user-paper-preview">${pendingUserPaper ? `<img src="${pendingUserPaper.url}" alt="待上传题图">` : ""}</div></section><p id="user-paper-error" class="input-error"></p><section class="ocr-panel"><div><p class="section-kicker">本地 OCR</p><h2>先识别，再手动校对。</h2><p id="ocr-status" class="quiet">选择题图后即可开始识别。</p></div><button id="run-ocr" class="secondary-button" type="button" ${pendingUserPaper ? "" : "disabled"}>识别图片文字</button></section><label class="ocr-text-label" for="ocr-text">识别出的文字（可编辑）<textarea id="ocr-text" rows="10" placeholder="识别结果会出现在这里；也可以手动补录题目文字。"></textarea></label><div class="submit-row"><p><span>提示</span>只要求年份、月份和题图；OCR 文字可以稍后再补。</p><button class="primary-button" type="submit">保存到上传题库 <span>→</span></button></div></form>`;
  bindUploadEvents();
}

function bindUploadEvents() {
  const form = document.querySelector("#user-paper-form");
  const imageInput = document.querySelector("#user-paper-image");
  const ocrButton = document.querySelector("#run-ocr");
  const error = document.querySelector("#user-paper-error");
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    const verdict = validateUserPaperUpload({ year: document.querySelector("#user-paper-year").value, month: document.querySelector("#user-paper-month").value, image: file });
    if (!file || !verdict.ok) { error.textContent = verdict.message; return; }
    if (file.size > 8 * 1024 * 1024) { error.textContent = "图片不能超过 8MB。"; return; }
    if (pendingUserPaper?.url) URL.revokeObjectURL(pendingUserPaper.url);
    pendingUserPaper = { file, url: URL.createObjectURL(file) };
    document.querySelector("#user-paper-preview").innerHTML = `<img src="${pendingUserPaper.url}" alt="待上传题图">`;
    ocrButton.disabled = false;
    error.textContent = "";
  });
  ocrButton.addEventListener("click", async () => {
    if (!pendingUserPaper) return;
    if (!window.Tesseract?.createWorker) { error.textContent = "本地识别组件尚未加载，请刷新后重试。"; return; }
    const status = document.querySelector("#ocr-status");
    ocrButton.disabled = true;
    try {
      const worker = await window.Tesseract.createWorker("chi_sim+eng", 1, { workerPath: "/vendor/worker.min.js", logger: ({ status: stage, progress }) => { status.textContent = typeof progress === "number" ? `正在${stage}：${formatOcrProgress(progress)}` : `正在${stage}…`; } });
      const result = await worker.recognize(pendingUserPaper.file);
      document.querySelector("#ocr-text").value = result.data.text.trim();
      await worker.terminate();
      status.textContent = "识别完成，请先校对文字再保存。";
    } catch {
      status.textContent = "识别未完成。你仍可手动补录文字后保存题图。";
    } finally {
      ocrButton.disabled = false;
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const year = document.querySelector("#user-paper-year").value;
    const month = document.querySelector("#user-paper-month").value;
    const verdict = validateUserPaperUpload({ year, month, image: pendingUserPaper?.file });
    if (!verdict.ok) { error.textContent = verdict.message; return; }
    const submitButton = form.querySelector("[type=submit]");
    submitButton.disabled = true;
    try {
      const response = await fetch("/.netlify/functions/user-papers", { method: "POST", body: buildUserPaperFormData({ year, month, image: pendingUserPaper.file, ocrText: document.querySelector("#ocr-text").value }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败");
      userPapers = [result.paper, ...userPapers];
      userPapersLoaded = true;
      URL.revokeObjectURL(pendingUserPaper.url);
      pendingUserPaper = null;
      activeView = "library";
      render();
      toast("题图和识别文字已保存到题库。", "success");
    } catch (saveError) {
      error.textContent = saveError.message || "保存失败，请稍后重试。";
      submitButton.disabled = false;
    }
  });
}

function renderReports() {
  const entries = Object.entries(state.submissions).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  content.innerHTML = `<header class="topbar"><div><p class="eyebrow">MY REPORTS</p><h1>每一次练习，<br>都有迹可循。</h1></div><div class="big-count"><b>${entries.length}</b><span>已完成练习</span></div></header>${entries.length ? `<div class="phrase-list">${entries.map(([setId, entry]) => { const set = fullPassageSets.find((item) => item.id === setId); const percent = entry.coverage ?? Math.round((entry.results || []).reduce((sum, item) => sum + item.coverage, 0) / Math.max((entry.results || []).length, 1)); const text = entry.answer || (entry.answers || []).join(" / "); return `<article class="phrase-card"><div class="phrase-main"><span class="phrase-status">${escapeHtml(set?.sourceLabel || "历史两句练习")}</span><h3>${escapeHtml(set?.theme || setId)}</h3><p>我的答案：${escapeHtml(text)}</p><blockquote>要点覆盖率 ${percent}% · ${entry.imageKey ? "已附手写稿" : "文字作答"}</blockquote></div>${set ? `<button class="master-button" data-report-set="${setId}">查看解析</button>` : "<span class=phrase-status>旧记录保留</span>"}</article>`; }).join("")}</div>` : emptyStateHtml("◫", "还没有练习报告", "完成一组训练后，你的答案、错误和建议都会沉淀在这里。", "开始今日训练", "practice")}`;
  document.querySelectorAll("[data-report-set]").forEach((button) => button.addEventListener("click", () => { selectedSetId = button.dataset.reportSet; activeView = "practice"; render(); }));
}

function emptyStateHtml(mark, title, copy, action, view) { return `<section class="empty-state"><span>${mark}</span><h2>${title}</h2><p>${copy}</p><button class="primary-button" type="button" data-empty-view="${view}">${action} <i>→</i></button></section>`; }
function bindNav() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { activeView = button.dataset.view; render(); }));
  document.querySelector("#reset-button").addEventListener("click", () => { if (window.confirm("确定要清空所有练习记录、易错点和复习本吗？此操作无法撤销。")) { window.localStorage.removeItem(STORAGE_KEY); state = loadLearningState(window.localStorage); selectedSetId = getPassageForDate(today).id; activeView = "practice"; render(); toast("本地学习记录已重置。", "success"); } });
}
function render() { updateShell(); if (activeView === "practice") renderPractice(); else if (activeView === "mistakes") renderMistakes(); else if (activeView === "library") renderLibrary(); else if (activeView === "reports") renderReports(); else if (activeView === "upload") renderUpload(); else renderReview(); document.querySelectorAll("[data-empty-view]").forEach((button) => button.addEventListener("click", () => { activeView = button.dataset.emptyView; if (activeView === "review") reviewFilter = "pending"; render(); })); }
bindNav(); render();
