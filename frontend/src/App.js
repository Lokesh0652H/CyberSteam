import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StreamProvider } from "./context/StreamContext";
import Header from "./components/Header";
import ExportModal from "./components/ExportModal";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import LiveEvents from "./pages/LiveEvents";
import Threats from "./pages/Threats";
import AttackSimulator from "./pages/AttackSimulator";
import Analytics from "./pages/Analytics";
import NetworkMap from "./pages/NetworkMap";
import Rules from "./pages/Rules";
import SystemHealth from "./pages/SystemHealth";

function Shell() {
  const [exportOpen, setExportOpen] = useState(false);
  const loc = useLocation();
  return (
    <StreamProvider>
      <div className="min-h-screen">
        <Header onExport={() => setExportOpen(true)} />
        <AnimatePresence mode="wait">
          <motion.main key={loc.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="p-4 max-w-[1600px] mx-auto">
            <Routes location={loc}>
              <Route path="/" element={<Overview />} />
              <Route path="/events" element={<LiveEvents />} />
              <Route path="/threats" element={<Threats />} />
              <Route path="/simulator" element={<AttackSimulator />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/network" element={<NetworkMap />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/system" element={<SystemHealth />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.main>
        </AnimatePresence>
        <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      </div>
    </StreamProvider>
  );
}

function Gate() {
  const { user } = useAuth();
  if (user === null) return <div className="min-h-screen flex items-center justify-center text-cyan-400 font-mono">Initializing SOC…</div>;
  if (!user) return <Login />;
  return <Shell />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: "#0F1522", border: "1px solid #1E293B", color: "#F8FAFC", fontFamily: "JetBrains Mono, monospace", fontSize: "12px" } }} />
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
