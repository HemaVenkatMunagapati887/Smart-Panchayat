import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { updateProfile, changePassword } from '../services/api';
import { t } from '../data';

export default function AccountSettings() {
    const { user, lang, toast, updateUser } = useApp();
    const tr = t[lang];
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        gender: user?.gender || 'Prefer not to say',
        avatar: user?.avatar || '',
        file: null
    });
    const [preview, setPreview] = useState(null);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                name: user.name,
                phone: user.phone || '',
                gender: user.gender || 'Prefer not to say',
                avatar: user.avatar || ''
            }));
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                return toast.error('File size exceeds 4MB limit');
            }
            setProfile({ ...profile, file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!user?.token) return toast.error('Session error. Please login again.');

        setLoading(true);

        const formData = new FormData();
        formData.append('name', profile.name);
        formData.append('phone', profile.phone);
        formData.append('gender', profile.gender);
        if (profile.file) {
            formData.append('avatar', profile.file);
        } else if (profile.avatar) {
            formData.append('avatar', profile.avatar);
        }

        const { data, ok, error } = await updateProfile(formData, user.token);
        if (ok && data.user) {
            toast.success('Profile updated successfully');
            updateUser(data.user);
            setProfile(prev => ({ ...prev, file: null }));
            setPreview(null);
        } else {
            const errMsg = data?.message || data?.errors?.[0]?.message || error || 'Failed to update profile';
            toast.error(errMsg);
        }
        setLoading(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (passwords.newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        if (!user?.token) return toast.error('Session error. Please login again.');

        setLoading(true);
        const { data, ok, error } = await changePassword({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword
        }, user.token);

        if (ok) {
            toast.success('Password changed successfully');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            const errMsg = data?.message || data?.errors?.[0]?.message || error || 'Failed to change password';
            toast.error(errMsg);
        }
        setLoading(false);
    };

    const getAvatarUrl = () => {
        if (preview) return preview;
        if (!profile.avatar) return null;
        if (profile.avatar.startsWith('http')) return profile.avatar;
        return profile.avatar;
    };

    const avatarUrl = getAvatarUrl();
    const initials = (profile.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const passwordStrength = (() => {
        const pw = passwords.newPassword;
        if (!pw) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 6) score++;
        if (pw.length >= 10) score++;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
        if (score <= 2) return { level: 2, label: 'Fair', color: '#f97316' };
        if (score <= 3) return { level: 3, label: 'Good', color: '#f5b800' };
        return { level: 4, label: 'Strong', color: '#22c55e' };
    })();

    return (
        <div className="fade-in" style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px' }}>
            {/* Page Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{
                    fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6,
                    display: 'flex', alignItems: 'center', gap: 10
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--primary-600)' }}>manage_accounts</span>
                    {tr.accountSettings || 'Account Settings'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Manage your personal information and security preferences
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 24,
                background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', padding: 4
            }}>
                {[
                    { key: 'profile', icon: 'person', label: 'Personal Profile' },
                    { key: 'security', icon: 'shield_lock', label: 'Security & Password' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '12px 16px', border: 'none',
                            background: activeTab === tab.key ? '#fff' : 'transparent',
                            fontWeight: 600, fontSize: 14,
                            color: activeTab === tab.key ? 'var(--primary-600)' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'profile' ? (
                <form onSubmit={handleProfileUpdate}>
                    {/* Avatar Card */}
                    <div style={{
                        background: '#fff', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--gray-200)', padding: 28, marginBottom: 20,
                        display: 'flex', alignItems: 'center', gap: 28
                    }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                                border: '3px solid var(--primary-100)',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                                background: avatarUrl ? '#fff' : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" style={{
                                        width: '100%', height: '100%', objectFit: 'cover'
                                    }} />
                                ) : (
                                    <span style={{
                                        fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1
                                    }}>{initials}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: 'var(--primary-600)', color: '#fff',
                                    border: '2.5px solid #fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)', transition: 'transform 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>photo_camera</span>
                            </button>
                            <input
                                ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange} style={{ display: 'none' }}
                            />
                        </div>

                        {/* Avatar Info */}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                {user?.name || 'User'}
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>
                                {user?.email}
                            </p>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                                color: 'var(--primary-700)', background: 'var(--primary-50)',
                                padding: '3px 10px', borderRadius: 'var(--radius-full)', marginTop: 6
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
                                {user?.role || 'citizen'}
                            </span>

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
                                <button
                                    type="button" className="btn btn-outline btn-sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>upload</span>
                                    Change Photo
                                </button>
                                {(preview || profile.avatar) && (
                                    <button
                                        type="button" className="btn btn-sm"
                                        style={{ color: 'var(--red-500)', background: 'rgba(239,68,68,0.08)' }}
                                        onClick={() => { setProfile({ ...profile, avatar: '', file: null }); setPreview(null); }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                                        Remove
                                    </button>
                                )}
                                {preview && (
                                    <button
                                        type="button" className="btn btn-sm"
                                        style={{ color: 'var(--text-secondary)' }}
                                        onClick={() => { setPreview(null); setProfile({ ...profile, file: null }); }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Details Card */}
                    <div style={{
                        background: '#fff', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--gray-200)', padding: 28, marginBottom: 20
                    }}>
                        <h3 style={{
                            fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
                            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-600)' }}>badge</span>
                            Personal Information
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Full Name <span className="required">*</span></label>
                                <input
                                    type="text" className="form-control" required placeholder="Enter your full name"
                                    value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="email" className="form-control" value={user?.email || ''} disabled
                                        style={{ backgroundColor: 'var(--gray-50)', color: 'var(--text-secondary)', paddingRight: 36, cursor: 'not-allowed' }}
                                    />
                                    <span className="material-symbols-outlined" style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        fontSize: 16, color: 'var(--text-muted)'
                                    }}>lock</span>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    Email cannot be changed
                                </span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel" className="form-control" placeholder="e.g. +91 98765 43210"
                                    value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select
                                    className="form-control"
                                    value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option>Prefer not to say</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 180 }}>
                            {loading ? (
                                <>
                                    <span style={{
                                        width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite',
                                        display: 'inline-block'
                                    }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handlePasswordChange}>
                    {/* Security Card */}
                    <div style={{
                        background: '#fff', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--gray-200)', padding: 28, marginBottom: 20
                    }}>
                        <h3 style={{
                            fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
                            marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-600)' }}>lock</span>
                            Change Password
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Update your password to keep your account secure
                        </p>

                        <div style={{ display: 'grid', gap: 20, maxWidth: 480 }}>
                            {/* Current Password */}
                            <div className="form-group">
                                <label className="form-label">Current Password <span className="required">*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCurrentPw ? 'text' : 'password'} className="form-control" required
                                        placeholder="Enter current password"
                                        value={passwords.currentPassword}
                                        onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        style={{ paddingRight: 40 }}
                                    />
                                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                            {showCurrentPw ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="form-group">
                                <label className="form-label">New Password <span className="required">*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNewPw ? 'text' : 'password'} className="form-control" required
                                        placeholder="Enter new password"
                                        value={passwords.newPassword}
                                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        style={{ paddingRight: 40 }}
                                    />
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                            {showNewPw ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {/* Password Strength */}
                                {passwords.newPassword && (
                                    <div style={{ marginTop: 8 }}>
                                        <div style={{
                                            display: 'flex', gap: 4, marginBottom: 4
                                        }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{
                                                    flex: 1, height: 3, borderRadius: 2,
                                                    background: i <= passwordStrength.level ? passwordStrength.color : 'var(--gray-200)',
                                                    transition: 'background 0.3s'
                                                }} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 500, color: passwordStrength.color }}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group">
                                <label className="form-label">Confirm New Password <span className="required">*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirmPw ? 'text' : 'password'} className="form-control" required
                                        placeholder="Confirm new password"
                                        value={passwords.confirmPassword}
                                        onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        style={{ paddingRight: 40 }}
                                    />
                                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} style={{
                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                            {showConfirmPw ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                                    <span style={{ fontSize: 12, color: 'var(--red-500)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                                        Passwords do not match
                                    </span>
                                )}
                                {passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword && passwords.confirmPassword.length >= 6 && (
                                    <span style={{ fontSize: 12, color: '#22c55e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                                        Passwords match
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Security Tips */}
                    <div style={{
                        background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--primary-200)', padding: '16px 20px', marginBottom: 20,
                        display: 'flex', gap: 12, alignItems: 'flex-start'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-600)', marginTop: 2 }}>info</span>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-700)', marginBottom: 4 }}>Password Tips</p>
                            <p style={{ fontSize: 12, color: 'var(--primary-700)', lineHeight: 1.6, opacity: 0.85 }}>
                                Use at least 6 characters with a mix of uppercase, lowercase, numbers and symbols for a strong password.
                            </p>
                        </div>
                    </div>

                    {/* Change Password Button */}
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 200 }}>
                            {loading ? (
                                <>
                                    <span style={{
                                        width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite',
                                        display: 'inline-block'
                                    }} />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_reset</span>
                                    Update Password
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
