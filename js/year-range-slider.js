// the onFinish method is called when a user
// finishes interacting with the range slider 
$("#year-range-slider").ionRangeSlider({
    type: "double",
    min: 1473,
    max: 1700,
    step: 1,
    prettify_separator: "",
    
    onFinish: function(result) {
      // once user finishes interacting with the range
      // slider, remove opacity from all records whose
      // publication year doesn't fall in the specified
      // range. To do so, first determine the start and
      // end dates selected by the slider
      var startYear = result.from;
      var endYear = result.to;

      // remove opacity from all records
      var allMapPoints = d3.selectAll(".mapPoint");

      allMapPoints.transition()
        .duration(1250)
        .style("stroke-opacity", "0.0")
        .style("fill-opacity", "0.0")
        .style("pointer-events", "none"); 
      
      // restore opacity to the points whose publication
      // date falls within the range specified by the slider
      for (i=0; i < endYear-startYear; i++) {
        var currentYear = startYear + i;
        var selectionVal = ".pubYear" + String(currentYear);
        d3.selectAll(selectionVal).transition()
          .duration(1250)
          .style("fill-opacity", "0.2" )
          .style("stroke-opacity", "0.5");

      }; // for loop

    } // onFinish()
});

// create variable so that we can call yearRangeSlider.reset()
var yearRangeSlider = $("#year-range-slider").data("ionRangeSlider");
