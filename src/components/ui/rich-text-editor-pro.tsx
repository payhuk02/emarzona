import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  placeholder = "Commencez à écrire...", 
  className,
  disabled = false,
  showWordCount = true,
  maxHeight = "500px"
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

  // Couleurs prédéfinies
  const textColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#008000', '#800000', '#808080', '#C0C0C0', '#FFD700'
  ];

  const backgroundColors = [
    'transparent', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF',
    '#FFE4E1', '#E0FFE0', '#E0E0FF', '#FFE4B5', '#FFB6C1'
  ];

  // Emojis populaires
  const popularEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
    '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎',
    '👍', '👎', '✅', '❌', '⭐', '🎉', '🔥', '💡', '📌', '🚀'
  ];

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content && !showHtmlMode) {
      editorRef.current.innerHTML = content;
      updateStats();
    }
  }, [content, showHtmlMode]);

  const execCommand = (command: string, value?: string) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setHtmlContent(html);
      updateStats();
      
      // Vérifier les états undo/redo
      setCanUndo(document.queryCommandEnabled('undo'));
      setCanRedo(document.queryCommandEnabled('redo'));
    }
  };

  const updateStats = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || "";
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
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
    const url = prompt('Entrez l\'URL:', 'https://');
    if (url) {
      if (selectedText) {
        execCommand('createLink', url);
      } else {
        const text = prompt('Texte du lien:', url);
        execCommand('insertHTML', `<a href="${url}" target="_blank">${text || url}</a>`);
      }
    }
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:', 'https://');
    if (url) {
      const alt = prompt('Texte alternatif (optionnel):', '');
      execCommand('insertHTML', `<img src="${url}" alt="${alt || ''}" style="max-width: 100%; height: auto;" />`);
    }
  };

  const insertVideo = () => {
    const url = prompt('Entrez l\'URL de la vidéo (YouTube ou Vimeo):', 'https://');
    if (url) {
      let embedUrl = url;
      
      // Convertir URL YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop() 
          : new URLSearchParams(new URL(url).search).get('v');
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      
      // Convertir URL Vimeo
      if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }

      const videoHtml = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
          <iframe 
            src="${embedUrl}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          </iframe>
        </div>
      `;
      
      execCommand('insertHTML', videoHtml);
    }
  };

  const insertTable = () => {
    const rows = prompt('Nombre de lignes:', '3');
    const cols = prompt('Nombre de colonnes:', '3');
    
    if (rows && cols) {
      let table = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
      table += '<thead><tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        table += '<th style="padding: 12px; background: #f3f4f6; font-weight: bold; text-align: left;">En-tête ' + (j + 1) + '</th>';
      }
      table += '</tr></thead><tbody>';
      
      for (let i = 0; i < parseInt(rows); i++) {
        table += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          table += '<td style="padding: 12px; border: 1px solid #e5e7eb;">Cellule</td>';
        }
        table += '</tr>';
      }
      table += '</tbody></table>';
      
      execCommand('insertHTML', table);
    }
  };

  const insertChecklist = () => {
    const items = prompt('Entrez les éléments de la liste (séparés par des virgules):');
    if (items) {
      const itemList = items.split(',').map(item => 
        `<div style="display: flex; align-items: center; margin: 8px 0;">
          <input type="checkbox" style="margin-right: 8px; cursor: pointer;">
          <span>${item.trim()}</span>
        </div>`
      ).join('');
      
      execCommand('insertHTML', itemList);
    }
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
      alert('Contenu copié dans le presse-papier !');
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
    variant = "ghost"
  }: {
    onClick: () => void;
    icon: any;
    title: string;
    isActive?: boolean;
    disabled?: boolean;
    variant?: "ghost" | "default" | "outline";
  }) => (
    <Button
      variant={isActive ? "default" : variant}
      size="sm"
      onClick={onClick}
      disabled={disabled || btnDisabled}
      className="h-8 w-8 p-0"
      title={title}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <Card className={cn(
      "w-full transition-all",
      isFullscreen && "fixed inset-0 z-50 rounded-none",
      className
    )}>
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Couleur du texte">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <Label>Couleur du texte</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {textColors.map(color => (
                        <button
                          key={color}
                          onClick={() => execCommand('foreColor', color)}
                          className="h-8 w-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Couleur de fond">
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <Label>Couleur de fond</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {backgroundColors.map(color => (
                        <button
                          key={color}
                          onClick={() => execCommand('backColor', color)}
                          className="h-8 w-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Taille de police */}
            <div className="flex items-center gap-1">
              <select
                onChange={(e) => execCommand('fontSize', e.target.value)}
                className="h-8 px-2 text-sm border rounded bg-white text-black dark:bg-gray-800 dark:text-white"
                disabled={disabled}
                title="Taille de police"
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

              <select
                onChange={(e) => execCommand('fontName', e.target.value)}
                className="h-8 px-2 text-sm border rounded bg-white text-black dark:bg-gray-800 dark:text-white"
                disabled={disabled}
                title="Police de caractères"
              >
                <option value="">Police</option>
                <option value="Arial">Arial</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
              </select>
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
            <ToolbarButton
              onClick={insertChecklist}
              icon={CheckSquare}
              title="Liste de tâches"
            />
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
              onChange={(e) => {
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
            <ToolbarButton
              onClick={insertLink}
              icon={Link}
              title="Lien (Ctrl+K)"
            />
            <ToolbarButton
              onClick={insertImage}
              icon={Image}
              title="Image"
            />
            <ToolbarButton
              onClick={insertVideo}
              icon={Video}
              title="Vidéo (YouTube/Vimeo)"
            />
            <ToolbarButton
              onClick={insertTable}
              icon={Table}
              title="Tableau"
            />
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Emoji">
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
            <ToolbarButton
              onClick={copyContent}
              icon={Copy}
              title="Copier le contenu"
            />
            <ToolbarButton
              onClick={clearContent}
              icon={Trash2}
              title="Effacer tout"
              variant="outline"
            />
            <ToolbarButton
              onClick={toggleFullscreen}
              icon={isFullscreen ? Minimize : Maximize}
              title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
            />
          </div>
        </div>
      </div>

      {/* Éditeur */}
      <CardContent className="p-0">
        {showHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
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
              "min-h-[300px] p-4 focus:outline-none overflow-y-auto prose max-w-none",
              isFocused && "ring-2 ring-blue-500 ring-inset",
              disabled && "bg-gray-50 cursor-not-allowed"
            )}
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              maxHeight: isFullscreen ? 'calc(100vh - 200px)' : maxHeight
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
            {showHtmlMode && (
              <Badge variant="secondary">Mode HTML</Badge>
            )}
            {isFullscreen && (
              <Badge variant="secondary">Plein écran</Badge>
            )}
          </div>
        </div>
      )}

      {/* Styles pour le placeholder */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </Card>
  );
};

