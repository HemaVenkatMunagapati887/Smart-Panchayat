import { useNavigate } from 'react-router-dom';
import { announcements, t } from '../data';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
    const navigate = useNavigate();
    const { lang, setLang, isLoggedIn } = useApp();
    const tr = t[lang];

    const handleServiceClick = (path) => {
        if (isLoggedIn) {
            navigate(path);
        } else {
            navigate(`/login?redirect=${encodeURIComponent(path)}`);
        }
    };

    const services = [
        { id: 'sanitation', icon: 'delete', name: tr.serviceNames.sanitation, desc: tr.serviceDescs.sanitation, bg: '#d1fae5', color: '#065f46', path: '/citizen/complaint?cat=sanitation' },
        { id: 'streetlight', icon: 'lightbulb', name: tr.serviceNames.streetlight, desc: tr.serviceDescs.streetlight, bg: '#fef9c3', color: '#713f12', path: '/citizen/complaint?cat=streetlight' },
        { id: 'pension', icon: 'elderly', name: tr.serviceNames.pension, desc: tr.serviceDescs.pension, bg: '#ede9fe', color: '#5b21b6', path: '/citizen/pension' },
        { id: 'water', icon: 'water_drop', name: tr.serviceNames.water, desc: tr.serviceDescs.water, bg: '#dbeafe', color: '#1e40af', path: '/citizen/complaint?cat=water' },
        { id: 'certificates', icon: 'description', name: tr.serviceNames.certificates, desc: tr.serviceDescs.certificates, bg: '#fce7f3', color: '#9d174d', path: '/citizen/certificates' },
        { id: 'tax', icon: 'payments', name: tr.serviceNames.tax, desc: tr.serviceDescs.tax, bg: '#fff7ed', color: '#9a3412', path: '/citizen/tax' },
        { id: 'road', icon: 'add_road', name: tr.serviceNames.road, desc: tr.serviceDescs.road, bg: '#f3f4f6', color: '#374151', path: '/citizen/complaint?cat=road' },
        { id: 'health', icon: 'medical_services', name: tr.serviceNames.health, desc: tr.serviceDescs.health, bg: '#d1fae5', color: '#065f46', path: '/citizen/complaint?cat=health' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            {/* Topbar */}
            <header style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--gray-200)',
                padding: '0 32px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                position: 'sticky',
                top: 0,
                zIndex: 50,
                boxShadow: 'var(--shadow-sm)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'var(--primary-500)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, color: '#fff',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>account_balance</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                            {tr.appName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {tr.tagline}
                        </div>
                    </div>
                </div>

                <nav style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
                        id="landing-lang-btn"
                        style={{ marginRight: 8 }}
                    >
                        {lang === 'en' ? 'తెలుగు' : 'English'}
                    </button>
                    <button className="btn btn-primary btn-sm" id="goto-login" onClick={() => navigate('/login')}>
                        {tr.login}
                    </button>
                    <button className="btn btn-outline btn-sm" id="goto-signup" onClick={() => navigate('/signup')}>
                        {tr.register}
                    </button>
                </nav>
            </header>

            {/* Hero */}
            <section className="hero">
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
                    <div className="hero-badge" style={{ animation: 'scaleIn 0.8s both' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>gavel</span>
                        <span>{tr.govtOfAp}</span>
                    </div>
                    <h1 style={{ animation: 'slideUp 0.8s 0.1s both', whiteSpace: 'pre-line' }}>
                        {tr.heroTitle}
                    </h1>
                    <p style={{ animation: 'slideUp 0.8s 0.2s both', maxWidth: 700, margin: '0 auto 32px' }}>
                        {tr.heroSub}
                    </p>
                    <div className="hero-actions">
                        <button className="hero-action-btn primary" id="hero-file-complaint" onClick={() => navigate('/login')}>
                            <span className="material-symbols-outlined">edit_note</span>
                            {tr.fileComplaint}
                        </button>
                        <button className="hero-action-btn secondary" id="hero-track" onClick={() => navigate('/login')}>
                            <span className="material-symbols-outlined">search</span>
                            {tr.trackComplaint}
                        </button>
                    </div>

                    <div className="hero-stats">
                        {[
                            { value: '12,480', label: tr.stats.resolved },
                            { value: '98.2%', label: tr.stats.rate },
                            { value: '3,240', label: tr.stats.activePensions },
                            { value: '24 hrs', label: tr.stats.respTime },
                        ].map((s) => (
                            <div key={s.label} style={{ textAlign: 'center' }}>
                                <div className="hero-stat-value">{s.value}</div>
                                <div className="hero-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section style={{ padding: '48px 40px', maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                    {tr.ourServices}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                    {tr.clickToStart}
                </p>
                <div className="service-grid">
                    {services.map((s, idx) => (
                        <div
                            key={s.id}
                            className="service-card"
                            onClick={() => handleServiceClick(s.path)}
                            id={`service-${s.id}`}
                            style={{ animation: `scaleIn 0.5s ${idx * 0.05}s both` }}
                        >
                            <div className="service-icon" style={{ background: s.bg, color: s.color }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>{s.icon}</span>
                            </div>
                            <div className="service-name">{s.name}</div>
                            <div className="service-desc">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick Track + Announcements */}
            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: 24,
                padding: '0 40px 48px',
                maxWidth: 1100,
                margin: '0 auto',
            }}>
                {/* Track */}
                <div className="track-section">
                    <div className="track-title">
                        <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 8, fontSize: 24 }}>search</span>
                        {tr.trackComplaint}
                    </div>
                    <div className="track-sub">
                        {tr.trackSub}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            className="form-control"
                            placeholder="e.g. GS-2024-001"
                            id="track-input"
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/login')}
                            id="track-btn"
                        >
                            {lang === 'en' ? 'Track' : 'ట్రాక్'}
                        </button>
                    </div>
                </div>

                {/* Announcements */}
                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-600)', fontSize: 24 }}>campaign</span>
                            {tr.latestAnnouncements}
                        </div>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate('/login')}
                        >
                            {tr.viewAll}
                        </button>
                    </div>
                    {announcements.slice(0, 3).map((a) => (
                        <div key={a.id} className="notice-item" style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                            <div className="notice-dot-wrap" style={{ fontSize: 24 }}><span className="material-symbols-outlined">{a.icon}</span></div>
                            <div>
                                <div className="notice-title" style={{ fontWeight: 600, fontSize: 14 }}>{a.title[lang]}</div>
                                <div className="notice-date" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.date}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                background: 'var(--bg-sidebar)',
                color: 'rgba(255,255,255,.7)',
                padding: '48px 40px',
                textAlign: 'center',
                fontSize: 13,
            }}>
                <div style={{
                    fontWeight: 700, color: '#fff', fontSize: 18, marginBottom: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}>
                    <span className="material-symbols-outlined">account_balance</span>
                    {tr.appName} – {tr.tagline}
                </div>
                <div>Gram Panchayat Digital Services Portal · Andhra Pradesh</div>
                <div style={{ marginTop: 12, opacity: .7 }}>
                    © 2024 {tr.appName}. {tr.rights}
                </div>
                <div style={{ marginTop: 8, fontWeight: 600, color: '#aca7a7ff' }}>
                    {tr.helpline}
                </div>

                <div style={{ marginTop: 8, fontWeight: 600, color: '#fff' }}>
                    <span> @ Author:Venkat Munagapati</span>
                </div>

            </footer>
        </div>
    );
}

