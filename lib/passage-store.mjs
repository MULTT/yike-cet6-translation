import { createHash } from "node:crypto";

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function sentenceForReview(sentence, answer) {
  return {
    order: sentence.order,
    sourceText: sentence.sourceText.trim(),
    referenceText: sentence.referenceText.trim(),
    answer,
  };
}

function splitEnglishSentences(answer) {
  const terminalSentences = answer.match(/[^.!?]+[.!?]+(?:["')\]]*)/g) ?? [];
  const sentences = terminalSentences.map((sentence) => sentence.trim()).filter(Boolean);
  const reconstructed = sentences.join(" ").replace(/\s+/g, " ").trim();
  const normalized = answer.replace(/\s+/g, " ").trim();

  return reconstructed === normalized ? sentences : [];
}

/**
 * Checks that a passage has the metadata and ordered source sentences needed
 * to present a full-passage review.
 */
export function validatePassage(record) {
  const errors = [];

  if (!isPlainObject(record)) {
    return { ok: false, errors: ["A passage must be an object."] };
  }

  if (record.kind !== "past-paper" && record.kind !== "prediction") {
    errors.push("A passage kind must be past-paper or prediction.");
  }

  if (!hasText(record.sourceText)) {
    errors.push("A passage must include complete source text.");
  }

  if (!hasText(record.referenceText)) {
    errors.push("A passage must include complete reference text.");
  }

  if (!Array.isArray(record.sentences)) {
    errors.push("A passage must include source sentences.");
  } else {
    if (record.kind === "past-paper" && record.sentences.length < 2) {
      errors.push("A past paper must include at least two source sentences.");
    }

    record.sentences.forEach((sentence, index) => {
      if (!isPlainObject(sentence)) {
        errors.push(`Sentence ${index + 1} must be an object.`);
        return;
      }
      if (sentence.order !== index + 1) {
        errors.push("Source sentences must use consecutive display order.");
      }
      if (!hasText(sentence.sourceText)) {
        errors.push(`Sentence ${index + 1} must include source text.`);
      }
      if (!hasText(sentence.referenceText)) {
        errors.push(`Sentence ${index + 1} must include reference text.`);
      }
    });
  }

  if (record.kind === "past-paper") {
    const exam = record.exam;
    if (!isPlainObject(exam)) {
      errors.push("A past paper must include exam metadata.");
    } else {
      if (!Number.isInteger(exam.year) || exam.year < 1900) {
        errors.push("A past paper must include an exam year.");
      }
      if (!hasText(String(exam.month ?? ""))) {
        errors.push("A past paper must include an exam month.");
      }
      if (!hasText(exam.paper)) {
        errors.push("A past paper must include an exam paper.");
      }
      if (!hasText(exam.sourceUrl)) {
        errors.push("A past paper must include a source URL.");
      } else {
        try {
          const url = new URL(exam.sourceUrl);
          if (url.protocol !== "https:" && url.protocol !== "http:") {
            errors.push("A past paper source URL must be an HTTP URL.");
          }
        } catch {
          errors.push("A past paper source URL must be valid.");
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Creates a deterministic identity from the source and exam details, without
 * depending on mutable review state such as an id or publication status.
 */
export function createFingerprint(record) {
  const canonicalRecord = {
    kind: record?.kind ?? "",
    exam: {
      year: record?.exam?.year ?? "",
      month: record?.exam?.month ?? "",
      paper: record?.exam?.paper ?? "",
      sourceUrl: record?.exam?.sourceUrl ?? "",
    },
    sourceText: record?.sourceText ?? "",
    sentences: Array.isArray(record?.sentences)
      ? record.sentences.map((sentence) => ({
          order: sentence?.order ?? "",
          sourceText: sentence?.sourceText ?? "",
          referenceText: sentence?.referenceText ?? "",
        }))
      : [],
  };

  return createHash("sha256").update(JSON.stringify(canonicalRecord)).digest("hex");
}

/**
 * Aligns terminal-punctuation-delimited English sentences with the ordered
 * source sentences. Ambiguous input is retained as one complete answer.
 */
export function splitPassageForReview(record, answer) {
  const validation = validatePassage(record);
  if (!validation.ok) {
    throw new TypeError(`Cannot review an invalid passage: ${validation.errors.join(" ")}`);
  }

  const completeAnswer = typeof answer === "string" ? answer.trim() : "";
  const answers = splitEnglishSentences(completeAnswer);

  if (answers.length !== record.sentences.length) {
    return {
      alignment: "approximate",
      answer: completeAnswer,
      answers: [completeAnswer],
      sentences: record.sentences.map((sentence) => sentenceForReview(sentence, completeAnswer)),
    };
  }

  return {
    alignment: "exact",
    answer: completeAnswer,
    answers,
    sentences: record.sentences.map((sentence, index) => sentenceForReview(sentence, answers[index])),
  };
}
