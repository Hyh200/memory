import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumReader } from "@/components/album-reader";
import {
  getOrCreateAlbumYearByYear,
  listAlbumYears
} from "@/lib/local-data";

type AlbumPageProps = {
  params: Promise<{
    year: string;
  }>;
};

export function generateStaticParams() {
  return listAlbumYears().map((albumYear) => ({
    year: String(albumYear.album.year)
  }));
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    notFound();
  }

  const albumYear = getOrCreateAlbumYearByYear(year);

  return (
    <main>
      <div className="border-b border-line bg-[#0f0e0c] px-4 py-3 md:px-8">
        <Link
          className="text-sm text-paper-muted underline decoration-line underline-offset-4 transition hover:text-paper"
          href="/"
        >
          返回年度列表
        </Link>
      </div>
      <AlbumReader albumYear={albumYear} />
    </main>
  );
}
