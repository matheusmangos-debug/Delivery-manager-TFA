
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

  const sanitizeForDb = (data: any, table: string, isUpdate: boolean = false) => {
    const allowed = ALLOWED_COLUMNS[table];
    if (!allowed) return data;

    const sanitized: any = {};
    allowed.forEach(col => {
      if (data[col] !== undefined) {
        let value = data[col];
        if (col === 'date' && typeof value === 'string' && value.includes('/')) {
          const [d, m, y] = value.split('/');
          value = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        if (col === 'boxQuantity' || col === 'returnCount' || col === 'complaintCount') {
          const num = parseInt(String(value), 10);
          value = isNaN(num) ? 0 : num;
        }
        if (col === 'items' && Array.isArray(value)) value = value.join(', ');
        sanitized[col] = value;
      }
    });

    if (table === 'deliveries' && !isUpdate) {
      sanitized.customerId = sanitized.customerId || 'N/I';
      sanitized.date = sanitized.date || new Date().toISOString().split('T')[0];
    }

    return sanitized;
  };

  const fetchAllData = async () => {
    if (!isSupabaseConfigured) { setDbStatus('offline'); return; }
    if (dbStatus === 'offline') setDbStatus('connecting');
    
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

      const data: any[] = [];
      let hasError = false;
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && !res.value.error) { data[idx] = res.value.data; } 
        else { hasError = true; }
      });

      if (!hasError) {
        setDeliveries((data[0] || []).map((d: any) => ({ ...d, items: d.items ? d.items.split(',').map((i: string) => i.trim()) : [] })));
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
    if (window.aistudio) window.aistudio.hasSelectedApiKey().then(setHasApiKey);
    const savedSession = localStorage.getItem('swiftlog_current_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
    
    fetchAllData();

    const channel = supabase
      .channel('swiftlog-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_reputation' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_mappings' }, () => fetchAllData())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime sincronizado');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredDeliveries = useMemo(() => {
    let base = deliveries;
    if (selectedBranch !== 'all') base = base.filter(d => d.branch === selectedBranch);
    const today = new Date(); today.setHours(0,0,0,0);
    const parseDate = (dStr: string) => {
      if (!dStr) return new Date();
      if (dStr.includes('/')) {
        const [d, m, y] = dStr.split('/').map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(dStr);
    };
    return base.filter(d => {
      const deliveryDate = parseDate(d.date); deliveryDate.setHours(0,0,0,0);
      if (filterRange === 'today') return deliveryDate.getTime() === today.getTime();
      if (filterRange === 'weekly') {
        const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
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
    if (dbStatus === 'online') await db.deliveries().update(sanitizeForDb(updates, 'deliveries', true)).eq('id', id);
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addDeliveries = async (newOnes: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    const toInsert = newOnes.map(d => sanitizeForDb({ ...d, date: today }, 'deliveries'));
    if (dbStatus === 'online') {
      const { data, error } = await db.deliveries().insert(toInsert).select();
      if (!error && data) {
        const formattedData = data.map(d => ({ ...d, items: d.items ? d.items.split(',').map((i: string) => i.trim()) : [] }));
        setDeliveries(prev => [...formattedData, ...prev]);
      } else if (error) { alert(`Erro: ${error.message}`); }
    } else { setDeliveries(prev => [...newOnes.map(n => ({...n, id: crypto.randomUUID(), date: today})), ...prev]); }
  };

  const addMapping = async (mapping: ClientMapping) => {
    const clean = sanitizeForDb(mapping, 'mappings');
    if (dbStatus === 'online') {
      const { error } = await db.mappings().insert([clean]);
      if (error) { alert("Erro: " + error.message); return; }
    }
    setClientMappings(prev => [...prev, mapping]);
  };

  const bulkAddMappings = async (mappings: ClientMapping[]) => {
    const cleanMappings = mappings.map(m => sanitizeForDb(m, 'mappings'));
    if (dbStatus === 'online') {
      const { error } = await db.mappings().insert(cleanMappings);
      if (error) { alert("Erro: " + error.message); return; }
    }
    setClientMappings(prev => [...prev, ...mappings]);
  };

  const addCritical = async (critical: CustomerReputation) => {
    const clean = sanitizeForDb(critical, 'critical_base');
    if (dbStatus === 'online') await db.critical_base().insert([clean]);
    setCustomerDatabase(prev => [...prev, critical]);
  };

  const addReason = async (reason: ReturnReason) => {
    const clean = sanitizeForDb(reason, 'reasons');
    if (dbStatus === 'online') await db.reasons().insert([clean]);
    setReasons(prev => [...prev, reason]);
  };

  const addBranch = async (branch: Branch) => {
    const clean = sanitizeForDb(branch, 'branches');
    if (dbStatus === 'online') await db.branches().insert([clean]);
    setBranches(prev => [...prev, branch]);
  };

  const addDriver = async (driver: Driver) => {
    const clean = sanitizeForDb(driver, 'drivers');
    if (dbStatus === 'online') await db.drivers().insert([clean]);
    setDrivers(prev => [...prev, driver]);
  };

  const addVehicle = async (vehicle: Vehicle) => {
    const clean = sanitizeForDb(vehicle, 'vehicles');
    if (dbStatus === 'online') await db.vehicles().insert([clean]);
    setVehicles(prev => [...prev, vehicle]);
  };

  if (!currentUser) return <Login dbStatus={dbStatus} onLogin={u => { setCurrentUser(u); localStorage.setItem('swiftlog_current_session', JSON.stringify(u)); }} onRegister={u => { if (dbStatus === 'online') db.users().insert([sanitizeForDb(u, 'users')]); setCurrentUser(u); localStorage.setItem('swiftlog_current_session', JSON.stringify(u)); }} existingUsers={users} />;

  return (
    <Layout user={currentUser} activeTab={activeTab} dbStatus={dbStatus} onTabChange={setActiveTab} selectedBranch={selectedBranch} onBranchChange={setSelectedBranch} filterRange={filterRange} onFilterRangeChange={setFilterRange} customDate={customDate} onCustomDateChange={setCustomDate} branches={branches} onLogout={() => { setCurrentUser(null); localStorage.removeItem('swiftlog_current_session'); }} onRefresh={fetchAllData}>
      {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'deliveries' && <DeliveryList selectedBranch={selectedBranch} deliveries={filteredDeliveries} onUpdate={updateDelivery} onBulkUpdate={async (ids, status) => { if (dbStatus === 'online') await db.deliveries().update({ status }).in('id', ids); setDeliveries(prev => prev.map(d => ids.includes(d.id) ? { ...d, status } : d)); }} onBulkUpdateDate={async (ids, date) => { const deliveryDay = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }); if (dbStatus === 'online') await db.deliveries().update({ date, deliveryDay }).in('id', ids); setDeliveries(prev => prev.map(d => ids.includes(d.id) ? { ...d, date, deliveryDay } : d)); }} onDeleteDeliveries={async ids => { if(dbStatus==='online') await db.deliveries().delete().in('id', ids); setDeliveries(prev=>prev.filter(d=>!ids.includes(d.id))); }} onAddDeliveries={addDeliveries} returnReasons={reasons} customerHistory={customerDatabase} clientMappings={clientMappings} />}
      {activeTab === 'critical-clients' && <CriticalClients deliveries={deliveries} customerHistory={customerDatabase} clientMappings={clientMappings} onAddMapping={addMapping} onBulkAddMappings={bulkAddMappings} selectedBranch={selectedBranch} filterDate={customDate} onUpdateClient={async (cid, upds) => { if (dbStatus === 'online') await db.critical_base().update(sanitizeForDb(upds, 'critical_base', true)).eq('customerId', cid); setCustomerDatabase(prev => prev.map(c => c.customerId === cid ? {...c, ...upds} : c)); }} />}
      {activeTab === 'team' && <TeamPerformance selectedBranch={selectedBranch} deliveries={filteredDeliveries} drivers={drivers} onBulkUpdateStatus={async (ids, s) => { if (dbStatus === 'online') await db.drivers().update({ manualStatus: s }).in('id', ids); setDrivers(prev => prev.map(d => ids.includes(d.id) ? {...d, manualStatus: s} : d)); }} />}
      {activeTab === 'returns' && <ReturnPortal selectedBranch={selectedBranch} deliveries={filteredDeliveries} clientMappings={clientMappings} />}
      {activeTab === 'analytics' && <AnalyticsView selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'settings' && <Settings reasons={reasons} onAddReason={addReason} onRemoveReason={async id => { if(dbStatus==='online') await db.reasons().delete().eq('id', id); setReasons(prev=>prev.filter(r=>r.id!==id)); }} customerDatabase={customerDatabase} onAddCritical={addCritical} onRemoveCritical={async id => { if(dbStatus==='online') await db.critical_base().delete().eq('customerId', id); setCustomerDatabase(prev=>prev.filter(c=>c.customerId!==id)); }} branches={branches} onAddBranch={addBranch} onRemoveBranch={async id => { if(dbStatus==='online') await db.branches().delete().eq('id', id); setBranches(prev=>prev.filter(b=>b.id!==id)); }} drivers={drivers} onAddDriver={addDriver} onRemoveDriver={async id => { if(dbStatus==='online') await db.drivers().delete().eq('id', id); setDrivers(prev=>prev.filter(d=>d.id!==id)); }} vehicles={vehicles} onAddVehicle={addVehicle} onRemoveVehicle={async id => { if(dbStatus==='online') await db.vehicles().delete().eq('id', id); setVehicles(prev=>prev.filter(v=>v.id!==id)); }} clientMappings={clientMappings} onAddMapping={addMapping} onBulkAddMappings={bulkAddMappings} onRemoveMapping={async id => { if(dbStatus==='online') await db.mappings().delete().eq('customerId', id); setClientMappings(prev=>prev.filter(m=>m.customerId!==id)); }} />}
      {activeTab === 'ai' && <AISection hasProAccess={hasApiKey} onOpenKey={async () => { if (window.aistudio) { await window.aistudio.openSelectKey(); setHasApiKey(true); } }} />}
    </Layout>
  );
};

export default App;
