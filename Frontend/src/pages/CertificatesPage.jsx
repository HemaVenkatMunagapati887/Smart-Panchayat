import { useState, useEffect } from 'react';
import { t } from '../data';
import { fetchCertificates as apiFetchCerts, applyCertificate } from '../services/api';
import { useApp } from '../context/AppContext';

export default function CertificatesPage() {
    const { lang, user } = useApp();
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', father: '', dob: '', ward: '', purpose: '' });
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const tr = t[lang];

    const certTypes = [
        { id: 'income', label: tr.certificates.income, icon: 'payments', desc: tr.certificates.incomeDesc, fee: tr.certificates.free, days: tr.certificates.days.replace('{d}', '3-5'), color: '#d1fae5', ctext: '#065f46' },
        { id: 'caste', label: tr.certificates.caste, icon: 'description', desc: tr.certificates.casteDesc, fee: tr.certificates.free, days: tr.certificates.days.replace('{d}', '5-7'), color: '#ede9fe', ctext: '#5b21b6' },
        { id: 'residence', label: tr.certificates.residence, icon: 'home', desc: tr.certificates.residenceDesc, fee: tr.certificates.free, days: tr.certificates.days.replace('{d}', '3-5'), color: '#dbeafe', ctext: '#1e40af' },
        { id: 'birth', label: tr.certificates.birth, icon: 'child_care', desc: tr.certificates.birthDesc, fee: '₹25', days: tr.certificates.days.replace('{d}', '2-3'), color: '#fce7f3', ctext: '#9d174d' },
        { id: 'death', label: tr.certificates.death, icon: 'assignment', desc: tr.certificates.deathDesc, fee: '₹25', days: tr.certificates.days.replace('{d}', '2-3'), color: '#f3f4f6', ctext: '#374151' },
        { id: 'noobj', label: tr.certificates.noobj, icon: 'verified', desc: tr.certificates.noobjDesc, fee: '₹50', days: tr.certificates.days.replace('{d}', '7-10'), color: '#fff7ed', ctext: '#9a3412' },
    ];

    useEffect(() => {
        const loadCerts = async () => {
            if (!user?.email || !user?.token) return;
            setLoading(true);
            const { data, ok } = await apiFetchCerts(user.email, user.token);
            if (ok && Array.isArray(data)) {
                setRecords(data);
            }
            setLoading(false);
        };
        loadCerts();
    }, [user.email, user.token]);

    const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    const handleApply = async () => {
        const newRecord = {
            id: `CERT-${Date.now().toString().slice(-6)}`,
            type: selected.id,
            name: form.name,
            userEmail: user.email,
            status: 'pending',
            appliedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };

        const { data, ok } = await applyCertificate(newRecord, user.token);
        if (ok && data) {
            setRecords([data, ...records]);
            setSubmitted(true);
        }
    };

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1><span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>description</span>{tr.certificates.title}</h1>
                <p>{tr.certificates.sub}</p>
            </div>

            {/* Certificate Types */}
            <div className="service-grid mb-24" style={{ marginBottom: 28 }}>
                {certTypes.map((c) => (
                    <div
                        key={c.id}
                        className="service-card"
                        id={`cert-${c.id}`}
                        style={{
                            border: selected?.id === c.id ? '2px solid var(--primary-500)' : undefined,
                            background: selected?.id === c.id ? 'var(--primary-50)' : undefined,
                        }}
                        onClick={() => { setSelected(c); setSubmitted(false); setForm({ name: '', father: '', dob: '', ward: '', purpose: '' }); }}
                    >
                        <div className="service-icon" style={{ background: c.color, color: c.ctext }}><span className="material-symbols-outlined" style={{ fontSize: 28 }}>{c.icon}</span></div>
                        <div className="service-name">{c.label}</div>
                        <div className="service-desc">{c.desc}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <span className="badge badge-success">{c.fee}</span>
                            <span className="badge badge-info">{c.days}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-2">
                {/* Previous Certificates */}
                <div className="card">
                    <div className="card-pad" style={{ paddingBottom: 0 }}>
                        <div className="card-title mb-16">
                            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>folder</span> {tr.certificates.myCerts}
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{lang === 'en' ? 'Type' : 'రకం'}</th>
                                    <th>{lang === 'en' ? 'Issued' : 'జారీ తేదీ'}</th>
                                    <th>{lang === 'en' ? 'Status' : 'స్థితి'}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.id}</td>
                                        <td>
                                            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>{certTypes.find((t) => t.id === c.type)?.icon}</span> {' '}
                                            <span>{tr.certificates[c.type]}</span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {c.status === 'approved' ? c.approvedDate : c.appliedDate}
                                        </td>
                                        <td>
                                            <span className={`badge ${c.status === 'approved' ? 'badge-success' : c.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                <span className={`status-dot ${c.status === 'approved' ? 'green' : c.status === 'rejected' ? 'red' : 'yellow'}`}></span>
                                                {lang === 'en' ? c.status : (tr.status[c.status] || c.status)}
                                            </span>
                                        </td>
                                        <td>
                                            {c.status === 'approved' && (
                                                <button className="btn btn-sm btn-outline" id={`download-${c.id}`}><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>download</span> {tr.certificates.download}</button>
                                            )}
                                        </td>
                                    </tr>
                                )).reverse()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Application Form */}
                <div className="card card-pad">
                    {!selected ? (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <div className="empty-state-icon"><span className="material-symbols-outlined" style={{ fontSize: 48 }}>description</span></div>
                            <h3>{tr.certificates.selectType}</h3>
                            <p>{tr.certificates.selectSub}</p>
                        </div>
                    ) : submitted ? (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                            <div style={{ fontSize: 52 }}><span className="material-symbols-outlined" style={{ fontSize: 52, color: 'var(--primary-500)' }}>celebration</span></div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary-700)', marginTop: 16 }}>
                                {tr.certificates.filedSuccess}
                            </div>
                            <div style={{ margin: '12px 0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
                                {lang === 'en' ? `Your ${selected.label} will be ready in ${selected.days}.` : `మీ ${selected.label} ${selected.days}లో సిద్ధంగా ఉంటుంది.`}
                            </div>
                            <div style={{ background: 'var(--primary-50)', borderRadius: 10, padding: 14, marginBottom: 20, border: '1px solid var(--primary-200)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tr.pensions.appNum}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-700)' }}>
                                    CERT-{Date.now().toString().slice(-6)}
                                </div>
                            </div>
                            <button className="btn btn-outline btn-block" onClick={() => { setSelected(null); setSubmitted(false); }}>
                                {tr.certificates.applyAnother}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="card-header">
                                <div>
                                    <div className="card-title"><span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 4 }}>{selected.icon}</span> {selected.label}</div>
                                    <div className="card-sub">{selected.desc} · {tr.certificates.feeTitle}: {selected.fee} · {tr.certificates.readyIn}: {selected.days}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">{tr.formLabels.fullName} <span className="required">*</span></label>
                                    <input className="form-control" value={form.name} onChange={(e) => update('name', e.target.value)} id="cert-name" placeholder={lang === 'en' ? 'As per Aadhaar' : 'ఆధార్ ప్రకారం పేరు'} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{tr.certificates.fatherName} <span className="required">*</span></label>
                                    <input className="form-control" value={form.father} onChange={(e) => update('father', e.target.value)} id="cert-father" />
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">{tr.certificates.dob} <span className="required">*</span></label>
                                        <input className="form-control" type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} id="cert-dob" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{tr.formLabels.ward} <span className="required">*</span></label>
                                        <select className="form-control" value={form.ward} onChange={(e) => update('ward', e.target.value)} id="cert-ward">
                                            <option value="">{tr.formLabels.selectWard}</option>
                                            {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'].map((w) => <option key={w}>{w}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{tr.certificates.purpose}</label>
                                    <input className="form-control" value={form.purpose} onChange={(e) => update('purpose', e.target.value)} id="cert-purpose" placeholder={tr.certificates.purposePlaceholder} />
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-outline" onClick={() => setSelected(null)} id="cert-cancel">{tr.cancel}</button>
                                    <button
                                        className="btn btn-primary"
                                        disabled={!form.name || !form.father || !form.dob || !form.ward}
                                        onClick={handleApply}
                                        id="cert-submit"
                                        style={{ flex: 1, opacity: (form.name && form.father && form.dob && form.ward) ? 1 : .5 }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>send</span> {tr.submit}
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
