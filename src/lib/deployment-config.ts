const requiredServerEnv = ["MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"] as const;

export type DeploymentStatus = {
  ok: boolean;
  runtime: {
    nodeEnv: string;
  };
  storage: {
    configured: boolean;
    endpoint: string;
    region: string;
    bucket: string;
    missing: string[];
  };
};

export function getDeploymentStatus(
  env: NodeJS.ProcessEnv = process.env
): DeploymentStatus {
  const missing = requiredServerEnv.filter((key) => !env[key]);

  return {
    ok: missing.length === 0,
    runtime: {
      nodeEnv: env.NODE_ENV ?? "development"
    },
    storage: {
      configured: missing.length === 0,
      endpoint: env.MINIO_ENDPOINT ?? "http://127.0.0.1:9000",
      region: env.MINIO_REGION ?? "us-east-1",
      bucket: env.MINIO_BUCKET ?? "annual-photo-album",
      missing
    }
  };
}
