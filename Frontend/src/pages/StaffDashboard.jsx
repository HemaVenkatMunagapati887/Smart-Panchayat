import { useState, useEffect, useCallback } from 'react';
import { statusColor, categoryEmoji, t } from '../data';
import { useApp } from '../context/AppContext';

export default function StaffDashboard() {
    const { lang, user, complaints, setComplaints } = useApp();
    const [selectedTask, setSelectedTask] = useState(null);
    const [updateNote, setUpdateNote] = useState('');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ assignedTasks: 0, completedToday: 0, highPriority: 0 });
    const [announcements, setAnnouncements] = useState([]);
    const tr = t[lang];

    const fetchDashData = useCallback(async () => {
        if (!user?.token || !user?.name) return;
        try {
            const [statsRes, announceRes] = await Promise.all([
                fetch(`http://localhost:5000/api/dashboard/staff/${encodeURIComponent(user.name)}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch(`http://localhost:5000/api/announcements`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                })
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }
            if (announceRes.ok) {
                const data = await announceRes.json();
                setAnnouncements(data.slice(0, 3)); // Show latest 3
            }
        } catch (error) {
            console.error('Error fetching staff data:', error);
        }
    }, [user.token, user.name]);

    useEffect(() => {
        fetchDashData();

        // Refresh when tab is focused
        const onFocus = () => fetchDashData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchDashData, complaints.length]);

    const isAdmin = user?.role === 'admin';

    const myTasks = complaints.filter((c) => {
        if (!c.assignedTo || c.assignedTo === 'Unassigned') return false;
        if (c.status === 'resolved') return false;

        // Admins see all assigned work; Staff see only their own
        if (isAdmin) return true;
        return c.assignedTo.toLowerCase().trim() === user.name?.toLowerCase().trim();
    });

    const liveStats = {
        assignedTasks: myTasks.length,
        completedToday: stats.completedToday,
        highPriority: myTasks.filter(t => t.priority === 'high').length
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const markComplete = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/complaints/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    status: 'resolved',
                    progress: 100,
                    timelineItem: {
                        step: 'Resolved',
                        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                        done: true,
                        desc: 'Issue has been successfully resolved.'
                    }
                }),
            });
            if (res.ok) {
                const updatedData = await res.json();
                setComplaints((prev) =>
                    prev.map((c) => c.id === id ? updatedData : c)
                );
                setSelectedTask(null);
                fetchDashData();
                showToast('Task marked as resolved!');
            }
        } catch (error) {
            console.error('Error resolving task:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!updateNote.trim() || !selectedTask) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/complaints/${selectedTask.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    progress: Math.min(selectedTask.progress + 15, 90),
                    timelineItem: {
                        step: 'Progress Update',
                        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                        done: true,
                        desc: updateNote
                    }
                }),
            });
            if (res.ok) {
                const updatedData = await res.json();
                setComplaints((prev) =>
                    prev.map((c) => c.id === selectedTask.id ? updatedData : c)
                );
                setSelectedTask(updatedData);
                setUpdateNote('');
                fetchDashData();
                showToast('Progress update submitted!');
            }
        } catch (error) {
            console.error('Error updating task:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page fade-in" style={{ position: 'relative' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 80, right: 24, zIndex: 300,
                    background: 'var(--primary-500)', color: '#fff',
                    borderRadius: 'var(--radius-md)', padding: '12px 20px',
                    boxShadow: 'var(--shadow-lg)', fontSize: 14, fontWeight: 600,
                    animation: 'fadeIn .25s both',
                }}>
                    {toast}
                </div>
            )}

            <div className="page-header">
                <h1><span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>build</span>{isAdmin
                    ? (lang === 'en' ? 'Staff Performance Monitor' : 'స్టాఫ్ పెర్ఫార్మెన్స్ మానిటర్')
                    : (lang === 'en' ? 'Staff Task Panel' : 'స్టాఫ్ టాస్క్ ప్యానెల్')}</h1>
                <p>{isAdmin
                    ? (lang === 'en' ? 'Overview of all active staff assignments across the panchayat.' : 'పంచాయతీ అంతటా సిబ్బందికి కేటాయించిన పనుల అవలోకనం.')
                    : (lang === 'en' ? `Welcome, ${user.name}! Manage your assigned tasks below.` : `స్వాగతం, ${user.name}! మీ కార్యాలయాలు నిర్వహించండి.`)}</p>
            </div>

            {/* Quick Stats */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
                <div className="kpi-card">
                    <div className="kpi-icon yellow"><span className="material-symbols-outlined">hourglass_top</span></div>
                    <div>
                        <div className="kpi-label">{lang === 'en' ? 'Assigned Tasks' : 'కేటాయించిన పనులు'}</div>
                        <div className="kpi-value">{liveStats.assignedTasks}</div>
                        <div className="kpi-change up">Today</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon green"><span className="material-symbols-outlined">check_circle</span></div>
                    <div>
                        <div className="kpi-label">{lang === 'en' ? 'Completed Today' : 'నేడు పూర్తయినవి'}</div>
                        <div className="kpi-value">{liveStats.completedToday}</div>
                        <div className="kpi-change up"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span> Great work!</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon red"><span className="material-symbols-outlined">priority_high</span></div>
                    <div>
                        <div className="kpi-label">{lang === 'en' ? 'High Priority' : 'అధిక ప్రాధాన్యత'}</div>
                        <div className="kpi-value">{liveStats.highPriority}</div>
                        <div className="kpi-change down">Urgent</div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                {/* Task List */}
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
                        {isAdmin
                            ? (lang === 'en' ? <><span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>assignment</span>All Assigned Tasks</> : <><span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>assignment</span>కేటాయించిన అన్ని పనులు</>)
                            : (lang === 'en' ? <><span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>assignment</span>My Tasks</> : <><span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>assignment</span>నా పనులు</>)}
                    </div>
                    {myTasks.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon"><span className="material-symbols-outlined" style={{ fontSize: 48 }}>celebration</span></div>
                            <h3>{lang === 'en' ? 'All Done!' : 'అన్ని పూర్తయ్యాయి!'}</h3>
                            <p>{lang === 'en' ? 'No pending tasks. Great work!' : 'పెండింగ్ పనులు లేవు. చాలా బాగా చేశారు!'}</p>
                        </div>
                    )}
                    {myTasks.map((c) => (
                        <div
                            key={c.id}
                            className="task-item"
                            id={`task-${c.id}`}
                            style={{
                                cursor: 'pointer',
                                border: selectedTask?.id === c.id ? '2px solid var(--primary-400)' : undefined,
                            }}
                            onClick={() => setSelectedTask(c)}
                        >
                            {/* Priority bar */}
                            <div className={`task-priority ${c.priority}`} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>{categoryEmoji[c.category]}</span> {c.id}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{c.title}</div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                            <span className="badge badge-gray"><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>location_on</span> {c.ward}</span>
                                            <span className={`badge ${c.priority === 'high' ? 'badge-danger' : c.priority === 'medium' ? 'badge-warning' : 'badge-gray'}`}>
                                                {t[lang].common[c.priority] || c.priority} {(lang === 'en' ? 'priority' : 'ప్రాధాన్యత')}
                                            </span>
                                            <span className={`badge ${statusColor[c.status]}`}>{tr.status[c.status]}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.date}</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        <span>{t[lang].common.progress}</span><span>{c.progress}%</span>
                                    </div>
                                    <div className="complaint-progress">
                                        <div className="complaint-progress-bar" style={{ width: `${c.progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Task Detail */}
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
                        {lang === 'en' ? <><span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>search</span>Task Detail</> : <><span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>search</span>టాస్క్ వివరాలు</>}
                    </div>

                    {!selectedTask ? (
                        <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}><span className="material-symbols-outlined" style={{ fontSize: 40 }}>touch_app</span></div>
                            <div style={{ fontWeight: 600 }}>{lang === 'en' ? 'Select a task to view details' : 'వివరాలు చూడటానికి ఒక పనిని ఎంచుకోండి'}</div>
                        </div>
                    ) : (
                        <div className="card card-pad">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>{categoryEmoji[selectedTask.category]}</span> {selectedTask.id}
                                    </div>
                                    <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>{selectedTask.title}</div>
                                </div>
                                <span className={`badge ${statusColor[selectedTask.status]}`}>{tr.status[selectedTask.status]}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                {[
                                    [<><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>location_on</span> Ward</>, selectedTask.ward],
                                    [<><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>calendar_today</span> Date</>, selectedTask.date],
                                    [<><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>bolt</span> Priority</>, selectedTask.priority],
                                    [<><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>engineering</span> Assigned</>, selectedTask.assignedTo || 'You'],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '8px 12px' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
                                    </div>
                                ))}
                            </div>

                            {selectedTask.description && (
                                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Description</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedTask.description}</div>
                                </div>
                            )}

                            {/* Update Field */}
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Update Note / Action Taken</label>
                                <textarea
                                    className="form-control"
                                    placeholder="Describe the action taken..."
                                    value={updateNote}
                                    onChange={(e) => setUpdateNote(e.target.value)}
                                    id="update-note"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpdate}
                                    id="submit-update"
                                    disabled={loading || !updateNote.trim()}
                                >
                                    {loading ? <><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>hourglass_empty</span> Updating...</> : <><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>upload</span> {lang === 'en' ? 'Submit Update' : 'అప్‌డేట్ సమర్పించు'}</>}
                                </button>
                                <button
                                    className="btn btn-accent"
                                    id="mark-complete"
                                    onClick={() => markComplete(selectedTask.id)}
                                    disabled={loading}
                                >
                                    {loading ? <><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>hourglass_empty</span> Processing...</> : <><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>check_circle</span> {lang === 'en' ? 'Mark Resolved' : 'పరిష్కరించినట్లు గుర్తించు'}</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Announcements Section */}
            <div className="card mt-28">
                <div className="card-pad">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary-700)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 6 }}>campaign</span>{lang === 'en' ? 'Latest Village Announcements' : 'తాజా గ్రామ ప్రకటనలు'}
                        </div>
                        <button className="btn btn-outline btn-sm" style={{ padding: '6px 12px' }}>{tr.viewAll}</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {announcements.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                                No announcements yet.
                            </div>
                        ) : (
                            announcements.map((a, i) => (
                                <div key={i} className="service-card" style={{ textAlign: 'left', padding: 20, display: 'flex', gap: 16 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 10, background: 'var(--primary-50)',
                                        color: 'var(--primary-600)', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 20, flexShrink: 0
                                    }}>
                                        {a.icon ? <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{a.icon}</span> : <span className="material-symbols-outlined" style={{ fontSize: 20 }}>campaign</span>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-500)', letterSpacing: 0.5 }}>
                                                {t[lang].common[a.category?.toLowerCase()] || a.category}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.date}</span>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4, color: 'var(--text-primary)' }}>
                                            {typeof a.title === 'object' ? a.title[lang] : a.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                                            {typeof a.body === 'object' ? a.body[lang] : a.body}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
