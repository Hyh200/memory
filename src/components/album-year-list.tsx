"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { AlbumYearView } from "@/lib/album-model";
import {
  createAlbumYearCards,
  filterAlbumCardsByYear,
  loadArchivedPhotos,
  type AlbumYearCard
} from "@/lib/album-archive";

type AlbumYearListProps = {
  seedAlbums: AlbumYearView[];
};

export function AlbumYearList({ seedAlbums }: AlbumYearListProps) {
  const currentYear = new Date().getFullYear();
  const [cards, setCards] = useState<AlbumYearCard[]>(() =>
    filterAlbumCardsByYear(createAlbumYearCards(seedAlbums, []), currentYear)
  );

  useEffect(() => {
    setCards(
      filterAlbumCardsByYear(
        createAlbumYearCards(seedAlbums, loadArchivedPhotos()),
        currentYear
      )
    );
  }, [currentYear, seedAlbums]);

  return (
    <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
      {cards.map((album) => (
        <article
          className="group grid min-h-72 border border-line bg-panel p-3 transition hover:border-paper-muted md:min-h-[30rem] lg:min-h-80 lg:grid-cols-[0.82fr_1fr] lg:p-4"
          key={album.id}
        >
          <div
            className="relative flex min-h-64 overflow-hidden bg-ink p-5 shadow-[inset_0_0_0_1px_rgba(244,239,231,0.16)]"
          >
            <p
              className="relative ml-auto mt-auto text-5xl leading-none text-paper drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
              style={signatureStyle}
            >
              {album.signatureText}
            </p>
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
            <Link
              className="mt-8 w-fit text-sm text-paper-muted underline decoration-line underline-offset-4 transition group-hover:text-paper"
              href={`/albums/${album.year}`}
            >
              查看相册
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}

const signatureStyle: CSSProperties = {
  fontFamily: '"STXingkai", "华文行楷", "KaiTi", "楷体", serif'
};
