// src/components/DataEntryForm.jsx
import React, { useState } from 'react';
import { uploadImage } from '../services/firebase';
import ProfileImage from './ProfileImage';

export default function DataEntryForm({ member, onSave, onCancel, allMembers, userId }) {
    const [formData, setFormData] = useState({
        id: member?.id || null,
        firstName: member?.firstName || '', lastName: member?.lastName || '', alias: member?.alias || '',
        birthDate: member?.birthDate || '', deathDate: member?.deathDate || '', photoUrl: member?.photoUrl || '',
        bio: member?.bio || '', gender: member?.gender || '',
        parents: member?.parents || [], children: member?.children || [], partners: member?.partners || [],
    });
    const [formError, setFormError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
    };
    
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setFormError('');
        try {
            const downloadURL = await uploadImage(userId, file);
            setFormData(prev => ({ ...prev, photoUrl: downloadURL }));
        } catch (error) {
            console.error("Image upload failed:", error);
            setFormError("Image upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRelationshipChange = (type, e) => {
        if (type === 'parents' || type === 'children') {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, [type]: values }));
        } else {
             setFormData(prev => ({ ...prev, [type]: e.target.value || null }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');

        if (formData.deathDate && formData.birthDate && formData.deathDate < formData.birthDate) {
            setFormError("Death date cannot be before birth date.");
            return;
        }
        if (formData.parents.includes(formData.id) || formData.children.includes(formData.id)) {
            setFormError("A person cannot be their own parent or child.");
            return;
        }
        const parentChildOverlap = formData.parents.some(p => formData.children.includes(p));
        if(parentChildOverlap) {
            setFormError("A person cannot be both a parent and a child of the same individual.");
            return;
        }

        onSave(formData);
    };

    // Remove spouse logic from relationship selection
    const potentialParents = allMembers.filter(m => m.id !== formData.id);
    const potentialPartners = allMembers.filter(m => m.id !== formData.id);
    const potentialChildren = allMembers.filter(m => m.id !== formData.id);

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-700">{member ? 'Edit Family Member' : 'Add New Family Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-lg">
                    <legend className="text-lg font-semibold px-2">Basic Information</legend>
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-1">Alias / Nickname (optional)</label>
                        <input type="text" name="alias" id="alias" value={formData.alias} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                        <input type="date" name="birthDate" id="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700 mb-1">Death Date (optional)</label>
                        <input type="date" name="deathDate" id="deathDate" value={formData.deathDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                        <div className="mt-1 flex items-center gap-4">
                           <ProfileImage member={formData} size="medium" />
                           <label htmlFor="photo-upload" className="relative cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                               <span>{isUploading ? 'Uploading...' : 'Upload an image'}</span>
                               <input id="photo-upload" name="photo-upload" type="file" className="sr-only" onChange={handleImageUpload} disabled={isUploading} accept="image/*"/>
                           </label>
                        </div>
                    </div>
                     {/* Removed generation input field */}
                </fieldset>

                <fieldset className="border p-4 rounded-lg">
                     <legend className="text-lg font-semibold px-2">Biography</legend>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                        <textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} rows="5" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>
                </fieldset>
                
                <fieldset className="border p-4 rounded-lg">
                    <legend className="text-lg font-semibold px-2">Relationships</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div>
                            <label htmlFor="parents" className="block text-sm font-medium text-gray-700 mb-1">Parents</label>
                            <select multiple name="parents" id="parents" value={formData.parents} onChange={(e) => handleRelationshipChange('parents', e)} className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                {potentialParents.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple.</p>
                        </div>
                        <div>
                            <label htmlFor="partners" className="block text-sm font-medium text-gray-700 mb-1">Partners</label>
                            <select
                                multiple
                                name="partners"
                                id="partners"
                                value={formData.partners}
                                onChange={e => {
                                    const values = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData(prev => ({ ...prev, partners: values }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                {potentialPartners.map(m => (
                                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple.</p>
                        </div>
                        <div>
                            <label htmlFor="children" className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                            <select multiple name="children" id="children" value={formData.children} onChange={(e) => handleRelationshipChange('children', e)} className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                {potentialChildren.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                            </select>
                             <p className="text-xs text-gray-500 mt-1">Hold Ctrl (or Cmd on Mac) to select multiple.</p>
                        </div>
                    </div>
                </fieldset>

                {formError && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{formError}</div>}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-semibold px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button type="submit" className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm">Save</button>
                </div>
            </form>
        </div>
    );
}