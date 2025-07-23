import { useState, useEffect } from 'react';

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

export function useCustomerData() {
  const [customerData, setCustomerData] = useState<CustomerData>({});

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
  };

  const clearCustomerData = () => {
    setCustomerData({});
    localStorage.removeItem('bfl-customer-data');
  };

  return {
    customerData,
    updateCustomerData,
    clearCustomerData
  };
}
