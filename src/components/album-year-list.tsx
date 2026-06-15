"use client";

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
          className="group grid min-h-52 border border-line bg-panel p-5 transition hover:border-paper-muted md:min-h-72 lg:grid-cols-[0.7fr_1fr]"
          key={album.id}
        >
          <div className="flex flex-col justify-between">
            <span className="text-5xl font-medium leading-none tracking-normal">
              {album.year}
            </span>
            <span className="text-sm text-stone">{album.tone}</span>
          </div>
          <div className="mt-8 flex flex-col justify-between border-t border-line pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
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
