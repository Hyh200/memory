import assert from "node:assert/strict";
import test from "node:test";
import {
  clampProgress,
  createUploadQueueSummary
} from "../src/lib/upload-queue";

test("createUploadQueueSummary counts processed, active, and error items", () => {
  const summary = createUploadQueueSummary([
    { status: "processed", progress: 100 },
    { status: "processing", progress: 44 },
    { status: "ready", progress: 5 },
    { status: "error", progress: 18 }
  ]);

  assert.deepEqual(summary, {
    total: 4,
    processed: 1,
    active: 2,
    error: 1,
    averageProgress: 42,
    isBusy: true
  });
});

test("clampProgress keeps progress values display-safe", () => {
  assert.equal(clampProgress(-10), 0);
  assert.equal(clampProgress(43.6), 44);
  assert.equal(clampProgress(120), 100);
  assert.equal(clampProgress(Number.NaN), 0);
});
