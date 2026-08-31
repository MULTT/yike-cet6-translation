const VALID_MONTHS = new Set(["6", "12"]);

export function validateUserPaperUpload({ year, month, image }) {
  const normalizedYear = String(year ?? "").trim();
  const normalizedMonth = String(month ?? "").trim();
  if (!/^20\d{2}$/.test(normalizedYear)) return { ok: false, message: "请填写四位年份。" };
  if (!VALID_MONTHS.has(normalizedMonth)) return { ok: false, message: "月份请选择 6 月或 12 月。" };
  if (!image?.type?.startsWith("image/")) return { ok: false, message: "请先选择一张题目图片。" };
  return { ok: true };
}

export function buildUserPaperFormData({ year, month, image, ocrText = "" }) {
  const formData = new FormData();
  formData.append("year", String(year).trim());
  formData.append("month", String(month).trim());
  formData.append("image", image, image.name || "paper-image");
  formData.append("ocrText", String(ocrText).trim());
  return formData;
}

export function formatOcrProgress(progress) {
  const bounded = Math.min(1, Math.max(0, Number(progress) || 0));
  return `${Math.round(bounded * 100)}%`;
}
