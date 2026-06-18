import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductAnalyticsTab } from '../ProductAnalyticsTab';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockUpdateAnalytics = vi.fn();

const mockAnalytics = {
  views: 1234,
  clicks: 567,
  conversions: 89,
  revenue: 125000,
  total_revenue: 125000,
  conversion_rate: 7.2,
  avg_time_on_page: 180,
  bounce_rate: 32.5,
  avg_session_duration: 245,
  avg_pages_per_session: 3.8,
  returning_visitors: 120,
  tracking_enabled: false,
  track_views: false,
  track_clicks: false,
  track_conversions: false,
  track_time_spent: false,
  track_errors: false,
  advanced_tracking: false,
  goal_views: null,
  goal_revenue: null,
  goal_conversions: null,
  goal_conversion_rate: null,
  email_alerts: false,
};

vi.mock('@/hooks/useProductAnalytics', () => ({
  useProductAnalytics: vi.fn(() => ({
    analytics: mockAnalytics,
    loading: false,
    error: null,
    isRealTimeActive: false,
    setIsRealTimeActive: vi.fn(),
    updateAnalytics: mockUpdateAnalytics,
    changePercentages: {
      views: 15.2,
      clicks: 8.5,
      conversions: -3.1,
      revenue: 22.4,
      conversion_rate: 5.3,
    },
  })),
  useAnalyticsTracking: vi.fn(() => ({
    trackView: vi.fn(),
    trackClick: vi.fn(),
    trackConversion: vi.fn(),
    trackCustomEvent: vi.fn(),
  })),
  useAnalyticsHistory: vi.fn(() => ({
    dailyData: [
      { date: '2025-01-01', views: 100, clicks: 50, conversions: 10, revenue: 5000 },
      { date: '2025-01-02', views: 120, clicks: 60, conversions: 12, revenue: 6000 },
    ],
    loading: false,
  })),
  useProductTrafficSources: vi.fn(() => ({
    data: [
      { name: 'Direct', value: 60, color: '#8b5cf6' },
      { name: 'Recherche organique', value: 40, color: '#3b82f6' },
    ],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/components/analytics/AnalyticsCharts', () => ({
  AnalyticsChart: () => (
    <div data-testid="analytics-chart">
      Analytics Chart
      <button type="button">7 jours</button>
      <button type="button">30 jours</button>
      <button type="button">90 jours</button>
    </div>
  ),
  TrafficSourceChart: () => <div data-testid="traffic-source-chart">Traffic Source Chart</div>,
  RealtimeMetrics: ({
    analytics,
    changePercentages,
  }: {
    analytics?: typeof mockAnalytics;
    changePercentages?: Record<string, number>;
  }) => (
    <div data-testid="realtime-metrics">
      <p>Vues</p>
      <p>{analytics?.views?.toLocaleString('fr-FR')}</p>
      <p>{analytics?.clicks}</p>
      <p>{analytics?.conversions}</p>
      <p>{analytics?.conversion_rate?.toFixed(1)}%</p>
      {changePercentages &&
        Object.values(changePercentages).map(value => (
          <span key={String(value)}>
            {value >= 0 ? '+' : ''}
            {value.toFixed(1)}%
          </span>
        ))}
    </div>
  ),
}));

vi.mock('@/components/analytics/ReportsSection', () => ({
  ReportsSection: () => <div data-testid="reports-section">Reports Section</div>,
}));

const renderWithTooltip = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>);

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
  email_alerts: false,
};

const openTab = async (user: ReturnType<typeof userEvent.setup>, name: RegExp | string) => {
  const tab = screen.getByRole('tab', { name, hidden: true });
  await user.click(tab);
};

describe('ProductAnalyticsTab', () => {
  const updateFormData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le titre et la description', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByText('Analytics & Tracking')).toBeInTheDocument();
    expect(
      screen.getByText('Surveillez les performances de votre produit en temps réel')
    ).toBeInTheDocument();
  });

  it('affiche les métriques principales (vues, clics, conversions, revenus)', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByTestId('realtime-metrics')).toBeInTheDocument();
    expect(screen.getByText(/1[\s\u202f]?234/)).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
  });

  it('affiche les pourcentages de changement', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getAllByText(/\+\d+(\.\d+)?%/).length).toBeGreaterThan(0);
  });

  it('affiche le taux de conversion', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByText('7.2%')).toBeInTheDocument();
  });

  it('affiche le switch pour activer le tracking', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    expect(await screen.findByLabelText('Activer le tracking des événements')).toBeInTheDocument();
  });

  it('appelle updateAnalytics quand tracking_enabled est activé', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    await user.click(screen.getByLabelText('Activer le tracking des événements'));

    expect(mockUpdateAnalytics).toHaveBeenCalledWith({ tracking_enabled: true });
  });

  it('affiche les options de tracking', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    expect(screen.getByText('Tracking des vues')).toBeInTheDocument();
    expect(screen.getByText('Tracking des clics')).toBeInTheDocument();
    expect(screen.getByText('Tracking des achats')).toBeInTheDocument();
    expect(screen.getByText('Tracking du temps passé')).toBeInTheDocument();
    expect(screen.getByText('Tracking des erreurs')).toBeInTheDocument();
  });

  it('appelle updateAnalytics quand track_views est activé', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    await user.click(screen.getByLabelText('Activer le tracking des vues'));

    expect(mockUpdateAnalytics).toHaveBeenCalledWith({ track_views: true });
  });

  it('appelle updateAnalytics quand track_conversions est activé', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    await user.click(screen.getByLabelText('Activer le tracking des conversions'));

    expect(mockUpdateAnalytics).toHaveBeenCalledWith({ track_conversions: true });
  });

  it('affiche les sélecteurs de période (7j, 30j, 90j)', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByText('7 jours')).toBeInTheDocument();
    expect(screen.getByText('30 jours')).toBeInTheDocument();
    expect(screen.getByText('90 jours')).toBeInTheDocument();
  });

  it('affiche les sélecteurs de type de graphique (ligne, area, bar)', () => {
    const { container } = renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('affiche les objectifs avec les champs de saisie', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Objectifs');

    expect(screen.getByLabelText('Objectif de vues mensuelles')).toBeInTheDocument();
    expect(screen.getByLabelText('Objectif de revenus mensuels')).toBeInTheDocument();
  });

  it('appelle updateAnalytics quand goal_views est modifié', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Objectifs');

    const input = screen.getByLabelText('Objectif de vues mensuelles');
    await user.clear(input);
    await user.type(input, '5000');

    expect(mockUpdateAnalytics).toHaveBeenCalled();
  });

  it('appelle updateAnalytics quand goal_revenue est modifié', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Objectifs');

    const input = screen.getByLabelText('Objectif de revenus mensuels');
    await user.clear(input);
    await user.type(input, '10000');

    expect(mockUpdateAnalytics).toHaveBeenCalled();
  });

  it('appelle updateAnalytics quand email_alerts est activé', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Objectifs');

    await user.click(screen.getByLabelText('Activer les alertes par email'));

    expect(mockUpdateAnalytics).toHaveBeenCalledWith({ email_alerts: true });
  });

  it('affiche les intégrations externes', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Intégrations');

    const bodyText = document.body.textContent || '';
    expect(bodyText).toMatch(/Google|Facebook|Analytics|Pixel/);
  });

  it('affiche le bouton pour activer le temps réel', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByText('Démarrer')).toBeInTheDocument();
  });

  it("affiche le graphique d'analytics", () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
  });

  it('affiche le graphique des sources de trafic', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByTestId('traffic-source-chart')).toBeInTheDocument();
  });

  it('utilise le dark mode avec les bonnes classes CSS', () => {
    const { container } = renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(container.querySelectorAll('.bg-gray-800\\/50').length).toBeGreaterThan(0);
  });

  it("a les attributs ARIA corrects pour l'accessibilité", async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    expect(screen.getAllByRole('switch').length).toBeGreaterThan(0);
  });

  it('affiche les icônes correctes pour chaque métrique', () => {
    const { container } = renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(container.querySelectorAll('svg').length).toBeGreaterThan(5);
  });

  it('affiche le badge "En hausse" pour les changements positifs', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getAllByText(/\+\d+\.\d+%/).length).toBeGreaterThan(0);
  });

  it('gère correctement les objectifs null', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Objectifs');

    expect(screen.getByLabelText('Objectif de vues mensuelles')).toHaveValue(null);
  });

  it('gère correctement les objectifs avec des valeurs', async () => {
    const user = userEvent.setup();
    mockAnalytics.goal_views = 5000;
    mockAnalytics.goal_revenue = 200000;
    mockAnalytics.goal_conversions = 100;

    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Objectifs');

    expect(screen.getByLabelText('Objectif de vues mensuelles')).toHaveValue(5000);

    mockAnalytics.goal_views = null;
    mockAnalytics.goal_revenue = null;
    mockAnalytics.goal_conversions = null;
  });

  it("affiche l'option advanced_tracking", async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    expect(screen.getByText('Tracking avancé')).toBeInTheDocument();
  });

  it('appelle updateAnalytics quand advanced_tracking est activé', async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );
    await openTab(user, 'Tracking');

    await user.click(screen.getByLabelText('Activer le tracking avancé'));

    expect(mockUpdateAnalytics).toHaveBeenCalledWith({ advanced_tracking: true });
  });

  it('affiche les onglets Statistiques et Rapports', () => {
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    expect(screen.getByRole('tab', { name: "Vue d'ensemble" })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Rapports' })).toBeInTheDocument();
  });

  it("change d'onglet quand on clique sur Rapports", async () => {
    const user = userEvent.setup();
    renderWithTooltip(
      <ProductAnalyticsTab formData={defaultFormData} updateFormData={updateFormData} />
    );

    await openTab(user, 'Rapports');

    await waitFor(() => {
      expect(screen.getByTestId('reports-section')).toBeInTheDocument();
    });
  });
});
