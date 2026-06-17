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
import {
  loadArchivedPhotos,
  loadRemoteArchivedPhotos
} from "@/lib/album-archive";
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
  const isSinglePage = true;
  const leftPage = pages[pageIndex];
  const atFirstPage = pageIndex === 0;
  const atLastPage =
    getNextReaderIndex({
      currentIndex: pageIndex,
      pageCount: pages.length,
      direction: "next",
      isSinglePage
    }) === pageIndex;

  useEffect(() => {
    let cancelled = false;
    const localPhotos = loadArchivedPhotos();

    setArchivedPhotos(localPhotos);
    loadRemoteArchivedPhotos()
      .then((remotePhotos) => {
        if (!cancelled && remotePhotos.length > 0) {
          setArchivedPhotos(remotePhotos);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArchivedPhotos(localPhotos);
        }
      });

    return () => {
      cancelled = true;
    };
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
    <section className="min-h-screen bg-[linear-gradient(135deg,#ece7dc_0%,#d9ded3_46%,#c4c9bd_100%)] px-4 py-5 text-[#211d18] md:px-8 md:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2c251b]/15 pb-4">
          <div>
            <h1 className="text-2xl font-medium tracking-normal md:text-3xl">
              {albumYear.album.year}
            </h1>
          </div>
        </header>

        {canShare ? (
          <section className="grid gap-3 border border-[#2c251b]/12 bg-[#f5efe5]/72 p-4 shadow-[0_18px_58px_rgba(73,66,55,0.12)] backdrop-blur md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="text-sm text-[#211d18]">分享链接</p>
              <p className="mt-2 break-all text-xs leading-5 text-[#756c5f]">
                {share?.url ?? shareMessage}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="inline-flex h-10 items-center justify-center border border-[#2c251b]/14 text-[#6f675c] transition hover:border-[#211d18]/45 hover:text-[#211d18] disabled:cursor-not-allowed disabled:opacity-35"
                disabled={isShareBusy}
                title="生成分享链接"
                type="button"
                onClick={createShareLink}
              >
                <Link2 aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 items-center justify-center border border-[#2c251b]/14 text-[#6f675c] transition hover:border-[#211d18]/45 hover:text-[#211d18] disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!share || Boolean(share.revokedAt)}
                title="复制分享链接"
                type="button"
                onClick={copyShareLink}
              >
                <Copy aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 items-center justify-center border border-[#2c251b]/14 text-[#6f675c] transition hover:border-[#211d18]/45 hover:text-[#211d18] disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!share || Boolean(share.revokedAt) || isShareBusy}
                title="撤销分享链接"
                type="button"
                onClick={revokeShareLink}
              >
                <XCircle aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#756c5f] md:col-span-2">
              {shareMessage}
            </p>
          </section>
        ) : null}

        <div className="flex justify-center">
          <div
            className="relative grid w-full max-w-4xl overflow-hidden border border-[#2c251b]/12 bg-[#edf0e8]/72 p-3 shadow-[0_34px_100px_rgba(72,70,60,0.24)] md:p-4"
            style={{ perspective: "1800px" }}
          >
            <ReaderPaper page={leftPage} />
            {flipDirection ? (
              <div
                aria-hidden="true"
                className={
                  flipDirection === "next"
                    ? "absolute inset-3 origin-left animate-[album-flip-next_520ms_ease-in-out] border border-[#2c251b]/14 bg-[#ede5d8] shadow-[0_24px_70px_rgba(72,70,60,0.24)] md:inset-4"
                    : "absolute inset-3 origin-right animate-[album-flip-prev_520ms_ease-in-out] border border-[#2c251b]/14 bg-[#ede5d8] shadow-[0_24px_70px_rgba(72,70,60,0.24)] md:inset-4"
                }
              />
            ) : null}
          </div>
        </div>

        <nav
          aria-label="相册翻页控制"
          className="grid grid-cols-3 gap-3 border-t border-[#2c251b]/15 pt-4"
        >
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#2c251b]/12 bg-[#f5efe5]/36 text-sm text-[#6f675c] transition hover:border-[#211d18]/35 hover:text-[#211d18] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atFirstPage}
            type="button"
            onClick={() => go("first")}
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            首页
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#2c251b]/12 bg-[#f5efe5]/36 text-sm text-[#6f675c] transition hover:border-[#211d18]/35 hover:text-[#211d18] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atFirstPage}
            type="button"
            onClick={() => go("previous")}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            上一页
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#2c251b]/12 bg-[#f5efe5]/36 text-sm text-[#211d18] transition hover:border-[#211d18]/35 disabled:cursor-not-allowed disabled:opacity-35"
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
  page
}: {
  page: ReaderPage | null;
}) {
  if (!page) {
    return <div className="aspect-[4/3] w-full bg-[#ede5d8]" />;
  }

  return (
    <article
      className="relative aspect-[4/3] w-full overflow-hidden bg-paper text-ink"
      style={getPaperStyle(page)}
    >
      {page.kind === "cover" ? (
        <div className="relative grid h-full w-full place-items-center overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={coverMaterialStyle}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[22px] border border-[#2c251b]/12 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.34)] md:inset-[34px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[12%]"
            style={coverSpineStyle}
          />
          <p
            className="relative text-[56px] leading-none text-[#211d18] drop-shadow-[0_10px_28px_rgba(80,75,64,0.18)] md:text-[86px]"
            style={signatureStyle}
          >
            {page.signatureText}
          </p>
        </div>
      ) : (
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#f1eadf] p-3 md:p-4"
          style={getImageStyle(page)}
        >
          {page.imageUrl ? (
            <img
              alt=""
              className="h-full w-full object-contain"
              src={page.imageUrl}
            />
          ) : (
            <span className="text-xs uppercase text-ink/35">
              Annual Album
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function getPaperStyle(page: ReaderPage): CSSProperties {
  return {
    backgroundImage:
      page.kind === "cover"
        ? "radial-gradient(circle at 78% 18%, rgba(255,255,255,0.52), transparent 28%), radial-gradient(circle at 24% 72%, rgba(174,190,174,0.32), transparent 33%), linear-gradient(135deg, #efe6d8, #d7dfd4 48%, #c9c0ad)"
        : "none",
    boxShadow:
      page.kind === "cover"
        ? "inset 0 0 0 1px rgba(44,37,27,0.12), inset 34px 0 46px rgba(75,82,67,0.18), inset -18px 0 42px rgba(255,255,255,0.32)"
        : "inset 0 0 0 1px rgba(44,37,27,0.08)"
  };
}

function getImageStyle(page: ReaderPage): CSSProperties {
  const [primary, secondary, shadow] = page.palette;

  return {
    backgroundColor: primary ?? "#d8cfc2",
    backgroundImage: page.imageUrl
      ? "none"
      : `linear-gradient(135deg, ${primary ?? "#d8cfc2"}, ${
          secondary ?? "#f4efe7"
        } 52%, ${shadow ?? "#161411"})`
  };
}

const signatureStyle: CSSProperties = {
  fontFamily: '"STXingkai", "华文行楷", "KaiTi", "楷体", serif'
};

const coverMaterialStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(0deg, rgba(44,37,27,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(44,37,27,0.026) 1px, transparent 1px), radial-gradient(circle at 50% 45%, rgba(255,255,255,0.28), transparent 34%)",
  backgroundSize: "13px 13px, 17px 17px, 100% 100%",
  mixBlendMode: "multiply",
  opacity: 0.58
};

const coverSpineStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, rgba(91,98,80,0.28), rgba(91,98,80,0.1) 46%, transparent)"
};
