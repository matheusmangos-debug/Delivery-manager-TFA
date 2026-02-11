
import React, { useMemo } from 'react';
import { Delivery, DeliveryStatus, ClientMapping } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ReturnPortalProps {
  selectedBranch: string;
  deliveries: Delivery[];
  clientMappings: ClientMapping[];
}

const ReturnPortal: React.FC<ReturnPortalProps> = ({ selectedBranch, deliveries, clientMappings }) => {
  const filteredReturns = useMemo(() => {
    return deliveries.filter(d => 
      d.status === DeliveryStatus.RETURNED && (selectedBranch === 'all' || d.branch === selectedBranch)
    );
  }, [deliveries, selectedBranch]);

  // Analytics de Motivos
  const reasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReturns.forEach(r => {
      const reason = r.returnReason || 'Outros';
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredReturns]);

  // Analytics de Recorrência (Clientes com > 1 retorno)
  const recurrenceData = useMemo(() => {
    const clientCounts: Record<string, {name: string, count: number}> = {};
    filteredReturns.forEach(r => {
      if (!clientCounts[r.customerId]) clientCounts[r.customerId] = { name: r.customerName, count: 0 };
      clientCounts[r.customerId].count += 1;
    });
    return Object.values(clientCounts)
      .filter(c => c.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredReturns]);

  const COLORS = ['#4f46e5', '#f43f5e', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Analytics de Retornos</h2>
          <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Central de Ocorrências & PDF</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-xl transition-all">
          <i className="fas fa-file-pdf text-lg"></i> Gerar Relatório de Auditoria (PDF)
        </button>
      </div>

      {/* Analytics Visual (Exibido no PDF para dar um ar profissional de BI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm print:shadow-none print:border print:rounded-3xl">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-indigo-600 pl-4 print:mb-4">Pareto de Motivos</h3>
          <div className="h-[250px] print:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={reasonData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={85} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                  isAnimationActive={false} // Desativa animação para o PDF sair limpo
                >
                  {reasonData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm print:shadow-none print:border print:rounded-3xl">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-rose-500 pl-4 print:mb-4">Recorrência por Cliente</h3>
          <div className="h-[250px] print:h-[200px]">
            {recurrenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recurrenceData} layout="vertical" margin={{ left: 40 }} isAnimationActive={false}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="count" name="Retornos" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={15} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase italic opacity-40">Sem recorrências críticas no período</div>
            )}
          </div>
        </div>
      </div>

      {/* Relatório Detalhado (Otimizado para Print) */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-8 print:p-0 print:border-0 print:shadow-none">
        {/* Cabeçalho do PDF - Visível apenas na Impressão */}
        <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-8">
          <div className="flex justify-between items-start mb-10">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">S</div>
                <div>
                  <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">Relatório de Devoluções</h1>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Auditoria Operacional SwiftLog Pro</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400">Emissão do Documento</p>
                <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg">
                  Unidade: {selectedBranch === 'all' ? 'Consolidado Geral' : selectedBranch.toUpperCase()}
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
             <div className="p-4 bg-slate-50 border rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Ocorrências</p>
                <p className="text-xl font-black text-slate-900">{filteredReturns.length} <span className="text-[10px] text-slate-400">Tickets</span></p>
             </div>
             <div className="p-4 bg-slate-50 border rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume Total (CX)</p>
                <p className="text-xl font-black text-slate-900">{filteredReturns.reduce((acc, curr) => acc + curr.boxQuantity, 0)} <span className="text-[10px] text-slate-400">Unid.</span></p>
             </div>
             <div className="p-4 bg-slate-50 border rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Índice de Retorno</p>
                <p className="text-xl font-black text-rose-600">3.4% <i className="fas fa-caret-up text-xs"></i></p>
             </div>
             <div className="p-4 bg-slate-50 border rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Recuperação</p>
                <p className="text-xl font-black text-emerald-600">88.2%</p>
             </div>
          </div>
        </div>

        <table className="w-full text-left print:text-[11px]">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest print:bg-slate-100 print:text-slate-900">
            <tr>
              <th className="px-6 py-4 print:px-4">Data</th>
              <th className="px-6 py-4 print:px-4">Matrícula</th>
              <th className="px-6 py-4 print:px-4">Cliente / Vendedor</th>
              <th className="px-6 py-4 print:px-4">Motivo Detalhado</th>
              <th className="px-6 py-4 text-center print:px-4">Volumes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReturns.map(r => {
              const mapping = clientMappings.find(m => m.customerId === r.customerId);
              return (
                <tr key={r.id} className="text-sm hover:bg-slate-50/50 print:break-inside-avoid">
                  <td className="px-6 py-5 font-bold text-slate-500 text-xs print:px-4">{r.date}</td>
                  <td className="px-6 py-5 font-black text-indigo-600 print:px-4">{r.customerId}</td>
                  <td className="px-6 py-5 print:px-4">
                    <p className="font-black uppercase text-xs text-slate-800">{r.customerName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Vendedor: {mapping ? mapping.sellerName : 'Não Informado'}</p>
                  </td>
                  <td className="px-6 py-5 print:px-4">
                    <p className="font-bold text-rose-600 uppercase text-[10px]">{r.returnReason}</p>
                    {r.returnNotes && <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight">"{r.returnNotes}"</p>}
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-800 print:px-4">{r.boxQuantity} CX</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredReturns.length === 0 && (
          <div className="py-24 text-center">
             <i className="fas fa-check-circle text-4xl text-emerald-100 mb-4 block"></i>
             <p className="text-sm font-black uppercase text-slate-400 tracking-widest italic">Nenhuma devolução pendente para auditoria</p>
          </div>
        )}

        {/* Rodapé e Campo de Assinaturas - Visível apenas na Impressão */}
        <div className="hidden print:grid grid-cols-2 gap-20 mt-20 pt-10 border-t-2 border-slate-100">
           <div className="text-center">
              <div className="border-b border-slate-900 w-full mb-2"></div>
              <p className="text-[9px] font-black uppercase text-slate-400">Responsável pela Auditoria</p>
              <p className="text-[10px] font-bold text-slate-900 uppercase">Supervisor de Logística</p>
           </div>
           <div className="text-center">
              <div className="border-b border-slate-900 w-full mb-2"></div>
              <p className="text-[9px] font-black uppercase text-slate-400">Conferência de Carga</p>
              <p className="text-[10px] font-bold text-slate-900 uppercase">Setor de Recebimento</p>
           </div>
        </div>
        
        <div className="hidden print:block text-center mt-12 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
           SwiftLog Pro Intelligence - Documento Controlado Internamente
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body { background: white !important; font-family: sans-serif; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          aside { display: none !important; }
          main { margin: 0 !important; width: 100% !important; padding: 0 !important; background: white !important; }
          .bg-slate-50 { background: white !important; }
          .rounded-[2rem] { border-radius: 0 !important; }
          thead { background-color: #f8fafc !important; }
          tr:nth-child(even) { background-color: #fcfcfc !important; }
        }
      `}</style>
    </div>
  );
};

export default ReturnPortal;
