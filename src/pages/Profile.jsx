import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './Profile.css';

const Profile = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState({
        fullName: '',
        nickname: '',
        dateOfBirth: '',
        gender: '',
        placeOfBirth: '',
        email: currentUser?.email || '',
        phone: '',
        credits: 0,
        travelPoints: 0,
        interests: []
    });
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const [modalValue, setModalValue] = useState('');
    const [saving, setSaving] = useState(false);

    const availableInterests = [
        { id: 'business', label: 'Business', emoji: '💼' },
        { id: 'follow-heart', label: 'Follow Your Heart', emoji: '❤️' },
        { id: 'literature', label: 'Literature', emoji: '📚' },
        { id: 'nature-wildlife', label: 'Nature & Wildlife', emoji: '🌿' },
        { id: 'science-tech', label: 'Science & Technology', emoji: '🔬' },
        { id: 'travel-adventure', label: 'Travel & Adventure', emoji: '✈️' }
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData({ ...userData, ...userDoc.data() });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, [currentUser]);

    const openModal = (field, currentValue) => {
        setActiveModal(field);
        setModalValue(currentValue || '');
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalValue('');
    };

    const saveField = async () => {
        if (!currentUser) return;

        setSaving(true);
        try {
            const updatedData = { ...userData, [activeModal]: modalValue };
            await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true });
            setUserData(updatedData);
            closeModal();
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save. Please try again.');
        }
        setSaving(false);
    };

    const toggleInterest = async (interestId) => {
        if (!currentUser) return;

        const newInterests = userData.interests.includes(interestId)
            ? userData.interests.filter(id => id !== interestId)
            : [...userData.interests, interestId];

        try {
            const updatedData = { ...userData, interests: newInterests };
            await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true });
            setUserData(updatedData);
        } catch (error) {
            console.error('Error updating interests:', error);
        }
    };

    const getInitials = () => {
        if (userData.fullName) {
            return userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'IY';
    };

    const getFieldConfig = (field) => {
        const configs = {
            fullName: { label: 'Full Name', placeholder: 'Enter your full name', type: 'text' },
            nickname: {
                label: 'What do you want to be called?',
                placeholder: 'Nickname *',
                type: 'text',
                rules: ['Username available', 'Must be 4-10 characters long', 'Should only be alphanumeric']
            },
            dateOfBirth: { label: 'Date of Birth', placeholder: 'DD/MM/YYYY', type: 'date' },
            gender: { label: 'Gender', placeholder: 'Select gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
            placeOfBirth: { label: 'Place of Birth', placeholder: 'Enter your place of birth', type: 'text' },
            phone: { label: 'Phone Number', placeholder: 'Enter your phone number', type: 'tel' }
        };
        return configs[field] || {};
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* IY Passport Card */}
                <div className="iy-passport-card">
                    <div className="passport-header">IY PASSPORT</div>
                    <div className="passport-avatar">
                        <div className="avatar-circle">
                            {userData.fullName ? (
                                <span className="avatar-initials">{getInitials()}</span>
                            ) : (
                                <span className="avatar-emoji">😎</span>
                            )}
                        </div>
                    </div>
                    <div className="passport-badge">IY Citizen</div>
                    <div className="passport-tagline">Citizen of Infinite Yatra</div>
                </div>

                {/* Main Content */}
                <div className="profile-main">
                    {/* General Information */}
                    <section className="profile-section">
                        <h2 className="section-title">General Information</h2>
                        <div className="info-list">
                            <div className="info-item" onClick={() => openModal('fullName', userData.fullName)}>
                                <div className="info-icon">✏️</div>
                                <div className="info-content">
                                    <div className="info-label">Full Name</div>
                                    <div className="info-value">{userData.fullName || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>

                            <div className="info-item" onClick={() => openModal('nickname', userData.nickname)}>
                                <div className="info-icon">👤</div>
                                <div className="info-content">
                                    <div className="info-label">Set Nickname</div>
                                    <div className="info-value">{userData.nickname || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>

                            <div className="info-item" onClick={() => openModal('dateOfBirth', userData.dateOfBirth)}>
                                <div className="info-icon">🎂</div>
                                <div className="info-content">
                                    <div className="info-label">Set Date of Birth</div>
                                    <div className="info-value">{userData.dateOfBirth || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>

                            <div className="info-item" onClick={() => openModal('gender', userData.gender)}>
                                <div className="info-icon">⚧</div>
                                <div className="info-content">
                                    <div className="info-label">Gender</div>
                                    <div className="info-value">{userData.gender || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>

                            <div className="info-item" onClick={() => openModal('placeOfBirth', userData.placeOfBirth)}>
                                <div className="info-icon">📍</div>
                                <div className="info-content">
                                    <div className="info-label">Set Place of Birth</div>
                                    <div className="info-value">{userData.placeOfBirth || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>
                        </div>
                    </section>

                    {/* Communication Preferences */}
                    <section className="profile-section">
                        <h2 className="section-title">Communication Preferences</h2>
                        <div className="info-list">
                            <div className="info-item">
                                <div className="info-icon">📧</div>
                                <div className="info-content">
                                    <div className="info-label">Email</div>
                                    <div className="info-value">{userData.email}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>

                            <div className="info-item" onClick={() => openModal('phone', userData.phone)}>
                                <div className="info-icon">📱</div>
                                <div className="info-content">
                                    <div className="info-label">Phone Number</div>
                                    <div className="info-value">{userData.phone || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="profile-sidebar">
                    {/* Travel Credits */}
                    <section className="profile-section credits-section">
                        <h2 className="section-title">Travel Credits</h2>
                        <div className="credits-content">
                            <div className="credits-item">
                                <div className="credits-icon">💰</div>
                                <div className="credits-info">
                                    <div className="credits-label">Available Credits</div>
                                    <div className="credits-value">{userData.credits}</div>
                                </div>
                            </div>
                            <div className="credits-link">
                                <span>📜</span> Transaction History
                                <span className="info-arrow">›</span>
                            </div>
                        </div>
                    </section>

                    {/* For the Culture */}
                    <section className="profile-section culture-section">
                        <h2 className="section-title">For the Culture</h2>
                        <div className="culture-content">
                            <div className="culture-points">
                                <span className="culture-icon">🏆</span>
                                <span className="culture-label">S2o:</span>
                                <span className="culture-value">{userData.travelPoints}</span>
                                <span className="info-arrow">›</span>
                            </div>
                            <div className="culture-interests">
                                <div className="interests-label">Selected Cultures:</div>
                                <div className="interests-grid">
                                    {availableInterests.map(interest => (
                                        <button
                                            key={interest.id}
                                            className={`interest-badge ${userData.interests.includes(interest.id) ? 'active' : ''}`}
                                            onClick={() => toggleInterest(interest.id)}
                                        >
                                            <span className="interest-emoji">{interest.emoji}</span>
                                            <span className="interest-label">{interest.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal Dialog */}
            {activeModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>×</button>
                        <h3 className="modal-title">{getFieldConfig(activeModal).label}</h3>

                        {getFieldConfig(activeModal).type === 'select' ? (
                            <select
                                className="modal-input"
                                value={modalValue}
                                onChange={(e) => setModalValue(e.target.value)}
                            >
                                <option value="">Select...</option>
                                {getFieldConfig(activeModal).options.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={getFieldConfig(activeModal).type}
                                className="modal-input"
                                placeholder={getFieldConfig(activeModal).placeholder}
                                value={modalValue}
                                onChange={(e) => setModalValue(e.target.value)}
                                autoFocus
                            />
                        )}

                        {getFieldConfig(activeModal).rules && (
                            <div className="modal-rules">
                                {getFieldConfig(activeModal).rules.map((rule, index) => (
                                    <div key={index} className="rule-item">
                                        <span className="rule-icon">✓</span>
                                        <span className="rule-text">{rule}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="modal-save-btn"
                            onClick={saveField}
                            disabled={saving || !modalValue}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
