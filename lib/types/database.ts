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
          reason: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          prompt_id?: string | null;
          comment_id?: string | null;
          reason: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [];
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

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Prompt = Database["public"]["Tables"]["prompts"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Tool = Database["public"]["Tables"]["tools"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];

export type PromptStatus = "draft" | "published" | "flagged" | "removed";
export type ReportStatus = "open" | "resolved";
export type ToolStatus = "pending" | "approved" | "rejected";
export type VoteValue = -1 | 1;

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
