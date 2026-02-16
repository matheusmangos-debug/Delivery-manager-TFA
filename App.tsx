
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DeliveryList from './components/DeliveryList';
import ReturnPortal from './components/ReturnPortal';
import AnalyticsView from './components/AnalyticsView';
import AISection from './components/AISection';
import TeamPerformance from './components/TeamPerformance';
import Settings from './components/Settings';
import Login from './components/Login';
import CriticalClients from './components/CriticalClients';
import { User, Delivery, ReturnReason, CustomerReputation, Branch, Driver, Vehicle, DeliveryStatus, ClientMapping, DateFilterRange } from './types';
import { db, isSupabaseConfigured, isUsingStripeKey } from './services/supabase';
import { MOCK_DELIVERIES, MOCK_DRIVERS, MOCK_VEHICLES, RETURN_REASONS, BRANCHES, MOCK_CUSTOMER_REPUTATION, MOCK_USERS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deliveries' | 'returns' | 'analytics' | 'ai' | 'team' | 'settings' | 'critical-clients'>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dbStatus, setDbStatus] = useState<'connecting' | 'online' | 'offline'>(isSupabaseConfigured ? 'connecting' : 'offline');
  
  const [filterRange, setFilterRange] = useState<DateFilterRange>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // Dados de Fallback (Mock)
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [reasons, setReasons] = useState<ReturnReason[]>(RETURN_REASONS);
  const [customerDatabase, setCustomerDatabase] = useState<CustomerReputation[]>(MOCK_CUSTOMER_REPUTATION);
  const [branches, setBranches] = useState<Branch[]>(BRANCHES);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [clientMappings, setClientMappings] = useState<ClientMapping[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  const fetchAllData = async () => {
    if (!isSupabaseConfigured) {
      setDbStatus('offline');
      return;
    }
    
    setDbStatus('connecting');
    try {
      const results = await Promise.allSettled([
        db.deliveries().select('*').order('created_at', { ascending: false }),
        db.branches().select('*'),
        db.reasons().select('*'),
        db.drivers().select('*'),
        db.vehicles().select('*'),
        db.critical_base().select('*'),
        db.mappings().select('*'),
        db.users().select('*')
      ]);

      const data: any[] = [];
      let hasError = false;

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && !res.value.error) {
          data[idx] = res.value.data;
        } else {
          hasError = true;
          console.error(`Erro na tabela ${idx}`);
        }
      });

      if (!hasError) {
        if (data[0]) setDeliveries(data[0]);
        if (data[1]) setBranches(data[1]);
        if (data[2]) setReasons(data[2]);
        if (data[3]) setDrivers(data[3]);
        if (data[4]) setVehicles(data[4]);
        if (data[5]) setCustomerDatabase(data[5]);
        if (data[6]) setClientMappings(data[6]);
        if (data[7]) setUsers(data[7]);
        setDbStatus('online');
      } else {
        setDbStatus('offline');
      }
    } catch (err) {
      setDbStatus('offline');
    }
  };

  useEffect(() => {
    if (window.aistudio) {
      window.aistudio.hasSelectedApiKey().then(setHasApiKey);
    }
    const savedSession = localStorage.getItem('swiftlog_current_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
    fetchAllData();
  }, []);

  const filteredDeliveries = useMemo(() => {
    let base = deliveries;
    if (selectedBranch !== 'all') {
      base = base.filter(d => d.branch === selectedBranch);
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    const parseDate = (dStr: string) => {
      if (!dStr) return new Date();
      if (dStr.includes('/')) {
        const [d, m, y] = dStr.split('/').map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(dStr);
    };
    return base.filter(d => {
      const deliveryDate = parseDate(d.date);
      deliveryDate.setHours(0,0,0,0);
      if (filterRange === 'today') return deliveryDate.getTime() === today.getTime();
      if (filterRange === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return deliveryDate >= weekAgo && deliveryDate <= today;
      }
      if (filterRange === 'monthly') return deliveryDate.getMonth() === today.getMonth() && deliveryDate.getFullYear() === today.getFullYear();
      if (filterRange === 'custom' && customDate) {
        const [y, m, d_] = customDate.split('-').map(Number);
        return deliveryDate.getTime() === new Date(y, m - 1, d_).getTime();
      }
      return true;
    });
  }, [deliveries, selectedBranch, filterRange, customDate]);

  const updateDelivery = async (id: string, updates: Partial<Delivery>) => {
    if (dbStatus === 'online') {
      await db.deliveries().update(updates).eq('id', id);
    }
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const bulkUpdateStatus = async (ids: string[], status: DeliveryStatus) => {
    if (dbStatus === 'online') {
      await db.deliveries().update({ status }).in('id', ids);
    }
    setDeliveries(prev => prev.map(d => ids.includes(d.id) ? { ...d, status } : d));
  };

  const deleteDeliveries = async (ids: string[]) => {
    if (dbStatus === 'online') {
      await db.deliveries().delete().in('id', ids);
    }
    setDeliveries(prev => prev.filter(d => !ids.includes(d.id)));
  };

  const addDeliveries = async (newOnes: any[]) => {
    // Sanitização para Supabase
    const toInsert = newOnes.map(d => {
      const { id, ...rest } = d; // Remove ID temporário (D-xxxx)
      
      // Converte data DD/MM/YYYY para YYYY-MM-DD para o banco
      let dbDate = rest.date;
      if (rest.date && rest.date.includes('/')) {
        const [day, month, year] = rest.date.split('/');
        dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (!rest.date) {
        dbDate = new Date().toISOString().split('T')[0];
      }

      return {
        ...rest,
        date: dbDate,
        deliveryDay: rest.deliveryDay || new Date(dbDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
        status: rest.status || DeliveryStatus.PENDING,
        boxQuantity: parseInt(String(rest.boxQuantity || 1), 10),
        address: rest.address || 'Endereço não informado'
      };
    });

    if (dbStatus === 'online') {
      const { data, error } = await db.deliveries().insert(toInsert).select();
      if (error) {
        console.error("Insert Error:", error);
        alert(`Erro ao salvar no banco: ${error.message}`);
      } else if (data) {
        setDeliveries(prev => [...data, ...prev]);
      }
    } else {
      setDeliveries(prev => [...newOnes, ...prev]);
    }
  };

  const addBranch = async (branch: Branch) => {
    if (dbStatus === 'online') await db.branches().insert([branch]);
    setBranches(prev => [...prev, branch]);
  };

  const removeBranch = async (id: string) => {
    if (dbStatus === 'online') await db.branches().delete().eq('id', id);
    setBranches(prev => prev.filter(b => b.id !== id));
  };

  const addDriver = async (driver: Driver) => {
    if (dbStatus === 'online') await db.drivers().insert([driver]);
    setDrivers(prev => [...prev, driver]);
  };

  const removeDriver = async (id: string) => {
    if (dbStatus === 'online') await db.drivers().delete().eq('id', id);
    setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const addVehicle = async (vehicle: Vehicle) => {
    if (dbStatus === 'online') await db.vehicles().insert([vehicle]);
    setVehicles(prev => [...prev, vehicle]);
  };

  const removeVehicle = async (id: string) => {
    if (dbStatus === 'online') await db.vehicles().delete().eq('id', id);
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const addReason = async (reason: ReturnReason) => {
    if (dbStatus === 'online') await db.reasons().insert([reason]);
    setReasons(prev => [...prev, reason]);
  };

  const removeReason = async (id: string) => {
    if (dbStatus === 'online') await db.reasons().delete().eq('id', id);
    setReasons(prev => prev.filter(r => r.id !== id));
  };

  const addMapping = async (mapping: ClientMapping) => {
    if (dbStatus === 'online') await db.mappings().insert([mapping]);
    setClientMappings(prev => [...prev, mapping]);
  };

  const bulkAddMappings = async (mappings: ClientMapping[]) => {
    if (dbStatus === 'online') {
      const { error } = await db.mappings().insert(mappings);
      if (error) alert(`Erro no banco (vendedores): ${error.message}`);
    }
    setClientMappings(prev => [...prev, ...mappings]);
  };

  const removeMapping = async (id: string) => {
    if (dbStatus === 'online') await db.mappings().delete().eq('customerId', id);
    setClientMappings(prev => prev.filter(m => m.customerId !== id));
  };

  const addCritical = async (critical: CustomerReputation) => {
    if (dbStatus === 'online') await db.critical_base().insert([critical]);
    setCustomerDatabase(prev => [...prev, critical]);
  };

  const removeCritical = async (id: string) => {
    if (dbStatus === 'online') await db.critical_base().delete().eq('customerId', id);
    setCustomerDatabase(prev => prev.filter(c => c.customerId !== id));
  };

  if (!currentUser) {
    return (
      <Login 
        dbStatus={dbStatus}
        onLogin={(user) => { 
          setCurrentUser(user); 
          localStorage.setItem('swiftlog_current_session', JSON.stringify(user)); 
        }} 
        onRegister={async (u) => { 
          if (dbStatus === 'online') {
            await db.users().insert([u]);
          }
          setCurrentUser(u);
          localStorage.setItem('swiftlog_current_session', JSON.stringify(u));
        }} 
        existingUsers={users} 
      />
    );
  }

  return (
    <Layout 
      user={currentUser}
      activeTab={activeTab} 
      dbStatus={dbStatus}
      onTabChange={setActiveTab}
      selectedBranch={selectedBranch}
      onBranchChange={setSelectedBranch}
      filterRange={filterRange}
      onFilterRangeChange={setFilterRange}
      customDate={customDate}
      onCustomDateChange={setCustomDate}
      branches={branches}
      onLogout={() => { setCurrentUser(null); localStorage.removeItem('swiftlog_current_session'); }}
      onRefresh={fetchAllData}
    >
      {isUsingStripeKey && (
        <div className="mb-8 bg-rose-600 text-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-white/20 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl animate-pulse">
              <i className="fas fa-plug-circle-exclamation"></i>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] mb-1">Chave do Stripe Detectada!</p>
              <p className="text-xs font-bold leading-relaxed opacity-90 max-w-2xl">
                O Supabase exige uma chave JWT que começa com `eyJ`. Substitua a chave no arquivo services/supabase.ts.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'deliveries' && (
        <DeliveryList 
          selectedBranch={selectedBranch} 
          deliveries={filteredDeliveries} 
          onUpdate={updateDelivery} 
          onBulkUpdate={bulkUpdateStatus}
          onDeleteDeliveries={deleteDeliveries}
          onAddDeliveries={addDeliveries}
          returnReasons={reasons} 
          customerHistory={customerDatabase}
          clientMappings={clientMappings}
        />
      )}
      {activeTab === 'critical-clients' && (
        <CriticalClients 
          deliveries={deliveries} 
          customerHistory={customerDatabase} 
          selectedBranch={selectedBranch} 
          filterDate={customDate}
          onUpdateClient={async (cid, upds) => {
             if (dbStatus === 'online') await db.critical_base().update(upds).eq('customerId', cid);
             setCustomerDatabase(prev => prev.map(c => c.customerId === cid ? {...c, ...upds} : c));
          }} 
        />
      )}
      {activeTab === 'team' && (
        <TeamPerformance 
          selectedBranch={selectedBranch} 
          deliveries={filteredDeliveries} 
          drivers={drivers} 
          onBulkUpdateStatus={async (ids, s) => {
             if (dbStatus === 'online') await db.drivers().update({ manualStatus: s }).in('id', ids);
             setDrivers(prev => prev.map(d => ids.includes(d.id) ? {...d, manualStatus: s} : d));
          }} 
        />
      )}
      {activeTab === 'returns' && <ReturnPortal selectedBranch={selectedBranch} deliveries={filteredDeliveries} clientMappings={clientMappings} />}
      {activeTab === 'analytics' && <AnalyticsView selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'settings' && (
        <Settings 
          reasons={reasons} onAddReason={addReason} onRemoveReason={removeReason}
          customerDatabase={customerDatabase} onAddCritical={addCritical} onRemoveCritical={removeCritical}
          branches={branches} onAddBranch={addBranch} onRemoveBranch={removeBranch}
          drivers={drivers} onAddDriver={addDriver} onRemoveDriver={removeDriver}
          vehicles={vehicles} onAddVehicle={addVehicle} onRemoveVehicle={removeVehicle}
          clientMappings={clientMappings} onAddMapping={addMapping} onBulkAddMappings={bulkAddMappings} onRemoveMapping={removeMapping}
        />
      )}
      {activeTab === 'ai' && <AISection hasProAccess={hasApiKey} onOpenKey={async () => { if (window.aistudio) { await window.aistudio.openSelectKey(); setHasApiKey(true); } }} />}
    </Layout>
  );
};

export default App;
