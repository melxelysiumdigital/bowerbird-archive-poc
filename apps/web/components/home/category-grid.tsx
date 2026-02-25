const categories = [
  { period: '1700S', label: 'ENLIGHTENMENT' },
  { period: '1800S', label: 'INDUSTRIAL REVOLUTION' },
  { period: '1920S', label: 'JAZZ AGE & NOIR' },
  { period: 'POST-WAR', label: 'MODERN ARCHIVE' },
];

export function CategoryGrid() {
  return (
    <section className="mt-16 bg-muted py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="mb-12 text-sm font-bold uppercase tracking-[0.3em] text-accent-gold">
          Browse by Era
        </h2>
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {categories.map((cat) => (
            <div
              key={cat.period}
              className="group cursor-pointer bg-background py-12 transition-colors hover:bg-background"
            >
              <h4 className="text-xl font-bold tracking-widest transition-colors group-hover:text-primary">
                {cat.period}
              </h4>
              <p className="mt-2 text-xs text-muted-foreground">{cat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
