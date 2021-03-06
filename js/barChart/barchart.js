// globals
var barHeight = 20;

var margin = {top: 20, right: 20, bottom: 0, left: 245},
  // fixed width - margins - 10 for padding in container
  width = 466 - margin.left - margin.right - 10,
  // subtract a fixed amount (30) to remove unused whitespace
  height = 1000 - margin.top - margin.bottom - 30;

var x = d3.scale.linear()
  .range([15, width]);

var y = d3.scale.linear()
  .domain([0,1])  
  .range([15, height]);

var xAxis = d3.svg.axis()
  .scale(x)
  .orient("top")
  .tickSize(-height - margin.bottom);

var menu = d3.select("#selectionDropdown")
  .on("change", function() {
    // remove all points with .currentSelectionPoint
    // and add all initial points to plot
    updateBarchart();
    
    // reset the year range slider to its
    // initial value range
    yearRangeSlider.reset();

    // reload all of the markers
    addMapPointsWrapper(globalPageLoadJson, 1473, 1700);

  });


var initializeBarchart = function() {
  var svg = d3.select("#barchart-svg").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  svg.append("g")
    .attr("class", "x axis");

  svg.append("g")
    .attr("class", "y axis")
};


var barchartClick = function(d) {
  // on click of bar chart, remove opacity of all 
  // circles plotted on page load, then add the points
  // that correspond to the selection type {classification,
  // language} and the selected id that the user selected 

  // use barId + d.selectionId key to increase opacity
  // of all but selected bars
  d3.select("#barchart").selectAll("rect")
    .style("opacity", ".4");
  d3.select("#barId" + d.selectionId)
    .style("opacity", "1");
  
  // determine the kind of selection currently being plotted
  // e.g. classification
  var selectionType = d.selectionGroup;

  // determine the id of the bar clicked
  var selectionId = d.selectionId;

  // determine the path to the json that contains all points
  // for the selected bar
  var selectionJsonPath = "/json/user_selections/" + 
    selectionType + "_selections/" +
    selectionType + "_" + selectionId + ".json";

  // add those points to the plot
  d3.json(selectionJsonPath, function(error, json) {
    if (error) return console.warn(error);
    addMapPointsWrapper(json, 1473, 1700);
  }); 

  // reset the range slider to its initial range
  yearRangeSlider.reset();
};


var barchartMouseover = function(d) {
  // update the color of the moused-over bar
  d3.select("#barId" + d.selectionId)
    .style("fill", "#720000");
};


var barchartMouseout = function(d, colors) {
  // restore the original color of the moused-over bar
  d3.select("#barId" + d.selectionId)
    .style("fill", colors(d.selectionCount));
};


var dataKey = function(d) {
  return d.selectionGroup + d.selectionId;
};


var updateBarchart = function() {
  // on request to update the bar chart, 
  // check to see which value is selected in the dropdown
  // and retrieve that json
  var dropdownVal = $("#selectionDropdown").val();

  // the selected value is a path to the desired json
  // so retrieve that json
  d3.json(dropdownVal, function(error, json) {
    if (error) return console.warn(error);

    // remove any text that's already appended to barplot
    d3.select("#barchart").selectAll("text").remove();

    var colors = d3.scale.log()
      .domain(d3.extent(json, function(d) { return d.selectionCount }))
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb("#f84545"), d3.rgb("#720000")]);

    // set the domain of the x axis and redraw axis
    var x = d3.scale.log()
      .domain(d3.extent(json, function(d) { 
        return d.selectionCount }))
      .range([15, width]);

    // update each bar of the bar chart
    var svg = d3.select("#barchart").select("svg")
    var barchart = svg.selectAll("rect").data(json, function(d) {
      return dataKey(d);
    });

    barchart.transition()
      .attr("width", function(d) {return x(d.selectionCount)})
      .attr("height", function(d, i) { return barHeight-1});
        
    var bar = barchart.enter().append("g")

      bar.append("rect")
        .attr("id", function(d, i) {return "barId" + d.selectionId})
        .attr("x", margin.left)
        .attr("y", function(d, i) {return i * barHeight;})
        .on("click", function(d) { barchartClick(d); })
        .on("mouseover", function(d) { barchartMouseover(d); })
        .on("mouseout", function(d) { barchartMouseout(d, colors); })
        .attr("fill", function(d) {
          return colors(d.selectionCount)
        })
        .attr("width", function(d) {return x(d.selectionCount)})
        .attr("height", function(d, i) { return barHeight-1 })
        .style("cursor","pointer");
 
     bar.append("text")
        .attr("x", 5)
        .attr("y", function(d, i) {return i * barHeight + 15;})
        .text(function(d) {return d.selectionString;})
        .style("font", "12px Arial")
        .style("margin-left", "16px")
        .on("click", function(d) { barchartClick(d); })
        .on("mouseover", function(d) { barchartMouseover(d); })
        .on("mouseout", function(d) { barchartMouseout(d, colors); })
        .style("cursor","pointer"); 

    barchart.exit()
      .remove();
  });
};

initializeBarchart();
updateBarchart();