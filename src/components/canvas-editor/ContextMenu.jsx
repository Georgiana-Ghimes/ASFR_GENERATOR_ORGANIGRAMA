import React, { useRef, useEffect, useCallback } from 'react';

const menuStyle = {
  position: 'absolute',
  backgroundColor: 'white',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  zIndex: 30,
  minWidth: 160,
  padding: '4px 0',
};

const itemStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 16px',
  border: 'none',
  backgroundColor: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 14,
  color: '#374151',
  lineHeight: '1.4',
};

const deleteItemStyle = {
  ...itemStyle,
  color: '#dc2626',
};

const separatorStyle = {
  height: 1,
  backgroundColor: '#e5e7eb',
  margin: '4px 0',
};

/** @param {Record<string, any>} props */
function ContextMenuInner({
  position,
  unit,
  isReadOnly,
  onEdit,
  onAddChild,
  onDelete,
  onRotate,
  onClose,
}) {
  const menuRef = useRef(null);

  const handleClickOutside = useCallback(
    (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!position || !unit) return;

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, unit, handleClickOutside, handleKeyDown]);

  if (!position || !unit) return null;

  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleAddChild = () => {
    onAddChild();
    onClose();
  };

  const handleRotate = () => {
    onRotate();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ ...menuStyle, left: position.x, top: position.y }}
      role="menu"
      aria-label="Meniu contextual unitate"
    >
      <button
        style={itemStyle}
        role="menuitem"
        onClick={handleEdit}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        Editare
      </button>

      {!isReadOnly && (
        <button
          style={itemStyle}
          role="menuitem"
          onClick={handleAddChild}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Adaugă Copil
        </button>
      )}

      {!isReadOnly && (
        <button
          style={itemStyle}
          role="menuitem"
          onClick={handleRotate}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Rotire
        </button>
      )}

      <div style={separatorStyle} role="separator" />

      {!isReadOnly && (
        <button
          style={deleteItemStyle}
          role="menuitem"
          onClick={handleDelete}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Șterge
        </button>
      )}
    </div>
  );
}

const ContextMenu = React.memo(ContextMenuInner);

export default ContextMenu;
