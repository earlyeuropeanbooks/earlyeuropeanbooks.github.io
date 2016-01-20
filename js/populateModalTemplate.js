// initialize template that will display book-level information
// on display of modal
var source = $("#entry-template").html();
var template = Handlebars.compile(source);

var mapPointClick = function() {
  var a = $(this);
  console.log(a["0"]["options"]["className"]); 

  // populate template contents
  var templateData = {title: "My New Post", templateBody: "This is my first post!"};

  // remove the extant form contents (if any)
  $(".modal-body").find(".entry").remove();

  // append template content to DOM
  $(".modal-body").append(template(templateData)); 

  // make the modal visible 
  $('#myModal').modal('show');;
};




