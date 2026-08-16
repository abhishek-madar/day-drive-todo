import React, { createContext, useContext, useState } from 'react';

interface TaskModalContextType {
  isOpen: boolean;
  openModal: (defaultDate?: Date, defaultProjectId?: string) => void;
  closeModal: () => void;
  defaultDate?: Date;
  defaultProjectId?: string;
}

const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export const TaskModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [defaultProjectId, setDefaultProjectId] = useState<string | undefined>(undefined);

  const openModal = (date?: Date, projectId?: string) => {
    setDefaultDate(date);
    setDefaultProjectId(projectId);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setDefaultDate(undefined);
    setDefaultProjectId(undefined);
  };

  return (
    <TaskModalContext.Provider value={{ isOpen, openModal, closeModal, defaultDate, defaultProjectId }}>
      {children}
    </TaskModalContext.Provider>
  );
};

export const useTaskModal = () => {
  const context = useContext(TaskModalContext);
  if (context === undefined) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return context;
};
