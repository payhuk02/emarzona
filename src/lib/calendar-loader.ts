/**
 * Lazy loader pour react-big-calendar
 * Charge react-big-calendar de manière asynchrone pour réduire le bundle initial
 */

let calendarModule: typeof import('react-big-calendar') | null = null;

/**
 * Charge react-big-calendar de manière asynchrone
 */
export const loadCalendar = async () => {
  if (!calendarModule) {
    calendarModule = await import('react-big-calendar');
    // Charger le CSS aussi
    await import('react-big-calendar/lib/css/react-big-calendar.css');
  }
  return calendarModule;
};

/**
 * Charge dateFnsLocalizer de manière asynchrone
 */
export const loadDateFnsLocalizer = async () => {
  const calendar = await loadCalendar();
  return calendar.dateFnsLocalizer;
};

