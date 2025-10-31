import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import { HomePage, ChatPage, AddNotePage, MemoriesPage, SummaryPage } from './pages';
import type { ChatMessage } from './types';
import { getChatResponse } from './services/geminiService';
import { deleteAllUserData, getChatMessages, saveChatMessage } from './utils/journal';
import { handleApiError } from './utils/error';
import { supabase } from './services/supabaseClient';
import { AlertTriangle } from 'lucide-react';

const SupabaseSetupScreen: React.FC = () => (
    <div className="app-container h-screen w-full flex flex-col app-bg items-center justify-center p-8 text-center">
        <div className="ui-card max-w-md w-full">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-red-500/20 rounded-full text-red-300">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--primary-text)' }}>Backend Not Configured</h2>
                </div>
            </div>
            <p style={{ color: 'var(--secondary-text)' }}>
                This application requires a Supabase backend to store and manage your data securely.
            </p>
            <p className="mt-4" style={{ color: 'var(--secondary-text)' }}>
                Please add your <code className="bg-black/20 px-1 py-0.5 rounded text-violet-300">SUPABASE_URL</code> and <code className="bg-black/20 px-1 py-0.5 rounded text-violet-300">SUPABASE_KEY</code> to your environment variables to continue.
            </p>
            <div className="mt-6 p-3 bg-black/20 rounded-lg text-left text-sm">
                <p className="font-mono text-gray-400">
                    You can get these from your Supabase project settings. Once added, please refresh the application.
                </p>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
  if (!supabase) {
    return <SupabaseSetupScreen />;
  }

  const [activePage, setActivePage] = useState('home');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
        try {
            const history = await getChatMessages();
            if (history.length > 0) {
                setMessages(history);
            } else {
                // No history, create and save the initial message
                const initialMessageText = "hey soundous 👋 how u doin today?";
                const initialMessage: ChatMessage = { id: `ai-init-${Date.now()}`, sender: 'ai', text: initialMessageText };
                setMessages([initialMessage]);
                await saveChatMessage({ sender: 'ai', text: initialMessageText });
            }
        } catch (error) {
            console.error("Failed to fetch chat history:", error);
            const errorMessage = "I'm having trouble remembering our past chats right now. Let's start fresh for now.";
            setMessages([{ id: `err-${Date.now()}`, sender: 'ai', text: errorMessage, state: 'error' }]);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    fetchHistory();
  }, []);

  const sendMessage = async (text: string) => {
    if (isChatLoading || !text.trim()) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text };
    const currentMessages = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      await saveChatMessage({ sender: 'user', text });

      const aiResponseText = await getChatResponse(currentMessages, text);
      const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);
      await saveChatMessage({ sender: 'ai', text: aiResponseText });

    } catch (error) {
      const errorMessage = handleApiError(error);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, sender: 'ai', text: errorMessage, state: 'error' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearData = async () => {
      try {
        await deleteAllUserData();
        
        // Reset chat state
        const initialMessageText = "hey soundous 👋 how u doin today?";
        const initialMessage: ChatMessage = { id: `ai-init-${Date.now()}`, sender: 'ai', text: initialMessageText };
        setMessages([initialMessage]);
        await saveChatMessage({ sender: 'ai', text: initialMessageText });
        
        alert("Your data has been cleared from the cloud, Soundous. Starting fresh."); 
        setActivePage('home');
      } catch (error) {
        console.error("Failed to clear data:", error);
        alert("Sorry, there was an error trying to clear your data. Please try again.");
      }
  };


  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} />;
      case 'chat':
        return <ChatPage messages={messages} onSendMessage={sendMessage} isLoading={isChatLoading} isHistoryLoading={isHistoryLoading} />;
      case 'add-note':
        return <AddNotePage />;
      case 'memories':
        return <MemoriesPage />;
      case 'summary':
        return <SummaryPage onClearData={handleClearData} />;
      default:
        return <HomePage onNavigate={setActivePage} />;
    }
  };
  
  return (
    <div className="app-container h-screen w-full flex flex-col app-bg">
       <div className={`flex-1 flex flex-col ${activePage === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            {renderPage()}
        </div>
      <Navigation activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default App;