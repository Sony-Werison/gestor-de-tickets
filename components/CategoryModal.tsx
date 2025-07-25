
import React, { useState } from 'react';
import { Categories } from '../types';
import Modal from './Modal';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Categories;
    onAddCategory: (name: string, color: string) => void;
    onDeleteCategory: (name: string) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, categories, onAddCategory, onDeleteCategory }) => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#5e5e5e');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCatName && !categories[newCatName]) {
            onAddCategory(newCatName, newCatColor);
            setNewCatName('');
        } else {
            alert("Nombre de categoría inválido o ya existente.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <h3 className="text-xl font-bold mb-6">Gestionar Categorías</h3>
                <div className="mb-6 space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(categories).map(([name, cat]) => (
                         <div key={name} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-md">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: cat.color }}></div>
                            <span className="flex-grow text-white">{name}</span>
                            <button onClick={() => onDeleteCategory(name)} className="text-red-400 hover:text-red-600 text-sm">Eliminar</button>
                        </div>
                    ))}
                </div>
                 <form onSubmit={handleAdd}>
                    <h4 className="text-lg font-semibold mb-3">Añadir Nueva Categoría</h4>
                    <div className="flex items-center gap-4">
                        <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nombre de la Categoría" className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" required />
                        <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="bg-gray-700 rounded-md h-10 w-10 p-1 cursor-pointer border-2 border-transparent" />
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

export default CategoryModal;