import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { CourseBasicInfoForm } from "./CourseBasicInfoForm";
import { CourseCurriculumBuilder } from "./CourseCurriculumBuilder";
import { CourseAdvancedConfig } from "./CourseAdvancedConfig";
import { CourseSEOForm, CourseSEOData } from "./CourseSEOForm";
import { CourseFAQForm, FAQ } from "./CourseFAQForm";
import { CourseAffiliateSettings, CourseAffiliateData } from "./CourseAffiliateSettings";
import { CoursePixelsConfig, CoursePixelsData } from "./CoursePixelsConfig";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCreateFullCourse } from "@/hooks/courses/useCreateFullCourse";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: any[];
  isOpen: boolean;
}

const STEPS = [
  { id: 1, name: 'Informations de base', description: 'Titre, description, niveau' },
  { id: 2, name: 'Curriculum', description: 'Sections et leçons' },
  { id: 3, name: 'Configuration', description: 'Prix et paramètres' },
  { id: 4, name: 'SEO & FAQs', description: 'Référencement et questions' },
  { id: 5, name: 'Affiliation', description: 'Programme d\'affiliation' },
  { id: 6, name: 'Tracking', description: 'Pixels & Analytics' },
  { id: 7, name: 'Révision', description: 'Vérifier et publier' },
];

export const CreateCourseWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store } = useStore();
  const createFullCourse = useCreateFullCourse();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Informations de base
    title: '',
    slug: '',
    short_description: '',
    description: '',
    level: '',
    language: 'fr',
    category: '',
    // Configuration
    price: 0,
    currency: 'XOF',
    promotional_price: undefined,
    certificate_enabled: true,
    certificate_passing_score: 80,
    learning_objectives: [],
    prerequisites: [],
    target_audience: [],
  });
  const [sections, setSections] = useState<Section[]>([]);
  const [seoData, setSeoData] = useState<CourseSEOData>({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
  });
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [affiliateData, setAffiliateData] = useState<CourseAffiliateData>({
    affiliate_enabled: false,
    commission_rate: 20,
    commission_type: 'percentage',
    fixed_commission_amount: 0,
    cookie_duration_days: 30,
    max_commission_per_sale: undefined,
    min_order_amount: 0,
    allow_self_referral: false,
    require_approval: false,
    terms_and_conditions: '',
  });
  const [pixelsData, setPixelsData] = useState<CoursePixelsData>({
    tracking_enabled: true,
    google_analytics_id: '',
    facebook_pixel_id: '',
    google_tag_manager_id: '',
    tiktok_pixel_id: '',
    track_video_events: true,
    track_lesson_completion: true,
    track_quiz_attempts: true,
    track_certificate_downloads: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur si le champ est modifié
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title) newErrors.title = 'Le titre est requis';
      if (!formData.slug) newErrors.slug = 'Le slug est requis';
      if (!formData.short_description) newErrors.short_description = 'La description courte est requise';
      if (!formData.description) newErrors.description = 'La description est requise';
      if (!formData.level) newErrors.level = 'Le niveau est requis';
      if (!formData.language) newErrors.language = 'La langue est requise';
      if (!formData.category) newErrors.category = 'La catégorie est requise';
    }

    if (step === 2) {
      if (sections.length === 0) {
        toast({
          title: 'Curriculum vide',
          description: 'Ajoutez au moins une section avec une leçon',
          variant: 'destructive',
        });
        return false;
      }
      const hasLessons = sections.some(s => s.lessons.length > 0);
      if (!hasLessons) {
        toast({
          title: 'Aucune leçon',
          description: 'Ajoutez au moins une leçon dans une section',
          variant: 'destructive',
        });
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: 'Brouillon sauvegardé',
      description: 'Votre cours a été sauvegardé en tant que brouillon',
    });
  };

  const handlePublish = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Vérifier que le store existe
    if (!store?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez avoir une boutique pour créer un cours',
        variant: 'destructive',
      });
      return;
    }

    // Préparer les données pour la création
    const courseData = {
      storeId: store.id,
      name: formData.title,
      slug: formData.slug,
      short_description: formData.short_description,
      description: formData.description,
      category: formData.category,
      price: formData.price,
      currency: formData.currency,
      promotional_price: formData.promotional_price,
      level: formData.level,
      language: formData.language,
      certificate_enabled: formData.certificate_enabled,
      certificate_passing_score: formData.certificate_passing_score,
      learning_objectives: formData.learning_objectives,
      prerequisites: formData.prerequisites,
      target_audience: formData.target_audience,
      sections: sections,
      // SEO
      meta_title: seoData.meta_title,
      meta_description: seoData.meta_description,
      meta_keywords: seoData.meta_keywords,
      og_title: seoData.og_title,
      og_description: seoData.og_description,
      og_image: seoData.og_image,
      // FAQs
      faqs: faqs,
      // Affiliation
      affiliate_enabled: affiliateData.affiliate_enabled,
      commission_rate: affiliateData.commission_rate,
      commission_type: affiliateData.commission_type,
      fixed_commission_amount: affiliateData.fixed_commission_amount,
      cookie_duration_days: affiliateData.cookie_duration_days,
      max_commission_per_sale: affiliateData.max_commission_per_sale,
      min_order_amount: affiliateData.min_order_amount,
      allow_self_referral: affiliateData.allow_self_referral,
      require_approval: affiliateData.require_approval,
      affiliate_terms_and_conditions: affiliateData.terms_and_conditions,
      // Tracking & Pixels
      tracking_enabled: pixelsData.tracking_enabled,
      google_analytics_id: pixelsData.google_analytics_id,
      facebook_pixel_id: pixelsData.facebook_pixel_id,
      google_tag_manager_id: pixelsData.google_tag_manager_id,
      tiktok_pixel_id: pixelsData.tiktok_pixel_id,
      track_video_events: pixelsData.track_video_events,
      track_lesson_completion: pixelsData.track_lesson_completion,
      track_quiz_attempts: pixelsData.track_quiz_attempts,
      track_certificate_downloads: pixelsData.track_certificate_downloads,
    };

    // Créer le cours
    createFullCourse.mutate(courseData);
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">
                Étape {currentStep} sur {STEPS.length}
              </h3>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-orange-500 bg-orange-50'
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-bold">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{step.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenu de l'étape */}
      <div>
        {currentStep === 1 && (
          <CourseBasicInfoForm
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <CourseCurriculumBuilder
            sections={sections}
            onSectionsChange={setSections}
          />
        )}

        {currentStep === 3 && (
          <CourseAdvancedConfig
            formData={formData}
            onChange={handleFieldChange}
          />
        )}

        {currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <CourseSEOForm
                data={seoData}
                onChange={setSeoData}
                courseTitle={formData.title}
                courseDescription={formData.short_description}
              />
            </div>
            <div>
              <CourseFAQForm
                data={faqs}
                onChange={setFaqs}
              />
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <CourseAffiliateSettings
            data={affiliateData}
            onChange={setAffiliateData}
            coursePrice={formData.price}
          />
        )}

        {currentStep === 6 && (
          <CoursePixelsConfig
            data={pixelsData}
            onChange={setPixelsData}
          />
        )}

        {currentStep === 7 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Révision finale
                </h3>
                
                <div className="space-y-6">
                  {/* Informations de base */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Badge variant="secondary">1</Badge>
                      Informations de base
                    </h4>
                    <dl className="grid grid-cols-2 gap-3 text-sm bg-muted p-4 rounded-lg">
                      <dt className="text-muted-foreground">Titre:</dt>
                      <dd className="font-medium">{formData.title}</dd>
                      <dt className="text-muted-foreground">Slug:</dt>
                      <dd className="font-mono text-xs bg-background px-2 py-1 rounded">/courses/{formData.slug}</dd>
                      <dt className="text-muted-foreground">Niveau:</dt>
                      <dd className="font-medium capitalize">{formData.level}</dd>
                      <dt className="text-muted-foreground">Langue:</dt>
                      <dd className="font-medium">{formData.language}</dd>
                      <dt className="text-muted-foreground">Catégorie:</dt>
                      <dd className="font-medium">{formData.category}</dd>
                    </dl>
                  </div>

                  {/* Curriculum */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Badge variant="secondary">2</Badge>
                      Curriculum
                    </h4>
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{sections.length}</span>
                          <span className="text-sm text-muted-foreground">section{sections.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">
                            {sections.reduce((total, s) => total + s.lessons.length, 0)}
                          </span>
                          <span className="text-sm text-muted-foreground">leçon{sections.reduce((total, s) => total + s.lessons.length, 0) > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      {sections.map((section, idx) => (
                        <div key={section.id} className="text-sm">
                          <span className="font-medium">Section {idx + 1}:</span> {section.title}
                          <span className="text-muted-foreground ml-2">
                            ({section.lessons.length} leçon{section.lessons.length > 1 ? 's' : ''})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configuration */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Badge variant="secondary">3</Badge>
                      Configuration
                    </h4>
                    <dl className="grid grid-cols-2 gap-3 text-sm bg-muted p-4 rounded-lg">
                      <dt className="text-muted-foreground">Prix:</dt>
                      <dd className="font-bold text-lg">
                        {formData.promotional_price && formData.promotional_price < formData.price ? (
                          <>
                            <span className="text-orange-600">{formData.promotional_price} {formData.currency}</span>
                            <span className="text-sm text-muted-foreground line-through ml-2">
                              {formData.price} {formData.currency}
                            </span>
                          </>
                        ) : (
                          <span>{formData.price} {formData.currency}</span>
                        )}
                      </dd>
                      <dt className="text-muted-foreground">Certificat:</dt>
                      <dd className="font-medium">
                        {formData.certificate_enabled ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Activé ({formData.certificate_passing_score}% requis)
                          </Badge>
                        ) : (
                          <Badge variant="outline">Désactivé</Badge>
                        )}
                      </dd>
                      <dt className="text-muted-foreground">Objectifs:</dt>
                      <dd className="font-medium">{formData.learning_objectives.length} objectif{formData.learning_objectives.length > 1 ? 's' : ''}</dd>
                      <dt className="text-muted-foreground">Prérequis:</dt>
                      <dd className="font-medium">{formData.prerequisites.length} prérequis</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avertissement avant publication */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <p className="text-sm text-orange-800">
                  <strong>Important :</strong> En publiant ce cours, il sera visible par tous les étudiants.
                  Assurez-vous que toutes les informations sont correctes avant de continuer.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder brouillon
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={nextStep} className="bg-orange-600 hover:bg-orange-700">
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handlePublish} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={createFullCourse.isPending}
                >
                  {createFullCourse.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publication en cours...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Publier le cours
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

