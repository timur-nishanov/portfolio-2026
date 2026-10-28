#!/bin/bash
# Joins the recorded shots into the reel with soft dissolves, the first one
# faded in from the page's off-white: H.264, 1920×1080, 60fps, no sound.
#
#   scripts/reel/assemble.sh <work> <out.mp4>
#
# Reads <work>/<shot>.mp4 for each shot below, in order.
set -euo pipefail
work="$1"
out="$2"
X=0.7 # each dissolve, in seconds
shots=(main case awards random outro end)

inputs=()
filter=""
offset=0
prev="[0:v]fade=t=in:st=0:d=0.5:color=0xf7f7f5[v0]"
filter="$prev"
last="v0"
for i in "${!shots[@]}"; do
  f="$work/${shots[$i]}.mp4"
  inputs+=(-i "$f")
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  if [ "$i" -gt 0 ]; then
    filter="$filter;[$last][$i:v]xfade=transition=fade:duration=$X:offset=$offset[v$i]"
    last="v$i"
  fi
  offset=$(python3 -c "print(round($offset + $d - $X, 4))")
done

ffmpeg -v error -y "${inputs[@]}" -filter_complex "$filter" -map "[$last]" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r 60 -movflags +faststart -an "$out"
ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$out"
