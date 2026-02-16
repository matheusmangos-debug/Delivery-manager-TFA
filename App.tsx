
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
import { db } from './services/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deliveries' | 'returns' | 'analytics' | 'ai' | 'team' | 'settings' | 'critical-clients'>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dbStatus, setDbStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  
  const [filterRange, setFilterRange] = useState<DateFilterRange>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [reasons, setReasons] = useState<ReturnReason[]>([]);
  const [customerDatabase, setCustomerDatabase] = useState<CustomerReputation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clientMappings, setClientMappings] = useState<ClientMapping[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const fetchAllData = async () => {
    setDbStatus('connecting');
    try {
      const [
        { data: delivs, error: e1 },
        { data: brnchs, error: e2 },
        { data: rsns, error: e3 },
        { data: drvrs, error: e4 },
        { data: vhcls, error: e5 },
        { data: crit, error: e6 },
        { data: maps, error: e7 },
        { data: usrs, error: e8 }
      ] = await Promise.all([
        db.deliveries().select('*').order('created_at', { ascending: false }),
        db.branches().select('*'),
        db.reasons().select('*'),
        db.drivers().select('*'),
        db.vehicles().select('*'),
        db.critical_base().select('*'),
        db.mappings().select('*'),
        db.users().select('*')
      ]);

      if (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8) {
        console.error("Erro ao carregar tabelas:", { e1, e2, e3, e4, e5, e6, e7, e8 });
        throw new Error("Falha na resposta do Supabase");
      }

      if (delivs) setDeliveries(delivs);
      if (brnchs) setBranches(brnchs);
      if (rsns) setReasons(rsns);
      if (drvrs) setDrivers(drvrs);
      if (vhcls) setVehicles(vhcls);
      if (crit) setCustomerDatabase(crit);
      if (maps) setClientMappings(maps);
      if (usrs) setUsers(usrs);
      
      setDbStatus('online');
    } catch (err) {
      console.error("Erro crítico de conexão com Supabase:", err);
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
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
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
    const { error } = await db.deliveries().update(updates).eq('id', id);
    if (error) {
      alert(`Erro ao atualizar entrega: ${error.message}`);
    } else {
      setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: DeliveryStatus) => {
    const { error } = await db.deliveries().update({ status }).in('id', ids);
    if (error) {
      alert(`Erro na atualização em massa: ${error.message}`);
    } else {
      setDeliveries(prev => prev.map(d => ids.includes(d.id) ? { ...d, status } : d));
    }
  };

  const deleteDeliveries = async (ids: string[]) => {
    const { error } = await db.deliveries().delete().in('id', ids);
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      setDeliveries(prev => prev.filter(d => !ids.includes(d.id)));
    }
  };

  const addDeliveries = async (newOnes: any[]) => {
    const { data, error } = await db.deliveries().insert(newOnes).select();
    if (error) {
      alert(`Erro ao salvar no banco: ${error.message}`);
      console.error("Payload enviado:", newOnes);
    } else if (data) {
      setDeliveries(prev => [...data, ...prev]);
    }
  };

  const addBranch = async (branch: Branch) => {
    const { error } = await db.branches().insert([branch]);
    if (error) alert(`Erro: ${error.message}`);
    else setBranches(prev => [...prev, branch]);
  };

  const removeBranch = async (id: string) => {
    const { error } = await db.branches().delete().eq('id', id);
    if (error) alert(`Erro: ${error.message}`);
    else setBranches(prev => prev.filter(b => b.id !== id));
  };

  const addDriver = async (driver: Driver) => {
    const { error } = await db.drivers().insert([driver]);
    if (error) alert(`Erro: ${error.message}`);
    else setDrivers(prev => [...prev, driver]);
  };

  const removeDriver = async (id: string) => {
    const { error } = await db.drivers().delete().eq('id', id);
    if (error) alert(`Erro: ${error.message}`);
    else setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const addVehicle = async (vehicle: Vehicle) => {
    const { error } = await db.vehicles().insert([vehicle]);
    if (error) alert(`Erro: ${error.message}`);
    else setVehicles(prev => [...prev, vehicle]);
  };

  const removeVehicle = async (id: string) => {
    const { error } = await db.vehicles().delete().eq('id', id);
    if (error) alert(`Erro: ${error.message}`);
    else setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const addReason = async (reason: ReturnReason) => {
    const { error } = await db.reasons().insert([reason]);
    if (error) alert(`Erro: ${error.message}`);
    else setReasons(prev => [...prev, reason]);
  };

  const removeReason = async (id: string) => {
    const { error } = await db.reasons().delete().eq('id', id);
    if (error) alert(`Erro: ${error.message}`);
    else setReasons(prev => prev.filter(r => r.id !== id));
  };

  const addMapping = async (mapping: ClientMapping) => {
    const { error } = await db.mappings().insert([mapping]);
    if (error) alert(`Erro: ${error.message}`);
    else setClientMappings(prev => [...prev, mapping]);
  };

  const bulkAddMappings = async (mappings: ClientMapping[]) => {
    const { error } = await db.mappings().insert(mappings);
    if (error) alert(`Erro: ${error.message}`);
    else setClientMappings(prev => [...prev, ...mappings]);
  };

  const removeMapping = async (id: string) => {
    const { error } = await db.mappings().delete().eq('customerId', id);
    if (error) alert(`Erro: ${error.message}`);
    else setClientMappings(prev => prev.filter(m => m.customerId !== id));
  };

  const addCritical = async (critical: CustomerReputation) => {
    const { error } = await db.critical_base().insert([critical]);
    if (error) alert(`Erro: ${error.message}`);
    else setCustomerDatabase(prev => [...prev, critical]);
  };

  const removeCritical = async (id: string) => {
    const { error } = await db.critical_base().delete().eq('customerId', id);
    if (error) alert(`Erro: ${error.message}`);
    else setCustomerDatabase(prev => prev.filter(c => c.customerId !== id));
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
          const { error } = await db.users().insert([u]);
          if (!error) {
            setCurrentUser(u);
            localStorage.setItem('swiftlog_current_session', JSON.stringify(u));
            fetchAllData();
          } else {
            alert(`Erro ao criar usuário: ${error.message}`);
          }
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
             const { error } = await db.critical_base().update(upds).eq('customerId', cid);
             if (error) alert(`Erro: ${error.message}`);
             else setCustomerDatabase(prev => prev.map(c => c.customerId === cid ? {...c, ...upds} : c));
          }} 
        />
      )}
      {activeTab === 'team' && (
        <TeamPerformance 
          selectedBranch={selectedBranch} 
          deliveries={filteredDeliveries} 
          drivers={drivers} 
          onBulkUpdateStatus={async (ids, s) => {
             const { error } = await db.drivers().update({ manualStatus: s }).in('id', ids);
             if (error) alert(`Erro: ${error.message}`);
             else setDrivers(prev => prev.map(d => ids.includes(d.id) ? {...d, manualStatus: s} : d));
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
