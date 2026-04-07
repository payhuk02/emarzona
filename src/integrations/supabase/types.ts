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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          id: string
          items: Json | null
          recovered_at: string | null
          recovery_email_sent: boolean | null
          session_id: string | null
          status: string | null
          store_id: string
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          items?: Json | null
          recovered_at?: string | null
          recovery_email_sent?: boolean | null
          session_id?: string | null
          status?: string | null
          store_id: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          items?: Json | null
          recovered_at?: string | null
          recovery_email_sent?: boolean | null
          session_id?: string | null
          status?: string | null
          store_id?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_actions: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          category: string | null
          config_key: string
          config_value: Json | null
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          config_key: string
          config_value?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          config_key?: string
          config_value?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          affiliate_link_id: string
          converted: boolean | null
          cookie_expires_at: string | null
          created_at: string
          id: string
          ip_address: string | null
          product_id: string | null
          referrer: string | null
          tracking_cookie: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          affiliate_link_id: string
          converted?: boolean | null
          cookie_expires_at?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          product_id?: string | null
          referrer?: string | null
          tracking_cookie?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          affiliate_link_id?: string
          converted?: boolean | null
          cookie_expires_at?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          product_id?: string | null
          referrer?: string | null
          tracking_cookie?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          commission_rate: number | null
          created_at: string
          id: string
          order_id: string | null
          paid_at: string | null
          product_id: string | null
          status: string | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount?: number
          commission_rate?: number | null
          created_at?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          status?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_rate?: number | null
          created_at?: string
          id?: string
          order_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          status?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          click_count: number | null
          conversion_count: number | null
          created_at: string
          id: string
          is_active: boolean | null
          product_id: string | null
          short_code: string
          store_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          affiliate_id: string
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          short_code: string
          store_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          affiliate_id?: string
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string | null
          short_code?: string
          store_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_short_links: {
        Row: {
          affiliate_id: string
          click_count: number | null
          conversion_count: number | null
          created_at: string
          destination_url: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          product_id: string | null
          short_code: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          destination_url: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          product_id?: string | null
          short_code: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          destination_url?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          product_id?: string | null
          short_code?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_short_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_short_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_short_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_short_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawals: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          bio: string | null
          commission_rate: number | null
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          pending_balance: number | null
          referral_code: string | null
          status: string | null
          store_id: string | null
          total_earnings: number | null
          total_paid: number | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          pending_balance?: number | null
          referral_code?: string | null
          status?: string | null
          store_id?: string | null
          total_earnings?: number | null
          total_paid?: number | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          pending_balance?: number | null
          referral_code?: string | null
          status?: string | null
          store_id?: string | null
          total_earnings?: number | null
          total_paid?: number | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_collection_items: {
        Row: {
          added_at: string
          artist_product_id: string
          collection_id: string
          collection_notes: string | null
          display_order: number | null
          id: string
          is_featured_in_collection: boolean | null
          product_id: string
        }
        Insert: {
          added_at?: string
          artist_product_id: string
          collection_id: string
          collection_notes?: string | null
          display_order?: number | null
          id?: string
          is_featured_in_collection?: boolean | null
          product_id: string
        }
        Update: {
          added_at?: string
          artist_product_id?: string
          collection_id?: string
          collection_notes?: string | null
          display_order?: number | null
          id?: string
          is_featured_in_collection?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_collection_items_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "artist_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_collection_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_collections: {
        Row: {
          artist_product_id: string | null
          collection_description: string | null
          collection_name: string
          collection_short_description: string | null
          collection_slug: string
          collection_type: string | null
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          display_order: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          metadata: Json | null
          store_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          artist_product_id?: string | null
          collection_description?: string | null
          collection_name: string
          collection_short_description?: string | null
          collection_slug: string
          collection_type?: string | null
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          store_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          artist_product_id?: string | null
          collection_description?: string | null
          collection_name?: string
          collection_short_description?: string | null
          collection_slug?: string
          collection_type?: string | null
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          store_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_collections_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_galleries: {
        Row: {
          created_at: string
          display_order: number | null
          gallery_category: string | null
          gallery_cover_image_url: string | null
          gallery_description: string | null
          gallery_name: string
          gallery_slug: string
          gallery_tags: string[] | null
          id: string
          is_public: boolean | null
          portfolio_id: string
          total_artworks: number | null
          total_views: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          gallery_category?: string | null
          gallery_cover_image_url?: string | null
          gallery_description?: string | null
          gallery_name: string
          gallery_slug: string
          gallery_tags?: string[] | null
          id?: string
          is_public?: boolean | null
          portfolio_id: string
          total_artworks?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          gallery_category?: string | null
          gallery_cover_image_url?: string | null
          gallery_description?: string | null
          gallery_name?: string
          gallery_slug?: string
          gallery_tags?: string[] | null
          id?: string
          is_public?: boolean | null
          portfolio_id?: string
          total_artworks?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_galleries_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "artist_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_portfolios: {
        Row: {
          artist_product_id: string
          created_at: string
          display_order: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          portfolio_bio: string | null
          portfolio_description: string | null
          portfolio_image_url: string | null
          portfolio_links: Json | null
          portfolio_name: string
          portfolio_slug: string
          store_id: string
          total_artworks: number | null
          total_likes: number | null
          total_views: number | null
          updated_at: string
        }
        Insert: {
          artist_product_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          portfolio_bio?: string | null
          portfolio_description?: string | null
          portfolio_image_url?: string | null
          portfolio_links?: Json | null
          portfolio_name: string
          portfolio_slug: string
          store_id: string
          total_artworks?: number | null
          total_likes?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Update: {
          artist_product_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          portfolio_bio?: string | null
          portfolio_description?: string | null
          portfolio_image_url?: string | null
          portfolio_links?: Json | null
          portfolio_name?: string
          portfolio_slug?: string
          store_id?: string
          total_artworks?: number | null
          total_likes?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_portfolios_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_portfolios_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_portfolios_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_product_auctions: {
        Row: {
          allow_automatic_extension: boolean | null
          artist_product_id: string
          auction_description: string | null
          auction_slug: string
          auction_title: string
          buy_now_price: number | null
          created_at: string
          current_bid: number | null
          end_date: string
          extended_end_date: string | null
          extension_minutes: number | null
          id: string
          minimum_bid_increment: number | null
          require_verification: boolean | null
          reserve_price: number | null
          start_date: string
          starting_price: number
          status: string | null
          store_id: string
          total_bids: number | null
          unique_bidders: number | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          allow_automatic_extension?: boolean | null
          artist_product_id: string
          auction_description?: string | null
          auction_slug: string
          auction_title: string
          buy_now_price?: number | null
          created_at?: string
          current_bid?: number | null
          end_date: string
          extended_end_date?: string | null
          extension_minutes?: number | null
          id?: string
          minimum_bid_increment?: number | null
          require_verification?: boolean | null
          reserve_price?: number | null
          start_date: string
          starting_price?: number
          status?: string | null
          store_id: string
          total_bids?: number | null
          unique_bidders?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          allow_automatic_extension?: boolean | null
          artist_product_id?: string
          auction_description?: string | null
          auction_slug?: string
          auction_title?: string
          buy_now_price?: number | null
          created_at?: string
          current_bid?: number | null
          end_date?: string
          extended_end_date?: string | null
          extension_minutes?: number | null
          id?: string
          minimum_bid_increment?: number | null
          require_verification?: boolean | null
          reserve_price?: number | null
          start_date?: string
          starting_price?: number
          status?: string | null
          store_id?: string
          total_bids?: number | null
          unique_bidders?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_product_auctions_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_product_auctions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_product_auctions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_product_certificates: {
        Row: {
          artist_name: string
          artist_product_id: string
          artwork_medium: string | null
          artwork_title: string
          artwork_year: number | null
          buyer_email: string | null
          buyer_name: string
          certificate_image_url: string | null
          certificate_number: string
          certificate_pdf_url: string | null
          certificate_type: string | null
          created_at: string
          download_count: number | null
          downloaded_at: string | null
          edition_number: number | null
          generated_at: string | null
          id: string
          is_generated: boolean | null
          is_public: boolean | null
          is_valid: boolean | null
          order_id: string | null
          order_item_id: string | null
          product_id: string
          purchase_date: string
          revoked: boolean | null
          revoked_at: string | null
          revoked_reason: string | null
          signed_by_artist: boolean | null
          signed_date: string | null
          total_edition: number | null
          updated_at: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          artist_name: string
          artist_product_id: string
          artwork_medium?: string | null
          artwork_title: string
          artwork_year?: number | null
          buyer_email?: string | null
          buyer_name: string
          certificate_image_url?: string | null
          certificate_number: string
          certificate_pdf_url?: string | null
          certificate_type?: string | null
          created_at?: string
          download_count?: number | null
          downloaded_at?: string | null
          edition_number?: number | null
          generated_at?: string | null
          id?: string
          is_generated?: boolean | null
          is_public?: boolean | null
          is_valid?: boolean | null
          order_id?: string | null
          order_item_id?: string | null
          product_id: string
          purchase_date: string
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signed_by_artist?: boolean | null
          signed_date?: string | null
          total_edition?: number | null
          updated_at?: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          artist_name?: string
          artist_product_id?: string
          artwork_medium?: string | null
          artwork_title?: string
          artwork_year?: number | null
          buyer_email?: string | null
          buyer_name?: string
          certificate_image_url?: string | null
          certificate_number?: string
          certificate_pdf_url?: string | null
          certificate_type?: string | null
          created_at?: string
          download_count?: number | null
          downloaded_at?: string | null
          edition_number?: number | null
          generated_at?: string | null
          id?: string
          is_generated?: boolean | null
          is_public?: boolean | null
          is_valid?: boolean | null
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string
          purchase_date?: string
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signed_by_artist?: boolean | null
          signed_date?: string | null
          total_edition?: number | null
          updated_at?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_product_certificates_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_product_certificates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_product_certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_product_dedications: {
        Row: {
          artist_product_id: string
          completed_at: string | null
          created_at: string
          dedication_text: string
          font_style: string | null
          id: string
          notes: string | null
          order_id: string | null
          preview_image_url: string | null
          product_id: string
          recipient_name: string | null
          status: string | null
          text_position: string | null
          updated_at: string
        }
        Insert: {
          artist_product_id: string
          completed_at?: string | null
          created_at?: string
          dedication_text: string
          font_style?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          preview_image_url?: string | null
          product_id: string
          recipient_name?: string | null
          status?: string | null
          text_position?: string | null
          updated_at?: string
        }
        Update: {
          artist_product_id?: string
          completed_at?: string | null
          created_at?: string
          dedication_text?: string
          font_style?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          preview_image_url?: string | null
          product_id?: string
          recipient_name?: string | null
          status?: string | null
          text_position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_product_dedications_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_product_dedications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_product_dedications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_products: {
        Row: {
          artist_bio: string | null
          artist_name: string
          artist_photo_url: string | null
          artist_social_links: Json | null
          artist_type: string | null
          artist_website: string | null
          artwork_dimensions: Json | null
          artwork_edition_type: string | null
          artwork_link_url: string | null
          artwork_medium: string | null
          artwork_title: string | null
          artwork_year: number | null
          certificate_file_url: string | null
          certificate_of_authenticity: boolean | null
          created_at: string
          designer_specific: Json | null
          edition_number: number | null
          id: string
          multimedia_specific: Json | null
          musician_specific: Json | null
          product_id: string
          requires_shipping: boolean | null
          shipping_fragile: boolean | null
          shipping_handling_time: number | null
          shipping_insurance_amount: number | null
          shipping_insurance_required: boolean | null
          signature_authenticated: boolean | null
          signature_location: string | null
          store_id: string
          total_editions: number | null
          updated_at: string
          visual_artist_specific: Json | null
          writer_specific: Json | null
        }
        Insert: {
          artist_bio?: string | null
          artist_name?: string
          artist_photo_url?: string | null
          artist_social_links?: Json | null
          artist_type?: string | null
          artist_website?: string | null
          artwork_dimensions?: Json | null
          artwork_edition_type?: string | null
          artwork_link_url?: string | null
          artwork_medium?: string | null
          artwork_title?: string | null
          artwork_year?: number | null
          certificate_file_url?: string | null
          certificate_of_authenticity?: boolean | null
          created_at?: string
          designer_specific?: Json | null
          edition_number?: number | null
          id?: string
          multimedia_specific?: Json | null
          musician_specific?: Json | null
          product_id: string
          requires_shipping?: boolean | null
          shipping_fragile?: boolean | null
          shipping_handling_time?: number | null
          shipping_insurance_amount?: number | null
          shipping_insurance_required?: boolean | null
          signature_authenticated?: boolean | null
          signature_location?: string | null
          store_id: string
          total_editions?: number | null
          updated_at?: string
          visual_artist_specific?: Json | null
          writer_specific?: Json | null
        }
        Update: {
          artist_bio?: string | null
          artist_name?: string
          artist_photo_url?: string | null
          artist_social_links?: Json | null
          artist_type?: string | null
          artist_website?: string | null
          artwork_dimensions?: Json | null
          artwork_edition_type?: string | null
          artwork_link_url?: string | null
          artwork_medium?: string | null
          artwork_title?: string | null
          artwork_year?: number | null
          certificate_file_url?: string | null
          certificate_of_authenticity?: boolean | null
          created_at?: string
          designer_specific?: Json | null
          edition_number?: number | null
          id?: string
          multimedia_specific?: Json | null
          musician_specific?: Json | null
          product_id?: string
          requires_shipping?: boolean | null
          shipping_fragile?: boolean | null
          shipping_handling_time?: number | null
          shipping_insurance_amount?: number | null
          shipping_insurance_required?: boolean | null
          signature_authenticated?: boolean | null
          signature_location?: string | null
          store_id?: string
          total_editions?: number | null
          updated_at?: string
          visual_artist_specific?: Json | null
          writer_specific?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_3d_models: {
        Row: {
          auto_play: boolean | null
          auto_rotate: boolean | null
          background_color: string | null
          camera_position: Json | null
          camera_target: Json | null
          created_at: string
          id: string
          interactions_count: number | null
          model_metadata: Json | null
          model_size_bytes: number | null
          model_type: string | null
          model_url: string
          preview_images: string[] | null
          product_id: string
          show_controls: boolean | null
          store_id: string
          thumbnail_url: string | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          auto_play?: boolean | null
          auto_rotate?: boolean | null
          background_color?: string | null
          camera_position?: Json | null
          camera_target?: Json | null
          created_at?: string
          id?: string
          interactions_count?: number | null
          model_metadata?: Json | null
          model_size_bytes?: number | null
          model_type?: string | null
          model_url: string
          preview_images?: string[] | null
          product_id: string
          show_controls?: boolean | null
          store_id: string
          thumbnail_url?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          auto_play?: boolean | null
          auto_rotate?: boolean | null
          background_color?: string | null
          camera_position?: Json | null
          camera_target?: Json | null
          created_at?: string
          id?: string
          interactions_count?: number | null
          model_metadata?: Json | null
          model_size_bytes?: number | null
          model_type?: string | null
          model_url?: string
          preview_images?: string[] | null
          product_id?: string
          show_controls?: boolean | null
          store_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_3d_models_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_3d_models_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_3d_models_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_certificates: {
        Row: {
          certificate_content: string | null
          certificate_number: string | null
          certificate_pdf_url: string | null
          certificate_type: string | null
          created_at: string
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          issued_by: string
          issued_by_contact: string | null
          issued_date: string
          metadata: Json | null
          product_id: string
          qr_code_url: string | null
          store_id: string
          updated_at: string
          verification_code: string | null
        }
        Insert: {
          certificate_content?: string | null
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          certificate_type?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_by: string
          issued_by_contact?: string | null
          issued_date: string
          metadata?: Json | null
          product_id: string
          qr_code_url?: string | null
          store_id: string
          updated_at?: string
          verification_code?: string | null
        }
        Update: {
          certificate_content?: string | null
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          certificate_type?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_by?: string
          issued_by_contact?: string | null
          issued_date?: string
          metadata?: Json | null
          product_id?: string
          qr_code_url?: string | null
          store_id?: string
          updated_at?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_certificates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_certificates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_certificates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_provenance: {
        Row: {
          blockchain_hash: string | null
          blockchain_network: string | null
          blockchain_tx_id: string | null
          certificates: Json | null
          created_at: string
          current_owner_id: string | null
          current_owner_name: string | null
          description: string | null
          documents: Json | null
          event_date: string
          id: string
          is_verified: boolean | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          metadata: Json | null
          notes: string | null
          previous_owner_id: string | null
          previous_owner_name: string | null
          product_id: string
          provenance_type: string | null
          recorded_date: string | null
          store_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          blockchain_hash?: string | null
          blockchain_network?: string | null
          blockchain_tx_id?: string | null
          certificates?: Json | null
          created_at?: string
          current_owner_id?: string | null
          current_owner_name?: string | null
          description?: string | null
          documents?: Json | null
          event_date: string
          id?: string
          is_verified?: boolean | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          metadata?: Json | null
          notes?: string | null
          previous_owner_id?: string | null
          previous_owner_name?: string | null
          product_id: string
          provenance_type?: string | null
          recorded_date?: string | null
          store_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          blockchain_hash?: string | null
          blockchain_network?: string | null
          blockchain_tx_id?: string | null
          certificates?: Json | null
          created_at?: string
          current_owner_id?: string | null
          current_owner_name?: string | null
          description?: string | null
          documents?: Json | null
          event_date?: string
          id?: string
          is_verified?: boolean | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          metadata?: Json | null
          notes?: string | null
          previous_owner_id?: string | null
          previous_owner_name?: string | null
          product_id?: string
          provenance_type?: string | null
          recorded_date?: string | null
          store_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_provenance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_provenance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_provenance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attempt_number: number | null
          course_id: string
          created_at: string
          enrollment_id: string
          feedback: string | null
          feedback_files: Json | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_late: boolean | null
          late_penalty_applied: number | null
          status: string | null
          submission_code: string | null
          submission_files: Json | null
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          attempt_number?: number | null
          course_id: string
          created_at?: string
          enrollment_id: string
          feedback?: string | null
          feedback_files?: Json | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          late_penalty_applied?: number | null
          status?: string | null
          submission_code?: string | null
          submission_files?: Json | null
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          attempt_number?: number | null
          course_id?: string
          created_at?: string
          enrollment_id?: string
          feedback?: string | null
          feedback_files?: Json | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          late_penalty_applied?: number | null
          status?: string | null
          submission_code?: string | null
          submission_files?: Json | null
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_bids: {
        Row: {
          auction_id: string
          bid_amount: number
          bid_type: string | null
          bidder_id: string
          created_at: string
          currency: string | null
          id: string
          ip_address: string | null
          is_proxy_bid: boolean | null
          max_bid_amount: number | null
          status: string | null
          user_agent: string | null
        }
        Insert: {
          auction_id: string
          bid_amount: number
          bid_type?: string | null
          bidder_id: string
          created_at?: string
          currency?: string | null
          id?: string
          ip_address?: string | null
          is_proxy_bid?: boolean | null
          max_bid_amount?: number | null
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          auction_id?: string
          bid_amount?: number
          bid_type?: string | null
          bidder_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          ip_address?: string | null
          is_proxy_bid?: boolean | null
          max_bid_amount?: number | null
          status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "artist_product_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_watchlist: {
        Row: {
          auction_id: string
          created_at: string
          id: string
          notify_on_ending: boolean | null
          notify_on_ending_soon: boolean | null
          notify_on_new_bid: boolean | null
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string
          id?: string
          notify_on_ending?: boolean | null
          notify_on_ending_soon?: boolean | null
          notify_on_new_bid?: boolean | null
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string
          id?: string
          notify_on_ending?: boolean | null
          notify_on_ending_soon?: boolean | null
          notify_on_new_bid?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_watchlist_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "artist_product_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_reorder_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          max_stock: number | null
          product_id: string
          reorder_point: number | null
          reorder_quantity: number | null
          store_id: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          max_stock?: number | null
          product_id: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          store_id: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          max_stock?: number | null
          product_id?: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          store_id?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_reorder_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_reorder_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_reorder_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_reorder_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      backorders: {
        Row: {
          created_at: string
          customer_id: string | null
          expected_date: string | null
          fulfilled_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          order_id: string | null
          product_id: string
          quantity: number
          status: string | null
          store_id: string
          updated_at: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          expected_date?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          order_id?: string | null
          product_id: string
          quantity?: number
          status?: string | null
          store_id: string
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          expected_date?: string | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          order_id?: string | null
          product_id?: string
          quantity?: number
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backorders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount: number | null
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          end_time: string | null
          id: string
          notes: string | null
          payment_status: string | null
          service_id: string
          start_time: string
          status: string | null
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          service_id: string
          start_time: string
          status?: string | null
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          service_id?: string
          start_time?: string
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number | null
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number | null
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string
          coupon_code: string | null
          currency: string
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          metadata: Json | null
          product_id: string
          product_image_url: string | null
          product_name: string
          product_type: string
          quantity: number
          session_id: string | null
          store_id: string | null
          unit_price: number
          updated_at: string
          user_id: string | null
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          added_at?: string
          coupon_code?: string | null
          currency?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          metadata?: Json | null
          product_id: string
          product_image_url?: string | null
          product_name: string
          product_type?: string
          quantity?: number
          session_id?: string | null
          store_id?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          added_at?: string
          coupon_code?: string | null
          currency?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          metadata?: Json | null
          product_id?: string
          product_image_url?: string | null
          product_name?: string
          product_type?: string
          quantity?: number
          session_id?: string | null
          store_id?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_enrollments: {
        Row: {
          certificate_issued: boolean | null
          certificate_issued_at: string | null
          cohort_id: string
          completed_at: string | null
          created_at: string
          dropped_at: string | null
          enrolled_at: string | null
          enrollment_status: string | null
          final_grade: number | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          order_id: string | null
          progress_percentage: number | null
          started_at: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          certificate_issued?: boolean | null
          certificate_issued_at?: string | null
          cohort_id: string
          completed_at?: string | null
          created_at?: string
          dropped_at?: string | null
          enrolled_at?: string | null
          enrollment_status?: string | null
          final_grade?: number | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          order_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          certificate_issued?: boolean | null
          certificate_issued_at?: string | null
          cohort_id?: string
          completed_at?: string | null
          created_at?: string
          dropped_at?: string | null
          enrolled_at?: string | null
          enrollment_status?: string | null
          final_grade?: number | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          order_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_enrollments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          badges: string[] | null
          bio: string | null
          city: string | null
          company: string | null
          country: string
          created_at: string
          email: string
          first_name: string
          github_url: string | null
          id: string
          join_date: string
          last_active: string | null
          last_name: string
          linkedin_url: string | null
          phone: string | null
          profession: string | null
          profile_image_url: string | null
          role: string
          status: string
          twitter_url: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          badges?: string[] | null
          bio?: string | null
          city?: string | null
          company?: string | null
          country?: string
          created_at?: string
          email: string
          first_name: string
          github_url?: string | null
          id?: string
          join_date?: string
          last_active?: string | null
          last_name: string
          linkedin_url?: string | null
          phone?: string | null
          profession?: string | null
          profile_image_url?: string | null
          role?: string
          status?: string
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          badges?: string[] | null
          bio?: string | null
          city?: string | null
          company?: string | null
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          github_url?: string | null
          id?: string
          join_date?: string
          last_active?: string | null
          last_name?: string
          linkedin_url?: string | null
          phone?: string | null
          profession?: string | null
          profile_image_url?: string | null
          role?: string
          status?: string
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_id: string
          category: string | null
          comments_count: number | null
          content: string
          content_type: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_featured: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          metadata: Json | null
          published_at: string | null
          shares_count: number | null
          status: string
          tags: string[] | null
          title: string | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id: string
          category?: string | null
          comments_count?: number | null
          content: string
          content_type?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          shares_count?: number | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string | null
          comments_count?: number | null
          content?: string
          content_type?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          metadata?: Json | null
          published_at?: string | null
          shares_count?: number | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_members"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          member_id: string
          post_id: string | null
          reaction_type: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          member_id: string
          post_id?: string | null
          reaction_type?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          member_id?: string
          post_id?: string | null
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "community_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json | null
          participant_ids: string[] | null
          status: string | null
          store_id: string | null
          subject: string | null
          type: string | null
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          participant_ids?: string[] | null
          status?: string | null
          store_id?: string | null
          subject?: string | null
          type?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          participant_ids?: string[] | null
          status?: string | null
          store_id?: string | null
          subject?: string | null
          type?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_preferences: {
        Row: {
          analytics: boolean | null
          created_at: string
          functional: boolean | null
          id: string
          marketing: boolean | null
          necessary: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics?: boolean | null
          created_at?: string
          functional?: boolean | null
          id?: string
          marketing?: boolean | null
          necessary?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analytics?: boolean | null
          created_at?: string
          functional?: boolean | null
          id?: string
          marketing?: boolean | null
          necessary?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          allow_late_submission: boolean | null
          allowed_file_types: string[] | null
          assignment_type: string | null
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          grading_type: string | null
          id: string
          instructions: string | null
          is_required: boolean | null
          is_visible: boolean | null
          late_penalty_percentage: number | null
          max_file_size: number | null
          max_files: number | null
          order_index: number | null
          points_possible: number | null
          rubric: Json | null
          section_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_late_submission?: boolean | null
          allowed_file_types?: string[] | null
          assignment_type?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          grading_type?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean | null
          is_visible?: boolean | null
          late_penalty_percentage?: number | null
          max_file_size?: number | null
          max_files?: number | null
          order_index?: number | null
          points_possible?: number | null
          rubric?: Json | null
          section_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_late_submission?: boolean | null
          allowed_file_types?: string[] | null
          assignment_type?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          grading_type?: string | null
          id?: string
          instructions?: string | null
          is_required?: boolean | null
          is_visible?: boolean | null
          late_penalty_percentage?: number | null
          max_file_size?: number | null
          max_files?: number | null
          order_index?: number | null
          points_possible?: number | null
          rubric?: Json | null
          section_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          certificate_number: string | null
          certificate_url: string | null
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          issued_at: string | null
          user_id: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_url?: string | null
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          issued_at?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string | null
          certificate_url?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          issued_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_cohorts: {
        Row: {
          allow_late_enrollment: boolean | null
          auto_start: boolean | null
          cohort_description: string | null
          cohort_name: string
          cohort_number: number | null
          cohort_slug: string
          course_id: string
          created_at: string
          current_students: number | null
          end_date: string | null
          enrollment_end_date: string | null
          enrollment_start_date: string | null
          id: string
          is_public: boolean | null
          max_students: number | null
          metadata: Json | null
          start_date: string
          status: string | null
          store_id: string
          updated_at: string
          waitlist_capacity: number | null
          waitlist_enabled: boolean | null
        }
        Insert: {
          allow_late_enrollment?: boolean | null
          auto_start?: boolean | null
          cohort_description?: string | null
          cohort_name: string
          cohort_number?: number | null
          cohort_slug: string
          course_id: string
          created_at?: string
          current_students?: number | null
          end_date?: string | null
          enrollment_end_date?: string | null
          enrollment_start_date?: string | null
          id?: string
          is_public?: boolean | null
          max_students?: number | null
          metadata?: Json | null
          start_date: string
          status?: string | null
          store_id: string
          updated_at?: string
          waitlist_capacity?: number | null
          waitlist_enabled?: boolean | null
        }
        Update: {
          allow_late_enrollment?: boolean | null
          auto_start?: boolean | null
          cohort_description?: string | null
          cohort_name?: string
          cohort_number?: number | null
          cohort_slug?: string
          course_id?: string
          created_at?: string
          current_students?: number | null
          end_date?: string | null
          enrollment_end_date?: string | null
          enrollment_start_date?: string | null
          id?: string
          is_public?: boolean | null
          max_students?: number | null
          metadata?: Json | null
          start_date?: string
          status?: string | null
          store_id?: string
          updated_at?: string
          waitlist_capacity?: number | null
          waitlist_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "course_cohorts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_cohorts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_cohorts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          certificate_issued: boolean | null
          certificate_url: string | null
          completed_at: string | null
          completed_lessons: number | null
          course_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          order_id: string | null
          progress_percentage: number | null
          started_at: string | null
          status: string | null
          total_lessons: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          completed_at?: string | null
          completed_lessons?: number | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          order_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          completed_at?: string | null
          completed_lessons?: number | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          order_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          is_completed: boolean | null
          last_position_seconds: number | null
          lesson_id: string
          total_watch_time_seconds: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id: string
          total_watch_time_seconds?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id?: string
          total_watch_time_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          attachments: Json | null
          content: string | null
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          lesson_type: string | null
          section_id: string
          sort_order: number | null
          title: string
          updated_at: string
          video_duration: number | null
          video_url: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          lesson_type?: string | null
          section_id: string
          sort_order?: number | null
          title: string
          updated_at?: string
          video_duration?: number | null
          video_url?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          lesson_type?: string | null
          section_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          video_duration?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_notes: {
        Row: {
          content: string
          created_at: string
          enrollment_id: string | null
          id: string
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          lesson_id?: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_notes_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          lesson_id: string | null
          max_attempts: number | null
          passing_score: number | null
          questions: Json | null
          sort_order: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          lesson_id?: string | null
          max_attempts?: number | null
          passing_score?: number | null
          questions?: Json | null
          sort_order?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          lesson_id?: string | null
          max_attempts?: number | null
          passing_score?: number | null
          questions?: Json | null
          sort_order?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          certificate_enabled: boolean | null
          created_at: string
          currency: string | null
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          id: string
          instructor_id: string
          is_featured: boolean | null
          is_published: boolean | null
          language: string | null
          objectives: string[] | null
          preview_video_url: string | null
          price: number | null
          product_id: string | null
          promotional_price: number | null
          rating: number | null
          requirements: string[] | null
          reviews_count: number | null
          short_description: string | null
          slug: string
          store_id: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_enrollments: number | null
          total_lessons: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          certificate_enabled?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          objectives?: string[] | null
          preview_video_url?: string | null
          price?: number | null
          product_id?: string | null
          promotional_price?: number | null
          rating?: number | null
          requirements?: string[] | null
          reviews_count?: number | null
          short_description?: string | null
          slug: string
          store_id: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_enrollments?: number | null
          total_lessons?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          certificate_enabled?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          objectives?: string[] | null
          preview_video_url?: string | null
          price?: number | null
          product_id?: string | null
          promotional_price?: number | null
          rating?: number | null
          requirements?: string[] | null
          reviews_count?: number | null
          short_description?: string | null
          slug?: string
          store_id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_enrollments?: number | null
          total_lessons?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_downloads: {
        Row: {
          created_at: string
          customer_id: string | null
          digital_product_id: string
          download_count: number | null
          expires_at: string | null
          file_id: string | null
          id: string
          last_downloaded_at: string | null
          order_id: string | null
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          digital_product_id: string
          download_count?: number | null
          expires_at?: string | null
          file_id?: string | null
          id?: string
          last_downloaded_at?: string | null
          order_id?: string | null
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          digital_product_id?: string
          download_count?: number | null
          expires_at?: string | null
          file_id?: string | null
          id?: string
          last_downloaded_at?: string | null
          order_id?: string | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_downloads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_downloads_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_downloads_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "digital_product_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_downloads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_downloads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_downloads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          name: string | null
          phone: string | null
          store_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          store_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          store_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dedication_templates: {
        Row: {
          artist_product_id: string
          created_at: string
          font_style: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          store_id: string
          template_text: string
          text_position: string | null
          updated_at: string
        }
        Insert: {
          artist_product_id: string
          created_at?: string
          font_style?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          store_id: string
          template_text: string
          text_position?: string | null
          updated_at?: string
        }
        Update: {
          artist_product_id?: string
          created_at?: string
          font_style?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          store_id?: string
          template_text?: string
          text_position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dedication_templates_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dedication_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dedication_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          actual_demand: number | null
          confidence_level: number | null
          created_at: string
          forecast_date: string
          id: string
          metadata: Json | null
          model_used: string | null
          predicted_demand: number | null
          product_id: string
          store_id: string
        }
        Insert: {
          actual_demand?: number | null
          confidence_level?: number | null
          created_at?: string
          forecast_date: string
          id?: string
          metadata?: Json | null
          model_used?: string | null
          predicted_demand?: number | null
          product_id: string
          store_id: string
        }
        Update: {
          actual_demand?: number | null
          confidence_level?: number | null
          created_at?: string
          forecast_date?: string
          id?: string
          metadata?: Json | null
          model_used?: string | null
          predicted_demand?: number | null
          product_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_forecasts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string | null
          metadata: Json | null
          priority: string | null
          product_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          store_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          product_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          store_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          product_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          store_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_bundles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          product_ids: string[] | null
          slug: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          product_ids?: string[] | null
          slug?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          product_ids?: string[] | null
          slug?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_license_activations: {
        Row: {
          activated_at: string | null
          created_at: string
          deactivated_at: string | null
          device_id: string | null
          device_name: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          license_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          device_id?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          license_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          device_id?: string | null
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_license_activations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "digital_product_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_licenses: {
        Row: {
          created_at: string
          current_activations: number | null
          customer_id: string | null
          digital_product_id: string
          expires_at: string | null
          id: string
          license_key: string
          license_type: string | null
          max_activations: number | null
          order_id: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_activations?: number | null
          customer_id?: string | null
          digital_product_id: string
          expires_at?: string | null
          id?: string
          license_key: string
          license_type?: string | null
          max_activations?: number | null
          order_id?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_activations?: number | null
          customer_id?: string | null
          digital_product_id?: string
          expires_at?: string | null
          id?: string
          license_key?: string
          license_type?: string | null
          max_activations?: number | null
          order_id?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_licenses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_licenses_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_licenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_licenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_licenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_bundles: {
        Row: {
          bundle_name: string
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          price: number
          product_ids: string[] | null
          store_id: string
          updated_at: string
        }
        Insert: {
          bundle_name: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          price: number
          product_ids?: string[] | null
          store_id: string
          updated_at?: string
        }
        Update: {
          bundle_name?: string
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          product_ids?: string[] | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          discount_type: string | null
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          min_purchase_amount: number | null
          product_id: string | null
          starts_at: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string | null
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          min_purchase_amount?: number | null
          product_id?: string | null
          starts_at?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          min_purchase_amount?: number | null
          product_id?: string | null
          starts_at?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_downloads: {
        Row: {
          created_at: string
          digital_product_id: string | null
          download_type: string | null
          file_id: string | null
          id: string
          ip_address: string | null
          order_id: string | null
          product_id: string
          store_id: string | null
          user_agent: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          created_at?: string
          digital_product_id?: string | null
          download_type?: string | null
          file_id?: string | null
          id?: string
          ip_address?: string | null
          order_id?: string | null
          product_id: string
          store_id?: string | null
          user_agent?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          created_at?: string
          digital_product_id?: string | null
          download_type?: string | null
          file_id?: string | null
          id?: string
          ip_address?: string | null
          order_id?: string | null
          product_id?: string
          store_id?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_downloads_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_downloads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_downloads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_downloads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_drip_schedule: {
        Row: {
          content_name: string
          content_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          product_id: string
          release_delay_days: number | null
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          content_name: string
          content_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id: string
          release_delay_days?: number | null
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          content_name?: string
          content_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string
          release_delay_days?: number | null
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_drip_schedule_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_drip_schedule_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_drip_schedule_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_file_categories: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          id: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_file_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_file_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_file_metadata: {
        Row: {
          checksum: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          mime_type: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          checksum?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_file_metadata_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_file_versions: {
        Row: {
          changelog: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          is_current: boolean | null
          product_id: string
          store_id: string
          version_number: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_current?: boolean | null
          product_id: string
          store_id: string
          version_number: string
        }
        Update: {
          changelog?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_current?: boolean | null
          product_id?: string
          store_id?: string
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_file_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_file_versions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_file_versions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_files: {
        Row: {
          created_at: string
          digital_product_id: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_preview: boolean | null
          name: string
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          digital_product_id: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_preview?: boolean | null
          name: string
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          digital_product_id?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_preview?: boolean | null
          name?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_files_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_files_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_files_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_licenses: {
        Row: {
          created_at: string
          current_activations: number | null
          expires_at: string | null
          id: string
          license_key: string
          license_type: string | null
          max_activations: number | null
          metadata: Json | null
          product_id: string
          status: string | null
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_activations?: number | null
          expires_at?: string | null
          id?: string
          license_key: string
          license_type?: string | null
          max_activations?: number | null
          metadata?: Json | null
          product_id: string
          status?: string | null
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_activations?: number | null
          expires_at?: string | null
          id?: string
          license_key?: string
          license_type?: string | null
          max_activations?: number | null
          metadata?: Json | null
          product_id?: string
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_licenses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_licenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_licenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_subscriptions: {
        Row: {
          amount: number | null
          cancelled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_type: string | null
          product_id: string
          status: string | null
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_type?: string | null
          product_id: string
          status?: string | null
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_type?: string | null
          product_id?: string
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_update_notifications: {
        Row: {
          created_at: string
          id: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          update_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          update_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          update_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_update_notifications_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "digital_product_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_updates: {
        Row: {
          changelog: string | null
          created_at: string
          description: string | null
          digital_product_id: string | null
          download_url: string | null
          file_size: number | null
          id: string
          is_published: boolean | null
          notify_customers: boolean | null
          product_id: string
          published_at: string | null
          store_id: string
          title: string
          update_type: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          description?: string | null
          digital_product_id?: string | null
          download_url?: string | null
          file_size?: number | null
          id?: string
          is_published?: boolean | null
          notify_customers?: boolean | null
          product_id: string
          published_at?: string | null
          store_id: string
          title: string
          update_type?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          changelog?: string | null
          created_at?: string
          description?: string | null
          digital_product_id?: string | null
          download_url?: string | null
          file_size?: number | null
          id?: string
          is_published?: boolean | null
          notify_customers?: boolean | null
          product_id?: string
          published_at?: string | null
          store_id?: string
          title?: string
          update_type?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_updates_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_updates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_updates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_updates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_versions: {
        Row: {
          changelog: string | null
          created_at: string
          digital_product_id: string
          file_size: number | null
          file_url: string | null
          id: string
          is_current: boolean | null
          store_id: string
          version_number: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          digital_product_id: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_current?: boolean | null
          store_id: string
          version_number: string
        }
        Update: {
          changelog?: string | null
          created_at?: string
          digital_product_id?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_current?: boolean | null
          store_id?: string
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_versions_digital_product_id_fkey"
            columns: ["digital_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_versions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_versions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "digital_product_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_product_webhooks: {
        Row: {
          created_at: string
          event_types: string[] | null
          headers: Json | null
          id: string
          is_active: boolean | null
          secret: string | null
          store_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          event_types?: string[] | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          secret?: string | null
          store_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          event_types?: string[] | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          secret?: string | null
          store_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_product_webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_products: {
        Row: {
          created_at: string
          digital_type: string | null
          download_limit: number | null
          file_size: number | null
          formats: string[] | null
          id: string
          instant_delivery: boolean | null
          license_type: string | null
          product_id: string
          store_id: string
          total_downloads: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          digital_type?: string | null
          download_limit?: number | null
          file_size?: number | null
          formats?: string[] | null
          id?: string
          instant_delivery?: boolean | null
          license_type?: string | null
          product_id: string
          store_id: string
          total_downloads?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          digital_type?: string | null
          download_limit?: number | null
          file_size?: number | null
          formats?: string[] | null
          id?: string
          instant_delivery?: boolean | null
          license_type?: string | null
          product_id?: string
          store_id?: string
          total_downloads?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string | null
          evidence: Json | null
          id: string
          initiator_id: string
          initiator_type: string
          order_id: string | null
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          store_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence?: Json | null
          id?: string
          initiator_id: string
          initiator_type?: string
          order_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          store_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence?: Json | null
          id?: string
          initiator_id?: string
          initiator_type?: string
          order_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          store_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      download_events: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          product_id: string | null
          status: string | null
          token_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          status?: string | null
          token_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          status?: string | null
          token_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_events_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "download_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      download_logs: {
        Row: {
          created_at: string
          download_token: string | null
          file_name: string | null
          file_url: string | null
          id: string
          ip_address: string | null
          product_id: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          download_token?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          download_token?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          ip_address?: string | null
          product_id?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "download_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      download_tokens: {
        Row: {
          created_at: string
          download_count: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_downloads: number | null
          product_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_downloads?: number | null
          product_id: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_count?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_downloads?: number | null
          product_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_tokens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_content_releases: {
        Row: {
          accessed_at: string | null
          created_at: string
          id: string
          released_at: string | null
          schedule_id: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          created_at?: string
          id?: string
          released_at?: string | null
          schedule_id?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          created_at?: string
          id?: string
          released_at?: string | null
          schedule_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_content_releases_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "digital_product_drip_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_tests: {
        Row: {
          campaign_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          name: string
          results: Json | null
          started_at: string | null
          status: string | null
          store_id: string
          test_percentage: number | null
          updated_at: string
          variant_a: Json | null
          variant_b: Json | null
          winner: string | null
          winning_metric: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          name: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          store_id: string
          test_percentage?: number | null
          updated_at?: string
          variant_a?: Json | null
          variant_b?: Json | null
          winner?: string | null
          winning_metric?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          store_id?: string
          test_percentage?: number | null
          updated_at?: string
          variant_a?: Json | null
          variant_b?: Json | null
          winner?: string | null
          winning_metric?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_tests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_tests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          ab_test_enabled: boolean | null
          ab_test_variants: Json | null
          ab_test_winner: string | null
          audience_filters: Json | null
          audience_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_recipients: number | null
          id: string
          metrics: Json | null
          name: string
          recurrence: string | null
          recurrence_end_at: string | null
          scheduled_at: string | null
          segment_id: string | null
          send_at_timezone: string | null
          status: string
          store_id: string
          template_id: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          ab_test_enabled?: boolean | null
          ab_test_variants?: Json | null
          ab_test_winner?: string | null
          audience_filters?: Json | null
          audience_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_recipients?: number | null
          id?: string
          metrics?: Json | null
          name: string
          recurrence?: string | null
          recurrence_end_at?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          send_at_timezone?: string | null
          status?: string
          store_id: string
          template_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          ab_test_enabled?: boolean | null
          ab_test_variants?: Json | null
          ab_test_winner?: string | null
          audience_filters?: Json | null
          audience_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_recipients?: number | null
          id?: string
          metrics?: Json | null
          name?: string
          recurrence?: string | null
          recurrence_end_at?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          send_at_timezone?: string | null
          status?: string
          store_id?: string
          template_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          campaign_id: string | null
          click_count: number | null
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          open_count: number | null
          opened_at: string | null
          order_id: string | null
          product_id: string | null
          product_type: string | null
          recipient_email: string
          recipient_name: string | null
          sendgrid_message_id: string | null
          sendgrid_status: string | null
          sent_at: string | null
          store_id: string | null
          subject: string | null
          template_id: string | null
          template_slug: string | null
          updated_at: string
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          open_count?: number | null
          opened_at?: string | null
          order_id?: string | null
          product_id?: string | null
          product_type?: string | null
          recipient_email: string
          recipient_name?: string | null
          sendgrid_message_id?: string | null
          sendgrid_status?: string | null
          sent_at?: string | null
          store_id?: string | null
          subject?: string | null
          template_id?: string | null
          template_slug?: string | null
          updated_at?: string
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          open_count?: number | null
          opened_at?: string | null
          order_id?: string | null
          product_id?: string | null
          product_type?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sendgrid_message_id?: string | null
          sendgrid_status?: string | null
          sent_at?: string | null
          store_id?: string | null
          subject?: string | null
          template_id?: string | null
          template_slug?: string | null
          updated_at?: string
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string
          email_frequency: string | null
          id: string
          marketing_emails: boolean | null
          newsletter: boolean | null
          notification_emails: boolean | null
          order_updates: boolean | null
          preferred_language: string | null
          product_updates: boolean | null
          promotional_emails: boolean | null
          transactional_emails: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_frequency?: string | null
          id?: string
          marketing_emails?: boolean | null
          newsletter?: boolean | null
          notification_emails?: boolean | null
          order_updates?: boolean | null
          preferred_language?: string | null
          product_updates?: boolean | null
          promotional_emails?: boolean | null
          transactional_emails?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_frequency?: string | null
          id?: string
          marketing_emails?: boolean | null
          newsletter?: boolean | null
          notification_emails?: boolean | null
          order_updates?: boolean | null
          preferred_language?: string | null
          product_updates?: boolean | null
          promotional_emails?: boolean | null
          transactional_emails?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_segments: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_dynamic: boolean | null
          last_calculated_at: string | null
          match_type: string | null
          name: string
          store_id: string
          subscriber_count: number | null
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_dynamic?: boolean | null
          last_calculated_at?: string | null
          match_type?: string | null
          name: string
          store_id: string
          subscriber_count?: number | null
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_dynamic?: boolean | null
          last_calculated_at?: string | null
          match_type?: string | null
          name?: string
          store_id?: string
          subscriber_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_segments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_segments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          email: string
          id: string
          metadata: Json | null
          sequence_id: string
          status: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          email: string
          id?: string
          metadata?: Json | null
          sequence_id: string
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          email?: string
          id?: string
          metadata?: Json | null
          sequence_id?: string
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          click_rate: number | null
          conditions: Json | null
          content: string | null
          created_at: string
          delay_days: number
          delay_hours: number | null
          id: string
          is_active: boolean | null
          open_rate: number | null
          sent_count: number | null
          sequence_id: string
          step_order: number
          subject: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          click_rate?: number | null
          conditions?: Json | null
          content?: string | null
          created_at?: string
          delay_days?: number
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          open_rate?: number | null
          sent_count?: number | null
          sequence_id: string
          step_order?: number
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          click_rate?: number | null
          conditions?: Json | null
          content?: string | null
          created_at?: string
          delay_days?: number
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          open_rate?: number | null
          sent_count?: number | null
          sequence_id?: string
          step_order?: number
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          conversion_rate: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          status: string
          store_id: string
          total_completed: number | null
          total_enrolled: number | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          status?: string
          store_id: string
          total_completed?: number | null
          total_enrolled?: number | null
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          status?: string
          store_id?: string
          total_completed?: number | null
          total_enrolled?: number | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequences_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          click_rate: number | null
          created_at: string
          created_by: string | null
          from_email: string | null
          from_name: string | null
          html_content: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          open_rate: number | null
          product_type: string | null
          reply_to: string | null
          sendgrid_template_id: string | null
          sent_count: number | null
          slug: string
          store_id: string | null
          subject: Json | null
          text_content: Json | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          click_rate?: number | null
          created_at?: string
          created_by?: string | null
          from_email?: string | null
          from_name?: string | null
          html_content?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          open_rate?: number | null
          product_type?: string | null
          reply_to?: string | null
          sendgrid_template_id?: string | null
          sent_count?: number | null
          slug: string
          store_id?: string | null
          subject?: Json | null
          text_content?: Json | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          click_rate?: number | null
          created_at?: string
          created_by?: string | null
          from_email?: string | null
          from_name?: string | null
          html_content?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          open_rate?: number | null
          product_type?: string | null
          reply_to?: string | null
          sendgrid_template_id?: string | null
          sent_count?: number | null
          slug?: string
          store_id?: string | null
          subject?: Json | null
          text_content?: Json | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          campaign_id: string | null
          created_at: string
          email: string
          id: string
          reason: string | null
          store_id: string | null
          unsubscribe_type: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          email: string
          id?: string
          reason?: string | null
          store_id?: string | null
          unsubscribe_type?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
          store_id?: string | null
          unsubscribe_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      email_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          status: string | null
          steps: Json | null
          store_id: string
          success_rate: number | null
          total_runs: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          status?: string | null
          steps?: Json | null
          store_id: string
          success_rate?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          status?: string | null
          steps?: Json | null
          store_id?: string
          success_rate?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_workflows_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_workflows_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      expiration_alerts: {
        Row: {
          alert_date: string | null
          alert_type: string | null
          created_at: string
          id: string
          is_sent: boolean | null
          license_id: string | null
          product_id: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          alert_date?: string | null
          alert_type?: string | null
          created_at?: string
          id?: string
          is_sent?: boolean | null
          license_id?: string | null
          product_id?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          alert_date?: string | null
          alert_type?: string | null
          created_at?: string
          id?: string
          is_sent?: boolean | null
          license_id?: string | null
          product_id?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expiration_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_artworks: {
        Row: {
          added_at: string
          artist_product_id: string
          artwork_description: string | null
          artwork_image_url: string | null
          artwork_title: string | null
          display_order: number | null
          gallery_id: string
          id: string
          is_featured: boolean | null
          product_id: string
        }
        Insert: {
          added_at?: string
          artist_product_id: string
          artwork_description?: string | null
          artwork_image_url?: string | null
          artwork_title?: string | null
          display_order?: number | null
          gallery_id: string
          id?: string
          is_featured?: boolean | null
          product_id: string
        }
        Update: {
          added_at?: string
          artist_product_id?: string
          artwork_description?: string | null
          artwork_image_url?: string | null
          artwork_title?: string | null
          display_order?: number | null
          gallery_id?: string
          id?: string
          is_featured?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_artworks_artist_product_id_fkey"
            columns: ["artist_product_id"]
            isOneToOne: false
            referencedRelation: "artist_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_artworks_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "artist_galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_artworks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          gift_card_id: string
          id: string
          order_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description?: string | null
          gift_card_id: string
          id?: string
          order_id?: string | null
          type?: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          gift_card_id?: string
          id?: string
          order_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          activated_at: string | null
          code: string
          created_at: string
          currency: string | null
          current_balance: number
          expires_at: string | null
          id: string
          initial_balance: number
          last_used_at: string | null
          message: string | null
          purchaser_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          code: string
          created_at?: string
          currency?: string | null
          current_balance?: number
          expires_at?: string | null
          id?: string
          initial_balance?: number
          last_used_at?: string | null
          message?: string | null
          purchaser_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          code?: string
          created_at?: string
          currency?: string | null
          current_balance?: number
          expires_at?: string | null
          id?: string
          initial_balance?: number
          last_used_at?: string | null
          message?: string | null
          purchaser_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      global_shipping_services: {
        Row: {
          api_endpoint: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          metadata: Json | null
          name: string
          slug: string
          supported_countries: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          slug: string
          supported_countries?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          slug?: string
          supported_countries?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      in_app_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          notification_type: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          location: string | null
          product_id: string
          quantity: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          reserved_quantity: number | null
          store_id: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          product_id: string
          quantity?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          store_id: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          product_id?: string
          quantity?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          store_id?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          available_quantity: number | null
          cost_per_unit: number | null
          created_at: string
          id: string
          location: string | null
          metadata: Json | null
          product_id: string
          quantity: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          reserved_quantity: number | null
          sku: string | null
          store_id: string
          updated_at: string
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          available_quantity?: number | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          product_id: string
          quantity?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          sku?: string | null
          store_id: string
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          available_quantity?: number | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          product_id?: string
          quantity?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          sku?: string | null
          store_id?: string
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          currency: string | null
          customer_id: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          metadata: Json | null
          notes: string | null
          order_id: string | null
          paid_at: string | null
          status: string | null
          store_id: string
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
          store_id: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
          store_id?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_assemblies: {
        Row: {
          assembled_at: string | null
          created_at: string
          id: string
          kit_id: string
          notes: string | null
          order_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assembled_at?: string | null
          created_at?: string
          id?: string
          kit_id: string
          notes?: string | null
          order_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assembled_at?: string | null
          created_at?: string
          id?: string
          kit_id?: string
          notes?: string | null
          order_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_assemblies_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_assemblies_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_components: {
        Row: {
          component_product_id: string
          created_at: string
          id: string
          is_required: boolean | null
          kit_id: string
          quantity: number | null
        }
        Insert: {
          component_product_id: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          kit_id: string
          quantity?: number | null
        }
        Update: {
          component_product_id?: string
          created_at?: string
          id?: string
          is_required?: boolean | null
          kit_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kit_components_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_components_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_courses: {
        Row: {
          course_id: string
          created_at: string
          estimated_duration_hours: number | null
          id: string
          is_required: boolean | null
          learning_path_id: string
          order_index: number | null
          unlock_after_completion: boolean | null
        }
        Insert: {
          course_id: string
          created_at?: string
          estimated_duration_hours?: number | null
          id?: string
          is_required?: boolean | null
          learning_path_id: string
          order_index?: number | null
          unlock_after_completion?: boolean | null
        }
        Update: {
          course_id?: string
          created_at?: string
          estimated_duration_hours?: number | null
          id?: string
          is_required?: boolean | null
          learning_path_id?: string
          order_index?: number | null
          unlock_after_completion?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          average_rating: number | null
          completion_rate: number | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          display_order: number | null
          estimated_duration_days: number | null
          estimated_duration_hours: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_free: boolean | null
          learning_objectives: string[] | null
          level: string | null
          price: number | null
          short_description: string | null
          store_id: string
          target_audience: string[] | null
          title: string
          total_courses: number | null
          total_students: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          completion_rate?: number | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          display_order?: number | null
          estimated_duration_days?: number | null
          estimated_duration_hours?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          learning_objectives?: string[] | null
          level?: string | null
          price?: number | null
          short_description?: string | null
          store_id: string
          target_audience?: string[] | null
          title: string
          total_courses?: number | null
          total_students?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          completion_rate?: number | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          display_order?: number | null
          estimated_duration_days?: number | null
          estimated_duration_hours?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          learning_objectives?: string[] | null
          level?: string | null
          price?: number | null
          short_description?: string | null
          store_id?: string
          target_audience?: string[] | null
          title?: string
          total_courses?: number | null
          total_students?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      license_activations: {
        Row: {
          activated_at: string | null
          created_at: string
          deactivated_at: string | null
          device_info: Json | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          license_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          license_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_activations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "digital_product_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          license_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          license_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_events_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "digital_product_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          allow_chat: boolean | null
          allow_questions: boolean | null
          allow_screen_share: boolean | null
          cohort_id: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_public: boolean | null
          max_participants: number | null
          meeting_id: string | null
          meeting_password: string | null
          meeting_url: string | null
          metadata: Json | null
          platform: string | null
          recording_available_until: string | null
          recording_enabled: boolean | null
          recording_url: string | null
          require_registration: boolean | null
          scheduled_end: string
          scheduled_start: string
          session_type: string | null
          status: string | null
          streaming_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          allow_chat?: boolean | null
          allow_questions?: boolean | null
          allow_screen_share?: boolean | null
          cohort_id?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          platform?: string | null
          recording_available_until?: string | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          require_registration?: boolean | null
          scheduled_end: string
          scheduled_start: string
          session_type?: string | null
          status?: string | null
          streaming_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          allow_chat?: boolean | null
          allow_questions?: boolean | null
          allow_screen_share?: boolean | null
          cohort_id?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          platform?: string | null
          recording_available_until?: string | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          require_registration?: boolean | null
          scheduled_end?: string
          scheduled_start?: string
          session_type?: string | null
          status?: string | null
          streaming_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_movements: {
        Row: {
          created_at: string
          from_location: string | null
          id: string
          lot_id: string
          movement_type: string
          notes: string | null
          performed_by: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          to_location: string | null
        }
        Insert: {
          created_at?: string
          from_location?: string | null
          id?: string
          lot_id: string
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          to_location?: string | null
        }
        Update: {
          created_at?: string
          from_location?: string | null
          id?: string
          lot_id?: string
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          to_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lot_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_transfers: {
        Row: {
          created_at: string
          from_warehouse_id: string | null
          id: string
          lot_id: string
          notes: string | null
          quantity: number
          status: string | null
          to_warehouse_id: string | null
          transferred_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_warehouse_id?: string | null
          id?: string
          lot_id: string
          notes?: string | null
          quantity: number
          status?: string | null
          to_warehouse_id?: string | null
          transferred_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_warehouse_id?: string | null
          id?: string
          lot_id?: string
          notes?: string | null
          quantity?: number
          status?: string | null
          to_warehouse_id?: string | null
          transferred_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_transfers_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          last_earned_at: string | null
          last_redeemed_at: string | null
          lifetime_points: number
          points: number
          store_id: string
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_earned_at?: string | null
          last_redeemed_at?: string | null
          lifetime_points?: number
          points?: number
          store_id: string
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_earned_at?: string | null
          last_redeemed_at?: string | null
          lifetime_points?: number
          points?: number
          store_id?: string
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          source: string | null
          store_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          source?: string | null
          store_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          source?: string | null
          store_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          is_system: boolean | null
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_system?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_system?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_dead_letters: {
        Row: {
          channel: string | null
          created_at: string
          delivery_id: string | null
          error_message: string | null
          id: string
          max_retries_reached: boolean | null
          notification_id: string | null
          payload: Json | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          delivery_id?: string | null
          error_message?: string | null
          id?: string
          max_retries_reached?: boolean | null
          notification_id?: string | null
          payload?: Json | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          delivery_id?: string | null
          error_message?: string | null
          id?: string
          max_retries_reached?: boolean | null
          notification_id?: string | null
          payload?: Json | null
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          notification_id: string | null
          provider: string | null
          provider_id: string | null
          retry_count: number | null
          status: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_id?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          provider?: string | null
          provider_id?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          accessibility_mode: boolean | null
          app_affiliate_sale: boolean | null
          app_certificate_ready: boolean | null
          app_comment_reply: boolean | null
          app_course_complete: boolean | null
          app_course_enrollment: boolean | null
          app_course_update: boolean | null
          app_instructor_message: boolean | null
          app_lesson_complete: boolean | null
          app_new_course: boolean | null
          app_quiz_result: boolean | null
          created_at: string
          email_affiliate_sale: boolean | null
          email_certificate_ready: boolean | null
          email_comment_reply: boolean | null
          email_course_complete: boolean | null
          email_course_enrollment: boolean | null
          email_course_update: boolean | null
          email_digest_frequency: string | null
          email_instructor_message: boolean | null
          email_lesson_complete: boolean | null
          email_new_course: boolean | null
          email_notifications: boolean | null
          email_quiz_result: boolean | null
          high_contrast_sounds: boolean | null
          id: string
          notification_sound_type: string | null
          pause_until: string | null
          push_notifications: boolean | null
          screen_reader_friendly: boolean | null
          sms_notifications: boolean | null
          sound_notifications: boolean | null
          sound_volume: number | null
          updated_at: string
          user_id: string
          vibration_intensity: string | null
          vibration_notifications: boolean | null
        }
        Insert: {
          accessibility_mode?: boolean | null
          app_affiliate_sale?: boolean | null
          app_certificate_ready?: boolean | null
          app_comment_reply?: boolean | null
          app_course_complete?: boolean | null
          app_course_enrollment?: boolean | null
          app_course_update?: boolean | null
          app_instructor_message?: boolean | null
          app_lesson_complete?: boolean | null
          app_new_course?: boolean | null
          app_quiz_result?: boolean | null
          created_at?: string
          email_affiliate_sale?: boolean | null
          email_certificate_ready?: boolean | null
          email_comment_reply?: boolean | null
          email_course_complete?: boolean | null
          email_course_enrollment?: boolean | null
          email_course_update?: boolean | null
          email_digest_frequency?: string | null
          email_instructor_message?: boolean | null
          email_lesson_complete?: boolean | null
          email_new_course?: boolean | null
          email_notifications?: boolean | null
          email_quiz_result?: boolean | null
          high_contrast_sounds?: boolean | null
          id?: string
          notification_sound_type?: string | null
          pause_until?: string | null
          push_notifications?: boolean | null
          screen_reader_friendly?: boolean | null
          sms_notifications?: boolean | null
          sound_notifications?: boolean | null
          sound_volume?: number | null
          updated_at?: string
          user_id: string
          vibration_intensity?: string | null
          vibration_notifications?: boolean | null
        }
        Update: {
          accessibility_mode?: boolean | null
          app_affiliate_sale?: boolean | null
          app_certificate_ready?: boolean | null
          app_comment_reply?: boolean | null
          app_course_complete?: boolean | null
          app_course_enrollment?: boolean | null
          app_course_update?: boolean | null
          app_instructor_message?: boolean | null
          app_lesson_complete?: boolean | null
          app_new_course?: boolean | null
          app_quiz_result?: boolean | null
          created_at?: string
          email_affiliate_sale?: boolean | null
          email_certificate_ready?: boolean | null
          email_comment_reply?: boolean | null
          email_course_complete?: boolean | null
          email_course_enrollment?: boolean | null
          email_course_update?: boolean | null
          email_digest_frequency?: string | null
          email_instructor_message?: boolean | null
          email_lesson_complete?: boolean | null
          email_new_course?: boolean | null
          email_notifications?: boolean | null
          email_quiz_result?: boolean | null
          high_contrast_sounds?: boolean | null
          id?: string
          notification_sound_type?: string | null
          pause_until?: string | null
          push_notifications?: boolean | null
          screen_reader_friendly?: boolean | null
          sms_notifications?: boolean | null
          sound_notifications?: boolean | null
          sound_volume?: number | null
          updated_at?: string
          user_id?: string
          vibration_intensity?: string | null
          vibration_notifications?: boolean | null
        }
        Relationships: []
      }
      notification_rate_limits: {
        Row: {
          channel: string | null
          count: number | null
          created_at: string
          id: string
          max_per_window: number | null
          notification_type: string
          user_id: string
          window_duration: string | null
          window_start: string | null
        }
        Insert: {
          channel?: string | null
          count?: number | null
          created_at?: string
          id?: string
          max_per_window?: number | null
          notification_type: string
          user_id: string
          window_duration?: string | null
          window_start?: string | null
        }
        Update: {
          channel?: string | null
          count?: number | null
          created_at?: string
          id?: string
          max_per_window?: number | null
          notification_type?: string
          user_id?: string
          window_duration?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      notification_retries: {
        Row: {
          attempt_number: number | null
          created_at: string
          delivery_id: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          scheduled_at: string | null
          status: string | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          delivery_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          scheduled_at?: string | null
          status?: string | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          delivery_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          scheduled_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_retries_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "notification_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          actions: Json | null
          channels: string[] | null
          conditions: Json | null
          created_at: string
          event_type: string
          id: string
          is_active: boolean | null
          rule_name: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          channels?: string[] | null
          conditions?: Json | null
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean | null
          rule_name: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          channels?: string[] | null
          conditions?: Json | null
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          rule_name?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string | null
          channel: string | null
          created_at: string
          html_template: string | null
          id: string
          is_active: boolean | null
          subject: string | null
          template_key: string
          template_name: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template?: string | null
          channel?: string | null
          created_at?: string
          html_template?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string | null
          template_key: string
          template_name: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string | null
          channel?: string | null
          created_at?: string
          html_template?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string | null
          template_key?: string
          template_name?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      notification_translations: {
        Row: {
          body_template: string | null
          created_at: string
          html_template: string | null
          id: string
          locale: string
          subject: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          body_template?: string | null
          created_at?: string
          html_template?: string | null
          id?: string
          locale: string
          subject?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          body_template?: string | null
          created_at?: string
          html_template?: string | null
          id?: string
          locale?: string
          subject?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_translations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          read_at?: string | null
          title?: string
          type?: string
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
          total_price?: number
          unit_price?: number
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
          currency: string | null
          customer_id: string | null
          delivery_status: string | null
          id: string
          metadata: Json | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          payment_type: string | null
          percentage_paid: number | null
          remaining_amount: number | null
          shipping_address: Json | null
          status: string | null
          store_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivery_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          payment_type?: string | null
          percentage_paid?: number | null
          remaining_amount?: number | null
          shipping_address?: Json | null
          status?: string | null
          store_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivery_status?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          payment_type?: string | null
          percentage_paid?: number | null
          remaining_amount?: number | null
          shipping_address?: Json | null
          status?: string | null
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
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          error_message: string | null
          id: string
          is_held: boolean | null
          metadata: Json | null
          moneroo_payment_method: string | null
          moneroo_transaction_id: string | null
          order_id: string | null
          payment_method: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          error_message?: string | null
          id?: string
          is_held?: boolean | null
          metadata?: Json | null
          moneroo_payment_method?: string | null
          moneroo_transaction_id?: string | null
          order_id?: string | null
          payment_method?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          error_message?: string | null
          id?: string
          is_held?: boolean | null
          metadata?: Json | null
          moneroo_payment_method?: string | null
          moneroo_transaction_id?: string | null
          order_id?: string | null
          payment_method?: string | null
          status?: string | null
          store_id?: string
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
          {
            foreignKeyName: "payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          product_id: string
          severity: string | null
          store_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          product_id: string
          severity?: string | null
          store_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          product_id?: string
          severity?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          product_id: string
          session_id: string | null
          store_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          product_id: string
          session_id?: string | null
          store_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          product_id?: string
          session_id?: string | null
          store_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          store_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          store_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_inventory: {
        Row: {
          available_quantity: number | null
          batch_number: string | null
          created_at: string
          expiry_date: string | null
          id: string
          last_counted_at: string | null
          location: string | null
          product_id: string
          quantity: number
          reorder_point: number | null
          reorder_quantity: number | null
          reserved_quantity: number | null
          store_id: string
          unit_cost: number | null
          updated_at: string
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          available_quantity?: number | null
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_counted_at?: string | null
          location?: string | null
          product_id: string
          quantity?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          store_id: string
          unit_cost?: number | null
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          available_quantity?: number | null
          batch_number?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_counted_at?: string | null
          location?: string | null
          product_id?: string
          quantity?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved_quantity?: number | null
          store_id?: string
          unit_cost?: number | null
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_price_alerts: {
        Row: {
          alert_type: string | null
          created_at: string
          id: string
          is_active: boolean | null
          product_id: string
          store_id: string
          target_price: number
          triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id: string
          store_id: string
          target_price: number
          triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string
          store_id?: string
          target_price?: number
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_price_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_price_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_price_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_promotion_alerts: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          message: string | null
          metadata: Json | null
          product_id: string
          promotion_type: string
          start_date: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          metadata?: Json | null
          product_id: string
          promotion_type: string
          start_date?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          metadata?: Json | null
          product_id?: string
          promotion_type?: string
          start_date?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_promotion_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_promotion_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_promotion_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_return_notifications: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          notification_type: string
          recipient_email: string | null
          return_id: string | null
          sent_at: string | null
          status: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_email?: string | null
          return_id?: string | null
          sent_at?: string | null
          status?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string | null
          return_id?: string | null
          sent_at?: string | null
          status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_return_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_return_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_shipment_notifications: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          notification_type: string
          order_id: string
          recipient_email: string | null
          sent_at: string | null
          status: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type: string
          order_id: string
          recipient_email?: string | null
          sent_at?: string | null
          status?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notification_type?: string
          order_id?: string
          recipient_email?: string | null
          sent_at?: string | null
          status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_shipment_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_shipment_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_shipment_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_shipping_rates: {
        Row: {
          created_at: string
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          is_active: boolean | null
          max_order_amount: number | null
          max_weight: number | null
          min_order_amount: number | null
          min_weight: number | null
          price: number | null
          rate_name: string
          rate_type: string | null
          store_id: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          price?: number | null
          rate_name: string
          rate_type?: string | null
          store_id: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          price?: number | null
          rate_name?: string
          rate_type?: string | null
          store_id?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_shipping_rates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_shipping_rates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "physical_product_shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_shipping_zones: {
        Row: {
          countries: string[] | null
          created_at: string
          id: string
          is_active: boolean | null
          regions: string[] | null
          store_id: string
          updated_at: string
          zone_name: string
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          regions?: string[] | null
          store_id: string
          updated_at?: string
          zone_name: string
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          regions?: string[] | null
          store_id?: string
          updated_at?: string
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_shipping_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_shipping_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_stock_alerts: {
        Row: {
          alert_type: string | null
          created_at: string
          current_stock: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          product_id: string
          store_id: string
          threshold: number | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          alert_type?: string | null
          created_at?: string
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          product_id: string
          store_id: string
          threshold?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          alert_type?: string | null
          created_at?: string
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          product_id?: string
          store_id?: string
          threshold?: number | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_stock_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_stock_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_subscriptions: {
        Row: {
          created_at: string
          frequency: string | null
          id: string
          last_delivery_at: string | null
          next_delivery_at: string | null
          product_id: string
          quantity: number | null
          status: string | null
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string | null
          id?: string
          last_delivery_at?: string | null
          next_delivery_at?: string | null
          product_id: string
          quantity?: number | null
          status?: string | null
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string | null
          id?: string
          last_delivery_at?: string | null
          next_delivery_at?: string | null
          product_id?: string
          quantity?: number | null
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          dimensions: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          metadata: Json | null
          options: Json | null
          price: number | null
          product_id: string
          sku: string | null
          stock_quantity: number | null
          store_id: string
          updated_at: string
          variant_name: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          metadata?: Json | null
          options?: Json | null
          price?: number | null
          product_id: string
          sku?: string | null
          stock_quantity?: number | null
          store_id: string
          updated_at?: string
          variant_name: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          metadata?: Json | null
          options?: Json | null
          price?: number | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number | null
          store_id?: string
          updated_at?: string
          variant_name?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "physical_product_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_product_webhooks: {
        Row: {
          created_at: string
          event_types: string[] | null
          headers: Json | null
          id: string
          is_active: boolean | null
          secret: string | null
          store_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          event_types?: string[] | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          secret?: string | null
          store_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          event_types?: string[] | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          secret?: string | null
          store_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_product_webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_product_webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_products: {
        Row: {
          barcode: string | null
          created_at: string
          currency: string | null
          dimension_unit: string | null
          has_variants: boolean | null
          height: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          length: number | null
          low_stock_threshold: number | null
          name: string | null
          price: number | null
          product_id: string
          requires_shipping: boolean | null
          shipping_class: string | null
          sku: string | null
          store_id: string
          total_quantity: number | null
          track_inventory: boolean | null
          updated_at: string
          weight: number | null
          weight_unit: string | null
          width: number | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          currency?: string | null
          dimension_unit?: string | null
          has_variants?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length?: number | null
          low_stock_threshold?: number | null
          name?: string | null
          price?: number | null
          product_id: string
          requires_shipping?: boolean | null
          shipping_class?: string | null
          sku?: string | null
          store_id: string
          total_quantity?: number | null
          track_inventory?: boolean | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
          width?: number | null
        }
        Update: {
          barcode?: string | null
          created_at?: string
          currency?: string | null
          dimension_unit?: string | null
          has_variants?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length?: number | null
          low_stock_threshold?: number | null
          name?: string | null
          price?: number | null
          product_id?: string
          requires_shipping?: boolean | null
          shipping_class?: string | null
          sku?: string | null
          store_id?: string
          total_quantity?: number | null
          track_inventory?: boolean | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          amount: number
          commission_rate: number
          created_at: string
          currency: string | null
          id: string
          order_id: string | null
          paid_at: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      pre_orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          deposit_amount: number | null
          expected_date: string | null
          fulfilled_at: string | null
          id: string
          order_id: string | null
          product_id: string
          quantity: number | null
          status: string | null
          store_id: string
          updated_at: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          deposit_amount?: number | null
          expected_date?: string | null
          fulfilled_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          quantity?: number | null
          status?: string | null
          store_id: string
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          deposit_amount?: number | null
          expected_date?: string | null
          fulfilled_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          quantity?: number | null
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_orders_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_affiliate_settings: {
        Row: {
          affiliate_enabled: boolean | null
          commission_rate: number | null
          created_at: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          affiliate_enabled?: boolean | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          affiliate_enabled?: boolean | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_affiliate_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_analytics: {
        Row: {
          add_to_cart: number | null
          clicks: number | null
          conversion_rate: number | null
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          product_id: string
          purchases: number | null
          revenue: number | null
          store_id: string
          updated_at: string
          views: number | null
        }
        Insert: {
          add_to_cart?: number | null
          clicks?: number | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          product_id: string
          purchases?: number | null
          revenue?: number | null
          store_id: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          add_to_cart?: number | null
          clicks?: number | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          product_id?: string
          purchases?: number | null
          revenue?: number | null
          store_id?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          bundle_name: string
          bundle_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          store_id: string
          updated_at: string
        }
        Insert: {
          bundle_name: string
          bundle_price: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          store_id: string
          updated_at?: string
        }
        Update: {
          bundle_name?: string
          bundle_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_clicks: {
        Row: {
          created_at: string
          id: string
          product_id: string
          referrer: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          amount: number
          cost_type: string | null
          created_at: string
          currency: string | null
          effective_date: string | null
          id: string
          notes: string | null
          product_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          cost_type?: string | null
          created_at?: string
          currency?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cost_type?: string | null
          created_at?: string
          currency?: string | null
          effective_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_costs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_costs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kits: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          kit_name: string
          product_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          kit_name: string
          product_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          kit_name?: string
          product_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_kits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_kits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_kits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lots: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          expires_at: string | null
          id: string
          lot_number: string
          manufactured_at: string | null
          notes: string | null
          product_id: string
          quantity: number
          received_at: string | null
          remaining_quantity: number
          status: string | null
          store_id: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_number: string
          manufactured_at?: string | null
          notes?: string | null
          product_id: string
          quantity?: number
          received_at?: string | null
          remaining_quantity?: number
          status?: string | null
          store_id: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_number?: string
          manufactured_at?: string | null
          notes?: string | null
          product_id?: string
          quantity?: number
          received_at?: string | null
          remaining_quantity?: number
          status?: string | null
          store_id?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_promotions: {
        Row: {
          created_at: string
          current_uses: number | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          product_id: string
          promotion_type: string | null
          starts_at: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          product_id: string
          promotion_type?: string | null
          starts_at?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          product_id?: string
          promotion_type?: string | null
          starts_at?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_return_policies: {
        Row: {
          conditions: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          policy_name: string
          return_window_days: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          conditions?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          policy_name: string
          return_window_days?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          conditions?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          policy_name?: string
          return_window_days?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_return_policies_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_return_policies_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_returns: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          inspected_at: string | null
          inspection_notes: string | null
          order_id: string | null
          order_item_id: string | null
          photos: string[] | null
          product_id: string | null
          quantity: number
          reason: string
          received_at: string | null
          refund_amount: number | null
          refund_method: string | null
          refund_processed_at: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          return_label_url: string | null
          shipping_carrier: string | null
          status: string
          store_id: string
          tracking_number: string | null
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          order_id?: string | null
          order_item_id?: string | null
          photos?: string[] | null
          product_id?: string | null
          quantity?: number
          reason: string
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refund_processed_at?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_label_url?: string | null
          shipping_carrier?: string | null
          status?: string
          store_id: string
          tracking_number?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          order_id?: string | null
          order_item_id?: string | null
          photos?: string[] | null
          product_id?: string | null
          quantity?: number
          reason?: string
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refund_processed_at?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          return_label_url?: string | null
          shipping_carrier?: string | null
          status?: string
          store_id?: string
          tracking_number?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_returns_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_returns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_returns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_review_stats: {
        Row: {
          average_rating: number | null
          id: string
          product_id: string
          rating_1: number | null
          rating_2: number | null
          rating_3: number | null
          rating_4: number | null
          rating_5: number | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          id?: string
          product_id: string
          rating_1?: number | null
          rating_2?: number | null
          rating_3?: number | null
          rating_4?: number | null
          rating_5?: number | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          id?: string
          product_id?: string
          rating_1?: number | null
          rating_2?: number | null
          rating_3?: number | null
          rating_4?: number | null
          rating_5?: number | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_review_stats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          cons: string | null
          content: string | null
          created_at: string
          helpful_count: number | null
          id: string
          images: Json | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_verified_purchase: boolean | null
          metadata: Json | null
          product_id: string
          pros: string | null
          rating: number
          store_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cons?: string | null
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: Json | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          metadata?: Json | null
          product_id: string
          pros?: string | null
          rating: number
          store_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cons?: string | null
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: Json | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          metadata?: Json | null
          product_id?: string
          pros?: string | null
          rating?: number
          store_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_size_charts: {
        Row: {
          chart_data: Json | null
          chart_name: string
          created_at: string
          id: string
          product_id: string
          store_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          chart_data?: Json | null
          chart_name: string
          created_at?: string
          id?: string
          product_id: string
          store_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          chart_data?: Json | null
          chart_name?: string
          created_at?: string
          id?: string
          product_id?: string
          store_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_size_charts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_size_charts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_size_charts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          product_type: string | null
          store_id: string
          template_data: Json | null
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          product_type?: string | null
          store_id: string
          template_data?: Json | null
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          product_type?: string | null
          store_id?: string
          template_data?: Json | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_templates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number | null
          product_id: string
          sku: string | null
          sort_order: number | null
          stock_quantity: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_versions: {
        Row: {
          changes: Json | null
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          published_at: string | null
          version_number: string
        }
        Insert: {
          changes?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          published_at?: string | null
          version_number: string
        }
        Update: {
          changes?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          published_at?: string | null
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          created_at: string
          id: string
          product_id: string
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_warranties: {
        Row: {
          coverage_type: string | null
          created_at: string
          description: string | null
          duration_months: number
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          product_id: string
          store_id: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          coverage_type?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          product_id: string
          store_id: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          coverage_type?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          product_id?: string
          store_id?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_warranties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_warranties_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_warranties_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          access_control: string | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          downloadable_files: Json | null
          file_access_type: string | null
          free_product_id: string | null
          free_shipping: boolean | null
          hide_from_store: boolean | null
          hide_purchase_count: boolean | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_draft: boolean | null
          is_featured: boolean | null
          license_terms: string | null
          licensing_type: string | null
          name: string
          paid_product_id: string | null
          password_protected: boolean | null
          price: number
          pricing_model: string | null
          product_type: string | null
          promotional_price: number | null
          purchase_limit: number | null
          rating: number | null
          reviews_count: number | null
          shipping_cost: number | null
          short_description: string | null
          slug: string
          stock_quantity: number | null
          store_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          access_control?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          downloadable_files?: Json | null
          file_access_type?: string | null
          free_product_id?: string | null
          free_shipping?: boolean | null
          hide_from_store?: boolean | null
          hide_purchase_count?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_draft?: boolean | null
          is_featured?: boolean | null
          license_terms?: string | null
          licensing_type?: string | null
          name: string
          paid_product_id?: string | null
          password_protected?: boolean | null
          price?: number
          pricing_model?: string | null
          product_type?: string | null
          promotional_price?: number | null
          purchase_limit?: number | null
          rating?: number | null
          reviews_count?: number | null
          shipping_cost?: number | null
          short_description?: string | null
          slug: string
          stock_quantity?: number | null
          store_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          access_control?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          downloadable_files?: Json | null
          file_access_type?: string | null
          free_product_id?: string | null
          free_shipping?: boolean | null
          hide_from_store?: boolean | null
          hide_purchase_count?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_draft?: boolean | null
          is_featured?: boolean | null
          license_terms?: string | null
          licensing_type?: string | null
          name?: string
          paid_product_id?: string | null
          password_protected?: boolean | null
          price?: number
          pricing_model?: string | null
          product_type?: string | null
          promotional_price?: number | null
          purchase_limit?: number | null
          rating?: number | null
          reviews_count?: number | null
          shipping_cost?: number | null
          short_description?: string | null
          slug?: string
          stock_quantity?: number | null
          store_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_free_product_id_fkey"
            columns: ["free_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_paid_product_id_fkey"
            columns: ["paid_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          language: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          language?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          language?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_usage: {
        Row: {
          created_at: string
          discount_applied: number | null
          id: string
          order_id: string | null
          promotion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          promotion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          promotion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "product_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applicable_products: string[] | null
          code: string
          created_at: string
          current_uses: number | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          name: string | null
          starts_at: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          applicable_products?: string[] | null
          code: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          name?: string | null
          starts_at?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          applicable_products?: string[] | null
          code?: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          name?: string | null
          starts_at?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string | null
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          reward_claimed: boolean | null
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code?: string | null
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          reward_claimed?: boolean | null
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string | null
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          reward_claimed?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      reorder_suggestions: {
        Row: {
          actioned_at: string | null
          created_at: string
          id: string
          priority: string | null
          product_id: string
          reason: string | null
          status: string | null
          store_id: string
          suggested_quantity: number
        }
        Insert: {
          actioned_at?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          product_id: string
          reason?: string | null
          status?: string | null
          store_id: string
          suggested_quantity: number
        }
        Update: {
          actioned_at?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          product_id?: string
          reason?: string | null
          status?: string | null
          store_id?: string
          suggested_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "reorder_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_suggestions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_suggestions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      return_policies: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          policy_name: string
          refund_type: string | null
          return_window_days: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          policy_name: string
          refund_type?: string | null
          return_window_days?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          policy_name?: string
          refund_type?: string | null
          return_window_days?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_policies_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_policies_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          media_type: string | null
          media_url: string
          review_id: string
          thumbnail_url: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          media_type?: string | null
          media_url: string
          review_id: string
          thumbnail_url?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          media_type?: string | null
          media_url?: string
          review_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_store_reply: boolean | null
          review_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_store_reply?: boolean | null
          review_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_store_reply?: boolean | null
          review_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
          vote_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
          vote_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          course_content_rating: number | null
          created_at: string
          delivery_rating: number | null
          helpful_count: number | null
          id: string
          instructor_rating: number | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_flagged: boolean | null
          not_helpful_count: number | null
          order_id: string | null
          product_id: string
          product_type: string | null
          quality_rating: number | null
          rating: number
          reply_count: number | null
          reviewer_avatar: string | null
          reviewer_name: string | null
          service_rating: number | null
          title: string | null
          updated_at: string
          user_id: string
          value_rating: number | null
          verified_purchase: boolean | null
        }
        Insert: {
          content: string
          course_content_rating?: number | null
          created_at?: string
          delivery_rating?: number | null
          helpful_count?: number | null
          id?: string
          instructor_rating?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_flagged?: boolean | null
          not_helpful_count?: number | null
          order_id?: string | null
          product_id: string
          product_type?: string | null
          quality_rating?: number | null
          rating: number
          reply_count?: number | null
          reviewer_avatar?: string | null
          reviewer_name?: string | null
          service_rating?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          value_rating?: number | null
          verified_purchase?: boolean | null
        }
        Update: {
          content?: string
          course_content_rating?: number | null
          created_at?: string
          delivery_rating?: number | null
          helpful_count?: number | null
          id?: string
          instructor_rating?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_flagged?: boolean | null
          not_helpful_count?: number | null
          order_id?: string | null
          product_id?: string
          product_type?: string | null
          quality_rating?: number | null
          rating?: number
          reply_count?: number | null
          reviewer_avatar?: string | null
          reviewer_name?: string | null
          service_rating?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          value_rating?: number | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
          store_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
          store_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
          store_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      secured_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          escrow_status: string | null
          id: string
          metadata: Json | null
          order_id: string
          payment_method: string | null
          provider: string | null
          provider_transaction_id: string | null
          refunded_at: string | null
          released_at: string | null
          status: string | null
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          escrow_status?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          payment_method?: string | null
          provider?: string | null
          provider_transaction_id?: string | null
          refunded_at?: string | null
          released_at?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          escrow_status?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          payment_method?: string | null
          provider?: string | null
          provider_transaction_id?: string | null
          refunded_at?: string | null
          released_at?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secured_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secured_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secured_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_number_history: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          performed_by: string | null
          serial_number_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          performed_by?: string | null
          serial_number_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          performed_by?: string | null
          serial_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_number_history_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          assigned_at: string | null
          batch_number: string | null
          created_at: string
          customer_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          order_id: string | null
          product_id: string
          serial_number: string
          status: string | null
          store_id: string
          updated_at: string
          variant_id: string | null
          warranty_expires_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          batch_number?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          product_id: string
          serial_number: string
          status?: string | null
          store_id: string
          updated_at?: string
          variant_id?: string | null
          warranty_expires_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          batch_number?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
          product_id?: string
          serial_number?: string
          status?: string | null
          store_id?: string
          updated_at?: string
          variant_id?: string | null
          warranty_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_availability_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          service_product_id: string
          staff_member_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          service_product_id: string
          staff_member_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          service_product_id?: string
          staff_member_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_availability_slots_service_product_id_fkey"
            columns: ["service_product_id"]
            isOneToOne: false
            referencedRelation: "service_products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          cancellation_reason: string | null
          created_at: string
          customer_id: string | null
          customer_notes: string | null
          deposit_paid: number | null
          id: string
          internal_notes: string | null
          meeting_url: string | null
          participants_count: number | null
          product_id: string
          reminder_sent_at: string | null
          staff_member_id: string | null
          status: string | null
          total_price: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancellation_reason?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notes?: string | null
          deposit_paid?: number | null
          id?: string
          internal_notes?: string | null
          meeting_url?: string | null
          participants_count?: number | null
          product_id: string
          reminder_sent_at?: string | null
          staff_member_id?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancellation_reason?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notes?: string | null
          deposit_paid?: number | null
          id?: string
          internal_notes?: string | null
          meeting_url?: string | null
          participants_count?: number | null
          product_id?: string
          reminder_sent_at?: string | null
          staff_member_id?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "service_staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      service_products: {
        Row: {
          advance_booking_days: number | null
          allow_booking_cancellation: boolean | null
          average_rating: number | null
          buffer_time_after: number | null
          buffer_time_before: number | null
          cancellation_deadline_hours: number | null
          created_at: string
          deposit_amount: number | null
          deposit_required: boolean | null
          deposit_type: string | null
          duration_minutes: number | null
          id: string
          location_address: string | null
          location_type: string | null
          max_bookings_per_day: number | null
          max_participants: number | null
          meeting_url: string | null
          pricing_type: string | null
          product_id: string
          require_approval: boolean | null
          requires_staff: boolean | null
          service_type: string | null
          store_id: string
          timezone: string | null
          total_bookings: number | null
          total_cancelled_bookings: number | null
          total_completed_bookings: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          advance_booking_days?: number | null
          allow_booking_cancellation?: boolean | null
          average_rating?: number | null
          buffer_time_after?: number | null
          buffer_time_before?: number | null
          cancellation_deadline_hours?: number | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean | null
          deposit_type?: string | null
          duration_minutes?: number | null
          id?: string
          location_address?: string | null
          location_type?: string | null
          max_bookings_per_day?: number | null
          max_participants?: number | null
          meeting_url?: string | null
          pricing_type?: string | null
          product_id: string
          require_approval?: boolean | null
          requires_staff?: boolean | null
          service_type?: string | null
          store_id: string
          timezone?: string | null
          total_bookings?: number | null
          total_cancelled_bookings?: number | null
          total_completed_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          advance_booking_days?: number | null
          allow_booking_cancellation?: boolean | null
          average_rating?: number | null
          buffer_time_after?: number | null
          buffer_time_before?: number | null
          cancellation_deadline_hours?: number | null
          created_at?: string
          deposit_amount?: number | null
          deposit_required?: boolean | null
          deposit_type?: string | null
          duration_minutes?: number | null
          id?: string
          location_address?: string | null
          location_type?: string | null
          max_bookings_per_day?: number | null
          max_participants?: number | null
          meeting_url?: string | null
          pricing_type?: string | null
          product_id?: string
          require_approval?: boolean | null
          requires_staff?: boolean | null
          service_type?: string | null
          store_id?: string
          timezone?: string | null
          total_bookings?: number | null
          total_cancelled_bookings?: number | null
          total_completed_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_resources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          resource_type: string | null
          service_product_id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          resource_type?: string | null
          service_product_id: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          resource_type?: string | null
          service_product_id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_resources_service_product_id_fkey"
            columns: ["service_product_id"]
            isOneToOne: false
            referencedRelation: "service_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resources_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resources_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_staff_members: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          role: string | null
          service_product_id: string
          store_id: string
          total_bookings: number | null
          total_completed_bookings: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          service_product_id: string
          store_id: string
          total_bookings?: number | null
          total_completed_bookings?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          service_product_id?: string
          store_id?: string
          total_bookings?: number | null
          total_completed_bookings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_staff_members_service_product_id_fkey"
            columns: ["service_product_id"]
            isOneToOne: false
            referencedRelation: "service_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_staff_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_staff_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_waitlist: {
        Row: {
          booked_at: string | null
          booking_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          notified_at: string | null
          position: number | null
          preferred_date: string | null
          preferred_time: string | null
          service_id: string
          status: string | null
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booked_at?: string | null
          booking_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          position?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_id: string
          status?: string | null
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booked_at?: string | null
          booking_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          position?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_id?: string
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_waitlist_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_waitlist_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          assigned_staff: Json | null
          created_at: string
          currency: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          location_address: string | null
          location_type: string | null
          max_participants: number | null
          meeting_url: string | null
          name: string
          price: number | null
          product_id: string | null
          service_type: string | null
          store_id: string
          total_slots: number | null
          updated_at: string
        }
        Insert: {
          assigned_staff?: Json | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          location_address?: string | null
          location_type?: string | null
          max_participants?: number | null
          meeting_url?: string | null
          name: string
          price?: number | null
          product_id?: string | null
          service_type?: string | null
          store_id: string
          total_slots?: number | null
          updated_at?: string
        }
        Update: {
          assigned_staff?: Json | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          location_address?: string | null
          location_type?: string | null
          max_participants?: number | null
          meeting_url?: string | null
          name?: string
          price?: number | null
          product_id?: string | null
          service_type?: string | null
          store_id?: string
          total_slots?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          attendance_duration_minutes: number | null
          attended: boolean | null
          created_at: string
          enrollment_id: string | null
          feedback_comment: string | null
          feedback_rating: number | null
          id: string
          joined_at: string | null
          left_at: string | null
          registered_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          attendance_duration_minutes?: number | null
          attended?: boolean | null
          created_at?: string
          enrollment_id?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          registered_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          attendance_duration_minutes?: number | null
          attended?: boolean | null
          created_at?: string
          enrollment_id?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          registered_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          estimated_delivery: string | null
          id: string
          metadata: Json | null
          order_id: string
          shipped_at: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string | null
          store_id: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          store_id: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string | null
          store_id?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_carriers: {
        Row: {
          api_key: string | null
          api_secret: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          logo_url: string | null
          max_dimensions: Json | null
          max_weight: number | null
          metadata: Json | null
          name: string
          store_id: string | null
          supported_countries: string[] | null
          tracking_url_template: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          max_dimensions?: Json | null
          max_weight?: number | null
          metadata?: Json | null
          name: string
          store_id?: string | null
          supported_countries?: string[] | null
          tracking_url_template?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          max_dimensions?: Json | null
          max_weight?: number | null
          metadata?: Json | null
          name?: string
          store_id?: string | null
          supported_countries?: string[] | null
          tracking_url_template?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_carriers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_carriers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_labels: {
        Row: {
          carrier_id: string | null
          created_at: string
          dimensions: Json | null
          from_address: Json | null
          id: string
          label_format: string | null
          label_url: string | null
          metadata: Json | null
          order_id: string
          rate_amount: number | null
          rate_currency: string | null
          status: string | null
          store_id: string
          to_address: Json | null
          tracking_number: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          carrier_id?: string | null
          created_at?: string
          dimensions?: Json | null
          from_address?: Json | null
          id?: string
          label_format?: string | null
          label_url?: string | null
          metadata?: Json | null
          order_id: string
          rate_amount?: number | null
          rate_currency?: string | null
          status?: string | null
          store_id: string
          to_address?: Json | null
          tracking_number?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          carrier_id?: string | null
          created_at?: string
          dimensions?: Json | null
          from_address?: Json | null
          id?: string
          label_format?: string | null
          label_url?: string | null
          metadata?: Json | null
          order_id?: string
          rate_amount?: number | null
          rate_currency?: string | null
          status?: string | null
          store_id?: string
          to_address?: Json | null
          tracking_number?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_labels_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_labels_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_labels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_labels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_pickup_requests: {
        Row: {
          address: Json | null
          carrier_id: string | null
          confirmation_number: string | null
          created_at: string
          id: string
          notes: string | null
          pickup_date: string
          pickup_time_end: string | null
          pickup_time_start: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address?: Json | null
          carrier_id?: string | null
          confirmation_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pickup_date: string
          pickup_time_end?: string | null
          pickup_time_start?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: Json | null
          carrier_id?: string | null
          confirmation_number?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pickup_date?: string
          pickup_time_end?: string | null
          pickup_time_start?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_pickup_requests_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_pickup_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_pickup_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          created_at: string
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          is_active: boolean | null
          max_order_amount: number | null
          max_weight: number | null
          min_order_amount: number | null
          min_weight: number | null
          name: string
          price: number | null
          rate_type: string | null
          store_id: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name: string
          price?: number | null
          rate_type?: string | null
          store_id: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name?: string
          price?: number | null
          rate_type?: string | null
          store_id?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_rates_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_service_conversations: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          priority: string | null
          shipping_service_id: string | null
          status: string | null
          store_id: string
          store_user_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          shipping_service_id?: string | null
          status?: string | null
          store_id: string
          store_user_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          shipping_service_id?: string | null
          status?: string | null
          store_id?: string
          store_user_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_service_conversations_shipping_service_id_fkey"
            columns: ["shipping_service_id"]
            isOneToOne: false
            referencedRelation: "global_shipping_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_service_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_service_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_service_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          read_at: string | null
          sender_id: string
          sender_type: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id: string
          sender_type?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_service_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "shipping_service_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_tracking_events: {
        Row: {
          created_at: string
          event_description: string | null
          event_location: string | null
          event_timestamp: string | null
          event_type: string
          id: string
          raw_data: Json | null
          shipment_id: string | null
          shipping_label_id: string | null
          tracking_number: string | null
        }
        Insert: {
          created_at?: string
          event_description?: string | null
          event_location?: string | null
          event_timestamp?: string | null
          event_type: string
          id?: string
          raw_data?: Json | null
          shipment_id?: string | null
          shipping_label_id?: string | null
          tracking_number?: string | null
        }
        Update: {
          created_at?: string
          event_description?: string | null
          event_location?: string | null
          event_timestamp?: string | null
          event_type?: string
          id?: string
          raw_data?: Json | null
          shipment_id?: string | null
          shipping_label_id?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          countries: string[] | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          regions: string[] | null
          store_id: string
          updated_at: string
        }
        Insert: {
          countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          regions?: string[] | null
          store_id: string
          updated_at?: string
        }
        Update: {
          countries?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          regions?: string[] | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_type: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          product_id: string
          store_id: string
          threshold: number | null
        }
        Insert: {
          alert_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          product_id: string
          store_id: string
          threshold?: number | null
        }
        Update: {
          alert_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          product_id?: string
          store_id?: string
          threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          movement_type: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          movement_type: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          movement_type?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_rotation_reports: {
        Row: {
          created_at: string
          fast_moving_count: number | null
          id: string
          report_data: Json | null
          report_date: string
          slow_moving_count: number | null
          store_id: string
          total_products: number | null
        }
        Insert: {
          created_at?: string
          fast_moving_count?: number | null
          id?: string
          report_data?: Json | null
          report_date: string
          slow_moving_count?: number | null
          store_id: string
          total_products?: number | null
        }
        Update: {
          created_at?: string
          fast_moving_count?: number | null
          id?: string
          report_data?: Json | null
          report_date?: string
          slow_moving_count?: number | null
          store_id?: string
          total_products?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_rotation_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_rotation_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_earnings: {
        Row: {
          amount: number
          commission_amount: number | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          net_amount: number | null
          order_id: string | null
          status: string | null
          store_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          commission_amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          net_amount?: number | null
          order_id?: string | null
          status?: string | null
          store_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          net_amount?: number | null
          order_id?: string | null
          status?: string | null
          store_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_earnings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_earnings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_email: string | null
          permissions: string[] | null
          role: string
          status: string | null
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          permissions?: string[] | null
          role?: string
          status?: string | null
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          permissions?: string[] | null
          role?: string
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          provider: string | null
          routing_number: string | null
          store_id: string
          type: string
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          provider?: string | null
          routing_number?: string | null
          store_id: string
          type: string
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          provider?: string | null
          routing_number?: string | null
          store_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_payment_methods_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_payment_methods_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "store_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      store_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          store_id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          store_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          store_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_withdrawals: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          reference_number: string | null
          rejection_reason: string | null
          status: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          status?: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_withdrawals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_withdrawals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          about: string | null
          accent_color: string | null
          address_line1: string | null
          address_line2: string | null
          apple_touch_icon_url: string | null
          background_color: string | null
          banner_url: string | null
          body_font: string | null
          border_radius: string | null
          button_primary_color: string | null
          button_primary_text: string | null
          button_secondary_color: string | null
          button_secondary_text: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          custom_domain: string | null
          custom_scripts_enabled: boolean | null
          custom_tracking_scripts: string | null
          default_currency: string | null
          description: string | null
          discord_url: string | null
          dns_records: Json | null
          domain_error_message: string | null
          domain_status: string | null
          domain_verification_token: string | null
          domain_verified_at: string | null
          facebook_pixel_enabled: boolean | null
          facebook_pixel_id: string | null
          facebook_url: string | null
          favicon_url: string | null
          font_size_base: string | null
          footer_style: string | null
          google_analytics_enabled: boolean | null
          google_analytics_id: string | null
          google_tag_manager_enabled: boolean | null
          google_tag_manager_id: string | null
          header_style: string | null
          heading_font: string | null
          heading_size_h1: string | null
          heading_size_h2: string | null
          heading_size_h3: string | null
          id: string
          info_message: string | null
          info_message_color: string | null
          info_message_font: string | null
          instagram_url: string | null
          is_active: boolean | null
          latitude: number | null
          legal_pages: Json | null
          letter_spacing: string | null
          line_height: string | null
          link_color: string | null
          link_hover_color: string | null
          linkedin_url: string | null
          logo_url: string | null
          longitude: number | null
          marketing_content: Json | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string
          navigation_style: string | null
          og_image: string | null
          opening_hours: Json | null
          partnership_email: string | null
          pinterest_url: string | null
          placeholder_image_url: string | null
          postal_code: string | null
          press_email: string | null
          primary_color: string | null
          product_card_style: string | null
          product_grid_columns: number | null
          redirect_https: boolean | null
          redirect_www: boolean | null
          sales_email: string | null
          sales_phone: string | null
          secondary_color: string | null
          seo_score: number | null
          shadow_intensity: string | null
          sidebar_enabled: boolean | null
          sidebar_position: string | null
          slug: string
          snapchat_url: string | null
          ssl_enabled: boolean | null
          state_province: string | null
          support_email: string | null
          support_phone: string | null
          telegram_username: string | null
          text_color: string | null
          text_secondary_color: string | null
          theme_color: string | null
          tiktok_pixel_enabled: boolean | null
          tiktok_pixel_id: string | null
          tiktok_url: string | null
          timezone: string | null
          twitch_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          watermark_url: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          about?: string | null
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          apple_touch_icon_url?: string | null
          background_color?: string | null
          banner_url?: string | null
          body_font?: string | null
          border_radius?: string | null
          button_primary_color?: string | null
          button_primary_text?: string | null
          button_secondary_color?: string | null
          button_secondary_text?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_scripts_enabled?: boolean | null
          custom_tracking_scripts?: string | null
          default_currency?: string | null
          description?: string | null
          discord_url?: string | null
          dns_records?: Json | null
          domain_error_message?: string | null
          domain_status?: string | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          font_size_base?: string | null
          footer_style?: string | null
          google_analytics_enabled?: boolean | null
          google_analytics_id?: string | null
          google_tag_manager_enabled?: boolean | null
          google_tag_manager_id?: string | null
          header_style?: string | null
          heading_font?: string | null
          heading_size_h1?: string | null
          heading_size_h2?: string | null
          heading_size_h3?: string | null
          id?: string
          info_message?: string | null
          info_message_color?: string | null
          info_message_font?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_pages?: Json | null
          letter_spacing?: string | null
          line_height?: string | null
          link_color?: string | null
          link_hover_color?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          marketing_content?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name: string
          navigation_style?: string | null
          og_image?: string | null
          opening_hours?: Json | null
          partnership_email?: string | null
          pinterest_url?: string | null
          placeholder_image_url?: string | null
          postal_code?: string | null
          press_email?: string | null
          primary_color?: string | null
          product_card_style?: string | null
          product_grid_columns?: number | null
          redirect_https?: boolean | null
          redirect_www?: boolean | null
          sales_email?: string | null
          sales_phone?: string | null
          secondary_color?: string | null
          seo_score?: number | null
          shadow_intensity?: string | null
          sidebar_enabled?: boolean | null
          sidebar_position?: string | null
          slug: string
          snapchat_url?: string | null
          ssl_enabled?: boolean | null
          state_province?: string | null
          support_email?: string | null
          support_phone?: string | null
          telegram_username?: string | null
          text_color?: string | null
          text_secondary_color?: string | null
          theme_color?: string | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          watermark_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          about?: string | null
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          apple_touch_icon_url?: string | null
          background_color?: string | null
          banner_url?: string | null
          body_font?: string | null
          border_radius?: string | null
          button_primary_color?: string | null
          button_primary_text?: string | null
          button_secondary_color?: string | null
          button_secondary_text?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_scripts_enabled?: boolean | null
          custom_tracking_scripts?: string | null
          default_currency?: string | null
          description?: string | null
          discord_url?: string | null
          dns_records?: Json | null
          domain_error_message?: string | null
          domain_status?: string | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          font_size_base?: string | null
          footer_style?: string | null
          google_analytics_enabled?: boolean | null
          google_analytics_id?: string | null
          google_tag_manager_enabled?: boolean | null
          google_tag_manager_id?: string | null
          header_style?: string | null
          heading_font?: string | null
          heading_size_h1?: string | null
          heading_size_h2?: string | null
          heading_size_h3?: string | null
          id?: string
          info_message?: string | null
          info_message_color?: string | null
          info_message_font?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_pages?: Json | null
          letter_spacing?: string | null
          line_height?: string | null
          link_color?: string | null
          link_hover_color?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          marketing_content?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string
          navigation_style?: string | null
          og_image?: string | null
          opening_hours?: Json | null
          partnership_email?: string | null
          pinterest_url?: string | null
          placeholder_image_url?: string | null
          postal_code?: string | null
          press_email?: string | null
          primary_color?: string | null
          product_card_style?: string | null
          product_grid_columns?: number | null
          redirect_https?: boolean | null
          redirect_www?: boolean | null
          sales_email?: string | null
          sales_phone?: string | null
          secondary_color?: string | null
          seo_score?: number | null
          shadow_intensity?: string | null
          sidebar_enabled?: boolean | null
          sidebar_position?: string | null
          slug?: string
          snapchat_url?: string | null
          ssl_enabled?: boolean | null
          state_province?: string | null
          support_email?: string | null
          support_phone?: string | null
          telegram_username?: string | null
          text_color?: string | null
          text_secondary_color?: string | null
          theme_color?: string | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          watermark_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      supplier_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          received_quantity: number | null
          supplier_order_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          received_quantity?: number | null
          supplier_order_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number | null
          supplier_order_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_items_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          currency: string | null
          expected_delivery_date: string | null
          id: string
          metadata: Json | null
          notes: string | null
          order_number: string | null
          status: string | null
          store_id: string
          supplier_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string | null
          status?: string | null
          store_id: string
          supplier_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string | null
          status?: string | null
          store_id?: string
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          is_preferred: boolean | null
          lead_time_days: number | null
          min_order_quantity: number | null
          product_id: string
          supplier_id: string
          supplier_price: number | null
          supplier_sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          product_id: string
          supplier_id: string
          supplier_price?: number | null
          supplier_sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_preferred?: boolean | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          product_id?: string
          supplier_id?: string
          supplier_price?: number | null
          supplier_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          is_active: boolean | null
          lead_time_days: number | null
          metadata: Json | null
          minimum_order_amount: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          store_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          metadata?: Json | null
          minimum_order_amount?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          store_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          metadata?: Json | null
          minimum_order_amount?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          store_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_configurations: {
        Row: {
          applies_to: string[] | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_inclusive: boolean | null
          name: string
          rate: number
          region: string | null
          store_id: string
          tax_type: string | null
          updated_at: string
        }
        Insert: {
          applies_to?: string[] | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_inclusive?: boolean | null
          name: string
          rate?: number
          region?: string | null
          store_id: string
          tax_type?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: string[] | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_inclusive?: boolean | null
          name?: string
          rate?: number
          region?: string | null
          store_id?: string
          tax_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_configurations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_logs: {
        Row: {
          created_at: string
          error_data: Json | null
          event_type: string
          id: string
          metadata: Json | null
          request_data: Json | null
          response_data: Json | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_data?: Json | null
          event_type: string
          id?: string
          metadata?: Json | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_data?: Json | null
          event_type?: string
          id?: string
          metadata?: Json | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          moneroo_payment_method: string | null
          moneroo_transaction_id: string | null
          order_id: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          moneroo_payment_method?: string | null
          moneroo_transaction_id?: string | null
          order_id?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          moneroo_payment_method?: string | null
          moneroo_transaction_id?: string | null
          order_id?: string | null
          status?: string | null
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
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variant_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          variant_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          variant_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "physical_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_conversations: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          is_read_by_customer: boolean | null
          is_read_by_vendor: boolean | null
          last_message_at: string | null
          order_id: string | null
          priority: string | null
          product_id: string | null
          status: string | null
          store_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_read_by_customer?: boolean | null
          is_read_by_vendor?: boolean | null
          last_message_at?: string | null
          order_id?: string | null
          priority?: string | null
          product_id?: string | null
          status?: string | null
          store_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_read_by_customer?: boolean | null
          is_read_by_vendor?: boolean | null
          last_message_at?: string | null
          order_id?: string | null
          priority?: string | null
          product_id?: string | null
          status?: string | null
          store_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id: string
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "vendor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      version_download_errors: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          user_id: string | null
          version_id: string | null
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          user_id?: string | null
          version_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          user_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "version_download_errors_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "digital_product_file_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      version_download_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          user_id: string | null
          version_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "version_download_logs_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "digital_product_file_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      version_rollback_logs: {
        Row: {
          created_at: string
          from_version_id: string | null
          id: string
          product_id: string
          reason: string | null
          rolled_back_by: string | null
          to_version_id: string | null
        }
        Insert: {
          created_at?: string
          from_version_id?: string | null
          id?: string
          product_id: string
          reason?: string | null
          rolled_back_by?: string | null
          to_version_id?: string | null
        }
        Update: {
          created_at?: string
          from_version_id?: string | null
          id?: string
          product_id?: string
          reason?: string | null
          rolled_back_by?: string | null
          to_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "version_rollback_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_allocations: {
        Row: {
          allocated_at: string | null
          created_at: string
          id: string
          order_id: string
          packed_at: string | null
          picked_at: string | null
          product_id: string
          quantity: number
          shipped_at: string | null
          status: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          allocated_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          packed_at?: string | null
          picked_at?: string | null
          product_id: string
          quantity: number
          shipped_at?: string | null
          status?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          allocated_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          packed_at?: string | null
          picked_at?: string | null
          product_id?: string
          quantity?: number
          shipped_at?: string | null
          status?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_allocations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_allocations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_inventory: {
        Row: {
          bin_number: string | null
          created_at: string
          id: string
          location_code: string | null
          product_id: string
          quantity: number | null
          reserved_quantity: number | null
          updated_at: string
          variant_id: string | null
          warehouse_id: string
        }
        Insert: {
          bin_number?: string | null
          created_at?: string
          id?: string
          location_code?: string | null
          product_id: string
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string
          variant_id?: string | null
          warehouse_id: string
        }
        Update: {
          bin_number?: string | null
          created_at?: string
          id?: string
          location_code?: string | null
          product_id?: string
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_locations: {
        Row: {
          aisle: string | null
          bin: string | null
          capacity: number | null
          created_at: string
          current_items: number | null
          id: string
          is_active: boolean | null
          location_code: string
          rack: string | null
          shelf: string | null
          updated_at: string
          warehouse_id: string
          zone: string | null
        }
        Insert: {
          aisle?: string | null
          bin?: string | null
          capacity?: number | null
          created_at?: string
          current_items?: number | null
          id?: string
          is_active?: boolean | null
          location_code: string
          rack?: string | null
          shelf?: string | null
          updated_at?: string
          warehouse_id: string
          zone?: string | null
        }
        Update: {
          aisle?: string | null
          bin?: string | null
          capacity?: number | null
          created_at?: string
          current_items?: number | null
          id?: string
          is_active?: boolean | null
          location_code?: string
          rack?: string | null
          shelf?: string | null
          updated_at?: string
          warehouse_id?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_performance: {
        Row: {
          accuracy_rate: number | null
          avg_fulfillment_time_hours: number | null
          created_at: string
          id: string
          items_shipped: number | null
          metric_date: string
          orders_processed: number | null
          utilization_rate: number | null
          warehouse_id: string
        }
        Insert: {
          accuracy_rate?: number | null
          avg_fulfillment_time_hours?: number | null
          created_at?: string
          id?: string
          items_shipped?: number | null
          metric_date: string
          orders_processed?: number | null
          utilization_rate?: number | null
          warehouse_id: string
        }
        Update: {
          accuracy_rate?: number | null
          avg_fulfillment_time_hours?: number | null
          created_at?: string
          id?: string
          items_shipped?: number | null
          metric_date?: string
          orders_processed?: number | null
          utilization_rate?: number | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_performance_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfer_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          received_quantity: number | null
          transfer_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          received_quantity?: number | null
          transfer_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number | null
          transfer_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "warehouse_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfers: {
        Row: {
          completed_at: string | null
          created_at: string
          from_warehouse_id: string
          id: string
          initiated_by: string | null
          notes: string | null
          status: string | null
          store_id: string
          to_warehouse_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          from_warehouse_id: string
          id?: string
          initiated_by?: string | null
          notes?: string | null
          status?: string | null
          store_id: string
          to_warehouse_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          from_warehouse_id?: string
          id?: string
          initiated_by?: string | null
          notes?: string | null
          status?: string | null
          store_id?: string
          to_warehouse_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string
          current_stock: number | null
          email: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          latitude: number | null
          longitude: number | null
          manager_name: string | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          store_id: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          current_stock?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          manager_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          store_id: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          current_stock?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          manager_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          store_id?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claims: {
        Row: {
          created_at: string
          id: string
          issue_description: string
          order_id: string | null
          photos: string[] | null
          product_id: string
          resolution: string | null
          resolved_at: string | null
          serial_number: string | null
          status: string | null
          store_id: string
          updated_at: string
          user_id: string
          warranty_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_description: string
          order_id?: string | null
          photos?: string[] | null
          product_id: string
          resolution?: string | null
          resolved_at?: string | null
          serial_number?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
          user_id: string
          warranty_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_description?: string
          order_id?: string | null
          photos?: string[] | null
          product_id?: string
          resolution?: string | null
          resolved_at?: string | null
          serial_number?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
          warranty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "product_warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_status_code: number | null
          last_triggered_at: string | null
          name: string
          retry_count: number | null
          secret: string | null
          store_id: string
          timeout_ms: number | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          name: string
          retry_count?: number | null
          secret?: string | null
          store_id: string
          timeout_ms?: number | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          name?: string
          retry_count?: number | null
          secret?: string | null
          store_id?: string
          timeout_ms?: number | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      enrollments: {
        Row: {
          certificate_issued: boolean | null
          certificate_url: string | null
          completed_at: string | null
          completed_lessons: number | null
          course_id: string | null
          created_at: string | null
          id: string | null
          last_accessed_at: string | null
          order_id: string | null
          progress_percentage: number | null
          started_at: string | null
          status: string | null
          total_lessons: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          completed_at?: string | null
          completed_lessons?: number | null
          course_id?: string | null
          created_at?: string | null
          id?: string | null
          last_accessed_at?: string | null
          order_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          certificate_issued?: boolean | null
          certificate_url?: string | null
          completed_at?: string | null
          completed_lessons?: number | null
          course_id?: string | null
          created_at?: string | null
          id?: string | null
          last_accessed_at?: string | null
          order_id?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_public: {
        Row: {
          content: string | null
          course_content_rating: number | null
          created_at: string | null
          delivery_rating: number | null
          helpful_count: number | null
          id: string | null
          instructor_rating: number | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_flagged: boolean | null
          not_helpful_count: number | null
          order_id: string | null
          product_id: string | null
          product_type: string | null
          quality_rating: number | null
          rating: number | null
          reply_count: number | null
          reviewer_avatar: string | null
          reviewer_name: string | null
          service_rating: number | null
          title: string | null
          updated_at: string | null
          value_rating: number | null
          verified_purchase: boolean | null
        }
        Insert: {
          content?: string | null
          course_content_rating?: number | null
          created_at?: string | null
          delivery_rating?: number | null
          helpful_count?: number | null
          id?: string | null
          instructor_rating?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_flagged?: boolean | null
          not_helpful_count?: number | null
          order_id?: string | null
          product_id?: string | null
          product_type?: string | null
          quality_rating?: number | null
          rating?: number | null
          reply_count?: number | null
          reviewer_avatar?: string | null
          reviewer_name?: string | null
          service_rating?: number | null
          title?: string | null
          updated_at?: string | null
          value_rating?: number | null
          verified_purchase?: boolean | null
        }
        Update: {
          content?: string | null
          course_content_rating?: number | null
          created_at?: string | null
          delivery_rating?: number | null
          helpful_count?: number | null
          id?: string | null
          instructor_rating?: number | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_flagged?: boolean | null
          not_helpful_count?: number | null
          order_id?: string | null
          product_id?: string | null
          product_type?: string | null
          quality_rating?: number | null
          rating?: number | null
          reply_count?: number | null
          reviewer_avatar?: string | null
          reviewer_name?: string | null
          service_rating?: number | null
          title?: string | null
          updated_at?: string | null
          value_rating?: number | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stores_public: {
        Row: {
          about: string | null
          accent_color: string | null
          address_line1: string | null
          address_line2: string | null
          apple_touch_icon_url: string | null
          background_color: string | null
          banner_url: string | null
          body_font: string | null
          border_radius: string | null
          button_primary_color: string | null
          button_primary_text: string | null
          button_secondary_color: string | null
          button_secondary_text: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          custom_domain: string | null
          custom_scripts_enabled: boolean | null
          custom_tracking_scripts: string | null
          default_currency: string | null
          description: string | null
          discord_url: string | null
          domain_status: string | null
          domain_verified_at: string | null
          facebook_pixel_enabled: boolean | null
          facebook_pixel_id: string | null
          facebook_url: string | null
          favicon_url: string | null
          font_size_base: string | null
          footer_style: string | null
          google_analytics_enabled: boolean | null
          google_analytics_id: string | null
          google_tag_manager_enabled: boolean | null
          google_tag_manager_id: string | null
          header_style: string | null
          heading_font: string | null
          heading_size_h1: string | null
          heading_size_h2: string | null
          heading_size_h3: string | null
          id: string | null
          info_message: string | null
          info_message_color: string | null
          info_message_font: string | null
          instagram_url: string | null
          is_active: boolean | null
          latitude: number | null
          legal_pages: Json | null
          letter_spacing: string | null
          line_height: string | null
          link_color: string | null
          link_hover_color: string | null
          linkedin_url: string | null
          logo_url: string | null
          longitude: number | null
          marketing_content: Json | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string | null
          navigation_style: string | null
          og_image: string | null
          opening_hours: Json | null
          partnership_email: string | null
          pinterest_url: string | null
          placeholder_image_url: string | null
          postal_code: string | null
          press_email: string | null
          primary_color: string | null
          product_card_style: string | null
          product_grid_columns: number | null
          sales_email: string | null
          sales_phone: string | null
          secondary_color: string | null
          seo_score: number | null
          shadow_intensity: string | null
          sidebar_enabled: boolean | null
          sidebar_position: string | null
          slug: string | null
          snapchat_url: string | null
          state_province: string | null
          support_email: string | null
          support_phone: string | null
          telegram_username: string | null
          text_color: string | null
          text_secondary_color: string | null
          theme_color: string | null
          tiktok_pixel_enabled: boolean | null
          tiktok_pixel_id: string | null
          tiktok_url: string | null
          timezone: string | null
          twitch_url: string | null
          twitter_url: string | null
          updated_at: string | null
          watermark_url: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          about?: string | null
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          apple_touch_icon_url?: string | null
          background_color?: string | null
          banner_url?: string | null
          body_font?: string | null
          border_radius?: string | null
          button_primary_color?: string | null
          button_primary_text?: string | null
          button_secondary_color?: string | null
          button_secondary_text?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_scripts_enabled?: boolean | null
          custom_tracking_scripts?: string | null
          default_currency?: string | null
          description?: string | null
          discord_url?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          font_size_base?: string | null
          footer_style?: string | null
          google_analytics_enabled?: boolean | null
          google_analytics_id?: string | null
          google_tag_manager_enabled?: boolean | null
          google_tag_manager_id?: string | null
          header_style?: string | null
          heading_font?: string | null
          heading_size_h1?: string | null
          heading_size_h2?: string | null
          heading_size_h3?: string | null
          id?: string | null
          info_message?: string | null
          info_message_color?: string | null
          info_message_font?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_pages?: Json | null
          letter_spacing?: string | null
          line_height?: string | null
          link_color?: string | null
          link_hover_color?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          marketing_content?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string | null
          navigation_style?: string | null
          og_image?: string | null
          opening_hours?: Json | null
          partnership_email?: string | null
          pinterest_url?: string | null
          placeholder_image_url?: string | null
          postal_code?: string | null
          press_email?: string | null
          primary_color?: string | null
          product_card_style?: string | null
          product_grid_columns?: number | null
          sales_email?: string | null
          sales_phone?: string | null
          secondary_color?: string | null
          seo_score?: number | null
          shadow_intensity?: string | null
          sidebar_enabled?: boolean | null
          sidebar_position?: string | null
          slug?: string | null
          snapchat_url?: string | null
          state_province?: string | null
          support_email?: string | null
          support_phone?: string | null
          telegram_username?: string | null
          text_color?: string | null
          text_secondary_color?: string | null
          theme_color?: string | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          watermark_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          about?: string | null
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          apple_touch_icon_url?: string | null
          background_color?: string | null
          banner_url?: string | null
          body_font?: string | null
          border_radius?: string | null
          button_primary_color?: string | null
          button_primary_text?: string | null
          button_secondary_color?: string | null
          button_secondary_text?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_scripts_enabled?: boolean | null
          custom_tracking_scripts?: string | null
          default_currency?: string | null
          description?: string | null
          discord_url?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          font_size_base?: string | null
          footer_style?: string | null
          google_analytics_enabled?: boolean | null
          google_analytics_id?: string | null
          google_tag_manager_enabled?: boolean | null
          google_tag_manager_id?: string | null
          header_style?: string | null
          heading_font?: string | null
          heading_size_h1?: string | null
          heading_size_h2?: string | null
          heading_size_h3?: string | null
          id?: string | null
          info_message?: string | null
          info_message_color?: string | null
          info_message_font?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          latitude?: number | null
          legal_pages?: Json | null
          letter_spacing?: string | null
          line_height?: string | null
          link_color?: string | null
          link_hover_color?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          marketing_content?: Json | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string | null
          navigation_style?: string | null
          og_image?: string | null
          opening_hours?: Json | null
          partnership_email?: string | null
          pinterest_url?: string | null
          placeholder_image_url?: string | null
          postal_code?: string | null
          press_email?: string | null
          primary_color?: string | null
          product_card_style?: string | null
          product_grid_columns?: number | null
          sales_email?: string | null
          sales_phone?: string | null
          secondary_color?: string | null
          seo_score?: number | null
          shadow_intensity?: string | null
          sidebar_enabled?: boolean | null
          sidebar_position?: string | null
          slug?: string | null
          snapchat_url?: string | null
          state_province?: string | null
          support_email?: string | null
          support_phone?: string | null
          telegram_username?: string | null
          text_color?: string | null
          text_secondary_color?: string | null
          theme_color?: string | null
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          watermark_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_ai_recommendation_settings: { Args: never; Returns: Json }
      get_dashboard_stats_rpc: {
        Args: { period_days?: number; store_id: string }
        Returns: Json
      }
      get_platform_customization: { Args: never; Returns: Json }
      get_unread_count: { Args: never; Returns: number }
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
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
