export type UploadQueueStatus =
  | "ready"
  | "processing"
  | "processed"
  | "error";

export type UploadQueueItem = {
  status: UploadQueueStatus;
  progress: number;
};

export type UploadQueueSummary = {
  total: number;
  processed: number;
  active: number;
  error: number;
  averageProgress: number;
  isBusy: boolean;
};

export function createUploadQueueSummary(
  items: UploadQueueItem[]
): UploadQueueSummary {
  const total = items.length;
  const processed = items.filter((item) => item.status === "processed").length;
  const error = items.filter((item) => item.status === "error").length;
  const active = items.filter(
    (item) => item.status === "ready" || item.status === "processing"
  ).length;
  const progressSum = items.reduce(
    (sum, item) => sum + clampProgress(item.progress),
    0
  );

  return {
    total,
    processed,
    active,
    error,
    averageProgress: total === 0 ? 0 : Math.round(progressSum / total),
    isBusy: active > 0
  };
}

export function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}
