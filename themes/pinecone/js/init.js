(function() {
  "use strict";

  var inputs = document.querySelectorAll("textarea.richtext");

  Array.prototype.slice.call(inputs).forEach(function(input) {
    CKEDITOR.replace(input, {
      height: 400,
      toolbarGroups: [
        {"name": "basicstyles", "groups": ["basicstyles", "cleanup"]},
        {"name": "paragraph", "groups": ["list", "indent", "blocks", "align", "bidi"]},
        {"name": "links"},
        {"name": "insert"},
        {"name": "styles"},
        {"name": "colors"},
      ]
    });
  });

}());
