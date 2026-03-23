import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { t } from '../data';
import { useApp } from '../context/AppContext';
import '../auth.css';
import { resetPassword } from '../services/api';
import '../auth.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, googleLogin, toast, lang } = useApp();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetForm, setResetForm] = useState({ email: '', newPassword: '' });
    const [searchParams] = useSearchParams();
    const tr = t[lang];

    const getRedirectPath = (role) => {
        const redirect = searchParams.get('redirect');
        if (redirect) return redirect;
        return role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/citizen';
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { ok, data } = await resetPassword(resetForm.email, resetForm.newPassword);
        setLoading(false);
        if (ok) {
            toast.success(lang === 'en' ? 'Password reset successfully!' : 'పాస్‌వర్డ్ విజయవంతంగా రీసెట్ చేయబడింది!');
            setShowReset(false);
        } else {
            toast.error(data?.message || (lang === 'en' ? 'Reset failed.' : 'రీసెట్ విఫలమైంది.'));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.warning(lang === 'en' ? 'Please fill in all fields.' : 'దయచేసి అన్ని ఫీల్డ్‌లను నింపండి.');
            return;
        }
        setLoading(true);
        const result = await login(form.email, form.password);
        setLoading(false);

        if (result.ok) {
            toast.success(lang === 'en' ? 'Login successful! Welcome back.' : 'లాగిన్ విజయవంతమైంది! స్వాగతం.');
            navigate(getRedirectPath(result.role));
        } else {
            toast.error(result.message || (lang === 'en' ? 'Invalid credentials.' : 'చెల్లుబాటు కాని వివరాలు.'));
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        const result = await googleLogin(credentialResponse.credential);
        setLoading(false);

        if (result.ok) {
            toast.success(lang === 'en' ? 'Login successful! Welcome back.' : 'లాగిన్ విజయవంతమైంది! స్వాగతం.');
            navigate(getRedirectPath(result.role));
        } else {
            toast.error(result.message || (lang === 'en' ? 'Google login failed.' : 'Google లాగిన్ విఫలమైంది.'));
        }
    };

    const handleGoogleError = () => {
        toast.error(lang === 'en' ? 'Google login failed. Please try again.' : 'Google లాగిన్ విఫలమైంది. మళ్లీ ప్రయత్నించండి.');
    };

    return (
        <div className="auth-container fade-in">
            {/* Left Side: Visual/Branding */}
            <div className="auth-visual">
                <div className="auth-visual-overlay"></div>
                <img src="/auth-bg.png" alt="Panchayat Evolution" className="auth-visual-img" />
                <div className="auth-visual-content">
                    <div className="auth-badge">
                        <span className="material-symbols-outlined">verified</span>
                        {lang === 'en' ? 'Official Government Portal' : 'అధికారిక ప్రభుత్వ పోర్టల్'}
                    </div>
                    <h2 className="auth-visual-title">{tr.appName}</h2>
                    <p className="auth-visual-desc">
                        {lang === 'en' 
                            ? 'Empowering citizens through digital governance and transparent administration.' 
                            : 'డిజిటల్ పరిపాలన మరియు పారదర్శక యంత్రాంగం ద్వారా పౌరుల సాధికారత.'}
                    </p>
                    <div className="auth-stats">
                        <div className="auth-stat-item">
                            <span className="stat-val">50k+</span>
                            <span className="stat-label">{lang === 'en' ? 'Citizens' : 'పౌరులు'}</span>
                        </div>
                        <div className="auth-stat-item">
                            <span className="stat-val">98%</span>
                            <span className="stat-label">{lang === 'en' ? 'Resolution' : 'పరిష్కారం'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="auth-form-side">
                <div className="auth-form-wrapper">
                    <div className="auth-header">
                        <img src="/logo192.png" alt="Logo" className="auth-mobile-logo" style={{ display: 'none' }} />
                        <h2 className="auth-title">{lang === 'en' ? 'Welcome Back' : 'తిరిగి స్వాగతం'}</h2>
                        <p className="auth-subtitle">{lang === 'en' ? 'Please enter your details to sign in' : 'సైన్ ఇన్ చేయడానికి మీ వివరాలను నమోదు చేయండి'}</p>
                    </div>

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group mb-20">
                            <label className="form-label-premium">{lang === 'en' ? 'Email Address' : 'ఈమెయిల్ చిరునామా'}</label>
                            <div className="input-affix-wrapper">
                                <span className="material-symbols-outlined input-prefix">mail</span>
                                <input
                                    type="email" required className="form-control-premium"
                                    placeholder="name@example.com"
                                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group mb-12">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label-premium">{lang === 'en' ? 'Password' : 'పాస్‌వర్డ్'}</label>
                                <button
                                    type="button"
                                    onClick={() => setShowReset(true)}
                                    className="auth-link-sm"
                                >
                                    {lang === 'en' ? 'Forgot password?' : 'పాస్‌వర్డ్ మర్చిపోయారా?'}
                                </button>
                            </div>
                            <div className="input-affix-wrapper">
                                <span className="material-symbols-outlined input-prefix">lock</span>
                                <input
                                    type={showPassword ? 'text' : 'password'} required className="form-control-premium"
                                    placeholder="••••••••"
                                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="input-suffix-btn"
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="auth-security-tip mb-24">
                            <span className="material-symbols-outlined">info</span>
                            {lang === 'en'
                                ? 'Logging in as an Admin or Staff? Your dashboard will route automatically.'
                                : 'అడ్మిన్ లేదా స్టాఫ్‌గా లాగిన్ అవుతున్నారా? మీ డాష్‌బోర్డ్ ఆటోమేటిక్‌గా వస్తుంది.'}
                        </div>

                        <button
                            type="submit" className="btn btn-primary btn-block btn-lg btn-premium"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinning material-symbols-outlined">sync</span>
                            ) : (
                                <>{lang === 'en' ? 'Sign In' : 'సైన్ ఇన్'} <span className="material-symbols-outlined" style={{ marginLeft: 8, fontSize: 18 }}>login</span></>
                            )}
                        </button>

                        <div className="auth-divider">
                            <span>{lang === 'en' ? 'or continue with' : 'లేదా దీనితో కొనసాగండి'}</span>
                        </div>

                        <div className="google-btn-wrapper">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="filled_blue"
                                shape="pill"
                                width="100%"
                                size="large"
                            />
                        </div>

                        <div className="auth-footer">
                            {lang === 'en' ? "New to Smart Panchayat?" : 'స్మార్ట్ పంచాయితీకి కొత్తదా?'}{' '}
                            <Link to={searchParams.get('redirect') ? `/signup?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : '/signup'} className="auth-link-bold">
                                {lang === 'en' ? 'Create an account' : 'ఖాతా సృష్టించండి'}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Reset Modal */}
            {showReset && (
                <div className="modal-overlay" onClick={() => setShowReset(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <div className="modal-title"><span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 4 }}>lock_open</span> {lang === 'en' ? 'Reset Password' : 'పాస్‌వర్డ్ రీసెట్'}</div>
                            <button className="modal-close" onClick={() => setShowReset(false)}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span></button>
                        </div>
                        <form onSubmit={handleReset} style={{ padding: '0 4px' }}>
                            <div className="form-group mb-16">
                                <label className="form-label">{lang === 'en' ? 'Confirm Email' : 'ఈమెయిల్ ధృవీకరించండి'}</label>
                                <input
                                    type="email" required className="form-control"
                                    placeholder="your-email@example.com"
                                    value={resetForm.email} onChange={e => setResetForm({ ...resetForm, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group mb-24">
                                <label className="form-label">{lang === 'en' ? 'New Password' : 'కొత్త పాస్‌వర్డ్'}</label>
                                <input
                                    type="password" required className="form-control"
                                    placeholder="••••••••"
                                    value={resetForm.newPassword} onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? 'Resetting...' : (lang === 'en' ? 'Update Password' : 'పాస్‌వర్డ్ మార్చు')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
