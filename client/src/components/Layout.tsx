import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, CheckSquare, Sun, CalendarDays, Calendar,
  FolderOpen, Target, BarChart2, Activity as ActivityIcon,
  Bell, Settings, User, LogOut, Menu
} from 'lucide-react';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
          isActive 
            ? 'bg-black text-white' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </Link>
    );
  };

  const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-[#e8e6dc] w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-[260px] lg:h-screen lg:h-[100dvh] bg-[#e8e6dc] border-r border-gray-200 transform transition-transform duration-300 flex flex-col ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>

        <div className="h-16 flex items-center px-6 border-b border-gray-100 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" className="w-5 h-5 object-contain" alt="Day Drive Logo" />
            <span className="font-semibold text-gray-900 text-[15px] tracking-tight">Day Drive</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
          <NavSection title="Overview">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/tasks" icon={CheckSquare} label="My Tasks" />
            <NavItem to="/today" icon={Sun} label="Today" />
            <NavItem to="/upcoming" icon={CalendarDays} label="Upcoming" />
            <NavItem to="/calendar" icon={Calendar} label="Calendar" />
          </NavSection>

          <NavSection title="Workspace">
            <NavItem to="/projects" icon={FolderOpen} label="Projects" />
            <NavItem to="/focus" icon={Target} label="Focus" />
            <NavItem to="/analytics" icon={BarChart2} label="Analytics" />
            <NavItem to="/activity" icon={ActivityIcon} label="Activity" />
          </NavSection>

          <NavSection title="System">
            <NavItem to="/notifications" icon={Bell} label="Notifications" />
            <NavItem to="/settings" icon={Settings} label="Settings" />
            <NavItem to="/profile" icon={User} label="Profile" />
          </NavSection>
        </div>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">
                {user?.name || 'User Profile'}
              </p>
              <p className="text-[12px] text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#e8e6dc]">
        
        <header className="lg:hidden h-16 bg-[#e8e6dc] border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-5 h-5 object-contain" alt="Day Drive Logo" />
            <span className="font-semibold text-gray-900 text-[15px]">Day Drive</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1">
          <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto p-6 sm:p-8 transition-all duration-300">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
};
