/**
 * Composant pour passer un quiz (étudiants)
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import { useQuiz, useQuizQuestions, useSubmitQuiz } from '@/hooks/courses/useQuiz';

interface QuizTakerProps {
  quizId: string;
  enrollmentId: string;
  onComplete?: (result: any) => void;
}

export const QuizTaker = ({ quizId, enrollmentId, onComplete }: QuizTakerProps) => {
  const { data: quiz } = useQuiz(quizId);
  const { data: questions } = useQuizQuestions(quizId);
  const submitQuiz = useSubmitQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer
  useEffect(() => {
    if (quiz?.time_limit_minutes && !isSubmitted) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
  }, [quiz, isSubmitted]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Temps écoulé, soumettre automatiquement
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions?.[currentQuestionIndex];
  const progressPercent = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (answer: any) => {
    if (currentQuestion) {
      setAnswers({ ...answers, [currentQuestion.id]: answer });
    }
  };

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !questions) return;

    setIsSubmitted(true);

    submitQuiz.mutate({
      quizId: quiz.id,
      enrollmentId,
      answers,
    }, {
      onSuccess: (result) => {
        if (onComplete) {
          onComplete(result);
        }
      },
    });
  };

  if (!quiz || !questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <p className="text-center text-muted-foreground">Chargement du quiz...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              {quiz.description && (
                <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
              )}
            </div>
            {timeRemaining !== null && (
              <Badge 
                variant={timeRemaining < 60 ? 'destructive' : 'secondary'}
                className="text-lg px-4 py-2"
              >
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Question {currentQuestionIndex + 1} sur {questions.length}</span>
              <span className="text-muted-foreground">
                {answeredCount}/{questions.length} répondues
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>
        </CardContent>
      </Card>

      {/* Question actuelle */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Question {currentQuestionIndex + 1}</Badge>
              <Badge variant="secondary">{currentQuestion.points} point(s)</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Texte de la question */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{currentQuestion.question_text}</h3>
            </div>

            {/* QCM */}
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ''}
                onValueChange={(value) => handleAnswer(Number(value))}
              >
                {currentQuestion.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Vrai/Faux */}
            {currentQuestion.question_type === 'true_false' && (
              <div className="flex gap-4">
                <Button
                  variant={answers[currentQuestion.id] === true ? 'default' : 'outline'}
                  onClick={() => handleAnswer(true)}
                  className="flex-1 h-20"
                >
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Vrai
                </Button>
                <Button
                  variant={answers[currentQuestion.id] === false ? 'default' : 'outline'}
                  onClick={() => handleAnswer(false)}
                  className="flex-1 h-20"
                >
                  <AlertCircle className="w-6 h-6 mr-2" />
                  Faux
                </Button>
              </div>
            )}

            {/* Réponse textuelle */}
            {currentQuestion.question_type === 'text' && (
              <div>
                <Label>Votre réponse</Label>
                <Input
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitQuiz.isPending || isSubmitted}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitQuiz.isPending ? 'Envoi...' : 'Soumettre le quiz'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Avertissement questions non répondues */}
          {currentQuestionIndex === questions.length - 1 && answeredCount < questions.length && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Attention : {questions.length - answeredCount} question(s) non répondue(s).
                Vous pouvez quand même soumettre.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

