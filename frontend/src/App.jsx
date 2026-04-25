// src/App.jsx - Root component with call screens added globally
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./context/authStore";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import useSocket from "./hooks/useSocket";
import useDarkMode from "./hooks/useDarkMode";
import IncomingCallModal from "./components/call/IncomingCallModal";
import ActiveCallScreen from "./components/call/ActiveCallScreen";
import useCallStore from "./context/callStore";

const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/" replace />;
};

const SocketInit = () => { useSocket(); return null; };

function App() {
  const [dark] = useDarkMode();
  const { incomingCall, activeCall } = useCallStore();

  return (
    <BrowserRouter>
      <SocketInit />
      <Toaster position="top-right" toastOptions={{ className: "dark:bg-gray-800 dark:text-white", duration: 3000 }} />

      {/* Global call overlays — render on top of everything */}
      {incomingCall && <IncomingCallModal />}
      {activeCall   && <ActiveCallScreen />}

      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/*"        element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
