// Function to update the map size dynamically
function updateMapSize() {
  const width = window.innerWidth;  // Get the window width
  const height = window.innerHeight;  // Get the window height

  // Update SVG size based on the window size
  d3.select("svg")
      .attr("width", width)
      .attr("height", height);

  // Update projection to recalculate based on new dimensions
  projection.translate([width / 2, height / 2]);

  // Re-render paths with updated projection
  svg.selectAll("path").attr("d", path);
}

// Initial SVG setup
const projection = d3.geoMercator()
                   .center([103.8198, 1.3521])  // Singapore coordinates
                   .scale(120000)  // Increase the scale value for a larger map
                   .translate([window.innerWidth / 2, window.innerHeight / 2]);

const path = d3.geoPath().projection(projection);

// Create SVG container for the map
const svg = d3.select("#map")
            .append("svg")
            .attr("width", window.innerWidth)
            .attr("height", window.innerHeight);

// Load the GeoJSON and CSV data
Promise.all([
  d3.json('singapore-subzones.json'),  // GeoJSON data for subzones
  d3.csv('singapore-population.csv')   // Population data
]).then(([subzones, population]) => {
  const populationMap = new Map();
  population.forEach(d => {
      populationMap.set(d.subzone, +d.population);  // Create map for population data
  });

  // Define color scale using pastel purple colors
  const colorScale = d3.scaleQuantize()
                       .domain([0, d3.max(population, d => +d.population)])
                       .range([
                          "#E0D4F3", "#D0B0E4", "#C28FDE", "#A875D1", "#9A62C8", 
                          "#8C4FBA", "#7E3CA7", "#6E2894", "#5F157C"
                       ]);

  // Bind data to subzone shapes
  svg.selectAll("path")
     .data(subzones.features)
     .enter()
     .append("path")
     .attr("d", path)
     .attr("fill", d => {
         const populationData = populationMap.get(d.properties.subzone) || 0;
         return colorScale(populationData);
     })
     .attr("stroke", "#fff")
     .attr("stroke-width", 0.5)
     .on("mouseover", function(event, d) {
         const populationData = populationMap.get(d.properties.subzone) || 0;
         d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
         svg.append("text")
            .attr("id", "tooltip")
            .attr("x", event.pageX + 10)
            .attr("y", event.pageY - 10)
            .text(`Subzone: ${d.properties.subzone}, Population: ${populationData}`);
     })
     .on("mouseout", function() {
         d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
         d3.select("#tooltip").remove();
     });

  // Add a legend for the color scale
  const legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20, 20)");

  const legendLinear = d3.legendColor()
                        .shapeWidth(30)
                        .orient('vertical')
                        .scale(colorScale);

  svg.append("g")
     .attr("class", "legend")
     .attr("transform", "translate(800, 20)")
     .call(legendLinear);
});

// Update map size when the window is resized
window.addEventListener('resize', updateMapSize);