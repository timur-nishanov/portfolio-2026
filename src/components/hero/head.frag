precision highp float;

uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uPointer;       // smoothed, -1..1
uniform float uDepthPivot;   // ~0.62, rotation happens around cheek level
uniform float uStrength;     // scales parallax offset (sets the felt angle)
uniform vec2 uLightDir;      // 2d light direction (follows cursor)
uniform float uLightStrength;
uniform vec2 uTexel;         // 1/resolution for gradients

varying vec2 vUv;

float depthAt(vec2 uv) {
  return texture2D(uDepth, uv).r;
}

void main() {
  vec2 uv = vUv;

  // Depth-proportional UV shift: near features (nose) travel more than far
  // ones (hair), which the brain reads as a 3D turn (TZ §7.2).
  float d0 = depthAt(uv);
  vec2 offset = uPointer * (d0 - uDepthPivot) * uStrength;
  vec2 duv = uv - offset;

  vec4 direct = texture2D(uColor, duv);

  // Mirror-fill: at big angles the displaced sample falls off the silhouette
  // (alpha drops / edge smears). The head is mirror-symmetric, so the missing
  // pixels are the same face flipped in x. Blend across a soft band so the seam
  // on the low-poly facets doesn't read (TZ §7.2).
  vec4 mirror = texture2D(uColor, vec2(1.0 - duv.x, duv.y));
  float exposure = 1.0 - smoothstep(0.35, 0.6, direct.a);
  vec4 col = mix(direct, mirror, exposure);

  // Discard fully transparent pixels so clicks/blend fall through cleanly.
  if (col.a < 0.02) discard;

  // Directional light from the depth-derived normal. Kept gentle — this is what
  // turns "a swaying picture" into "a solid object" without going plastic.
  float dl = depthAt(uv - vec2(uTexel.x, 0.0));
  float dr = depthAt(uv + vec2(uTexel.x, 0.0));
  float db = depthAt(uv - vec2(0.0, uTexel.y));
  float dt = depthAt(uv + vec2(0.0, uTexel.y));
  vec3 n = normalize(vec3((dl - dr) * 0.3, (db - dt) * 0.3, 1.0));
  vec3 lightDir = normalize(vec3(uLightDir, 0.9));
  float diff = clamp(dot(n, lightDir), 0.0, 1.0) - 0.5;
  col.rgb += diff * uLightStrength;

  gl_FragColor = vec4(col.rgb, col.a);
}
