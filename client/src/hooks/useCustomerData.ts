import { useCustomerDataContext } from '@/context/CustomerDataContext';

export function useCustomerData() {
  return useCustomerDataContext();
}
