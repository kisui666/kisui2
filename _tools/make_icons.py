"""生成翁法罗斯项目图标 / 启动图（纯 Pillow 绘制，无外部素材）。
输出: static/logo.png, static/splash.png, static/logo-256.png
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(OUT, exist_ok=True)

BG0 = (11, 7, 20)
BG1 = (26, 18, 48)
GOLD = (242, 197, 114)
GOLD_D = (217, 155, 63)
MEM = (127, 212, 255)
TIDE = (160, 95, 224)
EMBER = (255, 138, 76)


def radial_bg(size, inner=BG1, outer=BG0, glow=(120, 70, 190)):
    img = Image.new("RGB", (size, size), outer)
    d = ImageDraw.Draw(img)
    cx = cy = size / 2
    steps = 96
    for i in range(steps, 0, -1):
        t = i / steps
        r = t * size * 0.78
        k = 1 - t
        col = tuple(
            int(outer[j] + (inner[j] - outer[j]) * (k ** 1.5)) for j in range(3)
        )
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    # 顶部紫色辉光
    glow_img = Image.new("RGB", (size, size), (0, 0, 0))
    gd = ImageDraw.Draw(glow_img)
    gr = size * 0.62
    gd.ellipse([cx - gr, cy - size * 0.95, cx + gr, cy - size * 0.05], fill=glow)
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(size * 0.13))
    return Image.blend(img, Image.blend(img, glow_img, 0.0), 0.0) if False else Image.composite(
        img, img, Image.new("L", (size, size), 0)
    ), glow_img


def make_logo(size=1024):
    img = Image.new("RGB", (size, size), BG0)
    d = ImageDraw.Draw(img)
    cx = cy = size / 2

    # 径向渐变底
    steps = 120
    for i in range(steps, 0, -1):
        t = i / steps
        r = t * size * 0.72
        k = 1 - t
        col = tuple(int(BG0[j] + (BG1[j] - BG0[j]) * (k ** 1.4)) for j in range(3))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

    # 紫色辉光
    glow = Image.new("RGB", (size, size), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = size * 0.60
    gd.ellipse([cx - gr, cy - size * 0.98, cx + gr, cy - size * 0.02], fill=(96, 52, 160))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.14))
    img = Image.blend(img, Image.new("RGB", (size, size), BG1), 0.0)
    img = Image.composite(glow, img, glow.convert("L").point(lambda v: min(255, int(v * 0.85))))
    d = ImageDraw.Draw(img)

    # 外圈：十二道刻痕（十二泰坦）
    R = size * 0.335
    tick_r0 = size * 0.365
    tick_r1 = size * 0.405
    for i in range(12):
        a = math.radians(i * 30 - 90)
        x0 = cx + math.cos(a) * tick_r0
        y0 = cy + math.sin(a) * tick_r0
        x1 = cx + math.cos(a) * tick_r1
        y1 = cy + math.sin(a) * tick_r1
        d.line([x0, y0, x1, y1], fill=GOLD_D, width=max(2, int(size * 0.006)))

    # 主环
    lw = max(2, int(size * 0.008))
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=GOLD, width=lw)
    R2 = size * 0.30
    d.ellipse([cx - R2, cy - R2, cx + R2, cy + R2], outline=(GOLD_D[0], GOLD_D[1], GOLD_D[2]), width=max(1, lw // 2))

    # 菱形（火种 / 权杖内核）
    def diamond(r, fill=None, outline=None, w=2):
        pts = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
        if fill:
            d.polygon(pts, fill=fill)
        if outline:
            d.line(pts + [pts[0]], fill=outline, width=w)

    # 中央火种：金色菱形 + 内部记忆蓝
    diamond(size * 0.115, fill=(58, 40, 12))
    diamond(size * 0.115, outline=GOLD, w=max(2, int(size * 0.008)))
    diamond(size * 0.062, fill=MEM)
    diamond(size * 0.062, outline=(220, 245, 255), w=max(1, int(size * 0.003)))

    # 内部十字光
    d.line([cx, cy - size * 0.155, cx, cy + size * 0.155], fill=(255, 236, 190), width=max(1, int(size * 0.004)))
    d.line([cx - size * 0.155, cy, cx + size * 0.155, cy], fill=(255, 236, 190), width=max(1, int(size * 0.004)))

    # 环绕的双螺旋点（黑潮 vs 黄金血）
    for i in range(24):
        a = math.radians(i * 15)
        rr = size * 0.235
        x = cx + math.cos(a) * rr
        y = cy + math.sin(a) * rr * 0.98
        col = TIDE if i % 2 else EMBER
        s = size * 0.007
        d.ellipse([x - s, y - s, x + s, y + s], fill=col)

    # 底部签名线（书页感）
    d.line([cx - size * 0.20, cy + size * 0.285, cx + size * 0.20, cy + size * 0.285],
           fill=(GOLD_D[0] // 2, GOLD_D[1] // 2, GOLD_D[2] // 2), width=max(1, int(size * 0.003)))

    return img


def make_splash(w=1242, h=2688):
    img = Image.new("RGB", (w, h), BG0)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        col = tuple(int(BG0[i] + (BG1[i] - BG0[i]) * (1 - t) * 0.9) for i in range(3))
        d.line([0, y, w, y], fill=col)
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = w * 0.7
    gd.ellipse([w / 2 - gr, h * 0.16 - gr, w / 2 + gr, h * 0.16 + gr], fill=(80, 44, 140))
    glow = glow.filter(ImageFilter.GaussianBlur(w * 0.15))
    img = Image.composite(glow, img, glow.convert("L").point(lambda v: min(255, int(v * 0.9))))
    logo = make_logo(int(w * 0.46)).resize((int(w * 0.46), int(w * 0.46)), Image.LANCZOS)
    img.paste(logo, (int((w - logo.width) / 2), int(h * 0.30)))
    return img


logo = make_logo(1024)
logo.save(os.path.join(OUT, "logo.png"))
logo.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, "logo-256.png"))
logo.resize((144, 144), Image.LANCZOS).save(os.path.join(OUT, "logo-144.png"))
make_splash().save(os.path.join(OUT, "splash.png"))
print("icons written to", OUT)
for f in sorted(os.listdir(OUT)):
    print("  ", f, os.path.getsize(os.path.join(OUT, f)), "bytes")
