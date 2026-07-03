import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
  /** Titre affiché en cas d’erreur de rendu du widget */
  title?: string;
};

type State = { hasError: boolean };

/**
 * Isole les erreurs de rendu d’un bloc dashboard (graphiques, analytics)
 * sans faire planter toute la page.
 */
export class DashboardWidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DashboardWidgetErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="dashboard-premium-panel flex flex-col items-center justify-center gap-3 min-h-[160px] p-6 text-center"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {this.props.title ?? 'Impossible d’afficher cette section.'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Réessayer
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
