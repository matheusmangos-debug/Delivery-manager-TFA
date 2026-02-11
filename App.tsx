
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
import { MOCK_DELIVERIES, RETURN_REASONS, MOCK_CUSTOMER_REPUTATION, BRANCHES as INITIAL_BRANCHES, MOCK_DRIVERS, MOCK_VEHICLES, MOCK_USERS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deliveries' | 'returns' | 'analytics' | 'ai' | 'team' | 'settings' | 'critical-clients'>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  
  // Date Filtering
  const [filterRange, setFilterRange] = useState<DateFilterRange>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [reasons, setReasons] = useState<ReturnReason[]>(RETURN_REASONS);
  const [customerDatabase, setCustomerDatabase] = useState<CustomerReputation[]>(MOCK_CUSTOMER_REPUTATION);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [clientMappings, setClientMappings] = useState<ClientMapping[]>([]);

  useEffect(() => {
    if (window.aistudio) {
      window.aistudio.hasSelectedApiKey().then(setHasApiKey);
    }
    const savedUsers = localStorage.getItem('swiftlog_users_db');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(MOCK_USERS);
      localStorage.setItem('swiftlog_users_db', JSON.stringify(MOCK_USERS));
    }
    const savedSession = localStorage.getItem('swiftlog_current_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
    const savedMappings = localStorage.getItem('swiftlog_client_mappings');
    if (savedMappings) setClientMappings(JSON.parse(savedMappings));
  }, []);

  const filteredDeliveries = useMemo(() => {
    let base = deliveries;
    if (selectedBranch !== 'all') {
      base = base.filter(d => d.branch === selectedBranch);
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const parseDate = (dStr: string) => {
      const [d, m, y] = dStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    };

    return base.filter(d => {
      const deliveryDate = parseDate(d.date);
      if (filterRange === 'today') {
        return deliveryDate.getTime() === today.getTime();
      }
      if (filterRange === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return deliveryDate >= weekAgo && deliveryDate <= today;
      }
      if (filterRange === 'monthly') {
        return deliveryDate.getMonth() === today.getMonth() && deliveryDate.getFullYear() === today.getFullYear();
      }
      if (filterRange === 'custom' && customDate) {
        const [y, m, d_] = customDate.split('-').map(Number);
        const target = new Date(y, m - 1, d_);
        return deliveryDate.getTime() === target.getTime();
      }
      return true;
    });
  }, [deliveries, selectedBranch, filterRange, customDate]);

  const updateDelivery = (id: string, updates: Partial<Delivery>) => {
    setDeliveries(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const bulkUpdateStatus = (ids: string[], status: DeliveryStatus) => {
    setDeliveries(prev => prev.map(d => ids.includes(d.id) ? { ...d, status } : d));
  };

  if (!currentUser) {
    return (
      <Login 
        onLogin={(user) => { setCurrentUser(user); localStorage.setItem('swiftlog_current_session', JSON.stringify(user)); }} 
        onRegister={(u) => { 
          setUsers(prev => {
            const updated = [...prev, u];
            localStorage.setItem('swiftlog_users_db', JSON.stringify(updated));
            return updated;
          });
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
      onTabChange={setActiveTab}
      selectedBranch={selectedBranch}
      onBranchChange={setSelectedBranch}
      filterRange={filterRange}
      onFilterRangeChange={setFilterRange}
      customDate={customDate}
      onCustomDateChange={setCustomDate}
      branches={branches}
      onLogout={() => { setCurrentUser(null); localStorage.removeItem('swiftlog_current_session'); }}
    >
      {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'deliveries' && (
        <DeliveryList 
          selectedBranch={selectedBranch} 
          deliveries={filteredDeliveries} 
          onUpdate={updateDelivery} 
          onBulkUpdate={bulkUpdateStatus}
          onDeleteDeliveries={(ids) => setDeliveries(prev => prev.filter(d => !ids.includes(d.id)))}
          onAddDeliveries={(newOnes) => setDeliveries(prev => [...newOnes, ...prev])}
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
          onUpdateClient={(cid, upds) => setCustomerDatabase(prev => prev.map(c => c.customerId === cid ? {...c, ...upds} : c))} 
        />
      )}
      {activeTab === 'team' && <TeamPerformance selectedBranch={selectedBranch} deliveries={filteredDeliveries} drivers={drivers} onBulkUpdateStatus={(ids, s) => setDrivers(prev => prev.map(d => ids.includes(d.id) ? {...d, manualStatus: s} : d))} />}
      {activeTab === 'returns' && <ReturnPortal selectedBranch={selectedBranch} deliveries={filteredDeliveries} clientMappings={clientMappings} />}
      {activeTab === 'analytics' && <AnalyticsView selectedBranch={selectedBranch} deliveries={filteredDeliveries} />}
      {activeTab === 'settings' && (
        <Settings 
          reasons={reasons} onUpdateReasons={setReasons} 
          customerDatabase={customerDatabase} onUpdateCustomerDatabase={setCustomerDatabase}
          branches={branches} onUpdateBranches={setBranches}
          drivers={drivers} onUpdateDrivers={setDrivers}
          vehicles={vehicles} onUpdateVehicles={setVehicles}
          clientMappings={clientMappings}
          onUpdateClientMappings={(m) => { setClientMappings(m); localStorage.setItem('swiftlog_client_mappings', JSON.stringify(m)); }}
        />
      )}
      {activeTab === 'ai' && <AISection hasProAccess={hasApiKey} onOpenKey={async () => { if (window.aistudio) { await window.aistudio.openSelectKey(); setHasApiKey(true); } }} />}
    </Layout>
  );
};

export default App;
