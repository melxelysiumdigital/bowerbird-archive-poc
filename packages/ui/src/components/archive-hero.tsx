import { ArrowRight } from 'lucide-react';

import { cn } from '../lib/utils';

import { Button } from './button';

export interface ArchiveHeroProps {
  tagline?: string;
  headingLine1?: string;
  headingLine2?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  imageUrl?: string;
  className?: string;
  /** Render a custom link element (e.g. Next.js Link). Receives href, className, and children. */
  renderLink?: (props: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => React.ReactNode;
}

function DefaultLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function ArchiveHero({
  tagline = 'Est. 1924 Archives',
  headingLine1 = 'The Archive',
  headingLine2 = 'Awaits.',
  description = 'Preserving human history through a curated collection of premium historical documents, original manuscripts, and archival treasures from the 17th century to the modern era.',
  primaryCtaText = 'Shop Collection',
  primaryCtaUrl = '/search',
  secondaryCtaText = 'Collection',
  secondaryCtaUrl = '/search',
  imageUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuByfj7tNPyq6Mj1ZK_cvDWxSt2HfefIuA6Je1jjQV_dkw8lSglKWNVJSzdLoN5A-lSPRRpvCC5A3wKw9AoVG6CWm4vs00ekL0Bln4gG0wArGc8TsH_ANb28sOt1ucXpJymEhW0oMndC2YfRTAc58gTDZrrcQ7lmWKcqrSVSwY6ViCnfg8gyErz1I0pQHV6VEcKf8caoWRoucNAnfFJ0dkV6owkLFrDMhyQgVeGxEEGhqwAiio0g-ErhEJARAVzrUXUZXtnesnxcGr8',
  className,
  renderLink,
}: ArchiveHeroProps) {
  const LinkComponent = renderLink ?? DefaultLink;

  return (
    <section
      className={cn(
        'relative flex min-h-[calc(100vh-80px)] flex-col overflow-hidden lg:flex-row',
        className,
      )}
    >
      <div className="flex flex-1 flex-col justify-center space-y-6 px-5 py-10 sm:space-y-8 sm:px-6 sm:py-16 lg:px-24">
        <div className="space-y-4">
          {tagline && (
            <span className="text-accent-gold text-xs font-bold tracking-[0.3em] uppercase">
              {tagline}
            </span>
          )}
          <h1 className="text-3xl leading-[1.1] font-black tracking-tight sm:text-5xl lg:text-7xl">
            {headingLine1} <br />
            <span className="text-primary font-serif italic">{headingLine2}</span>
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-md text-base leading-relaxed font-light sm:text-lg">
              {description}
            </p>
          )}
        </div>
        {(primaryCtaText || secondaryCtaText) && (
          <div className="flex flex-wrap gap-4 pt-4">
            {primaryCtaText && primaryCtaUrl && (
              <Button size="lg" asChild>
                {LinkComponent({
                  href: primaryCtaUrl,
                  className: 'group gap-2',
                  children: (
                    <>
                      {primaryCtaText}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </>
                  ),
                })}
              </Button>
            )}
            {secondaryCtaText && secondaryCtaUrl && (
              <Button variant="outline" size="lg" asChild>
                {LinkComponent({ href: secondaryCtaUrl, children: secondaryCtaText })}
              </Button>
            )}
          </div>
        )}
      </div>
      {imageUrl && (
        <div className="relative min-h-[280px] flex-1 sm:min-h-[400px] lg:min-h-full">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          >
            <div className="bg-primary/10 absolute inset-0 mix-blend-multiply" />
            <div className="from-background absolute inset-0 hidden bg-gradient-to-r via-transparent to-transparent lg:block" />
          </div>
        </div>
      )}
    </section>
  );
}
