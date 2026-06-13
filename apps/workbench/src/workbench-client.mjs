import { ARTIFACT_VERSION, STORAGE_KEY, factoryDraft } from "./workbench-state.mjs";
import { REGISTRATION_CONTRACT_VERSION } from "./workbench-registration.mjs";

export function buildWorkbenchClientScript(brandOptionMap = {}, backendConfig = {}) {
  return `
(function () {
  var STORAGE_KEY = ${JSON.stringify(STORAGE_KEY)};
  var ARTIFACT_VERSION = ${JSON.stringify(ARTIFACT_VERSION)};
  var REGISTRATION_CONTRACT_VERSION = ${JSON.stringify(REGISTRATION_CONTRACT_VERSION)};
  var factoryDraft = ${JSON.stringify(factoryDraft)};
  var brandOptions = ${JSON.stringify(brandOptionMap)};
  var backendConfig = ${JSON.stringify(backendConfig)};
  var BACKEND_STATE = { CONFIG_MISSING: 'config-missing', HOSTED_UNAVAILABLE: 'hosted-unavailable', CONFLICT: 'conflict', AVAILABLE: 'available' };
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function makeBackendStatus(status, detail) {
    detail = detail && typeof detail === 'object' ? detail : {};
    return {
      contractVersion: REGISTRATION_CONTRACT_VERSION,
      status: status,
      backendPersistence: status === BACKEND_STATE.AVAILABLE,
      packageRegistration: status === BACKEND_STATE.AVAILABLE,
      localFallback: status !== BACKEND_STATE.AVAILABLE,
      reason: detail.reason || null,
      endpointConfigured: detail.endpointConfigured === true,
      operation: detail.operation || null,
      remoteId: detail.remoteId || null,
      revision: detail.revision || null,
      conflict: detail.conflict || null
    };
  }
  function defaultBackendStatus() {
    return makeBackendStatus(BACKEND_STATE.CONFIG_MISSING, { reason: 'No workbench backend endpoint is configured in the static artifact.' });
  }
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
      importArtifact: seed.importArtifact || null,
      inspectorFocus: seed.inspectorFocus || null,
      online: seed.online !== false,
      backend: seed.backend && typeof seed.backend === 'object' ? seed.backend : defaultBackendStatus(),
      conflict: seed.conflict || null,
      lastAction: seed.lastAction || 'ready'
    };
  }
  function isDirty(state) {
    return JSON.stringify(normalizeDraft(state.draft)) !== JSON.stringify(normalizeDraft(state.saved));
  }
  function sanitizeControls(controls) {
    var out = {};
    Object.keys(controls && typeof controls === 'object' ? controls : {}).forEach(function (key) {
      if (/(secret|token|api[_-]?key|password|authorization|cookie|private[_-]?key|connection[_-]?string)/i.test(key)) return;
      if (/^on[A-Z]|^on[a-z]|^(handler|callback|function|script|dangerouslySetInnerHTML)$/i.test(key)) return;
      var value = controls[key];
      if (['string', 'number', 'boolean'].indexOf(typeof value) !== -1) out[key] = String(value);
    });
    return out;
  }
  function makeRegistrationRequest(state, operation) {
    var draft = normalizeDraft(state.draft);
    return {
      schemaVersion: REGISTRATION_CONTRACT_VERSION,
      operation: operation,
      idempotencyKey: draft.target + ':' + draft.presetName + ':' + operation,
      workbench: {
        target: draft.target,
        themeName: draft.themeName,
        presetName: draft.presetName,
        controls: sanitizeControls(draft.controls)
      },
      artifact: operation === 'export' && state.exportArtifact ? clone(state.exportArtifact) : operation === 'import' && state.importArtifact ? clone(state.importArtifact) : null,
      client: {
        surface: 'apps/workbench',
        storageFallback: 'localStorage',
        hostedPersistenceClaimed: false,
        backendRegistrationClaimed: false
      },
      safety: {
        executableHandlersIncluded: false,
        secretsIncluded: false
      }
    };
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
      controls: sanitizeControls(draft.controls),
      backendPersistence: false,
      localOnly: true,
      registrationContract: makeRegistrationRequest(state, action),
      backend: state.backend || defaultBackendStatus(),
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
    if (event.type === 'select-brand-option') {
      return Object.assign({}, current, {
        draft: Object.assign({}, current.draft, {
          presetName: event.presetName,
          themeName: event.themeName || current.draft.themeName,
          controls: Object.assign({}, current.draft.controls, event.controls && typeof event.controls === 'object' ? event.controls : {})
        }),
        lastAction: 'selected-brand-option'
      });
    }
    if (event.type === 'save') return Object.assign({}, current, { saved: normalizeDraft(current.draft), conflict: null, lastAction: 'saved-local' });
    if (event.type === 'discard') return Object.assign({}, current, { draft: normalizeDraft(current.saved), conflict: null, lastAction: 'discarded-local-draft' });
    if (event.type === 'rename') {
      return Object.assign({}, current, {
        draft: Object.assign({}, current.draft, {
          themeName: String(event.themeName || '').trim() || current.draft.themeName,
          presetName: String(event.presetName || '').trim() || current.draft.presetName
        }),
        lastAction: 'renamed-local-draft'
      });
    }
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
    if (event.type === 'import') {
      var artifact = event.artifact && typeof event.artifact === 'object' ? event.artifact : null;
      if (!artifact || artifact.schemaVersion !== ARTIFACT_VERSION || !artifact.controls) {
        return Object.assign({}, current, {
          conflict: { kind: 'invalid-import', expectedSchemaVersion: ARTIFACT_VERSION },
          lastAction: 'import-rejected'
        });
      }
      return Object.assign({}, current, {
        draft: normalizeDraft({
          target: artifact.target,
          themeName: artifact.themeName,
          presetName: artifact.presetName,
          controls: artifact.controls
        }),
        importArtifact: artifact,
        conflict: null,
        lastAction: 'imported-local-artifact'
      });
    }
    if (event.type === 'focus-inspector') return Object.assign({}, current, { inspectorFocus: event.target || null, lastAction: 'inspector-focused' });
    if (event.type === 'set-online') return Object.assign({}, current, { online: event.online !== false, lastAction: event.online === false ? 'offline-local' : 'online-local' });
    if (event.type === 'backend-status') {
      var backend = event.backend && typeof event.backend === 'object' ? event.backend : defaultBackendStatus();
      return Object.assign({}, current, {
        backend: backend,
        conflict: backend.status === BACKEND_STATE.CONFLICT ? { kind: 'backend-conflict', detail: backend.conflict } : current.conflict,
        lastAction: (backend.operation || 'backend') + '-' + backend.status
      });
    }
    return current;
  }
  function normalizeBackendConfig(config) {
    var endpoint = config && typeof config.endpoint === 'string' ? config.endpoint.trim() : '';
    if (!endpoint) return { status: BACKEND_STATE.CONFIG_MISSING, endpoint: null, reason: 'missing-endpoint' };
    try {
      var url = new URL(endpoint, window.location.origin);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return { status: BACKEND_STATE.CONFIG_MISSING, endpoint: null, reason: 'unsupported-endpoint-protocol' };
      return { status: BACKEND_STATE.AVAILABLE, endpoint: url.toString(), reason: null };
    } catch (error) {
      return { status: BACKEND_STATE.CONFIG_MISSING, endpoint: null, reason: 'invalid-endpoint-url' };
    }
  }
  function reportBackend(operation) {
    var normalized = normalizeBackendConfig(backendConfig);
    if (normalized.status !== BACKEND_STATE.AVAILABLE) {
      dispatch({ type: 'backend-status', backend: makeBackendStatus(BACKEND_STATE.CONFIG_MISSING, { reason: normalized.reason, operation: operation }) }, true);
      return;
    }
    if (typeof window.fetch !== 'function') {
      dispatch({ type: 'backend-status', backend: makeBackendStatus(BACKEND_STATE.HOSTED_UNAVAILABLE, { reason: 'fetch-unavailable', endpointConfigured: true, operation: operation }) }, true);
      return;
    }
    window.fetch(normalized.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(makeRegistrationRequest(state, operation))
    }).then(function (response) {
      return response.text().then(function (text) {
        var body = null;
        try { body = text ? JSON.parse(text) : null; } catch (error) { body = null; }
        if (response.status === 409) {
          dispatch({ type: 'backend-status', backend: makeBackendStatus(BACKEND_STATE.CONFLICT, { reason: 'remote-conflict', endpointConfigured: true, operation: operation, conflict: body && body.conflict ? body.conflict : { status: 409 } }) }, true);
        } else if (!response.ok) {
          dispatch({ type: 'backend-status', backend: makeBackendStatus(BACKEND_STATE.HOSTED_UNAVAILABLE, { reason: 'http-' + response.status, endpointConfigured: true, operation: operation }) }, true);
        } else {
          dispatch({ type: 'backend-status', backend: makeBackendStatus(BACKEND_STATE.AVAILABLE, { endpointConfigured: true, operation: operation, remoteId: body && (body.id || body.remoteId) || null, revision: body && body.revision || null }) }, true);
        }
      });
    }).catch(function (error) {
      dispatch({ type: 'backend-status', backend: makeBackendStatus(BACKEND_STATE.HOSTED_UNAVAILABLE, { reason: error && error.name ? error.name : 'request-failed', endpointConfigured: true, operation: operation }) }, true);
    });
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
    var importNode = document.getElementById('ju-wb-import');
    if (importNode && state.importArtifact && !importNode.value) importNode.value = JSON.stringify(state.importArtifact, null, 2);
    var list = document.getElementById('ju-wb-registered');
    if (list) {
      list.innerHTML = '';
      state.registeredArtifacts.forEach(function (artifact) {
        var li = document.createElement('li');
        li.textContent = artifact.themeName + ' / ' + artifact.schemaVersion + ' / ' + (artifact.backend && artifact.backend.status ? artifact.backend.status : 'local artifact');
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
    setText('ju-wb-storage', state.online ? 'local draft / ' + state.backend.status : 'local draft / offline');
    setText('ju-wb-backend', state.backend.status + (state.backend.reason ? ' / ' + state.backend.reason : ''));
    setText('ju-wb-inspector', state.inspectorFocus || 'none');
    setText('ju-wb-conflict', state.conflict ? state.conflict.kind : 'none');
    var renameNode = document.getElementById('ju-wb-rename');
    if (renameNode && renameNode.value !== state.draft.themeName) renameNode.value = state.draft.themeName;
    applyDraft();
    renderArtifacts();
  }
  function dispatch(event, skipBackend) {
    state = reduce(state, event);
    persist();
    renderState();
    if (!skipBackend && ['save', 'restore', 'register', 'export', 'import'].indexOf(event.type) !== -1) reportBackend(event.type);
  }
  var state = loadState();
  document.querySelectorAll('[data-wb-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = button.getAttribute('data-wb-action');
      if (action === 'import') {
        var input = document.getElementById('ju-wb-import');
        var artifact = null;
        try { artifact = JSON.parse(input && input.value ? input.value : '{}'); } catch (error) { artifact = null; }
        dispatch({ type: 'import', artifact: artifact });
      } else if (action === 'rename') {
        var rename = document.getElementById('ju-wb-rename');
        dispatch({ type: 'rename', themeName: rename ? rename.value : '' });
      } else if (action === 'offline') {
        dispatch({ type: 'set-online', online: false });
      } else if (action === 'online') {
        dispatch({ type: 'set-online', online: true });
      } else {
        dispatch({ type: action });
      }
    });
  });
  document.querySelectorAll('[data-inspector-target]').forEach(function (button) {
    button.addEventListener('click', function () {
      dispatch({ type: 'focus-inspector', target: button.getAttribute('data-inspector-target') });
    });
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
  document.querySelectorAll('[data-brand-option]').forEach(function (button) {
    button.addEventListener('click', function () {
      var optionId = button.getAttribute('data-brand-option');
      var option = brandOptions[optionId] || {};
      dispatch({
        type: 'select-brand-option',
        presetName: optionId,
        themeName: option.title || optionId,
        controls: option.workbenchControls || {}
      });
    });
  });
  renderState();
})();
`.trim();
}
