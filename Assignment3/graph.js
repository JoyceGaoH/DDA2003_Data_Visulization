const margin = {top: 25, right: 20, bottom: 20, left: 35},
  width = 800 - margin.left - margin.right,
  height = 800 - margin.top - margin.bottom;

const svg = d3.select("#force-directed-graph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",`translate(${margin.left}, ${margin.top})`);

d3.json("data/miserables.json").then( function(data) {
  // get data array
  const links = data.links
  const nodes = data.nodes
  const linkStrokeWidth = d3.map(links, d => Math.sqrt(d.value)/1.5)
  const nodeGroup = d3.map(nodes, d => d.group) 
  const nodeid = d3.map(nodes, d => d.id) 
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
  

  // define the force simulation

  const simulation = d3.forceSimulation(nodes)                 
      .force("link", d3.forceLink().id(function(d) { return d.id; }).links(links))
      .force("charge", d3.forceManyBody().strength(-50).distanceMax(1500))      
      .force("center", d3.forceCenter(width / 2, height / 2)) 
      .force('collision', d3.forceCollide().radius(function(d) {return d.radius}))
      .on("tick", ticked);

  // define the links
  const linkElements = svg.append('g')
    .selectAll("line")
    .data(links)
    .join("line")
    .style("stroke", "#000")
    .style("stroke-width", (d, i) => linkStrokeWidth[i]);

  // define the nodes
  const nodeElements = svg.append('g')
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 6)
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .style("fill", (d, i) => colorScale(nodeGroup[i]))
    .call(drag(simulation));

  //define the words
  const textElements = svg.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .text((node) => node.id)
    .attr('font-size', 12)
    .style("color", "#000")
    .attr('dx', 15)
    .attr('dy', 4)
    .style("opacity", 0)
    

  // This function is run at each iteration of the force algorithm, updating the nodes position.
  function ticked() {
    linkElements
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    nodeElements
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    textElements
        .attr("dx", function (d) { return d.x+15; })
        .attr("dy", function(d) { return d.y-5; });
      
  }

  // define drag 
  function drag(simulation) {    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // deal with connection  interactions 
  function fade(neighbors) {
    nodeElements.transition()
      .duration(100)
      .style('opacity', (d, i) => getNode(nodeid[i], neighbors))
    
    linkElements.transition()
      .duration(100)
      .style('opacity', (d, i) => getLink(snode, links[i]))
  }

  function isConnected(node, link) {
    var isconnect = new Boolean()
    isconnect = link.target.id === node.id || link.source.id === node.id
    return isconnect
  }

  function getNeighbors(event) {
    sNode = event.target.__data__
    return links.reduce(
      (neighbors, link) => {
        if (link.target.id === sNode.id) {
          neighbors.push(link.source.id)
        } else if (link.source.id === sNode.id) {
          neighbors.push(link.target.id)
        }
        return neighbors
      },
      [sNode.id]
    )
  }  
  
  function getLink(node, link) {
    return isConnected(node, link) ? 1 : 0.4
  }

  function getNode(node, neighbors) {
    if (neighbors.indexOf(node) == -1) { 
      return 0.4
    }
    else{
      return 1
    }
  }

  function getText(node, neighbors) {
    if (neighbors.indexOf(node) == -1) { 
      return 0
    }
    else{
      return 1
    }
  }

  function onMouseEnter(event) {
    const neighbors = getNeighbors(event)
    snode = event.target.__data__
    fade(neighbors)
    textElements.transition()
      .duration(100)
      .style('opacity', (d, i) => getText(nodeid[i], neighbors))
  }

  function onMouseLeave() {
    nodeElements.transition()
        .duration(100)
        .style("opacity", 1)
    linkElements.transition()
        .duration(100)
        .style("opacity", 1)
    textElements.transition()
    .duration(100)
    .style("opacity", 0)
  }
    
  nodeElements
    .on('mouseenter', onMouseEnter)
    .on("mouseleave", onMouseLeave)
  
});

