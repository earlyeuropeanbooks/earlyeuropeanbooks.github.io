// globals
var barHeight = 20;

var margin = {top: 20, right: 20, bottom: 0, left: 210},
  width = $(window).width() * .3 - margin.left - margin.right,
  height = $(window).height() - margin.top - margin.bottom;

var x = d3.scale.linear()
  .range([0, width]);

var y = d3.scale.linear()
  .domain([0,1])  
  .range([0, height]);

var xAxis = d3.svg.axis()
  .scale(x)
  .orient("top")
  .tickSize(-height - margin.bottom);


var menu = d3.select("#menu select")
  .on("change", function() {
    updateBarchart();
    
    // reset the opacity of all circles on the map
    // to their original values 
    d3.selectAll(".mapPoint")
      .style("stroke-opacity", ".5")
      .style("fill-opacity", "0.2");    
  });


var initializeBarchart = function() {
  var svg = d3.select("#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  svg.append("g")
    .attr("class", "x axis");

  svg.append("g")
    .attr("class", "y axis")

};


// on click of bar chart update the opacity of 
// circles on the plot
var barChartClick = function(d) { 

  // determine the kind of selection currently being plotted
  // e.g. classification
  var selectionType = d.selectionGroup;

  // determine the id of the bar clicked
  var selectionId = d.selectionId;

  // remove opacity from all records
  d3.selectAll(".mapPoint")
    .style("stroke-opacity", "0.0")
    .style("fill-opacity", "0.0");
  
  // then select all records with the given selection id
  // for the given selection type
  var classSelector = "." + selectionType + "Id" + String(selectionId);
  d3.select("#map").selectAll(classSelector)
    .style("stroke-opacity", ".5")
    .style("fill-opacity", ".2");

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
    .range([0, width]);

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
          .attr("x", margin.left)
          .attr("y", function(d, i) {return i * barHeight;})
          .on("click", function(d) {
            barChartClick(d);
          }) 
          .attr("fill", function(d) {
            return colors(d.selectionCount)
          })
          .attr("width", function(d) {return x(d.selectionCount)})
          .attr("height", function(d, i) { return barHeight-1 });
   
       bar.append("text")
          .attr("x", 5)
          .attr("y", function(d, i) {return i * barHeight + 15;})
          .text(function(d) {return d.selectionString;})
          .style("font-size", "10px")
          .on("click", function(d) {
            barChartClick(d);
          }); 

      barchart.exit()
        .remove();
  });
};

initializeBarchart();
updateBarchart();

