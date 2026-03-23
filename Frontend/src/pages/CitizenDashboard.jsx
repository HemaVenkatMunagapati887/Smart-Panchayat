import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { statusColor, categoryEmoji, t } from '../data';
import { useApp } from '../context/AppContext';
import { fetchCitizenDashboard } from '../services/api';

export default function CitizenDashboard() {
    const navigate = useNavigate();
    const { user, complaints, lang } = useApp();
    const tr = t[lang];
    const [filterStatus, setFilterStatus] = useState('all');
    const [dashboardData, setDashboardData] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user?.email || !user?.token) return;
        const { data, ok } = await fetchCitizenDashboard(user.email, user.token);
        if (ok && data) setDashboardData(data);
    }, [user.email, user.token]);

    useEffect(() => {
        fetchData();

        // Refresh when tab is focused
        const onFocus = () => fetchData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchData]);

    const filtered = filterStatus === 'all'
        ? complaints
        : complaints.filter((c) => c.status === filterStatus);

    const stats = {
        totalComplaints: complaints.length,
        resolvedComplaints: complaints.filter((c) => c.status === 'resolved').length,
        inProgressComplaints: complaints.filter((c) => c.status === 'inprogress').length,
        pendingComplaints: complaints.filter((c) => c.status === 'pending').length,
        totalTaxDue: dashboardData?.stats?.totalTaxDue || 0
    };

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1><span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>home</span>{lang === 'en' ? 'Citizen Dashboard' : 'పౌర డ్యాష్‌బోర్డ్'}</h1>
                <p>{lang === 'en' ? `Welcome back, ${user.name}! Here are your services and complaints.` : `స్వాగతం, ${user.name}! మీ సేవలు మరియు ఫిర్యాదులు ఇక్కడ ఉన్నాయి.`}</p>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="kpi-card">
                    <div className="kpi-icon blue"><span className="material-symbols-outlined">assignment</span></div>
                    <div>
                        <div className="kpi-label">{lang === 'en' ? 'Total Complaints' : 'మొత్తం ఫిర్యాదులు'}</div>
                        <div className="kpi-value">{stats.totalComplaints}</div>
                        <div className="kpi-change up">{lang === 'en' ? 'All time' : 'మొత్తం కాలం'}</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon green"><span className="material-symbols-outlined">check_circle</span></div>
                    <div>
                        <div className="kpi-label">{lang === 'en' ? 'Resolved' : 'పరిష్కరించబడింది'}</div>
                        <div className="kpi-value">{stats.resolvedComplaints}</div>
                        <div className="kpi-change up">{lang === 'en' ? 'Completed' : 'పూర్తయినవి'}</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon red"><span className="material-symbols-outlined">payments</span></div>
                    <div>
                        <div className="kpi-label">{lang === 'en' ? 'Tax Due' : 'పన్ను బాకీ'}</div>
                        <div className="kpi-value">₹{stats.totalTaxDue?.toLocaleString('en-IN') || 0}</div>
                        <div className="kpi-change down">{lang === 'en' ? 'Pending now' : 'ప్రస్తుతం పెండింగ్'}</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon yellow"><span className="material-symbols-outlined">hourglass_top</span></div>
                    <div>
                        <div className="kpi-label">{lang === 'en' ? 'In Progress' : 'పురోగతిలో'}</div>
                        <div className="kpi-value">{stats.inProgressComplaints}</div>
                        <div className="kpi-change up">{lang === 'en' ? 'Being fixed' : 'పరిష్కరించబడుతున్నాయి'}</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card card-pad mb-24">
                <div className="card-header">
                    <div>
                        <div className="card-title">{lang === 'en' ? 'Quick Actions' : 'త్వరిత చర్యలు'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" id="quick-file" onClick={() => navigate('/citizen/complaint')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>edit_note</span> {lang === 'en' ? 'File Complaint' : 'ఫిర్యాదు నమోదు'}
                    </button>
                    <button className="btn btn-outline" id="quick-track" onClick={() => navigate('/citizen/track')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>search</span> {lang === 'en' ? 'Track Complaint' : 'ఫిర్యాదు ట్రాక్'}
                    </button>
                    <button className="btn btn-outline" id="quick-pension" onClick={() => navigate('/citizen/pension')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>elderly</span> {lang === 'en' ? 'Pension Status' : 'పింఛన్ స్థితి'}
                    </button>
                    <button className="btn btn-outline" id="quick-cert" onClick={() => navigate('/citizen/certificates')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>description</span> {lang === 'en' ? 'Get Certificate' : 'సర్టిఫికేట్ పొందండి'}
                    </button>
                    <button className="btn btn-accent" id="quick-tax" onClick={() => navigate('/citizen/tax')}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>payments</span> {lang === 'en' ? 'Pay Tax' : 'పన్ను చెల్లించండి'}
                    </button>
                </div>
            </div>

            <div className="grid-2">
                {/* Complaints List */}
                <div>
                    <div className="card">
                        <div className="card-pad" style={{ paddingBottom: 0 }}>
                            <div className="card-header">
                                <div>
                                    <div className="card-title">
                                        {lang === 'en' ? 'My Complaints' : 'నా ఫిర్యాదులు'}
                                    </div>
                                    <div className="card-sub">{lang === 'en' ? 'All your filed complaints' : 'మీరు నమోదు చేసిన అన్ని ఫిర్యాదులు'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['all', 'pending', 'inprogress', 'resolved'].map((s) => (
                                        <button
                                            key={s}
                                            className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`}
                                            onClick={() => setFilterStatus(s)}
                                            id={`filter-${s}`}
                                        >
                                            {s === 'all' ? (lang === 'en' ? 'All' : 'అన్నీ')
                                                : s === 'pending' ? (lang === 'en' ? 'Pending' : 'పెండింగ్')
                                                    : s === 'inprogress' ? (lang === 'en' ? 'In Progress' : 'పురోగతిలో')
                                                        : (lang === 'en' ? 'Resolved' : 'పరిష్కరించబడింది')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filtered.map((c) => (
                                <div
                                    key={c.id}
                                    className="complaint-card"
                                    id={`complaint-${c.id}`}
                                    onClick={() => navigate('/citizen/track')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="complaint-card-top">
                                        <div>
                                            <span className="complaint-id"><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>{categoryEmoji[c.category]}</span> {c.id}</span>
                                            <div className="complaint-title">{c.title}</div>
                                        </div>
                                        <span className={`badge ${statusColor[c.status]}`}>
                                            <span className={`status-dot ${c.status === 'resolved' ? 'green'
                                                : c.status === 'inprogress' ? 'blue'
                                                    : c.status === 'rejected' ? 'red'
                                                        : 'yellow'
                                                }`}></span>
                                            {tr.status[c.status]}
                                        </span>
                                    </div>
                                    <div className="complaint-meta" style={{ flexWrap: 'wrap' }}>
                                        <span className="complaint-meta-item"><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>calendar_today</span> {c.date}</span>
                                        <span className="complaint-meta-item"><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>location_on</span> {c.ward}</span>
                                        <span className={`badge ${c.priority === 'high' ? 'badge-danger' : c.priority === 'medium' ? 'badge-warning' : 'badge-gray'}`}>
                                            {t[lang].common[c.priority] || c.priority} {(lang === 'en' ? 'priority' : 'ప్రాధాన్యత')}
                                        </span>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                                            <span>{t[lang].common.progress}</span>
                                            <span>{c.progress}%</span>
                                        </div>
                                        <div className="complaint-progress">
                                            <div className="complaint-progress-bar" style={{ width: `${c.progress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filtered.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon"><span className="material-symbols-outlined" style={{ fontSize: 48 }}>inbox</span></div>
                                    <h3>{lang === 'en' ? 'No complaints found' : 'ఫిర్యాదులు కనుగొనలేదు'}</h3>
                                    <p>{lang === 'en' ? 'There are no complaints matching this filter.' : 'ఈ ఫిల్టర్‌కు సరిపోయే ఫిర్యాదులు లేవు.'}</p>
                                    <button className="btn btn-primary" onClick={() => navigate('/citizen/complaint')}>
                                        {lang === 'en' ? 'File a Complaint' : 'ఫిర్యాదు నమోదు'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Announcements Section */}
                <div>
                    <div className="card">
                        <div className="card-pad">
                            <div className="card-title mb-16" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--accent-600)' }}>campaign</span>
                                {lang === 'en' ? 'Announcements' : 'ప్రకటనలు'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {dashboardData?.announcements?.map((a) => (
                                    <div key={a._id} style={{ paddingBottom: 16, borderBottom: '1px solid var(--gray-100)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-600)', textTransform: 'uppercase' }}>
                                                {t[lang].common[a.category?.toLowerCase()] || a.category}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.date}</span>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                                            {typeof a.title === 'object' ? a.title[lang] : a.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            {typeof a.body === 'object' ? a.body[lang] : a.body}
                                        </div>
                                    </div>
                                ))}
                                {(!dashboardData?.announcements || dashboardData.announcements.length === 0) && (
                                    <div style={{ textAlign: 'center', py: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                                        No recent announcements
                                    </div>
                                )}
                                <button className="btn btn-outline btn-sm btn-block" onClick={() => navigate('/citizen/announcements')}>
                                    {lang === 'en' ? 'View All' : 'అన్నీ చూడండి'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
