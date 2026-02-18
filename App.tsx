
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
import { db, isSupabaseConfigured, supabase } from './services/supabase';
import { MOCK_DELIVERIES, MOCK_DRIVERS, MOCK_VEHICLES, RETURN_REASONS, BRANCHES, MOCK_CUSTOMER_REPUTATION, MOCK_USERS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deliveries' | 'returns' | 'analytics' | 'ai' | 'team' | 'settings' | 'critical-clients'>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dbStatus, setDbStatus] = useState<'connecting' | 'online' | 'offline'>(isSupabaseConfigured ? 'connecting' : 'offline');
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});
  
  const [filterRange, setFilterRange] = useState<DateFilterRange>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [reasons, setReasons] = useState<ReturnReason[]>(RETURN_REASONS);
  const [customerDatabase, setCustomerDatabase] = useState<CustomerReputation[]>(MOCK_CUSTOMER_REPUTATION);
  const [branches, setBranches] = useState<Branch[]>(BRANCHES);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [clientMappings, setClientMappings] = useState<ClientMapping[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // Colunas permitidas para evitar Erro 400 (Bad Request)
  const ALLOWED_COLUMNS: Record<string, string[]> = {
    deliveries: [
      'customerId', 'customerName', 'address', 'status', 'date', 
      'deliveryDay', 'trackingCode', 'items', 'boxQuantity', 
      'driverName', 'branch', 'returnReason', 'returnNotes'
    ],
    users: ['name', 'email', 'password', 'role', 'avatar'],
    branches: ['id', 'name', 'location'],
    drivers: ['name', 'branchId', 'status', 'manualStatus'],
    vehicles: ['plate', 'model', 'capacity', 'branchId', 'driverId'],
    reasons: ['label', 'color', 'isActive'],
    critical_base: ['customerId', 'returnCount', 'complaintCount', 'notes', 'status', 'riskLevel', 'resolutionStatus', 'registrationDate'],
    mappings: ['customerId', 'sellerName', 'sellerCode', 'sellerPhone', 'customerName']
  };

  const sanitizeForDb = (data: any, table: string) => {
    const allowed = ALLOWED_COLUMNS[table];
    if (!allowed) return data;
    const sanitized: any = {};
    allowed.forEach(col => {
      if (data[col] !== undefined && data[col] !== null) {
        sanitized[col] = data[col];
      }
    });
    return sanitized;
  };

  const fetchAllData = async () => {
    if (!isSupabaseConfigured) { 
      setDbStatus('offline'); 
      return; 
    }
    setDbStatus('connecting');
    
    try {
      const results = await Promise.allSettled([
        db.deliveries().select('*').order('date', { ascending: false }),
        db.branches().select('*'),
        db.reasons().select('*'),
        db.drivers().select('*'),
        db.vehicles().select('*'),
        db.critical_base().select('*'),
        db.mappings().select('*'),
        db.users().select('*')
      ]);

      const tables = ['deliveries', 'branches', 'reasons', 'drivers', 'vehicles', 'critical_base', 'mappings', 'users'];
      const data: any[] = [];
      const status: Record<string, boolean> = {};
      
      results.forEach((res, idx) => {
        const tableName = tables[idx];
        if (res.status === 'fulfilled' && !res.value.error) {
          data[idx] = res.value.data;
          status[tableName] = true;
        } else {
          status[tableName] = false;
        }
      });

      setTableStatus(status);
      if (data[0]) setDeliveries(data[0]);
      if (data[1]) setBranches(data[1]);
      if (data[2]) setReasons(data[2]);
      if (data[3]) setDrivers(data[3]);
      if (data[4]) setVehicles(data[4]);
      if (data[5]) setCustomerDatabase(data[5]);
      if (data[6]) setClientMappings(data[6]);
      if (data[7]) setUsers(data[7]);
      
      setDbStatus('online');
    } catch (err) { 
      setDbStatus('offline'); 
    }
  };

  useEffect(() => {
    if (window.aistudio) window.aistudio.hasSelectedApiKey().then(setHasApiKey);
    const savedSession = localStorage.getItem('swiftlog_current_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
    fetchAllData();
  }, []);

  const filteredDeliveries = useMemo(() => {
    let base = deliveries;
    if (selectedBranch !== 'all') base = base.filter(d => d.branch === selectedBranch);
    
    const filterDate = customDate; 
    return base.filter(d => {
      if (filterRange === 'all') return true;
      if (filterRange === 'weekly') {
          // Filtro simples de semana retroativa
          // Renamed inner variable 'd' to 'deliveryDate' to avoid shadowing and TDZ error
          const deliveryDate = new Date(d.date);
          const limit = new Date(); limit.setDate(limit.getDate() - 7);
          return deliveryDate >= limit;
      }
      return d.date === filterDate;
    });
  }, [deliveries, selectedBranch, filterRange, customDate]);

  const updateDelivery = async (id: string, updates: Partial<Delivery>) => {
    const cleanUpdates = sanitizeForDb(updates, 'deliveries');
    if (dbStatus === 'online') {
      await db.deliveries().update(cleanUpdates).eq('id', id);
    }
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addDeliveries = async (newOnes: any[]) => {
    const targetDate = customDate;
    const toInsert = newOnes.map(d => sanitizeForDb({ 
      ...d, 
      date: targetDate,
      status: d.status || DeliveryStatus.PENDING 
    }, 'deliveries'));
    
    if (dbStatus === 'online') {
      const { data, error } = await db.deliveries().insert(toInsert).select();
      if (error) {
        console.error("Erro Supabase:", error);
        alert(`Erro ao salvar no banco. Verifique se os campos estão corretos.`);
        return;
      }
      if (data) setDeliveries(prev => [...data, ...prev]);
    } else {
      setDeliveries(prev => [...newOnes.map(n => ({...n, id: crypto.randomUUID(), date: targetDate})), ...prev]);
    }
  };

  const addMapping = async (m: ClientMapping) => {
    if (dbStatus === 'online') await db.mappings().insert([sanitizeForDb(m, 'mappings')]);
    setClientMappings(prev => [...prev, m]);
  };

  const addCritical = async (c: CustomerReputation) => {
    if (dbStatus === 'online') await db.critical_base().insert([sanitizeForDb(c, 'critical_base')]);
    setCustomerDatabase(prev => [...prev, c]);
  };

  if (!currentUser) return <Login dbStatus={dbStatus} onLogin={setCurrentUser} onRegister={setCurrentUser} existingUsers={users} />;

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
      onLogout={() => setCurrentUser(null)}
      onRefresh={fetchAllData}
    >
      {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'deliveries' && (
        <DeliveryList 
          selectedBranch={selectedBranch} 
          deliveries={filteredDeliveries} 
          onUpdate={updateDelivery} 
          onBulkUpdate={async (ids, status) => {
             if (dbStatus === 'online') await db.deliveries().update({ status }).in('id', ids);
             setDeliveries(prev => prev.map(d => ids.includes(d.id!) ? { ...d, status } : d));
          }}
          onDeleteDeliveries={async ids => {
             if (dbStatus === 'online') await db.deliveries().delete().in('id', ids);
             setDeliveries(prev => prev.filter(d => !ids.includes(d.id!)));
          }}
          onAddDeliveries={addDeliveries}
          returnReasons={reasons}
          customerHistory={customerDatabase}
          clientMappings={clientMappings}
        />
      )}
      {activeTab === 'critical-clients' && <CriticalClients deliveries={deliveries} customerHistory={customerDatabase} clientMappings={clientMappings} onAddMapping={addMapping} onBulkAddMappings={ms => ms.forEach(addMapping)} selectedBranch={selectedBranch} filterDate={customDate} />}
      {activeTab === 'team' && <TeamPerformance selectedBranch={selectedBranch} deliveries={filteredDeliveries} drivers={drivers} onBulkUpdateStatus={() => {}} />}
      {activeTab === 'returns' && <ReturnPortal selectedBranch={selectedBranch} deliveries={filteredDeliveries} clientMappings={clientMappings} />}
      {activeTab === 'analytics' && <AnalyticsView selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'settings' && (
        <Settings 
          dbStatus={dbStatus} 
          tableStatus={tableStatus}
          onRefresh={fetchAllData}
          reasons={reasons} onAddReason={r => {}} onRemoveReason={()=>{}}
          customerDatabase={customerDatabase} onAddCritical={c => {}} onRemoveCritical={()=>{}}
          branches={branches} onAddBranch={b => {}} onRemoveBranch={()=>{}}
          drivers={drivers} onAddDriver={d => {}} onRemoveDriver={()=>{}}
          vehicles={vehicles} onAddVehicle={v => {}} onRemoveVehicle={()=>{}}
          clientMappings={clientMappings} onAddMapping={addMapping} onBulkAddMappings={ms => ms.forEach(addMapping)} onRemoveMapping={()=>{}}
        />
      )}
      {activeTab === 'ai' && <AISection hasProAccess={hasApiKey} onOpenKey={async () => { if (window.aistudio) { await window.aistudio.openSelectKey(); setHasApiKey(true); } }} />}
    </Layout>
  );
};

export default App;
