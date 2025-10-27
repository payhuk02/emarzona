/**
 * Container principal pour gérer le flux Quiz
 * Gère l'état global : pas commencé -> en cours -> terminé
 * Date : 27 octobre 2025
 * Amélioration : Organisation et UX
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  Trophy,
  Clock,
  HelpCircle
} from 'lucide-react';
import { QuizTaker } from './QuizTaker';
import { QuizResults } from './QuizResults';
import { useQuiz, useQuizAttempts } from '@/hooks/courses/useQuiz';

interface QuizContainerProps {
  quizId: string;
  enrollmentId: string;
  onCertificateReady?: () => void;
}

export const QuizContainer = ({ quizId, enrollmentId, onCertificateReady }: QuizContainerProps) => {
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [currentAttempt, setCurrentAttempt] = useState<any>(null);
  
  const { data: quiz } = useQuiz(quizId);
  const { data: attempts } = useQuizAttempts(quizId, enrollmentId);

  const handleStart = () => {
    setQuizState('in_progress');
  };

  const handleComplete = (result: any) => {
    setCurrentAttempt(result.attempt);
    setQuizState('completed');
    
    // Si réussi et que le callback est fourni
    if (result.passed && onCertificateReady) {
      onCertificateReady();
    }
  };

  const handleRetry = () => {
    setQuizState('in_progress');
    setCurrentAttempt(null);
  };

  if (!quiz) {
    return (
      <Card>
        <CardContent className="p-12">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  // État : Pas commencé
  if (quizState === 'not_started') {
    const bestAttempt = attempts && attempts.length > 0 
      ? attempts.reduce((best, current) => current.score > best.score ? current : best)
      : null;

    return (
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* En-tête */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-muted-foreground">{quiz.description}</p>
              )}
            </div>

            {/* Informations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <HelpCircle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-xl font-bold">{quiz.total_questions}</p>
              </div>
              
              {quiz.time_limit_minutes && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm text-muted-foreground">Temps limite</p>
                  <p className="text-xl font-bold">{quiz.time_limit_minutes} min</p>
                </div>
              )}
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-muted-foreground">Score requis</p>
                <p className="text-xl font-bold">{quiz.passing_score}%</p>
              </div>
            </div>

            {/* Meilleur score */}
            {bestAttempt && (
              <div className="text-center">
                <Badge variant={bestAttempt.passed ? 'default' : 'secondary'}>
                  Meilleur score : {bestAttempt.score}%
                  {bestAttempt.passed && ' ✓ Réussi'}
                </Badge>
              </div>
            )}

            {/* Bouton démarrer */}
            <Button 
              onClick={handleStart} 
              size="lg" 
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              {attempts && attempts.length > 0 ? 'Recommencer le quiz' : 'Commencer le quiz'}
            </Button>

            {/* Nombre de tentatives */}
            {attempts && attempts.length > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                {attempts.length} tentative{attempts.length > 1 ? 's' : ''} effectuée{attempts.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // État : En cours
  if (quizState === 'in_progress') {
    return (
      <QuizTaker
        quizId={quizId}
        enrollmentId={enrollmentId}
        onComplete={handleComplete}
      />
    );
  }

  // État : Terminé
  return (
    <QuizResults
      quizId={quizId}
      attempt={currentAttempt}
      onRetry={handleRetry}
      showCertificateButton={currentAttempt?.passed}
      onDownloadCertificate={onCertificateReady}
    />
  );
};

