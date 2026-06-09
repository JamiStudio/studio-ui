import { ARTIFACT_VERSION, STORAGE_KEY, factoryDraft } from "./workbench-state.mjs";

export function buildWorkbenchClientScript() {
  return `
(function () {
  var STORAGE_KEY = ${JSON.stringify(STORAGE_KEY)};
  var ARTIFACT_VERSION = ${JSON.stringify(ARTIFACT_VERSION)};
  var factoryDraft = ${JSON.stringify(factoryDraft)};
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalizeDraft(input) {
    var draft = input && typeof input === 'object' ? input : {};
    return Object.assign({}, clone(factoryDraft), draft, {
      controls: Object.assign({}, factoryDraft.controls, draft.controls && typeof draft.controls === 'object' ? draft.controls : {})
    });
  }
  function createInitialWorkbenchState(seed) {
    seed = seed && typeof seed === 'object' ? seed : {};
    var saved = normalizeDraft(seed.saved || factoryDraft);
    var draft = normalizeDraft(seed.draft || saved);
    return {
      overlayOpen: seed.overlayOpen !== false,
      saved: saved,
      draft: draft,
      duplicateCount: Number.isInteger(seed.duplicateCount) ? seed.duplicateCount : 0,
      registeredArtifacts: Array.isArray(seed.registeredArtifacts) ? clone(seed.registeredArtifacts) : [],
      exportArtifact: seed.exportArtifact || null,
      lastAction: seed.lastAction || 'ready'
    };
  }
  function isDirty(state) {
    return JSON.stringify(normalizeDraft(state.draft)) !== JSON.stringify(normalizeDraft(state.saved));
  }
  function makeArtifact(state, action) {
    var draft = normalizeDraft(state.draft);
    return {
      schemaVersion: ARTIFACT_VERSION,
      action: action,
      target: draft.target,
      themeName: draft.themeName,
      presetName: draft.presetName,
      dirty: isDirty(state),
      controls: draft.controls,
      backendPersistence: false,
      localOnly: true,
      createdAt: 'static-runtime-local-state'
    };
  }
  function reduce(state, event) {
    var current = createInitialWorkbenchState(state);
    if (event.type === 'open') return Object.assign({}, current, { overlayOpen: true, lastAction: 'opened' });
    if (event.type === 'close') return Object.assign({}, current, { overlayOpen: false, lastAction: 'closed' });
    if (event.type === 'update-control') {
      var controls = Object.assign({}, current.draft.controls);
      controls[event.name] = String(event.value || '');
      return Object.assign({}, current, { draft: Object.assign({}, current.draft, { controls: controls }), lastAction: 'edited' });
    }
    if (event.type === 'select-theme') {
      return Object.assign({}, current, { draft: Object.assign({}, current.draft, { presetName: event.presetName, themeName: event.themeName || current.draft.themeName }), lastAction: 'edited' });
    }
    if (event.type === 'save') return Object.assign({}, current, { saved: normalizeDraft(current.draft), lastAction: 'saved-local' });
    if (event.type === 'duplicate') {
      var duplicateCount = current.duplicateCount + 1;
      return Object.assign({}, current, {
        duplicateCount: duplicateCount,
        draft: Object.assign({}, normalizeDraft(current.draft), { themeName: current.draft.themeName + ' copy ' + duplicateCount, presetName: current.draft.presetName + '-copy-' + duplicateCount }),
        lastAction: 'duplicated-local'
      });
    }
    if (event.type === 'restore') return Object.assign({}, current, { draft: normalizeDraft(factoryDraft), lastAction: 'restored-factory' });
    if (event.type === 'register') {
      var registration = makeArtifact(current, 'register');
      return Object.assign({}, current, { registeredArtifacts: [registration].concat(current.registeredArtifacts).slice(0, 5), lastAction: 'registered-local-artifact' });
    }
    if (event.type === 'export') return Object.assign({}, current, { exportArtifact: makeArtifact(current, 'export'), lastAction: 'exported-local-artifact' });
    return current;
  }
  function loadState() {
    try { return createInitialWorkbenchState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')); }
    catch (error) { return createInitialWorkbenchState(); }
  }
  function persist() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }
  function applyDraft() {
    var controls = state.draft.controls;
    var root = document.documentElement;
    root.setAttribute('data-theme', state.draft.presetName.indexOf('dark') === 0 ? 'dark' : state.draft.presetName.indexOf('light') === 0 ? 'light' : 'factory');
    root.style.setProperty('--ju-accent', controls.accent);
    root.style.setProperty('--ju-ring', controls.focusRing);
    root.style.setProperty('--ju-radius', controls.radius + 'px');
    root.style.setProperty('--ju-gap', controls.spacing + 'px');
    root.style.setProperty('--ju-motion', controls.motion + 'ms');
    root.style.setProperty('--ju-dock-width', controls.dockWidth + 'px');
    root.style.setProperty('--ju-density', controls.density);
    root.style.setProperty('--ju-font-size', controls.fontSize + 'px');
    document.querySelectorAll('[data-theme-value]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-theme-value') === root.getAttribute('data-theme') ? 'true' : 'false');
    });
    document.querySelectorAll('[data-wb-control]').forEach(function (control) {
      var name = control.getAttribute('data-wb-control');
      if (controls[name] !== undefined && control.value !== controls[name]) {
        if (control.type !== 'color' || /^#[0-9a-f]{6}$/i.test(controls[name])) control.value = controls[name];
      }
    });
  }
  function renderArtifacts() {
    var exportNode = document.getElementById('ju-wb-export');
    if (exportNode) exportNode.value = state.exportArtifact ? JSON.stringify(state.exportArtifact, null, 2) : '';
    var list = document.getElementById('ju-wb-registered');
    if (list) {
      list.innerHTML = '';
      state.registeredArtifacts.forEach(function (artifact) {
        var li = document.createElement('li');
        li.textContent = artifact.themeName + ' / ' + artifact.schemaVersion + ' / local artifact';
        list.appendChild(li);
      });
    }
  }
  function renderState() {
    document.body.toggleAttribute('data-workbench-closed', !state.overlayOpen);
    setText('ju-wb-target', state.draft.target);
    setText('ju-wb-theme', state.draft.themeName + ' / ' + state.draft.presetName);
    setText('ju-wb-dirty', isDirty(state) ? 'dirty' : 'saved');
    setText('ju-wb-last-action', state.lastAction);
    setText('ju-wb-storage', 'local draft');
    applyDraft();
    renderArtifacts();
  }
  function dispatch(event) {
    state = reduce(state, event);
    persist();
    renderState();
  }
  var state = loadState();
  document.querySelectorAll('[data-wb-action]').forEach(function (button) {
    button.addEventListener('click', function () { dispatch({ type: button.getAttribute('data-wb-action') }); });
  });
  document.querySelectorAll('[data-wb-control]').forEach(function (control) {
    control.addEventListener('input', function () { dispatch({ type: 'update-control', name: control.getAttribute('data-wb-control'), value: control.value }); });
  });
  document.querySelectorAll('[data-theme-value]').forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-theme-value');
      dispatch({ type: 'select-theme', presetName: value, themeName: value === 'factory' ? 'Jami factory' : value.charAt(0).toUpperCase() + value.slice(1) });
    });
  });
  renderState();
})();
`.trim();
}
