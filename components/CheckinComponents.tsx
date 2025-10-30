import React from 'react';
import { Send, Sparkles, HelpCircle, Wind, Leaf, Bot, User, Brain, Heart, Target } from 'lucide-react';
import type { ChatMessage } from '../types';

// --- UI Building Blocks ---

// Fix: Update Card component to accept all standard div attributes to support props like `dir`.
export const Card: React.FC<React.ComponentProps<'div'>> = ({ children, className = '', ...props }) => (
    <div className={`ui-card ${className}`} {...props}>
        {children}
    </div>
);

export const CardHeader: React.FC<{ icon: React.ReactNode, title: string, subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-violet-500/20 rounded-full text-violet-300">
            {icon}
        </div>
        <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--primary-text)' }}>{title}</h2>
            {subtitle && <p className="text-sm" style={{ color: 'var(--secondary-text)' }}>{subtitle}</p>}
        </div>
    </div>
);

export const PrimaryButton: React.FC<{ onClick: () => void, disabled?: boolean, children: React.ReactNode }> = ({ onClick, disabled = false, children }) => (
    <button onClick={onClick} disabled={disabled} className="primary-button">
        {children}
    </button>
);


// --- Specific Components ---

export const TypingIndicator: React.FC = () => (
    <div className="flex items-center justify-start gap-1.5 p-4">
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce delay-0"></div>
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce delay-300"></div>
    </div>
);

interface ChatBubbleProps {
    message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const isUser = message.sender === 'user';
    const flexDirection = isUser ? 'flex-row-reverse' : 'flex-row';
    const icon = isUser ? <User size={20} /> : <Bot size={20} />;

    let bubbleClass: string, textColor: string, iconBg: string, iconColor: string;

    if (isUser) {
        bubbleClass = 'bg-gray-700/80 self-end rounded-tr-none';
        textColor = 'text-gray-200';
        iconBg = 'bg-gray-600';
        iconColor = 'text-gray-300';
    } else { // AI
        bubbleClass = 'bg-violet-950/70 self-start rounded-tl-none';
        textColor = 'text-violet-200';
        iconBg = 'bg-violet-800';
        iconColor = 'text-violet-300';
    }

    return (
         <div className={`flex items-end gap-3 w-full ${flexDirection} animate-fade-in-up`} style={{ animationDuration: '0.4s' }}>
            <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
                {icon}
            </div>
            <div className={`w-fit max-w-sm px-5 py-3 rounded-2xl shadow-sm ${bubbleClass} ${textColor}`}>
                 {message.text.split('\n').map((line, index) => (
                    <p key={index} className="leading-relaxed break-words">{line}</p>
                 ))}
            </div>
        </div>
    );
};

interface MessageInputProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}
export const MessageInput: React.FC<MessageInputProps> = ({ inputValue, onInputChange, onSendMessage, isLoading }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      onSendMessage();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 ui-card">
      <input
        type="text"
        value={inputValue}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind, Soundous?"
        className="flex-1 bg-transparent focus:outline-none px-2"
        style={{ color: 'var(--primary-text)' }}
        disabled={isLoading}
      />
      <button
        onClick={onSendMessage}
        disabled={isLoading || !inputValue}
        className="w-11 h-11 flex items-center justify-center bg-violet-500 text-white rounded-full transition-transform duration-200 hover:scale-110 disabled:opacity-50 disabled:scale-100 flex-shrink-0"
        aria-label="Send"
      >
        {isLoading ? <Wind className="animate-spin" size={20}/> : <Send size={20} />}
      </button>
    </div>
  );
};

interface QuickActionCardProps {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    disabled: boolean;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ onClick, icon, title, description, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 w-full text-left flex flex-col justify-between h-full shadow-sm border border-white/20"
    >
        <div>
            <div className="w-8 h-8 flex items-center justify-center bg-violet-500/20 text-violet-300 rounded-full mb-2">
                {icon}
            </div>
            <h3 className="font-bold text-violet-300 text-sm">{title}</h3>
        </div>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
    </button>
);