'use client';

import { Mail } from 'lucide-react';
import type { FormEvent } from 'react';

import { cn } from '../lib/utils';

import { Button } from './button';
import { Input } from './input';

export interface NewsletterSignupProps {
  heading?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  onSubmit?: (email: string) => void;
  className?: string;
}

export function NewsletterSignup({
  heading = 'Join the Inner Circle',
  description = 'Get exclusive first access to new acquisitions, historical deep-dives, and private archive sales.',
  placeholder = 'Email Address',
  buttonText = 'Subscribe',
  onSubmit,
  className,
}: NewsletterSignupProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    if (email) onSubmit?.(email);
  };

  return (
    <section className={cn('mx-auto max-w-5xl px-6 py-24 text-center', className)}>
      <div className="relative overflow-hidden rounded-3xl bg-primary/5 p-12 lg:p-20">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Mail className="size-36" />
        </div>
        <div className="relative z-10 space-y-6">
          <h3 className="text-3xl font-black tracking-tight lg:text-4xl">{heading}</h3>
          <p className="mx-auto max-w-xl text-muted-foreground">{description}</p>
          <form
            className="mx-auto mt-8 flex max-w-lg flex-col gap-4 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <Input
              name="email"
              className="flex-1 rounded-xl border-none px-6 py-4 ring-1 ring-border focus:ring-accent-gold"
              placeholder={placeholder}
              type="email"
              required
            />
            <Button type="submit" className="whitespace-nowrap rounded-xl px-8 py-4">
              {buttonText}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
