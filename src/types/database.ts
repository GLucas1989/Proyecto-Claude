export type UserRole = "USER" | "CREATOR" | "ADMIN";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete";
export type ContentType = "pdf" | "ppt" | "video" | "post" | "vod";
export type AdPlacement =
  | "home_between_games"
  | "game_page_top"
  | "creator_page_sidebar"
  | "global_banner";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
        };
      };
      creator_profiles: {
        Row: {
          id: string;
          slug: string;
          user_id: string | null;
          game_slug: string;
          channel_id_youtube: string | null;
          channel_id_twitch: string | null;
          verified: boolean;
          verified_at: string | null;
          verified_method: string | null;
          stripe_account_id: string | null;
          revenue_split: number;
          created_at: string;
        };
        Insert: {
          slug: string;
          user_id?: string | null;
          game_slug: string;
          channel_id_youtube?: string | null;
          channel_id_twitch?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          verified_method?: string | null;
          stripe_account_id?: string | null;
          revenue_split?: number;
        };
        Update: {
          user_id?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          verified_method?: string | null;
          stripe_account_id?: string | null;
          revenue_split?: number;
        };
      };
      claim_requests: {
        Row: {
          id: string;
          user_id: string;
          creator_slug: string;
          game_slug: string;
          status: ClaimStatus;
          verification_code: string | null;
          oauth_token: string | null;
          admin_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          user_id: string;
          creator_slug: string;
          game_slug: string;
          status?: ClaimStatus;
          verification_code?: string | null;
          oauth_token?: string | null;
          admin_notes?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          status?: ClaimStatus;
          admin_notes?: string | null;
          resolved_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          creator_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          status: SubscriptionStatus;
          platform_fee_pct: number;
          is_collab_content: boolean;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
        };
        Insert: {
          subscriber_id: string;
          creator_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          status?: SubscriptionStatus;
          platform_fee_pct: number;
          is_collab_content?: boolean;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
        };
        Update: {
          stripe_subscription_id?: string | null;
          status?: SubscriptionStatus;
          platform_fee_pct?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
        };
      };
      native_ads: {
        Row: {
          id: string;
          brand_name: string;
          logo_url: string | null;
          headline: string;
          body_text: string | null;
          cta_label: string;
          cta_url: string;
          placement: AdPlacement;
          game_slug: string | null;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
        };
        Insert: {
          brand_name: string;
          logo_url?: string | null;
          headline: string;
          body_text?: string | null;
          cta_label?: string;
          cta_url: string;
          placement: AdPlacement;
          game_slug?: string | null;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Update: {
          brand_name?: string;
          logo_url?: string | null;
          headline?: string;
          body_text?: string | null;
          cta_label?: string;
          cta_url?: string;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
        };
      };
    };
  };
}
