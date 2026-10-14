import React from 'react';

interface HeadingProps {
  title: string;
  description: string;
  infoContent?: React.ReactNode;
}

export function Heading({ title, description, infoContent }: HeadingProps) {
  return (
    <div>
      <div className='flex items-center gap-2'>
        <h2 className='text-3xl font-bold tracking-tight'>{title}</h2>
        {infoContent && (
          <div className='pt-1'>
            {infoContent}
          </div>
        )}
      </div>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  );
}

