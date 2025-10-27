/**
 * Constructeur de quiz pour les instructeurs
 * Permet de créer des quiz avec plusieurs types de questions
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2,
  Save
} from 'lucide-react';
import { useCreateQuiz } from '@/hooks/courses/useQuiz';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  points: number;
  options?: string[];
  correctAnswer: any;
  explanation?: string;
}

interface QuizBuilderProps {
  courseId: string;
  onSuccess?: () => void;
}

export const QuizBuilder = ({ courseId, onSuccess }: QuizBuilderProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [questions, setQuestions] = useState<Question[]>([]);

  const createQuiz = useCreateQuiz();

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      text: '',
      type: 'multiple_choice',
      points: 1,
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSubmit = async () => {
    if (!title || questions.length === 0) {
      return;
    }

    const questionsData = questions.map((q, index) => ({
      text: q.text,
      type: q.type,
      points: q.points,
      options: q.type === 'multiple_choice' ? q.options : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      orderIndex: index,
    }));

    createQuiz.mutate({
      courseId,
      title,
      description,
      passingScore,
      timeLimit,
      questionsData,
      orderIndex: 0,
    }, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        // Reset form
        setTitle('');
        setDescription('');
        setQuestions([]);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Informations du quiz */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quiz-title">Titre du quiz *</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quiz - Module 1"
            />
          </div>

          <div>
            <Label htmlFor="quiz-description">Description (optionnel)</Label>
            <Textarea
              id="quiz-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez ce quiz..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passing-score">Score de réussite (%) *</Label>
              <Input
                id="passing-score"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="time-limit">Limite de temps (minutes, optionnel)</Label>
              <Input
                id="time-limit"
                type="number"
                min="0"
                value={timeLimit || ''}
                onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Aucune limite"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
          <Button onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une question
          </Button>
        </div>

        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <Badge variant="outline">Question {index + 1}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteQuestion(question.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type de question */}
              <div>
                <Label>Type de question</Label>
                <Select
                  value={question.type}
                  onValueChange={(value: any) => updateQuestion(question.id, { 
                    type: value,
                    options: value === 'multiple_choice' ? ['', '', '', ''] : undefined,
                    correctAnswer: value === 'true_false' ? false : '',
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">QCM (Choix multiple)</SelectItem>
                    <SelectItem value="true_false">Vrai/Faux</SelectItem>
                    <SelectItem value="text">Réponse textuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Texte de la question */}
              <div>
                <Label>Question *</Label>
                <Textarea
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  placeholder="Posez votre question..."
                  rows={2}
                />
              </div>

              {/* Points */}
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) })}
                  className="w-24"
                />
              </div>

              {/* Options pour QCM */}
              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-2">
                  <Label>Options de réponse</Label>
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                      />
                      <Button
                        variant={question.correctAnswer === optIndex ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateQuestion(question.id, { correctAnswer: optIndex })}
                        title="Marquer comme réponse correcte"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Réponse pour Vrai/Faux */}
              {question.type === 'true_false' && (
                <div>
                  <Label>Réponse correcte</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={question.correctAnswer === true ? 'default' : 'outline'}
                      onClick={() => updateQuestion(question.id, { correctAnswer: true })}
                    >
                      Vrai
                    </Button>
                    <Button
                      variant={question.correctAnswer === false ? 'default' : 'outline'}
                      onClick={() => updateQuestion(question.id, { correctAnswer: false })}
                    >
                      Faux
                    </Button>
                  </div>
                </div>
              )}

              {/* Réponse pour texte */}
              {question.type === 'text' && (
                <div>
                  <Label>Réponse correcte attendue</Label>
                  <Input
                    value={question.correctAnswer || ''}
                    onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                    placeholder="La réponse attendue..."
                  />
                </div>
              )}

              {/* Explication */}
              <div>
                <Label>Explication (optionnel)</Label>
                <Textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                  placeholder="Expliquez pourquoi c'est la bonne réponse..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <p>Aucune question ajoutée</p>
              <p className="text-sm mt-2">Cliquez sur "Ajouter une question" pour commencer</p>
            </div>
          </Card>
        )}
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!title || questions.length === 0 || createQuiz.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {createQuiz.isPending ? 'Création...' : 'Créer le quiz'}
        </Button>
      </div>
    </div>
  );
};

