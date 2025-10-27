/**
 * Affichage du curriculum du cours (sections et leçons)
 * Date : 27 octobre 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  PlayCircle, 
  Lock, 
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_type: 'upload' | 'youtube' | 'vimeo' | 'google-drive';
  video_url: string;
  video_duration_seconds?: number;
  is_preview: boolean;
  is_required: boolean;
  order_index: number;
  is_completed?: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface CourseCurriculumProps {
  sections: Section[];
  isEnrolled: boolean;
  currentLessonId?: string;
  onLessonClick: (lesson: Lesson) => void;
}

export const CourseCurriculum = ({ 
  sections, 
  isEnrolled, 
  currentLessonId,
  onLessonClick 
}: CourseCurriculumProps) => {
  const [openSections, setOpenSections] = useState<string[]>(
    sections.map(s => s.id) // Toutes les sections ouvertes par défaut
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalLessons = () => {
    return sections.reduce((total, section) => total + section.lessons.length, 0);
  };

  const getCompletedLessons = () => {
    return sections.reduce((total, section) => 
      total + section.lessons.filter(l => l.is_completed).length, 0
    );
  };

  const getTotalDuration = () => {
    const total = sections.reduce((sum, section) => 
      sum + section.lessons.reduce((lessonSum, lesson) => 
        lessonSum + (lesson.video_duration_seconds || 0), 0
      ), 0
    );
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contenu du cours
          </CardTitle>
          <div className="flex gap-2 text-sm text-muted-foreground">
            {isEnrolled && (
              <span>{getCompletedLessons()}/{getTotalLessons()} leçons</span>
            )}
            <span>•</span>
            <span>{getTotalDuration()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {sections.map((section, sectionIndex) => (
          <Collapsible
            key={section.id}
            open={openSections.includes(section.id)}
            onOpenChange={() => toggleSection(section.id)}
          >
            <Card className="border-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className="shrink-0">
                      Section {sectionIndex + 1}
                    </Badge>
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.lessons.length} leçon{section.lessons.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {openSections.includes(section.id) ? (
                    <ChevronUp className="w-5 h-5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 shrink-0" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border-t">
                  {section.lessons.map((lesson, lessonIndex) => {
                    const canAccess = isEnrolled || lesson.is_preview;
                    const isCurrent = currentLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        className={`
                          flex items-center gap-3 p-4 border-b last:border-b-0
                          ${canAccess ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'}
                          ${isCurrent ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}
                        `}
                        onClick={() => canAccess && onLessonClick(lesson)}
                      >
                        {/* Icône de statut */}
                        <div className="shrink-0">
                          {lesson.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : canAccess ? (
                            <PlayCircle className="w-5 h-5 text-orange-600" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Informations leçon */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {lessonIndex + 1}. {lesson.title}
                            </span>
                            {lesson.is_preview && (
                              <Badge variant="secondary" className="text-xs">
                                Aperçu gratuit
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge className="text-xs bg-orange-600">
                                En cours
                              </Badge>
                            )}
                          </div>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>

                        {/* Durée */}
                        <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDuration(lesson.video_duration_seconds)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
};

