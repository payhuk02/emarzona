export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          store_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          store_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          store_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          date_of_birth: string
          document_back_url: string | null
          document_front_url: string
          document_type: Database["public"]["Enums"]["document_type"]
          full_name: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          date_of_birth: string
          document_back_url?: string | null
          document_front_url: string
          document_type: Database["public"]["Enums"]["document_type"]
          full_name: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          date_of_birth?: string
          document_back_url?: string | null
          document_front_url?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          full_name?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string
          status: string
          store_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string
          status?: string
          store_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          currency: string
          customer_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_method: string
          seller_amount: number | null
          status: string
          store_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method: string
          seller_amount?: number | null
          status?: string
          store_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string
          seller_amount?: number | null
          status?: string
          store_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          order_id: string | null
          pixel_id: string
          product_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          order_id?: string | null
          pixel_id: string
          product_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          order_id?: string | null
          pixel_id?: string
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixel_events_pixel_id_fkey"
            columns: ["pixel_id"]
            isOneToOne: false
            referencedRelation: "user_pixels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixel_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_id: string | null
          payment_id: string | null
          product_id: string | null
          seller_amount: number
          status: string
          store_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string | null
          payment_id?: string | null
          product_id?: string | null
          seller_amount?: number
          status?: string
          store_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string | null
          payment_id?: string | null
          product_id?: string | null
          seller_amount?: number
          status?: string
          store_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_platform_commissions_store"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          automatic_discount_enabled: boolean | null
          category: string | null
          category_id: string | null
          collect_shipping_address: boolean | null
          created_at: string
          currency: string
          custom_fields: Json | null
          description: string | null
          digital_file_url: string | null
          discount_trigger: string | null
          downloadable_files: Json | null
          faqs: Json | null
          hide_from_store: boolean | null
          hide_purchase_count: boolean | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean
          is_draft: boolean | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string
          og_image: string | null
          password_protected: boolean | null
          post_purchase_guide_url: string | null
          price: number
          pricing_model: Database["public"]["Enums"]["pricing_model"] | null
          product_password: string | null
          product_type: string | null
          promotional_price: number | null
          purchase_limit: number | null
          rating: number | null
          reviews_count: number | null
          sale_end_date: string | null
          sale_start_date: string | null
          slug: string
          store_id: string
          updated_at: string
          watermark_enabled: boolean | null
        }
        Insert: {
          automatic_discount_enabled?: boolean | null
          category?: string | null
          category_id?: string | null
          collect_shipping_address?: boolean | null
          created_at?: string
          currency?: string
          custom_fields?: Json | null
          description?: string | null
          digital_file_url?: string | null
          discount_trigger?: string | null
          downloadable_files?: Json | null
          faqs?: Json | null
          hide_from_store?: boolean | null
          hide_purchase_count?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          is_draft?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name: string
          og_image?: string | null
          password_protected?: boolean | null
          post_purchase_guide_url?: string | null
          price?: number
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          product_password?: string | null
          product_type?: string | null
          promotional_price?: number | null
          purchase_limit?: number | null
          rating?: number | null
          reviews_count?: number | null
          sale_end_date?: string | null
          sale_start_date?: string | null
          slug: string
          store_id: string
          updated_at?: string
          watermark_enabled?: boolean | null
        }
        Update: {
          automatic_discount_enabled?: boolean | null
          category?: string | null
          category_id?: string | null
          collect_shipping_address?: boolean | null
          created_at?: string
          currency?: string
          custom_fields?: Json | null
          description?: string | null
          digital_file_url?: string | null
          discount_trigger?: string | null
          downloadable_files?: Json | null
          faqs?: Json | null
          hide_from_store?: boolean | null
          hide_purchase_count?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          is_draft?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string
          og_image?: string | null
          password_protected?: boolean | null
          post_purchase_guide_url?: string | null
          price?: number
          pricing_model?: Database["public"]["Enums"]["pricing_model"] | null
          product_password?: string | null
          product_type?: string | null
          promotional_price?: number | null
          purchase_limit?: number | null
          rating?: number | null
          reviews_count?: number | null
          sale_end_date?: string | null
          sale_start_date?: string | null
          slug?: string
          store_id?: string
          updated_at?: string
          watermark_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          is_suspended: boolean | null
          last_name: string | null
          referral_code: string | null
          referred_by: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          total_referral_earnings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_name?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          total_referral_earnings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_name?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          total_referral_earnings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_purchase_amount: number | null
          start_date: string | null
          store_id: string
          updated_at: string
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_amount?: number | null
          start_date?: string | null
          store_id: string
          updated_at?: string
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_purchase_amount?: number | null
          start_date?: string | null
          store_id?: string
          updated_at?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_id: string | null
          paid_at: string | null
          payment_id: string | null
          referral_id: string
          referred_id: string
          referrer_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          referral_id: string
          referred_id: string
          referrer_id: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          referral_id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_pages: {
        Row: {
          clicks: number | null
          created_at: string | null
          ctr: number | null
          description: string | null
          id: string
          impressions: number | null
          indexed: boolean | null
          last_crawled: string | null
          page_id: string | null
          page_type: string
          position: number | null
          seo_score: number | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          description?: string | null
          id?: string
          impressions?: number | null
          indexed?: boolean | null
          last_crawled?: string | null
          page_id?: string | null
          page_type: string
          position?: number | null
          seo_score?: number | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          description?: string | null
          id?: string
          impressions?: number | null
          indexed?: boolean | null
          last_crawled?: string | null
          page_id?: string | null
          page_type?: string
          position?: number | null
          seo_score?: number | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          about: string | null
          active_clients: number | null
          banner_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          custom_domain: string | null
          default_currency: string
          description: string | null
          domain_error_message: string | null
          domain_status: string | null
          domain_verification_token: string | null
          domain_verified_at: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string
          og_image: string | null
          seo_score: number | null
          slug: string
          theme_color: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          active_clients?: number | null
          banner_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          default_currency?: string
          description?: string | null
          domain_error_message?: string | null
          domain_status?: string | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name: string
          og_image?: string | null
          seo_score?: number | null
          slug: string
          theme_color?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          active_clients?: number | null
          banner_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_domain?: string | null
          default_currency?: string
          description?: string | null
          domain_error_message?: string | null
          domain_status?: string | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string
          og_image?: string | null
          seo_score?: number | null
          slug?: string
          theme_color?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_logs: {
        Row: {
          created_at: string
          error_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          request_data: Json | null
          response_data: Json | null
          status: string
          transaction_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          error_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status: string
          transaction_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          error_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
          transaction_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          moneroo_checkout_url: string | null
          moneroo_payment_method: string | null
          moneroo_response: Json | null
          moneroo_transaction_id: string | null
          order_id: string | null
          payment_id: string | null
          product_id: string | null
          retry_count: number | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          moneroo_checkout_url?: string | null
          moneroo_payment_method?: string | null
          moneroo_response?: Json | null
          moneroo_transaction_id?: string | null
          order_id?: string | null
          payment_id?: string | null
          product_id?: string | null
          retry_count?: number | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          moneroo_checkout_url?: string | null
          moneroo_payment_method?: string | null
          moneroo_response?: Json | null
          moneroo_transaction_id?: string | null
          order_id?: string | null
          payment_id?: string | null
          product_id?: string | null
          retry_count?: number | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pixels: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          pixel_code: string | null
          pixel_id: string
          pixel_name: string | null
          pixel_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          pixel_code?: string | null
          pixel_id: string
          pixel_name?: string | null
          pixel_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          pixel_code?: string | null
          pixel_id?: string
          pixel_name?: string | null
          pixel_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_product_slug_available: {
        Args: {
          check_slug: string
          check_store_id: string
          exclude_product_id?: string
        }
        Returns: boolean
      }
      is_store_slug_available: {
        Args: { check_slug: string; exclude_store_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      document_type: "cni" | "passport" | "drivers_license" | "other"
      kyc_status: "pending" | "verified" | "rejected"
      pricing_model: "one-time" | "subscription" | "pay-what-you-want" | "free"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      document_type: ["cni", "passport", "drivers_license", "other"],
      kyc_status: ["pending", "verified", "rejected"],
      pricing_model: ["one-time", "subscription", "pay-what-you-want", "free"],
    },
  },
} as const
