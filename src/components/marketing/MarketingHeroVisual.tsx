import { SmartImage } from '@/components/images/SmartImage';

type Props = {
  src: string;
  alt: string;
  accent: string;
};

/**
 * Visuel hero marketing (solutions / features) — img optimisée, pas de CSS background.
 */
export function MarketingHeroVisual({ src, alt, accent }: Props) {
  return (
    <div
      className="lp-marketing-hero-visual relative z-10 w-full min-w-0 overflow-hidden rounded-2xl"
      style={{
        aspectRatio: '4 / 3',
        width: '100%',
        minHeight: '16rem',
        backgroundColor: '#121218',
        boxShadow: `0 0 80px ${accent}30`,
      }}
    >
      <SmartImage
        src={src}
        alt={alt}
        priority
        width={1100}
        height={825}
        quality={75}
        resize="cover"
        sizes="(max-width: 1023px) 100vw, 42vw"
        srcSetWidths={[430, 640, 900, 1100]}
        wrapperClassName="absolute inset-0 h-full w-full"
        className="absolute inset-0 h-full w-full object-cover"
        placeholder="skeleton"
      />
    </div>
  );
}
