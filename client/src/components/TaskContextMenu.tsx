import React, { useState } from 'react';
import { MoreVertical, Edit2, CheckCircle2, Circle, AlertCircle, Copy, Trash2, FolderOpen } from 'lucide-react';
import { DropdownMenu } from './DropdownMenu';
import { ConfirmModal } from './ConfirmModal';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useTaskModal } from '../context/TaskModalContext';

interface TaskContextMenuProps {
  taskId: string;
  status: string;
  onUpdate: () => void;
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({ taskId, status, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { openModal } = useTaskModal();

  const handleToggleStatus = async () => {
    const newStatus = status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const loadingToast = toast.loading(newStatus === 'COMPLETED' ? 'Completing task...' : 'Reopening task...');
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      onUpdate();
      toast.success(`Task ${newStatus === 'COMPLETED' ? 'completed' : 'reopened'}`, { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update task', { id: loadingToast });
    }
  };

  const handleChangePriority = async (priority: string) => {
    const loadingToast = toast.loading('Updating priority...');
    try {
      await api.patch(`/tasks/${taskId}`, { priority });
      onUpdate();
      toast.success(`Priority set to ${priority.toLowerCase()}`, { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update priority', { id: loadingToast });
    }
  };

  const handleDelete = async () => {
    const loadingToast = toast.loading('Deleting task...');
    try {
      await api.delete(`/tasks/${taskId}`);
      onUpdate();
      toast.success('Task deleted', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to delete task', { id: loadingToast });
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <DropdownMenu
          onClose={() => setIsOpen(false)}
          items={[
            { label: 'Edit Task', icon: <Edit2 size={14} />, onClick: () => { toast.error('Edit task not fully implemented yet'); } },
            { 
              label: status === 'COMPLETED' ? 'Uncomplete' : 'Complete', 
              icon: status === 'COMPLETED' ? <Circle size={14} /> : <CheckCircle2 size={14} />, 
              onClick: handleToggleStatus 
            },
            { label: 'High Priority', icon: <AlertCircle size={14} className="text-red-500" />, onClick: () => handleChangePriority('HIGH') },
            { label: 'Medium Priority', icon: <AlertCircle size={14} className="text-orange-500" />, onClick: () => handleChangePriority('MEDIUM') },
            { label: 'Low Priority', icon: <AlertCircle size={14} className="text-blue-500" />, onClick: () => handleChangePriority('LOW') },
            { label: 'Move to Project', icon: <FolderOpen size={14} />, onClick: () => toast.error('Move to project not implemented') },
            { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => toast.error('Duplicate not implemented') },
            { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setShowDeleteConfirm(true) },
          ]}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            handleDelete();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};
