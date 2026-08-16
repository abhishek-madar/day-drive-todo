import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskModalProvider } from './context/TaskModalContext';
import { AddTaskModal } from './components/AddTaskModal';
import { CommandPalette } from './components/CommandPalette';
import { Toaster } from 'react-hot-toast';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Layout } from './components/Layout';
import { Tasks } from './pages/Tasks';
import { Today } from './pages/Today';
import { Upcoming } from './pages/Upcoming';
import { CalendarView } from './pages/CalendarView';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Focus } from './pages/Focus';
import { Analytics } from './pages/Analytics';
import { Activity } from './pages/Activity';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="today" element={<Today />} />
        <Route path="upcoming" element={<Upcoming />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="focus" element={<Focus />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="activity" element={<Activity />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <TaskModalProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
          <AddTaskModal />
          <CommandPalette />
          <Toaster position="bottom-right" toastOptions={{ style: { background: '#111827', color: '#fff', fontSize: '14px', borderRadius: '12px' } }} />
        </BrowserRouter>
      </TaskModalProvider>
    </AuthProvider>
  );
}

export default App;
