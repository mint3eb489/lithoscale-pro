import React from 'react';
import { LayoutGrid, Calculator, BookOpen, Settings, LogOut, Sun, Moon } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dark: boolean;
  toggleDark: () => void;
  onLogout: () => void;
  isAdmin: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  dark,
  toggleDark,
  onLogout,
  isAdmin,
}) => {
  return (
    <header className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center mb-10 mt-8 lg:mt-0" id="main-navigation">
      {/* LEFT AREA: aligned with Configuration (lg:col-span-3) */}
      <div className="lg:col-span-3 flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black dark:bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl border border-white/10 shrink-0">
            <img src="/apple-touch-icon.png" className="w-full h-full object-cover" alt="LithoScale Pro Logo" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="text-3xl font-black flex items-center tracking-tighter select-none text-slate-900 dark:text-white">
              LithoScale <span className="inline-flex items-center border-[1.2px] border-amber-400 text-amber-400 rounded px-1.5 py-0.5 text-[0.45em] font-black ml-2.5 translate-y-[-2px]">Pro</span>
            </h1>
          </div>
        </div>

        {/* Small Utility Controls: Admin, Darkmode, Logout */}
        <div className="flex items-center bg-white dark:bg-[#121212] p-1 rounded-2xl border border-slate-200 dark:border-[#262626] shadow-sm shrink-0">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`p-3 rounded-xl transition-all active:scale-90 hover:scale-110 cursor-pointer ${
                activeTab === 'admin' 
                  ? 'text-blue-500 bg-slate-100 dark:bg-slate-800 shadow-sm' 
                  : 'text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
              title="Admin-Bereich"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={toggleDark}
            className="p-3 rounded-xl transition-all active:scale-90 hover:scale-110 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            title="Design wechseln"
          >
            {dark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
          
          <button
            onClick={onLogout}
            className="p-3 rounded-xl transition-all active:scale-90 hover:scale-110 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
            title="Abmelden"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* RIGHT AREA: aligned with Summary (lg:col-span-2) */}
      <div className="lg:col-span-2 w-full">
        <div className="flex bg-white dark:bg-[#121212] p-1 rounded-2xl border border-slate-200 dark:border-[#262626] shadow-sm w-full">
          <button
            onClick={() => setActiveTab('calc')}
            className={`tab-btn px-2 py-2.5 font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-xl flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'calc'
                ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-black shadow-md hover:scale-[1.03]'
                : 'text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-[#1e1e1e]/50 hover:scale-[1.03]'
            }`}
          >
            Steinrechner
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`tab-btn px-2 py-2.5 font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-xl flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-black shadow-md hover:scale-[1.03]'
                : 'text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-[#1e1e1e]/50 hover:scale-[1.03]'
            }`}
          >
            Galerie
          </button>
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`tab-btn px-2 py-2.5 font-black text-[9px] sm:text-[10px] uppercase tracking-wider rounded-xl flex-1 text-center transition-all cursor-pointer ${
              activeTab === 'kitchen'
                ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-black shadow-md hover:scale-[1.03]'
                : 'text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-[#1e1e1e]/50 hover:scale-[1.03]'
            }`}
          >
            Angebote
          </button>
        </div>
      </div>
    </header>
  );
};
