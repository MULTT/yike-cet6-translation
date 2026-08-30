const DB_NAME = "yike-images-v1";
const STORE_NAME = "attempt-images";
const MAX_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file || !String(file.type || "").startsWith("image/")) return { ok: false, message: "请选择 JPG、PNG、WebP 等图片文件。" };
  if (file.size > MAX_BYTES) return { ok: false, message: "图片不能超过 8MB，请压缩或重新拍摄。" };
  return { ok: true };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = operation(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function saveAttemptImage(attemptId, file) { try { await transaction("readwrite", (store) => store.put({ blob: file, type: file.type, savedAt: Date.now() }, attemptId)); return { ok: true, imageKey: attemptId }; } catch { return { ok: false, message: "照片无法保存在当前浏览器中。" }; } }
export async function getAttemptImage(attemptId) { try { return { ok: true, value: await transaction("readonly", (store) => store.get(attemptId)) }; } catch { return { ok: false, value: null }; } }
export async function deleteAttemptImage(attemptId) { try { await transaction("readwrite", (store) => store.delete(attemptId)); return { ok: true }; } catch { return { ok: false }; } }
export async function clearAttemptImages() { try { await transaction("readwrite", (store) => store.clear()); return { ok: true }; } catch { return { ok: false }; } }
