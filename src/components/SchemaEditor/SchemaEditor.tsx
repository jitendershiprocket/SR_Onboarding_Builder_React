import { useState, useRef } from 'react';
import type { OnboardingSchema, OnboardingStep, FormField } from '../../types/schema.types';
import { FIELD_TYPE_OPTIONS } from '../../types/schema.types';
import { api } from '../../services/api';
import './SchemaEditor.css';

interface Props {
  schema: OnboardingSchema;
  onChange: (schema: OnboardingSchema) => void;
}

export default function SchemaEditor({ schema, onChange }: Props) {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [aiEditStepIdx, setAiEditStepIdx] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAddStepAI, setShowAddStepAI] = useState(false);
  const [addStepPrompt, setAddStepPrompt] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const activeStep = schema.steps[activeStepIdx];

  const update = (updated: OnboardingSchema) => onChange({ ...updated });

  // ─── Step Management ──────────────────────────────────────

  const addStep = () => {
    const s = { ...schema };
    s.steps = [...s.steps, {
      stepId: s.steps.length + 1, title: 'New Step', subtitle: '', fields: [],
      submitLabel: 'Next', autoAdvance: false,
      onSubmit: { label: `step_${s.steps.length + 1}`, mapFields: [] },
    }];
    s.totalSteps = s.steps.length;
    setActiveStepIdx(s.steps.length - 1);
    update(s);
  };

  const removeStep = (idx: number) => {
    if (schema.steps.length <= 1) return;
    const s = { ...schema };
    s.steps = s.steps.filter((_, i) => i !== idx);
    s.steps.forEach((st, i) => (st.stepId = i + 1));
    s.totalSteps = s.steps.length;
    if (activeStepIdx >= s.steps.length) setActiveStepIdx(s.steps.length - 1);
    update(s);
  };

  const moveStep = (from: number, to: number) => {
    const s = { ...schema };
    const [moved] = s.steps.splice(from, 1);
    s.steps.splice(to, 0, moved);
    s.steps.forEach((st, i) => (st.stepId = i + 1));
    setActiveStepIdx(to);
    update(s);
  };

  // ─── AI Step Edit ───────────────────────────────────────────

  const aiEditStep = async (stepIdx: number) => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.editSchemaWithAI(schema, `Edit ONLY step ${stepIdx + 1} (stepId: ${schema.steps[stepIdx].stepId}): ${aiPrompt.trim()}. Keep all other steps unchanged.`);
      if (res.success && res.data) {
        onChange(res.data);
        setAiPrompt('');
        setAiEditStepIdx(null);
      } else {
        setAiError(res.message || 'AI edit failed');
      }
    } catch (e: any) {
      setAiError(e.message || 'AI edit failed');
    }
    setAiLoading(false);
  };

  const aiAddStep = async () => {
    if (!addStepPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.editSchemaWithAI(schema, `Add a NEW step at the end: ${addStepPrompt.trim()}. Keep all existing steps unchanged.`);
      if (res.success && res.data) {
        onChange(res.data);
        setActiveStepIdx(res.data.steps.length - 1);
        setAddStepPrompt('');
        setShowAddStepAI(false);
      } else {
        setAiError(res.message || 'AI add step failed');
      }
    } catch (e: any) {
      setAiError(e.message || 'AI add step failed');
    }
    setAiLoading(false);
  };

  // ─── Field Management ─────────────────────────────────────

  const addField = (type: string) => {
    const s = { ...schema };
    const step = { ...s.steps[activeStepIdx] };
    const field = createDefaultField(type);
    step.fields = [...step.fields, field];
    step.onSubmit = { ...step.onSubmit, mapFields: [...step.onSubmit.mapFields, field.key] };
    s.steps[activeStepIdx] = step;
    setShowFieldMenu(false);
    update(s);
  };

  const removeField = (idx: number) => {
    const s = { ...schema };
    const step = { ...s.steps[activeStepIdx] };
    const key = step.fields[idx].key;
    step.fields = step.fields.filter((_, i) => i !== idx);
    step.onSubmit = { ...step.onSubmit, mapFields: step.onSubmit.mapFields.filter(k => k !== key) };
    s.steps[activeStepIdx] = step;
    setEditingFieldIdx(null);
    update(s);
  };

  const updateField = (idx: number, prop: string, value: unknown) => {
    const s = { ...schema };
    const step = { ...s.steps[activeStepIdx] };
    step.fields = [...step.fields];
    step.fields[idx] = { ...step.fields[idx], [prop]: value } as FormField;
    s.steps[activeStepIdx] = step;
    update(s);
  };

  const moveField = (from: number, to: number) => {
    const s = { ...schema };
    const step = { ...s.steps[activeStepIdx] };
    const fields = [...step.fields];
    const [moved] = fields.splice(from, 1);
    fields.splice(to, 0, moved);
    step.fields = fields;
    s.steps[activeStepIdx] = step;
    update(s);
  };

  // ─── Options ──────────────────────────────────────────────

  const addOption = (fi: number) => {
    const f = { ...schema.steps[activeStepIdx].fields[fi] } as any;
    if (f.type === 'radio-group' || f.type === 'image-card' || f.type === 'checkbox-group') {
      const opts = [...(f.options || [])];
      const base = { value: `option_${opts.length + 1}`, label: 'New Option' };
      if (f.type === 'image-card') opts.push({ ...base, icon: '' });
      else if (f.type === 'checkbox-group') opts.push({ id: `opt_${opts.length + 1}`, ...base });
      else opts.push(base);
      updateField(fi, 'options', opts);
    }
  };

  const removeOption = (fi: number, oi: number) => {
    const f = schema.steps[activeStepIdx].fields[fi] as any;
    const opts = f.options.filter((_: any, i: number) => i !== oi);
    updateField(fi, 'options', opts);
  };

  const updateOption = (fi: number, oi: number, prop: string, value: string) => {
    const f = schema.steps[activeStepIdx].fields[fi] as any;
    const opts = [...f.options];
    opts[oi] = { ...opts[oi], [prop]: value };
    updateField(fi, 'options', opts);
  };

  // ─── Platforms ────────────────────────────────────────────

  const addPlatform = (fi: number) => {
    const f = schema.steps[activeStepIdx].fields[fi] as any;
    const plats = [...(f.platforms || []), {
      name: 'New Platform', key: `platform_${(f.platforms?.length || 0) + 1}`,
      icon: '', placeholder: 'Enter URL', helpText: 'Enter your URL',
    }];
    updateField(fi, 'platforms', plats);
  };

  const removePlatform = (fi: number, pi: number) => {
    const f = schema.steps[activeStepIdx].fields[fi] as any;
    updateField(fi, 'platforms', f.platforms.filter((_: any, i: number) => i !== pi));
  };

  const updatePlatform = (fi: number, pi: number, prop: string, value: string) => {
    const f = schema.steps[activeStepIdx].fields[fi] as any;
    const plats = [...f.platforms];
    plats[pi] = { ...plats[pi], [prop]: value };
    updateField(fi, 'platforms', plats);
  };

  // ─── Step Properties ──────────────────────────────────────

  const updateStepProp = (prop: keyof OnboardingStep, value: unknown) => {
    const s = { ...schema };
    s.steps = [...s.steps];
    s.steps[activeStepIdx] = { ...s.steps[activeStepIdx], [prop]: value };
    update(s);
  };

  const updateSubmitProp = (prop: string, value: unknown) => {
    const s = { ...schema };
    s.steps = [...s.steps];
    const step = { ...s.steps[activeStepIdx] };
    step.onSubmit = { ...step.onSubmit, [prop]: value };
    s.steps[activeStepIdx] = step;
    update(s);
  };

  const toggleSkip = () => {
    updateStepProp('skipOption', activeStep.skipOption
      ? undefined
      : { label: 'Set Up Later', submitValue: 'setuplater' });
  };

  // ─── Helpers ──────────────────────────────────────────────

  const getIcon = (type: string) => FIELD_TYPE_OPTIONS.find(f => f.value === type)?.icon || 'text_fields';
  const getLabel = (type: string) => FIELD_TYPE_OPTIONS.find(f => f.value === type)?.label || type;

  return (
    <div className="editor-container">
      {/* Settings Bar */}
      <div className="settings-bar">
        <div className="setting-item">
          <label>Schema Name</label>
          <input value={schema.name} onChange={(e) => onChange({ ...schema, name: e.target.value })} />
        </div>
        <div className="setting-item">
          <label>Heading</label>
          <input value={schema.settings.heading} onChange={(e) => onChange({ ...schema, settings: { ...schema.settings, heading: e.target.value } })} />
        </div>
        <div className="setting-item small">
          <label>Steps</label>
          <span className="step-count">{schema.totalSteps}</span>
        </div>
      </div>

      <div className="editor-body">
        {/* Steps Panel */}
        <div className="steps-panel">
          <div className="panel-header">
            <h4>Steps</h4>
            <button className="add-btn" onClick={addStep} title="Add blank step"><span className="material-icons">add</span></button>
          </div>
          <div className="steps-list">
            {schema.steps.map((step, i) => (
              <div key={step.stepId} className={`step-item ${activeStepIdx === i ? 'active' : ''}`} onClick={() => { setActiveStepIdx(i); setEditingFieldIdx(null); }}>
                <div className="step-drag">
                  {i > 0 && <span className="material-icons mini-btn" onClick={(e) => { e.stopPropagation(); moveStep(i, i - 1); }}>arrow_upward</span>}
                  {i < schema.steps.length - 1 && <span className="material-icons mini-btn" onClick={(e) => { e.stopPropagation(); moveStep(i, i + 1); }}>arrow_downward</span>}
                </div>
                <div className="step-info">
                  <span className="step-number">Step {i + 1}</span>
                  <span className="step-title">{step.title || 'Untitled'}</span>
                </div>
                {schema.steps.length > 1 && (
                  <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeStep(i); }}>
                    <span className="material-icons">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Editor */}
        {activeStep && (
          <div className="step-editor">
            <div className="section">
              <h4>Step Properties</h4>
              <div className="form-row">
                <div className="form-field">
                  <label>Title</label>
                  <input value={activeStep.title} onChange={(e) => updateStepProp('title', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Subtitle</label>
                  <input value={activeStep.subtitle || ''} onChange={(e) => updateStepProp('subtitle', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Submit Button</label>
                  <input value={activeStep.submitLabel} onChange={(e) => updateStepProp('submitLabel', e.target.value)} placeholder="e.g., Proceed" />
                </div>
                <div className="form-field">
                  <label>Badge</label>
                  <input value={activeStep.badge || ''} onChange={(e) => updateStepProp('badge', e.target.value || undefined)} placeholder="e.g., Recommended" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Backend Label</label>
                  <input value={activeStep.onSubmit.label} onChange={(e) => updateSubmitProp('label', e.target.value)} />
                </div>
                <div className="form-field checkbox-field">
                  <label>
                    <input type="checkbox" checked={!!activeStep.skipOption} onChange={toggleSkip} />
                    Show "Set Up Later"
                  </label>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="section">
              <div className="section-header">
                <h4>Fields ({activeStep.fields.length})</h4>
                <div className="add-field-wrap" ref={menuRef}>
                  <button className="add-btn" onClick={() => setShowFieldMenu(!showFieldMenu)}>
                    <span className="material-icons">add</span> Add Field
                  </button>
                  {showFieldMenu && (
                    <div className="field-menu">
                      {FIELD_TYPE_OPTIONS.map((ft) => (
                        <button key={ft.value} onClick={() => addField(ft.value)}>
                          <span className="material-icons">{ft.icon}</span> {ft.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeStep.fields.length === 0 && (
                <div className="empty-fields">
                  <span className="material-icons">widgets</span>
                  <p>No fields yet. Click "Add Field" to start.</p>
                </div>
              )}

              {activeStep.fields.map((field, fi) => (
                <div key={field.key + fi} className={`field-item ${editingFieldIdx === fi ? 'editing' : ''}`}>
                  <div className="field-header" onClick={() => setEditingFieldIdx(editingFieldIdx === fi ? null : fi)}>
                    <div className="field-drag">
                      {fi > 0 && <span className="material-icons mini-btn" onClick={(e) => { e.stopPropagation(); moveField(fi, fi - 1); }}>arrow_upward</span>}
                      {fi < activeStep.fields.length - 1 && <span className="material-icons mini-btn" onClick={(e) => { e.stopPropagation(); moveField(fi, fi + 1); }}>arrow_downward</span>}
                    </div>
                    <span className="material-icons field-type-icon">{getIcon(field.type)}</span>
                    <div className="field-summary">
                      <span className="field-type-label">{getLabel(field.type)}</span>
                      <span className="field-key">{field.label || field.key}</span>
                    </div>
                    <div className="field-actions">
                      <span className="material-icons">{editingFieldIdx === fi ? 'expand_less' : 'expand_more'}</span>
                      <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeField(fi); }}>
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </div>

                  {editingFieldIdx === fi && (
                    <div className="field-editor">
                      <div className="form-row">
                        <div className="form-field">
                          <label>Key</label>
                          <input value={field.key} onChange={(e) => updateField(fi, 'key', e.target.value)} />
                        </div>
                        <div className="form-field">
                          <label>Label</label>
                          <input value={field.label} onChange={(e) => updateField(fi, 'label', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row">
                        {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                          <div className="form-field">
                            <label>Placeholder</label>
                            <input value={field.placeholder || ''} onChange={(e) => updateField(fi, 'placeholder', e.target.value)} />
                          </div>
                        )}
                        <div className="form-field checkbox-field">
                          <label><input type="checkbox" checked={field.required} onChange={(e) => updateField(fi, 'required', e.target.checked)} /> Required</label>
                        </div>
                      </div>

                      {/* Options for radio/image-card/checkbox-group */}
                      {(field.type === 'radio-group' || field.type === 'image-card' || field.type === 'checkbox-group') && (
                        <div className="options-editor">
                          <div className="options-header">
                            <label>Options</label>
                            <button className="add-btn small" onClick={() => addOption(fi)}><span className="material-icons">add</span></button>
                          </div>
                          {(field as any).options?.map((opt: any, oi: number) => (
                            <div key={oi} className="option-row">
                              <input value={opt.label} onChange={(e) => updateOption(fi, oi, 'label', e.target.value)} placeholder="Label" />
                              <input value={opt.value} onChange={(e) => updateOption(fi, oi, 'value', e.target.value)} placeholder="Value" className="small-input" />
                              {field.type === 'image-card' && <input value={opt.icon || ''} onChange={(e) => updateOption(fi, oi, 'icon', e.target.value)} placeholder="Icon URL" />}
                              <button className="remove-btn" onClick={() => removeOption(fi, oi)}><span className="material-icons">close</span></button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Layout for checkbox-group */}
                      {field.type === 'checkbox-group' && (
                        <div className="form-row">
                          <div className="form-field">
                            <label>Layout</label>
                            <select value={(field as any).layout} onChange={(e) => updateField(fi, 'layout', e.target.value)}>
                              <option value="card">Card</option>
                              <option value="list">List</option>
                              <option value="grid">Grid</option>
                            </select>
                          </div>
                          <div className="form-field checkbox-field">
                            <label><input type="checkbox" checked={(field as any).hasOther} onChange={(e) => updateField(fi, 'hasOther', e.target.checked)} /> Show "Other"</label>
                          </div>
                        </div>
                      )}

                      {/* Platforms for social-input */}
                      {field.type === 'social-input' && (
                        <div className="options-editor">
                          <div className="options-header">
                            <label>Platforms</label>
                            <button className="add-btn small" onClick={() => addPlatform(fi)}><span className="material-icons">add</span></button>
                          </div>
                          {(field as any).platforms?.map((p: any, pi: number) => (
                            <div key={pi} className="option-row platform-row">
                              <input value={p.name} onChange={(e) => updatePlatform(fi, pi, 'name', e.target.value)} placeholder="Name" />
                              <input value={p.key} onChange={(e) => updatePlatform(fi, pi, 'key', e.target.value)} placeholder="Key" className="small-input" />
                              <input value={p.icon || ''} onChange={(e) => updatePlatform(fi, pi, 'icon', e.target.value)} placeholder="Icon URL" />
                              <input value={p.placeholder || ''} onChange={(e) => updatePlatform(fi, pi, 'placeholder', e.target.value)} placeholder="Placeholder" />
                              <input value={p.helpText} onChange={(e) => updatePlatform(fi, pi, 'helpText', e.target.value)} placeholder="Help text" />
                              <button className="remove-btn" onClick={() => removePlatform(fi, pi)}><span className="material-icons">close</span></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Assistant */}
            <div className="section ai-assistant-section">
              <div className="ai-assistant-header">
                <span className="material-icons ai-sparkle">auto_awesome</span>
                <h4>AI Assistant</h4>
                <span className="ai-step-tag">Step {activeStepIdx + 1}</span>
              </div>
              <p className="ai-assistant-desc">Tell AI what to change in this step</p>

              <div className="ai-assistant-input">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aiEditStep(activeStepIdx)}
                  placeholder="e.g., Add a phone number field, Change title to..."
                  disabled={aiLoading}
                />
                <button onClick={() => aiEditStep(activeStepIdx)} disabled={!aiPrompt.trim() || aiLoading}>
                  {aiLoading ? <span className="ai-spinner" /> : <span className="material-icons">send</span>}
                </button>
              </div>

              <div className="ai-quick-actions">
                {[
                  { label: 'Add phone field', prompt: 'Add a phone number field with validation' },
                  { label: 'Add more options', prompt: 'Add 3 more relevant options to the existing fields' },
                  { label: 'Improve labels', prompt: 'Improve all field labels and placeholders to be more user-friendly' },
                  { label: 'Add validation', prompt: 'Add proper validation to all fields' },
                ].map((action, i) => (
                  <button key={i} className="ai-quick-chip" onClick={() => { setAiPrompt(action.prompt); }} disabled={aiLoading}>
                    {action.label}
                  </button>
                ))}
              </div>

              {aiError && <div className="ai-inline-error"><span className="material-icons">error</span> {aiError}</div>}

              <div className="ai-add-step-divider">
                <span className="divider-line" />
                <span className="divider-text">or</span>
                <span className="divider-line" />
              </div>

              <div className="ai-assistant-input">
                <input
                  value={addStepPrompt}
                  onChange={(e) => setAddStepPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aiAddStep()}
                  placeholder="Add a new step... e.g., Ask about courier preferences"
                  disabled={aiLoading}
                />
                <button onClick={aiAddStep} disabled={!addStepPrompt.trim() || aiLoading}>
                  {aiLoading ? <span className="ai-spinner" /> : <span className="material-icons">add</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function createDefaultField(type: string): FormField {
  const key = `field_${Date.now()}`;
  const base = { key, label: 'New Field', placeholder: '', required: false, validators: [] };
  switch (type) {
    case 'text': return { ...base, type: 'text' };
    case 'email': return { ...base, type: 'email', label: 'Email', placeholder: 'Enter email' };
    case 'number': return { ...base, type: 'number' };
    case 'radio-group': return { ...base, type: 'radio-group', label: '', autoAdvance: true, options: [{ value: 'option_1', label: 'Option 1' }, { value: 'option_2', label: 'Option 2' }] };
    case 'image-card': return { ...base, type: 'image-card', label: '', selectionMode: 'single', autoAdvance: true, options: [{ value: 'option_1', label: 'Option 1', icon: '' }, { value: 'option_2', label: 'Option 2', icon: '' }] };
    case 'checkbox-group': return { ...base, type: 'checkbox-group', label: '', layout: 'card', hasOther: false, minSelection: 1, options: [{ id: 'opt_1', value: 'Option 1', label: 'Option 1' }, { id: 'opt_2', value: 'Option 2', label: 'Option 2' }] };
    case 'social-input': return { ...base, type: 'social-input', label: '', required: false, platforms: [{ name: 'Website', key: 'website', icon: '', placeholder: 'Enter URL', helpText: 'Enter your website URL' }] };
    default: return { ...base, type: 'text' };
  }
}
