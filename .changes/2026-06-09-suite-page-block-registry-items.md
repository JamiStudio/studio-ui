# Suite Page And Block Registry Items

- Derived standalone page and block registry items from the authored suite shell
  descriptors for all four suite lanes.
- Suite install graphs now expose those lower-level page/block manifests
  independently, and CLI smoke tests install/provenance-check them in temp
  projects.
- The registry publish dry-run now recurses through nested generated suite
  artifacts so page/block manifests are included in hash and secret scans.
