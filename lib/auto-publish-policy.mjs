import { validatePassage } from "./passage-store.mjs";

const APPROVED_SOURCE_HOSTS = new Set(["www.wendu.com"]);

export function canAutoPublish(record) {
  if (record?.kind !== "past-paper" || !validatePassage(record).ok) return false;
  try { return APPROVED_SOURCE_HOSTS.has(new URL(record.exam.sourceUrl).hostname); } catch { return false; }
}
