import React from 'react';
import { View } from '../types';

interface HeaderProps {
    activeView: View;
    onViewChange: (view: View) => void;
    onManageCategories: () => void;
    onManageTeams: () => void;
    onShowArchive: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, onManageCategories, onManageTeams, onShowArchive }) => {
    const navButtonClass = (view: View) =>
        `px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            activeView === view
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700/50'
        }`;

    return (
        <header className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-white">Backlog Logan & Fluxooh</h1>
            <nav className="mt-4 flex items-center gap-4 flex-wrap">
                <button onClick={() => onViewChange('status')} className={navButtonClass('status')}>Por Estado</button>
                <button onClick={() => onViewChange('category')} className={navButtonClass('category')}>Por Categoría</button>
                <button onClick={() => onViewChange('project')} className={navButtonClass('project')}>Por Equipo</button>
                <button onClick={() => onViewChange('timeline')} className={navButtonClass('timeline')}>Línea de Tiempo</button>
                <div className="ml-auto flex items-center gap-4">
                    <button onClick={onShowArchive} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700">Archivo</button>
                    <button onClick={onManageTeams} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700">Gestionar Equipos</button>
                    <button onClick={onManageCategories} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700">Gestionar Categorías</button>
                </div>
            </nav>
        </header>
    );
};

export default Header;