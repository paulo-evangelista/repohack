import { describe, it, expect, beforeEach } from 'vitest';
import { CodeExecutionScanner } from '../../../lib/scanners/code-execution';
import type { RepositoryFile } from '../../../lib/types';

describe('CodeExecutionScanner', () => {
  let scanner: CodeExecutionScanner;

  beforeEach(() => {
    scanner = new CodeExecutionScanner();
  });

  describe('Scanner Properties', () => {
    it('should have correct scanner properties', () => {
      expect(scanner.name).toBe('code-execution');
      expect(scanner.category).toBe('code_execution');
      expect(scanner.subcategory).toBe('ast_analysis');
    });
  });

  describe('scan method', () => {
    it('should scan TypeScript files for threats', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            const userInput = "console.log('Hello')";
            eval(userInput);
            
            function dangerous() {
              new Function("console.log('Dangerous')")();
            }
          `,
          size: 200,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.subcategory === 'eval_usage')).toBe(true);
      expect(threats.some(t => t.subcategory === 'function_constructor')).toBe(true);
    });

    it('should scan JavaScript files for threats', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.js',
          content: `
            const userInput = "console.log('Hello')";
            eval(userInput);
            
            setTimeout("console.log('Hello')", 1000);
          `,
          size: 150,
          extension: '.js',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.subcategory === 'eval_usage')).toBe(true);
      expect(threats.some(t => t.subcategory === 'timer_code_injection')).toBe(true);
    });

    it('should scan JSX files for threats', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.tsx',
          content: `
            import React from 'react';
            
            const Component = () => {
              const userInput = "console.log('Hello')";
              eval(userInput);
              
              return React.createElement('div', null, 'Hello World');
            };
          `,
          size: 200,
          extension: '.tsx',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);

      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.subcategory === 'eval_usage')).toBe(true);
    });

    it('should skip non-code files', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.txt',
          content: 'This is a text file',
          size: 50,
          extension: '.txt',
          isBinary: false
        },
        {
          path: 'image.png',
          content: 'binary content',
          size: 1000,
          extension: '.png',
          isBinary: true
        }
      ];

      const threats = await scanner.scan(files);

      expect(threats.length).toBe(0);
    });

    it('should handle files with parsing errors gracefully', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'malformed.ts',
          content: `
            function test( {
              return "missing closing brace";
            // Syntax error
          `,
          size: 100,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);

      // Should not crash and should return empty array or handle gracefully
      expect(Array.isArray(threats)).toBe(true);
    });

    it('should continue scanning other files if one fails', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'malformed.ts',
          content: `
            function test( {
              return "missing closing brace";
          `,
          size: 100,
          extension: '.ts',
          isBinary: false
        },
        {
          path: 'valid.ts',
          content: `
            const userInput = "console.log('Hello')";
            eval(userInput);
          `,
          size: 80,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);

      // Should still find threats in the valid file
      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.subcategory === 'eval_usage')).toBe(true);
    });
  });

  describe('Threat Detection', () => {
    it('should detect eval() usage with critical severity', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            const userInput = "console.log('Hello')";
            eval(userInput);
          `,
          size: 80,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const evalThreat = threats.find(t => t.subcategory === 'eval_usage');

      expect(evalThreat).toBeDefined();
      expect(evalThreat!.severity).toBe('critical');
      expect(evalThreat!.description).toContain('eval() function usage detected');
      expect(evalThreat!.code).toBe('eval()');
      expect(evalThreat!.line).toBeDefined();
    });

    it('should detect Function constructor usage with high severity', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            const userInput = "console.log('Hello')";
            new Function(userInput)();
          `,
          size: 80,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const functionThreat = threats.find(t => t.subcategory === 'function_constructor');

      expect(functionThreat).toBeDefined();
      expect(functionThreat!.severity).toBe('high');
      expect(functionThreat!.description).toContain('Function constructor usage detected');
      expect(functionThreat!.code).toBe('new Function()');
    });

    it('should detect dynamic import() usage with medium severity', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            const modulePath = userInput;
            import(modulePath);
          `,
          size: 80,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const importThreat = threats.find(t => t.subcategory === 'dynamic_import');

      expect(importThreat).toBeDefined();
      expect(importThreat!.severity).toBe('medium');
      expect(importThreat!.description).toContain('Dynamic import() detected');
      expect(importThreat!.code).toBe('import()');
    });

    it('should detect setTimeout with string argument as medium severity', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            setTimeout("console.log('Hello')", 1000);
          `,
          size: 50,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const timerThreat = threats.find(t => t.subcategory === 'timer_code_injection');

      expect(timerThreat).toBeDefined();
      expect(timerThreat!.severity).toBe('medium');
      expect(timerThreat!.description).toContain('String argument in setTimeout detected');
      expect(timerThreat!.code).toBe('setTimeout()');
    });

    it('should detect setInterval with string argument as medium severity', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            setInterval("console.log('Hello')", 1000);
          `,
          size: 50,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const timerThreat = threats.find(t => t.subcategory === 'timer_code_injection');

      expect(timerThreat).toBeDefined();
      expect(timerThreat!.severity).toBe('medium');
      expect(timerThreat!.description).toContain('String argument in setInterval detected');
      expect(timerThreat!.code).toBe('setInterval()');
    });

    it('should detect shell execution functions with high severity', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            const command = userInput;
            exec(command);
            spawn(command);
            execSync(command);
            spawnSync(command);
          `,
          size: 120,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const shellThreats = threats.filter(t => t.subcategory === 'shell_execution');

      expect(shellThreats.length).toBe(4);
      expect(shellThreats.every(t => t.severity === 'high')).toBe(true);
      expect(shellThreats.some(t => t.description.includes('exec'))).toBe(true);
      expect(shellThreats.some(t => t.description.includes('spawn'))).toBe(true);
      expect(shellThreats.some(t => t.description.includes('execSync'))).toBe(true);
      expect(shellThreats.some(t => t.description.includes('spawnSync'))).toBe(true);
    });
  });

  describe('Threat Result Structure', () => {
    it('should return threats with correct structure', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: 'eval("console.log(\'Hello\')");',
          size: 30,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const threat = threats[0];

      expect(threat).toHaveProperty('category');
      expect(threat).toHaveProperty('subcategory');
      expect(threat).toHaveProperty('severity');
      expect(threat).toHaveProperty('description');
      expect(threat).toHaveProperty('file');
      expect(threat).toHaveProperty('line');
      expect(threat).toHaveProperty('code');
      expect(threat).toHaveProperty('details');

      expect(typeof threat.category).toBe('string');
      expect(typeof threat.subcategory).toBe('string');
      expect(['low', 'medium', 'high', 'critical']).toContain(threat.severity);
      expect(typeof threat.description).toBe('string');
      expect(typeof threat.file).toBe('string');
      expect(typeof threat.code).toBe('string');
      expect(typeof threat.details).toBe('object');
    });

    it('should include file path in threat results', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'src/components/test.ts',
          content: 'eval("console.log(\'Hello\')");',
          size: 30,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const threat = threats[0];

      expect(threat.file).toBe('src/components/test.ts');
    });

    it('should include line numbers when available', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            // Line 1
            // Line 2
            eval("console.log('Hello')"); // Line 3
          `,
          size: 80,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      const threat = threats[0];

      expect(threat.line).toBeDefined();
      expect(typeof threat.line).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files array', async () => {
      const threats = await scanner.scan([]);
      expect(threats).toEqual([]);
    });

    it('should handle files with only comments', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: `
            // This is a comment
            /* This is a block comment */
            // Another comment
          `,
          size: 80,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      expect(threats.length).toBe(0);
    });

    it('should handle files with only whitespace', async () => {
      const files: RepositoryFile[] = [
        {
          path: 'test.ts',
          content: '   \n  \t  \n  ',
          size: 20,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);
      expect(threats.length).toBe(0);
    });

    it('should handle very large files', async () => {
      const largeContent = `
        // Generate a large file with many functions
        ${Array.from({ length: 1000 }, (_, i) => `
          function function${i}() {
            const message = "Function ${i}";
            console.log(message);
          }
        `).join('\n')}
        
        // Add a threat at the end
        eval("console.log('Threat')");
      `;

      const files: RepositoryFile[] = [
        {
          path: 'large.ts',
          content: largeContent,
          size: largeContent.length,
          extension: '.ts',
          isBinary: false
        }
      ];

      const threats = await scanner.scan(files);

      // Should still detect the threat
      expect(threats.length).toBeGreaterThan(0);
      expect(threats.some(t => t.subcategory === 'eval_usage')).toBe(true);
    });
  });
});
