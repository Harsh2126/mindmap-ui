import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import Node from './Node';
import './MindMap.css';

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

  const BASE_RADIUS = 180;
  const LEVEL_GAP = 150;
  const NODE_PADDING = 20;

  const getSubtreeSize = useCallback((node) => {
    if (!node.children || !expandedNodes.has(node.id)) return 1;
    return 1 + node.children.reduce((sum, child) => sum + getSubtreeSize(child), 0);
  }, [expandedNodes]);

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

  const calculateLayout = useCallback((rootNode) => {
    if (!rootNode) return { nodes: [], links: [] };

    const nodes = [];
    const links = [];

    const layoutNode = (
      node,
      level,
      parentPos,
      startAngle,
      endAngle,
      parentId = null
    ) => {
      const angle = (startAngle + endAngle) / 2;
      const radius = level === 0 ? 0 : BASE_RADIUS + level * LEVEL_GAP;

      const x = parentPos.x + Math.cos(angle) * radius;
      const y = parentPos.y + Math.sin(angle) * radius;

      const baseSizes = [70, 55, 45, 35];
      const nodeRadius =
        baseSizes[Math.min(level, baseSizes.length - 1)] +
        Math.min((node.title || "").length * 1.2, 20);

      nodes.push({
        ...node,
        x,
        y,
        level,
        radius: nodeRadius,
        _expanded: expandedNodes.has(node.id)
      });

      if (parentId) {
        links.push({
          source: parentId,
          target: node.id,
          sourcePos: parentPos,
          targetPos: { x, y }
        });
      }

      if (!node.children || !expandedNodes.has(node.id)) return;

      // 🔥 SUBTREE-AWARE ANGULAR DISTRIBUTION
      const totalWeight = node.children.reduce(
        (sum, c) => sum + getSubtreeSize(c),
        0
      );

      let currentAngle = startAngle;

      node.children.forEach((child) => {
        const weight = getSubtreeSize(child);
        const slice = (endAngle - startAngle) * (weight / totalWeight);

        layoutNode(
          child,
          level + 1,
          { x, y },
          currentAngle,
          currentAngle + slice,
          node.id
        );

        currentAngle += slice;
      });
    };

    layoutNode(rootNode, 0, { x: 0, y: 0 }, 0, Math.PI * 2);

    return { nodes, links };
  }, [expandedNodes, getSubtreeSize]);

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

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => setTransform(event.transform));
    
    svg.call(zoom);
    
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

  useEffect(() => {
    if (data && dimensions.width > 0 && onFitView.current && !isInitialized) {
      setTimeout(() => {
        onFitView.current();
        setIsInitialized(true);
      }, 200);
    }
  }, [data, dimensions, isInitialized]);

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
  const { nodes, links } = useMemo(() => calculateLayout(currentRoot), [currentRoot, calculateLayout]);

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
              onHover={handleNodeHover}
              onHoverOut={handleNodeHoverOut}
            />
          ))}
        </g>
      </svg>
      
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