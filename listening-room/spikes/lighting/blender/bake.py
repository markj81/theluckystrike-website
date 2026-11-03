"""Lighting spike: procedural room, one baked lightmap per lamp.

Deps: pip install bpy==5.2.3 numpy pillow pyoidn   (Python 3.13; Blender runs headless)\nRun:  python bake.py [--size 1024] [--samples 256]
Out:  ../public/room.glb, ../public/lm_<lamp>.png (RGBM), ../public/lamps.json
Each lightmap is irradiance from ONE lamp in white light. The viewer sums them
with per-lamp dimmer and colour, which is valid because light is additive.
"""
import bpy, bmesh, math, random, json, sys, os, time
import numpy as np
from mathutils import Vector
from PIL import Image
import pyoidn  # Intel Open Image Denoise, with its dedicated lightmap filter

args = dict(zip(sys.argv[1::2], sys.argv[2::2]))
SIZE = int(args.get('--size', 1024))
SAMPLES = int(args.get('--samples', 256))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 4
scene.world = bpy.data.worlds.new('Black')
scene.world.color = (0, 0, 0)

# ---------- materials ----------
def mat(name, color, rough=0.8, metal=0.0, emit=None):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = 0.0  # driven live in viewer
    return m

def srgb(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

M = dict(
    plaster=mat('Plaster', srgb('#d9d2c5'), 0.95),
    ceiling=mat('Ceiling', srgb('#e6e1d8'), 0.95),
    floor=mat('Oak', srgb('#6b4a32'), 0.45),
    rug=mat('Rug', srgb('#8a4b38'), 1.0),
    walnut=mat('Walnut', srgb('#4a3021'), 0.5),
    shelf=mat('ShelfWhite', srgb('#c9c3b8'), 0.6),
    sofa=mat('Sofa', srgb('#3f4a3c'), 1.0),
    black=mat('DeckBlack', srgb('#1a1a1a'), 0.4),
    alu=mat('Alu', srgb('#b9b9b9'), 0.35, 1.0),
    rubber=mat('Slipmat', srgb('#101010'), 0.9),
    pot=mat('Terracotta', srgb('#a0583c'), 0.9),
    leaf=mat('Leaf', srgb('#2f5a2a'), 0.6),
    brass=mat('Brass', srgb('#b08d57'), 0.3, 1.0),
    frame=mat('WindowFrame', srgb('#2b2b2b'), 0.5),
)
SLEEVES = [srgb(h) for h in ('#e8e2d0', '#1d1d1d', '#c23b22', '#d9a441', '#2e5c8a', '#6d8a5b',
                              '#efefef', '#8c2f5e', '#3a3a3a', '#d46a43', '#5b4a8a', '#b8b0a0')]
SLEEVE_MATS = [mat(f'Sleeve{i}', c, 0.55) for i, c in enumerate(SLEEVES)]

static = []  # objects that get joined + baked

def box(name, size, loc, m, bevel=0.006, rot_z=0.0, keep=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    o.rotation_euler.z = rot_z
    bpy.ops.object.transform_apply(scale=True, rotation=True, location=False)
    if bevel:
        mod = o.modifiers.new('bevel', 'BEVEL'); mod.width = bevel; mod.segments = 2
    o.data.materials.append(m)
    if not keep: static.append(o)
    return o

def cyl(name, r, h, loc, m, verts=48, keep=False, rot=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts)
    o = bpy.context.active_object; o.name = name
    if rot: o.rotation_euler = rot
    o.data.materials.append(m)
    if not keep: static.append(o)
    return o

# ---------- room shell: 5 x 4 x 2.7 m, window in back wall ----------
W, D, H, T = 5.0, 4.0, 2.7, 0.12
box('Floor', (W, D, T), (0, 0, -T / 2), M['floor'], 0)
box('Ceiling', (W, D, T), (0, 0, H + T / 2), M['ceiling'], 0)
box('WallL', (T, D, H), (-W / 2 - T / 2, 0, H / 2), M['plaster'], 0)
box('WallR', (T, D, H), (W / 2 + T / 2, 0, H / 2), M['plaster'], 0)
box('WallF', (W + 2 * T, T, H), (0, -D / 2 - T / 2, H / 2), M['plaster'], 0)
wx0, wx1, wz0, wz1 = 0.3, 1.9, 0.85, 2.25  # window opening
by = D / 2 + T / 2
box('WallB_left', (wx0 + W / 2 + T, T, H), ((wx0 - W / 2 - T) / 2, by, H / 2), M['plaster'], 0)
box('WallB_right', (W / 2 + T - wx1, T, H), ((wx1 + W / 2 + T) / 2, by, H / 2), M['plaster'], 0)
box('WallB_below', (wx1 - wx0, T, wz0), ((wx0 + wx1) / 2, by, wz0 / 2), M['plaster'], 0)
box('WallB_above', (wx1 - wx0, T, H - wz1), ((wx0 + wx1) / 2, by, (wz1 + H) / 2), M['plaster'], 0)
# frame + mullion + sill
cx = (wx0 + wx1) / 2
box('Sill', (wx1 - wx0 + 0.1, 0.22, 0.04), (cx, D / 2 - 0.02, wz0), M['frame'])
box('Mullion', (0.04, 0.05, wz1 - wz0), (cx, D / 2 + 0.04, (wz0 + wz1) / 2), M['frame'])
box('Transom', (wx1 - wx0, 0.05, 0.04), (cx, D / 2 + 0.04, wz0 + (wz1 - wz0) * 0.68), M['frame'])
# skirting
for n, s, l in (('SkirtL', (0.02, D, 0.1), (-W / 2 + 0.01, 0, 0.05)),
                ('SkirtR', (0.02, D, 0.1), (W / 2 - 0.01, 0, 0.05)),
                ('SkirtF', (W, 0.02, 0.1), (0, -D / 2 + 0.01, 0.05))):
    box(n, s, l, M['shelf'], 0.003)

# ---------- rug + sofa (left wall) ----------
box('Rug', (2.6, 1.8, 0.012), (-0.9, -0.2, 0.006), M['rug'], 0.004)
sx = -W / 2 + 0.48
box('SofaBase', (0.9, 2.1, 0.42), (sx, -0.3, 0.21), M['sofa'], 0.04)
box('SofaBack', (0.22, 2.1, 0.45), (sx - 0.34, -0.3, 0.62), M['sofa'], 0.06)
box('SofaArmA', (0.9, 0.2, 0.25), (sx, -0.3 - 1.05 + 0.1, 0.55), M['sofa'], 0.06)
box('SofaArmB', (0.9, 0.2, 0.25), (sx, -0.3 + 1.05 - 0.1, 0.55), M['sofa'], 0.06)
for i, y in enumerate((-0.82, -0.3, 0.22)):
    box(f'Cushion{i}', (0.7, 0.5, 0.12), (sx + 0.05, y, 0.48), M['sofa'], 0.05)

# ---------- record shelf: 4x4 cube unit on back wall ----------
cell, th, dep = 0.37, 0.02, 0.39
n = 4
sw = n * cell + (n + 1) * th
shx, shy = -1.3, D / 2 - dep / 2 - 0.01
z0 = 0.05
for i in range(n + 1):
    off = i * (cell + th)
    box(f'ShelfH{i}', (sw, dep, th), (shx, shy, z0 + off + th / 2), M['shelf'], 0.002)
    box(f'ShelfV{i}', (th, dep, sw), (shx - sw / 2 + off + th / 2, shy, z0 + sw / 2), M['shelf'], 0.002)
box('ShelfBack', (sw, 0.005, sw), (shx, D / 2 - 0.012, z0 + sw / 2), M['shelf'], 0)
for r in range(n):
    for c in range(n):
        x0 = shx - sw / 2 + th + c * (cell + th)
        zb = z0 + th + r * (cell + th)
        count = random.randint(14, 26)
        if random.random() < 0.12: continue  # a few empty cubbies read as real
        tk = (cell - 0.01) / 30
        for k in range(count):
            x = x0 + 0.006 + tk * k + tk / 2
            s = box(f'Rec{r}{c}{k}', (tk * 0.92, 0.315, 0.315), (x, shy + 0.02, zb + 0.158),
                    random.choice(SLEEVE_MATS), 0)

# ---------- DJ table on right wall ----------
tx = W / 2 - 0.42
box('TableTop', (0.7, 1.9, 0.045), (tx, -0.4, 0.9), M['walnut'], 0.008)
for dx in (-0.3, 0.3):
    for dy in (-1.28, 0.48):
        box(f'Leg{dx}{dy}', (0.04, 0.04, 0.88), (tx + dx, dy, 0.44), M['black'], 0.004)
box('TableShelf', (0.62, 1.82, 0.025), (tx, -0.4, 0.3), M['walnut'], 0.006)
for i, dy in enumerate((-1.02, 0.22)):  # two decks, rotated to face the room (-x)
    box(f'Deck{i}', (0.36, 0.45, 0.11), (tx, dy, 0.98), M['black'], 0.01)
    cyl(f'Platter{i}', 0.15, 0.018, (tx, dy + 0.03, 1.045), M['alu'])
    cyl(f'Mat{i}', 0.147, 0.004, (tx, dy + 0.03, 1.056), M['rubber'])
    cyl(f'Spindle{i}', 0.004, 0.02, (tx, dy + 0.03, 1.06), M['alu'], 12)
    box(f'Arm{i}', (0.012, 0.22, 0.012), (tx - 0.12, dy + 0.1, 1.07), M['alu'], 0.002, rot_z=0.25)
box('Mixer', (0.32, 0.26, 0.1), (tx, -0.4, 0.975), M['black'], 0.008)
for k in range(4):
    cyl(f'Knob{k}', 0.012, 0.02, (tx - 0.08 + k * 0.05, -0.47, 1.035), M['alu'], 16)
box('Xfader', (0.012, 0.03, 0.015), (tx + 0.09, -0.4, 1.03), M['alu'], 0.002)

# ---------- floor lamp + side table by the sofa ----------
fx, fy = -W / 2 + 0.35, 1.12
cyl('FloorLampBase', 0.14, 0.025, (fx, fy, 0.012), M['brass'])
cyl('FloorLampPole', 0.012, 1.45, (fx, fy, 0.74), M['brass'], 16)
shade = cyl('EMIT_floor', 0.2, 0.28, (fx, fy, 1.52), M['shelf'], 48, keep=True)
shade.data.materials[0] = mat('Linen', srgb('#efe6d2'), 1.0, emit=srgb('#ffd8a0'))
bpy.ops.object.mode_set(mode='EDIT'); bm = bmesh.from_edit_mesh(shade.data)
for f in [f for f in bm.faces if abs(f.normal.z) > 0.9]: bm.faces.remove(f)
bmesh.update_edit_mesh(shade.data); bpy.ops.object.mode_set(mode='OBJECT')
shade.modifiers.new('solid', 'SOLIDIFY').thickness = 0.004
cyl('SideTable', 0.22, 0.02, (-W / 2 + 0.45, -1.62, 0.55), M['walnut'])
cyl('SideTableLeg', 0.02, 0.54, (-W / 2 + 0.45, -1.62, 0.27), M['black'], 16)

# ---------- plant by the window ----------
px, py = 2.05, 1.55
cyl('Pot', 0.17, 0.32, (px, py, 0.16), M['pot'])
for i in range(9):
    a = i / 9 * math.tau
    rr = 0.12 + random.random() * 0.12
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.16 + random.random() * 0.08,
        location=(px + math.cos(a) * rr, py + math.sin(a) * rr * 0.7, 0.55 + random.random() * 0.6))
    o = bpy.context.active_object; o.name = f'Leaf{i}'; o.scale.z = 1.3
    o.data.materials.append(M['leaf']); static.append(o)

# ---------- desk lamp (anglepoise-ish) on the table ----------
dlx, dly = tx + 0.15, 0.9
cyl('DeskLampBase', 0.08, 0.02, (dlx, dly, 0.93), M['black'])
box('DeskLampArm1', (0.015, 0.015, 0.45), (dlx, dly - 0.08, 1.14), M['black'], 0.003)
box('DeskLampArm2', (0.015, 0.4, 0.015), (dlx - 0.05, dly - 0.3, 1.36), M['black'], 0.003, rot_z=0.15)
dshade = cyl('EMIT_desk', 0.07, 0.14, (dlx - 0.1, dly - 0.52, 1.3), M['black'], 32, keep=True)
dshade.data.materials[0] = mat('DeskShade', srgb('#1c1c1c'), 0.5, emit=srgb('#ffe2b8'))

# ---------- pendant globe ----------
cyl('PendantCord', 0.003, 0.5, (0.2, -0.2, H - 0.25), M['black'], 8)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(0.2, -0.2, H - 0.62), segments=48, ring_count=24)
globe = bpy.context.active_object; globe.name = 'EMIT_pendant'
globe.data.materials.append(mat('Opal', srgb('#f4f1ea'), 0.3, emit=srgb('#fff0dc')))
bpy.ops.object.shade_smooth()
globe.visible_shadow = False  # the bulb sits inside; don't let the globe block it in the bake

# window "sky" card outside the glass
bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, D / 2 + 0.6, (wz0 + wz1) / 2))
sky = bpy.context.active_object; sky.name = 'EMIT_window'
sky.rotation_euler.x = math.pi / 2; sky.scale = (3.2, 2.4, 1)
sky.data.materials.append(mat('Sky', (0.6, 0.7, 0.85), 1.0, emit=(0.75, 0.85, 1.0)))
sky.visible_shadow = False; sky.visible_diffuse = False; sky.visible_glossy = False

# ---------- lamps (each = one light group / lightmap) ----------
def light(name, kind, loc, power, **kw):
    d = bpy.data.lights.new(name, kind); d.energy = power; d.color = (1, 1, 1)
    for k, v in kw.items(): setattr(d, k, v)
    o = bpy.data.objects.new(name, d); o.location = loc
    scene.collection.objects.link(o)
    return o

lamps = {
    'pendant': light('LAMP_pendant', 'POINT', (0.2, -0.2, H - 0.62), 55, shadow_soft_size=0.05),
    'floor': light('LAMP_floor', 'POINT', (fx, fy, 1.5), 45, shadow_soft_size=0.04),
    'desk': light('LAMP_desk', 'SPOT', (dlx - 0.1, dly - 0.52, 1.25), 30, spot_size=math.radians(75),
                  spot_blend=0.6, shadow_soft_size=0.03),
    'window': light('LAMP_window', 'AREA', (cx, D / 2 + 0.25, (wz0 + wz1) / 2), 260,
                    shape='RECTANGLE', size=wx1 - wx0, size_y=wz1 - wz0),
}
lamps['desk'].rotation_euler = (math.radians(12), 0, 0)
lamps['window'].rotation_euler = (math.radians(-90 + 18), 0, 0)  # looking in, slightly down

# ---------- join statics, build UV0 + UV2 ----------
bpy.ops.object.select_all(action='DESELECT')
for o in static:
    o.select_set(True)
bpy.context.view_layer.objects.active = static[0]
bpy.ops.object.convert(target='MESH')  # applies bevels
bpy.ops.object.join()
room = bpy.context.active_object; room.name = 'Room'
for o in (shade,):
    bpy.context.view_layer.objects.active = o; bpy.ops.object.convert(target='MESH')
bpy.context.view_layer.objects.active = room
# Exactly two UV sets so glTF writes TEXCOORD_0 (textures) and TEXCOORD_1 (lightmap)
while len(room.data.uv_layers) > 1:
    room.data.uv_layers.remove(room.data.uv_layers[-1])
room.data.uv_layers[0].name = 'UV0'
uv2 = room.data.uv_layers.new(name='UV2')
assert [l.name for l in room.data.uv_layers] == ['UV0', 'UV2']
room.data.uv_layers.active = uv2
bpy.ops.object.select_all(action='DESELECT'); room.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
t = time.time()
bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, area_weight=0.0, scale_to_bounds=False)
bpy.ops.uv.pack_islands(margin=0.004, rotate=True, shape_method='CONCAVE')
bpy.ops.object.mode_set(mode='OBJECT')
print(f'UV2 unwrap {time.time() - t:.1f}s, tris {sum(len(p.vertices) - 2 for p in room.data.polygons)}')

# ---------- bake one lightmap per lamp ----------
img = bpy.data.images.new('LM', SIZE, SIZE, float_buffer=True, alpha=False)
for m in room.data.materials:
    nt = m.node_tree
    node = nt.nodes.new('ShaderNodeTexImage'); node.image = img; node.name = 'BAKE'
    nt.nodes.active = node
scene.render.bake.margin = 6
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = True
scene.render.bake.use_pass_color = False
bpy.context.view_layer.objects.active = room
room.select_set(True)

def save_rgbm(pix, path, rng=8.0):
    a = pix.reshape(SIZE, SIZE, 4)[::-1, :, :3]  # Blender is bottom-up; flip to glTF convention
    a = np.clip(a, 0, None) ** (1 / 2.2)  # perceptual space before 8-bit to avoid dark banding
    m = np.clip(a.max(axis=2) / rng, 1e-6, 1)
    m = np.ceil(m * 255) / 255
    rgb = np.clip(a / (m[..., None] * rng), 0, 1)
    out = np.dstack([rgb, m]) * 255
    Image.fromarray(np.round(out).astype(np.uint8), 'RGBA').save(path, optimize=True)

meta = {}
for name, lo in lamps.items():
    for other in lamps.values():
        other.hide_render = other is not lo
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, use_clear=True, margin=6)
    pix = np.empty(SIZE * SIZE * 4, np.float32); img.pixels.foreach_get(pix)
    rgba = pix.reshape(SIZE, SIZE, 4)
    rgba[..., :3] = pyoidn.denoise(np.ascontiguousarray(rgba[..., :3]), filter_type='RTLightmap')
    save_rgbm(pix, os.path.join(OUT, f'lm_{name}.png'))
    meta[name] = dict(position=list(lo.location), peak=float(np.percentile(pix[0::4], 99.5)))
    print(f'baked {name} in {time.time() - t:.0f}s')
for lo in lamps.values():
    lo.hide_render = False

# ---------- export ----------
for m in room.data.materials:  # drop bake node so the exporter doesn't embed the image
    m.node_tree.nodes.remove(m.node_tree.nodes['BAKE'])
bpy.data.objects.remove(globe.parent) if globe.parent else None
bpy.ops.object.select_all(action='DESELECT')
for o in (room, shade, dshade, globe, sky):
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'room.glb'), export_format='GLB',
                          use_selection=True, export_apply=True, export_lights=False,
                          export_yup=True, export_texcoords=True, export_normals=True)
json.dump(dict(size=SIZE, samples=SAMPLES, rgbmRange=8.0, lamps=meta),
          open(os.path.join(OUT, 'lamps.json'), 'w'), indent=2)
print('done')
