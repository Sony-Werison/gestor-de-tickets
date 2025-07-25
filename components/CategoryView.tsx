
import React from 'react';
import { Ticket, Categories, TicketStatus } from '../types';
import TicketCard from './TicketCard';

interface CategoryViewProps {
    tickets: Ticket[];
    categories: Categories;
    onOpenModal: (id: number) => void;
    onDeleteTicket: (id: number) => void;
    onCompleteTicket: (id: number) => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({ tickets, categories, onOpenModal, onDeleteTicket, onCompleteTicket }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {Object.entries(categories).map(([catName, category]) => {
                const categoryTickets = tickets
                    .filter(t => t.category === catName && t.status !== TicketStatus.Terminado)
                    .sort((a, b) => a.order - b.order);

                if (categoryTickets.length === 0) return null;

                const inProgressTickets = categoryTickets.filter(t => t.status === TicketStatus.Ejecucion);
                const otherTickets = categoryTickets.filter(t => t.status !== TicketStatus.Ejecucion);

                return (
                    <div key={catName} className="kanban-column flex flex-col h-full rounded-lg p-4" style={{ backgroundColor: category.color }}>
                        <div className="kanban-column-header flex justify-between items-center pb-3 mb-3">
                            <h2 className="kanban-column-title font-medium uppercase text-xs tracking-widest text-white">{catName}</h2>
                        </div>
                        <div className="ticket-list flex-grow min-h-[100px] space-y-1">
                            {inProgressTickets.length > 0 && (
                                <div className="space-y-1">
                                    <div className="text-xs uppercase font-bold text-white/70 tracking-wider pb-1 pt-2">En Ejecución</div>
                                    {inProgressTickets.map(ticket => (
                                        <TicketCard
                                            key={ticket.id}
                                            ticket={ticket}
                                            category={category}
                                            viewType="category"
                                            onClick={() => onOpenModal(ticket.id)}
                                            onDragStart={() => {}} 
                                            onDelete={onDeleteTicket}
                                            onComplete={onCompleteTicket}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {inProgressTickets.length > 0 && otherTickets.length > 0 && (
                                <hr className="border-t border-white/10 my-3" />
                            )}

                            {otherTickets.length > 0 && (
                                 <div className="space-y-1">
                                    <div className="text-xs uppercase font-bold text-white/70 tracking-wider pb-1 pt-2">Próximos</div>
                                    {otherTickets.map(ticket => (
                                        <TicketCard
                                            key={ticket.id}
                                            ticket={ticket}
                                            category={category}
                                            viewType="category"
                                            onClick={() => onOpenModal(ticket.id)}
                                            onDragStart={() => {}}
                                            onDelete={onDeleteTicket}
                                            onComplete={onCompleteTicket}
                                        />
                                    ))}
                                 </div>
                             )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CategoryView;