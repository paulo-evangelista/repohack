'use client';

import React, { useState } from 'react';
import { ScanResult, ThreatResult } from '../lib/types';
import { Button } from './ui/Button';
import { Container } from './ui/Container';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ScanResultsProps {
  scanResult: ScanResult | null;
  isLoading?: boolean;
}

const ScanResults: React.FC<ScanResultsProps> = ({ scanResult, isLoading = false }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  if (!scanResult) {
    return null;
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SAFE':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'UNSAFE':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'text-green-600 dark:text-green-400';
      case 'WARNING':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'UNSAFE':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  // Group threats by category and subcategory
  const groupedThreats = scanResult.threats?.reduce((acc, threat) => {
    if (!acc[threat.category]) {
      acc[threat.category] = {};
    }
    if (!acc[threat.category][threat.subcategory]) {
      acc[threat.category][threat.subcategory] = [];
    }
    acc[threat.category][threat.subcategory].push(threat);
    return acc;
  }, {} as Record<string, Record<string, ThreatResult[]>>) || {};

  return (
    <Container className="mt-8">
      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(scanResult.overallStatus)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Security Status
              </h2>
              <p className={`text-lg font-medium ${getStatusColor(scanResult.overallStatus)}`}>
                {scanResult.overallStatus}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Repository</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {scanResult.repository.metadata.owner}/{scanResult.repository.metadata.name}
            </p>
          </div>
        </div>
      </div>

      {/* Repository Metadata */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Repository Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Size</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {(scanResult.repository.metadata.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Files</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {scanResult.repository.metadata.fileCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Branch</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {scanResult.repository.metadata.branch}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Clone Time</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {scanResult.repository.metadata.cloneTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Threats Display */}
      {scanResult.threats && scanResult.threats.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Security Threats ({scanResult.threats.length})
          </h3>
          
          {Object.entries(groupedThreats).map(([category, subcategories]) => (
            <div key={category} className="mb-6">
              <Button
                variant="ghost"
                className="w-full justify-between p-3 text-left font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => toggleCategory(category)}
              >
                <span className="capitalize">{category}</span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
              
              {expandedCategories.has(category) && (
                <div className="ml-4 mt-2 space-y-3">
                  {Object.entries(subcategories).map(([subcategory, threats]) => (
                    <div key={subcategory} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        {subcategory}
                      </h4>
                      {threats.map((threat, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(threat.severity)}`}>
                              {threat.severity}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {threat.file}:{threat.line || 'N/A'}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-white mb-2">{threat.description}</p>
                          {threat.code && (
                            <pre className="bg-gray-100 dark:bg-gray-900 rounded p-3 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                              <code>{threat.code}</code>
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
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
      {scanResult.errors && scanResult.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 mt-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-4">
            Scan Errors ({scanResult.errors.length})
          </h3>
          <ul className="space-y-2">
            {scanResult.errors.map((error, index) => (
              <li key={index} className="text-red-700 dark:text-red-300">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
};

export { ScanResults };
