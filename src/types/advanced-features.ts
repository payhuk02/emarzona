// Types pour les fonctionnalités avancées de paiement et messagerie
// Date: 2025-01-22

export type PaymentType = 'full' | 'percentage' | 'delivery_secured';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'held' | 'released' | 'disputed';
export type DeliveryStatus = 'pending' | 'shipped' | 'delivered' | 'confirmed' | 'disputed';
export type ConversationStatus = 'active' | 'closed' | 'disputed';
export type SenderType = 'customer' | 'store' | 'admin';
export type MessageType = 'text' | 'image' | 'video' | 'file' | 'system';
export type DisputeStatus = 'open' | 'investigating' | 'waiting_customer' | 'waiting_seller' | 'resolved' | 'closed';
export type InitiatorType = 'customer' | 'seller' | 'admin';

// ==============================================
// TYPES POUR LES PAIEMENTS AVANCÉS
// ==============================================

export interface AdvancedPayment {
  id: string;
  store_id: string;
  order_id?: string;
  customer_id?: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_id?: string;
  notes?: string;
  
  // Nouvelles colonnes pour les paiements avancés
  payment_type: PaymentType;
  percentage_amount?: number;
  percentage_rate?: number;
  remaining_amount?: number;
  is_held?: boolean;
  held_until?: string;
  release_conditions?: Record<string, any>;
  delivery_confirmed_at?: string;
  delivery_confirmed_by?: string;
  dispute_opened_at?: string;
  dispute_resolved_at?: string;
  dispute_resolution?: string;
  
  // Relations
  customers?: {
    name: string;
    email?: string;
  };
  orders?: {
    order_number: string;
  };
  
  created_at: string;
  updated_at: string;
}

export interface PartialPayment {
  id: string;
  order_id: string;
  payment_id?: string;
  amount: number;
  percentage: number;
  status: PaymentStatus;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SecuredPayment {
  id: string;
  order_id: string;
  payment_id?: string;
  total_amount: number;
  held_amount: number;
  status: PaymentStatus;
  hold_reason: string;
  release_conditions: Record<string, any>;
  held_until?: string;
  released_at?: string;
  released_by?: string;
  dispute_opened_at?: string;
  dispute_resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdvancedOrder {
  id: string;
  store_id: string;
  customer_id?: string;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  notes?: string;
  
  // Nouvelles colonnes pour les commandes avancées
  payment_type: PaymentType;
  percentage_paid?: number;
  remaining_amount?: number;
  delivery_status: DeliveryStatus;
  delivery_tracking?: string;
  delivery_notes?: string;
  delivery_confirmed_at?: string;
  delivery_confirmed_by?: string;
  
  created_at: string;
  updated_at: string;
}

// ==============================================
// TYPES POUR LA MESSAGERIE
// ==============================================

export interface Conversation {
  id: string;
  order_id: string;
  store_id: string;
  customer_id?: string;
  customer_user_id?: string;
  store_user_id: string;
  status: ConversationStatus;
  last_message_at?: string;
  admin_intervention: boolean;
  admin_user_id?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  order?: {
    order_number: string;
    total_amount: number;
    currency: string;
  };
  store?: {
    name: string;
    slug: string;
  };
  customer?: {
    name: string;
    email?: string;
  };
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: SenderType;
  content?: string;
  message_type: MessageType;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  
  // Relations
  sender?: {
    name: string;
    avatar_url?: string;
  };
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  created_at: string;
}

// ==============================================
// TYPES POUR LES LITIGES
// ==============================================

export interface Dispute {
  id: string;
  order_id: string;
  initiator_id: string;
  initiator_type: InitiatorType;
  subject: string;
  description: string;
  status: DisputeStatus;
  priority?: string;
  resolution?: string;
  admin_notes?: string;
  assigned_admin_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// ==============================================
// TYPES POUR LES FORMULAIRES
// ==============================================

export interface PaymentFormData {
  order_id?: string;
  customer_id?: string;
  payment_method: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  transaction_id?: string;
  notes?: string;
  payment_type: PaymentType;
  percentage_rate?: number;
  percentage_amount?: string;
  remaining_amount?: string;
  is_held?: boolean;
  held_until?: string;
  release_conditions?: Record<string, any>;
}

export interface MessageFormData {
  content: string;
  message_type: MessageType;
  attachments?: File[];
}

export interface DisputeFormData {
  subject: string;
  description: string;
}

// ==============================================
// TYPES POUR LES OPTIONS DE PAIEMENT
// ==============================================

export interface PaymentOptions {
  storeId: string;
  productId?: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency?: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  paymentType?: PaymentType;
  percentageRate?: number;
  metadata?: Record<string, any>;
}

export interface PercentagePaymentOptions extends PaymentOptions {
  percentageRate: number;
  remainingAmount: number;
}

export interface SecuredPaymentOptions extends PaymentOptions {
  holdReason: string;
  releaseConditions: Record<string, any>;
  heldUntil?: string;
}

// ==============================================
// TYPES POUR LES RÉPONSES API
// ==============================================

export interface PaymentResponse {
  success: boolean;
  data?: AdvancedPayment;
  error?: string;
}

export interface ConversationResponse {
  success: boolean;
  data?: Conversation;
  error?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: Message;
  error?: string;
}

export interface DisputeResponse {
  success: boolean;
  data?: Dispute;
  error?: string;
}

// ==============================================
// TYPES POUR LES STATISTIQUES
// ==============================================

export interface PaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  held_payments: number;
  total_revenue: number;
  held_revenue: number;
  average_payment: number;
  success_rate: number;
  percentage_payments: number;
  secured_payments: number;
}

export interface ConversationStats {
  total_conversations: number;
  active_conversations: number;
  closed_conversations: number;
  disputed_conversations: number;
  total_messages: number;
  unread_messages: number;
  admin_interventions: number;
}

export interface DisputeStats {
  total_disputes: number;
  open_disputes: number;
  investigating_disputes: number;
  resolved_disputes: number;
  closed_disputes: number;
  resolution_rate: number;
  average_resolution_time: number;
}

// ==============================================
// TYPES POUR LES FILTRES ET RECHERCHE
// ==============================================

export interface PaymentFilters {
  search?: string;
  status?: PaymentStatus;
  payment_type?: PaymentType;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  is_held?: boolean;
  store_id?: string;
  customer_id?: string;
}

export interface ConversationFilters {
  search?: string;
  status?: ConversationStatus;
  admin_intervention?: boolean;
  date_from?: string;
  date_to?: string;
  store_id?: string;
  customer_id?: string;
}

export interface MessageFilters {
  conversation_id?: string;
  sender_type?: SenderType;
  message_type?: MessageType;
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface DisputeFilters {
  search?: string;
  status?: DisputeStatus;
  initiator_type?: InitiatorType;
  assigned_admin_id?: string;
  date_from?: string;
  date_to?: string;
  store_id?: string;
  customer_id?: string;
}

// ==============================================
// TYPES POUR LES ÉVÉNEMENTS TEMPS RÉEL
// ==============================================

export interface RealtimeEvent {
  type: 'payment_updated' | 'message_sent' | 'conversation_updated' | 'dispute_opened' | 'dispute_resolved';
  data: any;
  timestamp: string;
}

export interface PaymentEvent extends RealtimeEvent {
  type: 'payment_updated';
  data: AdvancedPayment;
}

export interface MessageEvent extends RealtimeEvent {
  type: 'message_sent';
  data: Message;
}

export interface ConversationEvent extends RealtimeEvent {
  type: 'conversation_updated';
  data: Conversation;
}

export interface DisputeEvent extends RealtimeEvent {
  type: 'dispute_opened' | 'dispute_resolved';
  data: Dispute;
}

// ==============================================
// TYPES POUR LES PERMISSIONS
// ==============================================

export interface UserPermissions {
  can_view_payments: boolean;
  can_create_payments: boolean;
  can_update_payments: boolean;
  can_delete_payments: boolean;
  can_view_conversations: boolean;
  can_send_messages: boolean;
  can_view_disputes: boolean;
  can_create_disputes: boolean;
  can_resolve_disputes: boolean;
  can_intervene_conversations: boolean;
  can_view_all_data: boolean;
}

// ==============================================
// TYPES POUR LES CONFIGURATIONS
// ==============================================

export interface PaymentConfig {
  default_commission_rate: number;
  max_percentage_rate: number;
  min_percentage_rate: number;
  max_hold_duration_days: number;
  auto_release_after_days: number;
  dispute_resolution_timeout_days: number;
}

export interface MessagingConfig {
  max_file_size_mb: number;
  allowed_file_types: string[];
  max_conversation_age_days: number;
  auto_close_inactive_days: number;
  enable_admin_intervention: boolean;
}

export interface SecurityConfig {
  require_authentication: boolean;
  enable_file_scanning: boolean;
  enable_content_moderation: boolean;
  max_message_length: number;
  rate_limit_messages_per_minute: number;
}
