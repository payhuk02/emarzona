import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductAnalyticsTab } from '../ProductAnalyticsTab';
import { TooltipProvider } from '@/components/ui/tooltip';

// Helper pour wrapper avec TooltipProvider
const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

// Mock des hooks personnalisés
vi.mock('@/hooks/useProductAnalytics', () => ({
  useProductAnalytics: vi.fn(() => ({
    analytics: {
      views: 1234,
      clicks: 567,
      conversions: 89,
      revenue: 125000,
      total_revenue: 125000,
      conversion_rate: 7.2,
      avg_time_on_page: 180,
      bounce_rate: 32.5,
      avg_session_duration: 245,
      avg_pages_per_session: 3.8
    },
    loading: false,
    error: null,
    isRealTimeActive: false,
    setIsRealTimeActive: vi.fn(),
    updateAnalytics: vi.fn(),
    changePercentages: {
      views: 15.2,
      clicks: 8.5,
      conversions: -3.1,
      revenue: 22.4,
      conversion_rate: 5.3
    }
  })),
  useAnalyticsTracking: vi.fn(() => ({
    trackView: vi.fn(),
    trackClick: vi.fn(),
    trackConversion: vi.fn(),
    trackCustomEvent: vi.fn()
  })),
  useAnalyticsHistory: vi.fn(() => ({
    dailyData: [
      { date: '2025-01-01', views: 100, clicks: 50, conversions: 10, revenue: 5000 },
      { date: '2025-01-02', views: 120, clicks: 60, conversions: 12, revenue: 6000 }
    ],
    loading: false
  }))
}));

// Mock du hook useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Mock des composants de graphiques (qui peuvent avoir des dépendances complexes)
vi.mock('@/components/analytics/AnalyticsCharts', () => ({
  AnalyticsChart: () => <div data-testid="analytics-chart">Analytics Chart</div>,
  TrafficSourceChart: () => <div data-testid="traffic-source-chart">Traffic Source Chart</div>,
  RealtimeMetrics: () => <div data-testid="realtime-metrics">Realtime Metrics</div>
}));

vi.mock('@/components/analytics/ReportsSection', () => ({
  ReportsSection: () => <div data-testid="reports-section">Reports Section</div>
}));

describe('ProductAnalyticsTab', () => {
  const defaultFormData = {
    id: 'product-123',
    tracking_enabled: false,
    track_views: false,
    track_clicks: false,
    track_conversions: false,
    track_time_spent: false,
    track_errors: false,
    advanced_tracking: false,
    custom_events: [],
    google_analytics_id: '',
    facebook_pixel_id: '',
    google_tag_manager_id: '',
    tiktok_pixel_id: '',
    pinterest_pixel_id: '',
    linkedin_insight_tag: '',
    goal_views: null,
    goal_revenue: null,
    goal_conversions: null,
    goal_conversion_rate: null,
    email_alerts: false
  };

  const updateFormData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et la description', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Analytics & Tracking')).toBeInTheDocument();
    expect(screen.getByText('Surveillez les performances de votre produit en temps réel')).toBeInTheDocument();
  });

  it('affiche les métriques principales (vues, clics, conversions, revenus)', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('1 234')).toBeInTheDocument(); // Views
    expect(screen.getByText('567')).toBeInTheDocument(); // Clicks
    expect(screen.getByText('89')).toBeInTheDocument(); // Conversions
    expect(screen.getByText('125 000 FCFA')).toBeInTheDocument(); // Revenue
  });

  it('affiche les pourcentages de changement', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('+15.2%')).toBeInTheDocument(); // Views change
    expect(screen.getByText('+8.5%')).toBeInTheDocument(); // Clicks change
  });

  it('affiche le taux de conversion', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('7.2%')).toBeInTheDocument();
  });

  it('affiche le switch pour activer le tracking', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByLabelText('Tracking des événements')).toBeInTheDocument();
  });

  it('appelle updateFormData quand tracking_enabled est activé', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const trackingSwitch = screen.getByLabelText('Tracking des événements');
    fireEvent.click(trackingSwitch);
    
    // Note: Le composant utilise updateAnalytics, pas updateFormData
    expect(updateFormData).toHaveBeenCalled();
  });

  it('affiche les options de tracking', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Tracking des vues')).toBeInTheDocument();
    expect(screen.getByText('Tracking des clics')).toBeInTheDocument();
    expect(screen.getByText('Tracking des achats')).toBeInTheDocument();
    expect(screen.getByText('Tracking du temps passé')).toBeInTheDocument();
    expect(screen.getByText('Tracking des erreurs')).toBeInTheDocument();
  });

  it('appelle updateFormData quand track_views est activé', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const viewsSwitch = screen.getByLabelText('Tracking des vues');
    fireEvent.click(viewsSwitch);
    
    expect(updateFormData).toHaveBeenCalled();
  });

  it('appelle updateFormData quand track_conversions est activé', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const conversionsSwitch = screen.getByLabelText('Tracking des achats');
    fireEvent.click(conversionsSwitch);
    
    expect(updateFormData).toHaveBeenCalled();
  });

  it('affiche les sélecteurs de période (7j, 30j, 90j)', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('7 jours')).toBeInTheDocument();
    expect(screen.getByText('30 jours')).toBeInTheDocument();
    expect(screen.getByText('90 jours')).toBeInTheDocument();
  });

  it('affiche les sélecteurs de type de graphique (ligne, area, bar)', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByLabelText('Graphique en ligne')).toBeInTheDocument();
    expect(screen.getByLabelText('Graphique en aire')).toBeInTheDocument();
    expect(screen.getByLabelText('Graphique en barres')).toBeInTheDocument();
  });

  it('affiche les objectifs avec les champs de saisie', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByLabelText('Objectif de vues')).toBeInTheDocument();
    expect(screen.getByLabelText('Objectif de revenus')).toBeInTheDocument();
    expect(screen.getByLabelText('Objectif de conversions')).toBeInTheDocument();
  });

  it('appelle updateFormData quand goal_views est modifié', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const goalViewsInput = screen.getByLabelText('Objectif de vues');
    fireEvent.change(goalViewsInput, { target: { value: '5000' } });
    
    expect(updateFormData).toHaveBeenCalledWith('goal_views', 5000);
  });

  it('appelle updateFormData quand goal_revenue est modifié', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const goalRevenueInput = screen.getByLabelText('Objectif de revenus');
    fireEvent.change(goalRevenueInput, { target: { value: '200000' } });
    
    expect(updateFormData).toHaveBeenCalledWith('goal_revenue', 200000);
  });

  it('appelle updateFormData quand email_alerts est activé', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const emailAlertsSwitch = screen.getByLabelText('Activer les alertes par e-mail');
    fireEvent.click(emailAlertsSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('email_alerts', true);
  });

  it('affiche les intégrations externes', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Google Analytics')).toBeInTheDocument();
    expect(screen.getByText('Facebook Pixel')).toBeInTheDocument();
    expect(screen.getByText('Google Tag Manager')).toBeInTheDocument();
  });

  it('affiche le bouton pour activer le temps réel', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    // Le bouton affiche "Démarrer" quand le temps réel est inactif
    expect(screen.getByText('Démarrer')).toBeInTheDocument();
  });

  it('affiche le graphique d\'analytics', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
  });

  it('affiche le graphique des sources de trafic', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByTestId('traffic-source-chart')).toBeInTheDocument();
  });

  it('utilise le dark mode avec les bonnes classes CSS', () => {
    const { container } = renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const cards = container.querySelectorAll('.bg-gray-800\\/50');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('a les attributs ARIA corrects pour l\'accessibilité', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const trackingSwitch = screen.getByLabelText('Activer le tracking des analytics');
    expect(trackingSwitch).toHaveAttribute('aria-label', 'Activer le tracking des analytics');
    
    const viewsSwitch = screen.getByLabelText('Activer le tracking des vues de page');
    expect(viewsSwitch).toHaveAttribute('aria-label', 'Activer le tracking des vues de page');
  });

  it('affiche les icônes correctes pour chaque métrique', () => {
    const { container } = renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(5);
  });

  it('affiche le badge "En hausse" pour les changements positifs', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const positiveChanges = screen.getAllByText(/\+\d+\.\d+%/);
    expect(positiveChanges.length).toBeGreaterThan(0);
  });

  it('gère correctement les objectifs null', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const goalViewsInput = screen.getByLabelText('Objectif de vues');
    expect(goalViewsInput).toHaveValue(null);
  });

  it('gère correctement les objectifs avec des valeurs', () => {
    const formDataWithGoals = {
      ...defaultFormData,
      goal_views: 5000,
      goal_revenue: 200000,
      goal_conversions: 100
    };
    
    renderWithTooltip(<ProductAnalyticsTab formData={formDataWithGoals} updateFormData={updateFormData} />);
    
    expect(screen.getByLabelText('Objectif de vues')).toHaveValue(5000);
    expect(screen.getByLabelText('Objectif de revenus')).toHaveValue(200000);
    expect(screen.getByLabelText('Objectif de conversions')).toHaveValue(100);
  });

  it('affiche l\'option advanced_tracking', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Tracking avancé')).toBeInTheDocument();
  });

  it('appelle updateFormData quand advanced_tracking est activé', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const advancedSwitch = screen.getByLabelText('Activer le tracking avancé');
    fireEvent.click(advancedSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('advanced_tracking', true);
  });

  it('affiche les onglets Statistiques et Rapports', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Statistiques')).toBeInTheDocument();
    expect(screen.getByText('Rapports')).toBeInTheDocument();
  });

  it('change d\'onglet quand on clique sur Rapports', () => {
    renderWithTooltip(<ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const rapportsTab = screen.getByText('Rapports');
    fireEvent.click(rapportsTab);
    
    expect(screen.getByTestId('reports-section')).toBeInTheDocument();
  });
});

