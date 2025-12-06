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
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex space-x-3 justify-end">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            className="w-24 justify-center"
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