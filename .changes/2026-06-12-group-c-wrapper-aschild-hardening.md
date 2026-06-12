Harden the Group C Radix/React wrapper safety pass after fresh adversarial review.

`JamiButton` now sanitizes the exposed `asChild` React element tree before Radix
Slot merges wrapper props, so child-provided event handlers, dangerous HTML
props, forged executable flags, and `javascript:` URL props are stripped before
render. The UI regression suite now covers unsafe `asChild` child props in
addition to wrapper-level passthrough props.

Refresh the package-readiness wording so the release checklist no longer claims
a zero-third-party-dependency footprint after the local React/Radix wrapper
dependencies landed.
