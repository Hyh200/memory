"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Home,
  Link2,
  XCircle
} from "lucide-react";
import type { ArchivedPhoto } from "@/lib/album-archive";
import { loadArchivedPhotos } from "@/lib/album-archive";
import type { AlbumYearView } from "@/lib/album-model";
import {
  createReaderPages,
  getNextReaderIndex,
  type ReaderPage
} from "@/lib/album-reader";

type AlbumReaderProps = {
  albumYear: AlbumYearView;
  canShare?: boolean;
};

type FlipDirection = "previous" | "next";

type ShareState = {
  token: string;
  managementToken: string;
  url: string;
  revokedAt: string | null;
};

export function AlbumReader({ albumYear, canShare = true }: AlbumReaderProps) {
  const [archivedPhotos, setArchivedPhotos] = useState<ArchivedPhoto[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isSinglePage, setIsSinglePage] = useState(false);
  const [flipDirection, setFlipDirection] = useState<FlipDirection | null>(
    null
  );
  const [share, setShare] = useState<ShareState | null>(null);
  const [shareMessage, setShareMessage] = useState("尚未生成分享链接");
  const [isShareBusy, setIsShareBusy] = useState(false);
  const pages = useMemo(
    () => createReaderPages(albumYear, archivedPhotos),
    [albumYear, archivedPhotos]
  );
  const leftPage = pages[pageIndex];
  const rightPage = isSinglePage ? null : pages[pageIndex + 1] ?? null;
  const atFirstPage = pageIndex === 0;
  const atLastPage =
    getNextReaderIndex({
      currentIndex: pageIndex,
      pageCount: pages.length,
      direction: "next",
      isSinglePage
    }) === pageIndex;

  useEffect(() => {
    setArchivedPhotos(loadArchivedPhotos());
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsSinglePage(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  function go(direction: "first" | "previous" | "next") {
    const nextIndex = getNextReaderIndex({
      currentIndex: pageIndex,
      pageCount: pages.length,
      direction,
      isSinglePage
    });

    if (nextIndex === pageIndex) {
      return;
    }

    setFlipDirection(direction === "previous" ? "previous" : "next");
    window.setTimeout(() => {
      setPageIndex(nextIndex);
      setFlipDirection(null);
    }, 260);
  }

  async function createShareLink() {
    setIsShareBusy(true);
    setShareMessage("正在生成分享链接");

    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ year: albumYear.album.year })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "分享链接生成失败");
      }

      const url = `${window.location.origin}/share/${payload.token}`;
      setShare({
        token: payload.token,
        managementToken: payload.managementToken,
        url,
        revokedAt: payload.revokedAt
      });
      setShareMessage("分享链接已生成");
    } catch (error) {
      setShareMessage(error instanceof Error ? error.message : "分享链接生成失败");
    } finally {
      setIsShareBusy(false);
    }
  }

  async function copyShareLink() {
    if (!share || share.revokedAt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(share.url);
      setShareMessage("分享链接已复制");
    } catch {
      setShareMessage("浏览器暂不允许自动复制，请手动复制链接");
    }
  }

  async function revokeShareLink() {
    if (!share) {
      return;
    }

    setIsShareBusy(true);
    setShareMessage("正在撤销分享链接");

    try {
      const response = await fetch(`/api/shares/${share.token}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ managementToken: share.managementToken })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "分享链接撤销失败");
      }

      setShare({ ...share, revokedAt: payload.revokedAt });
      setShareMessage("分享链接已撤销");
    } catch (error) {
      setShareMessage(error instanceof Error ? error.message : "分享链接撤销失败");
    } finally {
      setIsShareBusy(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#0f0e0c] px-4 py-5 text-paper md:px-8 md:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone">
              Album Reader
            </p>
            <h1 className="mt-2 text-2xl font-medium tracking-normal md:text-3xl">
              {albumYear.album.year} · {albumYear.album.title}
            </h1>
          </div>
          <p className="text-sm text-paper-muted">
            {pageIndex + 1} / {pages.length}
          </p>
        </header>

        {canShare ? (
          <section className="grid gap-3 border border-line bg-[#171511] p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="text-sm text-paper">分享链接</p>
              <p className="mt-2 break-all text-xs leading-5 text-stone">
                {share?.url ?? shareMessage}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="inline-flex h-10 items-center justify-center border border-line text-paper-muted transition hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
                disabled={isShareBusy}
                title="生成分享链接"
                type="button"
                onClick={createShareLink}
              >
                <Link2 aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 items-center justify-center border border-line text-paper-muted transition hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!share || Boolean(share.revokedAt)}
                title="复制分享链接"
                type="button"
                onClick={copyShareLink}
              >
                <Copy aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 items-center justify-center border border-line text-paper-muted transition hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!share || Boolean(share.revokedAt) || isShareBusy}
                title="撤销分享链接"
                type="button"
                onClick={revokeShareLink}
              >
                <XCircle aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-paper-muted md:col-span-2">
              {shareMessage}
            </p>
          </section>
        ) : null}

        <div className="flex justify-center">
          <div
            className="relative grid w-full max-w-5xl overflow-hidden border border-line bg-[#171511] p-2 shadow-[0_32px_90px_rgba(0,0,0,0.42)] md:grid-cols-2 md:p-3"
            style={{ perspective: "1800px" }}
          >
            <ReaderPaper page={leftPage} side="left" />
            <ReaderPaper page={rightPage} side="right" />
            {flipDirection ? (
              <div
                aria-hidden="true"
                className={
                  flipDirection === "next"
                    ? "absolute inset-y-3 right-3 hidden w-[calc(50%-0.75rem)] origin-left animate-[album-flip-next_520ms_ease-in-out] border border-line bg-paper shadow-[0_24px_70px_rgba(0,0,0,0.46)] md:block"
                    : "absolute inset-y-3 left-3 hidden w-[calc(50%-0.75rem)] origin-right animate-[album-flip-prev_520ms_ease-in-out] border border-line bg-paper shadow-[0_24px_70px_rgba(0,0,0,0.46)] md:block"
                }
              />
            ) : null}
          </div>
        </div>

        <nav
          aria-label="相册翻页控制"
          className="grid grid-cols-3 gap-3 border-t border-line pt-4"
        >
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-line text-sm text-paper-muted transition hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atFirstPage}
            type="button"
            onClick={() => go("first")}
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            首页
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-line text-sm text-paper-muted transition hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atFirstPage}
            type="button"
            onClick={() => go("previous")}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            上一页
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-line text-sm text-paper-muted transition hover:border-paper hover:text-paper disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atLastPage}
            type="button"
            onClick={() => go("next")}
          >
            下一页
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </section>
  );
}

function ReaderPaper({
  page,
  side
}: {
  page: ReaderPage | null;
  side: "left" | "right";
}) {
  if (!page) {
    return <div className="hidden min-h-[34rem] bg-[#15130f] md:block" />;
  }

  return (
    <article
      className={
        side === "right"
          ? "hidden min-h-[34rem] border-l border-[#d8cfc2]/30 bg-paper p-5 text-ink md:flex md:flex-col"
          : "flex min-h-[34rem] flex-col bg-paper p-5 text-ink"
      }
      style={getPaperStyle(page)}
    >
      <div className="grid flex-1 place-items-center">
        {page.kind === "cover" ? (
          <p
            className="text-6xl leading-none md:text-7xl"
            style={signatureStyle}
          >
            {page.signatureText}
          </p>
        ) : (
          <div className="h-full w-full">
            <div
              className="flex h-full min-h-[30rem] items-center justify-center overflow-hidden bg-[#e5ded2]"
              style={getImageStyle(page)}
            >
              {page.imageUrl ? null : (
                <span className="text-xs uppercase tracking-[0.24em] text-ink/35">
                  Annual Album
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function getPaperStyle(page: ReaderPage): CSSProperties {
  const [primary, secondary] = page.palette;

  return {
    backgroundImage: `linear-gradient(135deg, ${secondary ?? "#f4efe7"}, #f4efe7 56%, ${
      primary ?? "#d8cfc2"
    })`
  };
}

function getImageStyle(page: ReaderPage): CSSProperties {
  const [primary, secondary, shadow] = page.palette;
  const imageLayer = page.imageUrl
    ? `, url("${page.imageUrl.replaceAll("\"", "%22")}")`
    : "";

  return {
    backgroundColor: primary ?? "#d8cfc2",
    backgroundImage: `linear-gradient(135deg, ${primary ?? "#d8cfc2"}, ${
      secondary ?? "#f4efe7"
    } 52%, ${shadow ?? "#161411"})${imageLayer}`,
    backgroundBlendMode: page.imageUrl ? "multiply, normal" : "normal",
    backgroundPosition: "center",
    backgroundSize: "cover"
  };
}

const signatureStyle: CSSProperties = {
  fontFamily: '"STXingkai", "华文行楷", "KaiTi", "楷体", serif'
};
