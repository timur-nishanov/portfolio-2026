#!/usr/bin/env python3
"""
The reel's sound: a light, original track written to the edit, and the
site's own sounds where the picture makes them, the head's knocks (its
samples) and the outro's glass (its synthesis), struck by the impacts the
plates log (scripts/reel/rec.mjs <shot> <out.json>).

  python scripts/reel2/sound.py <hero.json> <outro.json> <out.wav>

Needs numpy, scipy, pedalboard, pyloudnorm and soundfile (pip), and ffmpeg.

The track is 88.9 bpm: a bar (2.7 s) is a station, and the camera sets off
on each downbeat (comp.html's TRACK). Light and dry, with air between the
notes: a soft kick, finger snaps, a shaker, a round bass pluck, a line of
glass (as the site's balls are) and a few electric-piano stabs, under the picture's own sounds. It
waits while the head is thrown, comes in as the page pulls back, plays the
line while the camera travels, drops out for the last screen, where the
glass rings on the chord's notes, and ends on the chord with the address.
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
SWING = 0.03  # s the off-beat sixteenths come late
HERO_LAG = 1.6  # reel time of the hero plate's frame 0
OUTRO_AT = 23.3 - 0.8  # reel time of the outro plate's frame 0
MOVES = [9.8, 12.5, 15.2, 17.9, 20.6, 23.3]  # the camera's moves, 1.1 s each
URL_IN = 27.35
LOUDNESS = -16  # LUFS: under the picture, not over it


def at(bar, step=0.0):
    """Bar (0 = the camera sets off) and sixteenth, swung, in reel time."""
    swing = SWING if int(step) % 2 else 0.0
    return DROP + bar * BAR + step * S16 + swing


def idx(t):
    return int(round(t * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 10 ** (x / 20)


# --- buses and effects --------------------------------------------------------
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


def sweep_filter(x, kind, f_of_t, chunk=256, order=2):
    """A filter whose corner follows f_of_t (seconds into x), a chunk at a time."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, x.shape[-1], chunk):
        sos = signal.butter(order, f_of_t((s + chunk / 2) / SR), btype=kind, fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[s:s + chunk], zi = signal.sosfilt(sos, x[s:s + chunk], zi=zi)
    return y


def reverb(x, room=0.6, damping=0.5, width=1.0):
    board = pb.Pedalboard([pb.Reverb(room_size=room, damping=damping, wet_level=1.0, dry_level=0.0, width=width)])
    return board(x.astype(np.float32), SR).astype(np.float64)


def echo(x, delay, feedback=0.32, taps=4, lowpass=4500):
    """Echoes that step left and right, each duller than the last."""
    y = np.zeros_like(x)
    e = x.mean(axis=0)
    d = idx(delay)
    for k in range(1, taps + 1):
        e = sos_filter(e, 'low', lowpass, 1)
        a = ((1 if k % 2 else -1) * 0.6 + 1) * np.pi / 4
        g = feedback ** k
        y[0, k * d:] += g * np.cos(a) * e[: N - k * d] * np.sqrt(2)
        y[1, k * d:] += g * np.sin(a) * e[: N - k * d] * np.sqrt(2)
    return y


def noise_swell(dur, f_of_u, shape, q=1.2, kind='band'):
    """Filtered noise whose band follows f_of_u(u) and level shape(u), u 0 → 1."""
    n = idx(dur)

    def corner(tt):
        f = f_of_u(min(tt / dur, 1.0))
        return [f / (1 + 0.5 / q), min(f * (1 + 0.5 / q), SR / 2.1)] if kind == 'band' else f

    y = sweep_filter(rng.standard_normal(n), kind, corner)
    return y * shape(np.arange(n) / n)


# --- instruments: light, short, dry ---------------------------------------------
def env_t(dur):
    n = idx(dur)
    return n, np.arange(n) / SR


def kick(vel=1.0):
    """Soft and short: a round thump, little sub, no boom."""
    n, t = env_t(0.3)
    f = 55 + 75 * np.exp(-t / 0.022)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09) * (1 - np.exp(-t / 0.0015))
    x += sos_filter(rng.standard_normal(n), 'band', [2500, 7000]) * np.exp(-t / 0.002) * 0.06
    return vel * np.tanh(1.2 * x) / np.tanh(1.2)


def snap(vel=1.0):
    """A finger snap: two quick bursts of bright noise and a tiny knock."""
    n, t = env_t(0.22)
    noise = rng.standard_normal(n)
    env = np.exp(-t / 0.011) + 0.7 * np.where(t > 0.004, np.exp(-(t - 0.004) / 0.016), 0)
    x = sos_filter(noise * env, 'band', [1800, 9000], 2)
    x += np.sin(2 * np.pi * 1180 * t) * np.exp(-t / 0.008) * 0.35
    return vel * x * 0.55


def shaker(vel=1.0):
    """A soft 'shh': a short swell of high noise."""
    n, t = env_t(0.13)
    x = sos_filter(sos_filter(rng.standard_normal(n), 'high', 4200, 2), 'low', 14000, 2)
    return vel * x * (1 - np.exp(-t / 0.007)) * np.exp(-t / 0.035) * 0.5


def tick(vel=1.0):
    n, t = env_t(0.03)
    x = np.sin(2 * np.pi * 4200 * t) * np.exp(-t / 0.0025) + sos_filter(rng.standard_normal(n), 'high', 6000) * np.exp(-t / 0.0015) * 0.4
    return vel * x * 0.3


def pop(vel=1.0, f0=1300):
    """A mouth pop: a sine falling fast, gone in a few hundredths."""
    n, t = env_t(0.08)
    f = f0 * (0.35 + 0.65 * np.exp(-t / 0.012))
    return vel * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.022) * (1 - np.exp(-t / 0.0008)) * 0.5


def bass(m, vel=1.0, decay=0.26):
    """A round pluck, with the harmonics that let a phone's speaker tell it."""
    f = mtof(m)
    n, t = env_t(decay * 5)
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / (decay * 0.6))
    x += 0.18 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / (decay * 0.35))
    return vel * x * np.exp(-t / decay) * (1 - np.exp(-t / 0.004)) * 0.5


def glass_note(m, vel=1.0, decay=0.55):
    """A note of glass, like the outro's balls: a two-operator FM bell, a
    bright "ting" in its first hundredths warming into a pure note, and an
    octave over it, faint."""
    f = mtof(m)
    n, t = env_t(decay * 4)
    ph = 2 * np.pi * f * t
    warm = 0.9 * np.exp(-t / 0.08)
    ting = 1.6 * np.exp(-t / 0.018)
    x = np.sin(ph + warm * np.sin(ph) + ting * np.sin(7 * ph))
    x = x * np.exp(-t / decay) * (1 - np.exp(-t / 0.0008))
    x += 0.12 * np.sin(2 * ph) * np.exp(-t / (decay * 0.5))
    return vel * x * 0.42


def epiano(m, dur, vel=1.0):
    """A soft electric-piano note (two-operator FM): a bell at the start that
    warms into the note."""
    f = mtof(m)
    n, t = env_t(dur + 0.4)
    index = 1.4 * np.exp(-t / 0.1) + 0.2
    x = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * t))
    env = np.exp(-t / 0.7) * (1 - np.exp(-t / 0.002)) * np.where(t > dur, np.exp(-(t - dur) / 0.06), 1)
    return vel * x * env * 0.3


def air(notes, dur, attack=0.8, release=1.2):
    """A breath of a chord: sines, high and quiet, slowly in and out."""
    n, t = env_t(dur + release)
    x = np.zeros((2, n))
    for k, m in enumerate(notes):
        f = mtof(m)
        vib = 1 + 0.002 * np.sin(2 * np.pi * (4.5 + k * 0.3) * t)
        v = np.sin(2 * np.pi * f * np.cumsum(vib) / SR)
        a = ((k % 2) * 1.2 - 0.6 + 1) * np.pi / 4
        x[0] += v * np.cos(a)
        x[1] += v * np.sin(a)
    env = np.minimum(1, t / attack) * np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return x * env / len(notes)


# --- the music --------------------------------------------------------------------
# D major, a rootless voicing over each bass note: [bass, stab notes].
CH = {
    'D': (38, [66, 69, 73, 76]),  # Dmaj9
    'Bm': (35, [66, 69, 73, 74]),  # Bm9
    'G': (43, [66, 69, 71, 74]),  # Gmaj9
    'A': (45, [66, 71, 73, 76]),  # A6/9
    'Asus': (45, [64, 69, 71, 74]),
}
# The line: a call and its answer, two bars, in D major pentatonic.
CALL = [(0, 81, 1.0), (2, 78, 0.65), (4, 83, 0.9), (7, 81, 0.7), (10, 78, 0.7), (12, 76, 0.75)]
ANSWER = [(0, 74, 0.9), (3, 76, 0.65), (6, 78, 0.8), (8, 81, 0.9), (11, 83, 0.7), (14, 81, 0.65)]
HOME = [(0, 86, 1.0), (2, 83, 0.7), (4, 81, 0.85), (7, 78, 0.7), (10, 76, 0.7), (12, 74, 0.8)]


def build(hero, outro):
    drums, low, keys, lead, airb, fx, head, glass = (Bus() for _ in range(8))

    # The two words: two notes.
    lead.add(glass_note(81, 0.55), 0.18, pan=-0.15)  # Hey!
    lead.add(glass_note(86, 0.6), 0.35, pan=0.15)  # I'm Timur
    # Under the words and the throw, a breath of the key, barely there.
    airb.add(air([74, 78, 81, 88], 6.4, attack=1.6, release=1.6), 0.3, gain=0.35)

    def groove(bar, level=1.0, kick_on=True):
        for s in range(0, 16, 2):  # the shaker on the eighths, the off ones a touch louder
            drums.add(shaker((0.55 if s % 4 else 0.4) * level), at(bar, s), pan=0.25)
        for s in (3, 7, 11, 15):
            drums.add(tick(0.5 * level * (0.8 + 0.4 * rng.random())), at(bar, s), pan=-0.3)
        if kick_on:
            for s in (0, 10):
                drums.add(kick(0.9 * level), at(bar, s))
            if bar % 2:
                drums.add(kick(0.55 * level), at(bar, 7))
        for s in (4, 12):
            drums.add(snap(0.9 * level), at(bar, s), pan=0.05)
        drums.add(pop(0.5 * level, 1300 if bar % 2 else 1100), at(bar, 14), pan=0.35)

    # In as the page pulls back: the shaker alone, then the beat, soft.
    for s in range(4, 16, 2):
        drums.add(shaker(0.12 + 0.03 * s), at(-2, s), pan=0.25)
    groove(-1, level=0.85)
    for s in (12, 13, 14, 15):  # a few ticks into the camera setting off
        drums.add(tick(0.3 + 0.12 * (s - 12)), at(-1, s), pan=0.2)
    for bar in range(0, 5):
        groove(bar)
    # The last screen: the shaker, barely.
    for s in range(0, 16, 2):
        drums.add(shaker(0.18), at(5, s), pan=0.25)
    # The address.
    drums.add(kick(0.7), URL_IN)

    # Chords: the bass on the one and the and-of-three, a stab off the beat.
    prog = [(-1, 'G'), (0, 'D'), (1, 'Bm'), (2, 'G'), (3, 'A'), (4, 'D')]
    for bar, c in prog:
        root, stab = CH[c]
        lv = 0.8 if bar < 0 else 1.0
        low.add(bass(root, 0.9 * lv), at(bar, 0))
        low.add(bass(root, 0.7 * lv), at(bar, 10))
        if bar >= 0 and bar % 2 == 1:
            low.add(bass(root + 7, 0.55), at(bar, 14))
        for k, m in enumerate(stab):
            for s in (6, 14):
                keys.add(epiano(m, 0.14, 0.55 * lv), at(bar, s) + 0.004 * k, pan=-0.25 + 0.17 * k)
        for m in stab[:2]:  # the two lower notes an octave down, for warmth
            for s in (6, 14):
                keys.add(epiano(m - 12, 0.14, 0.4 * lv), at(bar, s))
    # The last screen: one bass note, held, and a breath of the chord.
    low.add(bass(43, 0.7, decay=0.9), at(5, 0))
    airb.add(air([83, 86, 90, 93], BAR + 0.4, attack=1.0, release=1.5), at(5, 0) - 0.2, gain=0.5)
    keys.add(np.sum([epiano(m, 0.5, 0.45) for m in CH['Asus'][1]], axis=0), at(6, 0))
    low.add(bass(45, 0.5, decay=0.5), at(6, 0))
    # The address: the chord, struck from the bottom up, and the bass home.
    for k, m in enumerate([74, 78, 81, 85, 88]):
        lead.add(glass_note(m, 0.6, decay=0.9), URL_IN + k * 0.04, pan=-0.3 + 0.15 * k)
    for m in CH['D'][1]:
        keys.add(epiano(m, 1.2, 0.5), URL_IN)
    low.add(bass(38, 0.85, decay=0.8), URL_IN)

    # The line while the camera travels.
    for bar, phrase in [(0, CALL), (1, ANSWER), (2, CALL), (3, ANSWER), (4, HOME)]:
        for s, m, v in phrase:
            lead.add(glass_note(m, v), at(bar, s), pan=0.1 * np.sin(s))

    # --- the sounds of the picture ---------------------------------------------
    # The title's words fly up into the header.
    fx.add(noise_swell(1.2, lambda u: 2600 - 1700 * u, lambda u: np.sin(np.pi * u) ** 2), 1.42, gain=0.07)
    # The flick that throws the head.
    fx.add(noise_swell(0.32, lambda u: 700 + 2600 * u, lambda u: np.sin(np.pi * u) ** 1.5, q=1.5), 3.3, pan=0.15, gain=0.13)
    # The page pulls back into the room.
    fx.add(noise_swell(1.9, lambda u: 380 + 500 * np.sin(np.pi * u), lambda u: np.sin(np.pi * u) ** 2, kind='low'), 5.2, gain=0.07)
    # Each move of the camera: air going by, right to left.
    for m0 in MOVES:
        w = noise_swell(1.1, lambda u: 600 + 2200 * np.sin(np.pi * u) ** 2, lambda u: (16 * u * u * (1 - u) * (1 - u)) ** 1.4, q=0.8)
        a = (np.linspace(0.55, -0.55, len(w)) + 1) * np.pi / 4
        fx.add(np.vstack([w * np.cos(a), w * np.sin(a)]) * np.sqrt(2), m0, gain=0.05)
    # The diplomas landing, one, two, three.
    for x, t0 in [(-0.3, 21.1), (0.0, 21.55), (0.3, 22.0)]:
        n, t = env_t(0.4)
        slap = sos_filter(rng.standard_normal(n), 'band', [700, 4000]) * np.exp(-t / 0.03)
        thud = np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.06)
        fx.add(slap * 0.5 + thud * 0.4, t0 + 0.474, pan=x, gain=0.2)

    # The head's knocks: the site's own takes (impactSound.ts), planned as it
    # plans them, without the crunch (it doesn't bleed here) and with one
    # "khm", after the second knock.
    takes = {name: load_take(name) for name in ['thump-1', 'thump-2', 'thump-3', 'thump-4', 'thump-5', 'khm-4']}
    trims = {'thump-1': 0.3, 'thump-2': -0.4, 'thump-3': 0.4, 'thump-4': -0.5, 'thump-5': 0.3, 'khm-4': 0.5}
    order = ['thump-1', 'thump-3', 'thump-2', 'thump-4', 'thump-5']
    for k, e in enumerate(hero):
        t0 = (e['f'] + round(HERO_LAG * 60)) / 60
        tt = min(max((e['impact'] - 0.22) / 2.4, 0), 1)
        knock = -28 + 14 * np.sqrt(tt)
        name = order[k % len(order)]
        head.add(take(takes[name], 0.93 + 0.1 * tt), t0, pan=e['pan'], gain=db(knock + 1 + trims[name]))
        if k == 1:
            head.add(take(takes['khm-4'], 1.0, voice=True), t0 + 0.1, pan=e['pan'] * 0.6, gain=db(knock - 2.5 + 1 + trims['khm-4']))

    # The glass: the site's synthesis (chime.ts), one ring per 110 ms, on the
    # notes of the chord the music is on (G major 9).
    notes = np.array([mtof(m) for m in (86, 90, 91, 93, 95)])  # D6 F#6 G6 A6 B6
    last = -1.0
    for e in outro:
        t0 = (e['f'] + round(OUTRO_AT * 60)) / 60
        if e['impact'] < 0.18 or t0 - last < 0.11 or t0 > 27.0:
            continue
        last = t0
        base = (1500 + rng.random() * 500 + min(e['impact'], 2) * 260) * e['pitch']
        f0 = notes[np.argmin(np.abs(np.log(notes / base)))]
        level = min(0.05, 0.012 + e['impact'] * 0.016) * e['level']
        n, t = env_t(0.9)
        ring = np.zeros(n)
        for i, ratio in enumerate([1, 2.32, 4.25]):
            peak = level / (1 + i * 1.6)
            decay = 0.14 / (1 + i * 0.8) * 1.8  # a touch longer than the site's, to ring
            ring += peak * np.sin(2 * np.pi * f0 * ratio * (1 + (rng.random() - 0.5) * 0.02) * t) * (0.0001 / peak) ** (t / decay)
        glass.add(ring * np.interp(t0, [26.5, 27.0], [1, 0]), t0, pan=e['pan'])

    return dict(drums=drums, low=low, keys=keys, lead=lead, air=airb, fx=fx, head=head, glass=glass)


# --- the site's sounds ------------------------------------------------------------
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


# --- the mix -------------------------------------------------------------------------
def limit(x, ceiling, look=0.004, release=0.06):
    """A look-ahead peak limiter: the gain comes down ahead of each peak just
    far enough, and back up smoothly (no make-up gain)."""
    peak = np.abs(x).max(axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    L = idx(look)
    g = uniform_filter1d(minimum_filter1d(need, size=2 * L + 1), size=L)
    a = np.exp(-1 / (release * SR))
    out = g.copy()
    for i in range(1, len(out)):
        r = out[i - 1] + (1 - a) * (1 - out[i - 1])
        out[i] = g[i] if g[i] < r else r
    return x * out


def master(b):
    # A small room for the snaps, the keys and the line, more for the glass
    # and the breath; the line's echo on eighths.
    rv_in = b['lead'].x * 0.3 + b['keys'].x * 0.3 + b['air'].x * 0.6 + b['glass'].x * 0.8 + b['head'].x * 0.1
    rv_in += sos_filter(b['drums'].x, 'band', [1500, 7000]) * 0.08
    rv = reverb(rv_in, room=0.55, damping=0.6)
    dl = echo(b['lead'].x, BEAT / 2, feedback=0.3, taps=4, lowpass=4000)
    # The levels, set by each part's loudness where it plays (main prints
    # them): the line leads, the beat light under it, the knocks over
    # whatever plays with them, the glass leading the last screen.
    stems = {
        'drums': sos_filter(b['drums'].x, 'high', 40) * db(-1),
        'low': sos_filter(b['low'].x, 'low', 900) * db(-2),
        'keys': sos_filter(b['keys'].x, 'high', 150) * db(-6),
        'lead': sos_filter(b['lead'].x, 'high', 200) * db(-2.5),
        'echo': sos_filter(dl, 'high', 300) * db(-9),
        'air': b['air'].x * db(-6),
        'reverb': sos_filter(rv, 'high', 250) * db(-12),
        'fx': b['fx'].x,
        'head': b['head'].x * db(18),
        'glass': b['glass'].x * db(24),
    }
    mix = sum(stems.values())
    mix = pb.Pedalboard([pb.HighpassFilter(cutoff_frequency_hz=30), pb.Compressor(threshold_db=-20, ratio=1.8, attack_ms=15, release_ms=150)])(
        mix.astype(np.float32), SR).astype(np.float64)
    meter = pyln.Meter(SR)
    for _ in range(2):
        mix *= db(LOUDNESS - meter.integrated_loudness(mix.T))
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
    mix, stems, meter = master(build(hero, outro))
    # Each part's loudness where it plays, against the whole mix's there (LU).
    sections = [('title', 0.0, 3.3), ('knocks', 3.8, 5.2), ('in', 7.1, 9.8), ('travel', 9.8, 23.3), ('glass', 24.8, 26.9), ('end', 27.35, 29.0)]
    whole = sum(stems.values())
    print('            ' + ''.join(f'{n:>9s}' for n, _, _ in sections))
    for name, x in list(stems.items()) + [('MIX', whole)]:
        row = []
        for _, a, b in sections:
            l = meter.integrated_loudness(x[:, idx(a):idx(b)].T)
            r = meter.integrated_loudness(whole[:, idx(a):idx(b)].T)
            row.append(f'{(l if name == "MIX" else l - r):9.1f}' if np.isfinite(l) else '        -')
        print(f'{name:12s}' + ''.join(row))
    tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=-1)).max())
    print(f'master: {meter.integrated_loudness(mix.T):.1f} LUFS, true peak {tp:.1f} dBTP')
    sf.write(out, mix.T.astype(np.float32), SR, subtype='FLOAT')


if __name__ == '__main__':
    main()
