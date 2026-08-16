import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import api from '../api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PROJECT_COLORS = [
  '#000000', 
  '#ef4444', 
  '#f97316', 
  '#eab308', 
  '#22c55e', 
  '#3b82f6', 
  '#6366f1', 
  '#a855f7', 
  '#ec4899', 
];

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // If provided, we are editing
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#000000');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setColor(initialData.color || '#000000');
        if (initialData.deadline) {
          setDeadline(format(new Date(initialData.deadline), 'yyyy-MM-dd'));
        } else {
          setDeadline('');
        }
      } else {
        setName('');
        setDescription('');
        setColor('#000000');
        setDeadline('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const loadingToast = toast.loading(initialData ? 'Updating project...' : 'Creating project...');
    
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        deadline: deadline ? new Date(deadline).toISOString() : undefined
      };

      if (initialData) {
        await api.patch(`/projects/${initialData.id}`, payload);
        toast.success('Project updated', { id: loadingToast });
      } else {
        await api.post('/projects', payload);
        toast.success('Project created', { id: loadingToast });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save project', error);
      toast.error('Failed to save project', { id: loadingToast });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#f7f7f5] w-full max-w-[500px] rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-start justify-between p-6 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-[18px] font-semibold text-gray-900 leading-tight mb-1">
              {initialData ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-[13px] text-gray-500">
              {initialData ? 'Update your workspace details.' : 'Organize your tasks into a focused workspace.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full mt-1">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div>
            <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Project Name</label>
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
              <input
                type="text"
                placeholder="e.g. Portfolio Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-[14px] font-medium bg-transparent border-none placeholder:text-gray-400 focus:outline-none text-gray-900 p-0"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Description</label>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all">
              <textarea
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-[14px] bg-transparent border-none placeholder:text-gray-400 focus:outline-none focus:ring-0 text-gray-700 p-0 resize-none min-h-[70px]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Project Color</label>
            <div className="flex flex-wrap items-center gap-3">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 tracking-widest uppercase block mb-3">Deadline</label>
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 shadow-sm relative overflow-hidden flex items-center gap-2 text-gray-600 focus-within:border-gray-400 transition-colors cursor-pointer w-full">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[14px] font-medium p-0 text-gray-900 absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="text-[14px] font-medium text-gray-900">
                {deadline ? format(new Date(deadline), 'MMM d, yyyy') : 'Select deadline'}
              </span>
              <span className="ml-auto text-gray-400 text-[10px]">▾</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors text-[14px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[14px] shadow-md"
            >
              {initialData ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
