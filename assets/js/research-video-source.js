(function () {
  var videos = document.querySelectorAll('[data-research-video]');

  if (!videos.length) return;

  Array.prototype.forEach.call(videos, function (video) {
    var frame = video.querySelector('[data-research-video-frame]');
    var switcher = video.querySelector('[data-research-video-switcher]');
    var hint = video.querySelector('[data-research-video-hint]');
    var buttons;

    if (!frame || !switcher) return;

    buttons = switcher.querySelectorAll('[data-video-source]');
    if (buttons.length < 2) return;

    switcher.hidden = false;
    if (hint) hint.hidden = false;

    Array.prototype.forEach.call(buttons, function (button) {
      button.addEventListener('click', function () {
        var nextSource = button.getAttribute('data-video-source');
        var nextSrc = button.getAttribute('data-video-src');
        var nextTitle = button.getAttribute('data-video-title');

        if (!nextSource || !nextSrc || button.getAttribute('aria-pressed') === 'true') return;

        frame.src = nextSrc;
        frame.setAttribute('data-video-source', nextSource);
        if (nextTitle) frame.title = nextTitle;

        Array.prototype.forEach.call(buttons, function (candidate) {
          candidate.setAttribute('aria-pressed', String(candidate === button));
        });
      });
    });
  });
})();
