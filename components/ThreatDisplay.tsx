'use client';

import React from 'react';
import { ThreatResult } from '../lib/types';
import { FileText, MapPin, AlertTriangle, Info, XCircle } from 'lucide-react';

interface ThreatDisplayProps {
  threat: ThreatResult;
  className?: string;
}

const ThreatDisplay: React.FC<ThreatDisplayProps> = ({ threat, className = '' }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
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

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
      case 'WARNING':
        return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
      case 'INFO':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header with severity and location */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getSeverityIcon(threat.severity)}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(threat.severity)}`}>
            {threat.severity}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <FileText className="h-4 w-4" />
          <span className="font-mono">{threat.file}</span>
          {threat.line && (
            <>
              <MapPin className="h-4 w-4" />
              <span className="font-mono">Line {threat.line}</span>
            </>
          )}
        </div>
      </div>

      {/* Threat description */}
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
          {threat.category} - {threat.subcategory}
        </h4>
        <p className="text-gray-700 dark:text-gray-300 text-sm">
          {threat.description}
        </p>
      </div>

      {/* Code snippet */}
      {threat.code && (
        <div className={`rounded-lg p-3 mb-3 ${getSeverityBgColor(threat.severity)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Code Snippet
            </span>
            {threat.line && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Line {threat.line}
              </span>
            )}
          </div>
          <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
            <code>{threat.code}</code>
          </pre>
        </div>
      )}

      {/* Additional details */}
      {threat.details && Object.keys(threat.details).length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Details
          </h5>
          <div className="space-y-2">
            {Object.entries(threat.details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-gray-900 dark:text-white font-mono">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { ThreatDisplay };
