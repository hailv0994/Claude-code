import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, children, className = '' }: Props) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        {icon && <span className="text-blue-600">{icon}</span>}
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
