
export enum DeliveryStatus {
  PENDING = 'Pendente',
  IN_TRANSIT = 'Em Trânsito',
  DELIVERED = 'Entregue',
  FAILED = 'Falhou',
  RETURNED = 'Retornado',
  D_PLUS_1 = 'D+1'
}

export type DateFilterRange = 'today' | 'weekly' | 'monthly' | 'custom' | 'all';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  password?: string;
}

export interface ClientMapping {
  customerId: string;
  customerName: string;
  sellerCode: string;
  sellerName: string;
  sellerPhone?: string;
}

export interface CustomerReputation {
  customerId: string;
  returnCount: number;
  complaintCount: number;
  notes?: string;
  complaintReason?: string;
  status: 'Retorno' | 'Pendência' | 'Reclamação' | 'Restrição de Horário';
  riskLevel: 'low' | 'medium' | 'high';
  resolutionStatus: 'Pendente' | 'Resolvido';
  registrationDate: string;
}

export interface Delivery {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  status: DeliveryStatus;
  date: string;
  deliveryDay: string;
  trackingCode: string;
  items: string[];
  boxQuantity: number;
  driverName: string;
  branch: string;
  licensePlate?: string;
  helpers?: string[];
  returnReason?: string;
  returnNotes?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseType: string;
  status: 'Ativo' | 'Inativo';
  manualStatus?: 'base' | 'rota' | 'patio';
  branchId: string;
  vehicleId?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  capacity: string;
  branchId: string;
  driverId?: string;
}

export interface ReturnReason {
  id: string;
  label: string;
  color: string;
  isActive: boolean;
}

export interface Helper {
  id: string;
  name: string;
  status: 'Ativo' | 'Inativo';
}

export interface AnalyticsData {
  name: string;
  deliveries: number;
  returns: number;
}

export enum ReturnStatus {
  PENDING = 'Pendente',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado'
}

export interface ReturnOrder {
  id: string;
  deliveryId: string;
  status: ReturnStatus;
  reason: string;
  date: string;
}

// Fix: Added missing Checkout interface to support CheckoutForm component and fix import error
export interface Checkout {
  id?: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  totalValue: number;
  paymentMethod: string;
  status: string;
  items?: string;
  created_at?: string;
}
