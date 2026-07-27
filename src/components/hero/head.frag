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

varying vec2 vUv;

float depthAt(vec2 uv) {
  return texture2D(uDepth, uv).r;
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

  gl_FragColor = vec4(col.rgb, col.a);
}
