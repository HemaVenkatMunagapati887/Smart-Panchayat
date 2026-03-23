import { useState, useEffect } from 'react';
import { t } from '../data';
import { fetchPensions as apiFetchPensions, applyForPension } from '../services/api';
import { useApp } from '../context/AppContext';

export default function PensionPage() {
    const { lang, user } = useApp();
    const [records, setRecords] = useState([]);
    const [showApply, setShowApply] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', age: '', aadhaar: '', ward: '', income: '' });
    const [loading, setLoading] = useState(true);
    const tr = t[lang];

    const pensionTypes = [
        { id: 'oldage', label: tr.pensions.oldage, icon: 'elderly', color: '#ede9fe', ctext: '#6d28d9', amount: tr.pensions.amountMsg.replace('{amt}', '2,500') },
        { id: 'widow', label: tr.pensions.widow, icon: 'psychology_alt', color: '#fce7f3', ctext: '#9d174d', amount: tr.pensions.amountMsg.replace('{amt}', '2,500') },
        { id: 'disability', label: tr.pensions.disability, icon: 'accessible', color: '#dbeafe', ctext: '#1e40af', amount: tr.pensions.amountMsg.replace('{amt}', '3,000') },
        { id: 'weaver', label: tr.pensions.weaver, icon: 'texture', color: '#fef9c3', ctext: '#713f12', amount: tr.pensions.amountMsg.replace('{amt}', '2,000') },
    ];

    useEffect(() => {
        const loadPensions = async () => {
            if (!user?.email || !user?.token) return;
            setLoading(true);
            const { data, ok } = await apiFetchPensions(user.email, user.token);
            if (ok && Array.isArray(data)) {
                setRecords(data);
            }
            setLoading(false);
        };
        loadPensions();
    }, [user.email, user.token]);

    const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    const handleApply = async () => {
        const newRecord = {
            id: `PEN-${Math.floor(Math.random() * 900 + 100)}-${Date.now().toString().slice(-4)}`,
            name: form.name,
            userEmail: user.email,
            type: selectedType,
            ward: form.ward,
            amount: pensionTypes.find(t => t.id === selectedType)?.amount.split('/')[0] || '₹2,500',
            status: 'pending',
            since: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
            aadhaar: form.aadhaar,
            income: form.income
        };

        const { data, ok } = await applyForPension(newRecord, user.token);
        if (ok && data) {
            setRecords([data, ...records]);
            setSubmitted(true);
        }
    };

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, verticalAlign: 'bottom', marginRight: 10 }}>elderly</span>
                    {tr.pensions.title}
                </h1>
                <p>{tr.pensions.sub}</p>
            </div>

            {/* Pension Types */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                {pensionTypes.map((p) => (
                    <div key={p.id} className="kpi-card" style={{ flexDirection: 'column', textAlign: 'center', gap: 10 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 14, background: p.color, color: p.ctext, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>{p.icon}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--primary-600)', fontWeight: 700 }}>{p.amount}</div>
                        <button
                            className="btn btn-outline btn-sm btn-block"
                            onClick={() => { setSelectedType(p.id); setShowApply(true); setSubmitted(false); }}
                            id={`apply-${p.id}`}
                        >
                            {tr.pensions.applyNow}
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid-2">
                {/* Active Pensions Table */}
                <div className="card">
                    <div className="card-pad" style={{ paddingBottom: 0 }}>
                        <div className="card-title mb-16" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-600)' }}>list_alt</span>
                            {tr.pensions.activeRecords}
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{lang === 'en' ? 'Name' : 'పేరు'}</th>
                                    <th>{lang === 'en' ? 'Type' : 'రకం'}</th>
                                    <th>{lang === 'en' ? 'Amount' : 'మొత్తం'}</th>
                                    <th>{lang === 'en' ? 'Ward' : 'వార్డు'}</th>
                                    <th>{lang === 'en' ? 'Status' : 'స్థితి'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.id}</td>
                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                        <td>
                                            <span className="badge badge-purple">
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>
                                                    {pensionTypes.find((t) => t.id === p.type)?.icon}
                                                </span>
                                                {tr.pensions[p.type] || p.type}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{p.amount}</td>
                                        <td>{p.ward}</td>
                                        <td>
                                            <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                                <span className={`status-dot ${p.status === 'active' ? 'green' : 'yellow'}`}></span>
                                                {lang === 'en' ? p.status : (p.status === 'active' ? 'చురుగ్గా ఉంది' : 'పెండింగ్')}
                                            </span>
                                        </td>
                                    </tr>
                                )).reverse()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Application Form */}
                <div className="card card-pad">
                    {!showApply ? (
                        <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                            <div style={{ marginBottom: 16 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--gray-300)' }}>edit_document</span>
                            </div>
                            <h3>{tr.pensions.applyFor}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>{tr.pensions.applySub}</p>
                        </div>
                    ) : submitted ? (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                            <div style={{ marginBottom: 16 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--primary-500)' }}>verified</span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary-700)', marginBottom: 8 }}>
                                {tr.pensions.filedSuccess}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
                                {tr.pensions.filedSub}
                            </div>
                            <div style={{ background: 'var(--primary-50)', borderRadius: 10, padding: 14, marginBottom: 20, border: '1px solid var(--primary-200)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tr.pensions.appNum}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-700)' }}>
                                    PEN-2024-{Math.floor(Math.random() * 900 + 100)}
                                </div>
                            </div>
                            <button className="btn btn-outline btn-block" onClick={() => { setShowApply(false); setSubmitted(false); }}>
                                {tr.pensions.back}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="card-header">
                                <div>
                                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="material-symbols-outlined" style={{ color: pensionTypes.find((p) => p.id === selectedType)?.ctext }}>{pensionTypes.find((p) => p.id === selectedType)?.icon}</span>
                                        {pensionTypes.find((p) => p.id === selectedType)?.label}
                                    </div>
                                    <div className="card-sub">{tr.pensions.fillDetails}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">{tr.formLabels.fullName} <span className="required">*</span></label>
                                    <input className="form-control" value={form.name} onChange={(e) => update('name', e.target.value)} id="pen-name" placeholder={lang === 'en' ? 'Full name as per Aadhaar' : 'ఆధార్ ప్రకారం పూర్తి పేరు'} />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">{tr.pensions.age} <span className="required">*</span></label>
                                        <input className="form-control" type="number" value={form.age} onChange={(e) => update('age', e.target.value)} id="pen-age" placeholder="e.g. 65" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{tr.formLabels.ward} <span className="required">*</span></label>
                                        <select className="form-control" value={form.ward} onChange={(e) => update('ward', e.target.value)} id="pen-ward">
                                            <option value="">{tr.formLabels.selectWard}</option>
                                            {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'].map((w) => (
                                                <option key={w} value={w}>{w}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{tr.pensions.aadhaar} <span className="required">*</span></label>
                                    <input className="form-control" value={form.aadhaar} onChange={(e) => update('aadhaar', e.target.value)} id="pen-aadhaar" placeholder={tr.pensions.aadhaarPlaceholder} maxLength={12} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{tr.pensions.income}</label>
                                    <input className="form-control" value={form.income} onChange={(e) => update('income', e.target.value)} id="pen-income" placeholder={tr.pensions.incomePlaceholder} />
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-outline" onClick={() => setShowApply(false)} id="pen-cancel">
                                        {tr.cancel}
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        disabled={!form.name || !form.age || !form.aadhaar || !form.ward}
                                        onClick={handleApply}
                                        id="pen-submit"
                                        style={{ flex: 1, opacity: (form.name && form.age && form.aadhaar && form.ward) ? 1 : .5 }}
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                        {tr.submit}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
