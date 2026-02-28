#!/usr/bin/env python3
"""Generate PWA icons for the Streak habit tracker (no external deps)."""
import struct, zlib, math, os

BG    = (26, 26, 46)    # #1a1a2e  dark navy background
GREEN = (34, 197, 94)   # #22c55e  green circle
WHITE = (255, 255, 255) # white checkmark

def draw_icon(size):
    img = bytearray(bytes(BG) * (size * size))   # fill background

    cx = cy = size // 2
    r = size * 0.385        # circle radius = 38.5% of icon size

    # ── Filled green circle ──────────────────────────────────────────
    y0 = max(0, int(cy - r) - 1)
    y1 = min(size, int(cy + r) + 2)
    x0 = max(0, int(cx - r) - 1)
    x1 = min(size, int(cx + r) + 2)
    r_sq = r * r

    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r_sq:
                i = (y * size + x) * 3
                img[i] = GREEN[0]; img[i+1] = GREEN[1]; img[i+2] = GREEN[2]

    # ── White checkmark (two line segments) ─────────────────────────
    # SVG source coords (100×100 space): "25,52 42,68 75,34"
    def pt(px, py):
        return ((px - 50) / 50 * r + cx, (py - 50) / 50 * r + cy)

    p1, p2, p3 = pt(25, 52), pt(42, 68), pt(75, 34)
    sw_sq = (r * 0.065) ** 2   # stroke half-width squared

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
        rows += b'\x00'                          # PNG filter byte (None)
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
