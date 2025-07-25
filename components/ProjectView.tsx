
import React, { useState, useCallback, useRef } from 'react';
import { Ticket, Categories, ProjectType, TicketStatus } from '../types';
import TicketCard from './TicketCard';

interface ProjectViewProps {
    tickets: Ticket[];
    categories: Categories;
    teams: ProjectType[];
    onTicketOrderChange: (draggedTicketId: number, targetProject: ProjectType, targetIndex: number) => void;
    onOpenModal: (id?: number) => void;
    onDeleteTicket: (id: number) => void;
    onCompleteTicket: (id: number) => void;
}

const ProjectColumn: React.FC<{
    title: string;
    projectType: ProjectType;
    tickets: Ticket[];
    onCardClick: (id: number) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, ticketId: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    isDraggingOver: boolean;
    placeholderHeight: number;
    dropIndex: number;
    categories: Categories;
    onDeleteTicket: (id: number) => void;
    onCompleteTicket: (id: number) => void;
}> = ({ title, tickets, onCardClick, onDragStart, onDragOver, onDrop, onDragLeave, isDraggingOver, placeholderHeight, dropIndex, categories, onDeleteTicket, onCompleteTicket }) => {
    
    const inProgressTickets = tickets.filter(t => t.status === TicketStatus.Ejecucion);
    const otherTickets = tickets.filter(t => t.status !== TicketStatus.Ejecucion);

    const createTicketCard = (ticket: Ticket) => (
        <TicketCard
            key={ticket.id}
            ticket={ticket}
            category={categories[ticket.category]}
            onClick={() => onCardClick(ticket.id)}
            onDragStart={(e) => onDragStart(e, ticket.id)}
            onDelete={onDeleteTicket}
            onComplete={onCompleteTicket}
        />
    );

    const inProgressElements = inProgressTickets.map(createTicketCard);
    const otherElements = otherTickets.map(createTicketCard);
    
    if (isDraggingOver && dropIndex !== -1) {
        const placeholder = (
            <div
                key="placeholder"
                className="kanban-placeholder bg-white/10 border-2 border-dashed border-gray-500 rounded-md -my-0.5"
                style={{ height: `${placeholderHeight}px` }}
            ></div>
        );
        if (dropIndex < inProgressElements.length) {
            inProgressElements.splice(dropIndex, 0, placeholder);
        } else {
            otherElements.splice(dropIndex - inProgressElements.length, 0, placeholder);
        }
    }
    
    return (
        <div className="bg-[#2c2c2c] flex flex-col h-full rounded-lg p-4">
            <div className="flex justify-between items-center pb-3 mb-3">
                <h2 className="font-medium uppercase text-xs tracking-widest text-gray-400">{title}</h2>
            </div>
            <div
                className="ticket-list flex-grow min-h-[100px] space-y-1"
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragLeave={onDragLeave}
            >
                {inProgressElements.length > 0 && (
                    <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-white/70 tracking-wider pb-1 pt-2">En Ejecución</div>
                        {inProgressElements}
                    </div>
                )}
                
                {inProgressElements.length > 0 && otherElements.length > 0 && (
                    <hr className="border-t border-white/10 my-3" />
                )}

                {otherElements.length > 0 && (
                     <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-white/70 tracking-wider pb-1 pt-2">Próximos</div>
                        {otherElements}
                     </div>
                 )}
            </div>
        </div>
    );
}

const ProjectView: React.FC<ProjectViewProps> = ({ tickets, categories, teams, onTicketOrderChange, onOpenModal, onDeleteTicket, onCompleteTicket }) => {
    const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null);
    const [dragOverProject, setDragOverProject] = useState<ProjectType | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ project: ProjectType; index: number } | null>(null);
    const [placeholderHeight, setPlaceholderHeight] = useState(0);
    const dragLeaveTimeout = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: number) => {
        setDraggedTicketId(ticketId);
        e.dataTransfer.effectAllowed = 'move';
        
        const card = document.getElementById(`ticket-${ticketId}`);
        if(card){
            setPlaceholderHeight(card.offsetHeight);
            const ghost = card.cloneNode(true) as HTMLElement;
            ghost.style.position = "absolute";
            ghost.style.top = "-9999px";
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 20, 20);
            setTimeout(() => ghost.remove(), 0);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, project: ProjectType) => {
        e.preventDefault();
        if (dragLeaveTimeout.current) {
            clearTimeout(dragLeaveTimeout.current);
            dragLeaveTimeout.current = null;
        }

        const listEl = e.currentTarget;
        // Query for actual ticket cards, ignoring wrappers
        const cardElements = Array.from(listEl.querySelectorAll('[id^="ticket-"]'));
        const dropY = e.clientY;

        let targetIndex = cardElements.length;
        for (let i = 0; i < cardElements.length; i++) {
            const card = cardElements[i];
            const rect = card.getBoundingClientRect();
            if (dropY < rect.top + rect.height / 2) {
                targetIndex = i;
                break;
            }
        }
        
        setDragOverProject(project);
        setDropIndicator({ project, index: targetIndex });
    };

    const handleDragLeave = () => {
        dragLeaveTimeout.current = window.setTimeout(() => {
            setDragOverProject(null);
            setDropIndicator(null);
        }, 50);
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetProject: ProjectType) => {
        e.preventDefault();
        if (draggedTicketId === null || dropIndicator === null) return;
        
        if (dragLeaveTimeout.current) {
            clearTimeout(dragLeaveTimeout.current);
            dragLeaveTimeout.current = null;
        }
        
        onTicketOrderChange(draggedTicketId, targetProject, dropIndicator.index);
        setDraggedTicketId(null);
        setDragOverProject(null);
        setDropIndicator(null);
    }, [draggedTicketId, onTicketOrderChange, dropIndicator]);

    const activeTickets = tickets.filter(t => t.status !== 'terminado');
    
    return (
        <div className={`grid grid-cols-1 lg:grid-cols-${teams.length} gap-6 items-start`}>
             {draggedTicketId && <style>{`#ticket-${draggedTicketId}, #ticket-${draggedTicketId} > div { opacity: 0.5; transform: rotate(2deg); }`}</style>}
            {teams.map(team => {
                const teamTickets = activeTickets
                    .filter(t => t.project === team)
                    .sort((a,b) => {
                        // Sort by status first (ejecucion > proximos), then by order
                        if (a.status === TicketStatus.Ejecucion && b.status !== TicketStatus.Ejecucion) return -1;
                        if (a.status !== TicketStatus.Ejecucion && b.status === TicketStatus.Ejecucion) return 1;
                        return a.order - b.order;
                    });

                return (
                    <ProjectColumn
                        key={team}
                        title={`Tickets ${team}`}
                        projectType={team}
                        tickets={teamTickets}
                        categories={categories}
                        onCardClick={onOpenModal}
                        onDragStart={handleDragStart}
                        onDragOver={(e) => handleDragOver(e, team)}
                        onDrop={(e) => handleDrop(e, team)}
                        onDragLeave={handleDragLeave}
                        isDraggingOver={dragOverProject === team}
                        placeholderHeight={placeholderHeight}
                        dropIndex={dropIndicator?.project === team ? dropIndicator.index : -1}
                        onDeleteTicket={onDeleteTicket}
                        onCompleteTicket={onCompleteTicket}
                    />
                );
            })}
        </div>
    );
};

export default ProjectView;