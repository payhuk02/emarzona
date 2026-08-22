export function formatServiceDurationMinutes(minutes?: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null;
  const value = Math.round(minutes);
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (mins === 0) return hours === 1 ? '1 h' : `${hours} h`;
  return `${hours} h ${mins} min`;
}

export function serviceLocationTypeLabel(type?: string | null): string | null {
  switch (type) {
    case 'on_site':
      return 'Sur site';
    case 'online':
      return 'En ligne';
    case 'customer_location':
    case 'home':
      return 'À domicile';
    case 'flexible':
      return 'Flexible';
    default:
      return null;
  }
}

export function serviceTypeLabel(type?: string | null): string | null {
  switch (type) {
    case 'appointment':
      return 'Rendez-vous';
    case 'class':
      return 'Cours';
    case 'event':
      return 'Événement';
    case 'consultation':
      return 'Consultation';
    case 'other':
      return 'Prestation';
    default:
      return type?.trim() ? type : null;
  }
}
