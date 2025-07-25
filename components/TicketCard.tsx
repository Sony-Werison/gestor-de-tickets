
import React from 'react';
import { Ticket, Category, TicketStatus } from '../types';

interface TicketCardProps {
    ticket: Ticket;
    category?: Category;
    viewType?: 'status' | 'category';
    onClick: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDelete: (id: number) => void;
    onComplete: (id: number) => void;
}

const ExecutingSeal = () => (
    <div className="relative flex h-3 w-3 flex-shrink-0" title="En Ejecución">
        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
        <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
    </div>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const TicketCard: React.FC<TicketCardProps> = ({ ticket, category, viewType = 'status', onClick, onDragStart, onDelete, onComplete }) => {
    const categoryColor = category?.color || '#5e5e5e';
    const completionDate = ticket.completionDate ? new Date(ticket.completionDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '';
    
    return (
        <div
            id={`ticket-${ticket.id}`}
            className="ticket-card group p-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-[#3a3a3a] relative"
            draggable="true"
            onClick={onClick}
            onDragStart={onDragStart}
        >
            <div className="flex items-center gap-2 pr-12">
                <span className="text-gray-500 font-medium w-5 text-right text-xs">{ticket.id}</span>
                
                {viewType === 'status' && (
                    <span
                        className="category-tag inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap text-white"
                        style={{ backgroundColor: categoryColor }}
                    >
                        {ticket.category.replace('/Bug', '')}
                    </span>
                )}
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                    {ticket.status === TicketStatus.Ejecucion && <ExecutingSeal />}
                    <p className="font-medium text-gray-300 text-sm whitespace-nowrap truncate">{ticket.title}</p>
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[11px] rounded font-medium whitespace-nowrap bg-gray-600/50 text-gray-300">
                        {ticket.project}
                    </span>
                </div>
                {ticket.status === TicketStatus.Terminado && (
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-auto">{completionDate}</span>
                )}
            </div>

            <div className="absolute top-0 right-1 h-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {ticket.status !== TicketStatus.Terminado && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onComplete(ticket.id); }} 
                    className="p-1.5 rounded-full bg-green-600/80 hover:bg-green-500 text-white" 
                    title="Marcar como Completado">
                    <CheckIcon />
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(ticket.id); }} 
                  className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-500 text-white" 
                  title="Eliminar Ticket">
                  <TrashIcon />
                </button>
            </div>
        </div>
    );
};

export default TicketCard;
