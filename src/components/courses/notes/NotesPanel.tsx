/**
 * Notes Panel Component
 * Panneau latéral pour afficher et gérer les notes avec timestamps
 */

import { useState } from 'react';
import { FileText, Plus, Clock, Bookmark, X, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLessonNotes, useAddNote, useUpdateNote, useDeleteNote, type CourseNote } from '@/hooks/courses/useCourseNotes';
import { useAuth } from '@/contexts/AuthContext';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface NotesPanelProps {
  enrollmentId: string;
  lessonId: string;
  courseId: string;
  currentTimeSeconds: number;
  onTimestampClick?: (seconds: number) => void;
  className?: string;
}

export const NotesPanel = ({
  enrollmentId,
  lessonId,
  courseId,
  currentTimeSeconds,
  onTimestampClick,
  className,
}: NotesPanelProps) => {
  const { user } = useAuth();
  const { data: notes = [], isLoading } = useLessonNotes(enrollmentId, lessonId);
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingContent, setEditingContent] = useState('');

  const handleAddNote = () => {
    if (!user || !newNoteContent.trim()) return;

    addNote.mutate(
      {
        userId: user.id,
        noteData: {
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          course_id: courseId,
          content: newNoteContent,
          timestamp_seconds: currentTimeSeconds,
        },
      },
      {
        onSuccess: () => {
          setNewNoteContent('');
          setIsAdding(false);
        },
      }
    );
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editingContent.trim()) {
      setEditingId(null);
      return;
    }

    updateNote.mutate(
      {
        noteId,
        updates: { content: editingContent },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingContent('');
        },
      }
    );
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Supprimer cette note ?')) {
      deleteNote.mutate(noteId);
    }
  };

  const handleTimestampClick = (seconds: number) => {
    onTimestampClick?.(seconds);
  };

  const formatTimestamp = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-3">
            {/* Formulaire d'ajout */}
            {isAdding && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTimestamp(currentTimeSeconds)}</span>
                </div>
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Saisissez votre note..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addNote.isPending || !newNoteContent.trim()}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setNewNoteContent('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Liste des notes */}
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Chargement...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Aucune note. Cliquez sur "Ajouter" pour créer votre première note.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    'p-3 border rounded-lg space-y-2',
                    editingId === note.id && 'bg-muted'
                  )}
                >
                  {editingId === note.id ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(note.timestamp_seconds)}</span>
                      </div>
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={updateNote.isPending}
                        >
                          Enregistrer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditingContent('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleTimestampClick(note.timestamp_seconds)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline flex-1"
                        >
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(note.timestamp_seconds)}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setEditingId(note.id);
                              setEditingContent(note.content);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

