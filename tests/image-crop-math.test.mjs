import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { clampCropOffset, coverScale, cropSourceRect } from "../src/lib/image-crop-math.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("coverScale choisit la dimension la plus contraignante (équivalent background-size: cover), pour ne jamais laisser d'espace vide dans un cadre carré", () => {
  assert.equal(coverScale(1000, 500, 288), 288 / 500, "image plus large que haute : la hauteur est la dimension contraignante");
  assert.equal(coverScale(500, 1000, 288), 288 / 500, "image plus haute que large : la largeur est la dimension contraignante");
  assert.equal(coverScale(400, 400, 288), 288 / 400, "image carrée : les deux dimensions donnent la même échelle");
});

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${message} (actual=${actual}, expected=${expected})`);
}

test("cropSourceRect à l'échelle de couverture et sans déplacement retourne un carré centré exact (aucun étirement)", () => {
  const scale = coverScale(1000, 500, 288);
  const { sx, sy, size } = cropSourceRect({ x: 0, y: 0 }, scale, 1000, 500, 288);
  assertClose(size, 500, "le carré source fait exactement la dimension la plus petite de l'image");
  assertClose(sx, 250, "centré horizontalement : 250px de marge de chaque côté sur les 1000px de large");
  assertClose(sy, 0, "aucune marge verticale : la hauteur correspond déjà exactement au cadre");
});

test("cropSourceRect suit le déplacement (offset) proportionnellement à l'échelle", () => {
  const scale = coverScale(1000, 500, 288);
  const { sx } = cropSourceRect({ x: 72, y: 0 }, scale, 1000, 500, 288);
  assertClose(sx, 250 - 72 / scale, "un déplacement positif de l'image vers la droite révèle la partie gauche de l'image (sx diminue)");
});

test("clampCropOffset : aucune marge disponible sur la dimension déjà exactement ajustée au cadre (bord à bord, sans espace vide)", () => {
  const scale = coverScale(1000, 500, 288);
  const clamped = clampCropOffset({ x: 0, y: 999 }, scale, 1000, 500, 288);
  assert.equal(clamped.y, 0, "la hauteur correspond déjà exactement au cadre à l'échelle de couverture : aucun déplacement vertical possible sans révéler du vide");
});

test("clampCropOffset : la marge disponible sur la dimension en excès correspond exactement au débordement de l'image", () => {
  const scale = coverScale(1000, 500, 288);
  const maxX = (1000 * scale - 288) / 2;
  assert.deepEqual(clampCropOffset({ x: 10000, y: 0 }, scale, 1000, 500, 288), { x: maxX, y: 0 }, "borné à la marge maximale, jamais au-delà");
  assert.deepEqual(clampCropOffset({ x: -10000, y: 0 }, scale, 1000, 500, 288), { x: -maxX, y: 0 });
});

test("clampCropOffset : une image carrée dans un cadre carré à l'échelle de couverture n'a aucune marge de déplacement", () => {
  const scale = coverScale(400, 400, 288);
  assert.deepEqual(clampCropOffset({ x: 50, y: 50 }, scale, 400, 400, 288), { x: 0, y: 0 });
});

test("PhotoUploader propose « Recadrer » sur une photo déjà enregistrée, en plus du remplacement complet, et ouvre le même ImageCropperDialog après une nouvelle sélection de fichier", async () => {
  const source = await read("src/components/ui/PhotoUploader.tsx");
  assert.match(source, /import \{ ImageCropperDialog \} from "@\/components\/ui\/ImageCropperDialog";/);
  assert.match(source, /onClick={\(\) => setCropSource\(photoDataUrl\)}[^>]*>Recadrer</, "recadrer la photo déjà enregistrée, sans repasser par un nouvel upload");
  assert.match(source, /setCropSource\(await readImageFileAsCompressedDataUrl\(file\)\);/, "une nouvelle sélection de fichier ouvre aussi le recadrage avant d'appeler onChange");
});

test("la fiche récap Contacts affiche l'e-mail et le téléphone de chaque contact, pas seulement sur la fiche détaillée", async () => {
  const source = await read("src/features/contacts/components/ContactsModule.tsx");
  assert.match(source, /contact\.email \? <span className="flex items-center gap-1 truncate"><AppIcon name="mail"/);
  assert.match(source, /contact\.phone \|\| contact\.mobile \? <span className="flex items-center gap-1 truncate"><AppIcon name="phone"/);
});
