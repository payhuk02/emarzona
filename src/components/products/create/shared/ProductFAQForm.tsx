/**
 * Product FAQ Form - Shared Component
 * Date: 28 octobre 2025
 *
 * Formulaire FAQ réutilisable pour tous types de produits
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArtistFormField } from '../artist/ArtistFormField';
import { getFieldHelpHint, formatHelpHint } from '@/lib/artist-product-help-hints';
import { validateLength } from '@/lib/artist-product-validators';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface ProductFAQFormProps {
  data: FAQ[];
  onUpdate: (faqs: FAQ[]) => void;
}

// Templates FAQ par type de produit
const  FAQ_TEMPLATES: Record<string, Array<{ question: string; answer: string }>> = {
  digital: [
    {
      question: 'Comment télécharger ce produit ?',
      answer:
        "Après l'achat, vous recevrez un email avec un lien de téléchargement. Vous pouvez également accéder à vos téléchargements depuis votre tableau de bord.",
    },
    {
      question: 'Est-ce que je peux obtenir un remboursement ?',
      answer:
        'Oui, nous offrons une garantie satisfait ou remboursé de 30 jours. Si le produit ne répond pas à vos attentes, contactez notre support.',
    },
    {
      question: 'Combien de fois puis-je télécharger ce produit ?',
      answer:
        'Vous avez accès illimité à vos téléchargements. Vous pouvez télécharger le produit autant de fois que nécessaire.',
    },
  ],
  physical: [
    {
      question: 'Quels sont les délais de livraison ?',
      answer:
        'Les délais de livraison varient selon votre localisation. Généralement, comptez 3-5 jours ouvrés pour la livraison standard.',
    },
    {
      question: 'Puis-je retourner le produit ?',
      answer:
        "Oui, vous disposez de 14 jours après réception pour retourner le produit s'il ne vous convient pas, dans son emballage d'origine.",
    },
    {
      question: 'Quels sont les frais de livraison ?',
      answer:
        'Les frais de livraison sont calculés automatiquement lors du paiement en fonction de votre adresse et du poids du colis.',
    },
  ],
  service: [
    {
      question: 'Comment prendre rendez-vous ?',
      answer:
        'Sélectionnez un créneau horaire disponible dans le calendrier, puis confirmez votre réservation. Vous recevrez une confirmation par email.',
    },
    {
      question: 'Puis-je annuler ou reporter mon rendez-vous ?',
      answer:
        "Oui, vous pouvez annuler ou reporter votre rendez-vous jusqu'à 24h avant l'heure prévue depuis votre espace client.",
    },
    {
      question: 'Le service est-il en ligne ou en présentiel ?',
      answer:
        'Le mode de prestation est indiqué dans la description du service. Certains services sont disponibles dans les deux formats.',
    },
  ],
};

export const ProductFAQForm = ({ data, onUpdate }: ProductFAQFormProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [isAdding, setIsAdding] = useState(false);

  const addFAQ = () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) return;

    const  faq: FAQ = {
      id: `faq-${Date.now()}`,
      question: newFAQ.question,
      answer: newFAQ.answer,
      order: data.length,
    };

    onUpdate([...data, faq]);
    setNewFAQ({ question: '', answer: '' });
    setIsAdding(false);
  };

  const updateFAQ = (id: string, updates: Partial<FAQ>) => {
    onUpdate(data.map(faq => (faq.id === id ? { ...faq, ...updates } : faq)));
    setEditingId(null);
  };

  const deleteFAQ = (id: string) => {
    onUpdate(data.filter(faq => faq.id !== id));
  };

  const moveFAQ = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(faq => faq.id === id);
    if (index === -1) return;

    const newData = [...data];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newData.length) return;

    [newData[index], newData[targetIndex]] = [newData[targetIndex], newData[index]];

    // Update order
    newData.forEach((faq, idx) => {
      faq.order = idx;
    });

    onUpdate(newData);
  };

  const addTemplates = (type: 'digital' | 'physical' | 'service') => {
    const templates = FAQ_TEMPLATES[type];
    const newFAQs = templates.map((template, index) => ({
      id: `faq-${Date.now()}-${index}`,
      question: template.question,
      answer: template.answer,
      order: data.length + index,
    }));

    onUpdate([...data, ...newFAQs]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Questions Fréquentes (FAQ)</CardTitle>
                <CardDescription>
                  Répondez aux questions courantes pour réduire les demandes de support
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">
              {data.length} FAQ{data.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addTemplates('digital')}>
              + Templates Digital
            </Button>
            <Button variant="outline" size="sm" onClick={() => addTemplates('physical')}>
              + Templates Physique
            </Button>
            <Button variant="outline" size="sm" onClick={() => addTemplates('service')}>
              + Templates Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des FAQs */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vos FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {data.map((faq, index) => (
                <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveFAQ(faq.id, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation disabled:opacity-30"
                        aria-label="Déplacer vers le haut"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveFAQ(faq.id, 'down')}
                        disabled={index === data.length - 1}
                        className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation disabled:opacity-30"
                        aria-label="Déplacer vers le bas"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="text-left font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {editingId === faq.id ? (
                          <div className="space-y-3 pt-2">
                            <div>
                              <ArtistFormField
                                id={`faq_question_${faq.id}`}
                                label="Question"
                                value={faq.question}
                                onChange={value => updateFAQ(faq.id, { question: value as string })}
                                placeholder="Ex: Comment fonctionne la livraison ?"
                                maxLength={255}
                                showCharCount
                                showHelpIcon
                                helpHint={formatHelpHint(
                                  getFieldHelpHint('faq_question') || {
                                    hint: 'Question fréquente sur le produit',
                                  }
                                )}
                                validationFn={value => {
                                  if (!value || (value as string).trim().length === 0) {
                                    return 'La question est requise';
                                  }
                                  return validateLength(value as string, 1, 255, 'La question FAQ');
                                }}
                              />
                            </div>
                            <div>
                              <ArtistFormField
                                id={`faq_answer_${faq.id}`}
                                label="Réponse"
                                value={faq.answer}
                                onChange={value => updateFAQ(faq.id, { answer: value as string })}
                                placeholder="Réponse détaillée..."
                                multiline
                                rows={3}
                                maxLength={1000}
                                showCharCount
                                showHelpIcon
                                helpHint={formatHelpHint(
                                  getFieldHelpHint('faq_answer') || {
                                    hint: 'Réponse détaillée à la question',
                                  }
                                )}
                                validationFn={value => {
                                  if (!value || (value as string).trim().length === 0) {
                                    return 'La réponse est requise';
                                  }
                                  return validateLength(value as string, 1, 1000, 'La réponse FAQ');
                                }}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setEditingId(null)}>
                                <Save className="h-4 w-4 mr-1" />
                                Enregistrer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-2">
                            <p className="text-sm text-muted-foreground">{faq.answer}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(faq.id)}
                                className="transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[36px]"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteFAQ(faq.id)}
                                className="transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[36px]"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Ajouter nouvelle FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter une FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdding ? (
            <>
              <div>
                <ArtistFormField
                  id="new-question"
                  label="Question"
                  value={newFAQ.question}
                  onChange={value => setNewFAQ({ ...newFAQ, question: value as string })}
                  placeholder="Ex: Comment fonctionne la livraison ?"
                  maxLength={255}
                  showCharCount
                  showHelpIcon
                  helpHint={formatHelpHint(
                    getFieldHelpHint('faq_question') || {
                      hint: 'Question fréquente sur le produit',
                    }
                  )}
                  validationFn={value => {
                    if (!value || (value as string).trim().length === 0) {
                      return 'La question est requise';
                    }
                    return validateLength(value as string, 1, 255, 'La question FAQ');
                  }}
                />
              </div>
              <div>
                <ArtistFormField
                  id="new-answer"
                  label="Réponse"
                  value={newFAQ.answer}
                  onChange={value => setNewFAQ({ ...newFAQ, answer: value as string })}
                  placeholder="Réponse détaillée..."
                  multiline
                  rows={4}
                  maxLength={1000}
                  showCharCount
                  showHelpIcon
                  helpHint={formatHelpHint(
                    getFieldHelpHint('faq_answer') || { hint: 'Réponse détaillée à la question' }
                  )}
                  validationFn={value => {
                    if (!value || (value as string).trim().length === 0) {
                      return 'La réponse est requise';
                    }
                    return validateLength(value as string, 1, 1000, 'La réponse FAQ');
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addFAQ}
                  disabled={!newFAQ.question.trim() || !newFAQ.answer.trim()}
                  className="transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Ajouter la FAQ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewFAQ({ question: '', answer: '' });
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une FAQ
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};






