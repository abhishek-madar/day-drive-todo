import React, { useState, useEffect, useRef } from 'react';
import { Target, Play, Pause, RotateCcw, ArrowRight, Circle, Check, X, Plus, Minus } from 'lucide-react';
import api from '../api/client';
import { isToday } from 'date-fns';

interface FocusSession {
  id: string;
  duration: number;
  taskId: string | null;
  task: any | null;
  type: string;
  createdAt: string;
}

interface ActiveSessionState {
  isActive: boolean;
  expectedEndTime: number | null;
  timeLeftSeconds: number;
  selectedDurationSeconds: number;
  sessionType: 'focus' | 'break';
  sessionStartTime: number | null;
  warningSent: boolean;
}

const ScrollWheel = ({ min, max, value, onChange }: { min: number, max: number, value: number, onChange: (v: number) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const itemHeight = 48; 

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = (value - min) * itemHeight;
    }
    
  }, []); 

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const MathValue = min + index;
    if (MathValue !== value && MathValue >= min && MathValue <= max) {
      onChange(MathValue);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[240px] overflow-y-auto snap-y snap-mandatory no-scrollbar relative z-10 w-16"
      style={{ paddingTop: '96px', paddingBottom: '96px' }} 
    >
      {items.map(item => (
        <div key={item} className="h-12 flex items-center justify-center snap-center">
          <span className={`text-[24px] font-numbers transition-all duration-150 ${value === item ? 'font-medium text-black' : 'font-medium text-gray-300'}`}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
};

const AnimatedTimerDigit = ({ digit, max }: { digit: string, max?: number }) => {
  if (isNaN(parseInt(digit))) return <span className="inline-block mx-1.5 pb-3 text-gray-800">{digit}</span>; 
  
  const numValue = parseInt(digit);
  const arr = max ? Array.from({length: max + 1}, (_, i) => i) : [0,1,2,3,4,5,6,7,8,9];

  return (
    <div className="relative inline-block overflow-hidden h-[1em] tabular-nums">
      
      <span className="invisible pointer-events-none">0</span>
      
      <div 
        className="transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] absolute top-0 left-0 right-0 flex flex-col items-center" 
        style={{ transform: `translateY(-${numValue}em)` }}
      >
        {arr.map(n => (
          <div key={n} className="h-[1em] leading-[1em] w-full text-center">{n}</div>
        ))}
      </div>
    </div>
  );
};

const AnimatedTimeDisplay = ({ seconds }: { seconds: number }) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  const hStr = h > 0 ? h.toString() : '';
  const mStr = h > 0 ? m.toString().padStart(2, '0') : m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center tracking-tighter">
      {hStr && (
        <>
          {hStr.split('').map((char, i) => <AnimatedTimerDigit key={`h-${i}`} digit={char} max={9} />)}
          <AnimatedTimerDigit digit=":" />
        </>
      )}
      <AnimatedTimerDigit digit={mStr[0]} max={5} />
      <AnimatedTimerDigit digit={mStr[1]} max={9} />
      <AnimatedTimerDigit digit=":" />
      <AnimatedTimerDigit digit={sStr[0]} max={5} />
      <AnimatedTimerDigit digit={sStr[1]} max={9} />
    </div>
  );
};

export const Focus = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [todayMins, setTodayMins] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultState: ActiveSessionState = {
    isActive: false,
    expectedEndTime: null,
    timeLeftSeconds: 25 * 60,
    selectedDurationSeconds: 25 * 60,
    sessionType: 'focus',
    sessionStartTime: null,
    warningSent: false
  };

  const [activeState, setActiveState] = useState<ActiveSessionState>(defaultState);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customH, setCustomH] = useState(0);
  const [customM, setCustomM] = useState(15);
  const [customS, setCustomS] = useState(0);

  const [settings, setSettings] = useState({
    sessionStarted: true,
    sessionEnding: true,
    sessionCompleted: true,
    breakCompleted: true,
    warningBeforeMin: 5,
    sound: true,
    desktopNotifications: false,
  });

  useEffect(() => {
    fetchTasks();
    fetchStats();

    const savedState = localStorage.getItem('daydrive_focus_active_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.isActive && parsed.expectedEndTime) {
        const remaining = Math.max(0, Math.floor((parsed.expectedEndTime - Date.now()) / 1000));
        parsed.timeLeftSeconds = remaining;
        if (remaining === 0) {
          parsed.isActive = false;
        }
      }
      setActiveState(parsed);
    }

    const savedSettings = localStorage.getItem('daydrive_focus_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTaskDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      const incompleteTasks = data.filter((t: any) => t.status !== 'COMPLETED');
      setTasks(incompleteTasks);
      if (incompleteTasks.length > 0 && !currentTaskId) {
        setCurrentTaskId(incompleteTasks[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/focus-sessions/stats');
      setSessions(data.recentSessions);
      setTodayMins(data.todayFocusTimeMinutes);
      setTodayCount(data.todaySessions);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const saveState = (newState: ActiveSessionState) => {
    setActiveState(newState);
    localStorage.setItem('daydrive_focus_active_state', JSON.stringify(newState));
  };

  const sendNotification = (title: string, body: string = '') => {
    if (!settings.desktopNotifications || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (e) {
      console.log('Notification failed', e);
    }
  };

  useEffect(() => {
    let animationFrame: number;
    let lastTick = Date.now();

    const tick = () => {
      if (activeState.isActive && activeState.expectedEndTime) {
        const now = Date.now();
        if (now - lastTick > 500) { 
          const remaining = Math.max(0, Math.floor((activeState.expectedEndTime - now) / 1000));
          
          if (remaining !== activeState.timeLeftSeconds) {
            let warningSent = activeState.warningSent;
            
            if (settings.sessionEnding && !warningSent && remaining === settings.warningBeforeMin * 60) {
              sendNotification('Focus session ending soon', `Ends in ${settings.warningBeforeMin} minutes.`);
              warningSent = true;
            }

            if (remaining === 0) {
              saveState({ ...activeState, timeLeftSeconds: 0, isActive: false, warningSent });
              handleSessionEnd('Completed', activeState);
              
              if (activeState.sessionType === 'focus' && settings.sessionCompleted) {
                sendNotification('Focus session complete', 'Great job! Time for a break.');
              } else if (activeState.sessionType === 'break' && settings.breakCompleted) {
                sendNotification('Break complete', 'Ready to focus?');
              }
            } else {
              saveState({ ...activeState, timeLeftSeconds: remaining, warningSent });
            }
          }
          lastTick = now;
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };

    if (activeState.isActive) {
      animationFrame = requestAnimationFrame(tick);
    }
    
    return () => cancelAnimationFrame(animationFrame);
  }, [activeState, settings]);

  const handleSessionEnd = async (status: 'Completed' | 'Interrupted', state: ActiveSessionState) => {
    if (!state.sessionStartTime) return;
    
    const elapsedSeconds = state.selectedDurationSeconds - state.timeLeftSeconds;
    const elapsedMins = Math.round(elapsedSeconds / 60);

    if ((elapsedMins > 0 || status === 'Completed') && state.sessionType === 'focus') {
      const activeTask = tasks.find(t => t.id === currentTaskId);
      try {
        await api.post('/focus-sessions', {
          type: state.selectedDurationSeconds === 25 * 60 ? 'pomodoro' : 'custom',
          duration: status === 'Completed' ? state.selectedDurationSeconds : elapsedSeconds,
          taskId: currentTaskId
        });
        fetchStats();
      } catch (error) {
        console.error('Failed to save session', error);
      }
    }
    saveState({ ...state, sessionStartTime: null, isActive: false });
  };

  const toggleTimer = () => {
    if (activeState.isActive) {
      saveState({ ...activeState, isActive: false, expectedEndTime: null });
    } else {
      const newExpectedEnd = Date.now() + (activeState.timeLeftSeconds * 1000);
      const isNewSession = !activeState.sessionStartTime;
      
      saveState({ 
        ...activeState, 
        isActive: true, 
        expectedEndTime: newExpectedEnd,
        sessionStartTime: isNewSession ? Date.now() : activeState.sessionStartTime
      });

      if (isNewSession && settings.sessionStarted && activeState.sessionType === 'focus') {
        const mins = Math.round(activeState.selectedDurationSeconds / 60);
        sendNotification('Focus session started', `${mins} minutes remaining.`);
      }
    }
  };

  const resetTimer = () => {
    if (activeState.isActive || (activeState.timeLeftSeconds < activeState.selectedDurationSeconds && activeState.timeLeftSeconds > 0)) {
      handleSessionEnd('Interrupted', activeState);
    }
    saveState({ 
      ...activeState, 
      isActive: false, 
      expectedEndTime: null, 
      timeLeftSeconds: activeState.selectedDurationSeconds,
      sessionStartTime: null,
      warningSent: false
    });
  };

  const adjustTime = (seconds: number) => {
    const newTime = Math.max(1, activeState.timeLeftSeconds + seconds);
    if (activeState.isActive) {
      saveState({
        ...activeState,
        timeLeftSeconds: newTime,
        expectedEndTime: Date.now() + (newTime * 1000)
      });
    } else {
      saveState({
        ...activeState,
        timeLeftSeconds: newTime,
        selectedDurationSeconds: Math.max(activeState.selectedDurationSeconds, newTime) 
      });
    }
  };

  const setDuration = (mins: number, type: 'focus' | 'break') => {
    if (activeState.isActive) handleSessionEnd('Interrupted', activeState);
    saveState({
      ...activeState,
      isActive: false,
      expectedEndTime: null,
      selectedDurationSeconds: mins * 60,
      timeLeftSeconds: mins * 60,
      sessionType: type,
      sessionStartTime: null,
      warningSent: false
    });
  };

  const startCustomTimer = () => {
    const totalSecs = (customH * 3600) + (customM * 60) + customS;
    if (totalSecs > 0) {
      if (activeState.isActive) handleSessionEnd('Interrupted', activeState);
      saveState({
        ...activeState,
        isActive: false,
        expectedEndTime: null,
        selectedDurationSeconds: totalSecs,
        timeLeftSeconds: totalSecs,
        sessionType: 'focus',
        sessionStartTime: null,
        warningSent: false
      });
    }
    setIsCustomModalOpen(false);
  };

  const handleCustomPreset = (mins: number) => {
    setCustomH(Math.floor(mins / 60));
    setCustomM(mins % 60);
    setCustomS(0);
  };

  const completeCurrentTask = async () => {
    if (!currentTaskId) return;
    try {
      await api.patch(`/tasks/${currentTaskId}`, { status: 'COMPLETED' });
      const remainingTasks = tasks.filter(t => t.id !== currentTaskId);
      setTasks(remainingTasks);
      setCurrentTaskId(remainingTasks.length > 0 ? remainingTasks[0].id : null);
    } catch (error) {
      console.error('Failed to complete task', error);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatCustomDuration = () => {
    return `${customH.toString().padStart(2, '0')} : ${customM.toString().padStart(2, '0')} : ${customS.toString().padStart(2, '0')}`;
  };

  const goalMins = 120;
  const progressPercent = Math.min((todayMins / goalMins) * 100, 100);
  
  const generateProgressBar = (percent: number) => {
    const totalBlocks = 15;
    const filledBlocks = Math.round((percent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  };

  const activeTask = tasks.find(t => t.id === currentTaskId);

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="space-y-8 pb-12 max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight leading-tight flex items-center gap-3">
              <Target className="text-gray-900" size={28} />
              Focus
            </h1>
            <p className="text-[14px] text-gray-500 mt-1">Deep work sessions, distraction free.</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center relative overflow-hidden">
          <h2 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4 z-10">
            {activeState.sessionType === 'focus' ? 'Focus Session' : 'Break Time'}
          </h2>
          
          <div className="text-[100px] sm:text-[140px] md:text-[160px] lg:text-[180px] font-numbers font-medium text-gray-900 leading-none mb-6 z-10 flex items-center justify-center min-w-[320px]">
            <AnimatedTimeDisplay seconds={activeState.timeLeftSeconds} />
          </div>
          
          <div className="flex items-center gap-3 mb-10 z-10">
            <button onClick={() => adjustTime(-300)} className="px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 text-[12px] font-medium flex items-center gap-1 transition-colors border border-gray-200">
              <Minus size={12} /> 5 min
            </button>
            <button onClick={() => adjustTime(300)} className="px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 text-[12px] font-medium flex items-center gap-1 transition-colors border border-gray-200">
              <Plus size={12} /> 5 min
            </button>
          </div>
          
          <div className="w-full max-w-sm h-px bg-gray-100 mb-10 z-10"></div>
          
          <div className="flex flex-col items-center gap-4 mb-12 z-10">
            <div className="flex items-center p-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
              <button 
                onClick={resetTimer}
                className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <RotateCcw size={22} strokeWidth={1.5} />
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              
              <button 
                onClick={toggleTimer}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:bg-gray-50 hover:text-gray-900 ${
                  activeState.isActive 
                    ? 'text-gray-900 bg-gray-100 shadow-inner' 
                    : 'text-slate-400 bg-transparent'
                }`}
              >
                {activeState.isActive ? (
                  <Pause size={22} strokeWidth={1.5} />
                ) : (
                  <Play size={22} strokeWidth={1.5} className="ml-1" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between w-32 px-4 text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400">
              <span>Reset</span>
              <span>{activeState.isActive ? 'Pause' : 'Start'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 z-10">
            {[
              { label: 'Pomodoro', mins: 25, type: 'focus' },
              { label: 'Short Break', mins: 5, type: 'break' },
              { label: 'Long Break', mins: 15, type: 'break' },
              { label: 'Deep Work', mins: 60, type: 'focus' }
            ].map(preset => {
              const isActivePreset = activeState.selectedDurationSeconds === preset.mins * 60 && activeState.sessionType === preset.type;
              return (
                <button
                  key={preset.label}
                  onClick={() => setDuration(preset.mins, preset.type as any)}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                    isActivePreset 
                      ? 'bg-black text-white shadow-md' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="px-5 py-2 rounded-full text-[13px] font-semibold bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200 border-dashed"
            >
              Custom
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#e8e6dc]/50 rounded-3xl p-6 border border-gray-200/50 flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-4">Current Task</h3>
              {activeTask ? (
                <div className="flex items-start gap-3">
                  <button 
                    onClick={completeCurrentTask}
                    className="mt-1 text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <Circle size={20} />
                  </button>
                  <div>
                    <h4 className="text-[16px] font-medium text-gray-900 leading-snug">{activeTask.title}</h4>
                    <p className="text-[13px] text-gray-500 mt-1 flex items-center gap-2">
                      <span>{activeTask.project?.name || 'Inbox'}</span>
                      <span>·</span>
                      <span className="capitalize">{activeTask.priority.toLowerCase()}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-[14px] text-gray-500 italic py-2">No active task selected.</div>
              )}
            </div>

            <div className="mt-8 relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)}
                className="text-[13px] font-semibold text-gray-900 flex items-center gap-1 hover:opacity-70 transition-opacity bg-white/50 px-4 py-2 rounded-xl border border-gray-200/50 w-fit"
              >
                Change task <ArrowRight size={14} />
              </button>

              {isTaskDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto p-2">
                    {tasks.length > 0 ? tasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => {
                          setCurrentTaskId(task.id);
                          setIsTaskDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors ${
                          currentTaskId === task.id ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className="truncate">
                          <div className={`text-[14px] font-medium truncate ${currentTaskId === task.id ? 'text-gray-900' : 'text-gray-700'}`}>
                            {task.title}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {task.project?.name || 'Inbox'}
                          </div>
                        </div>
                        {currentTaskId === task.id && <Check size={16} className="text-gray-400 shrink-0 ml-2" />}
                      </button>
                    )) : (
                      <div className="text-[12px] text-gray-400 text-center py-4">All caught up!</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#e8e6dc]/50 rounded-3xl p-6 border border-gray-200/50 flex flex-col justify-between">
            <div>
              <h3 className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-4">Today's Focus</h3>
              <div className="text-[32px] font-medium text-gray-900 tracking-tight font-numbers">
                {Math.floor(todayMins / 60) > 0 ? `${Math.floor(todayMins / 60)}h ` : ''}
                {todayMins % 60}m
              </div>
            </div>
            
            <div className="mt-6">
              <div className="text-black font-ui text-[14px] tracking-[0.2em] mb-3">
                {generateProgressBar(progressPercent)}
              </div>
              <p className="text-[13px] text-gray-500 font-medium">
                {todayCount} sessions completed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-[11px] font-bold tracking-[0.15em] text-gray-500 uppercase">Session History</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {sessions.length > 0 ? sessions.map(session => (
              <div key={session.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                  <div className="w-16 text-[13px] font-medium font-numbers text-gray-600">
                    {Math.round(session.duration / 60)} min
                  </div>
                  <div className="text-[14px] font-medium text-gray-900 truncate max-w-[200px] sm:max-w-sm">
                    {session.task?.title || 'Focus Session'}
                  </div>
                </div>
                <div className={`text-[12px] font-semibold tracking-wide uppercase text-green-600`}>
                  Completed
                </div>
              </div>
            )) : (
               <div className="p-8 text-center text-[13px] text-gray-500 italic">No focus sessions recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {isCustomModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-end sm:justify-center p-4 sm:p-0" onClick={() => setIsCustomModalOpen(false)}>
          <div className="bg-white rounded-[2rem] w-full max-w-[420px] shadow-2xl overflow-hidden flex flex-col mb-4 sm:mb-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-[16px] font-semibold text-gray-900">Custom Timer</h2>
            </div>
            
            <div className="p-8 pb-4 flex flex-col items-center">

              <div 
                className="relative h-[240px] w-full flex items-center justify-center gap-2 sm:gap-6 mb-6"
                style={{ maskImage: 'linear-gradient(to bottom, transparent, black 35%, black 65%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 35%, black 65%, transparent)' }}
              >
                
                <div className="absolute top-1/2 left-0 right-0 h-12 -mt-6 bg-gray-100/80 rounded-2xl pointer-events-none z-0"></div>

                <div className="flex items-center z-10 w-24">
                  <ScrollWheel min={0} max={99} value={customH} onChange={setCustomH} />
                  <span className="font-semibold text-[15px] text-gray-900 ml-1.5 pointer-events-none">h</span>
                </div>

                <div className="flex items-center z-10 w-24">
                  <ScrollWheel min={0} max={59} value={customM} onChange={setCustomM} />
                  <span className="font-semibold text-[15px] text-gray-900 ml-1.5 pointer-events-none">m</span>
                </div>

                <div className="flex items-center z-10 w-24">
                  <ScrollWheel min={0} max={59} value={customS} onChange={setCustomS} />
                  <span className="font-semibold text-[15px] text-gray-900 ml-1.5 pointer-events-none">s</span>
                </div>
              </div>

              <div className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">Duration</div>
              <div className="text-[32px] font-numbers font-medium text-gray-900 mb-8 tabular-nums">
                {formatCustomDuration()}
              </div>

              <div className="w-full mb-8">
                <div className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3 text-center">Quick presets</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[10, 25, 45, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleCustomPreset(mins)}
                      className="px-4 py-2 rounded-xl text-[13px] font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200/60"
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full flex items-center gap-3">
                <button 
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-medium text-[15px] text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={startCustomTimer}
                  className="flex-1 py-4 rounded-2xl font-medium text-[15px] text-white bg-black hover:bg-gray-800 transition-colors shadow-xl shadow-black/10"
                >
                  Start
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
