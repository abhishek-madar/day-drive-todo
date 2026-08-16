import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, MoreHorizontal, Plus, X, Calendar, Edit2, Archive, Trash2 } from 'lucide-react';
import api from '../api/client';
import { format } from 'date-fns';
import { useTaskModal } from '../context/TaskModalContext';
import { DropdownMenu } from '../components/DropdownMenu';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProjectModal } from '../components/ProjectModal';
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

export const Projects = () => {
  const navigate = useNavigate();
  const { openModal } = useTaskModal();
  const [projects, setProjects] = useState<any[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteProject = async (id: string) => {
    const loadingToast = toast.loading('Deleting project...');
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
      toast.success('Project deleted successfully', { id: loadingToast });
    } catch (error) {
      console.error('Failed to delete project', error);
      toast.error('Failed to delete project', { id: loadingToast });
    }
  };



  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            <FolderOpen className="text-gray-900" size={28} />
            Projects
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">Organize your tasks into workspaces.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[13px] font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {openDropdownId && <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 relative z-20">
        {projects.map((p) => (
          <div 
            key={p.id} 
            onClick={() => navigate(`/projects/${p.id}`)}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all group cursor-pointer relative flex flex-col"
          >
            <div className="absolute top-4 right-4">
              <button 
                className="text-gray-400 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setOpenDropdownId(openDropdownId === p.id ? null : p.id); 
                }}
              >
                <MoreHorizontal size={18} />
              </button>
              
              {openDropdownId === p.id && (
                <DropdownMenu
                  onClose={() => setOpenDropdownId(null)}
                  items={[
                    { label: 'Edit Project', icon: <Edit2 size={14} />, onClick: () => openEditModal(p) },
                    { label: 'Add Task', icon: <Plus size={14} />, onClick: () => openModal(undefined, p.id) },
                    { label: 'Archive Project', icon: <Archive size={14} />, onClick: () => toast.error('Archive not implemented yet') },
                    { label: 'Delete Project', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteConfirmId(p.id) }
                  ]}
                />
              )}
            </div>
            <div 
              className={`w-10 h-10 rounded-xl text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              style={{ backgroundColor: p.color || '#000000' }}
            >
              <FolderOpen size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 text-[16px]">{p.name}</h3>
            
            {p.description && (
              <p className="text-gray-500 text-[13px] mt-2 line-clamp-2">{p.description}</p>
            )}

            <div className="mt-auto pt-4 flex flex-col gap-1.5">
              {p.deadline && (
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400 font-medium">
                  <Calendar size={12} />
                  Due {format(new Date(p.deadline), 'MMM d, yyyy')}
                </div>
              )}
              <p className="text-gray-400 text-[13px]"><span className="font-numbers font-medium text-gray-900">{p._count?.tasks || 0}</span> active tasks</p>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            <FolderOpen className="mx-auto mb-4 text-gray-300" size={48} />
            <p>No projects yet.</p>
          </div>
        )}
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
        initialData={editingProject}
      />

      {deleteConfirmId && (
        <ConfirmModal
          title="Delete Project"
          message="Are you sure you want to delete this project? All associated tasks will be removed from this project but not deleted."
          confirmText="Delete"
          onConfirm={() => {
            handleDeleteProject(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
};
