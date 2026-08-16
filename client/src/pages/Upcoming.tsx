import React, { useState, useEffect } from 'react';
import { CalendarDays, Circle } from 'lucide-react';
import { format, isAfter, startOfToday } from 'date-fns';
import api from '../api/client';

export const Upcoming = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();

    const handleTaskAdded = () => fetchTasks();
    window.addEventListener('task-added', handleTaskAdded);
    return () => window.removeEventListener('task-added', handleTaskAdded);
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    await api.patch(`/tasks/${task.id}`, { status: newStatus });
    fetchTasks();
  };

  const upcomingTasks = tasks
    .filter(t => t.dueDate && isAfter(new Date(t.dueDate), startOfToday()) && t.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            <CalendarDays className="text-gray-900" size={28} />
            Upcoming
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Look ahead and plan your week.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        {upcomingTasks.map((task, i) => (
          <div key={task.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-black mt-1.5"></div>
              {i < upcomingTasks.length - 1 && <div className="w-px h-full min-h-[40px] bg-gray-100 mt-2"></div>}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleTaskStatus(task)} className="text-gray-300 hover:text-gray-900 transition-colors">
                  <Circle size={18} />
                </button>
                <h3 className="text-[15px] font-medium text-gray-900">{task.title}</h3>
              </div>
              <p className="text-[13px] text-gray-500 mt-1 ml-8"><span className="font-numbers">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span></p>
            </div>
          </div>
        ))}
        {upcomingTasks.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <CalendarDays className="mx-auto mb-4 text-gray-300" size={48} />
            <p>No upcoming tasks scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
};
