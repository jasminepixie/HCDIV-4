// Function to update the map size dynamically
function updateMapSize() {
  const width = window.innerWidth; // Get the window width
  const height = window.innerHeight; // Get the window height

  // Update SVG size based on the window size
  d3.select("svg").attr("width", width);

  // Update projection to recalculate based on new dimensions
  projection.translate([width / 2, height / 2]);

  // Re-render paths with updated projection
  svg.selectAll("path").attr("d", path);

  // Get the bounding box of the map and set the SVG height accordingly
  const bbox = svg.node().getBBox();
  const mapHeight = bbox.height;
  d3.select("svg").attr("height", mapHeight); // Set the height of the SVG based on the map's content
}

// Initial SVG setup
const projection = d3
  .geoMercator()
  .center([103.8198, 1.3521]) // Singapore coordinates
  .scale(120000) // Increase the scale value for a larger map
  .translate([window.innerWidth / 2, window.innerHeight / 2]);

const path = d3.geoPath().projection(projection);

// Create SVG container for the map
const svg = d3
  .select("#map")
  .append("svg")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight); // Initially set to window height, adjusted later based on map size

// Load the GeoJSON and CSV data
Promise.all([
  d3.json("./singapore-subzones.json"), // GeoJSON data for subzones
  d3.csv("./singapore-population.csv"), // Population data
]).then(([subzones, population]) => {
  const populationMap = new Map();

  // Access csv data with d.Subzone and d.Population (has to match the column names in the csv file)
  population.forEach((d) => {
    populationMap.set(d.Subzone.toUpperCase(), +d.Population); // Uppercase the subzone name to match the geojson data
  });

  // Define a linear color scale with shorter population ranges and more color gradients
  const colorScale = d3
    .scaleLinear()
    .domain([1, 20000, 40000, 60000, 80000, 100000, 120000])
    .range([
      "#f8c7d1", // Pastel Pink
      "#f1a7b6", // Light Peach
      "#e77f9e", // Soft Pink
      "#d66084", // Coral Pink
      "#b6436a", // Darker Pink
      "#9d2f5c", // Rose Red
      "#7f1a4d"  // Deep Rose
    ]);

  // Bind data to subzone shapes
  svg
    .selectAll("path")
    .data(subzones.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d) => {
      // Get population data or default to 0 if missing
      const populationData = populationMap.get(d.properties.Name.toUpperCase()) || 0;
      return colorScale(populationData); // Color based on population
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const populationData = populationMap.get(d.properties.Name.toUpperCase()) || 0;
    
      // Change the stroke to dark pink on hover
      d3.select(this).attr("stroke", "#b6436a").attr("stroke-width", 2);
    
      // Create a tooltip container if it doesn't exist
      const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background-color", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("z-index", 10);
    
      // Set the content of the tooltip with subzone name as heading and population as details
      tooltip.html(`
        <strong>${d.properties.Name}</strong><br>
        Population: ${populationData}
      `)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 10}px`);
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.5);
      // Remove the tooltip when the mouse leaves
      d3.select("#tooltip").remove();
    });

// Add a heading 'Legend (population in numbers)' on top of the legend
svg.append("text")
  .attr("x", window.innerWidth - 220) // Adjust the x position to align with the legend boxes
  .attr("y", 25) // Position the text closer to the legend
  .attr("font-size", "16px")
  .attr("fill", "white") // Set the font color to white
  .text("Legend (population)");

// Add a legend for the color scale
const legend = svg
  .append("g")
  .attr("class", "legend")
  .attr("transform", "translate(" + (window.innerWidth - 220) + ", 40)"); // Adjust the position to the left

const legendLinear = d3.legendColor()
  .shapeWidth(30)
  .orient("vertical")
  .scale(colorScale)
  .labels(function (d) {
    // Format without decimals
    return d.i === d.generatedLabels.length - 1
      ? d3.format(".0f")(d.generatedLabels[d.i])
      : d3.format(".0f")(d.generatedLabels[d.i]) +
          " - " +
          d3.format(".0f")(d.generatedLabels[d.i + 1]);
  })
  .labelFormat(d3.format(".0f")); // Ensure that the labels are formatted as integers

// Append the legend to the SVG container
const legendGroup = svg.append("g")
  .attr("class", "legend")
  .attr("transform", "translate(" + (window.innerWidth - 220) + ", 40)") // Adjust position
  .call(legendLinear);

// Set the text color of the legend labels to white
legendGroup.selectAll("text")
  .style("fill", "white"); // Set text color to white
  // Now update the map size based on the content
  updateMapSize();
});

// Update map size when the window is resized
window.addEventListener("resize", updateMapSize);