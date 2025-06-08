import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styled from '@emotion/styled';

const TreeContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  overflow: hidden;
  position: relative;
  padding-top: 60px;
`;

const Legend = styled.div`
  position: absolute;
  top: 80px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 15px;
  color: white;
  font-size: 12px;
  max-width: 250px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const LegendSection = styled.div`
  margin-bottom: 15px;
`;

const LegendTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #4a90e2;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin: 8px 0;
  padding: 5px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
`;

const ColorDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${props => props.color};
`;

const ConnectionType = styled.div`
  display: flex;
  align-items: center;
  margin: 5px 0;
  padding: 3px 8px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
`;

const ControlButton = styled.button`
  position: absolute;
  top: ${props => props.top || '80px'};
  left: 20px;
  padding: 10px 20px;
  background: rgba(74, 144, 226, 0.9);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1000;

  &:hover {
    background: rgba(74, 144, 226, 1);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const RadialTree = ({ data, onNodeClick }) => {
  const svgRef = useRef(null);
  const [isOrganized, setIsOrganized] = useState(false);
  const [isChronological, setIsChronological] = useState(false);
  const simulationRef = useRef(null);
  const zoomRef = useRef(null);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });

  // Define colors for different epochs with opacity
  const epochColors = {
    'Античност': '#FF6B6B',
    'Средновековие': '#4ECDC4',
    'Класицизъм': '#45B7D1',
    'Романтизъм': '#96CEB4',
    'Възраждане': '#FFEEAD',
    'Модернизъм': '#D4A5A5',
    'Съвременност': '#9B59B6'
  };

  // Define connection types and their styles
  const connectionTypes = {
    'влияние': {
      color: '#4a90e2',
      dashArray: 'none',
      width: 2
    },
    'тематична връзка': {
      color: '#50C878',
      dashArray: '5,5',
      width: 2
    },
    'стилистична връзка': {
      color: '#FFD700',
      dashArray: '2,2',
      width: 2
    }
  };

  const organizeByEpoch = () => {
    if (!data || !simulationRef.current) return;

    // Store current transform
    const currentTransform = transformRef.current;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const epochs = Object.keys(epochColors);
    const radius = Math.min(width, height) * 0.35;
    
    // Group nodes by epoch
    const nodesByEpoch = epochs.reduce((acc, epoch) => {
      acc[epoch] = data.nodes.filter(node => node.epoch === epoch);
      return acc;
    }, {});

    // Calculate positions for each epoch in a circular layout
    const epochPositions = epochs.reduce((acc, epoch, i) => {
      const angle = (i * 2 * Math.PI) / epochs.length;
      acc[epoch] = {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        angle: angle
      };
      return acc;
    }, {});

    // Store epoch positions in the simulation for later use
    simulationRef.current.epochPositions = epochPositions;
    simulationRef.current.nodesByEpoch = nodesByEpoch;

    // Update node positions with dynamic spacing
    data.nodes.forEach(node => {
      const epochPos = epochPositions[node.epoch];
      if (epochPos) {
        const nodesInEpoch = nodesByEpoch[node.epoch].length;
        const nodeIndex = nodesByEpoch[node.epoch].indexOf(node);
        
        // Calculate base position
        const baseX = epochPos.x;
        const baseY = epochPos.y;
        
        // Calculate dynamic offset based on number of nodes in epoch
        const maxOffset = Math.min(80, 300 / nodesInEpoch);
        const angleOffset = (nodeIndex - (nodesInEpoch - 1) / 2) * (Math.PI / 6);
        
        // Calculate final position with offset
        const offsetX = Math.cos(epochPos.angle + angleOffset) * maxOffset;
        const offsetY = Math.sin(epochPos.angle + angleOffset) * maxOffset;
        
        node.fx = baseX + offsetX;
        node.fy = baseY + offsetY;
        node.epochBaseX = baseX;
        node.epochBaseY = baseY;
        node.maxOffset = maxOffset;
      }
    });

    // Restart simulation with new positions
    simulationRef.current.alpha(1).restart();
    setIsOrganized(true);

    // Restore transform
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).call(zoomRef.current.transform, currentTransform);
    }
  };

  const organizeByYear = () => {
    // Store current transform
    const currentTransform = transformRef.current;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Sort nodes by year
    const sortedNodes = [...data.nodes].sort((a, b) => a.year - b.year);
    
    // Calculate timeline parameters with more spacing
    const timelineWidth = width * 1.2;
    const timelineHeight = height * 0.7;
    const startX = -timelineWidth / 2;
    const endX = timelineWidth / 2;
    const yearRange = sortedNodes[sortedNodes.length - 1].year - sortedNodes[0].year;
    
    // Add more padding to year range for better spacing
    const paddingYears = yearRange * 0.2;
    const paddedStartYear = sortedNodes[0].year - paddingYears;
    const paddedEndYear = sortedNodes[sortedNodes.length - 1].year + paddingYears;
    const paddedYearRange = paddedEndYear - paddedStartYear;

    // Group nodes by epoch
    const nodesByEpoch = Object.keys(epochColors).reduce((acc, epoch) => {
      acc[epoch] = sortedNodes.filter(node => node.epoch === epoch);
      return acc;
    }, {});
    
    // Create timeline layout with improved spacing
    Object.entries(nodesByEpoch).forEach(([epoch, nodes], epochIndex) => {
      const baseY = (epochIndex - Object.keys(epochColors).length / 2) * 80;
      const zoneHeight = 100;
      const maxNodesInEpoch = Math.max(...Object.values(nodesByEpoch).map(nodes => nodes.length));
      const verticalSpacing = zoneHeight / (maxNodesInEpoch + 1);

      nodes.forEach((node, nodeIndex) => {
        // Calculate x position based on year with padding
        const yearProgress = (node.year - paddedStartYear) / paddedYearRange;
        const x = startX + (endX - startX) * yearProgress;
        
        // Calculate y position within the epoch zone
        const y = baseY - zoneHeight/2 + verticalSpacing * (nodeIndex + 1);
        
        node.fx = x;
        node.fy = y;
      });
    });

    // Add timeline visualization
    const svg = d3.select(svgRef.current);
    const g = svg.select("g");
    
    // Remove any existing timeline elements
    g.selectAll(".timeline").remove();
    
    // Add epoch background zones
    const epochs = Object.keys(epochColors);
    epochs.forEach((epoch, index) => {
      const y = (index - epochs.length / 2) * 80;
      const zoneHeight = 100;
      
      // Add background rectangle
      g.append("rect")
        .attr("class", "timeline")
        .attr("x", startX)
        .attr("y", y - zoneHeight/2)
        .attr("width", endX - startX)
        .attr("height", zoneHeight)
        .attr("fill", epochColors[epoch])
        .attr("fill-opacity", 0.1)
        .attr("stroke", epochColors[epoch])
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.3);
      
      // Add epoch label on the left
      g.append("text")
        .attr("class", "timeline")
        .attr("x", startX - 20)
        .attr("y", y)
        .attr("text-anchor", "end")
        .attr("fill", epochColors[epoch])
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(epoch);
    });
    
    // Add timeline line
    g.append("line")
      .attr("class", "timeline")
      .attr("x1", startX)
      .attr("y1", 0)
      .attr("x2", endX)
      .attr("y2", 0)
      .attr("stroke", "#4a90e2")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5");
    
    // Add year markers with improved spacing
    const yearStep = Math.max(1, Math.floor(paddedYearRange / 6));
    for (let year = Math.floor(paddedStartYear); year <= Math.ceil(paddedEndYear); year += yearStep) {
      const yearProgress = (year - paddedStartYear) / paddedYearRange;
      const x = startX + (endX - startX) * yearProgress;
      
      // Add marker line
      g.append("line")
        .attr("class", "timeline")
        .attr("x1", x)
        .attr("y1", -20)
        .attr("x2", x)
        .attr("y2", 20)
        .attr("stroke", "#4a90e2")
        .attr("stroke-width", 2);
      
      // Add year label with improved styling
      g.append("text")
        .attr("class", "timeline")
        .attr("x", x)
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .attr("fill", "#4a90e2")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(year);
    }

    // Restart simulation with new positions
    simulationRef.current.alpha(1).restart();
    setIsChronological(true);
    setIsOrganized(false);

    // Restore transform
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).call(zoomRef.current.transform, currentTransform);
    }
  };

  const resetPositions = () => {
    // Store current transform
    const currentTransform = transformRef.current;

    // Reset fixed positions and stored epoch data
    data.nodes.forEach(node => {
      node.fx = null;
      node.fy = null;
      node.epochBaseX = null;
      node.epochBaseY = null;
      node.maxOffset = null;
    });

    // Clear stored epoch data
    simulationRef.current.epochPositions = null;
    simulationRef.current.nodesByEpoch = null;

    // Remove timeline elements
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll(".timeline").remove();
    }

    // Restart simulation
    simulationRef.current.alpha(1).restart();
    setIsOrganized(false);
    setIsChronological(false);

    // Restore transform
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).call(zoomRef.current.transform, currentTransform);
    }
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        transformRef.current = event.transform;
      });

    // Apply zoom behavior to SVG
    svg.call(zoom);
    zoomRef.current = zoom;

    // Create main group for all elements
    const g = svg.append("g");

    // If in organized mode, add epoch zones
    if (isOrganized) {
      const epochs = Object.keys(epochColors);
      const radius = Math.min(width, height) * 0.35;
      
      // Group nodes by epoch
      const nodesByEpoch = epochs.reduce((acc, epoch) => {
        acc[epoch] = data.nodes.filter(node => node.epoch === epoch);
        return acc;
      }, {});

      // Calculate positions for each epoch in a circular layout
      const epochPositions = epochs.reduce((acc, epoch, i) => {
        const angle = (i * 2 * Math.PI) / epochs.length;
        acc[epoch] = {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          angle: angle
        };
        return acc;
      }, {});

      // Draw epoch zones
      epochs.forEach(epoch => {
        const nodesInEpoch = nodesByEpoch[epoch].length;
        const zoneRadius = Math.max(80, Math.min(150, 300 / nodesInEpoch));
        const pos = epochPositions[epoch];

        // Add zone circle
        g.append("circle")
          .attr("cx", pos.x)
          .attr("cy", pos.y)
          .attr("r", zoneRadius)
          .attr("fill", epochColors[epoch])
          .attr("fill-opacity", 0.1)
          .attr("stroke", epochColors[epoch])
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.3);

        // Add epoch label
        g.append("text")
          .attr("x", pos.x)
          .attr("y", pos.y)
          .attr("text-anchor", "middle")
          .attr("dy", "0.3em")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("fill", epochColors[epoch])
          .text(`${epoch} (${nodesInEpoch})`);
      });
    }

    // Create a map of nodes by id
    const nodesMap = new Map(data.nodes.map(node => [node.id, node]));

    // Create links array with enhanced information
    const links = data.edges.map(edge => ({
      source: nodesMap.get(edge.source),
      target: nodesMap.get(edge.target),
      type: edge.type,
      description: edge.description,
      style: connectionTypes[edge.type] || connectionTypes['тематична връзка']
    }));

    // Create force simulation with adjusted parameters
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(200)
        .strength(0.4))
      .force("charge", d3.forceManyBody()
        .strength(-300)
        .distanceMax(400))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide()
        .radius(80)
        .strength(0.9));

    // Store simulation reference
    simulationRef.current = simulation;

    // Draw links with enhanced styling
    const link = g.append("g")
      .selectAll("g")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link-group");

    // Add lines with connection type styling
    link.append("line")
      .attr("stroke", d => d.style.color)
      .attr("stroke-width", d => d.style.width)
      .attr("stroke-dasharray", d => d.style.dashArray)
      .attr("stroke-opacity", 0.7);

    // Add a transparent, wider line for easier hover detection
    link.append("line")
      .attr("stroke", "transparent")
      .attr("stroke-width", d => d.style.width * 11) // Increased from 5 to 8 for more sensitivity
      .attr("cursor", "pointer"); // Indicate it's clickable/hoverable

    // Add arrows with connection type styling
    link.append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", d => d.style.color)
      .attr("opacity", 0.7);

    // Add tooltip container for more detailed information
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "edge-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("font-size", "14px")
      .style("max-width", "300px")
      .style("z-index", "1000")
      .style("pointer-events", "none");

    // Add mouseover and mouseout events for links
    link.on("mouseover", function(event, d) {
      // Visual feedback on hover
      d3.select(this).selectAll("line")
        .transition()
        .duration(200)
        .attr("stroke-width", d.style.width * 2)
        .attr("stroke-opacity", 1);

      d3.select(this).selectAll("path")
        .transition()
        .duration(200)
        .attr("opacity", 1)
        .attr("transform", d_arrow => {
          const dx = d_arrow.target.x - d_arrow.source.x;
          const dy = d_arrow.target.y - d_arrow.source.y;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return `translate(${d_arrow.target.x},${d_arrow.target.y}) rotate(${angle}) scale(1.2)`;
        });

      // Tooltip logic
      tooltip
        .style("visibility", "visible")
        .html(`
          <div style="margin-bottom: 5px; color: ${d.style.color}; font-weight: bold;">
            ${d.type.toUpperCase()}
          </div>
          <div style="font-size: 12px; line-height: 1.4;">
            ${d.description}
          </div>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .classed("visible", true);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function(event, d) {
      // Reset visual feedback on mouseout
      d3.select(this).selectAll("line")
        .transition()
        .duration(200)
        .attr("stroke-width", d.style.width)
        .attr("stroke-opacity", 0.7);

      d3.select(this).selectAll("path")
        .transition()
        .duration(200)
        .attr("opacity", 0.7)
        .attr("transform", d_arrow => {
          const dx = d_arrow.target.x - d_arrow.source.x;
          const dy = d_arrow.target.y - d_arrow.source.y;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return `translate(${d_arrow.target.x},${d_arrow.target.y}) rotate(${angle})`;
        });

      // Tooltip logic
      tooltip
        .classed("visible", false)
        .style("visibility", "hidden");
    });

    // Update node drawing with click handling
    const node = g.selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        // Store current transform before handling click
        const currentTransform = transformRef.current;
        
        // Call the onNodeClick handler
        onNodeClick(d);
        
        // Restore transform after click
        if (zoomRef.current && svgRef.current) {
          d3.select(svgRef.current).call(zoomRef.current.transform, currentTransform);
        }
      });

    // Add circles to nodes with epoch-based colors and hover effect
    node.append("circle")
      .attr("r", 10)
      .attr("fill", d => epochColors[d.epoch] || "#fff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 12)
          .attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 10)
          .attr("stroke-width", 2);
      });

    // Add labels with enhanced styling
    const labels = node.append("g")
      .attr("class", "label-group");

    // Add background for better readability
    labels.append("rect")
      .attr("x", -70)
      .attr("y", -25)
      .attr("width", 140)
      .attr("height", 25)
      .attr("fill", "rgba(0, 0, 0, 0.8)")
      .attr("rx", 12);

    // Add title
    labels.append("text")
      .attr("dy", "-10")
      .attr("text-anchor", "middle")
      .text(d => d.title)
      .style("fill", "#fff")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("font-family", "Arial");

    // Add epoch
    labels.append("text")
      .attr("dy", "5")
      .attr("text-anchor", "middle")
      .text(d => d.epoch)
      .style("fill", "#aaa")
      .style("font-size", "10px")
      .style("font-family", "Arial");

    // Update positions on each tick
    simulation.on("tick", () => {
      // Keep nodes within bounds
      data.nodes.forEach(d => {
        d.x = Math.max(-width/2 + 150, Math.min(width/2 - 150, d.x));
        d.y = Math.max(-height/2 + 150, Math.min(height/2 - 150, d.y));
      });

      // Update link positions
      link.selectAll("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      // Update arrow positions
      link.selectAll("path")
        .attr("transform", d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return `translate(${d.target.x},${d.target.y}) rotate(${angle})`;
        });

      // Update node positions
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Update drag functions to respect zones in organized mode
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      if (isOrganized && simulationRef.current.epochPositions) {
        const node = event.subject;
        const epochPos = simulationRef.current.epochPositions[node.epoch];
        
        if (epochPos) {
          // Calculate distance from epoch center
          const dx = event.x - epochPos.x;
          const dy = event.y - epochPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If distance is greater than maxOffset, limit the position
          if (distance > node.maxOffset) {
            const angle = Math.atan2(dy, dx);
            event.subject.fx = epochPos.x + Math.cos(angle) * node.maxOffset;
            event.subject.fy = epochPos.y + Math.sin(angle) * node.maxOffset;
          } else {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          }
        }
      } else {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      if (!isOrganized) {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }

    // Store initial transform
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.8);
    svg.call(zoom.transform, initialTransform);
    transformRef.current = initialTransform;

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [data, onNodeClick, isOrganized]);

  return (
    <TreeContainer>
      <svg ref={svgRef}></svg>
      {isOrganized || isChronological ? (
        <ControlButton onClick={resetPositions}>
          Разпръсни
        </ControlButton>
      ) : (
        <>
          <ControlButton onClick={organizeByEpoch}>
            Организирай по епохи
          </ControlButton>
          <ControlButton top="130px" onClick={organizeByYear}>
            Организирай хронологично
          </ControlButton>
        </>
      )}
      <Legend>
        <LegendSection>
          <LegendTitle>Епохи</LegendTitle>
          {Object.entries(epochColors).map(([epoch, color]) => (
            <LegendItem key={epoch}>
              <ColorDot color={color} />
              {epoch}
            </LegendItem>
          ))}
        </LegendSection>
        <LegendSection>
          <LegendTitle>Типове връзки</LegendTitle>
          {Object.entries(connectionTypes).map(([type, style]) => (
            <ConnectionType key={type}>
              <div style={{
                width: '20px',
                height: '2px',
                background: style.color,
                marginRight: '8px',
                borderStyle: style.dashArray === 'none' ? 'solid' : 'dashed',
                borderWidth: '2px',
                borderColor: style.color
              }} />
              {type}
            </ConnectionType>
          ))}
        </LegendSection>
      </Legend>
    </TreeContainer>
  );
};

export default RadialTree; 