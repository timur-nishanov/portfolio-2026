"""
The reel's music (sound.py mixes it): a half-time beat at 88.9 bpm in F
minor, a bar to each case of the gallery (2.7 s), so each change lands on a
downbeat. Punchy and spare, the way Apple's films are scored: a kick and an
808 that slides, a snare with a clap on the three, hats built as an 808
builds them, a rim, a soft pad low under it; and mixed in, the site's own
glass (its balls' synthesis, chime.ts), chopped on the chord's notes with
an echo: the hook is the site's own sound.

It plays the picture: a pad under the words; nothing while the head is
thrown, so the knocks are heard; hats, then the beat behind a filter that
opens, as the page pulls back; a cymbal backwards into a breath of silence,
and the drop as the gallery starts; a breakdown for the last screen's glass;
the hats climbing, and one last hit, on A-flat, home, with the address. No
rolls of snares, no rising saws: it holds back, and lands.
"""
import numpy as np
import pedalboard as pb
from scipy import signal

SR = 48000
BEAT = 0.675
BAR = 4 * BEAT
S16 = BEAT / 4
DROP = 9.8  # bar 0: the first change
URL_IN = 27.35  # the last hit: bar 6, beat 2
rng = np.random.default_rng(23)


def at(bar, step=0.0):
    return DROP + bar * BAR + step * S16


def idx(t):
    return int(round(t * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def times(dur):
    n = idx(dur)
    return n, np.arange(n) / SR


def bandpass(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x, axis=-1)


def lowpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x, axis=-1)


def highpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x, axis=-1)


def saw(f):
    """A band-limited saw (PolyBLEP) whose frequency may move, f per sample."""
    dt = f / SR
    ph = np.cumsum(dt) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt[m]
    y[m] -= x * x + x + x + 1.0
    return y


# --- drums ---------------------------------------------------------------------
def kick(vel=1.0):
    n, t = times(0.35)
    f = 48 + 130 * np.exp(-t / 0.028) + 380 * np.exp(-t / 0.0035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * (1 - np.exp(-t / 0.0008))
    click = bandpass(rng.standard_normal(n), 3000, 9000) * np.exp(-t / 0.0018) * 0.18
    return vel * np.tanh(1.8 * (body + click)) / np.tanh(1.8)


def snare(vel=1.0):
    """A snare with a clap in it: a short tone, bright noise, three quick claps."""
    n, t = times(0.45)
    noise = rng.standard_normal(n)
    body = (np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.07) + 0.5 * np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.03)) * 0.75
    hiss = bandpass(noise, 1500, 7000) * np.exp(-t / 0.09) * 0.45
    env = sum(np.where(t >= o, np.exp(-(t - o) / 0.005), 0) for o in (0, 0.008, 0.017)) + np.where(t >= 0.017, np.exp(-(t - 0.017) / 0.09), 0) * 0.6
    clap = bandpass(rng.standard_normal(n) * env, 900, 4500) * 0.7
    x = body + hiss + clap
    return vel * lowpass(np.tanh(1.3 * x) / np.tanh(1.3), 9000) * 0.8


# The TR-808's cymbal: six square waves, out of tune with one another.
_METAL = None


def metal():
    global _METAL
    if _METAL is None:
        n, t = times(0.5)
        x = np.zeros(n)
        for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0):
            k = 1
            while k * f < 20000:
                x += np.sin(2 * np.pi * k * f * t) / k
                k += 2
        _METAL = bandpass(x, 7000, 13000, 3)
        _METAL /= np.abs(_METAL).max()
    return _METAL


def hat(vel=1.0, open_=False):
    n, t = times(0.45 if open_ else 0.08)
    x = lowpass(metal()[:n], 11000) * np.exp(-t / (0.2 if open_ else 0.03)) * (1 - np.exp(-t / 0.0004))
    return vel * x * 0.5


def rim(vel=1.0):
    n, t = times(0.08)
    x = np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.012) + 0.5 * np.sin(2 * np.pi * 460 * t) * np.exp(-t / 0.02)
    x += highpass(rng.standard_normal(n), 3000) * np.exp(-t / 0.003) * 0.4
    return vel * x * 0.4


def crash(vel=1.0):
    n, t = times(2.0)
    x = (bandpass(rng.standard_normal(n), 3000, 12000) * 0.7 + metal()[np.arange(n) % len(metal())] * 0.3)
    return vel * x * np.exp(-t / 0.7) * (1 - np.exp(-t / 0.001)) * 0.3


def swell(dur, vel=1.0):
    """A cymbal backwards, swelling into what comes after it."""
    n, t = times(dur)
    x = crash(vel)[:n][::-1] * (t / dur) ** 1.5
    x[-idx(0.003):] *= np.linspace(1, 0, idx(0.003))
    return x


# --- the 808 ------------------------------------------------------------------------
def eight08(notes, until):
    """One sine through the whole track, as an 808 plays: each note struck
    (a quick fall in pitch, then a long decay), or slid into from the last
    (legato, no new strike). notes: [(t, midi, slide)]. Driven, so a phone's
    speaker hears its harmonics."""
    n = idx(until)
    f = np.zeros(n)
    amp = np.zeros(n)
    for k, (t0, m, slide) in enumerate(notes):
        i0 = idx(t0)
        i1 = idx(notes[k + 1][0]) if k + 1 < len(notes) else n
        tt = np.arange(i1 - i0) / SR
        target = mtof(m)
        if slide and k > 0:
            prev = mtof(notes[k - 1][1])
            f[i0:i1] = target * (prev / target) ** np.exp(-tt / 0.045)
            start = amp[i0 - 1] if i0 > 0 else 1.0
            amp[i0:i1] = start * np.exp(-tt / 1.1)
        else:
            f[i0:i1] = target * (1 + 0.6 * np.exp(-tt / 0.018))
            amp[i0:i1] = np.exp(-tt / 1.1) * (1 - np.exp(-tt / 0.002))
        # a note ends where the next begins: a short fade, no click
        if k + 1 < len(notes) and not notes[k + 1][2]:
            m_ = min(idx(0.006), i1 - i0)
            amp[i1 - m_:i1] *= np.linspace(1, 0, m_)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * amp
    x = np.tanh(2.4 * x) / np.tanh(2.4)
    return lowpass(x, 1600)


# --- the pad and the glass ------------------------------------------------------------
def pad(notes, dur, attack=0.6, release=1.2, cutoff=1200):
    """A soft chord: two saws a note, a hair apart, spread left and right,
    under a filter."""
    n, t = times(dur + release + 0.1)
    x = np.zeros((2, n))
    for m in notes:
        for cents, side in ((-8, -1), (8, 1)):
            v = saw(np.full(n, mtof(m + cents / 100)))
            a = (side * 0.6 + 1) * np.pi / 4
            x[0] += v * np.cos(a)
            x[1] += v * np.sin(a)
    env = np.minimum(1, t / attack) * np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return lowpass(x, cutoff) * env / (2 * len(notes))


def glass(m, level=0.6, longer=1.6):
    """The site's glass (chime.ts): three inharmonic modes, dying fast."""
    n, t = times(1.0)
    x = np.zeros(n)
    for i, ratio in enumerate([1, 2.32, 4.25]):
        peak = level / (1 + i * 1.6)
        decay = 0.14 / (1 + i * 0.8) * longer
        x += peak * np.sin(2 * np.pi * mtof(m) * ratio * t) * (0.0001 / peak) ** (t / decay)
    return x * (1 - np.exp(-t / 0.0005))


# --- effects ---------------------------------------------------------------------------
def swept_noise(n, f_of_u, width=1.5):
    """Noise through a band that moves (f_of_u, u 0 → 1), its state carried
    from one chunk to the next so the seams don't click."""
    noise = rng.standard_normal(n)
    y = np.zeros(n)
    zi = None
    for s in range(0, n, 256):
        f = f_of_u(min((s + 128) / n, 1.0))
        sos = signal.butter(1, [f / width, min(f * width, SR / 2.2)], btype='band', fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[s:s + 256], zi = signal.sosfilt(sos, noise[s:s + 256], zi=zi)
    return y


def impact():
    n, t = times(1.6)
    boom = np.sin(2 * np.pi * np.cumsum(36 + 40 * np.exp(-t / 0.1)) / SR) * np.exp(-t / 0.5) * (1 - np.exp(-t / 0.002))
    thump = lowpass(rng.standard_normal(n), 700) * np.exp(-t / 0.12) * 0.4
    return boom + thump


def downlifter(dur):
    n, t = times(dur)
    u = t / dur
    y = swept_noise(n, lambda v: 3000 * (300 / 3000) ** v, 1.6)
    return y * (1 - u) ** 1.5 * np.minimum(1, t / 0.02)


# --- the arrangement ---------------------------------------------------------------------
# F minor: [808 root, pad notes, chop notes].
CH = {
    'Fm': (29, [56, 60, 63, 67], [72, 75, 79]),  # Fm9
    'Db': (37, [53, 56, 60, 65], [72, 77, 80]),  # Dbmaj7
    'Ab': (32, [55, 60, 63, 67], [72, 75, 79]),  # Abmaj7
    'Eb': (39, [55, 58, 63, 65], [70, 75, 77]),  # Eb(add9)
    'Bbm': (34, [53, 56, 61, 65], [73, 77, 80]),  # Bbm9
    'C': (36, [55, 58, 64, 67], [72, 76, 79]),  # C7
}
GALLERY = ['Fm', 'Db', 'Ab', 'Eb', 'Fm']  # bars 0-4, one a case


class Bus:
    def __init__(self, n):
        self.x = np.zeros((2, n))

    def add(self, sig, t, pan=0.0, gain=1.0):
        i = idx(t)
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        lo, hi = max(i, 0), min(i + sig.shape[1], self.x.shape[1])
        if hi > lo:
            self.x[:, lo:hi] += gain * sig[:, lo - i:hi - i]


def hush(B, a, b, fade=0.004):
    """Everything silent from a to b, out over a few ms so nothing clicks."""
    i, j, f = idx(a), idx(b), idx(fade)
    for bus in B.values():
        bus.x[:, i - f:i] *= np.linspace(1, 0, f)
        bus.x[:, i:j] = 0


def build(dur):
    n = idx(dur)
    B = {k: Bus(n) for k in ('kick', 'b808', 'snare', 'hats', 'perc', 'pad', 'glass', 'fx')}

    # Under the words: a pad of "oo", out of a hush, cut as the hand throws.
    B['pad'].add(pad(CH['Fm'][1], 3.3, attack=1.4, release=0.04, cutoff=800), 0.0, gain=0.9)
    B['pad'].x[:, idx(3.28):idx(3.34)] *= np.linspace(1, 0, idx(3.34) - idx(3.28))
    B['pad'].x[:, idx(3.34):idx(5.0)] = 0

    # The page pulls back: the hats come back, then the pad, then the beat
    # behind a filter that opens across the bar before the drop.
    for s in range(4, 16, 2):
        B['hats'].add(hat(0.3 + 0.035 * s), at(-2, s), pan=0.2)
    B['pad'].add(pad(CH['Db'][1], BAR - 0.68, attack=0.8, release=0.6, cutoff=900), at(-2, 4), gain=0.8)
    B['pad'].add(pad(CH['Bbm'][1], BAR / 2, attack=0.3, release=0.4), at(-1), gain=0.8)
    B['pad'].add(pad(CH['C'][1], BAR / 2, attack=0.3, release=0.4), at(-1, 8), gain=0.8)

    notes = []

    def groove(bar, chord, roll=False, chops=True):
        root, padn, chop = CH[chord]
        b0 = at(bar)
        for s in (0, 10):
            B['kick'].add(kick(1.0 if s == 0 else 0.85), at(bar, s))
        if bar % 2:
            B['kick'].add(kick(0.6), at(bar, 7))
        B['snare'].add(snare(1.0), at(bar, 8), pan=0.03)
        if bar % 2 == 0:
            B['snare'].add(snare(0.25), at(bar, 15), pan=0.1)
        # Hats on the eighths, and into some changes a roll of triplets.
        for s in range(0, 12 if roll else 16, 2):
            B['hats'].add(hat(0.75 if s % 4 == 0 else 0.55), at(bar, s), pan=0.15)
        if roll:
            for k in range(6):
                B['hats'].add(hat(0.4 + 0.08 * k), at(bar, 12) + k * BEAT / 6, pan=0.15 - 0.05 * k)
        B['hats'].add(hat(0.4, True), at(bar, 6), pan=-0.2)
        for s in (3, 11):
            B['perc'].add(rim(0.8), at(bar, s), pan=-0.3)
        # The 808: the root on the one and the and-of-three, sliding up to the
        # octave at the end of every other bar.
        notes.append((b0, root, False))
        notes.append((at(bar, 10), root, False))
        if bar % 2:
            notes.append((at(bar, 14), root + 12, True))
        # A pad, low, under it all.
        B['pad'].add(pad(padn, BAR, attack=0.15, release=0.5), b0, gain=0.45)
        # The hook: the site's glass, chopped on the chord's notes, off the beat.
        if chops:
            B['glass'].add(glass(chop[0], 0.9, 2.6), at(bar, 2), pan=-0.2)
            B['glass'].add(glass(chop[2], 0.7, 2.0), at(bar, 5), pan=0.2)
            B['glass'].add(glass(chop[1], 0.85, 3.2), at(bar, 11), pan=0.0)
            if bar % 2:
                B['glass'].add(glass(chop[2] + 12, 0.4, 1.6), at(bar, 14), pan=0.35)

    # The bar before the drop: the beat, low and closed, opening, and a
    # cymbal backwards into a breath of silence (GAP, below).
    GAP = S16 * 0.5
    groove(-1, 'Bbm', chops=False)
    notes[-3:] = [(at(-1), CH['Bbm'][0], False), (at(-1, 10), CH['C'][0], False)]
    B['fx'].add(swell(at(0) - GAP - at(-1, 8)), at(-1, 8), pan=-0.1, gain=0.8)

    # The gallery, a case a bar; the drop.
    B['fx'].add(impact(), at(0), gain=0.35)
    B['fx'].add(crash(0.8), at(0), pan=0.2)
    for bar, chord in enumerate(GALLERY):
        groove(bar, chord, roll=bar in (1, 3))
        if bar in (1, 3):  # the site's glass, a ring before the change
            B['perc'].add(glass(CH[chord][2][2] + 12, 0.5), at(bar, 15), pan=0.4)

    # The last screen: the beat drops out for its glass; the 808 holds.
    B['fx'].add(downlifter(1.4), at(5), gain=0.4)
    notes.append((at(5), CH['Db'][0], False))
    B['pad'].add(pad(CH['Db'][1], BAR, attack=0.5, release=0.8, cutoff=900), at(5), gain=0.6)

    # Home: the hats climbing, a cymbal backwards, a breath, and the last hit
    # with the address, on A-flat.
    B['kick'].add(kick(0.7), at(6))
    B['pad'].add(pad(CH['Eb'][1], URL_IN - at(6), attack=0.2, release=0.2), at(6), gain=0.6)
    for k, s in enumerate([0, 2, 3, 4, 5, 6, 6.5, 7]):
        B['hats'].add(hat(0.35 + 0.07 * k), at(6, s), pan=0.15)
    B['fx'].add(swell(URL_IN - GAP - at(6, 2)), at(6, 2), pan=0.1, gain=0.7)
    notes.append((at(6), CH['Eb'][0], False))
    notes.append((URL_IN, 32, False))  # A-flat
    B['kick'].add(kick(1.0), URL_IN)
    B['fx'].add(impact(), URL_IN, gain=0.3)
    B['fx'].add(crash(0.7), URL_IN, pan=-0.2)
    B['pad'].add(pad([56, 60, 63, 67, 70], 1.6, attack=0.03, release=1.4, cutoff=1600), URL_IN, gain=1.3)
    for k, m in enumerate([80, 84, 87]):  # A-flat, C, E-flat, in glass
        B['glass'].add(glass(m, 0.6, 4.0), URL_IN + 0.03 * k, pan=-0.2 + 0.2 * k)

    B['b808'].add(eight08(sorted(notes), dur), 0.0)
    # Under the last screen's glass the 808 only hums.
    tt_ = np.arange(n) / SR
    B['b808'].x *= np.interp(tt_, [at(5) - 0.01, at(5) + 0.05, at(6) - 0.05, at(6)], [1, 0.35, 0.35, 1])
    # The 808 and the pad give way to each kick.
    duck = np.ones(n)
    tt = np.arange(n) / SR
    kicks = [at(b, s) for b in range(-1, 5) for s in (0, 10)] + [at(6), URL_IN]
    for k in kicks:
        d = tt - k
        m = (d >= 0) & (d < 0.4)
        duck[m] = np.minimum(duck[m], 1 - 0.5 * np.exp(-d[m] / 0.09))
    B['pad'].x *= duck
    # The breaths: before the drop, and before the last hit.
    hush(B, at(0) - GAP, at(0))
    hush(B, URL_IN - GAP, URL_IN)

    # The beat before the drop, behind a filter opening across the bar.
    for k in ('kick', 'b808', 'snare', 'hats', 'perc', 'pad'):
        x = B[k].x
        a, b = idx(at(-1)), idx(at(0))
        seg = x[:, a:b].copy()
        out = np.zeros_like(seg)
        zi = None
        for s in range(0, seg.shape[1], 512):
            f = 300 * (12000 / 300) ** ((s + 256) / seg.shape[1]) ** 1.5
            sos = signal.butter(2, f, btype='low', fs=SR, output='sos')
            if zi is None:
                zi = np.zeros((sos.shape[0], 2, 2))
            o, zi = signal.sosfilt(sos, seg[:, s:s + 512], axis=-1, zi=zi)
            out[:, s:s + 512] = o
        x[:, a:b] = out

    # Space: a short room for the snare, the glass's echo on dotted eighths
    # and a longer room for it and the pad.
    room = pb.Pedalboard([pb.Reverb(room_size=0.45, damping=0.6, wet_level=1.0, dry_level=0.0, width=1.0)])
    hall = pb.Pedalboard([pb.Reverb(room_size=0.75, damping=0.5, wet_level=1.0, dry_level=0.0, width=1.0)])
    echo = pb.Pedalboard([pb.Delay(delay_seconds=BEAT * 0.75, feedback=0.32, mix=1.0), pb.LowpassFilter(cutoff_frequency_hz=4500)])
    f32 = lambda x: x.astype(np.float32)
    B['snare'].x = B['snare'].x + room(f32(B['snare'].x), SR) * 0.25
    glass_echo = echo(f32(B['glass'].x), SR)
    B['glass'].x = B['glass'].x + hall(f32(B['glass'].x + glass_echo * 0.6), SR) * 0.35 + glass_echo * 0.35
    B['pad'].x = B['pad'].x + hall(f32(B['pad'].x), SR) * 0.4
    B['perc'].x = B['perc'].x + room(f32(B['perc'].x), SR) * 0.3
    B['fx'].x = B['fx'].x + hall(f32(B['fx'].x), SR) * 0.3

    # The balance inside the beat (dB): the kick, the 808 and the snare up
    # front, the hats and the rim under them, the glass over the pad.
    gains = {'kick': 0, 'b808': -7.5, 'snare': -1, 'hats': 7.5, 'perc': -1, 'pad': -2.5, 'glass': -7, 'fx': -7}
    return {k: highpass(B[k].x, 25) * 10 ** (g / 20) for k, g in gains.items()}
