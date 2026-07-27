(function () {
  var body = document.body;
  if (!body) return;
  var attrs = body.attributes;
  for (var i = attrs.length - 1; i >= 0; i--) {
    var name = attrs[i].name;
    if (name.indexOf("cz-") === 0 || name.indexOf("data-cz-") === 0) {
      body.removeAttribute(name);
    }
  }
})();
