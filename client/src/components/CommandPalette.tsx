import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderOpen, CheckSquare, X } from 'lucide-react';
import api from '../api/client';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tasks: any[], projects: any[] }>({ tasks: [], projects: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ tasks: [], projects: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], projects: [] });
      return;
    }
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceId = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceId);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-gray-900/40 backdrop-blur-sm pt-24 px-4" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-gray-100">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks and projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 py-4 bg-transparent border-none focus:outline-none text-[15px] font-medium text-gray-900 placeholder:text-gray-400"
          />
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 rounded-md">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
          {isLoading && (
            <div className="p-8 text-center text-[13px] text-gray-500 font-medium">Searching...</div>
          )}
          
          {!isLoading && query && results.projects.length === 0 && results.tasks.length === 0 && (
            <div className="p-8 text-center text-[13px] text-gray-500 font-medium">No results found for "{query}"</div>
          )}

          {!isLoading && results.projects.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Projects</div>
              {results.projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => { setIsOpen(false); navigate(`/projects/${project.id}`); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: project.color || '#000' }}>
                    <FolderOpen size={16} />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-[14px] font-semibold text-gray-900">{project.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && results.tasks.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tasks</div>
              {results.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => { setIsOpen(false); navigate('/tasks'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <CheckSquare size={16} />
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-[14px] font-semibold text-gray-900">{task.title}</div>
                    {task.project && <div className="text-[12px] text-gray-500">{task.project.name}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!query && (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 text-gray-400 mb-3">
                <Search size={20} />
              </div>
              <p className="text-[13px] text-gray-500 font-medium">Type to search across Day Drive</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
