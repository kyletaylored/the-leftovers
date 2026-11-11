# /// script
# requires-python = ">=3.10"
# dependencies = ["faster-whisper>=1.0", "imageio-ffmpeg>=0.5"]
# ///
"""
Prepare a video for the site: compress it, grab a poster frame, and
transcribe its speech into WebVTT captions.

    uv run scripts/prepare-video.py <input.mp4> <slug> [--poster-at 3] [--model small.en]

Writes, ready to commit:
  public/video/<slug>.mp4           H.264/AAC, at most 1280px wide, CRF 26,
                                    "faststart" so it plays before it's fully
                                    downloaded. Fixed URL, so it lives in public/.
  public/video/<slug>.vtt           Captions, transcribed on this machine with
                                    Whisper (nothing is uploaded anywhere).
  src/assets/img/videos/<slug>.jpg  Poster frame. Astro resizes it like any photo.

Then add an entry under src/content/videos/ (or in Pages CMS → Videos)
pointing at the three files. READ THE CAPTIONS BEFORE PUBLISHING: Whisper
mishears names, team slang and anything shouted over a loud field. Fix the
text in the .vtt (keep the timestamps); the transcript on the page is built
from that same file, so one fix covers both.

Why local: the site has no backend, and a free, offline transcriber keeps team
footage off third-party services. uv installs ffmpeg (imageio-ffmpeg) and
Whisper (faster-whisper) on first run; no system installs needed.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def ffmpeg() -> str:
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def run(args: list[str]) -> None:
    print("  $", " ".join(Path(a).name if i == 0 else a for i, a in enumerate(args)))
    subprocess.run(args, check=True)


def stamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def transcribe(video: Path, out: Path, model_name: str) -> int:
    from faster_whisper import WhisperModel

    print(f"  transcribing with Whisper {model_name} (first run downloads the model)…")
    # Decode with the same ffmpeg rather than faster-whisper's PyAV, whose
    # pinned version drifts: 16 kHz mono float32, what Whisper expects.
    import numpy as np

    pcm = subprocess.run(
        [ffmpeg(), "-loglevel", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(audio, vad_filter=True, beam_size=5)
    lines = ["WEBVTT", ""]
    count = 0
    for seg in segments:
        text = re.sub(r"\s+", " ", seg.text).strip()
        if not text:
            continue
        count += 1
        lines += [f"{stamp(seg.start)} --> {stamp(seg.end)}", text, ""]
    out.write_text("\n".join(lines), encoding="utf-8")
    return count


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input", type=Path)
    p.add_argument("slug", help="lower-case-with-dashes, e.g. nxl-world-cup-promo")
    p.add_argument("--poster-at", type=float, default=3.0, help="seconds into the video for the poster frame")
    p.add_argument("--model", default="small.en", help="Whisper model: tiny.en, base.en, small.en, medium.en…")
    p.add_argument("--captions-only", action="store_true", help="skip compression and the poster; redo the .vtt")
    p.add_argument("--crf", type=int, default=26, help="quality, lower is bigger (23–28 is sensible)")
    a = p.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.slug):
        p.error("slug must be lower-case letters, digits and dashes")
    if not a.input.is_file():
        p.error(f"no such file: {a.input}")

    video_dir = ROOT / "public" / "video"
    poster_dir = ROOT / "src" / "assets" / "img" / "videos"
    video_dir.mkdir(parents=True, exist_ok=True)
    poster_dir.mkdir(parents=True, exist_ok=True)
    mp4 = video_dir / f"{a.slug}.mp4"
    vtt = video_dir / f"{a.slug}.vtt"
    jpg = poster_dir / f"{a.slug}.jpg"
    ff = ffmpeg()

    if a.captions_only:
        print(f"captions only: {transcribe(mp4, vtt, a.model)} cues → {vtt.relative_to(ROOT)}")
        return 0

    print("1/3 compressing")
    run([
        ff, "-y", "-loglevel", "error", "-i", str(a.input),
        "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf),
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(mp4),
    ])

    print("2/3 poster frame")
    run([ff, "-y", "-loglevel", "error", "-ss", str(a.poster_at), "-i", str(mp4), "-frames:v", "1", "-q:v", "2", str(jpg)])

    print("3/3 captions")
    cues = transcribe(mp4, vtt, a.model)

    size = mp4.stat().st_size / 1_048_576
    print(f"\nDone: {mp4.relative_to(ROOT)} ({size:.1f} MB), {jpg.relative_to(ROOT)}, {vtt.relative_to(ROOT)} ({cues} cues)")
    if size > 50:
        print("  ! Over 50 MB: GitHub warns at 50 and refuses 100. Try a higher --crf.")
    if cues == 0:
        print("  ! No speech found. Music-only video? Leave the captions field empty.")
    print("  Read the .vtt and fix any misheard words before you publish.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
