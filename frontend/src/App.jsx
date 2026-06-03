import { useEffect } from "react";
import Topbar from "./components/Topbar";
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import StudySession from "./pages/StudySession";
import Activity from "./pages/Activity";
import Syllabus from "./pages/Syllabus"; 
import Schedule from "./pages/Schedule"; 
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import { StudyProvider, useStudyContext } from "./context/StudyContext";

// Private Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useStudyContext();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public Route Wrapper (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated } = useStudyContext();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

// Catch-all Wrapper
function CatchAllRoute() {
  const { isAuthenticated } = useStudyContext();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
}

// Layout Wrapper
function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>
      <div className="z-10 flex h-full w-full">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0">
          <Topbar/>
          {children}
        </main>
      </div>
    </div>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Landing page is ALWAYS available at / */}
      <Route path="/" element={<Landing />} />
      
      {/* Unauthenticated Routes */}
      <Route path="/onboarding" element={<PublicRoute><Onboarding /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      
      {/* Authenticated Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/session" element={<ProtectedRoute><MainLayout><StudySession /></MainLayout></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><MainLayout><Schedule /></MainLayout></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><MainLayout><Activity /></MainLayout></ProtectedRoute>} />
      <Route path="/syllabus" element={<ProtectedRoute><MainLayout><Syllabus /></MainLayout></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<CatchAllRoute />} />
    </>
  )
);

function AppContent() {
  const { isAuthenticated, reminderTime } = useStudyContext();

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkReminder = () => {
      if (!reminderTime) return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;

      if (currentTime === reminderTime && now.getSeconds() < 10) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Synapse AI Coach", {
            body: "It's your scheduled study time! Let's crush those goals.",
            icon: "/favicon.ico"
          });
        }
      }
    };

    const interval = setInterval(checkReminder, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, reminderTime]);

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}

export default App;