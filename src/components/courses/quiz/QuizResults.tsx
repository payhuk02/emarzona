/**
 * Affichage des résultats de quiz
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  XCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download
} from 'lucide-react';
import { useQuizQuestions } from '@/hooks/courses/useQuiz';

interface QuizResultsProps {
  quizId: string;
  attempt: any;
  onRetry?: () => void;
  onDownloadCertificate?: () => void;
  showCertificateButton?: boolean;
}

export const QuizResults = ({ 
  quizId, 
  attempt, 
  onRetry,
  onDownloadCertificate,
  showCertificateButton = false
}: QuizResultsProps) => {
  const { data: questions } = useQuizQuestions(quizId);

  if (!questions || !attempt) {
    return <div>Chargement...</div>;
  }

  const passed = attempt.passed;
  const score = attempt.score;
  const detailedResults = attempt.detailed_results || [];

  return (
    <div className="space-y-6">
      {/* Résultat principal */}
      <Card className={passed ? 'border-green-500 border-2' : 'border-orange-500 border-2'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {passed ? (
                <>
                  <Trophy className="w-6 h-6 text-green-600" />
                  Quiz réussi !
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-orange-600" />
                  Quiz non réussi
                </>
              )}
            </CardTitle>
            <Badge 
              variant={passed ? 'default' : 'destructive'}
              className="text-2xl px-6 py-2"
            >
              {score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Score obtenu</span>
              <span className="text-muted-foreground">
                {detailedResults.filter((r: any) => r.is_correct).length}/{questions.length} correct(s)
              </span>
            </div>
            <Progress 
              value={score} 
              className={`h-3 ${passed ? '[&>div]:bg-green-600' : '[&>div]:bg-orange-600'}`}
            />
          </div>

          {/* Message */}
          {passed ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Félicitations ! Vous avez réussi ce quiz.
                {showCertificateButton && " Vous pouvez télécharger votre certificat."}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Vous n'avez pas atteint le score requis. Révisez le cours et réessayez !
              </AlertDescription>
            </Alert>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2">
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            )}
            {showCertificateButton && passed && onDownloadCertificate && (
              <Button onClick={onDownloadCertificate} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le certificat
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Détail des réponses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Détail des réponses</h3>
        
        {questions.map((question: any, index: number) => {
          const result = detailedResults.find((r: any) => r.question_id === question.id);
          const isCorrect = result?.is_correct;
          const userAnswer = result?.user_answer;

          return (
            <Card key={question.id} className={isCorrect ? 'border-green-200' : 'border-red-200'}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 mt-1 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Question {index + 1}</Badge>
                      <Badge variant={isCorrect ? 'default' : 'destructive'}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold">{question.question_text}</h4>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Votre réponse */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Votre réponse :</p>
                  <p className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAnswer(question, userAnswer)}
                  </p>
                </div>

                {/* Bonne réponse si incorrect */}
                {!isCorrect && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Bonne réponse :</p>
                    <p className="font-medium text-green-600">
                      {formatAnswer(question, question.correct_answer)}
                    </p>
                  </div>
                )}

                {/* Explication */}
                {question.explanation && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                    <p className="text-sm font-medium text-blue-900 mb-1">💡 Explication :</p>
                    <p className="text-sm text-blue-800">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Formatte une réponse selon le type de question
 */
function formatAnswer(question: any, answer: any): string {
  switch (question.question_type) {
    case 'multiple_choice':
      if (question.options && typeof answer === 'number') {
        return question.options[answer] || 'Aucune réponse';
      }
      return 'Aucune réponse';
    
    case 'true_false':
      return answer === true ? 'Vrai' : answer === false ? 'Faux' : 'Aucune réponse';
    
    case 'text':
      return answer || 'Aucune réponse';
    
    default:
      return String(answer || 'Aucune réponse');
  }
}

