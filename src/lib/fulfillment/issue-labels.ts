export const FULFILLMENT_ISSUE_LABELS: Record<string, string> = {
  edge_fulfillment_pending: 'Fulfillment edge en attente',
  confirmation_email_pending: 'Email de confirmation en attente',
  digital_license_missing: 'Licence digitale manquante',
  physical_inventory_uncommitted: 'Stock physique non déduit',
  course_enrollment_missing: 'Inscription au cours manquante',
  service_booking_pending: 'Réservation service en attente',
  artist_certificate_missing: 'Certificat artiste manquant',
};

export function getFulfillmentIssueLabel(issueType: string): string {
  return FULFILLMENT_ISSUE_LABELS[issueType] ?? issueType;
}

export const FULFILLMENT_SEVERITY_LABELS: Record<string, string> = {
  info: 'Info',
  warning: 'Avertissement',
  critical: 'Critique',
};
