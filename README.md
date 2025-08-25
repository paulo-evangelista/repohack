# repoHack

Instant repository security scanning focused on detecting malicious patterns commonly found in recruiter-shared TypeScript/JavaScript projects.

## Overview

repoHack is a monolithic Next.js (14+) app that clones a public Git repository, analyzes it with AST-based scanners, and returns a structured JSON report within seconds. The MVP is stateless, has no database, and is deployable to Vercel.

## Features (MVP)

- Paste a `.git` URL and run a full scan
- Threat categories: code execution, process control, file system, network, environment, dependencies
- Structured JSON results with file locations, lines, and snippets
- Minimalist dark UI with adaptive JSON rendering

## Requirements

- Node.js: v20+ (LTS recommended)
- pnpm: v8+
- OS: macOS, Linux, or Windows (WSL2 recommended on Windows)

## Quickstart

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000

## Scripts

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production build locally
pnpm start

# Lint and format checks
pnpm lint

# Run unit tests with coverage
pnpm test --coverage
```

## Environment Variables

These are read at build/runtime as applicable. For local development, use a `.env.local` file if needed.

- `NODE_ENV` (default: `development`)
- `MAX_REPO_SIZE` (default: `104857600` → 100MB)
- `NPM_REGISTRY` (optional; defaults to public registry)
- `LOG_LEVEL` (optional: `error|warn|info|debug`)

## Development Notes

- Architecture: Single Next.js app with server actions coordinating scanners
- Git operations: performed server-side (e.g., via `simple-git`) into a temp directory
- AST parsing: TypeScript/JS files parsed once where possible; scanners consume AST
- Cleanup: all temp files/directories are removed post-scan

## Canonical Scanning Strategy

To maximize speed and meet the 15s target:

- Parallelize scanner execution (code-execution, process-control, file-system, network, environment, dependencies)
- Filter files early (prioritize TS/JS; skip binaries/large files)
- Cache/reuse AST per file when multiple scanners need it
- Early terminate on critical findings where safe to do so

Note: Any prior references to sequential scanning are superseded by this canonical parallel strategy.

## JSON Result Contract (High Level)

The UI renders results adaptively from a stable JSON shape. A full schema file will be added; until then the types below guide integration.

```ts
// High-level types for scan results
export type Severity = 'CRITICAL' | 'WARNING' | 'INFO'

export interface ThreatResult {
  category: string
  subcategory: string
  severity: Severity
  description: string
  file: string
  line?: number
  code?: string
  details?: Record<string, unknown>
}

export interface ScanResult {
  summary: {
    overallStatus: 'SAFE' | 'WARNING' | 'UNSAFE'
    countsBySeverity: { CRITICAL: number; WARNING: number; INFO: number }
  }
  results: Record<string, { // category
    subcategories: Record<string, ThreatResult[]>
  }>
}
```

Example result (truncated):

```json
{
  "summary": {
    "overallStatus": "WARNING",
    "countsBySeverity": { "CRITICAL": 1, "WARNING": 3, "INFO": 0 }
  },
  "results": {
    "code_execution": {
      "subcategories": {
        "eval": [
          {
            "category": "code_execution",
            "subcategory": "eval",
            "severity": "CRITICAL",
            "description": "eval() usage",
            "file": "src/util.ts",
            "line": 42,
            "code": "eval(userInput)"
          }
        ]
      }
    }
  }
}
```

## Testing

- Test Runner: Vitest; UI tests via React Testing Library
- Targets (from docs): 80% for `lib/**` and `lib/actions/**`, 70% for `components/**`
- Run locally and in CI via `pnpm test --coverage`
- Use mocks for filesystem, git, network; no side-effects in unit tests

## CI Expectations

CI should run:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm test --coverage` (fail on thresholds per docs)

A minimal GitHub Actions workflow can be added in `.github/workflows/ci.yml` to enforce this.

## Performance Budgets

- Repo size: ≤ 100MB (configurable via `MAX_REPO_SIZE`)
- Scan time target: ≤ 15s typical
- Memory target: ≤ 512MB per scan

## Project Structure (expected)

```
repohack/
├── app/
├── components/
├── lib/
│   ├── actions/
│   ├── scanners/
│   ├── git/
│   ├── types/
│   └── utils/
├── public/
├── docs/
└── ...
```

## Deployment

- Platform: Vercel (recommended)
- Ensure environment variables are configured
- Build command: `pnpm build`
- Start command (self-host): `pnpm start`

## License

Open source; see repository license terms when added.