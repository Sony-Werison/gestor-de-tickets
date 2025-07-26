
import React from 'react';
import { Ticket, Categories } from '../types';
import Modal from './Modal';

interface ArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    tickets: Ticket[];
    categories: Categories;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ isOpen, onClose, tickets, categories }) => {
    const finishedTickets = (tickets || [])
        .filter(t => t && t.status === 'terminado' && t.completionDate)
        .sort((a, b) => new Date(b.completionDate!).getTime() - new Date(a.completionDate!).getTime());
    
    const categoryColor = (catName: string) => categories[catName]?.color || '#5e5e5e';

    const hasFinishedTickets = finishedTickets.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-3xl">
            <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Archivo de Tickets Completados</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {hasFinishedTickets ? (
                        Object.entries(categories)
                            .map(([catName, category]) => {
                                const categoryFinishedTickets = finishedTickets.filter(t => t.category === catName);
                                if (categoryFinishedTickets.length === 0) return null;

                                return (
                                    <div key={catName}>
                                        <h4 className="font-semibold uppercase text-xs tracking-wider text-white mb-2 pl-2" style={{ borderLeft: `3px solid ${category.color}` }}>
                                            {catName}
                                        </h4>
                                        <div className="space-y-2">
                                            {categoryFinishedTickets.map(ticket => (
                                                <div key={ticket.id} className="bg-gray-700/50 p-3 rounded-md ml-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-500 font-medium w-6 text-right text-sm">{ticket.id}</span>
                                                        <p className="font-medium text-gray-300 flex-1 text-sm">{ticket.title}</p>
                                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                                            {ticket.completionDate ? new Date(ticket.completionDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                            .filter(Boolean)
                    ) : (
                        <p className="text-gray-400">No hay tickets archivados.</p>
                    )}
                </div>
            </div>
             <div className="p-4 bg-gray-800/50 mt-auto flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-600">Cerrar</button>
            </div>
        </Modal>
    );
};

export default ArchiveModal;
