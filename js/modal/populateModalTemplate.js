// initialize template that will display book-level information
// on display of modal
var source = $("#entry-template").html();
var template = Handlebars.compile(source);

// this function is called by the onclick event applied to markers in eebMap.js
var mapPointClick = function() {
  
  // determine the book id that is represented by the circle the
  // user has clicked on by extracting the class from the relevant icon
  var clickedNode = $(this);
  var selectedNodeClass = clickedNode["0"]["_icon"].getAttribute("class");
  var selectedBookId = selectedNodeClass.split("bookId")[1].split(" ")[0];

  // retrieve the data for the given book so we can fill out the template
  d3.json("/json/book_templates/" + 
    selectedBookId + "_template.json", function(error, json) {
    if (error) return console.warn(error);

    // populate template contents
    var templateData = {title: json.title, author: json.author, 
        language: json.language, pubLoc: json.pubLoc, 
        pubDate: json.pubYear, prqId: json.prqId,
        imagePath: json.imagePath};

    // remove the extant form contents (if any)
    $(".modal-body").find(".entry").remove();

    // append template content to DOM
    $(".modal-body").append(template(templateData)); 

    // make the modal visible 
    $('#myModal').modal('show');;

  });
};




