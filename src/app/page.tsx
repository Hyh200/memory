import { getPhotoCount } from "@/lib/album-model";
import { listAlbumYears } from "@/lib/local-data";

export default function Home() {
  const albums = listAlbumYears();

  return (
    <main className="min-h-screen bg-[#11100e] text-paper">
      <section className="mx-auto flex min-h-screen w-[min(1180px,calc(100%-32px))] flex-col px-0 py-8 md:w-[min(1180px,calc(100%-64px))] md:py-12">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <div>
            <p className="text-xs text-stone">Annual Photo Album</p>
            <h1 className="mt-2 text-2xl font-medium tracking-normal md:text-3xl">
              年度相册
            </h1>
          </div>
          <button className="border border-line px-4 py-2 text-sm text-paper transition hover:border-paper">
            上传照片
          </button>
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

          <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {albums.map((albumYear) => (
              <article
                className="group grid min-h-52 border border-line bg-panel p-5 transition hover:border-paper-muted md:min-h-72 lg:grid-cols-[0.7fr_1fr]"
                key={albumYear.album.id}
              >
                <div className="flex flex-col justify-between">
                  <span className="text-5xl font-medium leading-none tracking-normal">
                    {albumYear.album.year}
                  </span>
                  <span className="text-sm text-stone">
                    {albumYear.styleProfile.label}
                  </span>
                </div>
                <div className="mt-8 flex flex-col justify-between border-t border-line pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <div>
                    <h2 className="text-xl font-medium tracking-normal">
                      {albumYear.album.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-stone">
                      {getPhotoCount(albumYear)}
                      {" "}
                      张照片。{albumYear.styleProfile.summary}
                    </p>
                  </div>
                  <button className="mt-8 w-fit text-sm text-paper-muted underline decoration-line underline-offset-4 transition group-hover:text-paper">
                    查看相册
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
