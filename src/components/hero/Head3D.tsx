'use client';

// Placeholder until the shader stage (TZ §16 step 10). Renders the static head
// so the dynamic import resolves and the layout is final; the WebGL plane,
// depth tilt, mirror-fill, light and throw physics land here next.
import { StaticHead } from './StaticHead';

export function Head3D() {
  return <StaticHead />;
}
