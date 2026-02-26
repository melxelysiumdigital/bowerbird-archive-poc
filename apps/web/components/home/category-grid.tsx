const categories = [
  { period: '1700S', label: 'ENLIGHTENMENT' },
  { period: '1800S', label: 'INDUSTRIAL REVOLUTION' },
  { period: '1920S', label: 'JAZZ AGE & NOIR' },
  { period: 'POST-WAR', label: 'MODERN ARCHIVE' },
];

export function CategoryGrid() {
  return (
    <section className="bg-muted mt-16 py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-accent-gold mb-12 text-sm font-bold tracking-[0.3em] uppercase">
          Browse by Era
        </h2>
        <div className="bg-border grid grid-cols-2 gap-px lg:grid-cols-4">
          {categories.map((cat) => (
            <div
              key={cat.period}
              className="group bg-background hover:bg-background cursor-pointer py-12 transition-colors"
            >
              <h4 className="group-hover:text-primary text-xl font-bold tracking-widest transition-colors">
                {cat.period}
              </h4>
              <p className="text-muted-foreground mt-2 text-xs">{cat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
