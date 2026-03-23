import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { statusColor, categoryEmoji, t } from '../data';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { fetchGovernanceAnalytics, fetchComplaintHeatmap, generateAIReport } from '../services/api';
import ComplaintsMap from '../components/ComplaintsMap';

function KpiCard({ icon, label, value, change, dir, colorClass }) {
    return (
        <div className="kpi-card">
            <div className={`kpi-icon ${colorClass}`}><span className="material-symbols-outlined">{icon}</span></div>
            <div>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value">{value}</div>
                <div className={`kpi-change ${dir}`}>{change}</div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { lang, user, complaints, setComplaints, toast } = useApp();
    const tr = t[lang];
    const [selectedComp, setSelectedComp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [viewComp, setViewComp] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const [activeTab, setActiveTab] = useState('complaints');
    const [dashboardData, setDashboardData] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAnnounceModal, setShowAnnounceModal] = useState(false);
    const [newAnnounce, setNewAnnounce] = useState({ title: '', category: 'notice', body: '' });

    // Staff Management
    const [staffMembers, setStaffMembers] = useState([]);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', phone: '', department: '', designation: '' });
    const [staffLoading, setStaffLoading] = useState(false);

    // AI-Driven Filters
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // AI States
    const [aiInsights, setAiInsights] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [heatmapMode, setHeatmapMode] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);

    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            const matchCat = filterCategory === 'all' || c.category === filterCategory;
            const matchPrio = filterPriority === 'all' || c.priority === filterPriority;
            const matchStatus = filterStatus === 'all' || c.status === filterStatus;
            return matchCat && matchPrio && matchStatus;
        });
    }, [complaints, filterCategory, filterPriority, filterStatus]);

    const fetchData = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const [dashRes, announceRes, staffRes] = await Promise.all([
                api.fetchAdminDashboard(user.token),
                api.fetchAnnouncements(user.token),
                api.fetchStaffMembers(user.token)
            ]);

            if (dashRes.ok && dashRes.data) {
                setDashboardData(dashRes.data);
                if (dashRes.data.complaints) setComplaints(dashRes.data.complaints);
            }
            if (announceRes.ok && announceRes.data) {
                setAnnouncements(announceRes.data);
            }
            if (staffRes.ok && staffRes.data?.staff) {
                setStaffMembers(staffRes.data.staff);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user.token, toast, setComplaints]);

    const fetchAIInsights = useCallback(async () => {
        setAiLoading(true);
        const { data, ok } = await fetchGovernanceAnalytics(user.token);
        if (ok && data) {
            setAiInsights(data);
        }
        setAiLoading(false);
    }, [user.token]);

    const handleGenerateReport = async () => {
        setReportLoading(true);
        toast.info('Generating AI Executive Report...');
        const { data, ok } = await generateAIReport(user.token, null, null, 'Village_Executive_Report');
        if (ok && data?.downloadUrl) {
            window.open(data.downloadUrl, '_blank');
            toast.success('Report generated successfully!');
        } else if (ok && data?.pdfBuffer) {
             // Handle base64 if returned
             const linkSource = `data:application/pdf;base64,${data.pdfBuffer}`;
             const downloadLink = document.createElement("a");
             downloadLink.href = linkSource;
             downloadLink.download = "Smart_Panchayat_AI_Report.pdf";
             downloadLink.click();
             toast.success('Report downloaded!');
        } else {
            toast.error('Failed to generate AI report.');
        }
        setReportLoading(false);
    };

    useEffect(() => {
        // Initial fetch
        fetchData();
        fetchAIInsights();

        // Refresh when tab is focused (snappy updates)
        const onFocus = () => fetchData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchData]);

    const stats = useMemo(() => ({
        totalComplaints: complaints.length,
        resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
        inProgressComplaints: complaints.filter(c => c.status === 'inprogress').length,
        pendingComplaints: complaints.filter(c => c.status === 'pending').length,
        pensionCount: dashboardData?.stats?.pensionCount || dashboardData?.pensions?.length || 0,
        certificateCount: dashboardData?.stats?.certificateCount || dashboardData?.certificates?.length || 0,
        totalTaxDue: dashboardData?.stats?.totalTaxDue || 0
    }), [dashboardData, complaints]);

    const monthlyTrend = useMemo(() => dashboardData?.monthlyTrend?.map(item => ({
        month: `${item._id.month}/${item._id.year}`,
        complaints: item.filed,
        resolved: item.resolved
    })) || [
            { month: 'Sep', complaints: 32, resolved: 28 },
            { month: 'Oct', complaints: 45, resolved: 38 },
            { month: 'Nov', complaints: 38, resolved: 35 },
            { month: 'Dec', complaints: 52, resolved: 44 },
            { month: 'Jan', complaints: 48, resolved: 40 },
            { month: 'Feb', complaints: 61, resolved: 52 },
        ], [dashboardData]);

    const categoryBreakdown = useMemo(() => dashboardData?.categoryBreakdown?.map(item => {
        const id = item._id || 'other';
        return {
            name: id.charAt(0).toUpperCase() + id.slice(1),
            value: item.value || 0,
            color: id === 'sanitation' ? '#2a9640' : id === 'streetlight' ? '#f5b800' : id === 'water' ? '#3b82f6' : id === 'road' ? '#8b5cf6' : '#f97316'
        };
    }) || [
            { name: 'Sanitation', value: 34, color: '#2a9640' },
            { name: 'Street Lights', value: 26, color: '#f5b800' },
            { name: 'Water Supply', value: 20, color: '#3b82f6' },
            { name: 'Roads', value: 12, color: '#8b5cf6' },
            { name: 'Others', value: 8, color: '#f97316' },
        ], [dashboardData]);

    const wardPerformance = useMemo(() => dashboardData?.wardPerformance || [
        { ward: 'Ward 1', resolved: 95, pending: 5 },
        { ward: 'Ward 2', resolved: 78, pending: 22 },
        { ward: 'Ward 3', resolved: 88, pending: 12 },
        { ward: 'Ward 4', resolved: 60, pending: 40 },
        { ward: 'Ward 5', resolved: 72, pending: 28 },
        { ward: 'Ward 6', resolved: 91, pending: 9 },
    ], [dashboardData]);

    const handleAssign = async (staffName) => {
        const { data, ok } = await api.updateComplaint(selectedComp.id, {
            assignedTo: staffName,
            status: 'inprogress',
            progress: 10,
            timelineItem: {
                step: 'Staff Assigned',
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                done: true,
                desc: `Assigned to ${staffName}`
            }
        }, user.token);

        if (ok && data) {
            setComplaints(prev => prev.map(c => c.id === selectedComp.id ? data : c));
            setShowModal(false);
            setSelectedComp(null);
            fetchData();
            toast.success(lang === 'en' ? `Assigned to ${staffName} successfully!` : `${staffName} కు విజయవంతంగా కేటాయించబడింది!`);
        }
    };

    const handleCreateAnnounce = async () => {
        if (!newAnnounce.title || !newAnnounce.body) {
            return toast.error('Please fill in both title and content.');
        }

        const icons = {
            meeting: 'groups',
            notice: 'campaign',
            welfare: 'volunteer_activism',
            infrastructure: 'construction',
        };

        const { data, ok } = await api.createAnnouncement({
            ...newAnnounce,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            icon: icons[newAnnounce.category] || 'campaign'
        }, user.token);

        if (ok && data) {
            setAnnouncements(prev => [data, ...prev]);
            setShowAnnounceModal(false);
            setNewAnnounce({ title: '', category: 'notice', body: '' });
            toast.success('Announcement posted successfully!');
        } else {
            toast.error('Failed to post announcement.');
        }
    };

    const handleDeleteAnnounce = async (id) => {
        if (!window.confirm(lang === 'en' ? 'Are you sure you want to delete this announcement?' : 'మీరు ఈ ప్రకటనను తొలగించాలనుకుంటున్నారా?')) return;

        const { ok } = await api.deleteAnnouncement(id, user.token);
        if (ok) {
            setAnnouncements(prev => prev.filter(a => a._id !== id));
            toast.success(lang === 'en' ? 'Announcement deleted!' : 'ప్రకటన తొలగించబడింది!');
        } else {
            toast.error('Failed to delete announcement.');
        }
    };

    const handleCreateStaff = async () => {
        if (!newStaff.name || !newStaff.email || !newStaff.password) {
            return toast.error('Name, email, and password are required.');
        }
        setStaffLoading(true);
        const { data, ok } = await api.createStaffMember(newStaff, user.token);
        if (ok && data?.staff) {
            setStaffMembers(prev => [data.staff, ...prev]);
            setShowStaffModal(false);
            setNewStaff({ name: '', email: '', password: '', phone: '', department: '', designation: '' });
            toast.success('Staff member added successfully!');
        } else {
            toast.error(data?.message || 'Failed to create staff member.');
        }
        setStaffLoading(false);
    };

    const handleToggleStaff = async (id) => {
        const { data, ok } = await api.toggleStaffStatus(id, user.token);
        if (ok) {
            setStaffMembers(prev => prev.map(s => s._id === id ? { ...s, isActive: !s.isActive } : s));
            toast.success(data?.message || 'Status updated.');
        } else {
            toast.error('Failed to update status.');
        }
    };

    const handleDeleteStaff = async (id, name) => {
        if (!window.confirm(`Remove ${name} from staff? This cannot be undone.`)) return;
        const { ok } = await api.deleteStaffMember(id, user.token);
        if (ok) {
            setStaffMembers(prev => prev.filter(s => s._id !== id));
            toast.success('Staff member removed.');
        } else {
            toast.error('Failed to remove staff member.');
        }
    };

    const tabs = [
        { id: 'complaints', label: tr.complaints, icon: 'assignment' },
        { id: 'staff', label: lang === 'en' ? 'Staff' : 'సిబ్బంది', icon: 'badge' },
        { id: 'pensions', label: tr.pensionNav, icon: 'elderly' },
        { id: 'certificates', label: tr.certificatesNav, icon: 'description' },
        { id: 'taxes', label: tr.taxNav, icon: 'payments' },
        { id: 'announcements', label: tr.announcements, icon: 'campaign' },
    ];

    return (
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1><span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>monitoring</span>{lang === 'en' ? 'Admin Dashboard' : 'అడ్మిన్ డ్యాష్‌బోర్డ్'}</h1>
                    <p>{lang === 'en' ? 'Real-time overview of all panchayat services and grievances.' : 'అన్ని పంచాయతీ సేవలు మరియు ఫిర్యాదుల రియల్-టైమ్ అవలోకనం.'}</p>
                </div>
                <button className="btn btn-outline" onClick={fetchData} disabled={loading}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8 }}>refresh</span>
                    {lang === 'en' ? 'Refresh Data' : 'రిఫ్రెష్ డేటా'}
                </button>
            </div>

            {/* AI Governance Insights Widget */}
            {aiInsights && (
                <div className="card mb-24 fade-in" style={{ 
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                    color: '#fff', 
                    border: 'none',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 150 }}>psychology</span>
                    </div>
                    <div style={{ padding: '24px', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ 
                                    background: 'rgba(56, 189, 248, 0.2)', 
                                    color: '#38bdf8', 
                                    width: 40, height: 40, borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>AI Governance Insights</h3>
                                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Predictive analysis for {new Date().toLocaleString('default', { month: 'long' })}</p>
                                </div>
                            </div>
                            <button 
                                className="btn btn-sm" 
                                onClick={handleGenerateReport}
                                disabled={reportLoading}
                                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6 }}>{reportLoading ? 'sync' : 'picture_as_pdf'}</span>
                                {reportLoading ? 'Generating...' : 'Export AI Report'}
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {aiInsights.topInsights?.map((insight, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ color: insight.type === 'warning' ? '#f87171' : '#34d399', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{insight.type === 'warning' ? 'error' : 'trending_up'}</span>
                                        {insight.title || (insight.type === 'warning' ? 'Warning' : 'Insight')}
                                    </div>
                                    <div style={{ fontSize: 14, lineHeight: 1.5, color: '#cbd5e1' }}>{insight.text}</div>
                                </div>
                            )) || (
                                <div style={{ fontSize: 14, color: '#94a3b8' }}>{aiInsights.summary || 'Analyzing current trends based on your village data...'}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Row */}
            <div className="kpi-grid">
                <KpiCard icon="assignment" label={tr.complaints} value={stats.totalComplaints} change="↑ Total" dir="up" colorClass="blue" />
                <KpiCard icon="check_circle" label={lang === 'en' ? 'Resolved' : 'పరిష్కరించబడింది'} value={stats.resolvedComplaints} change="↑ Resolved" dir="up" colorClass="green" />
                <KpiCard icon="elderly" label={tr.pensionNav} value={stats.pensionCount} change="Active applications" dir="up" colorClass="purple" />
                <KpiCard icon="description" label={tr.certificatesNav} value={stats.certificateCount} change="Pending issues" dir="up" colorClass="teal" />
                <KpiCard icon="payments" label={lang === 'en' ? 'Tax Due' : 'పన్ను బాకీ'} value={`₹${dashboardData?.stats?.totalTaxDue?.toLocaleString('en-IN') || 0}`} change="Uncollected" dir="down" colorClass="red" />
            </div>

            {/* Map Section */}
            <div className="mb-24">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)' }}>Live Issue Coverage</div>
                    <button 
                        className={`btn btn-sm ${heatmapMode ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setHeatmapMode(!heatmapMode)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{heatmapMode ? 'map' : 'density_medium'}</span>
                        {heatmapMode ? 'Show Markers' : 'AI Heatmap View'}
                    </button>
                </div>
                <ComplaintsMap
                    complaints={complaints}
                    heatmapMode={heatmapMode}
                    onViewDetails={(c) => { setViewComp(c); setShowViewModal(true); }}
                />
            </div>

            {/* Charts Row */}
            <div className="grid-2 mb-24">
                <div className="card card-pad">
                    <div className="card-header">
                        <div className="card-title">{lang === 'en' ? 'Monthly Complaint Trend' : 'నెలవారీ ఫిర్యాదుల ట్రెండ్'}</div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="complaints" stroke="var(--red-500)" strokeWidth={2} dot={{ r: 4 }} name="Filed" />
                            <Line type="monotone" dataKey="resolved" stroke="var(--primary-500)" strokeWidth={2} dot={{ r: 4 }} name="Resolved" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="card card-pad">
                    <div className="card-header">
                        <div className="card-title">{lang === 'en' ? 'Complaints by Category' : 'వర్గం వారీగా ఫిర్యాదులు'}</div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        {categoryBreakdown.length > 0 ? (
                            <PieChart>
                                <Pie
                                    data={categoryBreakdown}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="none"
                                >
                                    {categoryBreakdown.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color || '#ccc'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                No data available
                            </div>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabbed Inventory */}
            <div className="card">
                <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)', padding: '0 20px' }}>
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '16px 20px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 14,
                                color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: -1
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
                            {tab.label}
                        </div>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {activeTab === 'staff' && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowStaffModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                                {lang === 'en' ? 'Add Staff' : 'సిబ్బందిని జోడించండి'}
                            </button>
                        )}
                        {activeTab === 'announcements' && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowAnnounceModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                                {lang === 'en' ? 'Create Announcement' : 'ప్రకటన సృష్టించండి'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="table-wrapper">
                    {activeTab === 'complaints' && (
                        <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_alt</span> Smart Filters:</div>

                            <select
                                className="form-control"
                                style={{ width: 'auto', padding: '4px 12px', fontSize: 13 }}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="inprogress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>

                            <select
                                className="form-control"
                                style={{ width: 'auto', padding: '4px 12px', fontSize: 13 }}
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                <option value="sanitation">Sanitation</option>
                                <option value="streetlight">Streetlight</option>
                                <option value="water">Water Supply</option>
                                <option value="road">Roads</option>
                                <option value="health">Health</option>
                            </select>

                            <select
                                className="form-control"
                                style={{ width: 'auto', padding: '4px 12px', fontSize: 13 }}
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <option value="all">All Priorities</option>
                                <option value="high">● High Priority</option>
                                <option value="medium">● Medium</option>
                                <option value="low">● Low</option>
                            </select>

                            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                                Showing <b>{filteredComplaints.length}</b> results
                            </div>
                        </div>
                    )}

                    {activeTab === 'complaints' && (
                        <table>
                            <thead>
                                <tr>
                                    <th>{lang === 'en' ? 'ID' : 'ఐడి'}</th>
                                    <th>{lang === 'en' ? 'Title' : 'శీర్షిక'}</th>
                                    <th>{lang === 'en' ? 'Category' : 'వర్గం'}</th>
                                    <th>{lang === 'en' ? 'Ward' : 'వార్డు'}</th>
                                    <th>{lang === 'en' ? 'Citizen' : 'పౌరుడు'}</th>
                                    <th>{lang === 'en' ? 'Assigned To' : 'కేటాయించబడింది'}</th>
                                    <th>{lang === 'en' ? 'Status' : 'స్థితి'}</th>
                                    <th>{lang === 'en' ? 'Priority' : 'ప్రాధాన్యత'}</th>
                                    <th>{lang === 'en' ? 'Action' : 'చర్య'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComplaints.length === 0 ? (
                                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>No complaints matching your filters</td></tr>
                                ) : (
                                    filteredComplaints.map((c) => (
                                        <tr key={c.id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.id}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>{categoryEmoji[c.category]}</span> {c.title}
                                            </td>
                                            <td>
                                                <span className="badge badge-gray">{c.category}</span>
                                            </td>
                                            <td>{c.ward}</td>
                                            <td style={{ fontWeight: 600 }}>{c.citizenName || 'Guest'}</td>
                                            <td style={{ fontWeight: 600, color: c.assignedTo === 'Unassigned' || !c.assignedTo ? 'var(--red-500)' : 'var(--text-primary)' }}>
                                                {c.assignedTo || 'Unassigned'}
                                            </td>
                                            <td>
                                                <span className={`badge ${statusColor[c.status]}`}>
                                                    <span className={`status-dot ${c.status === 'resolved' ? 'green' : c.status === 'inprogress' ? 'blue' : 'yellow'}`}></span>
                                                    {tr.status[c.status]}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${c.priority === 'high' ? 'badge-danger' : c.priority === 'medium' ? 'badge-warning' : 'badge-gray'}`}>
                                                    {c.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-sm btn-outline" onClick={() => { setViewComp(c); setShowViewModal(true); }}>View</button>
                                                    <button className="btn btn-sm btn-primary" onClick={() => { setSelectedComp(c); setShowModal(true); }}>
                                                        {c.assignedTo && c.assignedTo !== 'Unassigned'
                                                            ? (lang === 'en' ? 'Reassign' : 'మళ్లీ కేటాయించండి')
                                                            : (lang === 'en' ? 'Assign' : 'కేటాయించండి')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'staff' && (
                        <>
                            {/* Staff Stats */}
                            <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Total: <b style={{ color: 'var(--text-primary)' }}>{staffMembers.length}</b>
                                    </span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                                        Active: <b>{staffMembers.filter(s => s.isActive !== false).length}</b>
                                    </span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                                        Inactive: <b>{staffMembers.filter(s => s.isActive === false).length}</b>
                                    </span>
                                </div>
                            </div>

                            {staffMembers.length === 0 ? (
                                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--gray-300)', marginBottom: 12 }}>group_off</span>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No staff members yet</p>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Add your first staff member to get started</p>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowStaffModal(true)}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span> Add Staff Member
                                    </button>
                                </div>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>{lang === 'en' ? 'Member' : 'సభ్యుడు'}</th>
                                            <th>{lang === 'en' ? 'Email' : 'ఇమెయిల్'}</th>
                                            <th>{lang === 'en' ? 'Phone' : 'ఫోన్'}</th>
                                            <th>{lang === 'en' ? 'Department' : 'విభాగం'}</th>
                                            <th>{lang === 'en' ? 'Designation' : 'హోదా'}</th>
                                            <th>{lang === 'en' ? 'Status' : 'స్థితి'}</th>
                                            <th>{lang === 'en' ? 'Joined' : 'చేరిన తేదీ'}</th>
                                            <th style={{ textAlign: 'right' }}>{lang === 'en' ? 'Actions' : 'చర్యలు'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffMembers.map(s => (
                                            <tr key={s._id} style={{ opacity: s.isActive === false ? 0.55 : 1 }}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                                            background: s.avatar && s.avatar.startsWith('http') ? `url(${s.avatar}) center/cover` : 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#fff', fontSize: 13, fontWeight: 700
                                                        }}>
                                                            {(!s.avatar || !s.avatar.startsWith('http')) && s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.email}</td>
                                                <td style={{ fontSize: 13 }}>{s.phone || '—'}</td>
                                                <td>
                                                    {s.department ? (
                                                        <span className="badge badge-info">{s.department}</span>
                                                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                </td>
                                                <td style={{ fontSize: 13, fontWeight: 500 }}>{s.designation || '—'}</td>
                                                <td>
                                                    <span className={`badge ${s.isActive !== false ? 'badge-success' : 'badge-gray'}`}>
                                                        <span className={`status-dot ${s.isActive !== false ? 'green' : 'red'}`}></span>
                                                        {s.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                        <button
                                                            className="btn btn-sm btn-outline"
                                                            title={s.isActive !== false ? 'Deactivate' : 'Activate'}
                                                            onClick={() => handleToggleStaff(s._id)}
                                                            style={{ padding: '5px 8px', minHeight: 'auto' }}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                                                {s.isActive !== false ? 'toggle_on' : 'toggle_off'}
                                                            </span>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 8px', borderRadius: 6, minHeight: 'auto' }}
                                                            title="Remove"
                                                            onClick={() => handleDeleteStaff(s._id, s.name)}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {activeTab === 'pensions' && (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Ward</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!dashboardData?.pensions || dashboardData.pensions.length === 0) ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>No pensions found</td></tr>
                                ) : (
                                    dashboardData.pensions.map((p) => (
                                        <tr key={p.id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.id}</td>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td>{tr.pensions[p.type] || p.type}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{p.amount}</td>
                                            <td>{p.ward}</td>
                                            <td>
                                                <span className={`badge ${p.status === 'active' || p.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                                    {tr.status[p.status] || p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'certificates' && (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Applicant</th>
                                    <th>Type</th>
                                    <th>Applied On</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!dashboardData?.certificates || dashboardData.certificates.length === 0) ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>No certificates found</td></tr>
                                ) : (
                                    dashboardData.certificates.map((c) => (
                                        <tr key={c.id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.id}</td>
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td>{tr.certificates[c.type] || c.type}</td>
                                            <td>{c.appliedDate}</td>
                                            <td>
                                                <span className={`badge ${c.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                                    {tr.status[c.status] || c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'taxes' && (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Year</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!dashboardData?.taxes || dashboardData.taxes.length === 0) ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>No tax records found</td></tr>
                                ) : (
                                    dashboardData.taxes.map((t) => (
                                        <tr key={t.id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.id}</td>
                                            <td>{t.userName || t.userEmail}</td>
                                            <td>{tr.tax[t.type] || t.type}</td>
                                            <td style={{ fontWeight: 700 }}>{t.amount}</td>
                                            <td>{t.year}</td>
                                            <td>
                                                <span className={`badge ${t.status === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                                                    {t.status === 'paid' ? tr.tax.upToDate : tr.tax.dueNow}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                    {activeTab === 'announcements' && (
                        <table>
                            <thead>
                                <tr>
                                    <th>{lang === 'en' ? 'Title' : 'శీర్షిక'}</th>
                                    <th>{lang === 'en' ? 'Category' : 'వర్గం'}</th>
                                    <th>{lang === 'en' ? 'Date' : 'తేదీ'}</th>
                                    <th>{lang === 'en' ? 'Content' : 'విషయం'}</th>
                                    <th style={{ textAlign: 'right' }}>{lang === 'en' ? 'Action' : 'చర్య'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>{lang === 'en' ? 'No announcements found' : 'ప్రకటనలు ఏవీ లేవు'}</td></tr>
                                ) : (
                                    announcements.map((a) => (
                                        <tr key={a._id}>
                                            <td style={{ fontWeight: 600 }}>{a.icon} {typeof a.title === 'object' ? a.title[lang] : a.title}</td>
                                            <td><span className="badge badge-gray">{t[lang].common[a.category?.toLowerCase()] || a.category}</span></td>
                                            <td style={{ fontSize: 13 }}>{a.date}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {typeof a.body === 'object' ? a.body[lang] : a.body}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: 6 }}
                                                    onClick={() => handleDeleteAnnounce(a._id)}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Assignment Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: 20
                }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 450, overflow: 'hidden' }}>
                        <div style={{ padding: '24px 24px 16px', background: 'var(--primary-600)', color: '#fff' }}>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>
                                {selectedComp?.assignedTo && selectedComp.assignedTo !== 'Unassigned'
                                    ? (lang === 'en' ? 'Reassign Staff Member' : 'మళ్లీ సిబ్బందిని కేటాయించండి')
                                    : (lang === 'en' ? 'Assign Staff Member' : 'సిబ్బందిని కేటాయించండి')}
                            </div>
                            <div style={{ opacity: .8, fontSize: 13, marginTop: 4 }}>{selectedComp?.title}</div>
                        </div>
                        <div style={{ padding: 24, maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
                                {lang === 'en' ? 'Select Staff' : 'సిబ్బందిని ఎంచుకోండి'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {staffMembers.filter(s => s.isActive !== false).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                                        No active staff members. Add staff from the Staff tab.
                                    </div>
                                ) : (
                                    staffMembers.filter(s => s.isActive !== false).map(staff => (
                                        <div
                                            key={staff._id}
                                            className="service-card"
                                            style={{
                                                padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', cursor: 'pointer', border: '1px solid var(--gray-200)'
                                            }}
                                            onClick={() => handleAssign(staff.name)}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{staff.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{staff.designation || 'Staff'} {staff.department ? `• ${staff.department}` : ''}</div>
                                            </div>
                                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-500)', fontSize: 20 }}>add_circle</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', background: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>{tr.cancel}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showViewModal && viewComp && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: 20
                }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 550, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-600)', marginBottom: 4 }}>{viewComp.id}</div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{viewComp.title}</h2>
                                </div>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}
                                >×</button>
                            </div>
                        </div>

                        <div style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`badge ${statusColor[viewComp.status]}`}>
                                            <span className={`status-dot ${viewComp.status === 'resolved' ? 'green' : viewComp.status === 'inprogress' ? 'blue' : 'yellow'}`}></span>
                                            {t[lang].status[viewComp.status]}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Priority</label>
                                    <div style={{ marginTop: 4 }}>
                                        <span className={`badge ${viewComp.priority === 'high' ? 'badge-danger' : viewComp.priority === 'medium' ? 'badge-warning' : viewComp.priority === 'gray'}`}>
                                            {viewComp.priority}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</label>
                                    <div style={{ marginTop: 4, fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle' }}>{categoryEmoji[viewComp.category]}</span> {viewComp.category}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ward / Area</label>
                                    <div style={{ marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span> {viewComp.ward}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</label>
                                <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', background: 'var(--gray-50)', padding: 16, borderRadius: 12 }}>
                                    {viewComp.description || (lang === 'en' ? 'No detailed description provided.' : 'వివరణాత్మక సమాచారం ఏమీ లేదు.')}
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'var(--primary-50)', borderRadius: 12 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary-700)' }}>person</span>
                                    <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase' }}>Assigned Staff</label>
                                        <div style={{ fontWeight: 700, color: 'var(--primary-900)', fontSize: 13 }}>{viewComp.assignedTo || 'Unassigned'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'var(--gray-100)', borderRadius: 12 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--text-muted)' }}>home</span>
                                    <div>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reporter</label>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{viewComp.citizenName || 'Guest'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '20px 24px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn btn-outline" onClick={() => setShowViewModal(false)}>Close</button>
                            <button className="btn btn-primary" onClick={() => { setShowViewModal(false); setSelectedComp(viewComp); setShowModal(true); }}>
                                Update Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcement Creation Modal */}
            {showAnnounceModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: 20
                }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 500, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', background: 'var(--primary-600)', color: '#fff' }}>
                            <div style={{ fontSize: 20, fontWeight: 800 }}>{lang === 'en' ? 'Create New Announcement' : 'కొత్త ప్రకటనను సృష్టించండి'}</div>
                            <div style={{ opacity: .8, fontSize: 13, marginTop: 4 }}>{lang === 'en' ? 'Post an update for all panchayat citizens and staff.' : 'పౌరులు మరియు సిబ్బంది కోసం తాజా సమాచారాన్ని పోస్ట్ చేయండి.'}</div>
                        </div>

                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Title' : 'శీర్షిక'}</label>
                                <input
                                    className="form-control"
                                    placeholder={lang === 'en' ? 'Enter a descriptive title...' : 'శీర్షికను నమోదు చేయండి...'}
                                    value={newAnnounce.title}
                                    onChange={(e) => setNewAnnounce(p => ({ ...p, title: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Category' : 'వర్గం'}</label>
                                <select
                                    className="form-control"
                                    value={newAnnounce.category}
                                    onChange={(e) => setNewAnnounce(p => ({ ...p, category: e.target.value }))}
                                >
                                    <option value="notice">{lang === 'en' ? 'Notice' : 'నోటీసు'}</option>
                                    <option value="meeting">{lang === 'en' ? 'Meeting' : 'సమావేశం'}</option>
                                    <option value="welfare">{lang === 'en' ? 'Welfare' : 'సంక్షేమం'}</option>
                                    <option value="infrastructure">{lang === 'en' ? 'Infrastructure' : 'మౌలిక సదుపాయాలు'}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Body Content' : 'ప్రకటన విషయం'}</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder={lang === 'en' ? 'Provide details about the announcement...' : 'ప్రకటన వివరాలను అందించండి...'}
                                    value={newAnnounce.body}
                                    onChange={(e) => setNewAnnounce(p => ({ ...p, body: e.target.value }))}
                                    style={{ minHeight: 120 }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '20px 24px', background: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--gray-200)' }}>
                            <button className="btn btn-outline" onClick={() => setShowAnnounceModal(false)}>{tr.cancel}</button>
                            <button className="btn btn-primary" onClick={handleCreateAnnounce} style={{ padding: '10px 24px', fontWeight: 700 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8 }}>send</span>
                                {lang === 'en' ? 'Post Announcement' : 'ప్రకటనను ప్రచురించండి'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            {showStaffModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: 20
                }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 520, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', background: 'var(--primary-600)', color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>person_add</span>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                                        {lang === 'en' ? 'Add Staff Member' : 'సిబ్బందిని జోడించండి'}
                                    </div>
                                    <div style={{ opacity: .8, fontSize: 13, marginTop: 2 }}>
                                        {lang === 'en' ? 'Create a new staff account with login credentials' : 'కొత్త సిబ్బంది ఖాతాను సృష్టించండి'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name <span className="required">*</span></label>
                                    <input
                                        className="form-control" placeholder="e.g. Ravi Kumar" required
                                        value={newStaff.name}
                                        onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email <span className="required">*</span></label>
                                    <input
                                        className="form-control" type="email" placeholder="e.g. ravi@panchayat.in" required
                                        value={newStaff.email}
                                        onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Password <span className="required">*</span></label>
                                    <input
                                        className="form-control" type="password" placeholder="Min 6 characters" required
                                        value={newStaff.password}
                                        onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        className="form-control" placeholder="e.g. 9876543210"
                                        value={newStaff.phone}
                                        onChange={e => setNewStaff(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        className="form-control"
                                        value={newStaff.department}
                                        onChange={e => setNewStaff(p => ({ ...p, department: e.target.value }))}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Sanitation">Sanitation</option>
                                        <option value="Electricity">Electricity</option>
                                        <option value="Water Supply">Water Supply</option>
                                        <option value="Infrastructure">Infrastructure</option>
                                        <option value="Health">Health</option>
                                        <option value="Revenue">Revenue</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input
                                        className="form-control" placeholder="e.g. Field Officer"
                                        value={newStaff.designation}
                                        onChange={e => setNewStaff(p => ({ ...p, designation: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary-600)' }}>info</span>
                                The staff member can log in with the email and password you set here.
                            </div>
                        </div>

                        <div style={{ padding: '20px 24px', background: 'var(--gray-50)', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--gray-200)' }}>
                            <button className="btn btn-outline" onClick={() => { setShowStaffModal(false); setNewStaff({ name: '', email: '', password: '', phone: '', department: '', designation: '' }); }}>
                                {tr.cancel}
                            </button>
                            <button className="btn btn-primary" onClick={handleCreateStaff} disabled={staffLoading} style={{ padding: '10px 24px', fontWeight: 700 }}>
                                {staffLoading ? (
                                    <>
                                        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                                        {lang === 'en' ? 'Add Staff' : 'సిబ్బందిని జోడించండి'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
