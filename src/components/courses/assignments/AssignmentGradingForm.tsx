/**
 * Assignment Grading Form Component
 * Formulaire pour noter un assignment (instructeur)
 */

import { useState } from 'react';
import { FileText, Star } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGradeAssignment, type AssignmentSubmission, type CourseAssignment } from '@/hooks/courses/useAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AssignmentGradingFormProps {
  assignment: CourseAssignment;
  submission: AssignmentSubmission;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AssignmentGradingForm = ({
  assignment,
  submission,
  onSuccess,
  onCancel,
}: AssignmentGradingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const gradeAssignment = useGradeAssignment();

  const [grade, setGrade] = useState<number>(submission.grade || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(
    submission.rubric_scores || {}
  );

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté',
        variant: 'destructive',
      });
      return;
    }

    if (grade < 0 || grade > assignment.points_possible) {
      toast({
        title: 'Erreur',
        description: `La note doit être entre 0 et ${assignment.points_possible}`,
        variant: 'destructive',
      });
      return;
    }

    gradeAssignment.mutate(
      {
        submissionId: submission.id,
        gradedBy: user.id,
        gradingData: {
          grade,
          feedback: feedback || undefined,
          rubric_scores: rubricScores,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  const gradePercentage = assignment.points_possible > 0 
    ? Math.round((grade / assignment.points_possible) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Noter: {assignment.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submission preview */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Soumission de l'étudiant</span>
            {submission.is_late && (
              <Badge variant="destructive">
                Retard: {submission.late_hours}h
              </Badge>
            )}
          </div>
          {submission.submission_text && (
            <p className="text-sm whitespace-pre-wrap">{submission.submission_text}</p>
          )}
          {submission.submission_url && (
            <a
              href={submission.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {submission.submission_url}
            </a>
          )}
          {submission.submission_files && submission.submission_files.length > 0 && (
            <div className="space-y-1">
              {submission.submission_files.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block"
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  {file.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Rubric */}
        {assignment.rubric && assignment.rubric.length > 0 && (
          <div className="space-y-3">
            <Label>Rubrique d'évaluation</Label>
            {assignment.rubric.map((criterion, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{criterion.criterion}</p>
                    {criterion.description && (
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{criterion.points} pts</Badge>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={criterion.points}
                  value={rubricScores[criterion.criterion] || 0}
                  onChange={(e) =>
                    setRubricScores({
                      ...rubricScores,
                      [criterion.criterion]: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24"
                />
              </div>
            ))}
          </div>
        )}

        {/* Grade */}
        <div className="space-y-2">
          <Label htmlFor="grade">
            Note * (0 - {assignment.points_possible})
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="grade"
              type="number"
              min={0}
              max={assignment.points_possible}
              value={grade}
              onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
              className="w-32"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-lg font-semibold">{assignment.points_possible}</span>
              <Badge variant="secondary">{gradePercentage}%</Badge>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Feedback</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Votre feedback pour l'étudiant..."
            rows={6}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={gradeAssignment.isPending}
            className="flex-1"
          >
            {gradeAssignment.isPending ? 'Notation...' : 'Enregistrer la note'}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={gradeAssignment.isPending}
            >
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

