'use client';

import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';

/**
 * variant="icon"   → compact icon-only button (mobile header)
 * variant="row"    → labeled row with animated pill (sidebar)
 */
export function ThemeToggle({
  variant = 'icon',
  className,
}: {
  variant?: 'icon' | 'row';
  className?: string;
}) {
  const { theme, toggle } = useTheme();

  if (variant === 'row') {
    return (
      <div className={cn('flex items-center justify-between rounded-lg px-3 py-2.5', className)}>
        <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
          {/* Icons controlled by CSS dark: variants — no hydration flicker */}
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span>Dark mode</span>
        </div>

        {/* Pill toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label="Toggle dark mode"
          onClick={toggle}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            theme === 'dark' ? 'bg-primary' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
              theme === 'dark' ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
      </div>
    );
  }

  // icon variant
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
    </button>
  );
}
