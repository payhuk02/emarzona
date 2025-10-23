import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Info,
  Star,
  Clock,
  Download,
  Upload,
  FileJson,
  Sparkles,
  BarChart3,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  views?: number;
  helpful?: number;
  notHelpful?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Templates de FAQ prédéfinis
const FAQ_TEMPLATES = {
  digital: [
    { question: "Comment télécharger ce produit après l'achat ?", answer: "Après votre achat, vous recevrez un email avec un lien de téléchargement. Vous pourrez également accéder à votre produit depuis votre espace client.", category: "Téléchargement" },
    { question: "Ce produit est-il compatible avec mon système ?", answer: "Notre produit est compatible avec Windows, Mac et Linux. Les fichiers sont fournis dans des formats standard.", category: "Technique" },
    { question: "Puis-je obtenir un remboursement ?", answer: "Oui, nous offrons une garantie satisfait ou remboursé de 30 jours. Contactez notre support pour toute demande.", category: "Paiement" },
  ],
  physical: [
    { question: "Quels sont les délais de livraison ?", answer: "La livraison standard prend entre 3 et 5 jours ouvrés. Livraison express disponible (24-48h).", category: "Livraison" },
    { question: "Puis-je retourner ce produit ?", answer: "Oui, vous disposez de 14 jours pour retourner le produit dans son emballage d'origine.", category: "Retours" },
    { question: "Quels modes de paiement acceptez-vous ?", answer: "Nous acceptons les cartes bancaires, PayPal, et les virements bancaires.", category: "Paiement" },
  ],
  service: [
    { question: "Comment prendre rendez-vous ?", answer: "Vous pouvez prendre rendez-vous directement via notre calendrier en ligne après votre achat.", category: "Réservation" },
    { question: "Puis-je annuler ou reporter mon rendez-vous ?", answer: "Oui, vous pouvez annuler jusqu'à 24h avant le rendez-vous sans frais.", category: "Réservation" },
    { question: "La prestation se fait-elle en ligne ou en présentiel ?", answer: "Cette prestation peut être réalisée en ligne ou en présentiel selon votre choix.", category: "Modalités" },
  ],
};

export const ProductFAQTab = ({ formData, updateFormData }: ProductFAQTabProps) => {
  const { toast } = useToast();
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'order' | 'question' | 'createdAt' | 'views'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'preview'>('list');

  const addFAQ = useCallback((faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful' | 'notHelpful'>) => {
    const newFAQ: FAQItem = {
      ...faq,
      id: `faq_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      views: 0,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentFAQs = formData.faqs || [];
    updateFormData("faqs", [...currentFAQs, newFAQ]);
    setShowAddForm(false);
    
    toast({
      title: "FAQ ajoutée",
      description: "La FAQ a été ajoutée avec succès",
    });
  }, [formData.faqs, updateFormData, toast]);

  const updateFAQ = useCallback((id: string, updates: Partial<FAQItem>) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.map((faq: FAQItem) =>
      faq.id === id ? { ...faq, ...updates, updatedAt: new Date() } : faq
    );
    updateFormData("faqs", updatedFAQs);
    setEditingFAQ(null);
    
    toast({
      title: "FAQ modifiée",
      description: "Les modifications ont été enregistrées",
    });
  }, [formData.faqs, updateFormData, toast]);

  const removeFAQ = useCallback((id: string) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.filter((faq: FAQItem) => faq.id !== id);
    updateFormData("faqs", updatedFAQs);
    
    toast({
      title: "FAQ supprimée",
      description: "La FAQ a été supprimée avec succès",
      variant: "destructive",
    });
  }, [formData.faqs, updateFormData, toast]);

  const duplicateFAQ = useCallback((faq: FAQItem) => {
    const duplicatedFAQ: FAQItem = {
      ...faq,
      id: `faq_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      question: `${faq.question} (copie)`,
      views: 0,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentFAQs = formData.faqs || [];
    updateFormData("faqs", [...currentFAQs, duplicatedFAQ]);
    
    toast({
      title: "FAQ dupliquée",
      description: "Une copie de la FAQ a été créée",
    });
  }, [formData.faqs, updateFormData, toast]);

  const moveFAQ = useCallback((id: string, direction: 'up' | 'down') => {
    const currentFAQs = [...(formData.faqs || [])];
    const index = currentFAQs.findIndex((f: FAQItem) => f.id === id);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= currentFAQs.length) return;
    
    [currentFAQs[index], currentFAQs[newIndex]] = [currentFAQs[newIndex], currentFAQs[index]];
    
    // Mettre à jour les orders
    currentFAQs.forEach((faq, idx) => {
      faq.order = idx;
    });
    
    updateFormData("faqs", currentFAQs);
  }, [formData.faqs, updateFormData]);

  const toggleFAQStatus = useCallback((id: string) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.map((faq: FAQItem) =>
      faq.id === id ? { ...faq, isActive: !faq.isActive, updatedAt: new Date() } : faq
    );
    updateFormData("faqs", updatedFAQs);
  }, [formData.faqs, updateFormData]);

  const toggleFAQFeatured = useCallback((id: string) => {
    const currentFAQs = formData.faqs || [];
    const updatedFAQs = currentFAQs.map((faq: FAQItem) =>
      faq.id === id ? { ...faq, isFeatured: !faq.isFeatured, updatedAt: new Date() } : faq
    );
    updateFormData("faqs", updatedFAQs);
  }, [formData.faqs, updateFormData]);

  // Import FAQ depuis JSON
  const importFAQs = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const currentFAQs = formData.faqs || [];
        
        const newFAQs = imported.map((faq: any, index: number) => ({
          ...faq,
          id: `faq_${Date.now()}_${index}_${Math.random().toString(36).substring(2)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          views: 0,
          helpful: 0,
          notHelpful: 0,
        }));
        
        updateFormData("faqs", [...currentFAQs, ...newFAQs]);
        
        toast({
          title: "Import réussi",
          description: `${newFAQs.length} FAQ(s) importée(s)`,
        });
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Le fichier JSON n'est pas valide",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [formData.faqs, updateFormData, toast]);

  // Export FAQ en JSON
  const exportFAQs = useCallback(() => {
    const faqs = formData.faqs || [];
    const dataStr = JSON.stringify(faqs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `faqs_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export réussi",
      description: `${faqs.length} FAQ(s) exportée(s)`,
    });
  }, [formData.faqs, toast]);

  // Charger les templates
  const loadTemplates = useCallback((type: 'digital' | 'physical' | 'service') => {
    const templates = FAQ_TEMPLATES[type];
    const currentFAQs = formData.faqs || [];
    
    const newFAQs = templates.map((template, index) => ({
      ...template,
      id: `faq_template_${Date.now()}_${index}`,
      order: currentFAQs.length + index,
      isActive: true,
      isFeatured: false,
      views: 0,
      helpful: 0,
      notHelpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    updateFormData("faqs", [...currentFAQs, ...newFAQs]);
    
    toast({
      title: "Templates chargés",
      description: `${templates.length} FAQ(s) ajoutée(s)`,
    });
  }, [formData.faqs, updateFormData, toast]);

  // Filtrer et trier les FAQ
  const filteredFAQs = useMemo(() => {
    return (formData.faqs || [])
      .filter((faq: FAQItem) => {
        const matchesSearch = 
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (faq.category && faq.category.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
      })
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
          case 'views':
            comparison = (a.views || 0) - (b.views || 0);
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [formData.faqs, searchTerm, selectedCategory, sortBy, sortOrder]);

  const categories = useMemo(() => {
    return [...new Set((formData.faqs || []).map((faq: FAQItem) => faq.category).filter(Boolean))];
  }, [formData.faqs]);

  const stats = useMemo(() => {
    const faqs = formData.faqs || [];
    return {
      total: faqs.length,
      active: faqs.filter((f: FAQItem) => f.isActive).length,
      featured: faqs.filter((f: FAQItem) => f.isFeatured).length,
      categories: categories.length,
      totalViews: faqs.reduce((sum: number, f: FAQItem) => sum + (f.views || 0), 0),
      avgHelpful: faqs.length > 0 ? Math.round((faqs.reduce((sum: number, f: FAQItem) => sum + (f.helpful || 0), 0) / faqs.length) * 10) / 10 : 0,
    };
  }, [formData.faqs, categories]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* En-tête avec actions */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <HelpCircle className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-white">FAQ du Produit</CardTitle>
                  <CardDescription className="text-gray-400">
                    Gérez les questions fréquemment posées sur votre produit
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('faq-import')?.click()}
                      className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Importer des FAQ depuis un fichier JSON</p>
                  </TooltipContent>
                </Tooltip>
                <input
                  id="faq-import"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importFAQs}
                />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportFAQs}
                      disabled={(formData.faqs || []).length === 0}
                      className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exporter toutes les FAQ en JSON</p>
                  </TooltipContent>
                </Tooltip>
                
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle FAQ
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Templates prédéfinis */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-base font-semibold text-white">Templates prédéfinis</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Chargez des FAQ types selon votre type de produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => loadTemplates('digital')}
                className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white justify-start"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Produit Digital
              </Button>
              <Button
                variant="outline"
                onClick={() => loadTemplates('physical')}
                className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white justify-start"
              >
                <Package className="h-4 w-4 mr-2" />
                Produit Physique
              </Button>
              <Button
                variant="outline"
                onClick={() => loadTemplates('service')}
                className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white justify-start"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Service
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques globales */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-400" />
              <CardTitle className="text-base font-semibold text-white">Statistiques</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-xs text-gray-400 mt-1">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.active}</div>
                <div className="text-xs text-gray-400 mt-1">Actives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.featured}</div>
                <div className="text-xs text-gray-400 mt-1">Vedettes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.categories}</div>
                <div className="text-xs text-gray-400 mt-1">Catégories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.totalViews}</div>
                <div className="text-xs text-gray-400 mt-1">Vues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">{stats.avgHelpful}</div>
                <div className="text-xs text-gray-400 mt-1">Avg. Utile</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barre de recherche et filtres */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans les FAQ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40 bg-gray-700/50 border-gray-600 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                      Toutes
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40 bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="order" className="text-white hover:bg-gray-700 focus:bg-gray-700">Ordre</SelectItem>
                    <SelectItem value="question" className="text-white hover:bg-gray-700 focus:bg-gray-700">Question</SelectItem>
                    <SelectItem value="createdAt" className="text-white hover:bg-gray-700 focus:bg-gray-700">Date</SelectItem>
                    <SelectItem value="views" className="text-white hover:bg-gray-700 focus:bg-gray-700">Vues</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'list' ? 'preview' : 'list')}
                  className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                >
                  {viewMode === 'list' ? <Eye className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
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
              <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <HelpCircle className="h-5 w-5 text-blue-400" />
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
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquare className="h-5 w-5 text-green-400" />
                  FAQ configurées
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {filteredFAQs.length} FAQ(s) trouvée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium mb-2">Aucune FAQ trouvée</p>
                    <p className="text-sm">
                      {searchTerm || selectedCategory !== "all" 
                        ? "Essayez de modifier vos filtres de recherche" 
                        : "Cliquez sur 'Nouvelle FAQ' pour commencer"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFAQs.map((faq: FAQItem, index: number) => (
                      <Card 
                        key={faq.id} 
                        className={cn(
                          "border-2 transition-all",
                          !faq.isActive && "opacity-60",
                          expandedFAQ === faq.id ? "border-blue-500 bg-blue-500/5" : "border-gray-700 bg-gray-800/30"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveFAQ(faq.id, 'up')}
                                    disabled={index === 0}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Déplacer vers le haut</TooltipContent>
                              </Tooltip>
                              
                              <div className="text-sm font-bold text-gray-400 bg-gray-700/50 rounded px-2 py-1 min-w-[32px] text-center">
                                {faq.order}
                              </div>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveFAQ(faq.id, 'down')}
                                    disabled={index === filteredFAQs.length - 1}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Déplacer vers le bas</TooltipContent>
                              </Tooltip>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <button
                                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                  className="font-medium text-white hover:text-blue-400 transition-colors text-left flex items-center gap-2"
                                >
                                  {faq.question}
                                  {expandedFAQ === faq.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                                
                                {faq.isFeatured && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Vedette
                                  </Badge>
                                )}
                                {faq.category && (
                                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                    {faq.category}
                                  </Badge>
                                )}
                                <Badge 
                                  variant={faq.isActive ? "default" : "secondary"} 
                                  className={cn(
                                    "text-xs",
                                    faq.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                  )}
                                >
                                  {faq.isActive ? "Actif" : "Inactif"}
                                </Badge>
                              </div>
                              
                              {expandedFAQ === faq.id && (
                                <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                    {faq.answer}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 cursor-help">
                                      <Eye className="h-3 w-3" />
                                      <span>{faq.views || 0}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Nombre de vues</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 cursor-help">
                                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                                      <span>{faq.helpful || 0}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Marqué comme utile</TooltipContent>
                                </Tooltip>
                                
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Modifié: {new Date(faq.updatedAt).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingFAQ(faq)}
                                    className="h-8 w-8 p-0 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Modifier</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleFAQFeatured(faq.id)}
                                    className="h-8 w-8 p-0 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-yellow-400"
                                  >
                                    <Star className={cn("h-4 w-4", faq.isFeatured && "fill-yellow-400 text-yellow-400")} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Marquer en vedette</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => duplicateFAQ(faq)}
                                    className="h-8 w-8 p-0 bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Dupliquer</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleFAQStatus(faq.id)}
                                    className={cn(
                                      "h-8 w-8 p-0 bg-gray-700/50 border-gray-600 hover:bg-gray-700",
                                      faq.isActive ? "text-green-400 hover:text-green-300" : "text-gray-400 hover:text-gray-300"
                                    )}
                                  >
                                    {faq.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{faq.isActive ? "Désactiver" : "Activer"}</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeFAQ(faq.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Supprimer</TooltipContent>
                              </Tooltip>
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
            {/* Catégories */}
            {categories.length > 0 && (
              <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Info className="h-5 w-5 text-purple-400" />
                    Catégories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const count = (formData.faqs || []).filter((f: FAQItem) => f.category === category).length;
                      const isSelected = selectedCategory === category;
                      
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(isSelected ? "all" : category)}
                          className={cn(
                            "w-full flex items-center justify-between p-2 rounded-lg transition-all",
                            isSelected 
                              ? "bg-blue-500/20 border border-blue-500/30" 
                              : "bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50"
                          )}
                        >
                          <span className={cn("text-sm", isSelected ? "text-blue-400 font-medium" : "text-gray-300")}>{category}</span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs",
                              isSelected ? "bg-blue-500/30 text-blue-300" : "bg-gray-600/50 text-gray-400"
                            )}
                          >
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conseils */}
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                  Bonnes pratiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Questions claires et spécifiques</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Organisez par catégories</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Mettez en vedette les questions importantes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Réponses concises mais complètes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Mettez régulièrement à jour vos FAQ</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Raccourcis clavier */}
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  Raccourcis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Nouvelle FAQ</span>
                    <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">Ctrl + N</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rechercher</span>
                    <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">Ctrl + F</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exporter</span>
                    <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">Ctrl + E</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Composant pour le formulaire de FAQ
interface FAQFormProps {
  faq?: FAQItem | null;
  onSave: (faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful' | 'notHelpful'>) => void;
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.question.trim()) {
      newErrors.question = "La question est requise";
    } else if (formData.question.length < 10) {
      newErrors.question = "La question doit contenir au moins 10 caractères";
    }
    
    if (!formData.answer.trim()) {
      newErrors.answer = "La réponse est requise";
    } else if (formData.answer.length < 20) {
      newErrors.answer = "La réponse doit contenir au moins 20 caractères";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question" className="text-white">
          Question * <span className="text-xs text-gray-400">({formData.question.length} caractères)</span>
        </Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
          placeholder="Quelle est votre question ?"
          className={cn(
            "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400",
            errors.question && "border-red-500"
          )}
        />
        {errors.question && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.question}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="answer" className="text-white">
          Réponse * <span className="text-xs text-gray-400">({formData.answer.length} caractères)</span>
        </Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
          placeholder="Réponse détaillée..."
          rows={6}
          className={cn(
            "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 resize-none",
            errors.answer && "border-red-500"
          )}
        />
        {errors.answer && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.answer}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">Vous pouvez utiliser le formatage markdown</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category" className="text-white">Catégorie</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Général, Technique, Livraison..."
            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>

        <div>
          <Label htmlFor="order" className="text-white">Ordre d'affichage</Label>
          <Input
            id="order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
            placeholder="0"
            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      <Separator className="bg-gray-700" />

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
          <div className="space-y-0.5">
            <Label htmlFor="isActive" className="text-white">FAQ active</Label>
            <p className="text-xs text-gray-400">Visible sur la page produit</p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
          <div className="space-y-0.5">
            <Label htmlFor="isFeatured" className="text-white">FAQ en vedette</Label>
            <p className="text-xs text-gray-400">Affichée en premier</p>
          </div>
          <Switch
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {faq ? "Modifier" : "Créer"}
        </Button>
      </div>
    </div>
  );
};

// Imports manquants pour les icônes
import { Package, Smartphone, Wrench } from "lucide-react";
