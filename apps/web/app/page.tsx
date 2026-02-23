import { APP_NAME } from '@bowerbird-poc/shared';
import { Button } from '@bowerbird-poc/ui/components/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">{APP_NAME}</h1>
      <p className="text-muted-foreground">Welcome to the Bowerbird Archive POC</p>
      <Button>Get Started</Button>
    </main>
  );
}
