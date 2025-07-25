
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidthClass?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, maxWidthClass = 'max-w-xl' }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className={`bg-[#2c2c2c] rounded-lg shadow-2xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;
