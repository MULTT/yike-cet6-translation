import { getStore } from "@netlify/blobs";

const STORE_NAME = "cet6-passage-library";

/**
 * Adapts Netlify Blobs to the small async store interface used by the domain
 * service. Only question-bank records are stored here; learner records remain
 * in browser storage.
 */
export function createPassageBlobStore() {
  const blobs = getStore({ name: STORE_NAME, consistency: "strong" });

  return {
    async get(key) {
      return blobs.get(key, { type: "json", consistency: "strong" });
    },
    async set(key, value) {
      await blobs.setJSON(key, value);
    },
    async list(prefix = "") {
      const { blobs: entries } = await blobs.list({ prefix });
      return Promise.all(entries.map(async ({ key }) => ({
        key,
        value: await blobs.get(key, { type: "json", consistency: "strong" }),
      })));
    },
  };
}

export const candidateKey = (id) => `review-candidate:${id}`;
