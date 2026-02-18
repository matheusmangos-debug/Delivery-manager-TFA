
import React, { useState } from 'react';
import { Checkout } from '../types';

interface CheckoutFormProps {
  onSubmit: (checkout: Checkout) => Promise<boolean>;
  dbStatus: 'online' | 'offline' | 'connecting';
  checkouts?: Checkout[];
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit, dbStatus, checkouts = [] }) => {
  const [formData, setFormData] = useState<Partial<Checkout>>({
    orderNumber: `ORD-${Math.floor(Math.random() * 90000) + 10000}`,
    paymentMethod: 'Cartão de Crédito',
    status: 'Pendente',
    totalValue: 0,
    items: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.customerName || !formData.totalValue) return;

    setIsSubmitting(true);
    const success = await onSubmit(formData as Checkout);
    setIsSubmitting(false);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          orderNumber: `ORD-${Math.floor(Math.random() * 90000) + 10000}`,
          paymentMethod: 'Cartão de Crédito',
          status: 'Pendente',
          totalValue: 0,
          items: ''
        });
      }, 3000);
    } else {
      alert("Erro ao salvar pedido no banco de dados.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Formulário de Checkout */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl rotate-12">
              <i className="fas fa-shopping-basket"></i>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Novo Checkout</h2>
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Sincronização Direta Supabase</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nº do Pedido</label>
                <input readOnly value={formData.orderNumber} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 focus:outline-none" />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Matrícula Cliente</label>
                <input required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value.toUpperCase()})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="MAT-123" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nome do Cliente</label>
                <input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="NOME DO CLIENTE" />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor Total (R$)</label>
                <input required type="number" step="0.01" value={formData.totalValue || ''} onChange={e => setFormData({...formData, totalValue: parseFloat(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all" placeholder="0.00" />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Método</label>
                <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all cursor-pointer">
                  <option>Cartão de Crédito</option>
                  <option>Pix</option>
                  <option>Boleto Bancário</option>
                  <option>Dinheiro</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || dbStatus === 'connecting'} 
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-check-circle"></i>}
              {isSubmitting ? 'Gravando...' : 'Salvar Pedido no Supabase'}
            </button>

            <div className="flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Conexão: {dbStatus === 'online' ? 'Sincronizado' : 'Offline'}
              </p>
            </div>
          </form>

          {showSuccess && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl shadow-xl mb-4 animate-bounce">
                <i className="fas fa-check"></i>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">Pedido Armazenado!</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Enviado com sucesso para cpxtorqsurwquxycmxzg</p>
            </div>
          )}
        </div>

        {/* Histórico Recente */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2 flex items-center justify-between">
              Pedidos Recentes (Supabase)
              <i className="fas fa-history text-indigo-400"></i>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
              {checkouts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-[10px] font-black uppercase">
                  Nenhum pedido registrado
                </div>
              ) : (
                checkouts.slice(0, 8).map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black text-indigo-600 uppercase truncate">{c.orderNumber}</p>
                      <p className="text-[11px] font-bold text-slate-800 uppercase truncate">{c.customerName}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-[10px] font-black text-slate-700">R$ {c.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{c.paymentMethod}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
