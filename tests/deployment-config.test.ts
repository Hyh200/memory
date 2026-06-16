import assert from "node:assert/strict";
import test from "node:test";
import { getDeploymentStatus } from "../src/lib/deployment-config";

test("deployment status reports missing server secrets without exposing values", () => {
  const status = getDeploymentStatus({
    NODE_ENV: "production",
    MINIO_ENDPOINT: "http://minio:9000"
  });

  assert.equal(status.ok, false);
  assert.equal(status.storage.configured, false);
  assert.deepEqual(status.storage.missing, [
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY"
  ]);
  assert.equal(JSON.stringify(status).includes("secret-value"), false);
});

test("deployment status passes when required MinIO credentials are present", () => {
  const status = getDeploymentStatus({
    NODE_ENV: "production",
    MINIO_ENDPOINT: "http://minio:9000",
    MINIO_REGION: "us-east-1",
    MINIO_BUCKET: "annual-photo-album",
    MINIO_ACCESS_KEY: "album-prod-user",
    MINIO_SECRET_KEY: "album-prod-password"
  });

  assert.equal(status.ok, true);
  assert.equal(status.storage.configured, true);
  assert.equal(status.storage.endpoint, "http://minio:9000");
  assert.equal(status.storage.bucket, "annual-photo-album");
  assert.deepEqual(status.storage.missing, []);
  assert.equal(JSON.stringify(status).includes("album-prod-password"), false);
});
