import { useState, useRef } from 'react';
import { api } from '../../services/api';
import type { OnboardingSchema } from '../../types/schema.types';
import './FigmaImport.css';

interface Props {
  onGenerated: (schema: OnboardingSchema) => void;
}

export default function FigmaImport({ onGenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    setFile(f);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setError('');
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const generate = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.designToSchema(file);
      if (res.success && res.data) {
        onGenerated(res.data);
      } else {
        setError(res.message || 'Failed to generate schema from design');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate schema. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="figma-section">
      <div className="figma-header">
        <span className="material-icons">image</span>
        <h3>Import from Design</h3>
      </div>
      <p className="figma-desc">
        Upload a screenshot or mockup of your onboarding design. AI will analyze the image and generate a matching schema with styles.
      </p>

      <div className="figma-box">
        {!preview ? (
          <div
            className="drop-zone"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <span className="material-icons drop-icon">cloud_upload</span>
            <p>Drag & drop a design image here</p>
            <span className="drop-hint">or click to browse (PNG, JPG, max 10MB)</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="preview-area">
            <img src={preview} alt="Design preview" className="design-preview" />
            <button className="clear-btn" onClick={clear}>
              <span className="material-icons">close</span>
            </button>
          </div>
        )}

        <button className="figma-generate-btn" onClick={generate} disabled={!file || loading}>
          {loading ? <span className="spinner" /> : <span className="material-icons">auto_awesome</span>}
          {loading ? 'Analyzing Design...' : 'Generate from Design'}
        </button>
      </div>

      {error && (
        <div className="error-msg">
          <span className="material-icons">error</span>
          {error}
        </div>
      )}
    </div>
  );
}
