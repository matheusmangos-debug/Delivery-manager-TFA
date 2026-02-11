
import React, { useMemo } from 'react';
import { ANALYTICS_DATA, BRANCHES } from '../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { DeliveryStatus, Delivery } from '../types';

interface AnalyticsViewProps {
  selectedBranch: string;
  deliveries: Delivery[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ selectedBranch, deliveries }) => {
  const branchDeliveries = useMemo(() => {
    return deliveries.filter(d => selectedBranch === 'all' || d.branch === selectedBranch);
  }, [selectedBranch, deliveries]);

  // Estatísticas Globais
  const stats = useMemo(() => {
    const totalDeliveries = branchDeliveries.length;
    const deliveredItems = branchDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED);
    const totalBoxes = branchDeliveries.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);
    const deliveredBoxes = deliveredItems.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);

    return {
      totalCustomers: totalDeliveries,
      deliveredCustomers: deliveredItems.length,
      efficiencyPercent: totalDeliveries > 0 ? (deliveredItems.length / totalDeliveries) * 100 : 0,
      totalBoxes,
      deliveredBoxes,
      effectivenessPercent: totalBoxes > 0 ? (deliveredBoxes / totalBoxes) * 100 : 0,
    };
  }, [branchDeliveries]);

  // Dados Diários Sintetizados
  const dailyPerformanceData = useMemo(() => {
    return ANALYTICS_DATA.map((item, idx) => {
      // Gerando variações baseadas nos mocks reais para simular tendência diária
      const efficiency = 85 + Math.random() * 12;
      const effectiveness = 88 + Math.random() * 10;
      const returnedCustomers = Math.floor(Math.random() * 8) + 2;
      const returnedBoxes = Math.floor(returnedCustomers * (1.5 + Math.random()));

      return {
        ...item,
        efficiency: parseFloat(efficiency.toFixed(1)),
        effectiveness: parseFloat(effectiveness.toFixed(1)),
        returnedCustomers,
        returnedBoxes,
        boxes: Math.round(item.deliveries * 2.2)
      };
    });
  }, []);

  const branchName = useMemo(() => {
    return BRANCHES.find(b => b.id === selectedBranch)?.name || 'Consolidado Geral';
  }, [selectedBranch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Dashboards de Auditoria Operacional</h2>
          <p className="text-2xl font-black text-slate-800">{branchName}</p>
        </div>
      </div>

      {/* KPIs de Eficiência e Efetividade Diária */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Eficiência (Clientes)</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-800">{stats.deliveredCustomers}</p>
            <p className="text-sm text-slate-400 mb-1">/ {stats.totalCustomers} Entregues</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600" style={{ width: `${stats.efficiencyPercent}%` }}></div></div>
            <span className="text-[10px] font-black text-indigo-600">{stats.efficiencyPercent.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Efetividade (Caixas)</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-800">{stats.deliveredBoxes.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mb-1">/ {stats.totalBoxes.toLocaleString()} CX</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${stats.effectivenessPercent}%` }}></div></div>
            <span className="text-[10px] font-black text-emerald-600">{stats.effectivenessPercent.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">SLA Médio Unidade</p>
          <p className="text-3xl font-black">97.4%</p>
          <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Performance dentro da meta global</div>
        </div>
      </div>

      {/* Linhas de Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-indigo-600 pl-4">Tendência de Clientes</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="deliveries" name="Clientes" stroke="#4f46e5" fill="#4f46e510" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-emerald-500 pl-4">Tendência de Caixas (Volume)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="boxes" name="Caixas" stroke="#10b981" fill="#10b98110" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráficos de Eficiência e Efetividade Diária (Barras) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-indigo-400 pl-4">Eficiência Diária (%)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={[60, 100]} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="efficiency" name="Eficiência %" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-emerald-400 pl-4">Efetividade Diária (%)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={[60, 100]} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="effectiveness" name="Efetividade %" fill="#34d399" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gráfico de Retornos por Dia */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-rose-500 pl-4">Ocorrências de Retorno por Dia</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[9px] font-black uppercase text-slate-400">Clientes</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-800"></div><span className="text-[9px] font-black uppercase text-slate-400">Caixas</span></div>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="returnedCustomers" name="Qtd. Clientes" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="returnedBoxes" name="Qtd. Caixas" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsView;
