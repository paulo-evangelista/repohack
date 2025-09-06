'use client';

import React, { useState, useMemo } from 'react';
import { GenericScanResult, GenericThreat } from '../lib/types';
import { Button } from './ui/Button';
import { Container } from './ui/Container';
import { DynamicThreatDisplay } from './DynamicThreatDisplay';
import { 
  getStringValue, 
  getArrayValue, 
  getObjectValue,
  groupThreatsByCategory,
  groupThreatsByField,
  extractThreatFields,
  isValidScanResult,
  formatValueForDisplay,
  getFieldDisplayName,
  shouldDisplayField,
  sortFieldsByPriority,
  toTitleCase
} from '../lib/utils/dynamic-rendering';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface DynamicScanResultsProps {
  scanResult: GenericScanResult | null;
  isLoading?: boolean;
  showAllFields?: boolean;
  groupByField?: string;
}

const DynamicScanResults: React.FC<DynamicScanResultsProps> = ({ 
  scanResult, 
  isLoading = false, 
  showAllFields = false,
  groupByField = 'category'
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Extract data from scan result (always call hooks at the top)
  const overallStatus = scanResult ? getStringValue(scanResult, 'overallStatus', 'UNKNOWN') : 'UNKNOWN';
  const threats = useMemo(() => {
    return scanResult ? getArrayValue<GenericThreat>(scanResult, 'threats', []) : [];
  }, [scanResult]);
  const errors = scanResult ? getArrayValue<string>(scanResult, 'errors', []) : [];
  const repository = scanResult ? getObjectValue(scanResult, 'repository', {}) : {};
  const metadata = getObjectValue(repository, 'metadata', {});

  // Group threats dynamically
  const groupedThreats = useMemo(() => {
    if (groupByField === 'category') {
      return groupThreatsByCategory(threats);
    } else {
      return groupThreatsByField(threats, groupByField);
    }
  }, [threats, groupByField]);

  // Extract all available fields from threats for dynamic rendering
  const allThreatFields = useMemo(() => {
    const fields = extractThreatFields(threats);
    return sortFieldsByPriority(fields.filter(shouldDisplayField));
  }, [threats]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (subcategory: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategory)) {
      newExpanded.delete(subcategory);
    } else {
      newExpanded.add(subcategory);
    }
    setExpandedSubcategories(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'safe':
      case 'clean':
      case 'secure':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
      case 'warn':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'unsafe':
      case 'dangerous':
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Info className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'safe':
      case 'clean':
      case 'secure':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'unsafe':
      case 'dangerous':
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Handle early returns after hooks
  if (isLoading) {
    return (
      <Container className="mt-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" role="status" aria-label="Loading"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Scanning repository...</span>
        </div>
      </Container>
    );
  }

  // Validate scan result
  if (!isValidScanResult(scanResult)) {
    return (
      <Container className="mt-8">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
            Invalid Scan Result
          </h3>
          <p className="text-red-700 dark:text-red-300">
            The scan result data is not in the expected format.
          </p>
        </div>
      </Container>
    );
  }

  if (!scanResult) {
    return null;
  }

  // Render dynamic metadata fields
  const renderMetadataFields = () => {
    const metadataFields = Object.keys(metadata).filter(shouldDisplayField);
    if (metadataFields.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Repository Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metadataFields.map((field) => {
            const value = metadata[field];
            const displayName = getFieldDisplayName(field);
            
            // Special formatting for size field
            let displayValue = formatValueForDisplay(value);
            if (field === 'size' && typeof value === 'number') {
              displayValue = `${(value / 1024 / 1024).toFixed(2)} MB`;
            }
            
            return (
              <div key={field}>
                <p className="text-sm text-gray-500 dark:text-gray-400">{displayName}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {displayValue}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render dynamic scan result fields
  const renderScanResultFields = () => {
    const scanFields = Object.keys(scanResult).filter(field => 
      shouldDisplayField(field) && 
      !['repository', 'threats', 'errors', 'overallStatus', 'scanCompleted'].includes(field)
    );
    
    if (scanFields.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scan Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scanFields.map((field) => {
            const value = scanResult[field];
            const displayName = getFieldDisplayName(field);
            
            return (
              <div key={field}>
                <p className="text-sm text-gray-500 dark:text-gray-400">{displayName}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatValueForDisplay(value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Container className="mt-8">
      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(overallStatus)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Security Status
              </h2>
              <p className={`text-lg font-medium ${getStatusColor(overallStatus)}`}>
                {toTitleCase(overallStatus)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Repository</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {getStringValue(metadata, 'owner', 'Unknown')}/{getStringValue(metadata, 'name', 'Unknown')}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Repository Metadata */}
      {renderMetadataFields()}

      {/* Dynamic Scan Result Fields */}
      {renderScanResultFields()}

      {/* Threats Display */}
      {threats.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Security Threats ({threats.length})
          </h3>
          
          {Object.entries(groupedThreats).map(([category, subcategories]: [string, Record<string, GenericThreat[]> | GenericThreat[]]) => (
            <div key={category} className="mb-6">
              <Button
                variant="ghost"
                className="w-full justify-between p-3 text-left font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => toggleCategory(category)}
              >
                <span className="capitalize">{toTitleCase(category)}</span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
              
              {expandedCategories.has(category) && (
                <div className="ml-4 mt-2 space-y-3">
                  {typeof subcategories === 'object' && !Array.isArray(subcategories) ? (
                    // Grouped by category and subcategory
                    Object.entries(subcategories as Record<string, GenericThreat[]>).map(([subcategory, threats]) => (
                      <div key={subcategory} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-2 text-left font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => toggleSubcategory(`${category}-${subcategory}`)}
                        >
                          <span className="capitalize">{toTitleCase(subcategory)}</span>
                          {expandedSubcategories.has(`${category}-${subcategory}`) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {expandedSubcategories.has(`${category}-${subcategory}`) && (
                          <div className="mt-2 space-y-3">
                            {threats.map((threat, index) => (
                              <DynamicThreatDisplay
                                key={index}
                                threat={threat}
                                showAllFields={showAllFields}
                                className="bg-gray-50 dark:bg-gray-800"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    // Grouped by single field (array of threats)
                    <div className="space-y-3">
                      {(subcategories as GenericThreat[]).map((threat, index) => (
                        <DynamicThreatDisplay
                          key={index}
                          threat={threat}
                          showAllFields={showAllFields}
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Security Threats Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            The repository appears to be secure with no detected vulnerabilities.
          </p>
        </div>
      )}

      {/* Errors Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 mt-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-4">
            Scan Errors ({errors.length})
          </h3>
          <ul className="space-y-2">
            {errors.map((error, index) => (
              <li key={index} className="text-red-700 dark:text-red-300">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Available Fields Info (for debugging) */}
      {showAllFields && allThreatFields.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-4">
            Available Threat Fields
          </h3>
          <div className="flex flex-wrap gap-2">
            {allThreatFields.map((field) => (
              <span
                key={field}
                className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs font-medium"
              >
                {getFieldDisplayName(field)}
              </span>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
};

export { DynamicScanResults };
