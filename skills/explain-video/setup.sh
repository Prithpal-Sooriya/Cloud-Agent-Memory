#!/usr/bin/env bash
# One-time setup for the explain-video skill.
# Installs Manim + manim-voiceover + local Kokoro-82M TTS into a venv.
# Override the venv path with EXPLAIN_VIDEO_VENV. Idempotent: safe to re-run.
set -euo pipefail

VENV="${EXPLAIN_VIDEO_VENV:-$HOME/.venvs/explain-video}"

# --- macOS system deps ----------------------------------------------------
if [[ "$(uname -s)" == "Darwin" ]]; then
  command -v ffmpeg >/dev/null 2>&1 || brew install ffmpeg
  command -v espeak-ng >/dev/null 2>&1 || brew install espeak-ng # misaki phonemizer fallback
  brew list cairo >/dev/null 2>&1 || brew install cairo # pycairo build dep
  brew list pkg-config >/dev/null 2>&1 || brew install pkg-config
  # Some macOS setups default to an SDK that fails to link (arm64e .tbd
  # mismatch). Point C builds at Xcode's SDK when it exists.
  XCODE_SDK=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk
  if [[ -z "${SDKROOT:-}" && -d "$XCODE_SDK" ]]; then
    export SDKROOT="$XCODE_SDK"
  fi
elif [[ "$(uname -s)" == "Linux" ]]; then
  command -v ffmpeg >/dev/null 2>&1 || echo "setup.sh: install ffmpeg with your package manager"
  command -v espeak-ng >/dev/null 2>&1 || echo "setup.sh: install espeak-ng with your package manager"
fi

# --- python venv ------------------------------------------------------------
command -v uv >/dev/null 2>&1 || { echo "setup.sh: install uv first: https://docs.astral.sh/uv/"; exit 1; }
[ -x "$VENV/bin/python" ] || uv venv --python 3.12 "$VENV"

export VIRTUAL_ENV="$VENV"

# kokoro pins an old transformers/tokenizers with no macOS arm64 wheels.
# Install kokoro without deps, then a modern transformers instead.
uv pip install --no-deps kokoro
uv pip install loguru huggingface-hub numpy torch "misaki[en]" soundfile \
  "transformers>=4.40,<4.50" "pycairo==1.28.0" manim manim-voiceover openai-whisper

# --- warm the model cache and check speech deps ----------------------------
"$VENV/bin/python" - <<'EOF'
from kokoro import KPipeline
import misaki
import whisper
KPipeline(lang_code="a") # American English
print("Kokoro-82M weights cached. misaki and whisper import.")
EOF

echo "Setup complete."
echo "  venv:   $VENV"
echo "  render: $VENV/bin/manim render -ql scene.py <SceneName>"
echo "  voice:  af_heart (override with KokoroService(voice=...) or KOKORO_VOICE)"
