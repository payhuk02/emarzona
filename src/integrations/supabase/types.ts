export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_items: Json;
          created_at: string;
          currency: string;
          customer_email: string | null;
          id: string;
          recovered_at: string | null;
          recovery_attempts: number | null;
          reminder_sent_at: string[] | null;
          session_id: string | null;
          total_amount: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          cart_items: Json;
          created_at?: string;
          currency?: string;
          customer_email?: string | null;
          id?: string;
          recovered_at?: string | null;
          recovery_attempts?: number | null;
          reminder_sent_at?: string[] | null;
          session_id?: string | null;
          total_amount: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          cart_items?: Json;
          created_at?: string;
          currency?: string;
          customer_email?: string | null;
          id?: string;
          recovered_at?: string | null;
          recovery_attempts?: number | null;
          reminder_sent_at?: string[] | null;
          session_id?: string | null;
          total_amount?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          target_id: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [];
      };
      admin_config: {
        Row: {
          key: string;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          settings?: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          settings?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      admins: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          password_hash: string;
          role: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          password_hash: string;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          password_hash?: string;
          role?: string | null;
        };
        Relationships: [];
      };
      advanced_analytics_dashboards: {
        Row: {
          auto_refresh: boolean | null;
          created_at: string;
          date_range_end: string | null;
          date_range_start: string | null;
          date_range_type: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          is_shared: boolean | null;
          layout: Json | null;
          name: string;
          refresh_interval: number | null;
          shared_with_users: string[] | null;
          store_id: string;
          updated_at: string;
          user_id: string;
          widgets: Json | null;
        };
        Insert: {
          auto_refresh?: boolean | null;
          created_at?: string;
          date_range_end?: string | null;
          date_range_start?: string | null;
          date_range_type?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          layout?: Json | null;
          name: string;
          refresh_interval?: number | null;
          shared_with_users?: string[] | null;
          store_id: string;
          updated_at?: string;
          user_id: string;
          widgets?: Json | null;
        };
        Update: {
          auto_refresh?: boolean | null;
          created_at?: string;
          date_range_end?: string | null;
          date_range_start?: string | null;
          date_range_type?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          is_shared?: boolean | null;
          layout?: Json | null;
          name?: string;
          refresh_interval?: number | null;
          shared_with_users?: string[] | null;
          store_id?: string;
          updated_at?: string;
          user_id?: string;
          widgets?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'advanced_analytics_dashboards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'advanced_analytics_dashboards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'advanced_analytics_dashboards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_clicks: {
        Row: {
          affiliate_id: string;
          affiliate_link_id: string;
          browser: string | null;
          city: string | null;
          clicked_at: string;
          converted: boolean | null;
          converted_at: string | null;
          cookie_expires_at: string;
          country: string | null;
          created_at: string;
          device_type: string | null;
          id: string;
          ip_address: unknown;
          order_id: string | null;
          os: string | null;
          product_id: string;
          referer_url: string | null;
          tracking_cookie: string;
          user_agent: string | null;
        };
        Insert: {
          affiliate_id: string;
          affiliate_link_id: string;
          browser?: string | null;
          city?: string | null;
          clicked_at?: string;
          converted?: boolean | null;
          converted_at?: string | null;
          cookie_expires_at: string;
          country?: string | null;
          created_at?: string;
          device_type?: string | null;
          id?: string;
          ip_address?: unknown;
          order_id?: string | null;
          os?: string | null;
          product_id: string;
          referer_url?: string | null;
          tracking_cookie: string;
          user_agent?: string | null;
        };
        Update: {
          affiliate_id?: string;
          affiliate_link_id?: string;
          browser?: string | null;
          city?: string | null;
          clicked_at?: string;
          converted?: boolean | null;
          converted_at?: string | null;
          cookie_expires_at?: string;
          country?: string | null;
          created_at?: string;
          device_type?: string | null;
          id?: string;
          ip_address?: unknown;
          order_id?: string | null;
          os?: string | null;
          product_id?: string;
          referer_url?: string | null;
          tracking_cookie?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_clicks_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'top_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_affiliate_link_id_fkey';
            columns: ['affiliate_link_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_links';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_clicks_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_commissions: {
        Row: {
          affiliate_id: string;
          affiliate_link_id: string;
          approved_at: string | null;
          approved_by: string | null;
          commission_amount: number;
          commission_base: number;
          commission_rate: number;
          commission_type: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          notes: string | null;
          order_id: string;
          order_total: number;
          paid_at: string | null;
          paid_by: string | null;
          payment_id: string | null;
          payment_method: string | null;
          payment_proof_url: string | null;
          payment_reference: string | null;
          product_id: string;
          rejected_at: string | null;
          rejection_reason: string | null;
          status: string;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          affiliate_id: string;
          affiliate_link_id: string;
          approved_at?: string | null;
          approved_by?: string | null;
          commission_amount: number;
          commission_base: number;
          commission_rate: number;
          commission_type: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          order_id: string;
          order_total: number;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_proof_url?: string | null;
          payment_reference?: string | null;
          product_id: string;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: string;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          affiliate_link_id?: string;
          approved_at?: string | null;
          approved_by?: string | null;
          commission_amount?: number;
          commission_base?: number;
          commission_rate?: number;
          commission_type?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          order_id?: string;
          order_total?: number;
          paid_at?: string | null;
          paid_by?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_proof_url?: string | null;
          payment_reference?: string | null;
          product_id?: string;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: string;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_commissions_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'top_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_affiliate_link_id_fkey';
            columns: ['affiliate_link_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_links';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'affiliate_commissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_links: {
        Row: {
          affiliate_id: string;
          created_at: string;
          custom_parameters: Json | null;
          full_url: string;
          id: string;
          last_used_at: string | null;
          link_code: string;
          product_id: string;
          status: string;
          store_id: string;
          total_clicks: number | null;
          total_commission: number | null;
          total_revenue: number | null;
          total_sales: number | null;
          updated_at: string;
          utm_campaign: string | null;
          utm_medium: string | null;
          utm_source: string | null;
        };
        Insert: {
          affiliate_id: string;
          created_at?: string;
          custom_parameters?: Json | null;
          full_url: string;
          id?: string;
          last_used_at?: string | null;
          link_code: string;
          product_id: string;
          status?: string;
          store_id: string;
          total_clicks?: number | null;
          total_commission?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Update: {
          affiliate_id?: string;
          created_at?: string;
          custom_parameters?: Json | null;
          full_url?: string;
          id?: string;
          last_used_at?: string | null;
          link_code?: string;
          product_id?: string;
          status?: string;
          store_id?: string;
          total_clicks?: number | null;
          total_commission?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_links_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_links_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'top_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_links_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'affiliate_links_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'affiliate_links_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_short_links: {
        Row: {
          affiliate_id: string;
          affiliate_link_id: string;
          created_at: string;
          custom_alias: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          last_used_at: string | null;
          short_code: string;
          target_url: string;
          total_clicks: number | null;
          unique_clicks: number | null;
          updated_at: string;
        };
        Insert: {
          affiliate_id: string;
          affiliate_link_id: string;
          created_at?: string;
          custom_alias?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          short_code: string;
          target_url: string;
          total_clicks?: number | null;
          unique_clicks?: number | null;
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          affiliate_link_id?: string;
          created_at?: string;
          custom_alias?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          short_code?: string;
          target_url?: string;
          total_clicks?: number | null;
          unique_clicks?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_short_links_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_short_links_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'top_affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_short_links_affiliate_link_id_fkey';
            columns: ['affiliate_link_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_links';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_withdrawals: {
        Row: {
          admin_notes: string | null;
          affiliate_id: string;
          amount: number;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          currency: string;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          payment_details: Json;
          payment_method: string;
          processed_at: string | null;
          processed_by: string | null;
          proof_url: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          status: string;
          transaction_reference: string | null;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          affiliate_id: string;
          amount: number;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          currency?: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          payment_details: Json;
          payment_method: string;
          processed_at?: string | null;
          processed_by?: string | null;
          proof_url?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: string;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          affiliate_id?: string;
          amount?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          currency?: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          payment_details?: Json;
          payment_method?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          proof_url?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: string;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_withdrawals_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_withdrawals_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'top_affiliates';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliates: {
        Row: {
          affiliate_code: string;
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_login_at: string | null;
          last_name: string | null;
          payment_details: Json | null;
          payment_method: string | null;
          pending_commission: number | null;
          status: string;
          suspended_at: string | null;
          suspension_reason: string | null;
          total_clicks: number | null;
          total_commission_earned: number | null;
          total_commission_paid: number | null;
          total_revenue: number | null;
          total_sales: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          affiliate_code: string;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email: string;
          first_name?: string | null;
          id?: string;
          last_login_at?: string | null;
          last_name?: string | null;
          payment_details?: Json | null;
          payment_method?: string | null;
          pending_commission?: number | null;
          status?: string;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          total_clicks?: number | null;
          total_commission_earned?: number | null;
          total_commission_paid?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          affiliate_code?: string;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_login_at?: string | null;
          last_name?: string | null;
          payment_details?: Json | null;
          payment_method?: string | null;
          pending_commission?: number | null;
          status?: string;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          total_clicks?: number | null;
          total_commission_earned?: number | null;
          total_commission_paid?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      analytics_alerts: {
        Row: {
          alert_type: string;
          comparison_period: string | null;
          condition_type: string;
          created_at: string;
          description: string | null;
          email_enabled: boolean | null;
          id: string;
          is_active: boolean | null;
          last_triggered_at: string | null;
          metric_name: string;
          name: string;
          push_enabled: boolean | null;
          store_id: string;
          threshold_value: number;
          trigger_count: number | null;
          updated_at: string;
          user_id: string;
          webhook_url: string | null;
        };
        Insert: {
          alert_type: string;
          comparison_period?: string | null;
          condition_type: string;
          created_at?: string;
          description?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          metric_name: string;
          name: string;
          push_enabled?: boolean | null;
          store_id: string;
          threshold_value: number;
          trigger_count?: number | null;
          updated_at?: string;
          user_id: string;
          webhook_url?: string | null;
        };
        Update: {
          alert_type?: string;
          comparison_period?: string | null;
          condition_type?: string;
          created_at?: string;
          description?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          metric_name?: string;
          name?: string;
          push_enabled?: boolean | null;
          store_id?: string;
          threshold_value?: number;
          trigger_count?: number | null;
          updated_at?: string;
          user_id?: string;
          webhook_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'analytics_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'analytics_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_goals: {
        Row: {
          achieved_at: string | null;
          created_at: string;
          current_value: number | null;
          description: string | null;
          goal_type: string;
          id: string;
          name: string;
          notify_on_achievement: boolean | null;
          notify_on_missed: boolean | null;
          period_end: string;
          period_start: string;
          period_type: string;
          progress_percentage: number | null;
          status: string;
          store_id: string;
          target_value: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          achieved_at?: string | null;
          created_at?: string;
          current_value?: number | null;
          description?: string | null;
          goal_type: string;
          id?: string;
          name: string;
          notify_on_achievement?: boolean | null;
          notify_on_missed?: boolean | null;
          period_end: string;
          period_start: string;
          period_type?: string;
          progress_percentage?: number | null;
          status?: string;
          store_id: string;
          target_value: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          achieved_at?: string | null;
          created_at?: string;
          current_value?: number | null;
          description?: string | null;
          goal_type?: string;
          id?: string;
          name?: string;
          notify_on_achievement?: boolean | null;
          notify_on_missed?: boolean | null;
          period_end?: string;
          period_start?: string;
          period_type?: string;
          progress_percentage?: number | null;
          status?: string;
          store_id?: string;
          target_value?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_goals_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'analytics_goals_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'analytics_goals_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_metrics: {
        Row: {
          average_order_value: number | null;
          avg_page_load_time: number | null;
          avg_session_duration: number | null;
          avg_time_to_first_byte: number | null;
          bounce_rate: number | null;
          calculated_at: string;
          cart_abandonment_rate: number | null;
          city_breakdown: Json | null;
          click_through_rate: number | null;
          conversion_rate: number | null;
          country_breakdown: Json | null;
          desktop_views: number | null;
          direct_traffic: number | null;
          email_traffic: number | null;
          error_rate: number | null;
          id: string;
          mobile_views: number | null;
          new_visitors: number | null;
          organic_search: number | null;
          pages_per_session: number | null;
          paid_search: number | null;
          period_end: string;
          period_start: string;
          period_type: string;
          product_id: string | null;
          referral_traffic: number | null;
          returning_visitors: number | null;
          social_traffic: number | null;
          store_id: string;
          tablet_views: number | null;
          total_clicks: number | null;
          total_conversions: number | null;
          total_revenue: number | null;
          total_views: number | null;
          unique_clicks: number | null;
          unique_conversions: number | null;
          unique_views: number | null;
        };
        Insert: {
          average_order_value?: number | null;
          avg_page_load_time?: number | null;
          avg_session_duration?: number | null;
          avg_time_to_first_byte?: number | null;
          bounce_rate?: number | null;
          calculated_at?: string;
          cart_abandonment_rate?: number | null;
          city_breakdown?: Json | null;
          click_through_rate?: number | null;
          conversion_rate?: number | null;
          country_breakdown?: Json | null;
          desktop_views?: number | null;
          direct_traffic?: number | null;
          email_traffic?: number | null;
          error_rate?: number | null;
          id?: string;
          mobile_views?: number | null;
          new_visitors?: number | null;
          organic_search?: number | null;
          pages_per_session?: number | null;
          paid_search?: number | null;
          period_end: string;
          period_start: string;
          period_type?: string;
          product_id?: string | null;
          referral_traffic?: number | null;
          returning_visitors?: number | null;
          social_traffic?: number | null;
          store_id: string;
          tablet_views?: number | null;
          total_clicks?: number | null;
          total_conversions?: number | null;
          total_revenue?: number | null;
          total_views?: number | null;
          unique_clicks?: number | null;
          unique_conversions?: number | null;
          unique_views?: number | null;
        };
        Update: {
          average_order_value?: number | null;
          avg_page_load_time?: number | null;
          avg_session_duration?: number | null;
          avg_time_to_first_byte?: number | null;
          bounce_rate?: number | null;
          calculated_at?: string;
          cart_abandonment_rate?: number | null;
          city_breakdown?: Json | null;
          click_through_rate?: number | null;
          conversion_rate?: number | null;
          country_breakdown?: Json | null;
          desktop_views?: number | null;
          direct_traffic?: number | null;
          email_traffic?: number | null;
          error_rate?: number | null;
          id?: string;
          mobile_views?: number | null;
          new_visitors?: number | null;
          organic_search?: number | null;
          pages_per_session?: number | null;
          paid_search?: number | null;
          period_end?: string;
          period_start?: string;
          period_type?: string;
          product_id?: string | null;
          referral_traffic?: number | null;
          returning_visitors?: number | null;
          social_traffic?: number | null;
          store_id?: string;
          tablet_views?: number | null;
          total_clicks?: number | null;
          total_conversions?: number | null;
          total_revenue?: number | null;
          total_views?: number | null;
          unique_clicks?: number | null;
          unique_conversions?: number | null;
          unique_views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_metrics_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_metrics_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'analytics_metrics_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'analytics_metrics_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_metrics_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'analytics_metrics_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'analytics_metrics_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      api_keys: {
        Row: {
          created_at: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          permissions: Json | null;
          store_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          permissions?: Json | null;
          store_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          permissions?: Json | null;
          store_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'api_keys_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'api_keys_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      artist_products: {
        Row: {
          artist_bio: string | null;
          artist_name: string;
          artist_photo_url: string | null;
          artist_social_links: Json | null;
          artist_type: string;
          artist_website: string | null;
          artwork_dimensions: Json | null;
          artwork_edition_type: string | null;
          artwork_link_url: string | null;
          artwork_medium: string | null;
          artwork_title: string;
          artwork_year: number | null;
          certificate_file_url: string | null;
          certificate_of_authenticity: boolean | null;
          created_at: string;
          designer_specific: Json | null;
          edition_number: number | null;
          id: string;
          multimedia_specific: Json | null;
          musician_specific: Json | null;
          product_id: string;
          requires_shipping: boolean | null;
          shipping_fragile: boolean | null;
          shipping_handling_time: number | null;
          shipping_insurance_amount: number | null;
          shipping_insurance_required: boolean | null;
          signature_authenticated: boolean | null;
          signature_location: string | null;
          store_id: string;
          total_editions: number | null;
          updated_at: string;
          visual_artist_specific: Json | null;
          writer_specific: Json | null;
        };
        Insert: {
          artist_bio?: string | null;
          artist_name: string;
          artist_photo_url?: string | null;
          artist_social_links?: Json | null;
          artist_type: string;
          artist_website?: string | null;
          artwork_dimensions?: Json | null;
          artwork_edition_type?: string | null;
          artwork_link_url?: string | null;
          artwork_medium?: string | null;
          artwork_title: string;
          artwork_year?: number | null;
          certificate_file_url?: string | null;
          certificate_of_authenticity?: boolean | null;
          created_at?: string;
          designer_specific?: Json | null;
          edition_number?: number | null;
          id?: string;
          multimedia_specific?: Json | null;
          musician_specific?: Json | null;
          product_id: string;
          requires_shipping?: boolean | null;
          shipping_fragile?: boolean | null;
          shipping_handling_time?: number | null;
          shipping_insurance_amount?: number | null;
          shipping_insurance_required?: boolean | null;
          signature_authenticated?: boolean | null;
          signature_location?: string | null;
          store_id: string;
          total_editions?: number | null;
          updated_at?: string;
          visual_artist_specific?: Json | null;
          writer_specific?: Json | null;
        };
        Update: {
          artist_bio?: string | null;
          artist_name?: string;
          artist_photo_url?: string | null;
          artist_social_links?: Json | null;
          artist_type?: string;
          artist_website?: string | null;
          artwork_dimensions?: Json | null;
          artwork_edition_type?: string | null;
          artwork_link_url?: string | null;
          artwork_medium?: string | null;
          artwork_title?: string;
          artwork_year?: number | null;
          certificate_file_url?: string | null;
          certificate_of_authenticity?: boolean | null;
          created_at?: string;
          designer_specific?: Json | null;
          edition_number?: number | null;
          id?: string;
          multimedia_specific?: Json | null;
          musician_specific?: Json | null;
          product_id?: string;
          requires_shipping?: boolean | null;
          shipping_fragile?: boolean | null;
          shipping_handling_time?: number | null;
          shipping_insurance_amount?: number | null;
          shipping_insurance_required?: boolean | null;
          signature_authenticated?: boolean | null;
          signature_location?: string | null;
          store_id?: string;
          total_editions?: number | null;
          updated_at?: string;
          visual_artist_specific?: Json | null;
          writer_specific?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'artist_products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'artist_products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'artist_products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      auto_reorder_rules: {
        Row: {
          auto_create_order: boolean | null;
          created_at: string;
          id: string;
          is_active: boolean | null;
          max_stock_level: number | null;
          notes: string | null;
          notify_email: string[] | null;
          notify_on_reorder: boolean | null;
          product_id: string | null;
          reorder_point: number;
          reorder_quantity: number;
          require_approval: boolean | null;
          store_id: string;
          supplier_id: string;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          auto_create_order?: boolean | null;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          max_stock_level?: number | null;
          notes?: string | null;
          notify_email?: string[] | null;
          notify_on_reorder?: boolean | null;
          product_id?: string | null;
          reorder_point: number;
          reorder_quantity: number;
          require_approval?: boolean | null;
          store_id: string;
          supplier_id: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          auto_create_order?: boolean | null;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          max_stock_level?: number | null;
          notes?: string | null;
          notify_email?: string[] | null;
          notify_on_reorder?: boolean | null;
          product_id?: string | null;
          reorder_point?: number;
          reorder_quantity?: number;
          require_approval?: boolean | null;
          store_id?: string;
          supplier_id?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'auto_reorder_rules_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auto_reorder_rules_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      backorder_customers: {
        Row: {
          backorder_id: string;
          customer_id: string;
          fulfilled_at: string | null;
          id: string;
          is_fulfilled: boolean | null;
          is_notified: boolean | null;
          order_id: string;
          quantity_fulfilled: number | null;
          quantity_requested: number;
          requested_at: string | null;
        };
        Insert: {
          backorder_id: string;
          customer_id: string;
          fulfilled_at?: string | null;
          id?: string;
          is_fulfilled?: boolean | null;
          is_notified?: boolean | null;
          order_id: string;
          quantity_fulfilled?: number | null;
          quantity_requested?: number;
          requested_at?: string | null;
        };
        Update: {
          backorder_id?: string;
          customer_id?: string;
          fulfilled_at?: string | null;
          id?: string;
          is_fulfilled?: boolean | null;
          is_notified?: boolean | null;
          order_id?: string;
          quantity_fulfilled?: number | null;
          quantity_requested?: number;
          requested_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'backorder_customers_backorder_id_fkey';
            columns: ['backorder_id'];
            isOneToOne: false;
            referencedRelation: 'backorders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'backorder_customers_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'backorder_customers_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      backorders: {
        Row: {
          auto_fulfill_on_arrival: boolean | null;
          created_at: string | null;
          customer_demand: number | null;
          expected_restock_date: string | null;
          first_request_date: string | null;
          id: string;
          is_enabled: boolean | null;
          last_received_date: string | null;
          notes: string | null;
          notified_customers: number | null;
          ordered_quantity: number | null;
          pending_quantity: number | null;
          priority: string | null;
          product_id: string;
          purchase_order_id: string | null;
          received_quantity: number | null;
          status: string;
          store_id: string;
          supplier_id: string | null;
          supplier_name: string | null;
          supplier_order_date: string | null;
          total_customers: number | null;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          auto_fulfill_on_arrival?: boolean | null;
          created_at?: string | null;
          customer_demand?: number | null;
          expected_restock_date?: string | null;
          first_request_date?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          last_received_date?: string | null;
          notes?: string | null;
          notified_customers?: number | null;
          ordered_quantity?: number | null;
          pending_quantity?: number | null;
          priority?: string | null;
          product_id: string;
          purchase_order_id?: string | null;
          received_quantity?: number | null;
          status?: string;
          store_id: string;
          supplier_id?: string | null;
          supplier_name?: string | null;
          supplier_order_date?: string | null;
          total_customers?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          auto_fulfill_on_arrival?: boolean | null;
          created_at?: string | null;
          customer_demand?: number | null;
          expected_restock_date?: string | null;
          first_request_date?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          last_received_date?: string | null;
          notes?: string | null;
          notified_customers?: number | null;
          ordered_quantity?: number | null;
          pending_quantity?: number | null;
          priority?: string | null;
          product_id?: string;
          purchase_order_id?: string | null;
          received_quantity?: number | null;
          status?: string;
          store_id?: string;
          supplier_id?: string | null;
          supplier_name?: string | null;
          supplier_order_date?: string | null;
          total_customers?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'backorders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'backorders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'backorders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'backorders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'backorders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'backorders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'backorders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'backorders_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      batch_label_templates: {
        Row: {
          created_at: string;
          id: string;
          include_barcode: boolean | null;
          include_instructions: boolean | null;
          include_tracking: boolean | null;
          is_active: boolean | null;
          is_default: boolean | null;
          layout_config: Json | null;
          store_id: string;
          template_name: string;
          template_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          include_barcode?: boolean | null;
          include_instructions?: boolean | null;
          include_tracking?: boolean | null;
          is_active?: boolean | null;
          is_default?: boolean | null;
          layout_config?: Json | null;
          store_id: string;
          template_name: string;
          template_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          include_barcode?: boolean | null;
          include_instructions?: boolean | null;
          include_tracking?: boolean | null;
          is_active?: boolean | null;
          is_default?: boolean | null;
          layout_config?: Json | null;
          store_id?: string;
          template_name?: string;
          template_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'batch_label_templates_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'batch_label_templates_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'batch_label_templates_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      batch_shipment_orders: {
        Row: {
          batch_shipment_id: string;
          created_at: string;
          error_details: Json | null;
          error_message: string | null;
          id: string;
          order_id: string;
          order_in_batch: number;
          processed_at: string | null;
          shipping_label_id: string | null;
          status: string;
          tracking_number: string | null;
          updated_at: string;
        };
        Insert: {
          batch_shipment_id: string;
          created_at?: string;
          error_details?: Json | null;
          error_message?: string | null;
          id?: string;
          order_id: string;
          order_in_batch: number;
          processed_at?: string | null;
          shipping_label_id?: string | null;
          status?: string;
          tracking_number?: string | null;
          updated_at?: string;
        };
        Update: {
          batch_shipment_id?: string;
          created_at?: string;
          error_details?: Json | null;
          error_message?: string | null;
          id?: string;
          order_id?: string;
          order_in_batch?: number;
          processed_at?: string | null;
          shipping_label_id?: string | null;
          status?: string;
          tracking_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'batch_shipment_orders_batch_shipment_id_fkey';
            columns: ['batch_shipment_id'];
            isOneToOne: false;
            referencedRelation: 'batch_shipments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'batch_shipment_orders_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'batch_shipment_orders_shipping_label_id_fkey';
            columns: ['shipping_label_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_labels';
            referencedColumns: ['id'];
          },
        ];
      };
      batch_shipments: {
        Row: {
          batch_name: string | null;
          batch_number: string;
          carrier_id: string | null;
          carrier_name: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error_log: Json | null;
          failed_orders: number;
          id: string;
          notes: string | null;
          processed_at: string | null;
          processed_by: string | null;
          processed_orders: number;
          status: string;
          store_id: string;
          total_orders: number;
          updated_at: string;
        };
        Insert: {
          batch_name?: string | null;
          batch_number: string;
          carrier_id?: string | null;
          carrier_name?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_log?: Json | null;
          failed_orders?: number;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          processed_orders?: number;
          status?: string;
          store_id: string;
          total_orders?: number;
          updated_at?: string;
        };
        Update: {
          batch_name?: string | null;
          batch_number?: string;
          carrier_id?: string | null;
          carrier_name?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_log?: Json | null;
          failed_orders?: number;
          id?: string;
          notes?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          processed_orders?: number;
          status?: string;
          store_id?: string;
          total_orders?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'batch_shipments_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_carriers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'batch_shipments_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'batch_shipments_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'batch_shipments_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      bundle_items: {
        Row: {
          bundle_id: string;
          created_at: string | null;
          display_order: number | null;
          id: string;
          is_required: boolean | null;
          price: number;
          product_id: string;
          quantity: number;
          variant_id: string | null;
        };
        Insert: {
          bundle_id: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_required?: boolean | null;
          price: number;
          product_id: string;
          quantity?: number;
          variant_id?: string | null;
        };
        Update: {
          bundle_id?: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_required?: boolean | null;
          price?: number;
          product_id?: string;
          quantity?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bundle_items_bundle_id_fkey';
            columns: ['bundle_id'];
            isOneToOne: false;
            referencedRelation: 'product_bundles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bundle_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      bundle_order_items: {
        Row: {
          bundle_id: string;
          bundle_price: number;
          created_at: string;
          customer_id: string | null;
          digital_product_ids: string[];
          discount_amount: number;
          id: string;
          individual_products_total: number;
          order_id: string;
          order_item_id: string | null;
        };
        Insert: {
          bundle_id: string;
          bundle_price: number;
          created_at?: string;
          customer_id?: string | null;
          digital_product_ids: string[];
          discount_amount: number;
          id?: string;
          individual_products_total: number;
          order_id: string;
          order_item_id?: string | null;
        };
        Update: {
          bundle_id?: string;
          bundle_price?: number;
          created_at?: string;
          customer_id?: string | null;
          digital_product_ids?: string[];
          discount_amount?: number;
          id?: string;
          individual_products_total?: number;
          order_id?: string;
          order_item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bundle_order_items_bundle_id_fkey';
            columns: ['bundle_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_bundles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bundle_order_items_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bundle_order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bundle_order_items_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      cart_items: {
        Row: {
          added_at: string;
          coupon_code: string | null;
          currency: string;
          discount_amount: number | null;
          discount_percentage: number | null;
          id: string;
          metadata: Json | null;
          product_id: string;
          product_image_url: string | null;
          product_name: string;
          product_type: string;
          quantity: number;
          session_id: string | null;
          unit_price: number;
          updated_at: string;
          user_id: string | null;
          variant_id: string | null;
          variant_name: string | null;
        };
        Insert: {
          added_at?: string;
          coupon_code?: string | null;
          currency?: string;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          id?: string;
          metadata?: Json | null;
          product_id: string;
          product_image_url?: string | null;
          product_name: string;
          product_type: string;
          quantity?: number;
          session_id?: string | null;
          unit_price: number;
          updated_at?: string;
          user_id?: string | null;
          variant_id?: string | null;
          variant_name?: string | null;
        };
        Update: {
          added_at?: string;
          coupon_code?: string | null;
          currency?: string;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          id?: string;
          metadata?: Json | null;
          product_id?: string;
          product_image_url?: string | null;
          product_name?: string;
          product_type?: string;
          quantity?: number;
          session_id?: string | null;
          unit_price?: number;
          updated_at?: string;
          user_id?: string | null;
          variant_id?: string | null;
          variant_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'physical_product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      commission_payments: {
        Row: {
          admin_notes: string | null;
          amount: number;
          approved_at: string | null;
          approved_by: string | null;
          commission_ids: string[];
          created_at: string;
          currency: string;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          payment_details: Json;
          payment_method: string;
          processed_at: string | null;
          processed_by: string | null;
          referrer_id: string;
          status: string;
          transaction_reference: string | null;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          amount: number;
          approved_at?: string | null;
          approved_by?: string | null;
          commission_ids: string[];
          created_at?: string;
          currency?: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          payment_details?: Json;
          payment_method: string;
          processed_at?: string | null;
          processed_by?: string | null;
          referrer_id: string;
          status?: string;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          amount?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          commission_ids?: string[];
          created_at?: string;
          currency?: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          payment_details?: Json;
          payment_method?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          referrer_id?: string;
          status?: string;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_comments: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          likes_count: number | null;
          parent_comment_id: string | null;
          post_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          likes_count?: number | null;
          parent_comment_id?: string | null;
          post_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          likes_count?: number | null;
          parent_comment_id?: string | null;
          post_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'community_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_comments_parent_comment_id_fkey';
            columns: ['parent_comment_id'];
            isOneToOne: false;
            referencedRelation: 'community_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'community_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      community_follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'community_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_follows_following_id_fkey';
            columns: ['following_id'];
            isOneToOne: false;
            referencedRelation: 'community_members';
            referencedColumns: ['id'];
          },
        ];
      };
      community_members: {
        Row: {
          badges: string[] | null;
          bio: string | null;
          city: string | null;
          company: string | null;
          country: string;
          created_at: string;
          email: string;
          first_name: string;
          github_url: string | null;
          id: string;
          join_date: string;
          last_active: string | null;
          last_name: string;
          linkedin_url: string | null;
          phone: string | null;
          profession: string | null;
          profile_image_url: string | null;
          role: string;
          status: string;
          twitter_url: string | null;
          updated_at: string;
          user_id: string;
          website: string | null;
        };
        Insert: {
          badges?: string[] | null;
          bio?: string | null;
          city?: string | null;
          company?: string | null;
          country?: string;
          created_at?: string;
          email: string;
          first_name: string;
          github_url?: string | null;
          id?: string;
          join_date?: string;
          last_active?: string | null;
          last_name: string;
          linkedin_url?: string | null;
          phone?: string | null;
          profession?: string | null;
          profile_image_url?: string | null;
          role?: string;
          status?: string;
          twitter_url?: string | null;
          updated_at?: string;
          user_id: string;
          website?: string | null;
        };
        Update: {
          badges?: string[] | null;
          bio?: string | null;
          city?: string | null;
          company?: string | null;
          country?: string;
          created_at?: string;
          email?: string;
          first_name?: string;
          github_url?: string | null;
          id?: string;
          join_date?: string;
          last_active?: string | null;
          last_name?: string;
          linkedin_url?: string | null;
          phone?: string | null;
          profession?: string | null;
          profile_image_url?: string | null;
          role?: string;
          status?: string;
          twitter_url?: string | null;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      community_notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean | null;
          link: string | null;
          member_id: string;
          message: string;
          read_at: string | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          member_id: string;
          message: string;
          read_at?: string | null;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          member_id?: string;
          message?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_notifications_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'community_members';
            referencedColumns: ['id'];
          },
        ];
      };
      community_posts: {
        Row: {
          author_id: string;
          category: string | null;
          comments_count: number | null;
          content: string;
          content_type: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_featured: boolean | null;
          is_pinned: boolean | null;
          likes_count: number | null;
          metadata: Json | null;
          published_at: string | null;
          shares_count: number | null;
          status: string;
          tags: string[] | null;
          title: string | null;
          updated_at: string;
          views_count: number | null;
        };
        Insert: {
          author_id: string;
          category?: string | null;
          comments_count?: number | null;
          content: string;
          content_type?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          metadata?: Json | null;
          published_at?: string | null;
          shares_count?: number | null;
          status?: string;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string;
          views_count?: number | null;
        };
        Update: {
          author_id?: string;
          category?: string | null;
          comments_count?: number | null;
          content?: string;
          content_type?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          metadata?: Json | null;
          published_at?: string | null;
          shares_count?: number | null;
          status?: string;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'community_members';
            referencedColumns: ['id'];
          },
        ];
      };
      community_reactions: {
        Row: {
          comment_id: string | null;
          created_at: string;
          id: string;
          member_id: string;
          post_id: string | null;
          reaction_type: string;
        };
        Insert: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          member_id: string;
          post_id?: string | null;
          reaction_type: string;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          member_id?: string;
          post_id?: string | null;
          reaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_reactions_comment_id_fkey';
            columns: ['comment_id'];
            isOneToOne: false;
            referencedRelation: 'community_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_reactions_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'community_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_reactions_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'community_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      cookie_preferences: {
        Row: {
          analytics: boolean | null;
          created_at: string | null;
          functional: boolean | null;
          id: string;
          marketing: boolean | null;
          necessary: boolean | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          analytics?: boolean | null;
          created_at?: string | null;
          functional?: boolean | null;
          id?: string;
          marketing?: boolean | null;
          necessary?: boolean | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          analytics?: boolean | null;
          created_at?: string | null;
          functional?: boolean | null;
          id?: string;
          marketing?: boolean | null;
          necessary?: boolean | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      coupon_customer_usage: {
        Row: {
          coupon_id: string;
          customer_id: string;
          discount_amount: number;
          id: string;
          order_id: string | null;
          order_total_after: number;
          order_total_before: number;
          used_at: string;
        };
        Insert: {
          coupon_id: string;
          customer_id: string;
          discount_amount: number;
          id?: string;
          order_id?: string | null;
          order_total_after: number;
          order_total_before: number;
          used_at?: string;
        };
        Update: {
          coupon_id?: string;
          customer_id?: string;
          discount_amount?: number;
          id?: string;
          order_id?: string | null;
          order_total_after?: number;
          order_total_before?: number;
          used_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'coupon_customer_usage_coupon_id_fkey';
            columns: ['coupon_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_coupons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_customer_usage_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_customer_usage_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      coupon_usages: {
        Row: {
          coupon_id: string | null;
          created_at: string | null;
          customer_email: string | null;
          customer_name: string | null;
          discount_amount: number;
          final_amount: number;
          id: string;
          order_id: string | null;
          order_total_after_discount: number;
          order_total_before_discount: number;
          original_amount: number;
          product_id: string | null;
          product_type: string | null;
          promotion_id: string;
          session_id: string | null;
          used_at: string | null;
          user_id: string | null;
        };
        Insert: {
          coupon_id?: string | null;
          created_at?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          discount_amount: number;
          final_amount: number;
          id?: string;
          order_id?: string | null;
          order_total_after_discount?: number;
          order_total_before_discount?: number;
          original_amount: number;
          product_id?: string | null;
          product_type?: string | null;
          promotion_id: string;
          session_id?: string | null;
          used_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          coupon_id?: string | null;
          created_at?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          discount_amount?: number;
          final_amount?: number;
          id?: string;
          order_id?: string | null;
          order_total_after_discount?: number;
          order_total_before_discount?: number;
          original_amount?: number;
          product_id?: string | null;
          product_type?: string | null;
          promotion_id?: string;
          session_id?: string | null;
          used_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'coupon_usages_coupon_id_fkey';
            columns: ['coupon_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_coupons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_usages_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_usages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_usages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'coupon_usages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'coupon_usages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'coupon_usages_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      course_achievements: {
        Row: {
          achievement_type: string;
          course_id: string | null;
          created_at: string;
          criteria: Json | null;
          description: string | null;
          display_order: number | null;
          icon_url: string | null;
          id: string;
          is_visible: boolean | null;
          reward_points: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          achievement_type: string;
          course_id?: string | null;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          reward_points?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          achievement_type?: string;
          course_id?: string | null;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          reward_points?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_achievements_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      course_assignment_grading: {
        Row: {
          created_at: string;
          feedback: string | null;
          feedback_files: Json | null;
          grade: number;
          grade_letter: string | null;
          grade_percentage: number | null;
          graded_at: string;
          graded_by: string;
          id: string;
          is_passed: boolean | null;
          private_notes: string | null;
          rubric_scores: Json | null;
          submission_id: string;
        };
        Insert: {
          created_at?: string;
          feedback?: string | null;
          feedback_files?: Json | null;
          grade: number;
          grade_letter?: string | null;
          grade_percentage?: number | null;
          graded_at?: string;
          graded_by: string;
          id?: string;
          is_passed?: boolean | null;
          private_notes?: string | null;
          rubric_scores?: Json | null;
          submission_id: string;
        };
        Update: {
          created_at?: string;
          feedback?: string | null;
          feedback_files?: Json | null;
          grade?: number;
          grade_letter?: string | null;
          grade_percentage?: number | null;
          graded_at?: string;
          graded_by?: string;
          id?: string;
          is_passed?: boolean | null;
          private_notes?: string | null;
          rubric_scores?: Json | null;
          submission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_assignment_grading_submission_id_fkey';
            columns: ['submission_id'];
            isOneToOne: false;
            referencedRelation: 'course_assignment_submissions';
            referencedColumns: ['id'];
          },
        ];
      };
      course_assignment_submissions: {
        Row: {
          assignment_id: string;
          course_id: string;
          created_at: string;
          enrollment_id: string;
          feedback: string | null;
          feedback_files: Json | null;
          grade: number | null;
          grade_letter: string | null;
          grade_percentage: number | null;
          graded_at: string | null;
          id: string;
          is_late: boolean | null;
          is_passed: boolean | null;
          late_hours: number | null;
          needs_revision: boolean | null;
          penalty_applied: number | null;
          previous_submission_id: string | null;
          returned_at: string | null;
          revision_notes: string | null;
          rubric_scores: Json | null;
          status: string;
          submission_code: string | null;
          submission_files: Json | null;
          submission_text: string | null;
          submission_url: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          version: number | null;
        };
        Insert: {
          assignment_id: string;
          course_id: string;
          created_at?: string;
          enrollment_id: string;
          feedback?: string | null;
          feedback_files?: Json | null;
          grade?: number | null;
          grade_letter?: string | null;
          grade_percentage?: number | null;
          graded_at?: string | null;
          id?: string;
          is_late?: boolean | null;
          is_passed?: boolean | null;
          late_hours?: number | null;
          needs_revision?: boolean | null;
          penalty_applied?: number | null;
          previous_submission_id?: string | null;
          returned_at?: string | null;
          revision_notes?: string | null;
          rubric_scores?: Json | null;
          status?: string;
          submission_code?: string | null;
          submission_files?: Json | null;
          submission_text?: string | null;
          submission_url?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
          user_id: string;
          version?: number | null;
        };
        Update: {
          assignment_id?: string;
          course_id?: string;
          created_at?: string;
          enrollment_id?: string;
          feedback?: string | null;
          feedback_files?: Json | null;
          grade?: number | null;
          grade_letter?: string | null;
          grade_percentage?: number | null;
          graded_at?: string | null;
          id?: string;
          is_late?: boolean | null;
          is_passed?: boolean | null;
          late_hours?: number | null;
          needs_revision?: boolean | null;
          penalty_applied?: number | null;
          previous_submission_id?: string | null;
          returned_at?: string | null;
          revision_notes?: string | null;
          rubric_scores?: Json | null;
          status?: string;
          submission_code?: string | null;
          submission_files?: Json | null;
          submission_text?: string | null;
          submission_url?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_assignment_submissions_assignment_id_fkey';
            columns: ['assignment_id'];
            isOneToOne: false;
            referencedRelation: 'course_assignments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_assignment_submissions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_assignment_submissions_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_assignment_submissions_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
          {
            foreignKeyName: 'course_assignment_submissions_previous_submission_id_fkey';
            columns: ['previous_submission_id'];
            isOneToOne: false;
            referencedRelation: 'course_assignment_submissions';
            referencedColumns: ['id'];
          },
        ];
      };
      course_assignments: {
        Row: {
          allow_late_submission: boolean | null;
          allowed_file_types: string[] | null;
          assignment_type: string;
          course_id: string;
          created_at: string;
          description: string | null;
          due_date: string | null;
          grading_type: string | null;
          id: string;
          instructions: string | null;
          is_required: boolean | null;
          is_visible: boolean | null;
          late_penalty_percentage: number | null;
          max_file_size: number | null;
          max_files: number | null;
          order_index: number | null;
          points_possible: number | null;
          rubric: Json | null;
          section_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          allow_late_submission?: boolean | null;
          allowed_file_types?: string[] | null;
          assignment_type?: string;
          course_id: string;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          grading_type?: string | null;
          id?: string;
          instructions?: string | null;
          is_required?: boolean | null;
          is_visible?: boolean | null;
          late_penalty_percentage?: number | null;
          max_file_size?: number | null;
          max_files?: number | null;
          order_index?: number | null;
          points_possible?: number | null;
          rubric?: Json | null;
          section_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          allow_late_submission?: boolean | null;
          allowed_file_types?: string[] | null;
          assignment_type?: string;
          course_id?: string;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          grading_type?: string | null;
          id?: string;
          instructions?: string | null;
          is_required?: boolean | null;
          is_visible?: boolean | null;
          late_penalty_percentage?: number | null;
          max_file_size?: number | null;
          max_files?: number | null;
          order_index?: number | null;
          points_possible?: number | null;
          rubric?: Json | null;
          section_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_assignments_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_assignments_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['section_id'];
          },
          {
            foreignKeyName: 'course_assignments_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'course_sections';
            referencedColumns: ['id'];
          },
        ];
      };
      course_badges: {
        Row: {
          badge_type: string;
          course_id: string | null;
          created_at: string;
          criteria: Json | null;
          description: string | null;
          display_order: number | null;
          icon_url: string | null;
          id: string;
          is_visible: boolean | null;
          name: string;
          points_required: number | null;
          updated_at: string;
        };
        Insert: {
          badge_type: string;
          course_id?: string | null;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name: string;
          points_required?: number | null;
          updated_at?: string;
        };
        Update: {
          badge_type?: string;
          course_id?: string | null;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name?: string;
          points_required?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_badges_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      course_certificates: {
        Row: {
          certificate_number: string;
          certificate_pdf_url: string | null;
          certificate_url: string;
          completion_date: string;
          course_id: string;
          course_title: string;
          created_at: string;
          enrollment_id: string;
          final_score: number | null;
          id: string;
          instructor_name: string;
          is_public: boolean | null;
          is_valid: boolean | null;
          revoked: boolean | null;
          revoked_at: string | null;
          revoked_reason: string | null;
          student_name: string;
          user_id: string;
        };
        Insert: {
          certificate_number: string;
          certificate_pdf_url?: string | null;
          certificate_url: string;
          completion_date: string;
          course_id: string;
          course_title: string;
          created_at?: string;
          enrollment_id: string;
          final_score?: number | null;
          id?: string;
          instructor_name: string;
          is_public?: boolean | null;
          is_valid?: boolean | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          student_name: string;
          user_id: string;
        };
        Update: {
          certificate_number?: string;
          certificate_pdf_url?: string | null;
          certificate_url?: string;
          completion_date?: string;
          course_id?: string;
          course_title?: string;
          created_at?: string;
          enrollment_id?: string;
          final_score?: number | null;
          id?: string;
          instructor_name?: string;
          is_public?: boolean | null;
          is_valid?: boolean | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          student_name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_certificates_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_certificates_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_certificates_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
        ];
      };
      course_cohort_discussions: {
        Row: {
          cohort_id: string;
          content: string;
          course_id: string;
          created_at: string;
          discussion_type: string | null;
          id: string;
          is_locked: boolean | null;
          is_pinned: boolean | null;
          likes_count: number | null;
          replies_count: number | null;
          title: string;
          updated_at: string;
          user_id: string;
          views_count: number | null;
        };
        Insert: {
          cohort_id: string;
          content: string;
          course_id: string;
          created_at?: string;
          discussion_type?: string | null;
          id?: string;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          replies_count?: number | null;
          title: string;
          updated_at?: string;
          user_id: string;
          views_count?: number | null;
        };
        Update: {
          cohort_id?: string;
          content?: string;
          course_id?: string;
          created_at?: string;
          discussion_type?: string | null;
          id?: string;
          is_locked?: boolean | null;
          is_pinned?: boolean | null;
          likes_count?: number | null;
          replies_count?: number | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_cohort_discussions_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'course_cohorts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_cohort_discussions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      course_cohort_invitations: {
        Row: {
          accepted_at: string | null;
          cohort_id: string;
          created_at: string;
          email: string | null;
          expires_at: string | null;
          id: string;
          invitation_token: string;
          invited_by: string;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          cohort_id: string;
          created_at?: string;
          email?: string | null;
          expires_at?: string | null;
          id?: string;
          invitation_token?: string;
          invited_by: string;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          cohort_id?: string;
          created_at?: string;
          email?: string | null;
          expires_at?: string | null;
          id?: string;
          invitation_token?: string;
          invited_by?: string;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_cohort_invitations_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'course_cohorts';
            referencedColumns: ['id'];
          },
        ];
      };
      course_cohort_members: {
        Row: {
          cohort_id: string;
          created_at: string;
          enrollment_id: string;
          id: string;
          joined_at: string;
          left_at: string | null;
          metadata: Json | null;
          role: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          cohort_id: string;
          created_at?: string;
          enrollment_id: string;
          id?: string;
          joined_at?: string;
          left_at?: string | null;
          metadata?: Json | null;
          role?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          cohort_id?: string;
          created_at?: string;
          enrollment_id?: string;
          id?: string;
          joined_at?: string;
          left_at?: string | null;
          metadata?: Json | null;
          role?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_cohort_members_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'course_cohorts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_cohort_members_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_cohort_members_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
        ];
      };
      course_cohorts: {
        Row: {
          cohort_type: string;
          course_id: string;
          created_at: string;
          description: string | null;
          end_date: string | null;
          enrollment_date_range_end: string | null;
          enrollment_date_range_start: string | null;
          id: string;
          is_active: boolean | null;
          is_private: boolean | null;
          max_students: number | null;
          metadata: Json | null;
          name: string;
          start_date: string | null;
          updated_at: string;
        };
        Insert: {
          cohort_type?: string;
          course_id: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          enrollment_date_range_end?: string | null;
          enrollment_date_range_start?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_private?: boolean | null;
          max_students?: number | null;
          metadata?: Json | null;
          name: string;
          start_date?: string | null;
          updated_at?: string;
        };
        Update: {
          cohort_type?: string;
          course_id?: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          enrollment_date_range_end?: string | null;
          enrollment_date_range_start?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_private?: boolean | null;
          max_students?: number | null;
          metadata?: Json | null;
          name?: string;
          start_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_cohorts_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      course_discussion_replies: {
        Row: {
          content: string;
          created_at: string;
          discussion_id: string;
          id: string;
          is_instructor_reply: boolean | null;
          is_solution: boolean | null;
          updated_at: string;
          upvotes: number | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          discussion_id: string;
          id?: string;
          is_instructor_reply?: boolean | null;
          is_solution?: boolean | null;
          updated_at?: string;
          upvotes?: number | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          discussion_id?: string;
          id?: string;
          is_instructor_reply?: boolean | null;
          is_solution?: boolean | null;
          updated_at?: string;
          upvotes?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_discussion_replies_discussion_id_fkey';
            columns: ['discussion_id'];
            isOneToOne: false;
            referencedRelation: 'course_discussions';
            referencedColumns: ['id'];
          },
        ];
      };
      course_discussions: {
        Row: {
          answered_at: string | null;
          answered_by: string | null;
          content: string;
          course_id: string;
          created_at: string;
          discussion_type: string;
          id: string;
          is_answered: boolean | null;
          is_pinned: boolean | null;
          lesson_id: string | null;
          replies_count: number | null;
          title: string;
          updated_at: string;
          upvotes: number | null;
          user_id: string;
          video_timestamp_seconds: number | null;
        };
        Insert: {
          answered_at?: string | null;
          answered_by?: string | null;
          content: string;
          course_id: string;
          created_at?: string;
          discussion_type?: string;
          id?: string;
          is_answered?: boolean | null;
          is_pinned?: boolean | null;
          lesson_id?: string | null;
          replies_count?: number | null;
          title: string;
          updated_at?: string;
          upvotes?: number | null;
          user_id: string;
          video_timestamp_seconds?: number | null;
        };
        Update: {
          answered_at?: string | null;
          answered_by?: string | null;
          content?: string;
          course_id?: string;
          created_at?: string;
          discussion_type?: string;
          id?: string;
          is_answered?: boolean | null;
          is_pinned?: boolean | null;
          lesson_id?: string | null;
          replies_count?: number | null;
          title?: string;
          updated_at?: string;
          upvotes?: number | null;
          user_id?: string;
          video_timestamp_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_discussions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_discussions_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'course_lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      course_enrollments: {
        Row: {
          bookmarks: Json | null;
          certificate_earned: boolean | null;
          certificate_issued_at: string | null;
          certificate_url: string | null;
          completed_lessons: number | null;
          completion_date: string | null;
          course_id: string;
          created_at: string;
          enrollment_date: string;
          id: string;
          last_accessed_at: string | null;
          last_accessed_lesson_id: string | null;
          notes: Json | null;
          order_id: string | null;
          product_id: string;
          progress_percentage: number | null;
          status: string;
          total_lessons: number | null;
          total_watch_time_minutes: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bookmarks?: Json | null;
          certificate_earned?: boolean | null;
          certificate_issued_at?: string | null;
          certificate_url?: string | null;
          completed_lessons?: number | null;
          completion_date?: string | null;
          course_id: string;
          created_at?: string;
          enrollment_date?: string;
          id?: string;
          last_accessed_at?: string | null;
          last_accessed_lesson_id?: string | null;
          notes?: Json | null;
          order_id?: string | null;
          product_id: string;
          progress_percentage?: number | null;
          status?: string;
          total_lessons?: number | null;
          total_watch_time_minutes?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bookmarks?: Json | null;
          certificate_earned?: boolean | null;
          certificate_issued_at?: string | null;
          certificate_url?: string | null;
          completed_lessons?: number | null;
          completion_date?: string | null;
          course_id?: string;
          created_at?: string;
          enrollment_date?: string;
          id?: string;
          last_accessed_at?: string | null;
          last_accessed_lesson_id?: string | null;
          notes?: Json | null;
          order_id?: string | null;
          product_id?: string;
          progress_percentage?: number | null;
          status?: string;
          total_lessons?: number | null;
          total_watch_time_minutes?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_enrollments_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_enrollments_last_accessed_lesson_id_fkey';
            columns: ['last_accessed_lesson_id'];
            isOneToOne: false;
            referencedRelation: 'course_lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_enrollments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_enrollments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_enrollments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'course_enrollments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'course_enrollments_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      course_lesson_progress: {
        Row: {
          completed_at: string | null;
          created_at: string;
          enrollment_id: string;
          id: string;
          is_completed: boolean | null;
          last_position_seconds: number | null;
          lesson_id: string;
          personal_notes: string | null;
          times_watched: number | null;
          updated_at: string;
          user_id: string;
          watch_time_seconds: number | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          enrollment_id: string;
          id?: string;
          is_completed?: boolean | null;
          last_position_seconds?: number | null;
          lesson_id: string;
          personal_notes?: string | null;
          times_watched?: number | null;
          updated_at?: string;
          user_id: string;
          watch_time_seconds?: number | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          enrollment_id?: string;
          id?: string;
          is_completed?: boolean | null;
          last_position_seconds?: number | null;
          lesson_id?: string;
          personal_notes?: string | null;
          times_watched?: number | null;
          updated_at?: string;
          user_id?: string;
          watch_time_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_lesson_progress_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_lesson_progress_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
          {
            foreignKeyName: 'course_lesson_progress_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'course_lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      course_lessons: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          downloadable_resources: Json | null;
          has_quiz: boolean | null;
          id: string;
          is_preview: boolean | null;
          is_required: boolean | null;
          notes: string | null;
          order_index: number;
          section_id: string;
          title: string;
          transcript: string | null;
          updated_at: string;
          video_duration_seconds: number | null;
          video_thumbnail_url: string | null;
          video_type: string;
          video_url: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          downloadable_resources?: Json | null;
          has_quiz?: boolean | null;
          id?: string;
          is_preview?: boolean | null;
          is_required?: boolean | null;
          notes?: string | null;
          order_index: number;
          section_id: string;
          title: string;
          transcript?: string | null;
          updated_at?: string;
          video_duration_seconds?: number | null;
          video_thumbnail_url?: string | null;
          video_type?: string;
          video_url: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          downloadable_resources?: Json | null;
          has_quiz?: boolean | null;
          id?: string;
          is_preview?: boolean | null;
          is_required?: boolean | null;
          notes?: string | null;
          order_index?: number;
          section_id?: string;
          title?: string;
          transcript?: string | null;
          updated_at?: string;
          video_duration_seconds?: number | null;
          video_thumbnail_url?: string | null;
          video_type?: string;
          video_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_lessons_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_lessons_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['section_id'];
          },
          {
            foreignKeyName: 'course_lessons_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'course_sections';
            referencedColumns: ['id'];
          },
        ];
      };
      course_live_session_questions: {
        Row: {
          answer: string | null;
          answered_at: string | null;
          answered_by: string | null;
          created_at: string;
          id: string;
          is_answered: boolean | null;
          question: string;
          session_id: string;
          upvotes_count: number | null;
          user_id: string;
        };
        Insert: {
          answer?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          created_at?: string;
          id?: string;
          is_answered?: boolean | null;
          question: string;
          session_id: string;
          upvotes_count?: number | null;
          user_id: string;
        };
        Update: {
          answer?: string | null;
          answered_at?: string | null;
          answered_by?: string | null;
          created_at?: string;
          id?: string;
          is_answered?: boolean | null;
          question?: string;
          session_id?: string;
          upvotes_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_live_session_questions_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'course_live_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      course_live_session_registrations: {
        Row: {
          attendance_duration_minutes: number | null;
          created_at: string;
          enrollment_id: string;
          feedback_comment: string | null;
          feedback_rating: number | null;
          id: string;
          joined_at: string | null;
          left_at: string | null;
          reminder_sent_1h: boolean | null;
          reminder_sent_24h: boolean | null;
          session_id: string;
          status: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attendance_duration_minutes?: number | null;
          created_at?: string;
          enrollment_id: string;
          feedback_comment?: string | null;
          feedback_rating?: number | null;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          reminder_sent_1h?: boolean | null;
          reminder_sent_24h?: boolean | null;
          session_id: string;
          status?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attendance_duration_minutes?: number | null;
          created_at?: string;
          enrollment_id?: string;
          feedback_comment?: string | null;
          feedback_rating?: number | null;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          reminder_sent_1h?: boolean | null;
          reminder_sent_24h?: boolean | null;
          session_id?: string;
          status?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_live_session_registrations_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_live_session_registrations_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
          {
            foreignKeyName: 'course_live_session_registrations_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'course_live_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      course_live_sessions: {
        Row: {
          actual_end: string | null;
          actual_start: string | null;
          allow_chat: boolean | null;
          allow_questions: boolean | null;
          allow_screen_share: boolean | null;
          cohort_id: string | null;
          course_id: string;
          created_at: string;
          current_viewers: number | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_public: boolean | null;
          max_participants: number | null;
          max_viewers: number | null;
          meeting_id: string | null;
          meeting_password: string | null;
          meeting_url: string | null;
          metadata: Json | null;
          platform: string;
          recording_available_until: string | null;
          recording_enabled: boolean | null;
          recording_url: string | null;
          require_registration: boolean | null;
          scheduled_end: string;
          scheduled_start: string;
          session_type: string;
          status: string;
          streaming_hls_url: string | null;
          streaming_key: string | null;
          streaming_playback_url: string | null;
          streaming_provider: string | null;
          streaming_rtmp_url: string | null;
          streaming_url: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          actual_end?: string | null;
          actual_start?: string | null;
          allow_chat?: boolean | null;
          allow_questions?: boolean | null;
          allow_screen_share?: boolean | null;
          cohort_id?: string | null;
          course_id: string;
          created_at?: string;
          current_viewers?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_public?: boolean | null;
          max_participants?: number | null;
          max_viewers?: number | null;
          meeting_id?: string | null;
          meeting_password?: string | null;
          meeting_url?: string | null;
          metadata?: Json | null;
          platform?: string;
          recording_available_until?: string | null;
          recording_enabled?: boolean | null;
          recording_url?: string | null;
          require_registration?: boolean | null;
          scheduled_end: string;
          scheduled_start: string;
          session_type?: string;
          status?: string;
          streaming_hls_url?: string | null;
          streaming_key?: string | null;
          streaming_playback_url?: string | null;
          streaming_provider?: string | null;
          streaming_rtmp_url?: string | null;
          streaming_url?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          actual_end?: string | null;
          actual_start?: string | null;
          allow_chat?: boolean | null;
          allow_questions?: boolean | null;
          allow_screen_share?: boolean | null;
          cohort_id?: string | null;
          course_id?: string;
          created_at?: string;
          current_viewers?: number | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_public?: boolean | null;
          max_participants?: number | null;
          max_viewers?: number | null;
          meeting_id?: string | null;
          meeting_password?: string | null;
          meeting_url?: string | null;
          metadata?: Json | null;
          platform?: string;
          recording_available_until?: string | null;
          recording_enabled?: boolean | null;
          recording_url?: string | null;
          require_registration?: boolean | null;
          scheduled_end?: string;
          scheduled_start?: string;
          session_type?: string;
          status?: string;
          streaming_hls_url?: string | null;
          streaming_key?: string | null;
          streaming_playback_url?: string | null;
          streaming_provider?: string | null;
          streaming_rtmp_url?: string | null;
          streaming_url?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_live_sessions_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'course_cohorts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_live_sessions_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      course_note_bookmarks: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          enrollment_id: string;
          id: string;
          lesson_id: string;
          timestamp_seconds: number;
          title: string | null;
          user_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          enrollment_id: string;
          id?: string;
          lesson_id: string;
          timestamp_seconds: number;
          title?: string | null;
          user_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          enrollment_id?: string;
          id?: string;
          lesson_id?: string;
          timestamp_seconds?: number;
          title?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_note_bookmarks_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_note_bookmarks_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_note_bookmarks_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
          {
            foreignKeyName: 'course_note_bookmarks_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'course_lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      course_notes: {
        Row: {
          content: string;
          course_id: string;
          created_at: string;
          enrollment_id: string;
          id: string;
          is_private: boolean | null;
          lesson_id: string;
          note_type: string | null;
          order_index: number | null;
          tags: string[] | null;
          timestamp_seconds: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          course_id: string;
          created_at?: string;
          enrollment_id: string;
          id?: string;
          is_private?: boolean | null;
          lesson_id: string;
          note_type?: string | null;
          order_index?: number | null;
          tags?: string[] | null;
          timestamp_seconds?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          course_id?: string;
          created_at?: string;
          enrollment_id?: string;
          id?: string;
          is_private?: boolean | null;
          lesson_id?: string;
          note_type?: string | null;
          order_index?: number | null;
          tags?: string[] | null;
          timestamp_seconds?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_notes_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_notes_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_notes_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
          {
            foreignKeyName: 'course_notes_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'course_lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      course_points_history: {
        Row: {
          created_at: string;
          enrollment_id: string;
          id: string;
          points_after: number | null;
          points_before: number | null;
          points_earned: number;
          source_description: string | null;
          source_id: string | null;
          source_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          enrollment_id: string;
          id?: string;
          points_after?: number | null;
          points_before?: number | null;
          points_earned: number;
          source_description?: string | null;
          source_id?: string | null;
          source_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          enrollment_id?: string;
          id?: string;
          points_after?: number | null;
          points_before?: number | null;
          points_earned?: number;
          source_description?: string | null;
          source_id?: string | null;
          source_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_points_history_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_points_history_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
        ];
      };
      course_prerequisite_validations: {
        Row: {
          created_at: string;
          enrollment_id: string;
          id: string;
          is_validated: boolean | null;
          notes: string | null;
          prerequisite_id: string;
          updated_at: string;
          user_id: string;
          validated_at: string | null;
          validated_by: string | null;
          validation_details: Json | null;
          validation_type: string | null;
        };
        Insert: {
          created_at?: string;
          enrollment_id: string;
          id?: string;
          is_validated?: boolean | null;
          notes?: string | null;
          prerequisite_id: string;
          updated_at?: string;
          user_id: string;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_details?: Json | null;
          validation_type?: string | null;
        };
        Update: {
          created_at?: string;
          enrollment_id?: string;
          id?: string;
          is_validated?: boolean | null;
          notes?: string | null;
          prerequisite_id?: string;
          updated_at?: string;
          user_id?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_details?: Json | null;
          validation_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_prerequisite_validations_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_prerequisite_validations_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
          {
            foreignKeyName: 'course_prerequisite_validations_prerequisite_id_fkey';
            columns: ['prerequisite_id'];
            isOneToOne: false;
            referencedRelation: 'course_prerequisites';
            referencedColumns: ['id'];
          },
        ];
      };
      course_prerequisites: {
        Row: {
          course_id: string;
          created_at: string;
          custom_requirement: string | null;
          id: string;
          is_required: boolean | null;
          minimum_progress_percentage: number | null;
          minimum_score: number | null;
          order_index: number | null;
          prerequisite_type: string;
          require_completion: boolean | null;
          require_passing_score: boolean | null;
          required_assignment_id: string | null;
          required_course_id: string | null;
          required_quiz_id: string | null;
          required_skill_level: string | null;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          custom_requirement?: string | null;
          id?: string;
          is_required?: boolean | null;
          minimum_progress_percentage?: number | null;
          minimum_score?: number | null;
          order_index?: number | null;
          prerequisite_type?: string;
          require_completion?: boolean | null;
          require_passing_score?: boolean | null;
          required_assignment_id?: string | null;
          required_course_id?: string | null;
          required_quiz_id?: string | null;
          required_skill_level?: string | null;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          custom_requirement?: string | null;
          id?: string;
          is_required?: boolean | null;
          minimum_progress_percentage?: number | null;
          minimum_score?: number | null;
          order_index?: number | null;
          prerequisite_type?: string;
          require_completion?: boolean | null;
          require_passing_score?: boolean | null;
          required_assignment_id?: string | null;
          required_course_id?: string | null;
          required_quiz_id?: string | null;
          required_skill_level?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_prerequisites_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_prerequisites_required_assignment_id_fkey';
            columns: ['required_assignment_id'];
            isOneToOne: false;
            referencedRelation: 'course_assignments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_prerequisites_required_course_id_fkey';
            columns: ['required_course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_prerequisites_required_quiz_id_fkey';
            columns: ['required_quiz_id'];
            isOneToOne: false;
            referencedRelation: 'course_quizzes';
            referencedColumns: ['id'];
          },
        ];
      };
      course_quizzes: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          id: string;
          lesson_id: string | null;
          max_attempts: number | null;
          passing_score: number | null;
          questions: Json;
          show_correct_answers: boolean | null;
          shuffle_questions: boolean | null;
          time_limit_minutes: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          lesson_id?: string | null;
          max_attempts?: number | null;
          passing_score?: number | null;
          questions?: Json;
          show_correct_answers?: boolean | null;
          shuffle_questions?: boolean | null;
          time_limit_minutes?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          lesson_id?: string | null;
          max_attempts?: number | null;
          passing_score?: number | null;
          questions?: Json;
          show_correct_answers?: boolean | null;
          shuffle_questions?: boolean | null;
          time_limit_minutes?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_quizzes_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_quizzes_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'course_lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      course_sections: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          id: string;
          is_locked: boolean | null;
          order_index: number;
          title: string;
          unlock_after_days: number | null;
          updated_at: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_locked?: boolean | null;
          order_index: number;
          title: string;
          unlock_after_days?: number | null;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_locked?: boolean | null;
          order_index?: number;
          title?: string;
          unlock_after_days?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_sections_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      course_student_achievements: {
        Row: {
          achievement_id: string;
          course_id: string;
          earned_at: string;
          enrollment_id: string;
          id: string;
          notification_sent: boolean | null;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          course_id: string;
          earned_at?: string;
          enrollment_id: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          course_id?: string;
          earned_at?: string;
          enrollment_id?: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_student_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'course_achievements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_achievements_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_achievements_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_achievements_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
        ];
      };
      course_student_badges: {
        Row: {
          badge_id: string;
          course_id: string;
          earned_at: string;
          enrollment_id: string;
          id: string;
          notification_sent: boolean | null;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          course_id: string;
          earned_at?: string;
          enrollment_id: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          course_id?: string;
          earned_at?: string;
          enrollment_id?: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_student_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'course_badges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_badges_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_badges_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_badges_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
        ];
      };
      course_student_points: {
        Row: {
          course_id: string;
          created_at: string;
          current_level: number | null;
          current_streak_days: number | null;
          enrollment_id: string;
          experience_points: number | null;
          id: string;
          last_activity_date: string | null;
          longest_streak_days: number | null;
          points_earned_today: number | null;
          total_assignments_submitted: number | null;
          total_discussions_participated: number | null;
          total_lessons_completed: number | null;
          total_points: number | null;
          total_quizzes_passed: number | null;
          total_quizzes_perfect_score: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          current_level?: number | null;
          current_streak_days?: number | null;
          enrollment_id: string;
          experience_points?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak_days?: number | null;
          points_earned_today?: number | null;
          total_assignments_submitted?: number | null;
          total_discussions_participated?: number | null;
          total_lessons_completed?: number | null;
          total_points?: number | null;
          total_quizzes_passed?: number | null;
          total_quizzes_perfect_score?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          current_level?: number | null;
          current_streak_days?: number | null;
          enrollment_id?: string;
          experience_points?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak_days?: number | null;
          points_earned_today?: number | null;
          total_assignments_submitted?: number | null;
          total_discussions_participated?: number | null;
          total_lessons_completed?: number | null;
          total_points?: number | null;
          total_quizzes_passed?: number | null;
          total_quizzes_perfect_score?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_student_points_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_points_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: true;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_student_points_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: true;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
        ];
      };
      courses: {
        Row: {
          auto_play_next: boolean | null;
          average_completion_rate: number | null;
          average_rating: number | null;
          certificate_enabled: boolean | null;
          certificate_passing_score: number | null;
          certificate_template_url: string | null;
          created_at: string;
          drip_enabled: boolean | null;
          drip_interval: number | null;
          drip_type: string | null;
          enable_discussions: boolean | null;
          enable_downloads: boolean | null;
          enable_notes: boolean | null;
          enable_qa: boolean | null;
          id: string;
          language: string;
          learning_objectives: string[] | null;
          level: string;
          prerequisites: string[] | null;
          product_id: string;
          subtitles: string[] | null;
          target_audience: string[] | null;
          total_duration_minutes: number | null;
          total_enrollments: number | null;
          total_lessons: number | null;
          total_quizzes: number | null;
          total_resources: number | null;
          updated_at: string;
        };
        Insert: {
          auto_play_next?: boolean | null;
          average_completion_rate?: number | null;
          average_rating?: number | null;
          certificate_enabled?: boolean | null;
          certificate_passing_score?: number | null;
          certificate_template_url?: string | null;
          created_at?: string;
          drip_enabled?: boolean | null;
          drip_interval?: number | null;
          drip_type?: string | null;
          enable_discussions?: boolean | null;
          enable_downloads?: boolean | null;
          enable_notes?: boolean | null;
          enable_qa?: boolean | null;
          id?: string;
          language?: string;
          learning_objectives?: string[] | null;
          level?: string;
          prerequisites?: string[] | null;
          product_id: string;
          subtitles?: string[] | null;
          target_audience?: string[] | null;
          total_duration_minutes?: number | null;
          total_enrollments?: number | null;
          total_lessons?: number | null;
          total_quizzes?: number | null;
          total_resources?: number | null;
          updated_at?: string;
        };
        Update: {
          auto_play_next?: boolean | null;
          average_completion_rate?: number | null;
          average_rating?: number | null;
          certificate_enabled?: boolean | null;
          certificate_passing_score?: number | null;
          certificate_template_url?: string | null;
          created_at?: string;
          drip_enabled?: boolean | null;
          drip_interval?: number | null;
          drip_type?: string | null;
          enable_discussions?: boolean | null;
          enable_downloads?: boolean | null;
          enable_notes?: boolean | null;
          enable_qa?: boolean | null;
          id?: string;
          language?: string;
          learning_objectives?: string[] | null;
          level?: string;
          prerequisites?: string[] | null;
          product_id?: string;
          subtitles?: string[] | null;
          target_audience?: string[] | null;
          total_duration_minutes?: number | null;
          total_enrollments?: number | null;
          total_lessons?: number | null;
          total_quizzes?: number | null;
          total_resources?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'courses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'courses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'courses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      currencies: {
        Row: {
          code: string;
          country_code: string | null;
          created_at: string | null;
          decimal_places: number | null;
          decimal_separator: string | null;
          id: string;
          is_active: boolean | null;
          is_base_currency: boolean | null;
          name: string;
          region: string | null;
          symbol: string;
          symbol_position: string | null;
          thousands_separator: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          country_code?: string | null;
          created_at?: string | null;
          decimal_places?: number | null;
          decimal_separator?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_base_currency?: boolean | null;
          name: string;
          region?: string | null;
          symbol: string;
          symbol_position?: string | null;
          thousands_separator?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          country_code?: string | null;
          created_at?: string | null;
          decimal_places?: number | null;
          decimal_separator?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_base_currency?: boolean | null;
          name?: string;
          region?: string | null;
          symbol?: string;
          symbol_position?: string | null;
          thousands_separator?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      currency_conversion_logs: {
        Row: {
          context: string | null;
          created_at: string | null;
          from_amount: number;
          from_currency: string;
          id: string;
          order_id: string | null;
          product_id: string | null;
          rate_used: number;
          to_amount: number;
          to_currency: string;
        };
        Insert: {
          context?: string | null;
          created_at?: string | null;
          from_amount: number;
          from_currency: string;
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          rate_used: number;
          to_amount: number;
          to_currency: string;
        };
        Update: {
          context?: string | null;
          created_at?: string | null;
          from_amount?: number;
          from_currency?: string;
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          rate_used?: number;
          to_amount?: number;
          to_currency?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'currency_conversion_logs_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'currency_conversion_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'currency_conversion_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'currency_conversion_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'currency_conversion_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_addresses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          address_type: string | null;
          city: string;
          country: string;
          created_at: string;
          full_name: string;
          id: string;
          is_default: boolean | null;
          notes: string | null;
          phone: string | null;
          postal_code: string | null;
          state: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          address_type?: string | null;
          city: string;
          country?: string;
          created_at?: string;
          full_name: string;
          id?: string;
          is_default?: boolean | null;
          notes?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          state?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          address_type?: string | null;
          city?: string;
          country?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          is_default?: boolean | null;
          notes?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          state?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          metadata: Json | null;
          name: string | null;
          notes: string | null;
          phone: string | null;
          store_id: string | null;
          total_orders: number | null;
          total_spent: number | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          metadata?: Json | null;
          name?: string | null;
          notes?: string | null;
          phone?: string | null;
          store_id?: string | null;
          total_orders?: number | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          metadata?: Json | null;
          name?: string | null;
          notes?: string | null;
          phone?: string | null;
          store_id?: string | null;
          total_orders?: number | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      daily_stats: {
        Row: {
          created_at: string | null;
          date: string;
          id: string;
          store_id: string | null;
          total_customers: number | null;
          total_orders: number | null;
          total_sales: number | null;
        };
        Insert: {
          created_at?: string | null;
          date?: string;
          id?: string;
          store_id?: string | null;
          total_customers?: number | null;
          total_orders?: number | null;
          total_sales?: number | null;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          id?: string;
          store_id?: string | null;
          total_customers?: number | null;
          total_orders?: number | null;
          total_sales?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'daily_stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'daily_stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      demand_forecasts: {
        Row: {
          calculated_at: string;
          calculated_by: string | null;
          calculation_params: Json | null;
          confidence_level: number | null;
          created_at: string;
          forecast_date: string;
          forecast_method: string;
          forecast_period_end: string;
          forecast_period_start: string;
          forecast_type: string;
          forecasted_quantity: number;
          forecasted_revenue: number;
          historical_data_points: number | null;
          id: string;
          max_quantity: number | null;
          min_quantity: number | null;
          notes: string | null;
          product_id: string;
          store_id: string;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          calculated_at?: string;
          calculated_by?: string | null;
          calculation_params?: Json | null;
          confidence_level?: number | null;
          created_at?: string;
          forecast_date: string;
          forecast_method: string;
          forecast_period_end: string;
          forecast_period_start: string;
          forecast_type: string;
          forecasted_quantity: number;
          forecasted_revenue: number;
          historical_data_points?: number | null;
          id?: string;
          max_quantity?: number | null;
          min_quantity?: number | null;
          notes?: string | null;
          product_id: string;
          store_id: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          calculated_at?: string;
          calculated_by?: string | null;
          calculation_params?: Json | null;
          confidence_level?: number | null;
          created_at?: string;
          forecast_date?: string;
          forecast_method?: string;
          forecast_period_end?: string;
          forecast_period_start?: string;
          forecast_type?: string;
          forecasted_quantity?: number;
          forecasted_revenue?: number;
          historical_data_points?: number | null;
          id?: string;
          max_quantity?: number | null;
          min_quantity?: number | null;
          notes?: string | null;
          product_id?: string;
          store_id?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'demand_forecasts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demand_forecasts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'demand_forecasts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'demand_forecasts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demand_forecasts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'demand_forecasts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'demand_forecasts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demand_forecasts_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_bundle_items: {
        Row: {
          bundle_id: string;
          created_at: string;
          highlight_text: string | null;
          id: string;
          is_highlighted: boolean | null;
          is_visible: boolean | null;
          order_index: number;
          product_id: string;
          product_price: number;
        };
        Insert: {
          bundle_id: string;
          created_at?: string;
          highlight_text?: string | null;
          id?: string;
          is_highlighted?: boolean | null;
          is_visible?: boolean | null;
          order_index?: number;
          product_id: string;
          product_price: number;
        };
        Update: {
          bundle_id?: string;
          created_at?: string;
          highlight_text?: string | null;
          id?: string;
          is_highlighted?: boolean | null;
          is_visible?: boolean | null;
          order_index?: number;
          product_id?: string;
          product_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_bundle_items_bundle_id_fkey';
            columns: ['bundle_id'];
            isOneToOne: false;
            referencedRelation: 'digital_bundles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_bundle_items_bundle_id_fkey';
            columns: ['bundle_id'];
            isOneToOne: false;
            referencedRelation: 'digital_bundles_with_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_bundle_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_bundles: {
        Row: {
          auto_generate_licenses: boolean | null;
          average_rating: number | null;
          badge: string | null;
          banner_url: string | null;
          bundle_price: number;
          conversion_rate: number | null;
          created_at: string;
          current_purchases: number | null;
          description: string | null;
          discount_type: Database['public']['Enums']['bundle_discount_type'];
          discount_value: number;
          download_expiry_days: number | null;
          download_limit: number | null;
          end_date: string | null;
          features: Json | null;
          highlight_text: string | null;
          id: string;
          image_url: string | null;
          includes: Json | null;
          is_available: boolean | null;
          is_featured: boolean | null;
          keywords: string[] | null;
          license_duration_days: number | null;
          max_purchases: number | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          original_price: number;
          published_at: string | null;
          reviews_count: number | null;
          savings: number | null;
          savings_percentage: number | null;
          short_description: string | null;
          slug: string;
          start_date: string | null;
          status: Database['public']['Enums']['bundle_status'];
          store_id: string;
          total_revenue: number | null;
          total_sales: number | null;
          updated_at: string;
          views_count: number | null;
        };
        Insert: {
          auto_generate_licenses?: boolean | null;
          average_rating?: number | null;
          badge?: string | null;
          banner_url?: string | null;
          bundle_price?: number;
          conversion_rate?: number | null;
          created_at?: string;
          current_purchases?: number | null;
          description?: string | null;
          discount_type?: Database['public']['Enums']['bundle_discount_type'];
          discount_value?: number;
          download_expiry_days?: number | null;
          download_limit?: number | null;
          end_date?: string | null;
          features?: Json | null;
          highlight_text?: string | null;
          id?: string;
          image_url?: string | null;
          includes?: Json | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          keywords?: string[] | null;
          license_duration_days?: number | null;
          max_purchases?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          original_price?: number;
          published_at?: string | null;
          reviews_count?: number | null;
          savings?: number | null;
          savings_percentage?: number | null;
          short_description?: string | null;
          slug: string;
          start_date?: string | null;
          status?: Database['public']['Enums']['bundle_status'];
          store_id: string;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
          views_count?: number | null;
        };
        Update: {
          auto_generate_licenses?: boolean | null;
          average_rating?: number | null;
          badge?: string | null;
          banner_url?: string | null;
          bundle_price?: number;
          conversion_rate?: number | null;
          created_at?: string;
          current_purchases?: number | null;
          description?: string | null;
          discount_type?: Database['public']['Enums']['bundle_discount_type'];
          discount_value?: number;
          download_expiry_days?: number | null;
          download_limit?: number | null;
          end_date?: string | null;
          features?: Json | null;
          highlight_text?: string | null;
          id?: string;
          image_url?: string | null;
          includes?: Json | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          keywords?: string[] | null;
          license_duration_days?: number | null;
          max_purchases?: number | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          original_price?: number;
          published_at?: string | null;
          reviews_count?: number | null;
          savings?: number | null;
          savings_percentage?: number | null;
          short_description?: string | null;
          slug?: string;
          start_date?: string | null;
          status?: Database['public']['Enums']['bundle_status'];
          store_id?: string;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
          views_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_downloads_2024_12: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_01: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_02: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_03: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_04: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_05: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_06: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_07: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_08: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_09: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_10: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_2025_11: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_downloads_default: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      digital_license_activations: {
        Row: {
          activated_at: string;
          city: string | null;
          country: string | null;
          created_at: string;
          deactivated_at: string | null;
          deactivation_reason: string | null;
          device_id: string;
          device_name: string | null;
          device_type: string | null;
          id: string;
          ip_address: string;
          is_active: boolean | null;
          last_app_version: string | null;
          last_validated_at: string;
          license_id: string;
          os_name: string | null;
          os_version: string | null;
          validation_count: number | null;
        };
        Insert: {
          activated_at?: string;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          deactivation_reason?: string | null;
          device_id: string;
          device_name?: string | null;
          device_type?: string | null;
          id?: string;
          ip_address: string;
          is_active?: boolean | null;
          last_app_version?: string | null;
          last_validated_at?: string;
          license_id: string;
          os_name?: string | null;
          os_version?: string | null;
          validation_count?: number | null;
        };
        Update: {
          activated_at?: string;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          deactivation_reason?: string | null;
          device_id?: string;
          device_name?: string | null;
          device_type?: string | null;
          id?: string;
          ip_address?: string;
          is_active?: boolean | null;
          last_app_version?: string | null;
          last_validated_at?: string;
          license_id?: string;
          os_name?: string | null;
          os_version?: string | null;
          validation_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_license_activations_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_license_activations_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'digital_licenses';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_licenses: {
        Row: {
          activated_at: string | null;
          activation_history: Json | null;
          allowed_features: Json | null;
          created_at: string;
          current_activations: number | null;
          customer_email: string | null;
          customer_name: string | null;
          device_restrictions: string[] | null;
          digital_product_id: string;
          expires_at: string | null;
          id: string;
          internal_notes: string | null;
          ip_restrictions: string[] | null;
          issued_at: string;
          last_validated_at: string | null;
          license_key: string;
          license_type: string;
          max_activations: number | null;
          order_id: string | null;
          payment_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activated_at?: string | null;
          activation_history?: Json | null;
          allowed_features?: Json | null;
          created_at?: string;
          current_activations?: number | null;
          customer_email?: string | null;
          customer_name?: string | null;
          device_restrictions?: string[] | null;
          digital_product_id: string;
          expires_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          ip_restrictions?: string[] | null;
          issued_at?: string;
          last_validated_at?: string | null;
          license_key: string;
          license_type: string;
          max_activations?: number | null;
          order_id?: string | null;
          payment_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activated_at?: string | null;
          activation_history?: Json | null;
          allowed_features?: Json | null;
          created_at?: string;
          current_activations?: number | null;
          customer_email?: string | null;
          customer_name?: string | null;
          device_restrictions?: string[] | null;
          digital_product_id?: string;
          expires_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          ip_restrictions?: string[] | null;
          issued_at?: string;
          last_validated_at?: string | null;
          license_key?: string;
          license_type?: string;
          max_activations?: number | null;
          order_id?: string | null;
          payment_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_licenses_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_licenses_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_licenses_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_licenses_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
        ];
      };
      digital_product_bundles: {
        Row: {
          allow_customization: boolean | null;
          bundle_discount_type: string | null;
          bundle_price: number;
          created_at: string;
          currency: string;
          description: string | null;
          digital_product_ids: string[];
          discount_percentage: number | null;
          display_order: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_draft: boolean | null;
          is_featured: boolean | null;
          metadata: Json | null;
          name: string;
          product_id: string;
          promotional_price: number | null;
          short_description: string | null;
          slug: string;
          store_id: string;
          total_downloads: number | null;
          total_revenue: number | null;
          total_sales: number | null;
          updated_at: string;
        };
        Insert: {
          allow_customization?: boolean | null;
          bundle_discount_type?: string | null;
          bundle_price: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          digital_product_ids: string[];
          discount_percentage?: number | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_draft?: boolean | null;
          is_featured?: boolean | null;
          metadata?: Json | null;
          name: string;
          product_id: string;
          promotional_price?: number | null;
          short_description?: string | null;
          slug: string;
          store_id: string;
          total_downloads?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
        };
        Update: {
          allow_customization?: boolean | null;
          bundle_discount_type?: string | null;
          bundle_price?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          digital_product_ids?: string[];
          discount_percentage?: number | null;
          display_order?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_draft?: boolean | null;
          is_featured?: boolean | null;
          metadata?: Json | null;
          name?: string;
          product_id?: string;
          promotional_price?: number | null;
          short_description?: string | null;
          slug?: string;
          store_id?: string;
          total_downloads?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_bundles_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_bundles_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_product_bundles_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_product_bundles_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_coupons: {
        Row: {
          applicable_product_ids: string[] | null;
          applicable_product_types: string[] | null;
          applicable_store_ids: string[] | null;
          can_combine: boolean | null;
          code: string;
          combine_with_coupon_ids: string[] | null;
          created_at: string;
          created_by: string | null;
          customer_usage_tracking: Json | null;
          description: string | null;
          discount_type: string;
          discount_value: number;
          exclude_bundles: boolean | null;
          exclude_sale_items: boolean | null;
          first_time_buyers_only: boolean | null;
          id: string;
          is_active: boolean | null;
          is_archived: boolean | null;
          max_combined_discount_percentage: number | null;
          max_discount_amount: number | null;
          metadata: Json | null;
          min_purchase_amount: number | null;
          name: string;
          one_time_use_per_customer: boolean | null;
          stack_with_other_discounts: boolean | null;
          store_id: string;
          total_discount_given: number | null;
          total_orders: number | null;
          updated_at: string;
          usage_count: number | null;
          usage_limit: number | null;
          usage_limit_per_customer: number | null;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          applicable_product_ids?: string[] | null;
          applicable_product_types?: string[] | null;
          applicable_store_ids?: string[] | null;
          can_combine?: boolean | null;
          code: string;
          combine_with_coupon_ids?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          customer_usage_tracking?: Json | null;
          description?: string | null;
          discount_type?: string;
          discount_value: number;
          exclude_bundles?: boolean | null;
          exclude_sale_items?: boolean | null;
          first_time_buyers_only?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_archived?: boolean | null;
          max_combined_discount_percentage?: number | null;
          max_discount_amount?: number | null;
          metadata?: Json | null;
          min_purchase_amount?: number | null;
          name: string;
          one_time_use_per_customer?: boolean | null;
          stack_with_other_discounts?: boolean | null;
          store_id: string;
          total_discount_given?: number | null;
          total_orders?: number | null;
          updated_at?: string;
          usage_count?: number | null;
          usage_limit?: number | null;
          usage_limit_per_customer?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          applicable_product_ids?: string[] | null;
          applicable_product_types?: string[] | null;
          applicable_store_ids?: string[] | null;
          can_combine?: boolean | null;
          code?: string;
          combine_with_coupon_ids?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          customer_usage_tracking?: Json | null;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          exclude_bundles?: boolean | null;
          exclude_sale_items?: boolean | null;
          first_time_buyers_only?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_archived?: boolean | null;
          max_combined_discount_percentage?: number | null;
          max_discount_amount?: number | null;
          metadata?: Json | null;
          min_purchase_amount?: number | null;
          name?: string;
          one_time_use_per_customer?: boolean | null;
          stack_with_other_discounts?: boolean | null;
          store_id?: string;
          total_discount_given?: number | null;
          total_orders?: number | null;
          updated_at?: string;
          usage_count?: number | null;
          usage_limit?: number | null;
          usage_limit_per_customer?: number | null;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_coupons_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_coupons_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_coupons_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_downloads: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_downloads_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_downloads_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_downloads_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_downloads_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_downloads_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_files';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_downloads_partitioned: {
        Row: {
          created_at: string;
          digital_product_id: string;
          download_country: string | null;
          download_date: string;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_method: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          error_message: string | null;
          file_id: string | null;
          file_version: string | null;
          id: string;
          license_id: string | null;
          license_key: string | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          download_country?: string | null;
          download_date?: string;
          download_duration_seconds?: number | null;
          download_ip?: string | null;
          download_method?: string | null;
          download_speed_mbps?: number | null;
          download_success?: boolean | null;
          error_message?: string | null;
          file_id?: string | null;
          file_version?: string | null;
          id?: string;
          license_id?: string | null;
          license_key?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_downloads_partitioned_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_files';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_downloads_partitioned_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_downloads_partitioned_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_downloads_partitioned_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_downloads_partitioned_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
        ];
      };
      digital_product_drip_schedule: {
        Row: {
          created_at: string;
          digital_product_id: string;
          display_order: number | null;
          email_notification: boolean | null;
          file_id: string | null;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          notification_body: string | null;
          notification_subject: string | null;
          release_condition: Json | null;
          release_date: string | null;
          release_delay_days: number;
          release_delay_hours: number | null;
          release_delay_minutes: number | null;
          release_message: string | null;
          release_title: string | null;
          release_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          digital_product_id: string;
          display_order?: number | null;
          email_notification?: boolean | null;
          file_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          notification_body?: string | null;
          notification_subject?: string | null;
          release_condition?: Json | null;
          release_date?: string | null;
          release_delay_days?: number;
          release_delay_hours?: number | null;
          release_delay_minutes?: number | null;
          release_message?: string | null;
          release_title?: string | null;
          release_type?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          digital_product_id?: string;
          display_order?: number | null;
          email_notification?: boolean | null;
          file_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          notification_body?: string | null;
          notification_subject?: string | null;
          release_condition?: Json | null;
          release_date?: string | null;
          release_delay_days?: number;
          release_delay_hours?: number | null;
          release_delay_minutes?: number | null;
          release_message?: string | null;
          release_title?: string | null;
          release_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_drip_schedule_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_drip_schedule_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_drip_schedule_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_drip_schedule_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_drip_schedule_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_files';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_file_categories: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          metadata: Json | null;
          name: string;
          order_index: number | null;
          parent_category_id: string | null;
          slug: string;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          order_index?: number | null;
          parent_category_id?: string | null;
          slug: string;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          order_index?: number | null;
          parent_category_id?: string | null;
          slug?: string;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_file_categories_parent_category_id_fkey';
            columns: ['parent_category_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_file_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_file_categories_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_file_categories_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_file_categories_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_file_metadata: {
        Row: {
          architecture: string[] | null;
          author: string | null;
          bitrate: number | null;
          channels: number | null;
          codec: string | null;
          copyright: string | null;
          created_at: string;
          custom_fields: Json | null;
          duration_seconds: number | null;
          file_id: string;
          format_version: string | null;
          height: number | null;
          id: string;
          isbn: string | null;
          language: string | null;
          minimum_requirements: Json | null;
          page_count: number | null;
          platform: string[] | null;
          publisher: string | null;
          recommended_requirements: Json | null;
          sample_rate: number | null;
          updated_at: string;
          width: number | null;
          word_count: number | null;
        };
        Insert: {
          architecture?: string[] | null;
          author?: string | null;
          bitrate?: number | null;
          channels?: number | null;
          codec?: string | null;
          copyright?: string | null;
          created_at?: string;
          custom_fields?: Json | null;
          duration_seconds?: number | null;
          file_id: string;
          format_version?: string | null;
          height?: number | null;
          id?: string;
          isbn?: string | null;
          language?: string | null;
          minimum_requirements?: Json | null;
          page_count?: number | null;
          platform?: string[] | null;
          publisher?: string | null;
          recommended_requirements?: Json | null;
          sample_rate?: number | null;
          updated_at?: string;
          width?: number | null;
          word_count?: number | null;
        };
        Update: {
          architecture?: string[] | null;
          author?: string | null;
          bitrate?: number | null;
          channels?: number | null;
          codec?: string | null;
          copyright?: string | null;
          created_at?: string;
          custom_fields?: Json | null;
          duration_seconds?: number | null;
          file_id?: string;
          format_version?: string | null;
          height?: number | null;
          id?: string;
          isbn?: string | null;
          language?: string | null;
          minimum_requirements?: Json | null;
          page_count?: number | null;
          platform?: string[] | null;
          publisher?: string | null;
          recommended_requirements?: Json | null;
          sample_rate?: number | null;
          updated_at?: string;
          width?: number | null;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_file_metadata_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: true;
            referencedRelation: 'digital_product_files';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_file_versions: {
        Row: {
          changelog: string | null;
          checksum_sha256: string | null;
          created_at: string;
          created_by: string | null;
          deprecated_at: string | null;
          download_count: number | null;
          file_hash: string | null;
          file_id: string;
          file_size_mb: number;
          file_url: string;
          id: string;
          is_alpha: boolean | null;
          is_beta: boolean | null;
          is_stable: boolean | null;
          metadata: Json | null;
          release_notes: string | null;
          released_at: string;
          version_label: string | null;
          version_number: number;
        };
        Insert: {
          changelog?: string | null;
          checksum_sha256?: string | null;
          created_at?: string;
          created_by?: string | null;
          deprecated_at?: string | null;
          download_count?: number | null;
          file_hash?: string | null;
          file_id: string;
          file_size_mb: number;
          file_url: string;
          id?: string;
          is_alpha?: boolean | null;
          is_beta?: boolean | null;
          is_stable?: boolean | null;
          metadata?: Json | null;
          release_notes?: string | null;
          released_at?: string;
          version_label?: string | null;
          version_number: number;
        };
        Update: {
          changelog?: string | null;
          checksum_sha256?: string | null;
          created_at?: string;
          created_by?: string | null;
          deprecated_at?: string | null;
          download_count?: number | null;
          file_hash?: string | null;
          file_id?: string;
          file_size_mb?: number;
          file_url?: string;
          id?: string;
          is_alpha?: boolean | null;
          is_beta?: boolean | null;
          is_stable?: boolean | null;
          metadata?: Json | null;
          release_notes?: string | null;
          released_at?: string;
          version_label?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_file_versions_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_files';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_files: {
        Row: {
          archived_at: string | null;
          category: string | null;
          changelog: string | null;
          checksum_sha256: string | null;
          compression_enabled: boolean | null;
          compression_ratio: number | null;
          created_at: string;
          description: string | null;
          digital_product_id: string;
          download_count: number | null;
          encoding: string | null;
          file_hash: string | null;
          file_size_mb: number;
          file_type: string;
          file_url: string;
          file_version: string | null;
          id: string;
          is_archived: boolean | null;
          is_main: boolean | null;
          is_preview: boolean | null;
          language: string | null;
          last_downloaded_at: string | null;
          metadata: Json | null;
          mime_type: string | null;
          name: string;
          order_index: number;
          original_size_mb: number | null;
          parent_file_id: string | null;
          requires_license: boolean | null;
          requires_purchase: boolean | null;
          tags: string[] | null;
          updated_at: string;
          version: string | null;
          version_number: number | null;
        };
        Insert: {
          archived_at?: string | null;
          category?: string | null;
          changelog?: string | null;
          checksum_sha256?: string | null;
          compression_enabled?: boolean | null;
          compression_ratio?: number | null;
          created_at?: string;
          description?: string | null;
          digital_product_id: string;
          download_count?: number | null;
          encoding?: string | null;
          file_hash?: string | null;
          file_size_mb: number;
          file_type: string;
          file_url: string;
          file_version?: string | null;
          id?: string;
          is_archived?: boolean | null;
          is_main?: boolean | null;
          is_preview?: boolean | null;
          language?: string | null;
          last_downloaded_at?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          name: string;
          order_index?: number;
          original_size_mb?: number | null;
          parent_file_id?: string | null;
          requires_license?: boolean | null;
          requires_purchase?: boolean | null;
          tags?: string[] | null;
          updated_at?: string;
          version?: string | null;
          version_number?: number | null;
        };
        Update: {
          archived_at?: string | null;
          category?: string | null;
          changelog?: string | null;
          checksum_sha256?: string | null;
          compression_enabled?: boolean | null;
          compression_ratio?: number | null;
          created_at?: string;
          description?: string | null;
          digital_product_id?: string;
          download_count?: number | null;
          encoding?: string | null;
          file_hash?: string | null;
          file_size_mb?: number;
          file_type?: string;
          file_url?: string;
          file_version?: string | null;
          id?: string;
          is_archived?: boolean | null;
          is_main?: boolean | null;
          is_preview?: boolean | null;
          language?: string | null;
          last_downloaded_at?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          name?: string;
          order_index?: number;
          original_size_mb?: number | null;
          parent_file_id?: string | null;
          requires_license?: boolean | null;
          requires_purchase?: boolean | null;
          tags?: string[] | null;
          updated_at?: string;
          version?: string | null;
          version_number?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_files_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_files_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_files_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_files_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_files_parent_file_id_fkey';
            columns: ['parent_file_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_files';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_licenses: {
        Row: {
          activated_at: string | null;
          created_at: string;
          current_activations: number | null;
          customer_id: string | null;
          expires_at: string | null;
          id: string;
          issued_at: string;
          last_used_at: string | null;
          license_key: string;
          license_type: Database['public']['Enums']['license_type'];
          max_activations: number | null;
          metadata: Json | null;
          notes: string | null;
          order_id: string | null;
          product_id: string;
          status: Database['public']['Enums']['license_status'];
          store_id: string;
          transferable: boolean | null;
          transferred_at: string | null;
          transferred_from: string | null;
          transferred_to: string | null;
          updated_at: string;
        };
        Insert: {
          activated_at?: string | null;
          created_at?: string;
          current_activations?: number | null;
          customer_id?: string | null;
          expires_at?: string | null;
          id?: string;
          issued_at?: string;
          last_used_at?: string | null;
          license_key: string;
          license_type?: Database['public']['Enums']['license_type'];
          max_activations?: number | null;
          metadata?: Json | null;
          notes?: string | null;
          order_id?: string | null;
          product_id: string;
          status?: Database['public']['Enums']['license_status'];
          store_id: string;
          transferable?: boolean | null;
          transferred_at?: string | null;
          transferred_from?: string | null;
          transferred_to?: string | null;
          updated_at?: string;
        };
        Update: {
          activated_at?: string | null;
          created_at?: string;
          current_activations?: number | null;
          customer_id?: string | null;
          expires_at?: string | null;
          id?: string;
          issued_at?: string;
          last_used_at?: string | null;
          license_key?: string;
          license_type?: Database['public']['Enums']['license_type'];
          max_activations?: number | null;
          metadata?: Json | null;
          notes?: string | null;
          order_id?: string | null;
          product_id?: string;
          status?: Database['public']['Enums']['license_status'];
          store_id?: string;
          transferable?: boolean | null;
          transferred_at?: string | null;
          transferred_from?: string | null;
          transferred_to?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_licenses_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_transferred_from_fkey';
            columns: ['transferred_from'];
            isOneToOne: false;
            referencedRelation: 'digital_product_licenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_licenses_transferred_to_fkey';
            columns: ['transferred_to'];
            isOneToOne: false;
            referencedRelation: 'digital_product_licenses';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_subscriptions: {
        Row: {
          auto_renew: boolean | null;
          billing_cycle_anchor: string | null;
          cancel_at_period_end: boolean | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          currency: string;
          current_period_end: string;
          current_period_start: string;
          customer_id: string;
          digital_product_id: string;
          downgrade_plan_id: string | null;
          failed_payment_attempts: number | null;
          grace_period_ends_at: string | null;
          id: string;
          is_in_trial: boolean | null;
          is_paused: boolean | null;
          last_payment_amount: number | null;
          last_payment_date: string | null;
          license_id: string | null;
          metadata: Json | null;
          next_billing_date: string | null;
          pause_count: number | null;
          pause_reason: string | null;
          paused_at: string | null;
          paused_until: string | null;
          payment_method_id: string | null;
          payment_provider: string | null;
          plan_change_scheduled_at: string | null;
          plan_change_type: string | null;
          plan_history: Json | null;
          previous_plan_id: string | null;
          product_id: string;
          prorated_amount: number | null;
          status: string;
          store_id: string;
          subscription_interval: string;
          subscription_price: number;
          total_amount_paid: number | null;
          total_payments: number | null;
          trial_days: number | null;
          trial_end: string | null;
          trial_ended_at: string | null;
          trial_start: string | null;
          trial_started_at: string | null;
          updated_at: string;
          upgrade_plan_id: string | null;
        };
        Insert: {
          auto_renew?: boolean | null;
          billing_cycle_anchor?: string | null;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end: string;
          current_period_start: string;
          customer_id: string;
          digital_product_id: string;
          downgrade_plan_id?: string | null;
          failed_payment_attempts?: number | null;
          grace_period_ends_at?: string | null;
          id?: string;
          is_in_trial?: boolean | null;
          is_paused?: boolean | null;
          last_payment_amount?: number | null;
          last_payment_date?: string | null;
          license_id?: string | null;
          metadata?: Json | null;
          next_billing_date?: string | null;
          pause_count?: number | null;
          pause_reason?: string | null;
          paused_at?: string | null;
          paused_until?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          plan_change_scheduled_at?: string | null;
          plan_change_type?: string | null;
          plan_history?: Json | null;
          previous_plan_id?: string | null;
          product_id: string;
          prorated_amount?: number | null;
          status?: string;
          store_id: string;
          subscription_interval: string;
          subscription_price: number;
          total_amount_paid?: number | null;
          total_payments?: number | null;
          trial_days?: number | null;
          trial_end?: string | null;
          trial_ended_at?: string | null;
          trial_start?: string | null;
          trial_started_at?: string | null;
          updated_at?: string;
          upgrade_plan_id?: string | null;
        };
        Update: {
          auto_renew?: boolean | null;
          billing_cycle_anchor?: string | null;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end?: string;
          current_period_start?: string;
          customer_id?: string;
          digital_product_id?: string;
          downgrade_plan_id?: string | null;
          failed_payment_attempts?: number | null;
          grace_period_ends_at?: string | null;
          id?: string;
          is_in_trial?: boolean | null;
          is_paused?: boolean | null;
          last_payment_amount?: number | null;
          last_payment_date?: string | null;
          license_id?: string | null;
          metadata?: Json | null;
          next_billing_date?: string | null;
          pause_count?: number | null;
          pause_reason?: string | null;
          paused_at?: string | null;
          paused_until?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          plan_change_scheduled_at?: string | null;
          plan_change_type?: string | null;
          plan_history?: Json | null;
          previous_plan_id?: string | null;
          product_id?: string;
          prorated_amount?: number | null;
          status?: string;
          store_id?: string;
          subscription_interval?: string;
          subscription_price?: number;
          total_amount_paid?: number | null;
          total_payments?: number | null;
          trial_days?: number | null;
          trial_end?: string | null;
          trial_ended_at?: string | null;
          trial_start?: string | null;
          trial_started_at?: string | null;
          updated_at?: string;
          upgrade_plan_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_subscriptions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'digital_licenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_previous_plan_id_fkey';
            columns: ['previous_plan_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_updates: {
        Row: {
          changelog: string;
          created_at: string;
          description: string | null;
          digital_product_id: string;
          download_count: number | null;
          file_hash: string | null;
          file_size_mb: number | null;
          file_url: string;
          id: string;
          is_forced: boolean | null;
          is_published: boolean | null;
          previous_version: string | null;
          release_date: string;
          release_type: string | null;
          title: string;
          version: string;
        };
        Insert: {
          changelog: string;
          created_at?: string;
          description?: string | null;
          digital_product_id: string;
          download_count?: number | null;
          file_hash?: string | null;
          file_size_mb?: number | null;
          file_url: string;
          id?: string;
          is_forced?: boolean | null;
          is_published?: boolean | null;
          previous_version?: string | null;
          release_date?: string;
          release_type?: string | null;
          title: string;
          version: string;
        };
        Update: {
          changelog?: string;
          created_at?: string;
          description?: string | null;
          digital_product_id?: string;
          download_count?: number | null;
          file_hash?: string | null;
          file_size_mb?: number | null;
          file_url?: string;
          id?: string;
          is_forced?: boolean | null;
          is_published?: boolean | null;
          previous_version?: string | null;
          release_date?: string;
          release_type?: string | null;
          title?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_updates_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'digital_product_updates_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_updates_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_product_updates_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
        ];
      };
      digital_product_webhook_logs: {
        Row: {
          attempts: number | null;
          duration_ms: number | null;
          error_code: string | null;
          error_message: string | null;
          event_id: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
          payload: Json;
          response_body: string | null;
          response_headers: Json | null;
          response_status: number | null;
          sent_at: string;
          success: boolean | null;
          webhook_id: string;
        };
        Insert: {
          attempts?: number | null;
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          event_id?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          payload: Json;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          sent_at?: string;
          success?: boolean | null;
          webhook_id: string;
        };
        Update: {
          attempts?: number | null;
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          event_id?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          payload?: Json;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          sent_at?: string;
          success?: boolean | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_webhook_logs_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_product_webhooks: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          events: string[];
          headers: Json | null;
          id: string;
          is_active: boolean | null;
          last_sent_at: string | null;
          metadata: Json | null;
          name: string;
          retry_count: number | null;
          secret_key: string;
          store_id: string;
          timeout_seconds: number | null;
          total_failed: number | null;
          total_sent: number | null;
          total_succeeded: number | null;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          events: string[];
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_sent_at?: string | null;
          metadata?: Json | null;
          name: string;
          retry_count?: number | null;
          secret_key?: string;
          store_id: string;
          timeout_seconds?: number | null;
          total_failed?: number | null;
          total_sent?: number | null;
          total_succeeded?: number | null;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          events?: string[];
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_sent_at?: string | null;
          metadata?: Json | null;
          name?: string;
          retry_count?: number | null;
          secret_key?: string;
          store_id?: string;
          timeout_seconds?: number | null;
          total_failed?: number | null;
          total_sent?: number | null;
          total_succeeded?: number | null;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_product_webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_product_webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_products: {
        Row: {
          additional_files: Json | null;
          allow_license_transfer: boolean | null;
          allowed_countries: string[] | null;
          auto_generate_keys: boolean | null;
          auto_renew: boolean | null;
          auto_update_enabled: boolean | null;
          average_download_time_seconds: number | null;
          average_rating: number | null;
          blocked_countries: string[] | null;
          bounce_rate: number | null;
          changelog: string | null;
          compatible_os: string[] | null;
          created_at: string;
          demo_available: boolean | null;
          demo_url: string | null;
          digital_type: string;
          documentation_url: string | null;
          download_expiry_days: number | null;
          download_limit: number | null;
          drm_enabled: boolean | null;
          drm_provider: string | null;
          encryption_enabled: boolean | null;
          encryption_type: string | null;
          geo_restriction_enabled: boolean | null;
          has_preview: boolean | null;
          id: string;
          ip_restriction_enabled: boolean | null;
          last_version_date: string | null;
          license_duration_days: number | null;
          license_key_format: string | null;
          license_type: string;
          main_file_format: string | null;
          main_file_hash: string | null;
          main_file_size_mb: number | null;
          main_file_url: string;
          main_file_version: string | null;
          max_activations: number | null;
          max_ips_allowed: number | null;
          minimum_requirements: Json | null;
          preview_duration_seconds: number | null;
          preview_url: string | null;
          product_id: string;
          require_registration: boolean | null;
          source_code_included: boolean | null;
          subscription_grace_period_days: number | null;
          subscription_interval: string | null;
          subscription_price: number | null;
          support_email: string | null;
          support_period_days: number | null;
          total_downloads: number | null;
          total_files: number | null;
          total_revenue: number | null;
          total_reviews: number | null;
          total_size_mb: number | null;
          trial_period_days: number | null;
          unique_downloaders: number | null;
          update_notifications: boolean | null;
          updated_at: string;
          version: string | null;
          watermark_enabled: boolean | null;
          watermark_text: string | null;
        };
        Insert: {
          additional_files?: Json | null;
          allow_license_transfer?: boolean | null;
          allowed_countries?: string[] | null;
          auto_generate_keys?: boolean | null;
          auto_renew?: boolean | null;
          auto_update_enabled?: boolean | null;
          average_download_time_seconds?: number | null;
          average_rating?: number | null;
          blocked_countries?: string[] | null;
          bounce_rate?: number | null;
          changelog?: string | null;
          compatible_os?: string[] | null;
          created_at?: string;
          demo_available?: boolean | null;
          demo_url?: string | null;
          digital_type?: string;
          documentation_url?: string | null;
          download_expiry_days?: number | null;
          download_limit?: number | null;
          drm_enabled?: boolean | null;
          drm_provider?: string | null;
          encryption_enabled?: boolean | null;
          encryption_type?: string | null;
          geo_restriction_enabled?: boolean | null;
          has_preview?: boolean | null;
          id?: string;
          ip_restriction_enabled?: boolean | null;
          last_version_date?: string | null;
          license_duration_days?: number | null;
          license_key_format?: string | null;
          license_type?: string;
          main_file_format?: string | null;
          main_file_hash?: string | null;
          main_file_size_mb?: number | null;
          main_file_url: string;
          main_file_version?: string | null;
          max_activations?: number | null;
          max_ips_allowed?: number | null;
          minimum_requirements?: Json | null;
          preview_duration_seconds?: number | null;
          preview_url?: string | null;
          product_id: string;
          require_registration?: boolean | null;
          source_code_included?: boolean | null;
          subscription_grace_period_days?: number | null;
          subscription_interval?: string | null;
          subscription_price?: number | null;
          support_email?: string | null;
          support_period_days?: number | null;
          total_downloads?: number | null;
          total_files?: number | null;
          total_revenue?: number | null;
          total_reviews?: number | null;
          total_size_mb?: number | null;
          trial_period_days?: number | null;
          unique_downloaders?: number | null;
          update_notifications?: boolean | null;
          updated_at?: string;
          version?: string | null;
          watermark_enabled?: boolean | null;
          watermark_text?: string | null;
        };
        Update: {
          additional_files?: Json | null;
          allow_license_transfer?: boolean | null;
          allowed_countries?: string[] | null;
          auto_generate_keys?: boolean | null;
          auto_renew?: boolean | null;
          auto_update_enabled?: boolean | null;
          average_download_time_seconds?: number | null;
          average_rating?: number | null;
          blocked_countries?: string[] | null;
          bounce_rate?: number | null;
          changelog?: string | null;
          compatible_os?: string[] | null;
          created_at?: string;
          demo_available?: boolean | null;
          demo_url?: string | null;
          digital_type?: string;
          documentation_url?: string | null;
          download_expiry_days?: number | null;
          download_limit?: number | null;
          drm_enabled?: boolean | null;
          drm_provider?: string | null;
          encryption_enabled?: boolean | null;
          encryption_type?: string | null;
          geo_restriction_enabled?: boolean | null;
          has_preview?: boolean | null;
          id?: string;
          ip_restriction_enabled?: boolean | null;
          last_version_date?: string | null;
          license_duration_days?: number | null;
          license_key_format?: string | null;
          license_type?: string;
          main_file_format?: string | null;
          main_file_hash?: string | null;
          main_file_size_mb?: number | null;
          main_file_url?: string;
          main_file_version?: string | null;
          max_activations?: number | null;
          max_ips_allowed?: number | null;
          minimum_requirements?: Json | null;
          preview_duration_seconds?: number | null;
          preview_url?: string | null;
          product_id?: string;
          require_registration?: boolean | null;
          source_code_included?: boolean | null;
          subscription_grace_period_days?: number | null;
          subscription_interval?: string | null;
          subscription_price?: number | null;
          support_email?: string | null;
          support_period_days?: number | null;
          total_downloads?: number | null;
          total_files?: number | null;
          total_revenue?: number | null;
          total_reviews?: number | null;
          total_size_mb?: number | null;
          trial_period_days?: number | null;
          unique_downloaders?: number | null;
          update_notifications?: boolean | null;
          updated_at?: string;
          version?: string | null;
          watermark_enabled?: boolean | null;
          watermark_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      disputes: {
        Row: {
          admin_notes: string | null;
          assigned_admin_id: string | null;
          created_at: string;
          description: string;
          id: string;
          initiator_id: string;
          initiator_type: string;
          order_id: string;
          priority: string | null;
          resolution: string | null;
          resolved_at: string | null;
          status: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          assigned_admin_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          initiator_id: string;
          initiator_type: string;
          order_id: string;
          priority?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          assigned_admin_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          initiator_id?: string;
          initiator_type?: string;
          order_id?: string;
          priority?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'disputes_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      domains: {
        Row: {
          created_at: string | null;
          dns_records: Json | null;
          domain_name: string;
          error_message: string | null;
          id: string;
          last_checked_at: string | null;
          ssl_certificate_id: string | null;
          ssl_expires_at: string | null;
          ssl_status: string | null;
          status: string;
          store_id: string | null;
          updated_at: string | null;
          verification_method: string | null;
          verification_token: string | null;
        };
        Insert: {
          created_at?: string | null;
          dns_records?: Json | null;
          domain_name: string;
          error_message?: string | null;
          id?: string;
          last_checked_at?: string | null;
          ssl_certificate_id?: string | null;
          ssl_expires_at?: string | null;
          ssl_status?: string | null;
          status?: string;
          store_id?: string | null;
          updated_at?: string | null;
          verification_method?: string | null;
          verification_token?: string | null;
        };
        Update: {
          created_at?: string | null;
          dns_records?: Json | null;
          domain_name?: string;
          error_message?: string | null;
          id?: string;
          last_checked_at?: string | null;
          ssl_certificate_id?: string | null;
          ssl_expires_at?: string | null;
          ssl_status?: string | null;
          status?: string;
          store_id?: string | null;
          updated_at?: string | null;
          verification_method?: string | null;
          verification_token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'domains_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'domains_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'domains_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      download_logs: {
        Row: {
          bytes_downloaded: number | null;
          created_at: string | null;
          customer_id: string | null;
          download_completed: boolean | null;
          download_duration_seconds: number | null;
          error_message: string | null;
          id: string;
          ip_address: unknown;
          product_id: string;
          token_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          bytes_downloaded?: number | null;
          created_at?: string | null;
          customer_id?: string | null;
          download_completed?: boolean | null;
          download_duration_seconds?: number | null;
          error_message?: string | null;
          id?: string;
          ip_address?: unknown;
          product_id: string;
          token_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          bytes_downloaded?: number | null;
          created_at?: string | null;
          customer_id?: string | null;
          download_completed?: boolean | null;
          download_duration_seconds?: number | null;
          error_message?: string | null;
          id?: string;
          ip_address?: unknown;
          product_id?: string;
          token_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'download_logs_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'download_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'download_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'download_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'download_logs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'download_logs_token_id_fkey';
            columns: ['token_id'];
            isOneToOne: false;
            referencedRelation: 'download_tokens';
            referencedColumns: ['id'];
          },
        ];
      };
      download_tokens: {
        Row: {
          created_at: string | null;
          current_downloads: number | null;
          customer_id: string | null;
          expires_at: string;
          file_name: string | null;
          file_size_mb: number | null;
          file_url: string;
          id: string;
          ip_address: unknown;
          is_revoked: boolean | null;
          is_used: boolean | null;
          last_used_at: string | null;
          license_id: string | null;
          max_downloads: number | null;
          product_id: string;
          token: string;
          version_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_downloads?: number | null;
          customer_id?: string | null;
          expires_at: string;
          file_name?: string | null;
          file_size_mb?: number | null;
          file_url: string;
          id?: string;
          ip_address?: unknown;
          is_revoked?: boolean | null;
          is_used?: boolean | null;
          last_used_at?: string | null;
          license_id?: string | null;
          max_downloads?: number | null;
          product_id: string;
          token: string;
          version_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_downloads?: number | null;
          customer_id?: string | null;
          expires_at?: string;
          file_name?: string | null;
          file_size_mb?: number | null;
          file_url?: string;
          id?: string;
          ip_address?: unknown;
          is_revoked?: boolean | null;
          is_used?: boolean | null;
          last_used_at?: string | null;
          license_id?: string | null;
          max_downloads?: number | null;
          product_id?: string;
          token?: string;
          version_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'download_tokens_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'download_tokens_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_licenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'download_tokens_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'download_tokens_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'download_tokens_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'download_tokens_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'download_tokens_version_id_fkey';
            columns: ['version_id'];
            isOneToOne: false;
            referencedRelation: 'product_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      drip_content_releases: {
        Row: {
          access_count: number | null;
          actual_release_date: string | null;
          created_at: string;
          customer_id: string;
          digital_product_id: string;
          drip_schedule_id: string;
          email_sent: boolean | null;
          email_sent_at: string | null;
          email_sent_error: string | null;
          file_accessed: boolean | null;
          file_id: string | null;
          first_access_date: string | null;
          id: string;
          metadata: Json | null;
          order_id: string | null;
          release_status: string;
          scheduled_release_date: string;
          updated_at: string;
        };
        Insert: {
          access_count?: number | null;
          actual_release_date?: string | null;
          created_at?: string;
          customer_id: string;
          digital_product_id: string;
          drip_schedule_id: string;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          email_sent_error?: string | null;
          file_accessed?: boolean | null;
          file_id?: string | null;
          first_access_date?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          release_status?: string;
          scheduled_release_date: string;
          updated_at?: string;
        };
        Update: {
          access_count?: number | null;
          actual_release_date?: string | null;
          created_at?: string;
          customer_id?: string;
          digital_product_id?: string;
          drip_schedule_id?: string;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          email_sent_error?: string | null;
          file_accessed?: boolean | null;
          file_id?: string | null;
          first_access_date?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          release_status?: string;
          scheduled_release_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'drip_content_releases_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'drip_content_releases_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'active_digital_licenses';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'drip_content_releases_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'drip_content_releases_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'digital_products_stats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'drip_content_releases_digital_product_id_fkey';
            columns: ['digital_product_id'];
            isOneToOne: false;
            referencedRelation: 'recent_digital_downloads';
            referencedColumns: ['digital_product_id'];
          },
          {
            foreignKeyName: 'drip_content_releases_drip_schedule_id_fkey';
            columns: ['drip_schedule_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_drip_schedule';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'drip_content_releases_file_id_fkey';
            columns: ['file_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_files';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'drip_content_releases_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      email_logs: {
        Row: {
          clicked_at: string | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          opened_at: string | null;
          sendgrid_message_id: string | null;
          status: string | null;
          subject: string;
          template_id: string | null;
          to_email: string;
          user_id: string | null;
        };
        Insert: {
          clicked_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          opened_at?: string | null;
          sendgrid_message_id?: string | null;
          status?: string | null;
          subject: string;
          template_id?: string | null;
          to_email: string;
          user_id?: string | null;
        };
        Update: {
          clicked_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          opened_at?: string | null;
          sendgrid_message_id?: string | null;
          status?: string | null;
          subject?: string;
          template_id?: string | null;
          to_email?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_logs_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'email_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      email_preferences: {
        Row: {
          affiliate_updates: boolean | null;
          course_updates: boolean | null;
          created_at: string | null;
          marketing_emails: boolean | null;
          notification_emails: boolean | null;
          order_updates: boolean | null;
          product_updates: boolean | null;
          transactional_emails: boolean | null;
          unsubscribed_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          affiliate_updates?: boolean | null;
          course_updates?: boolean | null;
          created_at?: string | null;
          marketing_emails?: boolean | null;
          notification_emails?: boolean | null;
          order_updates?: boolean | null;
          product_updates?: boolean | null;
          transactional_emails?: boolean | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          affiliate_updates?: boolean | null;
          course_updates?: boolean | null;
          created_at?: string | null;
          marketing_emails?: boolean | null;
          notification_emails?: boolean | null;
          order_updates?: boolean | null;
          product_updates?: boolean | null;
          transactional_emails?: boolean | null;
          unsubscribed_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          category: string | null;
          created_at: string | null;
          html_content: string;
          id: string;
          is_active: boolean | null;
          language: string | null;
          name: string;
          slug: string;
          subject: string;
          text_content: string | null;
          updated_at: string | null;
          variables: Json | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          html_content: string;
          id?: string;
          is_active?: boolean | null;
          language?: string | null;
          name: string;
          slug: string;
          subject: string;
          text_content?: string | null;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          html_content?: string;
          id?: string;
          is_active?: boolean | null;
          language?: string | null;
          name?: string;
          slug?: string;
          subject?: string;
          text_content?: string | null;
          updated_at?: string | null;
          variables?: Json | null;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          auto_update: boolean | null;
          created_at: string | null;
          from_currency: string;
          id: string;
          is_active: boolean | null;
          last_updated: string | null;
          rate: number;
          source: string | null;
          to_currency: string;
          updated_at: string | null;
          valid_from: string | null;
          valid_to: string | null;
        };
        Insert: {
          auto_update?: boolean | null;
          created_at?: string | null;
          from_currency: string;
          id?: string;
          is_active?: boolean | null;
          last_updated?: string | null;
          rate: number;
          source?: string | null;
          to_currency: string;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: {
          auto_update?: boolean | null;
          created_at?: string | null;
          from_currency?: string;
          id?: string;
          is_active?: boolean | null;
          last_updated?: string | null;
          rate?: number;
          source?: string | null;
          to_currency?: string;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'exchange_rates_from_currency_fkey';
            columns: ['from_currency'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'exchange_rates_to_currency_fkey';
            columns: ['to_currency'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
        ];
      };
      expiration_alerts: {
        Row: {
          alert_type: string;
          created_at: string | null;
          days_until_expiration: number | null;
          id: string;
          is_resolved: boolean | null;
          lot_id: string;
          notification_sent: boolean | null;
          notification_sent_at: string | null;
          resolution_action: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          alert_type: string;
          created_at?: string | null;
          days_until_expiration?: number | null;
          id?: string;
          is_resolved?: boolean | null;
          lot_id: string;
          notification_sent?: boolean | null;
          notification_sent_at?: string | null;
          resolution_action?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          alert_type?: string;
          created_at?: string | null;
          days_until_expiration?: number | null;
          id?: string;
          is_resolved?: boolean | null;
          lot_id?: string;
          notification_sent?: boolean | null;
          notification_sent_at?: string | null;
          resolution_action?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expiration_alerts_lot_id_fkey';
            columns: ['lot_id'];
            isOneToOne: false;
            referencedRelation: 'product_lots';
            referencedColumns: ['id'];
          },
        ];
      };
      forecast_accuracy: {
        Row: {
          actual_quantity: number;
          actual_revenue: number;
          created_at: string;
          evaluated_at: string;
          forecast_id: string;
          forecasted_quantity: number;
          forecasted_revenue: number;
          id: string;
          mae: number | null;
          mape: number | null;
          notes: string | null;
          period_end: string;
          period_start: string;
          quantity_error: number | null;
          quantity_error_percentage: number | null;
          revenue_error: number | null;
          revenue_error_percentage: number | null;
          rmse: number | null;
        };
        Insert: {
          actual_quantity: number;
          actual_revenue: number;
          created_at?: string;
          evaluated_at?: string;
          forecast_id: string;
          forecasted_quantity: number;
          forecasted_revenue: number;
          id?: string;
          mae?: number | null;
          mape?: number | null;
          notes?: string | null;
          period_end: string;
          period_start: string;
          quantity_error?: number | null;
          quantity_error_percentage?: number | null;
          revenue_error?: number | null;
          revenue_error_percentage?: number | null;
          rmse?: number | null;
        };
        Update: {
          actual_quantity?: number;
          actual_revenue?: number;
          created_at?: string;
          evaluated_at?: string;
          forecast_id?: string;
          forecasted_quantity?: number;
          forecasted_revenue?: number;
          id?: string;
          mae?: number | null;
          mape?: number | null;
          notes?: string | null;
          period_end?: string;
          period_start?: string;
          quantity_error?: number | null;
          quantity_error_percentage?: number | null;
          revenue_error?: number | null;
          revenue_error_percentage?: number | null;
          rmse?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'forecast_accuracy_forecast_id_fkey';
            columns: ['forecast_id'];
            isOneToOne: false;
            referencedRelation: 'demand_forecasts';
            referencedColumns: ['id'];
          },
        ];
      };
      geographic_sales_performance: {
        Row: {
          average_order_value: number | null;
          calculated_at: string | null;
          city: string | null;
          country: string;
          created_at: string | null;
          customer_acquisition_cost: number | null;
          customer_lifetime_value: number | null;
          id: string;
          period_end: string;
          period_start: string;
          period_type: string;
          postal_code: string | null;
          region: string | null;
          repeat_customer_rate: number | null;
          store_id: string;
          top_selling_product_id: string | null;
          top_selling_variant_id: string | null;
          total_orders: number | null;
          total_revenue: number | null;
          total_units_sold: number | null;
          unique_customers: number | null;
          updated_at: string | null;
        };
        Insert: {
          average_order_value?: number | null;
          calculated_at?: string | null;
          city?: string | null;
          country: string;
          created_at?: string | null;
          customer_acquisition_cost?: number | null;
          customer_lifetime_value?: number | null;
          id?: string;
          period_end: string;
          period_start: string;
          period_type?: string;
          postal_code?: string | null;
          region?: string | null;
          repeat_customer_rate?: number | null;
          store_id: string;
          top_selling_product_id?: string | null;
          top_selling_variant_id?: string | null;
          total_orders?: number | null;
          total_revenue?: number | null;
          total_units_sold?: number | null;
          unique_customers?: number | null;
          updated_at?: string | null;
        };
        Update: {
          average_order_value?: number | null;
          calculated_at?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string | null;
          customer_acquisition_cost?: number | null;
          customer_lifetime_value?: number | null;
          id?: string;
          period_end?: string;
          period_start?: string;
          period_type?: string;
          postal_code?: string | null;
          region?: string | null;
          repeat_customer_rate?: number | null;
          store_id?: string;
          top_selling_product_id?: string | null;
          top_selling_variant_id?: string | null;
          total_orders?: number | null;
          total_revenue?: number | null;
          total_units_sold?: number | null;
          unique_customers?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'geographic_sales_performance_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'geographic_sales_performance_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'geographic_sales_performance_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'geographic_sales_performance_top_selling_product_id_fkey';
            columns: ['top_selling_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'geographic_sales_performance_top_selling_product_id_fkey';
            columns: ['top_selling_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'geographic_sales_performance_top_selling_product_id_fkey';
            columns: ['top_selling_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'geographic_sales_performance_top_selling_product_id_fkey';
            columns: ['top_selling_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'geographic_sales_performance_top_selling_variant_id_fkey';
            columns: ['top_selling_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      gift_card_transactions: {
        Row: {
          amount: number;
          balance_after: number;
          balance_before: number;
          created_at: string;
          description: string | null;
          gift_card_id: string;
          id: string;
          metadata: Json | null;
          order_id: string | null;
          payment_id: string | null;
          reference_number: string | null;
          transaction_type: Database['public']['Enums']['gift_card_transaction_type'];
          user_id: string | null;
        };
        Insert: {
          amount: number;
          balance_after: number;
          balance_before: number;
          created_at?: string;
          description?: string | null;
          gift_card_id: string;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          payment_id?: string | null;
          reference_number?: string | null;
          transaction_type: Database['public']['Enums']['gift_card_transaction_type'];
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          balance_after?: number;
          balance_before?: number;
          created_at?: string;
          description?: string | null;
          gift_card_id?: string;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          payment_id?: string | null;
          reference_number?: string | null;
          transaction_type?: Database['public']['Enums']['gift_card_transaction_type'];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'gift_card_transactions_gift_card_id_fkey';
            columns: ['gift_card_id'];
            isOneToOne: false;
            referencedRelation: 'gift_cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gift_card_transactions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gift_card_transactions_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
        ];
      };
      gift_cards: {
        Row: {
          applicable_to_product_types: string[] | null;
          applicable_to_products: string[] | null;
          applicable_to_stores: string[] | null;
          auto_activate: boolean | null;
          can_be_partially_used: boolean | null;
          code: string;
          created_at: string;
          current_balance: number;
          expires_at: string | null;
          id: string;
          initial_amount: number;
          issued_at: string;
          last_used_at: string | null;
          metadata: Json | null;
          min_purchase_amount: number | null;
          notes: string | null;
          purchased_by: string | null;
          purchased_order_id: string | null;
          recipient_email: string | null;
          recipient_message: string | null;
          recipient_name: string | null;
          redeemed_at: string | null;
          status: Database['public']['Enums']['gift_card_status'];
          store_id: string;
          times_used: number | null;
          updated_at: string;
        };
        Insert: {
          applicable_to_product_types?: string[] | null;
          applicable_to_products?: string[] | null;
          applicable_to_stores?: string[] | null;
          auto_activate?: boolean | null;
          can_be_partially_used?: boolean | null;
          code: string;
          created_at?: string;
          current_balance: number;
          expires_at?: string | null;
          id?: string;
          initial_amount: number;
          issued_at?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          min_purchase_amount?: number | null;
          notes?: string | null;
          purchased_by?: string | null;
          purchased_order_id?: string | null;
          recipient_email?: string | null;
          recipient_message?: string | null;
          recipient_name?: string | null;
          redeemed_at?: string | null;
          status?: Database['public']['Enums']['gift_card_status'];
          store_id: string;
          times_used?: number | null;
          updated_at?: string;
        };
        Update: {
          applicable_to_product_types?: string[] | null;
          applicable_to_products?: string[] | null;
          applicable_to_stores?: string[] | null;
          auto_activate?: boolean | null;
          can_be_partially_used?: boolean | null;
          code?: string;
          created_at?: string;
          current_balance?: number;
          expires_at?: string | null;
          id?: string;
          initial_amount?: number;
          issued_at?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          min_purchase_amount?: number | null;
          notes?: string | null;
          purchased_by?: string | null;
          purchased_order_id?: string | null;
          recipient_email?: string | null;
          recipient_message?: string | null;
          recipient_name?: string | null;
          redeemed_at?: string | null;
          status?: Database['public']['Enums']['gift_card_status'];
          store_id?: string;
          times_used?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gift_cards_purchased_order_id_fkey';
            columns: ['purchased_order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gift_cards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'gift_cards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'gift_cards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      global_achievements: {
        Row: {
          achievement_type: string;
          created_at: string;
          criteria: Json | null;
          description: string | null;
          display_order: number | null;
          icon_url: string | null;
          id: string;
          is_visible: boolean | null;
          reward_points: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          achievement_type: string;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          reward_points?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          achievement_type?: string;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          reward_points?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      global_badges: {
        Row: {
          badge_type: string;
          created_at: string;
          criteria: Json | null;
          description: string | null;
          display_order: number | null;
          icon_url: string | null;
          id: string;
          is_visible: boolean | null;
          name: string;
          points_required: number | null;
          updated_at: string;
        };
        Insert: {
          badge_type: string;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name: string;
          points_required?: number | null;
          updated_at?: string;
        };
        Update: {
          badge_type?: string;
          created_at?: string;
          criteria?: Json | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name?: string;
          points_required?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      global_shipping_services: {
        Row: {
          api_available: boolean | null;
          api_documentation_url: string | null;
          carrier_type: string;
          contact_address: string | null;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_featured: boolean | null;
          metadata: Json | null;
          name: string;
          priority: number | null;
          supported_countries: string[] | null;
          supported_regions: string[] | null;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          api_available?: boolean | null;
          api_documentation_url?: string | null;
          carrier_type: string;
          contact_address?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          metadata?: Json | null;
          name: string;
          priority?: number | null;
          supported_countries?: string[] | null;
          supported_regions?: string[] | null;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          api_available?: boolean | null;
          api_documentation_url?: string | null;
          carrier_type?: string;
          contact_address?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          metadata?: Json | null;
          name?: string;
          priority?: number | null;
          supported_countries?: string[] | null;
          supported_regions?: string[] | null;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      instructor_profiles: {
        Row: {
          avatar_url: string | null;
          average_rating: number | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          expertise_areas: string[] | null;
          headline: string | null;
          id: string;
          is_top_instructor: boolean | null;
          is_verified: boolean | null;
          linkedin_url: string | null;
          store_id: string | null;
          total_courses: number | null;
          total_reviews: number | null;
          total_students: number | null;
          twitter_url: string | null;
          updated_at: string;
          user_id: string;
          website_url: string | null;
          years_of_experience: number | null;
          youtube_url: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          expertise_areas?: string[] | null;
          headline?: string | null;
          id?: string;
          is_top_instructor?: boolean | null;
          is_verified?: boolean | null;
          linkedin_url?: string | null;
          store_id?: string | null;
          total_courses?: number | null;
          total_reviews?: number | null;
          total_students?: number | null;
          twitter_url?: string | null;
          updated_at?: string;
          user_id: string;
          website_url?: string | null;
          years_of_experience?: number | null;
          youtube_url?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          expertise_areas?: string[] | null;
          headline?: string | null;
          id?: string;
          is_top_instructor?: boolean | null;
          is_verified?: boolean | null;
          linkedin_url?: string | null;
          store_id?: string | null;
          total_courses?: number | null;
          total_reviews?: number | null;
          total_students?: number | null;
          twitter_url?: string | null;
          updated_at?: string;
          user_id?: string;
          website_url?: string | null;
          years_of_experience?: number | null;
          youtube_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'instructor_profiles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'instructor_profiles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'instructor_profiles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      integration_logs: {
        Row: {
          action: string;
          created_at: string;
          details: Json | null;
          error_code: string | null;
          error_message: string | null;
          id: string;
          integration_id: string | null;
          integration_type: string;
          metadata: Json | null;
          store_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: Json | null;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          integration_id?: string | null;
          integration_type: string;
          metadata?: Json | null;
          store_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: Json | null;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          integration_id?: string | null;
          integration_type?: string;
          metadata?: Json | null;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'integration_logs_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'store_integrations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'integration_logs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'integration_logs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'integration_logs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_items: {
        Row: {
          bin_location: string | null;
          created_at: string | null;
          default_warehouse_id: string | null;
          id: string;
          last_counted_at: string | null;
          physical_product_id: string | null;
          quantity_available: number | null;
          quantity_committed: number | null;
          quantity_reserved: number | null;
          reorder_point: number | null;
          reorder_quantity: number | null;
          sku: string;
          supplier_id: string | null;
          total_value: number | null;
          unit_cost: number | null;
          updated_at: string | null;
          variant_id: string | null;
          warehouse_location: string | null;
        };
        Insert: {
          bin_location?: string | null;
          created_at?: string | null;
          default_warehouse_id?: string | null;
          id?: string;
          last_counted_at?: string | null;
          physical_product_id?: string | null;
          quantity_available?: number | null;
          quantity_committed?: number | null;
          quantity_reserved?: number | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          sku: string;
          supplier_id?: string | null;
          total_value?: number | null;
          unit_cost?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_location?: string | null;
        };
        Update: {
          bin_location?: string | null;
          created_at?: string | null;
          default_warehouse_id?: string | null;
          id?: string;
          last_counted_at?: string | null;
          physical_product_id?: string | null;
          quantity_available?: number | null;
          quantity_committed?: number | null;
          quantity_reserved?: number | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          sku?: string;
          supplier_id?: string | null;
          total_value?: number | null;
          unit_cost?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_location?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_items_default_warehouse_id_fkey';
            columns: ['default_warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_items_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_items_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'inventory_items_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'inventory_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      invoice_items: {
        Row: {
          created_at: string;
          discount_amount: number | null;
          id: string;
          invoice_id: string;
          metadata: Json | null;
          product_description: string | null;
          product_id: string | null;
          product_name: string;
          product_type: string | null;
          quantity: number;
          tax_amount: number | null;
          total_price: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          discount_amount?: number | null;
          id?: string;
          invoice_id: string;
          metadata?: Json | null;
          product_description?: string | null;
          product_id?: string | null;
          product_name: string;
          product_type?: string | null;
          quantity?: number;
          tax_amount?: number | null;
          total_price: number;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          discount_amount?: number | null;
          id?: string;
          invoice_id?: string;
          metadata?: Json | null;
          product_description?: string | null;
          product_id?: string | null;
          product_name?: string;
          product_type?: string | null;
          quantity?: number;
          tax_amount?: number | null;
          total_price?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoice_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoice_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'invoice_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'invoice_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          billing_address: Json | null;
          created_at: string;
          currency: string;
          customer_id: string | null;
          discount_amount: number | null;
          due_date: string | null;
          email_recipient: string | null;
          email_sent: boolean | null;
          email_sent_at: string | null;
          id: string;
          invoice_date: string;
          invoice_number: string;
          notes: string | null;
          order_id: string;
          paid_at: string | null;
          payment_reference: string | null;
          payment_terms: string | null;
          pdf_generated_at: string | null;
          pdf_url: string | null;
          shipping_amount: number | null;
          status: string;
          store_id: string;
          store_info: Json | null;
          subtotal: number;
          tax_amount: number | null;
          tax_breakdown: Json | null;
          terms: string | null;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          billing_address?: Json | null;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          discount_amount?: number | null;
          due_date?: string | null;
          email_recipient?: string | null;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          id?: string;
          invoice_date?: string;
          invoice_number: string;
          notes?: string | null;
          order_id: string;
          paid_at?: string | null;
          payment_reference?: string | null;
          payment_terms?: string | null;
          pdf_generated_at?: string | null;
          pdf_url?: string | null;
          shipping_amount?: number | null;
          status?: string;
          store_id: string;
          store_info?: Json | null;
          subtotal?: number;
          tax_amount?: number | null;
          tax_breakdown?: Json | null;
          terms?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          billing_address?: Json | null;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          discount_amount?: number | null;
          due_date?: string | null;
          email_recipient?: string | null;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          id?: string;
          invoice_date?: string;
          invoice_number?: string;
          notes?: string | null;
          order_id?: string;
          paid_at?: string | null;
          payment_reference?: string | null;
          payment_terms?: string | null;
          pdf_generated_at?: string | null;
          pdf_url?: string | null;
          shipping_amount?: number | null;
          status?: string;
          store_id?: string;
          store_info?: Json | null;
          subtotal?: number;
          tax_amount?: number | null;
          tax_breakdown?: Json | null;
          terms?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'invoices_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'invoices_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      kit_assemblies: {
        Row: {
          assembled_by: string | null;
          assembly_number: string;
          assigned_to: string | null;
          completed_date: string | null;
          components_used: Json | null;
          created_at: string;
          estimated_completion_date: string | null;
          id: string;
          kit_id: string;
          notes: string | null;
          order_id: string;
          order_item_id: string | null;
          quality_check_notes: string | null;
          quality_check_passed: boolean | null;
          scheduled_date: string | null;
          started_date: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          assembled_by?: string | null;
          assembly_number: string;
          assigned_to?: string | null;
          completed_date?: string | null;
          components_used?: Json | null;
          created_at?: string;
          estimated_completion_date?: string | null;
          id?: string;
          kit_id: string;
          notes?: string | null;
          order_id: string;
          order_item_id?: string | null;
          quality_check_notes?: string | null;
          quality_check_passed?: boolean | null;
          scheduled_date?: string | null;
          started_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          assembled_by?: string | null;
          assembly_number?: string;
          assigned_to?: string | null;
          completed_date?: string | null;
          components_used?: Json | null;
          created_at?: string;
          estimated_completion_date?: string | null;
          id?: string;
          kit_id?: string;
          notes?: string | null;
          order_id?: string;
          order_item_id?: string | null;
          quality_check_notes?: string | null;
          quality_check_passed?: boolean | null;
          scheduled_date?: string | null;
          started_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'kit_assemblies_kit_id_fkey';
            columns: ['kit_id'];
            isOneToOne: false;
            referencedRelation: 'product_kits';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kit_assemblies_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kit_assemblies_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      kit_components: {
        Row: {
          component_product_id: string;
          component_variant_id: string | null;
          created_at: string;
          display_order: number | null;
          id: string;
          is_option: boolean | null;
          is_required: boolean | null;
          kit_id: string;
          notes: string | null;
          price_override: number | null;
          quantity: number;
          updated_at: string;
          use_component_price: boolean | null;
        };
        Insert: {
          component_product_id: string;
          component_variant_id?: string | null;
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_option?: boolean | null;
          is_required?: boolean | null;
          kit_id: string;
          notes?: string | null;
          price_override?: number | null;
          quantity?: number;
          updated_at?: string;
          use_component_price?: boolean | null;
        };
        Update: {
          component_product_id?: string;
          component_variant_id?: string | null;
          created_at?: string;
          display_order?: number | null;
          id?: string;
          is_option?: boolean | null;
          is_required?: boolean | null;
          kit_id?: string;
          notes?: string | null;
          price_override?: number | null;
          quantity?: number;
          updated_at?: string;
          use_component_price?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'kit_components_component_product_id_fkey';
            columns: ['component_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kit_components_component_product_id_fkey';
            columns: ['component_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'kit_components_component_product_id_fkey';
            columns: ['component_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'kit_components_component_product_id_fkey';
            columns: ['component_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kit_components_component_variant_id_fkey';
            columns: ['component_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kit_components_kit_id_fkey';
            columns: ['kit_id'];
            isOneToOne: false;
            referencedRelation: 'product_kits';
            referencedColumns: ['id'];
          },
        ];
      };
      kyc_submissions: {
        Row: {
          created_at: string;
          document_type: string;
          document_url: string;
          id: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          store_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          document_type: string;
          document_url: string;
          id?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          store_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          document_type?: string;
          document_url?: string;
          id?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          store_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'kyc_submissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'kyc_submissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'kyc_submissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      kyc_verifications: {
        Row: {
          created_at: string | null;
          document_number: string | null;
          document_type: string | null;
          document_url: string | null;
          full_name: string | null;
          id: string;
          status: string | null;
          user_id: string | null;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          document_number?: string | null;
          document_type?: string | null;
          document_url?: string | null;
          full_name?: string | null;
          id?: string;
          status?: string | null;
          user_id?: string | null;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          document_number?: string | null;
          document_type?: string | null;
          document_url?: string | null;
          full_name?: string | null;
          id?: string;
          status?: string | null;
          user_id?: string | null;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      learning_path_courses: {
        Row: {
          course_id: string;
          created_at: string;
          estimated_duration_hours: number | null;
          id: string;
          is_required: boolean | null;
          learning_path_id: string;
          order_index: number;
          unlock_after_completion: boolean | null;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          estimated_duration_hours?: number | null;
          id?: string;
          is_required?: boolean | null;
          learning_path_id: string;
          order_index: number;
          unlock_after_completion?: boolean | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          estimated_duration_hours?: number | null;
          id?: string;
          is_required?: boolean | null;
          learning_path_id?: string;
          order_index?: number;
          unlock_after_completion?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_path_courses_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'learning_path_courses_learning_path_id_fkey';
            columns: ['learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'learning_paths';
            referencedColumns: ['id'];
          },
        ];
      };
      learning_path_enrollments: {
        Row: {
          completed_at: string | null;
          completed_courses_count: number | null;
          created_at: string;
          current_course_index: number | null;
          enrolled_at: string;
          id: string;
          last_accessed_at: string | null;
          learning_path_id: string;
          progress_percentage: number | null;
          started_at: string | null;
          status: string | null;
          total_courses_count: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_courses_count?: number | null;
          created_at?: string;
          current_course_index?: number | null;
          enrolled_at?: string;
          id?: string;
          last_accessed_at?: string | null;
          learning_path_id: string;
          progress_percentage?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_courses_count?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          completed_courses_count?: number | null;
          created_at?: string;
          current_course_index?: number | null;
          enrolled_at?: string;
          id?: string;
          last_accessed_at?: string | null;
          learning_path_id?: string;
          progress_percentage?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_courses_count?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_path_enrollments_learning_path_id_fkey';
            columns: ['learning_path_id'];
            isOneToOne: false;
            referencedRelation: 'learning_paths';
            referencedColumns: ['id'];
          },
        ];
      };
      learning_paths: {
        Row: {
          average_rating: number | null;
          completion_rate: number | null;
          created_at: string;
          created_by: string;
          currency: string | null;
          description: string | null;
          display_order: number | null;
          estimated_duration_days: number | null;
          estimated_duration_hours: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          is_free: boolean | null;
          learning_objectives: string[] | null;
          level: string | null;
          price: number | null;
          short_description: string | null;
          store_id: string;
          target_audience: string[] | null;
          title: string;
          total_courses: number | null;
          total_students: number | null;
          updated_at: string;
        };
        Insert: {
          average_rating?: number | null;
          completion_rate?: number | null;
          created_at?: string;
          created_by: string;
          currency?: string | null;
          description?: string | null;
          display_order?: number | null;
          estimated_duration_days?: number | null;
          estimated_duration_hours?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_free?: boolean | null;
          learning_objectives?: string[] | null;
          level?: string | null;
          price?: number | null;
          short_description?: string | null;
          store_id: string;
          target_audience?: string[] | null;
          title: string;
          total_courses?: number | null;
          total_students?: number | null;
          updated_at?: string;
        };
        Update: {
          average_rating?: number | null;
          completion_rate?: number | null;
          created_at?: string;
          created_by?: string;
          currency?: string | null;
          description?: string | null;
          display_order?: number | null;
          estimated_duration_days?: number | null;
          estimated_duration_hours?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          is_free?: boolean | null;
          learning_objectives?: string[] | null;
          level?: string | null;
          price?: number | null;
          short_description?: string | null;
          store_id?: string;
          target_audience?: string[] | null;
          title?: string;
          total_courses?: number | null;
          total_students?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_paths_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'learning_paths_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'learning_paths_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      legal_documents: {
        Row: {
          content: string;
          created_at: string | null;
          document_type: string;
          effective_date: string | null;
          id: string;
          is_active: boolean | null;
          language: string;
          title: string;
          updated_at: string | null;
          version: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          document_type: string;
          effective_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          language?: string;
          title: string;
          updated_at?: string | null;
          version?: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          document_type?: string;
          effective_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          language?: string;
          title?: string;
          updated_at?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      license_activations: {
        Row: {
          activated_at: string;
          created_at: string;
          deactivated_at: string | null;
          device_fingerprint: string | null;
          device_name: string | null;
          id: string;
          ip_address: unknown;
          last_seen_at: string | null;
          license_id: string;
          location: Json | null;
          metadata: Json | null;
          status: Database['public']['Enums']['activation_status'];
          updated_at: string;
          user_agent: string | null;
        };
        Insert: {
          activated_at?: string;
          created_at?: string;
          deactivated_at?: string | null;
          device_fingerprint?: string | null;
          device_name?: string | null;
          id?: string;
          ip_address?: unknown;
          last_seen_at?: string | null;
          license_id: string;
          location?: Json | null;
          metadata?: Json | null;
          status?: Database['public']['Enums']['activation_status'];
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          activated_at?: string;
          created_at?: string;
          deactivated_at?: string | null;
          device_fingerprint?: string | null;
          device_name?: string | null;
          id?: string;
          ip_address?: unknown;
          last_seen_at?: string | null;
          license_id?: string;
          location?: Json | null;
          metadata?: Json | null;
          status?: Database['public']['Enums']['activation_status'];
          updated_at?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'license_activations_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_licenses';
            referencedColumns: ['id'];
          },
        ];
      };
      license_events: {
        Row: {
          activation_id: string | null;
          created_at: string;
          description: string | null;
          event_type: string;
          id: string;
          ip_address: unknown;
          license_id: string;
          metadata: Json | null;
          triggered_by: string | null;
          user_agent: string | null;
        };
        Insert: {
          activation_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_type: string;
          id?: string;
          ip_address?: unknown;
          license_id: string;
          metadata?: Json | null;
          triggered_by?: string | null;
          user_agent?: string | null;
        };
        Update: {
          activation_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_type?: string;
          id?: string;
          ip_address?: unknown;
          license_id?: string;
          metadata?: Json | null;
          triggered_by?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'license_events_activation_id_fkey';
            columns: ['activation_id'];
            isOneToOne: false;
            referencedRelation: 'license_activations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'license_events_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_licenses';
            referencedColumns: ['id'];
          },
        ];
      };
      lot_movements: {
        Row: {
          created_at: string | null;
          id: string;
          lot_id: string;
          movement_date: string | null;
          movement_type: string;
          notes: string | null;
          order_id: string | null;
          order_item_id: string | null;
          quantity: number;
          reason: string | null;
          transfer_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          lot_id: string;
          movement_date?: string | null;
          movement_type: string;
          notes?: string | null;
          order_id?: string | null;
          order_item_id?: string | null;
          quantity: number;
          reason?: string | null;
          transfer_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          lot_id?: string;
          movement_date?: string | null;
          movement_type?: string;
          notes?: string | null;
          order_id?: string | null;
          order_item_id?: string | null;
          quantity?: number;
          reason?: string | null;
          transfer_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lot_movements_lot_id_fkey';
            columns: ['lot_id'];
            isOneToOne: false;
            referencedRelation: 'product_lots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lot_movements_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lot_movements_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      lot_transfers: {
        Row: {
          actual_arrival_date: string | null;
          created_at: string | null;
          expected_arrival_date: string | null;
          from_warehouse_id: string;
          id: string;
          initiated_by: string | null;
          lot_id: string;
          notes: string | null;
          quantity: number;
          received_by: string | null;
          status: string;
          to_warehouse_id: string;
          tracking_number: string | null;
          transfer_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          actual_arrival_date?: string | null;
          created_at?: string | null;
          expected_arrival_date?: string | null;
          from_warehouse_id: string;
          id?: string;
          initiated_by?: string | null;
          lot_id: string;
          notes?: string | null;
          quantity: number;
          received_by?: string | null;
          status?: string;
          to_warehouse_id: string;
          tracking_number?: string | null;
          transfer_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          actual_arrival_date?: string | null;
          created_at?: string | null;
          expected_arrival_date?: string | null;
          from_warehouse_id?: string;
          id?: string;
          initiated_by?: string | null;
          lot_id?: string;
          notes?: string | null;
          quantity?: number;
          received_by?: string | null;
          status?: string;
          to_warehouse_id?: string;
          tracking_number?: string | null;
          transfer_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lot_transfers_from_warehouse_id_fkey';
            columns: ['from_warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lot_transfers_lot_id_fkey';
            columns: ['lot_id'];
            isOneToOne: false;
            referencedRelation: 'product_lots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lot_transfers_to_warehouse_id_fkey';
            columns: ['to_warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_points: {
        Row: {
          available_points: number;
          created_at: string;
          current_tier_id: string | null;
          current_tier_type: Database['public']['Enums']['loyalty_tier_type'] | null;
          customer_id: string;
          id: string;
          last_activity_at: string | null;
          lifetime_points: number;
          metadata: Json | null;
          next_expiration_date: string | null;
          points_expiring_soon: number | null;
          store_id: string;
          total_orders: number | null;
          total_points: number;
          total_spent: number | null;
          updated_at: string;
        };
        Insert: {
          available_points?: number;
          created_at?: string;
          current_tier_id?: string | null;
          current_tier_type?: Database['public']['Enums']['loyalty_tier_type'] | null;
          customer_id: string;
          id?: string;
          last_activity_at?: string | null;
          lifetime_points?: number;
          metadata?: Json | null;
          next_expiration_date?: string | null;
          points_expiring_soon?: number | null;
          store_id: string;
          total_orders?: number | null;
          total_points?: number;
          total_spent?: number | null;
          updated_at?: string;
        };
        Update: {
          available_points?: number;
          created_at?: string;
          current_tier_id?: string | null;
          current_tier_type?: Database['public']['Enums']['loyalty_tier_type'] | null;
          customer_id?: string;
          id?: string;
          last_activity_at?: string | null;
          lifetime_points?: number;
          metadata?: Json | null;
          next_expiration_date?: string | null;
          points_expiring_soon?: number | null;
          store_id?: string;
          total_orders?: number | null;
          total_points?: number;
          total_spent?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_points_current_tier_id_fkey';
            columns: ['current_tier_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_tiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_points_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_points_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_points_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_reward_redemptions: {
        Row: {
          applied_at: string | null;
          applied_to_order_id: string | null;
          created_at: string;
          customer_id: string;
          expires_at: string | null;
          id: string;
          loyalty_points_id: string;
          metadata: Json | null;
          points_used: number;
          redemption_code: string | null;
          reward_id: string;
          status: string;
          store_id: string;
          used_at: string | null;
        };
        Insert: {
          applied_at?: string | null;
          applied_to_order_id?: string | null;
          created_at?: string;
          customer_id: string;
          expires_at?: string | null;
          id?: string;
          loyalty_points_id: string;
          metadata?: Json | null;
          points_used: number;
          redemption_code?: string | null;
          reward_id: string;
          status?: string;
          store_id: string;
          used_at?: string | null;
        };
        Update: {
          applied_at?: string | null;
          applied_to_order_id?: string | null;
          created_at?: string;
          customer_id?: string;
          expires_at?: string | null;
          id?: string;
          loyalty_points_id?: string;
          metadata?: Json | null;
          points_used?: number;
          redemption_code?: string | null;
          reward_id?: string;
          status?: string;
          store_id?: string;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_reward_redemptions_applied_to_order_id_fkey';
            columns: ['applied_to_order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_reward_redemptions_loyalty_points_id_fkey';
            columns: ['loyalty_points_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_points';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_reward_redemptions_reward_id_fkey';
            columns: ['reward_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_rewards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_reward_redemptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_reward_redemptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_reward_redemptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_rewards: {
        Row: {
          applicable_to_product_types: string[] | null;
          applicable_to_products: string[] | null;
          available_from: string | null;
          available_until: string | null;
          badge_text: string | null;
          cash_back_amount: number | null;
          created_at: string;
          custom_value: Json | null;
          description: string | null;
          discount_amount: number | null;
          discount_percentage: number | null;
          display_order: number | null;
          free_product_id: string | null;
          gift_card_amount: number | null;
          id: string;
          image_url: string | null;
          max_redemptions: number | null;
          max_redemptions_per_customer: number | null;
          min_tier: Database['public']['Enums']['loyalty_tier_type'] | null;
          name: string;
          points_cost: number;
          redemption_count: number | null;
          reward_type: Database['public']['Enums']['loyalty_reward_type'];
          status: Database['public']['Enums']['loyalty_reward_status'] | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          applicable_to_product_types?: string[] | null;
          applicable_to_products?: string[] | null;
          available_from?: string | null;
          available_until?: string | null;
          badge_text?: string | null;
          cash_back_amount?: number | null;
          created_at?: string;
          custom_value?: Json | null;
          description?: string | null;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          display_order?: number | null;
          free_product_id?: string | null;
          gift_card_amount?: number | null;
          id?: string;
          image_url?: string | null;
          max_redemptions?: number | null;
          max_redemptions_per_customer?: number | null;
          min_tier?: Database['public']['Enums']['loyalty_tier_type'] | null;
          name: string;
          points_cost: number;
          redemption_count?: number | null;
          reward_type?: Database['public']['Enums']['loyalty_reward_type'];
          status?: Database['public']['Enums']['loyalty_reward_status'] | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          applicable_to_product_types?: string[] | null;
          applicable_to_products?: string[] | null;
          available_from?: string | null;
          available_until?: string | null;
          badge_text?: string | null;
          cash_back_amount?: number | null;
          created_at?: string;
          custom_value?: Json | null;
          description?: string | null;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          display_order?: number | null;
          free_product_id?: string | null;
          gift_card_amount?: number | null;
          id?: string;
          image_url?: string | null;
          max_redemptions?: number | null;
          max_redemptions_per_customer?: number | null;
          min_tier?: Database['public']['Enums']['loyalty_tier_type'] | null;
          name?: string;
          points_cost?: number;
          redemption_count?: number | null;
          reward_type?: Database['public']['Enums']['loyalty_reward_type'];
          status?: Database['public']['Enums']['loyalty_reward_status'] | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_rewards_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_rewards_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'loyalty_rewards_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'loyalty_rewards_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_rewards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_rewards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_rewards_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_tiers: {
        Row: {
          badge_color: string | null;
          badge_icon: string | null;
          created_at: string;
          description: string | null;
          discount_percentage: number | null;
          display_order: number | null;
          exclusive_access: boolean | null;
          free_shipping: boolean | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          min_orders_required: number | null;
          min_points_required: number;
          min_spent_amount: number | null;
          name: string;
          points_multiplier: number | null;
          store_id: string;
          tier_type: Database['public']['Enums']['loyalty_tier_type'];
          updated_at: string;
        };
        Insert: {
          badge_color?: string | null;
          badge_icon?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percentage?: number | null;
          display_order?: number | null;
          exclusive_access?: boolean | null;
          free_shipping?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          min_orders_required?: number | null;
          min_points_required?: number;
          min_spent_amount?: number | null;
          name: string;
          points_multiplier?: number | null;
          store_id: string;
          tier_type?: Database['public']['Enums']['loyalty_tier_type'];
          updated_at?: string;
        };
        Update: {
          badge_color?: string | null;
          badge_icon?: string | null;
          created_at?: string;
          description?: string | null;
          discount_percentage?: number | null;
          display_order?: number | null;
          exclusive_access?: boolean | null;
          free_shipping?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          min_orders_required?: number | null;
          min_points_required?: number;
          min_spent_amount?: number | null;
          name?: string;
          points_multiplier?: number | null;
          store_id?: string;
          tier_type?: Database['public']['Enums']['loyalty_tier_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_tiers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_tiers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_tiers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_transactions: {
        Row: {
          balance_after: number;
          balance_before: number;
          created_at: string;
          created_by: string | null;
          customer_id: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          loyalty_points_id: string;
          metadata: Json | null;
          order_id: string | null;
          points_amount: number;
          reference_number: string | null;
          reward_id: string | null;
          store_id: string;
          transaction_type: Database['public']['Enums']['loyalty_transaction_type'];
        };
        Insert: {
          balance_after: number;
          balance_before: number;
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          loyalty_points_id: string;
          metadata?: Json | null;
          order_id?: string | null;
          points_amount: number;
          reference_number?: string | null;
          reward_id?: string | null;
          store_id: string;
          transaction_type?: Database['public']['Enums']['loyalty_transaction_type'];
        };
        Update: {
          balance_after?: number;
          balance_before?: number;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          loyalty_points_id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          points_amount?: number;
          reference_number?: string | null;
          reward_id?: string | null;
          store_id?: string;
          transaction_type?: Database['public']['Enums']['loyalty_transaction_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_transactions_loyalty_points_id_fkey';
            columns: ['loyalty_points_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_points';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_transactions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_transactions_reward_id_fkey';
            columns: ['reward_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_rewards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_transactions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_transactions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'loyalty_transactions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      margin_analysis: {
        Row: {
          analysis_date: string;
          analysis_period_end: string;
          analysis_period_start: string;
          average_selling_price: number;
          break_even_revenue: number | null;
          break_even_units: number | null;
          contribution_margin: number | null;
          contribution_margin_percentage: number | null;
          created_at: string;
          gross_margin_percentage: number | null;
          gross_profit: number | null;
          id: string;
          margin_change_percentage: number | null;
          net_margin_percentage: number | null;
          net_profit: number | null;
          notes: string | null;
          previous_period_margin: number | null;
          product_id: string;
          profit_per_unit: number | null;
          store_id: string;
          total_cost_of_goods: number;
          total_costs: number;
          total_fixed_costs: number;
          total_revenue: number;
          total_units_sold: number;
          total_variable_costs: number;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          analysis_date?: string;
          analysis_period_end: string;
          analysis_period_start: string;
          average_selling_price: number;
          break_even_revenue?: number | null;
          break_even_units?: number | null;
          contribution_margin?: number | null;
          contribution_margin_percentage?: number | null;
          created_at?: string;
          gross_margin_percentage?: number | null;
          gross_profit?: number | null;
          id?: string;
          margin_change_percentage?: number | null;
          net_margin_percentage?: number | null;
          net_profit?: number | null;
          notes?: string | null;
          previous_period_margin?: number | null;
          product_id: string;
          profit_per_unit?: number | null;
          store_id: string;
          total_cost_of_goods?: number;
          total_costs?: number;
          total_fixed_costs?: number;
          total_revenue?: number;
          total_units_sold?: number;
          total_variable_costs?: number;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          analysis_date?: string;
          analysis_period_end?: string;
          analysis_period_start?: string;
          average_selling_price?: number;
          break_even_revenue?: number | null;
          break_even_units?: number | null;
          contribution_margin?: number | null;
          contribution_margin_percentage?: number | null;
          created_at?: string;
          gross_margin_percentage?: number | null;
          gross_profit?: number | null;
          id?: string;
          margin_change_percentage?: number | null;
          net_margin_percentage?: number | null;
          net_profit?: number | null;
          notes?: string | null;
          previous_period_margin?: number | null;
          product_id?: string;
          profit_per_unit?: number | null;
          store_id?: string;
          total_cost_of_goods?: number;
          total_costs?: number;
          total_fixed_costs?: number;
          total_revenue?: number;
          total_units_sold?: number;
          total_variable_costs?: number;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'margin_analysis_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'margin_analysis_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'margin_analysis_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'margin_analysis_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'margin_analysis_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'margin_analysis_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'margin_analysis_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'margin_analysis_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_logs: {
        Row: {
          body: string;
          channel: string;
          clicked_at: string | null;
          created_at: string;
          data: Json | null;
          delivered_at: string | null;
          error_message: string | null;
          id: string;
          message: string | null;
          metadata: Json | null;
          notification_type: string;
          opened_at: string | null;
          provider: string | null;
          push_subscription_id: string | null;
          recipient_email: string | null;
          recipient_phone: string | null;
          related_order_id: string | null;
          related_product_id: string | null;
          related_return_id: string | null;
          sent_at: string | null;
          status: string;
          store_id: string;
          subject: string | null;
          template_id: string | null;
          title: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          body: string;
          channel: string;
          clicked_at?: string | null;
          created_at?: string;
          data?: Json | null;
          delivered_at?: string | null;
          error_message?: string | null;
          id?: string;
          message?: string | null;
          metadata?: Json | null;
          notification_type: string;
          opened_at?: string | null;
          provider?: string | null;
          push_subscription_id?: string | null;
          recipient_email?: string | null;
          recipient_phone?: string | null;
          related_order_id?: string | null;
          related_product_id?: string | null;
          related_return_id?: string | null;
          sent_at?: string | null;
          status?: string;
          store_id: string;
          subject?: string | null;
          template_id?: string | null;
          title: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          body?: string;
          channel?: string;
          clicked_at?: string | null;
          created_at?: string;
          data?: Json | null;
          delivered_at?: string | null;
          error_message?: string | null;
          id?: string;
          message?: string | null;
          metadata?: Json | null;
          notification_type?: string;
          opened_at?: string | null;
          provider?: string | null;
          push_subscription_id?: string | null;
          recipient_email?: string | null;
          recipient_phone?: string | null;
          related_order_id?: string | null;
          related_product_id?: string | null;
          related_return_id?: string | null;
          sent_at?: string | null;
          status?: string;
          store_id?: string;
          subject?: string | null;
          template_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_logs_push_subscription_id_fkey';
            columns: ['push_subscription_id'];
            isOneToOne: false;
            referencedRelation: 'push_subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_related_order_id_fkey';
            columns: ['related_order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_related_product_id_fkey';
            columns: ['related_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_related_product_id_fkey';
            columns: ['related_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'notification_logs_related_product_id_fkey';
            columns: ['related_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'notification_logs_related_product_id_fkey';
            columns: ['related_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_related_return_id_fkey';
            columns: ['related_return_id'];
            isOneToOne: false;
            referencedRelation: 'product_returns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'notification_logs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'notification_logs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          app_affiliate_sale: boolean | null;
          app_certificate_ready: boolean | null;
          app_comment_reply: boolean | null;
          app_course_complete: boolean | null;
          app_course_enrollment: boolean | null;
          app_course_update: boolean | null;
          app_instructor_message: boolean | null;
          app_lesson_complete: boolean | null;
          app_new_course: boolean | null;
          app_quiz_result: boolean | null;
          created_at: string | null;
          email_affiliate_sale: boolean | null;
          email_certificate_ready: boolean | null;
          email_comment_reply: boolean | null;
          email_course_complete: boolean | null;
          email_course_enrollment: boolean | null;
          email_course_update: boolean | null;
          email_digest_frequency: string | null;
          email_instructor_message: boolean | null;
          email_lesson_complete: boolean | null;
          email_new_course: boolean | null;
          email_quiz_result: boolean | null;
          id: string;
          pause_until: string | null;
          store_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          app_affiliate_sale?: boolean | null;
          app_certificate_ready?: boolean | null;
          app_comment_reply?: boolean | null;
          app_course_complete?: boolean | null;
          app_course_enrollment?: boolean | null;
          app_course_update?: boolean | null;
          app_instructor_message?: boolean | null;
          app_lesson_complete?: boolean | null;
          app_new_course?: boolean | null;
          app_quiz_result?: boolean | null;
          created_at?: string | null;
          email_affiliate_sale?: boolean | null;
          email_certificate_ready?: boolean | null;
          email_comment_reply?: boolean | null;
          email_course_complete?: boolean | null;
          email_course_enrollment?: boolean | null;
          email_course_update?: boolean | null;
          email_digest_frequency?: string | null;
          email_instructor_message?: boolean | null;
          email_lesson_complete?: boolean | null;
          email_new_course?: boolean | null;
          email_quiz_result?: boolean | null;
          id?: string;
          pause_until?: string | null;
          store_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          app_affiliate_sale?: boolean | null;
          app_certificate_ready?: boolean | null;
          app_comment_reply?: boolean | null;
          app_course_complete?: boolean | null;
          app_course_enrollment?: boolean | null;
          app_course_update?: boolean | null;
          app_instructor_message?: boolean | null;
          app_lesson_complete?: boolean | null;
          app_new_course?: boolean | null;
          app_quiz_result?: boolean | null;
          created_at?: string | null;
          email_affiliate_sale?: boolean | null;
          email_certificate_ready?: boolean | null;
          email_comment_reply?: boolean | null;
          email_course_complete?: boolean | null;
          email_course_enrollment?: boolean | null;
          email_course_update?: boolean | null;
          email_digest_frequency?: string | null;
          email_instructor_message?: boolean | null;
          email_lesson_complete?: boolean | null;
          email_new_course?: boolean | null;
          email_quiz_result?: boolean | null;
          id?: string;
          pause_until?: string | null;
          store_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'notification_preferences_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'notification_preferences_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_label: string | null;
          action_url: string | null;
          created_at: string | null;
          id: string;
          is_archived: boolean | null;
          is_read: boolean | null;
          message: string;
          metadata: Json | null;
          priority: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          action_label?: string | null;
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_archived?: boolean | null;
          is_read?: boolean | null;
          message: string;
          metadata?: Json | null;
          priority?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          action_label?: string | null;
          action_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_archived?: boolean | null;
          is_read?: boolean | null;
          message?: string;
          metadata?: Json | null;
          priority?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string | null;
          id: string;
          order_id: string | null;
          product_id: string | null;
          product_name: string | null;
          product_type: string | null;
          quantity: number | null;
          total_price: number | null;
          unit_price: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          product_type?: string | null;
          quantity?: number | null;
          total_price?: number | null;
          unit_price?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          product_type?: string | null;
          quantity?: number | null;
          total_price?: number | null;
          unit_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          affiliate_tracking_cookie: string | null;
          created_at: string | null;
          currency: string | null;
          customer_id: string | null;
          delivery_confirmed_at: string | null;
          delivery_confirmed_by: string | null;
          delivery_notes: string | null;
          delivery_status: string | null;
          delivery_tracking: string | null;
          id: string;
          metadata: Json | null;
          order_number: string;
          payment_status: string | null;
          payment_type: string | null;
          percentage_paid: number | null;
          remaining_amount: number | null;
          status: string | null;
          store_id: string | null;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          affiliate_tracking_cookie?: string | null;
          created_at?: string | null;
          currency?: string | null;
          customer_id?: string | null;
          delivery_confirmed_at?: string | null;
          delivery_confirmed_by?: string | null;
          delivery_notes?: string | null;
          delivery_status?: string | null;
          delivery_tracking?: string | null;
          id?: string;
          metadata?: Json | null;
          order_number: string;
          payment_status?: string | null;
          payment_type?: string | null;
          percentage_paid?: number | null;
          remaining_amount?: number | null;
          status?: string | null;
          store_id?: string | null;
          total_amount?: number;
          updated_at?: string | null;
        };
        Update: {
          affiliate_tracking_cookie?: string | null;
          created_at?: string | null;
          currency?: string | null;
          customer_id?: string | null;
          delivery_confirmed_at?: string | null;
          delivery_confirmed_by?: string | null;
          delivery_notes?: string | null;
          delivery_status?: string | null;
          delivery_tracking?: string | null;
          id?: string;
          metadata?: Json | null;
          order_number?: string;
          payment_status?: string | null;
          payment_type?: string | null;
          percentage_paid?: number | null;
          remaining_amount?: number | null;
          status?: string | null;
          store_id?: string | null;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_orders_customer';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      orders_2024_12: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_01: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_02: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_03: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_04: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_05: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_06: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_07: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_08: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_09: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_10: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_2025_11: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_default: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders_partitioned: {
        Row: {
          created_at: string;
          currency: string;
          customer_id: string | null;
          id: string;
          payment_status: string | null;
          status: string;
          store_id: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          payment_status?: string | null;
          status?: string;
          store_id?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_partitioned_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_partitioned_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'orders_partitioned_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'orders_partitioned_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          customer_id: string | null;
          delivery_confirmed_at: string | null;
          delivery_confirmed_by: string | null;
          dispute_opened_at: string | null;
          dispute_resolution: string | null;
          dispute_resolved_at: string | null;
          held_until: string | null;
          id: string;
          is_held: boolean | null;
          notes: string | null;
          order_id: string | null;
          payment_method: string;
          payment_type: string | null;
          percentage_amount: number | null;
          percentage_rate: number | null;
          release_conditions: Json | null;
          remaining_amount: number | null;
          status: string;
          store_id: string;
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          delivery_confirmed_at?: string | null;
          delivery_confirmed_by?: string | null;
          dispute_opened_at?: string | null;
          dispute_resolution?: string | null;
          dispute_resolved_at?: string | null;
          held_until?: string | null;
          id?: string;
          is_held?: boolean | null;
          notes?: string | null;
          order_id?: string | null;
          payment_method: string;
          payment_type?: string | null;
          percentage_amount?: number | null;
          percentage_rate?: number | null;
          release_conditions?: Json | null;
          remaining_amount?: number | null;
          status?: string;
          store_id: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          customer_id?: string | null;
          delivery_confirmed_at?: string | null;
          delivery_confirmed_by?: string | null;
          dispute_opened_at?: string | null;
          dispute_resolution?: string | null;
          dispute_resolved_at?: string | null;
          held_until?: string | null;
          id?: string;
          is_held?: boolean | null;
          notes?: string | null;
          order_id?: string | null;
          payment_method?: string;
          payment_type?: string | null;
          percentage_amount?: number | null;
          percentage_rate?: number | null;
          release_conditions?: Json | null;
          remaining_amount?: number | null;
          status?: string;
          store_id?: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      performance_monitoring: {
        Row: {
          api_endpoint: string | null;
          browser: string | null;
          device_type: string | null;
          id: string;
          is_above_threshold: boolean | null;
          metadata: Json | null;
          metric_name: string;
          metric_type: string;
          metric_unit: string | null;
          metric_value: number;
          os: string | null;
          page_url: string | null;
          product_id: string | null;
          recorded_at: string;
          store_id: string | null;
          threshold_critical: number | null;
          threshold_warning: number | null;
          user_agent: string | null;
        };
        Insert: {
          api_endpoint?: string | null;
          browser?: string | null;
          device_type?: string | null;
          id?: string;
          is_above_threshold?: boolean | null;
          metadata?: Json | null;
          metric_name: string;
          metric_type: string;
          metric_unit?: string | null;
          metric_value: number;
          os?: string | null;
          page_url?: string | null;
          product_id?: string | null;
          recorded_at?: string;
          store_id?: string | null;
          threshold_critical?: number | null;
          threshold_warning?: number | null;
          user_agent?: string | null;
        };
        Update: {
          api_endpoint?: string | null;
          browser?: string | null;
          device_type?: string | null;
          id?: string;
          is_above_threshold?: boolean | null;
          metadata?: Json | null;
          metric_name?: string;
          metric_type?: string;
          metric_unit?: string | null;
          metric_value?: number;
          os?: string | null;
          page_url?: string | null;
          product_id?: string | null;
          recorded_at?: string;
          store_id?: string | null;
          threshold_critical?: number | null;
          threshold_warning?: number | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'performance_monitoring_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'performance_monitoring_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'performance_monitoring_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'performance_monitoring_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'performance_monitoring_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'performance_monitoring_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'performance_monitoring_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          action_label: string | null;
          action_url: string | null;
          alert_type: string;
          created_at: string;
          details: Json | null;
          dismissed_at: string | null;
          id: string;
          message: string;
          product_id: string | null;
          resolved_at: string | null;
          severity: string;
          status: string;
          store_id: string;
          title: string;
          triggered_at: string;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          action_label?: string | null;
          action_url?: string | null;
          alert_type: string;
          created_at?: string;
          details?: Json | null;
          dismissed_at?: string | null;
          id?: string;
          message: string;
          product_id?: string | null;
          resolved_at?: string | null;
          severity?: string;
          status?: string;
          store_id: string;
          title: string;
          triggered_at?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          action_label?: string | null;
          action_url?: string | null;
          alert_type?: string;
          created_at?: string;
          details?: Json | null;
          dismissed_at?: string | null;
          id?: string;
          message?: string;
          product_id?: string | null;
          resolved_at?: string | null;
          severity?: string;
          status?: string;
          store_id?: string;
          title?: string;
          triggered_at?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'physical_product_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'physical_product_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_alerts_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_analytics: {
        Row: {
          average_order_value: number | null;
          average_rating: number | null;
          average_stock_level: number | null;
          calculated_at: string | null;
          conversion_rate: number | null;
          cost_of_goods_sold: number | null;
          created_at: string | null;
          days_of_inventory: number | null;
          gross_profit: number | null;
          gross_profit_margin: number | null;
          id: string;
          net_profit: number | null;
          net_profit_margin: number | null;
          period_end: string;
          period_start: string;
          period_type: string;
          physical_product_id: string;
          refund_rate: number | null;
          return_rate: number | null;
          revenue: number | null;
          review_count: number | null;
          shipping_costs: number | null;
          stock_turnover_rate: number | null;
          total_costs: number | null;
          units_sold: number | null;
          updated_at: string | null;
          variant_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          average_order_value?: number | null;
          average_rating?: number | null;
          average_stock_level?: number | null;
          calculated_at?: string | null;
          conversion_rate?: number | null;
          cost_of_goods_sold?: number | null;
          created_at?: string | null;
          days_of_inventory?: number | null;
          gross_profit?: number | null;
          gross_profit_margin?: number | null;
          id?: string;
          net_profit?: number | null;
          net_profit_margin?: number | null;
          period_end: string;
          period_start: string;
          period_type?: string;
          physical_product_id: string;
          refund_rate?: number | null;
          return_rate?: number | null;
          revenue?: number | null;
          review_count?: number | null;
          shipping_costs?: number | null;
          stock_turnover_rate?: number | null;
          total_costs?: number | null;
          units_sold?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          average_order_value?: number | null;
          average_rating?: number | null;
          average_stock_level?: number | null;
          calculated_at?: string | null;
          conversion_rate?: number | null;
          cost_of_goods_sold?: number | null;
          created_at?: string | null;
          days_of_inventory?: number | null;
          gross_profit?: number | null;
          gross_profit_margin?: number | null;
          id?: string;
          net_profit?: number | null;
          net_profit_margin?: number | null;
          period_end?: string;
          period_start?: string;
          period_type?: string;
          physical_product_id?: string;
          refund_rate?: number | null;
          return_rate?: number | null;
          revenue?: number | null;
          review_count?: number | null;
          shipping_costs?: number | null;
          stock_turnover_rate?: number | null;
          total_costs?: number | null;
          units_sold?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_analytics_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_analytics_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'physical_product_analytics_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'physical_product_analytics_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_analytics_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_price_alerts: {
        Row: {
          alert_sent: boolean | null;
          alert_sent_at: string | null;
          alert_sent_date: string;
          created_at: string;
          current_price: number;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          original_price: number;
          price_drop_threshold: number | null;
          product_id: string;
          target_price: number | null;
          updated_at: string;
          user_id: string;
          variant_id: string | null;
        };
        Insert: {
          alert_sent?: boolean | null;
          alert_sent_at?: string | null;
          alert_sent_date?: string;
          created_at?: string;
          current_price: number;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          original_price: number;
          price_drop_threshold?: number | null;
          product_id: string;
          target_price?: number | null;
          updated_at?: string;
          user_id: string;
          variant_id?: string | null;
        };
        Update: {
          alert_sent?: boolean | null;
          alert_sent_at?: string | null;
          alert_sent_date?: string;
          created_at?: string;
          current_price?: number;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          original_price?: number;
          price_drop_threshold?: number | null;
          product_id?: string;
          target_price?: number | null;
          updated_at?: string;
          user_id?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_price_alerts_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'physical_product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_promotion_alerts: {
        Row: {
          category_id: string | null;
          created_at: string;
          id: string;
          is_active: boolean | null;
          last_alert_sent_at: string | null;
          last_alert_sent_date: string | null;
          metadata: Json | null;
          min_discount_percentage: number | null;
          notify_on_promotion_end: boolean | null;
          notify_on_promotion_start: boolean | null;
          product_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_alert_sent_at?: string | null;
          last_alert_sent_date?: string | null;
          metadata?: Json | null;
          min_discount_percentage?: number | null;
          notify_on_promotion_end?: boolean | null;
          notify_on_promotion_start?: boolean | null;
          product_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_alert_sent_at?: string | null;
          last_alert_sent_date?: string | null;
          metadata?: Json | null;
          min_discount_percentage?: number | null;
          notify_on_promotion_end?: boolean | null;
          notify_on_promotion_start?: boolean | null;
          product_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_promotion_alerts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_promotion_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_promotion_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_promotion_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_promotion_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_return_notifications: {
        Row: {
          created_at: string;
          customer_id: string;
          email_sent: boolean | null;
          email_sent_at: string | null;
          id: string;
          metadata: Json | null;
          notify_on_approval: boolean | null;
          notify_on_refund: boolean | null;
          notify_on_status_change: boolean | null;
          order_id: string;
          return_id: string;
          return_status: string;
          sms_sent: boolean | null;
          sms_sent_at: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          id?: string;
          metadata?: Json | null;
          notify_on_approval?: boolean | null;
          notify_on_refund?: boolean | null;
          notify_on_status_change?: boolean | null;
          order_id: string;
          return_id: string;
          return_status: string;
          sms_sent?: boolean | null;
          sms_sent_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          id?: string;
          metadata?: Json | null;
          notify_on_approval?: boolean | null;
          notify_on_refund?: boolean | null;
          notify_on_status_change?: boolean | null;
          order_id?: string;
          return_id?: string;
          return_status?: string;
          sms_sent?: boolean | null;
          sms_sent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_return_notifications_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_return_notifications_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_return_notifications_return_id_fkey';
            columns: ['return_id'];
            isOneToOne: false;
            referencedRelation: 'product_returns';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_shipment_notifications: {
        Row: {
          carrier_name: string | null;
          created_at: string;
          customer_id: string;
          email_sent: boolean | null;
          email_sent_at: string | null;
          estimated_delivery_date: string | null;
          id: string;
          metadata: Json | null;
          notify_on_delivery: boolean | null;
          notify_on_exception: boolean | null;
          notify_on_status_change: boolean | null;
          order_id: string;
          push_sent: boolean | null;
          push_sent_at: string | null;
          shipment_status: string;
          sms_sent: boolean | null;
          sms_sent_at: string | null;
          tracking_number: string | null;
          updated_at: string;
        };
        Insert: {
          carrier_name?: string | null;
          created_at?: string;
          customer_id: string;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          estimated_delivery_date?: string | null;
          id?: string;
          metadata?: Json | null;
          notify_on_delivery?: boolean | null;
          notify_on_exception?: boolean | null;
          notify_on_status_change?: boolean | null;
          order_id: string;
          push_sent?: boolean | null;
          push_sent_at?: string | null;
          shipment_status: string;
          sms_sent?: boolean | null;
          sms_sent_at?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
        };
        Update: {
          carrier_name?: string | null;
          created_at?: string;
          customer_id?: string;
          email_sent?: boolean | null;
          email_sent_at?: string | null;
          estimated_delivery_date?: string | null;
          id?: string;
          metadata?: Json | null;
          notify_on_delivery?: boolean | null;
          notify_on_exception?: boolean | null;
          notify_on_status_change?: boolean | null;
          order_id?: string;
          push_sent?: boolean | null;
          push_sent_at?: string | null;
          shipment_status?: string;
          sms_sent?: boolean | null;
          sms_sent_at?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_shipment_notifications_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_shipment_notifications_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_stock_alerts: {
        Row: {
          alert_sent: boolean | null;
          alert_sent_at: string | null;
          alert_sent_date: string;
          created_at: string;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          min_quantity_required: number | null;
          notify_on_back_in_stock: boolean | null;
          notify_on_low_stock: boolean | null;
          product_id: string;
          stock_status: string | null;
          updated_at: string;
          user_id: string;
          variant_id: string | null;
        };
        Insert: {
          alert_sent?: boolean | null;
          alert_sent_at?: string | null;
          alert_sent_date?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          min_quantity_required?: number | null;
          notify_on_back_in_stock?: boolean | null;
          notify_on_low_stock?: boolean | null;
          product_id: string;
          stock_status?: string | null;
          updated_at?: string;
          user_id: string;
          variant_id?: string | null;
        };
        Update: {
          alert_sent?: boolean | null;
          alert_sent_at?: string | null;
          alert_sent_date?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          min_quantity_required?: number | null;
          notify_on_back_in_stock?: boolean | null;
          notify_on_low_stock?: boolean | null;
          product_id?: string;
          stock_status?: string | null;
          updated_at?: string;
          user_id?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_stock_alerts_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'physical_product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_subscriptions: {
        Row: {
          auto_ship: boolean | null;
          cancel_at_period_end: boolean | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          currency: string;
          current_period_end: string;
          current_period_start: string;
          customer_id: string;
          failed_payment_attempts: number | null;
          id: string;
          last_payment_amount: number | null;
          last_payment_date: string | null;
          metadata: Json | null;
          next_billing_date: string | null;
          payment_method_id: string | null;
          payment_provider: string | null;
          physical_product_id: string;
          product_id: string;
          shipping_address: Json | null;
          status: string;
          store_id: string;
          subscription_interval: string;
          subscription_price: number;
          total_amount_paid: number | null;
          total_payments: number | null;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string;
        };
        Insert: {
          auto_ship?: boolean | null;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end: string;
          current_period_start: string;
          customer_id: string;
          failed_payment_attempts?: number | null;
          id?: string;
          last_payment_amount?: number | null;
          last_payment_date?: string | null;
          metadata?: Json | null;
          next_billing_date?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          physical_product_id: string;
          product_id: string;
          shipping_address?: Json | null;
          status?: string;
          store_id: string;
          subscription_interval: string;
          subscription_price: number;
          total_amount_paid?: number | null;
          total_payments?: number | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string;
        };
        Update: {
          auto_ship?: boolean | null;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end?: string;
          current_period_start?: string;
          customer_id?: string;
          failed_payment_attempts?: number | null;
          id?: string;
          last_payment_amount?: number | null;
          last_payment_date?: string | null;
          metadata?: Json | null;
          next_billing_date?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          physical_product_id?: string;
          product_id?: string;
          shipping_address?: Json | null;
          status?: string;
          store_id?: string;
          subscription_interval?: string;
          subscription_price?: number;
          total_amount_paid?: number | null;
          total_payments?: number | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_subscriptions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'physical_product_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_variants: {
        Row: {
          barcode: string | null;
          compare_at_price: number | null;
          cost_per_item: number | null;
          created_at: string | null;
          height: number | null;
          id: string;
          image_url: string | null;
          is_available: boolean | null;
          length: number | null;
          option1_value: string;
          option2_value: string | null;
          option3_value: string | null;
          physical_product_id: string;
          position: number | null;
          price: number;
          quantity: number | null;
          sku: string | null;
          updated_at: string | null;
          weight: number | null;
          width: number | null;
        };
        Insert: {
          barcode?: string | null;
          compare_at_price?: number | null;
          cost_per_item?: number | null;
          created_at?: string | null;
          height?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          length?: number | null;
          option1_value: string;
          option2_value?: string | null;
          option3_value?: string | null;
          physical_product_id: string;
          position?: number | null;
          price: number;
          quantity?: number | null;
          sku?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          width?: number | null;
        };
        Update: {
          barcode?: string | null;
          compare_at_price?: number | null;
          cost_per_item?: number | null;
          created_at?: string | null;
          height?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          length?: number | null;
          option1_value?: string;
          option2_value?: string | null;
          option3_value?: string | null;
          physical_product_id?: string;
          position?: number | null;
          price?: number;
          quantity?: number | null;
          sku?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          width?: number | null;
        };
        Relationships: [];
      };
      physical_product_webhook_logs: {
        Row: {
          attempt_count: number;
          created_at: string;
          duration_ms: number | null;
          error_message: string | null;
          event_id: string | null;
          event_type: string;
          id: string;
          max_attempts: number;
          next_attempt_at: string | null;
          payload: Json;
          response_body: string | null;
          response_status_code: number | null;
          status: string;
          webhook_id: string;
        };
        Insert: {
          attempt_count?: number;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          event_id?: string | null;
          event_type: string;
          id?: string;
          max_attempts?: number;
          next_attempt_at?: string | null;
          payload: Json;
          response_body?: string | null;
          response_status_code?: number | null;
          status?: string;
          webhook_id: string;
        };
        Update: {
          attempt_count?: number;
          created_at?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          event_id?: string | null;
          event_type?: string;
          id?: string;
          max_attempts?: number;
          next_attempt_at?: string | null;
          payload?: Json;
          response_body?: string | null;
          response_status_code?: number | null;
          status?: string;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_webhook_logs_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'physical_product_webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_product_webhooks: {
        Row: {
          created_at: string;
          event_type: string;
          failure_count: number | null;
          id: string;
          is_active: boolean;
          last_triggered_at: string | null;
          secret_key: string;
          store_id: string;
          success_count: number | null;
          target_url: string;
          trigger_count: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          failure_count?: number | null;
          id?: string;
          is_active?: boolean;
          last_triggered_at?: string | null;
          secret_key?: string;
          store_id: string;
          success_count?: number | null;
          target_url: string;
          trigger_count?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          failure_count?: number | null;
          id?: string;
          is_active?: boolean;
          last_triggered_at?: string | null;
          secret_key?: string;
          store_id?: string;
          success_count?: number | null;
          target_url?: string;
          trigger_count?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_product_webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'physical_product_webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'physical_product_webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_products: {
        Row: {
          average_rating: number | null;
          barcode: string | null;
          barcode_type: string | null;
          color: string | null;
          continue_selling_when_out_of_stock: boolean | null;
          country_of_origin: string | null;
          created_at: string | null;
          dimensions_unit: string | null;
          free_shipping: boolean | null;
          fulfillment_service: string | null;
          has_variants: boolean | null;
          height: number | null;
          id: string;
          inventory_policy: string | null;
          length: number | null;
          low_stock_threshold: number | null;
          manufacturer: string | null;
          material: string | null;
          option1_name: string | null;
          option2_name: string | null;
          option3_name: string | null;
          product_id: string;
          requires_shipping: boolean | null;
          shipping_class: string | null;
          sku: string | null;
          total_quantity_sold: number | null;
          total_revenue: number | null;
          track_inventory: boolean | null;
          updated_at: string | null;
          weight: number | null;
          weight_unit: string | null;
          width: number | null;
        };
        Insert: {
          average_rating?: number | null;
          barcode?: string | null;
          barcode_type?: string | null;
          color?: string | null;
          continue_selling_when_out_of_stock?: boolean | null;
          country_of_origin?: string | null;
          created_at?: string | null;
          dimensions_unit?: string | null;
          free_shipping?: boolean | null;
          fulfillment_service?: string | null;
          has_variants?: boolean | null;
          height?: number | null;
          id?: string;
          inventory_policy?: string | null;
          length?: number | null;
          low_stock_threshold?: number | null;
          manufacturer?: string | null;
          material?: string | null;
          option1_name?: string | null;
          option2_name?: string | null;
          option3_name?: string | null;
          product_id: string;
          requires_shipping?: boolean | null;
          shipping_class?: string | null;
          sku?: string | null;
          total_quantity_sold?: number | null;
          total_revenue?: number | null;
          track_inventory?: boolean | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          width?: number | null;
        };
        Update: {
          average_rating?: number | null;
          barcode?: string | null;
          barcode_type?: string | null;
          color?: string | null;
          continue_selling_when_out_of_stock?: boolean | null;
          country_of_origin?: string | null;
          created_at?: string | null;
          dimensions_unit?: string | null;
          free_shipping?: boolean | null;
          fulfillment_service?: string | null;
          has_variants?: boolean | null;
          height?: number | null;
          id?: string;
          inventory_policy?: string | null;
          length?: number | null;
          low_stock_threshold?: number | null;
          manufacturer?: string | null;
          material?: string | null;
          option1_name?: string | null;
          option2_name?: string | null;
          option3_name?: string | null;
          product_id?: string;
          requires_shipping?: boolean | null;
          shipping_class?: string | null;
          sku?: string | null;
          total_quantity_sold?: number | null;
          total_revenue?: number | null;
          track_inventory?: boolean | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'physical_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'physical_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'physical_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      pixel_events: {
        Row: {
          created_at: string;
          event_data: Json | null;
          event_type: string;
          id: string;
          order_id: string | null;
          pixel_id: string;
          product_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          order_id?: string | null;
          pixel_id: string;
          product_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          order_id?: string | null;
          pixel_id?: string;
          product_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pixel_events_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pixel_events_pixel_id_fkey';
            columns: ['pixel_id'];
            isOneToOne: false;
            referencedRelation: 'user_pixels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pixel_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pixel_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'pixel_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'pixel_events_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      platform_commissions: {
        Row: {
          commission_amount: number;
          commission_rate: number;
          created_at: string;
          id: string;
          order_id: string;
          paid_at: string | null;
          status: string;
          store_id: string;
        };
        Insert: {
          commission_amount: number;
          commission_rate: number;
          created_at?: string;
          id?: string;
          order_id: string;
          paid_at?: string | null;
          status?: string;
          store_id: string;
        };
        Update: {
          commission_amount?: number;
          commission_rate?: number;
          created_at?: string;
          id?: string;
          order_id?: string;
          paid_at?: string | null;
          status?: string;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'platform_commissions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'platform_commissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'platform_commissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'platform_commissions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      platform_roles: {
        Row: {
          created_at: string;
          permissions: Json;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          permissions?: Json;
          role: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          permissions?: Json;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          auto_approve_withdrawals: boolean;
          created_at: string;
          email_notifications: boolean;
          id: string;
          key: string;
          min_withdrawal_amount: number;
          platform_commission_rate: number;
          referral_commission_rate: number;
          settings: Json;
          sms_notifications: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          auto_approve_withdrawals?: boolean;
          created_at?: string;
          email_notifications?: boolean;
          id?: string;
          key: string;
          min_withdrawal_amount?: number;
          platform_commission_rate?: number;
          referral_commission_rate?: number;
          settings?: Json;
          sms_notifications?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          auto_approve_withdrawals?: boolean;
          created_at?: string;
          email_notifications?: boolean;
          id?: string;
          key?: string;
          min_withdrawal_amount?: number;
          platform_commission_rate?: number;
          referral_commission_rate?: number;
          settings?: Json;
          sms_notifications?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      pre_order_customers: {
        Row: {
          created_at: string | null;
          customer_id: string;
          deposit_amount: number | null;
          deposit_paid: boolean | null;
          id: string;
          notified: boolean | null;
          order_id: string | null;
          pre_order_id: string;
          quantity: number;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          deposit_amount?: number | null;
          deposit_paid?: boolean | null;
          id?: string;
          notified?: boolean | null;
          order_id?: string | null;
          pre_order_id: string;
          quantity?: number;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          deposit_amount?: number | null;
          deposit_paid?: boolean | null;
          id?: string;
          notified?: boolean | null;
          order_id?: string | null;
          pre_order_id?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'pre_order_customers_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pre_order_customers_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pre_order_customers_pre_order_id_fkey';
            columns: ['pre_order_id'];
            isOneToOne: false;
            referencedRelation: 'pre_orders';
            referencedColumns: ['id'];
          },
        ];
      };
      pre_orders: {
        Row: {
          auto_charge_on_arrival: boolean | null;
          created_at: string | null;
          current_pre_orders: number | null;
          deposit_amount: number | null;
          deposit_percentage: number | null;
          deposit_required: boolean | null;
          expected_availability_date: string | null;
          id: string;
          is_enabled: boolean | null;
          notes: string | null;
          notification_sent: boolean | null;
          pre_order_limit: number | null;
          product_id: string;
          reserved_quantity: number | null;
          status: string;
          store_id: string;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          auto_charge_on_arrival?: boolean | null;
          created_at?: string | null;
          current_pre_orders?: number | null;
          deposit_amount?: number | null;
          deposit_percentage?: number | null;
          deposit_required?: boolean | null;
          expected_availability_date?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          notes?: string | null;
          notification_sent?: boolean | null;
          pre_order_limit?: number | null;
          product_id: string;
          reserved_quantity?: number | null;
          status?: string;
          store_id: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          auto_charge_on_arrival?: boolean | null;
          created_at?: string | null;
          current_pre_orders?: number | null;
          deposit_amount?: number | null;
          deposit_percentage?: number | null;
          deposit_required?: boolean | null;
          expected_availability_date?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          notes?: string | null;
          notification_sent?: boolean | null;
          pre_order_limit?: number | null;
          product_id?: string;
          reserved_quantity?: number | null;
          status?: string;
          store_id?: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pre_orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pre_orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'pre_orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'pre_orders_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pre_orders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'pre_orders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'pre_orders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pre_orders_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      price_alerts: {
        Row: {
          created_at: string;
          currency: string;
          current_price: number;
          id: string;
          notification_sent_at: string | null;
          notified: boolean;
          product_id: string;
          target_price: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          current_price: number;
          id?: string;
          notification_sent_at?: string | null;
          notified?: boolean;
          product_id: string;
          target_price: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          current_price?: number;
          id?: string;
          notification_sent_at?: string | null;
          notified?: boolean;
          product_id?: string;
          target_price?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      price_drop_alerts: {
        Row: {
          alert_sent_at: string | null;
          alert_sent_date: string;
          email_sent: boolean | null;
          id: string;
          new_price: number;
          old_price: number;
          price_drop_percentage: number;
          product_id: string;
          user_id: string;
        };
        Insert: {
          alert_sent_at?: string | null;
          alert_sent_date?: string;
          email_sent?: boolean | null;
          id?: string;
          new_price: number;
          old_price: number;
          price_drop_percentage: number;
          product_id: string;
          user_id: string;
        };
        Update: {
          alert_sent_at?: string | null;
          alert_sent_date?: string;
          email_sent?: boolean | null;
          id?: string;
          new_price?: number;
          old_price?: number;
          price_drop_percentage?: number;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'price_drop_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_drop_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_drop_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_drop_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      price_history: {
        Row: {
          currency: string;
          id: string;
          price: number;
          product_id: string;
          promotional_price: number | null;
          recorded_at: string;
        };
        Insert: {
          currency?: string;
          id?: string;
          price: number;
          product_id: string;
          promotional_price?: number | null;
          recorded_at?: string;
        };
        Update: {
          currency?: string;
          id?: string;
          price?: number;
          product_id?: string;
          promotional_price?: number | null;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      price_optimization_recommendations: {
        Row: {
          calculated_at: string;
          calculated_by: string | null;
          confidence_level: number | null;
          created_at: string;
          current_price: number;
          expected_margin_change: number | null;
          expected_profit_change: number | null;
          expected_revenue_change: number | null;
          expected_volume_change: number | null;
          factors_considered: Json | null;
          id: string;
          implemented_at: string | null;
          implemented_by: string | null;
          notes: string | null;
          price_change_percentage: number | null;
          priority: string | null;
          product_id: string;
          reasoning: Json | null;
          recommendation_type: string;
          recommended_price: number;
          status: string;
          store_id: string;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          calculated_at?: string;
          calculated_by?: string | null;
          confidence_level?: number | null;
          created_at?: string;
          current_price: number;
          expected_margin_change?: number | null;
          expected_profit_change?: number | null;
          expected_revenue_change?: number | null;
          expected_volume_change?: number | null;
          factors_considered?: Json | null;
          id?: string;
          implemented_at?: string | null;
          implemented_by?: string | null;
          notes?: string | null;
          price_change_percentage?: number | null;
          priority?: string | null;
          product_id: string;
          reasoning?: Json | null;
          recommendation_type: string;
          recommended_price: number;
          status?: string;
          store_id: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          calculated_at?: string;
          calculated_by?: string | null;
          confidence_level?: number | null;
          created_at?: string;
          current_price?: number;
          expected_margin_change?: number | null;
          expected_profit_change?: number | null;
          expected_revenue_change?: number | null;
          expected_volume_change?: number | null;
          factors_considered?: Json | null;
          id?: string;
          implemented_at?: string | null;
          implemented_by?: string | null;
          notes?: string | null;
          price_change_percentage?: number | null;
          priority?: string | null;
          product_id?: string;
          reasoning?: Json | null;
          recommendation_type?: string;
          recommended_price?: number;
          status?: string;
          store_id?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'price_optimization_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_optimization_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_optimization_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'price_optimization_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_optimization_recommendations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'price_optimization_recommendations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'price_optimization_recommendations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_optimization_recommendations_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      product_affiliate_settings: {
        Row: {
          affiliate_enabled: boolean;
          allow_self_referral: boolean | null;
          commission_rate: number;
          commission_type: string;
          cookie_duration_days: number;
          created_at: string;
          created_by: string | null;
          fixed_commission_amount: number | null;
          id: string;
          max_commission_per_sale: number | null;
          min_order_amount: number | null;
          product_id: string;
          promotional_materials: Json | null;
          require_approval: boolean | null;
          store_id: string;
          terms_and_conditions: string | null;
          updated_at: string;
        };
        Insert: {
          affiliate_enabled?: boolean;
          allow_self_referral?: boolean | null;
          commission_rate?: number;
          commission_type?: string;
          cookie_duration_days?: number;
          created_at?: string;
          created_by?: string | null;
          fixed_commission_amount?: number | null;
          id?: string;
          max_commission_per_sale?: number | null;
          min_order_amount?: number | null;
          product_id: string;
          promotional_materials?: Json | null;
          require_approval?: boolean | null;
          store_id: string;
          terms_and_conditions?: string | null;
          updated_at?: string;
        };
        Update: {
          affiliate_enabled?: boolean;
          allow_self_referral?: boolean | null;
          commission_rate?: number;
          commission_type?: string;
          cookie_duration_days?: number;
          created_at?: string;
          created_by?: string | null;
          fixed_commission_amount?: number | null;
          id?: string;
          max_commission_per_sale?: number | null;
          min_order_amount?: number | null;
          product_id?: string;
          promotional_materials?: Json | null;
          require_approval?: boolean | null;
          store_id?: string;
          terms_and_conditions?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_affiliate_settings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_affiliate_settings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_affiliate_settings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_affiliate_settings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_affiliate_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_affiliate_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_affiliate_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      product_bundles: {
        Row: {
          allow_customization: boolean | null;
          bundle_discount_type: string | null;
          bundle_price: number;
          created_at: string | null;
          description: string | null;
          discount_amount: number | null;
          discount_percentage: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          max_products: number | null;
          min_products: number | null;
          name: string;
          original_price: number;
          show_individual_prices: boolean | null;
          show_savings: boolean | null;
          store_id: string;
          tiered_discounts: Json | null;
          total_quantity: number | null;
          track_inventory: boolean | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          allow_customization?: boolean | null;
          bundle_discount_type?: string | null;
          bundle_price?: number;
          created_at?: string | null;
          description?: string | null;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          max_products?: number | null;
          min_products?: number | null;
          name: string;
          original_price?: number;
          show_individual_prices?: boolean | null;
          show_savings?: boolean | null;
          store_id: string;
          tiered_discounts?: Json | null;
          total_quantity?: number | null;
          track_inventory?: boolean | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          allow_customization?: boolean | null;
          bundle_discount_type?: string | null;
          bundle_price?: number;
          created_at?: string | null;
          description?: string | null;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          max_products?: number | null;
          min_products?: number | null;
          name?: string;
          original_price?: number;
          show_individual_prices?: boolean | null;
          show_savings?: boolean | null;
          store_id?: string;
          tiered_discounts?: Json | null;
          total_quantity?: number | null;
          track_inventory?: boolean | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      product_costs: {
        Row: {
          cost_basis_date: string;
          cost_of_goods_sold: number;
          cost_source: string | null;
          created_at: string;
          id: string;
          labor_cost: number | null;
          manufacturing_cost: number | null;
          marketing_cost_per_unit: number | null;
          material_cost: number | null;
          notes: string | null;
          overhead_cost: number | null;
          packaging_cost: number | null;
          payment_processing_fees_percentage: number | null;
          platform_fees_percentage: number | null;
          product_id: string;
          shipping_cost_per_unit: number | null;
          storage_cost_per_unit: number | null;
          store_id: string;
          tax_rate: number | null;
          total_cost_per_unit: number | null;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          cost_basis_date?: string;
          cost_of_goods_sold?: number;
          cost_source?: string | null;
          created_at?: string;
          id?: string;
          labor_cost?: number | null;
          manufacturing_cost?: number | null;
          marketing_cost_per_unit?: number | null;
          material_cost?: number | null;
          notes?: string | null;
          overhead_cost?: number | null;
          packaging_cost?: number | null;
          payment_processing_fees_percentage?: number | null;
          platform_fees_percentage?: number | null;
          product_id: string;
          shipping_cost_per_unit?: number | null;
          storage_cost_per_unit?: number | null;
          store_id: string;
          tax_rate?: number | null;
          total_cost_per_unit?: number | null;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          cost_basis_date?: string;
          cost_of_goods_sold?: number;
          cost_source?: string | null;
          created_at?: string;
          id?: string;
          labor_cost?: number | null;
          manufacturing_cost?: number | null;
          marketing_cost_per_unit?: number | null;
          material_cost?: number | null;
          notes?: string | null;
          overhead_cost?: number | null;
          packaging_cost?: number | null;
          payment_processing_fees_percentage?: number | null;
          platform_fees_percentage?: number | null;
          product_id?: string;
          shipping_cost_per_unit?: number | null;
          storage_cost_per_unit?: number | null;
          store_id?: string;
          tax_rate?: number | null;
          total_cost_per_unit?: number | null;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_costs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_costs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_costs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_costs_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_costs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_costs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_costs_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_costs_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          id: string;
          image_url: string;
          is_primary: boolean | null;
          product_id: string;
          sort_order: number | null;
          variant_id: string | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          is_primary?: boolean | null;
          product_id: string;
          sort_order?: number | null;
          variant_id?: string | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          is_primary?: boolean | null;
          product_id?: string;
          sort_order?: number | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_kits: {
        Row: {
          assembly_instructions: string | null;
          assembly_required: boolean | null;
          assembly_time_minutes: number | null;
          auto_allocate: boolean | null;
          created_at: string;
          discount_amount: number | null;
          discount_percentage: number | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          kit_description: string | null;
          kit_name: string;
          kit_price: number | null;
          kit_product_id: string;
          kit_type: string;
          max_items: number | null;
          min_items: number | null;
          requires_assembly: boolean | null;
          store_id: string;
          track_components_inventory: boolean | null;
          track_kit_inventory: boolean | null;
          updated_at: string;
        };
        Insert: {
          assembly_instructions?: string | null;
          assembly_required?: boolean | null;
          assembly_time_minutes?: number | null;
          auto_allocate?: boolean | null;
          created_at?: string;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          kit_description?: string | null;
          kit_name: string;
          kit_price?: number | null;
          kit_product_id: string;
          kit_type?: string;
          max_items?: number | null;
          min_items?: number | null;
          requires_assembly?: boolean | null;
          store_id: string;
          track_components_inventory?: boolean | null;
          track_kit_inventory?: boolean | null;
          updated_at?: string;
        };
        Update: {
          assembly_instructions?: string | null;
          assembly_required?: boolean | null;
          assembly_time_minutes?: number | null;
          auto_allocate?: boolean | null;
          created_at?: string;
          discount_amount?: number | null;
          discount_percentage?: number | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          kit_description?: string | null;
          kit_name?: string;
          kit_price?: number | null;
          kit_product_id?: string;
          kit_type?: string;
          max_items?: number | null;
          min_items?: number | null;
          requires_assembly?: boolean | null;
          store_id?: string;
          track_components_inventory?: boolean | null;
          track_kit_inventory?: boolean | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_kits_kit_product_id_fkey';
            columns: ['kit_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_kits_kit_product_id_fkey';
            columns: ['kit_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_kits_kit_product_id_fkey';
            columns: ['kit_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_kits_kit_product_id_fkey';
            columns: ['kit_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_kits_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_kits_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_kits_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      product_lots: {
        Row: {
          batch_number: string | null;
          best_before_date: string | null;
          bin_location: string | null;
          certificate_of_analysis: string | null;
          created_at: string | null;
          current_quantity: number;
          expiration_date: string | null;
          id: string;
          initial_quantity: number;
          inspection_date: string | null;
          inspection_notes: string | null;
          inspector_id: string | null;
          lot_number: string;
          manufacturing_date: string | null;
          notes: string | null;
          physical_product_id: string;
          quality_status: string | null;
          received_date: string | null;
          reserved_quantity: number | null;
          rotation_method: string | null;
          serial_number: string | null;
          shelf_location: string | null;
          status: string;
          supplier_batch_number: string | null;
          total_cost: number | null;
          unit_cost: number | null;
          updated_at: string | null;
          variant_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          batch_number?: string | null;
          best_before_date?: string | null;
          bin_location?: string | null;
          certificate_of_analysis?: string | null;
          created_at?: string | null;
          current_quantity?: number;
          expiration_date?: string | null;
          id?: string;
          initial_quantity?: number;
          inspection_date?: string | null;
          inspection_notes?: string | null;
          inspector_id?: string | null;
          lot_number: string;
          manufacturing_date?: string | null;
          notes?: string | null;
          physical_product_id: string;
          quality_status?: string | null;
          received_date?: string | null;
          reserved_quantity?: number | null;
          rotation_method?: string | null;
          serial_number?: string | null;
          shelf_location?: string | null;
          status?: string;
          supplier_batch_number?: string | null;
          total_cost?: number | null;
          unit_cost?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          batch_number?: string | null;
          best_before_date?: string | null;
          bin_location?: string | null;
          certificate_of_analysis?: string | null;
          created_at?: string | null;
          current_quantity?: number;
          expiration_date?: string | null;
          id?: string;
          initial_quantity?: number;
          inspection_date?: string | null;
          inspection_notes?: string | null;
          inspector_id?: string | null;
          lot_number?: string;
          manufacturing_date?: string | null;
          notes?: string | null;
          physical_product_id?: string;
          quality_status?: string | null;
          received_date?: string | null;
          reserved_quantity?: number | null;
          rotation_method?: string | null;
          serial_number?: string | null;
          shelf_location?: string | null;
          status?: string;
          supplier_batch_number?: string | null;
          total_cost?: number | null;
          unit_cost?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_lots_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_lots_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'product_lots_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'product_lots_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_lots_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      product_promotions: {
        Row: {
          applies_to: string;
          applies_to_variants: boolean | null;
          category_ids: string[] | null;
          code: string | null;
          collection_ids: string[] | null;
          created_at: string | null;
          current_uses: number | null;
          description: string | null;
          discount_type: string;
          discount_value: number;
          ends_at: string | null;
          id: string;
          is_active: boolean | null;
          is_automatic: boolean | null;
          max_uses: number | null;
          max_uses_per_customer: number | null;
          min_purchase_amount: number | null;
          min_quantity: number | null;
          name: string;
          product_ids: string[] | null;
          starts_at: string;
          store_id: string;
          updated_at: string | null;
          variant_ids: string[] | null;
        };
        Insert: {
          applies_to?: string;
          applies_to_variants?: boolean | null;
          category_ids?: string[] | null;
          code?: string | null;
          collection_ids?: string[] | null;
          created_at?: string | null;
          current_uses?: number | null;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_automatic?: boolean | null;
          max_uses?: number | null;
          max_uses_per_customer?: number | null;
          min_purchase_amount?: number | null;
          min_quantity?: number | null;
          name: string;
          product_ids?: string[] | null;
          starts_at: string;
          store_id: string;
          updated_at?: string | null;
          variant_ids?: string[] | null;
        };
        Update: {
          applies_to?: string;
          applies_to_variants?: boolean | null;
          category_ids?: string[] | null;
          code?: string | null;
          collection_ids?: string[] | null;
          created_at?: string | null;
          current_uses?: number | null;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_automatic?: boolean | null;
          max_uses?: number | null;
          max_uses_per_customer?: number | null;
          min_purchase_amount?: number | null;
          min_quantity?: number | null;
          name?: string;
          product_ids?: string[] | null;
          starts_at?: string;
          store_id?: string;
          updated_at?: string | null;
          variant_ids?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_promotions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_promotions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_promotions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      product_returns: {
        Row: {
          action_description: string | null;
          action_taken: string | null;
          approved_at: string | null;
          created_at: string;
          customer_id: string;
          customer_notes: string | null;
          customer_notified: boolean | null;
          customer_photos: string[] | null;
          id: string;
          inspected_at: string | null;
          inspected_by: string | null;
          inspection_notes: string | null;
          inspection_result: string | null;
          internal_notes: string | null;
          item_price: number;
          order_id: string;
          order_item_id: string | null;
          product_id: string;
          quantity: number;
          received_at: string | null;
          refund_amount: number | null;
          refund_method: string | null;
          refund_status: string | null;
          refund_transaction_id: string | null;
          refund_type: string | null;
          refunded_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          requested_at: string;
          return_carrier: string | null;
          return_number: string;
          return_reason: string;
          return_reason_details: string | null;
          return_shipping_address: Json | null;
          return_shipping_cost: number | null;
          return_shipping_paid_by: string | null;
          return_tracking_number: string | null;
          status: string;
          store_id: string;
          store_notes: string | null;
          store_notified: boolean | null;
          store_photos: string[] | null;
          total_amount: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          action_description?: string | null;
          action_taken?: string | null;
          approved_at?: string | null;
          created_at?: string;
          customer_id: string;
          customer_notes?: string | null;
          customer_notified?: boolean | null;
          customer_photos?: string[] | null;
          id?: string;
          inspected_at?: string | null;
          inspected_by?: string | null;
          inspection_notes?: string | null;
          inspection_result?: string | null;
          internal_notes?: string | null;
          item_price: number;
          order_id: string;
          order_item_id?: string | null;
          product_id: string;
          quantity?: number;
          received_at?: string | null;
          refund_amount?: number | null;
          refund_method?: string | null;
          refund_status?: string | null;
          refund_transaction_id?: string | null;
          refund_type?: string | null;
          refunded_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          requested_at?: string;
          return_carrier?: string | null;
          return_number: string;
          return_reason: string;
          return_reason_details?: string | null;
          return_shipping_address?: Json | null;
          return_shipping_cost?: number | null;
          return_shipping_paid_by?: string | null;
          return_tracking_number?: string | null;
          status?: string;
          store_id: string;
          store_notes?: string | null;
          store_notified?: boolean | null;
          store_photos?: string[] | null;
          total_amount: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          action_description?: string | null;
          action_taken?: string | null;
          approved_at?: string | null;
          created_at?: string;
          customer_id?: string;
          customer_notes?: string | null;
          customer_notified?: boolean | null;
          customer_photos?: string[] | null;
          id?: string;
          inspected_at?: string | null;
          inspected_by?: string | null;
          inspection_notes?: string | null;
          inspection_result?: string | null;
          internal_notes?: string | null;
          item_price?: number;
          order_id?: string;
          order_item_id?: string | null;
          product_id?: string;
          quantity?: number;
          received_at?: string | null;
          refund_amount?: number | null;
          refund_method?: string | null;
          refund_status?: string | null;
          refund_transaction_id?: string | null;
          refund_type?: string | null;
          refunded_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          requested_at?: string;
          return_carrier?: string | null;
          return_number?: string;
          return_reason?: string;
          return_reason_details?: string | null;
          return_shipping_address?: Json | null;
          return_shipping_cost?: number | null;
          return_shipping_paid_by?: string | null;
          return_tracking_number?: string | null;
          status?: string;
          store_id?: string;
          store_notes?: string | null;
          store_notified?: boolean | null;
          store_photos?: string[] | null;
          total_amount?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_returns_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_returns_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_returns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_returns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_returns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_returns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_returns_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_returns_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_returns_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      product_size_charts: {
        Row: {
          created_at: string | null;
          product_id: string;
          size_chart_id: string;
        };
        Insert: {
          created_at?: string | null;
          product_id: string;
          size_chart_id: string;
        };
        Update: {
          created_at?: string | null;
          product_id?: string;
          size_chart_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_size_charts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_size_charts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_size_charts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_size_charts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_size_charts_size_chart_id_fkey';
            columns: ['size_chart_id'];
            isOneToOne: false;
            referencedRelation: 'size_charts';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          barcode: string | null;
          compare_at_price: number | null;
          cost_per_item: number | null;
          created_at: string | null;
          height: number | null;
          id: string;
          image_url: string | null;
          is_available: boolean | null;
          length: number | null;
          option1_value: string;
          option2_value: string | null;
          option3_value: string | null;
          physical_product_id: string;
          position: number | null;
          price: number;
          promotion_ends_at: string | null;
          promotion_id: string | null;
          promotion_starts_at: string | null;
          promotional_price: number | null;
          quantity: number | null;
          sku: string | null;
          updated_at: string | null;
          weight: number | null;
          width: number | null;
        };
        Insert: {
          barcode?: string | null;
          compare_at_price?: number | null;
          cost_per_item?: number | null;
          created_at?: string | null;
          height?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          length?: number | null;
          option1_value: string;
          option2_value?: string | null;
          option3_value?: string | null;
          physical_product_id: string;
          position?: number | null;
          price: number;
          promotion_ends_at?: string | null;
          promotion_id?: string | null;
          promotion_starts_at?: string | null;
          promotional_price?: number | null;
          quantity?: number | null;
          sku?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          width?: number | null;
        };
        Update: {
          barcode?: string | null;
          compare_at_price?: number | null;
          cost_per_item?: number | null;
          created_at?: string | null;
          height?: number | null;
          id?: string;
          image_url?: string | null;
          is_available?: boolean | null;
          length?: number | null;
          option1_value?: string;
          option2_value?: string | null;
          option3_value?: string | null;
          physical_product_id?: string;
          position?: number | null;
          price?: number;
          promotion_ends_at?: string | null;
          promotion_id?: string | null;
          promotion_starts_at?: string | null;
          promotional_price?: number | null;
          quantity?: number | null;
          sku?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variants_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'product_variants_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'product_variants_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'product_promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      product_versions: {
        Row: {
          breaking_changes: Json | null;
          bug_fixes: Json | null;
          changelog_markdown: string | null;
          changelog_title: string | null;
          created_at: string | null;
          customers_notified: number | null;
          download_count: number | null;
          download_url: string;
          file_checksum: string | null;
          file_size_mb: number | null;
          id: string;
          is_beta: boolean | null;
          is_major_update: boolean | null;
          is_security_update: boolean | null;
          minimum_version: string | null;
          notification_sent_at: string | null;
          notify_customers: boolean | null;
          previous_version_id: string | null;
          product_id: string;
          release_date: string | null;
          rollback_metrics: Json | null;
          rollback_min_downloads: number | null;
          rollback_reason: string | null;
          rollback_status: string | null;
          rollback_threshold_percentage: number | null;
          rolled_back_at: string | null;
          rolled_back_to_version_id: string | null;
          status: Database['public']['Enums']['version_status'] | null;
          store_id: string;
          updated_at: string | null;
          version_name: string | null;
          version_number: string;
          whats_new: Json | null;
        };
        Insert: {
          breaking_changes?: Json | null;
          bug_fixes?: Json | null;
          changelog_markdown?: string | null;
          changelog_title?: string | null;
          created_at?: string | null;
          customers_notified?: number | null;
          download_count?: number | null;
          download_url: string;
          file_checksum?: string | null;
          file_size_mb?: number | null;
          id?: string;
          is_beta?: boolean | null;
          is_major_update?: boolean | null;
          is_security_update?: boolean | null;
          minimum_version?: string | null;
          notification_sent_at?: string | null;
          notify_customers?: boolean | null;
          previous_version_id?: string | null;
          product_id: string;
          release_date?: string | null;
          rollback_metrics?: Json | null;
          rollback_min_downloads?: number | null;
          rollback_reason?: string | null;
          rollback_status?: string | null;
          rollback_threshold_percentage?: number | null;
          rolled_back_at?: string | null;
          rolled_back_to_version_id?: string | null;
          status?: Database['public']['Enums']['version_status'] | null;
          store_id: string;
          updated_at?: string | null;
          version_name?: string | null;
          version_number: string;
          whats_new?: Json | null;
        };
        Update: {
          breaking_changes?: Json | null;
          bug_fixes?: Json | null;
          changelog_markdown?: string | null;
          changelog_title?: string | null;
          created_at?: string | null;
          customers_notified?: number | null;
          download_count?: number | null;
          download_url?: string;
          file_checksum?: string | null;
          file_size_mb?: number | null;
          id?: string;
          is_beta?: boolean | null;
          is_major_update?: boolean | null;
          is_security_update?: boolean | null;
          minimum_version?: string | null;
          notification_sent_at?: string | null;
          notify_customers?: boolean | null;
          previous_version_id?: string | null;
          product_id?: string;
          release_date?: string | null;
          rollback_metrics?: Json | null;
          rollback_min_downloads?: number | null;
          rollback_reason?: string | null;
          rollback_status?: string | null;
          rollback_threshold_percentage?: number | null;
          rolled_back_at?: string | null;
          rolled_back_to_version_id?: string | null;
          status?: Database['public']['Enums']['version_status'] | null;
          store_id?: string;
          updated_at?: string | null;
          version_name?: string | null;
          version_number?: string;
          whats_new?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_versions_previous_version_id_fkey';
            columns: ['previous_version_id'];
            isOneToOne: false;
            referencedRelation: 'product_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_versions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_versions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_versions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_versions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_versions_rolled_back_to_version_id_fkey';
            columns: ['rolled_back_to_version_id'];
            isOneToOne: false;
            referencedRelation: 'product_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_versions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_versions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_versions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      product_warranties: {
        Row: {
          conditions: string | null;
          coverage_details: Json | null;
          coverage_type: string;
          created_at: string;
          description: string | null;
          duration_months: number;
          exclusions: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          product_id: string;
          requires_invoice: boolean | null;
          requires_registration: boolean | null;
          starts_from: string | null;
          store_id: string;
          support_contact: string | null;
          support_email: string | null;
          support_phone: string | null;
          terms_url: string | null;
          transfer_fee: number | null;
          transferable: boolean | null;
          updated_at: string;
          variant_id: string | null;
          warranty_name: string;
          warranty_type: string;
        };
        Insert: {
          conditions?: string | null;
          coverage_details?: Json | null;
          coverage_type: string;
          created_at?: string;
          description?: string | null;
          duration_months: number;
          exclusions?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          product_id: string;
          requires_invoice?: boolean | null;
          requires_registration?: boolean | null;
          starts_from?: string | null;
          store_id: string;
          support_contact?: string | null;
          support_email?: string | null;
          support_phone?: string | null;
          terms_url?: string | null;
          transfer_fee?: number | null;
          transferable?: boolean | null;
          updated_at?: string;
          variant_id?: string | null;
          warranty_name: string;
          warranty_type: string;
        };
        Update: {
          conditions?: string | null;
          coverage_details?: Json | null;
          coverage_type?: string;
          created_at?: string;
          description?: string | null;
          duration_months?: number;
          exclusions?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          product_id?: string;
          requires_invoice?: boolean | null;
          requires_registration?: boolean | null;
          starts_from?: string | null;
          store_id?: string;
          support_contact?: string | null;
          support_email?: string | null;
          support_phone?: string | null;
          terms_url?: string | null;
          transfer_fee?: number | null;
          transferable?: boolean | null;
          updated_at?: string;
          variant_id?: string | null;
          warranty_name?: string;
          warranty_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_warranties_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_warranties_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_warranties_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'product_warranties_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_warranties_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_warranties_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'product_warranties_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_warranties_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          automatic_discount_enabled: boolean | null;
          category: string | null;
          category_id: string | null;
          collect_shipping_address: boolean | null;
          created_at: string;
          currency: string;
          custom_fields: Json | null;
          description: string | null;
          digital_file_url: string | null;
          dimensions: Json | null;
          discount_trigger: string | null;
          downloadable_files: Json | null;
          faqs: Json | null;
          free_product_id: string | null;
          fts: unknown;
          gallery: string[] | null;
          hide_from_store: boolean | null;
          hide_purchase_count: boolean | null;
          id: string;
          image_url: string | null;
          images: Json | null;
          is_active: boolean;
          is_draft: boolean | null;
          is_featured: boolean | null;
          is_free_preview: boolean | null;
          license_terms: string | null;
          licensing_type: string | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          og_image: string | null;
          paid_product_id: string | null;
          password_protected: boolean | null;
          payment_option_usage_count: number | null;
          payment_options: Json | null;
          post_purchase_guide_url: string | null;
          preview_content_description: string | null;
          price: number;
          pricing_model: Database['public']['Enums']['pricing_model'] | null;
          product_password: string | null;
          product_type: string | null;
          promotional_price: number | null;
          purchase_limit: number | null;
          rating: number | null;
          reviews_count: number | null;
          sale_end_date: string | null;
          sale_start_date: string | null;
          seo_description: string | null;
          seo_keywords: string | null;
          seo_title: string | null;
          short_description: string | null;
          slug: string;
          stock: number | null;
          store_id: string;
          tags: string[] | null;
          updated_at: string;
          watermark_enabled: boolean | null;
          weight: number | null;
        };
        Insert: {
          automatic_discount_enabled?: boolean | null;
          category?: string | null;
          category_id?: string | null;
          collect_shipping_address?: boolean | null;
          created_at?: string;
          currency?: string;
          custom_fields?: Json | null;
          description?: string | null;
          digital_file_url?: string | null;
          dimensions?: Json | null;
          discount_trigger?: string | null;
          downloadable_files?: Json | null;
          faqs?: Json | null;
          free_product_id?: string | null;
          fts?: unknown;
          gallery?: string[] | null;
          hide_from_store?: boolean | null;
          hide_purchase_count?: boolean | null;
          id?: string;
          image_url?: string | null;
          images?: Json | null;
          is_active?: boolean;
          is_draft?: boolean | null;
          is_featured?: boolean | null;
          is_free_preview?: boolean | null;
          license_terms?: string | null;
          licensing_type?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          og_image?: string | null;
          paid_product_id?: string | null;
          password_protected?: boolean | null;
          payment_option_usage_count?: number | null;
          payment_options?: Json | null;
          post_purchase_guide_url?: string | null;
          preview_content_description?: string | null;
          price?: number;
          pricing_model?: Database['public']['Enums']['pricing_model'] | null;
          product_password?: string | null;
          product_type?: string | null;
          promotional_price?: number | null;
          purchase_limit?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          sale_end_date?: string | null;
          sale_start_date?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug: string;
          stock?: number | null;
          store_id: string;
          tags?: string[] | null;
          updated_at?: string;
          watermark_enabled?: boolean | null;
          weight?: number | null;
        };
        Update: {
          automatic_discount_enabled?: boolean | null;
          category?: string | null;
          category_id?: string | null;
          collect_shipping_address?: boolean | null;
          created_at?: string;
          currency?: string;
          custom_fields?: Json | null;
          description?: string | null;
          digital_file_url?: string | null;
          dimensions?: Json | null;
          discount_trigger?: string | null;
          downloadable_files?: Json | null;
          faqs?: Json | null;
          free_product_id?: string | null;
          fts?: unknown;
          gallery?: string[] | null;
          hide_from_store?: boolean | null;
          hide_purchase_count?: boolean | null;
          id?: string;
          image_url?: string | null;
          images?: Json | null;
          is_active?: boolean;
          is_draft?: boolean | null;
          is_featured?: boolean | null;
          is_free_preview?: boolean | null;
          license_terms?: string | null;
          licensing_type?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          og_image?: string | null;
          paid_product_id?: string | null;
          password_protected?: boolean | null;
          payment_option_usage_count?: number | null;
          payment_options?: Json | null;
          post_purchase_guide_url?: string | null;
          preview_content_description?: string | null;
          price?: number;
          pricing_model?: Database['public']['Enums']['pricing_model'] | null;
          product_password?: string | null;
          product_type?: string | null;
          promotional_price?: number | null;
          purchase_limit?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          sale_end_date?: string | null;
          sale_start_date?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          slug?: string;
          stock?: number | null;
          store_id?: string;
          tags?: string[] | null;
          updated_at?: string;
          watermark_enabled?: boolean | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_free_product_id_fkey';
            columns: ['free_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_paid_product_id_fkey';
            columns: ['paid_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_paid_product_id_fkey';
            columns: ['paid_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_paid_product_id_fkey';
            columns: ['paid_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'products_paid_product_id_fkey';
            columns: ['paid_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          digital_preferences: Json | null;
          display_name: string | null;
          first_name: string | null;
          id: string;
          is_super_admin: boolean | null;
          is_suspended: boolean | null;
          last_name: string | null;
          location: string | null;
          payment_provider_preference: string | null;
          phone: string | null;
          referral_code: string | null;
          referred_by: string | null;
          role: string | null;
          suspended_at: string | null;
          suspended_by: string | null;
          suspension_reason: string | null;
          total_referral_earnings: number | null;
          updated_at: string;
          user_id: string;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          digital_preferences?: Json | null;
          display_name?: string | null;
          first_name?: string | null;
          id?: string;
          is_super_admin?: boolean | null;
          is_suspended?: boolean | null;
          last_name?: string | null;
          location?: string | null;
          payment_provider_preference?: string | null;
          phone?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspension_reason?: string | null;
          total_referral_earnings?: number | null;
          updated_at?: string;
          user_id: string;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          digital_preferences?: Json | null;
          display_name?: string | null;
          first_name?: string | null;
          id?: string;
          is_super_admin?: boolean | null;
          is_suspended?: boolean | null;
          last_name?: string | null;
          location?: string | null;
          payment_provider_preference?: string | null;
          phone?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          role?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspension_reason?: string | null;
          total_referral_earnings?: number | null;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      promotion_usage: {
        Row: {
          customer_id: string | null;
          discount_amount: number;
          id: string;
          order_id: string | null;
          order_total_after_discount: number;
          order_total_before_discount: number;
          promotion_id: string;
          used_at: string | null;
          user_id: string | null;
        };
        Insert: {
          customer_id?: string | null;
          discount_amount: number;
          id?: string;
          order_id?: string | null;
          order_total_after_discount: number;
          order_total_before_discount: number;
          promotion_id: string;
          used_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          customer_id?: string | null;
          discount_amount?: number;
          id?: string;
          order_id?: string | null;
          order_total_after_discount?: number;
          order_total_before_discount?: number;
          promotion_id?: string;
          used_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promotion_usage_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'promotion_usage_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'promotion_usage_promotion_id_fkey';
            columns: ['promotion_id'];
            isOneToOne: false;
            referencedRelation: 'product_promotions';
            referencedColumns: ['id'];
          },
        ];
      };
      promotions: {
        Row: {
          applicable_to_product_ids: string[] | null;
          applicable_to_product_types: string[] | null;
          code: string;
          created_at: string;
          customer_eligibility: string | null;
          description: string | null;
          discount_type: string;
          discount_value: number;
          end_date: string | null;
          id: string;
          is_active: boolean;
          is_platform_wide: boolean | null;
          max_uses: number | null;
          max_uses_per_user: number | null;
          min_purchase_amount: number | null;
          start_date: string | null;
          store_id: string;
          updated_at: string;
          used_count: number | null;
        };
        Insert: {
          applicable_to_product_ids?: string[] | null;
          applicable_to_product_types?: string[] | null;
          code: string;
          created_at?: string;
          customer_eligibility?: string | null;
          description?: string | null;
          discount_type?: string;
          discount_value: number;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          is_platform_wide?: boolean | null;
          max_uses?: number | null;
          max_uses_per_user?: number | null;
          min_purchase_amount?: number | null;
          start_date?: string | null;
          store_id: string;
          updated_at?: string;
          used_count?: number | null;
        };
        Update: {
          applicable_to_product_ids?: string[] | null;
          applicable_to_product_types?: string[] | null;
          code?: string;
          created_at?: string;
          customer_eligibility?: string | null;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          end_date?: string | null;
          id?: string;
          is_active?: boolean;
          is_platform_wide?: boolean | null;
          max_uses?: number | null;
          max_uses_per_user?: number | null;
          min_purchase_amount?: number | null;
          start_date?: string | null;
          store_id?: string;
          updated_at?: string;
          used_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promotions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'promotions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'promotions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          created_at: string | null;
          device_info: Json | null;
          endpoint: string;
          id: string;
          is_active: boolean | null;
          keys: Json;
          last_used_at: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          device_info?: Json | null;
          endpoint: string;
          id?: string;
          is_active?: boolean | null;
          keys: Json;
          last_used_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          device_info?: Json | null;
          endpoint?: string;
          id?: string;
          is_active?: boolean | null;
          keys?: Json;
          last_used_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          answers: Json;
          completed_at: string;
          correct_answers: number;
          created_at: string;
          enrollment_id: string;
          id: string;
          passed: boolean;
          quiz_id: string;
          score: number;
          started_at: string;
          time_taken_seconds: number | null;
          total_questions: number;
          user_id: string;
        };
        Insert: {
          answers: Json;
          completed_at: string;
          correct_answers: number;
          created_at?: string;
          enrollment_id: string;
          id?: string;
          passed: boolean;
          quiz_id: string;
          score: number;
          started_at: string;
          time_taken_seconds?: number | null;
          total_questions: number;
          user_id: string;
        };
        Update: {
          answers?: Json;
          completed_at?: string;
          correct_answers?: number;
          created_at?: string;
          enrollment_id?: string;
          id?: string;
          passed?: boolean;
          quiz_id?: string;
          score?: number;
          started_at?: string;
          time_taken_seconds?: number | null;
          total_questions?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_enrollments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quiz_attempts_enrollment_id_fkey';
            columns: ['enrollment_id'];
            isOneToOne: false;
            referencedRelation: 'course_section_unlock_status';
            referencedColumns: ['enrollment_id'];
          },
          {
            foreignKeyName: 'quiz_attempts_quiz_id_fkey';
            columns: ['quiz_id'];
            isOneToOne: false;
            referencedRelation: 'course_quizzes';
            referencedColumns: ['id'];
          },
        ];
      };
      rate_limit_log: {
        Row: {
          created_at: string;
          endpoint: string;
          id: string;
          ip_address: string;
          request_path: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          endpoint: string;
          id?: string;
          ip_address: string;
          request_path?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          endpoint?: string;
          id?: string;
          ip_address?: string;
          request_path?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      recurring_booking_patterns: {
        Row: {
          created_at: string;
          created_occurrences: number | null;
          customer_notes: string | null;
          date_limit: string | null;
          day_of_month: number | null;
          days_of_week: number[] | null;
          duration_minutes: number;
          end_date: string | null;
          id: string;
          interval_days: number | null;
          notes: string | null;
          occurrence_limit: number | null;
          product_id: string;
          recurrence_type: string;
          skipped_occurrences: number | null;
          staff_member_id: string | null;
          start_date: string;
          start_time: string;
          status: string;
          timezone: string;
          title: string | null;
          total_occurrences: number | null;
          updated_at: string;
          user_id: string;
          week_of_month: number | null;
        };
        Insert: {
          created_at?: string;
          created_occurrences?: number | null;
          customer_notes?: string | null;
          date_limit?: string | null;
          day_of_month?: number | null;
          days_of_week?: number[] | null;
          duration_minutes: number;
          end_date?: string | null;
          id?: string;
          interval_days?: number | null;
          notes?: string | null;
          occurrence_limit?: number | null;
          product_id: string;
          recurrence_type: string;
          skipped_occurrences?: number | null;
          staff_member_id?: string | null;
          start_date: string;
          start_time: string;
          status?: string;
          timezone?: string;
          title?: string | null;
          total_occurrences?: number | null;
          updated_at?: string;
          user_id: string;
          week_of_month?: number | null;
        };
        Update: {
          created_at?: string;
          created_occurrences?: number | null;
          customer_notes?: string | null;
          date_limit?: string | null;
          day_of_month?: number | null;
          days_of_week?: number[] | null;
          duration_minutes?: number;
          end_date?: string | null;
          id?: string;
          interval_days?: number | null;
          notes?: string | null;
          occurrence_limit?: number | null;
          product_id?: string;
          recurrence_type?: string;
          skipped_occurrences?: number | null;
          staff_member_id?: string | null;
          start_date?: string;
          start_time?: string;
          status?: string;
          timezone?: string;
          title?: string | null;
          total_occurrences?: number | null;
          updated_at?: string;
          user_id?: string;
          week_of_month?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_booking_patterns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_booking_patterns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'recurring_booking_patterns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'recurring_booking_patterns_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_booking_patterns_staff_member_id_fkey';
            columns: ['staff_member_id'];
            isOneToOne: false;
            referencedRelation: 'service_staff_members';
            referencedColumns: ['id'];
          },
        ];
      };
      recurring_bookings_series: {
        Row: {
          cancelled_bookings: number | null;
          completed_bookings: number | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          parent_booking_id: string;
          recurrence_count: number | null;
          recurrence_day_of_month: number | null;
          recurrence_days_of_week: number[] | null;
          recurrence_end_date: string | null;
          recurrence_exceptions: string[] | null;
          recurrence_interval: number | null;
          recurrence_pattern: string;
          service_product_id: string;
          store_id: string;
          total_bookings: number | null;
          updated_at: string | null;
        };
        Insert: {
          cancelled_bookings?: number | null;
          completed_bookings?: number | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          parent_booking_id: string;
          recurrence_count?: number | null;
          recurrence_day_of_month?: number | null;
          recurrence_days_of_week?: number[] | null;
          recurrence_end_date?: string | null;
          recurrence_exceptions?: string[] | null;
          recurrence_interval?: number | null;
          recurrence_pattern: string;
          service_product_id: string;
          store_id: string;
          total_bookings?: number | null;
          updated_at?: string | null;
        };
        Update: {
          cancelled_bookings?: number | null;
          completed_bookings?: number | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          parent_booking_id?: string;
          recurrence_count?: number | null;
          recurrence_day_of_month?: number | null;
          recurrence_days_of_week?: number[] | null;
          recurrence_end_date?: string | null;
          recurrence_exceptions?: string[] | null;
          recurrence_interval?: number | null;
          recurrence_pattern?: string;
          service_product_id?: string;
          store_id?: string;
          total_bookings?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_bookings_series_parent_booking_id_fkey';
            columns: ['parent_booking_id'];
            isOneToOne: false;
            referencedRelation: 'service_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_bookings_series_service_product_id_fkey';
            columns: ['service_product_id'];
            isOneToOne: false;
            referencedRelation: 'service_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_bookings_series_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'recurring_bookings_series_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'recurring_bookings_series_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      referral_history: {
        Row: {
          amount: number;
          created_at: string;
          description: string;
          id: string;
          referred_user_id: string;
          referrer_id: string;
          type: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          description: string;
          id?: string;
          referred_user_id: string;
          referrer_id: string;
          type: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string;
          id?: string;
          referred_user_id?: string;
          referrer_id?: string;
          type?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          created_at: string;
          id: string;
          referral_code: string;
          referred_id: string;
          referrer_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          referral_code: string;
          referred_id: string;
          referrer_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          referral_code?: string;
          referred_id?: string;
          referrer_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      region_performance_metrics: {
        Row: {
          id: string;
          metadata: Json | null;
          metric_type: string;
          metric_value: number;
          region: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          metadata?: Json | null;
          metric_type: string;
          metric_value: number;
          region: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          metadata?: Json | null;
          metric_type?: string;
          metric_value?: number;
          region?: string;
          timestamp?: string;
        };
        Relationships: [];
      };
      regional_prices: {
        Row: {
          country_codes: string[] | null;
          created_at: string | null;
          currency_code: string;
          id: string;
          is_active: boolean | null;
          price: number;
          priority: number | null;
          product_id: string;
          promotional_price: number | null;
          region: string | null;
          updated_at: string | null;
        };
        Insert: {
          country_codes?: string[] | null;
          created_at?: string | null;
          currency_code: string;
          id?: string;
          is_active?: boolean | null;
          price: number;
          priority?: number | null;
          product_id: string;
          promotional_price?: number | null;
          region?: string | null;
          updated_at?: string | null;
        };
        Update: {
          country_codes?: string[] | null;
          created_at?: string | null;
          currency_code?: string;
          id?: string;
          is_active?: boolean | null;
          price?: number;
          priority?: number | null;
          product_id?: string;
          promotional_price?: number | null;
          region?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'regional_prices_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'currencies';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'regional_prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'regional_prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'regional_prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'regional_prices_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      reorder_recommendations: {
        Row: {
          calculated_at: string;
          calculated_by: string | null;
          created_at: string;
          current_stock: number;
          days_until_stockout: number | null;
          estimated_cost: number | null;
          estimated_delivery_days: number | null;
          forecasted_demand: number;
          id: string;
          notes: string | null;
          priority: string | null;
          product_id: string;
          recommendation_type: string;
          recommended_order_date: string | null;
          recommended_quantity: number;
          recommended_supplier_id: string | null;
          status: string;
          store_id: string;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          calculated_at?: string;
          calculated_by?: string | null;
          created_at?: string;
          current_stock: number;
          days_until_stockout?: number | null;
          estimated_cost?: number | null;
          estimated_delivery_days?: number | null;
          forecasted_demand: number;
          id?: string;
          notes?: string | null;
          priority?: string | null;
          product_id: string;
          recommendation_type: string;
          recommended_order_date?: string | null;
          recommended_quantity: number;
          recommended_supplier_id?: string | null;
          status?: string;
          store_id: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          calculated_at?: string;
          calculated_by?: string | null;
          created_at?: string;
          current_stock?: number;
          days_until_stockout?: number | null;
          estimated_cost?: number | null;
          estimated_delivery_days?: number | null;
          forecasted_demand?: number;
          id?: string;
          notes?: string | null;
          priority?: string | null;
          product_id?: string;
          recommendation_type?: string;
          recommended_order_date?: string | null;
          recommended_quantity?: number;
          recommended_supplier_id?: string | null;
          status?: string;
          store_id?: string;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reorder_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_recommended_supplier_id_fkey';
            columns: ['recommended_supplier_id'];
            isOneToOne: false;
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reorder_recommendations_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_conflict_settings: {
        Row: {
          auto_detect_conflicts: boolean | null;
          auto_resolve_conflicts: boolean | null;
          check_capacity: boolean | null;
          check_resource_availability: boolean | null;
          check_time_slots: boolean | null;
          conflict_resolution_method: string | null;
          created_at: string;
          detect_interval_minutes: number | null;
          id: string;
          notify_on_conflict: boolean | null;
          prevent_double_booking: boolean | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          auto_detect_conflicts?: boolean | null;
          auto_resolve_conflicts?: boolean | null;
          check_capacity?: boolean | null;
          check_resource_availability?: boolean | null;
          check_time_slots?: boolean | null;
          conflict_resolution_method?: string | null;
          created_at?: string;
          detect_interval_minutes?: number | null;
          id?: string;
          notify_on_conflict?: boolean | null;
          prevent_double_booking?: boolean | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          auto_detect_conflicts?: boolean | null;
          auto_resolve_conflicts?: boolean | null;
          check_capacity?: boolean | null;
          check_resource_availability?: boolean | null;
          check_time_slots?: boolean | null;
          conflict_resolution_method?: string | null;
          created_at?: string;
          detect_interval_minutes?: number | null;
          id?: string;
          notify_on_conflict?: boolean | null;
          prevent_double_booking?: boolean | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_conflict_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'resource_conflict_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'resource_conflict_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_conflicts: {
        Row: {
          booking_ids: string[];
          conflict_date: string;
          conflict_end_time: string;
          conflict_start_time: string;
          conflict_type: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          resolution_method: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          resource_ids: string[] | null;
          staff_member_ids: string[] | null;
          status: string;
          store_id: string;
          suggested_resolutions: Json | null;
          updated_at: string;
        };
        Insert: {
          booking_ids: string[];
          conflict_date: string;
          conflict_end_time: string;
          conflict_start_time: string;
          conflict_type: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          resolution_method?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resource_ids?: string[] | null;
          staff_member_ids?: string[] | null;
          status?: string;
          store_id: string;
          suggested_resolutions?: Json | null;
          updated_at?: string;
        };
        Update: {
          booking_ids?: string[];
          conflict_date?: string;
          conflict_end_time?: string;
          conflict_start_time?: string;
          conflict_type?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          resolution_method?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resource_ids?: string[] | null;
          staff_member_ids?: string[] | null;
          status?: string;
          store_id?: string;
          suggested_resolutions?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_conflicts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'resource_conflicts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'resource_conflicts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      return_history: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          notes: string | null;
          performed_by: string | null;
          return_id: string;
          status_from: string | null;
          status_to: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          performed_by?: string | null;
          return_id: string;
          status_from?: string | null;
          status_to?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          performed_by?: string | null;
          return_id?: string;
          status_from?: string | null;
          status_to?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'return_history_return_id_fkey';
            columns: ['return_id'];
            isOneToOne: false;
            referencedRelation: 'product_returns';
            referencedColumns: ['id'];
          },
        ];
      };
      return_policies: {
        Row: {
          accepted_conditions: string[] | null;
          accepted_reasons: string[] | null;
          allowed_refund_methods: string[] | null;
          applies_to_all_products: boolean | null;
          created_at: string;
          description: string | null;
          excluded_category_ids: string[] | null;
          excluded_product_ids: string[] | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          name: string;
          requires_original_packaging: boolean | null;
          requires_photos: boolean | null;
          requires_receipt: boolean | null;
          requires_tags: boolean | null;
          restocking_fee_fixed: number | null;
          restocking_fee_percentage: number | null;
          return_shipping_paid_by: string | null;
          return_window_days: number | null;
          specific_product_ids: string[] | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          accepted_conditions?: string[] | null;
          accepted_reasons?: string[] | null;
          allowed_refund_methods?: string[] | null;
          applies_to_all_products?: boolean | null;
          created_at?: string;
          description?: string | null;
          excluded_category_ids?: string[] | null;
          excluded_product_ids?: string[] | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name: string;
          requires_original_packaging?: boolean | null;
          requires_photos?: boolean | null;
          requires_receipt?: boolean | null;
          requires_tags?: boolean | null;
          restocking_fee_fixed?: number | null;
          restocking_fee_percentage?: number | null;
          return_shipping_paid_by?: string | null;
          return_window_days?: number | null;
          specific_product_ids?: string[] | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          accepted_conditions?: string[] | null;
          accepted_reasons?: string[] | null;
          allowed_refund_methods?: string[] | null;
          applies_to_all_products?: boolean | null;
          created_at?: string;
          description?: string | null;
          excluded_category_ids?: string[] | null;
          excluded_product_ids?: string[] | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name?: string;
          requires_original_packaging?: boolean | null;
          requires_photos?: boolean | null;
          requires_receipt?: boolean | null;
          requires_tags?: boolean | null;
          restocking_fee_fixed?: number | null;
          restocking_fee_percentage?: number | null;
          return_shipping_paid_by?: string | null;
          return_window_days?: number | null;
          specific_product_ids?: string[] | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'return_policies_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'return_policies_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'return_policies_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      return_refunds: {
        Row: {
          completed_at: string | null;
          created_at: string;
          currency: string | null;
          id: string;
          notes: string | null;
          original_payment_id: string | null;
          processed_at: string | null;
          refund_amount: number;
          refund_method: string;
          refund_transaction_id: string | null;
          refund_type: string;
          return_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          notes?: string | null;
          original_payment_id?: string | null;
          processed_at?: string | null;
          refund_amount: number;
          refund_method: string;
          refund_transaction_id?: string | null;
          refund_type: string;
          return_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          notes?: string | null;
          original_payment_id?: string | null;
          processed_at?: string | null;
          refund_amount?: number;
          refund_method?: string;
          refund_transaction_id?: string | null;
          refund_type?: string;
          return_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'return_refunds_return_id_fkey';
            columns: ['return_id'];
            isOneToOne: false;
            referencedRelation: 'product_returns';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          comment: string | null;
          course_content_rating: number | null;
          created_at: string;
          delivery_rating: number | null;
          id: string;
          instructor_rating: number | null;
          is_verified_purchase: boolean | null;
          product_id: string;
          product_type: string;
          quality_rating: number | null;
          rating: number;
          reviewer_avatar: string | null;
          reviewer_name: string | null;
          service_rating: number | null;
          updated_at: string;
          user_id: string | null;
          value_rating: number | null;
        };
        Insert: {
          comment?: string | null;
          course_content_rating?: number | null;
          created_at?: string;
          delivery_rating?: number | null;
          id?: string;
          instructor_rating?: number | null;
          is_verified_purchase?: boolean | null;
          product_id: string;
          product_type: string;
          quality_rating?: number | null;
          rating: number;
          reviewer_avatar?: string | null;
          reviewer_name?: string | null;
          service_rating?: number | null;
          updated_at?: string;
          user_id?: string | null;
          value_rating?: number | null;
        };
        Update: {
          comment?: string | null;
          course_content_rating?: number | null;
          created_at?: string;
          delivery_rating?: number | null;
          id?: string;
          instructor_rating?: number | null;
          is_verified_purchase?: boolean | null;
          product_id?: string;
          product_type?: string;
          quality_rating?: number | null;
          rating?: number;
          reviewer_avatar?: string | null;
          reviewer_name?: string | null;
          service_rating?: number | null;
          updated_at?: string;
          user_id?: string | null;
          value_rating?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      sales_forecasts: {
        Row: {
          accuracy_percentage: number | null;
          actual_units: number | null;
          confidence_level: number | null;
          created_at: string | null;
          created_by: string | null;
          forecast_date: string;
          forecast_method: string;
          forecast_type: string;
          id: string;
          lower_bound: number | null;
          notes: string | null;
          physical_product_id: string;
          predicted_units: number;
          updated_at: string | null;
          upper_bound: number | null;
          variant_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          accuracy_percentage?: number | null;
          actual_units?: number | null;
          confidence_level?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          forecast_date: string;
          forecast_method?: string;
          forecast_type?: string;
          id?: string;
          lower_bound?: number | null;
          notes?: string | null;
          physical_product_id: string;
          predicted_units: number;
          updated_at?: string | null;
          upper_bound?: number | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          accuracy_percentage?: number | null;
          actual_units?: number | null;
          confidence_level?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          forecast_date?: string;
          forecast_method?: string;
          forecast_type?: string;
          id?: string;
          lower_bound?: number | null;
          notes?: string | null;
          physical_product_id?: string;
          predicted_units?: number;
          updated_at?: string | null;
          upper_bound?: number | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_forecasts_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_forecasts_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'sales_forecasts_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'sales_forecasts_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_forecasts_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      sales_history: {
        Row: {
          channel: string | null;
          created_at: string;
          customer_segment: string | null;
          discount_amount: number | null;
          id: string;
          order_id: string | null;
          order_item_id: string | null;
          product_id: string;
          promotion_applied: boolean | null;
          quantity_sold: number;
          sale_date: string;
          sale_timestamp: string;
          store_id: string;
          total_amount: number;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          channel?: string | null;
          created_at?: string;
          customer_segment?: string | null;
          discount_amount?: number | null;
          id?: string;
          order_id?: string | null;
          order_item_id?: string | null;
          product_id: string;
          promotion_applied?: boolean | null;
          quantity_sold: number;
          sale_date: string;
          sale_timestamp?: string;
          store_id: string;
          total_amount: number;
          unit_price: number;
          variant_id?: string | null;
        };
        Update: {
          channel?: string | null;
          created_at?: string;
          customer_segment?: string | null;
          discount_amount?: number | null;
          id?: string;
          order_id?: string | null;
          order_item_id?: string | null;
          product_id?: string;
          promotion_applied?: boolean | null;
          quantity_sold?: number;
          sale_date?: string;
          sale_timestamp?: string;
          store_id?: string;
          total_amount?: number;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_history_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'sales_history_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_history_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'sales_history_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'sales_history_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sales_history_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      search_history: {
        Row: {
          created_at: string | null;
          id: string;
          query: string;
          results_count: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          query: string;
          results_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          query?: string;
          results_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      secured_payments: {
        Row: {
          created_at: string;
          dispute_opened_at: string | null;
          dispute_resolved_at: string | null;
          held_amount: number;
          held_until: string | null;
          hold_reason: string;
          id: string;
          order_id: string;
          payment_id: string | null;
          release_conditions: Json | null;
          released_at: string | null;
          released_by: string | null;
          status: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dispute_opened_at?: string | null;
          dispute_resolved_at?: string | null;
          held_amount: number;
          held_until?: string | null;
          hold_reason?: string;
          id?: string;
          order_id: string;
          payment_id?: string | null;
          release_conditions?: Json | null;
          released_at?: string | null;
          released_by?: string | null;
          status?: string;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dispute_opened_at?: string | null;
          dispute_resolved_at?: string | null;
          held_amount?: number;
          held_until?: string | null;
          hold_reason?: string;
          id?: string;
          order_id?: string;
          payment_id?: string | null;
          release_conditions?: Json | null;
          released_at?: string | null;
          released_by?: string | null;
          status?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'secured_payments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'secured_payments_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_pages: {
        Row: {
          canonical_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          keywords: string | null;
          meta_robots: string | null;
          page_id: string | null;
          page_type: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          canonical_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          keywords?: string | null;
          meta_robots?: string | null;
          page_id?: string | null;
          page_type: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          canonical_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          keywords?: string | null;
          meta_robots?: string | null;
          page_id?: string | null;
          page_type?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_availability: {
        Row: {
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean | null;
          product_id: string;
          provider_id: string | null;
          specific_date: string | null;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean | null;
          product_id: string;
          provider_id?: string | null;
          specific_date?: string | null;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean | null;
          product_id?: string;
          provider_id?: string | null;
          specific_date?: string | null;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_availability_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_availability_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_availability_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_availability_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      service_availability_slots: {
        Row: {
          created_at: string | null;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean | null;
          service_product_id: string;
          staff_member_id: string | null;
          start_time: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean | null;
          service_product_id: string;
          staff_member_id?: string | null;
          start_time: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean | null;
          service_product_id?: string;
          staff_member_id?: string | null;
          start_time?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_availability_slots_service_product_id_fkey';
            columns: ['service_product_id'];
            isOneToOne: false;
            referencedRelation: 'service_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_availability_slots_staff_member_id_fkey';
            columns: ['staff_member_id'];
            isOneToOne: false;
            referencedRelation: 'service_staff_members';
            referencedColumns: ['id'];
          },
        ];
      };
      service_booking_participants: {
        Row: {
          booking_id: string;
          created_at: string | null;
          email: string;
          id: string;
          name: string;
          phone: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          booking_id: string;
          created_at?: string | null;
          email: string;
          id?: string;
          name: string;
          phone?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          booking_id?: string;
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_booking_participants_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'service_bookings';
            referencedColumns: ['id'];
          },
        ];
      };
      service_bookings: {
        Row: {
          amount_paid: number | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          completed_at: string | null;
          created_at: string;
          customer_notes: string | null;
          deposit_paid: number | null;
          duration_minutes: number | null;
          id: string;
          internal_notes: string | null;
          is_from_recurring: boolean | null;
          is_recurring: boolean | null;
          meeting_id: string | null;
          meeting_password: string | null;
          meeting_platform: string | null;
          meeting_url: string | null;
          occurrence_number: number | null;
          parent_booking_id: string | null;
          participants_count: number | null;
          payment_id: string | null;
          product_id: string;
          provider_id: string | null;
          provider_notes: string | null;
          recurrence_count: number | null;
          recurrence_day_of_month: number | null;
          recurrence_days_of_week: number[] | null;
          recurrence_end_date: string | null;
          recurrence_exceptions: string[] | null;
          recurrence_interval: number | null;
          recurrence_pattern: string | null;
          recurring_pattern_id: string | null;
          refund_amount: number | null;
          refund_issued: boolean | null;
          reminder_sent: boolean | null;
          reminder_sent_at: string | null;
          reschedule_count: number | null;
          rescheduled_from: string | null;
          scheduled_date: string;
          scheduled_end_time: string;
          scheduled_start_time: string;
          staff_member_id: string | null;
          status: string;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_paid?: number | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_notes?: string | null;
          deposit_paid?: number | null;
          duration_minutes?: number | null;
          id?: string;
          internal_notes?: string | null;
          is_from_recurring?: boolean | null;
          is_recurring?: boolean | null;
          meeting_id?: string | null;
          meeting_password?: string | null;
          meeting_platform?: string | null;
          meeting_url?: string | null;
          occurrence_number?: number | null;
          parent_booking_id?: string | null;
          participants_count?: number | null;
          payment_id?: string | null;
          product_id: string;
          provider_id?: string | null;
          provider_notes?: string | null;
          recurrence_count?: number | null;
          recurrence_day_of_month?: number | null;
          recurrence_days_of_week?: number[] | null;
          recurrence_end_date?: string | null;
          recurrence_exceptions?: string[] | null;
          recurrence_interval?: number | null;
          recurrence_pattern?: string | null;
          recurring_pattern_id?: string | null;
          refund_amount?: number | null;
          refund_issued?: boolean | null;
          reminder_sent?: boolean | null;
          reminder_sent_at?: string | null;
          reschedule_count?: number | null;
          rescheduled_from?: string | null;
          scheduled_date: string;
          scheduled_end_time: string;
          scheduled_start_time: string;
          staff_member_id?: string | null;
          status?: string;
          timezone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_paid?: number | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          customer_notes?: string | null;
          deposit_paid?: number | null;
          duration_minutes?: number | null;
          id?: string;
          internal_notes?: string | null;
          is_from_recurring?: boolean | null;
          is_recurring?: boolean | null;
          meeting_id?: string | null;
          meeting_password?: string | null;
          meeting_platform?: string | null;
          meeting_url?: string | null;
          occurrence_number?: number | null;
          parent_booking_id?: string | null;
          participants_count?: number | null;
          payment_id?: string | null;
          product_id?: string;
          provider_id?: string | null;
          provider_notes?: string | null;
          recurrence_count?: number | null;
          recurrence_day_of_month?: number | null;
          recurrence_days_of_week?: number[] | null;
          recurrence_end_date?: string | null;
          recurrence_exceptions?: string[] | null;
          recurrence_interval?: number | null;
          recurrence_pattern?: string | null;
          recurring_pattern_id?: string | null;
          refund_amount?: number | null;
          refund_issued?: boolean | null;
          reminder_sent?: boolean | null;
          reminder_sent_at?: string | null;
          reschedule_count?: number | null;
          rescheduled_from?: string | null;
          scheduled_date?: string;
          scheduled_end_time?: string;
          scheduled_start_time?: string;
          staff_member_id?: string | null;
          status?: string;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_bookings_parent_booking_id_fkey';
            columns: ['parent_booking_id'];
            isOneToOne: false;
            referencedRelation: 'service_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_bookings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_bookings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_recurring_pattern_id_fkey';
            columns: ['recurring_pattern_id'];
            isOneToOne: false;
            referencedRelation: 'recurring_booking_patterns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_rescheduled_from_fkey';
            columns: ['rescheduled_from'];
            isOneToOne: false;
            referencedRelation: 'service_bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_bookings_staff_member_id_fkey';
            columns: ['staff_member_id'];
            isOneToOne: false;
            referencedRelation: 'service_staff_members';
            referencedColumns: ['id'];
          },
        ];
      };
      service_packages: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          package_name: string;
          package_price: number;
          price_per_session: number | null;
          product_id: string;
          purchased_at: string;
          sessions_remaining: number | null;
          sessions_used: number | null;
          total_sessions: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          package_name: string;
          package_price: number;
          price_per_session?: number | null;
          product_id: string;
          purchased_at?: string;
          sessions_remaining?: number | null;
          sessions_used?: number | null;
          total_sessions: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          package_name?: string;
          package_price?: number;
          price_per_session?: number | null;
          product_id?: string;
          purchased_at?: string;
          sessions_remaining?: number | null;
          sessions_used?: number | null;
          total_sessions?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_packages_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      service_products: {
        Row: {
          advance_booking_days: number | null;
          allow_booking_cancellation: boolean | null;
          average_rating: number | null;
          buffer_time_after: number | null;
          buffer_time_before: number | null;
          cancellation_deadline_hours: number | null;
          created_at: string | null;
          deposit_amount: number | null;
          deposit_required: boolean | null;
          deposit_type: string | null;
          duration_minutes: number;
          id: string;
          location_address: string | null;
          location_type: string;
          max_bookings_per_day: number | null;
          max_participants: number | null;
          meeting_url: string | null;
          pricing_type: string;
          product_id: string;
          require_approval: boolean | null;
          requires_staff: boolean | null;
          service_type: string;
          timezone: string | null;
          total_bookings: number | null;
          total_cancelled_bookings: number | null;
          total_completed_bookings: number | null;
          total_revenue: number | null;
          updated_at: string | null;
        };
        Insert: {
          advance_booking_days?: number | null;
          allow_booking_cancellation?: boolean | null;
          average_rating?: number | null;
          buffer_time_after?: number | null;
          buffer_time_before?: number | null;
          cancellation_deadline_hours?: number | null;
          created_at?: string | null;
          deposit_amount?: number | null;
          deposit_required?: boolean | null;
          deposit_type?: string | null;
          duration_minutes: number;
          id?: string;
          location_address?: string | null;
          location_type?: string;
          max_bookings_per_day?: number | null;
          max_participants?: number | null;
          meeting_url?: string | null;
          pricing_type?: string;
          product_id: string;
          require_approval?: boolean | null;
          requires_staff?: boolean | null;
          service_type?: string;
          timezone?: string | null;
          total_bookings?: number | null;
          total_cancelled_bookings?: number | null;
          total_completed_bookings?: number | null;
          total_revenue?: number | null;
          updated_at?: string | null;
        };
        Update: {
          advance_booking_days?: number | null;
          allow_booking_cancellation?: boolean | null;
          average_rating?: number | null;
          buffer_time_after?: number | null;
          buffer_time_before?: number | null;
          cancellation_deadline_hours?: number | null;
          created_at?: string | null;
          deposit_amount?: number | null;
          deposit_required?: boolean | null;
          deposit_type?: string | null;
          duration_minutes?: number;
          id?: string;
          location_address?: string | null;
          location_type?: string;
          max_bookings_per_day?: number | null;
          max_participants?: number | null;
          meeting_url?: string | null;
          pricing_type?: string;
          product_id?: string;
          require_approval?: boolean | null;
          requires_staff?: boolean | null;
          service_type?: string;
          timezone?: string | null;
          total_bookings?: number | null;
          total_cancelled_bookings?: number | null;
          total_completed_bookings?: number | null;
          total_revenue?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      service_resources: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_required: boolean | null;
          name: string;
          quantity: number | null;
          resource_type: string | null;
          service_product_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_required?: boolean | null;
          name: string;
          quantity?: number | null;
          resource_type?: string | null;
          service_product_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_required?: boolean | null;
          name?: string;
          quantity?: number | null;
          resource_type?: string | null;
          service_product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_resources_service_product_id_fkey';
            columns: ['service_product_id'];
            isOneToOne: false;
            referencedRelation: 'service_products';
            referencedColumns: ['id'];
          },
        ];
      };
      service_staff_members: {
        Row: {
          avatar_url: string | null;
          average_rating: number | null;
          bio: string | null;
          created_at: string | null;
          email: string;
          id: string;
          is_active: boolean | null;
          name: string;
          phone: string | null;
          role: string | null;
          service_product_id: string;
          store_id: string;
          total_bookings: number | null;
          total_completed_bookings: number | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          phone?: string | null;
          role?: string | null;
          service_product_id: string;
          store_id: string;
          total_bookings?: number | null;
          total_completed_bookings?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          phone?: string | null;
          role?: string | null;
          service_product_id?: string;
          store_id?: string;
          total_bookings?: number | null;
          total_completed_bookings?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_staff_members_service_product_id_fkey';
            columns: ['service_product_id'];
            isOneToOne: false;
            referencedRelation: 'service_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_staff_members_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'service_staff_members_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'service_staff_members_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      service_subscriptions: {
        Row: {
          auto_book: boolean | null;
          cancel_at_period_end: boolean | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          currency: string;
          current_period_end: string;
          current_period_start: string;
          customer_id: string;
          failed_payment_attempts: number | null;
          id: string;
          last_payment_amount: number | null;
          last_payment_date: string | null;
          metadata: Json | null;
          next_billing_date: string | null;
          payment_method_id: string | null;
          payment_provider: string | null;
          product_id: string;
          service_product_id: string;
          sessions_per_period: number | null;
          sessions_used: number | null;
          status: string;
          store_id: string;
          subscription_interval: string;
          subscription_price: number;
          total_amount_paid: number | null;
          total_payments: number | null;
          trial_end: string | null;
          trial_start: string | null;
          updated_at: string;
        };
        Insert: {
          auto_book?: boolean | null;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end: string;
          current_period_start: string;
          customer_id: string;
          failed_payment_attempts?: number | null;
          id?: string;
          last_payment_amount?: number | null;
          last_payment_date?: string | null;
          metadata?: Json | null;
          next_billing_date?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          product_id: string;
          service_product_id: string;
          sessions_per_period?: number | null;
          sessions_used?: number | null;
          status?: string;
          store_id: string;
          subscription_interval: string;
          subscription_price: number;
          total_amount_paid?: number | null;
          total_payments?: number | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string;
        };
        Update: {
          auto_book?: boolean | null;
          cancel_at_period_end?: boolean | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          currency?: string;
          current_period_end?: string;
          current_period_start?: string;
          customer_id?: string;
          failed_payment_attempts?: number | null;
          id?: string;
          last_payment_amount?: number | null;
          last_payment_date?: string | null;
          metadata?: Json | null;
          next_billing_date?: string | null;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          product_id?: string;
          service_product_id?: string;
          sessions_per_period?: number | null;
          sessions_used?: number | null;
          status?: string;
          store_id?: string;
          subscription_interval?: string;
          subscription_price?: number;
          total_amount_paid?: number | null;
          total_payments?: number | null;
          trial_end?: string | null;
          trial_start?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_subscriptions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'service_subscriptions_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_subscriptions_service_product_id_fkey';
            columns: ['service_product_id'];
            isOneToOne: false;
            referencedRelation: 'service_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'service_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'service_subscriptions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      shipments: {
        Row: {
          actual_delivery: string | null;
          carrier_id: string | null;
          created_at: string | null;
          currency: string | null;
          customer_notes: string | null;
          dimension_unit: string | null;
          estimated_delivery: string | null;
          height: number | null;
          id: string;
          insurance_cost: number | null;
          internal_notes: string | null;
          last_tracking_update: string | null;
          length: number | null;
          order_id: string;
          package_type: string | null;
          service_type: string | null;
          ship_from: Json | null;
          ship_to: Json | null;
          shipped_date: string | null;
          shipping_cost: number | null;
          status: string;
          store_id: string;
          total_cost: number | null;
          tracking_events: Json | null;
          tracking_number: string | null;
          tracking_url: string | null;
          updated_at: string | null;
          weight_unit: string | null;
          weight_value: number | null;
          width: number | null;
        };
        Insert: {
          actual_delivery?: string | null;
          carrier_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          customer_notes?: string | null;
          dimension_unit?: string | null;
          estimated_delivery?: string | null;
          height?: number | null;
          id?: string;
          insurance_cost?: number | null;
          internal_notes?: string | null;
          last_tracking_update?: string | null;
          length?: number | null;
          order_id: string;
          package_type?: string | null;
          service_type?: string | null;
          ship_from?: Json | null;
          ship_to?: Json | null;
          shipped_date?: string | null;
          shipping_cost?: number | null;
          status?: string;
          store_id: string;
          total_cost?: number | null;
          tracking_events?: Json | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string | null;
          weight_unit?: string | null;
          weight_value?: number | null;
          width?: number | null;
        };
        Update: {
          actual_delivery?: string | null;
          carrier_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          customer_notes?: string | null;
          dimension_unit?: string | null;
          estimated_delivery?: string | null;
          height?: number | null;
          id?: string;
          insurance_cost?: number | null;
          internal_notes?: string | null;
          last_tracking_update?: string | null;
          length?: number | null;
          order_id?: string;
          package_type?: string | null;
          service_type?: string | null;
          ship_from?: Json | null;
          ship_to?: Json | null;
          shipped_date?: string | null;
          shipping_cost?: number | null;
          status?: string;
          store_id?: string;
          total_cost?: number | null;
          tracking_events?: Json | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string | null;
          weight_unit?: string | null;
          weight_value?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipments_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_carriers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipments_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipments_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_carriers: {
        Row: {
          api_enabled: boolean | null;
          api_endpoint: string | null;
          api_key: string | null;
          api_secret: string | null;
          code: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          name: string;
          priority: number | null;
          store_id: string | null;
          supports_labels: boolean | null;
          supports_pickup: boolean | null;
          supports_rates: boolean | null;
          supports_tracking: boolean | null;
          test_mode: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          api_enabled?: boolean | null;
          api_endpoint?: string | null;
          api_key?: string | null;
          api_secret?: string | null;
          code: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name: string;
          priority?: number | null;
          store_id?: string | null;
          supports_labels?: boolean | null;
          supports_pickup?: boolean | null;
          supports_rates?: boolean | null;
          supports_tracking?: boolean | null;
          test_mode?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          api_enabled?: boolean | null;
          api_endpoint?: string | null;
          api_key?: string | null;
          api_secret?: string | null;
          code?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name?: string;
          priority?: number | null;
          store_id?: string | null;
          supports_labels?: boolean | null;
          supports_pickup?: boolean | null;
          supports_rates?: boolean | null;
          supports_tracking?: boolean | null;
          test_mode?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_carriers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_carriers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_carriers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_labels: {
        Row: {
          barcode_data: string | null;
          barcode_url: string | null;
          created_at: string | null;
          id: string;
          is_printed: boolean | null;
          label_data: string | null;
          label_format: string | null;
          label_url: string | null;
          order_id: string | null;
          page_size: string | null;
          printed_at: string | null;
          printed_by: string | null;
          shipment_id: string;
          store_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          barcode_data?: string | null;
          barcode_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_printed?: boolean | null;
          label_data?: string | null;
          label_format?: string | null;
          label_url?: string | null;
          order_id?: string | null;
          page_size?: string | null;
          printed_at?: string | null;
          printed_by?: string | null;
          shipment_id: string;
          store_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          barcode_data?: string | null;
          barcode_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_printed?: boolean | null;
          label_data?: string | null;
          label_format?: string | null;
          label_url?: string | null;
          order_id?: string | null;
          page_size?: string | null;
          printed_at?: string | null;
          printed_by?: string | null;
          shipment_id?: string;
          store_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_labels_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipping_labels_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipping_labels_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_labels_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_labels_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_pickup_requests: {
        Row: {
          carrier_id: string | null;
          close_time: string | null;
          confirmation_number: string | null;
          created_at: string | null;
          id: string;
          package_count: number | null;
          pickup_address: Json;
          pickup_date: string;
          ready_time: string | null;
          special_instructions: string | null;
          status: string;
          store_id: string;
          total_weight: number | null;
          updated_at: string | null;
        };
        Insert: {
          carrier_id?: string | null;
          close_time?: string | null;
          confirmation_number?: string | null;
          created_at?: string | null;
          id?: string;
          package_count?: number | null;
          pickup_address: Json;
          pickup_date: string;
          ready_time?: string | null;
          special_instructions?: string | null;
          status?: string;
          store_id: string;
          total_weight?: number | null;
          updated_at?: string | null;
        };
        Update: {
          carrier_id?: string | null;
          close_time?: string | null;
          confirmation_number?: string | null;
          created_at?: string | null;
          id?: string;
          package_count?: number | null;
          pickup_address?: Json;
          pickup_date?: string;
          ready_time?: string | null;
          special_instructions?: string | null;
          status?: string;
          store_id?: string;
          total_weight?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_pickup_requests_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_carriers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipping_pickup_requests_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_pickup_requests_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_pickup_requests_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_rate_requests: {
        Row: {
          cache_expires_at: string | null;
          carrier_id: string | null;
          cheapest_rate: number | null;
          created_at: string;
          delivery_date: string | null;
          dimensions: Json | null;
          error_message: string | null;
          fastest_rate: number | null;
          from_country: string;
          from_postal_code: string | null;
          id: string;
          is_cached: boolean | null;
          rates: Json | null;
          request_data: Json | null;
          response_data: Json | null;
          service_type: string | null;
          store_id: string;
          to_country: string;
          to_postal_code: string | null;
          weight: number;
          weight_unit: string | null;
        };
        Insert: {
          cache_expires_at?: string | null;
          carrier_id?: string | null;
          cheapest_rate?: number | null;
          created_at?: string;
          delivery_date?: string | null;
          dimensions?: Json | null;
          error_message?: string | null;
          fastest_rate?: number | null;
          from_country: string;
          from_postal_code?: string | null;
          id?: string;
          is_cached?: boolean | null;
          rates?: Json | null;
          request_data?: Json | null;
          response_data?: Json | null;
          service_type?: string | null;
          store_id: string;
          to_country: string;
          to_postal_code?: string | null;
          weight: number;
          weight_unit?: string | null;
        };
        Update: {
          cache_expires_at?: string | null;
          carrier_id?: string | null;
          cheapest_rate?: number | null;
          created_at?: string;
          delivery_date?: string | null;
          dimensions?: Json | null;
          error_message?: string | null;
          fastest_rate?: number | null;
          from_country?: string;
          from_postal_code?: string | null;
          id?: string;
          is_cached?: boolean | null;
          rates?: Json | null;
          request_data?: Json | null;
          response_data?: Json | null;
          service_type?: string | null;
          store_id?: string;
          to_country?: string;
          to_postal_code?: string | null;
          weight?: number;
          weight_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_rate_requests_carrier_id_fkey';
            columns: ['carrier_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_carriers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipping_rate_requests_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_rate_requests_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_rate_requests_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_rates: {
        Row: {
          base_price: number | null;
          created_at: string | null;
          description: string | null;
          estimated_days_max: number | null;
          estimated_days_min: number | null;
          id: string;
          is_active: boolean | null;
          max_order_amount: number | null;
          max_weight: number | null;
          min_order_amount: number | null;
          min_weight: number | null;
          name: string;
          price_per_kg: number | null;
          priority: number | null;
          rate_type: string;
          shipping_zone_id: string;
          updated_at: string | null;
        };
        Insert: {
          base_price?: number | null;
          created_at?: string | null;
          description?: string | null;
          estimated_days_max?: number | null;
          estimated_days_min?: number | null;
          id?: string;
          is_active?: boolean | null;
          max_order_amount?: number | null;
          max_weight?: number | null;
          min_order_amount?: number | null;
          min_weight?: number | null;
          name: string;
          price_per_kg?: number | null;
          priority?: number | null;
          rate_type: string;
          shipping_zone_id: string;
          updated_at?: string | null;
        };
        Update: {
          base_price?: number | null;
          created_at?: string | null;
          description?: string | null;
          estimated_days_max?: number | null;
          estimated_days_min?: number | null;
          id?: string;
          is_active?: boolean | null;
          max_order_amount?: number | null;
          max_weight?: number | null;
          min_order_amount?: number | null;
          min_weight?: number | null;
          name?: string;
          price_per_kg?: number | null;
          priority?: number | null;
          rate_type?: string;
          shipping_zone_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_rates_shipping_zone_id_fkey';
            columns: ['shipping_zone_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_zones';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_service_conversations: {
        Row: {
          created_at: string | null;
          id: string;
          last_message_at: string | null;
          metadata: Json | null;
          shipping_service_id: string;
          status: string;
          store_id: string;
          store_user_id: string;
          subject: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          metadata?: Json | null;
          shipping_service_id: string;
          status?: string;
          store_id: string;
          store_user_id: string;
          subject?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          metadata?: Json | null;
          shipping_service_id?: string;
          status?: string;
          store_id?: string;
          store_user_id?: string;
          subject?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_service_conversations_shipping_service_id_fkey';
            columns: ['shipping_service_id'];
            isOneToOne: false;
            referencedRelation: 'global_shipping_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipping_service_conversations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_service_conversations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_service_conversations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_service_message_attachments: {
        Row: {
          created_at: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          file_url: string;
          id: string;
          message_id: string;
          storage_path: string;
        };
        Insert: {
          created_at?: string | null;
          file_name: string;
          file_size: number;
          file_type: string;
          file_url: string;
          id?: string;
          message_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string | null;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          file_url?: string;
          id?: string;
          message_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_service_message_attachments_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_service_messages';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_service_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message_type: string;
          metadata: Json | null;
          read_at: string | null;
          sender_id: string;
          sender_type: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message_type?: string;
          metadata?: Json | null;
          read_at?: string | null;
          sender_id: string;
          sender_type: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message_type?: string;
          metadata?: Json | null;
          read_at?: string | null;
          sender_id?: string;
          sender_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_service_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_service_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_tracking_events: {
        Row: {
          created_at: string | null;
          description: string;
          event_code: string | null;
          event_timestamp: string;
          event_type: string;
          id: string;
          location: Json | null;
          raw_data: Json | null;
          shipment_id: string;
          shipping_label_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          event_code?: string | null;
          event_timestamp: string;
          event_type: string;
          id?: string;
          location?: Json | null;
          raw_data?: Json | null;
          shipment_id: string;
          shipping_label_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          event_code?: string | null;
          event_timestamp?: string;
          event_type?: string;
          id?: string;
          location?: Json | null;
          raw_data?: Json | null;
          shipment_id?: string;
          shipping_label_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_tracking_events_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipping_tracking_events_shipping_label_id_fkey';
            columns: ['shipping_label_id'];
            isOneToOne: false;
            referencedRelation: 'shipping_labels';
            referencedColumns: ['id'];
          },
        ];
      };
      shipping_zones: {
        Row: {
          countries: string[] | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          priority: number | null;
          states: string[] | null;
          store_id: string;
          updated_at: string | null;
          zip_codes: string[] | null;
        };
        Insert: {
          countries?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          priority?: number | null;
          states?: string[] | null;
          store_id: string;
          updated_at?: string | null;
          zip_codes?: string[] | null;
        };
        Update: {
          countries?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          priority?: number | null;
          states?: string[] | null;
          store_id?: string;
          updated_at?: string | null;
          zip_codes?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shipping_zones_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_zones_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'shipping_zones_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      size_chart_measurements: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          label: string;
          size_chart_id: string;
          unit: string | null;
          values: Json;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          label: string;
          size_chart_id: string;
          unit?: string | null;
          values?: Json;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          label?: string;
          size_chart_id?: string;
          unit?: string | null;
          values?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'size_chart_measurements_size_chart_id_fkey';
            columns: ['size_chart_id'];
            isOneToOne: false;
            referencedRelation: 'size_charts';
            referencedColumns: ['id'];
          },
        ];
      };
      size_charts: {
        Row: {
          created_at: string | null;
          id: string;
          is_default: boolean | null;
          name: string;
          notes: string | null;
          sizes: Json;
          store_id: string;
          system: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          name: string;
          notes?: string | null;
          sizes?: Json;
          store_id: string;
          system?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          notes?: string | null;
          sizes?: Json;
          store_id?: string;
          system?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'size_charts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'size_charts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'size_charts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_availability_settings: {
        Row: {
          auto_block_on_time_off: boolean | null;
          booking_density_critical_threshold: number | null;
          booking_density_warning_threshold: number | null;
          buffer_time_between_bookings: number | null;
          created_at: string;
          default_work_hours_end: string | null;
          default_work_hours_start: string | null;
          id: string;
          max_bookings_per_day: number | null;
          service_id: string | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          auto_block_on_time_off?: boolean | null;
          booking_density_critical_threshold?: number | null;
          booking_density_warning_threshold?: number | null;
          buffer_time_between_bookings?: number | null;
          created_at?: string;
          default_work_hours_end?: string | null;
          default_work_hours_start?: string | null;
          id?: string;
          max_bookings_per_day?: number | null;
          service_id?: string | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          auto_block_on_time_off?: boolean | null;
          booking_density_critical_threshold?: number | null;
          booking_density_warning_threshold?: number | null;
          buffer_time_between_bookings?: number | null;
          created_at?: string;
          default_work_hours_end?: string | null;
          default_work_hours_start?: string | null;
          id?: string;
          max_bookings_per_day?: number | null;
          service_id?: string | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_availability_settings_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'service_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_availability_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_availability_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_availability_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_custom_hours: {
        Row: {
          created_at: string;
          day_of_week: number | null;
          end_time: string;
          id: string;
          is_active: boolean | null;
          is_override: boolean | null;
          is_unavailable: boolean | null;
          priority: number | null;
          specific_date: string | null;
          staff_member_id: string;
          start_time: string;
          store_id: string;
          updated_at: string;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          created_at?: string;
          day_of_week?: number | null;
          end_time: string;
          id?: string;
          is_active?: boolean | null;
          is_override?: boolean | null;
          is_unavailable?: boolean | null;
          priority?: number | null;
          specific_date?: string | null;
          staff_member_id: string;
          start_time: string;
          store_id: string;
          updated_at?: string;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string;
          day_of_week?: number | null;
          end_time?: string;
          id?: string;
          is_active?: boolean | null;
          is_override?: boolean | null;
          is_unavailable?: boolean | null;
          priority?: number | null;
          specific_date?: string | null;
          staff_member_id?: string;
          start_time?: string;
          store_id?: string;
          updated_at?: string;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_custom_hours_staff_member_id_fkey';
            columns: ['staff_member_id'];
            isOneToOne: false;
            referencedRelation: 'service_staff_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_custom_hours_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_custom_hours_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_custom_hours_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_time_off: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          auto_block_bookings: boolean | null;
          created_at: string;
          end_date: string;
          end_time: string | null;
          id: string;
          reason: string | null;
          staff_member_id: string;
          start_date: string;
          start_time: string | null;
          status: string;
          store_id: string;
          time_off_type: string;
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          auto_block_bookings?: boolean | null;
          created_at?: string;
          end_date: string;
          end_time?: string | null;
          id?: string;
          reason?: string | null;
          staff_member_id: string;
          start_date: string;
          start_time?: string | null;
          status?: string;
          store_id: string;
          time_off_type?: string;
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          auto_block_bookings?: boolean | null;
          created_at?: string;
          end_date?: string;
          end_time?: string | null;
          id?: string;
          reason?: string | null;
          staff_member_id?: string;
          start_date?: string;
          start_time?: string | null;
          status?: string;
          store_id?: string;
          time_off_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_time_off_staff_member_id_fkey';
            columns: ['staff_member_id'];
            isOneToOne: false;
            referencedRelation: 'service_staff_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_time_off_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_time_off_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_time_off_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_workload_alerts: {
        Row: {
          alert_date: string;
          alert_level: string;
          alert_period_end: string | null;
          alert_period_start: string | null;
          booking_density_percentage: number;
          created_at: string;
          current_bookings_count: number;
          id: string;
          is_resolved: boolean | null;
          max_recommended_bookings: number;
          resolved_at: string | null;
          resolved_by: string | null;
          staff_member_id: string;
          store_id: string;
          suggested_actions: Json | null;
          updated_at: string;
        };
        Insert: {
          alert_date: string;
          alert_level?: string;
          alert_period_end?: string | null;
          alert_period_start?: string | null;
          booking_density_percentage: number;
          created_at?: string;
          current_bookings_count?: number;
          id?: string;
          is_resolved?: boolean | null;
          max_recommended_bookings?: number;
          resolved_at?: string | null;
          resolved_by?: string | null;
          staff_member_id: string;
          store_id: string;
          suggested_actions?: Json | null;
          updated_at?: string;
        };
        Update: {
          alert_date?: string;
          alert_level?: string;
          alert_period_end?: string | null;
          alert_period_start?: string | null;
          booking_density_percentage?: number;
          created_at?: string;
          current_bookings_count?: number;
          id?: string;
          is_resolved?: boolean | null;
          max_recommended_bookings?: number;
          resolved_at?: string | null;
          resolved_by?: string | null;
          staff_member_id?: string;
          store_id?: string;
          suggested_actions?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_workload_alerts_staff_member_id_fkey';
            columns: ['staff_member_id'];
            isOneToOne: false;
            referencedRelation: 'service_staff_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_workload_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_workload_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'staff_workload_alerts_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      stats: {
        Row: {
          created_at: string | null;
          id: string;
          period: string | null;
          store_id: string | null;
          total_customers: number | null;
          total_orders: number | null;
          total_products: number | null;
          total_sales: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          period?: string | null;
          store_id?: string | null;
          total_customers?: number | null;
          total_orders?: number | null;
          total_products?: number | null;
          total_sales?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          period?: string | null;
          store_id?: string | null;
          total_customers?: number | null;
          total_orders?: number | null;
          total_products?: number | null;
          total_sales?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_alerts: {
        Row: {
          created_at: string;
          id: string;
          notification_sent_at: string | null;
          notified: boolean;
          product_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notification_sent_at?: string | null;
          notified?: boolean;
          product_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notification_sent_at?: string | null;
          notified?: boolean;
          product_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_alerts_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_movements: {
        Row: {
          created_at: string | null;
          id: string;
          inventory_item_id: string;
          movement_date: string | null;
          movement_type: string;
          notes: string | null;
          order_id: string | null;
          quantity: number;
          reason: string | null;
          total_cost: number | null;
          unit_cost: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          inventory_item_id: string;
          movement_date?: string | null;
          movement_type: string;
          notes?: string | null;
          order_id?: string | null;
          quantity: number;
          reason?: string | null;
          total_cost?: number | null;
          unit_cost?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          inventory_item_id?: string;
          movement_date?: string | null;
          movement_type?: string;
          notes?: string | null;
          order_id?: string | null;
          quantity?: number;
          reason?: string | null;
          total_cost?: number | null;
          unit_cost?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_movements_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      stock_rotation_reports: {
        Row: {
          average_inventory: number | null;
          beginning_inventory: number | null;
          calculated_at: string | null;
          cost_of_goods_sold: number | null;
          created_at: string | null;
          days_sales_of_inventory: number | null;
          ending_inventory: number | null;
          id: string;
          inventory_turnover_ratio: number | null;
          period_end: string;
          period_start: string;
          physical_product_id: string;
          previous_period_turnover: number | null;
          stock_velocity: string | null;
          turnover_change_percentage: number | null;
          units_sold: number | null;
          updated_at: string | null;
          variant_id: string | null;
          warehouse_id: string | null;
        };
        Insert: {
          average_inventory?: number | null;
          beginning_inventory?: number | null;
          calculated_at?: string | null;
          cost_of_goods_sold?: number | null;
          created_at?: string | null;
          days_sales_of_inventory?: number | null;
          ending_inventory?: number | null;
          id?: string;
          inventory_turnover_ratio?: number | null;
          period_end: string;
          period_start: string;
          physical_product_id: string;
          previous_period_turnover?: number | null;
          stock_velocity?: string | null;
          turnover_change_percentage?: number | null;
          units_sold?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Update: {
          average_inventory?: number | null;
          beginning_inventory?: number | null;
          calculated_at?: string | null;
          cost_of_goods_sold?: number | null;
          created_at?: string | null;
          days_sales_of_inventory?: number | null;
          ending_inventory?: number | null;
          id?: string;
          inventory_turnover_ratio?: number | null;
          period_end?: string;
          period_start?: string;
          physical_product_id?: string;
          previous_period_turnover?: number | null;
          stock_velocity?: string | null;
          turnover_change_percentage?: number | null;
          units_sold?: number | null;
          updated_at?: string | null;
          variant_id?: string | null;
          warehouse_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_rotation_reports_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_rotation_reports_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'stock_rotation_reports_physical_product_id_fkey';
            columns: ['physical_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['physical_product_id'];
          },
          {
            foreignKeyName: 'stock_rotation_reports_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_rotation_reports_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      store_analytics_events: {
        Row: {
          created_at: string | null;
          device_type: string | null;
          event_data: Json | null;
          event_type: string;
          id: string;
          referrer: string | null;
          session_id: string;
          store_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_type?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          referrer?: string | null;
          session_id: string;
          store_id: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_type?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          referrer?: string | null;
          session_id?: string;
          store_id?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'store_analytics_events_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_analytics_events_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_analytics_events_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_contact_settings: {
        Row: {
          address: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          email: string | null;
          facebook_url: string | null;
          id: string;
          instagram_url: string | null;
          linkedin_url: string | null;
          phone: string | null;
          postal_code: string | null;
          store_id: string;
          telegram_username: string | null;
          tiktok_url: string | null;
          twitter_url: string | null;
          updated_at: string;
          website: string | null;
          whatsapp_number: string | null;
          youtube_url: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          facebook_url?: string | null;
          id?: string;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          store_id: string;
          telegram_username?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          updated_at?: string;
          website?: string | null;
          whatsapp_number?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          facebook_url?: string | null;
          id?: string;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          store_id?: string;
          telegram_username?: string | null;
          tiktok_url?: string | null;
          twitter_url?: string | null;
          updated_at?: string;
          website?: string | null;
          whatsapp_number?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'store_contact_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_contact_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_contact_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_daily_stats: {
        Row: {
          add_to_cart_count: number | null;
          checkout_initiated_count: number | null;
          created_at: string | null;
          date: string;
          desktop_views: number | null;
          direct_traffic: number | null;
          id: string;
          mobile_views: number | null;
          product_clicks: number | null;
          product_views: number | null;
          purchases_count: number | null;
          referral_traffic: number | null;
          revenue_amount: number | null;
          search_traffic: number | null;
          social_traffic: number | null;
          store_id: string;
          tablet_views: number | null;
          total_views: number | null;
          unique_visitors: number | null;
          updated_at: string | null;
        };
        Insert: {
          add_to_cart_count?: number | null;
          checkout_initiated_count?: number | null;
          created_at?: string | null;
          date: string;
          desktop_views?: number | null;
          direct_traffic?: number | null;
          id?: string;
          mobile_views?: number | null;
          product_clicks?: number | null;
          product_views?: number | null;
          purchases_count?: number | null;
          referral_traffic?: number | null;
          revenue_amount?: number | null;
          search_traffic?: number | null;
          social_traffic?: number | null;
          store_id: string;
          tablet_views?: number | null;
          total_views?: number | null;
          unique_visitors?: number | null;
          updated_at?: string | null;
        };
        Update: {
          add_to_cart_count?: number | null;
          checkout_initiated_count?: number | null;
          created_at?: string | null;
          date?: string;
          desktop_views?: number | null;
          direct_traffic?: number | null;
          id?: string;
          mobile_views?: number | null;
          product_clicks?: number | null;
          product_views?: number | null;
          purchases_count?: number | null;
          referral_traffic?: number | null;
          revenue_amount?: number | null;
          search_traffic?: number | null;
          social_traffic?: number | null;
          store_id?: string;
          tablet_views?: number | null;
          total_views?: number | null;
          unique_visitors?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'store_daily_stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_daily_stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_daily_stats_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_display_settings: {
        Row: {
          accent_color: string | null;
          cart_auto_save: boolean | null;
          cart_expiry_hours: number | null;
          created_at: string;
          enable_filters: boolean | null;
          enable_search: boolean | null;
          enable_sorting: boolean | null;
          id: string;
          primary_color: string | null;
          products_per_page: number | null;
          secondary_color: string | null;
          show_product_ratings: boolean | null;
          show_product_reviews: boolean | null;
          show_stock_status: boolean | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          accent_color?: string | null;
          cart_auto_save?: boolean | null;
          cart_expiry_hours?: number | null;
          created_at?: string;
          enable_filters?: boolean | null;
          enable_search?: boolean | null;
          enable_sorting?: boolean | null;
          id?: string;
          primary_color?: string | null;
          products_per_page?: number | null;
          secondary_color?: string | null;
          show_product_ratings?: boolean | null;
          show_product_reviews?: boolean | null;
          show_stock_status?: boolean | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          accent_color?: string | null;
          cart_auto_save?: boolean | null;
          cart_expiry_hours?: number | null;
          created_at?: string;
          enable_filters?: boolean | null;
          enable_search?: boolean | null;
          enable_sorting?: boolean | null;
          id?: string;
          primary_color?: string | null;
          products_per_page?: number | null;
          secondary_color?: string | null;
          show_product_ratings?: boolean | null;
          show_product_reviews?: boolean | null;
          show_stock_status?: boolean | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_display_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_display_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_display_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_earnings: {
        Row: {
          available_balance: number;
          created_at: string;
          id: string;
          last_calculated_at: string | null;
          platform_commission_rate: number;
          store_id: string;
          total_platform_commission: number;
          total_revenue: number;
          total_withdrawn: number;
          updated_at: string;
        };
        Insert: {
          available_balance?: number;
          created_at?: string;
          id?: string;
          last_calculated_at?: string | null;
          platform_commission_rate?: number;
          store_id: string;
          total_platform_commission?: number;
          total_revenue?: number;
          total_withdrawn?: number;
          updated_at?: string;
        };
        Update: {
          available_balance?: number;
          created_at?: string;
          id?: string;
          last_calculated_at?: string | null;
          platform_commission_rate?: number;
          store_id?: string;
          total_platform_commission?: number;
          total_revenue?: number;
          total_withdrawn?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_earnings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_earnings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_earnings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_integrations: {
        Row: {
          config: Json;
          created_at: string;
          display_name: string;
          id: string;
          integration_type: string;
          is_active: boolean | null;
          is_enabled: boolean | null;
          metadata: Json | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          display_name: string;
          id?: string;
          integration_type: string;
          is_active?: boolean | null;
          is_enabled?: boolean | null;
          metadata?: Json | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          display_name?: string;
          id?: string;
          integration_type?: string;
          is_active?: boolean | null;
          is_enabled?: boolean | null;
          metadata?: Json | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_integrations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_integrations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_integrations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_media: {
        Row: {
          alt_text: string | null;
          created_at: string;
          file_name: string;
          file_size: number | null;
          file_url: string;
          id: string;
          is_primary: boolean | null;
          media_type: string;
          mime_type: string | null;
          sort_order: number | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          file_url: string;
          id?: string;
          is_primary?: boolean | null;
          media_type: string;
          mime_type?: string | null;
          sort_order?: number | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          file_url?: string;
          id?: string;
          is_primary?: boolean | null;
          media_type?: string;
          mime_type?: string | null;
          sort_order?: number | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_media_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_media_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_media_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_notification_settings: {
        Row: {
          created_at: string;
          email_customer_reviews: boolean | null;
          email_low_stock: boolean | null;
          email_new_orders: boolean | null;
          email_promotions: boolean | null;
          id: string;
          notification_email: string | null;
          push_customer_reviews: boolean | null;
          push_low_stock: boolean | null;
          push_new_orders: boolean | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email_customer_reviews?: boolean | null;
          email_low_stock?: boolean | null;
          email_new_orders?: boolean | null;
          email_promotions?: boolean | null;
          id?: string;
          notification_email?: string | null;
          push_customer_reviews?: boolean | null;
          push_low_stock?: boolean | null;
          push_new_orders?: boolean | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email_customer_reviews?: boolean | null;
          email_low_stock?: boolean | null;
          email_new_orders?: boolean | null;
          email_promotions?: boolean | null;
          id?: string;
          notification_email?: string | null;
          push_customer_reviews?: boolean | null;
          push_low_stock?: boolean | null;
          push_new_orders?: boolean | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_notification_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_notification_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_notification_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_payment_methods: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          is_default: boolean;
          label: string;
          notes: string | null;
          payment_details: Json;
          payment_method: string;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          label: string;
          notes?: string | null;
          payment_details: Json;
          payment_method: string;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          label?: string;
          notes?: string | null;
          payment_details?: Json;
          payment_method?: string;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_payment_methods_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_payment_methods_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_payment_methods_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_payment_settings: {
        Row: {
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_name: string | null;
          bank_transfer_enabled: boolean | null;
          cash_on_delivery_enabled: boolean | null;
          created_at: string;
          id: string;
          moov_money_enabled: boolean | null;
          moov_money_merchant_code: string | null;
          mtn_money_enabled: boolean | null;
          mtn_money_merchant_code: string | null;
          orange_money_enabled: boolean | null;
          orange_money_merchant_code: string | null;
          payment_instructions: string | null;
          refund_policy: string | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          bank_transfer_enabled?: boolean | null;
          cash_on_delivery_enabled?: boolean | null;
          created_at?: string;
          id?: string;
          moov_money_enabled?: boolean | null;
          moov_money_merchant_code?: string | null;
          mtn_money_enabled?: boolean | null;
          mtn_money_merchant_code?: string | null;
          orange_money_enabled?: boolean | null;
          orange_money_merchant_code?: string | null;
          payment_instructions?: string | null;
          refund_policy?: string | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          bank_transfer_enabled?: boolean | null;
          cash_on_delivery_enabled?: boolean | null;
          created_at?: string;
          id?: string;
          moov_money_enabled?: boolean | null;
          moov_money_merchant_code?: string | null;
          mtn_money_enabled?: boolean | null;
          mtn_money_merchant_code?: string | null;
          orange_money_enabled?: boolean | null;
          orange_money_merchant_code?: string | null;
          payment_instructions?: string | null;
          refund_policy?: string | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_payment_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_payment_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_payment_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_seo_settings: {
        Row: {
          analytics_gtag: string | null;
          canonical_url: string | null;
          created_at: string;
          facebook_pixel: string | null;
          id: string;
          meta_description: string | null;
          meta_keywords: string | null;
          meta_title: string | null;
          og_description: string | null;
          og_image_url: string | null;
          og_title: string | null;
          robots_txt: string | null;
          sitemap_enabled: boolean | null;
          store_id: string;
          twitter_card: string | null;
          twitter_description: string | null;
          twitter_image_url: string | null;
          twitter_title: string | null;
          updated_at: string;
        };
        Insert: {
          analytics_gtag?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          facebook_pixel?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_keywords?: string | null;
          meta_title?: string | null;
          og_description?: string | null;
          og_image_url?: string | null;
          og_title?: string | null;
          robots_txt?: string | null;
          sitemap_enabled?: boolean | null;
          store_id: string;
          twitter_card?: string | null;
          twitter_description?: string | null;
          twitter_image_url?: string | null;
          twitter_title?: string | null;
          updated_at?: string;
        };
        Update: {
          analytics_gtag?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          facebook_pixel?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_keywords?: string | null;
          meta_title?: string | null;
          og_description?: string | null;
          og_image_url?: string | null;
          og_title?: string | null;
          robots_txt?: string | null;
          sitemap_enabled?: boolean | null;
          store_id?: string;
          twitter_card?: string | null;
          twitter_description?: string | null;
          twitter_image_url?: string | null;
          twitter_title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_seo_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_seo_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_seo_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_shipping_settings: {
        Row: {
          created_at: string;
          delivery_zones: Json | null;
          express_delivery_days: number | null;
          express_shipping_cost: number | null;
          free_shipping_threshold: number | null;
          id: string;
          return_policy: string | null;
          shipping_policy: string | null;
          standard_delivery_days: number | null;
          standard_shipping_cost: number | null;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          delivery_zones?: Json | null;
          express_delivery_days?: number | null;
          express_shipping_cost?: number | null;
          free_shipping_threshold?: number | null;
          id?: string;
          return_policy?: string | null;
          shipping_policy?: string | null;
          standard_delivery_days?: number | null;
          standard_shipping_cost?: number | null;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          delivery_zones?: Json | null;
          express_delivery_days?: number | null;
          express_shipping_cost?: number | null;
          free_shipping_threshold?: number | null;
          id?: string;
          return_policy?: string | null;
          shipping_policy?: string | null;
          standard_delivery_days?: number | null;
          standard_shipping_cost?: number | null;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_shipping_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_shipping_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_shipping_settings_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: true;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_withdrawal_status_history: {
        Row: {
          change_reason: string | null;
          changed_by: string | null;
          created_at: string;
          id: string;
          new_status: string;
          notes: string | null;
          old_status: string | null;
          withdrawal_id: string;
        };
        Insert: {
          change_reason?: string | null;
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_status: string;
          notes?: string | null;
          old_status?: string | null;
          withdrawal_id: string;
        };
        Update: {
          change_reason?: string | null;
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_status?: string;
          notes?: string | null;
          old_status?: string | null;
          withdrawal_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_withdrawal_status_history_withdrawal_id_fkey';
            columns: ['withdrawal_id'];
            isOneToOne: false;
            referencedRelation: 'store_withdrawals';
            referencedColumns: ['id'];
          },
        ];
      };
      store_withdrawals: {
        Row: {
          admin_notes: string | null;
          amount: number;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          currency: string;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          notes: string | null;
          payment_details: Json;
          payment_method: string;
          processed_at: string | null;
          processed_by: string | null;
          proof_url: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          status: string;
          store_id: string;
          transaction_reference: string | null;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          amount: number;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          currency?: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          payment_details: Json;
          payment_method: string;
          processed_at?: string | null;
          processed_by?: string | null;
          proof_url?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: string;
          store_id: string;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          amount?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          currency?: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          notes?: string | null;
          payment_details?: Json;
          payment_method?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          proof_url?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          status?: string;
          store_id?: string;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'store_withdrawals_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_withdrawals_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'store_withdrawals_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      stores: {
        Row: {
          about: string | null;
          accent_color: string | null;
          address_line1: string | null;
          address_line2: string | null;
          analytics_enabled: boolean | null;
          apple_touch_icon_url: string | null;
          background_color: string | null;
          banner_url: string | null;
          body_font: string | null;
          border_radius: string | null;
          button_primary_color: string | null;
          button_primary_text: string | null;
          button_secondary_color: string | null;
          button_secondary_text: string | null;
          cache_duration: number | null;
          cache_enabled: boolean | null;
          cdn_enabled: boolean | null;
          city: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          country: string | null;
          created_at: string;
          custom_domain: string | null;
          custom_headers: Json | null;
          default_currency: string | null;
          description: string | null;
          discord_url: string | null;
          domain: string | null;
          domain_error_message: string | null;
          domain_status: string | null;
          domain_verification_token: string | null;
          domain_verified_at: string | null;
          enabled_payment_providers: string[] | null;
          facebook_url: string | null;
          favicon_url: string | null;
          font_size_base: string | null;
          footer_style: string | null;
          header_style: string | null;
          heading_font: string | null;
          heading_size_h1: string | null;
          heading_size_h2: string | null;
          heading_size_h3: string | null;
          id: string;
          info_message: string | null;
          info_message_color: string | null;
          info_message_font: string | null;
          instagram_url: string | null;
          is_active: boolean;
          latitude: number | null;
          legal_pages: Json | null;
          letter_spacing: string | null;
          line_height: string | null;
          link_color: string | null;
          link_hover_color: string | null;
          linkedin_url: string | null;
          logo_url: string | null;
          longitude: number | null;
          marketing_content: Json | null;
          metadata: Json | null;
          monitoring_enabled: boolean | null;
          name: string;
          navigation_style: string | null;
          opening_hours: Json | null;
          partnership_email: string | null;
          performance_settings: Json | null;
          pinterest_url: string | null;
          placeholder_image_url: string | null;
          postal_code: string | null;
          press_email: string | null;
          primary_color: string | null;
          product_card_style: string | null;
          product_grid_columns: number | null;
          redirect_https: boolean | null;
          redirect_www: boolean | null;
          sales_email: string | null;
          sales_phone: string | null;
          secondary_color: string | null;
          security_headers: Json | null;
          shadow_intensity: string | null;
          sidebar_enabled: boolean | null;
          sidebar_position: string | null;
          slug: string;
          snapchat_url: string | null;
          ssl_enabled: boolean | null;
          state_province: string | null;
          subdomains: string[] | null;
          support_email: string | null;
          support_phone: string | null;
          telegram_username: string | null;
          text_color: string | null;
          text_secondary_color: string | null;
          tiktok_url: string | null;
          timezone: string | null;
          twitch_url: string | null;
          twitter_url: string | null;
          updated_at: string;
          user_id: string;
          watermark_url: string | null;
          whatsapp_number: string | null;
          youtube_url: string | null;
        };
        Insert: {
          about?: string | null;
          accent_color?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          analytics_enabled?: boolean | null;
          apple_touch_icon_url?: string | null;
          background_color?: string | null;
          banner_url?: string | null;
          body_font?: string | null;
          border_radius?: string | null;
          button_primary_color?: string | null;
          button_primary_text?: string | null;
          button_secondary_color?: string | null;
          button_secondary_text?: string | null;
          cache_duration?: number | null;
          cache_enabled?: boolean | null;
          cdn_enabled?: boolean | null;
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string;
          custom_domain?: string | null;
          custom_headers?: Json | null;
          default_currency?: string | null;
          description?: string | null;
          discord_url?: string | null;
          domain?: string | null;
          domain_error_message?: string | null;
          domain_status?: string | null;
          domain_verification_token?: string | null;
          domain_verified_at?: string | null;
          enabled_payment_providers?: string[] | null;
          facebook_url?: string | null;
          favicon_url?: string | null;
          font_size_base?: string | null;
          footer_style?: string | null;
          header_style?: string | null;
          heading_font?: string | null;
          heading_size_h1?: string | null;
          heading_size_h2?: string | null;
          heading_size_h3?: string | null;
          id?: string;
          info_message?: string | null;
          info_message_color?: string | null;
          info_message_font?: string | null;
          instagram_url?: string | null;
          is_active?: boolean;
          latitude?: number | null;
          legal_pages?: Json | null;
          letter_spacing?: string | null;
          line_height?: string | null;
          link_color?: string | null;
          link_hover_color?: string | null;
          linkedin_url?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          marketing_content?: Json | null;
          metadata?: Json | null;
          monitoring_enabled?: boolean | null;
          name: string;
          navigation_style?: string | null;
          opening_hours?: Json | null;
          partnership_email?: string | null;
          performance_settings?: Json | null;
          pinterest_url?: string | null;
          placeholder_image_url?: string | null;
          postal_code?: string | null;
          press_email?: string | null;
          primary_color?: string | null;
          product_card_style?: string | null;
          product_grid_columns?: number | null;
          redirect_https?: boolean | null;
          redirect_www?: boolean | null;
          sales_email?: string | null;
          sales_phone?: string | null;
          secondary_color?: string | null;
          security_headers?: Json | null;
          shadow_intensity?: string | null;
          sidebar_enabled?: boolean | null;
          sidebar_position?: string | null;
          slug: string;
          snapchat_url?: string | null;
          ssl_enabled?: boolean | null;
          state_province?: string | null;
          subdomains?: string[] | null;
          support_email?: string | null;
          support_phone?: string | null;
          telegram_username?: string | null;
          text_color?: string | null;
          text_secondary_color?: string | null;
          tiktok_url?: string | null;
          timezone?: string | null;
          twitch_url?: string | null;
          twitter_url?: string | null;
          updated_at?: string;
          user_id: string;
          watermark_url?: string | null;
          whatsapp_number?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          about?: string | null;
          accent_color?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          analytics_enabled?: boolean | null;
          apple_touch_icon_url?: string | null;
          background_color?: string | null;
          banner_url?: string | null;
          body_font?: string | null;
          border_radius?: string | null;
          button_primary_color?: string | null;
          button_primary_text?: string | null;
          button_secondary_color?: string | null;
          button_secondary_text?: string | null;
          cache_duration?: number | null;
          cache_enabled?: boolean | null;
          cdn_enabled?: boolean | null;
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string;
          custom_domain?: string | null;
          custom_headers?: Json | null;
          default_currency?: string | null;
          description?: string | null;
          discord_url?: string | null;
          domain?: string | null;
          domain_error_message?: string | null;
          domain_status?: string | null;
          domain_verification_token?: string | null;
          domain_verified_at?: string | null;
          enabled_payment_providers?: string[] | null;
          facebook_url?: string | null;
          favicon_url?: string | null;
          font_size_base?: string | null;
          footer_style?: string | null;
          header_style?: string | null;
          heading_font?: string | null;
          heading_size_h1?: string | null;
          heading_size_h2?: string | null;
          heading_size_h3?: string | null;
          id?: string;
          info_message?: string | null;
          info_message_color?: string | null;
          info_message_font?: string | null;
          instagram_url?: string | null;
          is_active?: boolean;
          latitude?: number | null;
          legal_pages?: Json | null;
          letter_spacing?: string | null;
          line_height?: string | null;
          link_color?: string | null;
          link_hover_color?: string | null;
          linkedin_url?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          marketing_content?: Json | null;
          metadata?: Json | null;
          monitoring_enabled?: boolean | null;
          name?: string;
          navigation_style?: string | null;
          opening_hours?: Json | null;
          partnership_email?: string | null;
          performance_settings?: Json | null;
          pinterest_url?: string | null;
          placeholder_image_url?: string | null;
          postal_code?: string | null;
          press_email?: string | null;
          primary_color?: string | null;
          product_card_style?: string | null;
          product_grid_columns?: number | null;
          redirect_https?: boolean | null;
          redirect_www?: boolean | null;
          sales_email?: string | null;
          sales_phone?: string | null;
          secondary_color?: string | null;
          security_headers?: Json | null;
          shadow_intensity?: string | null;
          sidebar_enabled?: boolean | null;
          sidebar_position?: string | null;
          slug?: string;
          snapchat_url?: string | null;
          ssl_enabled?: boolean | null;
          state_province?: string | null;
          subdomains?: string[] | null;
          support_email?: string | null;
          support_phone?: string | null;
          telegram_username?: string | null;
          text_color?: string | null;
          text_secondary_color?: string | null;
          tiktok_url?: string | null;
          timezone?: string | null;
          twitch_url?: string | null;
          twitter_url?: string | null;
          updated_at?: string;
          user_id?: string;
          watermark_url?: string | null;
          whatsapp_number?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [];
      };
      subscription_payments: {
        Row: {
          amount: number;
          billing_period_end: string;
          billing_period_start: string;
          created_at: string;
          currency: string;
          failed_at: string | null;
          failure_reason: string | null;
          id: string;
          metadata: Json | null;
          order_id: string | null;
          paid_at: string | null;
          payment_id: string | null;
          payment_method: string | null;
          payment_provider: string | null;
          payment_status: string;
          subscription_id: string;
        };
        Insert: {
          amount: number;
          billing_period_end: string;
          billing_period_start: string;
          created_at?: string;
          currency: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_provider?: string | null;
          payment_status: string;
          subscription_id: string;
        };
        Update: {
          amount?: number;
          billing_period_end?: string;
          billing_period_start?: string;
          created_at?: string;
          currency?: string;
          failed_at?: string | null;
          failure_reason?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_provider?: string | null;
          payment_status?: string;
          subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscription_payments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscription_payments_payment_id_fkey';
            columns: ['payment_id'];
            isOneToOne: false;
            referencedRelation: 'payments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscription_payments_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      supplier_order_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string | null;
          quantity_ordered: number;
          quantity_pending: number | null;
          quantity_received: number | null;
          received_at: string | null;
          status: string;
          supplier_order_id: string;
          supplier_product_id: string | null;
          supplier_product_name: string | null;
          supplier_sku: string | null;
          total_cost: number | null;
          unit_cost: number;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id?: string | null;
          quantity_ordered: number;
          quantity_pending?: number | null;
          quantity_received?: number | null;
          received_at?: string | null;
          status?: string;
          supplier_order_id: string;
          supplier_product_id?: string | null;
          supplier_product_name?: string | null;
          supplier_sku?: string | null;
          total_cost?: number | null;
          unit_cost: number;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string | null;
          quantity_ordered?: number;
          quantity_pending?: number | null;
          quantity_received?: number | null;
          received_at?: string | null;
          status?: string;
          supplier_order_id?: string;
          supplier_product_id?: string | null;
          supplier_product_name?: string | null;
          supplier_sku?: string | null;
          total_cost?: number | null;
          unit_cost?: number;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'supplier_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'supplier_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'supplier_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_order_items_supplier_order_id_fkey';
            columns: ['supplier_order_id'];
            isOneToOne: false;
            referencedRelation: 'supplier_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_order_items_supplier_product_id_fkey';
            columns: ['supplier_product_id'];
            isOneToOne: false;
            referencedRelation: 'supplier_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      supplier_orders: {
        Row: {
          confirmed_date: string | null;
          created_at: string;
          created_by: string | null;
          currency: string | null;
          discount_amount: number | null;
          expected_delivery_date: string | null;
          id: string;
          notes: string | null;
          order_date: string;
          order_number: string;
          received_date: string | null;
          shipped_date: string | null;
          shipping_cost: number | null;
          status: string;
          store_id: string;
          subtotal: number;
          supplier_id: string;
          supplier_order_number: string | null;
          tax_amount: number | null;
          terms: string | null;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          confirmed_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          discount_amount?: number | null;
          expected_delivery_date?: string | null;
          id?: string;
          notes?: string | null;
          order_date?: string;
          order_number: string;
          received_date?: string | null;
          shipped_date?: string | null;
          shipping_cost?: number | null;
          status?: string;
          store_id: string;
          subtotal?: number;
          supplier_id: string;
          supplier_order_number?: string | null;
          tax_amount?: number | null;
          terms?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          confirmed_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          discount_amount?: number | null;
          expected_delivery_date?: string | null;
          id?: string;
          notes?: string | null;
          order_date?: string;
          order_number?: string;
          received_date?: string | null;
          shipped_date?: string | null;
          shipping_cost?: number | null;
          status?: string;
          store_id?: string;
          subtotal?: number;
          supplier_id?: string;
          supplier_order_number?: string | null;
          tax_amount?: number | null;
          terms?: string | null;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'supplier_orders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'supplier_orders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'supplier_orders_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_orders_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          },
        ];
      };
      supplier_products: {
        Row: {
          bulk_pricing: Json | null;
          catalog_url: string | null;
          created_at: string;
          currency: string | null;
          estimated_delivery_days: number | null;
          id: string;
          is_active: boolean | null;
          is_available: boolean | null;
          is_preferred: boolean | null;
          lead_time_days: number | null;
          minimum_order_quantity: number | null;
          notes: string | null;
          product_id: string | null;
          stock_available: boolean | null;
          supplier_id: string;
          supplier_product_name: string | null;
          supplier_sku: string | null;
          unit_cost: number;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          bulk_pricing?: Json | null;
          catalog_url?: string | null;
          created_at?: string;
          currency?: string | null;
          estimated_delivery_days?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_available?: boolean | null;
          is_preferred?: boolean | null;
          lead_time_days?: number | null;
          minimum_order_quantity?: number | null;
          notes?: string | null;
          product_id?: string | null;
          stock_available?: boolean | null;
          supplier_id: string;
          supplier_product_name?: string | null;
          supplier_sku?: string | null;
          unit_cost: number;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          bulk_pricing?: Json | null;
          catalog_url?: string | null;
          created_at?: string;
          currency?: string | null;
          estimated_delivery_days?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_available?: boolean | null;
          is_preferred?: boolean | null;
          lead_time_days?: number | null;
          minimum_order_quantity?: number | null;
          notes?: string | null;
          product_id?: string | null;
          stock_available?: boolean | null;
          supplier_id?: string;
          supplier_product_name?: string | null;
          supplier_sku?: string | null;
          unit_cost?: number;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'supplier_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'supplier_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'supplier_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_products_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_products_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      suppliers: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          average_delivery_days: number | null;
          city: string | null;
          company_name: string | null;
          contact_person: string | null;
          country: string | null;
          created_at: string;
          currency: string | null;
          email: string | null;
          id: string;
          is_active: boolean | null;
          is_preferred: boolean | null;
          name: string;
          notes: string | null;
          payment_terms: string | null;
          phone: string | null;
          postal_code: string | null;
          rating: number | null;
          state: string | null;
          store_id: string;
          tags: string[] | null;
          tax_id: string | null;
          total_orders: number | null;
          total_spent: number | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          average_delivery_days?: number | null;
          city?: string | null;
          company_name?: string | null;
          contact_person?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_preferred?: boolean | null;
          name: string;
          notes?: string | null;
          payment_terms?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          rating?: number | null;
          state?: string | null;
          store_id: string;
          tags?: string[] | null;
          tax_id?: string | null;
          total_orders?: number | null;
          total_spent?: number | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          average_delivery_days?: number | null;
          city?: string | null;
          company_name?: string | null;
          contact_person?: string | null;
          country?: string | null;
          created_at?: string;
          currency?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_preferred?: boolean | null;
          name?: string;
          notes?: string | null;
          payment_terms?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          rating?: number | null;
          state?: string | null;
          store_id?: string;
          tags?: string[] | null;
          tax_id?: string | null;
          total_orders?: number | null;
          total_spent?: number | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'suppliers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'suppliers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'suppliers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      suspicious_activities: {
        Row: {
          activity_type: string;
          created_at: string;
          details: Json | null;
          id: string;
          ip_address: unknown;
          location: string | null;
          resolved: boolean | null;
          severity: string;
          user_id: string;
        };
        Insert: {
          activity_type: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: unknown;
          location?: string | null;
          resolved?: boolean | null;
          severity?: string;
          user_id: string;
        };
        Update: {
          activity_type?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: unknown;
          location?: string | null;
          resolved?: boolean | null;
          severity?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tax_configurations: {
        Row: {
          applies_to_product_types: string[] | null;
          applies_to_shipping: boolean | null;
          country_code: string;
          created_at: string;
          effective_from: string;
          effective_to: string | null;
          id: string;
          is_active: boolean;
          priority: number | null;
          rate: number;
          state_province: string | null;
          store_id: string | null;
          tax_inclusive: boolean | null;
          tax_name: string;
          tax_type: string;
          updated_at: string;
        };
        Insert: {
          applies_to_product_types?: string[] | null;
          applies_to_shipping?: boolean | null;
          country_code: string;
          created_at?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          is_active?: boolean;
          priority?: number | null;
          rate: number;
          state_province?: string | null;
          store_id?: string | null;
          tax_inclusive?: boolean | null;
          tax_name: string;
          tax_type?: string;
          updated_at?: string;
        };
        Update: {
          applies_to_product_types?: string[] | null;
          applies_to_shipping?: boolean | null;
          country_code?: string;
          created_at?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          is_active?: boolean;
          priority?: number | null;
          rate?: number;
          state_province?: string | null;
          store_id?: string | null;
          tax_inclusive?: boolean | null;
          tax_name?: string;
          tax_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tax_configurations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'tax_configurations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'tax_configurations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      transaction_logs: {
        Row: {
          created_at: string;
          error_data: Json | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          request_data: Json | null;
          response_data: Json | null;
          status: string;
          transaction_id: string;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          error_data?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          request_data?: Json | null;
          response_data?: Json | null;
          status: string;
          transaction_id: string;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          error_data?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          request_data?: Json | null;
          response_data?: Json | null;
          status?: string;
          transaction_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_logs_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['id'];
          },
        ];
      };
      transaction_retries: {
        Row: {
          attempt_number: number;
          completed_at: string | null;
          created_at: string;
          error_message: string | null;
          id: string;
          last_attempt_at: string | null;
          last_attempt_result: Json | null;
          max_attempts: number;
          next_retry_at: string;
          retry_strategy: string;
          status: string;
          transaction_id: string;
          updated_at: string;
        };
        Insert: {
          attempt_number?: number;
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          last_attempt_at?: string | null;
          last_attempt_result?: Json | null;
          max_attempts?: number;
          next_retry_at: string;
          retry_strategy?: string;
          status?: string;
          transaction_id: string;
          updated_at?: string;
        };
        Update: {
          attempt_number?: number;
          completed_at?: string | null;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          last_attempt_at?: string | null;
          last_attempt_result?: Json | null;
          max_attempts?: number;
          next_retry_at?: string;
          retry_strategy?: string;
          status?: string;
          transaction_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_retries_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number | null;
          completed_at: string | null;
          created_at: string | null;
          currency: string;
          customer_email: string | null;
          customer_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          error_message: string | null;
          failed_at: string | null;
          id: string;
          last_webhook_payload: Json | null;
          metadata: Json | null;
          moneroo_checkout_url: string | null;
          moneroo_payment_method: string | null;
          moneroo_refund_amount: number | null;
          moneroo_refund_id: string | null;
          moneroo_refund_reason: string | null;
          moneroo_response: Json | null;
          moneroo_transaction_id: string | null;
          order_id: string | null;
          payment_id: string | null;
          payment_provider: string | null;
          product_id: string | null;
          reference: string | null;
          refunded_at: string | null;
          retry_count: number | null;
          status: string | null;
          store_id: string | null;
          type: string | null;
          updated_at: string | null;
          user_id: string | null;
          webhook_attempts: number | null;
          webhook_processed_at: string | null;
        };
        Insert: {
          amount?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          last_webhook_payload?: Json | null;
          metadata?: Json | null;
          moneroo_checkout_url?: string | null;
          moneroo_payment_method?: string | null;
          moneroo_refund_amount?: number | null;
          moneroo_refund_id?: string | null;
          moneroo_refund_reason?: string | null;
          moneroo_response?: Json | null;
          moneroo_transaction_id?: string | null;
          order_id?: string | null;
          payment_id?: string | null;
          payment_provider?: string | null;
          product_id?: string | null;
          reference?: string | null;
          refunded_at?: string | null;
          retry_count?: number | null;
          status?: string | null;
          store_id?: string | null;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          webhook_attempts?: number | null;
          webhook_processed_at?: string | null;
        };
        Update: {
          amount?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string;
          customer_email?: string | null;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          id?: string;
          last_webhook_payload?: Json | null;
          metadata?: Json | null;
          moneroo_checkout_url?: string | null;
          moneroo_payment_method?: string | null;
          moneroo_refund_amount?: number | null;
          moneroo_refund_id?: string | null;
          moneroo_refund_reason?: string | null;
          moneroo_response?: Json | null;
          moneroo_transaction_id?: string | null;
          order_id?: string | null;
          payment_id?: string | null;
          payment_provider?: string | null;
          product_id?: string | null;
          reference?: string | null;
          refunded_at?: string | null;
          retry_count?: number | null;
          status?: string | null;
          store_id?: string | null;
          type?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          webhook_attempts?: number | null;
          webhook_processed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'transactions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'transactions_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      upsell_tracking: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          order_id: string | null;
          original_product_id: string;
          session_id: string | null;
          upsell_product_id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          original_product_id: string;
          session_id?: string | null;
          upsell_product_id: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          order_id?: string | null;
          original_product_id?: string;
          session_id?: string | null;
          upsell_product_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'upsell_tracking_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'upsell_tracking_original_product_id_fkey';
            columns: ['original_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'upsell_tracking_original_product_id_fkey';
            columns: ['original_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'upsell_tracking_original_product_id_fkey';
            columns: ['original_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'upsell_tracking_original_product_id_fkey';
            columns: ['original_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'upsell_tracking_upsell_product_id_fkey';
            columns: ['upsell_product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'upsell_tracking_upsell_product_id_fkey';
            columns: ['upsell_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'upsell_tracking_upsell_product_id_fkey';
            columns: ['upsell_product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'upsell_tracking_upsell_product_id_fkey';
            columns: ['upsell_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          earned_at: string;
          id: string;
          notification_sent: boolean | null;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          earned_at?: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          earned_at?: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'global_achievements';
            referencedColumns: ['id'];
          },
        ];
      };
      user_badges: {
        Row: {
          badge_id: string;
          earned_at: string;
          id: string;
          notification_sent: boolean | null;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
          id?: string;
          notification_sent?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_badges_badge_id_fkey';
            columns: ['badge_id'];
            isOneToOne: false;
            referencedRelation: 'global_badges';
            referencedColumns: ['id'];
          },
        ];
      };
      user_consents: {
        Row: {
          consent_type: string;
          consent_version: string | null;
          consented: boolean | null;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          consent_type: string;
          consent_version?: string | null;
          consented?: boolean | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          consent_type?: string;
          consent_version?: string | null;
          consented?: boolean | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          created_at: string | null;
          id: string;
          last_price_check: string | null;
          price_drop_alert_enabled: boolean | null;
          price_drop_notified: boolean | null;
          price_drop_threshold: number | null;
          price_when_added: number | null;
          product_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_price_check?: string | null;
          price_drop_alert_enabled?: boolean | null;
          price_drop_notified?: boolean | null;
          price_drop_threshold?: number | null;
          price_when_added?: number | null;
          product_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_price_check?: string | null;
          price_drop_alert_enabled?: boolean | null;
          price_drop_notified?: boolean | null;
          price_drop_threshold?: number | null;
          price_when_added?: number | null;
          product_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_favorites_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_favorites_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'user_favorites_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'user_favorites_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      user_gamification: {
        Row: {
          created_at: string;
          current_level: number | null;
          current_streak_days: number | null;
          experience_points: number | null;
          experience_points_to_next_level: number | null;
          global_rank: number | null;
          id: string;
          last_activity_date: string | null;
          longest_streak_days: number | null;
          monthly_rank: number | null;
          points_earned_this_month: number | null;
          points_earned_this_week: number | null;
          points_earned_today: number | null;
          total_achievements_unlocked: number | null;
          total_badges_earned: number | null;
          total_orders_completed: number | null;
          total_points: number | null;
          total_products_purchased: number | null;
          total_referrals: number | null;
          total_reviews_written: number | null;
          updated_at: string;
          user_id: string;
          weekly_rank: number | null;
        };
        Insert: {
          created_at?: string;
          current_level?: number | null;
          current_streak_days?: number | null;
          experience_points?: number | null;
          experience_points_to_next_level?: number | null;
          global_rank?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak_days?: number | null;
          monthly_rank?: number | null;
          points_earned_this_month?: number | null;
          points_earned_this_week?: number | null;
          points_earned_today?: number | null;
          total_achievements_unlocked?: number | null;
          total_badges_earned?: number | null;
          total_orders_completed?: number | null;
          total_points?: number | null;
          total_products_purchased?: number | null;
          total_referrals?: number | null;
          total_reviews_written?: number | null;
          updated_at?: string;
          user_id: string;
          weekly_rank?: number | null;
        };
        Update: {
          created_at?: string;
          current_level?: number | null;
          current_streak_days?: number | null;
          experience_points?: number | null;
          experience_points_to_next_level?: number | null;
          global_rank?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak_days?: number | null;
          monthly_rank?: number | null;
          points_earned_this_month?: number | null;
          points_earned_this_week?: number | null;
          points_earned_today?: number | null;
          total_achievements_unlocked?: number | null;
          total_badges_earned?: number | null;
          total_orders_completed?: number | null;
          total_points?: number | null;
          total_products_purchased?: number | null;
          total_referrals?: number | null;
          total_reviews_written?: number | null;
          updated_at?: string;
          user_id?: string;
          weekly_rank?: number | null;
        };
        Relationships: [];
      };
      user_login_history: {
        Row: {
          created_at: string;
          failure_reason: string | null;
          id: string;
          ip_address: unknown;
          location: string | null;
          success: boolean;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown;
          location?: string | null;
          success: boolean;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown;
          location?: string | null;
          success?: boolean;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_notification_preferences: {
        Row: {
          created_at: string;
          email_marketing: boolean | null;
          email_order_updates: boolean | null;
          email_price_alerts: boolean | null;
          email_promotion_alerts: boolean | null;
          email_return_updates: boolean | null;
          email_shipment_updates: boolean | null;
          email_stock_alerts: boolean | null;
          id: string;
          metadata: Json | null;
          notification_frequency: string | null;
          push_price_alerts: boolean | null;
          push_promotion_alerts: boolean | null;
          push_return_updates: boolean | null;
          push_shipment_updates: boolean | null;
          push_stock_alerts: boolean | null;
          sms_order_updates: boolean | null;
          sms_price_alerts: boolean | null;
          sms_return_updates: boolean | null;
          sms_shipment_updates: boolean | null;
          sms_stock_alerts: boolean | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email_marketing?: boolean | null;
          email_order_updates?: boolean | null;
          email_price_alerts?: boolean | null;
          email_promotion_alerts?: boolean | null;
          email_return_updates?: boolean | null;
          email_shipment_updates?: boolean | null;
          email_stock_alerts?: boolean | null;
          id?: string;
          metadata?: Json | null;
          notification_frequency?: string | null;
          push_price_alerts?: boolean | null;
          push_promotion_alerts?: boolean | null;
          push_return_updates?: boolean | null;
          push_shipment_updates?: boolean | null;
          push_stock_alerts?: boolean | null;
          sms_order_updates?: boolean | null;
          sms_price_alerts?: boolean | null;
          sms_return_updates?: boolean | null;
          sms_shipment_updates?: boolean | null;
          sms_stock_alerts?: boolean | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email_marketing?: boolean | null;
          email_order_updates?: boolean | null;
          email_price_alerts?: boolean | null;
          email_promotion_alerts?: boolean | null;
          email_return_updates?: boolean | null;
          email_shipment_updates?: boolean | null;
          email_stock_alerts?: boolean | null;
          id?: string;
          metadata?: Json | null;
          notification_frequency?: string | null;
          push_price_alerts?: boolean | null;
          push_promotion_alerts?: boolean | null;
          push_return_updates?: boolean | null;
          push_shipment_updates?: boolean | null;
          push_stock_alerts?: boolean | null;
          sms_order_updates?: boolean | null;
          sms_price_alerts?: boolean | null;
          sms_return_updates?: boolean | null;
          sms_shipment_updates?: boolean | null;
          sms_stock_alerts?: boolean | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_notification_settings: {
        Row: {
          created_at: string;
          id: string;
          settings: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_pixels: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          pixel_code: string | null;
          pixel_id: string;
          pixel_name: string | null;
          pixel_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          pixel_code?: string | null;
          pixel_id: string;
          pixel_name?: string | null;
          pixel_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          pixel_code?: string | null;
          pixel_id?: string;
          pixel_name?: string | null;
          pixel_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_points_history: {
        Row: {
          created_at: string;
          id: string;
          points_after: number;
          points_before: number;
          points_earned: number;
          source_description: string | null;
          source_id: string | null;
          source_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          points_after: number;
          points_before: number;
          points_earned: number;
          source_description?: string | null;
          source_id?: string | null;
          source_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          points_after?: number;
          points_before?: number;
          points_earned?: number;
          source_description?: string | null;
          source_id?: string | null;
          source_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [];
      };
      user_security_settings: {
        Row: {
          created_at: string;
          id: string;
          settings: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          created_at: string;
          device_name: string | null;
          expires_at: string;
          id: string;
          ip_address: unknown;
          is_current: boolean | null;
          last_activity: string;
          location: string | null;
          session_token: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          device_name?: string | null;
          expires_at?: string;
          id?: string;
          ip_address?: unknown;
          is_current?: boolean | null;
          last_activity?: string;
          location?: string | null;
          session_token: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          device_name?: string | null;
          expires_at?: string;
          id?: string;
          ip_address?: unknown;
          is_current?: boolean | null;
          last_activity?: string;
          location?: string | null;
          session_token?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          id: string;
          settings: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      variant_attributes: {
        Row: {
          attribute_name: string;
          attribute_value: string;
          created_at: string | null;
          display_order: number | null;
          id: string;
          variant_id: string;
        };
        Insert: {
          attribute_name: string;
          attribute_value: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          variant_id: string;
        };
        Update: {
          attribute_name?: string;
          attribute_value?: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'variant_attributes_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      variant_images: {
        Row: {
          alt_text: string | null;
          created_at: string | null;
          display_order: number | null;
          file_size: number | null;
          height: number | null;
          id: string;
          is_primary: boolean | null;
          url: string;
          variant_id: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          is_primary?: boolean | null;
          url: string;
          variant_id: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          is_primary?: boolean | null;
          url?: string;
          variant_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'variant_images_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      vendor_conversations: {
        Row: {
          admin_intervention: boolean | null;
          admin_user_id: string | null;
          created_at: string;
          customer_user_id: string;
          id: string;
          last_message_at: string | null;
          product_id: string | null;
          status: string;
          store_id: string;
          store_user_id: string;
          subject: string | null;
          updated_at: string;
        };
        Insert: {
          admin_intervention?: boolean | null;
          admin_user_id?: string | null;
          created_at?: string;
          customer_user_id: string;
          id?: string;
          last_message_at?: string | null;
          product_id?: string | null;
          status?: string;
          store_id: string;
          store_user_id: string;
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          admin_intervention?: boolean | null;
          admin_user_id?: string | null;
          created_at?: string;
          customer_user_id?: string;
          id?: string;
          last_message_at?: string | null;
          product_id?: string | null;
          status?: string;
          store_id?: string;
          store_user_id?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vendor_conversations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vendor_conversations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'vendor_conversations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'vendor_conversations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vendor_conversations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'vendor_conversations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'vendor_conversations_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      vendor_message_attachments: {
        Row: {
          created_at: string;
          file_name: string;
          file_size: number;
          file_type: string;
          file_url: string;
          id: string;
          message_id: string;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_size: number;
          file_type: string;
          file_url: string;
          id?: string;
          message_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          file_url?: string;
          id?: string;
          message_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vendor_message_attachments_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'vendor_messages';
            referencedColumns: ['id'];
          },
        ];
      };
      vendor_messages: {
        Row: {
          content: string | null;
          conversation_id: string;
          created_at: string;
          id: string;
          is_read: boolean | null;
          message_type: string;
          metadata: Json | null;
          read_at: string | null;
          sender_id: string;
          sender_type: string;
        };
        Insert: {
          content?: string | null;
          conversation_id: string;
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          message_type?: string;
          metadata?: Json | null;
          read_at?: string | null;
          sender_id: string;
          sender_type: string;
        };
        Update: {
          content?: string | null;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          message_type?: string;
          metadata?: Json | null;
          read_at?: string | null;
          sender_id?: string;
          sender_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vendor_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'vendor_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      version_download_errors: {
        Row: {
          country: string | null;
          created_at: string;
          download_url: string | null;
          error_code: string | null;
          error_message: string | null;
          error_stack: string | null;
          error_type: string;
          file_size_mb: number | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          user_agent: string | null;
          user_id: string | null;
          version_id: string;
        };
        Insert: {
          country?: string | null;
          created_at?: string;
          download_url?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          error_stack?: string | null;
          error_type: string;
          file_size_mb?: number | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
          version_id: string;
        };
        Update: {
          country?: string | null;
          created_at?: string;
          download_url?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          error_stack?: string | null;
          error_type?: string;
          file_size_mb?: number | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          user_agent?: string | null;
          user_id?: string | null;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'version_download_errors_version_id_fkey';
            columns: ['version_id'];
            isOneToOne: false;
            referencedRelation: 'product_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      version_download_logs: {
        Row: {
          created_at: string | null;
          customer_id: string | null;
          download_completed: boolean | null;
          id: string;
          ip_address: unknown;
          license_id: string | null;
          user_agent: string | null;
          version_id: string;
        };
        Insert: {
          created_at?: string | null;
          customer_id?: string | null;
          download_completed?: boolean | null;
          id?: string;
          ip_address?: unknown;
          license_id?: string | null;
          user_agent?: string | null;
          version_id: string;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string | null;
          download_completed?: boolean | null;
          id?: string;
          ip_address?: unknown;
          license_id?: string | null;
          user_agent?: string | null;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'version_download_logs_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'version_download_logs_license_id_fkey';
            columns: ['license_id'];
            isOneToOne: false;
            referencedRelation: 'digital_product_licenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'version_download_logs_version_id_fkey';
            columns: ['version_id'];
            isOneToOne: false;
            referencedRelation: 'product_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      version_rollback_logs: {
        Row: {
          created_at: string;
          error_message: string | null;
          error_rate_percentage: number | null;
          id: string;
          metrics_snapshot: Json | null;
          rollback_reason: string;
          rollback_status: string;
          rollback_triggered_by: string | null;
          rollback_type: string;
          rolled_back_at: string;
          rolled_back_to_version_id: string | null;
          total_downloads: number | null;
          total_errors: number | null;
          version_id: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          error_rate_percentage?: number | null;
          id?: string;
          metrics_snapshot?: Json | null;
          rollback_reason: string;
          rollback_status?: string;
          rollback_triggered_by?: string | null;
          rollback_type: string;
          rolled_back_at?: string;
          rolled_back_to_version_id?: string | null;
          total_downloads?: number | null;
          total_errors?: number | null;
          version_id: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          error_rate_percentage?: number | null;
          id?: string;
          metrics_snapshot?: Json | null;
          rollback_reason?: string;
          rollback_status?: string;
          rollback_triggered_by?: string | null;
          rollback_type?: string;
          rolled_back_at?: string;
          rolled_back_to_version_id?: string | null;
          total_downloads?: number | null;
          total_errors?: number | null;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'version_rollback_logs_rolled_back_to_version_id_fkey';
            columns: ['rolled_back_to_version_id'];
            isOneToOne: false;
            referencedRelation: 'product_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'version_rollback_logs_version_id_fkey';
            columns: ['version_id'];
            isOneToOne: false;
            referencedRelation: 'product_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      warehouse_allocations: {
        Row: {
          allocated_at: string;
          allocated_by: string | null;
          created_at: string;
          id: string;
          location_id: string | null;
          notes: string | null;
          order_id: string;
          order_item_id: string | null;
          packed_at: string | null;
          packed_by: string | null;
          picked_at: string | null;
          picked_by: string | null;
          product_id: string;
          quantity_allocated: number;
          shipped_at: string | null;
          status: string;
          updated_at: string;
          variant_id: string | null;
          warehouse_id: string;
        };
        Insert: {
          allocated_at?: string;
          allocated_by?: string | null;
          created_at?: string;
          id?: string;
          location_id?: string | null;
          notes?: string | null;
          order_id: string;
          order_item_id?: string | null;
          packed_at?: string | null;
          packed_by?: string | null;
          picked_at?: string | null;
          picked_by?: string | null;
          product_id: string;
          quantity_allocated: number;
          shipped_at?: string | null;
          status?: string;
          updated_at?: string;
          variant_id?: string | null;
          warehouse_id: string;
        };
        Update: {
          allocated_at?: string;
          allocated_by?: string | null;
          created_at?: string;
          id?: string;
          location_id?: string | null;
          notes?: string | null;
          order_id?: string;
          order_item_id?: string | null;
          packed_at?: string | null;
          packed_by?: string | null;
          picked_at?: string | null;
          picked_by?: string | null;
          product_id?: string;
          quantity_allocated?: number;
          shipped_at?: string | null;
          status?: string;
          updated_at?: string;
          variant_id?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'warehouse_allocations_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'warehouse_locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_allocations_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      warehouse_inventory: {
        Row: {
          average_cost: number | null;
          created_at: string;
          id: string;
          inventory_item_id: string | null;
          last_counted_at: string | null;
          last_movement_at: string | null;
          location_id: string | null;
          notes: string | null;
          product_id: string | null;
          quantity_allocated: number | null;
          quantity_available: number | null;
          quantity_on_hand: number | null;
          quantity_reserved: number | null;
          reorder_point: number | null;
          reorder_quantity: number | null;
          total_value: number | null;
          updated_at: string;
          variant_id: string | null;
          warehouse_id: string;
        };
        Insert: {
          average_cost?: number | null;
          created_at?: string;
          id?: string;
          inventory_item_id?: string | null;
          last_counted_at?: string | null;
          last_movement_at?: string | null;
          location_id?: string | null;
          notes?: string | null;
          product_id?: string | null;
          quantity_allocated?: number | null;
          quantity_available?: number | null;
          quantity_on_hand?: number | null;
          quantity_reserved?: number | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          total_value?: number | null;
          updated_at?: string;
          variant_id?: string | null;
          warehouse_id: string;
        };
        Update: {
          average_cost?: number | null;
          created_at?: string;
          id?: string;
          inventory_item_id?: string | null;
          last_counted_at?: string | null;
          last_movement_at?: string | null;
          location_id?: string | null;
          notes?: string | null;
          product_id?: string | null;
          quantity_allocated?: number | null;
          quantity_available?: number | null;
          quantity_on_hand?: number | null;
          quantity_reserved?: number | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          total_value?: number | null;
          updated_at?: string;
          variant_id?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'warehouse_inventory_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            isOneToOne: false;
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_inventory_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'warehouse_locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_inventory_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_inventory_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warehouse_inventory_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warehouse_inventory_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_inventory_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_inventory_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      warehouse_locations: {
        Row: {
          created_at: string;
          current_capacity: number | null;
          dimensions_unit: string | null;
          height: number | null;
          id: string;
          is_active: boolean | null;
          is_reserved: boolean | null;
          length: number | null;
          location_code: string;
          location_name: string | null;
          location_type: string | null;
          max_capacity: number | null;
          notes: string | null;
          parent_location_id: string | null;
          updated_at: string;
          warehouse_id: string;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          current_capacity?: number | null;
          dimensions_unit?: string | null;
          height?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_reserved?: boolean | null;
          length?: number | null;
          location_code: string;
          location_name?: string | null;
          location_type?: string | null;
          max_capacity?: number | null;
          notes?: string | null;
          parent_location_id?: string | null;
          updated_at?: string;
          warehouse_id: string;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          current_capacity?: number | null;
          dimensions_unit?: string | null;
          height?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_reserved?: boolean | null;
          length?: number | null;
          location_code?: string;
          location_name?: string | null;
          location_type?: string | null;
          max_capacity?: number | null;
          notes?: string | null;
          parent_location_id?: string | null;
          updated_at?: string;
          warehouse_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'warehouse_locations_parent_location_id_fkey';
            columns: ['parent_location_id'];
            isOneToOne: false;
            referencedRelation: 'warehouse_locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_locations_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      warehouse_performance: {
        Row: {
          average_fulfillment_time_hours: number | null;
          average_stock_level: number | null;
          calculated_at: string | null;
          cost_per_order: number | null;
          cost_per_unit: number | null;
          created_at: string | null;
          id: string;
          labor_costs: number | null;
          net_profit: number | null;
          on_time_delivery_rate: number | null;
          operational_costs: number | null;
          orders_per_hour: number | null;
          period_end: string;
          period_start: string;
          period_type: string;
          profit_margin: number | null;
          shipping_costs: number | null;
          shrinkage_rate: number | null;
          stock_accuracy_rate: number | null;
          storage_costs: number | null;
          total_costs: number | null;
          total_inventory_value: number | null;
          total_orders_fulfilled: number | null;
          total_revenue: number | null;
          total_units_shipped: number | null;
          units_per_hour: number | null;
          updated_at: string | null;
          warehouse_id: string;
        };
        Insert: {
          average_fulfillment_time_hours?: number | null;
          average_stock_level?: number | null;
          calculated_at?: string | null;
          cost_per_order?: number | null;
          cost_per_unit?: number | null;
          created_at?: string | null;
          id?: string;
          labor_costs?: number | null;
          net_profit?: number | null;
          on_time_delivery_rate?: number | null;
          operational_costs?: number | null;
          orders_per_hour?: number | null;
          period_end: string;
          period_start: string;
          period_type?: string;
          profit_margin?: number | null;
          shipping_costs?: number | null;
          shrinkage_rate?: number | null;
          stock_accuracy_rate?: number | null;
          storage_costs?: number | null;
          total_costs?: number | null;
          total_inventory_value?: number | null;
          total_orders_fulfilled?: number | null;
          total_revenue?: number | null;
          total_units_shipped?: number | null;
          units_per_hour?: number | null;
          updated_at?: string | null;
          warehouse_id: string;
        };
        Update: {
          average_fulfillment_time_hours?: number | null;
          average_stock_level?: number | null;
          calculated_at?: string | null;
          cost_per_order?: number | null;
          cost_per_unit?: number | null;
          created_at?: string | null;
          id?: string;
          labor_costs?: number | null;
          net_profit?: number | null;
          on_time_delivery_rate?: number | null;
          operational_costs?: number | null;
          orders_per_hour?: number | null;
          period_end?: string;
          period_start?: string;
          period_type?: string;
          profit_margin?: number | null;
          shipping_costs?: number | null;
          shrinkage_rate?: number | null;
          stock_accuracy_rate?: number | null;
          storage_costs?: number | null;
          total_costs?: number | null;
          total_inventory_value?: number | null;
          total_orders_fulfilled?: number | null;
          total_revenue?: number | null;
          total_units_shipped?: number | null;
          units_per_hour?: number | null;
          updated_at?: string | null;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'warehouse_performance_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      warehouse_transfer_items: {
        Row: {
          created_at: string;
          from_location_id: string | null;
          id: string;
          notes: string | null;
          product_id: string;
          quantity_received: number | null;
          quantity_requested: number;
          quantity_shipped: number | null;
          to_location_id: string | null;
          total_cost: number | null;
          transfer_id: string;
          unit_cost: number | null;
          updated_at: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string;
          from_location_id?: string | null;
          id?: string;
          notes?: string | null;
          product_id: string;
          quantity_received?: number | null;
          quantity_requested: number;
          quantity_shipped?: number | null;
          to_location_id?: string | null;
          total_cost?: number | null;
          transfer_id: string;
          unit_cost?: number | null;
          updated_at?: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string;
          from_location_id?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string;
          quantity_received?: number | null;
          quantity_requested?: number;
          quantity_shipped?: number | null;
          to_location_id?: string | null;
          total_cost?: number | null;
          transfer_id?: string;
          unit_cost?: number | null;
          updated_at?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'warehouse_transfer_items_from_location_id_fkey';
            columns: ['from_location_id'];
            isOneToOne: false;
            referencedRelation: 'warehouse_locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_transfer_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_transfer_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warehouse_transfer_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warehouse_transfer_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_transfer_items_to_location_id_fkey';
            columns: ['to_location_id'];
            isOneToOne: false;
            referencedRelation: 'warehouse_locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_transfer_items_transfer_id_fkey';
            columns: ['transfer_id'];
            isOneToOne: false;
            referencedRelation: 'warehouse_transfers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_transfer_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      warehouse_transfers: {
        Row: {
          approved_by: string | null;
          approved_date: string | null;
          carrier_name: string | null;
          completed_date: string | null;
          created_at: string;
          expected_delivery_date: string | null;
          from_warehouse_id: string;
          id: string;
          notes: string | null;
          reason: string | null;
          received_by: string | null;
          received_date: string | null;
          requested_by: string | null;
          requested_date: string;
          shipped_date: string | null;
          shipping_method: string | null;
          status: string;
          store_id: string;
          to_warehouse_id: string;
          tracking_number: string | null;
          transfer_number: string;
          updated_at: string;
        };
        Insert: {
          approved_by?: string | null;
          approved_date?: string | null;
          carrier_name?: string | null;
          completed_date?: string | null;
          created_at?: string;
          expected_delivery_date?: string | null;
          from_warehouse_id: string;
          id?: string;
          notes?: string | null;
          reason?: string | null;
          received_by?: string | null;
          received_date?: string | null;
          requested_by?: string | null;
          requested_date?: string;
          shipped_date?: string | null;
          shipping_method?: string | null;
          status?: string;
          store_id: string;
          to_warehouse_id: string;
          tracking_number?: string | null;
          transfer_number: string;
          updated_at?: string;
        };
        Update: {
          approved_by?: string | null;
          approved_date?: string | null;
          carrier_name?: string | null;
          completed_date?: string | null;
          created_at?: string;
          expected_delivery_date?: string | null;
          from_warehouse_id?: string;
          id?: string;
          notes?: string | null;
          reason?: string | null;
          received_by?: string | null;
          received_date?: string | null;
          requested_by?: string | null;
          requested_date?: string;
          shipped_date?: string | null;
          shipping_method?: string | null;
          status?: string;
          store_id?: string;
          to_warehouse_id?: string;
          tracking_number?: string | null;
          transfer_number?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'warehouse_transfers_from_warehouse_id_fkey';
            columns: ['from_warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_transfers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'warehouse_transfers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'warehouse_transfers_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warehouse_transfers_to_warehouse_id_fkey';
            columns: ['to_warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['id'];
          },
        ];
      };
      warehouses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          capacity_unit: string | null;
          city: string;
          code: string;
          contact_person: string | null;
          country: string | null;
          created_at: string;
          current_capacity: number | null;
          description: string | null;
          email: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          is_fulfillment_center: boolean | null;
          is_primary: boolean | null;
          is_receiving_center: boolean | null;
          latitude: number | null;
          longitude: number | null;
          max_capacity: number | null;
          name: string;
          notes: string | null;
          operational_hours: Json | null;
          phone: string | null;
          postal_code: string | null;
          priority: number | null;
          state: string | null;
          store_id: string;
          tags: string[] | null;
          timezone: string | null;
          total_products: number | null;
          total_value: number | null;
          updated_at: string;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          capacity_unit?: string | null;
          city: string;
          code: string;
          contact_person?: string | null;
          country?: string | null;
          created_at?: string;
          current_capacity?: number | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          is_fulfillment_center?: boolean | null;
          is_primary?: boolean | null;
          is_receiving_center?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          max_capacity?: number | null;
          name: string;
          notes?: string | null;
          operational_hours?: Json | null;
          phone?: string | null;
          postal_code?: string | null;
          priority?: number | null;
          state?: string | null;
          store_id: string;
          tags?: string[] | null;
          timezone?: string | null;
          total_products?: number | null;
          total_value?: number | null;
          updated_at?: string;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          capacity_unit?: string | null;
          city?: string;
          code?: string;
          contact_person?: string | null;
          country?: string | null;
          created_at?: string;
          current_capacity?: number | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          is_fulfillment_center?: boolean | null;
          is_primary?: boolean | null;
          is_receiving_center?: boolean | null;
          latitude?: number | null;
          longitude?: number | null;
          max_capacity?: number | null;
          name?: string;
          notes?: string | null;
          operational_hours?: Json | null;
          phone?: string | null;
          postal_code?: string | null;
          priority?: number | null;
          state?: string | null;
          store_id?: string;
          tags?: string[] | null;
          timezone?: string | null;
          total_products?: number | null;
          total_value?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'warehouses_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'warehouses_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'warehouses_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      warranty_claims: {
        Row: {
          approved_by: string | null;
          approved_date: string | null;
          claim_number: string;
          claim_type: string;
          completed_date: string | null;
          cost_covered: number | null;
          created_at: string;
          customer_cost: number | null;
          description: string;
          documents: string[] | null;
          id: string;
          issue_category: string | null;
          notes: string | null;
          photos: string[] | null;
          priority: string | null;
          registration_id: string;
          resolution: string | null;
          resolution_notes: string | null;
          review_date: string | null;
          reviewed_by: string | null;
          status: string;
          store_id: string;
          submitted_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          approved_by?: string | null;
          approved_date?: string | null;
          claim_number: string;
          claim_type: string;
          completed_date?: string | null;
          cost_covered?: number | null;
          created_at?: string;
          customer_cost?: number | null;
          description: string;
          documents?: string[] | null;
          id?: string;
          issue_category?: string | null;
          notes?: string | null;
          photos?: string[] | null;
          priority?: string | null;
          registration_id: string;
          resolution?: string | null;
          resolution_notes?: string | null;
          review_date?: string | null;
          reviewed_by?: string | null;
          status?: string;
          store_id: string;
          submitted_date?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          approved_by?: string | null;
          approved_date?: string | null;
          claim_number?: string;
          claim_type?: string;
          completed_date?: string | null;
          cost_covered?: number | null;
          created_at?: string;
          customer_cost?: number | null;
          description?: string;
          documents?: string[] | null;
          id?: string;
          issue_category?: string | null;
          notes?: string | null;
          photos?: string[] | null;
          priority?: string | null;
          registration_id?: string;
          resolution?: string | null;
          resolution_notes?: string | null;
          review_date?: string | null;
          reviewed_by?: string | null;
          status?: string;
          store_id?: string;
          submitted_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'warranty_claims_registration_id_fkey';
            columns: ['registration_id'];
            isOneToOne: false;
            referencedRelation: 'warranty_registrations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warranty_claims_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'warranty_claims_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'warranty_claims_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      warranty_registrations: {
        Row: {
          created_at: string;
          customer_address: Json | null;
          customer_email: string;
          customer_name: string;
          customer_phone: string | null;
          id: string;
          invoice_url: string | null;
          is_expired: boolean | null;
          notes: string | null;
          order_id: string;
          order_item_id: string | null;
          product_id: string;
          purchase_date: string;
          purchase_price: number | null;
          registration_data: Json | null;
          registration_number: string;
          serial_number: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          variant_id: string | null;
          warranty_end_date: string;
          warranty_id: string;
          warranty_start_date: string;
        };
        Insert: {
          created_at?: string;
          customer_address?: Json | null;
          customer_email: string;
          customer_name: string;
          customer_phone?: string | null;
          id?: string;
          invoice_url?: string | null;
          is_expired?: boolean | null;
          notes?: string | null;
          order_id: string;
          order_item_id?: string | null;
          product_id: string;
          purchase_date: string;
          purchase_price?: number | null;
          registration_data?: Json | null;
          registration_number: string;
          serial_number?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          variant_id?: string | null;
          warranty_end_date: string;
          warranty_id: string;
          warranty_start_date: string;
        };
        Update: {
          created_at?: string;
          customer_address?: Json | null;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string | null;
          id?: string;
          invoice_url?: string | null;
          is_expired?: boolean | null;
          notes?: string | null;
          order_id?: string;
          order_item_id?: string | null;
          product_id?: string;
          purchase_date?: string;
          purchase_price?: number | null;
          registration_data?: Json | null;
          registration_number?: string;
          serial_number?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          variant_id?: string | null;
          warranty_end_date?: string;
          warranty_id?: string;
          warranty_start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'warranty_registrations_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warranty_registrations_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warranty_registrations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warranty_registrations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warranty_registrations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'warranty_registrations_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warranty_registrations_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'warranty_registrations_warranty_id_fkey';
            columns: ['warranty_id'];
            isOneToOne: false;
            referencedRelation: 'product_warranties';
            referencedColumns: ['id'];
          },
        ];
      };
      warranty_repairs: {
        Row: {
          actual_cost: number | null;
          claim_id: string;
          completed_date: string | null;
          created_at: string;
          estimated_completion_date: string | null;
          estimated_cost: number | null;
          id: string;
          labor_cost: number | null;
          notes: string | null;
          parts_cost: number | null;
          parts_used: Json | null;
          repair_center: string | null;
          repair_type: string;
          scheduled_date: string | null;
          started_date: string | null;
          status: string;
          technician_notes: string | null;
          tracking_number: string | null;
          updated_at: string;
          work_description: string | null;
        };
        Insert: {
          actual_cost?: number | null;
          claim_id: string;
          completed_date?: string | null;
          created_at?: string;
          estimated_completion_date?: string | null;
          estimated_cost?: number | null;
          id?: string;
          labor_cost?: number | null;
          notes?: string | null;
          parts_cost?: number | null;
          parts_used?: Json | null;
          repair_center?: string | null;
          repair_type: string;
          scheduled_date?: string | null;
          started_date?: string | null;
          status?: string;
          technician_notes?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
          work_description?: string | null;
        };
        Update: {
          actual_cost?: number | null;
          claim_id?: string;
          completed_date?: string | null;
          created_at?: string;
          estimated_completion_date?: string | null;
          estimated_cost?: number | null;
          id?: string;
          labor_cost?: number | null;
          notes?: string | null;
          parts_cost?: number | null;
          parts_used?: Json | null;
          repair_center?: string | null;
          repair_type?: string;
          scheduled_date?: string | null;
          started_date?: string | null;
          status?: string;
          technician_notes?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
          work_description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'warranty_repairs_claim_id_fkey';
            columns: ['claim_id'];
            isOneToOne: false;
            referencedRelation: 'warranty_claims';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_deliveries: {
        Row: {
          attempt_number: number | null;
          delivered_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          error_type: string | null;
          event_data: Json;
          event_id: string;
          event_type: Database['public']['Enums']['webhook_event_type'];
          failed_at: string | null;
          id: string;
          max_attempts: number | null;
          metadata: Json | null;
          next_retry_at: string | null;
          request_body: string | null;
          request_headers: Json | null;
          response_body: string | null;
          response_headers: Json | null;
          response_status_code: number | null;
          status: Database['public']['Enums']['webhook_delivery_status'];
          triggered_at: string;
          url: string;
          webhook_id: string;
        };
        Insert: {
          attempt_number?: number | null;
          delivered_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          error_type?: string | null;
          event_data?: Json;
          event_id: string;
          event_type: Database['public']['Enums']['webhook_event_type'];
          failed_at?: string | null;
          id?: string;
          max_attempts?: number | null;
          metadata?: Json | null;
          next_retry_at?: string | null;
          request_body?: string | null;
          request_headers?: Json | null;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status_code?: number | null;
          status?: Database['public']['Enums']['webhook_delivery_status'];
          triggered_at?: string;
          url: string;
          webhook_id: string;
        };
        Update: {
          attempt_number?: number | null;
          delivered_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          error_type?: string | null;
          event_data?: Json;
          event_id?: string;
          event_type?: Database['public']['Enums']['webhook_event_type'];
          failed_at?: string | null;
          id?: string;
          max_attempts?: number | null;
          metadata?: Json | null;
          next_retry_at?: string | null;
          request_body?: string | null;
          request_headers?: Json | null;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status_code?: number | null;
          status?: Database['public']['Enums']['webhook_delivery_status'];
          triggered_at?: string;
          url?: string;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_deliveries_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_logs: {
        Row: {
          attempt_number: number | null;
          completed_at: string | null;
          error_message: string | null;
          event_type: string;
          id: string;
          max_attempts: number | null;
          payload: Json;
          response_body: string | null;
          status: string;
          status_code: number | null;
          triggered_at: string;
          webhook_id: string;
        };
        Insert: {
          attempt_number?: number | null;
          completed_at?: string | null;
          error_message?: string | null;
          event_type: string;
          id?: string;
          max_attempts?: number | null;
          payload: Json;
          response_body?: string | null;
          status: string;
          status_code?: number | null;
          triggered_at?: string;
          webhook_id: string;
        };
        Update: {
          attempt_number?: number | null;
          completed_at?: string | null;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          max_attempts?: number | null;
          payload?: Json;
          response_body?: string | null;
          status?: string;
          status_code?: number | null;
          triggered_at?: string;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_logs_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      webhooks: {
        Row: {
          created_at: string;
          created_by: string | null;
          custom_headers: Json | null;
          description: string | null;
          events: Database['public']['Enums']['webhook_event_type'][];
          failed_deliveries: number | null;
          id: string;
          include_payload: boolean | null;
          is_active: boolean | null;
          last_failed_delivery_at: string | null;
          last_successful_delivery_at: string | null;
          last_triggered_at: string | null;
          metadata: Json | null;
          name: string;
          rate_limit_per_minute: number | null;
          retry_count: number | null;
          secret: string | null;
          status: Database['public']['Enums']['webhook_status'];
          store_id: string;
          successful_deliveries: number | null;
          timeout_seconds: number | null;
          total_deliveries: number | null;
          updated_at: string;
          url: string;
          verify_ssl: boolean | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          custom_headers?: Json | null;
          description?: string | null;
          events?: Database['public']['Enums']['webhook_event_type'][];
          failed_deliveries?: number | null;
          id?: string;
          include_payload?: boolean | null;
          is_active?: boolean | null;
          last_failed_delivery_at?: string | null;
          last_successful_delivery_at?: string | null;
          last_triggered_at?: string | null;
          metadata?: Json | null;
          name: string;
          rate_limit_per_minute?: number | null;
          retry_count?: number | null;
          secret?: string | null;
          status?: Database['public']['Enums']['webhook_status'];
          store_id: string;
          successful_deliveries?: number | null;
          timeout_seconds?: number | null;
          total_deliveries?: number | null;
          updated_at?: string;
          url: string;
          verify_ssl?: boolean | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          custom_headers?: Json | null;
          description?: string | null;
          events?: Database['public']['Enums']['webhook_event_type'][];
          failed_deliveries?: number | null;
          id?: string;
          include_payload?: boolean | null;
          is_active?: boolean | null;
          last_failed_delivery_at?: string | null;
          last_successful_delivery_at?: string | null;
          last_triggered_at?: string | null;
          metadata?: Json | null;
          name?: string;
          rate_limit_per_minute?: number | null;
          retry_count?: number | null;
          secret?: string | null;
          status?: Database['public']['Enums']['webhook_status'];
          store_id?: string;
          successful_deliveries?: number | null;
          timeout_seconds?: number | null;
          total_deliveries?: number | null;
          updated_at?: string;
          url?: string;
          verify_ssl?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'webhooks_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      wishlist_shares: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          share_token: string;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          share_token: string;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          share_token?: string;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      active_digital_licenses: {
        Row: {
          activated_at: string | null;
          current_activations: number | null;
          customer_email: string | null;
          customer_name: string | null;
          days_until_expiry: number | null;
          digital_product_id: string | null;
          expires_at: string | null;
          id: string | null;
          is_valid: boolean | null;
          issued_at: string | null;
          license_key: string | null;
          license_type: string | null;
          max_activations: number | null;
          product_name: string | null;
          remaining_activations: number | null;
          status: string | null;
          store_id: string | null;
          store_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      affiliate_products: {
        Row: {
          commission_rate: number | null;
          commission_type: string | null;
          cookie_duration_days: number | null;
          id: string | null;
          image_url: string | null;
          name: string | null;
          price: number | null;
          slug: string | null;
          store_name: string | null;
          store_slug: string | null;
          total_affiliates: number | null;
          total_clicks: number | null;
          total_sales: number | null;
        };
        Relationships: [];
      };
      affiliate_short_links_stats: {
        Row: {
          affiliate_id: string | null;
          created_at: string | null;
          custom_alias: string | null;
          id: string | null;
          is_active: boolean | null;
          last_used_at: string | null;
          product_id: string | null;
          product_name: string | null;
          short_code: string | null;
          store_id: string | null;
          store_name: string | null;
          total_clicks: number | null;
          unique_clicks: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'affiliate_links_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_links_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'affiliate_links_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'affiliate_links_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_short_links_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'affiliates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affiliate_short_links_affiliate_id_fkey';
            columns: ['affiliate_id'];
            isOneToOne: false;
            referencedRelation: 'top_affiliates';
            referencedColumns: ['id'];
          },
        ];
      };
      artist_products_monitoring: {
        Row: {
          artist_name: string | null;
          artist_type: string | null;
          artwork_title: string | null;
          artwork_year: number | null;
          created_at: string | null;
          currency: string | null;
          id: string | null;
          is_active: boolean | null;
          is_draft: boolean | null;
          price: number | null;
          product_id: string | null;
          product_name: string | null;
          store_id: string | null;
          store_name: string | null;
          store_owner_id: string | null;
          total_orders: number | null;
          total_quantity_sold: number | null;
          total_revenue: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'artist_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'artist_products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'artist_products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'artist_products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      course_section_unlock_status: {
        Row: {
          course_id: string | null;
          drip_enabled: boolean | null;
          drip_interval: number | null;
          drip_type: string | null;
          enrollment_id: string | null;
          is_locked: boolean | null;
          is_unlocked: boolean | null;
          order_index: number | null;
          section_id: string | null;
          section_title: string | null;
          unlock_after_days: number | null;
          unlock_date: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'course_sections_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_bundles_with_stats: {
        Row: {
          auto_generate_licenses: boolean | null;
          average_rating: number | null;
          badge: string | null;
          banner_url: string | null;
          bundle_price: number | null;
          conversion_rate: number | null;
          created_at: string | null;
          current_purchases: number | null;
          description: string | null;
          discount_type: Database['public']['Enums']['bundle_discount_type'] | null;
          discount_value: number | null;
          download_expiry_days: number | null;
          download_limit: number | null;
          end_date: string | null;
          features: Json | null;
          highlight_text: string | null;
          id: string | null;
          image_url: string | null;
          includes: Json | null;
          is_available: boolean | null;
          is_featured: boolean | null;
          keywords: string[] | null;
          license_duration_days: number | null;
          max_purchases: number | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string | null;
          original_price: number | null;
          product_ids: string[] | null;
          product_names: string[] | null;
          products_count: number | null;
          published_at: string | null;
          reviews_count: number | null;
          savings: number | null;
          savings_percentage: number | null;
          short_description: string | null;
          slug: string | null;
          start_date: string | null;
          status: Database['public']['Enums']['bundle_status'] | null;
          store_id: string | null;
          total_revenue: number | null;
          total_sales: number | null;
          updated_at: string | null;
          views_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'digital_bundles_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      digital_products_stats: {
        Row: {
          active_licenses: number | null;
          digital_type: string | null;
          expired_licenses: number | null;
          failed_downloads: number | null;
          id: string | null;
          last_download_date: string | null;
          last_license_issued_at: string | null;
          license_type: string | null;
          product_id: string | null;
          product_name: string | null;
          store_id: string | null;
          successful_downloads: number | null;
          total_activations: number | null;
          total_downloads: number | null;
          total_licenses: number | null;
          unique_downloaders: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'affiliate_products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_daily_sales';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'physical_products_sales_summary';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'digital_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: true;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      gamification_leaderboard_view: {
        Row: {
          avatar_url: string | null;
          current_level: number | null;
          current_streak_days: number | null;
          display_name: string | null;
          first_name: string | null;
          last_name: string | null;
          total_points: number | null;
          total_products_purchased: number | null;
          user_id: string | null;
          user_name: string | null;
        };
        Relationships: [];
      };
      payment_options_analytics: {
        Row: {
          active_products: number | null;
          avg_price: number | null;
          payment_type: string | null;
          product_count: number | null;
          total_changes: number | null;
        };
        Relationships: [];
      };
      physical_products_daily_sales: {
        Row: {
          average_price: number | null;
          orders_count: number | null;
          physical_product_id: string | null;
          product_id: string | null;
          revenue: number | null;
          sale_date: string | null;
          store_id: string | null;
          units_sold: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      physical_products_sales_summary: {
        Row: {
          average_selling_price: number | null;
          current_stock: number | null;
          first_sale_date: string | null;
          last_sale_date: string | null;
          orders_last_30_days: number | null;
          orders_last_7_days: number | null;
          physical_product_id: string | null;
          product_id: string | null;
          product_name: string | null;
          refunded_returns: number | null;
          reserved_stock: number | null;
          revenue_last_30_days: number | null;
          store_id: string | null;
          total_orders: number | null;
          total_returns: number | null;
          total_revenue: number | null;
          total_units_returned: number | null;
          total_units_sold: number | null;
          units_sold_last_30_days: number | null;
          units_sold_last_7_days: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      recent_digital_downloads: {
        Row: {
          digital_product_id: string | null;
          download_country: string | null;
          download_date: string | null;
          download_duration_seconds: number | null;
          download_ip: string | null;
          download_speed_mbps: number | null;
          download_success: boolean | null;
          file_version: string | null;
          id: string | null;
          product_name: string | null;
          store_id: string | null;
          user_agent: string | null;
          user_email: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_30_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'store_stats_last_7_days';
            referencedColumns: ['store_id'];
          },
          {
            foreignKeyName: 'products_store_id_fkey';
            columns: ['store_id'];
            isOneToOne: false;
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          },
        ];
      };
      store_stats_last_30_days: {
        Row: {
          purchases_30d: number | null;
          revenue_30d: number | null;
          store_id: string | null;
          store_name: string | null;
          total_views_30d: number | null;
          unique_visitors_30d: number | null;
        };
        Relationships: [];
      };
      store_stats_last_7_days: {
        Row: {
          purchases_7d: number | null;
          revenue_7d: number | null;
          store_id: string | null;
          store_name: string | null;
          total_views_7d: number | null;
          unique_visitors_7d: number | null;
        };
        Relationships: [];
      };
      top_affiliates: {
        Row: {
          affiliate_code: string | null;
          avg_order_value: number | null;
          conversion_rate: number | null;
          display_name: string | null;
          email: string | null;
          id: string | null;
          pending_commission: number | null;
          total_clicks: number | null;
          total_commission_earned: number | null;
          total_revenue: number | null;
          total_sales: number | null;
        };
        Insert: {
          affiliate_code?: string | null;
          avg_order_value?: never;
          conversion_rate?: never;
          display_name?: string | null;
          email?: string | null;
          id?: string | null;
          pending_commission?: number | null;
          total_clicks?: number | null;
          total_commission_earned?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
        };
        Update: {
          affiliate_code?: string | null;
          avg_order_value?: never;
          conversion_rate?: never;
          display_name?: string | null;
          email?: string | null;
          id?: string | null;
          pending_commission?: number | null;
          total_clicks?: number | null;
          total_commission_earned?: number | null;
          total_revenue?: number | null;
          total_sales?: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_lesson_note: {
        Args: {
          p_content: string;
          p_course_id: string;
          p_enrollment_id: string;
          p_lesson_id: string;
          p_note_type?: string;
          p_tags?: string[];
          p_timestamp_seconds?: number;
          p_user_id: string;
        };
        Returns: string;
      };
      adjust_warehouse_inventory: {
        Args: {
          p_location_id?: string;
          p_product_id: string;
          p_quantity_change: number;
          p_variant_id?: string;
          p_warehouse_id: string;
        };
        Returns: string;
      };
      aggregate_daily_stats: {
        Args: { target_date?: string; target_store_id: string };
        Returns: undefined;
      };
      allocate_lot_for_order: {
        Args: {
          p_order_item_id: string;
          p_quantity: number;
          p_rotation_method?: string;
        };
        Returns: string;
      };
      apply_coupon_to_order: {
        Args: {
          p_coupon_id: string;
          p_customer_id: string;
          p_discount_amount: number;
          p_order_id: string;
        };
        Returns: Json;
      };
      apply_plan_change: {
        Args: { p_subscription_id: string };
        Returns: undefined;
      };
      archive_notification: {
        Args: { notification_id: string };
        Returns: undefined;
      };
      assign_dispute_to_admin: {
        Args: { p_admin_id: string; p_dispute_id: string };
        Returns: boolean;
      };
      auto_assign_cohort_by_enrollment_date: { Args: never; Returns: undefined };
      auto_release_secured_payments: { Args: never; Returns: undefined };
      auto_unlock_drip_sections: { Args: never; Returns: undefined };
      award_global_points: {
        Args: {
          p_points: number;
          p_source_description?: string;
          p_source_id?: string;
          p_source_type: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      award_points: {
        Args: {
          p_enrollment_id: string;
          p_points: number;
          p_source_description?: string;
          p_source_id?: string;
          p_source_type: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      calculate_analytics_metrics: {
        Args: {
          p_period_end: string;
          p_period_start: string;
          p_period_type?: string;
          p_product_id?: string;
          p_store_id: string;
        };
        Returns: Json;
      };
      calculate_bundle_discount: {
        Args: { p_bundle_id: string };
        Returns: number;
      };
      calculate_bundle_original_price: {
        Args: { p_bundle_id: string };
        Returns: number;
      };
      calculate_cart_total: {
        Args: { p_session_id?: string; p_user_id?: string };
        Returns: {
          discount_amount: number;
          item_count: number;
          shipping_amount: number;
          subtotal: number;
          tax_amount: number;
          total: number;
        }[];
      };
      calculate_course_progress: {
        Args: { p_enrollment_id: string };
        Returns: number;
      };
      calculate_drip_release_date: {
        Args: {
          p_delay_days: number;
          p_delay_hours?: number;
          p_delay_minutes?: number;
          p_purchase_date: string;
        };
        Returns: string;
      };
      calculate_exponential_smoothing_forecast: {
        Args: {
          p_alpha?: number;
          p_forecast_date?: string;
          p_product_id: string;
          p_store_id: string;
          p_variant_id?: string;
        };
        Returns: {
          confidence_level: number;
          forecasted_quantity: number;
          forecasted_revenue: number;
        }[];
      };
      calculate_kit_price: { Args: { p_kit_id: string }; Returns: number };
      calculate_late_penalty: {
        Args: { p_assignment_id: string; p_grade: number; p_late_hours: number };
        Returns: number;
      };
      calculate_loyalty_points: {
        Args: {
          p_customer_id: string;
          p_order_amount: number;
          p_order_id: string;
          p_store_id: string;
        };
        Returns: number;
      };
      calculate_moving_average_forecast: {
        Args: {
          p_forecast_date?: string;
          p_periods?: number;
          p_product_id: string;
          p_store_id: string;
          p_variant_id?: string;
        };
        Returns: {
          confidence_level: number;
          forecasted_quantity: number;
          forecasted_revenue: number;
        }[];
      };
      calculate_next_billing_date: {
        Args: { p_current_period_end: string; p_interval: string };
        Returns: string;
      };
      calculate_next_retry_date: {
        Args: { p_attempt_number: number; p_strategy?: string };
        Returns: string;
      };
      calculate_order_taxes: {
        Args: {
          p_country_code: string;
          p_order_id: string;
          p_state_province?: string;
          p_store_id?: string;
        };
        Returns: Json;
      };
      calculate_product_analytics: {
        Args: {
          p_period_end: string;
          p_period_start: string;
          p_period_type?: string;
          p_physical_product_id: string;
          p_variant_id?: string;
          p_warehouse_id?: string;
        };
        Returns: string;
      };
      calculate_product_margin: {
        Args: {
          p_period_end?: string;
          p_period_start?: string;
          p_product_id: string;
          p_store_id: string;
          p_variant_id?: string;
        };
        Returns: {
          gross_margin_percentage: number;
          gross_profit: number;
          net_margin_percentage: number;
          net_profit: number;
          total_cost_of_goods: number;
          total_costs: number;
          total_fixed_costs: number;
          total_revenue: number;
          total_units_sold: number;
          total_variable_costs: number;
        }[];
      };
      calculate_refund_amount: {
        Args: { p_return_id: string };
        Returns: number;
      };
      calculate_return_deadline: {
        Args: { p_order_id: string; p_store_id: string };
        Returns: string;
      };
      calculate_staff_workload: {
        Args: { p_date: string; p_staff_member_id: string };
        Returns: Json;
      };
      calculate_stock_rotation: {
        Args: {
          p_period_end: string;
          p_period_start: string;
          p_physical_product_id: string;
          p_variant_id?: string;
          p_warehouse_id?: string;
        };
        Returns: string;
      };
      calculate_store_earnings: {
        Args: { p_store_id: string };
        Returns: {
          available_balance: number;
          total_platform_commission: number;
          total_revenue: number;
          total_withdrawn: number;
        }[];
      };
      calculate_user_level: {
        Args: { p_experience_points: number };
        Returns: number;
      };
      calculate_version_error_rate: {
        Args: { p_version_id: string };
        Returns: number;
      };
      can_combine_coupons: {
        Args: { p_coupon_ids: string[]; p_order_total: number };
        Returns: {
          can_combine: boolean;
          error_message: string;
          total_discount: number;
        }[];
      };
      can_use_coupon_by_customer: {
        Args: { p_coupon_id: string; p_customer_id: string };
        Returns: boolean;
      };
      cancel_future_recurring_bookings: {
        Args: { p_cancel_from_date?: string; p_pattern_id: string };
        Returns: number;
      };
      cancel_recurring_series: {
        Args: { p_series_id: string };
        Returns: number;
      };
      check_analytics_alerts: {
        Args: { p_store_id: string };
        Returns: {
          alert_id: string;
          alert_name: string;
          alert_type: string;
          triggered: boolean;
        }[];
      };
      check_and_cleanup_incomplete_groups: {
        Args: never;
        Returns: {
          cleaned_groups_count: number;
          total_cleaned_orders: number;
        }[];
      };
      check_and_notify_multi_store_group_completion: {
        Args: { p_order_id: string };
        Returns: undefined;
      };
      check_and_trigger_rollback: {
        Args: { p_version_id: string };
        Returns: Json;
      };
      check_artist_products_data_consistency: {
        Args: never;
        Returns: {
          affected_count: number;
          issue_description: string;
          issue_type: string;
          recommendation: string;
        }[];
      };
      check_assignment_late: {
        Args: { p_assignment_id: string; p_submitted_at: string };
        Returns: boolean;
      };
      check_badges_and_achievements: {
        Args: { p_enrollment_id: string; p_user_id: string };
        Returns: boolean;
      };
      check_course_access: {
        Args: { p_course_id: string; p_user_id: string };
        Returns: boolean;
      };
      check_drip_unlock: {
        Args: {
          p_course_id: string;
          p_enrollment_id: string;
          p_section_id: string;
        };
        Returns: boolean;
      };
      check_password: {
        Args: { hash: string; plain: string };
        Returns: boolean;
      };
      check_price_alerts: {
        Args: never;
        Returns: {
          alert_id: string;
          currency: string;
          current_price: number;
          price_drop: number;
          price_drop_percent: number;
          product_id: string;
          product_name: string;
          target_price: number;
          user_id: string;
        }[];
      };
      check_price_changes: { Args: never; Returns: undefined };
      check_price_drops: {
        Args: never;
        Returns: {
          new_price: number;
          old_price: number;
          price_drop_percentage: number;
          product_id: string;
          user_id: string;
        }[];
      };
      check_return_window: { Args: { p_order_id: string }; Returns: boolean };
      check_staff_availability: {
        Args: {
          p_date: string;
          p_end_time: string;
          p_staff_member_id: string;
          p_start_time: string;
        };
        Returns: boolean;
      };
      check_stock_alerts: {
        Args: never;
        Returns: {
          alert_id: string;
          product_id: string;
          product_name: string;
          user_id: string;
        }[];
      };
      check_stock_changes: { Args: never; Returns: undefined };
      check_transaction_consistency: {
        Args: never;
        Returns: {
          description: string;
          issue_type: string;
          order_id: string;
          payment_id: string;
          severity: string;
          transaction_id: string;
        }[];
      };
      cleanup_expired_sessions: { Args: never; Returns: undefined };
      cleanup_multi_store_group: {
        Args: { p_customer_id: string; p_group_id: string };
        Returns: {
          cleaned_order_items_count: number;
          cleaned_orders_count: number;
          cleaned_transactions_count: number;
        }[];
      };
      cleanup_old_carts: { Args: never; Returns: number };
      cleanup_orphaned_multi_store_orders: {
        Args: { p_hours_threshold?: number };
        Returns: {
          cleaned_order_items_count: number;
          cleaned_orders_count: number;
          cleaned_transactions_count: number;
        }[];
      };
      convert_currency: {
        Args: {
          p_amount: number;
          p_from_currency: string;
          p_to_currency: string;
        };
        Returns: number;
      };
      count_user_favorites: { Args: { p_user_id: string }; Returns: number };
      create_api_key: {
        Args: {
          p_description?: string;
          p_expires_at?: string;
          p_name: string;
          p_permissions?: Json;
          p_store_id: string;
          p_user_id: string;
        };
        Returns: {
          created_at: string;
          id: string;
          key: string;
          key_prefix: string;
          name: string;
        }[];
      };
      create_bundle_order: {
        Args: {
          p_bundle_id: string;
          p_customer_email: string;
          p_customer_id: string;
          p_customer_name?: string;
          p_store_id: string;
        };
        Returns: Json;
      };
      create_default_store_settings: {
        Args: { store_uuid: string };
        Returns: undefined;
      };
      create_default_user_settings: {
        Args: { user_uuid: string };
        Returns: undefined;
      };
      create_digital_subscription: {
        Args: {
          p_customer_id: string;
          p_digital_product_id: string;
          p_store_id: string;
          p_trial_days?: number;
        };
        Returns: Json;
      };
      create_drip_releases_for_order: {
        Args: { p_customer_id: string; p_order_id: string };
        Returns: Json;
      };
      create_free_preview_course: {
        Args: {
          p_paid_product_id: string;
          p_preview_content_description?: string;
        };
        Returns: string;
      };
      create_free_preview_product: {
        Args: {
          p_paid_product_id: string;
          p_preview_content_description?: string;
        };
        Returns: string;
      };
      create_free_preview_service: {
        Args: {
          p_paid_product_id: string;
          p_preview_content_description?: string;
        };
        Returns: string;
      };
      create_invoice_from_order: {
        Args: { p_order_id: string };
        Returns: string;
      };
      create_monthly_partitions: { Args: never; Returns: undefined };
      create_or_update_transaction_retry: {
        Args: {
          p_max_attempts?: number;
          p_strategy?: string;
          p_transaction_id: string;
        };
        Returns: string;
      };
      create_price_alert: {
        Args: {
          p_product_id: string;
          p_target_price: number;
          p_user_id: string;
        };
        Returns: string;
      };
      create_referral: {
        Args: {
          p_referral_code: string;
          p_referred_id: string;
          p_referrer_id: string;
        };
        Returns: string;
      };
      create_stock_alert: {
        Args: { p_product_id: string; p_user_id: string };
        Returns: string;
      };
      create_wishlist_share: {
        Args: { p_expires_in_days?: number };
        Returns: string;
      };
      delete_push_subscription: {
        Args: { p_endpoint: string };
        Returns: undefined;
      };
      detect_resource_conflicts: {
        Args: { p_end_date?: string; p_start_date?: string; p_store_id: string };
        Returns: number;
      };
      expire_digital_licenses: { Args: never; Returns: number };
      generate_affiliate_code: {
        Args: { p_first_name?: string; p_last_name?: string };
        Returns: string;
      };
      generate_affiliate_link_code: {
        Args: { p_affiliate_code: string; p_product_slug: string };
        Returns: string;
      };
      generate_api_key: { Args: { prefix?: string }; Returns: string };
      generate_batch_shipment_number: { Args: never; Returns: string };
      generate_bundle_slug: {
        Args: { p_name: string; p_store_id: string };
        Returns: string;
      };
      generate_certificate_number: { Args: never; Returns: string };
      generate_consistency_report: { Args: never; Returns: Json };
      generate_daily_stats: { Args: never; Returns: undefined };
      generate_download_token: {
        Args: {
          p_customer_id?: string;
          p_expires_hours?: number;
          p_file_url: string;
          p_license_id?: string;
          p_product_id: string;
        };
        Returns: string;
      };
      generate_gift_card_code: { Args: never; Returns: string };
      generate_invoice_number: { Args: never; Returns: string };
      generate_kit_assembly_number: { Args: never; Returns: string };
      generate_license_key: { Args: never; Returns: string };
      generate_order_number: { Args: never; Returns: string };
      generate_price_optimization_recommendations: {
        Args: { p_store_id: string };
        Returns: number;
      };
      generate_recurring_bookings: {
        Args: {
          p_parent_booking_id: string;
          p_recurrence_count?: number;
          p_recurrence_day_of_month?: number;
          p_recurrence_days_of_week?: number[];
          p_recurrence_end_date?: string;
          p_recurrence_interval?: number;
          p_recurrence_pattern: string;
        };
        Returns: number;
      };
      generate_referral_code: { Args: never; Returns: string };
      generate_reorder_recommendations: {
        Args: { p_store_id: string };
        Returns: number;
      };
      generate_return_number: { Args: never; Returns: string };
      generate_shipping_label_number: { Args: never; Returns: string };
      generate_short_link_code: { Args: { p_length?: number }; Returns: string };
      generate_slug: { Args: { input_text: string }; Returns: string };
      generate_supplier_order_number: { Args: never; Returns: string };
      generate_warehouse_transfer_number: { Args: never; Returns: string };
      generate_warranty_claim_number: { Args: never; Returns: string };
      generate_warranty_registration_number: { Args: never; Returns: string };
      generate_webhook_secret: { Args: never; Returns: string };
      generate_wishlist_share_token: { Args: never; Returns: string };
      get_abandoned_carts_for_recovery: {
        Args: { p_hours_ago?: number; p_max_attempts?: number };
        Returns: {
          cart_items: Json;
          created_at: string;
          currency: string;
          customer_email: string;
          id: string;
          recovery_attempts: number;
          session_id: string;
          total_amount: number;
          user_id: string;
        }[];
      };
      get_active_legal_document: {
        Args: { doc_language?: string; doc_type: string };
        Returns: {
          content: string;
          document_type: string;
          effective_date: string;
          id: string;
          language: string;
          title: string;
          version: string;
        }[];
      };
      get_artist_products_monitoring: {
        Args: never;
        Returns: {
          artist_name: string;
          artist_type: string;
          artwork_title: string;
          artwork_year: number;
          created_at: string;
          currency: string;
          id: string;
          is_active: boolean;
          is_draft: boolean;
          price: number;
          product_id: string;
          product_name: string;
          store_id: string;
          store_name: string;
          store_owner_id: string;
          total_orders: number;
          total_quantity_sold: number;
          total_revenue: number;
          updated_at: string;
        }[];
      };
      get_artist_products_stats: { Args: never; Returns: Json };
      get_available_drip_content: {
        Args: { p_customer_id: string; p_digital_product_id?: string };
        Returns: {
          actual_release_date: string;
          digital_product_id: string;
          drip_schedule_id: string;
          file_id: string;
          file_name: string;
          file_url: string;
          is_available: boolean;
          is_released: boolean;
          release_id: string;
          release_message: string;
          release_title: string;
          scheduled_release_date: string;
        }[];
      };
      get_available_quantity: {
        Args: { p_physical_product_id?: string; p_variant_id?: string };
        Returns: number;
      };
      get_available_slots: {
        Args: {
          p_date: string;
          p_duration_minutes?: number;
          p_product_id: string;
        };
        Returns: {
          end_time: string;
          is_available: boolean;
          start_time: string;
        }[];
      };
      get_dispute_stats: { Args: never; Returns: Json };
      get_disputes_stats: { Args: never; Returns: Json };
      get_download_analytics: {
        Args: { p_days?: number; p_digital_product_id: string };
        Returns: {
          avg_download_time: number;
          downloads_by_day: Json;
          failed_downloads: number;
          successful_downloads: number;
          top_countries: Json;
          total_downloads: number;
          unique_users: number;
        }[];
      };
      get_enrollment_stats: { Args: never; Returns: Json };
      get_frequently_bought_together: {
        Args: { p_limit?: number; p_product_id: string };
        Returns: {
          category: string;
          currency: string;
          image_url: string;
          price: number;
          product_id: string;
          product_name: string;
          product_slug: string;
          product_type: string;
          promotional_price: number;
          purchases_count: number;
          rating: number;
          recommendation_score: number;
          reviews_count: number;
          store_id: string;
          store_name: string;
          store_slug: string;
          times_bought_together: number;
        }[];
      };
      get_gift_card_balance: {
        Args: { p_code: string; p_store_id: string };
        Returns: number;
      };
      get_latest_file_version: {
        Args: { p_file_id: string };
        Returns: {
          file_url: string;
          released_at: string;
          version_label: string;
          version_number: number;
        }[];
      };
      get_latest_tracking_status: {
        Args: { p_tracking_number: string };
        Returns: {
          estimated_delivery: string;
          is_delivered: boolean;
          latest_event: Record<string, unknown>;
        }[];
      };
      get_lesson_notes: {
        Args: { p_enrollment_id: string; p_lesson_id: string };
        Returns: {
          content: string;
          created_at: string;
          id: string;
          note_type: string;
          tags: string[];
          timestamp_seconds: number;
        }[];
      };
      get_next_course_in_path: {
        Args: { p_path_enrollment_id: string };
        Returns: string;
      };
      get_next_lot_for_sale: {
        Args: {
          p_physical_product_id: string;
          p_quantity: number;
          p_rotation_method?: string;
          p_variant_id?: string;
          p_warehouse_id?: string;
        };
        Returns: {
          available_quantity: number;
          days_until_expiration: number;
          expiration_date: string;
          lot_id: string;
          lot_number: string;
        }[];
      };
      get_next_unlock_date: {
        Args: {
          p_course_id: string;
          p_enrollment_id: string;
          p_section_id: string;
        };
        Returns: string;
      };
      get_pending_commission_total: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_pending_transaction_retries: {
        Args: never;
        Returns: {
          attempt_number: number;
          max_attempts: number;
          payment_provider: string;
          retry_id: string;
          transaction_id: string;
        }[];
      };
      get_physical_products_kpis: {
        Args: { p_date_from?: string; p_date_to?: string; p_store_id: string };
        Returns: {
          average_order_value: number;
          low_stock_count: number;
          orders_growth: number;
          out_of_stock_count: number;
          return_rate: number;
          revenue_growth: number;
          top_selling_product_id: string;
          top_selling_product_name: string;
          total_orders: number;
          total_returns: number;
          total_revenue: number;
          total_units_sold: number;
        }[];
      };
      get_physical_products_trends: {
        Args: { p_days?: number; p_store_id: string };
        Returns: {
          date: string;
          orders: number;
          returns: number;
          revenue: number;
          units_sold: number;
        }[];
      };
      get_physical_webhook_stats: {
        Args: { webhook_id_param: string };
        Returns: {
          avg_response_time_ms: number;
          last_triggered_at: string;
          success_rate: number;
          total_triggered: number;
        }[];
      };
      get_popular_searches: {
        Args: { p_days?: number; p_limit?: number };
        Returns: {
          count: number;
          last_searched: string;
          query: string;
        }[];
      };
      get_product_price_in_currency: {
        Args: {
          p_country_code?: string;
          p_currency_code: string;
          p_product_id: string;
        };
        Returns: number;
      };
      get_product_recommendations: {
        Args: { p_limit?: number; p_product_id: string };
        Returns: {
          category: string;
          currency: string;
          image_url: string;
          price: number;
          product_id: string;
          product_name: string;
          product_slug: string;
          product_type: string;
          promotional_price: number;
          purchases_count: number;
          rating: number;
          recommendation_reason: string;
          recommendation_score: number;
          recommendation_type: string;
          reviews_count: number;
          store_id: string;
          store_name: string;
          store_slug: string;
        }[];
      };
      get_profile_completion_percentage: {
        Args: { profile_id: string };
        Returns: number;
      };
      get_profile_stats: { Args: { profile_user_id: string }; Returns: Json };
      get_push_subscriptions_for_user: {
        Args: { p_user_id: string };
        Returns: {
          device_info: Json;
          endpoint: string;
          id: string;
          keys: Json;
          user_agent: string;
        }[];
      };
      get_remaining_downloads: {
        Args: { p_digital_product_id: string; p_user_id: string };
        Returns: number;
      };
      get_search_suggestions: {
        Args: { p_limit?: number; p_query: string };
        Returns: {
          count: number;
          relevance: number;
          suggestion: string;
          suggestion_type: string;
        }[];
      };
      get_service_booking_stats: {
        Args: { p_product_id: string };
        Returns: Json;
      };
      get_store_status: { Args: { store_id: string }; Returns: boolean };
      get_student_cohorts: {
        Args: { p_course_id: string; p_user_id: string };
        Returns: {
          cohort_id: string;
          cohort_name: string;
          cohort_type: string;
          member_count: number;
          role: string;
        }[];
      };
      get_top_physical_products: {
        Args: { p_days?: number; p_limit?: number; p_store_id: string };
        Returns: {
          average_rating: number;
          current_stock: number;
          image_url: string;
          product_id: string;
          product_name: string;
          return_rate: number;
          total_revenue: number;
          total_units_sold: number;
        }[];
      };
      get_total_warehouse_stock: {
        Args: { p_inventory_item_id: string };
        Returns: number;
      };
      get_unlocked_sections: {
        Args: { p_course_id: string; p_enrollment_id: string };
        Returns: {
          is_unlocked: boolean;
          section_id: string;
        }[];
      };
      get_unread_count: { Args: never; Returns: number };
      get_unread_message_count: {
        Args: { conversation_id_param: string; user_id_param: string };
        Returns: number;
      };
      get_upcoming_sessions: {
        Args: { p_course_id: string };
        Returns: {
          id: string;
          registered_count: number;
          scheduled_start: string;
          status: string;
          title: string;
        }[];
      };
      get_user_email: { Args: { p_user_id: string }; Returns: string };
      get_user_product_recommendations: {
        Args: { p_limit?: number; p_user_id: string };
        Returns: {
          category: string;
          currency: string;
          image_url: string;
          price: number;
          product_id: string;
          product_name: string;
          product_slug: string;
          product_type: string;
          promotional_price: number;
          purchases_count: number;
          rating: number;
          recommendation_reason: string;
          recommendation_score: number;
          recommendation_type: string;
          reviews_count: number;
          store_id: string;
          store_name: string;
          store_slug: string;
        }[];
      };
      get_user_push_subscriptions: {
        Args: never;
        Returns: {
          created_at: string;
          device_info: Json;
          endpoint: string;
          id: string;
          keys: Json;
          user_agent: string;
        }[];
      };
      get_users_emails: {
        Args: { p_user_ids: string[] };
        Returns: {
          email: string;
          user_id: string;
        }[];
      };
      grade_assignment: {
        Args: {
          p_feedback?: string;
          p_feedback_files?: Json;
          p_grade: number;
          p_graded_by: string;
          p_private_notes?: string;
          p_rubric_scores?: Json;
          p_submission_id: string;
        };
        Returns: boolean;
      };
      has_digital_access: {
        Args: { p_product_id: string; p_user_email: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_affiliate_link_clicks: {
        Args: { p_link_id: string };
        Returns: undefined;
      };
      increment_affiliate_link_sales: {
        Args: { p_commission: number; p_link_id: string; p_revenue: number };
        Returns: undefined;
      };
      increment_file_download_count: {
        Args: { p_file_id: string };
        Returns: undefined;
      };
      increment_template_download: {
        Args: { template_id: string };
        Returns: undefined;
      };
      increment_template_usage: {
        Args: { template_id: string };
        Returns: undefined;
      };
      initialize_student_points: {
        Args: {
          p_course_id: string;
          p_enrollment_id: string;
          p_user_id: string;
        };
        Returns: string;
      };
      initialize_user_gamification: {
        Args: { p_user_id: string };
        Returns: {
          created_at: string;
          current_level: number | null;
          current_streak_days: number | null;
          experience_points: number | null;
          experience_points_to_next_level: number | null;
          global_rank: number | null;
          id: string;
          last_activity_date: string | null;
          longest_streak_days: number | null;
          monthly_rank: number | null;
          points_earned_this_month: number | null;
          points_earned_this_week: number | null;
          points_earned_today: number | null;
          total_achievements_unlocked: number | null;
          total_badges_earned: number | null;
          total_orders_completed: number | null;
          total_points: number | null;
          total_products_purchased: number | null;
          total_referrals: number | null;
          total_reviews_written: number | null;
          updated_at: string;
          user_id: string;
          weekly_rank: number | null;
        }[];
        SetofOptions: {
          from: '*';
          to: 'user_gamification';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      invalidate_cache: { Args: { cache_key: string }; Returns: undefined };
      is_product_favorited: {
        Args: { p_product_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_product_slug_available: {
        Args: {
          check_slug: string;
          check_store_id: string;
          exclude_product_id?: string;
        };
        Returns: boolean;
      };
      is_promotion_valid: {
        Args: { p_customer_id?: string; p_promotion_id: string };
        Returns: boolean;
      };
      is_store_slug_available: {
        Args: { check_slug: string; exclude_store_id?: string };
        Returns: boolean;
      };
      is_webhook_already_processed: {
        Args: { p_provider: string; p_status: string; p_transaction_id: string };
        Returns: boolean;
      };
      log_admin_action: {
        Args: {
          p_action_type: string;
          p_details?: Json;
          p_target_id?: string;
          p_target_type: string;
        };
        Returns: string;
      };
      log_notification: {
        Args: {
          p_body: string;
          p_channel?: string;
          p_data?: Json;
          p_provider?: string;
          p_push_subscription_id?: string;
          p_status?: string;
          p_title: string;
          p_type: string;
          p_user_id: string;
        };
        Returns: string;
      };
      manual_rollback_version: {
        Args: {
          p_reason: string;
          p_rollback_to_version_id: string;
          p_triggered_by: string;
          p_version_id: string;
        };
        Returns: Json;
      };
      mark_all_notifications_read: { Args: never; Returns: undefined };
      mark_cart_recovered: {
        Args: { p_session_id?: string; p_user_id?: string };
        Returns: undefined;
      };
      mark_lesson_complete: {
        Args: {
          p_enrollment_id: string;
          p_lesson_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      mark_notification_read: {
        Args: { notification_id: string };
        Returns: undefined;
      };
      mark_recovery_email_sent: {
        Args: { p_abandoned_cart_id: string };
        Returns: undefined;
      };
      pause_subscription: {
        Args: {
          p_paused_until: string;
          p_reason?: string;
          p_subscription_id: string;
        };
        Returns: undefined;
      };
      process_refund: {
        Args: {
          p_performed_by: string;
          p_refund_amount: number;
          p_refund_method: string;
          p_refund_transaction_id?: string;
          p_return_id: string;
        };
        Returns: undefined;
      };
      record_coupon_usage:
        | {
            Args: {
              p_coupon_id: string;
              p_customer_id: string;
              p_discount_amount: number;
              p_order_id: string;
              p_order_total_after: number;
              p_order_total_before: number;
            };
            Returns: undefined;
          }
        | {
            Args: {
              discount_amount_param: number;
              final_amount_param: number;
              order_id_param: string;
              original_amount_param: number;
              promotion_id_param: string;
              session_id_param?: string;
            };
            Returns: string;
          };
      record_referral_commission: {
        Args: {
          p_amount: number;
          p_description: string;
          p_referred_id: string;
          p_referrer_id: string;
        };
        Returns: string;
      };
      record_region_metric: {
        Args: {
          p_metadata?: Json;
          p_metric_type: string;
          p_metric_value: number;
          p_region: string;
        };
        Returns: string;
      };
      redeem_gift_card: {
        Args: { p_amount: number; p_gift_card_id: string; p_order_id: string };
        Returns: {
          amount_used: number;
          message: string;
          remaining_balance: number;
          success: boolean;
        }[];
      };
      redeem_loyalty_reward: {
        Args: { p_customer_id: string; p_reward_id: string; p_store_id: string };
        Returns: string;
      };
      register_for_session: {
        Args: {
          p_enrollment_id: string;
          p_session_id: string;
          p_user_id: string;
        };
        Returns: string;
      };
      release_drip_content: { Args: { p_release_id: string }; Returns: Json };
      renew_digital_subscription: {
        Args: { p_subscription_id: string };
        Returns: Json;
      };
      reschedule_recurring_bookings: {
        Args: {
          p_new_start_date: string;
          p_pattern_id: string;
          p_reschedule_from_date?: string;
        };
        Returns: number;
      };
      reserve_inventory: {
        Args: { p_inventory_item_id: string; p_quantity: number };
        Returns: boolean;
      };
      reset_daily_points: { Args: never; Returns: undefined };
      resolve_dispute: {
        Args: { p_dispute_id: string; p_resolution: string };
        Returns: boolean;
      };
      resume_subscription: {
        Args: { p_subscription_id: string };
        Returns: undefined;
      };
      save_push_subscription: {
        Args: {
          p_device_info?: Json;
          p_endpoint: string;
          p_keys: Json;
          p_user_agent?: string;
        };
        Returns: string;
      };
      schedule_plan_change: {
        Args: {
          p_change_type: string;
          p_new_subscription_id: string;
          p_prorated_amount?: number;
          p_scheduled_at?: string;
          p_subscription_id: string;
        };
        Returns: undefined;
      };
      search_products: {
        Args: {
          p_category?: string;
          p_limit?: number;
          p_max_price?: number;
          p_min_price?: number;
          p_min_rating?: number;
          p_offset?: number;
          p_product_type?: string;
          p_search_query: string;
        };
        Returns: {
          category: string;
          currency: string;
          description: string;
          id: string;
          image_url: string;
          match_type: string;
          name: string;
          price: number;
          product_type: string;
          promotional_price: number;
          purchases_count: number;
          rank: number;
          rating: number;
          reviews_count: number;
          slug: string;
          store_id: string;
          store_logo_url: string;
          store_name: string;
          store_slug: string;
        }[];
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      start_subscription_trial: {
        Args: { p_subscription_id: string; p_trial_days: number };
        Returns: undefined;
      };
      submit_assignment: {
        Args: {
          p_assignment_id: string;
          p_enrollment_id: string;
          p_submission_code?: string;
          p_submission_files?: Json;
          p_submission_text?: string;
          p_submission_url?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      test_artist_products_referential_integrity: {
        Args: never;
        Returns: {
          message: string;
          passed: boolean;
          test_name: string;
        }[];
      };
      test_integration: { Args: { p_integration_id: string }; Returns: Json };
      test_rls_artist_products_user_access: {
        Args: { p_store_id: string; p_user_id: string };
        Returns: {
          message: string;
          passed: boolean;
          test_name: string;
        }[];
      };
      test_webhook: { Args: { p_webhook_id: string }; Returns: string };
      toggle_store_status: { Args: { store_id: string }; Returns: boolean };
      track_affiliate_click: {
        Args: {
          p_ip_address?: string;
          p_link_code: string;
          p_referer_url?: string;
          p_user_agent?: string;
        };
        Returns: Json;
      };
      track_short_link_click: { Args: { p_short_code: string }; Returns: Json };
      trigger_webhook: {
        Args: { p_event_type: string; p_payload: Json; p_store_id: string };
        Returns: undefined;
      };
      update_batch_shipment_status: {
        Args: { p_batch_id: string };
        Returns: undefined;
      };
      update_customer_tier: {
        Args: { p_customer_id: string; p_store_id: string };
        Returns: Database['public']['Enums']['loyalty_tier_type'];
      };
      update_digital_product_stats: {
        Args: { p_digital_product_id: string };
        Returns: undefined;
      };
      update_notification_status: {
        Args: { p_error_message?: string; p_log_id: string; p_status: string };
        Returns: undefined;
      };
      update_path_progress: {
        Args: { p_course_id: string; p_path_enrollment_id: string };
        Returns: boolean;
      };
      update_physical_webhook_counters: {
        Args: { success: boolean; webhook_id_param: string };
        Returns: undefined;
      };
      update_return_status: {
        Args: {
          p_new_status: string;
          p_notes?: string;
          p_performed_by: string;
          p_return_id: string;
        };
        Returns: undefined;
      };
      update_store_earnings: {
        Args: { p_store_id: string };
        Returns: undefined;
      };
      update_streak: {
        Args: { p_enrollment_id: string; p_user_id: string };
        Returns: boolean;
      };
      update_template_rating: {
        Args: { new_rating: number; template_id: string };
        Returns: undefined;
      };
      update_webhook_delivery_status: {
        Args: {
          p_delivery_id: string;
          p_duration_ms?: number;
          p_error_message?: string;
          p_error_type?: string;
          p_response_body?: string;
          p_response_headers?: Json;
          p_response_status_code?: number;
          p_status: Database['public']['Enums']['webhook_delivery_status'];
        };
        Returns: undefined;
      };
      update_webhook_stats: {
        Args: { p_success: boolean; p_webhook_id: string };
        Returns: undefined;
      };
      validate_artist_product: {
        Args: {
          p_artist_name: string;
          p_artist_type: string;
          p_artwork_dimensions: Json;
          p_artwork_edition_type: string;
          p_artwork_link_url: string;
          p_artwork_title: string;
          p_artwork_year: number;
          p_edition_number: number;
          p_requires_shipping: boolean;
          p_shipping_handling_time: number;
          p_shipping_insurance_amount: number;
          p_total_editions: number;
        };
        Returns: string;
      };
      validate_artist_type_specifics: {
        Args: {
          p_artist_type: string;
          p_designer_specific: Json;
          p_multimedia_specific: Json;
          p_musician_specific: Json;
          p_visual_artist_specific: Json;
          p_writer_specific: Json;
        };
        Returns: string;
      };
      validate_artwork_basic_info: {
        Args: { p_dimensions: Json; p_year: number };
        Returns: boolean;
      };
      validate_artwork_dimensions: {
        Args: { p_dimensions: Json };
        Returns: boolean;
      };
      validate_artwork_link_url: { Args: { p_url: string }; Returns: boolean };
      validate_artwork_year: { Args: { p_year: number }; Returns: boolean };
      validate_coupon:
        | {
            Args: {
              p_code: string;
              p_customer_id?: string;
              p_order_amount?: number;
              p_product_id?: string;
              p_product_type?: string;
              p_store_id?: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              cart_subtotal: number;
              coupon_code: string;
              product_ids?: string[];
              product_types?: string[];
            };
            Returns: Json;
          };
      validate_course_prerequisite: {
        Args: {
          p_enrollment_id: string;
          p_prerequisite_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      validate_digital_product: {
        Args: {
          p_name: string;
          p_price: number;
          p_product_id?: string;
          p_slug: string;
          p_store_id: string;
        };
        Returns: Json;
      };
      validate_digital_version: {
        Args: {
          p_digital_product_id: string;
          p_store_id: string;
          p_version: string;
        };
        Returns: Json;
      };
      validate_download_token: { Args: { p_token: string }; Returns: Json };
      validate_edition_info: {
        Args: {
          p_edition_number: number;
          p_edition_type: string;
          p_total_editions: number;
        };
        Returns: boolean;
      };
      validate_gift_card: {
        Args: { p_code: string; p_store_id: string };
        Returns: {
          current_balance: number;
          gift_card_id: string;
          is_valid: boolean;
          message: string;
          status: Database['public']['Enums']['gift_card_status'];
        }[];
      };
      validate_license: {
        Args: { p_device_fingerprint?: string; p_license_key: string };
        Returns: Json;
      };
      validate_physical_product: {
        Args: {
          p_name: string;
          p_price: number;
          p_product_id?: string;
          p_quantity: number;
          p_sku: string;
          p_slug: string;
          p_store_id: string;
          p_weight: number;
        };
        Returns: Json;
      };
      validate_product_slug: {
        Args: { p_product_id?: string; p_slug: string; p_store_id: string };
        Returns: Json;
      };
      validate_service: {
        Args: {
          p_duration: number;
          p_max_participants: number;
          p_meeting_url: string;
          p_name: string;
          p_price: number;
          p_product_id?: string;
          p_slug: string;
          p_store_id: string;
        };
        Returns: Json;
      };
      validate_shipping_artwork_link: {
        Args: { p_artwork_link_url: string; p_requires_shipping: boolean };
        Returns: boolean;
      };
      validate_sku: {
        Args: { p_product_id?: string; p_sku: string; p_store_id: string };
        Returns: Json;
      };
      validate_transaction_amount: {
        Args: { p_amount: number; p_transaction_id: string };
        Returns: boolean;
      };
      verify_api_key: {
        Args: { p_key: string };
        Returns: {
          permissions: Json;
          store_id: string;
          user_id: string;
        }[];
      };
    };
    Enums: {
      activation_status: 'active' | 'deactivated' | 'revoked';
      app_role: 'admin' | 'user';
      bundle_discount_type: 'percentage' | 'fixed' | 'custom';
      bundle_status: 'draft' | 'active' | 'inactive' | 'scheduled' | 'expired';
      gift_card_status: 'active' | 'redeemed' | 'expired' | 'cancelled' | 'pending';
      gift_card_transaction_type:
        | 'purchase'
        | 'redemption'
        | 'refund'
        | 'expiration'
        | 'adjustment';
      license_status: 'active' | 'expired' | 'revoked' | 'suspended' | 'transferred';
      license_type: 'single' | 'multi' | 'unlimited' | 'subscription';
      loyalty_reward_status: 'active' | 'inactive' | 'expired';
      loyalty_reward_type:
        | 'discount'
        | 'free_product'
        | 'free_shipping'
        | 'gift_card'
        | 'cash_back'
        | 'custom';
      loyalty_tier_type: 'bronze' | 'silver' | 'gold' | 'platinum';
      loyalty_transaction_type:
        | 'earned'
        | 'redeemed'
        | 'expired'
        | 'adjusted'
        | 'bonus'
        | 'refunded';
      pricing_model: 'one-time' | 'subscription' | 'pay-what-you-want' | 'free';
      product_type: 'digital' | 'physical' | 'service';
      version_status: 'draft' | 'beta' | 'stable' | 'deprecated';
      webhook_delivery_status: 'pending' | 'delivered' | 'failed' | 'retrying';
      webhook_event_type:
        | 'order.created'
        | 'order.updated'
        | 'order.completed'
        | 'order.cancelled'
        | 'order.refunded'
        | 'payment.completed'
        | 'payment.failed'
        | 'payment.refunded'
        | 'payment.pending'
        | 'product.created'
        | 'product.updated'
        | 'product.deleted'
        | 'product.published'
        | 'digital_product.downloaded'
        | 'digital_product.license_activated'
        | 'digital_product.license_revoked'
        | 'service.booking_created'
        | 'service.booking_confirmed'
        | 'service.booking_cancelled'
        | 'service.booking_completed'
        | 'service.booking_rescheduled'
        | 'course.enrolled'
        | 'course.unenrolled'
        | 'course.completed'
        | 'course.progress_updated'
        | 'return.created'
        | 'return.approved'
        | 'return.rejected'
        | 'return.completed'
        | 'subscription.created'
        | 'subscription.renewed'
        | 'subscription.cancelled'
        | 'subscription.expired'
        | 'customer.created'
        | 'customer.updated'
        | 'custom';
      webhook_status: 'active' | 'inactive' | 'paused';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activation_status: ['active', 'deactivated', 'revoked'],
      app_role: ['admin', 'user'],
      bundle_discount_type: ['percentage', 'fixed', 'custom'],
      bundle_status: ['draft', 'active', 'inactive', 'scheduled', 'expired'],
      gift_card_status: ['active', 'redeemed', 'expired', 'cancelled', 'pending'],
      gift_card_transaction_type: ['purchase', 'redemption', 'refund', 'expiration', 'adjustment'],
      license_status: ['active', 'expired', 'revoked', 'suspended', 'transferred'],
      license_type: ['single', 'multi', 'unlimited', 'subscription'],
      loyalty_reward_status: ['active', 'inactive', 'expired'],
      loyalty_reward_type: [
        'discount',
        'free_product',
        'free_shipping',
        'gift_card',
        'cash_back',
        'custom',
      ],
      loyalty_tier_type: ['bronze', 'silver', 'gold', 'platinum'],
      loyalty_transaction_type: ['earned', 'redeemed', 'expired', 'adjusted', 'bonus', 'refunded'],
      pricing_model: ['one-time', 'subscription', 'pay-what-you-want', 'free'],
      product_type: ['digital', 'physical', 'service'],
      version_status: ['draft', 'beta', 'stable', 'deprecated'],
      webhook_delivery_status: ['pending', 'delivered', 'failed', 'retrying'],
      webhook_event_type: [
        'order.created',
        'order.updated',
        'order.completed',
        'order.cancelled',
        'order.refunded',
        'payment.completed',
        'payment.failed',
        'payment.refunded',
        'payment.pending',
        'product.created',
        'product.updated',
        'product.deleted',
        'product.published',
        'digital_product.downloaded',
        'digital_product.license_activated',
        'digital_product.license_revoked',
        'service.booking_created',
        'service.booking_confirmed',
        'service.booking_cancelled',
        'service.booking_completed',
        'service.booking_rescheduled',
        'course.enrolled',
        'course.unenrolled',
        'course.completed',
        'course.progress_updated',
        'return.created',
        'return.approved',
        'return.rejected',
        'return.completed',
        'subscription.created',
        'subscription.renewed',
        'subscription.cancelled',
        'subscription.expired',
        'customer.created',
        'customer.updated',
        'custom',
      ],
      webhook_status: ['active', 'inactive', 'paused'],
    },
  },
} as const;
