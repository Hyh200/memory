"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { AlbumYearView } from "@/lib/album-model";
import {
  createAlbumYearCards,
  loadArchivedPhotos,
  type AlbumYearCard
} from "@/lib/album-archive";

type AlbumYearListProps = {
  seedAlbums: AlbumYearView[];
};

export function AlbumYearList({ seedAlbums }: AlbumYearListProps) {
  const [cards, setCards] = useState<AlbumYearCard[]>(() =>
    createAlbumYearCards(seedAlbums, [])
  );

  useEffect(() => {
    setCards(createAlbumYearCards(seedAlbums, loadArchivedPhotos()));
  }, [seedAlbums]);

  return (
    <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
      {cards.map((album) => (
        <article
          className="group grid min-h-72 border border-line bg-panel p-3 transition hover:border-paper-muted md:min-h-[30rem] lg:min-h-80 lg:grid-cols-[0.82fr_1fr] lg:p-4"
          key={album.id}
        >
          <div
            className="relative flex min-h-64 overflow-hidden bg-ink p-5 shadow-[inset_0_0_0_1px_rgba(244,239,231,0.16)]"
            style={getCoverStyle(album)}
          >
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(17,16,14,0.1),rgba(17,16,14,0.72))]" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,rgba(17,16,14,0.86),rgba(17,16,14,0))]" />
            <div className="relative flex h-full w-full flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <span className="text-6xl font-medium leading-none tracking-normal text-paper">
                  {album.year}
                </span>
                <span className="border border-paper/25 px-2 py-1 text-xs text-paper-muted">
                  {album.tone}
                </span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <p className="max-w-36 text-xs leading-5 text-paper-muted">
                  {album.representativePhotoName ?? "暂无代表照片"}
                </p>
                <p
                  className="text-5xl leading-none text-paper drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
                  style={signatureStyle}
                >
                  {album.signatureText}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col justify-between border-t border-line px-2 pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:px-0 lg:pl-6 lg:pt-0">
            <div>
              <h2 className="text-xl font-medium tracking-normal">
                {album.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-stone">
                {album.photoCount} 张照片。{album.summary}
              </p>
              {album.uploadedCount > 0 ? (
                <p className="mt-3 text-xs text-paper-muted">
                  本地新增 {album.uploadedCount} 张
                </p>
              ) : null}
            </div>
            <button className="mt-8 w-fit text-sm text-paper-muted underline decoration-line underline-offset-4 transition group-hover:text-paper">
              查看相册
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function getCoverStyle(album: AlbumYearCard): CSSProperties {
  const [primary, secondary, shadow] = album.dominantColors;
  const imageLayer = album.coverImageUrl
    ? `, url("${album.coverImageUrl.replaceAll("\"", "%22")}")`
    : "";

  return {
    backgroundColor: shadow ?? "#161411",
    backgroundImage: `linear-gradient(135deg, ${primary ?? "#2f3432"}, ${
      secondary ?? "#d8cfc2"
    } 46%, ${shadow ?? "#15130f"})${imageLayer}`,
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundBlendMode: album.coverImageUrl ? "multiply, normal" : "normal"
  };
}

const signatureStyle: CSSProperties = {
  fontFamily: '"STXingkai", "华文行楷", "KaiTi", "楷体", serif'
};
