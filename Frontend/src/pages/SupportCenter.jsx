import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchMyTickets, createSupportTicket } from '../services/api';
import { t } from '../data';

const faqs = [
    { q: "How do I apply for a new Caste Certificate?", a: "Go to the Certificates section on your dashboard, select 'Caste Certificate', upload required docs, and submit." },
    { q: "What is the typical resolution time for complaints?", a: "Minor issues are addressed within 24-48 hours. Infrastructural issues may take 7-10 working days." },
    { q: "How can I pay my house tax?", a: "Use the 'Tax Payments' link in your navigation sidebar. You can view pending bills and pay via UPI or Net Banking." },
    { q: "I forgot my password. What should I do?", a: "Use the 'Forgot Password' link on the login page to receive a reset token via email." },
];

export default function SupportCenter() {
    const { user, lang, toast } = useApp();
    const tr = t[lang];

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', category: 'general', message: '', priority: 'medium' });

    useEffect(() => {
        if (user?.token) {
            loadTickets();
        }
    }, [user?.token]);

    async function loadTickets() {
        if (!user?.token) return;
        setLoading(true);
        const { data, ok } = await fetchMyTickets(user.token);
        if (ok) setTickets(data.tickets);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!user?.token) return toast.error('You must be logged in');

        setLoading(true);
        const { data, ok, error } = await createSupportTicket(newTicket, user.token);
        if (ok) {
            toast.success('Support ticket raised successfully!');
            setNewTicket({ subject: '', category: 'general', message: '', priority: 'medium' });
            setShowForm(false);
            loadTickets();
        } else {
            const errMsg = data?.message || data?.errors?.[0]?.message || error || 'Failed to raise ticket';
            toast.error(errMsg);
            console.error('[SupportCenter] submit error:', { data, error });
        }
        setLoading(false);
    }

    return (
        <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>support_agent</span> {tr.supportCenter}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Help is here. Browse FAQs or talk to our team.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Back to Support' : 'Raise New Ticket'}
                </button>
            </div>

            {showForm ? (
                <div className="card animate-slide-up" style={{ padding: 40, background: 'var(--bg-card)', border: '1px solid var(--gray-200)' }}>
                    <h2 style={{ marginBottom: 24, fontWeight: 800 }}>New Support Request</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
                        <div>
                            <label className="label">Subject</label>
                            <input
                                type="text" className="input" required placeholder="e.g. Issue with tax payment"
                                value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                            />
                        </div>
                        <div className="grid-2">
                            <div>
                                <label className="label">Category</label>
                                <select className="input" value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}>
                                    <option value="general">General Inquiry</option>
                                    <option value="technical">Technical Issue</option>
                                    <option value="complaint">Complaint</option>
                                    <option value="suggestion">Suggestion</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Priority</label>
                                <select className="input" value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Message</label>
                            <textarea
                                className="input" style={{ minHeight: 120 }} required
                                placeholder="Describe your issue in detail..."
                                value={newTicket.message} onChange={e => setNewTicket({ ...newTicket, message: e.target.value })}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </form>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
                    <div>
                        <h3 style={{ marginBottom: 20 }}>Your Recent Tickets</h3>
                        {loading && <p>Loading tickets...</p>}
                        {!loading && tickets.length === 0 && (
                            <div className="glass card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 40, marginBottom: 16 }}><span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--text-muted)' }}>mail</span></div>
                                <p>You haven't raised any support tickets yet.</p>
                            </div>
                        )}
                        <div style={{ display: 'grid', gap: 16 }}>
                            {tickets.map(t => (
                                <div key={t._id} className="glass card" style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 700, fontSize: 15 }}>{t.subject}</span>
                                        <span className={`badge badge-${t.status === 'open' ? 'warning' : 'success'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 12 }}>{t.message.substring(0, 100)}...</p>
                                    <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                        <span>ID: {t._id.substring(t._id.length - 8)}</span>
                                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ marginBottom: 20 }}>Quick Help (FAQs)</h3>
                        <div style={{ display: 'grid', gap: 16 }}>
                            {faqs.map((faq, i) => (
                                <details key={i} className="card" style={{ padding: '0 16px', marginBottom: 12, background: 'var(--bg-card)', border: '1px solid var(--gray-200)' }}>
                                    <summary style={{ padding: '16px 0', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {faq.q}
                                        <span style={{ fontSize: 12, color: 'var(--primary-600)' }}>▼</span>
                                    </summary>
                                    <p style={{ paddingBottom: 16, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.6 }}>
                                        {faq.a}
                                    </p>
                                </details>
                            ))}
                        </div>

                        <div className="card" style={{ marginTop: 32, padding: 24, background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))', color: 'white', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
                            <h4 style={{ marginBottom: 12, fontSize: 18, fontWeight: 800 }}>Emergency Hotline</h4>
                            <p style={{ fontSize: 13, marginBottom: 16, color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                                Need immediate assistance with a life-threatening issue or natural disaster?
                            </p>
                            <div style={{ fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 24 }}><span className="material-symbols-outlined" style={{ fontSize: 24 }}>phone</span></span> +91 0800 222 XXXX
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
