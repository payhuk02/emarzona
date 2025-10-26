/**
 * Composants de fallback pour différents niveaux d'erreur
 */

import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  level: 'app' | 'page' | 'section' | 'component';
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  level,
}) => {
  // Erreur au niveau de l'application entière
  if (level === 'app') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-lg w-full p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Oops ! Une erreur s'est produite
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Nous sommes désolés, une erreur inattendue s'est produite. Notre équipe a été notifiée et travaille sur une solution.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto max-h-40">
              <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                {error.toString()}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetError}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              className="flex-1"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Erreur au niveau d'une page
  if (level === 'page') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Cette page ne peut pas être chargée pour le moment. Veuillez réessayer.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-red-600 dark:text-red-400 font-mono overflow-auto max-h-32">
              {error.toString()}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="flex-1"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Erreur au niveau d'une section
  if (level === 'section') {
    return (
      <Card className="p-6 m-4 border-red-200 dark:border-red-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Impossible de charger cette section
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Une erreur s'est produite lors du chargement de cette section.
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <p className="text-xs text-red-600 dark:text-red-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {error.toString()}
              </p>
            )}

            <Button
              onClick={resetError}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Erreur au niveau d'un composant (minimal)
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Erreur de chargement
          </p>
          {process.env.NODE_ENV === 'development' && error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
              {error.message}
            </p>
          )}
        </div>
        <Button
          onClick={resetError}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Composant pour les erreurs 404
 */
export const NotFoundFallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="text-8xl font-bold text-primary/20">404</div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Page introuvable
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => window.history.back()}
            className="flex-1"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Accueil
          </Button>
        </div>
      </Card>
    </div>
  );
};

/**
 * Composant pour les erreurs réseau
 */
export const NetworkErrorFallback: React.FC<{ retry?: () => void }> = ({ retry }) => {
  return (
    <Card className="p-6 m-4 border-orange-200 dark:border-orange-800">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Erreur de connexion
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Impossible de se connecter au serveur. Vérifiez votre connexion internet.
          </p>

          {retry && (
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="w-3 h-3 mr-2" />
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

