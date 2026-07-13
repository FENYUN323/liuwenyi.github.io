(function () {
  var dialog = document.getElementById('profile-photo-lightbox');
  var trigger = document.querySelector('.author__avatar-zoom');

  if (!dialog || !trigger || typeof dialog.showModal !== 'function') return;

  var enlargedImage = dialog.querySelector('.profile-lightbox__image');
  var closeButton = dialog.querySelector('.profile-lightbox__close');

  if (!enlargedImage || !closeButton) return;

  trigger.addEventListener('click', function () {
    enlargedImage.src = trigger.getAttribute('data-profile-src');
    enlargedImage.alt = trigger.getAttribute('data-profile-alt');
    document.documentElement.classList.add('profile-lightbox-open');
    dialog.showModal();
    closeButton.focus();
  });

  closeButton.addEventListener('click', function () {
    dialog.close();
  });

  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('profile-lightbox-open');
    enlargedImage.removeAttribute('src');
    trigger.focus();
  });
}());
