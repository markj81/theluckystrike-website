# Lighting spike

Proves the core lighting idea: bake one lightmap per lamp in Blender, mix them live in the browser.

- `blender/bake.py` builds a greybox room procedurally, bakes each lamp (Cycles, OIDN-denoised),
  and writes `public/room.glb`, `public/lm_<lamp>.png` (RGBM) and `public/lamps.json`.
- `index.html` loads them with three.js and sums the lightmaps in a patched `MeshStandardMaterial`,
  with per-lamp dimmer, colour temperature, dim-to-warm and filament lag.

```bash
pip install -r blender/requirements.txt   # Python 3.13
python blender/bake.py --size 1024 --samples 256
python3 -m http.server 8000                # open http://localhost:8000
```

Keys: `1`–`4` scenes, `L` toggles the panel, click a lamp to switch it. `?scene=Late%20night` picks
a start scene; `?still` renders three frames and stops (for headless screenshots).
