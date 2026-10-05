/**
 * GLSL for the blood layer (WebGL2, raw). Passes, in order:
 *   field     every live kernel stamped additively into two half-float
 *             targets: thickness field F plus F-weighted size, dryness,
 *             erosion threshold, thickness multiplier, glint, drip share,
 *             highlight rotation
 *   mask      the drawn region (field over its threshold), 1 px AA
 *   blur      the mask at two widths → a smooth inward distance that becomes
 *             the liquid's height (a dome on pools, a flat film with a
 *             meniscus on small stains); the field and its size weight
 *             smoothed alongside, for the size estimate
 *   composite Beer-Lambert absorption over the page colour, softbox crescent,
 *             pin glint, meniscus rim, AA edge → premultiplied into the canvas
 *   flyers    motion-blurred drops in the air (180° shutter), in two layers:
 *             behind the head (squeezing out, or bound for a spot the head
 *             covers), then in front of it
 * Stage coordinates are CSS px with y down; every vertex shader maps them to
 * clip space itself, so no camera matrices are involved.
 */

const toClip = /* glsl */ `
vec4 toClip(vec2 p, vec2 stage) {
  return vec4(p.x / stage.x * 2.0 - 1.0, 1.0 - p.y / stage.y * 2.0, 0.0, 1.0);
}`;

// ---------------------------------------------------------------- field ----
export const KERNEL_VS = /* glsl */ `
precision highp float;
in vec3 position;
in vec2 iOff;    // offset from the stain centre, css px (before the landing spread)
in vec2 iCenter; // stain centre, css px
in vec3 iShape;  // sigma along, sigma across (css px), angle
in vec4 iP;      // amp, size (css px), kind, touchdown (event clock)
in vec4 iQ;      // visible from, visible to (event clock), dry start, ln(peak)
in vec4 iR;      // glint gain, highlight rotation, absorbed at, erosion pace
uniform vec2 uStage;
uniform float uT;      // event clock, s since the hit
uniform vec4 uTiming;  // matte from, matte by, shrink from, gone at
uniform float uKd;
out vec2 vQ;
flat out vec4 vA;
flat out vec4 vB;
${toClip}
void main() {
  float tau = uT - iP.w;
  float kind = iP.z;
  // landing transient, frame by frame like the approved render: 55 → 85 → 97 %
  float p = tau < 1.0 / 60.0 ? 0.55 : tau < 2.0 / 60.0 ? 0.85 : tau < 3.0 / 60.0 ? 0.97 : 1.0;
  bool hidden = tau < 0.0 || uT < iQ.x || uT >= iQ.y || (kind > 1.5 && kind < 2.5 && p < 0.8);
  float amp = iP.x * (1.0 - smoothstep(iR.z, iR.z + 0.09, uT));
  if (hidden || amp < 1e-3) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float f = 1.0;
  float sg = 1.0;
  if (kind < 0.5) { f = p; sg = p; }
  else if (kind < 1.5) { f = pow(p, 1.4); sg = 0.6 + 0.4 * p; }
  else if (kind < 2.5) { f = 0.4 + 0.6 * p; }
  // volume is conserved while it spreads: thicker (and glossier) first
  float hm = min(1.0 / (p * p), 3.3);
  float dry = max(smoothstep(iQ.z, iQ.z + 1.4 * uKd, uT), smoothstep(uTiming.x, uTiming.y, uT));
  float e = clamp((uT - uTiming.z) / (uTiming.w - uTiming.z), 0.0, 1.0);
  // small stains run a faster clock: they are gone before the big pools
  e = min(pow(e, 1.5) * iR.w, 1.0);
  // the threshold climbs toward the stain's own peak: thin parts go first,
  // the thickest core last, everything by the end of the clock. Linear in
  // log space keeps a pool's shape for most of the shrink (front-loading it
  // ate the big pools a second early against the approved timeline).
  float lnThr = e * iQ.w * 1.15;

  vec2 c = iCenter + iOff * f;
  vec2 s = iShape.xy * sg;
  float cs = cos(iShape.z);
  float sn = sin(iShape.z);
  vec2 q = position.xy * 3.5;
  vec2 d = vec2(q.x * s.x, q.y * s.y);
  vec2 pos = c + vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs);
  vQ = q;
  float sz = iP.y / 16.0;
  vA = vec4(amp, sz * sz * sz * sz, dry, lnThr);
  vB = vec4(hm, iR.x, 0.0, iR.y);
  gl_Position = toClip(pos, uStage);
}`;

/** Trails and beads: the CPU already resolved time, so plain kernels. */
export const PLAIN_VS = /* glsl */ `
precision highp float;
in vec3 position;
in vec2 iC;     // centre, css px
in vec3 iShape; // sx, sy (css px), angle
in vec4 iA;     // amp, (size/16)^4, dry, ln threshold
in vec4 iB;     // thickness mult, glint, drip share, rotation
uniform vec2 uStage;
out vec2 vQ;
flat out vec4 vA;
flat out vec4 vB;
${toClip}
void main() {
  if (iA.x < 1e-3) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float cs = cos(iShape.z);
  float sn = sin(iShape.z);
  vec2 q = position.xy * 3.5;
  vec2 d = vec2(q.x * iShape.x, q.y * iShape.y);
  vQ = q;
  vA = iA;
  vB = iB;
  gl_Position = toClip(iC + vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs), uStage);
}`;

export const KERNEL_FS = /* glsl */ `
precision highp float;
in vec2 vQ;
flat in vec4 vA;
flat in vec4 vB;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
void main() {
  float q = dot(vQ, vQ);
  if (q > 12.25) discard;
  float g = vA.x * exp(-0.5 * q);
  o0 = vec4(g, g * vA.y, g * vA.z, g * vA.w);
  o1 = vec4(g * vB.x, g * vB.y, g * vB.z, g * vB.w);
}`;

// ------------------------------------------------------ rect-quad passes ---
export const RECT_VS = /* glsl */ `
precision highp float;
in vec3 position;
uniform vec2 uStage;
uniform vec4 uRect; // x, y, w, h in css px
out vec2 vPx;
${toClip}
void main() {
  vec2 p = uRect.xy + (position.xy * 0.5 + 0.5) * uRect.zw;
  vPx = p;
  gl_Position = toClip(p, uStage);
}`;

export const CLEAR_FS = /* glsl */ `
precision highp float;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
void main() { o0 = vec4(0.0); o1 = vec4(0.0); }`;

// Shared by mask and composite: where the drawn edge is, in field px.
const shapeChunk = /* glsl */ `
uniform sampler2D uF0;
uniform sampler2D uF1;
uniform sampler2D uNoise;
uniform vec2 uStage;
uniform vec2 uTexel; // one field texel in uv
uniform float uFs;   // field px per css px
uniform float uK;    // css px per offline px
vec2 fieldUv(vec2 px) { return vec2(px.x / uStage.x, 1.0 - px.y / uStage.y); }
// Noise living on the wall (fixed to the page, not to the stains); the
// texture spans 256 offline px. Channels: edge, micro, tone, aniso; unit std.
vec4 wallNoise(vec2 px) { return (texture(uNoise, px / (256.0 * uK)) - 0.5) / 0.18; }
struct Shape { float F; float sd; float wd; vec4 f0; vec4 f1; vec4 n; };
Shape shapeAt(vec2 px, vec2 uv) {
  Shape s;
  s.f0 = texture(uF0, uv);
  s.f1 = texture(uF1, uv);
  s.F = s.f0.r;
  s.n = wallNoise(px);
  float iF = 1.0 / max(s.F, 1e-4);
  float Fd = s.f1.b;
  float Fs = max(s.F - Fd, 0.0);
  // pixels that exist only thanks to a drip dry and dissolve with the drip
  s.wd = clamp(3.0 * Fd * iF, 0.0, 1.0) * (1.0 - smoothstep(0.9, 1.4, Fs));
  float Fe = s.F + 0.10 * Fs * s.n.r;
  // irregular drying front: noise only ever speeds the erosion up
  float lnThr = s.f0.a * iF * (1.0 + 0.3 * clamp(s.n.a + 0.25, 0.0, 2.0)) * (1.0 - s.wd);
  float thr = exp(lnThr);
  float Fx1 = texture(uF0, uv + vec2(uTexel.x, 0.0)).r;
  float Fx0 = texture(uF0, uv - vec2(uTexel.x, 0.0)).r;
  float Fy1 = texture(uF0, uv - vec2(0.0, uTexel.y)).r;
  float Fy0 = texture(uF0, uv + vec2(0.0, uTexel.y)).r;
  vec2 g = 0.5 * vec2(Fx1 - Fx0, Fy1 - Fy0);
  s.sd = (Fe - thr) / max(length(g), 0.04);
  return s;
}`;

export const MASK_FS = /* glsl */ `
precision highp float;
in vec2 vPx;
${shapeChunk}
out vec4 o;
void main() {
  vec2 uv = fieldUv(vPx);
  vec4 f0 = texture(uF0, uv);
  // r, g: the drawn region (blurred narrow / wide next); b, a: field and size
  // weight, blurred so the size reads as the big kernels nearby (no seams)
  if (f0.r < 0.3) { o = vec4(0.0, 0.0, f0.r, f0.g); return; }
  Shape s = shapeAt(vPx, uv);
  float m = clamp(s.sd + 0.5, 0.0, 1.0);
  o = vec4(m, m, f0.r, f0.g);
}`;

export const BLUR_FS = /* glsl */ `
precision highp float;
in vec2 vPx;
uniform sampler2D uSrc;
uniform vec2 uStage;
uniform vec2 uDir;    // one field texel along the blur axis, in uv
uniform float uSigS;  // field px: narrow (films)
uniform float uSigL;  // wide (pools)
uniform float uSig3;  // the size estimate's smoothing
uniform int uRad;
out vec4 o;
void main() {
  vec2 uv = vec2(vPx.x / uStage.x, 1.0 - vPx.y / uStage.y);
  vec4 acc = vec4(0.0);
  vec3 w = vec3(0.0);
  vec3 k = -0.5 / vec3(uSigS * uSigS, uSigL * uSigL, uSig3 * uSig3);
  for (int i = -uRad; i <= uRad; i++) {
    float x = float(i);
    vec4 v = texture(uSrc, uv + uDir * x);
    vec3 g = exp(k * x * x);
    acc += v * vec4(g.x, g.y, g.z, g.z);
    w += g;
  }
  o = acc / vec4(w.x, w.y, w.z, w.z);
}`;

// The page colour is known (flat), so the layer can be premultiplied such
// that over that colour it lands exactly on what a multiplicative film would
// give; over anything else (the tagline) it stays a close approximation.
const premultChunk = /* glsl */ `
vec4 premultOver(vec3 v, vec3 bg) {
  vec3 lo = 1.0 - v / max(bg, vec3(1e-3));
  vec3 hi = (v - bg) / max(1.0 - bg, vec3(1e-3));
  float a = clamp(max(max(max(lo.r, lo.g), lo.b), max(max(hi.r, hi.g), hi.b)), 0.0, 1.0);
  return vec4(max(v - (1.0 - a) * bg, 0.0), a);
}`;

export const COMPOSITE_FS = /* glsl */ `
precision highp float;
in vec2 vPx;
${shapeChunk}
uniform sampler2D uBlur;
uniform float uDpr;
uniform vec3 uBg;     // page colour, sRGB
uniform float uSigS;  // blur widths, field px
uniform float uSigL;
out vec4 o;
${premultChunk}

// fresh / dried blood, per optical unit (the approved render's constants)
const vec3 SIGMA = vec3(2.1, 16.0, 18.5);
const vec3 SIGMA_DRY = vec3(2.5, 13.5, 17.5);
const vec3 SCATTER = vec3(0.085, 0.0035, 0.0040);
const vec3 SCATTER_DRY = vec3(0.060, 0.0075, 0.0050);
const vec3 CORE = vec3(0.024, 0.0009, 0.0018);
const vec3 CORE_DRY = vec3(0.018, 0.0028, 0.0018);
const vec3 GLOW = vec3(0.55, 0.012, 0.010);
// a touch under the offline's 0.36: next to the approved closeups the pools
// read maroon rather than crimson (~8% darker inside, side by side at 2x)
const float OPT_PER_PX = 0.33;

// dim studio + small windowed softbox upper-left + a thin rim strip; 'wide'
// grows the softbox on deep pools, whose broad wet streaks in the approved
// render came out as specks here
float envReflection(float rx, float ry, float wide) {
  float rr = rx * rx + ry * ry;
  float base = 0.16 * rr + 0.2 * clamp(-ry, 0.0, 1.0) * sqrt(rr);
  vec2 cbox = vec2(-0.32, -0.38);
  vec2 hb = vec2(0.205, 0.135) * (1.0 + wide);
  vec2 dd = abs(vec2(rx, ry) - cbox) - hb;
  float outside = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0);
  float win = 1.0 - smoothstep(-0.015, 0.035, outside);
  float mull = min(abs(rx - cbox.x), abs(ry - cbox.y));
  win *= 0.55 + 0.45 * smoothstep(0.008, 0.02, mull);
  float strip = (1.0 - smoothstep(0.0, 0.05, abs(rx - 0.55) - 0.03)) *
                (1.0 - smoothstep(0.0, 0.1, abs(ry + 0.05) - 0.25));
  return base + 16.0 * win + 4.0 * strip;
}

// liquid height (offline px) from the blurred mask: a capillary dome on big
// pools, a flat film with a meniscus rim on small and medium stains
float heightOf(vec2 B, float dcO, float fl, float hfac, float hmg) {
  float wsel = smoothstep(uSigS, uSigL, 0.5 * dcO * uK * uFs);
  float us = clamp(2.0 * B.r - 1.0, 0.0, 1.0);
  float ul = clamp(2.0 * B.g - 1.0, 0.0, 1.0);
  float q = mix(us, ul, wsel);
  float profD = 1.0 - (1.0 - q) * (1.0 - q);
  float profF = 0.8 * (1.0 - pow(1.0 - us, 2.5));
  return min(hfac * dcO * mix(profD, profF, fl) * hmg, 7.0);
}

void main() {
  vec2 uv = fieldUv(vPx);
  if (texture(uF0, uv).r < 0.35) discard;
  Shape s = shapeAt(vPx, uv);
  float sdCss = s.sd / uFs;
  float a = clamp(sdCss * uDpr + 0.5, 0.0, 1.0);
  if (a <= 0.0) discard;
  float sdO = sdCss / uK;

  float iF = 1.0 / s.F;
  vec4 B0 = texture(uBlur, uv);
  float SO = pow(max(B0.a, 0.0) / max(B0.b, 1e-4), 0.25) * 16.0 / uK;
  float D = clamp(s.f0.b * iF, 0.0, 1.0);
  float hm = s.f1.r * iF;
  float glp = s.f1.g * iF;
  float rot = s.f1.a * iF;

  float dcO = clamp(0.62 * SO, 1.0, 11.0);
  float fl = 1.0 - smoothstep(9.0, 17.0, SO);
  float hfac = 0.55 - 0.12 * smoothstep(5.0, 11.0, dcO);
  float hmg = min(hm, 1.45);
  float optm = min(hm / hmg, 1.25);
  float Hg = heightOf(B0.rg, dcO, fl, hfac, hmg);
  // normals over a wider baseline where the liquid is thick: a deep pool's
  // surface is smoother than a thin film's (the offline blurred its height
  // by 0.8 px on films, 2.8 px on pools) — and that is what turns a 1 px
  // glint line into a soft crescent. Up to 6 texels: at 3 the crescent was
  // still a thin line next to the approved closeups.
  float hb = mix(1.0, 6.0, smoothstep(0.7, 3.8, Hg));
  vec2 tx = vec2(uTexel.x * hb, 0.0);
  vec2 ty = vec2(0.0, uTexel.y * hb);
  float Hx1 = heightOf(texture(uBlur, uv + tx).rg, dcO, fl, hfac, hmg);
  float Hx0 = heightOf(texture(uBlur, uv - tx).rg, dcO, fl, hfac, hmg);
  float Hy1 = heightOf(texture(uBlur, uv - ty).rg, dcO, fl, hfac, hmg);
  float Hy0 = heightOf(texture(uBlur, uv + ty).rg, dcO, fl, hfac, hmg);
  vec4 n2 = wallNoise(vPx * 0.61 + 37.0);
  // a little low-frequency height noise: domes are not gel, films not flat
  float bump = 1.0 + 0.08 * n2.b * smoothstep(1.5, 6.0, Hg / max(hfac, 0.2));
  Hg *= bump;

  float cs = smoothstep(0.25, 1.0, D);        // colour shift (dried)
  float gloss = 1.0 - smoothstep(0.0, 0.5, D); // gloss goes first
  vec2 gH = 0.5 / hb * vec2(Hx1 - Hx0, Hy1 - Hy0) * bump * (uK * uFs) * (1.0 - 0.45 * cs);
  vec3 nrm = normalize(vec3(-gH, 1.0));

  vec3 bgL = pow(uBg, vec3(2.2));
  float tau = Hg * OPT_PER_PX * optm * (1.0 + 0.22 * cs);
  // (fine mottling kept low: at 0.10 the pools' interiors read speckled)
  tau *= 1.0 + (0.06 * s.n.g + 0.16 * cs * s.n.b) * clamp(tau, 0.0, 1.0);
  float sdp = max(sdO, 0.0);
  float rim = exp(-sdp / 1.1) * a;
  float ring = exp(-pow((sdp - 1.6) / 1.1, 2.0)) * a;
  tau += 0.14 * rim + 0.22 * cs * ring;
  tau = max(tau, (0.34 + 0.4 * cs) * min(a * 2.0, 1.0)); // saturation floor: never pink
  vec3 sig = mix(SIGMA, SIGMA_DRY, cs);
  vec3 T = exp(-sig * tau);
  vec3 ins = mix(SCATTER, SCATTER_DRY, cs) * (1.0 - exp(-1.2 * tau));
  float core = smoothstep(1.2, 2.6, tau) * (1.0 - 0.18 * cs * clamp(0.5 + 0.5 * s.n.b, 0.0, 1.0));
  vec3 body = bgL * T + ins;
  body = body * (1.0 - core) + (mix(CORE, CORE_DRY, cs) + bgL * T * 0.3) * core;
  float lum = dot(bgL, vec3(0.3, 0.6, 0.1));
  float glow = clamp(nrm.x * 0.62 + nrm.y * 0.78, 0.0, 1.0) * smoothstep(0.3, 2.5, Hg) * (1.0 - exp(-tau)) * lum;
  body += glow * (1.0 - cs) * GLOW;

  // specular: softbox crescent (per-stain rotation) + pin glint (per-stain gain)
  float c = cos(rot);
  float sn = sin(rot);
  vec3 nr = vec3(nrm.x * c - nrm.y * sn, nrm.x * sn + nrm.y * c, nrm.z);
  float rx = 2.0 * nr.z * nr.x;
  float ry = 2.0 * nr.z * nr.y;
  float fres = 0.04 + 0.96 * pow(1.0 - nr.z, 5.0);
  float env = envReflection(rx, ry, 0.75 * smoothstep(1.5, 4.5, Hg));
  vec3 lpin = normalize(vec3(-0.42, -0.55, 1.0));
  vec3 hpin = normalize(lpin + vec3(0.0, 0.0, 1.0));
  float ndh = clamp(dot(nr, hpin), 0.0, 1.0);
  float pin = (pow(ndh, 900.0) * 4.0 + pow(ndh, 120.0) * 0.12) * glp;
  float spec = (fres * env * 0.85 + pin) * a * smoothstep(0.05, 0.6, Hg) * gloss;

  // AA edge: part area blend, part thinner film (fringes stay red, never grey)
  vec3 area = bgL * (1.0 - a) + body * a;
  vec3 film = bgL * exp(-sig * tau * a) + ins * a;
  float edge = 0.6 * (1.0 - smoothstep(0.75, 1.0, a));
  vec3 outL = mix(area, film, edge) + spec;
  vec3 v = pow(clamp(outL, 0.0, 1.0), vec3(1.0 / 2.2));
  o = premultOver(v, uBg);
}`;

// --------------------------------------------------------------- flyers ----
export const FLYER_VS = /* glsl */ `
precision highp float;
in vec3 position;
in vec4 iAB; // streak start, end (the drop now), css px
in vec4 iP;  // radius (css px), exposed fraction, shutter offset, ink
in vec4 iR;  // ramp A, B, P, behind-the-head weight
uniform vec2 uStage;
out vec2 vP;
flat out vec4 vAB;
flat out vec4 vPP;
flat out vec4 vRR;
${toClip}
void main() {
  vec2 a = iAB.xy;
  vec2 b = iAB.zw;
  vec2 d = b - a;
  float L = length(d);
  vec2 u = L > 1e-3 ? d / L : vec2(1.0, 0.0);
  vec2 nrm = vec2(-u.y, u.x);
  float R = iP.x + 1.5;
  vec2 p = 0.5 * (a + b) + u * position.x * (0.5 * L + R) + nrm * position.y * R;
  vP = p;
  vAB = iAB;
  vPP = iP;
  vRR = iR;
  gl_Position = toClip(p, uStage);
}`;

export const FLYER_FS = /* glsl */ `
precision highp float;
in vec2 vP;
flat in vec4 vAB;
flat in vec4 vPP;
flat in vec4 vRR;
uniform float uK;
uniform vec3 uBg;
uniform float uLayer; // 0 behind the head, 1 in front
out vec4 o;
${premultChunk}
const vec3 SIGMA_F = vec3(2.3, 14.5, 16.5);
const vec3 SCAT_F = vec3(0.05, 0.0022, 0.0028);
// integral of the shutter efficiency w = A + B tau^P over a part of the streak
float wint(float s1, float s2, float ta, float dlt) {
  float A = vRR.x, B = vRR.y, P = vRR.z;
  if (dlt < 1e-6) return (s2 - s1) * (A + B * pow(ta, P));
  return A * (s2 - s1) + B / ((P + 1.0) * dlt) * (pow(ta + s2 * dlt, P + 1.0) - pow(ta + s1 * dlt, P + 1.0));
}
void main() {
  vec2 a = vAB.xy;
  vec2 d = vAB.zw - a;
  float L = length(d);
  float rv = vPP.x;
  float fracT = vPP.y;
  float ta = vPP.z;
  float fw;
  float wv;
  if (L < 1e-3) {
    float dd2 = dot(vP - a, vP - a);
    wv = sqrt(max(rv * rv - dd2, 0.0));
    fw = dd2 < rv * rv ? wint(0.0, 1.0, ta, fracT) : 0.0;
  } else {
    vec2 u = d / L;
    float sp = dot(vP - a, u);
    float dp = dot(vP - a, vec2(-u.y, u.x));
    wv = sqrt(max(rv * rv - dp * dp, 0.0));
    float lo = clamp(sp - wv, 0.0, L);
    float hi = clamp(sp + wv, 0.0, L);
    fw = max(wint(lo / L, hi / L, ta, fracT), 0.0);
  }
  float w = uLayer < 0.5 ? vRR.w : 1.0 - vRR.w;
  float tau = fw * fracT * 2.0 * (wv / uK) * 0.26 * vPP.w * w;
  if (tau < 1e-4) discard;
  vec3 bgL = pow(uBg, vec3(2.2));
  vec3 v = bgL * exp(-SIGMA_F * tau) + SCAT_F * (1.0 - exp(-1.3 * tau));
  o = premultOver(pow(v, vec3(1.0 / 2.2)), uBg);
}`;

// ---------------------------------------------------------------- noise ----
/**
 * Tileable wall noise, rendered once into a 256² RGBA8 texture. Each channel
 * is a gaussian random field (what the offline got from blurring white
 * noise): a sum of random-phase waves whose frequencies follow a gaussian
 * spectrum, snapped to the tile's lattice so it wraps. Isotropic and smooth —
 * value noise showed its grid as a checker inside the pools.
 */
export const NOISE_FS = /* glsl */ `
precision highp float;
in vec2 vPx;
uniform vec2 uStage;
out vec4 o;
const float TAU = 6.2831853;
float hash(float i, float k) {
  vec3 q = fract(vec3(i * 0.1031, k * 0.1030, (i + k) * 0.0973) + 0.1337);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
// gaussian random field with correlation sigma (texels along / across a
// rotated axis), unit variance, periodic over 256 texels
float field(vec2 x, vec2 sigma, float rot, float seed) {
  float acc = 0.0;
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float r = sqrt(-2.0 * log(max(hash(fi, seed), 1e-4)));
    float a = TAU * hash(fi, seed + 17.0);
    vec2 k = r * vec2(cos(a) / sigma.x, sin(a) / sigma.y);
    k = vec2(k.x * cos(rot) - k.y * sin(rot), k.x * sin(rot) + k.y * cos(rot));
    vec2 m = floor(k * 256.0 / TAU + 0.5);
    acc += cos(dot(m, x) * TAU / 256.0 + TAU * hash(fi, seed + 31.0));
  }
  return acc * 0.2236; // sqrt(2 / 40)
}
void main() {
  vec2 x = vPx;
  // the offline's mixes of gaussian-filtered noises (sigma in px)
  float edge = (0.45 * field(x, vec2(1.2), 0.0, 1.0) + 0.4 * field(x, vec2(3.0), 0.0, 2.0) + 0.3 * field(x, vec2(8.0), 0.0, 3.0)) / 0.7;
  float micro = (0.5 * field(x, vec2(1.3), 0.0, 4.0) + 0.4 * field(x, vec2(3.5), 0.0, 5.0) + 0.25 * field(x, vec2(9.0), 0.0, 6.0)) / 0.69;
  float tone = (0.3 * field(x, vec2(2.5), 0.0, 7.0) + 0.45 * field(x, vec2(6.0), 0.0, 8.0) + 0.4 * field(x, vec2(14.0), 0.0, 9.0)) / 0.67;
  // drying front: streaky, ~25° off horizontal, plus a round part
  float aniso = (0.8 * field(x, vec2(10.0, 3.5), 0.436, 10.0) + 0.45 * field(x, vec2(5.0), 0.0, 11.0)) / 0.92;
  o = clamp(0.5 + 0.18 * vec4(edge, micro, tone, aniso), 0.0, 1.0);
}`;
