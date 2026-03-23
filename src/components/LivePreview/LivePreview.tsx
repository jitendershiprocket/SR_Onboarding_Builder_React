import { useState, useEffect, useMemo, useCallback } from 'react';
import type { OnboardingSchema, StepStyles } from '../../types/schema.types';
import './LivePreview.css';

interface Props {
  schema: OnboardingSchema;
  previewStepIdx?: number;
  inspectMode?: boolean;
  onInspectElement?: (section: string) => void;
}

type InspectTarget = 'background' | 'typography' | 'button' | 'card' | 'spacing' | 'container' | null;

function getMergedStyles(schema: OnboardingSchema, stepId: number): StepStyles {
  const global = schema.styles?.global || {};
  const override = schema.styles?.stepOverrides?.[stepId] || {};
  return {
    background: { ...global.background, ...override.background },
    typography: { ...global.typography, ...override.typography },
    button: { ...global.button, ...override.button },
    card: { ...global.card, ...override.card },
    spacing: { ...global.spacing, ...override.spacing },
  };
}

// Inspect wrapper - adds highlight without replacing child classes
function Inspectable({ target, inspectMode, hoveredTarget, selectedTarget, onHover, onClick, children }: {
  target: InspectTarget;
  inspectMode: boolean;
  hoveredTarget: InspectTarget;
  selectedTarget: InspectTarget;
  onHover: (t: InspectTarget | null) => void;
  onClick: (t: InspectTarget, e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  if (!inspectMode) return <>{children}</>;
  const isHovered = hoveredTarget === target;
  const isSelected = selectedTarget === target;
  return (
    <div
      className={`inspect-el ${isHovered ? 'inspect-hover' : ''} ${isSelected ? 'inspect-selected' : ''}`}
      onMouseEnter={() => onHover(target)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(target, e); }}
    >
      {children}
      {(isHovered || isSelected) && <span className="inspect-label">{target}</span>}
    </div>
  );
}

export default function LivePreview({ schema, previewStepIdx, inspectMode = false, onInspectElement }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [hoveredTarget, setHoveredTarget] = useState<InspectTarget>(null);
  const [selectedTarget, setSelectedTarget] = useState<InspectTarget>(null);

  useEffect(() => {
    if (previewStepIdx !== undefined) setStepIdx(previewStepIdx);
  }, [previewStepIdx]);

  const step = schema.steps[stepIdx];
  const s = useMemo(() => step ? getMergedStyles(schema, step.stepId) : {} as StepStyles, [schema, step]);

  const screenStyle = useMemo(() => {
    const bg = s.background || {};
    const style: React.CSSProperties = {};
    if (bg.type === 'color' && bg.color) style.backgroundColor = bg.color;
    if (bg.type === 'gradient' && bg.gradient) style.backgroundImage = bg.gradient;
    if (bg.type === 'image' && bg.image) {
      style.backgroundImage = `url(${bg.image})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    }
    return style;
  }, [s]);

  const handleInspect = useCallback((target: InspectTarget, _e: React.MouseEvent) => {
    setSelectedTarget(target);
    if (target && onInspectElement) onInspectElement(target);
  }, [onInspectElement]);

  if (!step) return null;

  const next = () => { if (!inspectMode) stepIdx < schema.totalSteps - 1 && setStepIdx(stepIdx + 1); };
  const prev = () => { if (!inspectMode) stepIdx > 0 && setStepIdx(stepIdx - 1); };
  const reset = () => { setStepIdx(0); setValues({}); setSelectedTarget(null); };

  const select = (key: string, val: string, auto?: boolean) => {
    if (inspectMode) return;
    setValues({ ...values, [key]: val });
    if (auto) setTimeout(next, 400);
  };

  const toggle = (key: string, val: string) => {
    if (inspectMode) return;
    const arr = [...(values[key] || [])];
    const idx = arr.indexOf(val);
    idx > -1 ? arr.splice(idx, 1) : arr.push(val);
    setValues({ ...values, [key]: arr });
  };

  // Shared inspect props for Inspectable wrapper
  const ip = { inspectMode, hoveredTarget, selectedTarget, onHover: setHoveredTarget, onClick: handleInspect };

  return (
    <div className={`preview-container ${inspectMode ? 'inspect-active' : ''}`}>
      <div className="preview-header">
        <span className="material-icons">phone_iphone</span>
        <h4>Live Preview</h4>
        {inspectMode && <span className="inspect-badge">Click any element to edit its style</span>}
        <button className="reset-btn" onClick={reset}><span className="material-icons">refresh</span></button>
      </div>

      <div className="phone-frame">
        <div className="phone-screen" style={screenStyle}
          {...(inspectMode ? { onClick: (e: React.MouseEvent) => handleInspect('background', e) } : {})}
        >
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
                    <div className="bar-fill" style={{ width: stepIdx > i ? '100%' : stepIdx === i ? '10%' : '0%', backgroundColor: s.button?.backgroundColor }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="step-content" style={{ padding: s.spacing?.padding, gap: s.spacing?.sectionGap, fontFamily: s.typography?.fontFamily }}>
            {step.badge && <span className="badge">{step.badge}</span>}

            <Inspectable target="typography" {...ip}>
              <h3 style={{ color: s.typography?.headingColor, fontSize: s.typography?.headingSize }}>{step.title}</h3>
              {step.subtitle && <p className="subtitle" style={{ color: s.typography?.bodyColor, fontSize: s.typography?.bodySize }}>{step.subtitle}</p>}
            </Inspectable>

            {step.fields.map((field) => (
              <div key={field.key}>
                {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                  <div className="form-group">
                    <label style={{ color: s.typography?.labelColor }}>{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder || ''} onChange={(e) => !inspectMode && setValues({ ...values, [field.key]: e.target.value })} />
                  </div>
                )}

                {field.type === 'radio-group' && (
                  <Inspectable target="card" {...ip}>
                    <div className="radio-group">
                      {field.options.map((opt) => (
                        <div key={opt.value}
                          className={`radio-option ${values[field.key] === opt.value ? 'selected' : ''}`}
                          style={values[field.key] === opt.value ? { borderColor: s.card?.selectedBorderColor, backgroundColor: s.card?.selectedBgColor } : { borderColor: s.card?.borderColor }}
                          onClick={() => select(field.key, opt.value, field.autoAdvance)}>
                          <span className={`radio-dot ${values[field.key] === opt.value ? 'active' : ''}`}
                            style={values[field.key] === opt.value ? { borderColor: s.button?.backgroundColor, backgroundColor: s.button?.backgroundColor } : {}} />
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </Inspectable>
                )}

                {field.type === 'image-card' && (
                  <Inspectable target="card" {...ip}>
                    <div className="card-grid" style={{ gridTemplateColumns: `repeat(${s.card?.gridColumns || 2}, 1fr)`, gap: s.card?.gap }}>
                      {field.options.map((opt) => (
                        <div key={opt.value}
                          className={`image-card ${values[field.key] === opt.value ? 'selected' : ''}`}
                          style={{
                            borderRadius: s.card?.borderRadius,
                            ...(values[field.key] === opt.value
                              ? { borderColor: s.card?.selectedBorderColor, backgroundColor: s.card?.selectedBgColor }
                              : { borderColor: s.card?.borderColor }),
                          }}
                          onClick={() => select(field.key, opt.value, field.autoAdvance)}>
                          {opt.icon && <div className="card-icon"><img src={opt.icon} alt={opt.label} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>}
                          <span>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </Inspectable>
                )}

                {field.type === 'checkbox-group' && (
                  <Inspectable target="card" {...ip}>
                    <div className="checkbox-grid">
                      {field.options.map((opt) => (
                        <div key={opt.id}
                          className={`checkbox-card ${(values[field.key] || []).includes(opt.value) ? 'selected' : ''}`}
                          style={(values[field.key] || []).includes(opt.value) ? { borderColor: s.card?.selectedBorderColor, backgroundColor: s.card?.selectedBgColor } : { borderColor: s.card?.borderColor }}
                          onClick={() => toggle(field.key, opt.value)}>
                          {(values[field.key] || []).includes(opt.value) && <span className="check-icon">&#10003;</span>}
                          <span>{opt.label}</span>
                          {opt.description && <small>{opt.description}</small>}
                        </div>
                      ))}
                    </div>
                  </Inspectable>
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

            {step.submitLabel && (
              <Inspectable target="button" {...ip}>
                <button className="submit-btn" onClick={next}
                  style={{ backgroundColor: s.button?.backgroundColor, color: s.button?.textColor, borderRadius: s.button?.borderRadius }}>
                  {step.submitLabel}
                </button>
              </Inspectable>
            )}
            {step.skipOption && <p className="skip-link" onClick={next}>{step.skipOption.label}</p>}
          </div>

          {schema.settings.bottomBarText && (
            <Inspectable target="spacing" {...ip}>
              <div className="bottom-bar">{schema.settings.bottomBarText}</div>
            </Inspectable>
          )}
        </div>
      </div>
    </div>
  );
}
