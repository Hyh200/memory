const years = ["2026", "2025", "2024"];

export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Annual Photo Album</p>
        <h1>年度相册</h1>
        <p className="summary">
          上传照片后，系统会按照片年份归档，生成带行书封面和风格模板的年度相册。
        </p>
      </section>

      <section className="year-grid" aria-label="年度相册列表">
        {years.map((year) => (
          <article className="year-card" key={year}>
            <span>{year}</span>
            <strong>待上传</strong>
          </article>
        ))}
      </section>
    </main>
  );
}
