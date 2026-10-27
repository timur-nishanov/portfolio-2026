#!/bin/bash
# Re-encode a clip as VP9 in WebM under its own name: the recording browser
# has no H.264. A keyframe every 15 frames, so seeking a frame at a time is cheap.
f="$1"
tmp="${f%.mp4}.tmp.webm"
ffmpeg -v error -y -i "$f" -an -c:v libvpx-vp9 -crf 20 -b:v 0 -deadline realtime -cpu-used 8 -row-mt 1 -g 15 -pix_fmt yuv420p "$tmp" && mv "$tmp" "$f" && echo "ok $f"
