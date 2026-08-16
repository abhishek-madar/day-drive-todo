import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday
} from 'date-fns';
import api from '../api/client';
import { useTaskModal } from '../context/TaskModalContext';

export const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const { openModal } = useTaskModal();

  useEffect(() => {
    fetchData();
    const handleDataAdded = () => fetchData();
    window.addEventListener('task-added', handleDataAdded);
    window.addEventListener('project-added', handleDataAdded);
    return () => {
      window.removeEventListener('task-added', handleDataAdded);
      window.removeEventListener('project-added', handleDataAdded);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects')
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Failed to fetch calendar data', error);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            <CalendarIcon className="text-gray-900" size={28} />
            Calendar
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Your schedule at a glance.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-[14px] font-medium text-gray-900 min-w-[120px] text-center font-numbers">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[13px] font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm">
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {weekDays.map(day => (
                <div key={day} className="py-3 text-center text-[12px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayTasks = tasks.filter(t => {
                  const dateToUse = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
                  return isSameDay(dateToUse, day);
                });
                const dayProjects = projects.filter(p => {
                  return p.dueDate && isSameDay(new Date(p.dueDate), day);
                });

                return (
                  <div 
                    key={day.toString()} 
                    onClick={() => openModal(day)}
                    className={`min-h-[120px] border-b border-r border-gray-100 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !isSameMonth(day, currentMonth) ? 'bg-gray-50/30 text-gray-400' : 'bg-white text-gray-900'
                    } ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                  >
                    <div className="flex justify-end">
                      <span className={`text-[13px] font-numbers font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-black text-white' : ''}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-col gap-1.5 overflow-y-auto max-h-[85px] scrollbar-hide pr-1">
                      {dayProjects.map(project => {
                        const baseColor = project.color || '#111827'; 
                        return (
                          <div 
                            key={`proj-${project.id}`} 
                            className="text-[10px] p-1.5 rounded-md border leading-tight flex flex-col gap-0.5 shadow-sm transition-all hover:-translate-y-px text-white"
                            style={{ backgroundColor: baseColor, borderColor: baseColor }}
                          >
                            <div className="font-semibold truncate">
                              {project.name}
                            </div>
                            <div className="flex items-center justify-between opacity-90 text-[9px] tracking-wide">
                               <span className="font-medium uppercase tracking-widest">Project Due</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {dayTasks.map(task => {
                        const isCompleted = task.status === 'COMPLETED';
                        const isOverdue = task.status === 'OVERDUE';

                        let baseColor = '#6b7280'; 
                        if (task.project?.color) {
                          baseColor = task.project.color;
                        } else if (isOverdue) {
                          baseColor = '#ef4444'; 
                        } else if (task.priority === 'HIGH') {
                          baseColor = '#f97316'; 
                        }

                        let customStyle: React.CSSProperties = {
                          backgroundColor: `${baseColor}15`, 
                          borderColor: `${baseColor}40`,     
                          color: baseColor
                        };

                        if (isCompleted) {
                          customStyle = {
                            backgroundColor: '#f9fafb',
                            borderColor: 'transparent',
                            color: '#9ca3af'
                          };
                        }

                        return (
                          <div 
                            key={task.id} 
                            className={`text-[10px] p-1.5 rounded-md border leading-tight flex flex-col gap-0.5 shadow-sm transition-all hover:-translate-y-px`}
                            style={customStyle}
                          >
                            <div className={`font-semibold truncate ${isCompleted ? 'line-through opacity-70' : ''}`}>
                              {task.title}
                            </div>
                            <div className="flex items-center justify-between opacity-80 text-[9px] tracking-wide">
                               <span className="truncate max-w-[60%] font-medium">{task.project?.name || 'Inbox'}</span>
                               <span className="font-numbers capitalize font-medium">{task.status.toLowerCase()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
