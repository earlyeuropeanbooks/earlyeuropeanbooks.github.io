// the onFinish method is called when a user
// finishes interacting with the range slider 
var yearRangeSlider = $("#year-range-slider").ionRangeSlider({
    type: "double",
    min: 1473,
    max: 1700,
    step: 1,
    prettify_separator: "",
    onFinish: function(r) {
      console.log(r);
    }
});
