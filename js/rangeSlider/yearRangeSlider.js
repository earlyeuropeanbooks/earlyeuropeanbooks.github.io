// the onFinish method is called when a user
// finishes interacting with the range slider, 
// but if we're already drawing the map, then wait to
// draw the new layer
var updateYearRange = function(result) {
  if (globalDrawingMap === 1) {
    setTimeout(function(){updateYearRange(result)}, 100);
  
  } else {
    var startYear = result.from;
    var endYear = result.to;
    addMapPoints(globalLastJson, startYear, endYear);  
  }
};

$("#year-range-slider").ionRangeSlider({
    type: "double",
    min: 1473,
    max: 1700,
    step: 1,
    prettify_separator: "",

    onFinish: function(result) {
      // once user finishes interacting with the range
      // slider, redraw the markers, retaining only
      // those that fall within the user-specified year range
      updateYearRange(result);
    } 
});

// create variable so that we can call yearRangeSlider.reset()
var yearRangeSlider = $("#year-range-slider").data("ionRangeSlider");