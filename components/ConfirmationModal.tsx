import React from 'react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 border border-gray-100 dark:border-white/10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex space-x-3 justify-end">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            className="w-24 justify-center bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20"
          >
            No
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm}
            className="w-24 justify-center"
          >
            Yes
          </Button>
        </div>
      </div>
    </div>
  );
};