/**
 * Dispute Detail Page - Dispute Management
 * Date: 28 octobre 2025
 * 
 * Gestion complète des litiges entre vendeur et client
 * Features: Timeline, messages, upload preuves, résolution admin
 */

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Paperclip,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  User,
  Store,
  Crown,
  MessageSquare,
  Calendar,
  Package,
  X
} from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useDisputes } from '@/hooks/useDisputes';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DISPUTE_REASONS = [
  { value: 'not_received', label: 'Produit non reçu' },
  { value: 'not_as_described', label: 'Produit non conforme' },
  { value: 'damaged', label: 'Produit endommagé' },
  { value: 'wrong_item', label: 'Mauvais article' },
  { value: 'quality_issue', label: 'Problème de qualité' },
  { value: 'seller_unresponsive', label: 'Vendeur ne répond pas' },
  { value: 'payment_issue', label: 'Problème de paiement' },
  { value: 'other', label: 'Autre' },
];

export default function DisputeDetail() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    disputes,
    loading,
    createDispute,
    updateDisputeStatus,
    addDisputeMessage,
  } = useDisputes();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current dispute
  const dispute = disputes.find(d => d.id === disputeId);

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file sizes (max 10MB per file)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse 10MB`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  /**
   * Remove selected file
   */
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Upload files to storage
   */
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `disputes/${disputeId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('dispute-evidence')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('dispute-evidence')
        .getPublicUrl(filePath);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
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

    if (!disputeId) return;

    try {
      setUploadingFiles(true);

      // Upload files if any
      let fileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        fileUrls = await uploadFiles(selectedFiles);
      }

      await addDisputeMessage(disputeId, {
        content: messageContent,
        attachments: fileUrls,
      });

      toast({
        title: '✅ Message ajouté',
        description: 'Votre message a été envoyé',
      });

      // Reset form
      setMessageContent('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer le message',
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  /**
   * Handle resolve dispute
   */
  const handleResolveDispute = async () => {
    if (!disputeId || !resolution.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir une résolution',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      await updateDisputeStatus(disputeId, 'resolved', resolution, adminNotes);

      toast({
        title: '✅ Litige résolu',
        description: 'Le litige a été marqué comme résolu',
      });

      setShowResolveDialog(false);
      setResolution('');
      setAdminNotes('');
    } catch (error: any) {
      console.error('Resolve dispute error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de résoudre le litige',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: 'destructive', icon: AlertTriangle, label: 'Ouvert' },
      investigating: { variant: 'secondary', icon: Clock, label: 'En cours d\'investigation' },
      resolved: { variant: 'default', icon: CheckCircle, label: 'Résolu' },
      closed: { variant: 'default', icon: XCircle, label: 'Fermé' },
    };

    const config = variants[status] || variants.open;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                  <p className="text-muted-foreground">Chargement du litige...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!dispute) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              
              <Card>
                <CardContent className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Litige non trouvé</h3>
                    <p className="text-muted-foreground">
                      Ce litige n'existe pas ou vous n'avez pas accès
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
          <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    Litige #{disputeId?.slice(0, 8)}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {dispute.reason && DISPUTE_REASONS.find(r => r.value === dispute.reason)?.label}
                  </p>
                </div>

                {getStatusBadge(dispute.status)}
              </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-[1fr_350px] gap-6">
              {/* Left: Timeline & Messages */}
              <div className="space-y-6">
                {/* Dispute Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations du Litige</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Ouvert par</p>
                        <div className="flex items-center gap-2">
                          {dispute.initiator_type === 'customer' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Store className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {dispute.initiator_type === 'customer' ? 'Client' : 'Vendeur'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Date d'ouverture</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {format(new Date(dispute.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {dispute.description}
                      </p>
                    </div>

                    {dispute.resolution && (
                      <>
                        <Separator />
                        <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                              Résolution
                            </p>
                            <p className="text-green-800 dark:text-green-200 text-sm">
                              {dispute.resolution}
                            </p>
                            {dispute.resolved_at && (
                              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                                Résolu le {format(new Date(dispute.resolved_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Messages
                      </CardTitle>
                      <Badge variant="secondary">
                        {dispute.messages?.length || 0} message{(dispute.messages?.length || 0) > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      {!dispute.messages || dispute.messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Aucun message</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dispute.messages.map((message: any, index: number) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg bg-muted"
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {message.sender_type === 'admin' ? '👑' : 
                                     message.sender_type === 'customer' ? '👤' : '🏪'}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {message.sender_type === 'admin' ? 'Administrateur' :
                                       message.sender_type === 'customer' ? 'Client' : 'Vendeur'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(message.created_at), 'dd MMM à HH:mm', { locale: fr })}
                                    </span>
                                  </div>

                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {message.attachments.map((url: string, idx: number) => (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          Pièce jointe {idx + 1}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Add Message */}
                    {dispute.status !== 'closed' && dispute.status !== 'resolved' && (
                      <>
                        <Separator className="my-4" />
                        
                        {/* Selected Files Preview */}
                        {selectedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                              >
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Ajouter un message..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            className="min-h-[80px]"
                            disabled={uploadingFiles}
                          />

                          <div className="flex flex-col gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingFiles}
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>

                            <Button
                              onClick={handleSendMessage}
                              disabled={uploadingFiles || (!messageContent.trim() && selectedFiles.length === 0)}
                            >
                              {uploadingFiles ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Actions */}
              <div className="space-y-4">
                {/* Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Commande
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dispute.order && (
                      <>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Numéro</p>
                            <p className="font-medium">{dispute.order.order_number}</p>
                          </div>
                          <Separator />
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/orders/${dispute.order_id}`)}
                          >
                            Voir commande
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/orders/${dispute.order_id}/messaging`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messagerie
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Admin Actions */}
                {dispute.status === 'open' && (
                  <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                        <Crown className="h-5 w-5" />
                        Actions Admin
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => setShowResolveDialog(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Résoudre le litige
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => updateDisputeStatus(disputeId!, 'investigating')}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Marquer en investigation
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Help Card */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <Shield className="h-5 w-5" />
                      Informations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Les litiges sont examinés par notre équipe. Fournissez un maximum de preuves (photos, captures d'écran) pour accélérer la résolution.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Resolve Dispute Dialog */}
            <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Résoudre le Litige
                  </DialogTitle>
                  <DialogDescription>
                    Fournir une résolution pour ce litige
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolution">Résolution (visible par tous) *</Label>
                    <Textarea
                      id="resolution"
                      placeholder="Décrivez la résolution du litige..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="min-h-[100px] mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="admin-notes">Notes internes admin (optionnel)</Label>
                    <Textarea
                      id="admin-notes"
                      placeholder="Notes visibles uniquement par les admins..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="min-h-[80px] mt-2"
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cette action marquera le litige comme résolu et notifiera toutes les parties concernées.
                    </AlertDescription>
                  </Alert>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowResolveDialog(false)} disabled={isProcessing}>
                    Annuler
                  </Button>
                  <Button onClick={handleResolveDispute} disabled={isProcessing || !resolution.trim()}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmer la résolution
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

