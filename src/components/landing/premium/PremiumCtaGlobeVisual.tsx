import { motion, useReducedMotion } from 'framer-motion';
import ctaGlobePng from '@/assets/landing/cta-globe.png';

/** Globe terrestre + flèches curvilignes pour le CTA final */
export function PremiumCtaGlobeVisual() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="lp-cta-globe relative mx-auto aspect-square w-full max-w-[min(92vw,340px)] sm:max-w-[380px] lg:max-w-[400px]"
      aria-hidden
    >
      <div className="lp-cta-globe-halo pointer-events-none absolute inset-[4%] rounded-full" />

      {/* Flèches curvilignes — derrière le globe */}
      <motion.div
        className="lp-cta-globe-arrows absolute inset-0 z-10 flex items-center justify-center"
        animate={reducedMotion ? {} : { rotate: 360 }}
        transition={reducedMotion ? {} : { duration: 42, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
          <defs>
            <marker
              id="lp-cta-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="rgba(96,165,250,0.95)" />
            </marker>
            <marker
              id="lp-cta-arrow-gold"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="rgba(234,179,8,0.95)" />
            </marker>
          </defs>
          {[
            { d: 'M 200 42 A 158 158 0 0 1 358 200', marker: 'lp-cta-arrow-gold' },
            { d: 'M 358 200 A 158 158 0 0 1 200 358', marker: 'lp-cta-arrow' },
            { d: 'M 200 358 A 158 158 0 0 1 42 200', marker: 'lp-cta-arrow-gold' },
            { d: 'M 42 200 A 158 158 0 0 1 200 42', marker: 'lp-cta-arrow' },
          ].map((arc, i) => (
            <path
              key={i}
              d={arc.d}
              fill="none"
              stroke={i % 2 === 0 ? 'rgba(234,179,8,0.55)' : 'rgba(96,165,250,0.6)'}
              strokeWidth="2.5"
              strokeLinecap="round"
              markerEnd={`url(#${arc.marker})`}
            />
          ))}
        </svg>
      </motion.div>

      <motion.div
        className="lp-cta-globe-arrows-inner absolute inset-[12%] z-10 flex items-center justify-center"
        animate={reducedMotion ? {} : { rotate: -360 }}
        transition={reducedMotion ? {} : { duration: 56, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 300 300" className="h-full w-full opacity-80" aria-hidden>
          <path
            d="M 150 28 A 122 122 0 0 1 272 150"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
            strokeDasharray="6 10"
          />
          <path
            d="M 272 150 A 122 122 0 0 1 150 272"
            fill="none"
            stroke="rgba(234,179,8,0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 10"
          />
          <path
            d="M 150 272 A 122 122 0 0 1 28 150"
            fill="none"
            stroke="rgba(96,165,250,0.45)"
            strokeWidth="1.5"
            strokeDasharray="6 10"
          />
          <path
            d="M 28 150 A 122 122 0 0 1 150 28"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
            strokeDasharray="6 10"
          />
        </svg>
      </motion.div>

      {/* Globe — rotation 2D (toujours visible sur mobile) */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <motion.div
          className="lp-cta-globe-sphere relative aspect-square h-[70%] w-[70%] min-h-[200px] min-w-[200px] sm:min-h-[220px] sm:min-w-[220px]"
          animate={reducedMotion ? {} : { rotate: 360 }}
          transition={reducedMotion ? {} : { duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          <img
            src={ctaGlobePng}
            alt=""
            className="lp-cta-globe__img h-full w-full rounded-full object-cover"
            width={400}
            height={400}
            loading="eager"
            decoding="async"
          />
        </motion.div>
      </div>
    </div>
  );
}
