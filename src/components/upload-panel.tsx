"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

const maxFileSize = 20 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type SelectedPhoto = {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "ready" | "error";
  message: string;
};

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<SelectedPhoto[]>([]);

  const readyCount = useMemo(
    () => items.filter((item) => item.status === "ready").length,
    [items]
  );

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    setItems((current) => [
      ...current,
      ...files.map((file) => validateFile(file))
    ]);

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
              支持 JPG、PNG、WebP。下一步会读取 EXIF 年份并生成缩略图。
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
              {readyCount} 张待处理，{items.length - readyCount} 张需处理错误
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
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="max-w-full break-words text-sm font-medium tracking-normal text-paper">
                      {item.name}
                    </h3>
                    <span
                      className={
                        item.status === "ready"
                          ? "text-xs text-paper-muted"
                          : "text-xs text-[#e9a38f]"
                      }
                    >
                      {item.message}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone">
                    {item.type || "未知类型"} · {formatFileSize(item.size)}
                  </p>
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
    name: file.name,
    size: file.size,
    type: file.type,
    status: "ready",
    message: "待处理"
  };
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}
