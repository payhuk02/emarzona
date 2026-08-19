type Props = {
  src: string;
  alt: string;
  accent: string;
};

export function MarketingHeroVisual({ src, alt, accent }: Props) {
  return (
    <div
      className="lp-marketing-hero-visual relative z-10 w-full min-w-0"
      role="img"
      aria-label={alt}
      style={{
        aspectRatio: '4 / 3',
        width: '100%',
        minHeight: '16rem',
        borderRadius: '1rem',
        overflow: 'hidden',
        backgroundColor: '#121218',
        backgroundImage: src ? `url("${src}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: `0 0 80px ${accent}30`,
      }}
    />
  );
}
