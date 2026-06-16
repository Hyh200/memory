"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud
} from "lucide-react";
import { saveArchivedPhoto } from "@/lib/album-archive";
import type { StyleAnalysis } from "@/lib/style-analysis";
import {
  clampProgress,
  createUploadQueueSummary,
  type UploadQueueStatus
} from "@/lib/upload-queue";

const maxFileSize = 20 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type SelectedPhoto = {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  status: UploadQueueStatus;
  message: string;
  progress: number;
  thumbnailUrl?: string;
  resolvedYear?: number;
  capturedAt?: string | null;
  width?: number;
  height?: number;
  orientation?: "landscape" | "portrait" | "square";
  yearSource?: "exif" | "modifiedAt" | "uploadedAt";
  bucket?: string;
  originalObjectKey?: string;
  thumbnailObjectKey?: string;
  styleAnalysis?: StyleAnalysis;
};

type ProcessedPhotoResponse = {
  id: string;
  ownerId: string;
  fileName: string;
  mimeType: string;
  size: number;
  thumbnailUrl: string;
  thumbnailMimeType: "image/webp";
  thumbnailWidth: number;
  thumbnailHeight: number;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  capturedAt: string | null;
  uploadedAt: string;
  resolvedYear: number;
  yearSource: "exif" | "modifiedAt" | "uploadedAt";
  bucket: string;
  originalObjectKey: string;
  thumbnailObjectKey: string;
  styleAnalysis: StyleAnalysis;
};

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<SelectedPhoto[]>([]);

  const queueSummary = useMemo(
    () => createUploadQueueSummary(items),
    [items]
  );

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const nextItems = files.map((file) => validateFile(file));

    setItems((current) => [...current, ...nextItems]);
    nextItems
      .filter((item) => item.status === "ready")
      .forEach((item) => {
        void processPhoto(item);
      });

    event.target.value = "";
  }

  function clearItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="border border-line bg-panel p-5 md:p-6">
        <div className="flex h-full min-h-64 flex-col justify-between md:min-h-72">
          <div>
            <UploadCloud aria-hidden="true" className="h-9 w-9 text-paper" />
            <h2 className="mt-8 text-3xl font-medium tracking-normal">
              选择照片
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-stone">
              支持 JPG、PNG、WebP。选择后会读取 EXIF 年份并生成缩略图。
            </p>
          </div>

          <div className="mt-10">
            <input
              ref={inputRef}
              aria-label="选择照片文件"
              className="sr-only"
              multiple
              accept="image/jpeg,image/png,image/webp"
              type="file"
              onChange={handleFiles}
            />
            <button
              className="inline-flex min-h-11 items-center gap-2 border border-line px-4 py-3 text-sm text-paper transition hover:border-paper disabled:cursor-not-allowed disabled:opacity-45"
              disabled={queueSummary.isBusy}
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus aria-hidden="true" className="h-4 w-4" />
              {queueSummary.isBusy ? "处理中" : "添加照片"}
            </button>
          </div>
        </div>
      </section>

      <section className="border border-line bg-[#171511] p-5 md:p-6">
        <div className="grid gap-4 border-b border-line pb-5 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <h2 className="text-xl font-medium tracking-normal">上传队列</h2>
            <p className="mt-2 text-sm text-stone">
              {queueSummary.processed} 张可入库，{queueSummary.active} 张处理中，
              {queueSummary.error} 张错误
            </p>
          </div>
          <div className="min-w-28 text-left md:text-right">
            <span className="text-sm text-paper-muted">
              {queueSummary.total} / 50
            </span>
            <p className="mt-1 text-xs text-stone">
              {queueSummary.averageProgress}% 完成
            </p>
          </div>
          <div className="h-1.5 overflow-hidden bg-[#11100e] md:col-span-2">
            <div
              className="h-full bg-paper transition-all duration-300"
              style={{ width: `${queueSummary.averageProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {items.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center border border-dashed border-line text-sm text-stone">
              队列为空
            </div>
          ) : (
            items.map((item) => (
              <article
                className="grid gap-4 border border-line p-3 md:grid-cols-[1fr_auto] md:p-4"
                key={item.id}
              >
                <div className="grid min-w-0 gap-4 sm:grid-cols-[96px_1fr]">
                  <div className="flex aspect-square w-full max-w-28 items-center justify-center overflow-hidden border border-line bg-[#11100e] text-xs text-stone sm:w-24">
                    {item.thumbnailUrl ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={item.thumbnailUrl}
                      />
                    ) : (
                      "待生成"
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex h-full flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="max-w-full break-words text-sm font-medium tracking-normal text-paper">
                          {item.name}
                        </h3>
                        <StatusLabel item={item} />
                      </div>
                      <p className="mt-2 text-xs text-stone">
                        {item.type || "未知类型"} · {formatFileSize(item.size)}
                        {item.width && item.height
                          ? ` · ${item.width}×${item.height}`
                          : ""}
                      </p>
                      {item.resolvedYear ? (
                        <p className="mt-2 text-xs text-paper-muted">
                          年份 {item.resolvedYear} ·{" "}
                          {formatYearSource(item.yearSource)}
                        </p>
                      ) : null}
                      {item.styleAnalysis ? (
                        <p className="mt-2 text-xs text-paper-muted">
                          模板 {item.styleAnalysis.label} ·{" "}
                          {item.styleAnalysis.tags.join(" / ")}
                        </p>
                      ) : null}
                      <div className="mt-3 h-1.5 overflow-hidden bg-[#11100e]">
                        <div
                          className={
                            item.status === "error"
                              ? "h-full bg-[#e9a38f] transition-all duration-300"
                              : "h-full bg-paper transition-all duration-300"
                          }
                          style={{ width: `${clampProgress(item.progress)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:flex-col">
                  {item.status === "error" && item.file ? (
                    <button
                      aria-label={`重试 ${item.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center border border-line text-stone transition hover:border-paper hover:text-paper"
                      type="button"
                      onClick={() => {
                        updateItem(item.id, {
                          status: "ready",
                          message: "等待重试",
                          progress: 5
                        });
                        void processPhoto(item);
                      }}
                    >
                      <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    aria-label={`移除 ${item.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center border border-line text-stone transition hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
                    disabled={item.status === "processing"}
                    type="button"
                    onClick={() => clearItem(item.id)}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );

  async function processPhoto(item: SelectedPhoto) {
    if (!item.file) {
      return;
    }

    updateItem(item.id, {
      status: "processing",
      message: "上传并读取年份",
      progress: 18
    });

    try {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("modifiedAt", String(item.file.lastModified));
      updateItem(item.id, { message: "生成缩略图", progress: 42 });

      const response = await fetch("/api/photos/process", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      updateItem(item.id, { message: "分析风格模板", progress: 76 });

      if (!response.ok) {
        throw new Error(payload.error ?? "图片处理失败");
      }

      const processed = payload as ProcessedPhotoResponse;
      updateItem(item.id, { message: "写入年度归档", progress: 92 });

      updateItem(item.id, {
        status: "processed",
        message: "已生成风格模板",
        progress: 100,
        thumbnailUrl: processed.thumbnailUrl,
        resolvedYear: processed.resolvedYear,
        capturedAt: processed.capturedAt,
        width: processed.width,
        height: processed.height,
        orientation: processed.orientation,
        yearSource: processed.yearSource,
        bucket: processed.bucket,
        originalObjectKey: processed.originalObjectKey,
        thumbnailObjectKey: processed.thumbnailObjectKey,
        styleAnalysis: processed.styleAnalysis
      });
      saveArchivedPhoto({
        id: processed.id,
        ownerId: processed.ownerId,
        fileName: processed.fileName,
        mimeType: processed.mimeType,
        size: processed.size,
        thumbnailUrl: processed.thumbnailUrl,
        originalObjectKey: processed.originalObjectKey,
        thumbnailObjectKey: processed.thumbnailObjectKey,
        bucket: processed.bucket,
        width: processed.width,
        height: processed.height,
        orientation: processed.orientation,
        capturedAt: processed.capturedAt,
        uploadedAt: processed.uploadedAt,
        resolvedYear: processed.resolvedYear,
        yearSource: processed.yearSource,
        styleAnalysis: processed.styleAnalysis
      });
    } catch (error) {
      updateItem(item.id, {
        status: "error",
        message: error instanceof Error ? error.message : "图片处理失败",
        progress: 100
      });
    }
  }

  function updateItem(id: string, patch: Partial<SelectedPhoto>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }
}

function validateFile(file: File): SelectedPhoto {
  if (!acceptedTypes.has(file.type)) {
    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "error",
      message: "格式不支持",
      progress: 100
    };
  }

  if (file.size > maxFileSize) {
    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "error",
      message: "超过 20MB",
      progress: 100
    };
  }

  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: "ready",
    message: "待处理",
    progress: 5
  };
}

function StatusLabel({ item }: { item: SelectedPhoto }) {
  if (item.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-paper-muted">
        <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
        {item.message}
      </span>
    );
  }

  return (
    <span
      className={
        item.status === "error"
          ? "text-xs text-[#e9a38f]"
          : "text-xs text-paper-muted"
      }
    >
      {item.message}
    </span>
  );
}

function formatYearSource(source: SelectedPhoto["yearSource"]) {
  if (source === "exif") {
    return "EXIF";
  }

  if (source === "modifiedAt") {
    return "文件时间";
  }

  return "上传时间";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}
