from pathlib import Path

from PIL import Image, ImageDraw


SIZE = 1024
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "icons"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def draw_grid(draw: ImageDraw.ImageDraw, color: str, step: int = 32) -> None:
    for position in range(0, SIZE, step):
        draw.line((position, 0, position, SIZE), fill=color, width=1)
        draw.line((0, position, SIZE, position), fill=color, width=1)


def rounded_tiles(
    draw: ImageDraw.ImageDraw,
    colors: list[str],
    radius: int = 132,
) -> list[tuple[int, int, int, int]]:
    margin, gap = 70, 22
    tile = (SIZE - margin * 2 - gap) // 2
    boxes = [
        (margin, margin, margin + tile, margin + tile),
        (margin + tile + gap, margin, SIZE - margin, margin + tile),
        (margin, margin + tile + gap, margin + tile, SIZE - margin),
        (margin + tile + gap, margin + tile + gap, SIZE - margin, SIZE - margin),
    ]
    for box, color in zip(boxes, colors):
        draw.rounded_rectangle(box, radius=radius, fill=color)
    return boxes


def draw_circle_mark(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    color: str,
) -> None:
    x0, y0, x1, y1 = box
    inset = int((x1 - x0) * 0.27)
    draw.ellipse((x0 + inset, y0 + inset, x1 - inset, y1 - inset), fill=color)


def draw_ring_mark(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    outer: str,
    inner: str,
) -> None:
    x0, y0, x1, y1 = box
    outer_inset = int((x1 - x0) * 0.18)
    inner_inset = int((x1 - x0) * 0.36)
    draw.ellipse(
        (x0 + outer_inset, y0 + outer_inset, x1 - outer_inset, y1 - outer_inset),
        fill=outer,
    )
    draw.ellipse(
        (x0 + inner_inset, y0 + inner_inset, x1 - inner_inset, y1 - inner_inset),
        fill=inner,
    )


def draw_check_mark(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    color: str,
) -> None:
    x0, y0, x1, y1 = box
    width = x1 - x0
    points = [
        (x0 + width * 0.22, y0 + width * 0.54),
        (x0 + width * 0.42, y0 + width * 0.72),
        (x0 + width * 0.79, y0 + width * 0.29),
    ]
    draw.line(points, fill=color, width=int(width * 0.105), joint="curve")


def draw_butterfly_mark(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    color: str,
) -> None:
    x0, y0, x1, y1 = box
    width = x1 - x0
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    draw.ellipse(
        (cx - width * 0.36, cy - width * 0.29, cx - width * 0.01, cy + width * 0.06),
        fill=color,
    )
    draw.ellipse(
        (cx + width * 0.01, cy - width * 0.29, cx + width * 0.36, cy + width * 0.06),
        fill=color,
    )
    draw.ellipse(
        (cx - width * 0.28, cy - width * 0.01, cx - width * 0.01, cy + width * 0.31),
        fill=color,
    )
    draw.ellipse(
        (cx + width * 0.01, cy - width * 0.01, cx + width * 0.28, cy + width * 0.31),
        fill=color,
    )


def make_imagine() -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), "#f4f4f1")
    draw = ImageDraw.Draw(image)
    draw_grid(draw, "#d9e0f7", 32)
    boxes = rounded_tiles(
        draw,
        ["#123fc8", "#0a2b9d", "#2f5ce0", "#123fc8"],
        radius=118,
    )
    draw_circle_mark(draw, boxes[0], "#f4f4f1")
    draw_butterfly_mark(draw, boxes[1], "#f4f4f1")
    draw_ring_mark(draw, boxes[2], "#f4f4f1", "#2f5ce0")
    draw_check_mark(draw, boxes[3], "#f4f4f1")
    return image


def make_industrial() -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), "#f0efe9")
    draw = ImageDraw.Draw(image)
    boxes = rounded_tiles(
        draw,
        ["#111111", "#ff5b3d", "#d8d7d1", "#ffffff"],
        radius=142,
    )
    draw_circle_mark(draw, boxes[0], "#f0efe9")
    draw_butterfly_mark(draw, boxes[1], "#111111")
    draw_ring_mark(draw, boxes[2], "#111111", "#d8d7d1")
    draw_check_mark(draw, boxes[3], "#111111")
    return image


def make_journal() -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), "#eceff2")
    draw = ImageDraw.Draw(image)
    boxes = rounded_tiles(
        draw,
        ["#35d0a0", "#f45fa7", "#ffb59a", "#ffffff"],
        radius=154,
    )
    draw_circle_mark(draw, boxes[0], "#0d533f")
    draw_butterfly_mark(draw, boxes[1], "#ffffff")
    draw_ring_mark(draw, boxes[2], "#171719", "#ffb59a")
    draw_check_mark(draw, boxes[3], "#171719")
    return image


def make_pixel() -> Image.Image:
    image = Image.new("RGB", (SIZE, SIZE), "#bfd9e5")
    draw = ImageDraw.Draw(image)
    boxes = rounded_tiles(
        draw,
        ["#315f38", "#173f27", "#52733f", "#254d2e"],
        radius=28,
    )
    cell = 24
    colors = ["#f0c419", "#ef5b72", "#d8e5a7"]
    for index, box in enumerate(boxes):
        x0, y0, x1, y1 = box
        for y in range(y0 + 18, y1 - 18, cell):
            for x in range(x0 + 18, x1 - 18, cell):
                tone = "#173f27" if (x // cell + y // cell + index) % 3 else "#6f8c52"
                draw.rectangle((x, y, x + cell - 3, y + cell - 3), fill=tone)
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        flower = colors[index % len(colors)]
        for dx, dy in [(-cell, 0), (cell, 0), (0, -cell), (0, cell)]:
            draw.rectangle(
                (
                    cx + dx - cell // 2,
                    cy + dy - cell // 2,
                    cx + dx + cell // 2,
                    cy + dy + cell // 2,
                ),
                fill=flower,
            )
        draw.rectangle(
            (
                cx - cell // 2,
                cy - cell // 2,
                cx + cell // 2,
                cy + cell // 2,
            ),
            fill="#0b2516",
        )
    draw_grid(draw, "#86a9a6", 32)
    return image


for skin, maker in {
    "imagine": make_imagine,
    "industrial": make_industrial,
    "journal": make_journal,
    "pixel": make_pixel,
}.items():
    master = maker()
    for output_size in (180, 192, 512):
        resized = master.resize((output_size, output_size), Image.Resampling.LANCZOS)
        resized.save(OUTPUT_DIR / f"{skin}-{output_size}.png", optimize=True)

