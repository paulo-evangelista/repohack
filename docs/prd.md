# repoHack Product Requirements Document (PRD)

## Goals and Background Context

**Goals:**
- Protect developers from recruiter scam repositories by providing instant security scanning
- Establish repoHack as a trusted, open-source security tool in the developer community
- Reduce successful attacks through malicious repository execution
- Build an open-source community around repository security awareness
- Deliver a simple, effective web interface for repository safety assessment

**Background Context:**
repoHack addresses a critical security gap in the developer ecosystem where recruiters are exploiting the trust-based hiring process by sending malicious TypeScript repositories to job candidates. These repositories contain code designed to steal sensitive information, particularly cryptocurrency keys, from developers' computers. The current landscape lacks specialized tools for repository safety assessment, leaving developers vulnerable to sophisticated social engineering attacks. repoHack fills this void by providing an accessible, web-based security scanning service that allows developers to quickly verify repository safety before running potentially malicious code.

**Change Log:**
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| [Current Date] | v1.0 | Initial PRD creation | PM Agent |

## Requirements

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

## User Interface Design Goals

**Overall UX Vision:**
A minimalist, security-focused interface with a dark theme that prioritizes clarity and trust. The design should feel like a developer tool with clean, monospace typography and subtle blue accents. No branding elements - just pure functionality.

**Key Interaction Paradigms:**
- **Single-Input Focus**: One prominent input field for repository URLs
- **Progressive Disclosure**: Show high-level results first, then allow drilling down into details
- **Clear Visual Hierarchy**: Safety status should be immediately obvious
- **Minimal Cognitive Load**: Users should understand results at a glance

**Core Screens and Views:**
- **Home/Scan Input Page**: Clean landing page with prominent URL input and clear value proposition
- **Scan Results Page**: Comprehensive security report with clear safety rating and detailed breakdown
- **Loading/Processing State**: Simple progress indication during repository analysis

**Accessibility: None**
- MVP focus on core functionality
- Accessibility features can be added in future versions

**Branding:**
- **No Branding**: Pure functional design without logos or brand elements
- **Developer Tool Aesthetic**: Clean, code-editor inspired design language
- **Minimalist Approach**: Focus on content and functionality over visual design

**Target Device and Platforms: Web Responsive**
- Primary focus on desktop/laptop usage (where developers typically work)
- Mobile-responsive design for on-the-go repository checking
- Optimized for standard web browsers across all major platforms

**Design Specifications:**
- **Theme**: Dark theme only
- **Typography**: Fira Mono monospace font
- **Styling**: Tailwind CSS for utility-first styling and responsive design
- **Accent Color**: Blue accents for interactive elements and status indicators
- **Layout**: Minimal, clean design with plenty of whitespace
- **Visual Elements**: Simple, functional design without decorative elements

## Technical Assumptions

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

## Epic List

**Epic 1: Foundation & Core Infrastructure**
Establish the Next.js project setup, basic project structure, and core scanning infrastructure while delivering a functional health-check route and basic repository cloning capability.

**Epic 2: Basic Threat Detection (Arbitrary Code Execution)**
Implement the first threat scanning capability focusing on arbitrary code execution patterns (eval, Function, setTimeout with code strings), creating a working security analysis foundation.

**Epic 3: User Interface & Experience**
Build the complete web interface with the minimalist dark theme design, including the scan input form and adaptive results display that dynamically renders the JSON structure.

**Epic 4: Advanced Threat Detection (Process Spawning)**
Add detection for process spawning attempts (child_process, exec, spawn calls) to expand security coverage.

**Epic 5: Dependency & Network Analysis**
Implement suspicious dependency detection and network call analysis for comprehensive threat coverage.

**Epic 6: File System & Environment Security**
Add file system access monitoring and environment variable access detection to complete the security scanning capabilities.

## Epic Details

### Epic 1: Foundation & Core Infrastructure

**Expanded Goal**: Establish the foundational Next.js project structure and core scanning infrastructure while delivering basic repository cloning functionality. This epic creates the technical foundation that all subsequent threat detection capabilities will build upon, ensuring a solid base for the security scanning system.

#### Story 1.1: Project Setup and Next.js Foundation

**As a developer,**
**I want a properly configured Next.js 14+ project with app directory structure,**
**so that I have a solid foundation for building the security scanning application.**

**Acceptance Criteria:**
1. Next.js 14+ project is created with app directory structure
2. Project uses TypeScript for type safety
3. Basic project structure includes app/, components/, lib/, and utils/ directories
4. Package.json includes necessary dependencies for development
5. Git repository is initialized with proper .gitignore
6. Project can be run locally with `npm run dev`
7. Basic health-check route at `/api/health` returns status information

#### Story 1.2: Repository Cloning Infrastructure

**As a developer,**
**I want the system to clone Git repositories from provided URLs,**
**so that I can analyze the code for security threats.**

**Acceptance Criteria:**
1. Server action can accept GitHub repository URLs
2. System can clone public repositories using simple-git or similar library
3. Cloned repositories are stored in temporary directory during scanning
4. System handles basic Git operations (clone, checkout, file access)
5. Error handling for invalid URLs, private repositories, and network issues
6. Repository metadata is extracted (name, owner, size, commit hash)
7. Temporary files are properly cleaned up after scanning

#### Story 1.3: Basic File System Operations

**As a developer,**
**I want the system to navigate and read repository files,**
**so that I can analyze code content for security threats.**

**Acceptance Criteria:**
1. System can traverse repository directory structure
2. TypeScript and JavaScript files are identified and prioritized
3. Package.json and lock files are accessible for dependency analysis
4. File content can be read and parsed for analysis
5. System handles different file encodings and formats
6. Large files are processed efficiently without memory issues
7. File metadata (path, size, modification date) is captured

### Epic 2: Basic Threat Detection (Arbitrary Code Execution)

**Expanded Goal**: Implement the first threat scanning capability focusing on arbitrary code execution patterns, creating a working security analysis foundation that can detect dangerous code constructs and provide detailed threat information in the established JSON structure.

#### Story 2.1: AST-Based Code Parsing

**As a developer,**
**I want the system to parse TypeScript/JavaScript code into an Abstract Syntax Tree,**
**so that I can analyze code structure for security threats.**

**Acceptance Criteria:**
1. System uses appropriate AST parser (e.g., @typescript-eslint/parser or babel)
2. TypeScript and JavaScript files are parsed without errors
3. AST nodes are accessible for pattern matching and analysis
4. System handles different TypeScript configurations and syntax versions
5. Parse errors are gracefully handled and logged
6. AST parsing performance is optimized for large files
7. System can identify function calls, variable declarations, and expressions

#### Story 2.1.5: Linting and Code Quality Cleanup

**As a developer,**
**I want all linting issues to be resolved and code quality standards maintained,**
**so that the codebase meets our quality standards and future development can proceed smoothly.**

**Acceptance Criteria:**
1. All ESLint errors are resolved (currently 31 errors)
2. All ESLint warnings are addressed (currently 12 warnings)
3. TypeScript strict mode compliance is maintained
4. No `@typescript-eslint/no-explicit-any` violations remain
5. All unused imports and variables are removed
6. Code follows established TypeScript and ESLint rules
7. All tests continue to pass after linting fixes
8. Linting configuration is properly maintained for future development

#### Story 2.2: Eval Function Detection

**As a developer,**
**I want the system to detect eval() function usage,**
**so that I can identify potential arbitrary code execution threats.**

**Acceptance Criteria:**
1. System scans AST for eval() function calls
2. Detects both direct eval() calls and variable-based eval calls
3. Captures file location, line number, and surrounding code context
4. Identifies eval() calls with dynamic content (variables, user input)
5. Results are formatted according to the established JSON structure
6. Threat severity is properly categorized (CRITICAL for eval usage)
7. System can handle different eval() usage patterns and edge cases

#### Story 2.3: Function Constructor Detection

**As a developer,**
**I want the system to detect Function constructor usage,**
**so that I can identify alternative code execution threats.**

**Acceptance Criteria:**
1. System scans AST for `new Function()` constructor calls
2. Detects Function constructor with dynamic code strings
3. Captures file location, line number, and code context
4. Identifies potential for code injection via Function constructor
5. Results are properly categorized under code_execution category
6. Threat severity is set to WARNING level
7. System handles various Function constructor usage patterns

### Epic 3: User Interface & Experience

**Expanded Goal**: Build the complete web interface with minimalist dark theme design using Tailwind CSS, including the scan input form and adaptive results display that dynamically renders the JSON structure. This epic creates the user-facing experience that makes the security scanning tool accessible and intuitive for developers.

#### Story 3.1: Dark Theme Foundation and Layout

**As a developer,**
**I want a consistent dark theme with proper Tailwind CSS styling,**
**so that the application has a professional, developer-friendly appearance.**

**Acceptance Criteria:**
1. Application uses dark theme with Tailwind CSS utility classes
2. Fira Mono monospace font is applied throughout the interface
3. Blue accent colors are used for interactive elements and status indicators
4. Layout is responsive and works on desktop and mobile devices
5. Proper contrast ratios ensure text readability
6. Consistent spacing and typography scale using Tailwind spacing system
7. Dark background with appropriate text colors for developer comfort

#### Story 3.2: Repository Input Form

**As a developer,**
**I want a simple, prominent input field for repository URLs,**
**so that I can quickly submit repositories for security scanning.**

**Acceptance Criteria:**
1. Large, prominent input field for repository URL entry
2. Input field accepts .git URLs and GitHub repository links
3. Form validation ensures valid repository URL format
4. Submit button is clearly visible and properly styled
5. Loading state is shown during form submission
6. Error handling displays clear messages for invalid URLs
7. Form is centered and focused for optimal user experience

#### Story 3.3: Scan Results Display

**As a developer,**
**I want to see comprehensive scan results in a clear, organized format,**
**so that I can quickly understand the security status of a repository.**

**Acceptance Criteria:**
1. Overall security status is prominently displayed (Safe/Unsafe/Warning)
2. Results dynamically render the JSON structure without hardcoded sections
3. Each category and subcategory is clearly organized and expandable
4. Threat details include file locations, line numbers, and code snippets
5. Severity levels are visually distinguished with appropriate colors
6. Results are responsive and work on all device sizes
7. Empty states are handled gracefully when no threats are found

#### Story 3.4: Adaptive JSON Rendering

**As a developer,**
**I want the UI to automatically adapt to any JSON structure the backend provides,**
**so that new threat types can be added without UI changes.**

**Acceptance Criteria:**
1. UI reads and renders any category structure from the JSON response
2. Subcategories are dynamically rendered as expandable sections
3. Threats array is rendered regardless of threat type or structure
4. New fields added to JSON are automatically displayed
5. UI gracefully handles missing or unexpected JSON fields
6. Component structure is generic and reusable for any data format
7. Performance remains optimal even with complex JSON structures

### Epic 4: Advanced Threat Detection (Process Spawning)

**Expanded Goal**: Add detection for process spawning attempts and system command execution, expanding the security scanning capabilities to identify potential command injection and unauthorized system access threats. This epic builds upon the established scanning infrastructure to provide comprehensive process control analysis.

#### Story 4.1: Child Process Detection

**As a developer,**
**I want the system to detect child_process module usage,**
**so that I can identify potential process spawning threats.**

**Acceptance Criteria:**
1. System scans for `child_process` module imports and requires
2. Detects `exec()`, `execSync()`, `spawn()`, and `spawnSync()` function calls
3. Identifies dynamic command construction with user input or variables
4. Captures file location, line number, and command context
5. Results are categorized under process_control category
6. Threat severity is set to WARNING level for process spawning
7. System handles various child_process usage patterns and edge cases

#### Story 4.2: Shell Command Analysis

**As a developer,**
**I want the system to analyze shell commands for injection risks,**
**so that I can identify dangerous command construction patterns.**

**Acceptance Criteria:**
1. System analyzes command strings passed to exec/spawn functions
2. Detects concatenation of user input with shell commands
3. Identifies template literals and string interpolation in commands
4. Captures the actual command string being executed
5. Results include the specific command and potential injection points
6. System can handle complex command construction patterns
7. Performance impact remains within acceptable scanning time limits

#### Story 4.3: Process Execution Context

**As a developer,**
**I want the system to understand the context around process execution,**
**so that I can assess the risk level of detected threats.**

**Acceptance Criteria:**
1. System identifies if process execution is in response to user input
2. Detects if commands are hardcoded vs. dynamically constructed
3. Analyzes surrounding code for input validation and sanitization
4. Captures function context and call stack information
5. Results include risk assessment based on execution context
6. System can distinguish between safe and dangerous usage patterns
7. Context analysis doesn't significantly impact scanning performance

### Epic 5: Dependency & Network Analysis

**Expanded Goal**: Implement suspicious dependency detection and network call analysis to identify potential threats from external packages and unauthorized network communications. This epic adds comprehensive dependency and network security scanning to provide a complete view of repository security risks.

#### Story 5.1: Package.json Analysis

**As a developer,**
**I want the system to analyze package.json files for suspicious dependencies,**
**so that I can identify potentially malicious or risky npm packages.**

**Acceptance Criteria:**
1. System parses package.json and package-lock.json files
2. Detects recently published packages (within last 30 days)
3. Identifies packages with unusually low download counts
4. Analyzes package names for suspicious patterns or typosquatting
5. Results are categorized under dependencies category
6. Threat severity is set to WARNING for suspicious packages
7. System provides package metadata (version, publish date, download stats)

#### Story 5.2: Network Call Detection

**As a developer,**
**I want the system to detect HTTP/HTTPS requests and network calls,**
**so that I can identify potential data exfiltration or unauthorized communications.**

**Acceptance Criteria:**
1. System scans for fetch(), axios, http/https module usage
2. Detects dynamic URL construction with user input or variables
3. Identifies requests to external domains and APIs
4. Captures request methods, headers, and payload information
5. Results are categorized under network_communications category
6. Threat severity is set to WARNING for suspicious network calls
7. System can handle various HTTP client libraries and patterns

#### Story 5.3: API Key and Credential Detection

**As a developer,**
**I want the system to identify potential API keys and credentials in network calls,**
**so that I can detect unauthorized data transmission.**

**Acceptance Criteria:**
1. System scans for common API key patterns in network requests
2. Detects hardcoded credentials in request headers or bodies
3. Identifies requests to known credential harvesting endpoints
4. Captures the specific endpoint and credential type being sent
5. Results include risk assessment of credential exposure
6. System can handle various authentication patterns and formats
7. Performance impact remains within acceptable scanning time limits

### Epic 6: File System & Environment Security

**Expanded Goal**: Add file system access monitoring and environment variable access detection to complete the comprehensive security scanning capabilities. This epic provides the final layer of security analysis, covering local system access and configuration security to ensure complete threat coverage.

#### Story 6.1: File System Access Detection

**As a developer,**
**I want the system to detect unauthorized file system operations,**
**so that I can identify potential data theft or system manipulation attempts.**

**Acceptance Criteria:**
1. System scans for fs module usage and file system operations
2. Detects file reading operations (readFile, readFileSync)
3. Identifies file writing operations (writeFile, writeFileSync)
4. Captures file paths and access patterns
5. Results are categorized under file_system category
6. Threat severity is set to WARNING for suspicious file access
7. System can handle various file system operation patterns

#### Story 6.2: Environment Variable Access

**As a developer,**
**I want the system to detect environment variable access attempts,**
**so that I can identify potential credential harvesting or configuration theft.**

**Acceptance Criteria:**
1. System scans for process.env usage and environment variable access
2. Detects dynamic environment variable names with user input
3. Identifies attempts to access sensitive configuration variables
4. Captures the specific environment variables being accessed
5. Results are categorized under environment_access category
6. Threat severity is set to WARNING for suspicious env access
7. System can handle various environment variable access patterns

#### Story 6.3: Configuration File Analysis

**As a developer,**
**I want the system to analyze configuration files for security risks,**
**so that I can identify exposed secrets or insecure configurations.**

**Acceptance Criteria:**
1. System scans for common configuration files (.env, config.js, etc.)
2. Detects hardcoded secrets, API keys, and credentials
3. Identifies insecure configuration patterns and defaults
4. Captures configuration file locations and risk details
5. Results are categorized under configuration_security category
6. Threat severity is set to CRITICAL for exposed secrets
7. System can handle various configuration file formats and patterns

## Next Steps

**UX Expert Prompt:**
Create a minimalist, dark-themed user interface for repoHack using Tailwind CSS and Fira Mono font. Focus on a clean, developer-friendly design with blue accents. The interface should have a simple repository URL input form and an adaptive results display that dynamically renders JSON scan results without hardcoded sections. Prioritize clarity and ease of use for developers scanning repositories for security threats.

**Architect Prompt:**
Design the technical architecture for repoHack, a Next.js 14+ application with app directory structure. The system needs to clone Git repositories, perform multi-step security scanning using server actions, and return structured JSON results. Use "use server" directive for the main scan function, with individual threat detection functions running in the server context. Focus on a monolithic Next.js architecture deployable on Vercel, with no database requirements and stateless operation. Ensure the scanning process completes within 15 seconds and can handle repositories up to 100MB.
