/**
 * Gamification Page
 * Date: 30 Janvier 2025
 *
 * Page complète pour la gamification (points, badges, achievements, leaderboard)
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';
import { GamificationErrorBoundary } from '@/components/gamification/GamificationErrorBoundary';
import { Trophy } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';

export default function GamificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              role="banner"
            >
              <div>
                <h1
                  className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"
                  id="gamification-title"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Trophy
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('gamification.title', 'Gamification')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t(
                    'gamification.subtitle',
                    'Suivez vos points, badges, achievements et votre classement'
                  )}
                </p>
              </div>
            </div>

            {/* ErrorBoundary simplifié pour capturer les erreurs avec fallback autonome */}
            <GamificationErrorBoundary
              fallback={
                <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                        {t('errors.generic', 'Erreur de chargement')}
                      </h3>
                      <p className="mb-4 text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        Une erreur s'est produite lors du chargement de la page de gamification.
                      </p>
                      <button
                        onClick={() => navigate(0)}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Recharger la page
                      </button>
                    </div>
                  </div>
                </div>
              }
            >
              <GamificationDashboard />
            </GamificationErrorBoundary>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
