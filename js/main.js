(function() {
  var repositionFooter = function() {
    var $footer = $('#page_footer');
    $footer.css({ position: 'static', top: 0 });
    if($(document).outerHeight() > $footer.offset().top + $footer.outerHeight()) {
      $footer.css({ position: 'absolute', width: '100%', top: $(document).height() - $footer.outerHeight() });
    }
  };

  var repositionIntervalId = null;
  var $disqusThread = null;

  var repositionFooterIfDisqusIsLoaded = function() {
    if($disqusThread.height() > 100) {
      repositionFooter();
      window.clearInterval(repositionIntervalId);
    }
  };

  $(function() {
    repositionFooter();
    $(window).resize(repositionFooter);
    $disqusThread = $('#disqus_thread');
    if($disqusThread.length > 0) {
      repositionIntervalId = window.setInterval(repositionFooterIfDisqusIsLoaded, 500);
    }
  });
}());
