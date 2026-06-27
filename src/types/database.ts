export type UserRole = "USER" | "CREATOR" | "ADMIN";
export type PublicationStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
export type PublicationType   = "GUIDE" | "BUILD" | "TIER_LIST";
export type VoteType          = "UPVOTE" | "DOWNVOTE";
export type PromotionPayment  = "PENDING" | "PAID" | "REFUNDED";

export interface UserPublication {
  id: string;
  user_id: string;
  game_slug: string;
  title: string;
  content_markdown: string;
  status: PublicationStatus;
  type: PublicationType;
  attachments_urls: string[];
  is_premium: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  rejected_reason: string | null;
}

export interface UserReputation {
  id: string;
  user_id: string;
  points: number;
  rank_title: string;
  guides_published: number;
  updated_at: string;
}

export interface PromotedContent {
  id: string;
  publication_id: string;
  user_id: string;
  game_slug: string;
  expires_at: string;
  payment_status: PromotionPayment;
  stripe_payment_intent_id: string | null;
  price_cents: number;
  created_at: string;
}
export type WalletTxType = "EARNING" | "WITHDRAWAL" | "REFUND" | "STREAM_TIP";
export type FollowTargetType = "game" | "author";
export type UserSubStatus = "active" | "canceled" | "expired" | "past_due";

export interface FoundingPartner {
  id: string;
  user_id: string;
  creator_id: string | null;
  brand_name: string | null;
  revenue_share_percentage: number;
  is_active: boolean;
  notes: string | null;
  activated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorWallet {
  user_id: string;
  available_balance: number;
  withdrawn_balance: number;
  stripe_connect_id: string | null;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: WalletTxType;
  description: string | null;
  stripe_ref: string | null;
  created_at: string;
}

export type ClaimStatus = "pending" | "approved" | "rejected";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete";
export type ContentType = "pdf" | "ppt" | "video" | "post" | "vod";
export type PlatformContentType = "pdf" | "ppt" | "audio" | "video";
export type GameSubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";
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
          is_claimed: boolean;
          is_founding_partner: boolean;
          is_trusted_creator: boolean;
          can_monetize: boolean;
          monetization_source: string | null;
          is_official_creator: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_claimed?: boolean;
          is_founding_partner?: boolean;
          is_trusted_creator?: boolean;
          can_monetize?: boolean;
          monetization_source?: string | null;
          is_official_creator?: boolean;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          is_claimed?: boolean;
          is_founding_partner?: boolean;
          is_trusted_creator?: boolean;
          can_monetize?: boolean;
          monetization_source?: string | null;
          is_official_creator?: boolean;
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
      game_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          game_slug: string;
          status: GameSubscriptionStatus;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          game_slug: string;
          status?: GameSubscriptionStatus;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
        };
        Update: {
          status?: GameSubscriptionStatus;
          stripe_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
        };
      };
      platform_content: {
        Row: {
          id: string;
          game_slug: string;
          type: PlatformContentType;
          title: string;
          description: string | null;
          file_url: string;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          sort_order: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          game_slug: string;
          type: PlatformContentType;
          title: string;
          description?: string | null;
          file_url: string;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          sort_order?: number;
          is_published?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          file_url?: string;
          thumbnail_url?: string | null;
          is_published?: boolean;
          sort_order?: number;
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
      user_follows: {
        Row: {
          id: string;
          user_id: string;
          target_id: string;
          type: FollowTargetType;
          created_at: string;
        };
        Insert: {
          user_id: string;
          target_id: string;
          type: FollowTargetType;
        };
        Update: {
          target_id?: string;
          type?: FollowTargetType;
        };
      };
      user_credits: {
        Row: {
          user_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
        };
        Update: {
          balance?: number;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          academy_id: string | null;
          is_global_pass: boolean;
          status: UserSubStatus;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          academy_id?: string | null;
          is_global_pass?: boolean;
          status?: UserSubStatus;
          expires_at?: string | null;
        };
        Update: {
          academy_id?: string | null;
          is_global_pass?: boolean;
          status?: UserSubStatus;
          expires_at?: string | null;
        };
      };
    };
    Functions: {
      credit_author_wallet: {
        Args: {
          p_user_id: string;
          p_amount_cents: number;
          p_description: string;
          p_stripe_ref: string;
        };
        Returns: undefined;
      };
      credit_user_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_ref?: string | null;
        };
        Returns: undefined;
      };
      process_stream_tip: {
        Args: {
          p_sender_id: string;
          p_receiver_id: string;
          p_token_amount: number;
        };
        Returns: {
          success: boolean;
          tokens_spent: number;
          gross_usd: number;
          net_usd: number;
          receiver_id: string;
        };
      };
    };
  };
}
