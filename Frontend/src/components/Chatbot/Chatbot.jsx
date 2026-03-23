import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../../context/AppContext';
import { sendChatbotMessage } from '../../services/api';

/**
 * Chatbot Component
 * Includes floating icon, chat window, and message handling.
 */
export default function Chatbot() {
    const { lang } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        // Persistence: Load from localStorage on init
        const saved = localStorage.getItem('gramseva_chat_history');
        if (saved) return JSON.parse(saved);
        return [
            {
                role: 'assistant',
                content: lang === 'en'
                    ? "Hello! I am your Smart Panchayat assistant. How can I help you today?"
                    : "నమస్కారం! నేను మీ స్మార్ట్ పంచాయతీ అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?"
            }
        ];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    // Save to localStorage whenever messages change (Clean images to avoid storage limits)
    useEffect(() => {
        const cleanHistory = messages.map(m => {
            const clean = { ...m };
            if (clean.image) clean.image = "[IMAGE]"; // Don't store massive base64 in localstorage
            return clean;
        });
        localStorage.setItem('gramseva_chat_history', JSON.stringify(cleanHistory));
    }, [messages]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const msg = input.trim();
        if ((!msg && !selectedFile) || loading) return;

        // Add user message with image preview if present
        const newUserMsg = {
            role: 'user',
            content: msg || (lang === 'en' ? "Analyzed image" : "చిత్రాన్ని విశ్లేషించండి"),
            image: imagePreview
        };

        const newMessages = [...messages, newUserMsg];
        setMessages(newMessages);
        setInput('');
        setSelectedFile(null);
        setImagePreview(null);
        setLoading(true);

        // Prepare history for API (last 5 messages)
        const history = newMessages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
        }));

        const { data, ok } = await sendChatbotMessage(msg || "Please analyze this image.", history, selectedFile);

        if (ok && data && data.success) {
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } else {
            const errorMsg = data?.message || (lang === 'en' ? "Connection Error" : "కనెక్షన్ లోపం");
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: lang === 'en'
                    ? `I'm stuck! ${errorMsg}`
                    : `నన్ను క్షమించండి! ${errorMsg}`
            }]);
        }
        setLoading(false);
    };

    const resetChat = () => {
        if (confirm(lang === 'en' ? 'Clear chat history?' : 'చాట్ చరిత్రను క్లియర్ చేయాలా?')) {
            const initial = [{
                role: 'assistant',
                content: lang === 'en'
                    ? "Hello! I am your Smart Panchayat assistant. How can I help you today?"
                    : "నమస్కారం! నేను మీ స్మార్ట్ పంచాయతీ అసిస్టెంట్‌ని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?"
            }];
            setMessages(initial);
            localStorage.removeItem('gramseva_chat_history');
        }
    };

    const quickActions = [
        { label: lang === 'en' ? "Pension Scheme" : "పింఛన్ పథకం", query: "Tell me about pension schemes." },
        { label: lang === 'en' ? "Certificates" : "సర్టిఫికెట్లు", query: "How to apply for Income/Caste certificates?" },
    ];

    return (
        <div className="chatbot-wrapper">
            {/* Floating Icon */}
            <button
                className={`chatbot-icon ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Chatbot"
            >
                {isOpen ? (
                    <span className="material-symbols-outlined">close</span>
                ) : (
                    <div className="chatbot-icon-inner">
                        <span className="material-symbols-outlined">robot_2</span>
                        <div className="pulse-ring"></div>
                    </div>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window fade-in-up">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="chatbot-avatar"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>smart_toy</span></div>
                            <div style={{ lineHeight: 1.2 }}>
                                <div className="chatbot-name" style={{ fontSize: 13, fontWeight: 800 }}>GramSeva AI</div>
                                <div className="chatbot-status" style={{ fontSize: 10, opacity: 0.9 }}>
                                    <span className="status-dot green" style={{ width: 6, height: 6 }}></span>
                                    {lang === 'en' ? 'Online Help' : 'ఆన్‌లైన్ సపోర్ట్'}
                                </div>
                            </div>
                        </div>
                        <button className="chatbot-reset-btn" onClick={resetChat} title={lang === 'en' ? 'Reset Chat' : 'చాట్ రీసెట్ చేయండి'}>
                            <span className="material-symbols-outlined" style={{ fontSize: 19 }}>refresh</span>
                        </button>
                    </div>

                    <div className="chatbot-messages" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-message ${m.role}`}>
                                <div className="chat-bubble">
                                    {m.image && <img src={m.image} alt="uploaded" style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />}
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-message assistant">
                                <div className="chat-bubble typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chatbot-footer">
                        {imagePreview && (
                            <div style={{ position: 'relative', padding: '0 10px 10px' }}>
                                <img src={imagePreview} alt="preview" style={{ height: 60, borderRadius: 6, border: '1px solid var(--gray-200)' }} />
                                <button
                                    onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                                    style={{ position: 'absolute', top: -5, left: 65, background: 'var(--red-500)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                                </button>
                            </div>
                        )}

                        <div className="chatbot-quick-actions">
                            {quickActions.map((qa, i) => (
                                <button
                                    key={i}
                                    className="btn-quick"
                                    onClick={() => { setInput(qa.query); }}
                                >
                                    {qa.label}
                                </button>
                            ))}
                        </div>

                        <form className="chatbot-input-area" onSubmit={handleSend}>
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <button
                                type="button"
                                className="chatbot-icon-btn"
                                onClick={() => fileInputRef.current.click()}
                                style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer' }}
                            >
                                <span className="material-symbols-outlined">attach_file</span>
                            </button>
                            <input
                                type="text"
                                placeholder={lang === 'en' ? "Type message..." : "సందేశాన్ని టైప్ చేయండి..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="chatbot-send-btn" disabled={(!input.trim() && !selectedFile) || loading}>
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
