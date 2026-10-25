import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, Check, ChevronDown, ChevronUp, Brain, ArrowRight } from 'lucide-react';

export default function TeacherCoachPanel({
  persona,
  lastUserMessage,
  lastBotMessage,
  onTeachPersona,
  isOpen,
  onToggle
}) {
  const [trigger, setTrigger] = useState('');
  const [idealResponse, setIdealResponse] = useState('');
  const [behaviorRule, setBehaviorRule] = useState('');
  const [replaceLast, setReplaceLast] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Prefill trigger with latest user message whenever it updates
  useEffect(() => {
    if (lastUserMessage) {
      setTrigger(lastUserMessage);
    }
  }, [lastUserMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trigger.trim() || !idealResponse.trim()) {
      alert("Please fill in both 'When I say' and 'You should say' fields!");
      return;
    }

    onTeachPersona({
      trigger: trigger.trim(),
      idealResponse: idealResponse.trim(),
      behaviorRule: behaviorRule.trim(),
      replaceLast
    });

    setSuccessMessage(`✨ Learned! ${persona?.name || 'Persona'} will now respond with this style.`);
    setIdealResponse('');
    setBehaviorRule('');

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const learnedCount = (persona?.chatPairs?.length || 0) + (persona?.learnedRules?.length || 0);

  return (
    <div className="teacher-dock">
      {/* Header bar / Quick Toggle */}
      <div className="teacher-dock-header" onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000'
          }}>
            <GraduationCap size={15} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f3f4f6' }}>
              🧑‍🏫 Teach {persona?.name || 'Persona'} (Real-Time Live Learning)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>
              {isOpen ? 'Explain what to say and how to behave' : 'Click to correct last reply & fine-tune behavior'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(0, 242, 254, 0.12)',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            fontWeight: 600
          }}>
            {learnedCount} Learned Patterns
          </span>
          <button className="icon-btn" style={{ width: 26, height: 26, border: 'none' }} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Teacher / Trainer Body */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="teacher-dock-body">
          {successMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600
            }}>
              <Check size={16} /> {successMessage}
            </div>
          )}

          <div className="teacher-grid">
            {/* Field 1: Trigger / When I say */}
            <div>
              <label className="teacher-field-label">
                <span>1. When I say:</span>
              </label>
              <input
                type="text"
                className="teacher-input"
                placeholder="e.g. kaha chale? / ghoomne chale?"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              />
            </div>

            {/* Field 2: Ideal Response */}
            <div>
              <label className="teacher-field-label">
                <span>2. No, you are supposed to say this:</span>
              </label>
              <input
                type="text"
                className="teacher-input"
                placeholder={`e.g. bhai CP chalte hai mast momos khane 😋 tu bata?`}
                value={idealResponse}
                onChange={(e) => setIdealResponse(e.target.value)}
              />
            </div>
          </div>

          {/* Field 3: Behavioral Rule & Guidance */}
          <div>
            <label className="teacher-field-label">
              <Brain size={14} />
              <span>3. How {persona?.name || 'the virtual person'} should behave (Personality rule):</span>
            </label>
            <input
              type="text"
              className="teacher-input"
              placeholder={`e.g. Always be excited to hangout, suggest food or cafes in Delhi, and speak in chill Hinglish.`}
              value={behaviorRule}
              onChange={(e) => setBehaviorRule(e.target.value)}
            />
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={replaceLast}
                onChange={(e) => setReplaceLast(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Replace {persona?.name || 'bot'}'s last reply in chat with this correction right now</span>
            </label>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                onClick={onToggle}
              >
                Close
              </button>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#000',
                  fontWeight: 800
                }}
              >
                <Sparkles size={14} />
                Teach & Update Brain 🚀
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
