
import React, { useState } from 'react';
import Modal from './Modal';

interface TimelineSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    allowTeamParallelism: boolean;
    onToggleTeamParallelism: () => void;
    holidays: string[];
    onAddHoliday: (date: string) => void;
    onRemoveHoliday: (date: string) => void;
    prioritizeExecuting: boolean;
    onTogglePrioritizeExecuting: () => void;
    avoidTimelineGaps: boolean;
    onToggleAvoidTimelineGaps: () => void;
}

const TimelineSettingsModal: React.FC<TimelineSettingsModalProps> = ({
    isOpen,
    onClose,
    allowTeamParallelism,
    onToggleTeamParallelism,
    holidays,
    onAddHoliday,
    onRemoveHoliday,
    prioritizeExecuting,
    onTogglePrioritizeExecuting,
    avoidTimelineGaps,
    onToggleAvoidTimelineGaps,
}) => {
    const [newHoliday, setNewHoliday] = useState('');

    const handleAddHoliday = (e: React.FormEvent) => {
        e.preventDefault();
        if (newHoliday) {
            onAddHoliday(newHoliday);
            setNewHoliday('');
        }
    };

    const TrashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="text-xl font-bold">Configurações da Linha do Tempo</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Scheduling Logic Section */}
                <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-300">Lógica de Agendamento e Prioridade</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                             <input
                                type="checkbox"
                                id="avoid-gaps-toggle"
                                checked={avoidTimelineGaps}
                                onChange={onToggleAvoidTimelineGaps}
                                className="h-5 w-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500 bg-gray-700 cursor-pointer"
                            />
                            <label htmlFor="avoid-gaps-toggle" className="text-md font-medium text-gray-200 cursor-pointer">
                                Preencher lacunas automaticamente
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="parallel-toggle-modal"
                                checked={allowTeamParallelism}
                                onChange={onToggleTeamParallelism}
                                className="h-5 w-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500 bg-gray-700 cursor-pointer"
                            />
                            <label htmlFor="parallel-toggle-modal" className="text-md font-medium text-gray-200 cursor-pointer">
                                Permitir paralelismo entre equipes
                            </label>
                        </div>
                         <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="priority-toggle-modal"
                                checked={prioritizeExecuting}
                                onChange={onTogglePrioritizeExecuting}
                                className="h-5 w-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500 bg-gray-700 cursor-pointer"
                            />
                            <label htmlFor="priority-toggle-modal" className="text-md font-medium text-gray-200 cursor-pointer">
                                Prioridade Estrita para Tickets 'Em Execução'
                            </label>
                        </div>
                    </div>
                     <p className="text-sm text-gray-400 pt-2">
                        Ajuste como os tickets são organizados. Ativar "Preencher lacunas" força os tickets a se encadearem, a menos que um ticket seja explicitamente independente.
                    </p>
                    <div className="pt-2">
                        <h5 className="font-semibold text-gray-200 mb-1">Encadeamento e Dependências</h5>
                        <p className="text-sm text-gray-400">
                            Ao editar um ticket, marque "Depende do ticket anterior" para que sua data de início seja calculada automaticamente com base no término do anterior. Tickets não dependentes criam "ilhas" de trabalho.
                        </p>
                    </div>
                </div>

                {/* Holiday Management Section */}
                <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-300">Gerenciar Feriados e Dias Não-Úteis</h4>
                    <form onSubmit={handleAddHoliday} className="flex items-center gap-3">
                        <input
                            type="date"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                            required
                        />
                        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                            Adicionar
                        </button>
                    </form>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {holidays.length > 0 ? (
                            holidays.map((holiday) => (
                                <div key={holiday} className="flex items-center justify-between p-2 bg-gray-700/60 rounded-md">
                                    <span className="text-sm text-gray-300 font-mono">
                                        {new Date(holiday + 'T12:00:00Z').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={() => onRemoveHoliday(holiday)}
                                        className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-500 text-white"
                                        title="Remover Feriado"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 text-sm py-4">Não há feriados cadastrados.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-800/50 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500 font-semibold">
                    Fechar
                </button>
            </div>
        </Modal>
    );
};

export default TimelineSettingsModal;
