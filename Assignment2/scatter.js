async function drawScatter() {

  // access data
  const dataset = await d3.json("./data/my_weather_data.json")
  // set data constants
  // Get data attributes
  // xAccessor for max temperature and yAccessor for min temperature 
  const xAccessor = d => d.temperatureMin
  const yAccessor = d => d.temperatureMax
  // colorAccessor for the date in year, with year fixed at 2000, month&day changes
  const colorScaleYear = 2000
  const parseDate = d3.timeParse("%Y-%m-%d")
  const colorAccessor = d => parseDate(d.date).setYear(colorScaleYear)

  // Create chart dimensions
  const width = d3.min([
    window.innerWidth * 0.75,
    window.innerHeight * 0.75,
  ])
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 90,
      right: 90,
      bottom: 50,
      left: 50,
    },
    legendWidth: 250,
    legendHeight: 26,
    histoHeight: 50,
    histoMargin: 100,
  }
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  // Draw the ground for chart
  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
    .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)
  
  // a rect background for the chart, colored white in css
  const boundsBackground = bounds.append("rect")
      .attr("class", "bounds-background")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", 0)
      .attr("height", dimensions.boundedHeight)

  // Create scales for x, y, and color 
  const xScale = d3.scaleLinear()
    .domain([0,100])
    .range([0, dimensions.boundedWidth])
    .nice()

  const yScale = d3.scaleLinear()
    .domain([0,100])
    .range([dimensions.boundedHeight, 0])
    .nice()

  const colorScale = d3.scaleSequential()
    .domain([d3.timeParse("%m/%d/%Y")(`1/1/2000`),d3.timeParse("%m/%d/%Y")(`12/31/2000`)])
    .interpolator(d => d3.interpolateRainbow(-d))
  
  // draw data into a scatter plot
  const dotsGroup = bounds.append("g")
  const dots = dotsGroup.selectAll(".dot")
    .data(dataset, d => d[0])
    .join("circle")
    .attr("class", "dot")
    .attr("r", 4)
    .attr("cx", d => xScale(xAccessor(d)))
    .attr("cy", d => yScale(yAccessor(d)))
    .style("fill", d => colorScale(colorAccessor(d)))

  // Draw x axis and y axis
  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .ticks(4)

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  const xAxisLabel = xAxis.append("text")
      .attr("class", "x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .html("Minimum Temperature (&deg;F)")

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(4)

  const yAxis = bounds.append("g")
      .call(yAxisGenerator)

  const yAxisLabel = yAxis.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 10)
      .html("Maximum Temperature (&deg;F)")

  // draw histograms for x axis
  const marginalHistoX = d3.histogram()
    .domain([0,100])
    .value(xAccessor)
    .thresholds(50)
    
  const marginalBinsX = marginalHistoX(dataset)
  const histoScaleX = d3.scaleLinear()
    .domain(d3.extent(marginalBinsX, d => d.length))
    .range([dimensions.histoHeight, 0])
  
  const histoSvgX = bounds.append("g")
    .attr("transform", `translate(0, ${dimensions.histoHeight - dimensions.histoMargin})`)
  
  const histoAreaX = d3.area()
    .x(d => xScale((d.x0 + d.x1) / 2))
    .y0(dimensions.histoHeight)
    .y1(d => histoScaleX(d.length))
    .curve(d3.curveBasis)
  
  const histoX = histoSvgX.append("path")
    .attr("class", "histogram-area")
    .attr("d", d => histoAreaX(marginalBinsX))
    
  // LEGEND
  // draw legend 
  const legendGroup = bounds.append("g")
      .attr("transform", `translate(${dimensions.boundedWidth - dimensions.legendWidth - 9},
        ${dimensions.boundedHeight - 37})`)
  const defs = wrapper.append("defs")
  const numberOfGradientStops = 10
  const stops = d3.range(numberOfGradientStops).map(i => (i / (numberOfGradientStops - 1)))
  const legendGradientId = "legend-gradient"
  const gradient = defs.append("linearGradient")
    .attr("id", legendGradientId)
    .selectAll("stop")
    .data(stops)
    .join("stop")
      .attr("stop-color", d => d3.interpolateRainbow(-d))
      .attr("offset", d => `${d * 100}%`)
  // draw the legend
  const legendGradient = legendGroup.append("rect")
      .attr("height", dimensions.legendHeight)
      .attr("width", dimensions.legendWidth)
      .style("fill", `url(#${legendGradientId})`)
  // add ticks to the legend
  const tickValues = [
    d3.timeParse("%m/%d/%Y")(`4/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`7/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`10/1/${colorScaleYear}`)]
  // scale the position of the ticks on legend
  const legendTickScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, dimensions.legendWidth])
  // add text of tick value (month) to the legend
  const legendValues = legendGroup.selectAll(".legend-value")
    .data(tickValues)
    .join("text")
      .attr("class", "legend-value")
      .attr("x", legendTickScale)
      .attr("y", -6)
      .text(d3.timeFormat("%b"))
  // add small line under the text to indicate position on legend 
  const legendValueTicks = legendGroup.selectAll(".legend-tick")
    .data(tickValues)
    .join("line")
      .attr("class", "legend-tick")
      .attr("x1", legendTickScale)
      .attr("x2", legendTickScale)
      .attr("y1", 6)
  
  //TOOLTIPS AND INTERACTION
  // create tooltips
  const tooltip = d3.select("#tooltip")
  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d)),
  )
  const voronoiPolygons = delaunay.voronoi()
  voronoiPolygons.xmax = dimensions.boundedWidth
  voronoiPolygons.ymax = dimensions.boundedHeight

  const voronoi = dotsGroup.selectAll(".voronoi")
    .data(dataset)
      .join("path")
      .attr("class", "voronoi")
      .attr("d", (d,i) => voronoiPolygons.renderCell(i))

  // add two mouse events in the tooltip
  voronoi.on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave)

  const hoverElementsGroup = bounds.append("g")
      .attr("opacity", 0)

  const hoverCircle = hoverElementsGroup.append("circle")
      .attr("class", "tooltip-dot")
  
  // two functions: mouse enter and mouse leave
  function onMouseEnter(e, datum) {
    // get the temperature 
    const formatTemperature = d3.format(".1f")
    tooltip.select("#max-temperature")
      .text(formatTemperature(yAccessor(datum)))
    tooltip.select("#min-temperature")
      .text(formatTemperature(xAccessor(datum)))
    
    // get the date
    const formatDate = d3.timeFormat("%A, %B %-d, %Y")
    tooltip.select("#date")
      .text(formatDate(parseDate(datum.date)))
    
    // get x and y value 
    const tx = xScale(xAccessor(datum)) + dimensions.margin.left
    const ty = yScale(yAccessor(datum)) + dimensions.margin.top 
    
    // adjusting tooltip position
    tooltip.style("transform", `translate(`+`calc( -50% + ${tx}px),`
    + `calc(-100% + ${ty}px)`+`)`)

    // make tooltip visible
    tooltip.style("opacity", 1)
    hoverElementsGroup.style("opacity", 1)
    // add a circle when mouse hover
    hoverCircle.attr("cx", xScale(xAccessor(datum)))
      .attr("cy", yScale(yAccessor(datum)))
      .attr("r", 7)
  }

  function onMouseLeave() {
    // make tooltip and circle invisible
    hoverElementsGroup.style("opacity", 0)
    tooltip.style("opacity", 0)
  }

  // LEGEND INTERACTION 
  // add two mouse actions on the legend
  legendGradient.on("mousemove", onLegendMouseMove)
    .on("mouseleave", onLegendMouseLeave)
  // create g element for the highlight bar
  const legendHighlightBarWidth = dimensions.legendWidth * 0.05
  const legendHighlightGroup = legendGroup.append("g")
      .attr("opacity", 0)
  // legendHighlightBar: create rect to represent the highlight bar
  const legendHighlightBar = legendHighlightGroup.append("rect")
      .attr("class", "legend-highlight-bar")
      .attr("width", legendHighlightBarWidth)
      .attr("height", dimensions.legendHeight)
  // legendHighlightText: append text to the highlight bar
  const legendHighlightText = legendHighlightGroup.append("text")
      .attr("class", "legend-highlight-text")
      .attr("x", legendHighlightBarWidth / 2)
      .attr("y", -6)
  
  function onLegendMouseMove(event) {
    // Display the data only when the data are in the selected date range.
    const [x] = d3.pointer(event)
    const min = new Date(legendTickScale.invert(x-legendHighlightBarWidth))
    const max = new Date(legendTickScale.invert(x+legendHighlightBarWidth))
    const barX = d3.median([0, x - legendHighlightBarWidth/2, dimensions.legendWidth-legendHighlightBarWidth,])
    legendHighlightGroup.style("opacity", 1)
      .style("transform", `translateX(${barX}px)`)
    const formatLegendDate = d3.timeFormat("%b %d")
    legendHighlightText.text([formatLegendDate(min),
      formatLegendDate(max),].join(" - "))
    // hide the legend tick when mouse hover
    legendValues.style("opacity", 0)
    legendValueTicks.style("opacity", 0)
    // hide the dots
    dots.transition()
        .duration(100)
        .style("opacity", 0.08)
        .attr("r", 2)

    const getYear = d => +d3.timeFormat("%Y")(d)
    // Given a datum, judge whether the datum is in a datum range. Return True or False. 
    const isDayWithinRange = d => {
      const date = colorAccessor(d)
      if (getYear(min) < colorScaleYear) {
        return date >= new Date(min).setYear(colorScaleYear) || date <= max
      } else if (getYear(max) > colorScaleYear) {
        return date <= new Date(max).setYear(colorScaleYear) || date >= min
      } else {
        return date >= min && date <= max
      }
    }
    // highlight the related dots
    dots.filter(isDayWithinRange)
      .transition()
      .duration(500)
      .style("opacity", 1)
      .attr("r", 7)
  }

  function onLegendMouseLeave() {
    dotsGroup.selectAll(".dot")
      .transition()
      .duration(500)
      .style("opacity", 1)
      .attr("r", 4)

    legendHighlightGroup.style("opacity", 0)
    legendValues.style("opacity", 1)
    legendValueTicks.style("opacity", 1)
  }

}
drawScatter()