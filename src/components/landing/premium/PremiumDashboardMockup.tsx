import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Bell,
  Search,
} from 'lucide-react';

const stats = [
  {
    label: 'Revenus',
    value: '28 549 €',
    trend: '+24%',
    accent: 'from-violet-500/30 to-purple-600/10',
  },
  { label: 'Commandes', value: '1 284', trend: '+12%', accent: 'from-amber-500/20 to-transparent' },
  { label: 'Clients', value: '892', trend: '+8%', accent: 'from-emerald-500/20 to-transparent' },
  { label: 'Conversion', value: '4,2%', trend: '+2%', accent: 'from-sky-500/20 to-transparent' },
];

export function PremiumDashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: -8 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="relative mx-auto w-full max-w-[540px] perspective-[1200px]"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,92,255,0.35) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(201,162,39,0.2) 0%, transparent 55%)',
        }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e12] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-2 border-b border-white/5 bg-[#14141a] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/40">
            <Search className="h-3 w-3" />
            <span>dashboard.emarzona.com</span>
          </div>
          <Bell className="h-4 w-4 text-white/30" />
        </div>

        <div className="flex min-h-[320px]">
          <aside className="hidden w-14 shrink-0 flex-col gap-3 border-r border-white/5 bg-[#0c0c10] p-3 sm:flex">
            {[LayoutDashboard, Package, ShoppingCart, Users, TrendingUp].map((Icon, i) => (
              <div
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${i === 0 ? 'bg-violet-500/25 text-violet-300' : 'text-white/25'}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </aside>

          <div className="flex-1 p-4 sm:p-5">
            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
              Vue d&apos;ensemble
            </p>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {stats.map(s => (
                <div
                  key={s.label}
                  className={`rounded-xl border border-white/5 bg-gradient-to-br ${s.accent} p-3`}
                >
                  <p className="text-[10px] text-white/40">{s.label}</p>
                  <p className="mt-1 font-semibold text-white text-sm sm:text-base">{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-emerald-400/90">{s.trend}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-white/50">Revenus — 30 jours</span>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300">
                  Live
                </span>
              </div>
              <svg viewBox="0 0 400 100" className="h-24 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(124,92,255)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="rgb(124,92,255)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 C40,70 80,55 120,50 160,45 200,35 240,30 280,25 320,20 360,15 400,10 L400,100 L0,100 Z"
                  fill="url(#chartFill)"
                />
                <path
                  d="M0,80 C40,70 80,55 120,50 160,45 200,35 240,30 280,25 320,20 360,15 400,10"
                  fill="none"
                  stroke="rgb(167,139,250)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
