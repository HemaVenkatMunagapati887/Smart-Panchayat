import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { t } from '../data';
import { useApp } from '../context/AppContext';
import '../auth.css';

export default function SignUpPage() {
    const navigate = useNavigate();
    const { lang, googleLogin, toast } = useApp();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', role: 'citizen' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const tr = t[lang];

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            alert(lang === 'en' ? 'Passwords do not match!' : 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు!');
            return;
        }
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/users/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role: form.role // User selected role
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(lang === 'en' ? 'Registration Successful! Please login.' : 'నమోదు విజయవంతమైంది! దయచేసి లాగిన్ చేయండి.');
                const redirect = searchParams.get('redirect');
                navigate(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
            } else {
                alert(data.message || (lang === 'en' ? 'Registration failed.' : 'నమోదు విఫలమైంది.'));
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert(lang === 'en' ? 'Server error. Please try again.' : 'సర్వర్ లోపం. మళ్లీ ప్రయత్నించండి.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        const result = await googleLogin(credentialResponse.credential);
        setLoading(false);

        if (result.ok) {
            toast.success(lang === 'en' ? 'Account created successfully! Welcome.' : 'ఖాతా విజయవంతంగా సృష్టించబడింది! స్వాగతం.');
            const redirect = searchParams.get('redirect');
            if (redirect) {
                navigate(redirect);
            } else {
                navigate(result.role === 'admin' ? '/admin' : result.role === 'staff' ? '/staff' : '/citizen');
            }
        } else {
            toast.error(result.message || (lang === 'en' ? 'Google sign up failed.' : 'Google సైన్ అప్ విఫలమైంది.'));
        }
    };

    const handleGoogleError = () => {
        toast.error(lang === 'en' ? 'Google sign up failed. Please try again.' : 'Google సైన్ అప్ విఫలమైంది. మళ్లీ ప్రయత్నించండి.');
    };

    return (
        <div className="auth-container fade-in">
            {/* Left Side: Visual/Branding */}
            <div className="auth-visual">
                <div className="auth-visual-overlay"></div>
                <img src="/auth-bg.png" alt="GramSeva" className="auth-visual-img" />
                <div className="auth-visual-content">
                    <div className="auth-badge">
                        <span className="material-symbols-outlined">diversity_3</span>
                        {lang === 'en' ? 'Digital Village Initiative' : 'డిజిటల్ విలేజ్ ఇనిషియేటివ్'}
                    </div>
                    <h2 className="auth-visual-title">{lang === 'en' ? 'Join the Digital Revolution' : 'డిజిటల్ విప్లవంలో చేరండి'}</h2>
                    <p className="auth-visual-desc">
                        {lang === 'en' 
                            ? 'Register today to access smart services, track grievances, and pay taxes from the comfort of your home.' 
                            : 'స్మార్ట్ సేవలను పొందడానికి, ఫిర్యాదులను ట్రాక్ చేయడానికి మరియు మీ ఇంటి నుండి పన్నులు చెల్లించడానికి నేడే నమోదు చేసుకోండి.'}
                    </p>
                    <ul className="auth-feature-list">
                        <li><span className="material-symbols-outlined">check_circle</span> {lang === 'en' ? 'Instant Complaint Reporting' : 'తక్షణ ఫిర్యాదు నివేదన'}</li>
                        <li><span className="material-symbols-outlined">check_circle</span> {lang === 'en' ? 'Digital Certificate Applications' : 'డిజిటల్ సర్టిఫికేట్ దరఖాస్తులు'}</li>
                        <li><span className="material-symbols-outlined">check_circle</span> {lang === 'en' ? 'Real-time Status Updates' : 'రియల్ టైమ్ స్టేటస్ అప్‌డేట్‌లు'}</li>
                    </ul>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="auth-form-side">
                <div className="auth-form-wrapper" style={{ maxWidth: 520 }}>
                    <div className="auth-header">
                        <h2 className="auth-title">{lang === 'en' ? 'Create Account' : 'ఖాతా సృష్టించండి'}</h2>
                        <p className="auth-subtitle">{lang === 'en' ? 'Enter your information to get started' : 'మొదలు పెట్టడానికి మీ సమాచారాన్ని నమోదు చేయండి'}</p>
                    </div>

                    <form onSubmit={handleSignUp} className="auth-form">
                        <div className="form-group mb-16">
                            <label className="form-label-premium">{lang === 'en' ? 'Full Name' : 'పూర్తి పేరు'}</label>
                            <div className="input-affix-wrapper">
                                <span className="material-symbols-outlined input-prefix">person</span>
                                <input
                                    type="text" required className="form-control-premium"
                                    placeholder="John Doe"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-grid mb-16">
                            <div className="form-group">
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
                            <div className="form-group">
                                <label className="form-label-premium">{lang === 'en' ? 'Phone Number' : 'ఫోన్ నంబర్'}</label>
                                <div className="input-affix-wrapper">
                                    <span className="material-symbols-outlined input-prefix">call</span>
                                    <input
                                        type="tel" required className="form-control-premium"
                                        placeholder="9876543210"
                                        maxLength={10}
                                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-grid mb-24">
                            <div className="form-group">
                                <label className="form-label-premium">{lang === 'en' ? 'Password' : 'పాస్‌వర్డ్'}</label>
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
                                        <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label-premium">{lang === 'en' ? 'Confirm' : 'ధృవీకరించండి'}</label>
                                <div className="input-affix-wrapper">
                                    <span className="material-symbols-outlined input-prefix">verified_user</span>
                                    <input
                                        type={showConfirm ? 'text' : 'password'} required className="form-control-premium"
                                        placeholder="••••••••"
                                        value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="input-suffix-btn"
                                    >
                                        <span className="material-symbols-outlined">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit" className="btn btn-primary btn-block btn-lg btn-premium"
                            disabled={loading || (form.password !== form.confirm && form.confirm !== '')}
                        >
                            {loading ? (
                                <span className="spinning material-symbols-outlined">sync</span>
                            ) : (
                                <>{lang === 'en' ? 'Create Account' : 'ఖాతా సృష్టించండి'} <span className="material-symbols-outlined" style={{ marginLeft: 8, fontSize: 18 }}>person_add</span></>
                            )}
                        </button>

                        <div className="auth-divider">
                            <span>{lang === 'en' ? 'or sign up with' : 'లేదా దీనితో సైన్ అప్ చేయండి'}</span>
                        </div>

                        <div className="google-btn-wrapper">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="filled_blue"
                                text="signup_with"
                                shape="pill"
                                width="100%"
                                size="large"
                            />
                        </div>

                        <div className="auth-footer">
                            {lang === 'en' ? "Already have an account?" : 'ఇప్పటికే ఖాతా ఉందా?'}{' '}
                            <Link to="/login" className="auth-link-bold">
                                {lang === 'en' ? 'Sign In Here' : 'ఇక్కడ సైన్ ఇన్ చేయండి'}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
