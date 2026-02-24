import type { HelpRequest, Reply } from "@/lib/types";

const now = Date.now();

function ago(minutes: number): string {
  return new Date(now - minutes * 60 * 1000).toISOString();
}

export type ShowcaseCardKind = "text-image" | "text-video" | "text-audio";

export interface ShowcaseCard {
  id: string;
  kind: ShowcaseCardKind;
  author: string;
  postedAt: string;
  title: string;
  text: string;
  imageUrl?: string;
  videoCoverUrl?: string;
  videoDuration?: string;
  audioDuration?: string;
  tags: string[];
}

export const showcaseCards: ShowcaseCard[] = [
  {
    id: "showcase-image",
    kind: "text-image",
    author: "Lina",
    postedAt: "2分钟前",
    title: "图文求助示例",
    text: "请帮我确认这盒药的有效期与用法，图片里有正反两面。",
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    tags: ["图文", "药品识别", "高优先"],
  },
  {
    id: "showcase-video",
    kind: "text-video",
    author: "Kai",
    postedAt: "8分钟前",
    title: "视频+文字示例",
    text: "我录了一段 12 秒视频，请帮我看下公交站牌现在显示的是哪一路。",
    videoCoverUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
    videoDuration: "00:12",
    tags: ["视频", "站牌识别"],
  },
  {
    id: "showcase-audio",
    kind: "text-audio",
    author: "Ming",
    postedAt: "15分钟前",
    title: "音频+文字示例",
    text: "我上传了语音描述现场情况，请帮我确认柜台叫号和窗口位置。",
    audioDuration: "00:28",
    tags: ["音频", "现场导航"],
  },
];

export const demoSeekerRequests: HelpRequest[] = [
  {
    id: "demo-seeker-1",
    seeker_id: "demo-user",
    mode: "hall",
    status: "open",
    voice_file_id: "demo-voice-1",
    raw_text: "I need help checking medicine instructions.",
    transcribed_text: "Need help checking medicine instructions and dosage.",
    attachments: [],
    created_at: ago(12),
    updated_at: ago(10),
  },
  {
    id: "demo-seeker-2",
    seeker_id: "demo-user",
    mode: "hall",
    status: "replied",
    voice_file_id: "demo-voice-2",
    raw_text: "Can someone identify the bus number for me?",
    transcribed_text: "Please help identify the bus number at station A.",
    attachments: [],
    created_at: ago(35),
    updated_at: ago(8),
  },
  {
    id: "demo-seeker-3",
    seeker_id: "demo-user",
    mode: "hall",
    status: "resolved",
    voice_file_id: "demo-voice-3",
    raw_text: "Need help reading a document.",
    transcribed_text: "Assistance requested for reading one printed document.",
    attachments: [],
    created_at: ago(90),
    updated_at: ago(50),
  },
];

export const demoVolunteerRequests: HelpRequest[] = [
  {
    id: "demo-volunteer-1",
    seeker_id: "seeker-1001",
    mode: "hall",
    status: "open",
    voice_file_id: "voice-1001",
    raw_text: "Could someone help identify this product label?",
    transcribed_text: "Need quick support identifying a product label in the kitchen.",
    attachments: [],
    created_at: ago(6),
    updated_at: ago(4),
  },
  {
    id: "demo-volunteer-2",
    seeker_id: "seeker-1002",
    mode: "hall",
    status: "claimed",
    voice_file_id: "voice-1002",
    raw_text: "Need help sorting mail envelopes.",
    transcribed_text: "Please help me understand two official mail envelopes.",
    attachments: [],
    created_at: ago(28),
    updated_at: ago(17),
  },
  {
    id: "demo-volunteer-3",
    seeker_id: "seeker-1003",
    mode: "hall",
    status: "open",
    voice_file_id: "voice-1003",
    raw_text: "Need directions near subway exit C.",
    transcribed_text: "Can anyone guide me from subway exit C to the nearest clinic?",
    attachments: [],
    created_at: ago(41),
    updated_at: ago(40),
  },
];

export const demoRepliesByRequest: Record<string, Reply[]> = {
  "demo-seeker-2": [
    {
      id: "demo-reply-1",
      request_id: "demo-seeker-2",
      volunteer_id: "volunteer-2026",
      reply_type: "text",
      voice_file_id: null,
      text: "Bus 316 is arriving now. The front door is in your two o'clock direction.",
      created_at: ago(7),
    },
  ],
};

export function getDemoRequestById(requestId: string): HelpRequest | null {
  const all = [...demoSeekerRequests, ...demoVolunteerRequests];
  return all.find((item) => item.id === requestId) ?? null;
}
