/**
 * AI Chatbot Demo Page
 * Page de démonstration pour tester le chatbot IA
 * Date: Janvier 2026
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AIChatbotWrapper } from '@/components/ai/AIChatbotWrapper';
import { MessageCircle, Bot, Zap, Users, ShoppingCart, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIChatbotDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Assistant IA Emarzona
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez notre chatbot IA intelligent qui révolutionne l'expérience client
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-primary" />
                <CardTitle>Support 24/7</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Assistance instantanée pour vos questions sur commandes, livraisons et retours.
                Disponible 24h/24, 7j/7.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-primary" />
                <CardTitle>Recommandations IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Suggestions personnalisées basées sur vos préférences et historique d'achat.
                Découvrez de nouveaux produits adaptés à vos goûts.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                <CardTitle>Réponses Instantanées</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Temps de réponse ultra-rapide grâce à notre système d'IA avancé.
                Plus besoin d'attendre un conseiller humain.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <CardTitle>Actions Proactives</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Le chatbot peut initier des conversations pour vous aider :
                rappels de commandes, suggestions de produits, offres spéciales.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-primary" />
                <CardTitle>Apprentissage Continu</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Le système apprend de chaque interaction pour améliorer ses réponses.
                Vos feedbacks nous aident à perfectionner l'expérience.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="w-6 h-6 p-0 flex items-center justify-center text-primary bg-primary/10" />
                <CardTitle>Multilingue</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Support automatique de plusieurs langues grâce à notre système
                de traduction intégré. Communication fluide mondiale.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <Card className="mb-12 border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Testez le Chatbot IA</CardTitle>
            <CardDescription>
              Cliquez sur le bouton en bas à droite pour ouvrir le chatbot et tester ses fonctionnalités
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">💡 Essayez ces commandes :</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <Badge variant="secondary" className="mr-2">Commandes</Badge>
                  <p>"Où en est ma commande ?"</p>
                  <p>"Comment retourner un produit ?"</p>
                  <p>"Informations de livraison"</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="mr-2">Recommandations</Badge>
                  <p>"Quels produits recommandez-vous ?"</p>
                  <p>"Je cherche un cadeau"</p>
                  <p>"Produits populaires"</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline">
                <Link to="/marketplace">
                  Explorer le Marketplace
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/orders">
                  Voir mes Commandes
                </Link>
              </Button>
              <Button asChild>
                <Link to="/products">
                  Créer un Produit
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>🛠️ Fonctionnalités Techniques</CardTitle>
            <CardDescription>
              Technologies et capacités derrière notre chatbot IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">🤖 Intelligence Artificielle</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Analyse d'intention avancée</li>
                  <li>• Apprentissage continu des interactions</li>
                  <li>• Génération de réponses contextuelles</li>
                  <li>• Système de feedback utilisateur</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">⚡ Performance</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Lazy-loading pour optimisation bundle</li>
                  <li>• Cache intelligent des sessions</li>
                  <li>• Réponses en temps réel</li>
                  <li>• Sauvegarde automatique des conversations</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">🔒 Sécurité</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Chiffrement des données utilisateur</li>
                  <li>• Sessions sécurisées</li>
                  <li>• Modération automatique du contenu</li>
                  <li>• Conformité RGPD</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">📊 Analytics</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Taux de satisfaction utilisateur</li>
                  <li>• Métriques de performance</li>
                  <li>• Analyse des intentions</li>
                  <li>• Rapports d'utilisation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à Révolutionner Votre Expérience Client ?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Notre chatbot IA est maintenant disponible sur toute la plateforme Emarzona.
            Il apprend continuellement pour mieux vous servir.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/marketplace">
                Commencer les Achats
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dashboard">
                Tableau de Bord
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <AIChatbotWrapper />
    </div>
  );
}