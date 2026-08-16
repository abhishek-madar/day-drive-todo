import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Tag, Folder, Bell, CheckCircle } from 'lucide-react';
import { useTaskModal } from '../context/TaskModalContext';
import api from '../api/client';
import { format } from 'date-fns';

export const AddTaskModal = ({ onTaskAdded }: { onTaskAdded?: () => void }) => {
  const { isOpen, closeModal, defaultDate, defaultProjectId } = useTaskModal();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [description, setDescription] = useState('');

  const [projectId, setProjectId] = useState<string>('');
  const [reminder, setReminder] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState<'PROJECT' | 'REMINDER' | 'TIME' | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  };

  const getUpcomingTime = () => {
    const now = new Date();
    let startHour = now.getHours();
    let startMin = now.getMinutes() > 30 ? 60 : 30;
    
    if (startMin === 60) {
      startHour += 1;
      startMin = 0;
    }
    
    if (startHour >= 24) return '23:30';
    
    const hh = startHour.toString().padStart(2, '0');
    const mm = startMin.toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      let defaultD = todayStr;
      
      if (defaultDate) {
        try {
          defaultD = format(new Date(defaultDate), 'yyyy-MM-dd');
        } catch (error) {}
      }
      
      setDueDate(defaultD);
      
      const slots = generateTimeSlots();
      setAvailableTimes(slots);

      if (defaultD === todayStr) {
        setDueTime(getUpcomingTime());
      } else {
        setDueTime('12:00');
      }
      
      setPriority('MEDIUM');
      setTitle('');
      setDescription('');

      if (defaultProjectId) {
        setProjectId(defaultProjectId);
        setShowMoreOptions(true);
      } else {
        setProjectId('');
        setShowMoreOptions(false);
      }
      
      setReminder('');
      setTags([]);
      fetchProjects();
    }
  }, [isOpen, defaultDate, defaultProjectId]);

  useEffect(() => {
    if (dueDate) {
      const slots = generateTimeSlots();
      setAvailableTimes(slots);
      if (!slots.includes(dueTime)) {
        setDueTime(slots[0]);
      }
    }
  }, [dueDate]);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter') || e.type === 'blur') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    let finalDueDate = undefined;
    if (dueDate) {
      const timeString = dueTime || '12:00';
      finalDueDate = new Date(`${dueDate}T${timeString}:00`).toISOString();
    }

    try {
      await api.post('/tasks', {
        title,
        description: description || undefined,
        priority,
        dueDate: finalDueDate,
        projectId: projectId || undefined,
        
      });
      closeModal();
      if (onTaskAdded) onTaskAdded();
      window.dispatchEvent(new Event('task-added'));
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      
      {openDropdown && <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>}

      <div className="bg-[#f7f7f5] w-full max-w-[500px] rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative z-20">

        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white">
          <h2 className="text-[16px] font-semibold text-gray-900">Create New Task</h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          
          <div className="mb-6">
            <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Task</label>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-[16px] font-medium bg-transparent border-none placeholder:text-gray-400 focus:outline-none text-gray-900 p-0"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Due Date</label>
              <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 shadow-sm relative overflow-hidden flex items-center gap-2 text-gray-600 focus-within:border-gray-400 transition-colors cursor-pointer">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-[13px] font-medium p-0 text-gray-900"
                />
              </div>
            </div>
            <div className="flex-1 relative z-30">
              <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Due Time</label>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'TIME' ? null : 'TIME')}
                className="w-full bg-white rounded-xl border border-gray-200 px-3 py-2.5 shadow-sm flex items-center justify-between text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <span className="text-[13px] font-medium text-gray-900">
                    {dueTime ? format(new Date(`2000-01-01T${dueTime}:00`), 'h:mm a') : 'Add time'}
                  </span>
                </div>
                <span className="text-gray-400 text-[10px]">▾</span>
              </button>
              
              {openDropdown === 'TIME' && (
                <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-200">
                  {availableTimes.map(time => (
                    <button 
                      key={time}
                      type="button"
                      onClick={() => { setDueTime(time); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      {format(new Date(`2000-01-01T${time}:00`), 'h:mm a')}
                      {dueTime === time && <CheckCircle size={14} className="text-black shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Priority</label>
            <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 text-[12px] font-bold tracking-wide rounded-lg transition-all ${
                    priority === p 
                      ? (p === 'HIGH' ? 'bg-red-50 text-red-600 shadow-sm' : 
                         p === 'MEDIUM' ? 'bg-orange-50 text-orange-600 shadow-sm' : 
                         'bg-green-50 text-green-600 shadow-sm')
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {p === 'LOW' ? 'Low' : p === 'MEDIUM' ? 'Medium' : 'High'}
                </button>
              ))}
            </div>
          </div>

          {!showMoreOptions && (
            <button 
              type="button" 
              onClick={() => setShowMoreOptions(true)}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6 flex items-center gap-1"
            >
              + More options
            </button>
          )}

          {showMoreOptions && (
            <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <textarea
                  placeholder="Description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-[13px] bg-transparent border-none placeholder:text-gray-400 focus:outline-none focus:ring-0 text-gray-700 p-0 resize-none min-h-[60px]"
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                
                <div className="flex items-center justify-between p-3 relative">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                    <Folder size={14} className="text-gray-400" /> Project
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'PROJECT' ? null : 'PROJECT')}
                    className="text-[13px] font-medium text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 flex items-center gap-1 hover:bg-gray-100 transition-colors"
                  >
                    {projectId ? projects.find(p => p.id === projectId)?.name : 'None'} <span className="text-gray-400 text-[10px]">▾</span>
                  </button>
                  {openDropdown === 'PROJECT' && (
                    <div className="absolute right-3 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        type="button"
                        onClick={() => { setProjectId(''); setOpenDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        None {!projectId && <CheckCircle size={14} className="text-black" />}
                      </button>
                      {projects.map(p => (
                        <button 
                          key={p.id}
                          type="button"
                          onClick={() => { setProjectId(p.id); setOpenDropdown(null); }}
                          className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span className="truncate pr-2">{p.name}</span>
                          {projectId === p.id && <CheckCircle size={14} className="text-black shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 relative">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                    <Bell size={14} className="text-gray-400" /> Reminder
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'REMINDER' ? null : 'REMINDER')}
                    className="text-[13px] font-medium text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 flex items-center gap-1 hover:bg-gray-100 transition-colors"
                  >
                    {reminder ? `${reminder}m before` : 'None'} <span className="text-gray-400 text-[10px]">▾</span>
                  </button>
                  {openDropdown === 'REMINDER' && (
                    <div className="absolute right-3 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        type="button"
                        onClick={() => { setReminder(''); setOpenDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        None {!reminder && <CheckCircle size={14} className="text-black" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setReminder('15'); setOpenDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        15 minutes before {reminder === '15' && <CheckCircle size={14} className="text-black" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setReminder('30'); setOpenDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        30 minutes before {reminder === '30' && <CheckCircle size={14} className="text-black" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setReminder('60'); setOpenDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        1 hour before {reminder === '60' && <CheckCircle size={14} className="text-black" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 min-h-[48px]">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium shrink-0">
                    <Tag size={14} className="text-gray-400" /> Tags
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-2 justify-end">
                    {tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[11px] font-medium flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-gray-900"><X size={10}/></button>
                      </span>
                    ))}
                    {isAddingTag ? (
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        onBlur={handleAddTag}
                        placeholder="Tag name..."
                        className="w-24 text-[12px] text-gray-900 placeholder:text-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0"
                        autoFocus
                      />
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setIsAddingTag(true)}
                        className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        + Add tags
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!title}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] shadow-md"
            >
              Create Task <span className="font-sans">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
