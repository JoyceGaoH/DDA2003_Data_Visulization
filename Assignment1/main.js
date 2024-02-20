// set the dimensions and margins of the graph
const margin = {top: 40, right: 40, bottom: 60, left: 80},
    width = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#bar-chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)



d3.csv('data/A1_Data.csv').then( function(data) { 

  var option = ['Bar chart','Stacked bar chart','Sorted stacked bar chart']
  var keys = data.columns.slice(1)
  var dataOne = data
  dataOne.forEach(function(d) {
			d.total = d3.sum(keys, k => +d[k])
			return d
		})
  var totalValue = Array.from(dataOne.map(d => d.total))
  
  // add the options to the drop-down list
  d3.select("#display-type-selection")
    .selectAll('myOptions')
    .data(option)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr('value', function (d) { return d; }) // corresponding value returned by the button


  // add the x Axis
  const x = d3.scaleBand()
    .domain(data.map(d=>d.State))
    .range([0, width])
    .padding(0.2);
  const xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  
  // add the y Axis
  const y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(data, d => d.total)])
            .nice();

  const yAxis = svg.append("g")
      .call(d3.axisLeft(y));
  

  // add y label 
  svg.append("text")
     .attr("class", "ylabel")
     .attr("y", 0 - margin.left+50)
     .attr("x", 0 - (height/30))
     .attr("dy", "1em")
     .attr("transform", "rotate(0)")
     .style("text-anchor", "middle")
     .text("Population");

  // bar chart
  svg.selectAll("rect")
    .data(data)
    .join("rect")
      .attr("x", d => x(d.State))
      .attr("y", d => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.total))
      .style("fill", "#69b3a2")
  
  const colorScale = d3.scaleOrdinal()
                       .range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69"])
                       .domain(keys)
  
  var stackData = d3.stack()
                 .keys(keys)
                 .order(d3.stackOrderNone)(data)
  
  var dataSorted = dataOne.sort((a, b) => d3.descending(a.total, b.total))

  var stackDataSorted = d3.stack()
                 .keys(keys)
                 .order(d3.stackOrderNone)(dataSorted)
  
  function update(selectedGroup) {
    if (selectedGroup == 'Bar chart') {
      // Visualize Bar Chart
      svg.selectAll('rect').remove()
      svg.selectAll("rect")
        .data(data)
        .join("rect")
          .attr("x", d => x(d.State))
          .attr("y", d => y(d.total))
          .attr("width", x.bandwidth())
          .attr("height", d => height - y(d.total))
          .style("fill", "#69b3a2")
        
    }
    else if (selectedGroup =='Stacked bar chart') {
      // Visualize Stacked Bar Chart
      svg.selectAll('rect').remove()
      svg.append("g")
        .selectAll("g")
        .data(stackData)
        .join("g")
          .attr("fill", function(d) { return colorScale(d.key); })
          .selectAll("rect")
            .data(d => d)
            .join("rect")
              .attr("x", d => x(d.data.State))
              .attr("y", d => y(d[1]))
              .attr("height", d => y(d[0]) - y(d[1]))
              .attr("width",x.bandwidth())

      var size = 10
      svg.selectAll("mydots")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", 1000)
        .attr("y", function(d,i){ return 30 + i*(size+5)}) 
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return colorScale(d)})
      
      svg.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("x", 1000 + size*1.3)
        .attr("y", function(d,i){ return 38 + i*(size+5) + (size/3)}) 
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")


    }
    else if (selectedGroup =='Sorted stacked bar chart') {
      // Visualize Sorted Stacked Bar Chart
      svg.selectAll('rect').remove()
      x.domain(dataSorted.map(d => d.State))
      xAxis.call(d3.axisBottom(x))
      svg.append("g")
        .selectAll("g")
        .data(stackDataSorted)
        .join("g")
          .attr("fill", function(d) { return colorScale(d.key); })
          .selectAll("rect")
            .data(d => d)
            .join("rect")
              .attr("x", d => x(d.data.State))
              .attr("y", d => y(d[1]))
              .attr("height", d => y(d[0]) - y(d[1]))
              .attr("width",x.bandwidth())

      var size = 10
      svg.selectAll("mydots")
        .data(keys)
        .enter()
        .append("rect")
        .attr("x", 1000)
        .attr("y", function(d,i){ return 30 + i*(size+5)}) 
        .attr("width", size)
        .attr("height", size)
        .style("fill", function(d){ return colorScale(d)})

      svg.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("x", 1000 + size*1.3)
        .attr("y", function(d,i){ return 38 + i*(size+5) + (size/3)}) 
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")

    }
  }

  
  d3.select("#display-type-selection").on("change", function(){
    selectedGroup = d3.select(this).property('value')
    update(selectedGroup)
  })

});

 
