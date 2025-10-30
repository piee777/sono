import React from 'react';
import { Home, MessageSquare, PlusSquare, History, BarChart2 } from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick} 
    className={`relative flex flex-col items-center justify-center w-16 h-16 text-center transition-all duration-300 ease-in-out group focus:outline-none rounded-2xl
               ${isActive ? 'scale-105 bg-white/10' : ''}`}
  >
    <div className={`transition-all duration-300 transform ${isActive ? 'text-[var(--active-icon)]' : 'text-[var(--inactive-icon)] group-hover:text-[var(--active-icon)]'}`}>
      {icon}
    </div>
    <span className={`text-xs font-semibold transition-colors duration-300 ${isActive ? 'text-[var(--active-icon)]' : 'text-[var(--inactive-icon)] group-hover:text-[var(--active-icon)]'}`}>{label}</span>
  </button>
);

interface NavigationProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: <Home size={24} /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={24} /> },
  { id: 'add-note', label: 'Add Note', icon: <PlusSquare size={24} /> },
  { id: 'memories', label: 'Memories', icon: <History size={24} /> },
  { id: 'summary', label: 'Summary', icon: <BarChart2 size={24} /> },
];

const Navigation: React.FC<NavigationProps> = ({ activePage, onNavigate }) => {
  return (
    <footer className="sticky bottom-0 left-0 right-0 z-10 p-3">
      <nav className="max-w-xl mx-auto flex justify-around items-center py-[10px] px-2 bg-[rgba(255,255,255,0.05)] backdrop-blur-3xl rounded-[28px] shadow-[0_-4px_25px_rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.07)]">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>
    </footer>
  );
};

export default Navigation;