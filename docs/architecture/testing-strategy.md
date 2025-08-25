# Testing Strategy

## Approach & Tooling
- **Framework**: Vitest for unit tests; React Testing Library for component tests
- **Runner**: Vitest watch and CI modes; single command to run all tests (e.g., `pnpm test`)
- **Coverage Targets**: 80% lines/branches for `lib/**` and `lib/actions/**`; 70% for `components/**`
- **Principles**: Fast, deterministic, isolated tests with mocks for filesystem, Git, and network

## Test Structure
```
repohack/
├── lib/
│   └── ...
├── components/
│   └── ...
├── tests/
│   ├── fixtures/              # Small code samples, package.jsons, etc.
│   ├── mocks/                 # simple-git, fs, fetch, timers
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── ast-parser.test.ts
│   │   │   └── file-utils.test.ts
│   │   ├── scanners/
│   │   │   ├── code-execution.test.ts
│   │   │   ├── process-control.test.ts
│   │   │   ├── file-system.test.ts
│   │   │   ├── network-communications.test.ts
│   │   │   ├── environment-access.test.ts
│   │   │   └── dependencies.test.ts
│   │   ├── git/repository.test.ts
│   │   ├── actions/scan.test.ts
│   │   └── aggregation/aggregate-results.test.ts
│   └── ui/
│       ├── RepositoryInput.test.tsx
│       ├── ScanResults.test.tsx
│       └── ThreatDisplay.test.tsx
```

## Unit Test Plan
- **AST Parser (`lib/utils/ast-parser.ts`)**
  - Parses valid TS/JS samples without errors
  - Reports informative errors for malformed inputs
  - Produces node types required by scanners (FunctionCall, NewExpression)

- **File Utilities (`lib/utils/file-utils.ts`)**
  - Filters by extensions; ignores binary/large files using size thresholds
  - Normalizes paths across platforms; handles empty files

- **Git Repository (`lib/git/repository.ts`)**
  - Clones repository via mocked `simple-git`; handles invalid URLs
  - Extracts metadata (name, owner, size, commit) from fixtures
  - Cleans up temp directories on success/failure

- **Scanners (`lib/scanners/*.ts`)**
  - Code Execution: detects `eval`, `new Function`, `setTimeout('code', ...)`; no false positive on `setTimeout(fn, ...)`
  - Process Control: detects `child_process` imports and `exec/spawn`; flags dynamic commands
  - File System: detects read/write ops; resolves relative paths safely
  - Network: detects `fetch/axios/http/https` with external URLs; flags dynamic URLs
  - Environment Access: detects `process.env.*`; flags dynamic key access
  - Dependencies: flags suspicious packages using mocked registry responses; parses `package.json`
  - All scanners: return `ThreatResult[]` with required fields and severities

- **Aggregation (`aggregateResults`)**
  - Merges results by category/subcategory; stable sort and dedupe
  - Preserves severity and includes counts per category

- **Server Action Orchestrator (`lib/actions/scan.ts`)**
  - Invokes all scanners in parallel; aggregates and returns schema-compliant result
  - Error path: partial results returned when one scanner throws; cleanup always invoked

- **API Health Route (`app/api/health/route.ts`)**
  - Returns 200 and expected JSON shape; no external calls

- **UI Components (`components/**`)**
  - RepositoryInput: validates URL; disables button during submit; calls submit handler
  - ScanResults: renders overall status; expands/collapses categories; color-codes severity
  - ThreatDisplay: shows file, line, code snippet; handles empty states

## Test Data & Mocks
- **Fixtures**: minimal TS files for each pattern; `package.json` variations; small directory trees
- **Mocks**: `fs`, `simple-git`, `fetch`/registry, timers (`vi.useFakeTimers()`), and network requests

## CI Integration
- Run `pnpm lint && pnpm test --coverage`
- Fail build if coverage drops below thresholds; artifacts include coverage report
