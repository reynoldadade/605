// A stand-in for a third-party support chat widget. Start-up does about
// 1.2 s of main-thread work in 120 ms chunks, then the widget refreshes its
// presence indicator with a 300 ms task every 500 ms for about 12 seconds.
(function () {
  function busy(ms) {
    var end = performance.now() + ms;
    while (performance.now() < end) { Math.sqrt(Math.random()); }
  }
  var chunks = 10, beats = 24;
  function startUp() {
    busy(120);
    if (--chunks > 0) setTimeout(startUp, 30);
    else setTimeout(heartbeat, 200);
  }
  function heartbeat() {
    busy(300);
    if (--beats > 0) setTimeout(heartbeat, 200);
  }
  setTimeout(startUp, 0);
})();
