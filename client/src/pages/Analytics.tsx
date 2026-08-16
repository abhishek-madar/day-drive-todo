import React, { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { subDays, format, isSameDay, startOfDay } from 'date-fns';
import api from '../api/client';

export const Analytics = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const weeklyGoal = 15;
  const completedThisWeek = completedTasks.filter(t => 
    new Date(t.updatedAt) >= subDays(startOfDay(new Date()), 6)
  ).length;
  const goalPercentage = Math.min(Math.round((completedThisWeek / weeklyGoal) * 100), 100);

  let streak = 0;
  let currentDate = startOfDay(new Date());

  let hasToday = completedTasks.some(t => isSameDay(new Date(t.updatedAt), currentDate));
  
  if (!hasToday) {
    
    currentDate = subDays(currentDate, 1);
    if (completedTasks.some(t => isSameDay(new Date(t.updatedAt), currentDate))) {
      streak++;
      currentDate = subDays(currentDate, 1);
    }
  } else {
    streak++;
    currentDate = subDays(currentDate, 1);
  }

  while (streak > 0) {
    if (completedTasks.some(t => isSameDay(new Date(t.updatedAt), currentDate))) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(startOfDay(new Date()), 6 - i);
    const count = completedTasks.filter(t => isSameDay(new Date(t.updatedAt), date)).length;
    return {
      name: format(date, 'EEE'),
      completed: count
    };
  });

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            <BarChart2 className="text-gray-900" size={28} />
            Analytics
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Track your productivity over time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-[13px] font-medium">Completion Rate</h3>
          <p className="font-numbers text-[32px] font-semibold text-gray-900 mt-2">{completionRate}%</p>
          <div className="text-[13px] md:text-[15px] leading-none whitespace-nowrap select-none mt-4 font-mono">
            <span className="text-gray-900">{'█'.repeat(Math.round((completionRate / 100) * 20))}</span>
            <span className="text-gray-200">{'░'.repeat(20 - Math.round((completionRate / 100) * 20))}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-[13px] font-medium">Weekly Goal</h3>
          <p className="font-numbers text-[32px] font-semibold text-gray-900 mt-2">{completedThisWeek} / {weeklyGoal}</p>
          <div className="text-[13px] md:text-[15px] leading-none whitespace-nowrap select-none mt-4 font-mono">
            <span className="text-blue-500">{'█'.repeat(Math.round((goalPercentage / 100) * 20))}</span>
            <span className="text-gray-200">{'░'.repeat(20 - Math.round((goalPercentage / 100) * 20))}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-[13px] font-medium">Current Streak</h3>
          <p className="font-numbers text-[32px] font-semibold text-gray-900 mt-2">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 pt-8 h-[350px]">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-6 px-2">Tasks Completed (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#111827', fontWeight: 600, fontSize: '13px' }}
              labelStyle={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="completed" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
