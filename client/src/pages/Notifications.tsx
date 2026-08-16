import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/client';

export const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            <Bell className="text-gray-900" size={28} />
            Notifications
          </h1>
        </div>
        <button 
          onClick={handleMarkAllAsRead}
          className="text-[13px] font-medium text-gray-500 hover:text-black transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <div 
            key={n.id} 
            onClick={() => n.unread && handleMarkAsRead(n.id)}
            className={`p-4 rounded-2xl border transition-colors flex gap-4 ${n.unread ? 'bg-white border-gray-200 shadow-sm cursor-pointer hover:border-gray-300' : 'bg-transparent border-transparent opacity-70'}`}
          >
            <div className="mt-1">
              {n.type === 'OVERDUE' ? <AlertCircle className="text-red-500" size={20} /> : <CheckCircle className="text-blue-500" size={20} />}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[14px] text-gray-900">{n.title}</h3>
              <p className="text-[13px] text-gray-600 mt-1">{n.body}</p>
              <p className="text-[11px] text-gray-400 mt-2 font-medium font-numbers">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </div>
            {n.unread && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Bell className="mx-auto mb-4 text-gray-300" size={48} />
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};
