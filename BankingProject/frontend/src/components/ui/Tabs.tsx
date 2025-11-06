import React, { createContext, useContext, useState, ReactNode } from 'react';
import { clsx } from 'clsx';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  'aria-label'?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, activeTab, onTabChange, className = '', 'aria-label': ariaLabel }) => {
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: onTabChange }}>
      <div className={clsx('w-full', className)} aria-label={ariaLabel}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({ children, className = '' }) => {
  return (
    <div className={clsx('border-b border-gray-200', className)}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {children}
      </nav>
    </div>
  );
};

interface TabProps {
  id: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const Tab: React.FC<TabProps> = ({ id, children, icon, className = '', disabled = false, 'aria-label': ariaLabel }) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('Tab must be used within Tabs component');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === id;

  return (
    <button
      type="button"
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      className={clsx(
        'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, children, className = '' }) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabPanel must be used within Tabs component');
  }

  const { activeTab } = context;
  
  if (activeTab !== id) {
    return null;
  }

  return (
    <div className={clsx('tab-panel', className)} role="tabpanel" id={`tabpanel-${id}`}>
      {children}
    </div>
  );
};