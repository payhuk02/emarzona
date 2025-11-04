/**
 * Assignment Submission Form Component
 * Formulaire pour soumettre un assignment
 */

import { useState } from 'react';
import { FileText, Upload, X, Link as LinkIcon, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubmitAssignment, type CourseAssignment } from '@/hooks/courses/useAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AssignmentSubmissionFormProps {
  assignment: CourseAssignment;
  enrollmentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AssignmentSubmissionForm = ({
  assignment,
  enrollmentId,
  onSuccess,
  onCancel,
}: AssignmentSubmissionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const submitAssignment = useSubmitAssignment();

  const [submissionText, setSubmissionText] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionCode, setSubmissionCode] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (files.length + uploadedFiles.length > assignment.max_files) {
      toast({
        title: 'Erreur',
        description: `Maximum ${assignment.max_files} fichiers autorisés`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploaded: typeof uploadedFiles = [];

      for (const file of Array.from(files)) {
        // Vérifier type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension && !assignment.allowed_file_types.includes(fileExtension)) {
          toast({
            title: 'Erreur',
            description: `Type de fichier non autorisé: ${fileExtension}`,
            variant: 'destructive',
          });
          continue;
        }

        // Vérifier taille
        if (file.size > assignment.max_file_size) {
          toast({
            title: 'Erreur',
            description: `Fichier trop volumineux: ${file.name} (max: ${(assignment.max_file_size / 1048576).toFixed(0)}MB)`,
            variant: 'destructive',
          });
          continue;
        }

        // Upload vers Supabase Storage
        const filePath = `assignments/${assignment.id}/${user?.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('course-assignments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtenir URL publique
        const { data: urlData } = supabase.storage
          .from('course-assignments')
          .getPublicUrl(filePath);

        uploaded.push({
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        });
      }

      setUploadedFiles([...uploadedFiles, ...uploaded]);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté',
        variant: 'destructive',
      });
      return;
    }

    // Validation selon type
    if (assignment.assignment_type === 'text' && !submissionText.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir votre réponse',
        variant: 'destructive',
      });
      return;
    }

    if (assignment.assignment_type === 'url' && !submissionUrl.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une URL',
        variant: 'destructive',
      });
      return;
    }

    if (assignment.assignment_type === 'code' && !submissionCode.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir votre code',
        variant: 'destructive',
      });
      return;
    }

    if (assignment.assignment_type === 'file_upload' && uploadedFiles.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez uploader au moins un fichier',
        variant: 'destructive',
      });
      return;
    }

    submitAssignment.mutate(
      {
        assignmentId: assignment.id,
        enrollmentId,
        userId: user.id,
        submissionData: {
          submission_text: submissionText || undefined,
          submission_url: submissionUrl || undefined,
          submission_code: submissionCode || undefined,
          submission_files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Soumettre: {assignment.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        {assignment.instructions && (
          <Alert>
            <AlertDescription className="whitespace-pre-wrap">
              {assignment.instructions}
            </AlertDescription>
          </Alert>
        )}

        {/* Text submission */}
        {(assignment.assignment_type === 'text' || assignment.assignment_type === 'mixed') && (
          <div className="space-y-2">
            <Label htmlFor="submission-text">Votre réponse *</Label>
            <Textarea
              id="submission-text"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Saisissez votre réponse ici..."
              rows={10}
              className="resize-none"
            />
          </div>
        )}

        {/* URL submission */}
        {(assignment.assignment_type === 'url' || assignment.assignment_type === 'mixed') && (
          <div className="space-y-2">
            <Label htmlFor="submission-url">URL de votre travail *</Label>
            <Input
              id="submission-url"
              type="url"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="https://..."
              className="font-mono"
            />
          </div>
        )}

        {/* Code submission */}
        {(assignment.assignment_type === 'code' || assignment.assignment_type === 'mixed') && (
          <div className="space-y-2">
            <Label htmlFor="submission-code">Votre code *</Label>
            <Textarea
              id="submission-code"
              value={submissionCode}
              onChange={(e) => setSubmissionCode(e.target.value)}
              placeholder="// Votre code ici..."
              rows={15}
              className="font-mono resize-none"
            />
          </div>
        )}

        {/* File upload */}
        {(assignment.assignment_type === 'file_upload' || assignment.assignment_type === 'mixed') && (
          <div className="space-y-2">
            <Label>Fichiers *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Types autorisés: {assignment.allowed_file_types.join(', ')}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Taille max: {(assignment.max_file_size / 1048576).toFixed(0)}MB par fichier
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading || uploadedFiles.length >= assignment.max_files}
                accept={assignment.allowed_file_types.map(t => `.${t}`).join(',')}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading || uploadedFiles.length >= assignment.max_files}
                  asChild
                >
                  <span>
                    {isUploading ? 'Upload en cours...' : 'Choisir fichiers'}
                  </span>
                </Button>
              </Label>
            </div>

            {/* Uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitAssignment.isPending || isUploading}
            className="flex-1"
          >
            {submitAssignment.isPending ? 'Soumission...' : 'Soumettre'}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={submitAssignment.isPending}
            >
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

