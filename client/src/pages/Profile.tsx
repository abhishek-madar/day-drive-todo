import React, { useState, useEffect } from 'react';
import { User, MoreHorizontal, CheckCircle2, Circle, Clock, Flame, Shield, Bell, Sliders, ChevronRight, LogOut, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';

import { DropdownMenu } from '../components/DropdownMenu';
import { ConfirmModal } from '../components/ConfirmModal';
import { PasswordModal } from '../components/PasswordModal';
import { AvatarUploadModal } from '../components/AvatarUploadModal';

interface ProfileStats {
  completedTasks: number;
  activeTasks: number;
  focusTimeMinutes: number;
  streak: number;
}

export const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<ProfileStats>({
    completedTasks: 0,
    activeTasks: 0,
    focusTimeMinutes: 0,
    streak: 0
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [openDropdown, setOpenDropdown] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfileData();
    
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data } = await api.get('/user/profile');
      setStats(data.stats);
      updateUser(data.user);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name === user?.name && formData.email === user?.email) {
      toast('No changes to save', { icon: 'ℹ️' });
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Saving changes...');
    try {
      const { data } = await api.patch('/user/profile', formData);
      updateUser(data); 
      toast.success('Profile updated successfully', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (currentPass: string, newPass: string) => {
    const loadingToast = toast.loading('Updating password...');
    try {
      await api.patch('/user/password', { currentPassword: currentPass, newPassword: newPass });
      toast.success('Password updated successfully', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update password', { id: loadingToast });
      throw error;
    }
  };

  const handleAvatarSubmit = async (base64Image: string | null) => {
    const loadingToast = toast.loading(base64Image ? 'Uploading photo...' : 'Removing photo...');
    try {
      const { data } = await api.patch('/user/avatar', { avatarUrl: base64Image });
      updateUser(data);
      toast.success(base64Image ? 'Photo uploaded' : 'Photo removed', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update photo', { id: loadingToast });
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    const loadingToast = toast.loading('Deleting account...');
    try {
      await api.delete('/user/account');
      toast.success('Account deleted', { id: loadingToast });
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete account', { id: loadingToast });
    }
  };

  const formatFocusTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formattedJoinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';

  return (
    <div className="max-w-[1100px] mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight flex items-center gap-3">
            <User className="text-gray-900" size={28} />
            Profile
          </h1>
          <p className="text-[14px] text-gray-500 mt-1 hidden md:block">Manage your account and personal information.</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(!openDropdown)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <MoreHorizontal size={20} />
          </button>
          
          {openDropdown && (
            <DropdownMenu
              onClose={() => setOpenDropdown(false)}
              items={[
                { label: 'Edit profile', onClick: () => document.getElementById('name-input')?.focus() },
                { label: 'Change photo', onClick: () => setIsAvatarModalOpen(true) },
                { label: 'Reset profile', onClick: () => {
                    setFormData({ name: user?.name || '', email: user?.email || '' });
                    toast('Profile reset to saved values', { icon: '🔄' });
                } },
                { label: 'Delete account', danger: true, onClick: () => setIsDeleteConfirmOpen(true) }
              ]}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 group">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-900 text-white flex items-center justify-center text-4xl font-semibold overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-md border-4 border-white">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <button 
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-50 transition-colors z-10"
            >
              <Camera size={16} />
            </button>
          </div>
          
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 w-full sm:mt-2">
            <h2 className="text-[24px] font-bold text-gray-900 leading-none">{user?.name || 'Anonymous User'}</h2>
            <p className="text-[15px] text-gray-500 mt-2">{user?.email}</p>
            <p className="text-[13px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">Member since {formattedJoinDate}</p>
            
            <div className="mt-6 sm:mt-8 flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsAvatarModalOpen(true)}
                className="flex-1 sm:flex-none px-6 py-2 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors active:scale-[0.98]"
              >
                Change Photo
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h3 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-6">Your Productivity</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div 
              onClick={() => navigate('/analytics')}
              className="p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100/50 cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 size={18} />
              </div>
              <div className="font-numbers text-[28px] sm:text-[36px] font-bold text-gray-900 leading-none mb-1 group-hover:scale-105 transition-transform origin-left">{stats.completedTasks}</div>
              <div className="text-[13px] font-medium text-gray-500">Completed</div>
            </div>

            <div 
              onClick={() => navigate('/tasks')}
              className="p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100/50 cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Circle size={18} />
              </div>
              <div className="font-numbers text-[28px] sm:text-[36px] font-bold text-gray-900 leading-none mb-1 group-hover:scale-105 transition-transform origin-left">{stats.activeTasks}</div>
              <div className="text-[13px] font-medium text-gray-500">Active</div>
            </div>

            <div 
              onClick={() => navigate('/focus')}
              className="p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100/50 cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Clock size={18} />
              </div>
              <div className="font-numbers text-[28px] sm:text-[36px] font-bold text-gray-900 leading-none mb-1 group-hover:scale-105 transition-transform origin-left">{formatFocusTime(stats.focusTimeMinutes)}</div>
              <div className="text-[13px] font-medium text-gray-500">Focus Time</div>
            </div>

            <div 
              onClick={() => navigate('/analytics')}
              className="p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100/50 cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-orange-500 mb-2">
                <Flame size={18} />
              </div>
              <div className="font-numbers text-[28px] sm:text-[36px] font-bold text-gray-900 leading-none mb-1 group-hover:scale-105 transition-transform origin-left">{stats.streak}</div>
              <div className="text-[13px] font-medium text-gray-500">Streak</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 flex flex-col">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-6">Personal Information</h3>
            
            <form onSubmit={handleSaveProfile} className="flex flex-col flex-1">
              <div className="space-y-5 flex-1">
                <div>
                  <label htmlFor="name-input" className="block text-[13px] font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input 
                    id="name-input"
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-gray-200 focus:outline-none transition-colors text-[14px] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-gray-200 focus:outline-none transition-colors text-[14px] text-gray-900"
                  />
                </div>
              </div>
              
              <div className="pt-8 mt-auto flex justify-center sm:justify-start">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-xl text-[14px] font-medium hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-6">Account</h3>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Shield size={18} />
                  </div>
                  <span className="font-medium text-[15px] text-gray-900">Password</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-medium text-gray-400 group-hover:text-black transition-colors">
                  Change <ChevronRight size={16} />
                </div>
              </button>

              <Link 
                to="/settings"
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <span className="font-medium text-[15px] text-gray-900">Notifications</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-medium text-gray-400 group-hover:text-black transition-colors">
                  Manage <ChevronRight size={16} />
                </div>
              </Link>

              <Link 
                to="/settings"
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Sliders size={18} />
                  </div>
                  <span className="font-medium text-[15px] text-gray-900">Preferences</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-medium text-gray-400 group-hover:text-black transition-colors">
                  Manage <ChevronRight size={16} />
                </div>
              </Link>

              <div className="my-2 border-b border-gray-100"></div>

              <button 
                onClick={logout}
                className="w-full flex items-center p-4 rounded-2xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-10 h-10 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                    <LogOut size={18} />
                  </div>
                  <span className="font-medium text-[15px]">Sign Out</span>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>

      {isPasswordModalOpen && (
        <PasswordModal 
          onClose={() => setIsPasswordModalOpen(false)} 
          onSubmit={handlePasswordSubmit} 
        />
      )}

      {isAvatarModalOpen && (
        <AvatarUploadModal 
          onClose={() => setIsAvatarModalOpen(false)}
          onSubmit={handleAvatarSubmit}
          currentAvatarUrl={user?.avatarUrl || null}
        />
      )}

      {isDeleteConfirmOpen && (
        <ConfirmModal
          title="Delete Account"
          message="Are you sure you want to permanently delete your account? All your tasks, projects, and focus sessions will be erased. This action cannot be undone."
          confirmText="Delete Permanently"
          onConfirm={() => {
            handleDeleteAccount();
            setIsDeleteConfirmOpen(false);
          }}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
};
