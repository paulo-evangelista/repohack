import { describe, it, expect, beforeEach } from 'vitest';
import { parseAST, getNodesByType, containsPatterns, type ASTNode } from '../../../lib/utils/ast-parser';

describe('AST Parser', () => {
  const validTypeScriptCode = `
    function greet(name: string): string {
      return \`Hello, \${name}!\`;
    }
    
    const message = greet("World");
    console.log(message);
  `;

  const validJavaScriptCode = `
    function greet(name) {
      return \`Hello, \${name}!\`;
    }
    
    const message = greet("World");
    console.log(message);
  `;

  const codeWithEval = `
    const userInput = "console.log('Hello')";
    eval(userInput);
  `;

  const codeWithFunctionConstructor = `
    const userInput = "console.log('Hello')";
    new Function(userInput)();
  `;

  const malformedCode = `
    function greet(name: string {
      return "Hello, " + name;
    // Missing closing brace
  `;

  describe('parseAST', () => {
    it('should successfully parse valid TypeScript code', async () => {
      const result = await parseAST(validTypeScriptCode, 'test.ts');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes!.length).toBeGreaterThan(0);
      expect(result.filePath).toBe('test.ts');
    });

    it('should successfully parse valid JavaScript code', async () => {
      const result = await parseAST(validJavaScriptCode, 'test.js');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes!.length).toBeGreaterThan(0);
      expect(result.filePath).toBe('test.js');
    });

    it('should handle TypeScript JSX files', async () => {
      const jsxCode = `
        import React from 'react';
        
        const Greeting: React.FC<{name: string}> = ({name}) => {
          return React.createElement('div', null, 'Hello, ', name, '!');
        };
      `;
      
      const result = await parseAST(jsxCode, 'test.tsx');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.nodes).toBeDefined();
    });

    it('should handle JavaScript JSX files', async () => {
      const jsxCode = `
        import React from 'react';
        
        const Greeting = ({name}) => {
          return React.createElement('div', null, 'Hello, ', name, '!');
        };
      `;
      
      const result = await parseAST(jsxCode, 'test.jsx');
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.nodes).toBeDefined();
    });

    it('should reject unsupported file types', async () => {
      const result = await parseAST(validTypeScriptCode, 'test.txt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file type');
      expect(result.filePath).toBe('test.txt');
    });

    it('should reject empty content', async () => {
      const result = await parseAST('', 'test.ts');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid content');
      expect(result.filePath).toBe('test.ts');
    });

    it('should reject null content', async () => {
      const result = await parseAST(null as unknown as string, 'test.ts');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid content');
      expect(result.filePath).toBe('test.ts');
    });

    it('should handle malformed code gracefully', async () => {
      const result = await parseAST(malformedCode, 'test.ts');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.filePath).toBe('test.ts');
    });

    it('should parse code with eval usage', async () => {
      const result = await parseAST(codeWithEval, 'test.ts');
      
      expect(result.success).toBe(true);
      expect(result.nodes).toBeDefined();
      
      // Should find CallExpression nodes
      const callExpressions = getNodesByType(result.nodes!, 'CallExpression');
      expect(callExpressions.length).toBeGreaterThan(0);
    });

    it('should parse code with Function constructor', async () => {
      const result = await parseAST(codeWithFunctionConstructor, 'test.ts');
      
      expect(result.success).toBe(true);
      expect(result.nodes).toBeDefined();
      
      // Should find NewExpression nodes
      const newExpressions = getNodesByType(result.nodes!, 'NewExpression');
      expect(newExpressions.length).toBeGreaterThan(0);
    });

    it('should respect custom parser options', async () => {
      const result = await parseAST(validTypeScriptCode, 'test.ts', {
        ecmaVersion: 2020,
        sourceType: 'script'
      });
      
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });
  });

  describe('getNodesByType', () => {
    let nodes: ASTNode[];

    beforeEach(async () => {
      const result = await parseAST(validTypeScriptCode, 'test.ts');
      nodes = result.nodes!;
    });

    it('should filter nodes by type correctly', () => {
      const functionDeclarations = getNodesByType(nodes, 'FunctionDeclaration');
      const variableDeclarations = getNodesByType(nodes, 'VariableDeclaration');
      const callExpressions = getNodesByType(nodes, 'CallExpression');
      
      expect(functionDeclarations.length).toBeGreaterThan(0);
      expect(variableDeclarations.length).toBeGreaterThan(0);
      expect(callExpressions.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent node types', () => {
      const nonExistentNodes = getNodesByType(nodes, 'NonExistentType');
      expect(nonExistentNodes).toEqual([]);
    });

    it('should handle empty nodes array', () => {
      const result = getNodesByType([], 'FunctionDeclaration');
      expect(result).toEqual([]);
    });
  });

  describe('containsPatterns', () => {
    let nodes: ASTNode[];

    beforeEach(async () => {
      const result = await parseAST(validTypeScriptCode, 'test.ts');
      nodes = result.nodes!;
    });

    it('should return true when patterns are found', () => {
      const patterns = ['FunctionDeclaration', 'VariableDeclaration'];
      const result = containsPatterns(nodes, patterns);
      expect(result).toBe(true);
    });

    it('should return false when no patterns are found', () => {
      const patterns = ['NonExistentType1', 'NonExistentType2'];
      const result = containsPatterns(nodes, patterns);
      expect(result).toBe(false);
    });

    it('should return true if at least one pattern is found', () => {
      const patterns = ['FunctionDeclaration', 'NonExistentType'];
      const result = containsPatterns(nodes, patterns);
      expect(result).toBe(true);
    });

    it('should handle empty patterns array', () => {
      const result = containsPatterns(nodes, []);
      expect(result).toBe(false);
    });

    it('should handle empty nodes array', () => {
      const result = containsPatterns([], ['FunctionDeclaration']);
      expect(result).toBe(false);
    });
  });

  describe('AST node structure', () => {
    it('should generate nodes with correct structure', async () => {
      const result = await parseAST(validTypeScriptCode, 'test.ts');
      const nodes = result.nodes!;
      
      for (const node of nodes) {
        expect(node).toHaveProperty('type');
        expect(typeof node.type).toBe('string');
        
        if (node.loc) {
          expect(node.loc).toHaveProperty('start');
          expect(node.loc).toHaveProperty('end');
          expect(node.loc.start).toHaveProperty('line');
          expect(node.loc.start).toHaveProperty('column');
          expect(node.loc.end).toHaveProperty('line');
          expect(node.loc.end).toHaveProperty('column');
        }
        
        if (node.range) {
          expect(Array.isArray(node.range)).toBe(true);
          expect(node.range.length).toBe(2);
          expect(typeof node.range[0]).toBe('number');
          expect(typeof node.range[1]).toBe('number');
        }
      }
    });

    it('should preserve specific node properties for CallExpression', async () => {
      const result = await parseAST(codeWithEval, 'test.ts');
      const nodes = result.nodes!;
      
      const callExpressions = getNodesByType(nodes, 'CallExpression');
      expect(callExpressions.length).toBeGreaterThan(0);
      
      for (const node of callExpressions) {
        expect(node).toHaveProperty('callee');
        expect(node).toHaveProperty('arguments');
      }
    });

    it('should preserve specific node properties for VariableDeclaration', async () => {
      const result = await parseAST(validTypeScriptCode, 'test.ts');
      const nodes = result.nodes!;
      
      const variableDeclarations = getNodesByType(nodes, 'VariableDeclaration');
      expect(variableDeclarations.length).toBeGreaterThan(0);
      
      for (const node of variableDeclarations) {
        expect(node).toHaveProperty('declarations');
        expect(node).toHaveProperty('kind');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle extremely long strings gracefully', async () => {
      const longString = '"'.repeat(1000000) + 'a' + '"'.repeat(1000000);
      const longCode = `const str = ${longString};`;
      
      const result = await parseAST(longCode, 'test.ts');
      
      // Should either succeed or fail gracefully
      expect(result.success === false || result.success === true).toBe(true);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle code with special characters', async () => {
      const specialCharCode = `
        const str = "Hello\\nWorld\\tTab";
        const regex = /[\\w\\s]+/g;
        const template = \`Line 1
        Line 2\`;
      `;
      
      const result = await parseAST(specialCharCode, 'test.ts');
      expect(result.success).toBe(true);
    });
  });
});
