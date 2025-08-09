import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AdminModalContextType {
  isAdminModalOpen: boolean;
  openAdminModal: () => void;
  closeAdminModal: () => void;
}

const AdminModalContext = createContext<AdminModalContextType | undefined>(undefined);

export function AdminModalProvider({ children }: { children: ReactNode }) {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const openAdminModal = useCallback(() => {
    console.log('[AdminModalContext] Opening admin modal');
    setIsAdminModalOpen(true);
  }, []);

  const closeAdminModal = useCallback(() => {
    console.log('[AdminModalContext] Closing admin modal');
    setIsAdminModalOpen(false);
  }, []);

  return (
    <AdminModalContext.Provider value={{
      isAdminModalOpen,
      openAdminModal,
      closeAdminModal
    }}>
      {children}
    </AdminModalContext.Provider>
  );
}

export function useAdminModal() {
  const context = useContext(AdminModalContext);
  if (context === undefined) {
    throw new Error('useAdminModal must be used within an AdminModalProvider');
  }
  return context;
}