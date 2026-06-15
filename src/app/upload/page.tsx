import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadPanel } from "@/components/upload-panel";

export default function UploadPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#11100e] text-paper">
      <section className="mx-auto max-w-[1180px] px-4 py-8 md:px-8 md:py-12">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-line pb-5">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm text-stone transition hover:text-paper"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              返回相册
            </Link>
            <h1 className="mt-5 text-4xl font-medium tracking-normal md:text-6xl">
              上传照片
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-stone">
            当前步骤只建立本地选择队列。真实上传、缩略图和 EXIF 年份识别将在后续 task 实现。
          </p>
        </header>

        <div className="py-8 md:py-12">
          <UploadPanel />
        </div>
      </section>
    </main>
  );
}
