'use client';

import { useState } from 'react';
import { Container } from '../components/ui/Container';
import { RepositoryInput } from '../components/RepositoryInput';
import { ScanResults } from '../components/ScanResults';
import { ScanResult } from '../lib/types';

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanComplete = (result: ScanResult) => {
    setScanResult(result);
    setIsScanning(false);
  };

  const handleScanStart = () => {
    setIsScanning(true);
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">R</span>
              </div>
              <h1 className="text-xl font-bold">RepoHack</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </nav>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Container className="py-12">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">
                Security Scanner for Code Repositories
              </h2>
              <p className="text-xl text-muted-foreground">
                Advanced threat detection using AST parsing and code analysis to identify security vulnerabilities in your codebase.
              </p>
            </div>

            {/* Repository Input Section */}
            <div className="space-y-6">
              <RepositoryInput 
                onScanStart={handleScanStart}
                onScanComplete={handleScanComplete}
              />

              {/* Scan Results */}
              {(isScanning || scanResult) && (
                <ScanResults 
                  scanResult={scanResult}
                  isLoading={isScanning}
                />
              )}

              {/* Features Section */}
              <div className="grid md:grid-cols-3 gap-6 pt-8">
                <div className="text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold">AST Parsing</h4>
                  <p className="text-sm text-muted-foreground">
                    Advanced code analysis using Abstract Syntax Trees
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold">Threat Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Identify security vulnerabilities and code execution risks
                  </p>
                </div>

                <div className="text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold">Fast & Secure</h4>
                  <p className="text-sm text-muted-foreground">
                    Efficient scanning with comprehensive security coverage
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <Container>
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">
              Built with Next.js and Tailwind CSS • Security-focused code analysis
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
