#!/usr/bin/env python3
"""
Generate deterministic tactile assets for the Editorial-Tactile UI.
Generates:
1. app/static/textures/live-grain.png (256x256 monochrome film grain with alpha)
2. app/static/cutouts/vu-meter.svg (vintage analog VU calibration meter)
3. app/static/cutouts/tuning-fork.svg (brass 440Hz tuning fork)
4. app/static/cutouts/splice-badge.svg (magnetic cassette splice block & telemetry badge)
"""

import os
import zlib
import struct
import random

def create_png_rgba(width, height, pixel_data):
    """Create a raw RGBA PNG from byte data using standard library zlib/struct."""
    def chunk(chunk_type, data):
        return struct.pack(">I", len(data)) + chunk_type + data + struct.pack(">I", zlib.crc32(chunk_type + data) & 0xffffffff)

    # PNG Header
    header = b'\x89PNG\r\n\x1a\n'
    # IHDR
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)

    # Scanlines with filter byte 0
    raw_scanlines = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_scanlines.append(0)  # filter type 0 (None)
        start = y * row_bytes
        raw_scanlines.extend(pixel_data[start:start + row_bytes])

    compressed = zlib.compress(bytes(raw_scanlines), 9)
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')

    return header + ihdr + idat + iend

def generate_live_grain():
    """Generate 256x256 high-frequency analog film grain texture."""
    width, height = 256, 256
    pixels = bytearray(width * height * 4)
    # Deterministic seed for reproducible asset generation
    rng = random.Random(42)

    for i in range(width * height):
        val = rng.randint(20, 235)
        alpha = rng.randint(30, 80)
        idx = i * 4
        pixels[idx] = val      # R
        pixels[idx + 1] = val  # G
        pixels[idx + 2] = val  # B
        pixels[idx + 3] = alpha # A

    png_bytes = create_png_rgba(width, height, pixels)
    out_dir = os.path.join(os.path.dirname(__file__), "..", "app", "static", "textures")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "live-grain.png")
    with open(out_path, "wb") as f:
        f.write(png_bytes)
    print(f"✓ Generated {out_path} ({len(png_bytes)} bytes)")

def generate_vu_meter_svg():
    """Generate rich skeuomorphic vintage analog VU meter SVG."""
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" width="100%" height="100%">
  <defs>
    <radialGradient id="caseGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2c2a27"/>
      <stop offset="85%" stop-color="#171717"/>
      <stop offset="100%" stop-color="#111312"/>
    </radialGradient>
    <linearGradient id="bezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4b47d"/>
      <stop offset="35%" stop-color="#8f6f3b"/>
      <stop offset="70%" stop-color="#b8863b"/>
      <stop offset="100%" stop-color="#5a421e"/>
    </linearGradient>
    <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="80%" stop-color="#eee6dc"/>
      <stop offset="100%" stop-color="#d9cfc1"/>
    </linearGradient>
    <filter id="meterShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#111312" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Outer Bezel & Case -->
  <rect x="10" y="10" width="300" height="200" rx="14" fill="url(#caseGrad)" stroke="url(#bezelGrad)" stroke-width="4" filter="url(#meterShadow)"/>
  
  <!-- Screws -->
  <circle cx="24" cy="24" r="4" fill="#665b48" stroke="#332d24" stroke-width="1"/>
  <line x1="22" y1="22" x2="26" y2="26" stroke="#221e18" stroke-width="1"/>
  <circle cx="296" cy="24" r="4" fill="#665b48" stroke="#332d24" stroke-width="1"/>
  <line x1="294" y1="22" x2="298" y2="26" stroke="#221e18" stroke-width="1"/>
  <circle cx="24" cy="196" r="4" fill="#665b48" stroke="#332d24" stroke-width="1"/>
  <circle cx="296" cy="196" r="4" fill="#665b48" stroke="#332d24" stroke-width="1"/>

  <!-- Dial Face Plate -->
  <path d="M 28,30 L 292,30 A 10,10 0 0,1 302,40 L 302,150 A 12,12 0 0,1 290,162 L 30,162 A 12,12 0 0,1 18,150 L 18,40 A 10,10 0 0,1 28,30 Z" fill="url(#faceGrad)" stroke="#4a463e" stroke-width="1"/>

  <!-- Dial Arc & Calibration Markings -->
  <path d="M 50,135 A 130,130 0 0,1 270,135" fill="none" stroke="#282723" stroke-width="2.5"/>
  <path d="M 215,95 A 130,130 0 0,1 270,135" fill="none" stroke="#d45d2a" stroke-width="4.5"/>

  <!-- Scale Numbers -->
  <text x="52" y="145" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#282723">-20</text>
  <text x="88" y="105" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#282723">-10</text>
  <text x="135" y="82" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#282723">-5</text>
  <text x="160" y="75" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="800" fill="#282723">0</text>
  <text x="195" y="82" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#282723">+1</text>
  <text x="235" y="105" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#d45d2a">+3</text>
  <text x="265" y="145" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#d45d2a">+5</text>

  <!-- Labels -->
  <text x="160" y="112" font-family="'Syne', sans-serif" font-size="12" font-weight="800" letter-spacing="2" text-anchor="middle" fill="#3d3a33">VOLUME UNIT</text>
  <text x="160" y="130" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle" fill="#6e685e">TABPFN-V2 CALIBRATION</text>

  <!-- Needle -->
  <g transform="rotate(-14 160 190)" id="vu-needle">
    <polygon points="158,190 159,50 161,50 162,190" fill="#d45d2a"/>
    <circle cx="160" cy="190" r="14" fill="#171717" stroke="#b8863b" stroke-width="2"/>
    <circle cx="160" cy="190" r="5" fill="#d4b47d"/>
  </g>

  <!-- Status LED -->
  <circle cx="280" cy="182" r="4.5" fill="#3d5a45" stroke="#25382a" stroke-width="1"/>
  <text x="268" y="185" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="600" text-anchor="end" fill="#888175">ACTIVE</text>
</svg>'''
    out_dir = os.path.join(os.path.dirname(__file__), "..", "app", "static", "cutouts")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "vu-meter.svg")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"✓ Generated {out_path}")

def generate_tuning_fork_svg():
    """Generate high-detail brass 440Hz tuning fork cutout SVG."""
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 380" width="100%" height="100%">
  <defs>
    <linearGradient id="brassGradH" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8a6729"/>
      <stop offset="30%" stop-color="#e8cf9b"/>
      <stop offset="60%" stop-color="#b8863b"/>
      <stop offset="85%" stop-color="#fdf4df"/>
      <stop offset="100%" stop-color="#694d1c"/>
    </linearGradient>
    <linearGradient id="brassProngL" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#694d1c"/>
      <stop offset="40%" stop-color="#e8cf9b"/>
      <stop offset="100%" stop-color="#99702c"/>
    </linearGradient>
    <filter id="forkShadow" x="-20%" y="-10%" width="140%" height="120%">
      <feDropShadow dx="3" dy="8" stdDeviation="5" flood-color="#242622" flood-opacity="0.32"/>
    </filter>
  </defs>

  <g filter="url(#forkShadow)">
    <!-- Left Prong -->
    <rect x="42" y="20" width="18" height="210" rx="9" fill="url(#brassProngL)"/>
    
    <!-- Right Prong -->
    <rect x="100" y="20" width="18" height="210" rx="9" fill="url(#brassGradH)"/>

    <!-- Fork Base U-Bend -->
    <path d="M 42,200 C 42,270 118,270 118,200 L 100,200 C 100,250 60,250 60,200 Z" fill="url(#brassGradH)"/>

    <!-- Stem / Shaft -->
    <rect x="71" y="248" width="18" height="85" rx="3" fill="url(#brassGradH)"/>

    <!-- Handle Ball End -->
    <circle cx="80" cy="345" r="16" fill="url(#brassGradH)"/>
    <circle cx="78" cy="341" r="5" fill="#fdf4df" opacity="0.6"/>

    <!-- Engraving -->
    <text x="80" y="295" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#4d3915" text-anchor="middle" transform="rotate(-90 80 295)">A=440 Hz</text>
  </g>
</svg>'''
    out_dir = os.path.join(os.path.dirname(__file__), "..", "app", "static", "cutouts")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "tuning-fork.svg")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"✓ Generated {out_path}")

def generate_splice_badge_svg():
    """Generate tactile aluminum/brass tape splice block cutout SVG."""
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 180" width="100%" height="100%">
  <defs>
    <linearGradient id="metalBlock" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#403e3b"/>
      <stop offset="25%" stop-color="#282723"/>
      <stop offset="50%" stop-color="#383632"/>
      <stop offset="80%" stop-color="#1e1e1b"/>
      <stop offset="100%" stop-color="#111312"/>
    </linearGradient>
    <linearGradient id="tapeStrip" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7a4629"/>
      <stop offset="50%" stop-color="#a86239"/>
      <stop offset="100%" stop-color="#693c23"/>
    </linearGradient>
    <filter id="blockShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="3" dy="7" stdDeviation="4.5" flood-color="#171717" flood-opacity="0.38"/>
    </filter>
  </defs>

  <!-- Splice Block Base -->
  <rect x="12" y="15" width="256" height="150" rx="8" fill="url(#metalBlock)" stroke="#524e47" stroke-width="2" filter="url(#blockShadow)"/>

  <!-- Screws -->
  <circle cx="28" cy="30" r="5" fill="#888175" stroke="#332d24" stroke-width="1"/>
  <circle cx="252" cy="30" r="5" fill="#888175" stroke="#332d24" stroke-width="1"/>
  <circle cx="28" cy="150" r="5" fill="#888175" stroke="#332d24" stroke-width="1"/>
  <circle cx="252" cy="150" r="5" fill="#888175" stroke="#332d24" stroke-width="1"/>

  <!-- Tape Guide Channel -->
  <rect x="12" y="70" width="256" height="40" fill="#171717" stroke="#3d3a35" stroke-width="1"/>
  
  <!-- 1/4 inch Tape Running Through -->
  <rect x="12" y="76" width="256" height="28" fill="url(#tapeStrip)" opacity="0.92"/>

  <!-- 45-degree & 90-degree Razor Cut Channels -->
  <line x1="140" y1="58" x2="140" y2="122" stroke="#d5d2cb" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="110" y1="62" x2="170" y2="118" stroke="#d5d2cb" stroke-width="2.2" stroke-linecap="round"/>

  <!-- Engraved Telemetry Badge -->
  <rect x="45" y="24" width="190" height="34" rx="4" fill="#eee9e5" stroke="#b8863b" stroke-width="1.5"/>
  <text x="140" y="38" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="800" letter-spacing="1" text-anchor="middle" fill="#171717">YTM STUDIO COMPANION</text>
  <text x="140" y="50" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" letter-spacing="0.5" text-anchor="middle" fill="#d45d2a">440+ EXTENSION USERS • PRO v2.1</text>
</svg>'''
    out_dir = os.path.join(os.path.dirname(__file__), "..", "app", "static", "cutouts")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "splice-badge.svg")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"✓ Generated {out_path}")

def main():
    print("🎨 Generating Editorial-Tactile Assets...")
    generate_live_grain()
    generate_vu_meter_svg()
    generate_tuning_fork_svg()
    generate_splice_badge_svg()
    print("✨ All tactile assets generated successfully.")

if __name__ == "__main__":
    main()
