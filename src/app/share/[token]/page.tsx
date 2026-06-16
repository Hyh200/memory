import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumReader } from "@/components/album-reader";
import { getOrCreateAlbumYearByYear } from "@/lib/local-data";
import { getActiveShareRecord } from "@/lib/share-links";

export const dynamic = "force-dynamic";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const record = getActiveShareRecord(token);

  if (!record) {
    notFound();
  }

  const albumYear = getOrCreateAlbumYearByYear(record.year);

  return (
    <main>
      <div className="border-b border-line bg-[#0f0e0c] px-4 py-3 md:px-8">
        <Link
          className="text-sm text-paper-muted underline decoration-line underline-offset-4 transition hover:text-paper"
          href="/"
        >
          年度相册
        </Link>
      </div>
      <AlbumReader albumYear={albumYear} canShare={false} />
    </main>
  );
}
