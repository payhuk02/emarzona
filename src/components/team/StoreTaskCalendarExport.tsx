/**
 * Store Task Calendar Export Component
 * Date: 2 Février 2025
 * 
 * Composant pour exporter les tâches vers des calendriers
 */

import { useState } from 'react';
import { useStoreTasks, type StoreTask } from '@/hooks/useStoreTasks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Download, ExternalLink } from 'lucide-react';
import {
  generateICalForTasks,
  downloadICal,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from '@/lib/team/calendar-integration';

interface StoreTaskCalendarExportProps {
  storeId: string;
  task?: StoreTask;
}

export const StoreTaskCalendarExport = ({ storeId, task }: StoreTaskCalendarExportProps) => {
  const { data: tasks } = useStoreTasks(storeId);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleExportICal = (singleTask?: StoreTask) => {
    const tasksToExport = singleTask ? [singleTask] : tasks || [];
    if (tasksToExport.length === 0) return;

    const icalContent = generateICalForTasks(tasksToExport);
    const filename = singleTask
      ? `task-${singleTask.id}.ics`
      : `tasks-${new Date().toISOString().split('T')[0]}.ics`;
    downloadICal(icalContent, filename);
    setExportDialogOpen(false);
  };

  const handleOpenGoogleCalendar = (task: StoreTask) => {
    const url = generateGoogleCalendarUrl(task);
    window.open(url, '_blank');
  };

  const handleOpenOutlookCalendar = (task: StoreTask) => {
    const url = generateOutlookCalendarUrl(task);
    window.open(url, '_blank');
  };

  if (task) {
    // Export pour une seule tâche
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Ajouter au calendrier
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExportICal(task)}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger (.ics)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenGoogleCalendar(task)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Calendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenOutlookCalendar(task)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Outlook Calendar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Export pour toutes les tâches
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setExportDialogOpen(true)}
        className="w-full sm:w-auto"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Exporter vers calendrier
      </Button>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exporter les tâches</DialogTitle>
            <DialogDescription>
              Choisissez comment exporter vos tâches vers votre calendrier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExportICal()}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger fichier iCal (.ics)
            </Button>
            <p className="text-xs text-muted-foreground px-2">
              Compatible avec Apple Calendar, Google Calendar, Outlook, etc.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

