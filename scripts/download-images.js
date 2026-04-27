/**
 * Lab-Logistics — Bulk-Download von Produktbildern via Pexels API.
 *
 * Aufruf:   PEXELS_KEY=dein_key node scripts/download-images.js
 * Re-runs sind sicher: existierende Dateien werden übersprungen.
 *
 * Schreibt:
 *   - img/products/<name>.jpg   (Pexels „large"-Größe, ~940 px)
 *   - img/products/CREDITS.md   (Fotograf + Pexels-URL pro Datei)
 */

const fs = require('fs');
const path = require('path');

const KEY = process.env.PEXELS_KEY;
if (!KEY) {
  console.error('Fehler: Umgebungsvariable PEXELS_KEY ist nicht gesetzt.');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, '..', 'img', 'products');
fs.mkdirSync(OUT_DIR, { recursive: true });

// filename → search query (English; Pexels indexiert primär englisch)
const MAP = [
  // Hero & Featured (auch auf Produkte-Seite verwendet)
  ['wb-schwarz.jpg',                'black matte bathroom sink'],
  ['armatur-waschtisch.jpg',        'modern chrome bathroom faucet'],
  ['dusch-walk-in.jpg',             'walk in shower glass partition'],
  ['wb-eiche.jpg',                  'oak wood bathroom vanity'],
  ['armatur-regendusche.jpg',       'rainfall shower head'],
  ['so-vorhang.jpg',                'bathroom shower curtain modern'],

  // Bodenbeläge
  ['boden-paros.jpg',               'white marble floor tile'],
  ['boden-alanya.jpg',              'beige stone floor tile'],
  ['boden-ubeda-boden.jpg',         'grey ceramic floor tile'],
  ['boden-liverpool-boden.jpg',     'dark grey concrete floor tile'],
  ['boden-colima.jpg',              'terracotta floor tile'],
  ['boden-kampala.jpg',             'brown stone tile floor'],

  // Wandpaneele
  ['wand-ampara.jpg',               'white marble wall texture'],
  ['wand-liverpool-wand.jpg',       'grey concrete wall texture'],
  ['wand-hanoi.jpg',                'dark marble wall'],
  ['wand-ubeda-wand.jpg',           'beige limestone wall'],
  ['wand-zanzibar.jpg',             'black stone wall texture'],

  // Duschabtrennungen
  ['dusch-schwenkelement.jpg',      'pivot shower glass door'],
  ['dusch-faltwand.jpg',            'folding shower door'],
  ['dusch-schiebetuer.jpg',         'sliding glass shower door'],
  ['dusch-tuer.jpg',                'modern glass shower door'],
  ['dusch-doppelfluegeltuer.jpg',   'double glass shower door'],
  ['dusch-eckeinstieg.jpg',         'corner shower enclosure'],
  ['dusch-schiebetuereckeinstieg.jpg', 'corner sliding shower'],

  // Armaturen
  ['armatur-bidet.jpg',             'bidet faucet chrome'],
  ['armatur-haarwasch.jpg',         'pull out spray faucet'],
  ['armatur-mischbatterie.jpg',     'shower mixer valve chrome'],
  ['armatur-thermo.jpg',            'thermostatic shower valve'],
  ['armatur-badewanne.jpg',         'bathtub faucet chrome'],
  ['armatur-hochkant.jpg',          'tall vessel sink faucet'],
  ['armatur-brauseset.jpg',         'handheld shower set'],

  // Waschbecken
  ['wb-rund.jpg',                   'round white bathroom sink'],
  ['wb-klein.jpg',                  'small wall bathroom sink'],
  ['wb-eckig.jpg',                  'rectangular white bathroom sink'],
  ['wb-doppel.jpg',                 'double bathroom sink vanity'],
  ['wb-senior-60.jpg',              'accessible bathroom sink'],
  ['wb-senior-100.jpg',             'wheelchair accessible bathroom'],
  ['wb-fume.jpg',                   'grey wood bathroom vanity'],
  ['wb-weiss.jpg',                  'white glossy bathroom vanity'],

  // WCs & Bidets
  ['wc-wc1.jpg',                    'white toilet bowl bathroom'],
  ['wc-wc2.jpg',                    'modern white toilet'],
  ['wc-wc3.jpg',                    'ceramic toilet white'],
  ['wc-wc4.jpg',                    'white toilet design'],
  ['wc-wc5.jpg',                    'wall mounted toilet'],
  ['wc-wc6.jpg',                    'wall hung toilet modern'],
  ['wc-bidet1.jpg',                 'wall mounted bidet'],
  ['wc-bidet2.jpg',                 'floor standing bidet'],

  // Spülkästen / Druckspüler
  ['sp-spuelkasten.jpg',            'toilet cistern tank'],
  ['sp-druck1.jpg',                 'toilet flush button'],
  ['sp-druck2.jpg',                 'chrome toilet flush plate'],
  ['sp-vorbau.jpg',                 'concealed cistern toilet frame'],

  // Haltegriffe
  ['hg-griff.jpg',                  'bathroom grab bar'],
  ['hg-saugnapf.jpg',               'shower suction handle'],
  ['hg-klappbar.jpg',               'folding grab bar toilet'],
  ['hg-toilette.jpg',               'toilet support frame'],

  // Sonstiges & Zubehör
  ['so-badewanne.jpg',              'freestanding bathtub white'],
  ['so-klappsitz.jpg',              'shower folding seat'],
  ['so-duschstuhl.jpg',             'shower chair adjustable'],
  ['so-ablage.jpg',                 'bathroom shelf chrome'],
  ['so-abzieher.jpg',               'shower squeegee'],
  ['so-schlauch.jpg',               'shower hose chrome'],
  ['so-bidetdusche.jpg',            'bidet sprayer hand shower'],
  ['so-ventil.jpg',                 'water valve plumbing'],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

const usedPhotoIds = new Set();

async function searchPexels(query) {
  // Mehr Treffer holen, damit wir Bild-IDs überspringen können, die schon verwendet wurden
  // (sonst dominiert ein einzelner Bath-Fotograf alle Suchen).
  const tryFetch = async (orient) => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20${orient ? '&orientation=' + orient : ''}`;
    const res = await fetch(url, { headers: { Authorization: KEY } });
    if (!res.ok) throw new Error(`Pexels search failed (${res.status}): ${query}`);
    return (await res.json()).photos || [];
  };

  let photos = await tryFetch('square');
  // Erstes ungenutztes Foto finden
  let pick = photos.find(p => !usedPhotoIds.has(p.id));
  if (!pick) {
    // Fallback ohne Orientation-Filter
    photos = await tryFetch(null);
    pick = photos.find(p => !usedPhotoIds.has(p.id));
  }
  if (pick) usedPhotoIds.add(pick.id);
  return pick || null;
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

(async () => {
  const credits = ['# Bildnachweise', '', 'Alle Bilder von [Pexels](https://www.pexels.com) — frei für kommerzielle Nutzung.', ''];
  let downloaded = 0, skipped = 0, failed = 0;

  for (const [filename, query] of MAP) {
    const dest = path.join(OUT_DIR, filename);
    if (fs.existsSync(dest)) {
      console.log(`  ⏭  ${filename}  (existiert bereits)`);
      skipped++;
      continue;
    }
    try {
      const photo = await searchPexels(query);
      if (!photo) {
        console.log(`  ✗  ${filename}  KEIN TREFFER für "${query}"`);
        failed++;
        continue;
      }
      const imgUrl = photo.src.large; // ~940 px breit, gute Web-Größe
      await downloadFile(imgUrl, dest);
      const sizeKb = Math.round(fs.statSync(dest).size / 1024);
      console.log(`  ✓  ${filename}  ${sizeKb} KB  ←  "${query}"  (Foto: ${photo.photographer})`);
      credits.push(`- **${filename}** — Foto: [${photo.photographer}](${photo.photographer_url}) · [Pexels-Quelle](${photo.url}) · Suchbegriff: \`${query}\``);
      downloaded++;
      await sleep(150); // sanft zur API
    } catch (err) {
      console.log(`  ✗  ${filename}  FEHLER: ${err.message}`);
      failed++;
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'CREDITS.md'), credits.join('\n') + '\n');

  console.log('');
  console.log(`Fertig: ${downloaded} geladen, ${skipped} übersprungen, ${failed} fehlgeschlagen.`);
  console.log(`Bilder in: ${OUT_DIR}`);
})();
