import React, { useState, useEffect } from 'react';
import { Ticket, Categories, ProjectType } from '../types';
import Modal from './Modal';

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (ticket: Omit<Ticket, 'status' | 'order' | 'completionDate' | 'startDate'> & { originalId?: number }) => void;
    ticketToEdit?: Ticket | null;
    categories: Categories;
    teams: ProjectType[];
    tickets: Ticket[];
}

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, onSubmit, ticketToEdit, categories, teams, tickets }) => {
    const [id, setId] = useState<number>(0);
    const [title, setTitle] = useState('');
    const [project, setProject] = useState<ProjectType>('Logan');
    const [category, setCategory] = useState('');
    const [durationValue, setDurationValue] = useState(2);
    const [durationUnit, setDurationUnit] = useState('days');
    const [isDependent, setIsDependent] = useState(true);

    useEffect(() => {
        if (isOpen) {
            if (ticketToEdit) {
                setId(ticketToEdit.id);
                setTitle(ticketToEdit.title);
                setProject(ticketToEdit.project);
                setCategory(ticketToEdit.category);
                setIsDependent(ticketToEdit.isDependent);
                if (ticketToEdit.duration % 5 === 0 && ticketToEdit.duration > 0) {
                    setDurationValue(ticketToEdit.duration / 5);
                    setDurationUnit('weeks');
                } else {
                    setDurationValue(ticketToEdit.duration);
                    setDurationUnit('days');
                }
            } else {
                const newId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;
                setId(newId);
                setTitle('');
                setProject(teams[0] || '');
                setCategory(Object.keys(categories)[0] || '');
                setDurationValue(2);
                setDurationUnit('days');
                setIsDependent(true);
            }
        }
    }, [isOpen, ticketToEdit, tickets, categories, teams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const durationInDays = durationUnit === 'weeks' ? durationValue * 5 : durationValue;
        onSubmit({
            originalId: ticketToEdit?.id,
            id,
            title,
            project,
            category,
            duration: durationInDays,
            isDependent,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                 <h3 className="text-xl font-bold mb-6">{ticketToEdit ? 'Editar Ticket' : 'Añadir Nuevo Ticket'}</h3>
                 <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="ticket-id-input" className="block text-sm font-medium text-gray-300 mb-1">ID del Ticket</label>
                            <input type="number" id="ticket-id-input" value={id} onChange={e => setId(parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" required />
                        </div>
                        <div>
                            <label htmlFor="ticket-category" className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                            <select id="ticket-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                                {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="ticket-title" className="block text-sm font-medium text-gray-300 mb-1">Título</label>
                        <input type="text" id="ticket-title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="ticket-duration-value" className="block text-sm font-medium text-gray-300 mb-1">Duración</label>
                            <input type="number" id="ticket-duration-value" value={durationValue} onChange={e => setDurationValue(parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" min="1" />
                        </div>
                        <div>
                            <label htmlFor="ticket-duration-unit" className="block text-sm font-medium text-gray-300 mb-1">Unidad</label>
                            <select id="ticket-duration-unit" value={durationUnit} onChange={e => setDurationUnit(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                                <option value="days">Días</option>
                                <option value="weeks">Semanas</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div>
                            <label htmlFor="ticket-project" className="block text-sm font-medium text-gray-300 mb-1">Equipo</label>
                            <select id="ticket-project" value={project} onChange={e => setProject(e.target.value as ProjectType)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                                {teams.map(team => <option key={team} value={team}>{team}</option>)}
                            </select>
                       </div>
                       <div className="flex items-end pb-1">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="ticket-dependency" checked={isDependent} onChange={e => setIsDependent(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700" />
                                <label htmlFor="ticket-dependency" className="text-sm text-gray-300">Depende del ticket anterior</label>
                            </div>
                       </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Guardar</button>
                    </div>
                 </form>
            </div>
        </Modal>
    );
};

export default TicketModal;