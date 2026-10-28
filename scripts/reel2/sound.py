#!/usr/bin/env python3
"""
The reel's sound, no music: air where the picture moves, and the site's own
sounds where it makes them, the head's knocks (its samples) and the outro's
glass (its synthesis), struck by the impacts the plates log
(scripts/reel/rec.mjs <shot> <out.json>). At the end, as the address rises,
a breath of air and one ring of the glass.

  python scripts/reel2/sound.py <hero.json> <outro.json> <out.wav>

Needs numpy, scipy, pedalboard, pyloudnorm and soundfile (pip), and ffmpeg.

Each kind of sound is set to its own loudness where it plays (LEVELS), not
the whole to a target: a reel this quiet, normalised, would have its air
pushed up as loud as music.
"""
import json
import subprocess
import sys

import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48000
DUR = 29.6
N = int(DUR * SR)
rng = np.random.default_rng(11)

# --- the picture's timeline (comp.html) -----------------------------------------
HERO_LAG = 1.6  # reel time of the hero plate's frame 0
OUTRO_AT = 23.3 - 0.8  # reel time of the outro plate's frame 0
# The gallery's changes (comp.html's CHANGES), one case going as the next
# comes, and the way each goes: the band of its air from → to (Hz, rising
# as a thing flies up close, falling as it drops or goes off into the
# distance), and its pan from → to (only the carousel goes sideways).
CHANGES = [
    (9.8, (500, 2400), (0.0, 0.0)),  # the page goes, Kritika rises
    (12.5, (400, 2600), (0.0, 0.0)),  # the phones fly up, Urbantiger flies in
    (15.2, (900, 1800), (0.6, -0.5)),  # the monitor sweeps off, the phones swing in
    (17.9, (2400, 600), (0.0, 0.0)),  # the phones drop, the monitors come down
    (20.6, (2000, 500), (0.0, 0.0)),  # the monitors fall back into the distance
    (23.3, (500, 2600), (0.0, 0.0)),  # the diplomas fly up, the last page rises
]
DIPLOMAS = [(-0.3, 21.1), (0.0, 21.55), (0.3, 22.0)]  # (pan, when each starts to fall)
URL_IN = 27.35  # the address rises out of a blur over 0.7 s

# Loudness (LUFS) of each kind where it plays: the knocks clear, the glass
# under them, the air soft.
LEVELS = {'head': -21, 'glass': -25, 'air': -28, 'end': -25}


def idx(t):
    return int(round(t * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 10 ** (x / 20)


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


def air(dur, f_of_u, shape, q=1.2, kind='band'):
    """Moving air: noise whose band follows f_of_u(u) and level shape(u), u 0 → 1."""
    n = idx(dur)

    def corner(tt):
        f = f_of_u(min(tt / dur, 1.0))
        return [f / (1 + 0.5 / q), min(f * (1 + 0.5 / q), SR / 2.1)] if kind == 'band' else f

    y = sweep_filter(rng.standard_normal(n), kind, corner)
    return y * shape(np.arange(n) / n)


def across(x, frm, to):
    """Mono air carried across the stereo field, frm → to (pans)."""
    a = (np.linspace(frm, to, len(x)) + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


def chime(f0, level, n_s=1.2, longer=1.8):
    """The outro's glass (chime.ts): three inharmonic modes dying fast, the
    upper ones first (a touch longer here, to ring)."""
    n = idx(n_s)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for i, ratio in enumerate([1, 2.32, 4.25]):
        peak = level / (1 + i * 1.6)
        decay = 0.14 / (1 + i * 0.8) * longer
        x += peak * np.sin(2 * np.pi * f0 * ratio * (1 + (rng.random() - 0.5) * 0.02) * t) * (0.0001 / peak) ** (t / decay)
    return x * (1 - np.exp(-t / 0.0005))


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


def build(hero, outro):
    wind, head, glass, end = Bus(), Bus(), Bus(), Bus()

    # --- air: wherever the picture moves --------------------------------------
    # The title flies up into the header.
    wind.add(air(1.2, lambda u: 2600 - 1700 * u, lambda u: np.sin(np.pi * u) ** 2), 1.42, gain=0.5)
    # The flick that throws the head.
    wind.add(air(0.32, lambda u: 700 + 2600 * u, lambda u: np.sin(np.pi * u) ** 1.5, q=1.5), 3.3, pan=0.15, gain=0.9)
    # The page pulls back into the room.
    wind.add(air(1.9, lambda u: 380 + 500 * np.sin(np.pi * u), lambda u: np.sin(np.pi * u) ** 2, kind='low'), 5.2, gain=0.6)
    # Each change: a gust as things come and go, all at once and then dying
    # away slowly, as they move (off the mark, then a long landing).
    gust = lambda u: (u ** 1.2 * (1 - u) ** 3.5) / (0.2553 ** 1.2 * 0.7447 ** 3.5)
    for t0, (f0, f1), (p0, p1) in CHANGES:
        w = air(1.3, lambda u, f0=f0, f1=f1: f0 + (f1 - f0) * u ** 0.7, gust, q=0.8)
        wind.add(across(w, p0, p1), t0 - 0.05, gain=0.4)
    # The diplomas falling onto the stack.
    for pan, t0 in DIPLOMAS:
        w = air(0.5, lambda u: 3000 - 2000 * u, lambda u: np.sin(np.pi * u ** 0.8) ** 2, q=1.4)
        wind.add(w, t0, pan=pan, gain=0.35)

    # --- the head's knocks: the site's own takes (impactSound.ts) ---------------
    # Planned as it plans them, without the crunch (it doesn't bleed here),
    # with one "khm", after the second knock.
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

    # --- the glass: the site's synthesis (chime.ts) -----------------------------
    # One ring per 110 ms, as the site rings them, each on the nearest note
    # of G major (with nothing else playing, a heap of glass rings sweetly
    # rather than clanks).
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
        glass.add(chime(f0, level) * np.interp(t0, [26.5, 27.0], [1, 0]), t0, pan=e['pan'])

    # --- the end: the address rises ---------------------------------------------
    # A breath of air coming up with it, and one ring of the glass as it
    # settles, on D, home.
    end.add(air(1.2, lambda u: 500 + 2200 * u ** 1.5, lambda u: np.sin(np.pi * np.minimum(u * 1.15, 1)) ** 2, q=1.0), URL_IN - 0.25, gain=0.8)
    end.add(chime(mtof(86), 0.05, n_s=2.5, longer=3.2), URL_IN + 0.3, pan=0.0)
    end.add(chime(mtof(93), 0.025, n_s=2.0, longer=2.6), URL_IN + 0.36, pan=0.15)

    return {'air': wind, 'head': head, 'glass': glass, 'end': end}


def loudness(meter, x, a, b):
    return meter.integrated_loudness(x[:, idx(a):idx(b)].T)


def mix(buses):
    meter = pyln.Meter(SR)
    stems = {
        'air': buses['air'].x,
        'head': buses['head'].x,
        # A little room for the glass, as the balls ring in a space.
        'glass': buses['glass'].x + reverb(buses['glass'].x, room=0.5) * 0.35,
        'end': buses['end'].x + reverb(buses['end'].x, room=0.7) * 0.4,
    }
    # Where each is measured: the knocks, a move of the camera, the balls, the end.
    where = {'head': (3.8, 5.2), 'air': (12.45, 13.75), 'glass': (24.8, 26.9), 'end': (URL_IN - 0.3, URL_IN + 1.5)}
    for name, (a, b) in where.items():
        stems[name] *= db(LEVELS[name] - loudness(meter, stems[name], a, b))
    out = sum(stems.values())
    # In over the first hundredth of a second, out over the last half.
    out *= np.interp(np.arange(N) / SR, [0, 0.01, DUR - 0.5, DUR], [0, 1, 1, 0])
    tp = 20 * np.log10(np.abs(signal.resample_poly(out, 4, 1, axis=-1)).max())
    if tp > -1.0:
        out *= db(-1.0 - tp)
    return out, stems, meter


def main():
    hero = json.load(open(sys.argv[1]))
    outro = json.load(open(sys.argv[2]))
    out, stems, meter = mix(build(hero, outro))
    for name, x in stems.items():
        pk = 20 * np.log10(np.abs(x).max() + 1e-12)
        print(f'{name:6s} peak {pk:6.1f} dBFS')
    tp = 20 * np.log10(np.abs(signal.resample_poly(out, 4, 1, axis=-1)).max())
    print(f'all: {meter.integrated_loudness(out.T):.1f} LUFS, true peak {tp:.1f} dBTP')
    sf.write(sys.argv[3], out.T.astype(np.float32), SR, subtype='FLOAT')


if __name__ == '__main__':
    main()
