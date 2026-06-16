import Link from "next/link";
import { AlbumYearList } from "@/components/album-year-list";
import { listAlbumYears } from "@/lib/local-data";

export default function Home() {
  const albums = listAlbumYears();

  return (
    <main className="min-h-screen bg-[#11100e] text-paper">
      <section className="mx-auto flex min-h-screen w-[min(1180px,calc(100%-32px))] flex-col px-0 py-8 md:w-[min(1180px,calc(100%-64px))] md:py-12">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <div>
            <p className="text-xs text-stone">Luminous Years</p>
            <h1 className="mt-2 text-2xl font-medium tracking-normal md:text-3xl">
              流光岁月
            </h1>
          </div>
          <Link
            className="border border-line px-4 py-2 text-sm text-paper transition hover:border-paper"
            href="/upload"
          >
            上传照片
          </Link>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:py-14">
          <section className="self-start lg:sticky lg:top-12">
            <p className="max-w-xl text-[52px] font-medium leading-[0.95] tracking-normal md:text-[84px]">
              把一年装订成册
            </p>
            <p className="mt-8 max-w-md text-base leading-8 text-stone md:text-lg">
              上传照片后，系统按拍摄年份归档，并生成带行书署名、年度封面和风格模板的私人相册。
            </p>
          </section>

          <AlbumYearList seedAlbums={albums} />
        </div>
      </section>
    </main>
  );
}
