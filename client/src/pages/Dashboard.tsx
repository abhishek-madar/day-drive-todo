import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  CheckCircle, Circle, Search, Plus, Bell, MoreHorizontal, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTaskModal } from '../context/TaskModalContext';
import { NotificationBell } from '../components/NotificationBell';
import { TaskContextMenu } from '../components/TaskContextMenu';

export const Dashboard = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
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

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    
    const data = {
      title: newTaskTitle,
      dueDate: new Date().toISOString(), 
      priority: 'MEDIUM'
    };

    await api.post('/tasks', data);
    setNewTaskTitle('');
    fetchTasks();
  };

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    await api.patch(`/tasks/${task.id}`, { status: newStatus });
    fetchTasks();
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter(t => t.status === 'OVERDUE').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const todayTasks = tasks.filter(t => t.status !== 'OVERDUE' && t.status !== 'COMPLETED').slice(0, 5);
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').slice(0, 3);
  const upcomingTasks = tasks
    .filter(t => t.status !== 'OVERDUE' && t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);
    
  const recentActivity = tasks
    .filter(t => t.status === 'COMPLETED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 pb-12">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
            {getGreeting()}
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Here's what needs your attention today.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-gray-200 w-48 transition-all"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={18} />
          </button>
          <NotificationBell />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-1 transition-transform cursor-pointer">
          <span className="text-[13px] font-medium text-gray-500">Tasks</span>
          <span className="font-numbers text-[32px] font-semibold text-gray-900 leading-none">{totalTasks}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-1 transition-transform cursor-pointer">
          <span className="text-[13px] font-medium text-gray-500">Done</span>
          <span className="font-numbers text-[32px] font-semibold text-gray-900 leading-none">{doneTasks}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-1 transition-transform cursor-pointer">
          <span className="text-[13px] font-medium text-gray-500">Progress</span>
          <div className="flex items-end gap-2">
            <span className="font-numbers text-[32px] font-semibold text-gray-900 leading-none">{progress}%</span>
          </div>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between h-28 hover:-translate-y-1 transition-transform cursor-pointer">
          <span className="text-[13px] font-medium text-red-600">Overdue</span>
          <span className="font-numbers text-[32px] font-semibold text-red-600 leading-none">{overdueTasks}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-bold tracking-widest text-gray-400 uppercase">Today</h2>
            <button className="text-gray-400 hover:text-gray-900 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <form onSubmit={addTask} className="border-b border-gray-50 p-2 flex items-center bg-gray-50/50">
              <button type="submit" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900">
                <Plus size={18} />
              </button>
              <input 
                type="text" 
                placeholder="Quick add task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none text-[14px] px-2 py-2"
              />
            </form>

            <div className="flex flex-col">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-start gap-4 p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                  <button onClick={() => toggleTaskStatus(task)} className="mt-0.5 text-gray-300 hover:text-gray-900 transition-colors">
                    <Circle size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-[14px] truncate">{task.title}</h3>
                    <p className="text-[12px] text-gray-500 mt-1">Today &middot; {task.priority}</p>
                  </div>
                  {task.priority === 'HIGH' && (
                    <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-[11px] font-semibold tracking-wide">
                      High
                    </span>
                  )}
                  {task.priority === 'MEDIUM' && (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-semibold tracking-wide">
                      Medium
                    </span>
                  )}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <TaskContextMenu 
                      taskId={task.id} 
                      status={task.status} 
                      onUpdate={fetchTasks} 
                    />
                  </div>
                </div>
              ))}
              
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-start gap-4 p-4 border-b border-gray-50 opacity-60">
                  <button onClick={() => toggleTaskStatus(task)} className="mt-0.5 text-gray-900">
                    <CheckCircle size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-500 text-[14px] truncate line-through">{task.title}</h3>
                    <p className="text-[12px] text-gray-400 mt-1">Done</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <TaskContextMenu 
                      taskId={task.id} 
                      status={task.status} 
                      onUpdate={fetchTasks} 
                    />
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-[14px]">
                  No tasks left for today! You're all caught up.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[12px] font-bold tracking-widest text-gray-400 uppercase">Upcoming</h2>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                {upcomingTasks.map((task, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-[13px] font-medium text-gray-900">{task.title}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">{new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {upcomingTasks.length === 0 && (
                  <p className="text-[12px] text-gray-500 text-center py-2">No upcoming tasks.</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[12px] font-bold tracking-widest text-gray-400 uppercase">Overdue</h2>
              </div>
              <div className="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-5 flex items-center justify-between cursor-pointer hover:bg-red-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-500" />
                  <span className="font-medium text-red-900 text-[14px]">Attention Needed</span>
                </div>
                <span className="font-semibold text-red-600 text-[14px]">{overdueTasks} Tasks</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
