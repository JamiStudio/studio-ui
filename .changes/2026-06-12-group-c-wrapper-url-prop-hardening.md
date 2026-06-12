Harden the Group C Radix/React wrapper sanitizer for URL-equivalent props.

Wrapper passthrough and `JamiButton asChild` child props now reject obfuscated
`javascript:` values on URL-bearing prop names such as `srcSet`, `formAction`,
and `poster`, in addition to the existing `href`, `src`, and `xlinkHref`
coverage. The regression suite covers the asChild child-prop path so the Radix
Slot composition surface stays inert.
