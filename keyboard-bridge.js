// Keyboard bridge for the Rive web runtime.
//
// @rive-app/webgl2 2.43.1 only routes Tab (focus traversal) into the file; the
// game's Luau `keyboardEvent` never sees arrows, space or digits. This forwards
// browser key events to the state machine instance's `keyInput`, using the GLFW
// key codes the scripts expect.
//
// NOTE: `keyInput(key, modifiers, isPressed, isRepeat)` is not in the public
// typings. Keep the runtime version pinned and re-test when upgrading.

(function () {
  const GLFW = {
    Space: 32, Escape: 256, Enter: 257, Tab: 258, Backspace: 259,
    ArrowRight: 262, ArrowLeft: 263, ArrowDown: 264, ArrowUp: 265,
  };
  for (let d = 0; d <= 9; d++) GLFW['Digit' + d] = 48 + d;
  for (let c = 65; c <= 90; c++) GLFW['Key' + String.fromCharCode(c)] = c;

  // Keys the game uses; the page must not scroll or react to them.
  const CAPTURED = new Set(['Space', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']);

  function modifiers(e) {
    return (e.shiftKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.altKey ? 4 : 0) | (e.metaKey ? 8 : 0);
  }

  // Call once the Rive instance has loaded (in its onLoad callback).
  window.attachRiveKeyboard = function (riveInstance, canvas) {
    const machine = () => {
      const sm = riveInstance.animator && riveInstance.animator.stateMachines[0];
      return sm ? sm.instance : null;
    };
    const send = (e, pressed) => {
      const code = GLFW[e.code];
      const smi = machine();
      if (code === undefined || !smi || typeof smi.keyInput !== 'function') return;
      if (CAPTURED.has(e.code)) e.preventDefault();
      smi.keyInput(code, modifiers(e), pressed, pressed && e.repeat);
    };
    canvas.addEventListener('keydown', (e) => send(e, true));
    canvas.addEventListener('keyup', (e) => send(e, false));
    // Losing focus mid-press would leave a key stuck down in the game.
    canvas.addEventListener('blur', () => {
      const smi = machine();
      if (!smi) return;
      for (const code of [32, 262, 263, 264, 265]) smi.keyInput(code, 0, false, false);
    });
    canvas.focus();
  };
})();
