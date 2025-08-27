import { parseAST, getNodesByType } from '../utils/ast-parser';
import type { RepositoryFile, ASTNode, ThreatResult } from '../types';

/**
 * Code Execution Scanner for detecting potentially dangerous code patterns
 * Uses AST parsing to identify security threats in TypeScript/JavaScript code
 */
export class CodeExecutionScanner {
  public readonly name = 'code-execution';
  public readonly category = 'code_execution';
  public readonly subcategory = 'ast_analysis';

  // Patterns that indicate potential security threats
  private readonly threatPatterns = {
    eval: ['CallExpression'],
    dynamicImport: ['ImportExpression'],
    functionConstructor: ['NewExpression'],
    setTimeout: ['CallExpression'],
    setInterval: ['CallExpression'],
    exec: ['CallExpression'],
    spawn: ['CallExpression'],
    execSync: ['CallExpression'],
    spawnSync: ['CallExpression']
  };

  // High-risk function names
  private readonly highRiskFunctions = [
    'eval',
    'Function',
    'setTimeout',
    'setInterval',
    'exec',
    'spawn',
    'execSync',
    'spawnSync'
  ];

  /**
   * Scan files for code execution threats using AST analysis
   * @param files - Array of repository files to scan
   * @returns Promise<ThreatResult[]> - Array of detected threats
   */
  async scan(files: RepositoryFile[]): Promise<ThreatResult[]> {
    const threats: ThreatResult[] = [];
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    for (const file of files) {
      // Skip non-code files and binary files
      if (!supportedExtensions.includes(file.extension) || file.isBinary) {
        continue;
      }

      try {
        // Parse the file content using AST parser
        const parseResult = await parseAST(file.content, file.path);
        
        if (!parseResult.success) {
          // Log parsing errors but continue with other files
          console.warn(`Failed to parse ${file.path}: ${parseResult.error}`);
          continue;
        }

        if (!parseResult.nodes) {
          continue;
        }

        // Analyze AST nodes for security threats
        const fileThreats = this.analyzeASTNodes(parseResult.nodes, file);
        threats.push(...fileThreats);

      } catch (error) {
        console.error(`Error scanning file ${file.path}:`, error);
        // Continue scanning other files even if one fails
      }
    }

    return threats;
  }

  /**
   * Analyze AST nodes for security threats
   * @param nodes - Array of AST nodes to analyze
   * @param file - Repository file being analyzed
   * @returns ThreatResult[] - Array of detected threats
   */
  private analyzeASTNodes(nodes: ASTNode[], file: RepositoryFile): ThreatResult[] {
    const threats: ThreatResult[] = [];

    // Check for eval() usage
    const evalCalls = this.detectEvalUsage(nodes, file);
    threats.push(...evalCalls);

    // Check for dynamic imports
    const dynamicImports = this.detectDynamicImports(nodes, file);
    threats.push(...dynamicImports);

    // Check for function constructor usage
    const functionConstructor = this.detectFunctionConstructor(nodes, file);
    threats.push(...functionConstructor);

    // Check for potentially dangerous setTimeout/setInterval usage
    const timerThreats = this.detectTimerThreats(nodes, file);
    threats.push(...timerThreats);

    // Check for shell execution patterns
    const shellThreats = this.detectShellExecution(nodes, file);
    threats.push(...shellThreats);

    return threats;
  }

  /**
   * Detect eval() function usage with enhanced pattern detection
   * @param nodes - AST nodes to analyze
   * @param file - Repository file being analyzed
   * @returns ThreatResult[] - Array of eval-related threats
   */
  private detectEvalUsage(nodes: ASTNode[], file: RepositoryFile): ThreatResult[] {
    const threats: ThreatResult[] = [];
    const callExpressions = getNodesByType(nodes, 'CallExpression');

    for (const node of callExpressions) {
      if (node.callee && typeof node.callee === 'object' && 'name' in node.callee) {
        const calleeName = (node.callee as { name: string }).name;
        
        if (calleeName === 'eval') {
          // Extract surrounding code context
          const codeContext = this.extractCodeContext(node, file);
          
          // Determine if this is a dynamic eval (higher risk)
          const isDynamic = this.isDynamicEvalCall(node);
          
          threats.push({
            category: this.category,
            subcategory: 'eval_usage',
            severity: 'CRITICAL',
            description: isDynamic 
              ? 'Dynamic eval() function usage detected - high risk code injection vulnerability'
              : 'eval() function usage detected - potential code injection vulnerability',
            file: file.path,
            line: node.loc?.start.line,
            code: codeContext,
            details: {
              nodeType: node.type,
              arguments: (node.arguments as unknown[])?.length || 0,
              isDynamic,
              riskLevel: isDynamic ? 'high' : 'medium'
            }
          });
        }
      }
    }

    return threats;
  }

  /**
   * Extract surrounding code context for better threat reporting
   * @param node - AST node to extract context from
   * @param file - Repository file being analyzed
   * @returns string - Code context around the eval call
   */
  private extractCodeContext(node: ASTNode, file: RepositoryFile): string {
    try {
      if (node.loc && typeof node.loc === 'object' && 'start' in node.loc) {
        const startLine = (node.loc as { start: { line: number } }).start.line;
        const lines = file.content.split('\n');
        
        // Get context from 2 lines before to 2 lines after
        const contextStart = Math.max(0, startLine - 3);
        const contextEnd = Math.min(lines.length, startLine + 1);
        const contextLines = lines.slice(contextStart, contextEnd);
        
        return contextLines.map((line, index) => {
          const lineNumber = contextStart + index + 1;
          return `${lineNumber}: ${line.trim()}`;
        }).join('\n');
      }
    } catch (error) {
      // Fallback to simple code representation
      console.warn(`Failed to extract code context for ${file.path}:`, error);
    }
    
    return 'eval()';
  }

  /**
   * Determine if an eval() call is dynamic (higher risk)
   * @param node - AST node representing the eval call
   * @returns boolean - True if the eval call is dynamic
   */
  private isDynamicEvalCall(node: ASTNode): boolean {
    try {
      if (node.arguments && Array.isArray(node.arguments) && node.arguments.length > 0) {
        const firstArg = node.arguments[0];
        
        // Check if the argument is a variable (not a literal string)
        if (firstArg && typeof firstArg === 'object' && 'type' in firstArg) {
          const argType = (firstArg as { type: string }).type;
          
          // If it's an identifier (variable), it's dynamic
          if (argType === 'Identifier') {
            return true;
          }
          
          // If it's a template literal with expressions, it's dynamic
          if (argType === 'TemplateLiteral') {
            return true;
          }
          
          // If it's a binary expression (string concatenation), it's dynamic
          if (argType === 'BinaryExpression') {
            return true;
          }
          
          // If it's a function call, it's dynamic
          if (argType === 'CallExpression') {
            return true;
          }
        }
      }
    } catch (error) {
      // If we can't determine, assume it's dynamic for safety
      console.warn('Failed to determine eval call type, assuming dynamic:', error);
      return true;
    }
    
    return false;
  }

  /**
   * Detect dynamic import() usage
   * @param nodes - AST nodes to analyze
   * @param file - Repository file being analyzed
   * @returns ThreatResult[] - Array of dynamic import threats
   */
  private detectDynamicImports(nodes: ASTNode[], file: RepositoryFile): ThreatResult[] {
    const threats: ThreatResult[] = [];
    const importExpressions = getNodesByType(nodes, 'ImportExpression');

    for (const node of importExpressions) {
      threats.push({
        category: this.category,
        subcategory: 'dynamic_import',
        severity: 'WARNING',
        description: 'Dynamic import() detected - potential code loading vulnerability',
        file: file.path,
        line: node.loc?.start.line,
        code: 'import()',
        details: {
          nodeType: node.type,
          source: (node as unknown as { source: unknown }).source
        }
      });
    }

    return threats;
  }

  /**
   * Detect Function constructor usage with enhanced pattern detection
   * @param nodes - AST nodes to analyze
   * @param file - Repository file being analyzed
   * @returns ThreatResult[] - Array of Function constructor threats
   */
  private detectFunctionConstructor(nodes: ASTNode[], file: RepositoryFile): ThreatResult[] {
    const threats: ThreatResult[] = [];
    const newExpressions = getNodesByType(nodes, 'NewExpression');

    for (const node of newExpressions) {
      if (node.callee && typeof node.callee === 'object' && 'name' in node.callee) {
        const calleeName = (node.callee as { name: string }).name;
        
        if (calleeName === 'Function') {
          // Extract surrounding code context
          const codeContext = this.extractCodeContext(node, file);
          
          // Determine if this is a dynamic Function constructor (higher risk)
          const isDynamic = this.isDynamicFunctionConstructor(node);
          
          // Identify potential code injection patterns
          const injectionRisk = this.assessCodeInjectionRisk(node);
          
          threats.push({
            category: this.category,
            subcategory: 'function_constructor',
            severity: 'WARNING',
            description: isDynamic 
              ? 'Dynamic Function constructor usage detected - potential code injection vulnerability'
              : 'Function constructor usage detected - potential code injection vulnerability',
            file: file.path,
            line: node.loc?.start.line,
            code: codeContext,
            details: {
              nodeType: node.type,
              arguments: (node.arguments as unknown[])?.length || 0,
              isDynamic,
              injectionRisk,
              riskLevel: isDynamic ? 'high' : 'medium'
            }
          });
        }
      }
    }

    return threats;
  }

  /**
   * Determine if a Function constructor call is dynamic (higher risk)
   * @param node - AST node representing the Function constructor call
   * @returns boolean - True if the Function constructor call is dynamic
   */
  private isDynamicFunctionConstructor(node: ASTNode): boolean {
    try {
      if (node.arguments && Array.isArray(node.arguments) && node.arguments.length > 0) {
        // Check each argument for dynamic content
        for (const arg of node.arguments) {
          if (arg && typeof arg === 'object' && 'type' in arg) {
            const argType = (arg as { type: string }).type;
            
            // If it's an identifier (variable), it's dynamic
            if (argType === 'Identifier') {
              return true;
            }
            
            // If it's a template literal with expressions, it's dynamic
            if (argType === 'TemplateLiteral') {
              return true;
            }
            
            // If it's a binary expression (string concatenation), it's dynamic
            if (argType === 'BinaryExpression') {
              return true;
            }
            
            // If it's a function call, it's dynamic
            if (argType === 'CallExpression') {
              return true;
            }
            
            // If it's a member expression (object property access), it's dynamic
            if (argType === 'MemberExpression') {
              return true;
            }
          }
        }
      }
    } catch (error) {
      // If we can't determine, assume it's dynamic for safety
      console.warn('Failed to determine Function constructor call type, assuming dynamic:', error);
      return true;
    }
    
    return false;
  }

  /**
   * Assess the code injection risk level for Function constructor usage
   * @param node - AST node representing the Function constructor call
   * @returns string - Risk level description
   */
  private assessCodeInjectionRisk(node: ASTNode): string {
    try {
      if (node.arguments && Array.isArray(node.arguments) && node.arguments.length > 0) {
        const firstArg = node.arguments[0];
        
        if (firstArg && typeof firstArg === 'object' && 'type' in firstArg) {
          const argType = (firstArg as { type: string }).type;
          
          // Check for various risk patterns
          if (argType === 'Identifier') {
            return 'variable_based_code';
          }
          
          if (argType === 'TemplateLiteral') {
            return 'template_literal_with_expressions';
          }
          
          if (argType === 'BinaryExpression') {
            return 'string_concatenation';
          }
          
          if (argType === 'CallExpression') {
            return 'function_call_result';
          }
          
          if (argType === 'MemberExpression') {
            return 'object_property_access';
          }
          
          if (argType === 'Literal') {
            return 'static_string';
          }
        }
      }
    } catch (error) {
      console.warn('Failed to assess code injection risk:', error);
    }
    
    return 'unknown_risk';
  }

  /**
   * Detect potentially dangerous setTimeout/setInterval usage
   * @param nodes - AST nodes to analyze
   * @param file - Repository file being analyzed
   * @returns ThreatResult[] - Array of timer-related threats
   */
  private detectTimerThreats(nodes: ASTNode[], file: RepositoryFile): ThreatResult[] {
    const threats: ThreatResult[] = [];
    const callExpressions = getNodesByType(nodes, 'CallExpression');

    for (const node of callExpressions) {
      if (node.callee && typeof node.callee === 'object' && 'name' in node.callee) {
        const calleeName = (node.callee as { name: string }).name;
        
        if (calleeName === 'setTimeout' || calleeName === 'setInterval') {
          // Check if the first argument is a string (potential code injection)
          if (node.arguments && (node.arguments as unknown[]).length > 0) {
            const firstArg = (node.arguments as unknown[])[0];
            if (typeof firstArg === 'string' || 
                (typeof firstArg === 'object' && firstArg !== null && 'type' in firstArg && firstArg.type === 'Literal' && typeof (firstArg as unknown as { value: string }).value === 'string')) {
              
              threats.push({
                category: this.category,
                subcategory: 'timer_code_injection',
                severity: 'WARNING',
                description: `String argument in ${calleeName} detected - potential code injection vulnerability`,
                file: file.path,
                line: node.loc?.start.line,
                code: `${calleeName}()`,
                details: {
                  nodeType: node.type,
                  functionName: calleeName,
                  argumentType: 'string'
                }
              });
            }
          }
        }
      }
    }

    return threats;
  }

  /**
   * Detect shell execution patterns
   * @param nodes - AST nodes to analyze
   * @param file - Repository file being analyzed
   * @returns ThreatResult[] - Array of shell execution threats
   */
  private detectShellExecution(nodes: ASTNode[], file: RepositoryFile): ThreatResult[] {
    const threats: ThreatResult[] = [];
    const callExpressions = getNodesByType(nodes, 'CallExpression');

    for (const node of callExpressions) {
      if (node.callee && typeof node.callee === 'object' && 'name' in node.callee) {
        const calleeName = (node.callee as { name: string }).name;
        
        if (['exec', 'spawn', 'execSync', 'spawnSync'].includes(calleeName)) {
          threats.push({
            category: this.category,
            subcategory: 'shell_execution',
            severity: 'CRITICAL',
            description: `Shell execution function ${calleeName} detected - potential command injection vulnerability`,
            file: file.path,
            line: node.loc?.start.line,
            code: `${calleeName}()`,
            details: {
              nodeType: node.type,
              functionName: calleeName,
              arguments: (node.arguments as unknown[])?.length || 0
            }
          });
        }
      }
    }

    return threats;
  }
}
