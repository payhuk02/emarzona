/**
 * Formulaire FAQs pour les cours
 * Permet d'ajouter des questions/réponses fréquentes
 * Date : 27 octobre 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Plus, Trash2, GripVertical, Info, Sparkles } from 'lucide-react';

interface CourseFAQFormProps {
  data: FAQ[];
  onChange: (data: FAQ[]) => void;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const SUGGESTED_FAQS = [
  {
    question: 'Combien de temps ai-je accès au cours ?',
    answer:
      'Vous avez un accès à vie au cours une fois inscrit. Vous pouvez le suivre à votre rythme et y revenir autant de fois que vous le souhaitez.',
  },
  {
    question: 'Y a-t-il des prérequis pour suivre ce cours ?',
    answer:
      'Les prérequis sont listés dans la section "Prérequis" ci-dessus. En général, ce cours est accessible aux débutants avec une connaissance de base en [domaine].',
  },
  {
    question: 'Est-ce que je reçois un certificat à la fin ?',
    answer:
      'Oui ! Vous recevez un certificat de complétion une fois que vous avez terminé toutes les leçons et réussi le quiz final.',
  },
  {
    question: 'Puis-je télécharger les vidéos ?',
    answer:
      'Les vidéos sont disponibles en streaming sur la plateforme. Cependant, vous pouvez télécharger les ressources supplémentaires (PDF, code source, etc.).',
  },
  {
    question: "Comment contacter l'instructeur ?",
    answer:
      "Vous pouvez poser vos questions directement dans la section Discussions de chaque leçon. L'instructeur répond généralement sous 24-48h.",
  },
  {
    question: 'Y a-t-il une garantie satisfait ou remboursé ?',
    answer:
      'Oui ! Nous offrons une garantie de remboursement de 30 jours si le cours ne répond pas à vos attentes.',
  },
];

export const CourseFAQForm = ({ data, onChange }: CourseFAQFormProps) => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: Math.random().toString(36).substring(7),
      question: '',
      answer: '',
    };
    onChange([...data, newFAQ]);
    setExpandedFAQ(newFAQ.id);
  };

  const removeFAQ = (id: string) => {
    onChange(data.filter(faq => faq.id !== id));
  };

  const updateFAQ = (id: string, field: 'question' | 'answer', value: string) => {
    onChange(data.map(faq => (faq.id === id ? { ...faq, [field]: value } : faq)));
  };

  const addSuggestedFAQ = (suggested: { question: string; answer: string }) => {
    const newFAQ: FAQ = {
      id: Math.random().toString(36).substring(7),
      question: suggested.question,
      answer: suggested.answer,
    };
    onChange([...data, newFAQ]);
  };

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    const newData = [...data];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newData.length) {
      [newData[index], newData[newIndex]] = [newData[newIndex], newData[index]];
      onChange(newData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Questions Fréquentes (FAQ)
        </h2>
        <p className="text-muted-foreground mt-1">
          Anticipez les questions de vos étudiants pour augmenter le taux d'inscription
        </p>
      </div>

      {/* Alert d'information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Pourquoi ajouter des FAQs ?</strong> Les FAQs répondent aux objections avant
          l'achat et peuvent augmenter vos inscriptions de 20-30%. Elles améliorent aussi votre SEO.
        </AlertDescription>
      </Alert>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">FAQs ajoutées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {data.length >= 5 ? 'Excellent' : data.length >= 3 ? 'Bien' : 'À compléter'}
            </div>
            <p className="text-xs text-muted-foreground">Statut</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQs suggérées */}
      {data.length < 3 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              FAQs suggérées
            </CardTitle>
            <CardDescription>
              Cliquez pour ajouter rapidement des questions courantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SUGGESTED_FAQS.map((suggested, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => addSuggestedFAQ(suggested)}
              >
                <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{suggested.question}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Liste des FAQs */}
      <div className="space-y-4">
        {data.map((faq, index) => (
          <Card key={faq.id} className="relative">
            <CardHeader>
              <div className="flex items-start gap-4">
                {/* Drag handle */}
                <div className="flex flex-col gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveFAQ(index, 'up')}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    ↑
                  </Button>
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveFAQ(index, 'down')}
                    disabled={index === data.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    ↓
                  </Button>
                </div>

                {/* Contenu */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge>FAQ #{index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFAQ(faq.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Question */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Question</label>
                    <Input
                      placeholder="Ex: Combien de temps ai-je accès au cours ?"
                      value={faq.question}
                      onChange={e => updateFAQ(faq.id, 'question', e.target.value)}
                    />
                  </div>

                  {/* Réponse */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Réponse</label>
                    <Textarea
                      placeholder="Ex: Vous avez un accès à vie au cours une fois inscrit..."
                      value={faq.answer}
                      onChange={e => updateFAQ(faq.id, 'answer', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Bouton ajouter */}
      <Button
        type="button"
        variant="outline"
        onClick={addFAQ}
        className="w-full border-dashed border-2 h-16"
      >
        <Plus className="w-5 h-5 mr-2" />
        Ajouter une FAQ
      </Button>

      {/* Conseils */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Conseils pour de bonnes FAQs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            ✅ <strong>Soyez concis</strong> : Réponses courtes et directes
          </p>
          <p>
            ✅ <strong>Anticipez les objections</strong> : Prix, durée, difficulté, etc.
          </p>
          <p>
            ✅ <strong>Utilisez "vous"</strong> : Parlez directement à l'étudiant
          </p>
          <p>
            ✅ <strong>Ajoutez des chiffres</strong> : "24-48h", "30 jours", etc.
          </p>
          <p>
            ✅ <strong>5-8 FAQs idéal</strong> : Assez pour rassurer, pas trop pour submerger
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
