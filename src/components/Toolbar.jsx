import React from 'react';
import './Toolbar.css';

const Toolbar = ({ 
  onExpandAll, 
  onCollapseAll, 
  onDrillDown, 
  onDrillUp, 
  onFitView, 
  onAddNode, 
  onDeleteNode,
  onDownloadImage, 
  onDownloadDocs,
  onReset,
  canDrillDown,
  canDrillUp,
  canDelete
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button onClick={onExpandAll} title="Expand All">
          <span>⊞</span> Expand All
        </button>
        <button onClick={onCollapseAll} title="Collapse All">
          <span>⊟</span> Collapse All
        </button>
      </div>
      
      <div className="toolbar-group">
        <button 
          onClick={onDrillDown} 
          disabled={!canDrillDown}
          title="Drill Down"
        >
          <span>↓</span> Drill Down
        </button>
        <button 
          onClick={onDrillUp} 
          disabled={!canDrillUp}
          title="Drill Up"
        >
          <span>↑</span> Drill Up
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={onFitView} title="Fit View">
          <span>⌂</span> Fit View
        </button>
        <button onClick={onReset} title="Reset to Start">
          <span>↻</span> Reset
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={onAddNode} title="Add Node">
          <span>+</span> Add Node
        </button>
        <button 
          onClick={onDeleteNode} 
          disabled={!canDelete}
          title="Delete Node"
        >
          <span>🗑</span> Delete
        </button>
      </div>
      
      <div className="toolbar-group">
        <button onClick={onDownloadImage} title="Download as Image">
          <span>📷</span> Image
        </button>
        <button onClick={onDownloadDocs} title="Download Full Documentation">
          <span>📄</span> Docs
        </button>
      </div>
    </div>
  );
};

export default Toolbar;