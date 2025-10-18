import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface ProductFAQTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductFAQTab = ({ formData, updateFormData }: ProductFAQTabProps) => {
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const faqs: FAQ[] = formData.faqs || [];

  const handleAddFAQ = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: newQuestion,
      answer: newAnswer,
    };

    updateFormData("faqs", [...faqs, newFAQ]);
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleRemoveFAQ = (id: string) => {
    updateFormData(
      "faqs",
      faqs.filter((faq) => faq.id !== id)
    );
  };

  const handleUpdateFAQ = (id: string, updates: Partial<FAQ>) => {
    updateFormData(
      "faqs",
      faqs.map((faq) => (faq.id === id ? { ...faq, ...updates } : faq))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Questions fréquentes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Anticipez les questions de vos clients pour faciliter leur décision d'achat
        </p>
      </div>

      {faqs.length > 0 && (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label>Question</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) =>
                        handleUpdateFAQ(faq.id, { question: e.target.value })
                      }
                      placeholder="Ex: Quels sont les prérequis ?"
                    />
                  </div>
                  <div>
                    <Label>Réponse</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) =>
                        handleUpdateFAQ(faq.id, { answer: e.target.value })
                      }
                      placeholder="Votre réponse détaillée..."
                      rows={3}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFAQ(faq.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
        <Label>Ajouter une nouvelle question</Label>
        <div className="space-y-3">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Question"
          />
          <Textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Réponse"
            rows={3}
          />
          <Button onClick={handleAddFAQ} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter la question
          </Button>
        </div>
      </div>
    </div>
  );
};
