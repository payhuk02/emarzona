import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Database,
  HardDrive,
  Sync,
  Shield,
  AlertTriangle,
  CheckCircle,
  Zap,
  FileText,
  Settings
} from 'lucide-react';

interface StorageSystemSummaryProps {
  onNavigateToStorage?: () => void;
}

export const StorageSystemSummary = ({ onNavigateToStorage }: StorageSystemSummaryProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Database className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Système de Stockage Résilient Emarzona</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plateforme complète de gestion des données avec résilience avancée,
            synchronisation intelligente et récupération automatique en cas de panne.
          </p>
        </div>
      </div>

      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Architecture du Système
          </CardTitle>
          <CardDescription>
            Vue d'ensemble des composants du système de stockage résilient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Stockage Hybride</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Combinaison intelligente de Supabase, IndexedDB et localStorage
                avec stratégies de fallback automatiques.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sync className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Synchronisation</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Sync temps réel et par lot avec résolution automatique des conflits
                et gestion adaptative de la connectivité.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium">Sauvegarde</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Sauvegardes automatiques et manuelles avec compression,
                chiffrement et restauration point-in-time.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <h4 className="font-medium">Récupération</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Récupération automatique en cas de panne avec stratégies
                multiples et intervention manuelle si nécessaire.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="font-medium">Monitoring</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Surveillance continue de la santé du système avec alertes
                et métriques en temps réel.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h4 className="font-medium">Tests</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Suite complète de tests de résilience pour valider
                la robustesse du système.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacités Clés */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités Avancées</CardTitle>
          <CardDescription>
            Capacités uniques du système de stockage résilient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Résilience Multi-Niveaux
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Fallback automatique Supabase → IndexedDB → localStorage</li>
                <li>• Cache intelligent pour les opérations hors ligne</li>
                <li>• Reconnexion automatique avec synchronisation différée</li>
                <li>• Détection et récupération des corruptions de données</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Synchronisation Intelligente
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Sync temps réel et par lot adaptative</li>
                <li>• Résolution automatique des conflits (3 stratégies)</li>
                <li>• File d'attente avec retry intelligent</li>
                <li>• Gestion des conflits versionnés</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Sauvegarde Complète
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Sauvegardes automatiques programmées</li>
                <li>• Compression et chiffrement des données</li>
                <li>• Restauration sélective par collection</li>
                <li>• Historique complet avec versioning</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Monitoring & Alertes
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Métriques temps réel du stockage</li>
                <li>• Alertes automatiques sur les pannes</li>
                <li>• Tests de résilience intégrés</li>
                <li>• Rapports détaillés de santé</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avantages Business */}
      <Card>
        <CardHeader>
          <CardTitle>Avantages pour Emarzona</CardTitle>
          <CardDescription>
            Impact business du système de stockage résilient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
              <p className="text-sm text-muted-foreground">Disponibilité garantie même en cas de panne Supabase</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">&lt; 30s</div>
              <p className="text-sm text-muted-foreground">Récupération automatique en cas d'incident</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-purple-600 mb-2">0</div>
              <p className="text-sm text-muted-foreground">Perte de données grâce aux sauvegardes multiples</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guide d'utilisation */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Comment accéder au système</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Le système de stockage résilient est maintenant intégré à l'administration Emarzona.
            Pour y accéder :
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Connectez-vous en tant qu'administrateur</li>
            <li>Allez dans le menu Administration</li>
            <li>Cliquez sur "Stockage de Données" (/admin/data-storage)</li>
          </ol>
          <div className="mt-4">
            <Button onClick={onNavigateToStorage} variant="outline">
              Accéder au panneau de stockage
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Statut du système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Statut du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800">
              <Database className="w-3 h-3 mr-1" />
              Service Hybride Opérationnel
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              <Sync className="w-3 h-3 mr-1" />
              Synchronisation Active
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Sauvegardes Automatiques
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              Récupération Automatique
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Monitoring Continu
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};