'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@bowerbird-poc/ui/components/avatar';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Input } from '@bowerbird-poc/ui/components/input';
import { Search, ShoppingBag, User, LogIn, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavbarProps {
  onCartClick: () => void;
  cartCount?: number;
  isAuthenticated?: boolean;
  userAvatar?: string;
  onLoginClick?: () => void;
}

export function Navbar({
  onCartClick,
  cartCount = 0,
  isAuthenticated,
  userAvatar,
  onLoginClick,
}: NavbarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold tracking-tight">Bowerbird Archive</span>
        </Link>

        {/* Search — desktop */}
        <form onSubmit={handleSearch} className="hidden max-w-md flex-1 px-8 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search the archive..."
              className="pl-9"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Nav links — desktop */}
          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/search">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders">Orders</Link>
            </Button>
          </div>

          {/* Auth */}
          {isAuthenticated ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account/orders">
                <Avatar className="size-7">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback>
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onLoginClick}>
              <LogIn className="size-4" />
            </Button>
          )}

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
            <ShoppingBag className="size-4" />
            {cartCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
                {cartCount}
              </Badge>
            )}
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t px-6 py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search the archive..."
                className="pl-9"
              />
            </div>
          </form>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href="/search" onClick={() => setMobileMenuOpen(false)}>
                Browse Collection
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)}>
                Orders
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
