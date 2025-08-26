import { parse } from '@typescript-eslint/parser';
import type { TSESTree } from '@typescript-eslint/types';

export interface ASTNode {
  type: string;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  range?: [number, number];
  [key: string]: unknown;
}

export interface ParseResult {
  success: boolean;
  ast?: TSESTree.Program;
  nodes?: ASTNode[];
  error?: string;
  filePath: string;
}

export interface ParserOptions {
  ecmaVersion?: number;
  sourceType?: 'module' | 'script';
  ecmaFeatures?: {
    jsx?: boolean;
    globalReturn?: boolean;
    impliedStrict?: boolean;
  };
  allowImportExportEverywhere?: boolean;
  codeFrameOptions?: {
    highlightCode?: boolean;
    linesAbove?: number;
    linesBelow?: number;
  };
}

/**
 * Parse TypeScript/JavaScript code into an Abstract Syntax Tree
 * @param content - The source code content to parse
 * @param filePath - The file path for error context
 * @param options - Parser configuration options
 * @returns Promise<ParseResult> - Parse result with AST or error information
 */
export async function parseAST(
  content: string,
  filePath: string,
  options: ParserOptions = {}
): Promise<ParseResult> {
  try {
    // Validate input
    if (!content || typeof content !== 'string') {
      return {
        success: false,
        error: 'Invalid content: must be a non-empty string',
        filePath
      };
    }

    // Determine file type and set appropriate parser options
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isJavaScript = filePath.endsWith('.js') || filePath.endsWith('.jsx');
    
    if (!isTypeScript && !isJavaScript) {
      return {
        success: false,
        error: `Unsupported file type: ${filePath}`,
        filePath
      };
    }

    // Set default parser options
    const parserOptions: ParserOptions = {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
        globalReturn: false,
        impliedStrict: true
      },
      allowImportExportEverywhere: false,
      ...options
    };

    // Parse the content
    const ast = parse(content, {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: parserOptions.ecmaVersion,
        sourceType: parserOptions.sourceType,
        ecmaFeatures: parserOptions.ecmaFeatures,
        allowImportExportEverywhere: parserOptions.allowImportExportEverywhere,
        // Enable JSX parsing
        jsx: filePath.endsWith('.tsx') || filePath.endsWith('.jsx'),
        // Enable TypeScript features
        project: undefined, // Don't require tsconfig.json
        tsconfigRootDir: undefined,
        extraFileExtensions: ['.ts', '.tsx', '.js', '.jsx']
      }
    });

    // Convert to simplified AST nodes for easier analysis
    const nodes = convertToASTNodes(ast);

    return {
      success: true,
      ast,
      nodes,
      filePath
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
      filePath
    };
  }
}

/**
 * Convert TSESTree AST to simplified AST nodes
 * @param ast - The parsed TSESTree AST
 * @returns ASTNode[] - Array of simplified AST nodes
 */
function convertToASTNodes(ast: TSESTree.Program): ASTNode[] {
  const nodes: ASTNode[] = [];
  
  function traverse(node: TSESTree.Node) {
    const simplifiedNode: ASTNode = {
      type: node.type,
      ...(node.loc && {
        loc: {
          start: { line: node.loc.start.line, column: node.loc.start.column },
          end: { line: node.loc.end.line, column: node.loc.end.column }
        }
      }),
      ...(node.range && { range: node.range })
    };

    // Add specific properties based on node type
    if (node.type === 'CallExpression') {
      simplifiedNode.callee = (node as TSESTree.CallExpression).callee;
      simplifiedNode.arguments = (node as TSESTree.CallExpression).arguments;
    } else if (node.type === 'VariableDeclaration') {
      simplifiedNode.declarations = (node as TSESTree.VariableDeclaration).declarations;
      simplifiedNode.kind = (node as TSESTree.VariableDeclaration).kind;
    } else if (node.type === 'FunctionDeclaration') {
      simplifiedNode.id = (node as TSESTree.FunctionDeclaration).id;
      simplifiedNode.params = (node as TSESTree.FunctionDeclaration).params;
      simplifiedNode.body = (node as TSESTree.FunctionDeclaration).body;
    } else if (node.type === 'ImportDeclaration') {
      simplifiedNode.source = (node as TSESTree.ImportDeclaration).source;
      simplifiedNode.specifiers = (node as TSESTree.ImportDeclaration).specifiers;
    } else if (node.type === 'NewExpression') {
      simplifiedNode.callee = (node as TSESTree.NewExpression).callee;
      simplifiedNode.arguments = (node as TSESTree.NewExpression).arguments;
    } else if (node.type === 'ImportExpression') {
      simplifiedNode.source = (node as TSESTree.ImportExpression).source;
    }

    nodes.push(simplifiedNode);

    // Traverse child nodes recursively
    traverseChildren(node);
  }

  function traverseChildren(node: TSESTree.Node) {
    // Handle different node types and their children
    switch (node.type) {
      case 'Program':
        const program = node as TSESTree.Program;
        if (program.body) {
          program.body.forEach(traverse);
        }
        break;
        
      case 'FunctionDeclaration':
        const funcDecl = node as TSESTree.FunctionDeclaration;
        if (funcDecl.id) traverse(funcDecl.id);
        if (funcDecl.params) funcDecl.params.forEach(traverse);
        if (funcDecl.body) traverse(funcDecl.body);
        break;
        
      case 'VariableDeclaration':
        const varDecl = node as TSESTree.VariableDeclaration;
        if (varDecl.declarations) varDecl.declarations.forEach(traverse);
        break;
        
      case 'VariableDeclarator':
        const varDeclarator = node as TSESTree.VariableDeclarator;
        if (varDeclarator.id) traverse(varDeclarator.id);
        if (varDeclarator.init) traverse(varDeclarator.init);
        break;
        
      case 'CallExpression':
        const callExpr = node as TSESTree.CallExpression;
        if (callExpr.callee) traverse(callExpr.callee);
        if (callExpr.arguments) callExpr.arguments.forEach(traverse);
        break;
        
      case 'NewExpression':
        const newExpr = node as TSESTree.NewExpression;
        if (newExpr.callee) traverse(newExpr.callee);
        if (newExpr.arguments) newExpr.arguments.forEach(traverse);
        break;
        
      case 'ExpressionStatement':
        const exprStmt = node as TSESTree.ExpressionStatement;
        if (exprStmt.expression) traverse(exprStmt.expression);
        break;
        
      case 'BlockStatement':
        const blockStmt = node as TSESTree.BlockStatement;
        if (blockStmt.body) blockStmt.body.forEach(traverse);
        break;
        
      case 'ReturnStatement':
        const returnStmt = node as TSESTree.ReturnStatement;
        if (returnStmt.argument) traverse(returnStmt.argument);
        break;
        
      case 'Identifier':
        // Leaf node, no children
        break;
        
      case 'Literal':
        // Leaf node, no children
        break;
        
      case 'TemplateLiteral':
        const templateLit = node as TSESTree.TemplateLiteral;
        if (templateLit.quasis) templateLit.quasis.forEach(traverse);
        if (templateLit.expressions) templateLit.expressions.forEach(traverse);
        break;
        
      case 'BinaryExpression':
        const binaryExpr = node as TSESTree.BinaryExpression;
        if (binaryExpr.left) traverse(binaryExpr.left);
        if (binaryExpr.right) traverse(binaryExpr.right);
        break;
        
      case 'ImportDeclaration':
        const importDecl = node as TSESTree.ImportDeclaration;
        if (importDecl.source) traverse(importDecl.source);
        if (importDecl.specifiers) importDecl.specifiers.forEach(traverse);
        break;
        
      case 'ImportExpression':
        const importExpr = node as TSESTree.ImportExpression;
        if (importExpr.source) traverse(importExpr.source);
        break;
        
      case 'JSXElement':
        const jsxElement = node as TSESTree.JSXElement;
        if (jsxElement.openingElement) traverse(jsxElement.openingElement);
        if (jsxElement.children) jsxElement.children.forEach(traverse);
        if (jsxElement.closingElement) traverse(jsxElement.closingElement);
        break;
        
      case 'JSXExpressionContainer':
        const jsxExpr = node as TSESTree.JSXExpressionContainer;
        if (jsxExpr.expression) traverse(jsxExpr.expression);
        break;
        
      case 'ArrowFunctionExpression':
        const arrowFunc = node as TSESTree.ArrowFunctionExpression;
        if (arrowFunc.params) arrowFunc.params.forEach(traverse);
        if (arrowFunc.body) traverse(arrowFunc.body);
        break;
        
      default:
        // For any other node types, try to traverse common properties
        if ('body' in node && Array.isArray((node as { body: unknown[] }).body)) {
          (node as { body: unknown[] }).body.forEach((item) => traverse(item as TSESTree.Node));
        }
        if ('declarations' in node && Array.isArray((node as { declarations: unknown[] }).declarations)) {
          (node as { declarations: unknown[] }).declarations.forEach((item) => traverse(item as TSESTree.Node));
        }
        if ('arguments' in node && Array.isArray((node as { arguments: unknown[] }).arguments)) {
          (node as { arguments: unknown[] }).arguments.forEach((item) => traverse(item as TSESTree.Node));
        }
        if ('params' in node && Array.isArray((node as { params: unknown[] }).params)) {
          (node as { params: unknown[] }).params.forEach((item) => traverse(item as TSESTree.Node));
        }
        if ('specifiers' in node && Array.isArray((node as { specifiers: unknown[] }).specifiers)) {
          (node as { specifiers: unknown[] }).specifiers.forEach((item) => traverse(item as TSESTree.Node));
        }
        break;
    }
  }

  // Start traversal from the root
  traverse(ast);

  return nodes;
}

/**
 * Get specific types of AST nodes for security analysis
 * @param nodes - Array of AST nodes
 * @param nodeType - Type of nodes to filter
 * @returns ASTNode[] - Filtered array of nodes
 */
export function getNodesByType(nodes: ASTNode[], nodeType: string): ASTNode[] {
  return nodes.filter(node => node.type === nodeType);
}

/**
 * Check if a file contains specific AST patterns
 * @param nodes - Array of AST nodes
 * @param patterns - Array of node type patterns to search for
 * @returns boolean - True if any patterns are found
 */
export function containsPatterns(nodes: ASTNode[], patterns: string[]): boolean {
  return patterns.some(pattern => 
    nodes.some(node => node.type === pattern)
  );
}
