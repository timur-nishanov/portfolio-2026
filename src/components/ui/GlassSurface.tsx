import { forwardRef } from 'react';

type GlassSurfaceProps<T extends React.ElementType> = {
  as?: T;
  variant?: 'glass' | 'solid';
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

/**
 * The single source of glass (TZ §15). Every glassy surface — nav pill, header
 * buttons, case buttons, award buttons — renders through this so the layered
 * shadow and blur never drift between components. Default radius is a full pill;
 * pass a rounded-* / rounded-card utility to override.
 */
function GlassSurfaceInner<T extends React.ElementType = 'div'>(
  { as, variant = 'glass', className = '', children, ...rest }: GlassSurfaceProps<T>,
  ref: React.Ref<Element>,
) {
  const Tag = (as ?? 'div') as React.ElementType;
  const base = variant === 'solid' ? 'glass-solid' : 'glass';
  return (
    <Tag ref={ref} className={`${base} rounded-full ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export const GlassSurface = forwardRef(GlassSurfaceInner) as <T extends React.ElementType = 'div'>(
  props: GlassSurfaceProps<T> & { ref?: React.Ref<Element> },
) => React.ReactElement;
