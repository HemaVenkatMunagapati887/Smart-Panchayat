import { useState, useEffect } from 'react';
import { t } from '../data';
import { fetchTaxRecords, payTax as apiPayTax, createTax } from '../services/api';
import { useApp } from '../context/AppContext';

export default function TaxPayments() {
    const { lang, user } = useApp();
    const [paying, setPaying] = useState(null);
    const [paid, setPaid] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [upiId, setUpiId] = useState('');
    const [payLoading, setPayLoading] = useState(false);
    const tr = t[lang];

    const taxTypes = [
        { id: 'house', label: tr.tax.house, icon: 'home', desc: tr.tax.houseDesc, color: '#d1fae5', ctext: '#065f46' },
        { id: 'water', label: tr.tax.water, icon: 'water_drop', desc: tr.tax.waterDesc, color: '#dbeafe', ctext: '#1e40af' },
        { id: 'trade', label: tr.tax.trade, icon: 'storefront', desc: tr.tax.tradeDesc, color: '#fef9c3', ctext: '#713f12' },
    ];

    useEffect(() => {
        const loadTaxes = async () => {
            if (!user?.email || !user?.token) return;
            setLoading(true);
            const { data, ok } = await fetchTaxRecords(user.email, user.token);
            if (ok && Array.isArray(data)) {
                setRecords(data);
            } else {
                setRecords([]);
            }
            setLoading(false);
        };
        loadTaxes();
    }, [user.email, user.token]);

    const parseAmount = (amt) => parseInt((amt || '0').replace(/[₹,]/g, '')) || 0;

    const handlePayTax = async (id) => {
        if (paymentMethod === 'UPI' && !upiId.trim()) {
            alert(lang === 'en' ? 'Please enter your UPI ID.' : 'దయచేసి UPI ID నమోదు చేయండి.');
            return;
        }
        setPayLoading(true);
        const { data, ok } = await apiPayTax(id, user.token);
        if (ok && data) {
            setRecords((prev) =>
                prev.map((r) => r.id === id ? data : r)
            );
            setPaying(null);
            setPaid(id);
            setUpiId('');
            setTimeout(() => setPaid(null), 4000);
        }
        setPayLoading(false);
    };

    const downloadReceipt = (record) => {
        const content = `
==========================================
       SMART PANCHAYAT - TAX RECEIPT
==========================================
Receipt No:   ${record.id}
User Name:    ${user.name}
User Email:   ${user.email}
Tax Type:     ${record.type.toUpperCase()}
Amount:       ${record.amount}
Year:         ${record.year}
Status:       PAID ✓
Paid Date:    ${record.date}
==========================================
This is a computer-generated receipt.
No signature required.
Thank you for contributing to our village!
==========================================
        `;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receipt_${record.id}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ✅ FIXED: Dynamically calculate from real records
    const totalPending = records
        .filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + parseAmount(r.amount), 0);

    const totalPaid = records
        .filter((r) => r.status === 'paid')
        .reduce((sum, r) => sum + parseAmount(r.amount), 0);

    const generateDemoTaxes = async () => {
        const demoData = [
            { id: `TAX-${Date.now()}-1`, userEmail: user.email, userName: user.name, type: 'house', amount: '₹1,500', year: '2024-25', status: 'pending' },
            { id: `TAX-${Date.now()}-2`, userEmail: user.email, userName: user.name, type: 'water', amount: '₹400', year: '2024-25', status: 'pending' }
        ];

        try {
            setLoading(true);
            for (const tax of demoData) {
                await createTax(tax, user.token);
            }
            const { data, ok } = await fetchTaxRecords(user.email, user.token);
            if (ok && Array.isArray(data)) setRecords(data);
            setLoading(false);
        } catch (error) {
            console.error('Error generating taxes:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner mb-16" style={{ margin: '0 auto' }}></div>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {tr.tax.fetching}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, verticalAlign: 'bottom', marginRight: 8 }}>payments</span>
                    {tr.taxPayments || (lang === 'en' ? 'Tax Payments' : 'పన్ను చెల్లింపులు')}
                </h1>
                <p>{lang === 'en' ? 'View and pay your panchayat taxes online. Get instant receipt.' : 'మీ పంచాయతీ పన్నులను ఆన్‌లైన్‌లో చూసి చెల్లించండి.'}</p>
            </div>

            {/* Empty State */}
            {records.length === 0 && (
                <div className="card card-pad" style={{ textAlign: 'center', padding: '60px 20px', marginBottom: 28 }}>
                    <div style={{ marginBottom: 20 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 80, color: 'var(--primary-300)' }}>money_off</span>
                    </div>
                    <h2 style={{ marginBottom: 12 }}>{tr.tax.noRecords}</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
                        {tr.tax.noRecordsSub}
                    </p>
                    {/* Only show for dev/admin purposes */}
                    {user?.role === 'admin' && (
                        <button className="btn btn-primary btn-lg" onClick={generateDemoTaxes}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>auto_awesome</span> {tr.tax.generateDemo}
                        </button>
                    )}
                    {user?.role !== 'admin' && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                            {lang === 'en'
                                ? <><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>assignment</span> Tax records are assigned by the Gram Panchayat. Please visit the office if your records are not visible.</>
                                : <><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>assignment</span> పన్ను రికార్డులు గ్రామ పంచాయతీ ద్వారా కేటాయించబడతాయి. రికార్డులు కనిపించకపోతే కార్యాలయాన్ని సంప్రదించండి.</>}
                        </p>
                    )}
                </div>
            )}

            {records.length > 0 && (
                <>
                    {/* ✅ FIXED: Real dynamic stats from records */}
                    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 28 }}>
                        <div className="kpi-card">
                            <div className="kpi-icon green">
                                <span className="material-symbols-outlined">check_circle</span>
                            </div>
                            <div>
                                <div className="kpi-label">{tr.tax.totalPaid}</div>
                                <div className="kpi-value">₹{totalPaid.toLocaleString('en-IN')}</div>
                                <div className="kpi-change up">{tr.tax.upToDate}</div>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon red">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <div>
                                <div className="kpi-label">{tr.tax.pendingTotal}</div>
                                <div className="kpi-value">₹{totalPending.toLocaleString('en-IN')}</div>
                                <div className="kpi-change down">{totalPending > 0 ? tr.tax.dueNow : (lang === 'en' ? 'All Clear ✓' : 'అన్నీ చెల్లించారు ✓')}</div>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon blue">
                                <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <div>
                                <div className="kpi-label">{lang === 'en' ? 'Total Records' : 'మొత్తం రికార్డులు'}</div>
                                <div className="kpi-value">{records.length}</div>
                                <div className="kpi-change up">{records.filter(r => r.status === 'paid').length} {lang === 'en' ? 'paid' : 'చెల్లించారు'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tax Types Info Cards */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                        {taxTypes.map((tt) => (
                            <div key={tt.id} style={{
                                flex: 1, minWidth: 200,
                                background: tt.color, borderRadius: 'var(--radius-lg)', padding: 20,
                                border: `1.5px solid ${tt.ctext}20`,
                                display: 'flex', gap: 12, alignItems: 'center',
                            }}>
                                <div style={{ color: tt.ctext }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>{tt.icon}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: tt.ctext }}>{tt.label}</div>
                                    <div style={{ fontSize: 12, color: tt.ctext, opacity: .75, lineHeight: 1.4 }}>{tt.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Payment Success Toast */}
            {paid && (
                <div style={{
                    position: 'fixed', top: 80, right: 24, zIndex: 300,
                    background: 'var(--primary-500)', color: '#fff',
                    borderRadius: 'var(--radius-md)', padding: '14px 22px',
                    boxShadow: 'var(--shadow-lg)', fontSize: 14, fontWeight: 600,
                    animation: 'fadeIn .25s both',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>check_circle</span> {tr.tax.paymentSuccess} {lang === 'en' ? `Receipt: ${paid}` : `రసీదు: ${paid}`}
                </div>
            )}

            {/* Tax Records Table */}
            {records.length > 0 && (
                <div className="card mb-24">
                    <div className="card-pad" style={{ paddingBottom: 0 }}>
                        <div className="card-title mb-16" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-600)' }}>receipt_long</span>
                            {tr.tax.records}
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>{lang === 'en' ? 'Receipt #' : 'రసీదు #'}</th>
                                    <th>{lang === 'en' ? 'Type' : 'రకం'}</th>
                                    <th>{lang === 'en' ? 'Amount' : 'మొత్తం'}</th>
                                    <th>{lang === 'en' ? 'Year' : 'సంవత్సరం'}</th>
                                    <th>{lang === 'en' ? 'Payment Date' : 'చెల్లింపు తేదీ'}</th>
                                    <th>{lang === 'en' ? 'Status' : 'స్థితి'}</th>
                                    <th>{lang === 'en' ? 'Action' : 'చర్య'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...records].reverse().map((r) => (
                                    <tr key={r.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.id}</td>
                                        <td>
                                            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4, color: 'var(--text-muted)' }}>
                                                {taxTypes.find((t) => t.id === r.type)?.icon}
                                            </span>
                                            {taxTypes.find((t) => t.id === r.type)?.label}
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{r.amount}</td>
                                        <td style={{ fontSize: 13 }}>{r.year}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.date}</td>
                                        <td>
                                            <span className={`badge ${r.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                                <span className={`status-dot ${r.status === 'paid' ? 'green' : 'yellow'}`}></span>
                                                {lang === 'en' ? r.status : (r.status === 'paid' ? 'చెల్లించారు' : 'పెండింగ్')}
                                            </span>
                                        </td>
                                        <td>
                                            {r.status === 'pending' ? (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => { setPaying(r); setPaymentMethod('UPI'); setUpiId(''); }}
                                                    id={`pay-${r.id}`}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>credit_card</span>
                                                    {tr.tax.payNow}
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    id={`receipt-${r.id}`}
                                                    onClick={() => downloadReceipt(r)}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                                                    {tr.tax.receipt}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {paying && (
                <div className="modal-overlay" onClick={() => setPaying(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined">payments</span>
                                {tr.tax.confirmPay}
                            </div>
                            <button className="modal-close" onClick={() => setPaying(null)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span></button>
                        </div>

                        {/* Payment summary */}
                        <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                            {[
                                [lang === 'en' ? 'Tax Type' : 'పన్ను రకం', taxTypes.find((t) => t.id === paying.type)?.label || paying.type],
                                [lang === 'en' ? 'Amount' : 'మొత్తం', paying.amount],
                                [lang === 'en' ? 'Year' : 'సంవత్సరం', paying.year],
                                [lang === 'en' ? 'Receipt #' : 'రసీదు #', paying.id],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)', fontSize: 14 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                                    <span style={{ fontWeight: 700 }}>{v}</span>
                                </div>
                            ))}
                        </div>

                        {/* Payment Method Selector */}
                        <div style={{ marginBottom: 16 }}>
                            <div className="form-label" style={{ marginBottom: 8 }}>{lang === 'en' ? 'Select Payment Method' : 'చెల్లింపు విధానం ఎంచుకోండి'}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                                {[
                                    { name: 'UPI', icon: 'smartphone' },
                                    { name: lang === 'en' ? 'Card' : 'కార్డు', icon: 'credit_card' },
                                    { name: lang === 'en' ? 'Net Banking' : 'నెట్ బ్యాంకింగ్', icon: 'account_balance' },
                                    { name: lang === 'en' ? 'Cash' : 'నగదు', icon: 'payments' }
                                ].map((m) => (
                                    <button
                                        key={m.name}
                                        className={`btn btn-sm ${paymentMethod === m.name ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ fontSize: 12 }}
                                        onClick={() => setPaymentMethod(m.name)}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{m.icon}</span>
                                        {m.name}
                                    </button>
                                ))}
                            </div>

                            {/* UPI ID input — only shown when UPI is selected */}
                            {paymentMethod === 'UPI' && (
                                <div className="form-group">
                                    <label className="form-label">{lang === 'en' ? 'UPI ID' : 'UPI ID'}</label>
                                    <input
                                        className="form-control"
                                        placeholder="yourname@upi"
                                        id="pay-upi"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                    />
                                </div>
                            )}

                            {(paymentMethod === 'Card' || paymentMethod === 'కార్డు') && (
                                <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--primary-700)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>credit_card</span> {lang === 'en' ? 'Card payment gateway will be integrated before go-live.' : 'కార్డు చెల్లింపు గేట్‌వే త్వరలో అందుబాటులోకి వస్తుంది.'}
                                </div>
                            )}

                            {(paymentMethod === 'Net Banking' || paymentMethod === 'నెట్ బ్యాంకింగ్') && (
                                <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--primary-700)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>language</span> {lang === 'en' ? 'Net Banking redirect will be configured during deployment.' : 'నెట్ బ్యాంకింగ్ డెప్లాయ్‌మెంట్ సమయంలో కాన్ఫిగర్ చేయబడుతుంది.'}
                                </div>
                            )}

                            {(paymentMethod === 'Cash' || paymentMethod === 'నగదు') && (
                                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: 12, fontSize: 13, color: '#713f12' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>payments</span> {lang === 'en' ? 'Visit the Gram Panchayat office to pay by cash. Keep this record number handy.' : 'నగదు చెల్లింపు కోసం గ్రామ పంచాయతీ కార్యాలయాన్ని సందర్శించండి.'}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-outline" onClick={() => setPaying(null)} style={{ flex: 1 }}>{tr.cancel}</button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handlePayTax(paying.id)}
                                style={{ flex: 2 }}
                                id="confirm-pay"
                                disabled={payLoading || (paymentMethod === 'UPI' && !upiId.trim())}
                            >
                                <span className="material-symbols-outlined">{payLoading ? 'hourglass_empty' : 'check_circle'}</span>
                                {payLoading
                                    ? (lang === 'en' ? 'Processing...' : 'ప్రాసెస్ అవుతోంది...')
                                    : (lang === 'en' ? `Confirm & Pay ${paying.amount}` : `${paying.amount} నిర్ధారించి చెల్లించు`)
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
