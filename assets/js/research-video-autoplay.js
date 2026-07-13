(function () {
  "use strict";

  var playerSelector = ".js-research-youtube[data-youtube-id]";
  var visibilityThreshold = 0.55;
  var states = new Map();
  var activeState = null;
  var playersInitialized = false;

  function pause(state) {
    if (!state || !state.ready || !state.player) return;

    try {
      state.player.pauseVideo();
    } catch (error) {
      // The YouTube player may be blocked or not fully available yet.
    }

    if (activeState === state) activeState = null;
  }

  function play(state) {
    if (!state || document.hidden) return;

    if (activeState && activeState !== state) pause(activeState);
    if (!state.ready || !state.player) return;

    try {
      state.player.mute();
      state.player.playVideo();
      activeState = state;
    } catch (error) {
      activeState = null;
    }
  }

  function updatePlayback() {
    var bestState = null;

    states.forEach(function (state) {
      if (!state.visible) return;
      if (!bestState || state.intersectionRatio > bestState.intersectionRatio) {
        bestState = state;
      }
    });

    if (bestState) {
      play(bestState);
    } else if (activeState) {
      pause(activeState);
    }
  }

  function configureIframeOrigin(frame) {
    if (!window.location.origin || window.location.origin === "null") return;

    try {
      var source = new URL(frame.src);
      var configuredOrigin = source.searchParams.get("origin") || "";

      if (configuredOrigin.toLowerCase() !== window.location.origin.toLowerCase()) {
        source.searchParams.set("origin", window.location.origin);
        frame.src = source.toString();
      }
    } catch (error) {
      // Keep the server-rendered source when URL parsing is unavailable.
    }
  }

  function initializePlayers() {
    if (playersInitialized || !window.YT || typeof window.YT.Player !== "function") return;
    playersInitialized = true;

    var frames = document.querySelectorAll(playerSelector);
    if (!frames.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var state = states.get(entry.target);
        if (!state) return;

        state.intersectionRatio = entry.intersectionRatio;
        state.visible = entry.isIntersecting && entry.intersectionRatio >= visibilityThreshold;
      });

      updatePlayback();
    }, { threshold: [0, visibilityThreshold, 1] });

    frames.forEach(function (frame, index) {
      var wrapper = frame.closest(".research-video__embed");
      if (!wrapper) return;
      if (!frame.id) frame.id = "research-youtube-" + index;

      var state = {
        wrapper: wrapper,
        player: null,
        ready: false,
        visible: false,
        intersectionRatio: 0
      };

      states.set(wrapper, state);
      observer.observe(wrapper);

      state.player = new window.YT.Player(frame.id, {
        events: {
          onReady: function (event) {
            state.player = event.target;
            state.ready = true;
            event.target.mute();
            updatePlayback();
          },
          onStateChange: function (event) {
            if (!window.YT || !window.YT.PlayerState) return;

            if (event.data === window.YT.PlayerState.PLAYING) {
              if (activeState && activeState !== state) pause(activeState);
              activeState = state;
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              if (activeState === state) activeState = null;
            }
          },
          onAutoplayBlocked: function () {
            if (activeState === state) activeState = null;
          }
        }
      });
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (activeState) pause(activeState);
      } else {
        updatePlayback();
      }
    });
  }

  function loadYouTubeApi() {
    if (window.YT && typeof window.YT.Player === "function") {
      initializePlayers();
      return;
    }

    var previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previousReady === "function") previousReady();
      initializePlayers();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      var script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  }

  function start() {
    var frames = document.querySelectorAll(playerSelector);
    if (!frames.length) return;

    frames.forEach(configureIframeOrigin);

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    loadYouTubeApi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
}());
