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
    const colors = ['#4a9eff', '#4caf50', '#ff9800', '#9c27b0'];
    return colors[level % colors.length];
  };

  const getNodeSize = (level) => {
    const sizes = [40, 30, 25, 20];
    return sizes[Math.min(level, sizes.length - 1)];
  };

  useEffect(() => {
    const nodeElement = d3.select(nodeRef.current);
    const textElement = d3.select(textRef.current);
    
    // Animate node appearance
    nodeElement
      .transition()
      .duration(300)
      .attr('r', getNodeSize(level))
      .attr('fill', getNodeColor(level));

    // Handle text wrapping for longer titles
    const words = node.title.split(' ');
    textElement.selectAll('*').remove();
    
    if (words.length > 2) {
      // Multi-line text for longer titles
      words.forEach((word, i) => {
        if (i < 2) {
          textElement
            .append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? '0.3em' : '1.2em')
            .text(word);
        }
      });
      if (words.length > 2) {
        textElement
          .append('tspan')
          .attr('x', 0)
          .attr('dy', '1.2em')
          .text('...');
      }
    } else {
      textElement.text(node.title);
    }
  }, [node.title, level]);

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
          r={getNodeSize(level) + 8}
          fill="none"
          stroke={isSelected ? '#4a9eff' : '#666'}
          strokeWidth="2"
          opacity="0.6"
        />
      )}
      
      {/* Main node circle */}
      <circle
        ref={nodeRef}
        r={getNodeSize(level)}
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
        fontSize={level === 0 ? '12px' : '10px'}
        fontWeight={level === 0 ? 'bold' : 'normal'}
        pointerEvents="none"
      />
      
      {/* Expand/collapse indicator */}
      {node.children && node.children.length > 0 && (
        <circle
          cx={getNodeSize(level) - 5}
          cy={-getNodeSize(level) + 5}
          r="8"
          fill="#333"
          stroke="#fff"
          strokeWidth="1"
        />
      )}
      {node.children && node.children.length > 0 && (
        <text
          x={getNodeSize(level) - 5}
          y={-getNodeSize(level) + 5}
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