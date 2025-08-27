# File Structure

```
repohack/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── health/
│           └── route.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── LoadingIndicator.tsx
│   ├── RepositoryInput.tsx
│   ├── ScanResults.tsx
│   └── ThreatDisplay.tsx
├── lib/
│   ├── actions/
│   │   └── scan.ts
│   ├── scanners/
│   │   ├── code-execution.ts
│   │   ├── process-control.ts
│   │   ├── file-system.ts
│   │   ├── network-communications.ts
│   │   ├── environment-access.ts
│   │   └── dependencies.ts
│   ├── git/
│   │   └── repository.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── ast-parser.ts
│       └── file-utils.ts
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```
