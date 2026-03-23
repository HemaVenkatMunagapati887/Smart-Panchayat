import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { t } from '../data';
import { useApp } from '../context/AppContext';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, complaints, lang, setLang } = useApp();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const tr = t[lang];

    const role = user?.role || 'citizen';
    const userName = user?.name || 'User';
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const avatarUrl = user?.avatar && user.avatar.startsWith('http') ? user.avatar : null;

    const Avatar = ({ size = 36, fontSize = 14, style = {} }) => (
        avatarUrl ? (
            <img src={avatarUrl} alt={userName}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }}
            />
        ) : (
            <div className="sidebar-avatar" style={{ width: size, height: size, fontSize, ...style }}>{initials}</div>
        )
    );

    const suggestibles = [
        { label: tr.pensionNav, path: '/citizen/pension', type: 'page', icon: 'elderly' },
        { label: tr.taxNav, path: '/citizen/tax', type: 'page', icon: 'payments' },
        { label: tr.certificatesNav, path: '/citizen/certificates', type: 'page', icon: 'description' },
        { label: tr.fileComplaint, path: '/citizen/complaint', icon: 'edit_note', type: 'page' },
        { label: tr.announcements, path: '/citizen/announcements', icon: 'campaign', type: 'page' },
        ...complaints.map(c => ({ label: c.id, path: `/citizen/track?id=${c.id}`, type: 'complaint', icon: 'search' }))
    ];

    const suggestions = searchQuery.trim().length > 0
        ? suggestibles.filter(s => s.label?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
        : [];

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            if (searchQuery.trim().toLowerCase().startsWith('gs-')) {
                navigate(`/citizen/track?id=${searchQuery.trim().toUpperCase()}`);
            } else {
                const pages = {
                    'pension': '/citizen/pension',
                    'tax': '/citizen/tax',
                    'certificate': '/citizen/certificates',
                    'complaint': '/citizen/complaint',
                    'track': '/citizen/track',
                    'announcement': '/citizen/announcements'
                };
                const matched = Object.entries(pages).find(([key]) =>
                    searchQuery.trim().toLowerCase().includes(key)
                );
                navigate(matched ? matched[1] : `/citizen/track?query=${searchQuery}`);
            }
            setSearchQuery('');
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        const hide = (event) => {
            const searchEl = document.getElementById('global-search-container');
            const notifEl = document.getElementById('notif-container');
            const profileEl = document.getElementById('profile-container');

            if (searchEl && !searchEl.contains(event.target)) setShowSuggestions(false);
            if (notifEl && !notifEl.contains(event.target)) setShowNotifications(false);
            if (profileEl && !profileEl.contains(event.target)) setShowProfile(false);
        };
        window.addEventListener('click', hide);
        return () => window.removeEventListener('click', hide);
    }, []);

    const handleLogout = () => {
        if (confirm(lang === 'en' ? 'Are you sure you want to logout?' : 'మీరు ఖచ్చితంగా లాగ్ అవుట్ చేయాలనుకుంటున్నారా?')) {
            logout();
            navigate('/');
        }
    };

    const navItems = {
        citizen: [
            { label: tr.dashboard, path: '/citizen', icon: 'home' },
            { label: tr.fileComplaint, path: '/citizen/complaint', icon: 'edit_note' },
            { label: tr.trackComplaint, path: '/citizen/track', icon: 'search' },
            { label: tr.pensionNav, path: '/citizen/pension', icon: 'elderly' },
            { label: tr.certificatesNav, path: '/citizen/certificates', icon: 'description' },
            { label: tr.taxNav, path: '/citizen/tax', icon: 'payments' },
            { label: tr.announcements, path: '/citizen/announcements', icon: 'campaign', badge: 4 },
        ],
        admin: [
            { label: tr.adminDashboard, path: '/admin', icon: 'monitoring', badge: complaints.filter(c => c.status === 'pending').length || null },
            { label: tr.staffDashboard, path: '/staff', icon: 'engineering' },
            { label: tr.dashboard, path: '/citizen', icon: 'home' },
            { label: tr.fileComplaint, path: '/citizen/complaint', icon: 'edit_note' },
            { label: tr.trackComplaint, path: '/citizen/track', icon: 'search' },
            { label: tr.pensionNav, path: '/citizen/pension', icon: 'elderly' },
            { label: tr.certificatesNav, path: '/citizen/certificates', icon: 'description' },
            { label: tr.taxNav, path: '/citizen/tax', icon: 'payments' },
            { label: tr.announcements, path: '/citizen/announcements', icon: 'campaign' },
        ],
        staff: [
            { label: tr.staffDashboard, path: '/staff', icon: 'engineering', badge: complaints.filter(c => c.assignedTo === user?.name && c.status !== 'resolved').length || null },
            { label: tr.citizenDashboard, path: '/citizen', icon: 'home' },
        ],
    };

    return (
        <div className="app-shell">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>account_balance</span>
                    </div>
                    <div className="sidebar-logo-text">
                        <div className="sidebar-logo-title">{tr.appName}</div>
                        <div className="sidebar-logo-sub">{tr.tagline}</div>
                    </div>
                </div>

                <div className="sidebar-user" style={{ cursor: 'pointer' }} onClick={() => { navigate('/citizen/settings'); setSidebarOpen(false); }}>
                    <Avatar size={36} fontSize={14} />
                    <div style={{ flex: 1 }}>
                        <div className="sidebar-user-name">{userName}</div>
                        <div className="sidebar-user-role">{tr.roles?.[role] || role}</div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary-300)' }}>chevron_right</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">{tr.navigation}</div>
                    {(navItems[role] || navItems.citizen).map((item) => (
                        <button
                            key={item.path}
                            className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                        >
                            <span className="nav-icon">
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </span>
                            {item.label}
                            {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-nav-item" onClick={() => navigate('/')}>
                        <span className="nav-icon"><span className="material-symbols-outlined">home</span></span>
                        {lang === 'en' ? 'Home / Landing' : 'హోమ్ / ల్యాండింగ్'}
                    </button>
                    <button
                        className={`sidebar-nav-item ${location.pathname === '/citizen/settings' ? 'active' : ''}`}
                        onClick={() => { navigate('/citizen/settings'); setSidebarOpen(false); }}
                    >
                        <span className="nav-icon"><span className="material-symbols-outlined">settings</span></span>
                        {tr.accountSettings}
                    </button>
                    <button className="sidebar-nav-item" style={{ color: 'var(--red-500)' }} onClick={handleLogout}>
                        <span className="nav-icon">
                            <span className="material-symbols-outlined" style={{ color: 'var(--red-500)' }}>logout</span>
                        </span>
                        {tr.logout}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="main-content">
                <header className="topbar">
                    <button
                        id="sidebar-toggle"
                        className="topbar-icon-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'none' }}
                        aria-label="Toggle sidebar"
                    >
                        <span className="material-symbols-outlined">menu_open</span>
                    </button>

                    <div style={{ flex: 1 }}>
                        <div className="topbar-title">{tr.appName}</div>
                    </div>

                    {/* Search */}
                    <div className="topbar-search" id="global-search-container" style={{ position: 'relative' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-muted)' }}>search</span>
                        <input
                            placeholder={tr.search}
                            type="text"
                            aria-label="Search"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                            onKeyDown={handleSearch}
                            onFocus={() => setShowSuggestions(true)}
                            id="global-search-input"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions fade-in" style={{
                                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                                background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-lg)',
                                border: '1px solid var(--gray-200)', zIndex: 1000,
                                overflow: 'hidden', padding: '6px 0'
                            }}>
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => { navigate(s.path); setSearchQuery(''); setShowSuggestions(false); }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-600)' }}>{s.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                {s.type === 'page' ? (lang === 'en' ? 'Page' : 'పేజీ') : (lang === 'en' ? 'Complaint' : 'ఫిర్యాదు')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Language Toggle */}
                    <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'te' : 'en')} id="lang-toggle" aria-label="Toggle language">
                        {lang === 'en' ? 'తెలుగు' : 'English'}
                    </button>

                    {/* Notifications */}
                    <div id="notif-container" style={{ position: 'relative' }}>
                        <button
                            className="topbar-icon-btn"
                            id="notif-btn"
                            aria-label="Notifications"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="topbar-notif-dot"></span>
                        </button>

                        {showNotifications && (
                            <div className="dropdown-menu" style={{ width: 320 }}>
                                <div className="dropdown-header">
                                    <span>{lang === 'en' ? 'Notifications' : 'నోటిఫికేషన్లు'}</span>
                                    <span className="badge badge-success">{lang === 'en' ? '3 New' : '3 కొత్తవి'}</span>
                                </div>
                                <div className="dropdown-item" onClick={() => navigate('/citizen/track')}>
                                    <div className="icon" style={{ background: '#dcfce7', color: '#166534' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'en' ? 'Complaint Resolved' : 'ఫిర్యాదు పరిష్కరించబడింది'}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lang === 'en' ? 'GS-2024-001 has been closed' : 'GS-2024-001 మూసివేయబడింది'}</div>
                                    </div>
                                </div>
                                <div className="dropdown-item" onClick={() => navigate('/citizen/announcements')}>
                                    <div className="icon" style={{ background: '#e0f2fe', color: '#075985' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>campaign</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'en' ? 'New Announcement' : 'కొత్త ప్రకటన'}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lang === 'en' ? 'Gram Sabha on March 5th' : 'మార్చి 5 న గ్రామ సభ'}</div>
                                    </div>
                                </div>
                                <div className="dropdown-item" onClick={() => navigate('/citizen/tax')}>
                                    <div className="icon" style={{ background: '#fff7ed', color: '#9a3412' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>Tax Reminder</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Property Tax due this week</div>
                                    </div>
                                </div>
                                <div style={{ padding: 10, textAlign: 'center', background: 'var(--gray-50)', fontSize: 11, fontWeight: 700, color: 'var(--primary-600)', cursor: 'pointer', borderTop: '1px solid var(--gray-100)' }}>
                                    VIEW ALL NOTIFICATIONS
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div id="profile-container" style={{ position: 'relative', marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--gray-200)' }}>
                        <div
                            style={{ cursor: 'pointer', borderRadius: '50%', border: showProfile ? '2px solid var(--primary-500)' : '2px solid transparent' }}
                            onClick={(e) => { e.stopPropagation(); setShowProfile(!showProfile); }}
                        >
                            <Avatar size={38} fontSize={14} />
                        </div>

                        {showProfile && (
                            <div className="dropdown-menu">
                                <div className="dropdown-header" style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar size={34} fontSize={12} />
                                        <div style={{ lineHeight: 1.2 }}>
                                            <div style={{ fontSize: 14, fontWeight: 800 }}>{userName}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{role} Member</div>
                                        </div>
                                    </div>
                                </div>
                                <button className="dropdown-item" onClick={() => { navigate('/citizen/settings'); setShowProfile(false); }}>
                                    <div className="icon"><span className="material-symbols-outlined">person</span></div>
                                    {tr.accountSettings}
                                </button>
                                <button className="dropdown-item" onClick={() => { navigate('/citizen/track'); setShowProfile(false); }}>
                                    <div className="icon"><span className="material-symbols-outlined">folder_shared</span></div>
                                    {lang === 'en' ? 'My Applications' : 'నా దరఖాస్తులు'}
                                </button>
                                <button className="dropdown-item" onClick={() => { navigate('/citizen/support'); setShowProfile(false); }}>
                                    <div className="icon"><span className="material-symbols-outlined">help_center</span></div>
                                    {tr.supportCenter}
                                </button>
                                <div style={{ height: 1, background: 'var(--gray-100)', margin: '4px 0' }}></div>
                                <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--red-600)' }}>
                                    <div className="icon" style={{ color: 'var(--red-500)', background: 'var(--red-50)' }}>
                                        <span className="material-symbols-outlined">logout</span>
                                    </div>
                                    <strong>{tr.logout}</strong>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
