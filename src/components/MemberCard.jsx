import React, { forwardRef } from 'react';
import ProfileImage from './ProfileImage';
import { CARD_WIDTH, CARD_HEIGHT } from './constants';

const MemberCard = forwardRef(function MemberCard({ member, onSelectMember }, ref) {
    return (
        <div 
            ref={ref}
            onClick={() => onSelectMember(member)}
            className="bg-white p-3 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-center z-10 relative"
            style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
        >
            <ProfileImage member={member} size="large" />
            <p className="font-bold text-gray-800 mt-3">{member.firstName} {member.lastName}</p>
            {member.alias && <p className="text-sm text-gray-500 italic">"{member.alias}"</p>}
            <div className="text-xs text-gray-500 mt-1">
                <div>B: {member.birthDate || 'N/A'}</div>
                <div>D: {member.deathDate || 'Present'}</div>
            </div>
        </div>
    );
});
export default MemberCard;