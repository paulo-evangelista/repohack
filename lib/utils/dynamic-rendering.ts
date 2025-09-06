import { GenericField, GenericThreat, GenericScanResult } from '../types';

/**
 * Utility functions for dynamic JSON rendering
 */

/**
 * Determines the type of a value for rendering purposes
 */
export function getValueType(value: unknown): GenericField['type'] {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as GenericField['type'];
}

/**
 * Converts an object to an array of GenericField objects
 */
export function objectToFields(obj: Record<string, unknown>): GenericField[] {
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value,
    type: getValueType(value)
  }));
}

/**
 * Safely extracts a string value from a generic object
 */
export function getStringValue(obj: Record<string, unknown>, key: string, fallback = ''): string {
  const value = obj[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  return fallback;
}

/**
 * Safely extracts a number value from a generic object
 */
export function getNumberValue(obj: Record<string, unknown>, key: string, fallback = 0): number {
  const value = obj[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Safely extracts a boolean value from a generic object
 */
export function getBooleanValue(obj: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = obj[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

/**
 * Safely extracts an array value from a generic object
 */
export function getArrayValue<T = unknown>(obj: Record<string, unknown>, key: string, fallback: T[] = []): T[] {
  const value = obj[key];
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

/**
 * Safely extracts an object value from a generic object
 */
export function getObjectValue(obj: Record<string, unknown>, key: string, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  const value = obj[key];
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return fallback;
}

/**
 * Groups threats by category and subcategory dynamically
 */
export function groupThreatsByCategory(threats: GenericThreat[]): Record<string, Record<string, GenericThreat[]>> {
  return threats.reduce((acc, threat) => {
    const category = getStringValue(threat, 'category', 'Unknown');
    const subcategory = getStringValue(threat, 'subcategory', 'General');
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][subcategory]) {
      acc[category][subcategory] = [];
    }
    acc[category][subcategory].push(threat);
    return acc;
  }, {} as Record<string, Record<string, GenericThreat[]>>);
}

/**
 * Groups threats by any field dynamically
 */
export function groupThreatsByField(threats: GenericThreat[], fieldName: string): Record<string, GenericThreat[]> {
  return threats.reduce((acc, threat) => {
    const fieldValue = getStringValue(threat, fieldName, 'Unknown');
    if (!acc[fieldValue]) {
      acc[fieldValue] = [];
    }
    acc[fieldValue].push(threat);
    return acc;
  }, {} as Record<string, GenericThreat[]>);
}

/**
 * Extracts all unique field names from an array of threats
 */
export function extractThreatFields(threats: GenericThreat[]): string[] {
  const fieldSet = new Set<string>();
  threats.forEach(threat => {
    Object.keys(threat).forEach(key => fieldSet.add(key));
  });
  return Array.from(fieldSet).sort();
}

/**
 * Validates if a value is a valid threat object
 */
export function isValidThreat(obj: unknown): obj is GenericThreat {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

/**
 * Validates if a value is a valid scan result
 */
export function isValidScanResult(obj: unknown): obj is GenericScanResult {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

/**
 * Safely formats a value for display
 */
export function formatValueForDisplay(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '[Object]';
  return String(value);
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Converts camelCase, snake_case, or kebab-case to Title Case
 */
export function toTitleCase(str: string): string {
  if (!str) return str;
  
  // Handle all caps words (like CRITICAL, WARNING, etc.) - keep them as is
  if (str === str.toUpperCase() && str.length > 1) {
    return str;
  }
  
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .filter(word => word.length > 0) // Remove empty strings
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Gets a display name for a field key
 */
export function getFieldDisplayName(key: string): string {
  return toTitleCase(key);
}

/**
 * Checks if a field should be displayed (filters out internal/technical fields)
 */
export function shouldDisplayField(key: string): boolean {
  const hiddenFields = ['__proto__', 'constructor', 'prototype'];
  return !hiddenFields.includes(key) && !key.startsWith('_');
}

/**
 * Sorts fields by priority (common fields first, then alphabetical)
 */
export function sortFieldsByPriority(fields: string[]): string[] {
  const priorityFields = ['category', 'subcategory', 'severity', 'description', 'file', 'line', 'code', 'details'];
  const prioritySet = new Set(priorityFields);
  
  const priority = fields.filter(field => prioritySet.has(field));
  const others = fields.filter(field => !prioritySet.has(field)).sort();
  
  return [...priority, ...others];
}
