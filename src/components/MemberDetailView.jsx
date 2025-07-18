// src/components/MemberDetailView.jsx
import React, { useCallback } from 'react';
import ProfileImage from './ProfileImage';
import { X, User, Calendar, BookOpen, Link2, Share2 } from 'lucide-react';

const calculateAge = (birthDate, deathDate) => {
    if (!birthDate) return null;
    const start = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    let age = end.getFullYear() - start.getFullYear();
    const m = end.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < start.getDate())) {
        age--;
    }
    return age;
};

export default function MemberDetailView({ member, onClose, onEdit, onDelete, allMembers }) {
    const getMemberName = useCallback((id) => {
        const found = allMembers.find(m => m.id === id);
        return found ? `${found.firstName} ${found.lastName}` : 'Unknown';
    }, [allMembers]);
    
    const age = calculateAge(member.birthDate, member.deathDate);

    const getSiblings = useCallback(() => {
        if (!member.parents || member.parents.length === 0) {
            return [];
        }
        // Find all members who share at least one parent, but are not the member themselves
        return allMembers.filter(other => {
            if (other.id === member.id || !other.parents) {
                return false;
            }
            return other.parents.some(pId => member.parents.includes(pId));
        });
    }, [member, allMembers]);

    const siblings = getSiblings();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-30 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0 text-center">
                            <ProfileImage member={member} size="xlarge" />
                            <div className="mt-4 flex justify-center gap-2">
                                <button onClick={() => onEdit(member)} className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full hover:bg-blue-200">Edit</button>
                                <button onClick={() => onDelete(member)} className="bg-red-100 text-red-800 text-sm font-semibold px-4 py-1 rounded-full hover:bg-red-200">Delete</button>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-3xl font-bold text-gray-800">{member.firstName} {member.lastName}</h2>
                            {member.alias && <p className="text-lg text-gray-600 italic">"{member.alias}"</p>}
                            <div className="text-gray-500 mt-1 space-y-1">
                                <p><Calendar size={14} className="inline mr-1" /> Born: {member.birthDate || 'N/A'}</p>
                                <p><Calendar size={14} className="inline mr-1" /> Died: {member.deathDate || 'Present'}</p>
                                <p><User size={14} className="inline mr-1" /> Gender: {member.gender || 'N/A'}</p>
                                {age !== null && <p><User size={14} className="inline mr-1" /> Age: {age}</p>}
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <h3 className="font-semibold text-lg text-gray-700 mb-2 flex items-center gap-2"><BookOpen size={18}/> Biography</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{member.bio || 'No biography available.'}</p>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                                <h3 className="font-semibold text-lg text-gray-700 mb-2 flex items-center gap-2"><Link2 size={18}/> Relationships</h3>
                                <div className="space-y-2 text-sm">
                                    {member.parents?.length > 0 && <div><strong>Parents:</strong> {member.parents.map(getMemberName).join(', ')}</div>}
                                    {siblings.length > 0 && <div><strong>Siblings:</strong> {siblings.map(s => `${s.firstName} ${s.lastName}`).join(', ')}</div>}
                                    {member.partners?.length > 0 && (
                                  <div><strong>Partners:</strong> {member.partners.map(getMemberName).join(', ')}</div>
                                )}
                                    {member.children?.length > 0 && <div><strong>Children:</strong> {member.children.map(getMemberName).join(', ')}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}