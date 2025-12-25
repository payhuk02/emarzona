import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Upload, Loader2 } from 'lucide-react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Type,
  Palette,
  Table,
  Video,
  FileText,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Maximize,
  Minimize,
  Eye,
  Code2,
  Smile,
  Indent,
  Outdent,
  RemoveFormatting,
  Search,
  Highlighter,
  Download,
  Copy,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showWordCount?: boolean;
  maxHeight?: string;
}

export const RichTextEditorPro = ({
  content,
  onChange,
  placeholder = 'Commencez à écrire...',
  className,
  disabled = false,
  showWordCount = true,
  maxHeight = '500px',
}: RichTextEditorProProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHtmlMode, setShowHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(content);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadTab, setImageUploadTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Couleurs prédéfinies
  const textColors = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
    '#008000',
    '#800000',
    '#808080',
    '#C0C0C0',
    '#FFD700',
  ];

  const backgroundColors = [
    'transparent',
    '#FFFF00',
    '#00FF00',
    '#00FFFF',
    '#FF00FF',
    '#FFE4E1',
    '#E0FFE0',
    '#E0E0FF',
    '#FFE4B5',
    '#FFB6C1',
  ];

  // Polices disponibles (polices web-safe et modernes)
  const availableFonts = [
    // Polices sans-serif (modernes)
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Lucida Sans Unicode', label: 'Lucida Sans' },
    { value: 'Impact', label: 'Impact' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' },
    { value: 'Century Gothic', label: 'Century Gothic' },
    { value: 'Franklin Gothic Medium', label: 'Franklin Gothic' },
    // Polices serif (classiques)
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Palatino Linotype', label: 'Palatino' },
    { value: 'Garamond', label: 'Garamond' },
    { value: 'Book Antiqua', label: 'Book Antiqua' },
    { value: 'Baskerville Old Face', label: 'Baskerville' },
    // Polices monospace (code)
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Lucida Console', label: 'Lucida Console' },
    { value: 'Monaco', label: 'Monaco' },
    { value: 'Consolas', label: 'Consolas' },
    // Polices script/cursives
    { value: 'Brush Script MT', label: 'Brush Script' },
    { value: 'Lucida Handwriting', label: 'Lucida Handwriting' },
    { value: 'Papyrus', label: 'Papyrus' },
  ];

  // Emojis populaires
  const popularEmojis = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '😊',
    '❤️',
    '💙',
    '💚',
    '💛',
    '🧡',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '👍',
    '👎',
    '✅',
    '❌',
    '⭐',
    '🎉',
    '🔥',
    '💡',
    '📌',
    '🚀',
  ];

  // Fonction pour nettoyer les couleurs blanches dans le HTML
  const cleanWhiteColors = (html: string): string => {
    if (!html) return html;
    // Remplacer les couleurs blanches par la couleur par défaut
    return html
      .replace(/color:\s*white\s*;?/gi, '')
      .replace(/color:\s*#ffffff\s*;?/gi, '')
      .replace(/color:\s*#FFFFFF\s*;?/gi, '')
      .replace(/color:\s*rgb\(255,\s*255,\s*255\)\s*;?/gi, '')
      .replace(/color:\s*rgb\(255,255,255\)\s*;?/gi, '')
      .replace(/background-color:\s*white\s*;?/gi, 'background-color: transparent;')
      .replace(/background-color:\s*#ffffff\s*;?/gi, 'background-color: transparent;')
      .replace(/background-color:\s*#FFFFFF\s*;?/gi, 'background-color: transparent;')
      .replace(
        /background-color:\s*rgb\(255,\s*255,\s*255\)\s*;?/gi,
        'background-color: transparent;'
      )
      .replace(/background-color:\s*rgb\(255,255,255\)\s*;?/gi, 'background-color: transparent;');
  };

  // Fonction pour ajouter les boutons de suppression aux images existantes
  const addDeleteButtonsToExistingImages = () => {
    if (!editorRef.current) return;

    // Trouver toutes les images avec l'attribut data-editor-image
    const images = editorRef.current.querySelectorAll('img[data-editor-image="true"]');

    images.forEach(img => {
      // Vérifier si l'image a déjà un bouton de suppression
      const existingButton = img.parentElement?.querySelector('[data-image-delete-btn="true"]');
      if (existingButton) return;

      // Vérifier si l'image est déjà dans un conteneur avec la classe editor-image-wrapper
      let container = img.parentElement;
      if (!container || !container.classList.contains('editor-image-wrapper')) {
        // Créer un nouveau conteneur si nécessaire
        container = document.createElement('div');
        container.className = 'editor-image-wrapper';
        container.setAttribute('data-image-container', 'true');
        container.style.cssText = `
          margin: 12px 0 !important;
          padding: 0 !important;
          background: transparent !important;
          background-color: transparent !important;
          display: inline-block !important;
          overflow: visible !important;
          visibility: visible !important;
          position: relative !important;
          z-index: 99999 !important;
          max-width: 100% !important;
        `;

        // Remplacer l'image par le conteneur avec l'image
        if (img.parentNode) {
          img.parentNode.insertBefore(container, img);
          container.appendChild(img);
        }
      }

      // Créer le bouton de suppression
      const deleteButton = document.createElement('button');
      deleteButton.setAttribute('data-image-delete-btn', 'true');
      deleteButton.setAttribute('aria-label', "Supprimer l'image");
      deleteButton.setAttribute('title', "Supprimer l'image");
      deleteButton.className = 'editor-image-delete-btn';
      deleteButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 12M4 4L12 12" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      deleteButton.style.cssText = `
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        width: 28px !important;
        height: 28px !important;
        background: rgba(255, 255, 255, 0.95) !important;
        border: 2px solid #ef4444 !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        z-index: 100000 !important;
        opacity: 0 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        transition: opacity 0.2s ease, background 0.2s ease, transform 0.2s ease !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      `;

      // Gérer le clic sur le bouton de suppression
      deleteButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        // Supprimer le conteneur (qui contient l'image et le bouton)
        if (container.parentNode) {
          container.parentNode.removeChild(container);
          updateContent();

          toast({
            title: '✅ Image supprimée',
            description: "L'image a été supprimée avec succès",
          });
        }
      });

      // Gestionnaires pour afficher/masquer le bouton au survol
      const handleMouseEnter = () => {
        deleteButton.style.setProperty('opacity', '1', 'important');
        deleteButton.style.setProperty('background', 'rgba(255, 255, 255, 1)', 'important');
        deleteButton.style.setProperty('visibility', 'visible', 'important');
        deleteButton.style.setProperty('display', 'flex', 'important');
        deleteButton.style.setProperty('pointer-events', 'auto', 'important');
      };

      const handleMouseLeave = () => {
        deleteButton.style.setProperty('opacity', '0', 'important');
        deleteButton.style.setProperty('background', 'rgba(255, 255, 255, 0.95)', 'important');
      };

      // Afficher le bouton au survol du conteneur
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);

      // Aussi sur l'image elle-même pour une meilleure détection
      img.addEventListener('mouseenter', handleMouseEnter);
      img.addEventListener('mouseleave', handleMouseLeave);

      // Garder le bouton visible si on survole le bouton lui-même
      deleteButton.addEventListener('mouseenter', handleMouseEnter);
      deleteButton.addEventListener('mouseleave', handleMouseLeave);

      // Ajouter le bouton au conteneur
      container.appendChild(deleteButton);
    });
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content && !showHtmlMode) {
      // Nettoyer le contenu avant de l'afficher
      const cleanedContent = cleanWhiteColors(content);
      editorRef.current.innerHTML = cleanedContent;
      updateStats();

      // Ajouter les boutons de suppression aux images existantes
      setTimeout(() => {
        addDeleteButtonsToExistingImages();
      }, 100);
    }
  }, [content, showHtmlMode]);

  // Nettoyer automatiquement les couleurs blanches dans l'éditeur
  useEffect(() => {
    if (editorRef.current && !showHtmlMode) {
      const observer = new MutationObserver(() => {
        if (editorRef.current) {
          const html = editorRef.current.innerHTML;
          // Vérifier s'il y a des couleurs blanches
          if (
            html.includes('color: white') ||
            html.includes('color: #ffffff') ||
            html.includes('color: #FFFFFF') ||
            html.includes('color: rgb(255, 255, 255)') ||
            html.includes('color: rgb(255,255,255)')
          ) {
            const cleaned = cleanWhiteColors(html);
            if (cleaned !== html) {
              // Éviter la boucle infinie en désactivant temporairement l'observer
              observer.disconnect();
              editorRef.current.innerHTML = cleaned;
              updateContent();
              observer.observe(editorRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style'],
              });
            }
          }
        }
      });

      if (editorRef.current) {
        observer.observe(editorRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style'],
        });
      }

      return () => observer.disconnect();
    }
  }, [showHtmlMode]);

  const execCommand = (command: string, value?: string) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;
      // Nettoyer les couleurs blanches lors de la mise à jour
      html = cleanWhiteColors(html);
      // Appliquer le HTML nettoyé si nécessaire
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
      onChange(html);
      setHtmlContent(html);
      updateStats();

      // Vérifier les états undo/redo
      setCanUndo(document.queryCommandEnabled('undo'));
      setCanRedo(document.queryCommandEnabled('redo'));
    }
  };

  /**
   * Extrait le texte brut sans balises HTML pour le comptage
   * Utilise innerText qui ignore automatiquement les balises HTML
   * et normalise les espaces multiples
   */
  const getPlainText = (element: HTMLElement): string => {
    // innerText ignore automatiquement les balises HTML et le texte caché
    let text = element.innerText || element.textContent || '';

    // Normaliser les espaces multiples et les retours à la ligne
    text = text.replace(/\s+/g, ' ').trim();

    // Supprimer les caractères de contrôle (sauf espaces et retours à la ligne)
    // eslint-disable-next-line no-control-regex
    text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    return text;
  };

  const updateStats = () => {
    if (editorRef.current) {
      // Utiliser innerText qui ignore automatiquement les balises HTML
      const text = getPlainText(editorRef.current);

      // Compter les mots (séparés par des espaces)
      const words = text.split(/\s+/).filter(word => word.length > 0);

      setWordCount(words.length);
      // Compter les caractères (sans les balises HTML grâce à innerText)
      setCharCount(text.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // Raccourcis clavier
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          } else {
            e.preventDefault();
            execCommand('undo');
          }
          break;
      }
    }
  };

  const insertLink = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString();

    // Utiliser un prompt amélioré avec validation
    const url = prompt("Entrez l'URL du lien:", selectedText ? 'https://' : '');
    if (!url || !url.trim()) return;

    // Validation basique de l'URL
    const trimmedUrl = url.trim();
    const isValidUrl =
      trimmedUrl.startsWith('http://') ||
      trimmedUrl.startsWith('https://') ||
      trimmedUrl.startsWith('mailto:');

    if (!isValidUrl && trimmedUrl) {
      // Essayer d'ajouter https:// si ce n'est pas présent
      const finalUrl = trimmedUrl.includes('@') ? `mailto:${trimmedUrl}` : `https://${trimmedUrl}`;

      if (selectedText) {
        execCommand('createLink', finalUrl);
      } else {
        const text = prompt('Texte du lien:', selectedText || finalUrl);
        if (text) {
          execCommand(
            'insertHTML',
            `<a href="${finalUrl.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>`
          );
        }
      }
    } else if (isValidUrl) {
      if (selectedText) {
        execCommand('createLink', trimmedUrl);
      } else {
        const text = prompt('Texte du lien:', selectedText || trimmedUrl);
        if (text) {
          execCommand(
            'insertHTML',
            `<a href="${trimmedUrl.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>`
          );
        }
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Empêcher les uploads multiples simultanés
    if (uploadingImage) {
      logger.warn('Upload already in progress, ignoring duplicate request', {
        fileName: file.name,
      });
      return;
    }

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const result = await uploadToSupabaseStorage(file, {
        bucket: 'product-images',
        path: 'editor',
        filePrefix: 'editor-image',
        onProgress: progress => setUploadProgress(progress),
      });

      if (result.error) {
        throw result.error;
      }

      // Utiliser l'URL publique
      const imageUrl = result.url;

      logger.info('Upload result received', {
        url: imageUrl,
        path: result.path,
        success: result.success,
        hasError: !!result.error,
      });

      if (!imageUrl) {
        logger.error('No URL returned from upload', { result });
        throw new Error("Aucune URL n'a été retournée après l'upload");
      }

      // Vérifier que l'URL est valide
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        logger.error('Invalid URL format', { imageUrl });
        throw new Error(`URL invalide: ${imageUrl}`);
      }

      logger.info('Inserting image into editor', { imageUrl, alt: imageAlt });

      // Vérifier que l'éditeur est disponible avant d'insérer
      // Essayer plusieurs fois avec des délais croissants
      let editorAvailable = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        if (editorRef.current) {
          editorAvailable = true;
          break;
        }
        logger.warn(`Editor ref is null, attempt ${attempt + 1}/5, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }

      if (!editorAvailable || !editorRef.current) {
        logger.error('Editor ref still null after all attempts', {
          editorExists: !!editorRef.current,
          editorInDOM: editorRef.current ? document.contains(editorRef.current) : false,
        });
        throw new Error("L'éditeur n'est pas disponible. Veuillez réessayer.");
      }

      // Insérer l'image dans l'éditeur
      const insertionSuccess = insertImageIntoEditor(imageUrl, imageAlt);

      if (!insertionSuccess) {
        throw new Error("Impossible d'insérer l'image dans l'éditeur");
      }

      // Attendre un peu pour s'assurer que l'insertion est terminée et visible
      await new Promise(resolve => setTimeout(resolve, 300));

      // Vérifier que l'image a bien été insérée avant de fermer le dialog
      const imageInEditor = editorRef.current?.querySelector(
        `img[data-editor-image="true"][src="${imageUrl}"]`
      );
      if (!imageInEditor) {
        logger.warn('Image not found in editor after insertion, but continuing...', { imageUrl });
      } else {
        logger.info('Image confirmed in editor', { imageUrl });
      }

      // Fermer le dialog seulement après confirmation
      setShowImageDialog(false);
      setImageUrl('');
      setImageAlt('');

      toast({
        title: '✅ Image uploadée',
        description: "L'image a été ajoutée avec succès",
      });
    } catch (error) {
      logger.error('Erreur upload image', { error });
      toast({
        title: "❌ Erreur d'upload",
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const insertImageIntoEditor = (url: string, alt: string = ''): boolean => {
    if (!editorRef.current) {
      logger.error('Editor ref is null, cannot insert image', {
        url,
        alt,
        editorExists: !!editorRef.current,
        editorInDOM: editorRef.current ? document.contains(editorRef.current) : false,
      });
      return false;
    }

    // Vérifier si l'image existe déjà dans l'éditeur pour éviter les doublons
    const existingImage = editorRef.current.querySelector(
      `img[data-editor-image="true"][src="${url}"]`
    );
    if (existingImage) {
      logger.warn('Image already exists in editor, skipping insertion', { url });
      // Placer le curseur après l'image existante
      const range = document.createRange();
      range.setStartAfter(existingImage);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return true;
    }

    // S'assurer que l'éditeur a le focus
    editorRef.current.focus();

    // Obtenir la sélection actuelle
    const selection = window.getSelection();
    let range: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      // Créer une nouvelle sélection à la fin du contenu
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    // Créer l'élément image DIRECTEMENT sans wrapper
    const img = document.createElement('img');
    img.src = url;
    img.alt = alt || '';
    img.loading = 'eager'; // Charger immédiatement sur mobile
    img.decoding = 'async';
    img.setAttribute('data-editor-image', 'true'); // Attribut pour identification

    // Styles inline très explicites avec !important
    // Utiliser style.cssText pour forcer l'application des styles
    img.style.cssText = `
      max-width: 100% !important;
      width: auto !important;
      min-width: 100px !important;
      height: auto !important;
      min-height: 100px !important;
      display: block !important;
      margin: 12px auto !important;
      padding: 0 !important;
      border-radius: 4px !important;
      object-fit: contain !important;
      box-sizing: border-box !important;
      background: transparent !important;
      background-color: transparent !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: relative !important;
      z-index: 9999 !important;
      border: none !important;
    `;

    // Aussi utiliser setAttribute comme fallback
    img.setAttribute('style', img.style.cssText);

    // Gestion des erreurs de chargement
    img.onerror = () => {
      logger.warn('Image failed to load in editor', { url, alt });
      // Afficher un message d'erreur après l'image
      const errorMsg = document.createElement('p');
      errorMsg.setAttribute(
        'style',
        'color: red; padding: 8px; background: #fee; border-radius: 4px; border: 1px solid #fcc; margin: 8px 0;'
      );
      errorMsg.textContent = `⚠️ Erreur: Image non accessible (${url.substring(0, 50)}...)`;
      img.parentNode?.insertBefore(errorMsg, img.nextSibling);
      updateContent();
    };

    // Confirmation de chargement avec vérification agressive
    img.onload = () => {
      logger.info('Image loaded successfully in editor', { url, alt });

      // Forcer le reflow immédiatement
      void img.offsetHeight;

      // Vérification agressive après chargement
      const checkVisibility = () => {
        const rect = img.getBoundingClientRect();
        const computed = window.getComputedStyle(img);

        logger.info('Image visibility check', {
          url,
          rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          zIndex: computed.zIndex,
          position: computed.position,
        });

        // Si l'image n'est pas visible, forcer la visibilité
        if (
          rect.width === 0 ||
          rect.height === 0 ||
          computed.display === 'none' ||
          computed.visibility === 'hidden' ||
          computed.opacity === '0'
        ) {
          logger.warn('Image not visible, forcing visibility', { url });

          // Réappliquer tous les styles avec !important via setAttribute
          img.setAttribute(
            'style',
            `
            max-width: 100% !important;
            width: auto !important;
            min-width: 100px !important;
            height: auto !important;
            min-height: 100px !important;
            display: block !important;
            margin: 12px auto !important;
            padding: 0 !important;
            border-radius: 4px !important;
            object-fit: contain !important;
            box-sizing: border-box !important;
            background: transparent !important;
            background-color: transparent !important;
            opacity: 1 !important;
            visibility: visible !important;
            position: relative !important;
            z-index: 9999 !important;
            border: none !important;
          `
          );
        }
      };

      // Vérifier immédiatement et après un court délai
      checkVisibility();
      setTimeout(checkVisibility, 50);
      setTimeout(checkVisibility, 200);

      updateContent();
    };

    // Insérer l'image DIRECTEMENT dans le DOM
    try {
      // Vérifier une dernière fois si l'image existe déjà (au cas où elle aurait été ajoutée entre-temps)
      const finalCheck = editorRef.current.querySelector(
        `img[data-editor-image="true"][src="${url}"]`
      );
      if (finalCheck) {
        logger.warn('Image already exists in editor (final check), skipping insertion', { url });
        // Placer le curseur après l'image existante
        const rangeAfter = document.createRange();
        rangeAfter.setStartAfter(finalCheck);
        rangeAfter.collapse(true);
        const selectionAfter = window.getSelection();
        selectionAfter?.removeAllRanges();
        selectionAfter?.addRange(rangeAfter);
        return true;
      }

      // Supprimer le contenu sélectionné si nécessaire
      if (range && !range.collapsed) {
        range.deleteContents();
      }

      // Nettoyer les backgrounds blancs des parents AVANT insertion
      if (range) {
        const container = range.commonAncestorContainer;
        if (container.nodeType === Node.ELEMENT_NODE) {
          const element = container as HTMLElement;
          const computedStyle = window.getComputedStyle(element);
          if (
            computedStyle.backgroundColor === 'rgb(255, 255, 255)' ||
            computedStyle.backgroundColor === 'white'
          ) {
            element.style.setProperty('background-color', 'transparent', 'important');
            element.style.setProperty('background', 'transparent', 'important');
          }
        }
      }

      // Créer un conteneur div avec des styles très explicites pour éviter les problèmes avec prose
      const container = document.createElement('div');
      container.setAttribute('data-image-container', 'true');
      container.className = 'editor-image-wrapper';
      container.style.cssText = `
        margin: 12px 0 !important;
        padding: 0 !important;
        background: transparent !important;
        background-color: transparent !important;
        display: inline-block !important;
        overflow: visible !important;
        visibility: visible !important;
        position: relative !important;
        z-index: 99999 !important;
        max-width: 100% !important;
      `;

      // Créer le bouton de suppression (croix rouge)
      const deleteButton = document.createElement('button');
      deleteButton.setAttribute('data-image-delete-btn', 'true');
      deleteButton.setAttribute('aria-label', "Supprimer l'image");
      deleteButton.setAttribute('title', "Supprimer l'image");
      deleteButton.className = 'editor-image-delete-btn';
      deleteButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 12M4 4L12 12" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      deleteButton.style.cssText = `
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        width: 28px !important;
        height: 28px !important;
        background: rgba(255, 255, 255, 0.95) !important;
        border: 2px solid #ef4444 !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        z-index: 100000 !important;
        opacity: 0 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        transition: opacity 0.2s ease, background 0.2s ease, transform 0.2s ease !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      `;

      // Gérer le clic sur le bouton de suppression
      deleteButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        // Supprimer le conteneur (qui contient l'image et le bouton)
        if (container.parentNode) {
          container.parentNode.removeChild(container);
          updateContent();

          toast({
            title: '✅ Image supprimée',
            description: "L'image a été supprimée avec succès",
          });
        }
      });

      // Afficher le bouton au survol du conteneur
      const showDeleteButton = () => {
        deleteButton.style.setProperty('opacity', '1', 'important');
        deleteButton.style.setProperty('background', 'rgba(255, 255, 255, 1)', 'important');
        deleteButton.style.setProperty('visibility', 'visible', 'important');
        deleteButton.style.setProperty('display', 'flex', 'important');
      };

      const hideDeleteButton = () => {
        deleteButton.style.setProperty('opacity', '0', 'important');
        deleteButton.style.setProperty('background', 'rgba(255, 255, 255, 0.95)', 'important');
      };

      container.addEventListener('mouseenter', showDeleteButton);
      container.addEventListener('mouseleave', hideDeleteButton);

      // Aussi sur l'image elle-même
      img.addEventListener('mouseenter', showDeleteButton);
      img.addEventListener('mouseleave', hideDeleteButton);

      // Ajouter l'image au conteneur
      container.appendChild(img);

      // Ajouter le bouton de suppression au conteneur
      container.appendChild(deleteButton);

      // Insérer le conteneur avec l'image
      if (range) {
        range.insertNode(container);
        // Placer le curseur après le conteneur
        range.setStartAfter(container);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        // Fallback: insérer à la fin
        editorRef.current.appendChild(container);
      }

      // Ajouter un saut de ligne après le conteneur
      const br = document.createElement('br');
      if (container.nextSibling) {
        editorRef.current.insertBefore(br, container.nextSibling);
      } else {
        editorRef.current.appendChild(br);
      }

      // Forcer la mise à jour du contenu
      updateContent();

      // Vérification immédiate et nettoyage agressif des styles parents après insertion
      setTimeout(() => {
        // Vérifier que le conteneur est dans le DOM
        const containerInDOM = editorRef.current?.contains(container);
        logger.info('Container DOM check', {
          url,
          containerInDOM,
          containerParent: container.parentElement?.tagName,
          editorContains: editorRef.current?.contains(container),
        });

        // Vérifier si l'image existe déjà avant de réinsérer
        const existingImage = editorRef.current?.querySelector(
          `img[data-editor-image="true"][src="${url}"]`
        );
        const imageCount =
          editorRef.current?.querySelectorAll(`img[data-editor-image="true"][src="${url}"]`)
            .length || 0;

        if (imageCount > 1) {
          logger.warn('Multiple images with same URL found, removing duplicates', {
            url,
            count: imageCount,
          });
          // Garder seulement la première image, supprimer les autres
          const images = editorRef.current?.querySelectorAll(
            `img[data-editor-image="true"][src="${url}"]`
          );
          if (images && images.length > 1) {
            for (let i = 1; i < images.length; i++) {
              const imgToRemove = images[i];
              const parentContainer = imgToRemove.closest('div[data-image-container="true"]');
              if (parentContainer) {
                parentContainer.remove();
              } else {
                imgToRemove.remove();
              }
            }
            updateContent();
          }
        } else if (!containerInDOM && !existingImage) {
          logger.error('Container not in DOM and image not found!', { url });
          // Réessayer d'insérer seulement si l'image n'existe pas déjà
          if (editorRef.current) {
            editorRef.current.appendChild(container);
            updateContent();
          }
        }

        // Nettoyer tous les parents du conteneur
        let parent = container;
        while (parent && parent !== editorRef.current) {
          const computedStyle = window.getComputedStyle(parent);
          if (
            computedStyle.backgroundColor === 'rgb(255, 255, 255)' ||
            computedStyle.backgroundColor === 'white' ||
            computedStyle.background === 'white'
          ) {
            parent.style.setProperty('background-color', 'transparent', 'important');
            parent.style.setProperty('background', 'transparent', 'important');
          }
          // S'assurer que le parent n'a pas d'overflow qui cache l'image
          if (computedStyle.overflow === 'hidden' || computedStyle.overflowX === 'hidden') {
            parent.style.setProperty('overflow', 'visible', 'important');
            parent.style.setProperty('overflow-x', 'visible', 'important');
          }
          // Forcer display block sur le conteneur
          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            parent.style.setProperty('display', 'block', 'important');
            parent.style.setProperty('visibility', 'visible', 'important');
          }
          parent = parent.parentElement;
        }

        // Vérifier que l'image et le conteneur sont visibles
        const imgRect = img.getBoundingClientRect();
        const imgComputed = window.getComputedStyle(img);
        const containerRect = container.getBoundingClientRect();
        const containerComputed = window.getComputedStyle(container);

        logger.info('Image and container visibility check after insertion', {
          url,
          imgRect: {
            width: imgRect.width,
            height: imgRect.height,
            top: imgRect.top,
            left: imgRect.left,
          },
          imgDisplay: imgComputed.display,
          imgVisibility: imgComputed.visibility,
          imgOpacity: imgComputed.opacity,
          containerRect: {
            width: containerRect.width,
            height: containerRect.height,
            top: containerRect.top,
            left: containerRect.left,
          },
          containerDisplay: containerComputed.display,
          containerVisibility: containerComputed.visibility,
          containerOpacity: containerComputed.opacity,
        });

        if (
          imgRect.width === 0 ||
          imgRect.height === 0 ||
          imgComputed.display === 'none' ||
          imgComputed.visibility === 'hidden' ||
          containerComputed.display === 'none' ||
          containerComputed.visibility === 'hidden' ||
          containerRect.width === 0 ||
          containerRect.height === 0
        ) {
          logger.warn('Image or container became invisible after insertion', { url });
          // Réappliquer les styles sur l'image
          img.style.cssText = `
            max-width: 100% !important;
            width: auto !important;
            min-width: 100px !important;
            height: auto !important;
            min-height: 100px !important;
            display: block !important;
            margin: 12px auto !important;
            padding: 0 !important;
            border-radius: 4px !important;
            object-fit: contain !important;
            box-sizing: border-box !important;
            background: transparent !important;
            background-color: transparent !important;
            opacity: 1 !important;
            visibility: visible !important;
            position: relative !important;
            z-index: 9999 !important;
            border: none !important;
          `;
          // Réappliquer les styles sur le conteneur
          container.style.cssText = `
            margin: 12px 0 !important;
            padding: 0 !important;
            background: transparent !important;
            background-color: transparent !important;
            display: block !important;
            overflow: visible !important;
            visibility: visible !important;
            position: relative !important;
            z-index: 99999 !important;
          `;
        }
      }, 100);

      logger.info('Image inserted into editor', { url, alt, method: 'Direct DOM insertion' });
      return true;
    } catch (error) {
      logger.error('Error inserting image into editor', { error, url, alt });

      // Fallback: utiliser execCommand avec HTML direct dans un conteneur
      try {
        if (!editorRef.current) {
          logger.error('Editor ref still null in fallback');
          return false;
        }

        // Vérifier si l'image existe déjà avant d'utiliser le fallback
        const existingImageInFallback = editorRef.current.querySelector(
          `img[data-editor-image="true"][src="${url}"]`
        );
        if (existingImageInFallback) {
          logger.warn('Image already exists in editor (fallback check), skipping', { url });
          // Placer le curseur après l'image existante
          const rangeAfter = document.createRange();
          rangeAfter.setStartAfter(existingImageInFallback);
          rangeAfter.collapse(true);
          const selectionAfter = window.getSelection();
          selectionAfter?.removeAllRanges();
          selectionAfter?.addRange(rangeAfter);
          return true;
        }

        const imgHtml = `<div class="editor-image-wrapper" data-image-container="true" style="margin: 12px 0 !important; padding: 0 !important; background: transparent !important; background-color: transparent !important; display: inline-block !important; overflow: visible !important; visibility: visible !important; position: relative !important; z-index: 99999 !important; max-width: 100% !important;"><img src="${url.replace(/"/g, '&quot;')}" alt="${(alt || '').replace(/"/g, '&quot;')}" data-editor-image="true" style="max-width: 100% !important; width: auto !important; min-width: 100px !important; height: auto !important; min-height: 100px !important; display: block !important; margin: 12px auto !important; padding: 0 !important; border-radius: 4px !important; object-fit: contain !important; box-sizing: border-box !important; background: transparent !important; background-color: transparent !important; opacity: 1 !important; visibility: visible !important; position: relative !important; z-index: 9999 !important; border: none !important;" loading="eager" decoding="async" /></div>`;
        execCommand('insertHTML', imgHtml);
        updateContent();

        // Ajouter le bouton de suppression après insertion via execCommand
        setTimeout(() => {
          addDeleteButtonsToExistingImages();
        }, 100);

        logger.info('Image inserted via execCommand fallback', { url, alt });
        return true;
      } catch (fallbackError) {
        logger.error('Fallback insertion also failed', { error: fallbackError, url, alt });
        return false;
      }
    }
  };

  const handleInsertImageFromUrl = () => {
    if (imageUrl.trim()) {
      insertImageIntoEditor(imageUrl.trim(), imageAlt);
      setShowImageDialog(false);
      setImageUrl('');
      setImageAlt('');
    }
  };

  const insertImage = () => {
    setShowImageDialog(true);
    setImageUploadTab('upload');
    setImageUrl('');
    setImageAlt('');
  };

  const insertVideo = () => {
    const url = prompt("Entrez l'URL de la vidéo (YouTube ou Vimeo):", 'https://');
    if (!url || !url.trim()) return;

    let embedUrl: string | null = null;
    const trimmedUrl = url.trim();

    try {
      // Convertir URL YouTube
      if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
        let videoId: string | null = null;

        if (trimmedUrl.includes('youtu.be')) {
          videoId = trimmedUrl.split('/').pop()?.split('?')[0] || null;
        } else {
          try {
            const urlObj = new URL(trimmedUrl);
            videoId = urlObj.searchParams.get('v');
          } catch {
            // Fallback pour les URLs malformées
            const match = trimmedUrl.match(/[?&]v=([^&]+)/);
            videoId = match ? match[1] : null;
          }
        }

        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // Convertir URL Vimeo
      if (trimmedUrl.includes('vimeo.com')) {
        const videoId = trimmedUrl.split('/').pop()?.split('?')[0];
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }
      }

      if (!embedUrl) {
        toast({
          title: 'URL invalide',
          description: "L'URL doit être une vidéo YouTube ou Vimeo",
          variant: 'destructive',
        });
        return;
      }

      const videoHtml = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 16px 0; border-radius: 8px; background: #000;">
          <iframe 
            src="${embedUrl.replace(/"/g, '&quot;')}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;">
          </iframe>
        </div>
      `;

      execCommand('insertHTML', videoHtml);

      toast({
        title: '✅ Vidéo insérée',
        description: 'La vidéo a été ajoutée avec succès',
      });
    } catch (error) {
      logger.error('Erreur insertion vidéo', { error, url: trimmedUrl });
      toast({
        title: '❌ Erreur',
        description: "Impossible d'insérer la vidéo. Vérifiez l'URL.",
        variant: 'destructive',
      });
    }
  };

  const insertTable = () => {
    const rowsInput = prompt('Nombre de lignes (1-20):', '3');
    const colsInput = prompt('Nombre de colonnes (1-10):', '3');

    if (!rowsInput || !colsInput) return;

    const rows = Math.max(1, Math.min(20, parseInt(rowsInput) || 3));
    const cols = Math.max(1, Math.min(10, parseInt(colsInput) || 3));

    if (rows && cols) {
      let table =
        '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #e5e7eb;">';
      table += '<thead><tr>';
      for (let j = 0; j < cols; j++) {
        table +=
          '<th style="padding: 12px; background: #f3f4f6; font-weight: bold; text-align: left; border: 1px solid #e5e7eb;">En-tête ' +
          (j + 1) +
          '</th>';
      }
      table += '</tr></thead><tbody>';

      for (let i = 0; i < rows; i++) {
        table += '<tr>';
        for (let j = 0; j < cols; j++) {
          table += '<td style="padding: 12px; border: 1px solid #e5e7eb;">Cellule</td>';
        }
        table += '</tr>';
      }
      table += '</tbody></table>';

      execCommand('insertHTML', table);
    }
  };

  const insertChecklist = () => {
    const itemsInput = prompt('Entrez les éléments de la liste (séparés par des virgules):');
    if (!itemsInput || !itemsInput.trim()) return;

    const items = itemsInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (items.length === 0) return;

    const itemList = items
      .map(
        item =>
          `<div style="display: flex; align-items: center; margin: 8px 0;">
          <input type="checkbox" style="margin-right: 8px; cursor: pointer;" disabled>
          <span>${item.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
        </div>`
      )
      .join('');

    execCommand('insertHTML', itemList);
  };

  const insertEmoji = (emoji: string) => {
    execCommand('insertText', emoji);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleHtmlMode = () => {
    if (showHtmlMode) {
      // Passer en mode visuel
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent;
        updateContent();
      }
    } else {
      // Passer en mode HTML
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML);
      }
    }
    setShowHtmlMode(!showHtmlMode);
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
    execCommand('unlink');
  };

  const copyContent = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.innerHTML);
      toast({
        title: '✅ Contenu copié',
        description: 'Le contenu HTML a été copié dans le presse-papier',
      });
    }
  };

  const clearContent = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le contenu ?')) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        updateContent();
      }
    }
  };

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
    isActive = false,
    disabled: btnDisabled = false,
    variant = 'ghost',
  }: {
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    isActive?: boolean;
    disabled?: boolean;
    variant?: 'ghost' | 'default' | 'outline';
  }) => (
    <Button
      variant={isActive ? 'default' : variant}
      size="sm"
      onClick={onClick}
      disabled={disabled || btnDisabled}
      className="h-8 w-8 p-0"
      title={title}
      aria-label={title}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <Card
      className={cn(
        'w-full transition-all',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
      style={{ overflow: 'visible' }}
    >
      {/* Toolbar Principal */}
      <div className="border-b p-2 bg-gray-50/50">
        <div className="flex flex-wrap items-center gap-1">
          {/* Ligne 1: Formatage de texte */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Formatage de base */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => execCommand('bold')}
                icon={Bold}
                title="Gras (Ctrl+B)"
                isActive={document.queryCommandState('bold')}
              />
              <ToolbarButton
                onClick={() => execCommand('italic')}
                icon={Italic}
                title="Italique (Ctrl+I)"
                isActive={document.queryCommandState('italic')}
              />
              <ToolbarButton
                onClick={() => execCommand('underline')}
                icon={Underline}
                title="Souligné (Ctrl+U)"
                isActive={document.queryCommandState('underline')}
              />
              <ToolbarButton
                onClick={() => execCommand('strikeThrough')}
                icon={Strikethrough}
                title="Barré"
                isActive={document.queryCommandState('strikeThrough')}
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Couleurs */}
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Couleur du texte"
                    aria-label="Couleur du texte"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <Label>Couleur du texte</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {textColors.map(color => {
                        // Pour le blanc, utiliser une bordure pour le rendre visible
                        const isWhite = color === '#FFFFFF';
                        return (
                          <button
                            key={color}
                            onClick={() => execCommand('foreColor', color)}
                            className={`h-8 w-8 rounded border-2 hover:scale-110 transition-transform ${
                              isWhite ? 'border-gray-400 bg-white' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                            aria-label={`Couleur ${color}`}
                          />
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">
                        {textColors.length} couleurs disponibles
                      </Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Couleur de fond"
                    aria-label="Couleur de fond"
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <Label>Couleur de fond</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {backgroundColors.map(color => {
                        const isTransparent = color === 'transparent';
                        return (
                          <button
                            key={color}
                            onClick={() => execCommand('backColor', color)}
                            className={`h-8 w-8 rounded border-2 hover:scale-110 transition-transform ${
                              isTransparent
                                ? 'border-gray-400 bg-white bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[length:8px_8px] bg-[0_0,4px_4px]'
                                : 'border-gray-300'
                            }`}
                            style={!isTransparent ? { backgroundColor: color } : undefined}
                            title={color === 'transparent' ? 'Transparent' : color}
                            aria-label={`Couleur de fond ${color === 'transparent' ? 'transparent' : color}`}
                          />
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">
                        {backgroundColors.length} couleurs disponibles
                      </Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Taille de police */}
            <div className="flex items-center gap-1">
              <div className="relative flex items-center">
                <select
                  onChange={e => execCommand('fontSize', e.target.value)}
                  className="h-10 sm:h-8 px-2 pr-10 text-sm border rounded bg-white text-black dark:bg-gray-800 dark:text-white min-h-[44px] touch-manipulation cursor-pointer"
                  disabled={disabled}
                  title="Taille de police (7 tailles disponibles)"
                >
                  <option value="">Taille</option>
                  <option value="1">Très petit</option>
                  <option value="2">Petit</option>
                  <option value="3">Normal</option>
                  <option value="4">Moyen</option>
                  <option value="5">Grand</option>
                  <option value="6">Très grand</option>
                  <option value="7">Énorme</option>
                </select>
                <Badge
                  variant="secondary"
                  className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] px-1 py-0 h-5 flex items-center"
                  title="7 tailles disponibles"
                >
                  7
                </Badge>
              </div>

              <div className="relative flex items-center">
                <select
                  onChange={e => execCommand('fontName', e.target.value)}
                  className="h-10 sm:h-8 px-2 pr-10 text-sm border rounded bg-white text-black dark:bg-gray-800 dark:text-white min-h-[44px] touch-manipulation cursor-pointer"
                  disabled={disabled}
                  title={`Police de caractères (${availableFonts.length} disponibles)`}
                >
                  <option value="">Police</option>
                  {availableFonts.map(font => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <Badge
                  variant="secondary"
                  className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] px-1 py-0 h-5 flex items-center"
                  title={`${availableFonts.length} polices disponibles`}
                >
                  {availableFonts.length}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne 2: Alignement et Listes */}
        <div className="flex flex-wrap items-center gap-1 mt-2">
          {/* Alignement */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('justifyLeft')}
              icon={AlignLeft}
              title="Aligner à gauche"
            />
            <ToolbarButton
              onClick={() => execCommand('justifyCenter')}
              icon={AlignCenter}
              title="Centrer"
            />
            <ToolbarButton
              onClick={() => execCommand('justifyRight')}
              icon={AlignRight}
              title="Aligner à droite"
            />
            <ToolbarButton
              onClick={() => execCommand('justifyFull')}
              icon={AlignJustify}
              title="Justifier"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Listes et Indentation */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('insertUnorderedList')}
              icon={List}
              title="Liste à puces"
            />
            <ToolbarButton
              onClick={() => execCommand('insertOrderedList')}
              icon={ListOrdered}
              title="Liste numérotée"
            />
            <ToolbarButton onClick={insertChecklist} icon={CheckSquare} title="Liste de tâches" />
            <ToolbarButton
              onClick={() => execCommand('indent')}
              icon={Indent}
              title="Augmenter l'indentation"
            />
            <ToolbarButton
              onClick={() => execCommand('outdent')}
              icon={Outdent}
              title="Diminuer l'indentation"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Titres */}
          <div className="flex items-center gap-1">
            <select
              onChange={e => {
                if (e.target.value === '') {
                  execCommand('formatBlock', 'div');
                } else {
                  execCommand('formatBlock', e.target.value);
                }
                e.target.value = '';
              }}
              className="h-8 px-2 text-sm border rounded bg-white text-black dark:bg-gray-800 dark:text-white"
              disabled={disabled}
              title="Style de titre"
            >
              <option value="">Style</option>
              <option value="h1">Titre 1</option>
              <option value="h2">Titre 2</option>
              <option value="h3">Titre 3</option>
              <option value="h4">Titre 4</option>
              <option value="h5">Titre 5</option>
              <option value="h6">Titre 6</option>
              <option value="p">Paragraphe</option>
            </select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Insertions */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('formatBlock', 'blockquote')}
              icon={Quote}
              title="Citation"
            />
            <ToolbarButton onClick={insertLink} icon={Link} title="Lien (Ctrl+K)" />
            <ToolbarButton onClick={insertImage} icon={Image} title="Image" />
            <ToolbarButton onClick={insertVideo} icon={Video} title="Vidéo (YouTube/Vimeo)" />
            <ToolbarButton onClick={insertTable} icon={Table} title="Tableau" />
            <ToolbarButton
              onClick={() => execCommand('insertHorizontalRule')}
              icon={Minus}
              title="Ligne horizontale"
            />
            <ToolbarButton
              onClick={() => execCommand('insertHTML', '<code>Code</code>')}
              icon={Code}
              title="Code"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Emoji"
                  aria-label="Insérer un emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <Label>Emojis</Label>
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {popularEmojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertEmoji(emoji)}
                        className="h-8 w-8 text-xl hover:bg-gray-100 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('undo')}
              icon={Undo}
              title="Annuler (Ctrl+Z)"
              disabled={!canUndo}
            />
            <ToolbarButton
              onClick={() => execCommand('redo')}
              icon={Redo}
              title="Refaire (Ctrl+Shift+Z)"
              disabled={!canRedo}
            />
            <ToolbarButton
              onClick={clearFormatting}
              icon={RemoveFormatting}
              title="Supprimer le formatage"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Outils */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={toggleHtmlMode}
              icon={Code2}
              title="Mode HTML"
              isActive={showHtmlMode}
            />
            <ToolbarButton onClick={copyContent} icon={Copy} title="Copier le contenu" />
            <ToolbarButton
              onClick={clearContent}
              icon={Trash2}
              title="Effacer tout"
              variant="outline"
            />
            <ToolbarButton
              onClick={toggleFullscreen}
              icon={isFullscreen ? Minimize : Maximize}
              title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            />
          </div>
        </div>
      </div>

      {/* Éditeur */}
      <CardContent
        className="p-0 overflow-x-visible overflow-y-auto"
        style={{ overflowX: 'visible', overflowY: 'auto' }}
      >
        {showHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={e => setHtmlContent(e.target.value)}
            className="w-full p-4 font-mono text-sm border-0 focus:outline-none resize-none"
            style={{ minHeight: '300px', maxHeight: isFullscreen ? '100%' : maxHeight }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={updateContent}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'min-h-[300px] p-4 focus:outline-none overflow-y-auto overflow-x-visible prose max-w-none',
              'text-foreground bg-transparent',
              'prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground',
              'prose-strong:text-foreground prose-em:text-foreground',
              'prose-a:text-primary prose-code:text-foreground',
              'prose-img:max-w-full prose-img:w-auto prose-img:h-auto prose-img:block prose-img:my-2 prose-img:mx-auto prose-img:bg-transparent prose-img:opacity-100 prose-img:visible',
              'prose-p:bg-transparent prose-div:bg-transparent',
              isFocused && 'ring-2 ring-blue-500 ring-inset',
              disabled && 'bg-gray-50 cursor-not-allowed'
            )}
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              maxHeight: isFullscreen ? 'calc(100vh - 200px)' : maxHeight,
              color: 'inherit',
            }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}
      </CardContent>

      {/* Footer avec statistiques */}
      {showWordCount && (
        <div className="border-t px-4 py-2 bg-gray-50/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-normal">
              {wordCount} {wordCount === 1 ? 'mot' : 'mots'}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {charCount} {charCount === 1 ? 'caractère' : 'caractères'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {showHtmlMode && <Badge variant="secondary">Mode HTML</Badge>}
            {isFullscreen && <Badge variant="secondary">Plein écran</Badge>}
          </div>
        </div>
      )}

      {/* Styles pour le placeholder, correction des couleurs et images responsive */}
      <style jsx global>{`
        /* Style global pour forcer la visibilité des images dans l'éditeur */
        [contenteditable] img[data-editor-image='true'],
        [contenteditable] p img[data-editor-image='true'],
        [contenteditable] div img[data-editor-image='true'] {
          all: revert !important;
          max-width: 100% !important;
          width: auto !important;
          min-width: 100px !important;
          height: auto !important;
          min-height: 100px !important;
          display: block !important;
          margin: 12px auto !important;
          padding: 0 !important;
          border-radius: 4px !important;
          object-fit: contain !important;
          box-sizing: border-box !important;
          background: transparent !important;
          background-color: transparent !important;
          opacity: 1 !important;
          visibility: visible !important;
          position: relative !important;
          z-index: 9999 !important;
          border: none !important;
        }
        /* Forcer la visibilité des paragraphes contenant des images */
        [contenteditable] p:has(img[data-editor-image='true']),
        [contenteditable] div:has(img[data-editor-image='true']) {
          display: block !important;
          visibility: visible !important;
          overflow: visible !important;
          background: transparent !important;
          background-color: transparent !important;
          margin: 12px 0 !important;
          padding: 0 !important;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        [contenteditable] {
          color: inherit !important;
          overflow-x: visible !important;
          overflow-y: auto !important;
          word-wrap: break-word !important;
          background: transparent !important;
          background-color: transparent !important;
        }
        [contenteditable] * {
          color: inherit !important;
        }
        [contenteditable] p,
        [contenteditable] div {
          background: transparent !important;
          background-color: transparent !important;
        }
        [contenteditable] * {
          color: inherit !important;
        }
        [contenteditable] img,
        [contenteditable] img[data-editor-image='true'],
        [contenteditable] p img[data-editor-image='true'],
        [contenteditable] div img[data-editor-image='true'] {
          max-width: 100% !important;
          width: auto !important;
          min-width: 100px !important;
          height: auto !important;
          min-height: 100px !important;
          display: block !important;
          margin: 12px auto !important;
          padding: 0 !important;
          border-radius: 4px !important;
          object-fit: contain !important;
          box-sizing: border-box !important;
          background: transparent !important;
          background-color: transparent !important;
          opacity: 1 !important;
          visibility: visible !important;
          position: relative !important;
          z-index: 9999 !important;
          border: none !important;
        }
        /* Forcer la visibilité des paragraphes contenant des images */
        [contenteditable] p:has(img[data-editor-image='true']),
        [contenteditable] div:has(img[data-editor-image='true']) {
          display: block !important;
          visibility: visible !important;
          overflow: visible !important;
          background: transparent !important;
          background-color: transparent !important;
          margin: 12px 0 !important;
          padding: 0 !important;
        }
        [contenteditable] img::before,
        [contenteditable] img::after {
          display: none !important;
          content: none !important;
        }
        [contenteditable] [style*='color: white'],
        [contenteditable] [style*='color: #ffffff'],
        [contenteditable] [style*='color: #FFFFFF'],
        [contenteditable] [style*='color: rgb(255, 255, 255)'],
        [contenteditable] [style*='color: rgb(255,255,255)'],
        [contenteditable] [style*='color:rgb(255,255,255)'],
        [contenteditable] [style*='color:rgb(255, 255, 255)'] {
          color: inherit !important;
        }
        [contenteditable] [style*='background-color: white'],
        [contenteditable] [style*='background-color: #ffffff'],
        [contenteditable] [style*='background-color: #FFFFFF'],
        [contenteditable] [style*='background-color: rgb(255, 255, 255)'],
        [contenteditable] [style*='background-color: rgb(255,255,255)'],
        [contenteditable] [style*='background-color:rgb(255,255,255)'],
        [contenteditable] [style*='background-color:rgb(255, 255, 255)'] {
          background-color: transparent !important;
        }
        /* Supprimer toute ombre ou overlay blanc sur les images */
        [contenteditable] img {
          box-shadow: none !important;
          filter: none !important;
        }
        [contenteditable] img::before,
        [contenteditable] img::after {
          display: none !important;
          content: none !important;
          background: none !important;
        }
        /* S'assurer que les conteneurs d'images sont transparents */
        [contenteditable] figure,
        [contenteditable] picture,
        [contenteditable] p:has(img),
        [contenteditable] div:has(img),
        [contenteditable] span:has(img) {
          background: transparent !important;
          background-color: transparent !important;
        }
        /* Supprimer les backgrounds blancs de tous les éléments contenant des images */
        [contenteditable] *:has(img) {
          background: transparent !important;
          background-color: transparent !important;
        }
        /* Alternative pour les navigateurs qui ne supportent pas :has() */
        [contenteditable] p img,
        [contenteditable] div img,
        [contenteditable] span img {
          background: transparent !important;
          background-color: transparent !important;
        }
        /* Forcer la visibilité des images sur mobile */
        @media (max-width: 768px) {
          [contenteditable] img,
          [contenteditable] img[data-editor-image='true'],
          [contenteditable] p img[data-editor-image='true'],
          [contenteditable] div img[data-editor-image='true'] {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            max-width: 100% !important;
            width: auto !important;
            height: auto !important;
            min-width: 100px !important;
            min-height: 100px !important;
            position: relative !important;
            z-index: 9999 !important;
            background: transparent !important;
            background-color: transparent !important;
            margin: 12px auto !important;
            padding: 0 !important;
            border: none !important;
          }
          /* S'assurer que les conteneurs d'images sont visibles */
          [contenteditable] div[data-image-container='true'] {
            display: block !important;
            visibility: visible !important;
            overflow: visible !important;
            background: transparent !important;
            background-color: transparent !important;
            margin: 12px 0 !important;
            padding: 0 !important;
            position: relative !important;
            z-index: 99999 !important;
          }
          /* S'assurer que les parents n'ont pas d'overflow qui cache l'image */
          [contenteditable] *:has(img[data-editor-image='true']),
          [contenteditable] p:has(img[data-editor-image='true']),
          [contenteditable] div:has(img[data-editor-image='true']) {
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            background: transparent !important;
            background-color: transparent !important;
            display: block !important;
            visibility: visible !important;
            margin: 12px 0 !important;
            padding: 0 !important;
          }
        }
        /* Styles pour le bouton de suppression d'image */
        [contenteditable] .editor-image-wrapper,
        .editor-image-wrapper {
          position: relative !important;
          display: inline-block !important;
          max-width: 100% !important;
        }
        [contenteditable] .editor-image-wrapper:hover .editor-image-delete-btn,
        .editor-image-wrapper:hover .editor-image-delete-btn {
          opacity: 1 !important;
          background: rgba(255, 255, 255, 1) !important;
          visibility: visible !important;
          display: flex !important;
          pointer-events: auto !important;
        }
        [contenteditable] .editor-image-delete-btn,
        .editor-image-delete-btn {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          width: 28px !important;
          height: 28px !important;
          background: rgba(255, 255, 255, 0.95) !important;
          border: 2px solid #ef4444 !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          z-index: 100000 !important;
          opacity: 0 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          transition:
            opacity 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }
        [contenteditable] .editor-image-delete-btn:hover,
        .editor-image-delete-btn:hover {
          background: #fee !important;
          border-color: #dc2626 !important;
          transform: scale(1.1) !important;
          opacity: 1 !important;
        }
        [contenteditable] .editor-image-delete-btn:active,
        .editor-image-delete-btn:active {
          transform: scale(0.95) !important;
        }
      `}</style>

      {/* Dialog pour insérer une image */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Insérer une image</DialogTitle>
            <DialogDescription>
              Uploadez une image depuis votre ordinateur ou insérez une URL
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={imageUploadTab}
            onValueChange={v => setImageUploadTab(v as 'upload' | 'url')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">Sélectionner une image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                </div>
                {uploadingImage && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Upload en cours... {uploadProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: JPG, PNG, WEBP, GIF (max 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-alt-upload">Texte alternatif (optionnel)</Label>
                <Input
                  id="image-alt-upload"
                  type="text"
                  placeholder="Description de l'image"
                  value={imageAlt}
                  onChange={e => setImageAlt(e.target.value)}
                  disabled={uploadingImage}
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-url">URL de l'image</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && imageUrl.trim()) {
                      handleInsertImageFromUrl();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-alt-url">Texte alternatif (optionnel)</Label>
                <Input
                  id="image-alt-url"
                  type="text"
                  placeholder="Description de l'image"
                  value={imageAlt}
                  onChange={e => setImageAlt(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImageDialog(false);
                    setImageUrl('');
                    setImageAlt('');
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleInsertImageFromUrl} disabled={!imageUrl.trim()}>
                  Insérer
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
