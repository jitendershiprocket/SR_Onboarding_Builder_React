import { useState } from 'react';
import { api } from '../../services/api';
import type { OnboardingSchema } from '../../types/schema.types';
import './AIEditBar.css';

interface Props {
  schema: OnboardingSchema;
  onUpdated: (schema: OnboardingSchema) => void;
}

const SUGGESTIONS = [
  'Add a phone number field to step 1',
  'Change button color to #2563eb',
  'Add a new step for shipping preferences',
  'Make cards 3 columns',
  'Add skip option to all steps',
  'Change font to Poppins',
  'Remove the last step',
  'Add social media step with Instagram and Facebook',
];

export default function AIEditBar({ schema, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.editSchemaWithAI(schema, prompt.trim());
      if (res.success && res.data) {
        onUpdated(res.data);
        setPrompt('');
        setOpen(false);
      } else {
        setError(res.message || 'Failed to edit schema');
      }
    } catch (err: any) {
      setError(err.message || 'AI edit failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button className="ai-edit-toggle" onClick={() => setOpen(true)}>
        <span className="material-icons">auto_awesome</span>
        Edit with AI
      </button>
    );
  }

  return (
    <div className="ai-edit-bar">
      <div className="ai-edit-header">
        <span className="material-icons ai-icon">auto_awesome</span>
        <span className="ai-title">AI Edit</span>
        <button className="ai-close" onClick={() => { setOpen(false); setError(''); }}>
          <span className="material-icons">close</span>
        </button>
      </div>

      <div className="ai-edit-input-row">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Tell AI what to change... e.g. 'Add a step for courier preferences'"
          disabled={loading}
        />
        <button className="ai-send" onClick={submit} disabled={!prompt.trim() || loading}>
          {loading ? <span className="spinner" /> : <span className="material-icons">send</span>}
        </button>
      </div>

      {error && (
        <div className="ai-error">
          <span className="material-icons">error</span> {error}
        </div>
      )}

      <div className="ai-suggestions">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} className="suggestion-chip" onClick={() => setPrompt(s)} disabled={loading}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
