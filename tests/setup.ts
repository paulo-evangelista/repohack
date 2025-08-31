import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js fonts
vi.mock('next/font/google', () => ({
  Inter: () => ({
    variable: '--font-inter',
    style: { fontFamily: 'Inter' },
  }),
  Fira_Mono: () => ({
    variable: '--font-fira-mono',
    style: { fontFamily: 'Fira Mono' },
  }),
}));
