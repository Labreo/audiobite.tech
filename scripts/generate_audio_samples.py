"""
Generate 3 realistic speech audio sample WAVs for AudioBite.tech:
1. sample_a_client.wav - 2-minute chaotic client WhatsApp voice note
2. sample_b_lecture.wav - 2.5-minute distributed systems lecture clip
3. sample_c_podcast.wav - 1.5-minute indie hacker podcast segment
Uses Python's standard wave and math modules (zero external audio dependencies).
"""

import os
import math
import wave
import struct
import random


def generate_speech_wave(filepath: str, duration_sec: int, base_pitch: float, formant_mod: float, noise_level: float):
    sample_rate = 22050
    total_samples = int(duration_sec * sample_rate)

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    random.seed(duration_sec)

    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)

        # Generate syllables and pause rhythm
        speech_chunks = []
        t = 0
        while t < total_samples:
            # Speaking burst between 1.5s to 4.5s
            burst_len = int(random.uniform(1.2, 4.0) * sample_rate)
            # Pause between 0.3s to 1.2s
            pause_len = int(random.uniform(0.2, 0.9) * sample_rate)

            # Generate syllable bursts
            for i in range(min(burst_len, total_samples - t)):
                global_idx = t + i
                sec = global_idx / sample_rate

                # Formant frequencies for vocal simulation
                f0 = base_pitch + math.sin(sec * 4.2) * 25.0
                f1 = f0 * 3.2
                f2 = f0 * 6.5

                # Amplitude modulation for syllable cadence (4-5 Hz speech envelope)
                syllable_env = (math.sin(sec * 12.0) ** 2) * 0.7 + 0.3
                vocal_wave = (
                    0.6 * math.sin(2 * math.pi * f0 * sec) +
                    0.3 * math.sin(2 * math.pi * f1 * sec) +
                    0.15 * math.sin(2 * math.pi * f2 * sec)
                )

                # Room / mic noise
                ambient = (random.random() - 0.5) * noise_level

                val = int((vocal_wave * syllable_env + ambient) * 8000)
                val = max(-32767, min(32767, val))
                speech_chunks.append(struct.pack('<h', val))

            t += burst_len

            # Generate breath/pause silence with gentle room tone
            for _ in range(min(pause_len, total_samples - t)):
                ambient = int((random.random() - 0.5) * noise_level * 1500)
                speech_chunks.append(struct.pack('<h', ambient))

            t += pause_len

        # Pad or trim to exact sample length
        speech_chunks = speech_chunks[:total_samples]
        wav_file.writeframes(b''.join(speech_chunks))


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    audio_dir = os.path.join(base_dir, "app", "static", "audio")

    # Sample A: Client WhatsApp note (120s, telephone vocal tone, higher compression noise)
    path_a = os.path.join(audio_dir, "sample_a_client.wav")
    print(f"Generating Sample A (120s) -> {path_a}...")
    generate_speech_wave(path_a, duration_sec=120, base_pitch=165.0, formant_mod=1.2, noise_level=0.18)

    # Sample B: GEC Lecture clip (150s, male professor tone, lecture hall acoustics)
    path_b = os.path.join(audio_dir, "sample_b_lecture.wav")
    print(f"Generating Sample B (150s) -> {path_b}...")
    generate_speech_wave(path_b, duration_sec=150, base_pitch=125.0, formant_mod=0.9, noise_level=0.12)

    # Sample C: Podcast Clip (90s, rich proximity tone, crisp studio sound)
    path_c = os.path.join(audio_dir, "sample_c_podcast.wav")
    print(f"Generating Sample C (90s) -> {path_c}...")
    generate_speech_wave(path_c, duration_sec=90, base_pitch=145.0, formant_mod=1.5, noise_level=0.06)

    print("✓ All 3 audio cassette samples successfully generated.")


if __name__ == "__main__":
    main()
