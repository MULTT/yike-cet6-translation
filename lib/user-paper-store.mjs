import { randomUUID } from "node:crypto";

const USER_PAPER_KEY_PREFIX = "user-paper:";

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

const isFourDigitYear = (value) => Number.isInteger(value) && value >= 1000 && value <= 9999;

function copy(value) {
  return structuredClone(value);
}

function userPaperKey(id) {
  return `${USER_PAPER_KEY_PREFIX}${id}`;
}

function asRecord(entry) {
  if (entry && typeof entry === "object" && entry.value && typeof entry.value === "object") {
    return entry.value;
  }
  return entry;
}

/** Checks the minimum metadata required for a user-uploaded paper image. */
export function validateUserPaper(input) {
  const errors = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["A user paper must be an object."] };
  }

  if (!isFourDigitYear(input.year)) {
    errors.push("A user paper must include a four-digit year.");
  }
  if (input.month !== 6 && input.month !== 12) {
    errors.push("A user paper month must be 6 or 12.");
  }
  if (!hasText(input.imageKey)) {
    errors.push("A user paper must include an image key.");
  }
  if (input.kind !== undefined && input.kind !== "user-upload") {
    errors.push("A user paper must be a user upload.");
  }
  if (Object.hasOwn(input, "sourceVerified") || Object.hasOwn(input, "verified")) {
    errors.push("A user upload cannot include verification fields.");
  }

  return { ok: errors.length === 0, errors };
}

/** Creates a ready-to-save user upload record without any verification claim. */
export function createUserPaper(input) {
  const validation = validateUserPaper(input);
  if (!validation.ok) {
    throw new TypeError(`Cannot create an invalid user paper: ${validation.errors.join(" ")}`);
  }

  return {
    id: randomUUID(),
    kind: "user-upload",
    status: "ready",
    year: input.year,
    month: input.month,
    imageKey: input.imageKey.trim(),
    ocrText: typeof input.ocrText === "string" ? input.ocrText.trim() : "",
    createdAt: new Date().toISOString(),
  };
}

/** Persists a valid user-upload record in its dedicated key namespace. */
export async function saveUserPaper(store, paper) {
  if (!store || typeof store.set !== "function") {
    throw new TypeError("The user paper store must provide a set method.");
  }
  if (!hasText(paper?.id)) {
    throw new TypeError("A user paper must include an id.");
  }
  if (paper.status !== "ready") {
    throw new TypeError("A user paper must be ready to save.");
  }

  const validation = validateUserPaper(paper);
  if (!validation.ok) {
    throw new TypeError(`Cannot save an invalid user paper: ${validation.errors.join(" ")}`);
  }

  const stored = copy(paper);
  await store.set(userPaperKey(stored.id), stored);
  return copy(stored);
}

/** Lists only records stored in the user-upload namespace. */
export async function listUserPapers(store) {
  if (!store || typeof store.list !== "function") {
    throw new TypeError("The user paper store must provide a list method.");
  }

  const entries = await store.list(USER_PAPER_KEY_PREFIX);
  if (!Array.isArray(entries)) {
    throw new TypeError("The user paper store must list an array of records.");
  }

  return entries
    .map(asRecord)
    .filter((paper) => paper && typeof paper === "object" && paper.kind === "user-upload")
    .map(copy);
}
