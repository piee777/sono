import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from "@google/genai";
import { 
    Card, CardHeader, PrimaryButton,
    ChatBubble, MessageInput, TypingIndicator
} from './components/CheckinComponents';
import Page from './components/Page';
import { generateOneTimeResponse } from './services/geminiService';
import { saveJournalEntry, getJournalEntries, getWeeklySummaryPrompt, canGenerateNewSummary, setSummaryGeneratedDate, saveGratitudeNote, getGratitudeNotes, saveTimeCapsuleNote, getActiveTimeCapsuleNote, markTimeCapsuleAsOpened, deleteActiveTimeCapsule, saveFeedback } from './utils/journal';
import { handleApiError } from './utils/error';
import type { ChatMessage, JournalEntry, GratitudeNote, TimeCapsuleNote } from './types';
import { Sparkles, Leaf, Send, Wind, History, Feather, BrainCircuit, Pill, ImagePlus, X, Clock, Smile, Frown, Meh, Star, Bed, MessageCircle, CheckCircle2, ThumbsUp, Settings, Trash2, Info, Heart, Plus, Mail, Unlock, LoaderCircle } from 'lucide-react';
import { getClientIpAddress } from './utils/network';

const LoadingCard: React.FC<{className?: string}> = ({ className }) => (
    <Card className={`flex items-center justify-center h-24 ${className}`}>
        <TypingIndicator />
    </Card>
);

// --- Dynamic Header for HomePage ---
const DynamicHeader: React.FC = () => {
    const [header, setHeader] = useState({ title: '', subtitle: '' });

    useEffect(() => {
        const hours = new Date().getHours();
        let title = '';
        let subtitle = '';
        if (hours < 12) {
            title = '☀️ Good morning, Soundous';
            subtitle = "Here's to a gentle start to your day.";
        } else if (hours < 18) {
            title = '🌤️ Good afternoon, Soundous';
            subtitle = 'Hope you are having a peaceful day.';
        } else {
            title = '🌙 Good evening, Soundous';
            subtitle = "Hope you're feeling calm tonight 💫";
        }
        setHeader({ title, subtitle });
    }, []);

    return (
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms', paddingLeft: '24px', paddingTop: '60px' }}>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--primary-text)' }}>{header.title}</h1>
            <p className="text-lg opacity-70" style={{ color: 'var(--secondary-text)' }}>{header.subtitle}</p>
        </div>
    );
}

// --- Daily Mood Check-in for HomePage ---
const DailyMoodCheckin: React.FC = () => {
    const [selected, setSelected] = useState<string | null>(null);
    const moods = [
        { name: 'Happy', icon: <Smile size={28} /> },
        { name: 'Okay', icon: <Meh size={28} /> },
        { name: 'Sad', icon: <Frown size={28} /> },
        { name: 'Excited', icon: <Star size={28} /> },
        { name: 'Tired', icon: <Bed size={28} /> },
    ];

    return (
        <Card className="ui-card animate-fade-in-up animate-delay-200">
             <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--primary-text)' }}>How are you feeling today?</h2>
             <div className="flex justify-around">
                {moods.map(mood => (
                     <button
                        key={mood.name}
                        onClick={() => setSelected(mood.name)}
                        className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300
                            bg-[rgba(255,255,255,0.08)] backdrop-blur-md border
                            shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)]
                            hover:bg-[rgba(255,255,255,0.15)]
                            ${selected === mood.name ? 'border-[var(--primary-accent)] shadow-[0_0_15px_var(--primary-accent)] scale-110 text-white' : 'text-[var(--secondary-text)] border-transparent'}`}
                     >
                        {mood.icon}
                     </button>
                ))}
             </div>
        </Card>
    );
};

// --- Daily Actions Widget for HomePage ---
interface Action {
    id: string;
    text: string;
    question: string;
    icon: React.ReactNode;
}
const actions: Action[] = [
    { id: 'sleep', text: 'How was your night?', question: 'How did you sleep last night, Soundous?', icon: <Bed size={22} /> },
    { id: 'meds', text: 'Take your medicine?', question: 'Did you remember to take your medicine?', icon: <Pill size={22} /> },
    { id: 'moment', text: 'Take a moment for you?', question: 'Did you take a small moment just for yourself today?', icon: <Leaf size={22} /> },
];

const ActionItem: React.FC<{ action: Action }> = ({ action }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        setIsLoading(true);
        setResponse(null);
        try {
            const prompt = `Soundous is answering a daily check-in. Her answer to "${action.question}" is "${inputValue}". Give her a short, caring, and informal reply in your usual persona.`;
            const aiResponse = await generateOneTimeResponse(prompt);
            setResponse(aiResponse);
            setTimeout(() => {
                setIsCompleted(true);
                setIsOpen(false);
            }, 2500);
        } catch (error) {
            setResponse(handleApiError(error));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={`w-full p-4 rounded-xl transition-all duration-500 ease-in-out border
            ${isCompleted ? 'bg-green-500/10 border-green-400/30' : 'bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border-transparent'}`}>
            <button
                onClick={() => !isCompleted && setIsOpen(!isOpen)}
                className="w-full flex items-center gap-4 text-left"
                disabled={isCompleted}
            >
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-300
                    ${isCompleted ? 'bg-green-500/20 text-green-300' : 'bg-violet-500/20 text-violet-300'}`}>
                    {isCompleted ? <CheckCircle2 size={22} /> : action.icon}
                </div>
                <span className={`flex-1 font-medium transition-opacity duration-300 ${isCompleted ? 'opacity-50 line-through' : 'opacity-100'}`} style={{ color: 'var(--primary-text)' }}>
                    {action.text}
                </span>
            </button>
            {isOpen && (
                <div className="mt-4 animate-fade-in-up" style={{ animationDuration: '0.4s'}}>
                    {response ? (
                        <div className="p-3 bg-violet-500/10 rounded-lg text-center">
                            <p className="text-violet-200">{response}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                             <p className="text-sm text-violet-200 mb-1">{action.question}</p>
                             <input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Share a little..."
                                className="w-full bg-black/20 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400"
                                disabled={isLoading}
                             />
                             <button type="submit" disabled={isLoading || !inputValue.trim()} className="flex items-center justify-center gap-2 p-2 bg-violet-500/50 hover:bg-violet-500/80 rounded-lg disabled:opacity-50">
                                {isLoading ? <Wind size={18} className="animate-spin" /> : <ThumbsUp size={18}/>}
                             </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

const DailyActionsWidget: React.FC = () => {
    return (
        <Card className="ui-card animate-fade-in-up animate-delay-300">
            <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--primary-text)' }}>A Deeper Check-in</h2>
            <div className="space-y-3">
                {actions.map(action => <ActionItem key={action.id} action={action} />)}
            </div>
        </Card>
    );
};

// --- NEW: Creative Spark Widget ---
const creativeSparks = [
    "Design a logo for a fictional coffee shop called 'The Cosmic Brew'.",
    "Create a minimalist poster for your favorite Agatha Christie novel.",
    "Imagine a color palette that represents 'calmness after a storm'.",
    "Doodle a character inspired by the last song you listened to.",
    "Design a simple app icon for a 'mood tracker'.",
    "What would a 'passion flower' look like in your art style? Sketch it.",
    "Create a typography post with the quote: 'Trust the process.'",
];

const CreativeSparkWidget: React.FC = () => {
    const [spark, setSpark] = useState('');

    const getNewSpark = () => {
        const randomIndex = Math.floor(Math.random() * creativeSparks.length);
        setSpark(creativeSparks[randomIndex]);
    };

    useEffect(() => {
        getNewSpark();
    }, []);

    return (
        <Card className="ui-card animate-fade-in-up animate-delay-400">
             <CardHeader icon={<Sparkles size={24} />} title="Your Creative Spark" subtitle="A little nudge for your inner artist." />
             <p className="my-4 text-center text-lg leading-relaxed" style={{ color: 'var(--secondary-text)' }}>
                "{spark}"
             </p>
             <button
                onClick={getNewSpark}
                className="w-full flex items-center justify-center gap-2 p-2 bg-white/10 text-violet-300 rounded-lg hover:bg-white/20 transition-colors"
             >
                <Feather size={18} />
                <span>Get another spark</span>
             </button>
        </Card>
    );
};


// --- NEW: Gratitude Jar Widget ---
const GratitudeJarWidget: React.FC = () => {
    const [notes, setNotes] = useState<GratitudeNote[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedNotes = await getGratitudeNotes();
            setNotes(fetchedNotes);
        } catch (err) {
            setError("Couldn't load your gratitude notes.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleSaveNote = async () => {
        if (!inputValue.trim()) return;
        setIsLoading(true);
        try {
            await saveGratitudeNote(inputValue);
            setInputValue('');
            setIsAdding(false);
            await fetchNotes(); // Refresh notes
        } catch (err) {
            setError("Couldn't save your note. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const latestNote = notes.length > 0 ? notes[0] : null;

    return (
        <Card className="ui-card animate-fade-in-up animate-delay-500">
            <CardHeader icon={<Heart size={24} />} title="Gratitude Jar" subtitle="What's one good thing from today?" />
            {error && <p className="text-red-400 text-sm text-center my-2">{error}</p>}
            
            {latestNote && !isAdding && (
                <div className="my-2 p-3 bg-yellow-500/10 rounded-lg text-center">
                    <p className="text-sm text-yellow-200 opacity-80">You were recently grateful for:</p>
                    <p className="text-yellow-100 font-medium">"{latestNote.content}"</p>
                </div>
            )}
            
            {isAdding ? (
                <div className="flex flex-col gap-2 mt-4 animate-fade-in-up" style={{animationDuration: '0.4s'}}>
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Something small or big..."
                        className="w-full bg-black/20 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        disabled={isLoading}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleSaveNote} disabled={!inputValue.trim() || isLoading} className="flex-1 p-2 bg-yellow-500/50 hover:bg-yellow-500/80 rounded-lg disabled:opacity-50 flex items-center justify-center">
                           {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : 'Save'}
                        </button>
                        <button onClick={() => setIsAdding(false)} disabled={isLoading} className="p-2 bg-gray-500/50 hover:bg-gray-500/80 rounded-lg">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} className="mt-4 w-full flex items-center justify-center gap-2 p-3 bg-white/10 text-yellow-300 rounded-lg hover:bg-white/20 transition-colors">
                    <Plus size={20} />
                    <span>Add to the jar</span>
                </button>
            )}
        </Card>
    );
};

// --- NEW: Time Capsule Widget ---
const TimeCapsuleWidget: React.FC = () => {
    const [capsule, setCapsule] = useState<TimeCapsuleNote | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [content, setContent] = useState('');
    const [openDate, setOpenDate] = useState('');
    const [reflection, setReflection] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCapsule = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const activeCapsule = await getActiveTimeCapsuleNote();
            setCapsule(activeCapsule);
        } catch(err) {
            setError("Could not load your time capsule.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCapsule();
    }, []);

    const handleSave = async () => {
        if (!content.trim() || !openDate) return;
        setIsLoading(true);
        setError(null);
        try {
            const newCapsule = await saveTimeCapsuleNote(content, openDate);
            setCapsule(newCapsule);
            setIsCreating(false);
            setContent('');
            setOpenDate('');
        } catch(err) {
            setError("Could not save your time capsule.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const isReadyToOpen = capsule && !capsule.opened && new Date() >= new Date(capsule.open_at);

    const handleOpen = async () => {
        if (!capsule) return;
        setIsLoading(true);
        try {
            const openedCapsule = await markTimeCapsuleAsOpened(capsule.id);
            setCapsule(openedCapsule);
        } catch (err) {
             setError("Failed to open the capsule.");
             console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetReflection = async () => {
        if (!capsule) return;
        setIsLoading(true);
        setReflection(null);
        setError(null);
        try {
            const prompt = `Soundous wrote a message to her future self on ${new Date(capsule.created_at).toLocaleDateString()}. Today, she opened it. The message is: "${capsule.content}". Generate a gentle, short, and caring reflection on this moment for her, in your usual persona.`;
            const aiResponse = await generateOneTimeResponse(prompt);
            setReflection(aiResponse);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await deleteActiveTimeCapsule();
            setCapsule(null);
            setReflection(null);
            setError(null);
        } catch (err) {
            setError("Could not delete the capsule.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const renderContent = () => {
        if (isLoading && !capsule) return <LoadingCard className="h-20" />;
        if (error) return <p className="text-red-400 text-center mt-4">{error}</p>;

        if (isCreating) {
            return (
                <div className="flex flex-col gap-3 mt-4 animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="A secret note for future you..." className="w-full h-24 p-2 bg-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    <input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} min={minDate} className="w-full bg-black/20 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400" style={{ colorScheme: 'dark' }} />
                    <div className="flex gap-2">
                        <button onClick={handleSave} disabled={!content.trim() || !openDate || isLoading} className="flex-1 p-2 bg-violet-500/50 hover:bg-violet-500/80 rounded-lg disabled:opacity-50 flex items-center justify-center">{isLoading ? <LoaderCircle size={18} className="animate-spin" /> : 'Save Capsule'}</button>
                        <button onClick={() => setIsCreating(false)} className="p-2 bg-gray-500/50 hover:bg-gray-500/80 rounded-lg">Cancel</button>
                    </div>
                </div>
            );
        }

        if (capsule) {
            if (isReadyToOpen) {
                return (
                    <div className="mt-4">
                        <PrimaryButton onClick={handleOpen} disabled={isLoading}><Unlock size={20}/> Open Your Message</PrimaryButton>
                    </div>
                );
            }
            if (capsule.opened) {
                 return (
                    <div className="mt-4 space-y-4">
                        <p className="text-sm text-center text-violet-300">A message from your past self:</p>
                        <div className="p-4 bg-black/20 rounded-lg">
                            <p className="leading-relaxed whitespace-pre-wrap break-words" style={{color: 'var(--secondary-text)'}}>{capsule.content}</p>
                        </div>
                        {isLoading && <LoadingCard className="h-16" />}
                        {error && <p className="text-red-400 text-center">{error}</p>}
                        {reflection && (
                             <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                                 <p className="leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--secondary-text)'}}>{reflection}</p>
                             </div>
                        )}
                        {!reflection && !isLoading && <PrimaryButton onClick={handleGetReflection}><Sparkles size={20}/> Get a gentle reflection</PrimaryButton>}
                         <button onClick={handleDelete} disabled={isLoading} className="w-full flex items-center justify-center gap-2 p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-colors mt-2">
                            <Trash2 size={18} /><span>Delete and start new</span>
                         </button>
                    </div>
                );
            }
            // Capsule is locked
            const openOn = new Date(capsule.open_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            return (
                 <div className="mt-4 p-4 text-center bg-black/20 rounded-lg">
                    <p className="text-violet-200">Your message is sealed.</p>
                    <p className="text-lg font-bold text-white">It will unlock on {openOn}.</p>
                 </div>
            );
        }
        
        // No capsule
        return (
            <div className="mt-4">
                <button onClick={() => setIsCreating(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-white/10 text-violet-300 rounded-lg hover:bg-white/20 transition-colors">
                    <Plus size={20} /><span>Create a Time Capsule</span>
                </button>
            </div>
        );
    };

    return (
        <Card className="ui-card animate-fade-in-up animate-delay-600">
            <CardHeader icon={<Mail size={24} />} title="Message to Future You" subtitle="A little game with time." />
            {renderContent()}
        </Card>
    );
};


// --- AI Companion Widget for HomePage ---
const AICompanionWidget: React.FC<{onNavigate: (page: string) => void}> = ({ onNavigate }) => (
    <Card className="ui-card animate-fade-in-up animate-delay-700 text-center">
        <h2 className="text-xl font-bold mb-2">I’m here to listen to you, Soundous 💬</h2>
        <p className="mb-6" style={{ color: 'var(--secondary-text)'}}>Tell me how your day is going?</p>
        <button onClick={() => onNavigate('chat')} className="primary-button">
            <MessageCircle size={20} />
            <span>Open Chat</span>
        </button>
    </Card>
);

const staticGreetings = [
    "hey soundous, just a reminder that u're literally capable of more than u think.",
    "been thinking abt u lately, hope you're doing okay.",
    "remember to be kind to yourself today, soundous. you're doing your best.",
    "your energy is precious, hope you're saving some for yourself today.",
    "just wanted to say i'm proud of you for showing up today. that's a win fr."
];

// --- HomePage ---
export const HomePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [greeting, setGreeting] = useState<string>('');
    
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * staticGreetings.length);
        setGreeting(staticGreetings[randomIndex]);
    }, []);

    return (
        <div className="w-full flex flex-col gap-6 pb-24">
            <DynamicHeader />
            <div className="max-w-xl mx-auto w-full px-6 flex flex-col gap-6">
                {greeting && (
                    <Card className="ui-card animate-fade-in-up animate-delay-100">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-violet-500/10 rounded-full text-violet-300">
                               <Sparkles size={22} />
                            </div>
                            <div>
                                 <h2 className="text-lg font-bold mb-2" style={{ color: '#f6f5ff' }}>A Gentle Start</h2>
                                 <p className="leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--secondary-text)', lineHeight: 1.6 }}>{greeting}</p>
                            </div>
                        </div>
                    </Card>
                )}

                <DailyMoodCheckin />
                
                <DailyActionsWidget />

                <CreativeSparkWidget />

                <GratitudeJarWidget />
                
                <TimeCapsuleWidget />

                <AICompanionWidget onNavigate={onNavigate} />
            </div>
        </div>
    );
};


// --- ChatPage ---
interface ChatPageProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => Promise<void>;
    isLoading: boolean;
    isHistoryLoading: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({ messages, onSendMessage, isLoading, isHistoryLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        onSendMessage(inputValue);
        setInputValue('');
    };
    
    return (
        <div className="flex flex-col h-full max-w-xl mx-auto w-full">
             <main ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                  {isHistoryLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <TypingIndicator />
                        </div>
                  ) : (
                    <div className="space-y-6">
                        {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
                        {isLoading && <TypingIndicator />}
                    </div>
                  )}
            </main>
             <div className="p-4 bg-transparent shrink-0">
                <div className="flex flex-col gap-3">
                  <MessageInput inputValue={inputValue} onInputChange={(e) => setInputValue(e.target.value)} onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};

// --- AddNotePage (was JournalPage) ---
export const AddNotePage: React.FC = () => {
    const [entry, setEntry] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        if (!entry.trim() && !image) return;
        
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await saveJournalEntry(entry, image ?? undefined);
            setSuccess(true);
            setTimeout(() => {
                setEntry('');
                setImage(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setSuccess(false);
            }, 1500);

        } catch (err) {
            setError("Failed to save your note. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Page title="Add a Note">
            <Card>
                <CardHeader icon={<Feather size={24} />} title="Capture a Moment" subtitle="Write down your thoughts or attach an image." />
                <textarea
                    value={entry}
                    onChange={e => setEntry(e.target.value)}
                    placeholder="What's on your mind, Soundous? You can write anything here."
                    className="w-full h-40 p-4 rounded-xl bg-gray-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-inner my-4"
                    style={{color: 'var(--primary-text)'}}
                />
                 {image && (
                    <div className="relative my-4">
                        <img src={image} alt="Selected preview" className="rounded-lg max-h-60 w-full object-cover" />
                        <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                            aria-label="Remove image"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                />
                <button
                    onClick={handleUploadClick}
                    className="flex items-center justify-center gap-2 w-full p-3 mb-4 bg-white/10 text-violet-300 rounded-lg hover:bg-white/20 transition-colors"
                >
                    <ImagePlus size={20} />
                    <span>{image ? "Change Image" : "Add Image"}</span>
                </button>
                {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
                <PrimaryButton onClick={handleSubmit} disabled={(!entry.trim() && !image) || isLoading || success}>
                    {isLoading ? <LoaderCircle size={24} className="animate-spin" /> : success ? <CheckCircle2 size={24} /> : <Send size={24} />}
                    <span>{isLoading ? 'Saving...' : success ? 'Saved!' : 'Save Note'}</span>
                </PrimaryButton>
            </Card>
        </Page>
    );
};

// --- MemoryCard for MemoriesPage ---
const MemoryCard: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
    const [reflection, setReflection] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getReflection = async () => {
        setIsLoading(true);
        setError(null);
        setReflection(null);

        let promptContent = '[Interface: Memory Reflection]\nSoundous is looking back at a past memory.';
        if (entry.content) {
            promptContent += ` The note says: "${entry.content}"`;
        }
        if (entry.image_url) {
            promptContent += ` The memory also has an image attached.`;
        }
        promptContent += `\n\nGenerate a gentle, short, and caring reflection on this memory for her, in your usual persona.`;

        try {
            const response = await generateOneTimeResponse(promptContent);
            setReflection(response);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <p className="text-sm font-bold mb-2" style={{color: 'var(--primary-text)'}}>
                {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {entry.image_url && (
               <img src={entry.image_url} alt="Memory from note" className="rounded-lg mb-4 max-h-80 w-full object-cover" />
            )}
            {entry.content && (
                <p className="leading-relaxed whitespace-pre-wrap mb-4 break-words" style={{color: 'var(--secondary-text)'}}>{entry.content}</p>
            )}

            {!reflection && !isLoading && !error && (
                 <PrimaryButton onClick={getReflection} disabled={isLoading}>
                    <Sparkles size={20} />
                    <span>Get a gentle reflection</span>
                 </PrimaryButton>
            )}
            
            {isLoading && <LoadingCard className="h-16" />}

            {error && (
                 <div className="mt-4 p-3 bg-red-500/10 rounded-lg text-center">
                    <p className="text-red-300">{error}</p>
                </div>
            )}

            {reflection && (
                <div className="mt-4 p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-violet-500/10 rounded-full text-violet-300">
                           <Sparkles size={22} />
                        </div>
                        <div>
                             <h2 className="text-lg font-bold mb-2" style={{ color: '#f6f5ff' }}>A Gentle Reflection</h2>
                             <p className="leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--secondary-text)', lineHeight: 1.6 }}>{reflection}</p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};


// --- MemoriesPage ---
export const MemoriesPage: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchEntries = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedEntries = await getJournalEntries();
                setEntries(fetchedEntries);
            } catch (err) {
                setError("Could not load your memories. Please check your connection.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntries();
    }, []);

    return (
        <Page title="Your Memories">
             <Card>
                 <CardHeader icon={<History size={24} />} title="Your Saved Notes" subtitle="A collection of your thoughts and moments."/>
             </Card>

             {isLoading && <LoadingCard />}

             {error && <Card className="mt-6"><p className="text-center text-red-400">{error}</p></Card>}

             {!isLoading && !error && entries.length === 0 && (
                <Card className="mt-6">
                    <p className="text-center text-gray-400">You haven't saved any notes yet, Soundous. Go to the 'Add Note' page to capture your first memory.</p>
                </Card>
             )}

             {!isLoading && !error && entries.length > 0 && (
                <div className="mt-6 space-y-6">
                    {entries.map(entry => (
                         <MemoryCard key={entry.id} entry={entry} />
                    ))}
                </div>
             )}
        </Page>
    );
};


// --- SummaryPage (was InsightsPage) ---
export const SummaryPage: React.FC<{ onClearData: () => Promise<void> }> = ({ onClearData }) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    const [summaryStatus, setSummaryStatus] = useState({ canGenerate: false, daysRemaining: 0 });
    const [error, setError] = useState<string | null>(null);

    const [feedbackText, setFeedbackText] = useState('');
    const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [feedbackSuccess, setFeedbackSuccess] = useState(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const getInsight = async () => {
        setIsLoading(true);
        setError(null);
        setInsight(null);
        try {
            const weeklyPrompt = await getWeeklySummaryPrompt();
            const prompt = `[Interface: Weekly Summary]\n${weeklyPrompt}\nBased on this data, create a simple wellness summary for Soundous.`;
            const response = await generateOneTimeResponse(prompt);
            setInsight(response);
            await setSummaryGeneratedDate();
        } catch (err) {
            setInsight(handleApiError(err)); 
            setError(handleApiError(err)); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const checkStatusAndFetch = async () => {
            setIsLoading(true);
            try {
                const status = await canGenerateNewSummary();
                setSummaryStatus(status);
                if (status.canGenerate) {
                    await getInsight();
                }
            } catch (err) {
                 setError("Could not get summary status.");
                 console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        checkStatusAndFetch();
    }, []);

    const handleClearClick = async () => {
        const isConfirmed = window.confirm(
            "Are you sure you want to clear all your data, Soundous? This will erase all your notes and chat history permanently from the cloud."
        );
        if (isConfirmed) {
            setIsClearing(true);
            await onClearData();
            setIsClearing(false);
        }
    };

    const handleSendFeedback = async () => {
        if (!feedbackText.trim()) return;
        setIsFeedbackLoading(true);
        setFeedbackError(null);
        setFeedbackSuccess(false);
        try {
            const ipAddress = await getClientIpAddress();
            await saveFeedback(feedbackText, ipAddress);
            setFeedbackSuccess(true);
            setTimeout(() => {
                setIsFeedbackFormOpen(false);
                setFeedbackText('');
                setFeedbackSuccess(false);
            }, 2000);
        } catch (err) {
            setFeedbackError("Sorry, couldn't send your feedback. Please try again.");
            console.error(err);
        } finally {
            setIsFeedbackLoading(false);
        }
    };
    
    return (
        <Page title="Weekly Summary">
             {isLoading && <LoadingCard />}

             {error && <Card><p className="text-center text-red-400">{error}</p></Card>}

             {!isLoading && !error && !summaryStatus.canGenerate && (
                <Card>
                    <CardHeader icon={<Clock size={24} />} title="Patience, Gentle Soul"/>
                    <p className="text-lg leading-relaxed" style={{color: 'var(--secondary-text)'}}>
                        Your weekly summary isn't ready yet, Soundous.
                        <br />
                        There {summaryStatus.daysRemaining === 1 ? 'is' : 'are'} {summaryStatus.daysRemaining} {summaryStatus.daysRemaining === 1 ? 'day' : 'days'} left.
                        <br /><br />
                        I'll be here when it's time to look back on your week together.
                    </p>
                </Card>
             )}

             {!isLoading && !error && summaryStatus.canGenerate && insight && (
                <Card>
                    <CardHeader icon={<BrainCircuit size={24} />} title="A Look at Your Week"/>
                    <p className="text-lg leading-relaxed whitespace-pre-wrap break-words" style={{color: 'var(--secondary-text)'}}>{insight}</p>
                </Card>
             )}

             <div className="mt-12 space-y-6">
                <h2 className="text-xl font-semibold pl-2" style={{color: 'var(--primary-text)'}}>Settings</h2>
                 <Card>
                    <CardHeader icon={<Settings size={24} />} title="Manage Your Data" />
                    <p className="mb-4" style={{ color: 'var(--secondary-text)' }}>
                        Here you can manage your application data. Please be careful as these actions cannot be undone.
                    </p>
                    <button
                        onClick={handleClearClick}
                        disabled={isClearing}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                       {isClearing ? <LoaderCircle size={20} className="animate-spin" /> : <Trash2 size={20} />}
                        <span>{isClearing ? 'Clearing Data...' : 'Clear All Data'}</span>
                    </button>
                </Card>

                <Card>
                    <CardHeader icon={<Info size={24} />} title="About Your Companion" />
                     <p style={{ color: 'var(--secondary-text)' }}>
                        This is your personal space for reflection and support. I'm here to listen and help you on your journey.
                    </p>
                     <p className="mt-3" style={{ color: 'var(--secondary-text)'}}>
                        To provide the best possible experience, I learn from our conversations to better understand your thoughts and behaviors.
                    </p>
                    <div className="mt-6 border-t border-white/10 pt-4">
                        <p className="text-center text-xs mb-2" style={{ color: 'var(--secondary-text)' }}>
                            if u wanna add new features to the app lemme know ...
                        </p>
                        {isFeedbackFormOpen ? (
                            <div className="flex flex-col gap-3 mt-2 animate-fade-in-up" style={{animationDuration: '0.4s'}}>
                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="What new feature are you thinking of?"
                                    className="w-full h-24 p-2 bg-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400"
                                    disabled={isFeedbackLoading || feedbackSuccess}
                                />
                                {feedbackError && <p className="text-red-400 text-xs text-center">{feedbackError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSendFeedback}
                                        disabled={!feedbackText.trim() || isFeedbackLoading || feedbackSuccess}
                                        className="flex-1 p-2 bg-violet-500/50 hover:bg-violet-500/80 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isFeedbackLoading ? <LoaderCircle size={18} className="animate-spin" /> : feedbackSuccess ? <CheckCircle2 size={18} /> : <Mail size={18} />}
                                        <span>{isFeedbackLoading ? 'Sending...' : feedbackSuccess ? 'Sent!' : 'Submit'}</span>
                                    </button>
                                    <button onClick={() => setIsFeedbackFormOpen(false)} disabled={isFeedbackLoading} className="p-2 bg-gray-500/50 hover:bg-gray-500/80 rounded-lg">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsFeedbackFormOpen(true)}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-white/10 text-violet-300 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <Mail size={18} />
                                <span>Send Feedback</span>
                            </button>
                        )}
                    </div>
                     <p className="mt-6 text-center text-xs opacity-70" style={{ color: 'var(--secondary-text)' }}>
                        made by the ultimate chess player 😎
                    </p>
                </Card>
            </div>
        </Page>
    );
};