
import React from 'react';
import { User, Branch, DateFilterRange } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: any) => void;
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  filterRange: DateFilterRange;
  onFilterRangeChange: (range: DateFilterRange) => void;
  customDate: string;
  onCustomDateChange: (date: string) => void;
  branches: Branch[];
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, user, activeTab, onTabChange, selectedBranch, onBranchChange,
  filterRange, onFilterRangeChange, customDate, onCustomDateChange, branches, onLogout
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'deliveries', label: 'Entregas', icon: 'fa-truck' },
    { id: 'critical-clients', label: 'Clientes Críticos', icon: 'fa-user-shield' },
    { id: 'team', label: 'Equipe', icon: 'fa-users' },
    { id: 'returns', label: 'Devoluções', icon: 'fa-rotate-left' },
    { id: 'analytics', label: 'Relatórios', icon: 'fa-chart-line' },
    { id: 'ai', label: 'IA Hub', icon: 'fa-robot' },
    { id: 'settings', label: 'Configurações', icon: 'fa-cog' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden animate-in fade-in duration-500">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <i className="fas fa-box-open text-xl"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">SwiftLog <span className="text-indigo-400">Pro</span></span>
        </div>
        <nav className="flex-1 mt-6 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button onClick={() => onTabChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <i className={`fas ${item.icon} w-5`}></i>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-2xl border border-slate-700/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 overflow-hidden shadow-sm"><img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-100">{user.name.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-slate-50">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{menuItems.find(i => i.id === activeTab)?.label}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <select value={selectedBranch} onChange={(e) => onBranchChange(e.target.value)} className="bg-transparent text-[10px] font-black text-slate-700 outline-none cursor-pointer uppercase">
                  <option value="all">Todas as Filiais</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <select value={filterRange} onChange={(e) => onFilterRangeChange(e.target.value as DateFilterRange)} className="bg-transparent text-[10px] font-black text-slate-700 outline-none cursor-pointer uppercase">
                  <option value="today">Hoje</option>
                  <option value="weekly">Semana</option>
                  <option value="monthly">Mensal</option>
                  <option value="all">Tudo</option>
                  <option value="custom">Personalizado</option>
                </select>
                {filterRange === 'custom' && (
                  <input type="date" value={customDate} onChange={(e) => onCustomDateChange(e.target.value)} className="bg-transparent text-[10px] font-black text-indigo-600 outline-none border-l border-slate-300 pl-2" />
                )}
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs font-black text-slate-500 hover:text-rose-600 transition-colors uppercase tracking-widest"><i className="fas fa-sign-out-alt mr-2"></i>Sair</button>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
