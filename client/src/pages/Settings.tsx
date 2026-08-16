import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => {
  const [settings, setSettings] = useState({
    enableBrowserNotifications: false,
    enableDeadlineReminders: true,
    enableOverdueNotifications: true,
    reminderBeforeDeadlineMin: 30,
    repeatedOverdueIntervalHr: 0
  });
  const { isSupported, permission, subscribe, unsubscribe } = usePushNotifications();

  const [focusSettings, setFocusSettings] = useState({
    sessionStarted: true,
    sessionEnding: true,
    sessionCompleted: true,
    breakCompleted: true,
    warningBeforeMin: 5,
    sound: true,
    desktopNotifications: false,
  });

  useEffect(() => {
    fetchSettings();
    const localFocus = localStorage.getItem('daydrive_focus_settings');
    if (localFocus) {
      setFocusSettings(JSON.parse(localFocus));
    }
  }, []);

  const handleFocusUpdate = (newSettings: any) => {
    setFocusSettings(newSettings);
    localStorage.setItem('daydrive_focus_settings', JSON.stringify(newSettings));
    
    if (newSettings.desktopNotifications && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission !== 'granted') {
          alert("You must allow notifications in your browser settings to use Desktop Notifications.");
          const reverted = { ...newSettings, desktopNotifications: false };
          setFocusSettings(reverted);
          localStorage.setItem('daydrive_focus_settings', JSON.stringify(reverted));
        }
      });
    } else if (newSettings.desktopNotifications && Notification.permission === 'denied') {
      alert("Browser notifications are blocked. Please unblock them in your browser settings.");
      const reverted = { ...newSettings, desktopNotifications: false };
      setFocusSettings(reverted);
      localStorage.setItem('daydrive_focus_settings', JSON.stringify(reverted));
    }
  };

  const fetchSettings = async () => {
    const { data } = await api.get('/notification-settings');
    setSettings({
      ...data,
      repeatedOverdueIntervalHr: data.repeatedOverdueIntervalHr || 0
    });
  };

  const handleUpdate = async (newSettings: any) => {
    setSettings(newSettings);
    const payload = {
      ...newSettings,
      repeatedOverdueIntervalHr: newSettings.repeatedOverdueIntervalHr === 0 ? null : newSettings.repeatedOverdueIntervalHr
    };
    await api.patch('/notification-settings', payload);
  };

  const togglePush = async () => {
    if (settings.enableBrowserNotifications) {
      await unsubscribe();
      handleUpdate({ ...settings, enableBrowserNotifications: false });
    } else {
      const success = await subscribe();
      if (success) {
        handleUpdate({ ...settings, enableBrowserNotifications: true });
      } else {
        alert('Please enable notifications in your browser settings.');
      }
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            <SettingsIcon className="text-gray-900" size={28} />
            Settings
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Manage your notifications and preferences.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[15px] text-gray-900">Browser Notifications</h3>
            <p className="text-[13px] text-gray-500 mt-1">Receive push notifications even when the app is closed.</p>
          </div>
          <button 
            onClick={togglePush}
            disabled={!isSupported}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-[13px] ${
              settings.enableBrowserNotifications ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {settings.enableBrowserNotifications ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div className="border-t border-gray-100 pt-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-gray-900">Deadline Reminders</h3>
              <p className="text-[13px] text-gray-500 mt-1">Get notified before a task is due.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.enableDeadlineReminders}
                onChange={(e) => handleUpdate({ ...settings, enableDeadlineReminders: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
          {settings.enableDeadlineReminders && (
            <div className="pl-0">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Remind me before deadline:</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-gray-200 focus:outline-none transition-colors text-[14px] text-gray-900"
                value={settings.reminderBeforeDeadlineMin}
                onChange={(e) => handleUpdate({ ...settings, reminderBeforeDeadlineMin: parseInt(e.target.value) })}
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={1440}>1 day</option>
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-gray-900">Overdue Notifications</h3>
              <p className="text-[13px] text-gray-500 mt-1">Get notified when a task passes its due date.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.enableOverdueNotifications}
                onChange={(e) => handleUpdate({ ...settings, enableOverdueNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
          {settings.enableOverdueNotifications && (
            <div className="pl-0">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Repeated overdue reminders:</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-gray-200 focus:outline-none transition-colors text-[14px] text-gray-900"
                value={settings.repeatedOverdueIntervalHr}
                onChange={(e) => handleUpdate({ ...settings, repeatedOverdueIntervalHr: parseInt(e.target.value) })}
              >
                <option value={0}>Off (Only once when overdue)</option>
                <option value={1}>Every 1 hour</option>
                <option value={3}>Every 3 hours</option>
                <option value={24}>Daily</option>
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-8 space-y-5">
          <div>
            <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Focus Notifications</h3>
            <div className="space-y-4">
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={focusSettings.sessionStarted}
                  onChange={(e) => handleFocusUpdate({ ...focusSettings, sessionStarted: e.target.checked })}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <span className="text-[14px] text-gray-700 group-hover:text-gray-900">Session started</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={focusSettings.sessionEnding}
                  onChange={(e) => handleFocusUpdate({ ...focusSettings, sessionEnding: e.target.checked })}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <span className="text-[14px] text-gray-700 group-hover:text-gray-900">Session ending soon</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={focusSettings.sessionCompleted}
                  onChange={(e) => handleFocusUpdate({ ...focusSettings, sessionCompleted: e.target.checked })}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <span className="text-[14px] text-gray-700 group-hover:text-gray-900">Session completed</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={focusSettings.breakCompleted}
                  onChange={(e) => handleFocusUpdate({ ...focusSettings, breakCompleted: e.target.checked })}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <span className="text-[14px] text-gray-700 group-hover:text-gray-900">Break completed</span>
              </label>

            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Warning before completion</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-gray-200 focus:outline-none transition-colors text-[14px] text-gray-900"
                value={focusSettings.warningBeforeMin}
                onChange={(e) => handleFocusUpdate({ ...focusSettings, warningBeforeMin: parseInt(e.target.value) })}
                disabled={!focusSettings.sessionEnding}
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Sound</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-gray-200 focus:outline-none transition-colors text-[14px] text-gray-900"
                value={focusSettings.sound ? 'on' : 'off'}
                onChange={(e) => handleFocusUpdate({ ...focusSettings, sound: e.target.value === 'on' })}
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <h3 className="font-medium text-[14px] text-gray-900">Desktop notifications</h3>
              <p className="text-[12px] text-gray-500 mt-1">Receive system alerts for focus milestones.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={focusSettings.desktopNotifications}
                onChange={(e) => handleFocusUpdate({ ...focusSettings, desktopNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

        </div>
      </div>
    </div>
  );
};
