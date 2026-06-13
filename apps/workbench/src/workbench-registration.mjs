export const REGISTRATION_CONTRACT_VERSION = "2026-06-13.workbench-registration";

export const BACKEND_STATE = Object.freeze({
  CONFIG_MISSING: "config-missing",
  HOSTED_UNAVAILABLE: "hosted-unavailable",
  CONFLICT: "conflict",
  AVAILABLE: "available",
  LOCAL_FALLBACK: "local-fallback",
});

const UNSAFE_KEY = /(?:secret|token|api[_-]?key|password|authorization|cookie|private[_-]?key|connection[_-]?string)/i;
const EVENT_HANDLER_KEY = /^on[A-Z]|^on[a-z]/;
const EXECUTABLE_KEY = /^(?:handler|callback|function|script|dangerouslySetInnerHTML)$/i;
const EXECUTABLE_VALUE = /(?:javascript:|<script|import\s+.*\s+from|require\s*\()/i;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function scanRegistrationValue(value, path = "$", issues = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanRegistrationValue(item, `${path}[${index}]`, issues));
    return issues;
  }
  if (!isPlainObject(value)) {
    if (typeof value === "string" && EXECUTABLE_VALUE.test(value)) {
      issues.push({ path, kind: "executable-value" });
    }
    return issues;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (key !== "secretsIncluded" && UNSAFE_KEY.test(key)) {
      issues.push({ path: childPath, kind: "secret-key" });
    }
    if (EVENT_HANDLER_KEY.test(key) || EXECUTABLE_KEY.test(key)) {
      issues.push({ path: childPath, kind: "executable-key" });
    }
    scanRegistrationValue(child, childPath, issues);
  }
  return issues;
}

function sanitizeControls(controls) {
  const out = {};
  if (!isPlainObject(controls)) return out;
  for (const [key, value] of Object.entries(controls)) {
    if (UNSAFE_KEY.test(key) || EVENT_HANDLER_KEY.test(key) || EXECUTABLE_KEY.test(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value)) out[key] = String(value);
  }
  return out;
}

export function sanitizeDraftForRegistration(draft) {
  const source = isPlainObject(draft) ? draft : {};
  return {
    target: String(source.target ?? "suite.solo"),
    themeName: String(source.themeName ?? "Jami factory"),
    presetName: String(source.presetName ?? "factory"),
    controls: sanitizeControls(source.controls),
  };
}

export function makeBackendStatus(status, detail = {}) {
  return {
    contractVersion: REGISTRATION_CONTRACT_VERSION,
    status,
    backendPersistence: status === BACKEND_STATE.AVAILABLE,
    packageRegistration: status === BACKEND_STATE.AVAILABLE,
    localFallback: status !== BACKEND_STATE.AVAILABLE,
    reason: detail.reason ?? null,
    endpointConfigured: detail.endpointConfigured === true,
    operation: detail.operation ?? null,
    remoteId: detail.remoteId ?? null,
    revision: detail.revision ?? null,
    conflict: detail.conflict ?? null,
  };
}

export function defaultBackendStatus() {
  return makeBackendStatus(BACKEND_STATE.CONFIG_MISSING, {
    reason: "No workbench backend endpoint is configured in the static artifact.",
  });
}

export function normalizeBackendConfig(config = {}) {
  const endpoint = typeof config.endpoint === "string" ? config.endpoint.trim() : "";
  if (!endpoint) {
    return {
      status: BACKEND_STATE.CONFIG_MISSING,
      endpoint: null,
      reason: "missing-endpoint",
    };
  }
  let parsed;
  try {
    parsed = new URL(endpoint, "https://registry.jami.studio");
  } catch {
    return {
      status: BACKEND_STATE.CONFIG_MISSING,
      endpoint: null,
      reason: "invalid-endpoint-url",
    };
  }
  if (!["https:", "http:"].includes(parsed.protocol)) {
    return {
      status: BACKEND_STATE.CONFIG_MISSING,
      endpoint: null,
      reason: "unsupported-endpoint-protocol",
    };
  }
  return {
    status: BACKEND_STATE.AVAILABLE,
    endpoint: parsed.toString(),
    reason: null,
  };
}

export function makeRegistrationRequest(state, operation, options = {}) {
  const draft = sanitizeDraftForRegistration(state?.draft ?? state?.saved);
  const payload = {
    schemaVersion: REGISTRATION_CONTRACT_VERSION,
    operation,
    idempotencyKey: `${draft.target}:${draft.presetName}:${operation}`,
    workbench: draft,
    artifact:
      state?.exportArtifact && operation === "export"
        ? clone(state.exportArtifact)
        : state?.importArtifact && operation === "import"
          ? clone(state.importArtifact)
          : null,
    client: {
      surface: "apps/workbench",
      storageFallback: "localStorage",
      hostedPersistenceClaimed: false,
      backendRegistrationClaimed: false,
    },
    safety: {
      executableHandlersIncluded: false,
      secretsIncluded: false,
    },
  };
  const issues = scanRegistrationValue(payload);
  if (issues.length > 0) {
    return {
      ok: false,
      request: null,
      status: makeBackendStatus(BACKEND_STATE.LOCAL_FALLBACK, {
        reason: "unsafe-registration-payload",
        operation,
        conflict: issues,
      }),
    };
  }
  return {
    ok: true,
    request: {
      ...payload,
      evidence: {
        generatedAt: options.generatedAt ?? "static-runtime",
        unsafeIssueCount: issues.length,
      },
    },
    status: makeBackendStatus(BACKEND_STATE.LOCAL_FALLBACK, {
      reason: "local-request-ready",
      operation,
    }),
  };
}

export async function submitRegistrationOperation({ state, operation, config, fetchImpl = globalThis.fetch }) {
  const normalized = normalizeBackendConfig(config);
  const built = makeRegistrationRequest(state, operation);
  if (!built.ok) return built.status;
  if (normalized.status !== BACKEND_STATE.AVAILABLE) {
    return makeBackendStatus(BACKEND_STATE.CONFIG_MISSING, {
      reason: normalized.reason,
      operation,
    });
  }
  if (typeof fetchImpl !== "function") {
    return makeBackendStatus(BACKEND_STATE.HOSTED_UNAVAILABLE, {
      reason: "fetch-unavailable",
      endpointConfigured: true,
      operation,
    });
  }
  try {
    const response = await fetchImpl(normalized.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(built.request),
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (response.status === 409) {
      return makeBackendStatus(BACKEND_STATE.CONFLICT, {
        reason: "remote-conflict",
        endpointConfigured: true,
        operation,
        conflict: body?.conflict ?? { status: 409 },
      });
    }
    if (!response.ok) {
      return makeBackendStatus(BACKEND_STATE.HOSTED_UNAVAILABLE, {
        reason: `http-${response.status}`,
        endpointConfigured: true,
        operation,
      });
    }
    return makeBackendStatus(BACKEND_STATE.AVAILABLE, {
      endpointConfigured: true,
      operation,
      remoteId: body?.id ?? body?.remoteId ?? null,
      revision: body?.revision ?? null,
    });
  } catch (error) {
    return makeBackendStatus(BACKEND_STATE.HOSTED_UNAVAILABLE, {
      reason: error?.name ?? "request-failed",
      endpointConfigured: true,
      operation,
    });
  }
}
