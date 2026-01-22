import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './Profile.css';

const Profile = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        nickname: '',
        dateOfBirth: '',
        gender: '',
        placeOfBirth: '',
        email: currentUser?.email || '',
        phone: '',
        credits: 0,
        travelPoints: 0,
        interests: [],
        emergencyContacts: []
    });
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const [modalValue, setModalValue] = useState('');
    const [editingContactId, setEditingContactId] = useState(null);
    const [contactForm, setContactForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        relation: '',
        email: '',
        phoneNumbers: ['']
    });
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
                        const data = userDoc.data();
                        // Backfill helper: if full name exists but first name doesn't, split it
                        if (data.fullName && !data.firstName) {
                            const nameParts = data.fullName.split(' ');
                            if (nameParts.length === 1) {
                                data.firstName = nameParts[0];
                                data.lastName = '';
                            } else {
                                data.firstName = nameParts[0];
                                data.lastName = nameParts.slice(1).join(' '); // Join rest as last name roughly
                            }
                        }
                        setUserData({ ...userData, ...data });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, [currentUser]);

    const openModal = (field, currentValue, contactId = null) => {
        setActiveModal(field);
        if (field === 'emergencyContact') {
            if (contactId !== null) {
                const contact = userData.emergencyContacts[contactId];
                setContactForm({ ...contact });
                setEditingContactId(contactId);
            } else {
                setContactForm({
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    relation: '',
                    email: '',
                    phoneNumbers: ['']
                });
                setEditingContactId(null);
            }
        } else {
            setModalValue(currentValue || '');
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalValue('');
        setEditingContactId(null);
    };

    const validateName = (name) => /^[A-Za-z\s]+$/.test(name);
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const saveField = async () => {
        if (!currentUser) return;

        // Validation
        if (['firstName', 'middleName', 'lastName'].includes(activeModal)) {
            // Input is already restricted to alphabets via onChange
        }

        // Email validation (if email is editable via this modal, currently it's read-only in UI but good to have)
        // User asked "in profile data user name and email", email is usually from Auth, but if editable:
        if (activeModal === 'email' && !validateEmail(modalValue)) {
            alert('Please enter a valid email address.');
            return;
        }

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

    const saveEmergencyContact = async () => {
        if (!currentUser) return;

        // Basic validation
        if (!contactForm.firstName || !contactForm.lastName || !contactForm.relation || !contactForm.phoneNumbers[0]) {
            alert('Please fill in all mandatory fields.');
            return;
        }

        // Email Validation
        if (contactForm.email && !validateEmail(contactForm.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        setSaving(true);
        try {
            let updatedContacts = [...(userData.emergencyContacts || [])];
            if (editingContactId !== null) {
                updatedContacts[editingContactId] = contactForm;
            } else {
                updatedContacts.push(contactForm);
            }

            const updatedData = { ...userData, emergencyContacts: updatedContacts };
            await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true });
            setUserData(updatedData);
            closeModal();
        } catch (error) {
            console.error('Error saving emergency contact:', error);
            alert('Failed to save contact.');
        }
        setSaving(false);
    };

    const deleteEmergencyContact = async (index, e) => {
        e.stopPropagation();
        if (!currentUser || !window.confirm('Are you sure you want to delete this contact?')) return;

        try {
            const updatedContacts = userData.emergencyContacts.filter((_, i) => i !== index);
            const updatedData = { ...userData, emergencyContacts: updatedContacts };
            await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true });
            setUserData(updatedData);
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    const handleContactPhoneChange = (index, value) => {
        const newPhones = [...contactForm.phoneNumbers];
        newPhones[index] = '+' + value;
        setContactForm({ ...contactForm, phoneNumbers: newPhones });
    };

    const addContactPhone = () => {
        setContactForm({ ...contactForm, phoneNumbers: [...contactForm.phoneNumbers, ''] });
    };

    const removeContactPhone = (index) => {
        const newPhones = contactForm.phoneNumbers.filter((_, i) => i !== index);
        setContactForm({ ...contactForm, phoneNumbers: newPhones });
    };

    const getInitials = () => {
        if (userData.firstName || userData.lastName) {
            return ((userData.firstName?.[0] || '') + (userData.lastName?.[0] || '')).toUpperCase();
        }
        return 'IY';
    };

    const getFieldConfig = (field) => {
        const configs = {
            firstName: { label: 'First Name', placeholder: 'Enter first name', type: 'text' },
            middleName: { label: 'Middle Name (Optional)', placeholder: 'Enter middle name', type: 'text' },
            lastName: { label: 'Last Name', placeholder: 'Enter last name', type: 'text' },
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
                            {userData.firstName ? (
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
                            <div className="info-item" onClick={() => openModal('firstName', userData.firstName)}>
                                <div className="info-icon">✏️</div>
                                <div className="info-content">
                                    <div className="info-label">First Name</div>
                                    <div className="info-value">{userData.firstName || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>
                            <div className="info-item" onClick={() => openModal('middleName', userData.middleName)}>
                                <div className="info-icon">✏️</div>
                                <div className="info-content">
                                    <div className="info-label">Middle Name</div>
                                    <div className="info-value">{userData.middleName || 'Not set'}</div>
                                </div>
                                <div className="info-arrow">›</div>
                            </div>
                            <div className="info-item" onClick={() => openModal('lastName', userData.lastName)}>
                                <div className="info-icon">✏️</div>
                                <div className="info-content">
                                    <div className="info-label">Last Name</div>
                                    <div className="info-value">{userData.lastName || 'Not set'}</div>
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
                                    <div className="info-value">
                                        {userData.dateOfBirth
                                            ? userData.dateOfBirth.split('-').reverse().join('/')
                                            : 'Not set'}
                                    </div>
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

                    {/* Emergency Contacts */}
                    <section className="profile-section">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-title mb-0">Emergency Contacts</h2>
                            <button
                                onClick={() => openModal('emergencyContact')}
                                className="add-contact-btn"
                            >
                                + Add Contact
                            </button>
                        </div>
                        <div className="info-list">
                            {(!userData.emergencyContacts || userData.emergencyContacts.length === 0) ? (
                                <div className="no-data-placeholder">
                                    No emergency contacts added yet.
                                </div>
                            ) : (
                                userData.emergencyContacts.map((contact, index) => (
                                    <div key={index} className="info-item" onClick={() => openModal('emergencyContact', null, index)}>
                                        <div className="info-icon">🆘</div>
                                        <div className="info-content">
                                            <div className="info-label">{contact.relation}</div>
                                            <div className="info-value">{contact.firstName} {contact.lastName}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                className="delete-icon-btn"
                                                onClick={(e) => deleteEmergencyContact(index, e)}
                                                title="Delete Contact"
                                            >
                                                🗑️
                                            </button>
                                            <div className="info-arrow">›</div>
                                        </div>
                                    </div>
                                ))
                            )}
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
                        <h3 className="modal-title">{activeModal === 'emergencyContact' ? (editingContactId !== null ? 'Edit Emergency Contact' : 'Add Emergency Contact') : getFieldConfig(activeModal).label}</h3>

                        {activeModal === 'emergencyContact' ? (
                            <div className="emergency-form space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="modal-input"
                                            placeholder="First Name *"
                                            value={contactForm.firstName}
                                            onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="modal-input"
                                            placeholder="Middle Name"
                                            value={contactForm.middleName}
                                            onChange={(e) => setContactForm({ ...contactForm, middleName: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="modal-input"
                                            placeholder="Last Name *"
                                            value={contactForm.lastName}
                                            onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 pl-1 -mt-2">Only alphabets allowed for names</p>
                                <select
                                    className="modal-input"
                                    value={contactForm.relation}
                                    onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })}
                                >
                                    <option value="">Select Relation *</option>
                                    <option value="Father">Father</option>
                                    <option value="Mother">Mother</option>
                                    <option value="Brother / Sister">Brother / Sister</option>
                                    <option value="Friend">Friend</option>
                                    <option value="Colleague">Colleague</option>
                                    <option value="Other">Other</option>
                                </select>
                                <input
                                    type="email"
                                    className="modal-input"
                                    placeholder="Email Address"
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                />
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Mobile Number(s) *</label>
                                    {contactForm.phoneNumbers.map((phone, index) => (
                                        <div key={index} className="mb-2 relative">
                                            <PhoneInput
                                                country={'in'}
                                                value={phone}
                                                onChange={(value) => handleContactPhoneChange(index, value)}
                                                enableSearch={true}
                                                containerClass="glass-phone-container"
                                                inputClass="glass-phone-input"
                                                buttonClass="glass-phone-button"
                                                dropdownClass="glass-phone-dropdown"
                                                searchClass="glass-phone-search"
                                            />
                                            {index > 0 && (
                                                <button
                                                    onClick={() => removeContactPhone(index)}
                                                    className="absolute -right-8 top-2 text-red-500 hover:text-red-400"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={addContactPhone}
                                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                    >
                                        + Add Another Number
                                    </button>
                                </div>
                                <button
                                    className="modal-save-btn"
                                    onClick={saveEmergencyContact}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Contact'}
                                </button>
                            </div>
                        ) : activeModal === 'phone' ? (
                            <div className="phone-input-container">
                                <PhoneInput
                                    country={'in'}
                                    value={modalValue}
                                    onChange={(phone) => setModalValue('+' + phone)}
                                    enableSearch={true}
                                    containerClass="glass-phone-container"
                                    inputClass="glass-phone-input"
                                    buttonClass="glass-phone-button"
                                    dropdownClass="glass-phone-dropdown"
                                    searchClass="glass-phone-search"
                                />
                                <button
                                    className="modal-save-btn mt-4"
                                    onClick={saveField}
                                    disabled={saving || !modalValue}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        ) : getFieldConfig(activeModal).type === 'select' ? (
                            <>
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
                                <button
                                    className="modal-save-btn mt-4"
                                    onClick={saveField}
                                    disabled={saving || !modalValue}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    type={getFieldConfig(activeModal).type}
                                    className="modal-input"
                                    placeholder={getFieldConfig(activeModal).placeholder}
                                    value={modalValue}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (['firstName', 'middleName', 'lastName'].includes(activeModal)) {
                                            val = val.replace(/[^A-Za-z\s]/g, '');
                                        }
                                        setModalValue(val);
                                    }}
                                    autoFocus
                                />
                                {['firstName', 'middleName', 'lastName'].includes(activeModal) && (
                                    <p className="text-[10px] text-slate-500 mt-1">Only alphabets allowed</p>
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
                                    className="modal-save-btn mt-4"
                                    onClick={saveField}
                                    disabled={saving || !modalValue}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
