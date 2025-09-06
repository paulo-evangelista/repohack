'use client';

import React from 'react';
import { GenericThreat } from '../lib/types';
import { 
  getStringValue, 
  getNumberValue, 
  getObjectValue,
  formatValueForDisplay,
  getFieldDisplayName,
  shouldDisplayField,
  sortFieldsByPriority,
  extractThreatFields,
  toTitleCase
} from '../lib/utils/dynamic-rendering';
import { FileText, MapPin, AlertTriangle, Info, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface DynamicThreatDisplayProps {
  threat: GenericThreat;
  className?: string;
  showAllFields?: boolean;
}

const DynamicThreatDisplay: React.FC<DynamicThreatDisplayProps> = ({ 
  threat, 
  className = '', 
  showAllFields = false 
}) => {
  const [expandedFields, setExpandedFields] = React.useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = React.useState(false);

  const toggleFieldExpansion = (fieldName: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
    } else {
      newExpanded.add(fieldName);
    }
    setExpandedFields(newExpanded);
  };

  const getSeverityIcon = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case 'critical':
      case 'error':
      case 'fatal':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
      case 'warn':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      case 'information':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case 'critical':
      case 'error':
      case 'fatal':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'warning':
      case 'warn':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'info':
      case 'information':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case 'critical':
      case 'error':
      case 'fatal':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      case 'warning':
      case 'warn':
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
      case 'info':
      case 'information':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800';
    }
  };

  // Extract common fields for display
  const category = getStringValue(threat, 'category', 'Unknown');
  const subcategory = getStringValue(threat, 'subcategory', 'General');
  const severity = getStringValue(threat, 'severity', 'INFO');
  const description = getStringValue(threat, 'description', 'No description available');
  const file = getStringValue(threat, 'file', 'Unknown file');
  const line = getNumberValue(threat, 'line', 0);
  const code = getStringValue(threat, 'code', '');
  const details = getObjectValue(threat, 'details', {});

  // Get all fields for dynamic rendering
  const allFields = extractThreatFields([threat]);
  const displayFields = showAllFields 
    ? allFields.filter(field => 
        shouldDisplayField(field) && 
        !['category', 'subcategory', 'severity', 'description', 'file', 'line', 'code', 'details'].includes(field)
      )
    : [];
  const sortedFields = sortFieldsByPriority(displayFields);

  const renderFieldValue = (fieldName: string, value: unknown) => {
    if (value === null) return <span className="text-gray-400 italic">null</span>;
    if (value === undefined) return <span className="text-gray-400 italic">undefined</span>;
    
    if (typeof value === 'string') {
      return <span className="text-gray-900 dark:text-white">{value}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-gray-900 dark:text-white font-mono">{value}</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {value.toString()}
        </span>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Array ({value.length} items)
          </span>
          {value.length > 0 && (
            <div className="ml-4 space-y-1">
              {value.slice(0, 3).map((item, index) => (
                <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                  {formatValueForDisplay(item)}
                </div>
              ))}
              {value.length > 3 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ... and {value.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <div className="space-y-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Object ({Object.keys(value as Record<string, unknown>).length} properties)
          </span>
          <div className="ml-4 space-y-1">
            {Object.entries(value as Record<string, unknown>).slice(0, 3).map(([key, val]) => (
              <div key={key} className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">{key}:</span>{' '}
                <span className="text-gray-900 dark:text-white">{formatValueForDisplay(val)}</span>
              </div>
            ))}
            {Object.keys(value as Record<string, unknown>).length > 3 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ... and {Object.keys(value as Record<string, unknown>).length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return <span className="text-gray-900 dark:text-white">{formatValueForDisplay(value)}</span>;
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header with severity and location */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getSeverityIcon(severity)}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(severity)}`}>
            {toTitleCase(severity)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <FileText className="h-4 w-4" />
          <span className="font-mono">{file}</span>
          {line > 0 && (
            <>
              <MapPin className="h-4 w-4" />
              <span className="font-mono">Line {line}</span>
            </>
          )}
        </div>
      </div>

      {/* Threat description */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
          {toTitleCase(category)} - {toTitleCase(subcategory)}
        </h4>
        <p className="text-gray-700 dark:text-gray-300 text-sm">
          {description}
        </p>
      </div>

      {/* Code snippet */}
      {code && (
        <div className={`rounded-lg p-3 mb-3 ${getSeverityBgColor(severity)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Code Snippet
            </span>
            {line > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Line {line}
              </span>
            )}
          </div>
          <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {/* Additional details */}
      {Object.keys(details).length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Details
          </h5>
          <div className="space-y-2">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {getFieldDisplayName(key)}:
                </span>
                <span className="text-gray-900 dark:text-white font-mono">
                  {formatValueForDisplay(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic fields */}
      {sortedFields.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Fields
            </h5>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {showDetails && (
            <div className="space-y-2">
              {sortedFields.map((fieldName) => {
                const value = threat[fieldName];
                const isExpanded = expandedFields.has(fieldName);
                const isComplex = typeof value === 'object' && value !== null;
                
                return (
                  <div key={fieldName} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {getFieldDisplayName(fieldName)}:
                      </span>
                      {isComplex && (
                        <button
                          onClick={() => toggleFieldExpansion(fieldName)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {isComplex && isExpanded ? (
                      <div className="ml-4 mt-1">
                        {renderFieldValue(fieldName, value)}
                      </div>
                    ) : (
                      <div className="ml-4 mt-1">
                        {renderFieldValue(fieldName, value)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { DynamicThreatDisplay };
