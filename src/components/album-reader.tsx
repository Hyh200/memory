"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  GalleryHorizontalEnd,
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

const maxMemoryCachedImages = 16;
const memoryImageCache = new Map<
  string,
  { objectUrl: string; lastUsed: number }
>();
const pendingImageLoads = new Map<string, Promise<string>>();

export function AlbumReader({ albumYear, canShare = true }: AlbumReaderProps) {
  const [archivedPhotos, setArchivedPhotos] = useState<ArchivedPhoto[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<FlipDirection | null>(
    null
  );
  const [share, setShare] = useState<ShareState | null>(null);
  const [shareMessage, setShareMessage] = useState("尚未生成分享链接");
  const [isShareBusy, setIsShareBusy] = useState(false);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
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
  const preloadImageUrls = useMemo(() => {
    const urls: string[] = [];
    const indexes = [pageIndex + 1, pageIndex - 1, pageIndex + 2];

    for (const index of indexes) {
      const imageUrl = pages[index]?.imageUrl;

      if (imageUrl && !urls.includes(imageUrl)) {
        urls.push(imageUrl);
      }
    }

    return urls.slice(0, 3);
  }, [pageIndex, pages]);
  const canPreloadNextImages =
    leftPage?.kind !== "photo" ||
    !leftPage.imageUrl ||
    loadedImageUrl === leftPage.imageUrl;

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

  useEffect(() => {
    setPageIndex((currentIndex) =>
      Math.min(
        currentIndex,
        getNextReaderIndex({
          currentIndex,
          pageCount: pages.length,
          direction: "last",
          isSinglePage
        })
      )
    );
  }, [pages.length]);

  function go(direction: "first" | "previous" | "next" | "last") {
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
    <section className="min-h-screen bg-[radial-gradient(circle_at_50%_8%,rgba(72,65,54,0.34),transparent_34%),linear-gradient(135deg,#171511_0%,#0d0c0a_54%,#1f1b15_100%)] px-4 py-5 text-[#f4efe7] md:px-8 md:py-8">
      <ImagePreloader enabled={canPreloadNextImages} urls={preloadImageUrls} />
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f4efe7]/14 pb-4">
          <div>
            <h1 className="text-2xl font-medium tracking-normal md:text-3xl">
              {albumYear.album.year}
            </h1>
          </div>
        </header>

        {canShare ? (
          <section className="grid gap-3 border border-[#f4efe7]/12 bg-[#171511]/78 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="text-sm text-[#f4efe7]">分享链接</p>
              <p className="mt-2 break-all text-xs leading-5 text-[#b5aa9b]">
                {share?.url ?? shareMessage}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="inline-flex h-10 items-center justify-center border border-[#f4efe7]/12 text-[#b5aa9b] transition hover:border-[#f4efe7]/45 hover:text-[#f4efe7] disabled:cursor-not-allowed disabled:opacity-35"
                disabled={isShareBusy}
                title="生成分享链接"
                type="button"
                onClick={createShareLink}
              >
                <Link2 aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 items-center justify-center border border-[#f4efe7]/12 text-[#b5aa9b] transition hover:border-[#f4efe7]/45 hover:text-[#f4efe7] disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!share || Boolean(share.revokedAt)}
                title="复制分享链接"
                type="button"
                onClick={copyShareLink}
              >
                <Copy aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 items-center justify-center border border-[#f4efe7]/12 text-[#b5aa9b] transition hover:border-[#f4efe7]/45 hover:text-[#f4efe7] disabled:cursor-not-allowed disabled:opacity-35"
                disabled={!share || Boolean(share.revokedAt) || isShareBusy}
                title="撤销分享链接"
                type="button"
                onClick={revokeShareLink}
              >
                <XCircle aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#b5aa9b] md:col-span-2">
              {shareMessage}
            </p>
          </section>
        ) : null}

        <div className="flex justify-center">
          <div
            className="relative grid w-full max-w-4xl overflow-hidden border border-[#f4efe7]/12 bg-[#0f0e0c]/78 p-3 shadow-[0_34px_100px_rgba(0,0,0,0.52)] md:p-4"
            style={{ perspective: "1800px" }}
          >
            <ReaderPaper
              page={leftPage}
              onImageLoad={(src) => setLoadedImageUrl(src)}
            />
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
          className="grid grid-cols-2 gap-3 border-t border-[#f4efe7]/14 pt-4 md:grid-cols-4"
        >
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#f4efe7]/12 bg-[#171511]/42 text-sm text-[#8f8578] transition hover:border-[#f4efe7]/35 hover:text-[#f4efe7] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atFirstPage}
            type="button"
            onClick={() => go("first")}
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            首页
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#f4efe7]/12 bg-[#171511]/42 text-sm text-[#8f8578] transition hover:border-[#f4efe7]/35 hover:text-[#f4efe7] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atFirstPage}
            type="button"
            onClick={() => go("previous")}
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            上一页
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#f4efe7]/16 bg-[#171511]/42 text-sm text-[#f4efe7] transition hover:border-[#f4efe7]/45 disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atLastPage}
            type="button"
            onClick={() => go("next")}
          >
            下一页
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 border border-[#f4efe7]/12 bg-[#171511]/42 text-sm text-[#8f8578] transition hover:border-[#f4efe7]/35 hover:text-[#f4efe7] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={atLastPage}
            type="button"
            onClick={() => go("last")}
          >
            尾页
            <GalleryHorizontalEnd aria-hidden="true" className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </section>
  );
}

function ReaderPaper({
  page,
  onImageLoad
}: {
  page: ReaderPage | null;
  onImageLoad: (src: string) => void;
}) {
  if (!page) {
    return <div className="aspect-[4/3] w-full bg-[#15130f]" />;
  }

  return (
    <article
      className="relative aspect-[4/3] w-full overflow-hidden bg-[#15130f] p-3 text-ink shadow-[0_22px_70px_rgba(63,58,49,0.22)] md:p-5"
      style={getPaperStyle(page)}
    >
      {page.kind === "cover" ? (
        <div className="relative grid h-full w-full place-items-center overflow-hidden border border-[#f4efe7]/18 bg-[#e8dfd0]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={coverMaterialStyle}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[18px] border border-[#2c251b]/14 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.38)] md:inset-[30px]"
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
          className="relative flex h-full w-full items-center justify-center overflow-hidden border border-[#f4efe7]/18 bg-[#efe8dc] p-5 md:p-8"
          style={getImageStyle(page)}
        >
          {page.imageUrl ? (
            <ReaderImage
              placeholderSrc={page.placeholderUrl}
              src={page.imageUrl}
              onLoad={onImageLoad}
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

function ReaderImage({
  placeholderSrc,
  src,
  onLoad
}: {
  placeholderSrc: string | null;
  src: string;
  onLoad: (src: string) => void;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [displaySrc, setDisplaySrc] = useState(() => getImageDisplaySrc(src));

  useEffect(() => {
    setStatus("loading");
    setDisplaySrc(getImageDisplaySrc(src));
  }, [src]);

  return (
    <>
      {status !== "loaded" ? (
        <div className="absolute inset-5 grid place-items-center bg-[#efe8dc] text-xs uppercase tracking-normal text-ink/35 md:inset-8">
          {placeholderSrc ? (
            <img
              alt=""
              className="h-full w-full object-contain opacity-70 blur-sm scale-[1.02]"
              src={placeholderSrc}
            />
          ) : (
            <span>{status === "error" ? "Image unavailable" : "Loading"}</span>
          )}
        </div>
      ) : null}
      {displaySrc ? (
        <img
          key={displaySrc}
          alt=""
          className={
            status === "loaded"
              ? "h-full w-full object-contain opacity-100 shadow-[0_10px_32px_rgba(72,66,56,0.2)] transition-opacity duration-200"
              : "h-full w-full object-contain opacity-0 shadow-[0_10px_32px_rgba(72,66,56,0.2)]"
          }
          src={displaySrc}
          onError={() => setStatus("error")}
          onLoad={() => {
            setStatus("loaded");
            onLoad(src);
          }}
        />
      ) : null}
    </>
  );
}

function ImagePreloader({
  enabled,
  urls
}: {
  enabled: boolean;
  urls: string[];
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    urls.forEach((url) => {
      void loadImageIntoMemoryCache(url).catch(() => undefined);
    });
  }, [enabled, urls]);

  return null;
}

function getCachedImageObjectUrl(src: string) {
  const cached = memoryImageCache.get(src);

  if (!cached) {
    return null;
  }

  cached.lastUsed = Date.now();
  return cached.objectUrl;
}

function getImageDisplaySrc(src: string) {
  return getCachedImageObjectUrl(src) ?? src;
}

async function loadImageIntoMemoryCache(src: string) {
  const cached = getCachedImageObjectUrl(src);

  if (cached) {
    return cached;
  }

  const pending = pendingImageLoads.get(src);

  if (pending) {
    return pending;
  }

  const promise = fetch(src, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      memoryImageCache.set(src, { objectUrl, lastUsed: Date.now() });
      trimMemoryImageCache();

      return objectUrl;
    })
    .finally(() => {
      pendingImageLoads.delete(src);
    });

  pendingImageLoads.set(src, promise);
  return promise;
}

function trimMemoryImageCache() {
  if (memoryImageCache.size <= maxMemoryCachedImages) {
    return;
  }

  const expired = Array.from(memoryImageCache.entries()).sort(
    (left, right) => left[1].lastUsed - right[1].lastUsed
  );

  for (const [src, cached] of expired) {
    if (memoryImageCache.size <= maxMemoryCachedImages) {
      break;
    }

    URL.revokeObjectURL(cached.objectUrl);
    memoryImageCache.delete(src);
  }
}

function getPaperStyle(page: ReaderPage): CSSProperties {
  return {
    backgroundImage:
      page.kind === "cover"
        ? "linear-gradient(135deg, #1d1a16, #0f0e0c 54%, #252018)"
        : "none",
    boxShadow:
      page.kind === "cover"
        ? "inset 0 0 0 1px rgba(244,239,231,0.14), inset 22px 0 28px rgba(255,255,255,0.04), inset -18px 0 34px rgba(0,0,0,0.28)"
        : "inset 0 0 0 1px rgba(244,239,231,0.14), inset 0 0 42px rgba(0,0,0,0.28)"
  };
}

function getImageStyle(page: ReaderPage): CSSProperties {
  const [primary, secondary, shadow] = page.palette;

  return {
    backgroundColor: page.imageUrl ? "#f1eadf" : primary ?? "#d8cfc2",
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
    "radial-gradient(circle at 50% 44%, rgba(255,255,255,0.34), transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.18), transparent 42%, rgba(91,98,80,0.08))",
  backgroundSize: "100% 100%, 100% 100%",
  mixBlendMode: "multiply",
  opacity: 0.52
};

const coverSpineStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, rgba(91,98,80,0.28), rgba(91,98,80,0.1) 46%, transparent)"
};
