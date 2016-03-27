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
      // slider, redraw the markers, retaining only
      // those that fall within the user-specified year range
      var startYear = result.from;
      var endYear = result.to;

      addMapPoints(globalLastJson, startYear, endYear);
  } 
});

// create variable so that we can call yearRangeSlider.reset()
var yearRangeSlider = $("#year-range-slider").data("ionRangeSlider");