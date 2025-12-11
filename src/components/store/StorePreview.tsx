/**
 * StorePreview Component
 * Prévisualisation en temps réel des personnalisations de la boutique
 */

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Store } from '@/hooks/useStores';

interface StorePreviewProps {
  store: Store | null;
  previewData: {
    // Couleurs
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    // Typographie
    headingFont: string;
    bodyFont: string;
    // Layout
    headerStyle: 'minimal' | 'standard' | 'extended';
    footerStyle: 'minimal' | 'standard' | 'extended';
    productGridColumns: number;
    productCardStyle: 'minimal' | 'standard' | 'detailed';
  };
  onClose?: () => void;
}

export const StorePreview: React.FC<StorePreviewProps> = ({
  store,
  previewData,
  onClose,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Générer le HTML de prévisualisation
  const generatePreviewHTML = () => {
    const theme = {
      primaryColor: previewData.primaryColor,
      secondaryColor: previewData.secondaryColor,
      accentColor: previewData.accentColor,
      backgroundColor: previewData.backgroundColor,
      textColor: previewData.textColor,
      headingFont: previewData.headingFont,
      bodyFont: previewData.bodyFont,
      headerStyle: previewData.headerStyle,
      footerStyle: previewData.footerStyle,
      productGridColumns: previewData.productGridColumns,
      productCardStyle: previewData.productCardStyle,
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prévisualisation - ${store?.name || 'Boutique'}</title>
  <link href="https://fonts.googleapis.com/css2?family=${theme.headingFont.replace(/\s+/g, '+')}:wght@400;600;700&family=${theme.bodyFont.replace(/\s+/g, '+')}:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: '${theme.bodyFont}', sans-serif;
      background-color: ${theme.backgroundColor};
      color: ${theme.textColor};
      line-height: 1.6;
    }
    
    .preview-header {
      background: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%);
      padding: ${theme.headerStyle === 'minimal' ? '1rem 0' : theme.headerStyle === 'standard' ? '2rem 0' : '3rem 0'};
      color: white;
      text-align: center;
    }
    
    .preview-header h1 {
      font-family: '${theme.headingFont}', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .preview-header p {
      opacity: 0.9;
      font-size: 1rem;
    }
    
    .preview-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    
    .preview-section {
      margin-bottom: 3rem;
    }
    
    .preview-section h2 {
      font-family: '${theme.headingFont}', sans-serif;
      font-size: 1.75rem;
      color: ${theme.textColor};
      margin-bottom: 1.5rem;
    }
    
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(${theme.productGridColumns}, 1fr);
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    
    .preview-card {
      background: white;
      border-radius: ${theme.productCardStyle === 'minimal' ? '0.25rem' : theme.productCardStyle === 'standard' ? '0.5rem' : '1rem'};
      padding: ${theme.productCardStyle === 'minimal' ? '1rem' : theme.productCardStyle === 'standard' ? '1.5rem' : '2rem'};
      box-shadow: ${theme.productCardStyle === 'minimal' ? 'none' : theme.productCardStyle === 'standard' ? '0 1px 3px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.1)'};
      border: ${theme.productCardStyle === 'detailed' ? `2px solid ${theme.primaryColor}` : '1px solid #e5e7eb'};
      transition: transform 0.2s;
    }
    
    .preview-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px rgba(0,0,0,0.15);
    }
    
    .preview-card-image {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%);
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .preview-card h3 {
      font-family: '${theme.headingFont}', sans-serif;
      font-size: 1.25rem;
      color: ${theme.textColor};
      margin-bottom: 0.5rem;
    }
    
    .preview-card p {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    
    .preview-button {
      background-color: ${theme.primaryColor};
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      width: 100%;
    }
    
    .preview-button:hover {
      background-color: ${theme.secondaryColor};
    }
    
    .preview-footer {
      background-color: #1f2937;
      color: white;
      padding: ${theme.footerStyle === 'minimal' ? '2rem 0' : theme.footerStyle === 'standard' ? '3rem 0' : '4rem 0'};
      text-align: center;
      margin-top: 4rem;
    }
    
    @media (max-width: 768px) {
      .preview-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="preview-header">
    <h1>${store?.name || 'Ma Boutique'}</h1>
    <p>${store?.description || 'Découvrez nos produits'}</p>
  </div>
  
  <div class="preview-content">
    <div class="preview-section">
      <h2>Nos Produits</h2>
      <div class="preview-grid">
        <div class="preview-card">
          <div class="preview-card-image"></div>
          <h3>Produit Exemple 1</h3>
          <p>Description du produit avec un design ${theme.productCardStyle}</p>
          <button class="preview-button">Voir le produit</button>
        </div>
        <div class="preview-card">
          <div class="preview-card-image"></div>
          <h3>Produit Exemple 2</h3>
          <p>Description du produit avec un design ${theme.productCardStyle}</p>
          <button class="preview-button">Voir le produit</button>
        </div>
        <div class="preview-card">
          <div class="preview-card-image"></div>
          <h3>Produit Exemple 3</h3>
          <p>Description du produit avec un design ${theme.productCardStyle}</p>
          <button class="preview-button">Voir le produit</button>
        </div>
      </div>
    </div>
  </div>
  
  <div class="preview-footer">
    <p>&copy; 2025 ${store?.name || 'Ma Boutique'}. Tous droits réservés.</p>
  </div>
</body>
</html>
    `;
  };

  const handleOpenPreview = () => {
    setIsOpen(true);
  };

  const handleClosePreview = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (isOpen && previewRef.current) {
      const iframe = previewRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(generatePreviewHTML());
        doc.close();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, previewData, store]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenPreview}
        className="flex items-center gap-2"
      >
        <Eye className="h-4 w-4" />
        Prévisualiser
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévisualisation en Temps Réel
                </DialogTitle>
                <DialogDescription>
                  Aperçu de votre boutique avec les personnalisations actuelles
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              ref={previewRef}
              className="w-full h-full border-0"
              title="Prévisualisation boutique"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};


