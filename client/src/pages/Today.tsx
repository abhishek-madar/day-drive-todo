import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { CheckCircle, Circle, Sun, Plus } from 'lucide-react';
import { isSameDay, startOfToday } from 'date-fns';
import { useTaskModal } from '../context/TaskModalContext';

export const Today = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const { openModal } = useTaskModal();
  
  useEffect(() => {
    fetchTasks();
    const handleTaskAdded = () => fetchTasks();
    window.addEventListener('task-added', handleTaskAdded);
    return () => window.removeEventListener('task-added', handleTaskAdded);
  }, []);

  const fetchTasks = async () => {
    const { data } = await api.get('/tasks');
    setTasks(data);
  };

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    await api.patch(`/tasks/${task.id}`, { status: newStatus });
    fetchTasks();
  };

  const todayTasks = tasks.filter(t => 
    t.status !== 'COMPLETED' && 
    t.dueDate && 
    isSameDay(new Date(t.dueDate), startOfToday())
  );

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            <Sun className="text-yellow-500" size={28} />
            Today
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Make today count.</p>
        </div>
        <button 
          onClick={() => openModal(startOfToday())}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[13px] font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col">
          {todayTasks.map(task => (
            <div key={task.id} className="flex items-start gap-4 p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group cursor-pointer">
              <button onClick={() => toggleTaskStatus(task)} className="mt-0.5 text-gray-300 hover:text-gray-900 transition-colors">
                <Circle size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[14px] text-gray-900 truncate">
                  {task.title}
                </h3>
              </div>
              {task.priority === 'HIGH' && (
                <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-[11px] font-semibold tracking-wide">
                  High
                </span>
              )}
            </div>
          ))}
          {todayTasks.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <Sun size={48} className="text-yellow-400 opacity-50" />
              <p className="text-gray-500 text-[14px]">You have no tasks remaining for today!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
