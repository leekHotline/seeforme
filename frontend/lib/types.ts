/**
 * Shared TypeScript types matching backend Pydantic schemas.
 */

export type UserRole = "seeker" | "volunteer";

export type RequestMode = "hall" | "direct";

export type RequestStatus =
  | "open"
  | "claimed"
  | "replied"
  | "resolved"
  | "unresolved"
  | "cancelled";

export type ReplyType = "voice" | "text";

// ── Auth ──────────────────────────────────────────
export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  account: string;
  password: string;
}

// ── User ──────────────────────────────────────────
export interface UserProfile {
  id: string;
  role: UserRole;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccessibilitySettings {
  tts_enabled: boolean;
  tts_rate: number;
  haptic_enabled: boolean;
  voice_prompt_level: number;
}

// ── Help Requests ─────────────────────────────────
export interface HelpRequestCreate {
  voice_file_id: string;
  text?: string;
  image_file_ids?: string[];
  mode: RequestMode;
  target_volunteer_id?: string;
}

export interface HelpRequest {
  id: string;
  seeker_id: string;
  mode: RequestMode;
  status: RequestStatus;
  voice_file_id: string;
  raw_text: string | null;
  transcribed_text: string | null;
  created_at: string;
  updated_at: string;
}

// ── Reply ─────────────────────────────────────────
export interface ReplyCreate {
  reply_type: ReplyType;
  voice_file_id?: string;
  text?: string;
}

export interface Reply {
  id: string;
  request_id: string;
  volunteer_id: string;
  reply_type: ReplyType;
  voice_file_id: string | null;
  text: string | null;
  created_at: string;
}

// ── Feedback ──────────────────────────────────────
export interface FeedbackCreate {
  resolved: boolean;
  comment?: string;
}

export interface Feedback {
  id: string;
  request_id: string;
  seeker_id: string;
  resolved: boolean;
  comment: string | null;
  created_at: string;
}

// ── Upload ────────────────────────────────────────
export interface UploadPresignRequest {
  filename: string;
  mime_type: string;
  size: number;
}

export interface UploadPresignResponse {
  file_id: string;
  upload_url: string;
}
