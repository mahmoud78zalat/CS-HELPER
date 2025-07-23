import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CustomerData {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_country?: string;
  customer_address?: string;
  gender?: string;
  order_id?: string;
  order_number?: string;
  awb_number?: string;
  order_status?: string;
  tracking_number?: string;
  item_name?: string;
  delivery_date?: string;
  waiting_time?: string;
}

interface CustomerDataContextType {
  customerData: CustomerData;
  updateCustomerData: (field: keyof CustomerData, value: string) => void;
  clearCustomerData: () => void;
  // Add a subscription mechanism to force updates
  version: number;
}

const CustomerDataContext = createContext<CustomerDataContextType | undefined>(undefined);

interface CustomerDataProviderProps {
  children: ReactNode;
}

export function CustomerDataProvider({ children }: CustomerDataProviderProps) {
  const [customerData, setCustomerData] = useState<CustomerData>({});
  const [version, setVersion] = useState(0);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('bfl-customer-data');
    if (savedData) {
      try {
        setCustomerData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse saved customer data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bfl-customer-data', JSON.stringify(customerData));
  }, [customerData]);

  const updateCustomerData = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
    // Increment version to trigger re-renders in components that depend on this
    setVersion(prev => prev + 1);
  };

  const clearCustomerData = () => {
    setCustomerData({});
    localStorage.removeItem('bfl-customer-data');
    setVersion(prev => prev + 1);
  };

  return (
    <CustomerDataContext.Provider value={{
      customerData,
      updateCustomerData,
      clearCustomerData,
      version
    }}>
      {children}
    </CustomerDataContext.Provider>
  );
}

export function useCustomerDataContext() {
  const context = useContext(CustomerDataContext);
  if (context === undefined) {
    throw new Error('useCustomerDataContext must be used within a CustomerDataProvider');
  }
  return context;
}