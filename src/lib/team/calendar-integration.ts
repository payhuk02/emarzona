/**
 * Calendar Integration Service
 * Date: 2 Février 2025
 * 
 * Service pour exporter les tâches vers des calendriers (iCal, Google Calendar, etc.)
 */

import { type StoreTask } from '@/hooks/useStoreTasks';
import { logger } from '@/lib/logger';

// =====================================================
// EXPORT iCal
// =====================================================

/**
 * Générer un fichier iCal (.ics) pour une tâche
 */
export function generateICalForTask(task: StoreTask): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = new Date();
  const startDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 heure par défaut

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Emarzona//Team Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${task.id}@emarzona.com`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escapeICalText(task.title)}`,
    task.description ? `DESCRIPTION:${escapeICalText(task.description)}` : '',
    `STATUS:${task.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
    `PRIORITY:${getPriorityNumber(task.priority)}`,
    `URL:${window.location.origin}/dashboard/tasks?task=${task.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter((line) => line !== '')
    .join('\r\n');

  return ical;
}

/**
 * Générer un fichier iCal pour plusieurs tâches
 */
export function generateICalForTasks(tasks: StoreTask[]): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = new Date();
  const events = tasks.map((task) => {
    const startDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    return [
      'BEGIN:VEVENT',
      `UID:${task.id}@emarzona.com`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${escapeICalText(task.title)}`,
      task.description ? `DESCRIPTION:${escapeICalText(task.description)}` : '',
      `STATUS:${task.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      `PRIORITY:${getPriorityNumber(task.priority)}`,
      `URL:${window.location.origin}/dashboard/tasks?task=${task.id}`,
      'END:VEVENT',
    ]
      .filter((line) => line !== '')
      .join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Emarzona//Team Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Télécharger un fichier iCal
 */
export function downloadICal(icalContent: string, filename: string = 'tasks.ics'): void {
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Générer une URL Google Calendar
 */
export function generateGoogleCalendarUrl(task: StoreTask): string {
  const startDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: task.description || '',
    location: '',
    sf: 'true',
    output: 'xml',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Générer une URL Outlook Calendar
 */
export function generateOutlookCalendarUrl(task: StoreTask): string {
  const startDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    subject: task.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: task.description || '',
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// =====================================================
// HELPERS
// =====================================================

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function getPriorityNumber(priority: StoreTask['priority']): string {
  const priorityMap = {
    low: '5',
    medium: '3',
    high: '1',
    urgent: '0',
  };
  return priorityMap[priority] || '3';
}

