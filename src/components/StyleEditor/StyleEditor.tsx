import { useState, useEffect } from 'react';
import type {
  OnboardingSchema,
  SchemaStyles,
  GlobalStyles,
  StepStyles,
  BackgroundStyle,
  TypographyStyle,
  ButtonStyle,
  CardStyle,
  SpacingStyle,
  ContainerStyle,
} from '../../types/schema.types';
import './StyleEditor.css';

interface Props {
  schema: OnboardingSchema;
  onChange: (schema: OnboardingSchema) => void;
  activeStepIdx: number;
  focusSection?: string | null;
}

const FONT_OPTIONS = [
  'SFProDisplay', 'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Nunito', 'Raleway', 'Source Sans Pro', 'DM Sans',
];

const DEFAULT_GLOBAL: GlobalStyles = {
  background: { type: 'color', color: '#ffffff' },
  typography: { fontFamily: 'SFProDisplay', headingColor: '#1a1a2e', headingSize: '24px', bodyColor: '#4a4a68', bodySize: '14px', labelColor: '#1a1a2e' },
  button: { backgroundColor: '#7c3aed', textColor: '#ffffff', borderRadius: '8px', hoverColor: '#6d28d9' },
  card: { gridColumns: 2, gap: '16px', borderRadius: '12px', borderColor: '#e5e7eb', selectedBorderColor: '#7c3aed', selectedBgColor: '#f5f3ff' },
  spacing: { padding: '32px 24px', sectionGap: '24px' },
  container: { maxWidth: '848px', alignment: 'center' },
};

export default function StyleEditor({ schema, onChange, activeStepIdx, focusSection }: Props) {
  const [editMode, setEditMode] = useState<'global' | 'step'>('global');
  const [expandedSection, setExpandedSection] = useState<string | null>('background');

  // When element is clicked in preview, open that section
  useEffect(() => {
    if (focusSection) {
      setExpandedSection(focusSection);
    }
  }, [focusSection]);

  const styles: SchemaStyles = schema.styles || { global: { ...DEFAULT_GLOBAL } };
  const currentStepId = schema.steps[activeStepIdx]?.stepId;

  const getActiveStyles = (): Partial<StepStyles> => {
    if (editMode === 'global') return styles.global;
    return styles.stepOverrides?.[currentStepId] || {};
  };

  const updateStyles = (partial: Partial<StepStyles>) => {
    const newStyles = { ...styles };
    if (editMode === 'global') {
      newStyles.global = { ...newStyles.global, ...partial };
    } else {
      if (!newStyles.stepOverrides) newStyles.stepOverrides = {};
      newStyles.stepOverrides[currentStepId] = {
        ...newStyles.stepOverrides[currentStepId],
        ...partial,
      };
    }
    onChange({ ...schema, styles: newStyles });
  };

  const updateContainer = (partial: Partial<ContainerStyle>) => {
    const newStyles = { ...styles };
    newStyles.global = {
      ...newStyles.global,
      container: { ...newStyles.global.container, ...partial },
    };
    onChange({ ...schema, styles: newStyles });
  };

  const active = getActiveStyles();
  const toggle = (key: string) => setExpandedSection(expandedSection === key ? null : key);

  return (
    <div className="style-editor">
      <div className="style-editor-header">
        <h3>Style Editor</h3>
        <div className="edit-mode-toggle">
          <button className={editMode === 'global' ? 'active' : ''} onClick={() => setEditMode('global')}>
            Global
          </button>
          <button className={editMode === 'step' ? 'active' : ''} onClick={() => setEditMode('step')}>
            Step {activeStepIdx + 1}
          </button>
        </div>
      </div>

      {/* Background */}
      <Section title="Background" icon="wallpaper" expanded={expandedSection === 'background'} onToggle={() => toggle('background')}>
        <div className="field-row">
          <label>Type</label>
          <select
            value={active.background?.type || 'color'}
            onChange={(e) => updateStyles({ background: { ...active.background, type: e.target.value as BackgroundStyle['type'] } })}
          >
            <option value="color">Solid Color</option>
            <option value="gradient">Gradient</option>
            <option value="image">Image</option>
          </select>
        </div>
        {(active.background?.type || 'color') === 'color' && (
          <ColorField label="Color" value={active.background?.color || '#ffffff'}
            onChange={(v) => updateStyles({ background: { ...active.background, type: 'color', color: v } })} />
        )}
        {active.background?.type === 'gradient' && (
          <div className="field-row">
            <label>CSS Gradient</label>
            <input type="text" placeholder="linear-gradient(135deg, #667eea, #764ba2)"
              value={active.background?.gradient || ''}
              onChange={(e) => updateStyles({ background: { ...active.background, type: 'gradient', gradient: e.target.value } })} />
          </div>
        )}
        {active.background?.type === 'image' && (
          <div className="field-row">
            <label>Image URL</label>
            <input type="text" placeholder="https://..."
              value={active.background?.image || ''}
              onChange={(e) => updateStyles({ background: { ...active.background, type: 'image', image: e.target.value } })} />
          </div>
        )}
      </Section>

      {/* Typography */}
      <Section title="Typography" icon="text_fields" expanded={expandedSection === 'typography'} onToggle={() => toggle('typography')}>
        <div className="field-row">
          <label>Font Family</label>
          <select value={active.typography?.fontFamily || 'Inter'}
            onChange={(e) => updateStyles({ typography: { ...active.typography, fontFamily: e.target.value } })}>
            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <ColorField label="Heading Color" value={active.typography?.headingColor || '#1a1a2e'}
          onChange={(v) => updateStyles({ typography: { ...active.typography, headingColor: v } })} />
        <div className="field-row">
          <label>Heading Size</label>
          <input type="text" value={active.typography?.headingSize || '24px'}
            onChange={(e) => updateStyles({ typography: { ...active.typography, headingSize: e.target.value } })} />
        </div>
        <ColorField label="Body Color" value={active.typography?.bodyColor || '#4a4a68'}
          onChange={(v) => updateStyles({ typography: { ...active.typography, bodyColor: v } })} />
        <div className="field-row">
          <label>Body Size</label>
          <input type="text" value={active.typography?.bodySize || '14px'}
            onChange={(e) => updateStyles({ typography: { ...active.typography, bodySize: e.target.value } })} />
        </div>
        <ColorField label="Label Color" value={active.typography?.labelColor || '#1a1a2e'}
          onChange={(v) => updateStyles({ typography: { ...active.typography, labelColor: v } })} />
      </Section>

      {/* Button */}
      <Section title="Button" icon="smart_button" expanded={expandedSection === 'button'} onToggle={() => toggle('button')}>
        <ColorField label="Background" value={active.button?.backgroundColor || '#7c3aed'}
          onChange={(v) => updateStyles({ button: { ...active.button, backgroundColor: v } })} />
        <ColorField label="Text Color" value={active.button?.textColor || '#ffffff'}
          onChange={(v) => updateStyles({ button: { ...active.button, textColor: v } })} />
        <div className="field-row">
          <label>Border Radius</label>
          <div className="slider-row">
            <input type="range" min="0" max="30" value={parseInt(active.button?.borderRadius || '8')}
              onChange={(e) => updateStyles({ button: { ...active.button, borderRadius: e.target.value + 'px' } })} />
            <span>{active.button?.borderRadius || '8px'}</span>
          </div>
        </div>
        <ColorField label="Hover Color" value={active.button?.hoverColor || '#6d28d9'}
          onChange={(v) => updateStyles({ button: { ...active.button, hoverColor: v } })} />
      </Section>

      {/* Cards */}
      <Section title="Cards" icon="view_module" expanded={expandedSection === 'card'} onToggle={() => toggle('card')}>
        <div className="field-row">
          <label>Grid Columns</label>
          <div className="column-selector">
            {[1, 2, 3].map(n => (
              <button key={n} className={active.card?.gridColumns === n ? 'active' : ''}
                onClick={() => updateStyles({ card: { ...active.card, gridColumns: n } })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="field-row">
          <label>Gap</label>
          <input type="text" value={active.card?.gap || '16px'}
            onChange={(e) => updateStyles({ card: { ...active.card, gap: e.target.value } })} />
        </div>
        <div className="field-row">
          <label>Border Radius</label>
          <div className="slider-row">
            <input type="range" min="0" max="24" value={parseInt(active.card?.borderRadius || '12')}
              onChange={(e) => updateStyles({ card: { ...active.card, borderRadius: e.target.value + 'px' } })} />
            <span>{active.card?.borderRadius || '12px'}</span>
          </div>
        </div>
        <ColorField label="Border Color" value={active.card?.borderColor || '#e5e7eb'}
          onChange={(v) => updateStyles({ card: { ...active.card, borderColor: v } })} />
        <ColorField label="Selected Border" value={active.card?.selectedBorderColor || '#7c3aed'}
          onChange={(v) => updateStyles({ card: { ...active.card, selectedBorderColor: v } })} />
        <ColorField label="Selected BG" value={active.card?.selectedBgColor || '#f5f3ff'}
          onChange={(v) => updateStyles({ card: { ...active.card, selectedBgColor: v } })} />
      </Section>

      {/* Spacing */}
      <Section title="Spacing" icon="space_bar" expanded={expandedSection === 'spacing'} onToggle={() => toggle('spacing')}>
        <div className="field-row">
          <label>Padding</label>
          <input type="text" value={active.spacing?.padding || '32px 24px'} placeholder="32px 24px"
            onChange={(e) => updateStyles({ spacing: { ...active.spacing, padding: e.target.value } })} />
        </div>
        <div className="field-row">
          <label>Section Gap</label>
          <input type="text" value={active.spacing?.sectionGap || '24px'} placeholder="24px"
            onChange={(e) => updateStyles({ spacing: { ...active.spacing, sectionGap: e.target.value } })} />
        </div>
      </Section>

      {/* Container (global only) */}
      {editMode === 'global' && (
        <Section title="Container" icon="crop_free" expanded={expandedSection === 'container'} onToggle={() => toggle('container')}>
          <div className="field-row">
            <label>Max Width</label>
            <input type="text" value={styles.global.container?.maxWidth || '848px'} placeholder="848px"
              onChange={(e) => updateContainer({ maxWidth: e.target.value })} />
          </div>
          <div className="field-row">
            <label>Alignment</label>
            <div className="column-selector">
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} className={styles.global.container?.alignment === a ? 'active' : ''}
                  onClick={() => updateContainer({ alignment: a })}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </Section>
      )}

      {editMode === 'step' && styles.stepOverrides?.[currentStepId] && (
        <button className="reset-step-btn" onClick={() => {
          const newStyles = { ...styles };
          if (newStyles.stepOverrides) {
            delete newStyles.stepOverrides[currentStepId];
          }
          onChange({ ...schema, styles: newStyles });
        }}>
          <span className="material-icons">restart_alt</span> Reset Step to Global
        </button>
      )}
    </div>
  );
}

// ─── Reusable sub-components ────────────────────────────────

function Section({ title, icon, expanded, onToggle, children }: {
  title: string; icon: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`style-section ${expanded ? 'expanded' : ''}`}>
      <div className="section-header" onClick={onToggle}>
        <span className="material-icons section-icon">{icon}</span>
        <span>{title}</span>
        <span className="material-icons chevron">{expanded ? 'expand_less' : 'expand_more'}</span>
      </div>
      {expanded && <div className="section-body">{children}</div>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field-row color-field">
      <label>{label}</label>
      <div className="color-input-group">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
