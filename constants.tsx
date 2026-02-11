
import { Delivery, DeliveryStatus, ReturnOrder, ReturnStatus, AnalyticsData, Branch, Driver, Helper, Vehicle, ReturnReason, User, CustomerReputation } from './types';

export const MOCK_USERS: (User & { password?: string })[] = [
  {
    id: 'U-001',
    name: 'Administrador Sistema',
    email: 'admin',
    password: 'admin',
    role: 'Gerente de Logística',
    avatar: 'https://picsum.photos/seed/admin/100'
  }
];

export const MOCK_CUSTOMER_REPUTATION: CustomerReputation[] = [
  { 
    customerId: 'MAT-10025', 
    returnCount: 3, 
    complaintCount: 1, 
    riskLevel: 'high', 
    status: 'Retorno', 
    notes: 'Cliente costuma recusar por falta de ajudante.',
    resolutionStatus: 'Pendente',
    registrationDate: '15/10/2023'
  },
  { 
    customerId: 'MAT-22331', 
    returnCount: 1, 
    complaintCount: 0, 
    riskLevel: 'low', 
    status: 'Pendência', 
    notes: 'Dificuldade de estacionamento no local.',
    resolutionStatus: 'Resolvido',
    registrationDate: '10/10/2023'
  }
];

export const BRANCHES: Branch[] = [
  { id: 'sp-01', name: 'Matriz - São Paulo', location: 'São Paulo, SP' },
  { id: 'rj-02', name: 'Filial - Rio de Janeiro', location: 'Rio de Janeiro, RJ' },
  { id: 'mg-03', name: 'Filial - Belo Horizonte', location: 'Belo Horizonte, MG' },
];

export const RETURN_REASONS: ReturnReason[] = [
  { id: 'REAS-1', label: 'Avaria no Transporte', color: '#ef4444', isActive: true },
  { id: 'REAS-2', label: 'Desistência / Arrependimento', color: '#f59e0b', isActive: true },
  { id: 'REAS-3', label: 'Endereço Não Localizado', color: '#6366f1', isActive: true },
  { id: 'REAS-4', label: 'Produto Errado', color: '#ec4899', isActive: true },
  { id: 'REAS-5', label: 'Recusa do Cliente', color: '#64748b', isActive: true },
  { id: 'REAS-6', label: 'Probl.c/ Horário (Após Saída) ROTA', color: '#f43f5e', isActive: true },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 'DRV-1', name: 'Márcio Prado Xavier', licenseType: 'D', status: 'Ativo', branchId: 'sp-01', vehicleId: 'VEC-1' },
  { id: 'DRV-2', name: 'Roberto Junior', licenseType: 'D', status: 'Ativo', branchId: 'rj-02' },
];

export const MOCK_HELPERS: Helper[] = [
  { id: 'HLP-1', name: 'Lucas Souza', status: 'Ativo' },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'VEC-1', plate: 'ABC-1234', model: 'Mercedes-Benz Accelo', capacity: '12.000kg', branchId: 'sp-01', driverId: 'DRV-1' },
];

export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: 'D-001',
    customerId: 'MAT-10025',
    customerName: 'Ana Silva',
    address: 'Av. Paulista, 1000 - SP',
    status: DeliveryStatus.DELIVERED,
    date: '25/10/2023',
    deliveryDay: 'Quarta-feira',
    trackingCode: 'CG-5521',
    items: ['Smartphone Samsung S23'],
    boxQuantity: 2,
    driverName: 'Márcio Prado Xavier',
    branch: 'sp-01',
    licensePlate: 'ABC-1234'
  },
  {
    id: 'D-002',
    customerId: 'MAT-44012',
    customerName: 'Carlos Oliveira',
    address: 'Rua das Flores, 50 - RJ',
    status: DeliveryStatus.IN_TRANSIT,
    date: '26/10/2023',
    deliveryDay: 'Quinta-feira',
    trackingCode: 'CG-8812',
    items: ['Notebook Dell XPS'],
    boxQuantity: 1,
    driverName: 'Roberto Junior',
    branch: 'rj-02'
  }
];

export const ANALYTICS_DATA: AnalyticsData[] = [
  { name: 'Seg', deliveries: 120, returns: 10 },
  { name: 'Ter', deliveries: 150, returns: 12 },
  { name: 'Qua', deliveries: 180, returns: 15 },
  { name: 'Qui', deliveries: 170, returns: 8 },
  { name: 'Sex', deliveries: 210, returns: 20 },
  { name: 'Sáb', deliveries: 90, returns: 5 },
  { name: 'Dom', deliveries: 40, returns: 2 }
];
