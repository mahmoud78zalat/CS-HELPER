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
    </Layout>
  );
}
