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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          props: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          props?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          props?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          slug: string
          tier: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          description: string
          icon?: string
          id?: string
          name: string
          slug: string
          tier: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          tier?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      collection_prompts: {
        Row: {
          added_at: string
          collection_id: string
          prompt_id: string
          sort_order: number
        }
        Insert: {
          added_at?: string
          collection_id: string
          prompt_id: string
          sort_order?: number
        }
        Update: {
          added_at?: string
          collection_id?: string
          prompt_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_prompts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_color: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          owner_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          owner_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          owner_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          prompt_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          prompt_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          prompt_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_alert_settings: {
        Row: {
          cooldown_hours: number
          created_at: string
          creator_id: string
          email: boolean
          email_mode: string
          hot_threshold: number
          in_app: boolean
          slack_webhook_url: string | null
          updated_at: string
        }
        Insert: {
          cooldown_hours?: number
          created_at?: string
          creator_id: string
          email?: boolean
          email_mode?: string
          hot_threshold?: number
          in_app?: boolean
          slack_webhook_url?: string | null
          updated_at?: string
        }
        Update: {
          cooldown_hours?: number
          created_at?: string
          creator_id?: string
          email?: boolean
          email_mode?: string
          hot_threshold?: number
          in_app?: boolean
          slack_webhook_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_alert_settings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_alert_state: {
        Row: {
          creator_id: string
          last_alerted_at: string | null
          last_score: number
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          creator_id: string
          last_alerted_at?: string | null
          last_score?: number
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          creator_id?: string
          last_alerted_at?: string | null
          last_score?: number
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_alert_state_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_alert_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          created_at: string
          creator_id: string
          event_type: string
          id: string
          meta: Json
          pack_id: string | null
          prompt_id: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          event_type: string
          id?: string
          meta?: Json
          pack_id?: string | null
          prompt_id?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          event_type?: string
          id?: string
          meta?: Json
          pack_id?: string | null
          prompt_id?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          pack_id: string | null
          payload: Json | null
          prompt_id: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pack_id?: string | null
          payload?: Json | null
          prompt_id?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pack_id?: string | null
          payload?: Json | null
          prompt_id?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_slots: {
        Row: {
          active: boolean
          created_at: string
          creator_id: string
          description: string | null
          id: string
          label: string
          prompt_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          label: string
          prompt_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          label?: string
          prompt_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_slots_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_slots_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_items: {
        Row: {
          created_at: string
          id: string
          is_preview: boolean
          item_type: string
          pack_id: string
          position: number
          promise_line: string | null
          prompt_id: string | null
          skill_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_preview?: boolean
          item_type: string
          pack_id: string
          position: number
          promise_line?: string | null
          prompt_id?: string | null
          skill_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_preview?: boolean
          item_type?: string
          pack_id?: string
          position?: number
          promise_line?: string | null
          prompt_id?: string | null
          skill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_items_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_items_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_items_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_saves: {
        Row: {
          created_at: string
          id: string
          pack_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pack_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pack_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_saves_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_versions: {
        Row: {
          changelog: string | null
          created_at: string
          id: string
          pack_id: string
          version: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          id?: string
          pack_id: string
          version: number
        }
        Update: {
          changelog?: string | null
          created_at?: string
          id?: string
          pack_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pack_versions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          accent: string | null
          cover_seed: string | null
          cover_type: string
          created_at: string
          creator_id: string
          gating: string
          id: string
          liner_note: string | null
          price_cents: number
          released_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          accent?: string | null
          cover_seed?: string | null
          cover_type?: string
          created_at?: string
          creator_id: string
          gating?: string
          id?: string
          liner_note?: string | null
          price_cents?: number
          released_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          accent?: string | null
          cover_seed?: string | null
          cover_type?: string
          created_at?: string
          creator_id?: string
          gating?: string
          id?: string
          liner_note?: string | null
          price_cents?: number
          released_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "packs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          contribution_count: number
          created_at: string
          creator_onboarding_complete: boolean
          display_name: string | null
          featured_prompt_id: string | null
          github: string | null
          id: string
          is_admin: boolean
          lifetime_copies: number
          lifetime_upvotes_received: number
          location: string | null
          offer_headline: string | null
          onboarding_complete: boolean
          reputation: number
          twitter: string | null
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          contribution_count?: number
          created_at?: string
          creator_onboarding_complete?: boolean
          display_name?: string | null
          featured_prompt_id?: string | null
          github?: string | null
          id: string
          is_admin?: boolean
          lifetime_copies?: number
          lifetime_upvotes_received?: number
          location?: string | null
          offer_headline?: string | null
          onboarding_complete?: boolean
          reputation?: number
          twitter?: string | null
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          contribution_count?: number
          created_at?: string
          creator_onboarding_complete?: boolean
          display_name?: string | null
          featured_prompt_id?: string | null
          github?: string | null
          id?: string
          is_admin?: boolean
          lifetime_copies?: number
          lifetime_upvotes_received?: number
          location?: string | null
          offer_headline?: string | null
          onboarding_complete?: boolean
          reputation?: number
          twitter?: string | null
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_featured_prompt_id_fkey"
            columns: ["featured_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_drafts: {
        Row: {
          author_id: string
          constraints: string
          context: string
          created_at: string
          examples: Json
          goal: string | null
          id: string
          output_format: string
          role: string
          task: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          constraints?: string
          context?: string
          created_at?: string
          examples?: Json
          goal?: string | null
          id?: string
          output_format?: string
          role?: string
          task?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          constraints?: string
          context?: string
          created_at?: string
          examples?: Json
          goal?: string | null
          id?: string
          output_format?: string
          role?: string
          task?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_drafts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_presets: {
        Row: {
          created_at: string
          id: string
          name: string
          prompt_id: string
          updated_at: string
          user_id: string
          values: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          prompt_id: string
          updated_at?: string
          user_id: string
          values?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          prompt_id?: string
          updated_at?: string
          user_id?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prompt_presets_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_runs: {
        Row: {
          created_at: string
          id: string
          prompt_id: string
          user_id: string
          values: Json
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_id: string
          user_id: string
          values?: Json
        }
        Update: {
          created_at?: string
          id?: string
          prompt_id?: string
          user_id?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prompt_runs_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_saves: {
        Row: {
          created_at: string
          id: string
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_saves_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          body_snapshot: string | null
          changelog: string | null
          created_at: string
          id: string
          prompt_id: string
          version: number
        }
        Insert: {
          body_snapshot?: string | null
          changelog?: string | null
          created_at?: string
          id?: string
          prompt_id: string
          version: number
        }
        Update: {
          body_snapshot?: string | null
          changelog?: string | null
          created_at?: string
          id?: string
          prompt_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          author_id: string
          body: string
          category_id: string | null
          copies: number
          created_at: string
          description: string | null
          downvotes: number
          forked_from_id: string | null
          id: string
          model_tags: string[]
          published_at: string | null
          search_vector: unknown
          slug: string
          status: string
          tags: string[]
          title: string
          trending_score: number
          updated_at: string
          upvotes: number
          variables: Json
          version: number
          views: number
        }
        Insert: {
          author_id: string
          body: string
          category_id?: string | null
          copies?: number
          created_at?: string
          description?: string | null
          downvotes?: number
          forked_from_id?: string | null
          id?: string
          model_tags?: string[]
          published_at?: string | null
          search_vector?: unknown
          slug: string
          status?: string
          tags?: string[]
          title: string
          trending_score?: number
          updated_at?: string
          upvotes?: number
          variables?: Json
          version?: number
          views?: number
        }
        Update: {
          author_id?: string
          body?: string
          category_id?: string | null
          copies?: number
          created_at?: string
          description?: string | null
          downvotes?: number
          forked_from_id?: string | null
          id?: string
          model_tags?: string[]
          published_at?: string | null
          search_vector?: unknown
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          trending_score?: number
          updated_at?: string
          upvotes?: number
          variables?: Json
          version?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_forked_from_id_fkey"
            columns: ["forked_from_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_vote_log: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          prompt_id: string | null
          reason: string
          reporter_id: string
          skill_id: string | null
          status: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          prompt_id?: string | null
          reason: string
          reporter_id: string
          skill_id?: string | null
          status?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          prompt_id?: string | null
          reason?: string
          reporter_id?: string
          skill_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_votes: {
        Row: {
          created_at: string
          skill_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          skill_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          skill_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_votes_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          author_id: string
          category: string | null
          copies: number
          created_at: string
          downvotes: number
          featured_priority: number
          hero_image_url: string | null
          hero_loop_url: string | null
          hero_poster_url: string | null
          id: string
          install_command: string | null
          is_featured: boolean
          name: string
          published_at: string | null
          readme: string | null
          runtimes: string[]
          search_vector: unknown
          slug: string
          source_url: string | null
          status: string
          summary: string
          tags: string[]
          theme_id: string | null
          trending_score: number
          updated_at: string
          upvotes: number
          views: number
        }
        Insert: {
          author_id: string
          category?: string | null
          copies?: number
          created_at?: string
          downvotes?: number
          featured_priority?: number
          hero_image_url?: string | null
          hero_loop_url?: string | null
          hero_poster_url?: string | null
          id?: string
          install_command?: string | null
          is_featured?: boolean
          name: string
          published_at?: string | null
          readme?: string | null
          runtimes?: string[]
          search_vector?: unknown
          slug: string
          source_url?: string | null
          status?: string
          summary: string
          tags?: string[]
          theme_id?: string | null
          trending_score?: number
          updated_at?: string
          upvotes?: number
          views?: number
        }
        Update: {
          author_id?: string
          category?: string | null
          copies?: number
          created_at?: string
          downvotes?: number
          featured_priority?: number
          hero_image_url?: string | null
          hero_loop_url?: string | null
          hero_poster_url?: string | null
          id?: string
          install_command?: string | null
          is_featured?: boolean
          name?: string
          published_at?: string | null
          readme?: string | null
          runtimes?: string[]
          search_vector?: unknown
          slug?: string
          source_url?: string | null
          status?: string
          summary?: string
          tags?: string[]
          theme_id?: string | null
          trending_score?: number
          updated_at?: string
          upvotes?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "skills_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_free: boolean
          logo_url: string | null
          name: string
          pricing_note: string | null
          slug: string
          status: string
          submitted_by: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          logo_url?: string | null
          name: string
          pricing_note?: string | null
          slug: string
          status?: string
          submitted_by?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_free?: boolean
          logo_url?: string | null
          name?: string
          pricing_note?: string | null
          slug?: string
          status?: string
          submitted_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_attributes: {
        Row: {
          company_name: string | null
          company_size: Database["public"]["Enums"]["company_size_enum"] | null
          completed_at: string | null
          goals: string[] | null
          industry: Database["public"]["Enums"]["industry_enum"] | null
          job_title: string | null
          linkedin_url: string | null
          need_text: string | null
          role_category:
            | Database["public"]["Enums"]["role_category_enum"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          company_size?: Database["public"]["Enums"]["company_size_enum"] | null
          completed_at?: string | null
          goals?: string[] | null
          industry?: Database["public"]["Enums"]["industry_enum"] | null
          job_title?: string | null
          linkedin_url?: string | null
          need_text?: string | null
          role_category?:
            | Database["public"]["Enums"]["role_category_enum"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          company_size?: Database["public"]["Enums"]["company_size_enum"] | null
          completed_at?: string | null
          goals?: string[] | null
          industry?: Database["public"]["Enums"]["industry_enum"] | null
          job_title?: string | null
          linkedin_url?: string | null
          need_text?: string | null
          role_category?:
            | Database["public"]["Enums"]["role_category_enum"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_attributes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          prompt_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          prompt_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          prompt_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trending_score: {
        Args: { published: string; upvotes_count: number }
        Returns: number
      }
      check_badges_for_user: { Args: { p_user_id: string }; Returns: undefined }
      get_lead_detail: { Args: { p_user_id: string }; Returns: Json }
      get_my_leads: {
        Args: never
        Returns: {
          last_alerted_at: string
          score: number
          stage: string
          updated_at: string
          user_id: string
        }[]
      }
      lead_event_weight: {
        Args: { p_event_type: string; p_meta: Json }
        Returns: number
      }
      lead_score: {
        Args: { p_creator_id: string; p_user_id: string }
        Returns: number
      }
      lead_stage: { Args: { p_score: number }; Returns: string }
      purge_old_rate_limit_logs: { Args: never; Returns: undefined }
      record_lead_event: {
        Args: {
          p_event_type: string
          p_meta?: Json
          p_pack_id?: string
          p_prompt_id?: string
        }
        Returns: Json
      }
      record_prompt_copy: { Args: { p_prompt_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      company_size_enum:
        | "solo"
        | "s2_10"
        | "s11_50"
        | "s51_200"
        | "s201_1000"
        | "s1000_plus"
      industry_enum:
        | "agency_consulting"
        | "saas_tech"
        | "ecommerce_retail"
        | "coaching_education"
        | "health_wellness"
        | "finance_insurance"
        | "real_estate"
        | "legal"
        | "marketing_media"
        | "manufacturing_trades"
        | "nonprofit"
        | "other"
      role_category_enum:
        | "founder_owner"
        | "executive"
        | "marketing"
        | "sales_bd"
        | "consultant_coach"
        | "engineering_data"
        | "product_design"
        | "operations"
        | "hr_recruiting"
        | "finance_legal"
        | "content_creator"
        | "student"
        | "other"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      company_size_enum: [
        "solo",
        "s2_10",
        "s11_50",
        "s51_200",
        "s201_1000",
        "s1000_plus",
      ],
      industry_enum: [
        "agency_consulting",
        "saas_tech",
        "ecommerce_retail",
        "coaching_education",
        "health_wellness",
        "finance_insurance",
        "real_estate",
        "legal",
        "marketing_media",
        "manufacturing_trades",
        "nonprofit",
        "other",
      ],
      role_category_enum: [
        "founder_owner",
        "executive",
        "marketing",
        "sales_bd",
        "consultant_coach",
        "engineering_data",
        "product_design",
        "operations",
        "hr_recruiting",
        "finance_legal",
        "content_creator",
        "student",
        "other",
      ],
    },
  },
} as const

// ─── v2 tables ───────────────────────────────────────────────
export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  criteria: Record<string, unknown>;
  created_at: string;
};

export type UserBadge = {
  user_id: string;
  badge_id: string;
  earned_at: string;
};

export type Collection = {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  cover_color: string;
  created_at: string;
  updated_at: string;
};

export type CollectionPrompt = {
  collection_id: string;
  prompt_id: string;
  added_at: string;
  sort_order: number;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};
// ─────────────────────────────────────────────────────────────

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Prompt = Database["public"]["Tables"]["prompts"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Tool = Database["public"]["Tables"]["tools"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type PromptDraft = Database["public"]["Tables"]["prompt_drafts"]["Row"];
export type PromptPreset = Database["public"]["Tables"]["prompt_presets"]["Row"];
export type PromptRun = Database["public"]["Tables"]["prompt_runs"]["Row"];
export type UserAttributes = Database["public"]["Tables"]["user_attributes"]["Row"];
export type PromptVersion = Database["public"]["Tables"]["prompt_versions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Pack = Database["public"]["Tables"]["packs"]["Row"];
export type PackItem = Database["public"]["Tables"]["pack_items"]["Row"];
export type PackVersion = Database["public"]["Tables"]["pack_versions"]["Row"];
export type PackSave = Database["public"]["Tables"]["pack_saves"]["Row"];
export type PromptSave = Database["public"]["Tables"]["prompt_saves"]["Row"];

export type PackStatus = "draft" | "published";
export type PackGating = "free" | "paid" | "follower";
export type PackCoverType = "auto" | "upload";
export type PackItemType = "prompt" | "skill";

export type PackWithCreator = Pack & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "bio">;
};

export type PackItemWithContent = PackItem & {
  prompts: PromptWithAuthor | null;
  skills: SkillWithAuthor | null;
};

// Must match the Postgres enums in 0016_pro_profile_fields.sql exactly.
export type RoleCategory =
  | "founder_owner"
  | "executive"
  | "marketing"
  | "sales_bd"
  | "consultant_coach"
  | "engineering_data"
  | "product_design"
  | "operations"
  | "hr_recruiting"
  | "finance_legal"
  | "content_creator"
  | "student"
  | "other";

export type Industry =
  | "agency_consulting"
  | "saas_tech"
  | "ecommerce_retail"
  | "coaching_education"
  | "health_wellness"
  | "finance_insurance"
  | "real_estate"
  | "legal"
  | "marketing_media"
  | "manufacturing_trades"
  | "nonprofit"
  | "other";

export type CompanySize = "solo" | "s2_10" | "s11_50" | "s51_200" | "s201_1000" | "s1000_plus";
export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type SkillVote = Database["public"]["Tables"]["skill_votes"]["Row"];

export type SkillStatus = "draft" | "pending" | "published" | "flagged" | "removed";
export type SkillRuntime = "claude-code" | "cowork" | "claude-api";

export type SkillWithAuthor = Skill & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
};

/** A single few-shot example attached to a prompt draft. */
export interface PromptExample {
  input: string;
  output: string;
}

export type PromptStatus = "draft" | "published" | "flagged" | "removed";
export type ReportStatus = "open" | "resolved";
export type ToolStatus = "pending" | "approved" | "rejected";
export type VoteValue = -1 | 1;
export type BadgeTier = "bronze" | "silver" | "gold";

export interface PromptVariable {
  name: string;
  default?: string;
  description?: string;
  type?: "text" | "number" | "select";
  options?: string[];
}

export type PromptWithAuthor = Prompt & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  categories: Pick<Category, "id" | "name" | "slug" | "icon"> | null;
};

export type CommentWithAuthor = Comment & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  replies?: CommentWithAuthor[];
};

// Must match the CHECK constraint on profiles.account_type in 0022_creator_accounts.sql.
export type AccountType = "client" | "creator";

export type OfferSlot = Database["public"]["Tables"]["offer_slots"]["Row"];
export type CreatorAlertSettings = Database["public"]["Tables"]["creator_alert_settings"]["Row"];
