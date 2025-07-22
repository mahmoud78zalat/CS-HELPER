export interface CustomerData {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_country?: string;
  gender?: string;
  order_number?: string;
  item_name?: string;
  delivery_date?: string;
  waiting_time?: string;
}

export interface OrderTrackingResult {
  orderNumber: string;
  awbNumber: string;
  status: string;
  deliveryDate: string;
  deliveryAddress: string;
  trackingHistory: Array<{
    status: string;
    date: string;
    color: string;
  }>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  genre: string;
  concernedTeam: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
}

export interface WebSocketMessage {
  type: string;
  payload?: any;
}
