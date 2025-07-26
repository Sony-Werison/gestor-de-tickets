import React, { useState, useCallback, useRef } from 'react';
import { Ticket, TicketStatus, Categories } from '../types';
import { STATUS_TITLES } from '../constants';
import KanbanColumn from './KanbanColumn';

interface KanbanViewProps {
    tickets: Ticket[];
    categories: Categories;
    onTicketOrderChange: (draggedTicketId: number, targetStatus: TicketStatus, targetIndex: number) => void;
    onOpenModal: (id?: number) => void;
    onDeleteTicket: (id: number) => void;
    onCompleteTicket: (id: number) => void;
    isViewOnly: boolean;
}

const KanbanView: React.FC<KanbanViewProps> = ({ tickets, categories, onTicketOrderChange, onOpenModal, onDeleteTicket, onCompleteTicket, isViewOnly }) => {
    const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<TicketStatus | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ status: TicketStatus; index: number } | null>(null);
    const [placeholderHeight, setPlaceholderHeight] = useState(0);
    const dragLeaveTimeout = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: number) => {
        if (isViewOnly) return;
        setDraggedTicketId(ticketId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ticketId.toString());
        
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

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TicketStatus) => {
        e.preventDefault();
        if (dragLeaveTimeout.current) {
            clearTimeout(dragLeaveTimeout.current);
            dragLeaveTimeout.current = null;
        }

        const listEl = e.currentTarget;
        const cardElements = [...listEl.children].filter(child => child.id.startsWith('ticket-'));
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
        
        setDragOverStatus(status);
        setDropIndicator({ status, index: targetIndex });
    };

    const handleDragLeave = () => {
        dragLeaveTimeout.current = window.setTimeout(() => {
            setDragOverStatus(null);
            setDropIndicator(null);
        }, 50);
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetStatus: TicketStatus) => {
        e.preventDefault();
        if (draggedTicketId === null || dropIndicator === null) return;
        
        if (dragLeaveTimeout.current) {
            clearTimeout(dragLeaveTimeout.current);
            dragLeaveTimeout.current = null;
        }

        onTicketOrderChange(draggedTicketId, targetStatus, dropIndicator.index);
        setDraggedTicketId(null);
        setDragOverStatus(null);
        setDropIndicator(null);
    }, [draggedTicketId, onTicketOrderChange, dropIndicator]);

    const getTicketsByStatus = (status: TicketStatus) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return tickets
            .filter(t => {
                if (t.status !== status) return false;
                if (status === TicketStatus.Terminado) {
                    return t.completionDate && new Date(t.completionDate) > sevenDaysAgo;
                }
                return true;
            })
            .sort((a, b) => a.order - b.order);
    };

    const proximosTickets = getTicketsByStatus(TicketStatus.Proximos);
    const ejecucionTickets = getTicketsByStatus(TicketStatus.Ejecucion);
    const terminadoTickets = getTicketsByStatus(TicketStatus.Terminado);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {draggedTicketId && <style>{`#ticket-${draggedTicketId} { opacity: 0.5; transform: rotate(2deg); }`}</style>}

            <KanbanColumn
                title={STATUS_TITLES.proximos}
                tickets={proximosTickets}
                status={TicketStatus.Proximos}
                categories={categories}
                onCardClick={onOpenModal}
                onAddTicket={!isViewOnly ? () => onOpenModal() : undefined}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isDraggingOver={dragOverStatus === TicketStatus.Proximos}
                placeholderHeight={placeholderHeight}
                dropIndex={dropIndicator?.status === TicketStatus.Proximos ? dropIndicator.index : -1}
                onDeleteTicket={onDeleteTicket}
                onCompleteTicket={onCompleteTicket}
                isViewOnly={isViewOnly}
            />
            <KanbanColumn
                title={STATUS_TITLES.ejecucion}
                tickets={ejecucionTickets}
                status={TicketStatus.Ejecucion}
                categories={categories}
                onCardClick={onOpenModal}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isDraggingOver={dragOverStatus === TicketStatus.Ejecucion}
                bgColorClass="bg-[#2a3d5c]"
                titleColorClass="text-[#a8d1f3]"
                headerIconColorClass="text-blue-400/50"
                placeholderHeight={placeholderHeight}
                dropIndex={dropIndicator?.status === TicketStatus.Ejecucion ? dropIndicator.index : -1}
                onDeleteTicket={onDeleteTicket}
                onCompleteTicket={onCompleteTicket}
                isViewOnly={isViewOnly}
            />
            <KanbanColumn
                title={STATUS_TITLES.terminado}
                tickets={terminadoTickets}
                status={TicketStatus.Terminado}
                categories={categories}
                onCardClick={onOpenModal}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isDraggingOver={dragOverStatus === TicketStatus.Terminado}
                bgColorClass="bg-[#253b34]"
                titleColorClass="text-[#82c5a7]"
                headerIconColorClass="text-green-500/50"
                placeholderHeight={placeholderHeight}
                dropIndex={dropIndicator?.status === TicketStatus.Terminado ? dropIndicator.index : -1}
                onDeleteTicket={onDeleteTicket}
                onCompleteTicket={onCompleteTicket}
                isViewOnly={isViewOnly}
            />
        </div>
    );
};

export default KanbanView;