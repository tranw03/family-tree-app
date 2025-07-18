// src/components/LoadingSpinner.jsx
import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
    );
}