import React, { useEffect, useState } from 'react';
import './App.css';
import logoPng from './logo.png';
import ModelViewer from './ModelViewer';

function Stepper({ steps, current }) {
  return (
    <div className="stepper" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      {steps.map((label, i) => (
        <div key={label} className="step">
          <div className="dot-wrap">
            <div className={`dot ${i <= current ? 'active' : ''}`}/>
            {i < steps.length - 1 && (
              <div className={`connector ${i < current ? 'filled' : ''}`}/>
            )}
          </div>
          <div className="label">{label}</div>
        </div>
      ))}
    </div>
  );
}

function PrinterLogoCard() {
  return (
    <div className="logo-card" aria-label="3D Bioprinting Slicing">
      <div className="logo-inner">
        <img src={logoPng} alt="3D Bioprinting Slicing" className="printer-img" />
      </div>
    </div>
  );
}

function App() {
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [view, setView] = useState('home');
  const [dims, setDims] = useState({ width: 0, height: 0, depth: 0 });
  const [scale, setScale] = useState(1);
  const [sliceHeight, setSliceHeight] = useState(0.45);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    document.title = '3d-bioprinting-slicer';
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      setFile(f);
      setView('viewer');
    }
  };

  if (view === 'viewer') {
    return (
      <div className="page viewer-page">
        <div className="viewer">
          <div className="canvas-wrap">
            <ModelViewer file={file} onInfo={(info) => setDims(info)} className="canvas-fill" scale={scale} autoRotate={autoRotate} />
          </div>
          <div className="sidebar">
            <div className="card">
              <div className="kv">
                <div>File name:</div>
                <div><strong>{fileName}</strong></div>
                <div>File size:</div>
                <div><strong>{`${Math.round(dims.width * scale)} x ${Math.round(dims.height * scale)} x ${Math.round(dims.depth * scale)}`}</strong></div>
              </div>
            </div>
            <div className="form">
              <div className="row"><span className="group-label">Width</span><input className="field" value={Math.round(dims.width * scale)} readOnly /></div>
              <div className="row"><span className="group-label">Height</span><input className="field" value={Math.round(dims.height * scale)} readOnly /></div>
              <div className="row"><span className="group-label">Depth</span><input className="field" value={Math.round(dims.depth * scale)} readOnly /></div>
              <div className="group-label">Scale</div>
              <div className="slider-row">
                <input type="range" min="0.1" max="5" step="0.1" value={scale} className="slider" onChange={(e) => setScale(parseFloat(e.target.value) || 0)} />
                <div className="divider" />
                <input className="field" value={scale} onChange={(e) => setScale(parseFloat(e.target.value) || 0)} />
              </div>
                <div className="row"><span className="group-label">Ink</span>
                <select className="select" defaultValue="cyl">
                  <option value="petg">PETG</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <div className="row"><span className="group-label">Print Head</span>
                <select className="select" defaultValue="cyl">
                  <option value="cyl">Cylindrical</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <div className="group-label">Slice height (mm)</div>
              <div className="slider-row">
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.01"
                  value={sliceHeight}
                  onChange={(e) => setSliceHeight(parseFloat(e.target.value) || 0)}
                  className="slider"
                />
                <div className="divider" />
                <input
                  className="field"
                  value={sliceHeight}
                  onChange={(e) => setSliceHeight(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="row">
                <span className="group-label">Auto rotate</span>
                <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
              </div>
            </div>
            <button className="primary-btn">Start Slicing</button>
          </div>
        </div>
        <div className="steps-wrap">
          <Stepper
            steps={[ 'Upload', 'Slice', 'Choose\nContainer', 'Print' ]}
            current={0}
          />
        </div>
        <button
          onClick={() => setView('home')}
          style={{ position: 'fixed', top: 16, left: 16, zIndex: 10, padding: '10px 14px', borderRadius: 10, border: 'none', background: '#6d5da3', color: '#fff', cursor: 'pointer' }}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <main className="content">
        <PrinterLogoCard />

        <label className="upload-btn">
          <input type="file" accept=".stl,.obj,.glb,.gltf" onChange={onFileChange} />
          <span className="upload-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 5 17 10"/>
              <line x1="12" y1="5" x2="12" y2="21"/>
            </svg>
          </span>
          <span>{fileName || 'Upload model'}</span>
        </label>

        <div className="steps-wrap">
          <Stepper
            steps={[
              'Upload',
              'Slice',
              'Choose\nContainer',
              'Print',
            ]}
            current={-1}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
