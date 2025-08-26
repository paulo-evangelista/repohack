import { parseAST, getNodesByType } from '../utils/ast-parser';
import type { RepositoryFile, ASTNode } from '../types';

export interface ThreatResult {
  category: string;
  subcategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file: string;
  line?: number;
  code?: string;
  details?: Record<string, unknown>;
}

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
   * Detect eval() function usage
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
          threats.push({
            category: this.category,
            subcategory: 'eval_usage',
            severity: 'critical',
            description: 'eval() function usage detected - potential code injection vulnerability',
            file: file.path,
            line: node.loc?.start.line,
            code: 'eval()',
            details: {
              nodeType: node.type,
              arguments: (node.arguments as unknown[])?.length || 0
            }
          });
        }
      }
    }

    return threats;
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
        severity: 'medium',
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
   * Detect Function constructor usage
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
          threats.push({
            category: this.category,
            subcategory: 'function_constructor',
            severity: 'high',
            description: 'Function constructor usage detected - potential code injection vulnerability',
            file: file.path,
            line: node.loc?.start.line,
            code: 'new Function()',
            details: {
              nodeType: node.type,
              arguments: (node.arguments as unknown[])?.length || 0
            }
          });
        }
      }
    }

    return threats;
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
                severity: 'medium',
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
            severity: 'high',
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
