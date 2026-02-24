import { cn } from '../lib/utils';

import { Button } from './button';

export interface HeroBannerProps {
  heading?: string;
  subheading?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  overlayOpacity?: number;
  textAlignment?: 'left' | 'center' | 'right';
}

export function HeroBanner({
  heading,
  subheading,
  imageUrl,
  ctaText,
  ctaUrl,
  overlayOpacity = 40,
  textAlignment = 'center',
}: HeroBannerProps) {
  const sectionJustify = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const contentAlign = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <section
      className={cn(
        'relative flex min-h-[400px] w-full items-center overflow-hidden',
        sectionJustify[textAlignment],
      )}
    >
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />
        </>
      )}

      <div
        className={cn(
          'relative z-10 flex max-w-3xl flex-col gap-4 px-6 py-16',
          contentAlign[textAlignment],
          imageUrl ? 'text-white' : 'text-foreground',
        )}
      >
        {heading && (
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">{heading}</h1>
        )}
        {subheading && <p className="mb-12 text-lg opacity-90 md:text-xl">{subheading}</p>}
        {ctaText && ctaUrl && (
          <div className="mt-2">
            <Button
              asChild
              size="lg"
              variant={imageUrl ? 'secondary' : 'default'}
              className={imageUrl ? 'bg-white text-black hover:bg-white/90' : undefined}
            >
              <a href={ctaUrl}>{ctaText}</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
