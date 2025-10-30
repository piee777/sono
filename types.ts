export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  state?: 'loading' | 'error';
}

export interface JournalEntry {
    id: string;
    created_at: string;
    content: string;
    image_url?: string;
}

export interface GratitudeNote {
    id: string;
    created_at: string;
    content: string;
}

export interface TimeCapsuleNote {
    id: string;
    created_at: string;
    open_at: string;
    content: string;
    opened: boolean;
}

export interface Feedback {
    id: string;
    created_at: string;
    content: string;
    ip_address?: string;
}