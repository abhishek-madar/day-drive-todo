import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderOpen, ArrowLeft, MoreHorizontal, Calendar, Search, Plus, Circle, CheckCircle2, MoreVertical, Clock } from 'lucide-react';
import api from '../api/client';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { useTaskModal } from '../context/TaskModalContext';
import { DropdownMenu } from '../components/DropdownMenu';
import { ConfirmModal } from '../components/ConfirmModal';
import { TaskContextMenu } from '../components/TaskContextMenu';
import { ProjectModal } from '../components/ProjectModal';
import toast from 'react-hot-toast';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openModal } = useTaskModal();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed' | 'Overdue'>('All');
  
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProjectDetails();

    const handleTaskAdded = () => {
      fetchProjectDetails();
    };

    window.addEventListener('task-added', handleTaskAdded);
    return () => window.removeEventListener('task-added', handleTaskAdded);
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch (error) {
      console.error('Failed to fetch project details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      fetchProjectDetails(); 
    } catch (error) {
      console.error('Failed to toggle task', error);
    }
  };

  const handleDeleteProject = async () => {
    const loadingToast = toast.loading('Deleting project...');
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted', { id: loadingToast });
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project', { id: loadingToast });
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-gray-400">Loading project details...</div>;
  }

  if (!project) {
    return <div className="p-8 flex flex-col items-center justify-center text-gray-500 h-full gap-4">
      <FolderOpen size={48} className="text-gray-300" />
      <p>Project not found.</p>
      <button onClick={() => navigate('/projects')} className="text-black font-medium text-[14px] hover:underline">Go back</button>
    </div>;
  }

  const allTasks = project.tasks || [];
  const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED');
  const totalCount = allTasks.length;
  const completedCount = completedTasks.length;
  const remainingCount = totalCount - completedCount;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  let filteredTasks = allTasks.filter((t: any) => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (filter === 'Active') {
    filteredTasks = filteredTasks.filter((t: any) => t.status !== 'COMPLETED');
  } else if (filter === 'Completed') {
    filteredTasks = filteredTasks.filter((t: any) => t.status === 'COMPLETED');
  } else if (filter === 'Overdue') {
    filteredTasks = filteredTasks.filter((t: any) => t.status !== 'COMPLETED' && t.dueDate && isPast(new Date(t.dueDate)));
  }

  const groups: Record<string, any[]> = {
    'TODAY': [],
    'TOMORROW': [],
    'UPCOMING': [],
    'OVERDUE': [],
    'COMPLETED': [],
    'NO DATE': []
  };

  filteredTasks.forEach((t: any) => {
    if (t.status === 'COMPLETED') {
      groups['COMPLETED'].push(t);
      return;
    }
    
    if (!t.dueDate) {
      groups['NO DATE'].push(t);
      return;
    }

    const date = new Date(t.dueDate);
    if (isPast(date) && !isToday(date)) {
      groups['OVERDUE'].push(t);
    } else if (isToday(date)) {
      groups['TODAY'].push(t);
    } else if (isTomorrow(date)) {
      groups['TOMORROW'].push(t);
    } else {
      groups['UPCOMING'].push(t);
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> Projects
      </button>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div 
              className="w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-md"
              style={{ backgroundColor: project.color || '#000000' }}
            >
              <FolderOpen size={28} />
            </div>
            
            <div>
              <h1 className="text-[32px] font-bold text-gray-900 tracking-tight leading-tight">{project.name}</h1>
              {project.description && (
                <p className="text-[15px] text-gray-500 mt-2 max-w-2xl leading-relaxed">{project.description}</p>
              )}
            </div>

            {project.deadline && (
              <div className="flex items-center gap-2 text-[14px] text-gray-600 font-medium mt-2 bg-gray-50 w-max px-3 py-1.5 rounded-full">
                <Calendar size={16} className="text-gray-400" />
                Due {format(new Date(project.deadline), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          <div className="relative inline-block shrink-0 order-first sm:order-none self-end sm:self-start">
            <button 
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              className="flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full"
            >
              Project Options <MoreHorizontal size={14} />
            </button>

            {isProjectMenuOpen && (
              <DropdownMenu
                onClose={() => setIsProjectMenuOpen(false)}
                items={[
                  { label: 'Edit Project', onClick: () => setIsEditModalOpen(true) },
                  { label: 'Add Task', onClick: () => openModal(undefined, project.id) },
                  { label: 'Archive Project', onClick: () => toast.error('Archive not implemented') },
                  { label: 'Delete Project', danger: true, onClick: () => setShowDeleteConfirm(true) },
                ]}
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm font-mono text-gray-900">
        <div className="flex items-center justify-between text-[14px] md:text-[15px] tracking-wide mb-6 text-gray-500">
          <span>{totalCount} Tasks</span>
          <span>{completedCount} Completed</span>
          <span>{remainingCount} Remaining</span>
        </div>
        
        <div className="flex items-center w-full mt-2 text-[16px] md:text-[20px] leading-none select-none text-gray-900">
          {progressPercent > 0 && (
            <div 
              className="overflow-hidden whitespace-nowrap text-gray-900 min-w-0"
              style={{ flexGrow: progressPercent, flexBasis: 0 }}
            >
              {'█'.repeat(200)}
            </div>
          )}
          <span className={`font-semibold text-gray-900 shrink-0 mt-0.5 ${progressPercent === 0 ? 'mr-3' : progressPercent === 100 ? 'ml-3' : 'mx-3'}`}>
            {progressPercent}%
          </span>
          {progressPercent < 100 && (
            <div 
              className="overflow-hidden whitespace-nowrap text-gray-200 min-w-0 mt-0.5"
              style={{ flexGrow: 100 - progressPercent, flexBasis: 0 }}
            >
              {'░'.repeat(200)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-gray-900">Tasks</h2>
          <button onClick={() => openModal(undefined, project.id)} className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[13px] font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm">
            <Plus size={16} /> Add Task
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
            {['All', 'Active', 'Completed', 'Overdue'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8 pt-4">
          {Object.entries(groups).filter(([_, list]) => list.length > 0).map(([groupName, list]) => (
            <div key={groupName} className="space-y-3">
              <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase pb-2 border-b border-gray-100">
                {groupName}
              </h3>
              
              <div className="space-y-2">
                {list.map(task => (
                  <div key={task.id} className="group flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <button 
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="mt-0.5 shrink-0 text-gray-300 hover:text-gray-900 transition-colors"
                    >
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 size={20} className="text-gray-900 fill-gray-900 stroke-white" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-[15px] font-medium truncate ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-1 text-[12px]">
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 font-medium ${
                            task.status === 'COMPLETED' ? 'text-gray-400' :
                            isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) ? 'text-red-500' : 
                            'text-gray-500'
                          }`}>
                            <Clock size={12} />
                            {isToday(new Date(task.dueDate)) ? 'Today' : 
                             isTomorrow(new Date(task.dueDate)) ? 'Tomorrow' : 
                             format(new Date(task.dueDate), 'MMM d')} 
                            {' · '}
                            {format(new Date(task.dueDate), 'h:mm a')}
                          </span>
                        )}
                        
                        <span className={`font-bold tracking-wide uppercase text-[10px] ${
                          task.priority === 'HIGH' ? 'text-red-500' :
                          task.priority === 'MEDIUM' ? 'text-orange-500' :
                          'text-blue-500'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <TaskContextMenu 
                      taskId={task.id} 
                      status={task.status} 
                      onUpdate={fetchProjectDetails} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-[14px]">
              No tasks found in this project.
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Project"
          message="Are you sure you want to delete this project? All associated tasks will be removed from this project but not deleted."
          confirmText="Delete"
          onConfirm={() => {
            handleDeleteProject();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <ProjectModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchProjectDetails} 
        initialData={project} 
      />
    </div>
  );
};
