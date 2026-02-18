
import React, { useState, useMemo, useEffect } from 'react';
import { Delivery, DeliveryStatus, ReturnReason, CustomerReputation, ClientMapping } from '../types';
import { GeminiService } from '../services/geminiService';

interface DeliveryListProps {
  selectedBranch: string;
  deliveries: Delivery[];
  onUpdate: (id: string, updates: Partial<Delivery>) => void;
  onBulkUpdate: (ids: string[], status: DeliveryStatus) => void;
  onBulkUpdateDate?: (ids: string[], date: string) => void;
  onAddDeliveries: (deliveries: any[]) => void;
  onDeleteDeliveries: (ids: string[]) => void;
  returnReasons: ReturnReason[];
  customerHistory: CustomerReputation[];
  clientMappings: ClientMapping[];
}

const DeliveryList: React.FC<DeliveryListProps> = ({ 
  selectedBranch, deliveries, onUpdate, onBulkUpdate, onBulkUpdateDate, onAddDeliveries, onDeleteDeliveries, 
  returnReasons, customerHistory, clientMappings
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'bulk' | 'individual' | 'ai' | 'pdf'>('ai');
  const [importText, setImportText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [editTarget, setEditTarget] = useState<Delivery | null>(null);
  const [individualForm, setIndividualForm] = useState<Partial<Delivery>>({
    customerId: '', customerName: '', driverName: '', boxQuantity: 1
  });
  
  const [returnModalTarget, setReturnModalTarget] = useState<Delivery | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Validação em tempo real para o Import Bulk
  const bulkPreview = useMemo(() => {
    if (importMode !== 'bulk' || !importText.trim()) return [];
    const lines = importText.split('\n').filter(l => l.trim());
    return lines.map(line => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(';');
      const customerId = parts[0]?.trim() || '';
      const customerName = parts[1]?.trim() || '';
      const driverName = parts[2]?.trim() || '';
      const boxQuantity = parseInt(parts[3]) || 0;
      
      const isValid = customerId && customerName && boxQuantity > 0;
      return { customerId, customerName, driverName, boxQuantity, isValid };
    });
  }, [importText, importMode]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const isCritical = customerHistory.some(h => h.customerId === d.customerId);
      const matchesBranch = selectedBranch === 'all' || d.branch === selectedBranch;
      const matchesStatus = filter === 'all' || d.status === filter;
      const matchesCritical = !onlyCritical || isCritical;
      
      const searchTerm = search.toLowerCase();
      const matchesSearch = search === '' || 
        d.customerName.toLowerCase().includes(searchTerm) || 
        d.customerId.toLowerCase().includes(searchTerm) ||
        d.driverName.toLowerCase().includes(searchTerm);
        
      return matchesBranch && matchesStatus && matchesSearch && matchesCritical;
    });
  }, [deliveries, selectedBranch, filter, search, onlyCritical, customerHistory]);

  const handleAiImport = async () => {
    if (!importText.trim()) return;
    setIsAiProcessing(true);
    try {
      const extractedData = await GeminiService.parseSpreadsheetText(importText);
      processExtractedData(extractedData);
    } catch (err) {
      alert("Erro ao processar com IA.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const processExtractedData = (data: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    if (data && data.length > 0) {
      const formatted = data.map((item: any) => ({
        ...item,
        customerId: item.customerId || `MAT-${Math.floor(Math.random() * 10000)}`,
        customerName: item.customerName || 'Cliente Importado',
        status: DeliveryStatus.PENDING,
        branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch,
        date: today,
        boxQuantity: parseInt(item.boxQuantity || 1),
        address: item.address || 'Endereço não identificado'
      }));
      onAddDeliveries(formatted);
      setShowImportModal(false);
      setImportText('');
    }
  };

  const handleManualImport = () => {
    const today = new Date().toISOString().split('T')[0];
    if (importMode === 'bulk') {
      const validItems = bulkPreview.filter(p => p.isValid).map(p => ({
        customerId: p.customerId,
        customerName: p.customerName,
        driverName: p.driverName,
        boxQuantity: p.boxQuantity,
        date: today,
        status: DeliveryStatus.PENDING,
        trackingCode: `MN-${Math.floor(1000 + Math.random() * 9000)}`,
        address: 'Endereço Manual',
        branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch
      }));
      onAddDeliveries(validItems);
    } else {
      if (!individualForm.customerId || !individualForm.customerName) return;
      onAddDeliveries([{
        ...individualForm,
        status: DeliveryStatus.PENDING,
        date: today,
        trackingCode: `MN-${Math.floor(1000 + Math.random() * 9000)}`,
        address: individualForm.address || 'Endereço Manual',
        branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch
      }]);
    }
    setShowImportModal(false);
    setImportText('');
    setIndividualForm({ customerId: '', customerName: '', driverName: '', boxQuantity: 1 });
  };

  const saveReturn = () => {
    if (!returnModalTarget || !returnReason) return;
    onUpdate(returnModalTarget.id, { status: DeliveryStatus.RETURNED, returnReason, returnNotes });
    setReturnModalTarget(null); setReturnReason(''); setReturnNotes('');
  };

  const notifySeller = (delivery: Delivery) => {
    const mapping = clientMappings.find(m => m.customerId === delivery.customerId);
    if (!mapping || !mapping.sellerPhone) {
      alert("Nenhum vendedor vinculado a este cliente nas configurações.");
      return;
    }
    const message = `🚨 *ALERTA DE RETORNO - ${delivery.customerName}*\n` +
                    `*Matrícula:* ${delivery.customerId}\n` +
                    `*Volumes:* ${delivery.boxQuantity} CX\n` +
                    `*Motivo:* ${delivery.returnReason}\n` +
                    `*Obs:* ${delivery.returnNotes || 'N/A'}\n\n` +
                    `_Verifique com o cliente para reentrega._`;
    window.open(`https://wa.me/${mapping.sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
      {/* Barra de Ações em Massa */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-slate-700">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 pr-6 border-r border-slate-700">{selectedIds.length} Itens</span>
            <div className="flex gap-2 items-center">
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.DELIVERED); setSelectedIds([]); }} className="px-4 py-2 bg-emerald-600 rounded-xl text-[10px] font-black uppercase">Entregue</button>
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.IN_TRANSIT); setSelectedIds([]); }} className="px-4 py-2 bg-amber-600 rounded-xl text-[10px] font-black uppercase">Em Rota</button>
              <button onClick={() => { if(window.confirm("Excluir?")) { onDeleteDeliveries(selectedIds); setSelectedIds([]); } }} className="px-4 py-2 bg-rose-600 rounded-xl text-[10px] font-black uppercase">Excluir</button>
            </div>
            <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white p-2"><i className="fas fa-times"></i></button>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Buscar por matrícula ou cliente..." className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             {['all', DeliveryStatus.PENDING, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED].map(s => (
               <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{s === 'all' ? 'Todos' : s}</button>
             ))}
          </div>
        </div>
        <button onClick={() => setShowImportModal(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all">
          <i className="fas fa-file-import"></i> Importar Movimento
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 w-10"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === filteredDeliveries.length ? [] : filteredDeliveries.map(d => d.id))} /></th>
              <th className="px-6 py-4">Data</th>
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
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{delivery.date}</td>
                  <td className="px-6 py-4 text-xs font-black text-indigo-600 uppercase">{delivery.customerId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-800 uppercase">{delivery.customerName}</p>
                      {reputation && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase ${reputation.riskLevel === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-400 text-amber-900'}`}>{reputation.status}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">{delivery.driverName}</td>
                  <td className="px-6 py-4 text-xs font-black text-center">{delivery.boxQuantity} cx</td>
                  <td className="px-6 py-4">
                    <span onClick={() => { if(delivery.status !== DeliveryStatus.RETURNED) setReturnModalTarget(delivery) }} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase cursor-pointer ${delivery.status === DeliveryStatus.RETURNED ? 'bg-slate-900 text-white' : delivery.status === DeliveryStatus.DELIVERED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{delivery.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {delivery.status === DeliveryStatus.RETURNED && (
                      <button onClick={() => notifySeller(delivery)} className="text-emerald-500 hover:scale-110 transition-transform"><i className="fab fa-whatsapp text-lg"></i></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE IMPORTAÇÃO COM VALIDAÇÃO EM TEMPO REAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex gap-6">
                <button onClick={() => setImportMode('ai')} className={`text-[10px] font-black uppercase pb-2 border-b-2 transition-all ${importMode === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>IA Smart Import</button>
                <button onClick={() => setImportMode('bulk')} className={`text-[10px] font-black uppercase pb-2 border-b-2 transition-all ${importMode === 'bulk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Importação em Massa</button>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
            </div>

            {importMode === 'bulk' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px]">
                <div className="flex flex-col space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1">Estrutura Esperada:</p>
                    <p className="text-[9px] font-bold text-indigo-600 uppercase">Matrícula ; Cliente ; Motorista ; Volumes</p>
                  </div>
                  <textarea 
                    value={importText} 
                    onChange={(e) => setImportText(e.target.value)} 
                    className="flex-1 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none focus:ring-4 focus:ring-indigo-500/10 outline-none" 
                    placeholder="MAT-001 ; JOÃO SILVA ; MARCIO ; 12"
                  />
                </div>
                
                <div className="flex flex-col space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pré-Visualização e Validação</h4>
                  <div className="flex-1 border rounded-3xl overflow-y-auto bg-slate-50/30 p-4">
                    {bulkPreview.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-[10px] font-black uppercase text-center">
                        <i className="fas fa-table text-4xl mb-4"></i>
                        Aguardando dados para validação...
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="text-[8px] font-black uppercase text-slate-400">
                          <tr>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Matrícula</th>
                            <th className="pb-2">Volumes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bulkPreview.map((p, i) => (
                            <tr key={i} className="text-[10px]">
                              <td className="py-2">{p.isValid ? <i className="fas fa-check-circle text-emerald-500"></i> : <i className="fas fa-exclamation-circle text-rose-500"></i>}</td>
                              <td className="py-2 font-bold uppercase">{p.customerId || '---'}</td>
                              <td className="py-2">{p.boxQuantity} cx</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <button 
                    disabled={bulkPreview.filter(p => p.isValid).length === 0} 
                    onClick={handleManualImport} 
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    Gravar {bulkPreview.filter(p => p.isValid).length} Registros Válidos
                  </button>
                </div>
              </div>
            )}

            {importMode === 'ai' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-200">
                     <i className="fas fa-robot"></i>
                   </div>
                   <p className="text-xs font-bold text-emerald-800 leading-relaxed uppercase">Cole qualquer texto bagunçado ou PDF (via OCR). A IA SwiftLog identificará clientes, matrículas e volumes automaticamente.</p>
                </div>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none focus:ring-4 focus:ring-emerald-500/10" placeholder="Cole aqui os dados copiados..." />
                <button onClick={handleAiImport} disabled={isAiProcessing || !importText} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                  {isAiProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                  {isAiProcessing ? 'Inteligência Processando...' : 'Extrair e Validar com IA'}
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
            <h3 className="text-lg font-black uppercase text-slate-800 tracking-tight">Registrar Retorno</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                <p className="text-sm font-black text-slate-800 uppercase">{returnModalTarget.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vendedor</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase">{clientMappings.find(m => m.customerId === returnModalTarget.customerId)?.sellerName || 'S/ Mapeamento'}</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Motivo</label>
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase cursor-pointer">
                <option value="">Selecione o motivo oficial...</option>
                {returnReasons.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
              </select>
            </div>
            <textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-32 resize-none" placeholder="Observações para o setor comercial..." />
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
