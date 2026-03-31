import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Plus, ChevronUp, ChevronDown } from 'lucide-react';

const wrapperStyle = /** @type {React.CSSProperties} */ ({
  position: 'absolute',
  top: 0,
  left: '50%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 20,
});

const toolbarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: 'white',
  border: '1px solid #d1d5db',
  borderRadius: '0 0 8px 8px',
  padding: '6px 12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.25s ease, opacity 0.25s ease',
};

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  border: 'none',
  borderRadius: 6,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  color: '#374151',
  padding: 0,
};

const separatorStyle = {
  width: 1,
  height: 24,
  backgroundColor: '#d1d5db',
};

const zoomTextStyle = /** @type {React.CSSProperties} */ ({
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  minWidth: 42,
  textAlign: 'center',
  userSelect: 'none',
});

const addBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  height: 32,
  border: '1px solid #3b82f6',
  borderRadius: 6,
  backgroundColor: '#3b82f6',
  color: 'white',
  cursor: 'pointer',
  padding: '0 10px',
  fontSize: 13,
  fontWeight: 500,
};

const toggleBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 18,
  border: '1px solid #d1d5db',
  borderTop: 'none',
  borderRadius: '0 0 6px 6px',
  backgroundColor: 'white',
  cursor: 'pointer',
  color: '#6b7280',
  padding: 0,
  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  transition: 'color 0.15s ease',
};

/** @param {Record<string, any>} props */
function CanvasToolbarInner({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToContent,
  onResetZoom,
  isReadOnly,
  onAddUnit,
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{
      ...wrapperStyle,
      transition: 'transform 0.25s ease',
      transform: isOpen
        ? 'translateX(-50%) translateY(0)'
        : 'translateX(-50%) translateY(calc(-100% + 18px))',
    }}>
      <div style={toolbarStyle}>
        <button style={btnStyle} onClick={onZoomOut} title="Zoom Out" aria-label="Zoom Out">
          <ZoomOut size={18} />
        </button>

        <span style={zoomTextStyle}>{Math.round(zoom * 200) + '%'}</span>

        <button style={btnStyle} onClick={onZoomIn} title="Zoom In" aria-label="Zoom In">
          <ZoomIn size={18} />
        </button>

        <div style={separatorStyle} />

        <button style={btnStyle} onClick={onFitToContent} title="Fit to Content" aria-label="Fit to Content">
          <Maximize size={18} />
        </button>

        <button style={btnStyle} onClick={onResetZoom} title="Reset Zoom" aria-label="Reset Zoom">
          <RotateCcw size={18} />
        </button>

        {!isReadOnly && (
          <>
            <div style={separatorStyle} />
            <button style={addBtnStyle} onClick={onAddUnit} title="Adaugă Unitate" aria-label="Adaugă Unitate">
              <Plus size={16} />
              Adaugă Unitate
            </button>
          </>
        )}
      </div>

      <button
        style={toggleBtnStyle}
        onClick={() => setIsOpen(prev => !prev)}
        title={isOpen ? 'Ascunde toolbar' : 'Arată toolbar'}
        aria-label={isOpen ? 'Ascunde toolbar' : 'Arată toolbar'}
      >
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </div>
  );
}

const CanvasToolbar = React.memo(CanvasToolbarInner);

export default CanvasToolbar;
