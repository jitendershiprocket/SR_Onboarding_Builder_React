import { useState } from 'react';
import type { OnboardingSchema } from '../../types/schema.types';
import './LivePreview.css';

interface Props {
  schema: OnboardingSchema;
}

export default function LivePreview({ schema }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});

  const step = schema.steps[stepIdx];
  if (!step) return null;

  const next = () => stepIdx < schema.totalSteps - 1 && setStepIdx(stepIdx + 1);
  const prev = () => stepIdx > 0 && setStepIdx(stepIdx - 1);
  const reset = () => { setStepIdx(0); setValues({}); };

  const select = (key: string, val: string, auto?: boolean) => {
    setValues({ ...values, [key]: val });
    if (auto) setTimeout(next, 400);
  };

  const toggle = (key: string, val: string) => {
    const arr = [...(values[key] || [])];
    const idx = arr.indexOf(val);
    idx > -1 ? arr.splice(idx, 1) : arr.push(val);
    setValues({ ...values, [key]: arr });
  };

  return (
    <div className="preview-container">
      <div className="preview-header">
        <span className="material-icons">phone_iphone</span>
        <h4>Live Preview</h4>
        <button className="reset-btn" onClick={reset}><span className="material-icons">refresh</span></button>
      </div>

      <div className="phone-frame">
        <div className="phone-screen">
          <div className="top-bar">
            {stepIdx > 0 && <span className="material-icons back-icon" onClick={prev}>arrow_back</span>}
            <span className="heading-badge">{schema.settings.heading}</span>
          </div>

          {schema.settings.showProgressBar && (
            <div className="progress-section">
              <p className="step-text">Step {stepIdx + 1} of {schema.totalSteps}</p>
              <div className="progress-bars">
                {Array.from({ length: schema.totalSteps }).map((_, i) => (
                  <div key={i} className="bar">
                    <div className="bar-fill" style={{ width: stepIdx > i ? '100%' : stepIdx === i ? '10%' : '0%' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="step-content">
            {step.badge && <span className="badge">{step.badge}</span>}
            <h3>{step.title}</h3>
            {step.subtitle && <p className="subtitle">{step.subtitle}</p>}

            {step.fields.map((field) => (
              <div key={field.key}>
                {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                  <div className="form-group">
                    <label>{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder || ''} onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
                  </div>
                )}

                {field.type === 'radio-group' && (
                  <div className="radio-group">
                    {field.options.map((opt) => (
                      <div key={opt.value} className={`radio-option ${values[field.key] === opt.value ? 'selected' : ''}`} onClick={() => select(field.key, opt.value, field.autoAdvance)}>
                        <span className={`radio-dot ${values[field.key] === opt.value ? 'active' : ''}`} />
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}

                {field.type === 'image-card' && (
                  <div className="card-grid">
                    {field.options.map((opt) => (
                      <div key={opt.value} className={`image-card ${values[field.key] === opt.value ? 'selected' : ''}`} onClick={() => select(field.key, opt.value, field.autoAdvance)}>
                        {opt.icon && <div className="card-icon"><img src={opt.icon} alt={opt.label} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
                        <span>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox-group' && (
                  <div className="checkbox-grid">
                    {field.options.map((opt) => (
                      <div key={opt.id} className={`checkbox-card ${(values[field.key] || []).includes(opt.value) ? 'selected' : ''}`} onClick={() => toggle(field.key, opt.value)}>
                        {(values[field.key] || []).includes(opt.value) && <span className="check-icon">&#10003;</span>}
                        <span>{opt.label}</span>
                        {opt.description && <small>{opt.description}</small>}
                      </div>
                    ))}
                  </div>
                )}

                {field.type === 'social-input' && (
                  <div className="social-list">
                    {field.platforms.map((p) => (
                      <div key={p.key} className="social-item">
                        <div className="social-header">{p.name}</div>
                        <p className="help-text">{p.helpText}</p>
                        <input type="text" placeholder={p.placeholder || 'Enter URL'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {step.submitLabel && <button className="submit-btn" onClick={next}>{step.submitLabel}</button>}
            {step.skipOption && <p className="skip-link" onClick={next}>{step.skipOption.label}</p>}
          </div>

          {schema.settings.bottomBarText && (
            <div className="bottom-bar">{schema.settings.bottomBarText}</div>
          )}
        </div>
      </div>
    </div>
  );
}
