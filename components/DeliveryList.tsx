
import React, { useState, useMemo } from 'react';
import { Delivery, DeliveryStatus, ReturnReason, CustomerReputation, ClientMapping } from '../types';
import { GeminiService } from '../services/geminiService';

interface DeliveryListProps {
  selectedBranch: string;
  deliveries: Delivery[];
  onUpdate: (id: string, updates: Partial<Delivery>) => void;
  onBulkUpdate: (ids: string[], status: DeliveryStatus) => void;
  onAddDeliveries: (deliveries: any[]) => void;
  onDeleteDeliveries: (ids: string[]) => void;
  returnReasons: ReturnReason[];
  customerHistory: CustomerReputation[];
  clientMappings: ClientMapping[];
}

const DeliveryList: React.FC<DeliveryListProps> = ({ 
  selectedBranch, deliveries, onUpdate, onBulkUpdate, onAddDeliveries, onDeleteDeliveries, 
  returnReasons, customerHistory, clientMappings
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'bulk' | 'individual' | 'ai'>('bulk');
  const [importText, setImportText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const [returnModalTarget, setReturnModalTarget] = useState<Delivery | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const isCritical = customerHistory.some(h => h.customerId === d.customerId);
      const matchesBranch = selectedBranch === 'all' || d.branch === selectedBranch;
      const matchesStatus = filter === 'all' || d.status === filter;
      const matchesCritical = !onlyCritical || isCritical;
      
      const searchTerm = search.toLowerCase();
      const matchesSearch = search === '' || 
        d.customerName.toLowerCase().includes(searchTerm) || 
        d.customerId.toLowerCase().includes(searchTerm);
        
      return matchesBranch && matchesStatus && matchesSearch && matchesCritical;
    });
  }, [deliveries, selectedBranch, filter, search, onlyCritical, customerHistory]);

  const handleManualImport = () => {
    if (!importText.trim()) return;
    
    // Suporte para Separador Ponto e Vírgula (CSV) ou Tabulação (Excel)
    const lines = importText.split('\n');
    const today = new Date().toISOString().split('T')[0];
    
    const extractedData = lines.map(line => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(';');
      if (parts.length < 2) return null;
      
      return {
        customerId: parts[0]?.trim() || `MAT-${Math.floor(Math.random()*1000)}`,
        customerName: parts[1]?.trim() || 'Cliente Novo',
        address: parts[2]?.trim() || 'Endereço não informado',
        driverName: parts[3]?.trim() || 'A definir',
        boxQuantity: parseInt(parts[4]) || 1,
        status: DeliveryStatus.PENDING,
        branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch,
        date: today,
        trackingCode: `TR-${Math.floor(1000 + Math.random() * 9000)}`
      };
    }).filter(Boolean);

    if (extractedData.length > 0) {
      onAddDeliveries(extractedData);
      setImportText('');
      setShowImportModal(false);
    }
  };

  const handleAiImport = async () => {
    if (!importText.trim()) return;
    setIsAiProcessing(true);
    try {
      const data = await GeminiService.parseSpreadsheetText(importText);
      onAddDeliveries(data);
      setShowImportModal(false);
      setImportText('');
    } catch (err) {
      alert("Erro ao processar com IA.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const saveReturn = () => {
    if (!returnModalTarget) return;
    onUpdate(returnModalTarget.id, { 
      status: DeliveryStatus.RETURNED, 
      returnReason, 
      returnNotes 
    });
    setReturnModalTarget(null);
    setReturnReason('');
    setReturnNotes('');
  };

  const notifySeller = (delivery: Delivery) => {
    const mapping = clientMappings.find(m => m.customerId === delivery.customerId);
    if (!mapping) {
      alert("Nenhum vendedor vinculado a este cliente.");
      return;
    }
    const msg = `⚠️ *ALERTA DE RETORNO* ⚠️\n*Cliente:* ${delivery.customerName}\n*Volumes:* ${delivery.boxQuantity}\n*Motivo:* ${delivery.returnReason}\n\n_SwiftLog Intelligence_`;
    window.open(`https://wa.me/${mapping.sellerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
      
      {/* Barra de Ações em Massa (Floating) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-slate-700">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 pr-6 border-r border-slate-700">{selectedIds.length} Itens</span>
            <div className="flex gap-2">
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.DELIVERED); setSelectedIds([]); }} className="px-4 py-2 bg-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700">Entregue</button>
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.IN_TRANSIT); setSelectedIds([]); }} className="px-4 py-2 bg-amber-600 rounded-xl text-[10px] font-black uppercase hover:bg-amber-700">Em Rota</button>
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.RETURNED); setSelectedIds([]); }} className="px-4 py-2 bg-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-700">Retornado</button>
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.D_PLUS_1); setSelectedIds([]); }} className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700">D+1</button>
              <button onClick={() => { if(window.confirm("Excluir?")) { onDeleteDeliveries(selectedIds); setSelectedIds([]); } }} className="px-4 py-2 bg-slate-700 rounded-xl text-[10px] font-black uppercase">Excluir</button>
            </div>
            <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white p-2 transition-colors"><i className="fas fa-times"></i></button>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Buscar por matrícula ou cliente..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['all', DeliveryStatus.PENDING, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED, DeliveryStatus.D_PLUS_1].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{s === 'all' ? 'Todos' : s}</button>
            ))}
          </div>
          <button onClick={() => setOnlyCritical(!onlyCritical)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center gap-2 ${onlyCritical ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>
            <i className="fas fa-user-shield"></i> Clientes Críticos
          </button>
        </div>
        <button onClick={() => setShowImportModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all">
          <i className="fas fa-file-import"></i> Importar Movimento
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === filteredDeliveries.length ? [] : filteredDeliveries.map(d => d.id))} /></th>
              <th className="px-6 py-4">Matrícula</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Motorista</th>
              <th className="px-6 py-4 text-center">Volumes</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeliveries.map((delivery) => {
              const reputation = customerHistory.find(h => h.customerId === delivery.customerId);
              return (
                <tr key={delivery.id} className={`hover:bg-slate-50 transition-colors ${reputation ? 'border-l-4 border-rose-500 bg-rose-50/10' : ''}`}>
                  <td className="px-6 py-4 w-10"><input type="checkbox" checked={selectedIds.includes(delivery.id)} onChange={() => setSelectedIds(prev => prev.includes(delivery.id) ? prev.filter(i => i !== delivery.id) : [...prev, delivery.id])} /></td>
                  <td className="px-6 py-4 text-xs font-black text-indigo-600 uppercase">{delivery.customerId}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-800 uppercase">{delivery.customerName}</p>
                    {reputation && <span className="text-[8px] font-black text-rose-500 uppercase flex items-center gap-1"><i className="fas fa-triangle-exclamation"></i> Cliente Crítico</span>}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">{delivery.driverName || '---'}</td>
                  <td className="px-6 py-4 text-xs font-black text-center">{delivery.boxQuantity} cx</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                      delivery.status === DeliveryStatus.DELIVERED ? 'bg-emerald-50 text-emerald-600' : 
                      delivery.status === DeliveryStatus.RETURNED ? 'bg-rose-50 text-rose-600' :
                      delivery.status === DeliveryStatus.D_PLUS_1 ? 'bg-indigo-50 text-indigo-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>{delivery.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setReturnModalTarget(delivery)} className="text-slate-400 hover:text-rose-600 p-2 transition-colors"><i className="fas fa-rotate-left"></i></button>
                      {delivery.status === DeliveryStatus.RETURNED && (
                        <button onClick={() => notifySeller(delivery)} className="text-emerald-500 hover:scale-110 p-2 transition-transform"><i className="fab fa-whatsapp text-lg"></i></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE IMPORTAÇÃO */}
      {showImportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex gap-6">
                <button onClick={() => setImportMode('bulk')} className={`text-[10px] font-black uppercase pb-2 border-b-2 transition-all ${importMode === 'bulk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Importação Estruturada</button>
                <button onClick={() => setImportMode('ai')} className={`text-[10px] font-black uppercase pb-2 border-b-2 transition-all ${importMode === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Inteligência Artificial</button>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
            </div>

            {importMode === 'bulk' && (
              <div className="space-y-4">
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-2">Instruções de Formato:</p>
                  <p className="text-[9px] font-bold text-indigo-600 leading-relaxed uppercase">Copie do Excel ou TXT seguindo esta ordem:<br/>MATRÍCULA ; NOME CLIENTE ; ENDEREÇO ; MOTORISTA ; CAIXAS</p>
                </div>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none focus:ring-4 focus:ring-indigo-500/10 outline-none" placeholder="10025 ; ANA SILVA ; RUA EXEMPLO ; MARCIO ; 5" />
                <button onClick={handleManualImport} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Sincronizar Lote no Banco</button>
              </div>
            )}

            {importMode === 'ai' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-200"><i className="fas fa-robot"></i></div>
                  <p className="text-xs font-bold text-emerald-800 leading-relaxed uppercase">O Smart AI identifica automaticamente matrículas e volumes de qualquer texto bagunçado ou PDF digitalizado.</p>
                </div>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none" placeholder="Cole o texto aqui..." />
                <button onClick={handleAiImport} disabled={isAiProcessing} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                  {isAiProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
                  Extrair com Inteligência Artificial
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE RETORNO */}
      {returnModalTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Registrar Devolução</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Cliente</p>
                <p className="text-sm font-black text-slate-800 uppercase">{returnModalTarget.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Carga</p>
                <p className="text-xs font-black text-indigo-600 uppercase">{returnModalTarget.trackingCode}</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Motivo Principal</label>
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase cursor-pointer">
                <option value="">Selecione o motivo oficial...</option>
                {returnReasons.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
              </select>
            </div>
            <textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-32 resize-none" placeholder="Observações adicionais para auditoria..." />
            <div className="flex gap-4 pt-2">
              <button onClick={() => setReturnModalTarget(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
              <button onClick={saveReturn} disabled={!returnReason} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl disabled:opacity-50">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryList;
