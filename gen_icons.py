#!/usr/bin/env python3
"""Generate PWA icons for the Streek habit tracker (no external deps)."""
import struct, zlib, math, os

# Fun diagonal gradient: bright lime → deep emerald
C1    = (74, 222, 128)   # #4ade80  bright lime (top-left)
C2    = (21, 128,  61)   # #15803d  deep green  (bottom-right)
WHITE = (255, 255, 255)

def lerp(a, b, t):
    return (int(a[0] + (b[0] - a[0]) * t),
            int(a[1] + (b[1] - a[1]) * t),
            int(a[2] + (b[2] - a[2]) * t))

def draw_icon(size):
    # Precompute diagonal gradient lookup (index = x + y, range 0..2*(size-1))
    max_d = 2 * (size - 1)
    grad = [lerp(C1, C2, i / max_d) for i in range(max_d + 1)]

    # Fill entire square with gradient (no dark background or circle border)
    img = bytearray(size * size * 3)
    for y in range(size):
        base = y * size * 3
        for x in range(size):
            c = grad[x + y]
            i = base + x * 3
            img[i] = c[0]; img[i+1] = c[1]; img[i+2] = c[2]

    # ── White checkmark centered in the safe zone ────────────────────
    # Safe zone = inner 80% of icon. We map SVG "25,52 42,68 75,34"
    # (100×100 space) into a circle of radius = 33% of icon size.
    cx = cy = size // 2
    r  = size * 0.33

    def pt(px, py):
        return ((px - 50) / 50 * r + cx, (py - 50) / 50 * r + cy)

    p1, p2, p3 = pt(25, 52), pt(42, 68), pt(75, 34)
    sw_sq = (size * 0.065) ** 2   # stroke half-width squared

    def draw_seg(A, B):
        ax, ay = A; bx, by = B
        dx, dy = bx - ax, by - ay
        L_sq = dx * dx + dy * dy
        if L_sq == 0:
            return
        pad = math.sqrt(sw_sq) + 2
        xa = max(0, int(min(ax, bx) - pad))
        xb = min(size, int(max(ax, bx) + pad) + 1)
        ya = max(0, int(min(ay, by) - pad))
        yb = min(size, int(max(ay, by) + pad) + 1)
        for y in range(ya, yb):
            for x in range(xa, xb):
                t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / L_sq))
                d_sq = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2
                if d_sq <= sw_sq:
                    i = (y * size + x) * 3
                    img[i] = WHITE[0]; img[i+1] = WHITE[1]; img[i+2] = WHITE[2]

    draw_seg(p1, p2)
    draw_seg(p2, p3)
    return img


def write_png(path, size, img):
    def chunk(t, d):
        crc = zlib.crc32(t + d) & 0xFFFFFFFF
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', crc)

    stride = size * 3
    rows = bytearray()
    for y in range(size):
        rows += b'\x00'
        rows += img[y * stride:(y + 1) * stride]

    png = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(bytes(rows), 9))
        + chunk(b'IEND', b'')
    )
    with open(path, 'wb') as f:
        f.write(png)
    print(f'  {path}  ({size}×{size}, {os.path.getsize(path):,} bytes)')


print('Generating icons...')
for size, name in [(512, 'icon-512.png'), (192, 'icon-192.png')]:
    write_png(name, size, draw_icon(size))
print('Done!')
