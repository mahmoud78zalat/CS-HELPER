import { useState } from "react";
import Layout from "@/components/Layout";
import TemplatesArea from "@/components/TemplatesArea";
import CheckOrderModal from "@/components/CheckOrderModal";
import EmailComposerModal from "@/components/EmailComposerModal";
import AdminPanel from "@/components/AdminPanel";
import AboutModal from "@/components/AboutModal";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function Home() {
  const [showCheckOrder, setShowCheckOrder] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Enable real-time updates for all users
  useRealTimeUpdates();



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
