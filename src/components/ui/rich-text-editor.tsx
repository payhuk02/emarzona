import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const RichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = "Commencez à écrire...", 
  className,
  disabled = false 
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

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
      
      // Vérifier les états undo/redo
      setCanUndo(document.queryCommandEnabled('undo'));
      setCanRedo(document.queryCommandEnabled('redo'));
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
          const url = prompt('Entrez l\'URL:');
          if (url) execCommand('createLink', url);
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

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertTable = () => {
    const rows = prompt('Nombre de lignes:', '3');
    const cols = prompt('Nombre de colonnes:', '3');
    
    if (rows && cols) {
      let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
      for (let i = 0; i < parseInt(rows); i++) {
        table += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          table += '<td style="padding: 8px;">Cellule</td>';
        }
        table += '</tr>';
      }
      table += '</table>';
      
      execCommand('insertHTML', table);
    }
  };

  const insertChecklist = () => {
    const items = prompt('Entrez les éléments de la liste (séparés par des virgules):');
    if (items) {
      const itemList = items.split(',').map(item => 
        `<div style="display: flex; align-items: center; margin: 4px 0;">
          <input type="checkbox" style="margin-right: 8px;">
          <span>${item.trim()}</span>
        </div>`
      ).join('');
      
      execCommand('insertHTML', itemList);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title, 
    isActive = false,
    disabled: btnDisabled = false 
  }: {
    onClick: () => void;
    icon: any;
    title: string;
    isActive?: boolean;
    disabled?: boolean;
  }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled || btnDisabled}
      className="h-8 w-8 p-0"
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <Card className={cn("w-full", className)}>
      {/* Toolbar */}
      <div className="border-b p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Formatage de texte */}
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

          {/* Listes */}
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
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Éléments spéciaux */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('formatBlock', 'blockquote')}
              icon={Quote}
              title="Citation"
            />
            <ToolbarButton
              onClick={() => {
                const url = prompt('Entrez l\'URL:');
                if (url) execCommand('createLink', url);
              }}
              icon={Link}
              title="Lien (Ctrl+K)"
            />
            <ToolbarButton
              onClick={insertImage}
              icon={Image}
              title="Image"
            />
            <ToolbarButton
              onClick={insertTable}
              icon={Table}
              title="Tableau"
            />
            <ToolbarButton
              onClick={() => execCommand('insertHTML', '<code>Code</code>')}
              icon={Code}
              title="Code"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Historique */}
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
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Styles de titre */}
          <div className="flex items-center gap-1">
            <select
              onChange={(e) => {
                if (e.target.value === '') {
                  execCommand('formatBlock', 'div');
                } else {
                  execCommand('formatBlock', e.target.value);
                }
              }}
              className="h-8 px-2 text-sm border rounded"
              disabled={disabled}
            >
              <option value="">Normal</option>
              <option value="h1">Titre 1</option>
              <option value="h2">Titre 2</option>
              <option value="h3">Titre 3</option>
              <option value="h4">Titre 4</option>
              <option value="h5">Titre 5</option>
              <option value="h6">Titre 6</option>
            </select>
          </div>
        </div>
      </div>

      {/* Éditeur */}
      <CardContent className="p-0">
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={updateContent}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "min-h-[300px] p-4 focus:outline-none",
            isFocused && "ring-2 ring-blue-500 ring-offset-2",
            disabled && "bg-gray-50 cursor-not-allowed"
          )}
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      </CardContent>

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
