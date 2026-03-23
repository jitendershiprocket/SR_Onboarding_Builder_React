import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OnboardingSchema } from '../types/schema.types';
import { DEFAULT_EMPTY_SCHEMA } from '../types/schema.types';
import { api } from '../services/api';
import PromptInput from '../components/PromptInput/PromptInput';
import FigmaImport from '../components/FigmaImport/FigmaImport';
import SchemaEditor from '../components/SchemaEditor/SchemaEditor';
import StyleEditor from '../components/StyleEditor/StyleEditor';
import AIEditBar from '../components/AIEditBar/AIEditBar';
import LivePreview from '../components/LivePreview/LivePreview';
import './BuilderPage.css';

export default function BuilderPage() {
  const [searchParams] = useSearchParams();
  const [schema, setSchema] = useState<OnboardingSchema | null>(null);
  const [dbId, setDbId] = useState<number | null>(null);
  const [tab, setTab] = useState<'prompt' | 'editor' | 'styles'>('prompt');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [inspectSection, setInspectSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      api.getSchema(+id).then((res) => {
        if (res.success && res.data) {
          setSchema(res.data.schema_data);
          setDbId(res.data.id);
          setTab('editor');
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const save = async () => {
    if (!schema || saving) return;
    setSaving(true);
    try {
      if (dbId) {
        await api.updateSchema(dbId, { name: schema.name, schema_data: schema });
        showMsg('Schema saved!');
      } else {
        const res = await api.saveSchema(schema.name, schema);
        setDbId(res.data?.id);
        showMsg('Schema saved as draft!');
      }
    } catch (e: any) { showMsg(e.message || 'Save failed'); }
    setSaving(false);
  };

  const publish = async () => {
    if (!dbId || publishing) return;
    if (!confirm('Publish this schema? It will become active for ALL users.')) return;
    setPublishing(true);
    try {
      await api.publishSchema(dbId);
      if (schema) setSchema({ ...schema, status: 'published' });
      showMsg('Schema published and live!');
    } catch (e: any) { showMsg(e.message || 'Publish failed'); }
    setPublishing(false);
  };

  const reset = () => { setSchema(null); setDbId(null); setTab('prompt'); setMsg(''); };

  return (
    <div className="builder-page">
      <div className="action-bar">
        <div className="tabs">
          <button className={tab === 'prompt' ? 'active' : ''} onClick={() => setTab('prompt')}>
            <span className="material-icons">auto_awesome</span> AI Generate
          </button>
          <button className={tab === 'editor' ? 'active' : ''} onClick={() => setTab('editor')} disabled={!schema}>
            <span className="material-icons">edit</span> Editor
          </button>
          <button className={tab === 'styles' ? 'active' : ''} onClick={() => setTab('styles')} disabled={!schema}>
            <span className="material-icons">palette</span> Styles
          </button>
        </div>
        <div className="actions">
          {msg && <span className="save-msg">{msg}</span>}
          {!schema && <button className="btn-secondary" onClick={() => { setSchema(JSON.parse(JSON.stringify(DEFAULT_EMPTY_SCHEMA))); setTab('editor'); }}><span className="material-icons">add</span> Blank Schema</button>}
          {schema && <button className="btn-secondary" onClick={reset}><span className="material-icons">refresh</span> Reset</button>}
          <button className="btn-primary" onClick={save} disabled={!schema || saving}>
            <span className="material-icons">save</span> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn-publish" onClick={publish} disabled={!dbId || publishing}>
            <span className="material-icons">publish</span> {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="content-area">
        {tab === 'prompt' && (
          <div className="prompt-tab">
            <PromptInput onGenerated={(s) => { setSchema(s); setDbId(null); setTab('editor'); }} />
            <div className="prompt-divider">
              <span className="divider-line" />
              <span className="divider-text">OR</span>
              <span className="divider-line" />
            </div>
            <FigmaImport onGenerated={(s) => { setSchema(s); setDbId(null); setTab('editor'); }} />
          </div>
        )}

        {tab === 'editor' && schema && (
          <div className="editor-preview">
            <div className="editor-pane">
              <SchemaEditor schema={schema} onChange={setSchema} />
            </div>
            <div className="preview-pane">
              <LivePreview schema={schema} />
            </div>
          </div>
        )}

        {tab === 'styles' && schema && (
          <div className="editor-preview">
            <div className="editor-pane">
              <StyleEditor schema={schema} onChange={setSchema} activeStepIdx={activeStepIdx} focusSection={inspectSection} />
            </div>
            <div className="preview-pane">
              <div className="step-nav-preview">
                {schema.steps.map((_, i) => (
                  <button key={i} className={activeStepIdx === i ? 'active' : ''} onClick={() => setActiveStepIdx(i)}>
                    Step {i + 1}
                  </button>
                ))}
              </div>
              <LivePreview schema={schema} previewStepIdx={activeStepIdx} inspectMode={true} onInspectElement={(section) => setInspectSection(section)} />
            </div>
          </div>
        )}

        {(tab === 'editor' || tab === 'styles') && !schema && (
          <div className="empty-state">
            <span className="material-icons">dashboard_customize</span>
            <h3>No schema loaded</h3>
            <p>Use AI Generate tab or click "Blank Schema" to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
