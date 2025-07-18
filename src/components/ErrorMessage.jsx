// src/components/ErrorMessage.jsx
import React from 'react';
import { X } from 'lucide-react';

export default function ErrorMessage({ message, onClose }) {
    return (
        <div className="container mx-auto px-4 my-4">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md relative" role="alert">
                <p className="font-bold">An Error Occurred</p>
                <p>{message}</p>
                <button onClick={onClose} className="absolute top-2 right-2 text-red-600 hover:text-red-800">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
