import { createFingerprint, validatePassage } from "./passage-store.mjs";

const CANDIDATE_KEY_PREFIX = "review-candidate:";

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

function candidateKey(id) {
  return `${CANDIDATE_KEY_PREFIX}${id}`;
}

function copy(value) {
  return structuredClone(value);
}

function asRecord(entry) {
  if (entry && typeof entry === "object" && entry.value && typeof entry.value === "object") {
    return entry.value;
  }
  return entry;
}

async function listCandidates(store) {
  const entries = await store.list();
  if (!Array.isArray(entries)) {
    throw new TypeError("The review store must list an array of records.");
  }

  return entries
    .map(asRecord)
    .filter((record) => record && typeof record === "object" && hasText(record.id));
}

function assertStore(store) {
  if (!store || typeof store.get !== "function" || typeof store.set !== "function" || typeof store.list !== "function") {
    throw new TypeError("The review store must provide get, set, and list methods.");
  }
}

function assertPassageId(passage) {
  if (!hasText(passage?.id)) {
    throw new TypeError("A candidate must include an id.");
  }
}

/** Returns only entries that have completed verified publication. */
export async function listPublishedPassages(store) {
  assertStore(store);
  const candidates = await listCandidates(store);
  return candidates.filter((candidate) => candidate.status === "published").map(copy);
}

/** Validates and persists a new pending candidate unless its source fingerprint exists. */
export async function queueCandidate(store, passage) {
  assertStore(store);
  assertPassageId(passage);

  const validation = validatePassage(passage);
  if (!validation.ok) {
    throw new TypeError(`Cannot queue an invalid passage: ${validation.errors.join(" ")}`);
  }

  const fingerprint = createFingerprint(passage);
  const candidates = await listCandidates(store);
  if (candidates.some((candidate) => candidate.fingerprint === fingerprint)) {
    throw new Error("Duplicate candidate: this source-aware fingerprint is already queued.");
  }

  const now = new Date().toISOString();
  const candidate = {
    ...copy(passage),
    status: "pending",
    fingerprint,
    sourceVerified: passage.sourceVerified === true,
    createdAt: now,
  };
  await store.set(candidateKey(candidate.id), candidate);
  return copy(candidate);
}

/** Applies the one permitted review transition to a pending candidate. */
export async function reviewCandidate(store, id, decision, reviewer) {
  assertStore(store);
  if (!hasText(id)) {
    throw new TypeError("A candidate id is required.");
  }
  if (decision !== "publish" && decision !== "reject") {
    throw new TypeError("A review decision must be publish or reject.");
  }
  if (!hasText(reviewer)) {
    throw new TypeError("A reviewer identity is required.");
  }

  const candidate = await store.get(candidateKey(id));
  if (!candidate) {
    throw new Error("Candidate not found.");
  }
  if (candidate.status !== "pending") {
    throw new Error("Only pending candidates can be reviewed.");
  }
  if (decision === "publish" && candidate.sourceVerified !== true) {
    throw new Error("A candidate must be source verified before publication.");
  }

  const reviewedAt = new Date().toISOString();
  const reviewed = {
    ...copy(candidate),
    status: decision === "publish" ? "published" : "rejected",
    decision,
    reviewer: reviewer.trim(),
    reviewedAt,
    ...(decision === "publish" ? { publishedAt: reviewedAt } : { rejectedAt: reviewedAt }),
  };
  await store.set(candidateKey(id), reviewed);
  return copy(reviewed);
}
