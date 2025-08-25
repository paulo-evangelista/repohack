# Threat Detection Architecture

## Scanning Categories

**1. Code Execution Threats**
- **Module**: `lib/scanners/code-execution.ts`
- **Patterns**: `eval()`, `Function()`, `setTimeout()` with code strings
- **Severity**: CRITICAL for eval, WARNING for others
- **Method**: AST traversal with pattern matching

**2. Process Control Threats**
- **Module**: `lib/scanners/process-control.ts`
- **Patterns**: `child_process`, `exec()`, `spawn()` calls
- **Severity**: WARNING
- **Method**: AST analysis for module imports and function calls

**3. File System Threats**
- **Module**: `lib/scanners/file-system.ts`
- **Patterns**: File read/write operations, path manipulation
- **Severity**: WARNING
- **Method**: AST scanning for fs module usage

**4. Network Communication Threats**
- **Module**: `lib/scanners/network-communications.ts`
- **Patterns**: HTTP requests, API calls, data exfiltration
- **Severity**: WARNING
- **Method**: AST analysis for network-related imports and calls

**5. Environment Access Threats**
- **Module**: `lib/scanners/environment-access.ts`
- **Patterns**: `process.env` access, configuration files
- **Severity**: WARNING
- **Method**: AST scanning and file content analysis

**6. Dependency Threats**
- **Module**: `lib/scanners/dependencies.ts`
- **Patterns**: Suspicious packages, typosquatting, recent publications
- **Severity**: WARNING
- **Method**: npm registry API analysis and package.json parsing

## Scanner Interface

```typescript
interface ThreatScanner {
  name: string;
  category: string;
  subcategory: string;
  scan(files: RepositoryFile[]): Promise<ThreatResult[]>;
}

interface ThreatResult {
  category: string;
  subcategory: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  file: string;
  line?: number;
  code?: string;
  details?: Record<string, any>;
}
```
