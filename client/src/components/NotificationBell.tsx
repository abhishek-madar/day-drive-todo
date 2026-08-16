import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); 
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRead = async (id: string, taskId: string | null) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setIsOpen(false);
    if (taskId) {
      navigate(`/?task=${taskId}`);
    }
  };

  const handleReadAll = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition-colors relative"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl border border-gray-100 z-50 flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
            <h3 className="font-semibold text-gray-900 text-[14px]">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleReadAll} className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
                Mark all as read
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-gray-400 text-[13px]">No new notifications.</p>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleRead(n.id, n.taskId)}
                  className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-gray-900 text-[13px]">{n.title}</p>
                    <p className="text-[10px] text-gray-400 font-numbers shrink-0 ml-2 pt-0.5">{format(new Date(n.createdAt), 'MMM d')}</p>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
