import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfileModal = ({ isOpen, onClose }) => {
    const { currentUser, saveManualProfile } = useAuth();

    // We initialize state when the modal opens or currentUser changes
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.displayName || '');
            setPhoneNumber(currentUser.phoneNumber || '');
            setEmergencyContact(currentUser.emergencyContact || '');

            // Auto edit mode if missing contact
            if (!currentUser.emergencyContact) {
                setIsEditing(true);
            }
        }
    }, [currentUser, isOpen]);

    if (!isOpen || !currentUser) return null;

    const handleSave = (e) => {
        e.preventDefault();
        // Fallback to existing location if any
        const locationData = currentUser.location || null;

        // This leverages the existing saveManualProfile function 
        // which updates the global state seamlessly!
        saveManualProfile(name, phoneNumber, emergencyContact, locationData);
        setIsEditing(false);
        onClose();
    };

    const inputClasses = "w-full rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:outline-none p-3";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md relative animate-fade-in-up">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6">
                    {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-20 h-20 rounded-full mx-auto shadow-sm border border-stone-200 mb-4" />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm text-4xl border border-emerald-600 mx-auto mb-4">
                            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-stone-800">Your Profile</h2>
                </div>

                {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">
                                Emergency Contact <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={emergencyContact}
                                onChange={(e) => setEmergencyContact(e.target.value)}
                                className={`${inputClasses} border-red-200 bg-red-50`}
                                placeholder="Required for complete SOS features"
                                required
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 bg-stone-100 text-stone-700 font-medium py-3 rounded-xl hover:bg-stone-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-stone-800 text-white font-medium py-3 rounded-xl hover:bg-stone-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                            <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">Full Name</label>
                            <div className="font-medium text-stone-800">{currentUser.displayName || 'Not Set'}</div>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                            <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">Phone Number</label>
                            <div className="font-medium text-stone-800">{currentUser.phoneNumber || 'Not Set'}</div>
                        </div>
                        <div className={`rounded-xl p-4 border ${currentUser.emergencyContact ? 'bg-stone-50 border-stone-100' : 'bg-red-50 border-red-200'}`}>
                            <label className="block text-xs font-semibold uppercase text-stone-400 mb-1">Emergency Contact</label>
                            <div className={`font-medium ${currentUser.emergencyContact ? 'text-stone-800' : 'text-red-500'}`}>
                                {currentUser.emergencyContact || 'Pending Setup - Required for SOS!'}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full bg-stone-800 text-white font-medium py-3 rounded-xl hover:bg-stone-700 transition-colors shadow-md mt-6"
                        >
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
