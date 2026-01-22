/**
 * Vendor Messaging Page - Contact Vendeur
 * Date: 2025-01-31
 *
 * Page de messagerie pour contacter les vendeurs directement depuis les cartes produits
 */

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Store,
  User,
  Crown,
  CheckCheck,
  Check,
  Search,
  X,
  ChevronUp,
  Camera,
} from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useVendorMessaging } from '@/hooks/useVendorMessaging';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { MediaAttachment } from '@/components/media';
import { validateFile, filterValidFiles } from '@/utils/fileValidation';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMessageSearch } from '@/hooks/useMessageSearch';
import { highlightText } from '@/utils/highlightText.tsx';
import { CameraCapture } from '@/components/camera/CameraCapture';

export default function VendorMessaging() {
  const { storeId, productId } = useParams<{ storeId?: string; productId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Récupérer storeId et productId depuis les params ou searchParams
  const finalStoreId = storeId || searchParams.get('storeId') || undefined;
  const finalProductId = productId || searchParams.get('productId') || undefined;

  const {
    conversations,
    currentConversation,
    messages,
    loading,
    messagesLoading,
    sendingMessage,
    createConversation,
    sendMessage,
    openConversation,
    loadMoreMessages,
    hasMoreMessages,
    totalMessagesCount,
  } = useVendorMessaging(finalStoreId, finalProductId);

  const [messageContent, setMessageContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);

  // Hook pour l'upload de fichiers avec progress tracking
  const { uploadFiles: uploadFilesWithProgress, state: uploadState } = useFileUpload();

  // Hook pour la recherche de messages
  const {
    searchMessages,
    results: searchResults,
    isSearching: isSearchingMessages,
    clearSearch,
  } = useMessageSearch();

  // Auto-scroll to bottom when new messages arrive (seulement pour nouveaux messages, pas lors du chargement de plus)
  useEffect(() => {
    // Ne scroll que si on n'est pas en train de charger plus de messages
    if (!messagesLoading && !hasMoreMessages && messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.warn('Failed to scroll to messages end:', error);
      }
    }
  }, [messages.length, messagesLoading, hasMoreMessages]);

  // Scroll automatique vers le haut lors du chargement de plus de messages
  useEffect(() => {
    if (messagesLoading && messagesTopRef.current) {
      try {
        // Sauvegarder la position actuelle
        const scrollContainer = messagesTopRef.current.closest(
          '[data-radix-scroll-area-viewport]'
        ) as HTMLElement;

        if (!scrollContainer) {
          console.warn('Scroll container not found for messages loading');
          return;
        }
      if (scrollContainer) {
        const previousScrollHeight = scrollContainer.scrollHeight;
        // Après le chargement, ajuster la position pour rester au même endroit visuel
        setTimeout(() => {
          const newScrollHeight = scrollContainer.scrollHeight;
          const scrollDifference = newScrollHeight - previousScrollHeight;
          scrollContainer.scrollTop = scrollDifference;
        }, 100);
      }
    }
    } catch (error) {
      console.error('Error adjusting scroll position during messages loading:', error);
    }
  }, [messagesLoading]);

  // Créer une conversation si nécessaire
  useEffect(() => {
    if (!loading && !currentConversation && finalStoreId && user) {
      // Vérifier si une conversation existe déjà
      const existingConv = conversations.find(
        c =>
          c.store_id === finalStoreId && (finalProductId ? c.product_id === finalProductId : true)
      );

      if (existingConv) {
        openConversation(existingConv.id);
      } else {
        // Créer une nouvelle conversation
        createConversation(
          finalStoreId,
          finalProductId,
          `Question sur ${finalProductId ? 'le produit' : 'la boutique'}`
        );
      }
    }
  }, [
    loading,
    currentConversation,
    finalStoreId,
    finalProductId,
    user,
    conversations,
    createConversation,
    openConversation,
  ]);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Utiliser la validation centralisée
    const validFiles = filterValidFiles(files, {
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    // Afficher les erreurs pour les fichiers invalides
    files.forEach(file => {
      if (!validFiles.includes(file)) {
        const validation = validateFile(file, { maxSize: 10 * 1024 * 1024 });
        if (!validation.valid) {
          toast({
            title: 'Fichier invalide',
            description: `${file.name}: ${validation.error}`,
            variant: 'destructive',
          });
        }
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleCameraCapture = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
    setShowCameraDialog(false);
  };

  /**
   * Handle send message
   */
  const handleSendMessage = async () => {
    if (!messageContent.trim() && selectedFiles.length === 0) {
      toast({
        title: 'Message vide',
        description: 'Veuillez écrire un message ou joindre un fichier',
        variant: 'destructive',
      });
      return;
    }

    if (!currentConversation) {
      toast({
        title: 'Erreur',
        description: 'Aucune conversation active',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingFiles(true);
      setUploadProgress(0);

      // Upload files if any (utilise le hook avec progress tracking)
      const  fileUrls: string[] = [];
      const  storagePaths: string[] = [];
      let  uploadResults: Array<{
        path: string;
        publicUrl: string;
        fileName: string;
        mimeType: string;
        size: number;
        signedUrl?: string | null;
      }> = [];

      if (selectedFiles.length > 0) {
        try {
          uploadResults = await uploadFilesWithProgress(selectedFiles, {
            folder: `vendor-message-attachments/${currentConversation.id}`,
            maxSize: 10 * 1024 * 1024, // 10MB
            compressImages: true, // Activer la compression d'images
            onProgress: progress => {
              setUploadProgress(progress);
            },
          });

          // Vérifier que tous les fichiers ont été uploadés avec succès
          if (uploadResults.length !== selectedFiles.length) {
            // Récupérer les détails des fichiers échoués depuis le state du hook
            const failedFilesDetails = uploadState.failed
              .map(f => `• ${f.file.name}: ${f.error}`)
              .join('\n');

            let  errorMessage= `${uploadState.failed.length} fichier(s) n'ont pas pu être uploadés`;
            if (failedFilesDetails) {
              errorMessage += `:\n${failedFilesDetails}`;
            } else {
              const failedFiles = selectedFiles
                .slice(uploadResults.length)
                .map(f => f.name)
                .join(', ');
              errorMessage += `: ${failedFiles}`;
            }

            // Ajouter des instructions de correction
            errorMessage += '\n\n📋 CORRECTIONS NÉCESSAIRES:\n';
            errorMessage +=
              '1. Vérifiez que le bucket "attachments" est PUBLIC dans Supabase Dashboard\n';
            errorMessage +=
              '2. Exécutez la migration SQL: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql\n';
            errorMessage += '3. Attendez 2-3 minutes (délai de propagation) puis réessayez';

            throw new Error(errorMessage);
          }

          // Vérifier que chaque fichier est accessible via son URL publique (avec timeout)
          const verificationPromises = uploadResults.map(async result => {
            try {
              // Tester l'URL publique avec un HEAD request (avec timeout de 5 secondes)
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);

              const testResponse = await fetch(result.publicUrl, {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (!testResponse.ok) {
                const errorDetails = {
                  path: result.path,
                  publicUrl: result.publicUrl,
                  status: testResponse.status,
                  statusText: testResponse.statusText,
                };

                logger.error('Uploaded file not accessible via public URL', errorDetails);

                // Si c'est une erreur 403, c'est probablement un problème de permissions
                if (testResponse.status === 403) {
                  throw new Error(
                    `Permission refusée pour ${result.fileName}. Vérifiez les politiques RLS du bucket "attachments".`
                  );
                }

                // Si c'est une erreur 404, le fichier n'existe pas
                if (testResponse.status === 404) {
                  throw new Error(
                    `Le fichier ${result.fileName} n'a pas été trouvé dans le bucket après l'upload. Chemin: ${result.path}`
                  );
                }

                throw new Error(
                  `Le fichier ${result.fileName} n'est pas accessible (HTTP ${testResponse.status})`
                );
              }

              const contentType = testResponse.headers.get('content-type') || '';
              // Vérifier que c'est bien un fichier (pas du JSON)
              if (contentType === 'application/json') {
                logger.error('Uploaded file returns JSON instead of file content', {
                  path: result.path,
                  publicUrl: result.publicUrl,
                });
                throw new Error(
                  `Le fichier ${result.fileName} n'a pas pu être uploadé correctement (le serveur retourne du JSON au lieu du fichier). SOLUTION: Exécutez la migration SQL: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql`
                );
              }

              // Vérifier que le Content-Type correspond au type de fichier (avertissement seulement)
              if (result.mimeType && !contentType.includes(result.mimeType.split('/')[0])) {
                logger.warn('Content-Type mismatch', {
                  expected: result.mimeType,
                  actual: contentType,
                  fileName: result.fileName,
                });
                // Ne pas bloquer pour un mismatch de Content-Type, juste logger
              }

              return { success: true, result };
            } catch ( _verifyError: unknown) {
              // Si c'est une erreur d'abort (timeout), essayer avec signedUrl si disponible
              const verifyErr = verifyError as Error;
              if (verifyErr.name === 'AbortError') {
                logger.warn('Verification timeout, trying signed URL', {
                  fileName: result.fileName,
                  path: result.path,
                });
                // Si on a une signedUrl dans le résultat, l'utiliser
                const resultWithSignedUrl = result as { signedUrl?: string | null };
                if (resultWithSignedUrl.signedUrl) {
                  return {
                    success: true,
                    result: { ...result, publicUrl: resultWithSignedUrl.signedUrl },
                  };
                }
              }

              // Propager l'erreur pour qu'elle soit affichée à l'utilisateur
              logger.error('File verification failed', {
                fileName: result.fileName,
                path: result.path,
                publicUrl: result.publicUrl,
                error: verifyError,
              });
              throw verifyError;
            }
          });

          // Attendre toutes les vérifications en parallèle
          const verificationResults = await Promise.allSettled(verificationPromises);

          // Vérifier s'il y a des échecs
          const failedVerifications = verificationResults
            .map((result, index) => ({ result, index }))
            .filter(({ result }) => result.status === 'rejected');

          if (failedVerifications.length > 0) {
            const failedFiles = failedVerifications
              .map(({ index }) => uploadResults[index].fileName)
              .join(', ');
            const firstError =
              failedVerifications[0].result.status === 'rejected'
                ? failedVerifications[0].result.reason?.message || 'Erreur de vérification'
                : 'Erreur inconnue';

            throw new Error(`${failedFiles}: ${firstError}`);
          }

          // Extraire les résultats réussis
          const successfulResults = verificationResults
            .map((result, index) => {
              if (result.status === 'fulfilled' && result.value.success) {
                return result.value.result;
              }
              return uploadResults[index];
            })
            .filter(Boolean);

          fileUrls.push(...successfulResults.map(r => r.publicUrl));
          storagePaths.push(...successfulResults.map(r => r.path));
        } catch ( _uploadError: unknown) {
          // Si l'upload échoue complètement, on peut quand même envoyer le message sans fichiers
          logger.error('File upload failed, attempting to send message without attachments', {
            error: uploadError,
            selectedFilesCount: selectedFiles.length,
          });

          const uploadErr =
            uploadError instanceof Error ? uploadError : new Error(String(uploadError));

          // Si c'est une erreur critique (bucket n'existe pas), bloquer l'envoi
          if (
            uploadErr.message?.includes('bucket') ||
            uploadErr.message?.includes("n'existe pas")
          ) {
            throw uploadErr;
          }

          // Si c'est une erreur RLS (fichier uploadé comme JSON), afficher un message spécial
          if (
            uploadErr.message?.includes('uploadé comme JSON') ||
            uploadErr.message?.includes('politiques RLS')
          ) {
            const errorDescription = `Les fichiers ne peuvent pas être uploadés car les politiques RLS ne sont pas correctement configurées dans Supabase.

📋 ACTION REQUISE :
1. Allez dans Supabase Dashboard → Storage → Buckets → "attachments" → Policies
2. Vérifiez que la politique INSERT est pour "authenticated" (pas "public")
3. Vérifiez que la politique SELECT est pour "public" (pas "authenticated")
4. Exécutez la migration SQL : 20250201_diagnose_and_fix_rls_attachments.sql
5. Attendez 2-3 minutes puis réessayez

Le message sera envoyé sans pièces jointes.`;

            toast({
              title: '❌ Erreur de Configuration Supabase',
              description: errorDescription,
              variant: 'destructive',
              duration: 30000, // Afficher très longtemps car c'est une erreur critique
            });
          } else {
            // Sinon, permettre d'envoyer le message sans fichiers avec un avertissement standard
            toast({
              title: 'Avertissement',
              description:
                "Les fichiers n'ont pas pu être uploadés, mais le message sera envoyé sans pièces jointes.",
              variant: 'default',
            });
          }
        }
      }

      // Determine message type
      let  messageType: 'text' | 'image' | 'video' | 'file' = 'text';
      if (selectedFiles.length > 0) {
        const firstFile = selectedFiles[0];
        if (firstFile.type.startsWith('image/')) {
          messageType = 'image';
        } else if (firstFile.type.startsWith('video/')) {
          messageType = 'video';
        } else {
          messageType = 'file';
        }
      }

      // Prepare message data
      const formData = {
        content: messageContent,
        message_type: messageType,
        attachments:
          fileUrls.length > 0
            ? fileUrls.map((fileUrl, index) => {
                // Utiliser le storage_path retourné par l'upload (qui contient le chemin complet)
                const storagePath = storagePaths[index] || '';
                const file = selectedFiles[index];

                // S'assurer que le storage_path est valide
                if (!storagePath) {
                  logger.error('Missing storage_path for uploaded file', {
                    fileName: file?.name,
                    index,
                    uploadResults: uploadResults,
                  });
                  // Ne pas bloquer, juste logger et utiliser l'URL comme fallback
                  return {
                    file_name: file?.name || 'unknown',
                    file_type: file?.type || 'application/octet-stream',
                    file_size: file?.size || 0,
                    file_url: fileUrl,
                    storage_path: '', // Vide si pas de chemin disponible
                  };
                }

                // Le storage_path doit être le chemin relatif dans le bucket (ex: vendor-message-attachments/uuid/filename.jpg)
                // Ne pas modifier le chemin, il est déjà correct depuis uploadFileToStorage

                return {
                  file_name: file?.name || 'unknown',
                  file_type: file?.type || 'application/octet-stream',
                  file_size: file?.size || 0,
                  file_url: fileUrl,
                  storage_path: storagePath, // Chemin relatif complet dans le bucket (ex: vendor-message-attachments/uuid/filename.jpg)
                };
              })
            : [], // Si aucun fichier n'a été uploadé avec succès, envoyer un tableau vide
      };

      // Envoyer le message
      const sentMessage = await sendMessage(currentConversation.id, formData);

      if (!sentMessage) {
        throw new Error(
          "Le message n'a pas pu être envoyé. Vérifiez votre connexion et réessayez."
        );
      }

      // Reset form seulement si le message a été envoyé avec succès
      setMessageContent('');
      setSelectedFiles([]);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Afficher un message de succès
      toast({
        title: 'Message envoyé',
        description:
          fileUrls.length > 0
            ? `Votre message a été envoyé avec ${fileUrls.length} pièce(s) jointe(s)`
            : 'Votre message a été envoyé avec succès',
      });
    } catch ( _error: unknown) {
      logger.error('Send vendor message error', { error, storeId, productId });

      // Message d'erreur détaillé
      const err = error instanceof Error ? error : new Error(String(error));
      let  errorMessage= err.message || "Impossible d'envoyer le message";

      // Améliorer le message selon le type d'erreur
      if (err.message?.includes("n'a pas pu être uploadé") || err.message?.includes('uploadé')) {
        errorMessage = err.message;

        // Si c'est l'erreur JSON ou bucket manquant, ajouter des instructions claires
        if (
          err.message.includes('JSON au lieu') ||
          err.message.includes("n'existe pas") ||
          err.message.includes('bucket')
        ) {
          if (!errorMessage.includes('CORRECTIONS NÉCESSAIRES')) {
            errorMessage += '\n\n📋 CORRECTIONS NÉCESSAIRES:\n';
            errorMessage += '1. Allez dans Supabase Dashboard > SQL Editor\n';
            errorMessage +=
              '2. Exécutez la migration: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql\n';
            errorMessage +=
              '3. Vérifiez que le bucket "attachments" est PUBLIC dans Storage > Buckets\n';
            errorMessage += '4. Attendez 2-3 minutes (délai de propagation) puis réessayez';
          }
        }
      } else if (err.message?.includes('Upload failed') || err.message?.includes('upload')) {
        errorMessage = `Erreur de stockage : ${err.message}`;
        if (!errorMessage.includes('CORRECTIONS NÉCESSAIRES')) {
          errorMessage +=
            '\n\n📋 SOLUTION:\nExécutez la migration SQL: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql';
        }
      } else if (err.message?.includes('bucket')) {
        errorMessage = `Erreur de stockage : ${err.message}`;
        if (!errorMessage.includes('CORRECTIONS NÉCESSAIRES')) {
          errorMessage +=
            '\n\n📋 SOLUTION:\nLe bucket "attachments" n\'existe pas. Exécutez: supabase/migrations/20250201_create_and_configure_attachments_bucket.sql';
        }
      } else if (err.message?.includes('permission') || err.message?.includes('403')) {
        errorMessage = `Permission refusée : ${err.message}`;
        if (!errorMessage.includes('CORRECTIONS NÉCESSAIRES')) {
          errorMessage +=
            '\n\n📋 SOLUTION:\nVérifiez que vous êtes connecté et que le bucket "attachments" est PUBLIC.';
        }
      } else if (err.message?.includes('size') || err.message?.includes('trop grand')) {
        errorMessage = `Fichier trop volumineux : ${err.message}. Taille maximale : 10MB.`;
      } else if (err.message?.includes("n'a pas pu être envoyé")) {
        errorMessage = err.message;
      }

      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
        duration: 15000, // Afficher encore plus longtemps pour les erreurs importantes avec instructions
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  /**
   * Get sender icon
   */
  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'store':
        return <Store className="h-3 w-3 text-blue-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Chargement de la messagerie...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Si pas de storeId spécifique, afficher la liste des conversations
  if (!finalStoreId && conversations.length > 0 && !currentConversation) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Messages Clients
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez toutes vos conversations avec vos clients
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:gap-6">
                {/* Liste des conversations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                      Conversations ({conversations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-280px)] max-h-[500px] md:max-h-none">
                      <div className="space-y-1">
                        {conversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => openConversation(conv.id)}
                            className="w-full text-left p-2 md:p-3 hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <div className="flex items-start gap-2 md:gap-3">
                              <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                                <AvatarImage src={conv.store?.logo_url || undefined} />
                                <AvatarFallback>
                                  <Store className="h-3 w-3 md:h-4 md:w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1 gap-2">
                                  <p className="font-medium text-xs md:text-sm truncate">
                                    {conv.store?.name || 'Boutique'}
                                  </p>
                                  {conv.unread_count && conv.unread_count > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 flex-shrink-0"
                                    >
                                      {conv.unread_count}
                                    </Badge>
                                  )}
                                </div>
                                {conv.product && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground truncate mb-1">
                                    {conv.product.name}
                                  </p>
                                )}
                                {conv.last_message && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                    {conv.last_message.content || 'Pièce jointe'}
                                  </p>
                                )}
                                {conv.last_message_at && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                    {format(new Date(conv.last_message_at), 'dd MMM yyyy HH:mm', {
                                      locale: fr,
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Zone de message vide */}
                <Card>
                  <CardContent className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
                      <p className="text-muted-foreground">
                        Choisissez une conversation dans la liste pour commencer à échanger
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!currentConversation && conversations.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <Card>
                <CardContent className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucune conversation</h3>
                    <p className="text-muted-foreground mb-4">
                      {finalStoreId
                        ? "Vous n'avez pas encore de conversation avec ce vendeur"
                        : "Vous n'avez pas encore de conversation avec vos clients"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    {finalStoreId ? 'Contacter le vendeur' : 'Messages Clients'}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {currentConversation?.store?.name ? (
                      <>
                        Communication avec{' '}
                        <span className="font-medium">{currentConversation.store.name}</span>
                      </>
                    ) : finalStoreId ? (
                      'Communication sécurisée avec le vendeur'
                    ) : (
                      'Gérez toutes vos conversations avec vos clients'
                    )}
                  </p>
                </div>

                {/* Conversation Status */}
                {currentConversation && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={currentConversation.status === 'active' ? 'default' : 'secondary'}
                    >
                      {currentConversation.status === 'active'
                        ? 'Active'
                        : currentConversation.status === 'closed'
                          ? 'Fermée'
                          : 'Litige'}
                    </Badge>

                    {currentConversation.admin_intervention && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Intervention Admin
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Interface */}
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_220px] gap-3 md:gap-4">
              {/* Liste des conversations (si pas de storeId spécifique) */}
              {!finalStoreId && conversations.length > 1 && (
                <Card className="md:block">
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg">Conversations</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {conversations.length} conversation(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-280px)] max-h-[600px] md:max-h-none">
                      <div className="space-y-1">
                        {conversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => openConversation(conv.id)}
                            className={`w-full text-left p-2 md:p-3 hover:bg-accent transition-colors border-b last:border-b-0 ${
                              currentConversation?.id === conv.id ? 'bg-accent' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2 md:gap-3">
                              <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                                <AvatarImage src={conv.store?.logo_url || undefined} />
                                <AvatarFallback>
                                  <Store className="h-3 w-3 md:h-4 md:w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1 gap-2">
                                  <p className="font-medium text-xs md:text-sm truncate">
                                    {conv.store?.name || 'Boutique'}
                                  </p>
                                  {conv.unread_count && conv.unread_count > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 flex-shrink-0"
                                    >
                                      {conv.unread_count}
                                    </Badge>
                                  )}
                                </div>
                                {conv.product && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground truncate mb-1">
                                    {conv.product.name}
                                  </p>
                                )}
                                {conv.last_message && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                                    {conv.last_message.content || 'Pièce jointe'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
              {/* Messages Thread */}
              <Card className="flex flex-col h-[calc(100vh-280px)] md:h-[calc(100vh-280px)] min-h-[400px] md:min-h-[500px]">
                <CardHeader className="border-b p-3 md:p-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-base md:text-lg">Messages</CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        {searchResults
                          ? `${searchResults.total} résultat(s)`
                          : `${messages.length} message${messages.length > 1 ? 's' : ''}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {showSearch ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Rechercher dans les messages..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && searchQuery.trim()) {
                                await searchMessages({
                                  conversationId: currentConversation?.id,
                                  query: searchQuery.trim(),
                                });
                              }
                            }}
                            className="w-full sm:w-48 md:w-64"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (searchQuery.trim()) {
                                await searchMessages({
                                  conversationId: currentConversation?.id,
                                  query: searchQuery.trim(),
                                });
                              }
                            }}
                            disabled={isSearchingMessages || !searchQuery.trim()}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSearchQuery('');
                              setShowSearch(false);
                              clearSearch();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                          <Search className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages List */}
                <ScrollArea
                  className="flex-1 p-2 sm:p-3 md:p-4"
                  onScrollCapture={e => {
                    // Infinite scroll: charger plus de messages quand on scroll en haut
                    const target = e.target as HTMLElement;
                    if (
                      target.scrollTop === 0 &&
                      !messagesLoading &&
                      currentConversation &&
                      hasMoreMessages
                    ) {
                      loadMoreMessages();
                    }
                  }}
                >
                  {messagesLoading || isSearchingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (searchResults ? searchResults.messages : messages).length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          {searchResults ? 'Aucun résultat trouvé' : 'Aucun message pour le moment'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchResults
                            ? "Essayez avec d'autres mots-clés"
                            : 'Commencez la conversation ci-dessous'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Référence pour le scroll automatique */}
                      <div ref={messagesTopRef} />

                      {/* Bouton "Charger plus" en haut si disponible */}
                      {!searchResults && hasMoreMessages && (
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadMoreMessages}
                            disabled={messagesLoading}
                            className="text-xs"
                          >
                            <ChevronUp className="h-3 w-3 mr-1" />
                            {messagesLoading
                              ? 'Chargement...'
                              : `Charger plus (${totalMessagesCount - messages.length} restants)`}
                          </Button>
                        </div>
                      )}

                      {(searchResults ? searchResults.messages : messages).map(message => {
                        const isOwn = message.sender_id === user?.id;
                        const isAdmin = message.sender_type === 'admin';

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}
                            >
                              {/* Sender Info */}
                              <div className="flex items-center gap-2 px-2">
                                {!isOwn && (
                                  <div className="flex items-center gap-1">
                                    {getSenderIcon(message.sender_type)}
                                    <span className="text-xs font-medium">
                                      {isAdmin
                                        ? 'Admin'
                                        : message.sender_type === 'store'
                                          ? 'Vendeur'
                                          : 'Vous'}
                                    </span>
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                                </span>
                                {isOwn && message.is_read && (
                                  <CheckCheck className="h-3 w-3 text-primary" />
                                )}
                                {isOwn && !message.is_read && (
                                  <Check className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>

                              {/* Message Bubble */}
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : isAdmin
                                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
                                      : 'bg-muted'
                                }`}
                              >
                                {message.content && (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {searchResults && searchQuery ? (
                                      <span>{highlightText(message.content, searchQuery)}</span>
                                    ) : (
                                      message.content
                                    )}
                                  </p>
                                )}

                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map(attachment => (
                                      <MediaAttachment
                                        key={attachment.id}
                                        attachment={{
                                          id: attachment.id,
                                          file_name: attachment.file_name,
                                          file_type: attachment.file_type,
                                          file_url: attachment.file_url,
                                          storage_path: attachment.storage_path,
                                          file_size: attachment.file_size,
                                        }}
                                        size="medium"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-2 sm:p-3 md:p-4">
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button
                            onClick={() =>
                              setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                            }
                            className="text-destructive hover:text-destructive/80"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Textarea
                      value={messageContent}
                      onChange={e => setMessageContent(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="min-h-[60px] sm:min-h-[80px] resize-none text-sm sm:text-base"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex flex-row sm:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCameraDialog(true)}
                        disabled={uploadingFiles}
                        aria-label="Prendre une photo"
                        title="Prendre une photo"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                      >
                        <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFiles}
                        aria-label="Joindre un fichier"
                        title="Joindre un fichier"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                      >
                        <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={
                          sendingMessage ||
                          uploadingFiles ||
                          (!messageContent.trim() && selectedFiles.length === 0)
                        }
                        size="icon"
                        aria-label="Envoyer le message"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                      >
                        {sendingMessage || uploadingFiles ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sidebar - Store/Product Info (Desktop) */}
              <div className="space-y-4 hidden lg:block">
                {currentConversation?.store && (
                  <Card>
                    <CardHeader className="p-3 md:p-6">
                      <CardTitle className="text-base md:text-lg">Boutique</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-center gap-3">
                        {currentConversation.store.logo_url && (
                          <Avatar>
                            <AvatarImage src={currentConversation.store.logo_url} />
                            <AvatarFallback>
                              <Store className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-medium text-sm md:text-base">
                            {currentConversation.store.name}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {currentConversation.store.slug}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentConversation?.product && (
                  <Card>
                    <CardHeader className="p-3 md:p-6">
                      <CardTitle className="text-base md:text-lg">Produit</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-center gap-3">
                        {currentConversation.product.image_url && (
                          <img
                            src={currentConversation.product.image_url}
                            alt={currentConversation.product.name}
                            className="w-10 h-10 md:w-12 md:h-12 rounded object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div>
                          <p className="font-medium text-xs md:text-sm">
                            {currentConversation.product.name}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar - Store/Product Info (Mobile/Tablet - Below) */}
            {(currentConversation?.store || currentConversation?.product) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:hidden mt-4">
                {currentConversation?.store && (
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">Boutique</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {currentConversation.store.logo_url && (
                          <Avatar>
                            <AvatarImage src={currentConversation.store.logo_url} />
                            <AvatarFallback>
                              <Store className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-medium text-sm">{currentConversation.store.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {currentConversation.store.slug}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentConversation?.product && (
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">Produit</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {currentConversation.product.image_url && (
                          <img
                            src={currentConversation.product.image_url}
                            alt={currentConversation.product.name}
                            className="w-10 h-10 rounded object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div>
                          <p className="font-medium text-xs">{currentConversation.product.name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={showCameraDialog}
        onClose={() => setShowCameraDialog(false)}
        onCapture={handleCameraCapture}
        captureLabel="Prendre la photo"
      />
    </SidebarProvider>
  );
}






