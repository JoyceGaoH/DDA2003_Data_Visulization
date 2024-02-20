async function drawMap() {

  // 1. Access data
  const countryShapes = await d3.json("./data/world-geojson.json")
  const dataset = await d3.csv("./data/data_bank_data.csv")

  const countryNameAccessor = d => d.properties["NAME"]
  const countryIdAccessor = d => d.properties["ADM0_A3_IS"]
  const metric = "Population growth (annual %)"
  let Country_MetricData = {}
  // Process Data 
  dataset.forEach(d => {
    if (d["Series Name"] != metric) return 
    Country_MetricData[d["Country Code"]] = +d["2017 [YR2017]"] || 0})

  // 2. Create chart dimensions
  let dimensions = {
    width: window.innerWidth * 0.9,
    margin: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    },
  }
  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  // Projection
  const sphere = ({type: "Sphere"})
  const projection = d3.geoEqualEarth()
    .fitWidth(dimensions.boundedWidth, sphere)
  const pathGenerator = d3.geoPath(projection)
  const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere)

  dimensions.boundedHeight = y1
  dimensions.height = dimensions.boundedHeight + dimensions.margin.top + dimensions.margin.bottom

  // 3. Draw canvas
  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
      .style("transform", `translate(${
        dimensions.margin.left
      }px, ${
        dimensions.margin.top
      }px)`)

  // 4. Create scales
  const CountryValues = Object.values(Country_MetricData)
  const maxChange = 4.7
  const colorScale = d3.scaleLinear()
      .domain([-maxChange, 0, maxChange])
      .range(["indigo", "white", "darkgreen"])

  // 5. Draw data
   const draw_earth = bounds.append("path")
    .attr("class", "earth")
    .attr("d", pathGenerator(sphere))

  const graticuleJson = d3.geoGraticule10()
  const draw_graticule = bounds.append("path")
    .attr("class", "graticule")
    .attr("d", pathGenerator(graticuleJson))

  const draw_country = bounds.selectAll(".country")
    .data(countryShapes.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", pathGenerator)
    .attr("fill", d => {
      const value = Country_MetricData[countryIdAccessor(d)]
      if (typeof value == "undefined") return "grey"
      else {
        return colorScale(value)}
    })
  
  // 6. Draw peripherals
  const legendGroup = wrapper.append("g")
      .attr("transform", `translate(${
        120
      },${
        dimensions.width < 800
        ? dimensions.boundedHeight - 30
        : dimensions.boundedHeight * 0.5
      })`)

  const legendTitle = legendGroup.append("text")
      .attr("y", -23)
      .attr("class", "legend-title")
      .text("Population growth")

  const legendByline = legendGroup.append("text")
      .attr("y", -9)
      .attr("class", "legend-byline")
      .text("Percent change in 2017")

  const defs = wrapper.append("defs")
  const legendGradientId = "legend-gradient"
  const gradient = defs.append("linearGradient")
      .attr("id", legendGradientId)
    .selectAll("stop")
    .data(colorScale.range())
    .join("stop")
      .attr("stop-color", d => d)
      .attr("offset", (d, i) => `${
        i * 100 / 2 // 2 is one less than our array's length
      }%`)

  const legendWidth = 120
  const legendHeight = 16
  const legendGradient = legendGroup.append("rect")
      .attr("x", -legendWidth / 2)
      .attr("height", legendHeight)
      .attr("width", legendWidth)
      .style("fill", `url(#${legendGradientId})`)

  const legendValueRight = legendGroup.append("text")
      .attr("class", "legend-value")
      .attr("x", legendWidth / 2 + 10)
      .attr("y", legendHeight / 2)
      .text(`${d3.format(".1f")(maxChange)}%`)

  const legendValueLeft = legendGroup.append("text")
      .attr("class", "legend-value")
      .attr("x", -legendWidth / 2 - 10)
      .attr("y", legendHeight / 2)
      .text(`${d3.format(".1f")(-maxChange)}%`)
      .style("text-anchor", "end")

  navigator.geolocation.getCurrentPosition(myPosition => {
    const [x, y] = projection([
      myPosition.coords.longitude,
      myPosition.coords.latitude
    ])
    const myLocation = bounds.append("circle")
        .attr("class", "my-location")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 0)
        .transition().duration(500)
        .attr("r", 10)
  })

  // 7. Set up interactions
  draw_country.on("mouseenter", onMouseEnter)
      .on("mouseleave", onMouseLeave)

  const tooltip = d3.select("#tooltip")
  function onMouseEnter(e, datum) {
    tooltip.style("opacity", 1)
    const v = Country_MetricData[countryIdAccessor(datum)]
    tooltip.select("#value")
        .text(`${d3.format(",.2f")(v || 0)}%`)
    tooltip.select("#country")
        .text(countryNameAccessor(datum))
    // adjust the position
    const [centerX, centerY] = pathGenerator.centroid(datum)
    tooltip.style("transform", `translate(`+ `calc( -50% + ${centerX}px),`+ `calc(-100% + ${centerY}px)`+ `)`)}

  function onMouseLeave() {
    tooltip.style("opacity", 0)
  }
}
drawMap()