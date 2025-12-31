import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing mindmap data with localStorage persistence
 * Handles loading, saving, updating, adding, and deleting nodes
 */
export const useMindMapData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on component mount - check localStorage first, then fallback to JSON file
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = localStorage.getItem('mindmap-data');
        if (savedData) {
          setData(JSON.parse(savedData));
        } else {
          const response = await fetch('/mindmap-data.json');
          if (!response.ok) throw new Error('Failed to load data');
          const jsonData = await response.json();
          setData(jsonData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Clean data for JSON serialization (remove circular references)
  const cleanDataForStorage = (node) => {
    const { parent, siblingIndex, ...cleanNode } = node;
    if (cleanNode.children) {
      cleanNode.children = cleanNode.children.map(cleanDataForStorage);
    }
    return cleanNode;
  };

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (data) {
      const cleanData = cleanDataForStorage(data);
      localStorage.setItem('mindmap-data', JSON.stringify(cleanData));
    }
  }, [data]);

  // Update specific node properties (for inline editing)
  const updateNode = useCallback((nodeId, updates) => {
    const updateNodeRecursive = (node) => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNodeRecursive) };
      }
      return node;
    };
    setData(prevData => updateNodeRecursive(prevData));
  }, []);

  // Add new child node to specified parent
  const addNode = useCallback((parentId, newNode) => {
    const addNodeRecursive = (node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), {
            id: `node-${Date.now()}`,
            title: 'New Node',
            summary: 'Click to edit',
            description: 'Add your description here',
            metadata: { notes: '', inputs: [], outputs: [] },
            children: [],
            ...newNode
          }]
        };
      }
      if (node.children) {
        return { ...node, children: node.children.map(addNodeRecursive) };
      }
      return node;
    };
    setData(prevData => addNodeRecursive(prevData));
  }, []);

  // Delete node and all its children
  const deleteNode = useCallback((nodeId) => {
    const deleteNodeRecursive = (node) => {
      if (node.children) {
        return {
          ...node,
          children: node.children.filter(child => child.id !== nodeId).map(deleteNodeRecursive)
        };
      }
      return node;
    };
    setData(prevData => deleteNodeRecursive(prevData));
  }, []);

  return { data, loading, error, updateNode, addNode, deleteNode };
};