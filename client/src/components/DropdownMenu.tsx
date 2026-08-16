import React, { useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  items: MenuItem[];
  onClose: () => void;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }} 
            className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors flex items-center gap-2 ${
              item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.icon && <span className={item.danger ? 'text-red-500' : 'text-gray-400'}>{item.icon}</span>}
            {item.label}
          </button>
          {item.danger && index < items.length - 1 && <div className="h-px bg-gray-100 my-1"></div>}
        </React.Fragment>
      ))}
    </div>
  );
};
