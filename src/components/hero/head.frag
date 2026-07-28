precision highp float;

uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uPointer;       // felt turn, -1..1 (from physics, not the cursor)
uniform float uDepthPivot;   // ~0.62, rotation happens around cheek level
uniform float uStrength;     // scales parallax offset (sets the felt angle)
uniform vec2 uLightDir;      // 2d light direction
uniform float uLightStrength;
uniform vec2 uTexel;         // 1/resolution for gradients
uniform float uSquash;       // 0 = relaxed, 1 = fully squeezed

// Impact bruises: xy = position in texture UV, z = strength (0 = unused).
// Fixed-size array so the loop bound stays a compile-time constant.
#define MAX_MARKS 6
uniform vec3 uMarks[MAX_MARKS];

varying vec2 vUv;

float depthAt(vec2 uv) {
  return texture2D(uDepth, uv).r;
}

// Deterministic per-mark pseudo-random, seeded off the mark's own UV — same
// mark always reads the same, but different marks (different jittered spots)
// land on different looks.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;

  // Squeeze: sampling a wider box horizontally makes the face read as
  // compressed, and a shorter box vertically makes it bulge — like a fist
  // closing around it. Negative uSquash (impact rebound) stretches instead.
  if (abs(uSquash) > 0.001) {
    vec2 sc = uv - 0.5;
    sc.x *= (1.0 + uSquash * 0.5);
    sc.y *= (1.0 - uSquash * 0.28);
    uv = sc + 0.5;
  }

  // Depth-proportional UV shift: near features (nose) travel more than far
  // ones (hair), which the brain reads as a 3D turn (TZ §7.2).
  float d0 = depthAt(uv);
  vec2 offset = uPointer * (d0 - uDepthPivot) * uStrength;
  vec2 duv = uv - offset;

  vec4 direct = texture2D(uColor, duv);

  // Hide the mirror seam running down the texture centre. The head is
  // mirror-symmetric (TZ §1.3), so x≈0.5 is a hard join line. In a narrow band
  // there, replace the sample with a short horizontal blur that averages across
  // the join, dissolving the line without smearing the rest of the face.
  float seam = 1.0 - smoothstep(0.0, 0.05, abs(duv.x - 0.5));
  if (seam > 0.001) {
    float bx = uTexel.x * 4.0;
    vec4 acc = texture2D(uColor, duv + vec2(-3.0 * bx, 0.0))
             + texture2D(uColor, duv + vec2(-2.0 * bx, 0.0))
             + texture2D(uColor, duv + vec2(-1.0 * bx, 0.0))
             + direct
             + texture2D(uColor, duv + vec2( 1.0 * bx, 0.0))
             + texture2D(uColor, duv + vec2( 2.0 * bx, 0.0))
             + texture2D(uColor, duv + vec2( 3.0 * bx, 0.0));
    acc *= (1.0 / 7.0);
    direct = mix(direct, acc, seam);
  }

  // Mirror-fill: at big angles the displaced sample falls off the silhouette
  // (alpha drops / edge smears). Take the missing pixels from the flipped half.
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

  // Marks left by wall impacts. Sampled in the displaced UV so each rides the
  // face like it's painted on the skin. Each picks one of four looks from a
  // hash of its own position, so repeat hits never read identical: a thin red
  // scratch, a wider soft black-eye swell, a small tight dark scuff, or the
  // classic red-purple bruise. The blotches use two radial falloffs (soft
  // outer flush + darker core); the scratch uses an anisotropic field —
  // distance squashed hard across a random axis and stretched along it — so
  // it draws a fine streak instead of a disc.
  float rawSum = 0.0;
  vec3 colorSum = vec3(0.0);
  for (int i = 0; i < MAX_MARKS; i++) {
    vec3 m = uMarks[i];
    vec2 rel = duv - m.xy;
    float d = length(rel);
    float kind = hash(m.xy);
    float sizeJitter = 0.85 + hash(m.xy + 4.7) * 0.3;
    float amt;
    vec3 welt;
    if (kind > 0.75) {
      // Scratch: rotate into the mark's own axis, then squash across / stretch
      // along it to get a thin graze at a random angle. Fresh, bright red.
      float ang = hash(m.xy + 9.1) * 6.2831853;
      float ca = cos(ang);
      float sa = sin(ang);
      vec2 r = vec2(rel.x * ca - rel.y * sa, rel.x * sa + rel.y * ca);
      float sd = length(vec2(r.x / (0.006 * sizeJitter), r.y / (0.09 * sizeJitter)));
      amt = m.z * (1.0 - smoothstep(0.35, 1.0, sd));
      welt = vec3(0.58, 0.05, 0.06);
    } else if (kind > 0.5) {
      // Black-eye: wider and softer, cooler/darker tone — reads as swelling.
      float outer = 1.0 - smoothstep(0.0, 0.17 * sizeJitter, d);
      float core = 1.0 - smoothstep(0.0, 0.085 * sizeJitter, d);
      amt = m.z * (outer * 0.55 + core * 0.65);
      welt = vec3(0.15, 0.06, 0.21);
    } else if (kind > 0.25) {
      // Scuff: small and dark, little spread.
      float outer = 1.0 - smoothstep(0.0, 0.06 * sizeJitter, d);
      float core = 1.0 - smoothstep(0.0, 0.026 * sizeJitter, d);
      amt = m.z * (outer * 0.55 + core * 0.65);
      welt = vec3(0.27, 0.11, 0.10);
    } else {
      // Classic red-purple bruise.
      float outer = 1.0 - smoothstep(0.0, 0.10 * sizeJitter, d);
      float core = 1.0 - smoothstep(0.0, 0.045 * sizeJitter, d);
      amt = m.z * (outer * 0.55 + core * 0.65);
      welt = vec3(0.42, 0.05, 0.09);
    }
    rawSum += amt;
    colorSum += welt * amt;
  }
  float bruise = clamp(rawSum, 0.0, 1.0);
  if (bruise > 0.001) {
    vec3 avgWelt = colorSum / max(rawSum, 0.0001);
    col.rgb = mix(col.rgb, mix(col.rgb * 0.5, avgWelt, 0.5), bruise * 0.8);
  }

  gl_FragColor = vec4(col.rgb, col.a);
}
