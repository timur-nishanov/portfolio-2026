#!/usr/bin/env python3
"""
The reel's sound: an original track written to the edit, and the site's own
sounds where the picture makes them, the head's knocks (its samples) and the
outro's glass (its synthesis), struck by the impacts the plates log
(scripts/reel/rec.mjs <shot> <out.json>).

  python scripts/reel2/sound.py <hero.json> <outro.json> <out.wav>

Needs numpy, scipy, pedalboard, pyloudnorm and soundfile (pip), and ffmpeg.

The track is 88.9 bpm: a bar (2.7 s) is a station, and the camera sets off
on each downbeat (comp.html's TRACK). It holds back while the head is
thrown, so the knocks are heard; the beat builds as the page pulls back and
comes in as the camera sets off; it drops out for the last screen, where the
glass rings on the chord's notes; the last chord comes home with the
address.
"""
import json
import subprocess
import sys

import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
DUR = 29.6
N = int(DUR * SR)
rng = np.random.default_rng(11)

# --- the grid (comp.html) ---------------------------------------------------
BEAT = 0.675  # 88.9 bpm
BAR = 4 * BEAT
DROP = 9.8  # the camera sets off: bar 0
S16 = BEAT / 4
HERO_LAG = 1.6  # reel time of the hero plate's frame 0
OUTRO_AT = 23.3 - 0.8  # reel time of the outro plate's frame 0
MOVES = [9.8, 12.5, 15.2, 17.9, 20.6, 23.3]  # the camera's moves, 1.1 s each
URL_IN = 27.35


def at(bar, beat=0.0):
    return DROP + bar * BAR + beat * BEAT


def idx(t):
    return int(round(t * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 10 ** (x / 20)


# --- buses ----------------------------------------------------------------------
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t, pan=0.0, gain=1.0):
        """Mono (n,) or stereo (2, n) at time t; mono is panned equal-power."""
        i = idx(t)
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        lo, hi = max(i, 0), min(i + sig.shape[1], N)
        if hi > lo:
            self.x[:, lo:hi] += gain * sig[:, lo - i:hi - i]


def sos_filter(x, kind, f, order=2):
    sos = signal.butter(order, f, btype=kind, fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def peak_eq(x, f, gain_db, q=1.0):
    """A bell (RBJ): gain_db at f, q wide."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=-1)


def sweep_filter(x, kind, f_of_t, t0=0.0, chunk=256, order=2):
    """A filter whose corner follows f_of_t (reel time), a chunk at a time."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, x.shape[-1], chunk):
        f = f_of_t(t0 + (s + chunk / 2) / SR)
        sos = signal.butter(order, f, btype=kind, fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) if x.ndim == 1 else (sos.shape[0], x.shape[0], 2))
        if x.ndim == 1:
            y[s:s + chunk], zi = signal.sosfilt(sos, x[s:s + chunk], zi=zi)
        else:
            out, zi = signal.sosfilt(sos, x[:, s:s + chunk], axis=-1, zi=zi)
            y[:, s:s + chunk] = out
    return y


def reverb(x, room=0.75, damping=0.5, width=1.0):
    board = pb.Pedalboard([pb.Reverb(room_size=room, damping=damping, wet_level=1.0, dry_level=0.0, width=width)])
    return board(x.astype(np.float32), SR).astype(np.float64)


def pingpong(x, delay, feedback=0.42, taps=7, lowpass=3500):
    """A delay that bounces left and right, each echo duller than the last."""
    y = np.zeros_like(x)
    mono = x.mean(axis=0)
    d = idx(delay)
    echo = mono.copy()
    for k in range(1, taps + 1):
        echo = sos_filter(echo, 'low', lowpass, 1)
        side = (k % 2) * 2 - 1  # right, left, right...
        a = (side * 0.8 + 1) * np.pi / 4
        g = feedback ** k
        y[0, k * d:] += g * np.cos(a) * echo[: N - k * d] * np.sqrt(2)
        y[1, k * d:] += g * np.sin(a) * echo[: N - k * d] * np.sqrt(2)
    return y


# --- instruments ---------------------------------------------------------------
def kick(vel=1.0):
    n = idx(0.55)
    t = np.arange(n) / SR
    f = 47 + 95 * np.exp(-t / 0.04) + 160 * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.24) * (1 - np.exp(-t / 0.001))
    body += 0.35 * np.sin(2 * np.pi * 105 * t) * np.exp(-t / 0.045)  # the punch
    click = sos_filter(rng.standard_normal(n), 'band', [1800, 6000]) * np.exp(-t / 0.003) * 0.25
    x = np.tanh(1.6 * (body + click)) / np.tanh(1.6)
    return vel * x


def clap(vel=1.0):
    n = idx(0.7)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    env = sum(np.where(t >= o, np.exp(-(t - o) / 0.007), 0) * g for o, g in [(0, 0.8), (0.009, 0.9), (0.019, 1.0)])
    env = env + np.where(t >= 0.019, np.exp(-(t - 0.019) / 0.11), 0) * 0.55
    x = sos_filter(noise * env, 'band', [850, 5200])
    x += sos_filter(noise * np.exp(-t / 0.05), 'high', 6000) * 0.12
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) * 0.35
    return vel * (x + body) / 2.2


def hat(vel=1.0, open_=False):
    n = idx(0.45 if open_ else 0.09)
    t = np.arange(n) / SR
    x = sos_filter(sos_filter(rng.standard_normal(n), 'high', 7200, 3), 'low', 12000, 2)
    x = x * np.exp(-t / (0.16 if open_ else 0.022)) * (1 - np.exp(-t / 0.0004))
    return vel * x * 0.42


def rim(vel=1.0):
    n = idx(0.12)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1650 * t) * np.exp(-t / 0.018) + 0.6 * np.sin(2 * np.pi * 520 * t) * np.exp(-t / 0.025)
    x += sos_filter(rng.standard_normal(n), 'high', 3000) * np.exp(-t / 0.004) * 0.6
    return vel * x * 0.45


def saw(f, n, ph0):
    """A band-limited saw (PolyBLEP)."""
    dt = f / SR
    ph = (ph0 + dt * np.arange(n)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt
    y[m] -= x * x + x + x + 1.0
    return y


def pad_note(m, dur, attack=0.5, release=1.6, cutoff=6000):
    """Five detuned saws, spread across the stereo field, soft and dark."""
    n = idx(dur + release)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for k, c in enumerate([-13, -6, 0, 6, 13]):
        v = saw(mtof(m + c / 100), n, rng.random())
        a = (np.sign(c) * 0.7 + 1) * np.pi / 4
        out[0] += v * np.cos(a)
        out[1] += v * np.sin(a)
    env = np.minimum(1, t / attack)
    env = np.where(t > dur, env * np.exp(-(t - dur) / (release / 4)), env)
    out = sos_filter(out, 'low', cutoff, 2) * env / 5
    return out


def pluck(m, vel=1.0, decay=0.32):
    """A round, glassy pluck: a few harmonics dying fast, the upper ones first."""
    n = idx(decay * 5)
    t = np.arange(n) / SR
    f = mtof(m)
    x = np.zeros(n)
    for h, g, d in [(1, 1.0, 1.0), (2, 0.42, 0.55), (3, 0.2, 0.35), (4, 0.12, 0.25), (6, 0.05, 0.15)]:
        if f * h < SR / 2.2:
            x += g * np.sin(2 * np.pi * f * h * t + rng.random()) * np.exp(-t / (decay * d))
    x *= 1 - np.exp(-t / 0.0015)
    return vel * x * 0.5


def sub(m, dur, vel=1.0):
    """The sub, and over it a soft saw an octave up, filtered: what tells the
    bass line on a phone's speaker, which plays nothing under ~150 Hz."""
    n = idx(dur + 0.12)
    t = np.arange(n) / SR
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * 2 * f * t) + 0.06 * np.sin(2 * np.pi * 3 * f * t)
    env = np.minimum(1, t / 0.012) * np.where(t > dur, np.exp(-(t - dur) / 0.03), 1)
    x = np.tanh(1.3 * x * env) / np.tanh(1.3)
    mid = sos_filter(saw(2 * f, n, 0.0) + saw(2 * f * 1.004, n, 0.5), 'low', 420, 2) * env * 0.6
    return vel * (x + mid)


def noise_swell(dur, f_of_u, shape, q=1.2, kind='band'):
    """Filtered noise whose band follows f_of_u(u) and level shape(u), u 0 → 1."""
    n = idx(dur)

    def corner(tt):
        f = f_of_u(min(tt / dur, 1.0))
        return [f / (1 + 0.5 / q), min(f * (1 + 0.5 / q), SR / 2.1)] if kind == 'band' else f

    y = sweep_filter(rng.standard_normal(n), kind, corner)
    return y * shape(np.arange(n) / n)


# --- the music ----------------------------------------------------------------
# Chords in A-flat: [bass, pad notes].
# E-flat, the fifth of the key, is left out where it isn't the root or the
# fifth: held through every chord it stood as one whistle over the track.
CH = {
    'Abmaj9': (32, [56, 60, 63, 67, 70]),
    'Fm9': (29, [53, 56, 60, 65, 67]),
    'Dbmaj9': (37, [49, 53, 56, 60, 65]),
    'Eb69': (39, [55, 58, 60, 63, 65]),
    'Ebsus': (39, [56, 58, 61, 63, 65]),
    'Cm7': (36, [55, 58, 60, 62, 67]),
}
# (start, end, chord): bars from the first, a pickup into it, to the end.
CHORDS = [
    (0.0, at(-3), 'Abmaj9'),
    (at(-3), at(-2), 'Abmaj9'),
    (at(-2), at(-1), 'Fm9'),
    (at(-1), at(-1, 2), 'Dbmaj9'),
    (at(-1, 2), at(0), 'Ebsus'),
    (at(0), at(1), 'Abmaj9'),  # Kritika
    (at(1), at(2), 'Fm9'),  # Urbantiger
    (at(2), at(3), 'Dbmaj9'),  # Chums, Alice
    (at(3), at(4), 'Eb69'),  # Lendly, Yandex Cloud
    (at(4), at(4, 2), 'Fm9'),  # the diplomas
    (at(4, 2), at(5), 'Cm7'),
    (at(5), at(6), 'Dbmaj9'),  # the last screen, the glass
    (at(6), URL_IN, 'Ebsus'),
    (URL_IN, DUR, 'Abmaj9'),  # the address
]


def chord_at(t):
    for a, b, c in CHORDS:
        if a <= t < b:
            return c
    return CHORDS[-1][2]


def build(hero, outro):
    drums, bass, pads, plucks, fx, head, glass = (Bus() for _ in range(7))
    kicks = []

    # Pads: every chord, overlapping into the next (one chord held on is one).
    held = []
    for a, b, c in CHORDS:
        if held and held[-1][2] == c:
            held[-1] = (held[-1][0], b, c)
        else:
            held.append((a, b, c))
    for a, b, c in held:
        for m in CH[c][1]:
            pads.add(pad_note(m, b - a + 0.05, attack=0.9 if a == 0 else 0.25, release=1.4), a, gain=0.55)
        # The root an octave under the chord, for warmth.
        pads.add(pad_note(CH[c][0] + 24, b - a + 0.05, attack=0.9 if a == 0 else 0.25, release=1.4), a, gain=0.3)
    # A slow swell in at the start, brighter as the beat comes, darker for
    # the last screen.
    pads.x = sweep_filter(pads.x, 'low', lambda t: float(np.interp(t, [0, 3, 7.1, 9.8, 23.3, 26, 27.35, 29.6], [500, 1200, 1400, 3000, 3000, 1600, 2600, 1400])))
    pads.x *= np.interp(np.arange(N) / SR, [0, 1.2, 29.0, DUR], [0, 1, 1, 0])

    # Drums.
    def groove(bar, light=False):
        b0 = at(bar)
        for beat in (0, 2.5):
            kicks.append(b0 + beat * BEAT)
            drums.add(kick(0.95 if beat == 0 else 0.8), b0 + beat * BEAT, gain=0.9)
        if bar % 2 == 1:
            kicks.append(b0 + 3.75 * BEAT)
            drums.add(kick(0.55), b0 + 3.75 * BEAT, gain=0.9)
        drums.add(clap(1.0), b0 + 2 * BEAT, pan=0.0, gain=0.8)
        for s in range(16):
            swing = 0.018 if s % 2 else 0.0
            v = (0.55 if s % 4 == 0 else 0.42 if s % 2 == 0 else 0.3) * (0.9 + 0.2 * rng.random())
            if s == 14:
                drums.add(hat(0.5, True), b0 + s * S16 + swing, pan=0.25, gain=0.5)
            else:
                drums.add(hat(v), b0 + s * S16 + swing, pan=0.2 if s % 2 else -0.15, gain=0.5)
        for s in (7, 13):
            drums.add(rim(0.6 + 0.3 * rng.random()), b0 + s * S16 + 0.018, pan=-0.35, gain=0.5)

    # The pickup to the drop: hats alone after the head has had its say,
    # then the full beat, muffled, opening up through the bar.
    for s in range(4, 16):
        drums.add(hat(0.18 + 0.025 * s), at(-2) + s * S16 + (0.018 if s % 2 else 0), pan=0.15, gain=0.5)
    build_bus = Bus()
    saved, drums.x = drums.x, build_bus.x
    groove(-1)
    for s in range(12, 16):  # a roll into the drop
        drums.add(clap(0.35 + 0.15 * (s - 12)), at(-1) + s * S16, gain=0.55)
    build_drums = sweep_filter(drums.x, 'low', lambda t: float(np.interp(t, [at(-1), at(0) - 0.05], [350, 9000])))
    drums.x = saved + build_drums
    for bar in range(0, 5):
        groove(bar)
    # The address: one last kick under the chord.
    kicks.append(URL_IN)
    drums.add(kick(0.65), URL_IN, gain=0.9)

    # Bass: the root of each chord from the drop on, with the kicks; a soft
    # one under the intro.
    for a, b, c in CHORDS:
        root = CH[c][0]
        if a < at(-3):
            continue  # no bass under the words
        if a < at(-1):
            bass.add(sub(root + 12, b - a, 0.25), a, gain=0.6)
        else:
            bass.add(sub(root, b - a - 0.02, 0.8), a, gain=0.75)

    # The pluck: two notes for the two words, then an arpeggio over the
    # chords while the camera travels.
    plucks.add(pluck(75, 0.44), 0.18, pan=-0.2)  # Hey!
    plucks.add(pluck(80, 0.48), 0.35, pan=0.2)  # I'm Timur
    steps = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
    order = [0, 2, 4, 3, 1, 3, 2, 4, 0, 3, 4, 2, 1, 2, 4, 3]
    for bar in range(0, 5):
        for s in range(16):
            if not steps[s]:
                continue
            t = at(bar) + s * S16 + (0.018 if s % 2 else 0)
            notes = sorted(n + 12 for n in CH[chord_at(t)][1])
            m = notes[order[s] % len(notes)]
            plucks.add(pluck(m, 0.33 + 0.12 * (s % 4 == 0)), t, pan=0.0)
    # The address: the chord, struck from the bottom up.
    for k, m in enumerate([68, 72, 75, 79, 82]):
        plucks.add(pluck(m, 0.36, decay=0.6), URL_IN + k * 0.035, pan=-0.3 + 0.15 * k)

    # Sidechain: the pads and the bass give way to each kick.
    tt = np.arange(N) / SR
    duck = np.ones(N)
    for k in kicks:
        d = tt - k
        m = (d >= -0.004) & (d < 0.6)
        shape = np.where(d[m] < 0, (d[m] + 0.004) / 0.004, np.exp(-d[m] / 0.13))
        duck[m] = np.minimum(duck[m], 1 - 0.62 * shape)
    pads.x *= duck
    bass.x *= 0.35 + 0.65 * duck
    bass.x *= np.interp(np.arange(N) / SR, [at(-3), at(-3) + 1.6], [0, 1])

    # --- the sounds of the picture ---------------------------------------------
    # The title's words fly up into the header.
    fx.add(noise_swell(1.2, lambda u: 2600 - 1700 * u, lambda u: np.sin(np.pi * u) ** 2), 1.42, pan=0.0, gain=0.09)
    # The flick that throws the head.
    fx.add(noise_swell(0.32, lambda u: 700 + 2600 * u, lambda u: np.sin(np.pi * u) ** 1.5, q=1.5), 3.3, pan=0.15, gain=0.16)
    # The page pulls back into the room.
    fx.add(noise_swell(1.9, lambda u: 380 + 500 * np.sin(np.pi * u), lambda u: np.sin(np.pi * u) ** 2, kind='low'), 5.2, gain=0.1)
    # The build: a riser into the drop, then the drop itself.
    fx.add(noise_swell(at(0) - at(-1, 1), lambda u: 400 + 7000 * u ** 2, lambda u: u ** 2.2, q=0.9), at(-1, 1), gain=0.14)
    n = idx(1.6)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t / 0.12)) / SR) * np.exp(-t / 0.55) * (1 - np.exp(-t / 0.002))
    fx.add(boom, at(0), gain=0.55)
    fx.add(sos_filter(rng.standard_normal(n), 'low', 900) * np.exp(-t / 0.28), at(0), gain=0.1)
    # Each move of the camera: air going by, right to left.
    for m0 in MOVES:
        w = noise_swell(1.1, lambda u: 500 + 1900 * np.sin(np.pi * u) ** 2, lambda u: (16 * u * u * (1 - u) * (1 - u)) ** 1.4, q=0.8)
        a = (np.linspace(0.55, -0.55, len(w)) + 1) * np.pi / 4
        fx.add(np.vstack([w * np.cos(a), w * np.sin(a)]) * np.sqrt(2), m0, gain=0.085)
    # The diplomas landing, one, two, three.
    for k, (x, t0) in enumerate([(-0.3, 21.1), (0.0, 21.55), (0.3, 22.0)]):
        land = t0 + 0.474
        n = idx(0.4)
        t = np.arange(n) / SR
        slap = sos_filter(rng.standard_normal(n), 'band', [700, 4000]) * np.exp(-t / 0.035)
        thud = np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.09)
        fx.add(slap * 0.5 + thud * 0.6, land, pan=x, gain=0.22)

    # The head's knocks: the site's own takes (impactSound.ts), planned as it
    # plans them, without the crunch (it doesn't bleed here) and with one
    # "khm", after the second knock.
    takes = {name: load_take(name) for name in ['thump-1', 'thump-2', 'thump-3', 'thump-4', 'thump-5', 'khm-4']}
    trims = {'thump-1': 0.3, 'thump-2': -0.4, 'thump-3': 0.4, 'thump-4': -0.5, 'thump-5': 0.3, 'khm-4': 0.5}
    order = ['thump-1', 'thump-3', 'thump-2', 'thump-4', 'thump-5']
    for k, e in enumerate(hero):
        t0 = (e['f'] + round(HERO_LAG * 60)) / 60
        tt_ = min(max((e['impact'] - 0.22) / 2.4, 0), 1)
        knock = -28 + 14 * np.sqrt(tt_)
        name = order[k % len(order)]
        head.add(take(takes[name], 0.93 + 0.1 * tt_), t0, pan=e['pan'], gain=db(knock + 1 + trims[name]))
        if k == 1:
            head.add(take(takes['khm-4'], 1.0, voice=True), t0 + 0.1, pan=e['pan'] * 0.6, gain=db(knock - 2.5 + 1 + trims['khm-4']))

    # The glass: the site's synthesis (chime.ts), one ring per 110 ms, on the
    # notes of the chord the music is on (D-flat major 9).
    notes = np.array([mtof(m) for m in (85, 87, 89, 92, 96)])  # Db6 Eb6 F6 Ab6 C7
    last = -1.0
    for e in outro:
        t0 = (e['f'] + round(OUTRO_AT * 60)) / 60
        if e['impact'] < 0.18 or t0 - last < 0.11 or t0 > 27.0:
            continue
        last = t0
        base = (1500 + rng.random() * 500 + min(e['impact'], 2) * 260) * e['pitch']
        f0 = notes[np.argmin(np.abs(np.log(notes / base)))]
        level = min(0.05, 0.012 + e['impact'] * 0.016) * e['level']
        n = idx(0.9)
        t = np.arange(n) / SR
        ring = np.zeros(n)
        for i, ratio in enumerate([1, 2.32, 4.25]):
            peak = level / (1 + i * 1.6)
            decay = 0.14 / (1 + i * 0.8) * 1.8  # a touch longer than the site's, to ring
            ring += peak * np.sin(2 * np.pi * f0 * ratio * (1 + (rng.random() - 0.5) * 0.02) * t) * (0.0001 / peak) ** (t / decay)
        fade = np.interp(t0, [26.5, 27.0], [1, 0])
        glass.add(ring * fade, t0, pan=e['pan'], gain=1.0)

    return dict(drums=drums, bass=bass, pads=pads, plucks=plucks, fx=fx, head=head, glass=glass)


def load_take(name):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'public/sounds/{name}.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def take(x, rate, voice=False):
    """From where the take really starts (impactSound.ts startOffset), at a
    playback rate (pitch and length together, as tape)."""
    peak = np.abs(x).max()
    i = np.argmax(np.abs(x) >= peak * (0.02 if voice else 0.1))
    i = max(0, i - idx(0.001 if voice else 0.002))
    x = x[i:]
    n = int(len(x) / rate)
    y = np.interp(np.arange(n) * rate, np.arange(len(x)), x)
    y[: idx(0.002)] *= np.linspace(0, 1, idx(0.002))
    return y


def limit(x, ceiling, look=0.004, release=0.06):
    """A look-ahead peak limiter: the gain comes down ahead of each peak just
    far enough, and back up smoothly (no make-up gain)."""
    peak = np.abs(x).max(axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    L = idx(look)
    g = uniform_filter1d(minimum_filter1d(need, size=2 * L + 1), size=L)
    # Release: never faster than `release` back up.
    a = np.exp(-1 / (release * SR))
    out = g.copy()
    for i in range(1, len(out)):
        r = out[i - 1] + (1 - a) * (1 - out[i - 1])
        if g[i] < r:
            r = g[i]
        out[i] = r
    return x * out


def master(b):
    # Sends: reverb on the clap, the pluck, the pads, the glass, a little on
    # the knocks; the ping-pong on the pluck.
    rv_in = b['plucks'].x * 0.45 + b['pads'].x * 0.18 + b['glass'].x * 0.9 + b['head'].x * 0.15 + b['fx'].x * 0.15
    rv_in += sos_filter(b['drums'].x, 'band', [900, 6000]) * 0.12  # the clap's band
    rv = reverb(rv_in, room=0.82, damping=0.55)
    dly = pingpong(b['plucks'].x, BEAT * 0.75, feedback=0.4, taps=7, lowpass=3200)
    dly_rv = reverb(dly, room=0.6) * 0.3
    # The levels, set by each part's loudness where it plays (main prints
    # them): the knocks as loud as the music under them, the glass leading
    # the last screen, the bass half as loud there, so the end is airy.
    stems = {
        'drums': sos_filter(b['drums'].x, 'high', 28) * db(-2),
        'bass': sos_filter(b['bass'].x, 'low', 650) * db(-8) * np.interp(np.arange(N) / SR, [at(5) - 0.3, at(5), URL_IN - 0.4, URL_IN], [1, 0.5, 0.5, 1]),
        'pads': peak_eq(sos_filter(b['pads'].x, 'high', 110), 600, -2.5, 0.9) * db(-7),
        'plucks': sos_filter(b['plucks'].x, 'high', 220) * db(-3.5),
        'delay': sos_filter(dly + dly_rv, 'high', 300) * db(-8),
        'reverb': sos_filter(rv, 'high', 200) * db(-10),
        'fx': b['fx'].x * db(2),
        'head': b['head'].x * db(18),
        'glass': b['glass'].x * db(24),
    }
    mix = sum(stems.values())
    bus = pb.Pedalboard([
        pb.HighpassFilter(cutoff_frequency_hz=24),
        pb.Compressor(threshold_db=-18, ratio=2.0, attack_ms=20, release_ms=180),
    ])
    mix = bus(mix.astype(np.float32), SR).astype(np.float64)
    # Loudness for social video: -14 LUFS, peaks under -1 dBTP.
    meter = pyln.Meter(SR)
    for _ in range(2):
        mix *= db(-14 - meter.integrated_loudness(mix.T))
        mix = limit(mix, db(-1.5))
    # In over the first hundredth of a second, out over the last half.
    mix *= np.interp(np.arange(N) / SR, [0, 0.01, DUR - 0.5, DUR], [0, 1, 1, 0])
    tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=-1)).max())
    if tp > -1.0:
        mix *= db(-1.0 - tp)
    return mix, stems, meter


def main():
    hero = json.load(open(sys.argv[1]))
    outro = json.load(open(sys.argv[2]))
    out = sys.argv[3]
    buses = build(hero, outro)
    mix, stems, meter = master(buses)
    # Each part's loudness where it plays, against the whole mix's there (LU).
    sections = [('title', 0.0, 3.3), ('knocks', 3.8, 5.2), ('build', 7.1, 9.8), ('groove', 9.8, 23.3), ('glass', 24.8, 26.9), ('end', 27.35, 29.0)]
    whole = sum(stems.values())
    print('            ' + ''.join(f'{n:>9s}' for n, _, _ in sections))
    for name, x in list(stems.items()) + [('MIX', whole)]:
        row = []
        for _, a, b in sections:
            seg = x[:, idx(a):idx(b)].T
            ref = whole[:, idx(a):idx(b)].T
            l = meter.integrated_loudness(seg)
            r = meter.integrated_loudness(ref)
            row.append(f'{(l if name == "MIX" else l - r):9.1f}' if np.isfinite(l) else '        -')
        print(f'{name:12s}' + ''.join(row))
    tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=-1)).max())
    print(f'master: {meter.integrated_loudness(mix.T):.1f} LUFS, true peak {tp:.1f} dBTP')
    sf.write(out, mix.T.astype(np.float32), SR, subtype='FLOAT')


if __name__ == '__main__':
    main()
