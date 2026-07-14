(function () {
  var abstracts = document.querySelectorAll('[data-collapsible-abstract]');

  if (!abstracts.length) return;

  Array.prototype.forEach.call(abstracts, function (abstract) {
    var preview = abstract.querySelector('.research-project__abstract-preview');
    var content = abstract.querySelector('.research-project__abstract-content');
    var toggle = abstract.querySelector('.research-project__abstract-toggle');
    var toggleLabel = abstract.querySelector('[data-abstract-toggle-label]');

    if (!preview || !content || !toggle || !toggleLabel) return;

    var previewText = preview.textContent.replace(/\s+/g, ' ').trim();
    var fullText = content.textContent.replace(/\s+/g, ' ').trim();

    if (!previewText || previewText === fullText) return;

    content.hidden = true;
    preview.hidden = false;
    toggle.hidden = false;

    toggle.addEventListener('click', function () {
      var willExpand = toggle.getAttribute('aria-expanded') !== 'true';

      content.hidden = !willExpand;
      preview.hidden = willExpand;
      toggle.setAttribute('aria-expanded', String(willExpand));
      toggleLabel.textContent = willExpand
        ? toggle.getAttribute('data-less-label')
        : toggle.getAttribute('data-more-label');
    });
  });
})();
