import { APP_NAME } from '@bowerbird-poc/shared';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">{APP_NAME} — Shopify App</h1>
      <p className="text-muted-foreground">Embedded Shopify application</p>
    </main>
  );
}
