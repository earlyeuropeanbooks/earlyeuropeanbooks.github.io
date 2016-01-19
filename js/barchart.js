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


var initializeBarchart = function() {
  var svg = d3.select("#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  svg.append("g")
    .attr("class", "x axis");

  svg.append("g")
    .attr("class", "y axis")

  var menu = d3.select("#menu select")
    .on("change", updateBarchart);
};


// on click of bar chart update the opacity of 
// circles on the plot
var barChartClick = function(d) { 
  console.log(d);

  // determine the kind of selection currently being plotted
  // e.g. classification
  var selectionType = d.selectionGroup;

  // determine the id of the bar clicked
  var selectionId = d.selectionId;

  // remove opacity from all records
  d3.select("#map").selectAll("path")
    .style("opacity", ".01");
  
  // then select all records with the given selection id
  // for the given selection type
  var classSelector = "." + selectionType + "Id" + String(selectionId);
  console.log(classSelector);
  d3.select("#map").selectAll(classSelector)
    .style("opacity", ".8");

};



var updateBarchart = function() {
  d3.json("json/classifications.json", function(error, json) {
    if (error) return console.warn(error);

    var colors = d3.scale.log()
      .domain(d3.extent(json, function(d) { return d.selectionCount }))
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb("#f84545"), d3.rgb("#720000")]);

    // update each bar of the bar chart
    var svg = d3.select("#barchart").select("svg")
    var barchart = svg.selectAll("rect").data(json);

    // set the domain of the x axis and redraw axis
    var x = d3.scale.log()
      .domain(d3.extent(json, function(d) { 
        return d.selectionCount }))
      .range([0, width]);

    barchart.transition()
      .duration(1000)
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
          .transition()
            .duration(1000)
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
          .transition(1000)
          .remove();
  });
};

initializeBarchart();
updateBarchart();

