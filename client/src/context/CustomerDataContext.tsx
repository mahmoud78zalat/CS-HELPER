import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CustomerData {
  customer_name?: string;
  customername?: string; // Alternative format
  customerfirstname?: string;
  customerlastname?: string;
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
  ref_number?: string;
  language?: 'en' | 'ar'; // Add language preference for live chat templates
  // Agent data - Auto-populated from current user profile
  agent_name?: string;
  agentname?: string;
  agentfirstname?: string;
  agentlastname?: string;
  agentarabicfirstname?: string;
  agentarabiclastname?: string;
  agentfullname?: string;
  agentarabicfullname?: string;
  agent_email?: string;
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
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState<CustomerData>({
    language: 'en' // Default to English
  });
  const [version, setVersion] = useState(0);

  // Load data from localStorage on mount and populate agent data from user
  useEffect(() => {
    const savedData = localStorage.getItem('bfl-customer-data');
    let initialData = { language: 'en' as const };
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        initialData = {
          language: 'en' as const,
          ...parsedData
        };
      } catch (error) {
        console.error('Failed to parse saved customer data:', error);
      }
    }
    
    // Auto-populate agent data from current user if available
    if (user) {
      const agentData = {
        agentfirstname: user.firstName || '',
        agentlastname: user.lastName || '',
        agentarabicfirstname: user.arabicFirstName || '',
        agentarabiclastname: user.arabicLastName || '',
        agentfullname: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
        agentarabicfullname: user.arabicFirstName && user.arabicLastName ? `${user.arabicFirstName} ${user.arabicLastName}` : '',
        agent_name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
        agentname: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '',
        agent_email: user.email || ''
      };
      
      setCustomerData(prev => ({
        ...initialData,
        ...agentData
      }));
    } else {
      setCustomerData(initialData);
    }
  }, [user]);

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
    setCustomerData({ language: 'en' });
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