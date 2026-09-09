import React from 'react';

interface TopbarProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, actions }) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-line flex items-center px-8 gap-[18.5px]">
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-[17px] font-semibold text-navy truncate">
            {title}
            {subtitle && <span className="ml-2 text-[14px] font-normal text-muted">{subtitle}</span>}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </header>
  );
};

export default Topbar;
