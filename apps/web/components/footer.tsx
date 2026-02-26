import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="font-serif text-lg font-bold">Bowerbird Archive</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              Preserving and providing access to Australia&apos;s historical records. Browse,
              purchase, and request digitisation of archival materials.
            </p>
          </div>
          <div>
            <h4 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              Explore
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/search" className="hover:text-primary text-sm">
                  Browse Collection
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-primary text-sm">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              Support
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-muted-foreground text-sm">Contact Support</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Return Policy</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6">
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Bowerbird Archive. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
