import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-6xl text-outline mb-4">
        {icon}
      </span>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-body-md text-on-surface-variant mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
