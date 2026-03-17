'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@bowerbird-poc/ui/components/avatar';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Input } from '@bowerbird-poc/ui/components/input';
import { Search, ShoppingBag, User, LogIn, Menu, X, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SearchFormProps {
  className?: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function SearchForm({ className, searchInput, onSearchInputChange, onSubmit }: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Search the archive..."
          className="pl-9"
        />
      </div>
    </form>
  );
}

interface MobileMenuProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function MobileMenu({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onClose,
}: MobileMenuProps) {
  return (
    <div className="border-t px-6 py-4 md:hidden">
      <SearchForm
        className="mb-4"
        searchInput={searchInput}
        onSearchInputChange={onSearchInputChange}
        onSubmit={onSearchSubmit}
      />
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="justify-start" asChild>
          <Link href="/search" onClick={onClose}>
            Browse Collection
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" asChild>
          <Link href="/account/orders" onClick={onClose}>
            Orders
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" asChild>
          <Link href="/account/membership" onClick={onClose}>
            Membership
          </Link>
        </Button>
      </div>
    </div>
  );
}

function DesktopNavLinks() {
  return (
    <div className="hidden items-center gap-1 md:flex">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/search">Browse</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/account/orders">Orders</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/account/membership">Membership</Link>
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" asChild>
        <Link href="/staff">Staff</Link>
      </Button>
    </div>
  );
}

interface NavbarProps {
  onCartClick: () => void;
  onDonateClick: () => void;
  cartCount?: number;
  isAuthenticated?: boolean;
  userAvatar?: string;
  onLoginClick?: () => void;
}

export function Navbar({
  onCartClick,
  onDonateClick,
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
    <header className="border-border/40 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-bold tracking-tight">Bowerbird Archive</span>
        </Link>

        {/* Search — desktop */}
        <SearchForm
          className="hidden max-w-md flex-1 px-8 md:block"
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSubmit={handleSearch}
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DesktopNavLinks />

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

          {/* Donate */}
          <Button variant="ghost" size="icon" onClick={onDonateClick}>
            <Heart className="size-4" />
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
            <ShoppingBag className="size-4" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
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
        <MobileMenu
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearch}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}
