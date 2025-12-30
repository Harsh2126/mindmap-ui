import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({ selectedNode, onUpdateNode }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setEditingField(null);
  }, [selectedNode]);

  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, '').trim();
  };

  const handleEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const handleSave = () => {
    if (!editValue.trim()) return;
    
    const sanitizedValue = sanitizeInput(editValue);
    const updates = { [editingField]: sanitizedValue };
    
    onUpdateNode(selectedNode.id, updates);
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="project-header">
          <h2>Interactive Component Visualization</h2>
          <p>Architecture Document</p>
        </div>
        
        {!selectedNode ? (
          <div>
            <h3>Select a Node</h3>
            <p>Click on any node in the mind map to view and edit its details.</p>
          </div>
        ) : (
          <>
            <div className="field-group">
          <label>Title</label>
          {editingField === 'title' ? (
            <div className="edit-field">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                maxLength={100}
                autoFocus
              />
              <div className="edit-actions">
                <button onClick={handleSave}>Save</button>
                <button onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <div 
              className="field-value editable" 
              onClick={() => handleEdit('title', selectedNode.title)}
            >
              {selectedNode.title}
            </div>
          )}
        </div>

        <div className="field-group">
          <label>Summary</label>
          {editingField === 'summary' ? (
            <div className="edit-field">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                maxLength={200}
                rows={3}
                autoFocus
              />
              <div className="edit-actions">
                <button onClick={handleSave}>Save</button>
                <button onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <div 
              className="field-value editable" 
              onClick={() => handleEdit('summary', selectedNode.summary)}
            >
              {selectedNode.summary}
            </div>
          )}
        </div>

        <div className="field-group">
          <label>Description</label>
          {editingField === 'description' ? (
            <div className="edit-field">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                maxLength={1000}
                rows={6}
                autoFocus
              />
              <div className="edit-actions">
                <button onClick={handleSave}>Save</button>
                <button onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <div 
              className="field-value editable" 
              onClick={() => handleEdit('description', selectedNode.description)}
            >
              {selectedNode.description}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;