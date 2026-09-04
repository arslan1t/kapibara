/**
 * Приводит обложки к одному виду для сетки каталога.
 *
 *   node scripts/flatten-covers.mjs ~/covers ~/more-covers
 *
 * Кладёт результат в public/images/books под теми же именами.
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";

/**
 * Вырезает лицевую сторону книги из 3D-макета.
 *
 * Часть обложек сгенерирована как плоская картинка, часть — как макет книги на
 * светлом фоне с корешком и мягкой тенью. В сетке каталога это давало товары
 * разного размера: у одних артворк во всю плитку, у других — в рамке из фона.
 *
 * Фон определяем по пикселям: почти белый и малонасыщенный. Границы книги — по
 * первой строке и столбцу, где таких пикселей меньше порога. Затем сдвигаем
 * рамку внутрь, чтобы срезать мягкую тень, и сильнее слева — там корешок.
 */
const SIZE = 1200;

function isBackground(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return min > 232 && max - min < 22;
}

async function faceOf(file) {
  const { data, info } = await sharp(file).resize(400, 400, { fit: "inside" })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const colBg = new Array(W).fill(0), rowBg = new Array(H).fill(0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i + 3] < 16 || isBackground(data[i], data[i + 1], data[i + 2])) {
        colBg[x]++; rowBg[y]++;
      }
    }
  }
  // Строка/столбец считается частью книги, если фон занимает менее 88%.
  const firstX = colBg.findIndex(v => v < H * 0.88);
  const lastX  = W - 1 - [...colBg].reverse().findIndex(v => v < H * 0.88);
  const firstY = rowBg.findIndex(v => v < W * 0.88);
  const lastY  = H - 1 - [...rowBg].reverse().findIndex(v => v < W * 0.88);

  if (firstX < 0 || firstY < 0 || lastX <= firstX || lastY <= firstY) return null;
  const frac = ((lastX - firstX) * (lastY - firstY)) / (W * H);
  // Плоская обложка занимает почти весь кадр — резать нечего.
  if (frac > 0.93) return null;

  return { x0: firstX / W, x1: lastX / W, y0: firstY / H, y1: lastY / H };
}

const DIR = "public/images/books";
await mkdir(DIR, { recursive: true });

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error("Укажите каталоги с исходными обложками.");
  process.exit(1);
}

for (const dir of dirs) {
  for (const f of (await readdir(dir)).filter((f) => /\.(png|jpe?g)$/i.test(f))) {
    const src = `${dir}/${f}`;
    const meta = await sharp(src).metadata();
    const box = await faceOf(src);

    let pipeline;
    if (!box) {
      pipeline = sharp(src);
      console.log(`  ${f.padEnd(24)} плоская — только масштаб`);
    } else {
      // Тень мягкая и тянется за книгу; корешок слева, а снизу она гуще.
      // Значения подобраны по результату, а не наугад.
      const left  = Math.round((box.x0 + 0.065) * meta.width);
      const right = Math.round((box.x1 - 0.030) * meta.width);
      const top   = Math.round((box.y0 + 0.028) * meta.height);
      const bot   = Math.round((box.y1 - 0.038) * meta.height);
      pipeline = sharp(src).extract({ left, top, width: right - left, height: bot - top });
      console.log(`  ${f.padEnd(24)} макет → вырезано ${right-left}×${bot-top}`);
    }

    await pipeline.resize(SIZE, SIZE, { fit: "cover", position: "centre" })
      .png({ palette: true, quality: 92, compressionLevel: 9 })
      .toFile(`${DIR}/${f}`);
  }
}
