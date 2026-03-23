import { useState, useEffect } from 'react';
import { t } from '../data';

import { useApp } from '../context/AppContext';

const categories = ['All', 'Meeting', 'Notice', 'Welfare', 'Infrastructure'];

export default function AnnouncementsPage() {
    const { lang, user } = useApp();
    const [announcements, setAnnouncements] = useState([]);
    const [filter, setFilter] = useState('All');
    const [expanded, setExpanded] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            if (!user?.token) return;
            try {
                const res = await fetch('http://localhost:5000/api/announcements', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching announcements:', error);
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, [user.token]);

    const filtered = filter === 'All'
        ? announcements
        : announcements.filter((a) => a.category === filter);

    return (
        <div className="page fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="page-header">
                <h1><span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>campaign</span>{lang === 'en' ? 'Announcements & Notices' : 'ప్రకటనలు మరియు నోటీసులు'}</h1>
                <p>{lang === 'en' ? 'Official communications from Gram Panchayat.' : 'గ్రామ పంచాయతీ అధికారిక సమాచారాలు.'}</p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setFilter(cat)}
                        id={`ann-filter-${cat.toLowerCase()}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Announcements List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filtered.map((a) => (
                    <div
                        key={a.id}
                        className="card card-pad"
                        style={{
                            cursor: 'pointer',
                            borderLeft: '4px solid var(--primary-400)',
                            transition: 'box-shadow .2s, transform .2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                        onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                        id={`ann-${a.id}`}
                    >
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: 'var(--primary-100)', color: 'var(--primary-700)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{a.icon}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{a.title}</div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        <span className="badge badge-success">{a.category}</span>
                                        <span style={{ fontSize: 16, color: 'var(--text-muted)', transition: 'transform .2s', transform: expanded === a.id ? 'rotate(180deg)' : 'none' }}>
                                            ▾
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>calendar_today</span> {a.date}</div>
                                {expanded === a.id && (
                                    <div style={{
                                        marginTop: 12,
                                        padding: 14,
                                        background: 'var(--gray-50)',
                                        borderRadius: 8,
                                        fontSize: 13.5,
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.65,
                                        animation: 'fadeIn .2s both',
                                    }}>
                                        {a.body}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon"><span className="material-symbols-outlined" style={{ fontSize: 48 }}>inbox</span></div>
                        <h3>{lang === 'en' ? 'No announcements found' : 'ప్రకటనలు కనుగొనలేదు'}</h3>
                        <p>{lang === 'en' ? 'There are no announcements in this category.' : 'ఈ వర్గంలో ప్రకటనలు లేవు.'}</p>
                    </div>
                )}
            </div>

            {/* Footer Note */}
            <div style={{
                marginTop: 32,
                padding: 16,
                background: 'var(--primary-50)',
                borderRadius: 10,
                border: '1px solid var(--primary-200)',
                fontSize: 13,
                color: 'var(--primary-800)',
                lineHeight: 1.6,
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>phone</span> {lang === 'en'
                    ? 'For more information, contact the Gram Panchayat office or call Helpline: 1800-XXX-XXXX (Mon–Sat, 9 AM – 5 PM)'
                    : 'మరింత సమాచారం కోసం, గ్రామ పంచాయతీ కార్యాలయాన్ని సంప్రదించండి లేదా హెల్ప్‌లైన్ కాల్ చేయండి: 1800-XXX-XXXX'}
            </div>
        </div>
    );
}
