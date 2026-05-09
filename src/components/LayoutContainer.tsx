import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

const LayoutContainer: React.FC<LayoutContainerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      // Container principal com largura máxima e centralização
      'w-full max-w-7xl mx-auto',
      // Padding horizontal responsivo
      'px-4 sm:px-6 lg:px-8',
      // Espaçamento vertical
      'py-6',
      className
    )}>
      {children}
    </div>
  );
};

export default LayoutContainer;
