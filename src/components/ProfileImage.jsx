// src/components/ProfileImage.jsx
import React from 'react';

export default function ProfileImage({ member, size = 'large' }) {
    const getInitials = (firstName = '', lastName = '') => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const sizeClasses = {
        medium: 'w-16 h-16 text-xl',
        large: 'w-24 h-24 text-3xl',
        xlarge: 'w-40 h-40 text-5xl',
    };

    return (
        <>
            {member.photoUrl ? (
                <img 
                    src={member.photoUrl} 
                    alt={`${member.firstName} ${member.lastName}`}
                    className={`${sizeClasses[size]} rounded-full mx-auto object-cover border-4 border-gray-200 shadow-sm`}
                    onError={(e) => { e.target.style.display='none'; }} // Hide if image fails to load
                />
            ) : (
                <div className={`${sizeClasses[size]} rounded-full mx-auto bg-blue-200 text-blue-700 font-bold flex items-center justify-center border-4 border-gray-200 shadow-sm`}>
                    {getInitials(member.firstName, member.lastName)}
                </div>
            )}
        </>
    );
}