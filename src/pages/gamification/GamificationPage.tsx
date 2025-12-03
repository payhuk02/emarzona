/**
 * Gamification Page
 * Date: 30 Janvier 2025
 * 
 * Page complète pour la gamification (points, badges, achievements, leaderboard)
 */

import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';
import { GamificationErrorBoundary } from '@/components/gamification/GamificationErrorBoundary';
import { Trophy, Menu } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Hamburger Menu - Très visible */}
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50" aria-hidden="true" />
        </button>
        
        {/* Titre avec Icône */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" aria-hidden="true" />
          <h1 className="text-xs sm:text-sm md:text-base font-bold truncate text-gray-900 dark:text-gray-50">
            Gamification
          </h1>
        </div>
      </div>
    </header>
  );
}


export default function GamificationPage() {
  const navigate = useNavigate();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header avec Hamburger et Icône */}
          <MobileHeader />
          
          {/* Contenu principal */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Header - Desktop seulement */}
              <div
                ref={headerRef}
                className="hidden lg:block space-y-2 animate-in fade-in slide-in-from-top-4 duration-700"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Gamification
                  </h1>
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                  Suivez vos points, badges, achievements et votre classement
                </p>
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
                          Erreur de chargement
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

