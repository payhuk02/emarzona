/**
 * 📥 TEMPLATE IMPORTER COMPONENT
 * Modern drag-and-drop template import interface
 * 
 * Features:
 * - Drag & drop files
 * - Import from URL
 * - Paste JSON
 * - Validation before import
 * - Progress tracking
 * - Error handling
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplateImporter as ImporterClass } from '@/lib/template-importer';
import { TemplateImportResultV2 } from '@/types/templates-v2';

// ============================================================================
// TYPES
// ============================================================================

interface TemplateImporterProps {
  onImportSuccess?: (result: TemplateImportResultV2) => void;
  onImportError?: (error: string) => void;
  onClose?: () => void;
}

interface ImportState {
  status: 'idle' | 'uploading' | 'validating' | 'importing' | 'success' | 'error';
  progress: number;
  result?: TemplateImportResultV2;
  error?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplateImporter({
  onImportSuccess,
  onImportError,
  onClose,
}: TemplateImporterProps) {
  const [importState, setImportState] = useState<ImportState>({
    status: 'idle',
    progress: 0,
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importer = new ImporterClass({
    validateOnly: false,
    overwriteExisting: false,
  });

  // ==========================================================================
  // DRAG & DROP HANDLERS
  // ==========================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileImport(files[0]);
    }
  }, []);

  // ==========================================================================
  // IMPORT HANDLERS
  // ==========================================================================

  const handleFileImport = async (file: File) => {
    setImportState({ status: 'uploading', progress: 10 });

    try {
      setImportState({ status: 'validating', progress: 40 });
      
      const result = await importer.importFromFile(file);
      
      setImportState({ status: 'importing', progress: 70 });
      
      if (result.success) {
        setImportState({
          status: 'success',
          progress: 100,
          result,
        });
        onImportSuccess?.(result);
      } else {
        setImportState({
          status: 'error',
          progress: 0,
          error: result.errors?.[0]?.message || 'Import failed',
        });
        onImportError?.(result.errors?.[0]?.message || 'Import failed');
      }
    } catch (error) {
      setImportState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      onImportError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;

    setImportState({ status: 'uploading', progress: 10 });

    try {
      setImportState({ status: 'validating', progress: 40 });
      
      const result = await importer.importFromURL(urlInput);
      
      setImportState({ status: 'importing', progress: 70 });
      
      if (result.success) {
        setImportState({
          status: 'success',
          progress: 100,
          result,
        });
        onImportSuccess?.(result);
      } else {
        setImportState({
          status: 'error',
          progress: 0,
          error: result.errors?.[0]?.message || 'Import failed',
        });
      }
    } catch (error) {
      setImportState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleJsonImport = async () => {
    if (!jsonInput.trim()) return;

    setImportState({ status: 'validating', progress: 30 });

    try {
      const result = await importer.importFromJSON(jsonInput);
      
      setImportState({ status: 'importing', progress: 70 });
      
      if (result.success) {
        setImportState({
          status: 'success',
          progress: 100,
          result,
        });
        onImportSuccess?.(result);
      } else {
        setImportState({
          status: 'error',
          progress: 0,
          error: result.errors?.[0]?.message || 'Import failed',
        });
      }
    } catch (error) {
      setImportState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleReset = () => {
    setImportState({ status: 'idle', progress: 0 });
    setUrlInput('');
    setJsonInput('');
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importer un Template
            </CardTitle>
            <CardDescription>
              Importez un template depuis un fichier, URL ou JSON
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        {importState.status !== 'idle' && importState.status !== 'success' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 capitalize">
                {importState.status}...
              </span>
              <span className="text-sm font-medium">
                {importState.progress}%
              </span>
            </div>
            <Progress value={importState.progress} />
          </div>
        )}

        {/* Success State */}
        {importState.status === 'success' && importState.result && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-semibold mb-2">Template importé avec succès !</div>
              <div className="space-y-1 text-sm">
                <div>Template: {importState.result.template?.metadata.name}</div>
                <div>Sections: {importState.result.imported?.sections}</div>
                <div>Variables: {importState.result.imported?.variables}</div>
                {importState.result.warnings && importState.result.warnings.length > 0 && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      {importState.result.warnings.length} avertissement(s)
                    </Badge>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                >
                  Importer un autre template
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {importState.status === 'error' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-semibold mb-1">Erreur d'importation</div>
              <div className="text-sm">{importState.error}</div>
              <div className="mt-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                >
                  Réessayer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Import Tabs */}
        {(importState.status === 'idle' || importState.status === 'error') && (
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">
                <Upload className="w-4 h-4 mr-2" />
                Fichier
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
              <TabsTrigger value="json">
                <FileText className="w-4 h-4 mr-2" />
                JSON
              </TabsTrigger>
            </TabsList>

            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-4">
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8
                  transition-colors duration-200
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
                  `}>
                    {importState.status === 'uploading' || importState.status === 'validating' ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragging ? 'Déposez votre fichier' : 'Glissez-déposez votre template'}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    ou
                  </p>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileImport(file);
                    }}
                    accept=".json,.template"
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importState.status === 'uploading'}
                  >
                    Parcourir les fichiers
                  </Button>
                  
                  <p className="text-xs text-gray-400 mt-4">
                    Formats acceptés: .json, .template
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">URL du template</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/template.json"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              
              <Button
                onClick={handleUrlImport}
                disabled={!urlInput.trim() || importState.status === 'uploading'}
                className="w-full"
              >
                {importState.status === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Importer depuis l'URL
                  </>
                )}
              </Button>
            </TabsContent>

            {/* JSON Tab */}
            <TabsContent value="json" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json-input">Code JSON</Label>
                <ScrollArea className="h-64 w-full rounded-md border">
                  <textarea
                    id="json-input"
                    className="w-full h-full p-3 font-mono text-sm resize-none focus:outline-none"
                    placeholder='{"version": "2.0.0", "template": {...}}'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                </ScrollArea>
              </div>
              
              <Button
                onClick={handleJsonImport}
                disabled={!jsonInput.trim() || importState.status === 'validating'}
                className="w-full"
              >
                {importState.status === 'validating' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Importer le JSON
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default TemplateImporter;

