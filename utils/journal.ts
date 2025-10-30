import { supabase } from '../services/supabaseClient';
import type { JournalEntry, GratitudeNote, TimeCapsuleNote, ChatMessage } from '../types';
import { dataURLtoFile } from './dataURLtoFile';

const JOURNAL_TABLE = 'journal_entries';
const GRATITUDE_TABLE = 'gratitude_notes';
const TIME_CAPSULE_TABLE = 'time_capsule_notes';
const SUMMARY_TABLE = 'weekly_summaries';
const CHAT_TABLE = 'chat_messages';
const FEEDBACK_TABLE = 'feedback';
const IMAGE_BUCKET = 'journal-images';

// --- Journal Entries ---

export const saveJournalEntry = async (content: string, image?: string): Promise<JournalEntry> => {
    let imageUrl: string | undefined = undefined;

    if (image) {
        const file = dataURLtoFile(image, `entry_${Date.now()}.png`);
        const filePath = `public/${file.name}`;
        
        const { error: uploadError } = await supabase.storage
            .from(IMAGE_BUCKET)
            .upload(filePath, file);

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
        imageUrl = data.publicUrl;
    }

    const { data: newEntry, error } = await supabase
        .from(JOURNAL_TABLE)
        .insert({ content, image_url: imageUrl })
        .select()
        .single();
    
    if (error) throw new Error(`Failed to save journal entry: ${error.message}`);
    return newEntry as JournalEntry;
};

export const getJournalEntries = async (): Promise<JournalEntry[]> => {
    const { data, error } = await supabase
        .from(JOURNAL_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get journal entries: ${error.message}`);
    return data as JournalEntry[];
};

// --- Gratitude Notes ---

export const saveGratitudeNote = async (content: string): Promise<GratitudeNote> => {
    const { data: newNote, error } = await supabase
        .from(GRATITUDE_TABLE)
        .insert({ content })
        .select()
        .single();

    if (error) throw new Error(`Failed to save gratitude note: ${error.message}`);
    return newNote as GratitudeNote;
};

export const getGratitudeNotes = async (): Promise<GratitudeNote[]> => {
     const { data, error } = await supabase
        .from(GRATITUDE_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get gratitude notes: ${error.message}`);
    return data as GratitudeNote[];
};


// --- Time Capsule Functions ---

export const saveTimeCapsuleNote = async (content: string, open_at: string): Promise<TimeCapsuleNote> => {
    await supabase.from(TIME_CAPSULE_TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { data: newNote, error } = await supabase
        .from(TIME_CAPSULE_TABLE)
        .insert({ content, open_at, opened: false })
        .select()
        .single();

    if (error) throw new Error(`Failed to save time capsule: ${error.message}`);
    return newNote as TimeCapsuleNote;
};

export const getActiveTimeCapsuleNote = async (): Promise<TimeCapsuleNote | null> => {
    const { data, error } = await supabase
        .from(TIME_CAPSULE_TABLE)
        .select('*')
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = "The result contains 0 rows"
         throw new Error(`Failed to get time capsule: ${error.message}`);
    }
    return data as TimeCapsuleNote | null;
};

export const markTimeCapsuleAsOpened = async (id: string): Promise<TimeCapsuleNote | null> => {
    const { data, error } = await supabase
        .from(TIME_CAPSULE_TABLE)
        .update({ opened: true })
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw new Error(`Failed to open time capsule: ${error.message}`);
    return data as TimeCapsuleNote | null;
};

export const deleteActiveTimeCapsule = async (): Promise<void> => {
    const { error } = await supabase.from(TIME_CAPSULE_TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Failed to delete time capsule: ${error.message}`);
};

// --- Summary Functions ---

export const getWeeklySummaryPrompt = async (): Promise<string> => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: recentEntries, error } = await supabase
        .from(JOURNAL_TABLE)
        .select('created_at, content, image_url')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch recent entries for summary: ${error.message}`);
    
    if (!recentEntries || recentEntries.length === 0) {
        return "Soundous hasn't written any notes this week. Gently encourage her to share how she's feeling when she's ready.";
    }

    const entryText = recentEntries
        .map(entry => {
            const imageIndicator = entry.image_url ? " [Image attached]" : "";
            const contentSnippet = entry.content ? `: "${entry.content.substring(0, 100)}..."` : " (Image only)";
            return `- On ${new Date(entry.created_at).toLocaleDateString('en-US')}, she wrote${contentSnippet}${imageIndicator}`;
        })
        .join('\n');

    return `Here are some of Soundous's notes from the past week:\n${entryText}`;
};

export const setSummaryGeneratedDate = async (): Promise<void> => {
    const { error } = await supabase.from(SUMMARY_TABLE).insert({});
    if (error) throw new Error(`Failed to log summary generation: ${error.message}`);
};

export const canGenerateNewSummary = async (): Promise<{ canGenerate: boolean; daysRemaining: number }> => {
    const { data: lastSummary, error } = await supabase
        .from(SUMMARY_TABLE)
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to check last summary date: ${error.message}`);
    }

    if (!lastSummary) {
        return { canGenerate: true, daysRemaining: 0 };
    }

    const lastSummaryDate = new Date(lastSummary.created_at);
    const now = new Date();
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    const timeSinceLastSummary = now.getTime() - lastSummaryDate.getTime();

    if (timeSinceLastSummary < sevenDaysInMillis) {
        const millisRemaining = sevenDaysInMillis - timeSinceLastSummary;
        const daysRemaining = Math.ceil(millisRemaining / (1000 * 60 * 60 * 24));
        return { canGenerate: false, daysRemaining };
    }

    return { canGenerate: true, daysRemaining: 0 };
};

// --- Chat Messages ---
export const getChatMessages = async (): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from(CHAT_TABLE)
        .select('id, sender, text')
        .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get chat messages: ${error.message}`);
    
    return data.map(msg => ({
        id: msg.id, // using db id
        sender: msg.sender as 'user' | 'ai',
        text: msg.text
    }));
};

export const saveChatMessage = async (message: Omit<ChatMessage, 'id' | 'state'>): Promise<void> => {
    const { error } = await supabase
        .from(CHAT_TABLE)
        .insert({ sender: message.sender, text: message.text });

    if (error) throw new Error(`Failed to save chat message: ${error.message}`);
};

// --- Feedback ---
export const saveFeedback = async (content: string, ipAddress: string | null): Promise<void> => {
    const { error } = await supabase
        .from(FEEDBACK_TABLE)
        .insert({ content, ip_address: ipAddress });

    if (error) throw new Error(`Failed to save feedback: ${error.message}`);
};


// --- Data Management ---

export const deleteAllUserData = async (): Promise<void> => {
    // Delete from all tables
    const tables = [JOURNAL_TABLE, GRATITUDE_TABLE, TIME_CAPSULE_TABLE, SUMMARY_TABLE, CHAT_TABLE, FEEDBACK_TABLE];
    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(`Failed to clear table ${table}: ${error.message}`);
    }

    // Clear storage bucket
    const { data: files, error: listError } = await supabase.storage.from(IMAGE_BUCKET).list('public');
    if (listError) throw new Error(`Failed to list storage files: ${listError.message}`);
    
    if (files && files.length > 0) {
        const filePaths = files.map(file => `public/${file.name}`);
        const { error: removeError } = await supabase.storage.from(IMAGE_BUCKET).remove(filePaths);
        if (removeError) throw new Error(`Failed to clear storage bucket: ${removeError.message}`);
    }
};