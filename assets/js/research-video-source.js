(function () {
  var videos = document.querySelectorAll('[data-research-video]');
  var youtubeApiCallbacks = [];
  var youtubeApiStatus = 'idle';
  var observer;

  if (!videos.length) return;

  function finishYouTubeApi(error) {
    var callbacks;

    if (!error && youtubeApiStatus === 'ready') return;
    if (error && youtubeApiStatus === 'error') return;

    youtubeApiStatus = error ? 'error' : 'ready';
    callbacks = youtubeApiCallbacks.slice();
    youtubeApiCallbacks.length = 0;

    Array.prototype.forEach.call(callbacks, function (callback) {
      callback(error, window.YT);
    });
  }

  function loadYouTubeApi(callback) {
    var previousReady;
    var script;
    var firstScript;

    if (window.YT && typeof window.YT.Player === 'function') {
      youtubeApiStatus = 'ready';
      callback(null, window.YT);
      return;
    }

    if (youtubeApiStatus === 'error') {
      callback(new Error('YouTube API unavailable'));
      return;
    }

    youtubeApiCallbacks.push(callback);
    if (youtubeApiStatus === 'loading') return;

    youtubeApiStatus = 'loading';
    previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      try {
        if (typeof previousReady === 'function') previousReady();
      } finally {
        if (window.YT && typeof window.YT.Player === 'function') {
          finishYouTubeApi(null);
        } else {
          finishYouTubeApi(new Error('YouTube API unavailable'));
        }
      }
    };

    script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }

    script.addEventListener('error', function () {
      finishYouTubeApi(new Error('YouTube API failed to load'));
    });
  }

  function parseTimeout(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? fallback : parsed;
  }

  function findSourceButton(state, source) {
    var match = null;

    Array.prototype.forEach.call(state.buttons, function (button) {
      if (button.getAttribute('data-video-source') === source) match = button;
    });

    return match;
  }

  function clearReadyTimer(state) {
    if (!state.readyTimer) return;
    window.clearTimeout(state.readyTimer);
    state.readyTimer = null;
  }

  function clearPlayTimer(state) {
    if (!state.playTimer) return;
    window.clearTimeout(state.playTimer);
    state.playTimer = null;
  }

  function clearTimers(state) {
    clearReadyTimer(state);
    clearPlayTimer(state);
  }

  function setHealth(state, health) {
    state.video.setAttribute('data-video-health', health);
  }

  function setStatus(state, message) {
    if (!state.status) return;
    state.status.textContent = message || '';
  }

  function setPlayTrigger(state, mode, focusTarget) {
    var label;
    var shouldMoveFocus;

    if (!state.playTrigger) return;

    if (mode === 'hidden') {
      shouldMoveFocus = document.activeElement === state.playTrigger && focusTarget;
      state.playTrigger.hidden = true;
      state.playTrigger.disabled = false;
      if (shouldMoveFocus && typeof focusTarget.focus === 'function') focusTarget.focus();
      return;
    }

    label = mode === 'checking' ? state.labels.checking : state.labels.play;
    state.playTrigger.hidden = false;
    state.playTrigger.disabled = mode === 'checking';
    state.playTrigger.setAttribute(
      'aria-label',
      label + (state.projectTitle ? ': ' + state.projectTitle : '')
    );
    if (state.playLabel) state.playLabel.textContent = label;
    if (state.playIcon) {
      state.playIcon.className = mode === 'checking'
        ? 'fas fa-spinner fa-spin'
        : 'fas fa-play';
    }
  }

  function updatePressedButtons(state, source) {
    Array.prototype.forEach.call(state.buttons, function (button) {
      button.setAttribute(
        'aria-pressed',
        String(button.getAttribute('data-video-source') === source)
      );
    });
  }

  function dispatchSourceChange(state, source, reason) {
    if (typeof window.CustomEvent !== 'function') return;

    state.video.dispatchEvent(new CustomEvent('research-video-source-change', {
      detail: { source: source, reason: reason }
    }));
  }

  function isCurrentYouTube(state, revision) {
    return state.revision === revision &&
      state.frame.getAttribute('data-video-source') === 'youtube';
  }

  function mayAutoFallback(state, revision) {
    return isCurrentYouTube(state, revision) && !state.manualOverride;
  }

  function startReadyTimer(state, allowAutoFallback, revision) {
    clearReadyTimer(state);
    state.readyTimer = window.setTimeout(function () {
      if (allowAutoFallback && mayAutoFallback(state, revision)) {
        fallbackToBilibili(state, 'youtube-timeout', revision);
      } else if (isCurrentYouTube(state, revision) && !state.youtubeReady) {
        setPlayTrigger(state, 'hidden');
        setHealth(state, 'manual-error');
        setStatus(state, state.labels.manualError);
      }
    }, state.readyTimeout);
  }

  function startPlayTimer(state, revision, timeout) {
    clearPlayTimer(state);
    state.playTimer = window.setTimeout(function () {
      if (mayAutoFallback(state, revision)) {
        fallbackToBilibili(state, 'youtube-timeout', revision);
      } else if (isCurrentYouTube(state, revision) && !state.playConfirmed) {
        setPlayTrigger(state, 'play');
        setHealth(state, 'manual-error');
        setStatus(state, state.labels.manualError);
      }
    }, timeout);
  }

  function selectSource(state, source, reason, manual) {
    var button = findSourceButton(state, source);
    var currentSource;
    var nextSrc;
    var nextTitle;
    var revision;
    var shouldMoveVideoFocus;

    if (!button) return;

    currentSource = state.frame.getAttribute('data-video-source');
    clearTimers(state);
    if (manual) state.manualOverride = true;
    updatePressedButtons(state, source);

    if (currentSource === source) {
      if (manual && source === 'youtube') {
        setHealth(state, 'manual');
        setStatus(state, state.labels.manualYouTube);
        if (state.youtubeReady && state.player) {
          setPlayTrigger(state, 'play');
        } else if (state.setupRevision === state.revision) {
          setPlayTrigger(state, 'checking');
          startReadyTimer(state, false, state.revision);
        } else {
          prepareYouTube(state, false);
        }
      } else if (manual) {
        setHealth(state, 'manual');
        setStatus(state, '');
      }
      dispatchSourceChange(state, source, reason);
      return;
    }

    state.revision += 1;
    revision = state.revision;

    nextSrc = button.getAttribute('data-video-src');
    nextTitle = button.getAttribute('data-video-title');
    if (!nextSrc) return;

    shouldMoveVideoFocus = document.activeElement === state.frame ||
      document.activeElement === state.playTrigger;
    state.player = null;
    state.youtubeReady = false;
    state.playConfirmed = false;
    state.setupRevision = -1;
    state.frame.src = nextSrc;
    state.frame.setAttribute('data-video-source', source);
    if (nextTitle) state.frame.title = nextTitle;

    if (source === 'bilibili') {
      setPlayTrigger(state, 'hidden', button);
      setHealth(state, manual ? 'manual' : 'fallback');
      if (manual) {
        setStatus(state, '');
      } else {
        setStatus(
          state,
          reason === 'youtube-error' ? state.labels.error : state.labels.timeout
        );
      }
      if (!manual && shouldMoveVideoFocus && typeof button.focus === 'function') {
        button.focus();
      }
    } else {
      setHealth(state, manual ? 'manual' : 'checking');
      setStatus(state, manual ? state.labels.manualYouTube : '');
      window.setTimeout(function () {
        if (isCurrentYouTube(state, revision)) {
          prepareYouTube(state, !state.manualOverride);
        }
      }, 0);
    }

    dispatchSourceChange(state, source, reason);
  }

  function fallbackToBilibili(state, reason, revision) {
    if (!mayAutoFallback(state, revision)) return;
    selectSource(state, 'bilibili', reason, false);
  }

  function handleYouTubeError(state, revision) {
    clearTimers(state);

    if (mayAutoFallback(state, revision)) {
      fallbackToBilibili(state, 'youtube-error', revision);
      return;
    }

    if (isCurrentYouTube(state, revision)) {
      setPlayTrigger(
        state,
        'hidden',
        findSourceButton(state, 'bilibili') || state.frame
      );
      setHealth(state, 'manual-error');
      setStatus(state, state.labels.manualError);
    }
  }

  function prepareYouTube(state, allowAutoFallback) {
    var revision = state.revision;

    if (!isCurrentYouTube(state, revision) || state.setupRevision === revision) return;

    state.setupRevision = revision;
    state.youtubeReady = false;
    setHealth(state, state.manualOverride ? 'manual-checking' : 'checking');
    setPlayTrigger(state, 'checking');

    startReadyTimer(
      state,
      allowAutoFallback && !state.manualOverride,
      revision
    );

    loadYouTubeApi(function (apiError, YT) {
      if (!isCurrentYouTube(state, revision)) return;

      if (apiError || !YT || typeof YT.Player !== 'function') {
        handleYouTubeError(state, revision);
        return;
      }

      try {
        state.player = new YT.Player(state.frame, {
          events: {
            onReady: function (event) {
              if (!isCurrentYouTube(state, revision)) return;
              clearReadyTimer(state);
              state.player = event.target;
              state.youtubeReady = true;
              setHealth(state, state.manualOverride ? 'manual-ready' : 'ready');
              setPlayTrigger(state, 'play');
              setStatus(state, state.manualOverride ? state.labels.manualYouTube : '');
            },
            onStateChange: function (event) {
              if (!isCurrentYouTube(state, revision)) return;

              if (event.data === 1) {
                state.playConfirmed = true;
                clearPlayTimer(state);
                setPlayTrigger(state, 'hidden', state.frame);
                setHealth(state, 'playing');
                setStatus(state, '');
              } else if (event.data === 3 && !state.playConfirmed) {
                setPlayTrigger(state, 'hidden', state.frame);
                setHealth(state, 'buffering');
                startPlayTimer(state, revision, state.bufferTimeout);
              } else if (event.data === 2 && state.playConfirmed) {
                clearPlayTimer(state);
                setPlayTrigger(state, 'hidden');
                setHealth(state, 'ready');
                setStatus(state, '');
              } else if (event.data === 2) {
                setPlayTrigger(state, 'play');
                setHealth(state, 'ready');
              }
            },
            onError: function () {
              if (!isCurrentYouTube(state, revision)) return;
              handleYouTubeError(state, revision);
            },
            onAutoplayBlocked: function () {
              if (!isCurrentYouTube(state, revision)) return;
              clearPlayTimer(state);
              setPlayTrigger(state, 'play');
              setHealth(state, 'ready');
              setStatus(state, state.labels.autoplayBlocked);
            }
          }
        });
      } catch (error) {
        handleYouTubeError(state, revision);
      }
    });
  }

  function attemptYouTubePlayback(state) {
    var revision = state.revision;

    if (!isCurrentYouTube(state, revision) || !state.youtubeReady || !state.player) return;

    clearPlayTimer(state);
    state.playConfirmed = false;
    setPlayTrigger(state, 'hidden', state.frame);
    setHealth(state, 'trying');
    setStatus(state, state.labels.trying);
    startPlayTimer(state, revision, state.playTimeout);

    try {
      state.player.playVideo();
    } catch (error) {
      handleYouTubeError(state, revision);
    }
  }

  function startYouTubeCheck(state) {
    if (state.checkStarted) return;
    state.checkStarted = true;

    if (state.frame.getAttribute('data-video-source') === 'youtube') {
      prepareYouTube(state, !state.manualOverride);
    }
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      Array.prototype.forEach.call(entries, function (entry) {
        var state = entry.target.__researchVideoState;

        if (!entry.isIntersecting || !state) return;
        observer.unobserve(entry.target);
        startYouTubeCheck(state);
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
  }

  Array.prototype.forEach.call(videos, function (video) {
    var frame = video.querySelector('[data-research-video-frame]');
    var switcher = video.querySelector('[data-research-video-switcher]');
    var hint = video.querySelector('[data-research-video-hint]');
    var playTrigger = video.querySelector('[data-research-video-play]');
    var status = video.querySelector('[data-research-video-status]');
    var buttons;
    var state;

    if (!frame || !switcher) return;

    buttons = switcher.querySelectorAll('[data-video-source]');
    if (buttons.length < 2) return;

    state = {
      video: video,
      projectTitle: video.getAttribute('data-video-project-title') || '',
      frame: frame,
      switcher: switcher,
      hint: hint,
      status: status,
      playTrigger: playTrigger,
      playIcon: playTrigger && playTrigger.querySelector('[data-research-video-play-icon]'),
      playLabel: playTrigger && playTrigger.querySelector('[data-research-video-play-label]'),
      buttons: buttons,
      player: null,
      youtubeReady: false,
      playConfirmed: false,
      manualOverride: false,
      checkStarted: false,
      setupRevision: -1,
      revision: 0,
      readyTimer: null,
      playTimer: null,
      readyTimeout: parseTimeout(video.getAttribute('data-youtube-ready-timeout'), 12000),
      playTimeout: parseTimeout(video.getAttribute('data-youtube-play-timeout'), 12000),
      bufferTimeout: parseTimeout(video.getAttribute('data-youtube-buffer-timeout'), 25000),
      labels: {
        checking: video.getAttribute('data-video-check-label') || 'Checking YouTube…',
        play: video.getAttribute('data-video-play-label') || 'Play video',
        trying: video.getAttribute('data-video-trying-label') || 'Trying YouTube…',
        timeout: video.getAttribute('data-video-timeout-label') || 'YouTube did not start in time, so this video was switched to Bilibili.',
        error: video.getAttribute('data-video-error-label') || 'YouTube could not play this video, so it was switched to Bilibili.',
        manualYouTube: video.getAttribute('data-video-manual-youtube-label') || 'Using YouTube. Automatic fallback is paused for this video.',
        manualError: video.getAttribute('data-video-manual-error-label') || 'YouTube could not play this video. Select Bilibili above.',
        autoplayBlocked: video.getAttribute('data-video-autoplay-blocked-label') || 'Your browser blocked playback. Press Play video to try again.'
      }
    };

    video.__researchVideoState = state;
    switcher.hidden = false;
    if (hint) hint.hidden = false;

    Array.prototype.forEach.call(buttons, function (button) {
      button.addEventListener('click', function () {
        selectSource(
          state,
          button.getAttribute('data-video-source'),
          'user',
          true
        );
      });
    });

    if (playTrigger) {
      playTrigger.addEventListener('click', function () {
        attemptYouTubePlayback(state);
      });
    }

    if (observer) {
      observer.observe(video);
    } else {
      startYouTubeCheck(state);
    }
  });
})();
