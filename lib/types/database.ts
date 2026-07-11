// Hand-written Supabase type definitions matching the supabase-gen output format.
// After linking a real project: supabase gen types typescript --project-id YOUR_REF > lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          contribution_count: number;
          reputation: number;
          is_admin: boolean;
          onboarding_complete: boolean;
          website: string | null;
          twitter: string | null;
          github: string | null;
          location: string | null;
          featured_prompt_id: string | null;
          lifetime_copies: number;
          lifetime_upvotes_received: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          contribution_count?: number;
          reputation?: number;
          is_admin?: boolean;
          onboarding_complete?: boolean;
          website?: string | null;
          twitter?: string | null;
          github?: string | null;
          location?: string | null;
          featured_prompt_id?: string | null;
          lifetime_copies?: number;
          lifetime_upvotes_received?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          contribution_count?: number;
          reputation?: number;
          is_admin?: boolean;
          onboarding_complete?: boolean;
          website?: string | null;
          twitter?: string | null;
          github?: string | null;
          location?: string | null;
          featured_prompt_id?: string | null;
          lifetime_copies?: number;
          lifetime_upvotes_received?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          icon?: string | null;
          description?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          body: string;
          description: string | null;
          model_tags: string[];
          category_id: string | null;
          tags: string[];
          variables: Json;
          upvotes: number;
          downvotes: number;
          views: number;
          status: string;
          trending_score: number;
          search_vector: string | null;
          forked_from_id: string | null;
          copies: number;
          version: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug: string;
          body: string;
          description?: string | null;
          model_tags?: string[];
          category_id?: string | null;
          tags?: string[];
          variables?: Json;
          upvotes?: number;
          downvotes?: number;
          views?: number;
          status?: string;
          trending_score?: number;
          forked_from_id?: string | null;
          copies?: number;
          version?: number;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          title?: string;
          slug?: string;
          body?: string;
          description?: string | null;
          model_tags?: string[];
          category_id?: string | null;
          tags?: string[];
          variables?: Json;
          upvotes?: number;
          downvotes?: number;
          views?: number;
          status?: string;
          trending_score?: number;
          forked_from_id?: string | null;
          copies?: number;
          version?: number;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "prompts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      votes: {
        Row: {
          user_id: string;
          prompt_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          prompt_id: string;
          value: number;
          created_at?: string;
        };
        Update: {
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          prompt_id: string;
          user_id: string;
          body: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          user_id: string;
          body: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      tools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          url: string;
          category: string | null;
          logo_url: string | null;
          is_free: boolean;
          pricing_note: string | null;
          submitted_by: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          url: string;
          category?: string | null;
          logo_url?: string | null;
          is_free?: boolean;
          pricing_note?: string | null;
          submitted_by?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          url?: string;
          category?: string | null;
          logo_url?: string | null;
          is_free?: boolean;
          pricing_note?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          prompt_id: string | null;
          comment_id: string | null;
          skill_id: string | null;
          reason: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          prompt_id?: string | null;
          comment_id?: string | null;
          skill_id?: string | null;
          reason: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          author_id: string;
          name: string;
          slug: string;
          summary: string;
          install_command: string | null;
          source_url: string | null;
          readme: string | null;
          category: string | null;
          runtimes: string[];
          tags: string[];
          upvotes: number;
          downvotes: number;
          views: number;
          copies: number;
          status: string;
          trending_score: number;
          search_vector: string | null;
          hero_image_url: string | null;
          hero_loop_url: string | null;
          hero_poster_url: string | null;
          is_featured: boolean;
          featured_priority: number;
          theme_id: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          name: string;
          slug: string;
          summary: string;
          install_command?: string | null;
          source_url?: string | null;
          readme?: string | null;
          category?: string | null;
          runtimes?: string[];
          tags?: string[];
          upvotes?: number;
          downvotes?: number;
          views?: number;
          copies?: number;
          status?: string;
          trending_score?: number;
          hero_image_url?: string | null;
          hero_loop_url?: string | null;
          hero_poster_url?: string | null;
          is_featured?: boolean;
          featured_priority?: number;
          theme_id?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          summary?: string;
          install_command?: string | null;
          source_url?: string | null;
          readme?: string | null;
          category?: string | null;
          runtimes?: string[];
          tags?: string[];
          upvotes?: number;
          downvotes?: number;
          views?: number;
          copies?: number;
          status?: string;
          trending_score?: number;
          hero_image_url?: string | null;
          hero_loop_url?: string | null;
          hero_poster_url?: string | null;
          is_featured?: boolean;
          featured_priority?: number;
          theme_id?: string | null;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "skills_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      skill_votes: {
        Row: {
          user_id: string;
          skill_id: string;
          value: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          skill_id: string;
          value: number;
          created_at?: string;
        };
        Update: {
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "skill_votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skill_votes_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          }
        ];
      };
      badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          tier: "bronze" | "silver" | "gold";
          criteria: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          tier: "bronze" | "silver" | "gold";
          criteria?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string;
          icon?: string;
          tier?: "bronze" | "silver" | "gold";
          criteria?: Record<string, unknown>;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          }
        ];
      };
      collections: {
        Row: {
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
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          slug: string;
          description?: string | null;
          is_public?: boolean;
          cover_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string | null;
          is_public?: boolean;
          cover_color?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      collection_prompts: {
        Row: {
          collection_id: string;
          prompt_id: string;
          added_at: string;
          sort_order: number;
        };
        Insert: {
          collection_id: string;
          prompt_id: string;
          added_at?: string;
          sort_order?: number;
        };
        Update: {
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "collection_prompts_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_prompts_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      prompt_versions: {
        Row: {
          id: string;
          prompt_id: string;
          version: number;
          changelog: string | null;
          body_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          version: number;
          changelog?: string | null;
          body_snapshot?: string | null;
          created_at?: string;
        };
        Update: {
          changelog?: string | null;
          body_snapshot?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          prompt_id: string | null;
          pack_id: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          prompt_id?: string | null;
          pack_id?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          }
        ];
      };
      packs: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          slug: string;
          liner_note: string | null;
          cover_type: string;
          cover_seed: string | null;
          accent: string | null;
          status: string;
          gating: string;
          price_cents: number;
          version: number;
          released_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          slug: string;
          liner_note?: string | null;
          cover_type?: string;
          cover_seed?: string | null;
          accent?: string | null;
          status?: string;
          gating?: string;
          price_cents?: number;
          version?: number;
          released_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          liner_note?: string | null;
          cover_type?: string;
          cover_seed?: string | null;
          accent?: string | null;
          status?: string;
          gating?: string;
          price_cents?: number;
          version?: number;
          released_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "packs_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      pack_items: {
        Row: {
          id: string;
          pack_id: string;
          item_type: string;
          prompt_id: string | null;
          skill_id: string | null;
          position: number;
          promise_line: string | null;
          is_preview: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          pack_id: string;
          item_type: string;
          prompt_id?: string | null;
          skill_id?: string | null;
          position: number;
          promise_line?: string | null;
          is_preview?: boolean;
          created_at?: string;
        };
        Update: {
          item_type?: string;
          prompt_id?: string | null;
          skill_id?: string | null;
          position?: number;
          promise_line?: string | null;
          is_preview?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "pack_items_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pack_items_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pack_items_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          }
        ];
      };
      pack_versions: {
        Row: {
          id: string;
          pack_id: string;
          version: number;
          changelog: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pack_id: string;
          version: number;
          changelog?: string | null;
          created_at?: string;
        };
        Update: {
          changelog?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pack_versions_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          }
        ];
      };
      pack_saves: {
        Row: {
          id: string;
          user_id: string;
          pack_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pack_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "pack_saves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pack_saves_pack_id_fkey";
            columns: ["pack_id"];
            isOneToOne: false;
            referencedRelation: "packs";
            referencedColumns: ["id"];
          }
        ];
      };
      prompt_saves: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "prompt_saves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_saves_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      user_attributes: {
        Row: {
          user_id: string;
          role_category: RoleCategory | null;
          industry: Industry | null;
          company_size: CompanySize | null;
          goals: string[] | null;
          need_text: string | null;
          job_title: string | null;
          company_name: string | null;
          linkedin_url: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role_category?: RoleCategory | null;
          industry?: Industry | null;
          company_size?: CompanySize | null;
          goals?: string[] | null;
          need_text?: string | null;
          job_title?: string | null;
          company_name?: string | null;
          linkedin_url?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          role_category?: RoleCategory | null;
          industry?: Industry | null;
          company_size?: CompanySize | null;
          goals?: string[] | null;
          need_text?: string | null;
          job_title?: string | null;
          company_name?: string | null;
          linkedin_url?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_attributes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      prompt_presets: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          name: string;
          values: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          name: string;
          values?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          values?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_presets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_presets_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      prompt_runs: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          values: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          values?: Json;
          created_at?: string;
        };
        Update: {
          values?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_runs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_runs_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      prompt_drafts: {
        Row: {
          id: string;
          author_id: string;
          title: string | null;
          goal: string | null;
          role: string;
          context: string;
          task: string;
          constraints: string;
          output_format: string;
          examples: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title?: string | null;
          goal?: string | null;
          role?: string;
          context?: string;
          task?: string;
          constraints?: string;
          output_format?: string;
          examples?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          goal?: string | null;
          role?: string;
          context?: string;
          task?: string;
          constraints?: string;
          output_format?: string;
          examples?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_drafts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_trending_score: {
        Args: {
          upvotes_count: number;
          published: string;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

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
