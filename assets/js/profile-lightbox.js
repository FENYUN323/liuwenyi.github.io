(function () {
  var dialog = document.getElementById('profile-photo-lightbox');
  var trigger = document.querySelector('.author__avatar-zoom');

  if (!dialog || !trigger || typeof dialog.showModal !== 'function') return;

  var enlargedImage = dialog.querySelector('.profile-lightbox__image');
  var imageCloseButton = dialog.querySelector('.profile-lightbox__image-close');

  if (!enlargedImage || !imageCloseButton) return;

  trigger.addEventListener('click', function () {
    enlargedImage.src = trigger.getAttribute('data-profile-src');
    enlargedImage.alt = trigger.getAttribute('data-profile-alt');
    imageCloseButton.hidden = false;
    document.documentElement.classList.add('profile-lightbox-open');
    dialog.showModal();
    imageCloseButton.focus();
  });

  imageCloseButton.addEventListener('click', function () {
    dialog.close();
  });

  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('profile-lightbox-open');
    imageCloseButton.hidden = true;
    enlargedImage.removeAttribute('src');
    enlargedImage.alt = '';
    trigger.focus();
  });
}());
