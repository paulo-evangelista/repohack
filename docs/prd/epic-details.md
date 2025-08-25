# Epic Details

## Epic 1: Foundation & Core Infrastructure

**Expanded Goal**: Establish the foundational Next.js project structure and core scanning infrastructure while delivering basic repository cloning functionality. This epic creates the technical foundation that all subsequent threat detection capabilities will build upon, ensuring a solid base for the security scanning system.

### Story 1.1: Project Setup and Next.js Foundation

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

### Story 1.2: Repository Cloning Infrastructure

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

### Story 1.3: Basic File System Operations

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

## Epic 2: Basic Threat Detection (Arbitrary Code Execution)

**Expanded Goal**: Implement the first threat scanning capability focusing on arbitrary code execution patterns, creating a working security analysis foundation that can detect dangerous code constructs and provide detailed threat information in the established JSON structure.

### Story 2.1: AST-Based Code Parsing

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

### Story 2.2: Eval Function Detection

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

### Story 2.3: Function Constructor Detection

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

### Story 2.4: Dynamic Code Execution Detection

**As a developer,**
**I want the system to detect other dynamic code execution patterns,**
**so that I can identify comprehensive code execution threats.**

**Acceptance Criteria:**
1. System detects setTimeout/setInterval with code strings
2. Identifies dynamic import() calls with variable paths
3. Captures require() calls with dynamic module names
4. Results are properly categorized and subcategorized
5. All detected threats follow the established JSON structure
6. System provides clear descriptions of each threat type
7. Performance impact of scanning is minimal and within time constraints

## Epic 3: User Interface & Experience

**Expanded Goal**: Build the complete web interface with minimalist dark theme design using Tailwind CSS, including the scan input form and adaptive results display that dynamically renders the JSON structure. This epic creates the user-facing experience that makes the security scanning tool accessible and intuitive for developers.

### Story 3.1: Dark Theme Foundation and Layout

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

### Story 3.2: Repository Input Form

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

### Story 3.3: Scan Results Display

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

### Story 3.4: Adaptive JSON Rendering

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

## Epic 4: Advanced Threat Detection (Process Spawning)

**Expanded Goal**: Add detection for process spawning attempts and system command execution, expanding the security scanning capabilities to identify potential command injection and unauthorized system access threats. This epic builds upon the established scanning infrastructure to provide comprehensive process control analysis.

### Story 4.1: Child Process Detection

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

### Story 4.2: Shell Command Analysis

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

### Story 4.3: Process Execution Context

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

## Epic 5: Dependency & Network Analysis

**Expanded Goal**: Implement suspicious dependency detection and network call analysis to identify potential threats from external packages and unauthorized network communications. This epic adds comprehensive dependency and network security scanning to provide a complete view of repository security risks.

### Story 5.1: Package.json Analysis

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

### Story 5.2: Network Call Detection

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

### Story 5.3: API Key and Credential Detection

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

## Epic 6: File System & Environment Security

**Expanded Goal**: Add file system access monitoring and environment variable access detection to complete the comprehensive security scanning capabilities. This epic provides the final layer of security analysis, covering local system access and configuration security to ensure complete threat coverage.

### Story 6.1: File System Access Detection

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

### Story 6.2: Environment Variable Access

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

### Story 6.3: Configuration File Analysis

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
