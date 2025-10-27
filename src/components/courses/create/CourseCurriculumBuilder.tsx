import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit, 
  ChevronDown, 
  ChevronUp,
  PlayCircle,
  FileText,
  Clock,
  Video
} from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VideoUploader } from "./VideoUploader";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_type: 'upload' | 'youtube' | 'vimeo' | 'google-drive';
  video_url?: string;
  video_duration_seconds?: number;
  is_preview: boolean;
  order_index: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
  isOpen: boolean;
}

interface CourseCurriculumBuilderProps {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
}

export const CourseCurriculumBuilder = ({ sections, onSectionsChange }: CourseCurriculumBuilderProps) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ sectionId: string; lessonId: string } | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<{ sectionId: string; lessonId: string } | null>(null);

  // Ajouter une nouvelle section
  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: '',
      description: '',
      order_index: sections.length,
      lessons: [],
      isOpen: true,
    };
    onSectionsChange([...sections, newSection]);
    setEditingSection(newSection.id);
  };

  // Supprimer une section
  const deleteSection = (sectionId: string) => {
    onSectionsChange(sections.filter(s => s.id !== sectionId));
  };

  // Mettre à jour une section
  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    onSectionsChange(
      sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
    );
  };

  // Toggle section
  const toggleSection = (sectionId: string) => {
    updateSection(sectionId, {
      isOpen: !sections.find(s => s.id === sectionId)?.isOpen
    });
  };

  // Ajouter une leçon
  const addLesson = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: '',
      description: '',
      video_type: 'upload',
      video_url: '',
      is_preview: false,
      order_index: section.lessons.length,
    };

    updateSection(sectionId, {
      lessons: [...section.lessons, newLesson]
    });
    setEditingLesson({ sectionId, lessonId: newLesson.id });
  };

  // Supprimer une leçon
  const deleteLesson = (sectionId: string, lessonId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      lessons: section.lessons.filter(l => l.id !== lessonId)
    });
  };

  // Mettre à jour une leçon
  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      lessons: section.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
    });
  };

  // Calculer la durée totale
  const getTotalDuration = () => {
    let total = 0;
    sections.forEach(section => {
      section.lessons.forEach(lesson => {
        total += lesson.video_duration_seconds || 0;
      });
    });
    return total;
  };

  // Calculer le nombre total de leçons
  const getTotalLessons = () => {
    return sections.reduce((total, section) => total + section.lessons.length, 0);
  };

  // Formater la durée
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Curriculum du cours</CardTitle>
              <CardDescription>
                Organisez votre contenu en sections et leçons
              </CardDescription>
            </div>
            <Button onClick={addSection} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistiques */}
          <div className="flex gap-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{sections.length}</p>
                <p className="text-sm text-muted-foreground">Sections</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{getTotalLessons()}</p>
                <p className="text-sm text-muted-foreground">Leçons</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(getTotalDuration())}</p>
                <p className="text-sm text-muted-foreground">Durée totale</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des sections */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aucune section créée. Commencez par ajouter votre première section.
              </p>
              <Button onClick={addSection} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Créer la première section
              </Button>
            </CardContent>
          </Card>
        ) : (
          sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <Collapsible open={section.isOpen} onOpenChange={() => toggleSection(section.id)}>
                <div className="p-4 border-b">
                  <div className="flex items-start gap-4">
                    {/* Drag handle */}
                    <div className="mt-2 cursor-move">
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Contenu section */}
                    <div className="flex-1">
                      {editingSection === section.id ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="Titre de la section"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            autoFocus
                          />
                          <Textarea
                            placeholder="Description (optionnelle)"
                            value={section.description}
                            onChange={(e) => updateSection(section.id, { description: e.target.value })}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => setEditingSection(null)}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingSection(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Section {sectionIndex + 1}:</span>
                              <h3 className="text-lg font-semibold">
                                {section.title || 'Section sans titre'}
                              </h3>
                              {section.lessons.length > 0 && (
                                <Badge variant="secondary">
                                  {section.lessons.length} leçon{section.lessons.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSection(section.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteSection(section.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <CollapsibleTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  {section.isOpen ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>
                          {section.description && (
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="p-4 space-y-3">
                    {/* Liste des leçons */}
                    {section.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <GripVertical className="w-4 h-4 mt-1 text-muted-foreground cursor-move" />
                        <div className="flex-1">
                          {editingLesson?.sectionId === section.id && editingLesson?.lessonId === lesson.id ? (
                            <div className="space-y-4 border rounded-lg p-4 bg-background">
                              <div className="space-y-2">
                                <Label>Titre de la leçon *</Label>
                                <Input
                                  placeholder="Ex: Introduction au React"
                                  value={lesson.title}
                                  onChange={(e) =>
                                    updateLesson(section.id, lesson.id, { title: e.target.value })
                                  }
                                  autoFocus
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Description (optionnelle)</Label>
                                <Textarea
                                  placeholder="Décrivez ce que les étudiants vont apprendre..."
                                  value={lesson.description || ''}
                                  onChange={(e) =>
                                    updateLesson(section.id, lesson.id, { description: e.target.value })
                                  }
                                  rows={2}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <Video className="w-4 h-4" />
                                  Vidéo de la leçon
                                </Label>
                                {uploadingVideo?.lessonId === lesson.id ? (
                                  <VideoUploader
                                    onVideoUploaded={(videoData) => {
                                      updateLesson(section.id, lesson.id, {
                                        video_type: videoData.type,
                                        video_url: videoData.url,
                                        video_duration_seconds: videoData.duration || 0,
                                      });
                                      setUploadingVideo(null);
                                    }}
                                    onCancel={() => setUploadingVideo(null)}
                                    currentVideo={
                                      lesson.video_url
                                        ? { type: lesson.video_type, url: lesson.video_url }
                                        : undefined
                                    }
                                  />
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setUploadingVideo({ sectionId: section.id, lessonId: lesson.id })}
                                  >
                                    <Video className="w-4 h-4 mr-2" />
                                    {lesson.video_url ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
                                  </Button>
                                )}
                              </div>

                              {lesson.video_url && (
                                <div className="space-y-2">
                                  <Label>Durée (secondes)</Label>
                                  <Input
                                    type="number"
                                    placeholder="600"
                                    value={lesson.video_duration_seconds || ''}
                                    onChange={(e) =>
                                      updateLesson(section.id, lesson.id, {
                                        video_duration_seconds: parseInt(e.target.value) || 0
                                      })
                                    }
                                  />
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`preview-${lesson.id}`}
                                  checked={lesson.is_preview}
                                  onCheckedChange={(checked) =>
                                    updateLesson(section.id, lesson.id, { is_preview: !!checked })
                                  }
                                />
                                <Label
                                  htmlFor={`preview-${lesson.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  Leçon gratuite (aperçu)
                                </Label>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => setEditingLesson(null)}
                                  disabled={!lesson.title || !lesson.video_url}
                                >
                                  Enregistrer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingLesson(null)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Leçon {lessonIndex + 1}: {lesson.title || 'Leçon sans titre'}
                                </span>
                                {lesson.is_preview && (
                                  <Badge variant="outline" className="text-xs">
                                    Aperçu gratuit
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingLesson({ sectionId: section.id, lessonId: lesson.id })}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteLesson(section.id, lesson.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Bouton ajouter leçon */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLesson(section.id)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une leçon
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

