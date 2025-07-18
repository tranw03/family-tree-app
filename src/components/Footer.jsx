// src/components/Footer.jsx
import React from 'react';

export default function Footer() {
    return (
        <footer className="text-center py-6 text-sm text-gray-500">
            <p>Family Tree Prototype &copy; {new Date().getFullYear()}</p>
        </footer>
    );
}
