# Server Actions Architecture

## Main Scan Function

```typescript
// app/lib/actions/scan.ts
'use server'

export async function scan(repositoryUrl: string): Promise<ScanResult> {
  try {
    // 1. Clone repository
    const repo = await cloneRepository(repositoryUrl);
    
    // 2. Execute all threat scanners
    const results = await Promise.all([
      scanCodeExecution(repo.files),
      scanProcessControl(repo.files),
      scanFileSystem(repo.files),
      scanNetworkCommunications(repo.files),
      scanEnvironmentAccess(repo.files),
      scanDependencies(repo.files)
    ]);
    
    // 3. Aggregate and format results
    const aggregatedResults = aggregateResults(results);
    
    // 4. Cleanup temporary files
    await cleanupRepository(repo.path);
    
    return aggregatedResults;
  } catch (error) {
    throw new Error(`Scan failed: ${error.message}`);
  }
}
```

## Individual Scanner Functions

```typescript
// lib/scanners/code-execution.ts
export async function scanCodeExecution(files: RepositoryFile[]): Promise<ThreatResult[]> {
  const results: ThreatResult[] = [];
  
  for (const file of files) {
    if (isCodeFile(file)) {
      const ast = parseAST(file.content);
      const threats = detectEvalUsage(ast, file);
      results.push(...threats);
    }
  }
  
  return results;
}
```
