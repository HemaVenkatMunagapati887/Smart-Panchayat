import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { t } from '../data';
import { useApp } from '../context/AppContext';
import { createComplaint, runAIComplaintAnalyzer, processVoiceComplaint, runAIImageVerification } from '../services/api';
import MapPicker from '../components/MapPicker';

/* ── Reverse-geocode using free Nominatim API ── */
async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

export default function FileComplaint() {
    const { lang, user, setComplaints, toast } = useApp();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const tr = t[lang];

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        category: params.get('cat') || '',
        title: '',
        description: '',
        ward: '',
        address: '',
        phone: '',
        name: user.name || '',
        priority: 'medium',
        image: null,
        latitude: null,
        longitude: null,
    });
    const [submitted, setSubmitted] = useState(false);
    const [complaintId] = useState(`GS-2024-0${Math.floor(Math.random() * 90 + 10)}`);

    // Geolocation state
    const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | success | error
    const [geoCoords, setGeoCoords] = useState(null);   // { lat, lng }
    const [geoError, setGeoError] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [duplicates, setDuplicates] = useState([]);
    const [showDedupeModal, setShowDedupeModal] = useState(false);



    const categories = [
        { id: 'sanitation', label: tr.serviceNames.sanitation, icon: 'delete' },
        { id: 'streetlight', label: tr.serviceNames.streetlight, icon: 'lightbulb' },
        { id: 'water', label: tr.serviceNames.water, icon: 'water_drop' },
        { id: 'road', label: tr.serviceNames.road, icon: 'add_road' },
        { id: 'health', label: tr.serviceNames.health, icon: 'medical_services' },
        { id: 'other', label: tr.categories.other, icon: 'assignment' },
    ];

    const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'];

    const update = (field, val) => setForm((p) => ({ ...p, [field]: val }));

    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            setGeoStatus('error');
            return;
        }
        setGeoStatus('loading');
        setGeoError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setGeoCoords({ lat, lng });
                const addr = await reverseGeocode(lat, lng);
                update('address', addr);
                setGeoStatus('success');
            },
            (err) => {
                setGeoStatus('error');
                if (err.code === 1) setGeoError('Location permission denied.');
                else if (err.code === 2) setGeoError('Location unavailable.');
                else setGeoError('Location request timed out.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const handleAIAnalyze = async () => {
        if (!form.description && !form.title) {
            toast.error(lang === 'en' ? 'Please enter some text first!' : 'దయచేసి మొదట కొంత వచనాన్ని నమోదు చేయండి!');
            return;
        }
        setIsAnalyzing(true);
        const { data, ok } = await runAIComplaintAnalyzer(form.description || form.title, form.ward, user.token);
        if (ok && data) {
            setForm(prev => ({
                ...prev,
                category: data.category || prev.category,
                priority: data.priority || prev.priority,
                title: data.summary ? (prev.title || data.summary) : prev.title
            }));
            toast.success(lang === 'en' ? 'AI has analyzed and filled your form!' : 'AI మీ రూపాన్ని విశ్లేషించింది మరియు నింపింది!');
        } else {
            toast.error('AI Analysis failed. Please fill manually.');
        }
        setIsAnalyzing(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setIsAnalyzing(true);
                const { data, ok } = await processVoiceComplaint(blob, user.token);
                if (ok && data?.text) {
                    update('description', (form.description ? form.description + ' ' : '') + data.text);
                    toast.success(lang === 'en' ? 'Voice transcribed!' : 'వాయిస్ లిప్యంతరీకరించబడింది!');
                } else {
                    toast.error('Voice processing failed.');
                }
                setIsAnalyzing(false);
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorder.start();
            setRecorder(mediaRecorder);
            setIsRecording(true);
        } catch (err) {
            toast.error('Microphone access denied or not supported.');
        }
    };

    const stopRecording = () => {
        if (recorder) {
            recorder.stop();
            setIsRecording(false);
        }
    };

    const handleCheckDuplicates = async () => {
        if (!form.description || form.description.length < 10) return;
        
        try {
            const { data, ok } = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/duplicate-detection`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ 
                    text: form.description, 
                    ward: form.ward, 
                    category: form.category 
                })
            }).then(res => res.json()).then(d => ({ data: d, ok: true }));

            if (ok && data?.found && data.matches?.length > 0) {
                setDuplicates(data.matches);
                setShowDedupeModal(true);
            }
        } catch (err) {
            console.error('Duplicate check failed:', err);
        }
    };


    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('id', complaintId);
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        formData.append('ward', form.ward);
        formData.append('priority', form.priority);
        formData.append('citizenName', form.name);
        formData.append('phone', form.phone);
        formData.append('address', form.address);

        if (form.image) {
            formData.append('image', form.image);
        }
        if (form.latitude) formData.append('latitude', form.latitude);
        if (form.longitude) formData.append('longitude', form.longitude);

        const { data, ok, error } = await createComplaint(formData, user.token);
        if (ok && data) {
            setComplaints(prev => [data, ...prev]);
            setSubmitted(true);
            toast.success(lang === 'en' ? 'Complaint filed successfully!' : 'ఫిర్యాదు విజయవంతంగా నమోదైంది!');
        } else {
            const errMsg = data?.errors ? data.errors[0].message : data?.message || error || 'Failed to submit complaint. Please try again.';
            toast.error(errMsg);
            console.error('[FileComplaint] submit error:', data || error);
        }
    };

    if (submitted) {
        return (
            <div className="page fade-in" style={{ maxWidth: 560, margin: '0 auto' }}>
                <div className="card card-pad" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}><span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--primary-500)' }}>celebration</span></div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: 'var(--primary-700)' }}>
                        {tr.messages.filedSuccess}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                        {tr.messages.filedSub}
                    </p>
                    <div style={{
                        background: 'var(--primary-50)', borderRadius: 12, padding: 20, marginBottom: 32,
                        border: '1.5px solid var(--primary-200)',
                    }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {lang === 'en' ? 'Complaint ID' : 'ఫిర్యాదు ID'}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: 'var(--primary-700)', letterSpacing: 1, margin: '8px 0' }}>
                            {complaintId}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {tr.messages.saveId}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button className="btn btn-outline" onClick={() => navigate('/citizen/track')}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>search</span> {tr.trackComplaint}
                        </button>
                        <button className="btn btn-primary" onClick={() => { setSubmitted(false); setStep(1); setForm({ category: '', title: '', description: '', ward: '', address: '', phone: '', name: user.name || '', priority: 'medium', image: null }); }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>edit_note</span> {lang === 'en' ? 'File Another' : 'మరొకటి నమోదు'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="page-header">
                <h1><span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: 'middle', marginRight: 8 }}>edit_note</span>{tr.fileComplaint}</h1>
                <p>{lang === 'en' ? 'Submit your grievance and we will resolve it promptly.' : 'మీ ఫిర్యాదు సమర్పించండి, మేము త్వరగా పరిష్కరిస్తాము.'}</p>
            </div>

            {/* Stepper */}
            <div className="steps mb-32" style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                {[
                    { n: 1, label: tr.steps.category },
                    { n: 2, label: tr.steps.details },
                    { n: 3, label: tr.steps.contact },
                    { n: 4, label: tr.steps.review },
                ].map((s, i, arr) => (
                    <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 'none', gap: 12 }}>
                        <div className={`step ${step > s.n ? 'done' : step === s.n ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={`step-circle ${step > s.n ? 'done' : step === s.n ? 'active' : ''}`} style={{
                                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 14,
                                background: step >= s.n ? 'var(--primary-500)' : 'var(--gray-200)',
                                color: step >= s.n ? '#fff' : 'var(--text-muted)'
                            }}>
                                {step > s.n ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> : s.n}
                            </div>
                            <span className="step-label" style={{ fontWeight: step === s.n ? 700 : 500, fontSize: 13, color: step === s.n ? 'var(--primary-700)' : 'var(--text-muted)' }}>{s.label}</span>
                        </div>
                        {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: step > s.n ? 'var(--primary-400)' : 'var(--gray-200)' }} />}
                    </div>
                ))}
            </div>

            <div className="card card-pad">
                {/* Step 1: Category */}
                {step === 1 && (
                    <div>
                        <div className="card-title mb-20">{lang === 'en' ? 'Select Category' : 'వర్గం ఎంచుకోండి'}</div>
                        <div className="service-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="service-card"
                                    id={`cat-${cat.id}`}
                                    style={{
                                        border: form.category === cat.id ? '2.5px solid var(--primary-500)' : '1px solid var(--gray-200)',
                                        background: form.category === cat.id ? 'var(--primary-50)' : 'var(--bg-card)',
                                        transform: form.category === cat.id ? 'scale(1.02)' : 'none',
                                    }}
                                    onClick={() => update('category', cat.id)}
                                >
                                    <div className="service-icon" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)', width: 48, height: 48, fontSize: 24 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{cat.icon}</span>
                                    </div>
                                    <div className="service-name" style={{ fontSize: 14, fontWeight: 700 }}>{cat.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-primary btn-lg"
                                disabled={!form.category}
                                onClick={() => setStep(2)}
                                style={{ opacity: form.category ? 1 : .5 }}
                            >
                                {lang === 'en' ? 'Next' : 'తదుపరి'} <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle' }}>arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                    <div>
                        <div className="card-title mb-20">{tr.steps.details}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">{tr.formLabels.title} <span className="required">*</span></label>
                                <input
                                    className="form-control"
                                    placeholder={lang === 'en' ? 'Enter a clear title...' : 'స్పష్టమైన శీర్షికను నమోదు చేయండి...'}
                                    value={form.title}
                                    onChange={(e) => update('title', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{tr.formLabels.description} <span className="required">*</span></label>
                                <textarea
                                    className="form-control"
                                    placeholder={lang === 'en' ? 'Provide more details about the issue...' : 'సమస్య గురించి మరిన్ని వివరాలను అందించండి...'}
                                    value={form.description}
                                    onChange={(e) => update('description', e.target.value)}
                                    onBlur={handleCheckDuplicates}
                                    style={{ minHeight: 120 }}
                                />
                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                    <button
                                        type="button"
                                        className={`btn ${isRecording ? 'btn-danger' : 'btn-outline'}`}
                                        onClick={isRecording ? stopRecording : startRecording}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{isRecording ? 'stop_circle' : 'mic'}</span>
                                        {isRecording ? (lang === 'en' ? 'Stop Recording' : 'రికార్డింగ్ ఆపు') : (lang === 'en' ? 'Voice Complaint' : 'వాయిస్ ఫిర్యాదు')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={handleAIAnalyze}
                                        disabled={isAnalyzing}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, borderColor: 'var(--primary-400)', color: 'var(--primary-700)' }}
                                    >
                                        {isAnalyzing ? (
                                            <span className="material-symbols-outlined spinning" style={{ fontSize: 20 }}>sync</span>
                                        ) : (
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-500)' }}>magic_button</span>
                                        )}
                                        {isAnalyzing ? (lang === 'en' ? 'Analyzing...' : 'విశ్లేషిస్తోంది...') : (lang === 'en' ? 'AI Auto-Fill' : 'AI ఆటో-ఫిల్')}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{lang === 'en' ? 'Attach Image (Optional)' : 'చిత్రాన్ని జత చేయండి (ఐచ్ఛికం)'}</label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    className="form-control"
                                    onChange={(e) => update('image', e.target.files[0])}
                                    style={{ padding: '8px' }}
                                />
                                {form.image && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--primary-600)' }}><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>attach_file</span> {form.image.name}</div>}
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">{tr.formLabels.ward} <span className="required">*</span></label>
                                    <select
                                        className="form-control"
                                        value={form.ward}
                                        onChange={(e) => update('ward', e.target.value)}
                                    >
                                        <option value="">{tr.formLabels.selectWard}</option>
                                        {wards.map((w) => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{tr.formLabels.priority}</label>
                                    <select
                                        className="form-control"
                                        value={form.priority}
                                        onChange={(e) => update('priority', e.target.value)}
                                    >
                                        <option value="low">{tr.formLabels.priorityLow}</option>
                                        <option value="medium">{tr.formLabels.priorityMed}</option>
                                        <option value="high">{tr.formLabels.priorityHigh}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">{tr.formLabels.address}</label>
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={geoStatus === 'loading'}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 18px', borderRadius: 12,
                                        border: `2px solid ${geoStatus === 'success' ? 'var(--primary-400)' : 'var(--gray-300)'}`,
                                        background: geoStatus === 'success' ? 'var(--primary-50)' : 'var(--gray-50)',
                                        width: '100%', marginBottom: 12, fontWeight: 700, fontSize: 14,
                                        color: geoStatus === 'success' ? 'var(--primary-700)' : 'var(--text-secondary)'
                                    }}
                                >
                                    {geoStatus === 'loading' ? <span className="material-symbols-outlined" style={{ fontSize: 18 }}>hourglass_empty</span> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>my_location</span>} {geoStatus === 'loading' ? tr.messages.detectingLoc : geoStatus === 'success' ? tr.messages.locCaptured : tr.messages.useGps}
                                </button>
                                <input
                                    className="form-control"
                                    placeholder={lang === 'en' ? 'Street, landmark...' : 'వీధి, ల్యాండ్‌మార్క్...'}
                                    value={form.address}
                                    onChange={(e) => update('address', e.target.value)}
                                />
                                <div style={{ marginTop: 16 }}>
                                    <label className="form-label">{lang === 'en' ? 'Pinpoint on Map' : 'మ్యాప్‌లో గుర్తించండి'}</label>
                                    <MapPicker
                                        onLocationSelect={(pos) => {
                                            update('latitude', pos.lat);
                                            update('longitude', pos.lng);
                                        }}
                                        initialPosition={geoCoords}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline btn-lg" onClick={() => setStep(1)}>{lang === 'en' ? 'Back' : 'వెనుకకు'}</button>
                            <button
                                className="btn btn-primary btn-lg"
                                disabled={!form.title || !form.description || !form.ward}
                                onClick={() => setStep(3)}
                                style={{ opacity: (form.title && form.description && form.ward) ? 1 : .5 }}
                            >
                                {lang === 'en' ? 'Next' : 'తదుపరి'} <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle' }}>arrow_forward</span>
                            </button>
                        </div>

                        {/* Dedupe Detection Modal */}
                        {showDedupeModal && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                                padding: 20
                            }}>
                                <div className="card fade-in" style={{ maxWidth: 500, width: '100%', overflow: 'hidden' }}>
                                    <div style={{ padding: 24, background: 'var(--warning-500)', color: '#fff', textAlign: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 8 }}>info</span>
                                        <h3 style={{ margin: 0, fontWeight: 800 }}>Similar Reports Found!</h3>
                                    </div>
                                    <div style={{ padding: 24 }}>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                                            Others have already reported similar issues in your area. Would you like to upvote their report instead?
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                                            {duplicates.map((dup, i) => (
                                                <div key={i} style={{ padding: 12, borderRadius: 8, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', fontSize: 13 }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{dup.id} - {dup.title}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{dup.ward} • {dup.status}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDedupeModal(false)}>Continue with My Report</button>
                                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/citizen/track')}>View Existing Tickets</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                )}

                {/* Step 3: Contact */}
                {step === 3 && (
                    <div>
                        <div className="card-title mb-20">{tr.steps.contact}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="form-group">
                                <label className="form-label">{tr.formLabels.fullName} <span className="required">*</span></label>
                                <input
                                    className="form-control"
                                    value={form.name}
                                    onChange={(e) => update('name', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{tr.formLabels.mobile} <span className="required">*</span></label>
                                <input
                                    className="form-control"
                                    type="tel"
                                    placeholder="10 digit mobile"
                                    value={form.phone}
                                    onChange={(e) => update('phone', e.target.value)}
                                    maxLength={10}
                                />
                            </div>
                            <div style={{ background: 'var(--primary-50)', padding: 16, borderRadius: 12, border: '1px solid var(--primary-100)', fontSize: 13, color: 'var(--primary-800)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>info</span> {tr.messages.locMsg}
                            </div>
                        </div>
                        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline btn-lg" onClick={() => setStep(2)}>{lang === 'en' ? 'Back' : 'వెనుకకు'}</button>
                            <button
                                className="btn btn-primary btn-lg"
                                disabled={!form.name || !form.phone}
                                onClick={() => setStep(4)}
                                style={{ opacity: (form.name && form.phone) ? 1 : .5 }}
                            >
                                {tr.steps.review} <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle' }}>arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div>
                        <div className="card-title mb-20">{tr.messages.reviewSubmit}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                [tr.steps.category, categories.find(c => c.id === form.category)?.label],
                                [tr.formLabels.title, form.title],
                                [tr.formLabels.ward, form.ward],
                                [tr.formLabels.priority, form.priority === 'high' ? tr.formLabels.priorityHigh : form.priority === 'low' ? tr.formLabels.priorityLow : tr.formLabels.priorityMed],
                                [tr.formLabels.address, form.address || '—'],
                                [tr.formLabels.fullName, form.name],
                                [tr.formLabels.mobile, form.phone],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                    <div style={{ width: 140, fontSize: 13, color: 'var(--text-muted)', fontWeight: 700 }}>{k}</div>
                                    <div style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1, fontWeight: 500 }}>{v}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline btn-lg" onClick={() => setStep(3)}>{lang === 'en' ? 'Edit' : 'సవరించు'}</button>
                            <button className="btn btn-primary btn-lg" onClick={handleSubmit} style={{ padding: '14px 40px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>send</span> {tr.submit}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
