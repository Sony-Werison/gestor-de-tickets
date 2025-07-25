import React, { useState } from 'react';
import { ProjectType } from '../types';
import Modal from './Modal';

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    teams: ProjectType[];
    onAddTeam: (name: string) => void;
    onDeleteTeam: (name: string) => void;
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, teams, onAddTeam, onDeleteTeam }) => {
    const [newTeamName, setNewTeamName] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTeamName) {
            onAddTeam(newTeamName);
            setNewTeamName('');
        } else {
            alert("El nombre del equipo no puede estar vacío.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h3 className="text-xl font-bold mb-6">Gestionar Equipos</h3>
                <div className="mb-6 space-y-2 max-h-60 overflow-y-auto">
                    {teams.map(name => (
                         <div key={name} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-md">
                            <span className="flex-grow text-white">{name}</span>
                            <button onClick={() => onDeleteTeam(name)} className="text-red-400 hover:text-red-600 text-sm">Eliminar</button>
                        </div>
                    ))}
                </div>
                 <form onSubmit={handleAdd}>
                    <h4 className="text-lg font-semibold mb-3">Añadir Nuevo Equipo</h4>
                    <div className="flex items-center gap-4">
                        <input type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Nombre del Equipo" className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" required />
                        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Añadir</button>
                    </div>
                </form>
            </div>
            <div className="p-4 bg-gray-800/50 mt-auto flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-600">Cerrar</button>
            </div>
        </Modal>
    );
};

export default TeamModal;