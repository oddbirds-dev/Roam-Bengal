/**
 * Database types for the `Roam Bengal` Supabase project (`ackvhrnlmlyzqycsjjht`).
 *
 * DO NOT EDIT BY HAND. Regenerate after any schema change:
 *
 *   npm run types:gen
 *
 * (requires `SUPABASE_ACCESS_TOKEN`, or `npx supabase login` first)
 *
 * This file was transcribed from the generator output and contains every table's
 * Row/Insert/Update plus the enums. The generator additionally emits the `Tables<>` /
 * `TablesInsert<>` / `Enums<>` convenience helpers; nothing in this codebase imports
 * them, and regenerating will simply add them back.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          author_avatar: string | null;
          author_avatar_alt: string | null;
          author_avatar_title: string | null;
          author_avatar_description: string | null;
          author_name: string | null;
          author_role: string | null;
          body: Json;
          category: string | null;
          cover_image: string | null;
          cover_image_alt: string | null;
          cover_image_title: string | null;
          cover_image_description: string | null;
          created_at: string;
          date_label: string | null;
          excerpt: string | null;
          id: string;
          is_featured: boolean;
          is_published: boolean;
          read_time: string | null;
          related_slugs: string[];
          slug: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_avatar?: string | null;
          author_avatar_alt?: string | null;
          author_avatar_title?: string | null;
          author_avatar_description?: string | null;
          author_name?: string | null;
          author_role?: string | null;
          body?: Json;
          category?: string | null;
          cover_image?: string | null;
          cover_image_alt?: string | null;
          cover_image_title?: string | null;
          cover_image_description?: string | null;
          created_at?: string;
          date_label?: string | null;
          excerpt?: string | null;
          id?: string;
          is_featured?: boolean;
          is_published?: boolean;
          read_time?: string | null;
          related_slugs?: string[];
          slug: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_avatar?: string | null;
          author_avatar_alt?: string | null;
          author_avatar_title?: string | null;
          author_avatar_description?: string | null;
          author_name?: string | null;
          author_role?: string | null;
          body?: Json;
          category?: string | null;
          cover_image?: string | null;
          cover_image_alt?: string | null;
          cover_image_title?: string | null;
          cover_image_description?: string | null;
          created_at?: string;
          date_label?: string | null;
          excerpt?: string | null;
          id?: string;
          is_featured?: boolean;
          is_published?: boolean;
          read_time?: string | null;
          related_slugs?: string[];
          slug?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      destinations: {
        Row: {
          best_time: string | null;
          created_at: string;
          highlights: string[];
          id: string;
          image_url: string | null;
          image_alt: string | null;
          image_title: string | null;
          image_description: string | null;
          intro: string | null;
          is_published: boolean;
          name: string;
          region: string | null;
          slug: string;
          sort_order: number;
          tagline: string | null;
          updated_at: string;
        };
        Insert: {
          best_time?: string | null;
          created_at?: string;
          highlights?: string[];
          id?: string;
          image_url?: string | null;
          image_alt?: string | null;
          image_title?: string | null;
          image_description?: string | null;
          intro?: string | null;
          is_published?: boolean;
          name: string;
          region?: string | null;
          slug: string;
          sort_order?: number;
          tagline?: string | null;
          updated_at?: string;
        };
        Update: {
          best_time?: string | null;
          created_at?: string;
          highlights?: string[];
          id?: string;
          image_url?: string | null;
          image_alt?: string | null;
          image_title?: string | null;
          image_description?: string | null;
          intro?: string | null;
          is_published?: boolean;
          name?: string;
          region?: string | null;
          slug?: string;
          sort_order?: number;
          tagline?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          category: string | null;
          created_at: string;
          id: string;
          is_published: boolean;
          question: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          answer: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          question: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          question?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          admin_note: string | null;
          budget: string | null;
          country: string | null;
          created_at: string;
          destination: string | null;
          email: string;
          handled_at: string | null;
          id: string;
          message: string;
          name: string;
          phone: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["inquiry_status"];
          tour_slug: string | null;
          travelers: number | null;
        };
        Insert: {
          admin_note?: string | null;
          budget?: string | null;
          country?: string | null;
          created_at?: string;
          destination?: string | null;
          email: string;
          handled_at?: string | null;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          tour_slug?: string | null;
          travelers?: number | null;
        };
        Update: {
          admin_note?: string | null;
          budget?: string | null;
          country?: string | null;
          created_at?: string;
          destination?: string | null;
          email?: string;
          handled_at?: string | null;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          tour_slug?: string | null;
          travelers?: number | null;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string | null;
        };
        Relationships: [];
      };
      redirects: {
        Row: {
          created_at: string;
          from_path: string;
          id: string;
          status_code: number;
          to_path: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          from_path: string;
          id?: string;
          status_code?: number;
          to_path: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          from_path?: string;
          id?: string;
          status_code?: number;
          to_path?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seo_meta: {
        Row: {
          canonical_url: string | null;
          cornerstone: boolean;
          created_at: string;
          entity_id: string;
          entity_type: string;
          extra_keyphrases: string[];
          focus_keyphrase: string | null;
          id: string;
          meta_description: string | null;
          meta_title: string | null;
          og_description: string | null;
          og_image: string | null;
          og_image_alt: string | null;
          og_image_width: number | null;
          og_image_height: number | null;
          og_title: string | null;
          robots_noindex: boolean;
          schema_type: string | null;
          synonyms: string[];
          twitter_description: string | null;
          twitter_image: string | null;
          twitter_image_alt: string | null;
          twitter_title: string | null;
          updated_at: string;
        };
        Insert: {
          canonical_url?: string | null;
          cornerstone?: boolean;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          extra_keyphrases?: string[];
          focus_keyphrase?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_image_alt?: string | null;
          og_image_width?: number | null;
          og_image_height?: number | null;
          og_title?: string | null;
          robots_noindex?: boolean;
          schema_type?: string | null;
          synonyms?: string[];
          twitter_description?: string | null;
          twitter_image?: string | null;
          twitter_image_alt?: string | null;
          twitter_title?: string | null;
          updated_at?: string;
        };
        Update: {
          canonical_url?: string | null;
          cornerstone?: boolean;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          extra_keyphrases?: string[];
          focus_keyphrase?: string | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_image_alt?: string | null;
          og_image_width?: number | null;
          og_image_height?: number | null;
          og_title?: string | null;
          robots_noindex?: boolean;
          schema_type?: string | null;
          synonyms?: string[];
          twitter_description?: string | null;
          twitter_image?: string | null;
          twitter_image_alt?: string | null;
          twitter_title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          author: string;
          avatar_url: string | null;
          avatar_alt: string | null;
          avatar_title: string | null;
          avatar_description: string | null;
          created_at: string;
          headline: string | null;
          id: string;
          images: Json;
          is_featured: boolean;
          is_published: boolean;
          location: string | null;
          platform: string | null;
          quote: string;
          rating: number | null;
          sort_order: number;
          tour_label: string | null;
          updated_at: string;
        };
        Insert: {
          author: string;
          avatar_url?: string | null;
          avatar_alt?: string | null;
          avatar_title?: string | null;
          avatar_description?: string | null;
          created_at?: string;
          headline?: string | null;
          id?: string;
          images?: Json;
          is_featured?: boolean;
          is_published?: boolean;
          location?: string | null;
          platform?: string | null;
          quote: string;
          rating?: number | null;
          sort_order?: number;
          tour_label?: string | null;
          updated_at?: string;
        };
        Update: {
          author?: string;
          avatar_url?: string | null;
          avatar_alt?: string | null;
          avatar_title?: string | null;
          avatar_description?: string | null;
          created_at?: string;
          headline?: string | null;
          id?: string;
          images?: Json;
          is_featured?: boolean;
          is_published?: boolean;
          location?: string | null;
          platform?: string | null;
          quote?: string;
          rating?: number | null;
          sort_order?: number;
          tour_label?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      tour_activities: {
        Row: {
          activity_id: string;
          tour_id: string;
        };
        Insert: {
          activity_id: string;
          tour_id: string;
        };
        Update: {
          activity_id?: string;
          tour_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_activities_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tour_activities_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tours: {
        Row: {
          accessibility: Json;
          activities_count: number | null;
          activity_label: string | null;
          addons: Json;
          advice: Json;
          category: string;
          child_price_usd: number | null;
          created_at: string;
          destination_label: string | null;
          discount_child_price_usd: number | null;
          discount_price_usd: number | null;
          duration_days: number;
          duration_label: string | null;
          exclusions: string[];
          facts: Json;
          faqs: Json;
          glance: Json;
          group_size_max: number | null;
          hero_image: string | null;
          hero_image_alt: string | null;
          hero_image_title: string | null;
          hero_image_description: string | null;
          hidden_sections: string[];
          highlights: string[];
          id: string;
          images: Json;
          inclusions: string[];
          is_featured: boolean;
          is_published: boolean;
          itinerary: Json;
          map_embed: string | null;
          offers: Json;
          overview: Json;
          overview_tip: string | null;
          pledge: string[];
          price_bdt: number | null;
          price_note: string | null;
          price_tiers: Json;
          price_usd: number | null;
          primary_destination_slug: string | null;
          rating: number | null;
          related_post_slugs: string[];
          related_slugs: string[];
          reviews_count: number;
          slug: string;
          sort_order: number;
          stops_count: number | null;
          summary: string | null;
          title: string;
          updated_at: string;
          video_url: string | null;
          why_items: string[];
        };
        Insert: {
          accessibility?: Json;
          activities_count?: number | null;
          activity_label?: string | null;
          addons?: Json;
          advice?: Json;
          category?: string;
          child_price_usd?: number | null;
          created_at?: string;
          destination_label?: string | null;
          discount_child_price_usd?: number | null;
          discount_price_usd?: number | null;
          duration_days?: number;
          duration_label?: string | null;
          exclusions?: string[];
          facts?: Json;
          faqs?: Json;
          glance?: Json;
          group_size_max?: number | null;
          hero_image?: string | null;
          hero_image_alt?: string | null;
          hero_image_title?: string | null;
          hero_image_description?: string | null;
          hidden_sections?: string[];
          highlights?: string[];
          id?: string;
          images?: Json;
          inclusions?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          itinerary?: Json;
          map_embed?: string | null;
          offers?: Json;
          overview?: Json;
          overview_tip?: string | null;
          pledge?: string[];
          price_bdt?: number | null;
          price_note?: string | null;
          price_tiers?: Json;
          price_usd?: number | null;
          primary_destination_slug?: string | null;
          rating?: number | null;
          related_post_slugs?: string[];
          related_slugs?: string[];
          reviews_count?: number;
          slug: string;
          sort_order?: number;
          stops_count?: number | null;
          summary?: string | null;
          title: string;
          updated_at?: string;
          video_url?: string | null;
          why_items?: string[];
        };
        Update: {
          accessibility?: Json;
          activities_count?: number | null;
          activity_label?: string | null;
          addons?: Json;
          advice?: Json;
          category?: string;
          child_price_usd?: number | null;
          created_at?: string;
          destination_label?: string | null;
          discount_child_price_usd?: number | null;
          discount_price_usd?: number | null;
          duration_days?: number;
          duration_label?: string | null;
          exclusions?: string[];
          facts?: Json;
          faqs?: Json;
          glance?: Json;
          group_size_max?: number | null;
          hero_image?: string | null;
          hero_image_alt?: string | null;
          hero_image_title?: string | null;
          hero_image_description?: string | null;
          hidden_sections?: string[];
          highlights?: string[];
          id?: string;
          images?: Json;
          inclusions?: string[];
          is_featured?: boolean;
          is_published?: boolean;
          itinerary?: Json;
          map_embed?: string | null;
          offers?: Json;
          overview?: Json;
          overview_tip?: string | null;
          pledge?: string[];
          price_bdt?: number | null;
          price_note?: string | null;
          price_tiers?: Json;
          price_usd?: number | null;
          primary_destination_slug?: string | null;
          rating?: number | null;
          related_post_slugs?: string[];
          related_slugs?: string[];
          reviews_count?: number;
          slug?: string;
          sort_order?: number;
          stops_count?: number | null;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
          why_items?: string[];
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "admin";
      inquiry_status: "new" | "read" | "handled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
      inquiry_status: ["new", "read", "handled"],
    },
  },
} as const;
