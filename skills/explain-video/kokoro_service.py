"""Kokoro-82M speech service for manim-voiceover.

Runs fully local: no cloud calls, no API key, no cloned voices.
Requires the venv created by setup.sh (Kokoro, torch, soundfile).
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf

from manim_voiceover._typing import VoiceoverData
from manim_voiceover.helper import remove_bookmarks
from manim_voiceover.services.base import (
    PathLike,
    SpeechService,
    initialize_speech_service,
    path_to_string,
)

SAMPLE_RATE = 24_000
CHUNK_GAP_S = 0.15  # silence between pipeline chunks (sentence-ish)
_BOOKMARK_RE = re.compile(r"\[\[[^\]]*\]\]")  # manim-voiceover [[bookmark]] tags


def _strip_bookmarks(text: str) -> str:
    return _BOOKMARK_RE.sub("", remove_bookmarks(text)).strip()


class KokoroService(SpeechService):
    """Local Kokoro-82M voice for manim-voiceover.

    Default voice ``af_heart`` (American English). Override with the
    ``voice=`` argument or the ``KOKORO_VOICE`` / ``KOKORO_SPEED`` env vars.
    """

    def __init__(self, voice: str | None = None, speed: float | None = None, **kwargs: Any) -> None:
        from kokoro import KPipeline  # heavy import: keep it inside __init__

        self.pipeline = KPipeline(lang_code="a")  # American English, 82M weights
        self.voice = voice or os.environ.get("KOKORO_VOICE", "af_heart")
        self.speed = float(
            speed if speed is not None else os.environ.get("KOKORO_SPEED", 1.0)
        )
        initialize_speech_service(self, kwargs)

    def _synthesize(self, text: str) -> np.ndarray:
        chunks = [
            audio for _, _, audio in self.pipeline(text, voice=self.voice, speed=self.speed)
        ]
        parts: list[np.ndarray] = []
        gap = np.zeros(int(SAMPLE_RATE * CHUNK_GAP_S), dtype=np.float32)
        for i, chunk in enumerate(chunks):
            if i:
                parts.append(gap)
            parts.append(np.asarray(chunk, dtype=np.float32))
        return np.concatenate(parts) if parts else np.zeros(SAMPLE_RATE, dtype=np.float32)

    def generate_from_text(
        self,
        text: str,
        cache_dir: PathLike | None = None,
        path: PathLike | None = None,
        **kwargs: Any,
    ) -> VoiceoverData:
        if cache_dir is None:
            cache_dir = self.cache_dir

        input_data = {
            "input_text": text,
            "service": "kokoro",
            "voice": self.voice,
            "speed": self.speed,
        }
        cached_result = self.get_cached_result(input_data, cache_dir)
        if cached_result is not None:
            return cached_result

        if path is None:
            audio_path = self.get_audio_basename(input_data) + ".wav"
        else:
            audio_path = path_to_string(path)

        wav = self._synthesize(_strip_bookmarks(text))
        sf.write(str(Path(cache_dir) / audio_path), wav, SAMPLE_RATE)

        json_dict: VoiceoverData = {
            "input_text": text,
            "input_data": input_data,
            "original_audio": str(audio_path),
            "final_audio": str(audio_path),
        }
        return json_dict
