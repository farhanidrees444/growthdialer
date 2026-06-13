/**
 * Abstract 10DLC / carrier-trust profile shapes for workspace session storage.
 * These mirror a future Postgres layout — no migration required until registration UI ships.
 *
 * Suggested tables (documentation only):
 * - workspace_messaging_profiles (brand + campaign registry)
 * - workspace_number_trust (per-DID attestation + CNAM)
 */

export type TenDlcBrandStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type TenDlcCampaignStatus =
  | 'draft'
  | 'pending_carrier'
  | 'active'
  | 'expired'
  | 'rejected';

export type StirAttestationLevel = 'A' | 'B' | 'C' | 'none';

export interface WorkspaceTenDlcBrandProfile {
  workspace_id: string;
  legal_business_name: string;
  ein_or_tax_id?: string | null;
  brand_id?: string | null;
  status: TenDlcBrandStatus;
  vertical?: string | null;
  website_url?: string | null;
  support_email?: string | null;
  support_phone_e164?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
}

export interface WorkspaceTenDlcCampaignProfile {
  workspace_id: string;
  brand_profile_id: string;
  campaign_id?: string | null;
  use_case: 'sales_outbound' | 'customer_care' | 'mixed';
  sample_messages: string[];
  opt_in_description: string;
  opt_out_keywords: string[];
  status: TenDlcCampaignStatus;
  daily_volume_cap?: number | null;
  linked_call_control_app_id?: string | null;
}

export interface WorkspaceNumberTrustAssignment {
  workspace_id: string;
  phone_number_e164: string;
  cnam_display_name?: string | null;
  stir_attestation: StirAttestationLevel;
  ten_dlc_campaign_id?: string | null;
  spam_score_last_checked_at?: string | null;
  spam_label?: 'clean' | 'flagged' | 'unknown' | null;
  shaken_passport_present: boolean;
}

/** Merged trust context applied on every outbound dial payload. */
export interface WorkspaceOutboundTrustContext {
  workspace_id: string;
  from_display_name: string | null;
  stir_attestation: StirAttestationLevel;
  ten_dlc_campaign_id: string | null;
  cnam_registered: boolean;
  trust_tier: 'enterprise' | 'standard' | 'unverified';
}
