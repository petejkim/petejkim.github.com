(function() {
  var repositionFooter = function() {
    var $footer = $('#page_footer');
    $footer.css({ position: 'static', top: 0 });
    if($(document).outerHeight() > $footer.offset().top + $footer.outerHeight()) {
      $footer.css({ position: 'absolute', width: '100%', top: $(document).height() - $footer.outerHeight() });
    }
  };

  $(window).resize(repositionFooter);
  $(repositionFooter);
}());
