import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { CheckCircle, Circle, Search, Plus, Filter, ArrowUpDown, LayoutGrid, List as ListIcon, X } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { useTaskModal } from '../context/TaskModalContext';
import { TaskContextMenu } from '../components/TaskContextMenu';

export const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const [openDropdown, setOpenDropdown] = useState<'FILTER' | 'SORT' | 'VIEW' | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [sortOption, setSortOption] = useState<'DEFAULT' | 'PRIORITY' | 'DATE_ASC'>('DEFAULT');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

  const { openModal } = useTaskModal();
  
  const tabs = ['All', 'Today', 'Upcoming', 'Completed', 'Overdue'];

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
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTaskStatus = async (task: any) => {

  };

  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

    if (activeTab === 'Today') {
      if (!t.dueDate) return false;
      return isToday(new Date(t.dueDate)) && t.status !== 'COMPLETED';
    }
    if (activeTab === 'Upcoming') {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return !isPast(due) && !isToday(due) && t.status !== 'COMPLETED';
    }
    if (activeTab === 'Completed') {
      return t.status === 'COMPLETED';
    }
    if (activeTab === 'Overdue') {
      if (!t.dueDate) return false;
      return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'COMPLETED';
    }
    return true;
  });

  const sortTasks = (tasksArr: any[]) => {
    return [...tasksArr].sort((a, b) => {
      if (sortOption === 'PRIORITY') {
        const pOrder: any = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const pA = pOrder[a.priority] || 0;
        const pB = pOrder[b.priority] || 0;
        if (pA !== pB) return pB - pA;
      } else if (sortOption === 'DATE_ASC') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0; 
    });
  };

  const groupedTasks = sortTasks(filteredTasks).reduce((groups: any, task: any) => {
    if (task.status === 'COMPLETED') {
      if (!groups['COMPLETED']) groups['COMPLETED'] = [];
      groups['COMPLETED'].push(task);
      return groups;
    }

    if (!task.dueDate) {
      if (!groups['NO DATE']) groups['NO DATE'] = [];
      groups['NO DATE'].push(task);
      return groups;
    }

    const dueDate = new Date(task.dueDate);

    if (isPast(dueDate) && !isToday(dueDate)) {
      if (!groups['OVERDUE']) groups['OVERDUE'] = [];
      groups['OVERDUE'].push(task);
    } else if (isToday(dueDate)) {
      if (!groups['TODAY']) groups['TODAY'] = [];
      groups['TODAY'].push(task);
    } else if (isTomorrow(dueDate)) {
      if (!groups['TOMORROW']) groups['TOMORROW'] = [];
      groups['TOMORROW'].push(task);
    } else {
      if (!groups['UPCOMING']) groups['UPCOMING'] = [];
      groups['UPCOMING'].push(task);
    }

    return groups;
  }, {});

  const groupOrder = ['OVERDUE', 'TODAY', 'TOMORROW', 'UPCOMING', 'NO DATE', 'COMPLETED'];

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
            My Tasks
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Manage everything you need to get done.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[13px] font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-[14px] focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all shadow-sm"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-medium text-gray-500 font-sans">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-medium text-gray-500 font-sans">K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[13px] font-medium transition-colors whitespace-nowrap border-b-2 relative top-[1px] ${
              activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-8 relative">
        {openDropdown && <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>}

        <div className="relative z-20">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'FILTER' ? null : 'FILTER')}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${priorityFilter !== 'ALL' ? 'text-black' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Filter <Filter size={12} className={priorityFilter !== 'ALL' ? 'text-black' : 'text-gray-400'} />
          </button>
          {openDropdown === 'FILTER' && (
            <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</div>
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                <button 
                  key={p} 
                  onClick={() => { setPriorityFilter(p); setOpenDropdown(null); }}
                  className="w-full text-left px-4 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  {p === 'ALL' ? 'All Priorities' : p}
                  {priorityFilter === p && <CheckCircle size={14} className="text-black" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-20">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'SORT' ? null : 'SORT')}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${sortOption !== 'DEFAULT' ? 'text-black' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Sort <ArrowUpDown size={12} className={sortOption !== 'DEFAULT' ? 'text-black' : 'text-gray-400'} />
          </button>
          {openDropdown === 'SORT' && (
            <div className="absolute left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => { setSortOption('DEFAULT'); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                Default Sort
                {sortOption === 'DEFAULT' && <CheckCircle size={14} className="text-black" />}
              </button>
              <button 
                onClick={() => { setSortOption('PRIORITY'); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                Highest Priority
                {sortOption === 'PRIORITY' && <CheckCircle size={14} className="text-black" />}
              </button>
              <button 
                onClick={() => { setSortOption('DATE_ASC'); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                Due Date (Closest)
                {sortOption === 'DATE_ASC' && <CheckCircle size={14} className="text-black" />}
              </button>
            </div>
          )}
        </div>

        <div className="relative z-20">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'VIEW' ? null : 'VIEW')}
            className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {viewMode === 'LIST' ? <ListIcon size={12} className="text-gray-400" /> : <LayoutGrid size={12} className="text-gray-400" />} 
            {viewMode === 'LIST' ? 'List' : 'Grid'} 
            <span className="text-gray-400 text-[10px]">▾</span>
          </button>
          {openDropdown === 'VIEW' && (
            <div className="absolute left-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => { setViewMode('LIST'); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ListIcon size={14} className="text-gray-400" /> List
              </button>
              <button 
                onClick={() => { setViewMode('GRID'); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <LayoutGrid size={14} className="text-gray-400" /> Grid
              </button>
            </div>
          )}
        </div>

        {(priorityFilter !== 'ALL' || sortOption !== 'DEFAULT') && (
          <button 
            onClick={() => { setPriorityFilter('ALL'); setSortOption('DEFAULT'); }}
            className="ml-auto flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Clear Filters <X size={12} />
          </button>
        )}
      </div>

      <div className="space-y-10">
        {groupOrder.map(groupName => {
          const tasksInGroup = groupedTasks[groupName];
          if (!tasksInGroup || tasksInGroup.length === 0) return null;

          return (
            <div key={groupName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-4">
                <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mb-2">
                  {groupName} <span className="ml-1 text-gray-300 font-medium">({tasksInGroup.length})</span>
                </h3>
                <div className="w-full h-px bg-gray-200"></div>
              </div>

              <div className={viewMode === 'LIST' ? 'flex flex-col gap-1' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2'}>
                {tasksInGroup.map((task: any) => (
                  <div 
                    key={task.id} 
                    className={`group flex ${viewMode === 'LIST' ? 'items-center justify-between p-3 -mx-3' : 'flex-col p-4 bg-white border border-gray-100 shadow-sm'} rounded-2xl transition-colors hover:bg-white hover:shadow-sm ${task.status === 'COMPLETED' ? 'opacity-75 bg-white/40' : ''}`}
                  >
                    <div className={`flex items-start gap-4 overflow-hidden w-full ${viewMode === 'GRID' && 'mb-4'}`}>
                      <button onClick={async () => {
                        const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                        await api.patch(`/tasks/${task.id}`, { status: newStatus });
                        fetchTasks();
                      }} className={`mt-0.5 shrink-0 transition-colors ${task.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}>
                        {task.status === 'COMPLETED' ? <CheckCircle size={18} className="fill-gray-200" /> : <Circle size={18} />}
                      </button>
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-[14px] font-semibold truncate ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'} ${viewMode === 'GRID' && 'whitespace-normal'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-gray-500 font-medium truncate">
                          {task.project?.name && (
                            <>
                              <span className="truncate max-w-[100px]">{task.project.name}</span>
                              <span>·</span>
                            </>
                          )}
                          <span>
                            {task.dueDate 
                              ? format(new Date(task.dueDate), isToday(new Date(task.dueDate)) ? "'Today'" : isTomorrow(new Date(task.dueDate)) ? "'Tomorrow'" : "MMM d") 
                              : 'No date'}
                          </span>
                          {task.dueDate && (
                            <>
                              <span>·</span>
                              <span className="font-numbers">{format(new Date(task.dueDate), 'h:mm a')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative ${viewMode === 'LIST' ? 'gap-4 pl-4' : 'justify-between w-full mt-auto'}`}>
                      {task.status !== 'COMPLETED' && task.priority && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          task.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                          task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                      
                      <TaskContextMenu 
                        taskId={task.id} 
                        status={task.status} 
                        onUpdate={fetchTasks} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <CheckCircle className="text-gray-300" size={24} />
            </div>
            <h3 className="text-[14px] font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-[13px] text-gray-500">You're all caught up! Enjoy your day.</p>
          </div>
        )}
      </div>
    </div>
  );
};
