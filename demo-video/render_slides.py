from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
SLIDES = ROOT / "slides"
SLIDES.mkdir(exist_ok=True)

W, H = 1280, 720
INK, PAPER, LIME, CORAL, MUTED = "#10110f", "#f1f0e9", "#d8ff4f", "#ff5d49", "#777970"
FONT = "/System/Library/Fonts/SFNS.ttf"
MONO = "/System/Library/Fonts/SFNSMono.ttf"

def font(size, mono=False):
    return ImageFont.truetype(MONO if mono else FONT, size)

def save(im, number):
    im.convert("RGB").save(SLIDES / f"{number:02d}.png", quality=96)

def header(d, eyebrow, number, dark=False):
    color = LIME if dark else INK
    d.text((54, 34), eyebrow, font=font(17, True), fill=color)
    d.text((1160, 34), f"{number:02d} / 06", font=font(16, True), fill=MUTED)

def cover():
    source = Image.open(ASSETS / "og.png").convert("RGB")
    save(source.resize((W, H), Image.Resampling.LANCZOS), 1)

def problem():
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im); header(d, "THE FAILURE MODE", 2)
    d.text((54, 116), "ONE BAD SIGNAL", font=font(70), fill=INK)
    d.text((54, 194), "SHOULD NOT MOVE FUNDS.", font=font(70), fill=CORAL)
    d.rectangle((54, 330, 588, 550), fill=INK)
    d.text((84, 360), "UNVERIFIED SOCIAL POST", font=font(16, True), fill=MUTED)
    d.text((84, 410), "$0.940", font=font(56, True), fill=PAPER)
    d.text((84, 486), "−600 BPS", font=font(20, True), fill=CORAL)
    d.text((655, 355), "EVIDENCE GATE", font=font(17, True), fill=MUTED)
    d.text((655, 405), "REJECTED", font=font(64), fill=INK)
    d.text((655, 490), "1 independent  ·  0 official", font=font(22, True), fill="#454741")
    save(im, 2)

def evidence():
    im = Image.new("RGB", (W, H), INK); d = ImageDraw.Draw(im); header(d, "INDEPENDENT CONFIRMATION", 3, True)
    d.text((54, 102), "THREE SOURCES. ONE POLICY.", font=font(60), fill=PAPER)
    rows = [("PROTOCOL ORACLE", "OFFICIAL", "$0.972"), ("DEX TWAP", "MARKET", "$0.968"), ("RISK COUNCIL", "OFFICIAL", "$0.971")]
    y = 242
    for name, kind, price in rows:
        d.line((54, y + 75, 1225, y + 75), fill="#41433e", width=2)
        d.text((54, y), name, font=font(24), fill=PAPER)
        d.text((430, y + 4), kind, font=font(15, True), fill=LIME if kind == "OFFICIAL" else MUTED)
        d.text((1005, y - 5), price, font=font(32, True), fill=PAPER)
        y += 105
    d.rectangle((54, 590, 1225, 670), fill="#282a26")
    d.text((78, 615), "MEDIAN CONFIRMED PRICE", font=font(16, True), fill=MUTED)
    d.text((1030, 608), "$0.971", font=font(34, True), fill=LIME)
    save(im, 3)

def console():
    source = Image.open(ASSETS / "site-full.png").convert("RGB")
    source = ImageEnhance.Contrast(source).enhance(1.04)
    top = min(590, max(0, source.height - 720))
    crop = source.crop((0, top, source.width, min(source.height, top + 900)))
    im = crop.resize((W, H), Image.Resampling.LANCZOS)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, W, 94), fill=(16, 17, 15, 245)); od.rectangle((0, 0, 14, 94), fill=LIME)
    od.text((42, 18), "POLICY → SIMULATION → EXECUTION", font=font(16, True), fill=LIME)
    od.text((42, 48), "Intent is persisted before KeeperHub broadcasts.", font=font(28), fill=PAPER)
    save(Image.alpha_composite(im.convert("RGBA"), overlay), 4)

def proof():
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im); header(d, "REAL ONCHAIN PROOF", 5)
    d.text((54, 104), "A HASH IS NOT ENOUGH.", font=font(62), fill=INK)
    d.text((54, 178), "THE RECEIPT MUST VERIFY.", font=font(62), fill=INK)
    fields = [("NETWORK", "BASE SEPOLIA · 84532"), ("WORKFLOW", "POLICY GATE → ESCAPE TRANSFER"), ("RECEIPT", "SUCCESS · VERIFIED TRUE"), ("BLOCK", "45,380,316"), ("GAS", "40,933 · SPONSORED")]
    y = 310
    for key, value in fields:
        d.text((62, y), key, font=font(15, True), fill=MUTED)
        d.text((420, y - 4), value, font=font(24, True), fill=INK)
        d.line((54, y + 42, 1220, y + 42), fill="#c8c8bf", width=1); y += 62
    d.text((62, 635), "0x2949e29d5aa0…3d3a32287c15", font=font(20, True), fill="#397d36")
    save(im, 5)

def close():
    im = Image.new("RGB", (W, H), INK); d = ImageDraw.Draw(im); header(d, "KEEPERGUARD", 6, True)
    d.text((54, 125), "EVIDENCE", font=font(92), fill=PAPER)
    d.text((54, 220), "BECOMES POLICY.", font=font(92), fill=PAPER)
    d.text((54, 347), "POLICY", font=font(92), fill=LIME)
    d.text((54, 442), "BECOMES PROOF.", font=font(92), fill=CORAL)
    d.text((58, 635), "BUILT FOR AGENTS ONCHAIN  ·  EXECUTED BY KEEPERHUB", font=font(18, True), fill=MUTED)
    save(im, 6)

cover(); problem(); evidence(); console(); proof(); close()
print(f"Rendered 6 slides to {SLIDES}")
