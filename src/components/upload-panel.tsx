"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { saveArchivedPhoto } from "@/lib/album-archive";

const maxFileSize = 20 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type SelectedPhoto = {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  status: "ready" | "processing" | "processed" | "error";
  message: string;
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
};

type ProcessedPhotoResponse = {
  thumbnailUrl: string;
  thumbnailMimeType: "image/webp";
  thumbnailWidth: number;
  thumbnailHeight: number;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  capturedAt: string | null;
  resolvedYear: number;
  yearSource: "exif" | "modifiedAt" | "uploadedAt";
  bucket: string;
  originalObjectKey: string;
  thumbnailObjectKey: string;
};

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<SelectedPhoto[]>([]);

  const processedCount = useMemo(
    () => items.filter((item) => item.status === "processed").length,
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
      <section className="border border-line bg-panel p-6">
        <div className="flex h-full min-h-72 flex-col justify-between">
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
              className="inline-flex items-center gap-2 border border-line px-4 py-3 text-sm text-paper transition hover:border-paper"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus aria-hidden="true" className="h-4 w-4" />
              添加照片
            </button>
          </div>
        </div>
      </section>

      <section className="border border-line bg-[#171511] p-6">
        <div className="flex items-start justify-between gap-6 border-b border-line pb-5">
          <div>
            <h2 className="text-xl font-medium tracking-normal">上传队列</h2>
            <p className="mt-2 text-sm text-stone">
              {processedCount} 张可入库，{items.length - processedCount} 张处理中或错误
            </p>
          </div>
          <span className="text-sm text-paper-muted">{items.length} / 50</span>
        </div>

        <div className="mt-5 grid gap-3">
          {items.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center border border-dashed border-line text-sm text-stone">
              队列为空
            </div>
          ) : (
            items.map((item) => (
              <article
                className="grid gap-4 border border-line p-4 md:grid-cols-[1fr_auto]"
                key={item.id}
              >
                <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                  <div className="flex aspect-square w-24 items-center justify-center overflow-hidden border border-line bg-[#11100e] text-xs text-stone">
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
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="max-w-full break-words text-sm font-medium tracking-normal text-paper">
                          {item.name}
                        </h3>
                        <span
                          className={
                            item.status === "error"
                              ? "text-xs text-[#e9a38f]"
                              : "text-xs text-paper-muted"
                          }
                        >
                          {item.message}
                        </span>
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
                    </div>
                  </div>
                </div>

                <button
                  aria-label={`移除 ${item.name}`}
                  className="inline-flex h-9 w-9 items-center justify-center border border-line text-stone transition hover:border-paper hover:text-paper"
                  type="button"
                  onClick={() => clearItem(item.id)}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
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

    updateItem(item.id, { status: "processing", message: "生成缩略图中" });

    try {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("modifiedAt", String(item.file.lastModified));

      const response = await fetch("/api/photos/process", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "图片处理失败");
      }

      const processed = payload as ProcessedPhotoResponse;

      updateItem(item.id, {
        status: "processed",
        message: "已生成缩略图",
        thumbnailUrl: processed.thumbnailUrl,
        resolvedYear: processed.resolvedYear,
        capturedAt: processed.capturedAt,
        width: processed.width,
        height: processed.height,
        orientation: processed.orientation,
        yearSource: processed.yearSource,
        bucket: processed.bucket,
        originalObjectKey: processed.originalObjectKey,
        thumbnailObjectKey: processed.thumbnailObjectKey
      });
      saveArchivedPhoto({
        id: item.id,
        ownerId: "user_hao",
        fileName: item.name,
        mimeType: item.type,
        size: item.size,
        thumbnailUrl: processed.thumbnailUrl,
        originalObjectKey: processed.originalObjectKey,
        thumbnailObjectKey: processed.thumbnailObjectKey,
        bucket: processed.bucket,
        width: processed.width,
        height: processed.height,
        orientation: processed.orientation,
        capturedAt: processed.capturedAt,
        uploadedAt: new Date().toISOString(),
        resolvedYear: processed.resolvedYear,
        yearSource: processed.yearSource
      });
    } catch (error) {
      updateItem(item.id, {
        status: "error",
        message: error instanceof Error ? error.message : "图片处理失败"
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
      message: "格式不支持"
    };
  }

  if (file.size > maxFileSize) {
    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "error",
      message: "超过 20MB"
    };
  }

  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: "ready",
    message: "待处理"
  };
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
