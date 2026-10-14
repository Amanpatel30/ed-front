'use client';

import { useThemeConfig } from '@/components/themes/active-theme';
import { useHydrated } from '@/hooks/use-hydrated';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Icons } from '@/components/icons';
import { Kbd } from '@/components/ui/kbd';
import { DEFAULT_THEME, THEMES } from './theme.config';

export function ThemeSelector({
  className,
  showLabel = false,
  fullWidth = false,
}: {
  className?: string;
  showLabel?: boolean;
  fullWidth?: boolean;
} = {}) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const hydrated = useHydrated();

  const currentTheme = hydrated ? activeTheme : DEFAULT_THEME;

  return (
    <div className={className ? `flex flex-col gap-1 ${className}` : 'flex flex-col gap-1'}>
      <Label
        htmlFor='theme-selector'
        className={showLabel ? 'text-xs font-medium text-foreground' : 'sr-only'}
      >
        Theme
      </Label>
      <Select
        items={THEMES.map((theme) => ({ value: theme.value, label: theme.name }))}
        value={currentTheme}
        onValueChange={(value) => {
          if (value !== null) setActiveTheme(value);
        }}
      >
        <SelectTrigger
          id='theme-selector'
          className={
            fullWidth
              ? 'h-8 w-full justify-between text-xs'
              : 'justify-start *:data-[slot=select-value]:w-24'
          }
        >
          <span className='text-muted-foreground'>
            <Icons.palette />
          </span>
          <SelectValue placeholder='Select a theme' />
          {!fullWidth && <Kbd>T T</Kbd>}
        </SelectTrigger>
        <SelectContent align='end'>
          {THEMES.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>Themes</SelectLabel>
                {THEMES.map((theme) => (
                  <SelectItem key={theme.name} value={theme.value}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
