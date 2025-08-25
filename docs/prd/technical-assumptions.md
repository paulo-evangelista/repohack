# Technical Assumptions

**Repository Structure: Monorepo**
- Single Next.js project containing all frontend and backend code
- All scanning logic, UI components, and server actions in one repository
- Simplifies development and deployment for a focused MVP

**Service Architecture: Monolith**
- Single Next.js application with server actions handling scanning operations
- No external microservices or separate backend services
- All functionality contained within the Next.js app for simplicity

**Testing Requirements**
- Unit tests are required for core modules with a fast, deterministic test suite
- Framework: Vitest (preferred) or Jest; React Testing Library for components
- Coverage targets: 80% lines/branches for `lib/**` and `app/lib/actions/**`; 70% for `components/**`
- Critical paths must have tests: server action orchestrator, AST parsing utilities, scanners, Git/file utilities, and JSON result aggregation
- Tests must be runnable locally and in CI via a single command (e.g., `pnpm test`)
- No network or filesystem side-effects in unit tests; use mocks/test fixtures
- Snapshot tests allowed only for stable JSON schemas and UI states

**Additional Technical Assumptions and Requests:**

- **Next.js Version**: Latest stable version (14+) with app directory structure
- **Server Actions Architecture**: 
  - Root `scan()` function annotated with "use server" directive
  - This function receives client-side data and Next.js handles client-server communication
  - Individual threat scanning functions called from within the server context (no "use server" needed)
  - Each function scans for one specific threat type and returns results
- **Git Operations**: Direct Git operations from server-side code using libraries like `simple-git`
- **File Processing**: Node.js file system operations for repository analysis
- **Dependency Analysis**: npm package analysis using registry APIs
- **Code Parsing**: AST-based analysis for detecting malicious patterns
- **Deployment**: Vercel hosting with Next.js serverless deployment
- **No Database**: Stateless architecture with no persistent storage
- **No External APIs**: Self-contained scanning without third-party security services
- **Performance**: Optimized for repositories under 100MB with 15-second scan time
