import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './SchemaList.css';

const STATUS_COLORS: Record<string, string> = { published: '#10b981', draft: '#f59e0b', archived: '#9ca3af' };

export default function SchemaList() {
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listSchemas(filter === 'all' ? undefined : filter);
      setSchemas(res.data || []);
    } catch { setSchemas([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const publish = async (id: number) => {
    if (!confirm('Publish this schema? It will become active for all users.')) return;
    try { await api.publishSchema(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  const archive = async (id: number) => {
    if (!confirm('Archive this schema?')) return;
    try { await api.archiveSchema(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h2>All Schemas</h2>
        <button className="create-btn" onClick={() => navigate('/builder')}>
          <span className="material-icons">add</span> New Schema
        </button>
      </div>

      <div className="filters">
        {['all', 'draft', 'published', 'archived'].map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="loading"><span className="spinner" /> Loading schemas...</div>}

      {!loading && schemas.length > 0 && (
        <div className="schema-grid">
          {schemas.map((s) => (
            <div key={s.id} className="schema-card">
              <div className="card-header">
                <h3>{s.name}</h3>
                <span className="status-badge" style={{ background: STATUS_COLORS[s.status] }}>{s.status}</span>
              </div>
              <div className="card-meta">
                <span><strong>{s.total_steps}</strong> steps</span>
                <span>v{s.version}</span>
                {s.published_at && <span>Published: {new Date(s.published_at).toLocaleDateString()}</span>}
              </div>
              <div className="card-id">{s.schema_id}</div>
              <div className="card-actions">
                {s.status === 'draft' && (
                  <>
                    <button className="action-btn edit" onClick={() => navigate(`/builder?id=${s.id}`)}>
                      <span className="material-icons">edit</span> Edit
                    </button>
                    <button className="action-btn publish" onClick={() => publish(s.id)}>
                      <span className="material-icons">publish</span> Publish
                    </button>
                  </>
                )}
                {s.status !== 'archived' && (
                  <button className="action-btn archive" onClick={() => archive(s.id)}>
                    <span className="material-icons">archive</span> Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && schemas.length === 0 && (
        <div className="empty">
          <span className="material-icons">inbox</span>
          <p>No schemas found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
