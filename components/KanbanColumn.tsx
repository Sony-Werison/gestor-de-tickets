import React from 'react';
import { Ticket, TicketStatus, Category } from '../types';
import TicketCard from './TicketCard';

interface KanbanColumnProps {
    title: string;
    tickets: Ticket[];
    status: TicketStatus;
    categories: Record<string, Category>;
    onCardClick: (id: number) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, ticketId: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    isDraggingOver: boolean;
    onAddTicket?: () => void;
    bgColorClass?: string;
    titleColorClass?: string;
    headerIconColorClass?: string;
    placeholderHeight: number;
    dropIndex: number;
    onDeleteTicket: (id: number) => void;
    onCompleteTicket: (id: number) => void;
    isViewOnly: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
    title,
    tickets,
    status,
    categories,
    onCardClick,
    onDragStart,
    onDragOver,
    onDrop,
    onDragLeave,
    isDraggingOver,
    onAddTicket,
    bgColorClass = 'bg-[#2c2c2c]',
    titleColorClass = 'text-gray-400',
    headerIconColorClass = 'text-gray-500',
    placeholderHeight,
    dropIndex,
    onDeleteTicket,
    onCompleteTicket,
    isViewOnly
}) => {
    const ticketElements = tickets.map(ticket => (
        <TicketCard
            key={ticket.id}
            ticket={ticket}
            category={categories[ticket.category]}
            onClick={() => onCardClick(ticket.id)}
            onDragStart={(e) => onDragStart(e, ticket.id)}
            onDelete={onDeleteTicket}
            onComplete={onCompleteTicket}
            isViewOnly={isViewOnly}
        />
    ));

    if (isDraggingOver && dropIndex !== -1) {
        const placeholder = (
            <div
                key="placeholder"
                className="kanban-placeholder bg-white/10 border-2 border-dashed border-gray-500 rounded-md -my-0.5"
                style={{ height: `${placeholderHeight}px` }}
            ></div>
        );
        ticketElements.splice(dropIndex, 0, placeholder);
    }
    
    return (
        <div className={`kanban-column flex flex-col h-full rounded-lg p-4 ${bgColorClass}`}>
            <div className="kanban-column-header flex justify-between items-center pb-3 mb-3">
                <h2 className={`kanban-column-title font-medium uppercase text-xs tracking-widest ${titleColorClass}`}>{title}</h2>
                <span className={`cursor-pointer ${headerIconColorClass}`}>···</span>
            </div>
            <div
                id={`list-${status}`}
                className="ticket-list flex-grow min-h-[100px] space-y-1 transition-colors duration-300"
                onDragOver={(e) => onDragOver(e, status)}
                onDrop={(e) => onDrop(e, status)}
                onDragLeave={onDragLeave}
            >
                {ticketElements}
            </div>
            {onAddTicket && (
                 <button onClick={onAddTicket} className="text-gray-300 hover:text-white text-sm mt-3 p-2 rounded-md bg-gray-600/50 hover:bg-gray-600 w-full">
                    + Añadir Ticket
                </button>
            )}
        </div>
    );
};

export default KanbanColumn;