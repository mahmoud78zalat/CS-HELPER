import React, { createContext, useContext, useState } from 'react';

interface ClearOnCopyContextType {
  isClearOnCopyEnabled: boolean;
  setIsClearOnCopyEnabled: (enabled: boolean) => void;
  triggerClearOnCopy: () => void;
}

const ClearOnCopyContext = createContext<ClearOnCopyContextType | undefined>(undefined);

export function ClearOnCopyProvider({ children }: { children: React.ReactNode }) {
  const [isClearOnCopyEnabled, setIsClearOnCopyEnabled] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);

  const triggerClearOnCopy = () => {
    if (isClearOnCopyEnabled) {
      setClearTrigger(prev => prev + 1);
    }
  };

  return (
    <ClearOnCopyContext.Provider value={{
      isClearOnCopyEnabled,
      setIsClearOnCopyEnabled,
      triggerClearOnCopy
    }}>
      {children}
    </ClearOnCopyContext.Provider>
  );
}

export function useClearOnCopy() {
  const context = useContext(ClearOnCopyContext);
  if (context === undefined) {
    throw new Error('useClearOnCopy must be used within a ClearOnCopyProvider');
  }
  return context;
}