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

  // Swelling. Every impact puffs the skin around it: sampling from a point
  // pulled toward the mark magnifies the texture there, so the area balloons
  // and — near the silhouette — visibly deforms the outline. This is what
  // sells "took a beating" without leaning on colour, and it stacks, so a
  // face that's been thrown around a lot ends up genuinely misshapen.
  // Displacement scales with `rel` itself, not its direction. That matters:
  // a normalize() here is undefined at the mark's centre and pushes a fixed
  // amount in an arbitrary direction, which pinches the texture into a dark
  // speck at every impact point. Scaling the vector instead goes cleanly to
  // zero at the centre, and pulling each sample toward the mark magnifies the
  // skin around it — a smooth bulge, no singularity.
  vec2 swell = vec2(0.0);
  for (int i = 0; i < MAX_MARKS; i++) {
    vec3 m = uMarks[i];
    vec2 rel = duv - m.xy;
    float f = 1.0 - smoothstep(0.0, 0.18, length(rel));
    swell += rel * f * m.z * 0.3;
  }
  vec2 suv = duv - swell;

  vec4 direct = texture2D(uColor, suv);

  // Hide the mirror seam running down the texture centre. The head is
  // mirror-symmetric (TZ §1.3), so x≈0.5 is a hard join line. In a narrow band
  // there, replace the sample with a short horizontal blur that averages across
  // the join, dissolving the line without smearing the rest of the face.
  float seam = 1.0 - smoothstep(0.0, 0.05, abs(suv.x - 0.5));
  if (seam > 0.001) {
    float bx = uTexel.x * 4.0;
    vec4 acc = texture2D(uColor, suv + vec2(-3.0 * bx, 0.0))
             + texture2D(uColor, suv + vec2(-2.0 * bx, 0.0))
             + texture2D(uColor, suv + vec2(-1.0 * bx, 0.0))
             + direct
             + texture2D(uColor, suv + vec2( 1.0 * bx, 0.0))
             + texture2D(uColor, suv + vec2( 2.0 * bx, 0.0))
             + texture2D(uColor, suv + vec2( 3.0 * bx, 0.0));
    acc *= (1.0 / 7.0);
    direct = mix(direct, acc, seam);
  }

  // Mirror-fill: at big angles the displaced sample falls off the silhouette
  // (alpha drops / edge smears). Take the missing pixels from the flipped half.
  vec4 mirror = texture2D(uColor, vec2(1.0 - suv.x, suv.y));
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
  // face like it's painted on the skin, shaped by two radial falloffs (soft
  // outer flush + darker core). The look comes from a hash of the mark's own
  // position, so repeat hits never read identical — but the palette is
  // deliberately almost all red: only the top slice of the hash goes purple,
  // so at most a mark or two is ever "blue". The radii are broken up by a
  // per-pixel hash, which turns the perfect discs into raw, ragged abrasions.
  float rawSum = 0.0;
  vec3 colorSum = vec3(0.0);
  for (int i = 0; i < MAX_MARKS; i++) {
    vec3 m = uMarks[i];
    float d = distance(duv, m.xy);
    float kind = hash(m.xy);
    float sizeJitter = 0.85 + hash(m.xy + 4.7) * 0.3;
    // Ragged edge — a grazed patch, not a stamped circle.
    float ragged = 0.82 + hash(floor(duv * 260.0)) * 0.36;

    float outerR;
    vec3 welt;
    if (kind > 0.86) {
      // The rare one that's gone properly purple.
      outerR = 0.17 * sizeJitter;
      welt = vec3(0.19, 0.09, 0.22);
    } else if (kind > 0.56) {
      // Broad raw flush — the skin scraped and inflamed.
      outerR = 0.16 * sizeJitter;
      welt = vec3(0.58, 0.10, 0.10);
    } else if (kind > 0.28) {
      // Deeper red patch.
      outerR = 0.115 * sizeJitter;
      welt = vec3(0.40, 0.08, 0.08);
    } else {
      // Classic red bruise.
      outerR = 0.14 * sizeJitter;
      welt = vec3(0.50, 0.09, 0.10);
    }

    // One wide, soft falloff only. The old tight `core` term stacked a small
    // near-black disc in the middle of every mark, which read as a hole
    // punched in the face rather than a bruise — the damage should come from
    // the swelling above plus a diffuse flush, never a dot.
    float amt = m.z * (1.0 - smoothstep(0.0, outerR * ragged, d)) * 0.62;
    rawSum += amt;
    colorSum += welt * amt;
  }
  float bruise = clamp(rawSum, 0.0, 1.0);
  if (bruise > 0.001) {
    vec3 avgWelt = colorSum / max(rawSum, 0.0001);
    // Tint toward the welt without crushing the skin dark — keeps it reading
    // as inflammation over the existing texture.
    col.rgb = mix(col.rgb, mix(col.rgb * 0.82, avgWelt, 0.5), bruise * 0.6);
  }

  gl_FragColor = vec4(col.rgb, col.a);
}
