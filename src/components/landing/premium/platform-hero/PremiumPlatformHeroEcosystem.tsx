import { useEffect, useState } from 'react';
import {
  Package,
  Laptop,
  ConciergeBell,
  GraduationCap,
  Palette,
  Users,
  Link2,
  Megaphone,
  Target,
  UserRound,
  Wallet,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface GlassCardProps {
  icon: LucideIcon;
  title: string;
  detail?: string;
  accent?: 'blue' | 'gold';
  className: string;
}

function GlassCard({ icon: Icon, title, detail, accent = 'blue', className }: GlassCardProps) {
  return (
    <div className={`lp-eco-card ${className}${accent === 'gold' ? ' lp-eco-card--gold' : ''}`}>
      <div className="lp-eco-card__icon">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      </div>
      <div className="lp-eco-card__body">
        <p className="lp-eco-card__title">{title}</p>
        {detail ? <p className="lp-eco-card__detail">{detail}</p> : null}
      </div>
    </div>
  );
}

function StaticEcosystem() {
  const { t } = useLandingPremiumT();

  return (
    <div className="lp-eco-static grid grid-cols-2 gap-2 sm:gap-3">
      <GlassCard
        icon={Laptop}
        title={t('platformHero.checks.digital')}
        detail={t('platformHero.ecosystem.digitalDetail')}
        className="lp-eco-static__item"
      />
      <GlassCard
        icon={Wallet}
        title={t('platformHero.ecosystem.saleGenerated')}
        detail={t('platformHero.ecosystem.commission')}
        accent="gold"
        className="lp-eco-static__item"
      />
      <GlassCard
        icon={BarChart3}
        title={t('platformHero.ecosystem.stats')}
        detail={t('platformHero.ecosystem.statsHint')}
        className="lp-eco-static__item"
      />
    </div>
  );
}

export function PremiumPlatformHeroEcosystem() {
  const { t } = useLandingPremiumT();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Mobile : pas de cartes (évite le clignotement iOS/Android).
  if (isMobile) {
    return null;
  }

  if (reducedMotion || !hydrated) {
    return (
      <div className="lp-platform-hero__ecosystem lp-platform-hero__ecosystem--static" aria-hidden>
        <StaticEcosystem />
      </div>
    );
  }

  return (
    <div className="lp-platform-hero__ecosystem" aria-hidden>
      {/* 5 types de commerce */}
      <GlassCard
        icon={Package}
        title={t('platformHero.checks.physical')}
        detail={t('platformHero.ecosystem.physicalDetail')}
        className="lp-eco-card--physical"
      />
      <GlassCard
        icon={Laptop}
        title={t('platformHero.checks.digital')}
        detail={t('platformHero.ecosystem.digitalDetail')}
        className="lp-eco-card--digital"
      />
      <GlassCard
        icon={ConciergeBell}
        title={t('platformHero.checks.service')}
        detail={t('platformHero.ecosystem.serviceDetail')}
        className="lp-eco-card--service"
      />
      <GlassCard
        icon={GraduationCap}
        title={t('platformHero.checks.courses')}
        detail={t('platformHero.ecosystem.coursesDetail')}
        className="lp-eco-card--courses"
      />
      <GlassCard
        icon={Palette}
        title={t('platformHero.checks.artist')}
        detail={t('platformHero.ecosystem.artistDetail')}
        className="lp-eco-card--artist"
      />

      {/* Parrainage */}
      <div className="lp-eco-scene lp-eco-scene--referral">
        <div className="lp-eco-node">
          <UserRound className="h-3.5 w-3.5" aria-hidden />
          <span>{t('platformHero.ecosystem.you')}</span>
        </div>
        <div className="lp-eco-line lp-eco-line--vertical" />
        <div className="lp-eco-node">
          <Users className="h-3.5 w-3.5" aria-hidden />
          <span>{t('platformHero.ecosystem.referral')}</span>
        </div>
        <div className="lp-eco-badge lp-eco-badge--gold">
          {t('platformHero.ecosystem.commission')}
        </div>
        <p className="lp-eco-notice">{t('platformHero.ecosystem.commissionGenerated')}</p>
      </div>

      {/* Affiliation */}
      <div className="lp-eco-scene lp-eco-scene--affiliate">
        <div className="lp-eco-flow">
          {[
            t('platformHero.ecosystem.affiliate'),
            t('platformHero.ecosystem.product'),
            t('platformHero.ecosystem.sale'),
            t('platformHero.ecosystem.commissionShort'),
          ].map((label, i) => (
            <span key={label} className="lp-eco-flow__step">
              {i > 0 ? <span className="lp-eco-flow__arrow" aria-hidden /> : null}
              {label}
            </span>
          ))}
        </div>
        <div className="lp-eco-flow-glow" />
        <p className="lp-eco-notice">{t('platformHero.ecosystem.saleGenerated')}</p>
      </div>

      {/* Marketing tools */}
      <GlassCard
        icon={BarChart3}
        title={t('platformHero.ecosystem.stats')}
        className="lp-eco-card--mkt-stats"
      />
      <GlassCard
        icon={Megaphone}
        title={t('platformHero.ecosystem.promotions')}
        className="lp-eco-card--mkt-promo"
      />
      <GlassCard
        icon={Target}
        title={t('platformHero.ecosystem.marketing')}
        className="lp-eco-card--mkt-target"
      />
      <GlassCard
        icon={Link2}
        title={t('platformHero.ecosystem.affiliateLinks')}
        className="lp-eco-card--mkt-links"
      />
      <GlassCard
        icon={UserRound}
        title={t('platformHero.ecosystem.clients')}
        className="lp-eco-card--mkt-clients"
      />
      <GlassCard
        icon={Wallet}
        title={t('platformHero.ecosystem.revenue')}
        className="lp-eco-card--mkt-revenue"
      />
      <GlassCard
        icon={ShoppingBag}
        title={t('platformHero.ecosystem.orders')}
        className="lp-eco-card--mkt-orders"
      />

      {/* Paiement */}
      <div className="lp-eco-scene lp-eco-scene--payment">
        <p className="lp-eco-scene__title">{t('platformHero.ecosystem.paymentReceived')}</p>
        <p className="lp-eco-scene__meta">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {t('platformHero.ecosystem.securePayment')}
        </p>
      </div>

      {/* Commande */}
      <div className="lp-eco-scene lp-eco-scene--order">
        <p className="lp-eco-scene__title">{t('platformHero.ecosystem.newOrder')}</p>
        <p className="lp-eco-scene__meta">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {t('platformHero.ecosystem.orderConfirmed')}
        </p>
      </div>

      {/* Stats dashboard */}
      <div className="lp-eco-scene lp-eco-scene--dashboard">
        <p className="lp-eco-scene__label">{t('platformHero.ecosystem.sales')}</p>
        <p className="lp-eco-scene__value">{t('platformHero.ecosystem.sampleRevenue')}</p>
        <div className="lp-eco-sparkline" />
        <p className="lp-eco-scene__delta">{t('platformHero.ecosystem.sampleGrowth')}</p>
        <p className="lp-eco-scene__disclaimer">{t('platformHero.ecosystem.illustrative')}</p>
      </div>

      {/* Convergence finale */}
      <div className="lp-eco-scene lp-eco-scene--convergence">
        <CreditCard className="h-4 w-4 opacity-80" aria-hidden />
        <p className="lp-eco-scene__brand">Emarzona</p>
        <p className="lp-eco-scene__tagline">{t('platformHero.ecosystem.tagline')}</p>
      </div>
    </div>
  );
}
