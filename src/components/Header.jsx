// src/components/Header.jsx
import React from 'react';
import { Plus } from 'lucide-react';

export default function Header({ onAddNew, currentView }) {
    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-700 tracking-tight">
                    Our Family Tree
                </h1>
                {currentView === 'tree' && (
                    <button
                        onClick={onAddNew}
                        className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Add Member</span>
                    </button>
                )}
            </div>
        </header>
    );
}