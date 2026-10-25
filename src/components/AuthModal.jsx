import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Mail, Lock, User, CheckCircle2, ArrowRight, RefreshCw, KeyRound, LogOut } from 'lucide-react';

export default function AuthModal({ currentUser, onLogin, onLogout, onClose }) {
  const [mode, setMode] = useState(currentUser ? 'profile' : 'register'); // 'register' | 'login' | 'verify2FA' | 'profile'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const otpRefs = useRef([]);

  // Timer for 2FA code resend
  useEffect(() => {
    let timer;
    if (mode === 'verify2FA' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  const handleStartRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Generate random 6-digit 2FA code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setOtp(['', '', '', '', '', '']);
    setCountdown(60);
    setMode('verify2FA');
    setInfoMsg(`Security code generated and dispatched! Check your simulated inbox below.`);
  };

  const handleStartLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    // Require 2-step verification on login
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setOtp(['', '', '', '', '', '']);
    setCountdown(60);
    setMode('verify2FA');
    setInfoMsg(`2-Step Verification required. Security code dispatched below.`);
  };

  const handleOtpChange = (index, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    // Auto-advance to next box
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const updated = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        updated[i] = pasted[i];
      }
      setOtp(updated);
      otpRefs.current[Math.min(5, pasted.length - 1)]?.focus();
    }
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const entered = otp.join('');

    if (entered.length < 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    if (entered !== generatedCode) {
      setErrorMsg('Invalid verification code! Please check the code provided.');
      return;
    }

    // Verified successfully!
    const userData = {
      name: name.trim() || (currentUser?.name || email.split('@')[0]),
      email: email.trim() || (currentUser?.email || 'user@myfriend.ai'),
      isVerified: true,
      twoFactorEnabled: true,
      verifiedAt: new Date().toLocaleDateString(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`
    };

    onLogin(userData);
    onClose();
  };

  const handleResendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setCountdown(60);
    setInfoMsg(`New security code generated!`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="modal-title">
                {mode === 'profile' ? 'Account Profile' : mode === 'verify2FA' ? '2-Step Verification' : mode === 'register' ? 'Create Account' : 'Sign In'}
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {mode === 'verify2FA' ? 'Enhanced Email Security Check' : 'Save your personal AI models & training notes'}
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: 14 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* MODE 1: Profile (Logged In) */}
        {mode === 'profile' && currentUser && (
          <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'rgba(30, 41, 59, 0.5)', borderRadius: 14, border: '1px solid var(--border-glass)' }}>
              <img src={currentUser.avatar} alt="avatar" style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid var(--accent-emerald)' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, color: '#34d399', fontSize: '0.72rem', fontWeight: 700 }}>
                  <ShieldCheck size={14} /> 2-Step Verification Active
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Your account is secured with 2-Factor Authentication. All custom-trained personas, dialogue pairs, and teacher notes are automatically backed up to your profile.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button className="btn-secondary" onClick={onClose}>Close</button>
              <button 
                className="btn-secondary" 
                onClick={() => { onLogout(); onClose(); }}
                style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Register */}
        {mode === 'register' && (
          <form onSubmit={handleStartRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} color="var(--accent-cyan)" /> Your Full Name:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Liza Rawat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color="var(--accent-cyan)" /> Email Address:
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color="var(--accent-cyan)" /> Password:
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound size={14} color="var(--accent-cyan)" /> Confirm Password:
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-type password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              🔒 Next step: We will send a secure 6-digit 2FA code to verify your email.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={() => setMode('login')}
              >
                Already have an account? Sign In
              </button>

              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#000', fontWeight: 800 }}>
                Next: 2-Step Verification <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: Login */}
        {mode === 'login' && (
          <form onSubmit={handleStartLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} color="var(--accent-cyan)" /> Email Address:
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color="var(--accent-cyan)" /> Password:
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.8rem', cursor: 'pointer' }}
                onClick={() => setMode('register')}
              >
                Need an account? Register
              </button>

              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#000', fontWeight: 800 }}>
                Sign In with 2FA <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* MODE 4: 2-Step Verification (OTP Screen) */}
        {mode === 'verify2FA' && (
          <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Simulated Secure Email Delivery Banner */}
            <div style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#d1fae5',
              fontSize: '0.82rem'
            }}>
              <div style={{ fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Mail size={16} /> 2FA Code Sent to {email || 'your email'}
              </div>
              <div>
                Simulated email dispatched! Your 6-digit security code is:
                <div style={{
                  display: 'inline-block',
                  marginLeft: 8,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 800,
                  letterSpacing: 2
                }}>
                  {generatedCode}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 10 }}>
                Enter the 6-digit verification code:
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="otp-inputs-row" onPaste={handlePasteOtp}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    maxLength={1}
                    className="otp-digit-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>
                {countdown > 0 ? `Resend code in ${countdown}s` : (
                  <button 
                    type="button" 
                    onClick={handleResendCode}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <RefreshCw size={12} /> Resend Code
                  </button>
                )}
              </span>

              <button 
                type="button"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                onClick={() => setMode('register')}
              >
                Change Details
              </button>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', marginTop: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#000', fontWeight: 800 }}
            >
              <CheckCircle2 size={18} /> Verify 2FA & Complete Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
