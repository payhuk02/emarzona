import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Package, Monitor, Briefcase, GraduationCap, Palette } from 'lucide-react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import heroGlobeWebp from '@/assets/landing/hero-globe.webp';
import heroGlobeWebpSm from '@/assets/landing/hero-globe-320.webp';
import heroGlobePng from '@/assets/landing/hero-globe.png';

type OrbitType = 'physical' | 'digital' | 'service' | 'course' | 'artist';

const orbitProducts: {
  type: OrbitType;
  icon: typeof Package;
  image: string;
  angle: number;
  delay: number;
}[] = [
  {
    type: 'physical',
    icon: Package,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&auto=format&fit=crop',
    angle: 0,
    delay: 0,
  },
  {
    type: 'digital',
    icon: Monitor,
    image:
      'https://images.unsplash.com/photo-1544716278-e513176f20b5?w=400&q=80&auto=format&fit=crop',
    angle: 72,
    delay: 1.2,
  },
  {
    type: 'service',
    icon: Briefcase,
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80&auto=format&fit=crop',
    angle: 144,
    delay: 2.4,
  },
  {
    type: 'course',
    icon: GraduationCap,
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80&auto=format&fit=crop',
    angle: 216,
    delay: 3.6,
  },
  {
    type: 'artist',
    icon: Palette,
    image:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a6?w=400&q=80&auto=format&fit=crop',
    angle: 288,
    delay: 4.8,
  },
];

function useOrbitRadius() {
  const [radius, setRadius] = useState(108);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setRadius(w < 380 ? 92 : w < 640 ? 108 : w < 1024 ? 140 : 168);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return radius;
}

function OrbitCard({
  item,
  label,
  reducedMotion,
  radius,
}: {
  item: (typeof orbitProducts)[0];
  label: string;
  reducedMotion: boolean;
  radius: number;
}) {
  const rad = (item.angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <div
      className="absolute left-1/2 top-1/2 z-20 w-[88px] min-[380px]:w-[96px] sm:w-[108px] lg:w-[118px]"
      style={{
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      }}
    >
      <motion.div
        className="w-full"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={
          reducedMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: [0, 0, 1, 1, 1, 0, 0],
                scale: [0.82, 0.82, 1, 1, 1, 0.82, 0.82],
                y: [8, 8, 0, 0, 0, 8, 8],
              }
        }
        transition={
          reducedMotion
            ? { duration: 0.3 }
            : {
                duration: 6,
                delay: item.delay,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.08, 0.18, 0.45, 0.55, 0.82, 1],
              }
        }
      >
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#12121a]/90 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={item.image}
              alt={label}
              className="h-full w-full object-cover"
              loading="lazy"
              width={236}
              height={177}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/90 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-sm">
              <item.icon className="h-3 w-3 text-[var(--lp-gold)]" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">
                {label}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PremiumCompassHeroVisual() {
  const { t } = useLandingPremiumT();
  const reducedMotion = useReducedMotion();
  const orbitRadius = useOrbitRadius();

  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,300px)] min-[380px]:max-w-[min(100%,360px)] sm:max-w-[min(100%,440px)] lg:max-w-[min(100%,520px)] aspect-square items-center justify-center">
      <div
        className="lp-compass-glow pointer-events-none absolute inset-[8%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(124,92,255,0.08) 40%, transparent 70%)',
        }}
      />

      {/* Anneau flèches — rotation lente */}
      <motion.div
        className="absolute inset-[6%] flex items-center justify-center"
        animate={reducedMotion ? {} : { rotate: 360 }}
        transition={reducedMotion ? {} : { duration: 48, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
          <circle
            cx="200"
            cy="200"
            r="178"
            fill="none"
            stroke="rgba(201,162,39,0.2)"
            strokeWidth="1"
            strokeDasharray="4 12"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <g key={deg} transform={`rotate(${deg} 200 200)`}>
              <path d="M200 28 L206 48 L194 48 Z" fill="rgba(201,162,39,0.55)" />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* Anneau intermédiaire — sens inverse */}
      <motion.div
        className="absolute inset-[18%] flex items-center justify-center"
        animate={reducedMotion ? {} : { rotate: -360 }}
        transition={reducedMotion ? {} : { duration: 72, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 300 300" className="h-full w-full" aria-hidden>
          <circle
            cx="150"
            cy="150"
            r="130"
            fill="none"
            stroke="rgba(124,92,255,0.15)"
            strokeWidth="1"
          />
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <g key={deg} transform={`rotate(${deg} 150 150)`}>
              <circle cx="150" cy="24" r="3" fill="rgba(167,139,250,0.5)" />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* Globe terrestre — rotation 3D optimisée */}
      <div
        className="relative z-10 flex h-[46%] w-[46%] min-h-[148px] min-w-[148px] items-center justify-center"
        style={{ perspective: 900 }}
      >
        <motion.div
          className="lp-hero-globe relative aspect-square h-full w-full"
          animate={reducedMotion ? {} : { rotateY: 360 }}
          transition={reducedMotion ? {} : { duration: 28, repeat: Infinity, ease: 'linear' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <picture className="block h-full w-full">
            <source media="(max-width: 640px)" srcSet={heroGlobeWebpSm} type="image/webp" />
            <source srcSet={heroGlobeWebp} type="image/webp" />
            <img
              src={heroGlobePng}
              alt={t('compass.globeAlt')}
              className="lp-hero-globe__img h-full w-full object-cover"
              width={560}
              height={560}
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </picture>
        </motion.div>
      </div>

      {/* Produits en orbite */}
      <div className="absolute inset-0">
        {orbitProducts.map(item => (
          <OrbitCard
            key={item.type}
            item={item}
            label={t(`compass.orbit.${item.type}`)}
            reducedMotion={!!reducedMotion}
            radius={orbitRadius}
          />
        ))}
      </div>
    </div>
  );
}
