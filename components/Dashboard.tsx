
import React, { useMemo } from 'react';
import { ANALYTICS_DATA, BRANCHES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DeliveryStatus, Delivery } from '../types';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  selectedBranch: string;
  deliveries: Delivery[];
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, selectedBranch, deliveries }) => {
  const branchDeliveries = useMemo(() => {
    return deliveries.filter(d => selectedBranch === 'all' || d.branch === selectedBranch);
  }, [selectedBranch, deliveries]);

  const totalBoxes = useMemo(() => {
    return branchDeliveries.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);
  }, [branchDeliveries]);

  const driverRanking = useMemo(() => {
    const stats: Record<string, { total: number, completed: number }> = {};
    branchDeliveries.forEach(d => {
      if (!stats[d.driverName]) stats[d.driverName] = { total: 0, completed: 0 };
      stats[d.driverName].total += 1;
      if (d.status === DeliveryStatus.DELIVERED) stats[d.driverName].completed += 1;
    });
    return Object.entries(stats)
      .map(([name, data]) => ({ name, efficiency: (data.completed / data.total) * 100 }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [branchDeliveries]);

  const topPerformers = useMemo(() => driverRanking.slice(0, 4), [driverRanking]);
  
  const lowPerformers = useMemo(() => 
    driverRanking
      .filter(d => d.efficiency < 75)
      .sort((a, b) => a.efficiency - b.efficiency)
      .slice(0, 4), 
  [driverRanking]);

  const branchName = useMemo(() => {
    return BRANCHES.find(b => b.id === selectedBranch)?.name || 'Todas as Filiais';
  }, [selectedBranch]);

  const stats = [
    { label: 'Entregas Registradas', value: branchDeliveries.length.toString(), trend: '+12%', icon: 'fa-truck', color: 'bg-emerald-500' },
    { label: 'Total de Caixas', value: totalBoxes.toLocaleString(), trend: 'Volume', icon: 'fa-boxes-stacked', color: 'bg-indigo-600' },
    { label: 'Retornos Operacionais', value: branchDeliveries.filter(d => d.status === DeliveryStatus.RETURNED).length.toString(), trend: 'Sync', icon: 'fa-rotate-left', color: 'bg-slate-900' },
    { label: 'Sucesso Geral', value: branchDeliveries.length > 0 ? `${((branchDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length / branchDeliveries.length) * 100).toFixed(1)}%` : '0%', trend: 'Realtime', icon: 'fa-check-double', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-info-circle"></i>
          Delivery Manager Pro: {branchName}
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-widest`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-tight">{stat.label}</h3>
            <p className="text-2xl font-black text-slate-800 mt-1 truncate tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Fluxo Operacional Consolidado</h3>
            <button onClick={() => onNavigate('analytics')} className="text-xs text-indigo-600 font-black uppercase tracking-widest">Análise Completa</button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="deliveries" name="Entregas" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="returns" name="Devoluções" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performance */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Top Performance</h3>
            <button onClick={() => onNavigate('team')} className="text-xs text-indigo-600 font-black uppercase tracking-widest">Equipe</button>
          </div>
          <div className="flex-1 space-y-5">
            {topPerformers.length > 0 ? topPerformers.map((driver, idx) => (
              <div key={driver.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center font-black text-[10px] text-emerald-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{driver.name.split(' ')[0]}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    {driver.efficiency.toFixed(0)}%
                  </span>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 italic">Nenhum dado disponível.</p>}
          </div>
          <div className="mt-8 p-5 bg-indigo-600 rounded-[1.5rem] text-white">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Capacidade Operacional</p>
            <p className="text-3xl font-black">76%</p>
            <p className="text-[10px] text-indigo-300 font-bold uppercase">{branchName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Baixo Desempenho */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-triangle-exclamation"></i>
               </div>
               <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Baixo Desempenho (&lt;75%)</h3>
            </div>
          </div>
          <div className="space-y-4">
            {lowPerformers.length > 0 ? lowPerformers.map((driver) => (
              <div key={driver.name} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
                    <i className="fas fa-user-xmark"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{driver.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Requer Atenção</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-rose-600">
                    {driver.efficiency.toFixed(0)}%
                  </span>
                  <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-rose-500" style={{width: `${driver.efficiency}%`}}></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center flex flex-col items-center opacity-40">
                <i className="fas fa-shield-check text-emerald-500 text-3xl mb-2"></i>
                <p className="text-xs font-bold text-slate-500 uppercase">Todos os motoristas operando acima da meta!</p>
              </div>
            )}
          </div>
        </div>

        {/* Ocorrências Críticas (Com quantidade de caixas) */}
        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl text-white">
          <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3">
             <i className="fas fa-rotate-left text-rose-500"></i>
             Ocorrências Críticas
          </h3>
          <div className="space-y-4">
             {branchDeliveries.filter(d => d.status === DeliveryStatus.RETURNED).slice(0, 4).map(ret => (
               <div key={ret.id} className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-tighter text-indigo-400">{ret.customerId}</p>
                    <p className="text-sm font-bold truncate pr-4">{ret.customerName}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase mt-0.5">{ret.returnReason || 'Motivo N/A'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-sm font-black text-rose-500 px-3 py-1 bg-rose-500/10 rounded-xl border border-rose-500/20">
                      {ret.boxQuantity} cx
                    </span>
                    <span className="text-[8px] font-black text-slate-500 uppercase mt-1 tracking-widest">Volume Retornado</span>
                  </div>
               </div>
             ))}
             {branchDeliveries.filter(d => d.status === DeliveryStatus.RETURNED).length === 0 && (
               <p className="text-sm text-slate-500 italic py-6">Sem ocorrências registradas no período.</p>
             )}
          </div>
          <button onClick={() => onNavigate('returns')} className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-700">
             Ver Central de Devoluções
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
