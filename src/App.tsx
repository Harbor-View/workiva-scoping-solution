import { Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Verify from "@/pages/Verify";
import Chat from "@/pages/Chat";
import Confirmation from "@/pages/Confirmation";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/confirmation" element={<Confirmation />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
