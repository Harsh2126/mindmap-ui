import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import Node from './Node';
import './MindMap.css';

/**
 * Main MindMap visualization component using D3.js
 * Handles graph rendering, zoom/pan, and node positioning
 */
const MindMap = ({ 
  data, 
  selectedNode, 
  onNodeSelect, 
  onNodeHover, 
  expandedNodes, 
  onToggleExpand,
  drillPath,
  onFitView 
}) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  // Get current root based on drill path
  const getCurrentRoot = useCallback(() => {
    if (!data || drillPath.length === 0) return data;
    let current = data;
    for (const nodeId of drillPath) {
      const found = findNodeById(current, nodeId);
      if (found) current = found;
    }
    return current;
  }, [data, drillPath]);

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

  // Calculate radial layout positions
  const calculateLayout = useCallback((rootNode) => {
    if (!rootNode) return { nodes: [], links: [] };
    const nodes = [];
    const links = [];
    
    const addNode = (node, level, angle, parentPos, parentId, siblingCount = 1) => {
      // Dynamic spacing based on level and sibling count
      const baseDistance = level === 0 ? 0 : 100 + (level - 1) * 80;
      const distance = baseDistance + Math.max(0, (siblingCount - 3) * 15);
      
      const x = parentPos ? parentPos.x + Math.cos(angle) * distance : 0;
      const y = parentPos ? parentPos.y + Math.sin(angle) * distance : 0;
      
      const nodeData = { ...node, x, y, level, _expanded: expandedNodes.has(node.id) };
      nodes.push(nodeData);
      
      if (parentId) {
        links.push({
          source: parentId,
          target: node.id,
          sourcePos: parentPos,
          targetPos: { x, y }
        });
      }
      
      // Add children if expanded
      if (node.children && expandedNodes.has(node.id)) {
        const childCount = node.children.length;
        let angleStep, startAngle;
        
        if (level === 0) {
          angleStep = (Math.PI * 2) / childCount;
          startAngle = 0;
        } else {
          const arcWidth = Math.min(Math.PI * 1.8, Math.PI * 0.4 * childCount);
          angleStep = childCount > 1 ? arcWidth / (childCount - 1) : 0;
          startAngle = angle - arcWidth / 2;
        }
        
        node.children.forEach((child, index) => {
          const childAngle = level === 0 
            ? startAngle + angleStep * index
            : startAngle + angleStep * index;
          addNode(child, level + 1, childAngle, { x, y }, node.id, childCount);
        });
      }
    };
    
    addNode(rootNode, 0, 0, null, null);
    return { nodes, links };
  }, [expandedNodes]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup D3 zoom behavior and fit view function
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => setTransform(event.transform));
    
    svg.call(zoom);
    
    // Fit view function
    onFitView.current = () => {
      const currentRoot = getCurrentRoot();
      if (!currentRoot) return;
      
      const { nodes } = calculateLayout(currentRoot);
      if (nodes.length === 0) return;
      
      const bounds = nodes.reduce((acc, node) => ({
        minX: Math.min(acc.minX, node.x - 50),
        maxX: Math.max(acc.maxX, node.x + 50),
        minY: Math.min(acc.minY, node.y - 50),
        maxY: Math.max(acc.maxY, node.y + 50)
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      const scale = Math.min(dimensions.width / width, dimensions.height / height, 1) * 0.8;
      const translateX = dimensions.width / 2 - centerX * scale;
      const translateY = dimensions.height / 2 - centerY * scale;
      
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    };
  }, [dimensions, getCurrentRoot, calculateLayout, onFitView]);

  // Auto-fit view when data loads
  useEffect(() => {
    if (data && dimensions.width > 0 && onFitView.current && !isInitialized) {
      setTimeout(() => {
        onFitView.current();
        setIsInitialized(true);
      }, 200);
    }
  }, [data, dimensions, isInitialized]);

  // Node interaction handlers
  const handleNodeClick = (node) => {
    onNodeSelect(node);
    onToggleExpand(node.id);
  };

  const handleNodeHover = (node, event) => {
    setHoveredNode(node);
    onNodeHover(node);
    if (event) {
      setTooltip({
        show: true,
        x: event.clientX + 10,
        y: event.clientY - 10,
        content: node.summary
      });
    }
  };

  const handleNodeHoverOut = () => {
    setHoveredNode(null);
    onNodeHover(null);
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  };

  const currentRoot = getCurrentRoot();
  const { nodes, links } = calculateLayout(currentRoot);

  return (
    <div ref={containerRef} className="mindmap-container">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="mindmap-svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333" strokeWidth="0.5" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <g transform={transform.toString()}>
          {/* Render links */}
          {links.map((link, index) => (
            <line
              key={index}
              x1={link.sourcePos.x}
              y1={link.sourcePos.y}
              x2={link.targetPos.x}
              y2={link.targetPos.y}
              stroke="#555"
              strokeWidth="2"
              opacity={hoveredNode && 
                (hoveredNode.id === link.source || hoveredNode.id === link.target) 
                ? 1 : 0.6}
            />
          ))}
          
          {/* Render nodes */}
          {nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              x={node.x}
              y={node.y}
              level={node.level}
              isSelected={selectedNode && selectedNode.id === node.id}
              isHighlighted={hoveredNode && hoveredNode.id === node.id}
              onClick={handleNodeClick}
              onHover={(n) => handleNodeHover(n, d3.event)}
              onHoverOut={handleNodeHoverOut}
            />
          ))}
        </g>
      </svg>
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            position: 'fixed',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            maxWidth: '200px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default MindMap;