# Requirements

**Functional Requirements:**

- **FR1**: The system must accept any .git repository URL input from users
- **FR2**: The system must automatically clone target repositories for analysis
- **FR3**: The system must scan for arbitrary code execution patterns (eval, Function, setTimeout with code strings)
- **FR4**: The system must detect process spawning attempts (child_process, exec, spawn calls)
- **FR5**: The system must identify suspicious npm dependencies (recently published packages, unusual patterns)
- **FR6**: The system must detect unauthorized file system access operations
- **FR7**: The system must identify unexpected network calls and data exfiltration attempts
- **FR8**: The system must detect environment variable access attempts
- **FR9**: The system must identify shell command execution patterns
- **FR10**: The system must return scan results in structured JSON format
- **FR11**: The system must display comprehensive security summary to users
- **FR12**: The system must provide clear safety rating (Safe/Unsafe/Warning)

**Non-Functional Requirements:**

- **NFR1**: Repository scans must complete within 15 seconds for standard repositories
- **NFR2**: The web interface must work across all major browsers (Chrome, Firefox, Safari, Edge)
- **NFR3**: The system must handle repositories up to 100MB without timeout issues
- **NFR4**: Scan results must be accurate with false positive rate below 5%
- **NFR5**: The application must be deployable on Vercel as a Next.js project, utilizing Next.js server actions for scanning operations rather than traditional serverless functions like AWS Lambda
- **NFR6**: The system must not persist any user data or scan results
- **NFR7**: The interface must be responsive and work on mobile devices
- **NFR8**: Threat detection algorithms must be efficient and not cause memory issues
