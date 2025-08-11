import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TemplatesArea from "@/components/TemplatesArea";
import CheckOrderModal from "@/components/CheckOrderModal";
import EmailComposerModal from "@/components/EmailComposerModalNew";
import AdminPanel from "@/components/AdminPanel";
import AboutModal from "@/components/AboutModal";
import FAQModal from "@/components/FAQModal";
import PersonalNotes from "@/components/PersonalNotes";

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

      {/* Call Scripts Modal - Placeholder */}
      {showCallScripts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Call Scripts Management</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Feature coming soon! This will allow agents to manage and access call scripts for customer service calls.
            </p>
            <button 
              onClick={() => setShowCallScripts(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Store Emails Modal - Placeholder */}
      {showStoreEmails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Store Emails Management</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Feature coming soon! This will provide Excel-like management of store names, emails, and phone numbers.
            </p>
            <button 
              onClick={() => setShowStoreEmails(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
