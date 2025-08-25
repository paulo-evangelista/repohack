# Executive Summary

**System Overview**: repoHack is a monolithic Next.js 14+ application that provides instant repository security scanning through a web-based interface. The system clones Git repositories, performs comprehensive threat analysis using AST-based code parsing, and returns structured security results within 15 seconds.

**Architecture Pattern**: Monolithic Next.js application with server actions for scanning operations, deployable on Vercel with stateless, serverless architecture.

**Key Technical Decisions**:
- Next.js 14+ with app directory structure for modern React patterns
- Server actions with "use server" directive for scanning operations
- AST-based code analysis for threat detection
- Temporary file system operations with automatic cleanup
- No database or persistent storage for MVP
