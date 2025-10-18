import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  HelpCircle,
  MessageSquare,
  Search,
  SortAsc,
  SortDesc,
  Copy,
  Move,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Info,
  Star,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductFAQTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductFAQTab = ({ formData, updateFormData }: ProductFAQTabProps) => {
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'order' | 'question' | 'createdAt'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const addFAQ = (faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFAQ: FAQItem = {
      ...faq,
      id: `faq_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentFAQs = formData.faqs || [];
    updateFormData("faqs", [...currentFAQs, newFAQ]);
    setShowAddForm(false);
  };

  const updateFAQ = (id: string, updates: Partial<FAQItem>) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.map((faq: FAQItem) =>
      faq.id === id ? { ...faq, ...updates, updatedAt: new Date() } : faq
    );
    updateFormData("faqs", updatedFAQs);
    setEditingFAQ(null);
  };

  const removeFAQ = (id: string) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.filter((faq: FAQItem) => faq.id !== id);
    updateFormData("faqs", updatedFAQs);
  };

  const duplicateFAQ = (faq: FAQItem) => {
    const duplicatedFAQ: FAQItem = {
      ...faq,
      id: `faq_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      question: `${faq.question} (copie)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentFAQs = formData.faqs || [];
    updateFormData("faqs", [...currentFAQs, duplicatedFAQ]);
  };

  const moveFAQ = (fromIndex: number, toIndex: number) => {
    const currentFAQs = [...(formData.faqs || [])];
    const [movedFAQ] = currentFAQs.splice(fromIndex, 1);
    currentFAQs.splice(toIndex, 0, movedFAQ);
    updateFormData("faqs", currentFAQs);
  };

  const toggleFAQStatus = (id: string) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.map((faq: FAQItem) =>
      faq.id === id ? { ...faq, isActive: !faq.isActive, updatedAt: new Date() } : faq
    );
    updateFormData("faqs", updatedFAQs);
  };

  const toggleFAQFeatured = (id: string) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.map((faq: FAQItem) =>
      faq.id === id ? { ...faq, isFeatured: !faq.isFeatured, updatedAt: new Date() } : faq
    );
    updateFormData("faqs", updatedFAQs);
  };

  // Filtrer et trier les FAQ
  const filteredFAQs = (formData.faqs || [])
    .filter((faq: FAQItem) => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (faq.category && faq.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a: FAQItem, b: FAQItem) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'order':
          comparison = a.order - b.order;
          break;
        case 'question':
          comparison = a.question.localeCompare(b.question);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categories = [...new Set((formData.faqs || []).map((faq: FAQItem) => faq.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FAQ du Produit</h2>
          <p className="text-gray-600">Gérez les questions fréquemment posées sur votre produit</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter une FAQ
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans les FAQ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Ordre</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="createdAt">Date</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des FAQ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulaire d'ajout/modification */}
          {(showAddForm || editingFAQ) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {editingFAQ ? "Modifier la FAQ" : "Nouvelle FAQ"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FAQForm
                  faq={editingFAQ}
                  onSave={(faq) => {
                    if (editingFAQ) {
                      updateFAQ(editingFAQ.id, faq);
                    } else {
                      addFAQ(faq);
                    }
                  }}
                  onCancel={() => {
                    setShowAddForm(false);
                    setEditingFAQ(null);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Liste des FAQ existantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                FAQ configurées
              </CardTitle>
              <CardDescription>
                {filteredFAQs.length} FAQ(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune FAQ trouvée</p>
                  <p className="text-sm">
                    {searchTerm ? "Essayez de modifier votre recherche" : "Cliquez sur 'Ajouter une FAQ' pour commencer"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFAQs.map((faq: FAQItem, index: number) => (
                    <Card key={faq.id} className={cn("border", !faq.isActive && "opacity-60")}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <div className="text-lg font-bold text-gray-400">
                              {faq.order}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{faq.question}</h4>
                              {faq.isFeatured && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Vedette
                                </Badge>
                              )}
                              {faq.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {faq.category}
                                </Badge>
                              )}
                              <Badge variant={faq.isActive ? "default" : "secondary"} className="text-xs">
                                {faq.isActive ? "Actif" : "Inactif"}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {faq.answer}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Créé: {new Date(faq.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Modifié: {new Date(faq.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingFAQ(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleFAQFeatured(faq.id)}
                            >
                              <Star className={cn("h-4 w-4", faq.isFeatured && "fill-current")} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateFAQ(faq)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleFAQStatus(faq.id)}
                            >
                              <Eye className={cn("h-4 w-4", faq.isActive ? "text-green-500" : "text-gray-400")} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeFAQ(faq.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total des FAQ</span>
                  <Badge variant="secondary">
                    {(formData.faqs || []).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">FAQ actives</span>
                  <Badge variant="secondary">
                    {(formData.faqs || []).filter((f: FAQItem) => f.isActive).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">FAQ en vedette</span>
                  <Badge variant="secondary">
                    {(formData.faqs || []).filter((f: FAQItem) => f.isFeatured).length}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Catégories</span>
                  <Badge variant="secondary">
                    {categories.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Catégories */}
          {categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Catégories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(formData.faqs || []).filter((f: FAQItem) => f.category === category).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conseils */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Conseils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Utilisez des questions claires et spécifiques</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Organisez par catégories</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Mettez en vedette les questions importantes</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Gardez les réponses concises mais complètes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Composant pour le formulaire de FAQ
interface FAQFormProps {
  faq?: FAQItem | null;
  onSave: (faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const FAQForm = ({ faq, onSave, onCancel }: FAQFormProps) => {
  const [formData, setFormData] = useState({
    question: faq?.question || "",
    answer: faq?.answer || "",
    category: faq?.category || "",
    order: faq?.order || 0,
    isActive: faq?.isActive !== undefined ? faq.isActive : true,
    isFeatured: faq?.isFeatured || false,
  });

  const handleSave = () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      return;
    }

    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          placeholder="Quelle est votre question ?"
        />
      </div>

      <div>
        <Label htmlFor="answer">Réponse *</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
          placeholder="Réponse détaillée..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Général, Technique, Livraison..."
          />
        </div>

        <div>
          <Label htmlFor="order">Ordre d'affichage</Label>
          <Input
            id="order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>FAQ active</Label>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>FAQ en vedette</Label>
          <Switch
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSave}>
          {faq ? "Modifier" : "Créer"}
        </Button>
      </div>
    </div>
  );
};