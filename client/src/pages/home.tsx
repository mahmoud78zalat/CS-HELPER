import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TemplatesArea from "@/components/TemplatesArea";
import CheckOrderModal from "@/components/CheckOrderModal";
import EmailComposerModal from "@/components/EmailComposerModalNew";
import AdminPanel from "@/components/AdminPanel";
import AboutModal from "@/components/AboutModal";
import FAQModal from "@/components/FAQModal";
import PersonalNotes from "@/components/PersonalNotes";
import { CallScriptsManager } from "@/components/CallScriptsManagerNew";
import { StoreEmailsManager } from "@/components/StoreEmailsManager";

import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useAuth } from "@/hooks/useAuth";
import { useAdminModal } from "@/contexts/AdminModalContext";

export default function Home() {
  const { user } = useAuth();
  const { isAdminModalOpen, openAdminModal, closeAdminModal } = useAdminModal();
  const [showCheckOrder, setShowCheckOrder] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showPersonalNotes, setShowPersonalNotes] = useState(false);
  const [showCallScripts, setShowCallScripts] = useState(false);
  const [showStoreEmails, setShowStoreEmails] = useState(false);

  // Enable real-time updates for all users
  useRealTimeUpdates();

  // Reset admin panel state when user changes to prevent admin panel from persisting across user sessions
  useEffect(() => {
    console.log('[Home] User changed, resetting admin panel state');
    closeAdminModal();
  }, [user?.id, closeAdminModal]);



  return (
    <Layout
      onCheckOrder={() => setShowCheckOrder(true)}
      onEmailComposer={() => setShowEmailComposer(true)}
      onAdminPanel={() => openAdminModal()}
      onAbout={() => setShowAbout(true)}
      onFAQ={() => setShowFAQ(true)}
      onOpenPersonalNotes={() => setShowPersonalNotes(true)}
      onCallScripts={() => setShowCallScripts(true)}
      onStoreEmails={() => setShowStoreEmails(true)}
    >
      <TemplatesArea />
      

      
      {showCheckOrder && (
        <CheckOrderModal onClose={() => setShowCheckOrder(false)} />
      )}
      
      {showEmailComposer && (
        <EmailComposerModal onClose={() => setShowEmailComposer(false)} />
      )}
      
      {isAdminModalOpen && (
        <AdminPanel onClose={() => closeAdminModal()} />
      )}
      
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
      
      {showFAQ && (
        <FAQModal 
          open={showFAQ} 
          onClose={() => setShowFAQ(false)} 
        />
      )}
      
      <PersonalNotes 
        open={showPersonalNotes} 
        onClose={() => setShowPersonalNotes(false)} 
      />

      {/* Call Scripts Management */}
      {showCallScripts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <CallScriptsManager onClose={() => setShowCallScripts(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Store Emails Management */}
      {showStoreEmails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <StoreEmailsManager onClose={() => setShowStoreEmails(false)} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
