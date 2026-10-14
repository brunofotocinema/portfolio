// Inline script (runs as the HTML is parsed, see app/layout.tsx) that hands
// the intro logo over from the hero video to the screen.
//
// During the static hold the logo layer is absolute inside the hero, so the
// browser scrolls it with the video natively (no per-frame JS, no lag). As
// soon as the stage starts shrinking, the layer flips to fixed, and each frame
// the scroll is cancelled out in proportion to how far the logo still is from
// the corner (stage width: 1 = big/centred, 0 = landed), via `translate`,
// which the keyframes (animating `transform`) never touch. It lives outside
// React because hydration can block the main thread for a good second.
export const LOGO_ANCHOR_SCRIPT = `(function () {
  var view, stage, big, small, fixed = false, done = false;
  function tick() {
    if (done) return;
    if (!stage) {
      view = document.querySelector(".logo-viewport");
      stage = document.querySelector(".logo-stage");
      big = document.querySelector(".logo-probe-big");
      small = document.querySelector(".logo-probe-small");
      if (!view || !stage || !big || !small) { stage = null; requestAnimationFrame(tick); return; }
      stage.addEventListener("animationend", function (e) {
        if (e.target !== stage) return;
        done = true;
        view.classList.add("is-fixed");
        stage.style.translate = "";
      });
    }
    var range = big.offsetWidth - small.offsetWidth;
    var weight = range > 0 ? Math.min(1, Math.max(0, (stage.offsetWidth - small.offsetWidth) / range)) : 0;
    if (!fixed && weight < 1) { fixed = true; view.classList.add("is-fixed"); }
    if (fixed) stage.style.translate = "0 " + (-window.scrollY * weight) + "px";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();`;
