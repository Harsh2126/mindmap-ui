import React, { useState, useRef, useCallback, useEffect } from 'react';
import MindMap from './components/MindMap';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import { useMindMapData } from './hooks/useMindMapData';
import './App.css';

/**
 * Main App component - orchestrates mindmap functionality
 * Handles state management, user interactions, and data operations
 */
function App() {
  const { data, loading, error, updateNode, addNode, deleteNode } = useMindMapData();
  const [selectedNode, setSelectedNode] = useState(() => {
    const saved = localStorage.getItem('mindmap-selected-node');
    return saved ? JSON.parse(saved) : null;
  });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [drillPath, setDrillPath] = useState([]);
  const fitViewRef = useRef();

  // Node interaction handlers
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    if (node) {
      try {
        const cleanNode = { 
          id: node.id, 
          title: node.title, 
          summary: node.summary, 
          description: node.description,
          metadata: node.metadata
        };
        localStorage.setItem('mindmap-selected-node', JSON.stringify(cleanNode));
      } catch (error) {
        console.warn('Failed to save selected node to localStorage:', error);
      }
    }
  }, []);
  const handleNodeHover = useCallback((node) => setHoveredNode(node), []);

  // Update selected node when data changes to keep it in sync
  useEffect(() => {
    if (selectedNode && data) {
      const findNodeById = (node, id) => {
        if (node.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const updatedNode = findNodeById(data, selectedNode.id);
      if (updatedNode) {
        setSelectedNode(updatedNode);
        try {
          const cleanNode = { 
            id: updatedNode.id, 
            title: updatedNode.title, 
            summary: updatedNode.summary, 
            description: updatedNode.description,
            metadata: updatedNode.metadata
          };
          localStorage.setItem('mindmap-selected-node', JSON.stringify(cleanNode));
        } catch (error) {
          console.warn('Failed to update selected node in localStorage:', error);
        }
      }
    }
  }, [data, selectedNode?.id]);

  // Node expansion/collapse
  const handleToggleExpand = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
      return newSet;
    });
  }, []);

  // Toolbar actions
  const handleExpandAll = useCallback(() => {
    if (!data) return;
    const getAllIds = (node) => {
      const ids = [node.id];
      if (node.children) node.children.forEach(child => ids.push(...getAllIds(child)));
      return ids;
    };
    setExpandedNodes(new Set(getAllIds(data)));
  }, [data]);

  const handleCollapseAll = useCallback(() => setExpandedNodes(new Set(['root'])), []);
  
  const handleDrillDown = useCallback(() => {
    if (selectedNode?.children?.length > 0) {
      setDrillPath(prev => [...prev, selectedNode.id]);
      setExpandedNodes(new Set([selectedNode.id]));
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleDrillUp = useCallback(() => {
    if (drillPath.length > 0) {
      setDrillPath(prev => prev.slice(0, -1));
      setSelectedNode(null);
    }
  }, [drillPath]);

  const handleFitView = useCallback(() => fitViewRef.current?.(), []);

  const handleAddNode = useCallback(() => {
    if (selectedNode) {
      addNode(selectedNode.id, { title: '', summary: '', description: '' });
      setExpandedNodes(prev => new Set([...prev, selectedNode.id]));
    }
  }, [selectedNode, addNode]);

  const handleDeleteNode = useCallback(() => {
    if (selectedNode?.id !== 'root') {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedNode.id);
        return newSet;
      });
    }
  }, [selectedNode, deleteNode]);

  const handleReset = useCallback(() => {
    localStorage.removeItem('mindmap-data');
    localStorage.removeItem('mindmap-selected-node');
    window.location.reload();
  }, []);

  // Export functions
  const handleDownloadImage = useCallback(() => {
    const svg = document.querySelector('.mindmap-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg.cloneNode(true));
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'mindmap.svg';
    link.href = url;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, []);

  const generateDocs = useCallback((node, level = 0) => {
    const tag = level === 0 ? 'h1' : `h${Math.min(level + 1, 6)}`;
    let doc = `<${tag}>${node.title}</${tag}>\n`;
    if (node.summary) doc += `<p><strong>Summary:</strong> ${node.summary}</p>\n`;
    if (node.description) doc += `<p>${node.description}</p>\n`;
    if (node.children) node.children.forEach(child => doc += generateDocs(child, level + 1));
    return doc;
  }, []);

  const handleDownloadDocs = useCallback(() => {
    if (!data) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Documentation</title><style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.6}h1{color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:10px}h2,h3,h4,h5,h6{color:#34495e;margin-top:30px}p{margin:15px 0}strong{color:#2980b9}</style></head><body><div style="text-align:center;margin-bottom:40px"><h1>Interactive Component Visualization</h1><p><em>Architecture Document</em></p></div>${generateDocs(data)}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'documentation.doc';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [data, generateDocs]);

  if (loading) return <div className="app loading"><div className="loading-message">Loading mind map...</div></div>;
  if (error) return <div className="app error"><div className="error-message">Error: {error}</div></div>;

  return (
    <div className="app">
      <Toolbar
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onDrillDown={handleDrillDown}
        onDrillUp={handleDrillUp}
        onFitView={handleFitView}
        onAddNode={handleAddNode}
        onDeleteNode={handleDeleteNode}
        onDownloadImage={handleDownloadImage}
        onDownloadDocs={handleDownloadDocs}
        onReset={handleReset}
        canDrillDown={selectedNode?.children?.length > 0}
        canDrillUp={drillPath.length > 0}
        canDelete={selectedNode?.id !== 'root'}
      />
      <div className="main-content">
        <MindMap
          data={data}
          selectedNode={selectedNode}
          onNodeSelect={handleNodeSelect}
          onNodeHover={handleNodeHover}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
          drillPath={drillPath}
          onFitView={fitViewRef}
        />
        <Sidebar selectedNode={selectedNode} onUpdateNode={updateNode} />
      </div>
    </div>
  );
}

export default App;