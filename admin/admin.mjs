const status = document.querySelector("#status");
const list = document.querySelector("#candidates");
const loginButton = document.querySelector("#login");
const logoutButton = document.querySelector("#logout");
const identity = window.netlifyIdentity;

const escapeHtml = (value) => String(value || "").replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
async function loadCandidates() {
  status.textContent = "正在读取待核验题目…";
  const response = await fetch("/.netlify/functions/review-candidate", { credentials: "same-origin" });
  if (response.status === 401) { status.textContent = "请以管理员账号登录。"; return; }
  if (response.status === 403) { status.textContent = "当前账号没有审核权限。请在 Netlify Identity 中为该账号设置 admin 角色后重新登录。"; return; }
  if (!response.ok) { status.textContent = "读取失败，请稍后重试。"; return; }
  const { candidates } = await response.json();
  status.textContent = candidates.length ? `有 ${candidates.length} 篇待核验题目。` : "当前没有待核验题目。";
  list.innerHTML = candidates.map((item) => `<article class="card" data-id="${escapeHtml(item.id)}"><div class="meta">${item.exam.year} 年 ${item.exam.month} 月 · ${escapeHtml(item.exam.paper)} · ${escapeHtml(item.createdAt)}</div><p class="source">${escapeHtml(item.sourceText)}</p><p><a href="${escapeHtml(item.exam.sourceUrl)}" target="_blank" rel="noreferrer">打开来源核对 ↗</a></p><div class="actions"><label><input type="checkbox" class="verified"> 我已核对年份、来源与全文</label><button class="publish" disabled>确认发布</button><button class="reject">拒绝</button><textarea class="reason" placeholder="拒绝原因（必填）"></textarea></div></article>`).join("");
  list.querySelectorAll(".card").forEach(bindCard);
}
async function decide(id, decision, sourceVerified, rejectionReason = "") {
  const response = await fetch("/.netlify/functions/review-candidate", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, decision, sourceVerified, rejectionReason }) });
  const body = await response.json(); if (!response.ok) throw new Error(body.error || "审核失败。");
}
function bindCard(card) { const verified = card.querySelector(".verified"), publish = card.querySelector(".publish"), reject = card.querySelector(".reject"), reason = card.querySelector(".reason"); verified.addEventListener("change", () => { publish.disabled = !verified.checked; }); publish.addEventListener("click", async () => { try { await decide(card.dataset.id, "publish", true); await loadCandidates(); } catch (error) { status.textContent = error.message; } }); reject.addEventListener("click", async () => { reason.classList.add("show"); if (!reason.value.trim()) { reason.focus(); return; } try { await decide(card.dataset.id, "reject", false, reason.value); await loadCandidates(); } catch (error) { status.textContent = error.message; } }); }
loginButton.addEventListener("click", () => identity.open()); logoutButton.addEventListener("click", () => identity.logout());
identity.on("login", () => { identity.close(); loginButton.hidden = true; logoutButton.hidden = false; loadCandidates(); });
identity.on("logout", () => { loginButton.hidden = false; logoutButton.hidden = true; list.innerHTML = ""; status.textContent = "已退出登录。"; });
identity.init(); if (identity.currentUser()) { loginButton.hidden = true; logoutButton.hidden = false; loadCandidates(); }
