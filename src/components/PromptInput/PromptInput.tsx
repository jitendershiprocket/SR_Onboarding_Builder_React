import { useState } from 'react';
import { api } from '../../services/api';
import type { OnboardingSchema } from '../../types/schema.types';
import './PromptInput.css';

const SAMPLE_PROMPTS = [
  '4 step onboarding: first collect name, email, company name and pincode. Second ask business type with options - ecommerce, retail, wholesale, personal, other. Third ask monthly orders range. Fourth ask for social media links.',
  '3 step form: first step name and email, second step business category with image cards, third step how did you hear about us with radio options.',
  '5 step onboarding: user info, business type, monthly orders, sales channels (website, marketplace, social media), and social media links with set up later option.',
];

interface Props {
  onGenerated: (schema: OnboardingSchema) => void;
}

export default function PromptInput({ onGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.generateSchema(prompt);
      if (res.success && res.data) {
        onGenerated(res.data);
      } else {
        setError(res.message || 'Failed to generate schema');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate schema. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prompt-section">
      <div className="prompt-header">
        <span className="material-icons">auto_awesome</span>
        <h3>Generate with AI</h3>
      </div>
      <p className="prompt-desc">
        Describe your onboarding flow in natural language and AI will generate the form schema for you.
      </p>

      <div className="prompt-box">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a 4 step onboarding form - first collect name, email and pincode. Second ask business type with image cards. Third ask monthly orders with radio buttons. Fourth ask for social media links..."
          rows={4}
          disabled={loading}
        />
        <button className="generate-btn" onClick={generate} disabled={!prompt.trim() || loading}>
          {loading ? <span className="spinner" /> : <span className="material-icons">auto_awesome</span>}
          {loading ? 'Generating...' : 'Generate Schema'}
        </button>
      </div>

      {error && (
        <div className="error-msg">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}

      <div className="sample-prompts">
        <p className="sample-label">Try a sample prompt:</p>
        <div className="sample-chips">
          {SAMPLE_PROMPTS.map((s, i) => (
            <button key={i} className="sample-chip" onClick={() => setPrompt(s)}>
              <span className="material-icons">lightbulb</span>
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
