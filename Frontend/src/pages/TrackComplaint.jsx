import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryEmoji, t } from '../data';
import { useApp } from '../context/AppContext';
import { deleteComplaint } from '../services/api';

export default function TrackComplaint() {
    const { lang, complaints, user, refreshComplaints, toast } = useApp();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('id') || searchParams.get('query') || '');
    const [result, setResult] = useState(null);
    const [searched, setSearched] = useState(false);
    const tr = t[lang];

    const handleDelete = async (id) => {
        if (!window.confirm(lang === 'en' ? 'Are you sure you want to delete this complaint?' : 'ఈ ఫిర్యాదును తొలగించాలని మీరు ఖచ్చితంగా అనుకుంటున్నారా?')) {
            return;
        }

        const { ok, error, data } = await deleteComplaint(id, user?.token);
        if (ok) {
            toast.success(lang === 'en' ? 'Complaint deleted successfully' : 'ఫిర్యాదు విజయవంతంగా తొలగించబడింది');
            refreshComplaints();
            if (result && result.id === id) {
                setResult(null);
                setSearched(false);
            }
        } else {
            toast.error(error || data?.message || (lang === 'en' ? 'Failed to delete complaint' : 'ఫిర్యాదును తొలగించడంలో వైఫల్యం'));
        }
    };

    const statusColorMap = {
        pending: 'badge-warning',
        inprogress: 'badge-info',
        resolved: 'badge-success',
        rejected: 'badge-danger',
    };

    const handleSearch = async (overrideQuery) => {
        const q = (overrideQuery || query).trim();
        if (!q) return;

        try {
            const res = await fetch(`http://localhost:5000/api/complaints/${q}`);
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                // Fallback to local search in props
                const found = complaints.find(
                    (c) => c.id.toLowerCase() === q.toLowerCase()
                );
                setResult(found || null);
            }
        } catch (error) {
            console.error('Error searching complaint:', error);
            const found = complaints.find(
                (c) => c.id.toLowerCase() === q.toLowerCase()
            );
            setResult(found || null);
        }
        setSearched(true);
    };

    // Auto-search if ID is in URL
    const urlId = searchParams.get('id') || searchParams.get('query');

    useEffect(() => {
        if (urlId && urlId !== query) {
            handleSearch(urlId);
            setQuery(urlId);
        }
    }, [urlId, query]);

    return (
        <div className="page fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="page-header">
                <h1><span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>search</span>{tr.tracking.title}</h1>
                <p>{tr.tracking.sub}</p>
            </div>

            {/* Search Box */}
            <div className="card card-pad mb-24">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">
                            {tr.tracking.complaintId}
                            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                                {tr.tracking.hint} (e.g. GS-2024-001)
                            </span>
                        </label>
                        <input
                            className="form-control form-control-lg"
                            placeholder="GS-2024-001"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            id="track-complaint-input"
                        />
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={handleSearch} id="track-search-btn">
                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>search</span> {tr.tracking.search}
                    </button>
                </div>

                {/* Hint */}
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tr.tracking.hint}</span>
                    {['GS-2024-001', 'GS-2024-002', 'GS-2024-003'].map((id) => (
                        <button
                            key={id}
                            onClick={() => { setQuery(id); handleSearch(id); }}
                            style={{
                                fontSize: 12, fontFamily: 'monospace', background: 'var(--gray-100)',
                                borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                                border: '1px solid var(--gray-200)', color: 'var(--text-secondary)',
                                transition: 'background .15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-100)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                        >
                            {id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Result */}
            {searched && !result && (
                <div className="card card-pad">
                    <div className="empty-state">
                        <div className="empty-state-icon"><span className="material-symbols-outlined" style={{ fontSize: 48 }}>sentiment_dissatisfied</span></div>
                        <h3>{tr.tracking.notFound}</h3>
                        <p>{tr.tracking.checkId}</p>
                    </div>
                </div>
            )}

            {result && (
                <div className="card fade-in">
                    {/* Status Header */}
                    <div style={{
                        background: result.status === 'resolved'
                            ? 'linear-gradient(135deg, var(--primary-600), var(--primary-400))'
                            : result.status === 'inprogress'
                                ? 'linear-gradient(135deg, #1d4ed8, var(--blue-500))'
                                : 'linear-gradient(135deg, #92400e, #f59e0b)',
                        padding: '24px',
                        color: '#fff',
                        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 12, opacity: .8, fontFamily: 'monospace', marginBottom: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>{categoryEmoji[result.category]}</span> {result.id}
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{result.title}</div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', opacity: .9, fontSize: 13 }}>
                                    <span><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>calendar_today</span> {result.date}</span>
                                    <span><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>location_on</span> {result.ward}</span>
                                    {result.assignedTo && <span><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>engineering</span> {result.assignedTo}</span>}
                                </div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,.2)',
                                borderRadius: 10,
                                padding: '8px 16px',
                                fontWeight: 700,
                                fontSize: 14,
                                backdropFilter: 'blur(8px)',
                            }}>
                                {tr.status[result.status]}
                            </div>
                        </div>
                    </div>

                    <div className="card-pad">
                        {/* Progress */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                <span style={{ fontWeight: 600 }}>{tr.tracking.resolutionProgress}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{result.progress}%</span>
                            </div>
                            <div className="complaint-progress" style={{ height: 10 }}>
                                <div className="complaint-progress-bar" style={{ width: `${result.progress}%` }} />
                            </div>
                        </div>

                        {/* Details grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                            {[
                                [tr.steps.category, (tr.categories[result.category] || result.category)],
                                [tr.formLabels.priority, tr.formLabels[`priority${result.priority?.charAt(0).toUpperCase() + result.priority?.slice(1).substring(0, 2)}`] || result.priority],
                                [tr.formLabels.ward, result.ward],
                                [lang === 'en' ? 'Assigned To' : 'కేటాయించిన వారు', result.assignedTo || (lang === 'en' ? 'Not assigned yet' : 'ఇంకా కేటాయించలేదు')],
                            ].map(([k, v]) => (
                                <div key={k} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{k}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        {result.description && (
                            <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: 14, marginBottom: 24 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{tr.formLabels.description.toUpperCase()}</div>
                                <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.description}</div>
                            </div>
                        )}

                        {/* Timeline */}
                        {result.timeline && (
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>push_pin</span> {tr.tracking.activityTimeline}
                                </div>
                                <div className="timeline">
                                    {result.timeline.map((item, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className={`timeline-dot ${item.done ? 'done' : item.active ? 'active' : 'idle'}`} />
                                            <div className="timeline-title">{item.step}</div>
                                            <div className="timeline-date">{item.date}</div>
                                            {item.desc && <div className="timeline-desc">{item.desc}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* All Registered Complaints */}
            <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                    {query ? tr.tracking.resultsFor.replace('{q}', query) : tr.tracking.allComplaints}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.isArray(complaints) && complaints
                        .filter(c =>
                            (c.id || '').toLowerCase().includes((query || '').toLowerCase()) ||
                            (c.title || '').toLowerCase().includes((query || '').toLowerCase())
                        )
                        .map((c) => (
                            <div
                                key={c.id}
                                className="complaint-card"
                                style={{ cursor: 'pointer' }}
                                onClick={() => { setQuery(c.id); setResult(c); setSearched(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                id={`list-${c.id}`}
                            >
                                <div className="complaint-card-top">
                                    <div>
                                        <span className="complaint-id"><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>{categoryEmoji[c.category]}</span> {c.id}</span>
                                        <div className="complaint-title">{c.title}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className={`badge ${statusColorMap[c.status] || 'badge-warning'}`}>{tr.status[c.status]}</span>
                                        {(c.status === 'pending' || user?.role === 'admin') && (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                                style={{ padding: '4px 8px', minWidth: 'auto', minHeight: 'auto', height: '28px', fontSize: '12px' }}
                                                title={lang === 'en' ? 'Delete Complaint' : 'ఫిర్యాదును తొలగించండి'}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="complaint-meta">
                                    <span className="complaint-meta-item"><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>calendar_today</span> {c.date}</span>
                                    <span className="complaint-meta-item"><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>location_on</span> {c.ward}</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
