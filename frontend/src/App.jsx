// src/App.jsx - Root component with routing
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./context/authStore";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import useSocket from "./hooks/useSocket";
import useDarkMode from "./hooks/useDarkMode";

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

// Public route: redirect to chat if already logged in
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/" replace />;
};

// Socket listener must be inside a component with store access
const SocketInit = () => {
  useSocket();
  return null;
};

function App() {
  const [dark] = useDarkMode();

  return (
    <BrowserRouter>
      <SocketInit />
      <Toaster
        position="top-right"
        toastOptions={{
          className: "dark:bg-gray-800 dark:text-white",
          duration: 3000,
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><RegisterPage /></PublicRoute>}
        />
        <Route
          path="/*"
          element={<PrivateRoute><ChatPage /></PrivateRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
