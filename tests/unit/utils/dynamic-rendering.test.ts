import { describe, it, expect } from 'vitest';
import {
  getValueType,
  objectToFields,
  getStringValue,
  getNumberValue,
  getBooleanValue,
  getArrayValue,
  getObjectValue,
  groupThreatsByCategory,
  groupThreatsByField,
  extractThreatFields,
  isValidThreat,
  isValidScanResult,
  formatValueForDisplay,
  capitalize,
  toTitleCase,
  getFieldDisplayName,
  shouldDisplayField,
  sortFieldsByPriority
} from '../../../lib/utils/dynamic-rendering';
import { GenericThreat } from '../../../lib/types';

describe('dynamic-rendering utilities', () => {
  describe('getValueType', () => {
    it('returns correct type for primitive values', () => {
      expect(getValueType('string')).toBe('string');
      expect(getValueType(42)).toBe('number');
      expect(getValueType(true)).toBe('boolean');
      expect(getValueType(null)).toBe('null');
      expect(getValueType(undefined)).toBe('undefined');
    });

    it('returns correct type for complex values', () => {
      expect(getValueType([])).toBe('array');
      expect(getValueType({})).toBe('object');
      expect(getValueType([1, 2, 3])).toBe('array');
      expect(getValueType({ key: 'value' })).toBe('object');
    });
  });

  describe('objectToFields', () => {
    it('converts object to GenericField array', () => {
      const obj = { name: 'test', count: 42, active: true };
      const fields = objectToFields(obj);
      
      expect(fields).toHaveLength(3);
      expect(fields[0]).toEqual({ key: 'name', value: 'test', type: 'string' });
      expect(fields[1]).toEqual({ key: 'count', value: 42, type: 'number' });
      expect(fields[2]).toEqual({ key: 'active', value: true, type: 'boolean' });
    });

    it('handles empty object', () => {
      const fields = objectToFields({});
      expect(fields).toHaveLength(0);
    });
  });

  describe('getStringValue', () => {
    it('extracts string values correctly', () => {
      const obj = { name: 'test', count: 42 };
      expect(getStringValue(obj, 'name')).toBe('test');
      expect(getStringValue(obj, 'count')).toBe('42');
      expect(getStringValue(obj, 'missing', 'default')).toBe('default');
    });
  });

  describe('getNumberValue', () => {
    it('extracts number values correctly', () => {
      const obj = { count: 42, name: 'test' };
      expect(getNumberValue(obj, 'count')).toBe(42);
      expect(getNumberValue(obj, 'name')).toBe(0);
      expect(getNumberValue(obj, 'missing', 10)).toBe(10);
    });
  });

  describe('getBooleanValue', () => {
    it('extracts boolean values correctly', () => {
      const obj = { active: true, count: 42, name: 'test' };
      expect(getBooleanValue(obj, 'active')).toBe(true);
      expect(getBooleanValue(obj, 'count')).toBe(true);
      expect(getBooleanValue(obj, 'name')).toBe(false);
      expect(getBooleanValue(obj, 'missing')).toBe(false);
    });
  });

  describe('getArrayValue', () => {
    it('extracts array values correctly', () => {
      const obj = { items: [1, 2, 3], name: 'test' };
      expect(getArrayValue(obj, 'items')).toEqual([1, 2, 3]);
      expect(getArrayValue(obj, 'name')).toEqual([]);
      expect(getArrayValue(obj, 'missing', [4, 5])).toEqual([4, 5]);
    });
  });

  describe('getObjectValue', () => {
    it('extracts object values correctly', () => {
      const obj = { config: { key: 'value' }, name: 'test' };
      expect(getObjectValue(obj, 'config')).toEqual({ key: 'value' });
      expect(getObjectValue(obj, 'name')).toEqual({});
      expect(getObjectValue(obj, 'missing', { default: true })).toEqual({ default: true });
    });
  });

  describe('groupThreatsByCategory', () => {
    it('groups threats by category and subcategory', () => {
      const threats: GenericThreat[] = [
        { category: 'Code Execution', subcategory: 'Eval', severity: 'CRITICAL' },
        { category: 'Code Execution', subcategory: 'Function', severity: 'WARNING' },
        { category: 'File System', subcategory: 'Path', severity: 'INFO' }
      ];

      const grouped = groupThreatsByCategory(threats);
      
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['Code Execution']).toBeDefined();
      expect(grouped['File System']).toBeDefined();
      expect(grouped['Code Execution']['Eval']).toHaveLength(1);
      expect(grouped['Code Execution']['Function']).toHaveLength(1);
      expect(grouped['File System']['Path']).toHaveLength(1);
    });

    it('handles threats with missing category/subcategory', () => {
      const threats: GenericThreat[] = [
        { category: 'Code Execution', subcategory: 'Eval' },
        { category: 'Code Execution' }, // missing subcategory
        { subcategory: 'Path' }, // missing category
        {} // missing both
      ];

      const grouped = groupThreatsByCategory(threats);
      
      expect(grouped['Code Execution']['Eval']).toHaveLength(1);
      expect(grouped['Code Execution']['General']).toHaveLength(1);
      expect(grouped['Unknown']['Path']).toHaveLength(1);
      expect(grouped['Unknown']['General']).toHaveLength(1);
    });
  });

  describe('groupThreatsByField', () => {
    it('groups threats by specified field', () => {
      const threats: GenericThreat[] = [
        { severity: 'CRITICAL', category: 'Code' },
        { severity: 'WARNING', category: 'File' },
        { severity: 'CRITICAL', category: 'Network' }
      ];

      const grouped = groupThreatsByField(threats, 'severity');
      
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['CRITICAL']).toHaveLength(2);
      expect(grouped['WARNING']).toHaveLength(1);
    });
  });

  describe('extractThreatFields', () => {
    it('extracts all unique field names from threats', () => {
      const threats: GenericThreat[] = [
        { category: 'Code', severity: 'CRITICAL', file: 'test.js' },
        { category: 'File', description: 'test', line: 42 }
      ];

      const fields = extractThreatFields(threats);
      
      expect(fields).toContain('category');
      expect(fields).toContain('severity');
      expect(fields).toContain('file');
      expect(fields).toContain('description');
      expect(fields).toContain('line');
      expect(fields).toHaveLength(5);
    });
  });

  describe('isValidThreat', () => {
    it('validates threat objects correctly', () => {
      expect(isValidThreat({})).toBe(true);
      expect(isValidThreat({ category: 'test' })).toBe(true);
      expect(isValidThreat(null)).toBe(false);
      expect(isValidThreat(undefined)).toBe(false);
      expect(isValidThreat([])).toBe(false);
      expect(isValidThreat('string')).toBe(false);
    });
  });

  describe('isValidScanResult', () => {
    it('validates scan result objects correctly', () => {
      expect(isValidScanResult({})).toBe(true);
      expect(isValidScanResult({ repository: {} })).toBe(true);
      expect(isValidScanResult(null)).toBe(false);
      expect(isValidScanResult(undefined)).toBe(false);
      expect(isValidScanResult([])).toBe(false);
      expect(isValidScanResult('string')).toBe(false);
    });
  });

  describe('formatValueForDisplay', () => {
    it('formats values correctly for display', () => {
      expect(formatValueForDisplay('string')).toBe('string');
      expect(formatValueForDisplay(42)).toBe('42');
      expect(formatValueForDisplay(true)).toBe('true');
      expect(formatValueForDisplay(null)).toBe('null');
      expect(formatValueForDisplay(undefined)).toBe('undefined');
      expect(formatValueForDisplay([1, 2, 3])).toBe('[3 items]');
      expect(formatValueForDisplay({ key: 'value' })).toBe('[Object]');
    });
  });

  describe('capitalize', () => {
    it('capitalizes strings correctly', () => {
      expect(capitalize('test')).toBe('Test');
      expect(capitalize('TEST')).toBe('Test');
      expect(capitalize('')).toBe('');
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('toTitleCase', () => {
    it('converts strings to title case', () => {
      expect(toTitleCase('camelCase')).toBe('Camel Case');
      expect(toTitleCase('snake_case')).toBe('Snake Case');
      expect(toTitleCase('kebab-case')).toBe('Kebab Case');
      expect(toTitleCase('already title case')).toBe('Already Title Case');
    });
  });

  describe('getFieldDisplayName', () => {
    it('converts field names to display names', () => {
      expect(getFieldDisplayName('camelCase')).toBe('Camel Case');
      expect(getFieldDisplayName('snake_case')).toBe('Snake Case');
      expect(getFieldDisplayName('filePath')).toBe('File Path');
    });
  });

  describe('shouldDisplayField', () => {
    it('filters out internal fields', () => {
      expect(shouldDisplayField('category')).toBe(true);
      expect(shouldDisplayField('name')).toBe(true);
      expect(shouldDisplayField('__proto__')).toBe(false);
      expect(shouldDisplayField('constructor')).toBe(false);
      expect(shouldDisplayField('prototype')).toBe(false);
      expect(shouldDisplayField('_internal')).toBe(false);
    });
  });

  describe('sortFieldsByPriority', () => {
    it('sorts fields with priority fields first', () => {
      const fields = ['random', 'category', 'severity', 'description', 'other'];
      const sorted = sortFieldsByPriority(fields);
      
      expect(sorted[0]).toBe('category');
      expect(sorted[1]).toBe('severity');
      expect(sorted[2]).toBe('description');
      expect(sorted).toContain('random');
      expect(sorted).toContain('other');
    });
  });
});
