/**
 * Types pour le système de pages légales et conformité RGPD
 * Date: 27 octobre 2025
 */

export type LegalDocumentType = 'terms' | 'privacy' | 'cookies' | 'refund';
export type ConsentMethod = 'signup' | 'banner' | 'settings' | 'checkout';
export type GDPRRequestType = 'data_export' | 'data_deletion' | 'data_rectification';
export type GDPRRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  content: string;
  language: 'fr' | 'en' | 'es' | 'pt';
  effective_date: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface UserConsent {
  id: string;
  user_id: string;
  document_type: LegalDocumentType | 'marketing';
  document_version: string;
  consented_at: string;
  ip_address?: string;
  user_agent?: string;
  consent_method: ConsentMethod;
  is_revoked: boolean;
  revoked_at?: string;
  metadata?: Record<string, any>;
}

export interface CookiePreferences {
  id: string;
  user_id?: string;
  necessary: boolean; // Toujours true
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  created_at: string;
  updated_at: string;
}

export interface GDPRRequest {
  id: string;
  user_id: string;
  request_type: GDPRRequestType;
  status: GDPRRequestStatus;
  requested_at: string;
  completed_at?: string;
  export_url?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface LegalPageProps {
  language?: 'fr' | 'en' | 'es' | 'pt';
}

