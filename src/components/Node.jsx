import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Node = ({ 
  node, 
  x, 
  y, 
  level, 
  isSelected, 
  isHighlighted, 
  onClick, 
  onHover, 
  onHoverOut 
}) => {
  const nodeRef = useRef();
  const textRef = useRef();

  const getNodeColor = (level) => {
    const colors = ['#4a9eff', '#4caf50', '#ff9800', '#9c27b0']; // Blue, Green, Orange, Purple
    return colors[Math.min(level, colors.length - 1)];
  };

  const getNodeSize = (level, titleLength) => {
    const baseSizes = [70, 55, 45, 35]; // Root largest, decreasing with depth
    const baseSize = baseSizes[Math.min(level, baseSizes.length - 1)];
    const extraSize = Math.min(titleLength * 1.5, 25);
    return baseSize + extraSize;
  };

  useEffect(() => {
    const nodeElement = d3.select(nodeRef.current);
    const textElement = d3.select(textRef.current);
    const title = node.title || '';
    const nodeSize = getNodeSize(level, title.length);
    
    // Animate node appearance
    nodeElement
      .transition()
      .duration(300)
      .attr('r', nodeSize)
      .attr('fill', getNodeColor(level));

    // Handle text wrapping for longer titles
    const maxChars = level === 0 ? 15 : 12; // More chars for dynamic sizing
    textElement.selectAll('*').remove();
    
    if (title.length > maxChars) {
      // Split into multiple lines
      const words = title.split(' ');
      let lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        if ((currentLine + word).length <= maxChars) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      
      // Limit to 3 lines for larger nodes
      lines = lines.slice(0, 3);
      
      // Calculate vertical offset to center multi-line text
      const lineHeight = 1.1;
      const totalHeight = (lines.length - 1) * lineHeight;
      const startY = -totalHeight / 2;
      
      lines.forEach((line, i) => {
        textElement
          .append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? `${startY}em` : `${lineHeight}em`)
          .text(line);
      });
      
      // Add ellipsis if text was truncated
      if (title.length > maxChars * 3) {
        textElement.select('tspan:last-child').text(lines[lines.length - 1] + '...');
      }
    } else {
      textElement.text(title);
    }
  }, [node.title, level, node.id]);

  return (
    <g 
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(node)}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={onHoverOut}
    >
      {/* Glow effect for selected/highlighted nodes */}
      {(isSelected || isHighlighted) && (
        <circle
          r={getNodeSize(level, (node.title || '').length) + 6}
          fill="none"
          stroke={isSelected ? '#4a9eff' : '#fff'}
          strokeWidth="3"
          opacity={isSelected ? 0.8 : 0.4}
        />
      )}
      
      {/* Main node circle */}
      <circle
        ref={nodeRef}
        r={getNodeSize(level, (node.title || '').length)}
        fill={getNodeColor(level)}
        stroke={isSelected ? '#fff' : 'none'}
        strokeWidth={isSelected ? '2' : '0'}
        opacity={isHighlighted ? 0.8 : 1}
      />
      
      {/* Node text */}
      <text
        ref={textRef}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={level === 0 ? '18px' : '16px'}
        fontWeight={level === 0 ? 'bold' : 'normal'}
        pointerEvents="none"
      />
      
      {/* Expand/collapse indicator */}
      {node.children && node.children.length > 0 && (
        <circle
          cx={getNodeSize(level, (node.title || '').length) - 5}
          cy={-getNodeSize(level, (node.title || '').length) + 5}
          r="8"
          fill="#333"
          stroke="#fff"
          strokeWidth="1"
        />
      )}
      {node.children && node.children.length > 0 && (
        <text
          x={getNodeSize(level, (node.title || '').length) - 5}
          y={-getNodeSize(level, (node.title || '').length) + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="10px"
          pointerEvents="none"
        >
          {node._expanded ? '−' : '+'}
        </text>
      )}
    </g>
  );
};

export default Node;