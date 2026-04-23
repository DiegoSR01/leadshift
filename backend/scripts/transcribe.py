#!/usr/bin/env python3
"""
Whisper transcription script for LeadShift.
Uses faster-whisper (CTranslate2) for efficient CPU-based speech-to-text.

Usage:
  python transcribe.py <audio_file_path>

Output (stdout):
  JSON object with { "text": "...", "language": "...", "segments": [...] }
"""

import sys
import json
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file path provided"}), file=sys.stdout)
        sys.exit(1)

    audio_path = sys.argv[1]

    if not os.path.isfile(audio_path):
        print(json.dumps({"error": f"File not found: {audio_path}"}), file=sys.stdout)
        sys.exit(1)

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({"error": "faster-whisper not installed. Run: pip install faster-whisper"}), file=sys.stdout)
        sys.exit(1)

    try:
        # Use "base" model for balance between speed and accuracy
        # CPU int8 quantization for fast inference without GPU
        model_size = os.environ.get("WHISPER_MODEL", "base")
        model = WhisperModel(model_size, device="cpu", compute_type="int8")

        segments_iter, info = model.transcribe(
            audio_path,
            language="es",
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        segments = []
        full_text_parts = []

        for segment in segments_iter:
            segments.append({
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip(),
            })
            full_text_parts.append(segment.text.strip())

        result = {
            "text": " ".join(full_text_parts),
            "language": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration": round(info.duration, 2),
            "segments": segments,
        }

        print(json.dumps(result, ensure_ascii=False), file=sys.stdout)

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()
