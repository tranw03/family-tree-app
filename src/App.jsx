// src/App.jsx

import React, { useState, useEffect } from 'react';
import { 
    authenticateUser, 
    subscribeToFamilyData, 
    saveMember, 
    deleteMember 
} from './services/firebase';

// Import UI Components
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import FamilyTreeView from './components/FamilyTreeView';
import DataEntryForm from './components/DataEntryForm';
import MemberDetailView from './components/MemberDetailView';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { User } from 'lucide-react'; // Import the User icon

export default function App() {
    const [view, setView] = useState('tree');
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [deletingMember, setDeletingMember] = useState(null);
    
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDataInitialized, setIsDataInitialized] = useState(false);

    // --- Authentication ---
    useEffect(() => {
        const initApp = async () => {
            try {
                const uid = await authenticateUser();
                setUserId(uid);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };
        initApp();
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        if (!userId) return;
    
        // Set a timeout to prevent the app from loading forever
        const loadingTimeout = setTimeout(() => {
            if (isLoading) {
                setError("The application is taking too long to load. Please check your internet connection or refresh the page.");
                setIsLoading(false);
            }
        }, 15000); // 15 seconds
    
        const unsubscribe = subscribeToFamilyData(
            userId,
            (membersData) => {
                setMembers(membersData);
                setIsDataInitialized(true); 
                // Only stop loading if we have data or an error
                if (membersData.length > 0 || error) {
                    setIsLoading(false);
                    clearTimeout(loadingTimeout);
                }
            },
            (errorMessage) => {
                setError(errorMessage);
                setIsLoading(false);
                clearTimeout(loadingTimeout);
            }
        );
    
        
        return () => {
            unsubscribe();
            clearTimeout(loadingTimeout);
        };
    }, [userId, error]);

    // --- Event Handlers ---
    const handleSelectMember = (member) => setSelectedMember(member);
    const handleCloseDetail = () => setSelectedMember(null);
    const handleAddNew = () => { setEditingMember(null); setView('form'); };
    const handleEdit = (member) => { setEditingMember(member); setSelectedMember(null); setView('form'); };
    const handleCancelForm = () => { setEditingMember(null); setView('tree'); };
    const handleDeleteRequest = (member) => setDeletingMember(member);

    const handleSave = async (newData) => {
        if (!userId) return;
        // No need to set loading here, UI updates will be real-time
        try {
            const originalData = members.find(m => m.id === newData.id);
            await saveMember(userId, newData, originalData);
            setView('tree');
            setEditingMember(null);
        } catch (e) {
            console.error("Error saving member:", e);
            setError("Failed to save data. Please try again.");
        }
    };

    const confirmDelete = async () => {
        if (!deletingMember || !userId) return;
        try {
            await deleteMember(userId, deletingMember.id);
            setDeletingMember(null);
            setSelectedMember(null);
        } catch (e) {
            console.error("Error deleting member:", e);
            setError("Failed to delete member. Please try again.");
        }
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }
        if (error) {
            return <ErrorMessage message={error} onClose={() => setError(null)} />;
        }
        // After loading, if data is initialized but there are no members, show the empty state.
        if (isDataInitialized && members.length === 0) {
            return (
                <div className="text-center py-16 text-gray-500">
                    <User size={48} className="mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold">Your Family Tree is Empty</h2>
                    <p className="mt-2">Click "Add Member" above to start building your tree.</p>
                </div>
            );
        }
        // Only render the tree view if there are members
        if (members.length > 0) {
            return (
                <>
                    {view === 'tree' && <FamilyTreeView members={members} onSelectMember={handleSelectMember} />}
                    {view === 'form' && <DataEntryForm member={editingMember} onSave={handleSave} onCancel={handleCancelForm} allMembers={members} userId={userId} />}
                </>
            );
        }
        // Fallback case, should not be reached but good for safety
        return null;
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <Header onAddNew={handleAddNew} currentView={view} />
            <main className="p-4 md:p-8">
                {renderContent()}
            </main>
            {selectedMember && <MemberDetailView member={selectedMember} onClose={handleCloseDetail} onEdit={handleEdit} onDelete={handleDeleteRequest} allMembers={members} />}
            {deletingMember && <ConfirmDeleteModal member={deletingMember} onConfirm={confirmDelete} onCancel={() => setDeletingMember(null)} />}
            <Footer />
        </div>
    );
}
