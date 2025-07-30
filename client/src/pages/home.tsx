import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TemplatesArea from "@/components/TemplatesArea";
import CheckOrderModal from "@/components/CheckOrderModal";
import EmailComposerModal from "@/components/EmailComposerModal";
import AdminPanel from "@/components/AdminPanel";
import AboutModal from "@/components/AboutModal";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [showCheckOrder, setShowCheckOrder] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Enable real-time updates for all users
  useRealTimeUpdates();

  // Reset admin panel state when user changes to prevent admin panel from persisting across user sessions
  useEffect(() => {
    console.log('[Home] User changed, resetting admin panel state');
    setShowAdminPanel(false);
  }, [user?.id]);



  return (
    <Layout
      onCheckOrder={() => setShowCheckOrder(true)}
      onEmailComposer={() => setShowEmailComposer(true)}
      onAdminPanel={() => setShowAdminPanel(true)}
      onAbout={() => setShowAbout(true)}
    >
      <TemplatesArea />
      
      {showCheckOrder && (
        <CheckOrderModal onClose={() => setShowCheckOrder(false)} />
      )}
      
      {showEmailComposer && (
        <EmailComposerModal onClose={() => setShowEmailComposer(false)} />
      )}
      
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
      
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </Layout>
  );
}
