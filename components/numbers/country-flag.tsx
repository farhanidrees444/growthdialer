'use client';

import type { ComponentType } from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

interface CountryFlagProps {
  code: string;
  className?: string;
}

export default function CountryFlag({ code, className = 'w-full h-full' }: CountryFlagProps) {
  const FlagComponent = (Flags as Record<string, ComponentType<{ className?: string }>>)[code];
  if (!FlagComponent) {
    return <span className="text-base leading-none">🌐</span>;
  }
  return <FlagComponent className={className} />;
}
