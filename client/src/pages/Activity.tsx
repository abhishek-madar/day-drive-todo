import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { Activity as ActivityIcon, Check, Plus, AlertTriangle, Bell, Edit2 } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';

type ActivityType = 'CREATED' | 'COMPLETED' | 'OVERDUE' | 'UPDATED' | 'REMINDER';

interface ActivityItem {
  id: string;
  type: string;
  createdAt: string;
  task: any | null;
  project: any | null;
}

function useOnScreen(ref: React.RefObject<Element>, rootMargin = '-10% 0px -10% 0px') {
  const [isIntersecting, setIntersecting] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
        } else {
          setIntersecting(false);
        }
      },
      { rootMargin, threshold: 0.1 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  
  return isIntersecting;
}

const ActivityCard = ({ activity }: { activity: ActivityItem }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  const getIcon = () => {
    switch (activity.type) {
      case 'COMPLETED': return <Check size={12} strokeWidth={3} />;
      case 'CREATED': return <Plus size={12} strokeWidth={3} />;
      case 'OVERDUE': return <AlertTriangle size={12} strokeWidth={3} />;
      case 'UPDATED': return <Edit2 size={12} strokeWidth={3} />;
      case 'REMINDER': return <Bell size={12} strokeWidth={3} />;
      default: return <Check size={12} strokeWidth={3} />;
    }
  };

  const getColors = () => {
    switch (activity.type) {
      case 'COMPLETED': return { bg: 'bg-green-500', text: 'text-green-700' };
      case 'CREATED': return { bg: 'bg-blue-500', text: 'text-blue-700' };
      case 'OVERDUE': return { bg: 'bg-red-500', text: 'text-red-700' };
      case 'UPDATED': return { bg: 'bg-purple-500', text: 'text-purple-700' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-700' };
    }
  };

  const colors = getColors();

  return (
    <div ref={ref} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-4">
      
      <div 
        className={`flex items-center justify-center rounded-full border-[2px] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isVisible 
            ? `w-5 h-5 scale-110 border-white shadow-[0_0_12px_rgba(0,0,0,0.1)] bg-white` 
            : `w-4 h-4 scale-100 border-[#e8e6dc] bg-gray-300`
          }`}
      >
        <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isVisible ? colors.bg : 'bg-transparent'}`}></div>
      </div>

      <div 
        className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] bg-white px-5 py-4 rounded-2xl border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-1.5
          ${isVisible 
            ? 'opacity-100 translate-y-0 scale-100 shadow-md border-gray-200' 
            : 'opacity-0 translate-y-8 scale-[0.97] shadow-sm border-transparent'
          }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${colors.text}`}>
            {getIcon()} {activity.type}
          </span>
        </div>
        <div className={`text-[15px] font-medium leading-tight mt-1 ${activity.task?.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {activity.task?.title || activity.project?.name || 'Item deleted'}
        </div>
        <div className="text-[12px] text-gray-400 font-numbers">{format(new Date(activity.createdAt), 'dd MMM yyyy · h:mm a')}</div>
      </div>
    </div>
  );
};

export const Activity = () => {
  const [activities, setActivities] = useState<{ dateLabel: string, items: ActivityItem[] }[]>([]);

  useEffect(() => {
    fetchTasksAndGenerateActivity();
  }, []);

  const fetchTasksAndGenerateActivity = async () => {
    try {
      const { data } = await api.get('/activity');
      const allActivities: ActivityItem[] = data;

      const grouped: { [key: string]: ActivityItem[] } = {};
      
      allActivities.forEach(activity => {
        const date = new Date(activity.createdAt);
        let label = '';
        if (isToday(date)) {
          label = 'TODAY';
        } else if (isYesterday(date)) {
          label = 'YESTERDAY';
        } else {
          label = format(date, 'MMMM d').toUpperCase();
        }
        
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(activity);
      });

      const groupedArray = Object.keys(grouped).map(key => ({
        dateLabel: key,
        items: grouped[key]
      }));
      
      setActivities(groupedArray);
    } catch (error) {
      console.error('Failed to fetch activity', error);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      <div className="sticky top-0 z-30 bg-[#e8e6dc]/95 backdrop-blur-md pb-4 pt-2 -mt-2">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
          <ActivityIcon className="text-gray-900" size={28} />
          <div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
              Activity
            </h1>
            <p className="text-[14px] text-gray-500 mt-1">A timeline of your recent accomplishments.</p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        {activities.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-16">
            <div className="flex items-center justify-center mb-8 sticky top-[100px] z-20">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-gray-500 bg-[#e8e6dc] px-4 py-1.5 rounded-full uppercase">
                {group.dateLabel}
              </h2>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {group.items.map(activity => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="text-[14px] text-gray-500 text-center py-8">No activity yet.</p>
        )}
      </div>
    </div>
  );
};
