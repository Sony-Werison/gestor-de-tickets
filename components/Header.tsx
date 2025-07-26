
import React from 'react';
import { View } from '../types';

interface HeaderProps {
    activeView: View;
    onViewChange: (view: View) => void;
    onManageCategories: () => void;
    onManageTeams: () => void;
    onShowArchive: () => void;
    isViewOnly: boolean;
    onShare: () => void;
}

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
);

const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, onManageCategories, onManageTeams, onShowArchive, isViewOnly, onShare }) => {
    const navButtonClass = (view: View) =>
        `px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            activeView === view
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700/50'
        }`;

    return (
        <header className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">Backlog Logan & Fluxooh</h1>
                {isViewOnly && (
                    <span className="px-3 py-1 text-sm font-semibold text-yellow-300 bg-yellow-900/50 border border-yellow-700 rounded-full">
                        Modo Solo Lectura
                    </span>
                )}
            </div>
            <nav className="mt-4 flex items-center gap-4 flex-wrap">
                <button onClick={() => onViewChange('status')} className={navButtonClass('status')}>Por Estado</button>
                <button onClick={() => onViewChange('category')} className={navButtonClass('category')}>Por Categoría</button>
                <button onClick={() => onViewChange('project')} className={navButtonClass('project')}>Por Equipo</button>
                <button onClick={() => onViewChange('timeline')} className={navButtonClass('timeline')}>Línea de Tiempo</button>
                <div className="ml-auto flex items-center gap-4">
                    <button onClick={onShare} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 flex items-center gap-2">
                        <ShareIcon />
                        Compartir
                    </button>
                    <button onClick={onShowArchive} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700">Archivo</button>
                    {!isViewOnly && (
                        <>
                            <button onClick={onManageTeams} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700">Gestionar Equipos</button>
                            <button onClick={onManageCategories} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700">Gestionar Categorías</button>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
