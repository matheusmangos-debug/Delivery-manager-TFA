
import { Delivery, DeliveryStatus, ReturnOrder, ReturnStatus, AnalyticsData, Branch, Driver, Helper, Vehicle, ReturnReason, User, CustomerReputation } from './types';

export const MOCK_USERS: (User & { password?: string })[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
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
    registrationDate: '2023-10-15'
  },
  { 
    customerId: 'MAT-22331', 
    returnCount: 1, 
    complaintCount: 0, 
    riskLevel: 'low', 
    status: 'Pendência', 
    notes: 'Dificuldade de estacionamento no local.',
    resolutionStatus: 'Resolvido',
    registrationDate: '2023-10-10'
  }
];

export const BRANCHES: Branch[] = [
  { id: 'sp-01', name: 'Matriz - São Paulo', location: 'São Paulo, SP' },
  { id: 'rj-02', name: 'Filial - Rio de Janeiro', location: 'Rio de Janeiro, RJ' },
  { id: 'mg-03', name: 'Filial - Belo Horizonte', location: 'Belo Horizonte, MG' },
];

export const RETURN_REASONS: ReturnReason[] = [
  { id: '550e8400-e29b-41d4-a716-446655440001', label: 'Avaria no Transporte', color: '#ef4444', isActive: true },
  { id: '550e8400-e29b-41d4-a716-446655440002', label: 'Desistência / Arrependimento', color: '#f59e0b', isActive: true },
  { id: '550e8400-e29b-41d4-a716-446655440003', label: 'Endereço Não Localizado', color: '#6366f1', isActive: true },
  { id: '550e8400-e29b-41d4-a716-446655440004', label: 'Produto Errado', color: '#ec4899', isActive: true },
  { id: '550e8400-e29b-41d4-a716-446655440005', label: 'Recusa do Cliente', color: '#64748b', isActive: true },
  { id: '550e8400-e29b-41d4-a716-446655440006', label: 'Probl.c/ Horário (Após Saída) ROTA', color: '#f43f5e', isActive: true },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Márcio Prado Xavier', licenseType: 'D', status: 'Ativo', branchId: 'sp-01', vehicleId: '550e8400-e29b-41d4-a716-446655440020' },
  { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Roberto Junior', licenseType: 'D', status: 'Ativo', branchId: 'rj-02' },
];

export const MOCK_HELPERS: Helper[] = [
  { id: '550e8400-e29b-41d4-a716-446655440030', name: 'Lucas Souza', status: 'Ativo' },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: '550e8400-e29b-41d4-a716-446655440020', plate: 'ABC-1234', model: 'Mercedes-Benz Accelo', capacity: '12.000kg', branchId: 'sp-01', driverId: '550e8400-e29b-41d4-a716-446655440010' },
];

export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    customerId: 'MAT-10025',
    customerName: 'Ana Silva',
    address: 'Av. Paulista, 1000 - SP',
    status: DeliveryStatus.DELIVERED,
    date: '2023-10-25',
    deliveryDay: 'Quarta-feira',
    trackingCode: 'CG-5521',
    items: ['Smartphone Samsung S23'],
    boxQuantity: 2,
    driverName: 'Márcio Prado Xavier',
    branch: 'sp-01',
    licensePlate: 'ABC-1234'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    customerId: 'MAT-44012',
    customerName: 'Carlos Oliveira',
    address: 'Rua das Flores, 50 - RJ',
    status: DeliveryStatus.IN_TRANSIT,
    date: '2023-10-26',
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
