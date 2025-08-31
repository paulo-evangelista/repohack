'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LoadingIndicator } from './ui/LoadingIndicator';
import { scanRepository } from '../lib/actions/scan';
import type { ScanResult } from '../lib/actions/scan';

interface RepositoryInputProps {
  onSubmit?: (result: ScanResult) => void;
  onScanStart?: () => void;
  onScanComplete?: (result: ScanResult) => void;
  className?: string;
}

interface FormState {
  url: string;
  error: string;
  isLoading: boolean;
}

const RepositoryInput: React.FC<RepositoryInputProps> = ({ 
  onSubmit, 
  onScanStart,
  onScanComplete,
  className = '' 
}) => {
  const [formState, setFormState] = useState<FormState>({
    url: '',
    error: '',
    isLoading: false
  });

  // URL validation for GitHub and .git URLs
  const validateRepositoryUrl = (url: string): { isValid: boolean; error: string } => {
    if (!url.trim()) {
      return { isValid: false, error: 'Repository URL is required' };
    }

    // GitHub repository URL patterns
    const githubPatterns = [
      /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
      /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/?$/,
      /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\.git$/
    ];

    // .git URL patterns
    const gitPatterns = [
      /^https?:\/\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9._/-]+\.git$/,
      /^ssh:\/\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9._/-]+\.git$/,
      /^git@[a-zA-Z0-9.-]+:[a-zA-Z0-9._/-]+\.git$/
    ];

    // Check if URL matches any valid pattern
    const isValidGitHub = githubPatterns.some(pattern => pattern.test(url));
    const isValidGit = gitPatterns.some(pattern => pattern.test(url));

    if (!isValidGitHub && !isValidGit) {
      return { 
        isValid: false, 
        error: 'Please enter a valid GitHub repository URL or .git URL' 
      };
    }

    return { isValid: true, error: '' };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormState(prev => ({ ...prev, url, error: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL
    const validation = validateRepositoryUrl(formState.url);
    if (!validation.isValid) {
      setFormState(prev => ({ ...prev, error: validation.error }));
      return;
    }

    // Set loading state
    setFormState(prev => ({ ...prev, isLoading: true, error: '' }));

    // Call onScanStart callback if provided
    if (onScanStart) {
      onScanStart();
    }

    try {
      // Call scan server action
      const result = await scanRepository(formState.url);
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(result);
      }

      // Call onScanComplete callback if provided
      if (onScanComplete) {
        onScanComplete(result);
      }

      // Reset form on success
      setFormState({ url: '', error: '', isLoading: false });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setFormState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-6 space-y-4 ${className}`}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Scan Repository</h3>
        <p className="text-muted-foreground text-sm">
          Enter a GitHub repository URL to begin security analysis
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="url"
          placeholder="https://github.com/username/repository"
          label="Repository URL"
          value={formState.url}
          onChange={handleInputChange}
          error={formState.error}
          className="text-center text-lg"
          disabled={formState.isLoading}
          required
        />
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            type="submit" 
            size="lg" 
            className="flex-1 sm:flex-none min-w-[200px]"
            disabled={formState.isLoading}
          >
            {formState.isLoading ? (
              <>
                <LoadingIndicator size="sm" className="mr-2" />
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan Repository
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1 sm:flex-none"
            type="button"
            disabled={formState.isLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Learn More
          </Button>
        </div>
      </form>
    </div>
  );
};

export { RepositoryInput };
