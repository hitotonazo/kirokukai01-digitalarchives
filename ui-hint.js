// ui-hint.js
// 「クリック」された時のみ UI フラグを短時間表示する控えめな演出

(function () {
  const DEBUG = true;

  function log(...args) {
    if (DEBUG) console.log('[VA sync]', ...args);
  }

  // 手動テスト用: va.pulse('test')
  window.va = window.va || {};
  window.va.pulse = function (label = '') {
    const el = document.getElementById('ux-flag');
    if (!el) return;

    if (!el.textContent.trim()) {
      el.textContent = '▼▲ sync…';
    }

    el.classList.add('is-visible');
    setTimeout(() => {
      el.classList.remove('is-visible');
    }, 5000);

    log('pulse shown', new Date().toISOString(), label);
  };

  window.addEventListener('DOMContentLoaded', function () {
    const el = document.getElementById('ux-flag');
    if (!el) {
      log('ux-flag missing');
      return;
    }

    const link = document.getElementById('entry-node');
    if (link) {
      link.addEventListener('click', () => {
        log('entry-node clicked');
        window.va.pulse('click');
      });
    } else {
      log('entry-node missing');
    }
  });
})();
