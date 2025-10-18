import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Sun, Moon, Eye } from "lucide-react";
import { ProductAnalyticsTabModern } from "./ProductAnalyticsTabModern";
import { ProductAnalyticsTabDark } from "./ProductAnalyticsTabDark";

interface ProductAnalyticsDemoProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductAnalyticsDemo = ({ formData, updateFormData }: ProductAnalyticsDemoProps) => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [showPreview, setShowPreview] = useState(false);

  const themes = [
    {
      id: 'light',
      name: 'Clair et Moderne',
      description: 'Fond clair avec dégradé élégant, cartes blanches et accents bleus',
      icon: Sun,
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#10b981',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }
    },
    {
      id: 'dark',
      name: 'Semi-foncé et Premium',
      description: 'Fond sombre avec dégradé violet, cartes claires et effets glassmorphism',
      icon: Moon,
      colors: {
        primary: '#8b5cf6',
        secondary: '#cbd5e1',
        accent: '#06b6d4',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
      }
    }
  ];

  const currentThemeData = themes.find(theme => theme.id === currentTheme);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de démonstration */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Démonstration des Thèmes
              </h1>
              <p className="text-gray-600">
                Choisissez entre deux variations de design professionnel pour votre page de création de produit
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Masquer' : 'Aperçu'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Sélection du thème */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisissez votre Style</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isActive = currentTheme === theme.id;
              
              return (
                <Card 
                  key={theme.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    isActive 
                      ? 'ring-2 ring-blue-500 shadow-lg transform scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => setCurrentTheme(theme.id as 'light' | 'dark')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          isActive ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{theme.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <span className="text-sm text-gray-600">Couleur principale</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                        <span className="text-sm text-gray-600">Couleur d'accent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-300"
                          style={{ background: theme.colors.background }}
                        />
                        <span className="text-sm text-gray-600">Arrière-plan</span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="mt-4">
                        <Badge className="bg-blue-100 text-blue-800">
                          <Palette className="h-3 w-3 mr-1" />
                          Thème actuel
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Aperçu du thème sélectionné */}
        {showPreview && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Aperçu : {currentThemeData?.name}
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-lg">
              {currentTheme === 'light' ? (
                <ProductAnalyticsTabModern 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              ) : (
                <ProductAnalyticsTabDark 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}
            </div>
          </div>
        )}

        {/* Code CSS à appliquer */}
        <div className="bg-gray-900 rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Code CSS à Appliquer</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-2">1. Import du fichier CSS :</h4>
              <code className="block bg-gray-800 p-3 rounded text-sm">
                {currentTheme === 'light' 
                  ? 'import "@/styles/modern-product-creation.css";'
                  : 'import "@/styles/modern-product-creation-dark.css";'
                }
              </code>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">2. Classes CSS à utiliser :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-semibold text-blue-400 mb-2">Conteneurs :</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><code>modern-product-container</code></li>
                    <li><code>modern-card</code></li>
                    <li><code>modern-section</code></li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-400 mb-2">Éléments :</h5>
                  <ul className="space-y-1 text-gray-300">
                    <li><code>modern-button</code></li>
                    <li><code>modern-input</code></li>
                    <li><code>modern-switch</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
