"""Bir fotoğraftan kabartma (rölyef) plaka GLB'si üretir.

  kullanım: python3 tools/kabartma.py <foto.png> <maske.png> <çıktı.glb> [genişlik_m] [adım_px]

Maske: nesnenin beyaz, arka planın siyah olduğu aynı boyutta resim. Ön yüz fotoğrafla kaplanır;
derinlik, kenardan içeri doğru kabaran bir kubbe ile fotoğrafın yumuşatılmış parlaklığından
tahmin edilir (gerçek ölçüm değildir). Plaka dik durur: ön yüz +Z, taban y = 0, x'te ortalı.
"""
import io, json, struct, sys
import numpy as np
from PIL import Image, ImageFilter

photo_path, mask_path, out_path = sys.argv[1:4]
WIDTH = float(sys.argv[4]) if len(sys.argv) > 4 else 0.3
STEP = int(sys.argv[5]) if len(sys.argv) > 5 else 3
BASE, DOME, DETAIL = 0.004, 0.007, 0.006  # arka kalınlık, kubbe ve ayrıntı yüksekliği (metre)

photo = Image.open(photo_path).convert('RGB')
W, H = photo.size
mask = np.asarray(Image.open(mask_path).convert('L')) > 127

# Kenara uzaklık (piksel, en çok 14): art arda aşındırma ile
dist = np.zeros((H, W)); cur = mask.copy()
for _ in range(14):
    dist += cur
    p = np.pad(cur, 1)
    cur = cur & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]
dome = np.sin(np.clip(dist / 14, 0, 1) * np.pi / 2)
lum = np.asarray(photo.convert('L').filter(ImageFilter.GaussianBlur(2.2))).astype(float) / 255
height = BASE + DOME * dome + DETAIL * lum * dome
height = np.asarray(Image.fromarray(np.clip(height / 0.02 * 255, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.0))) / 255 * 0.02

scale = WIDTH / W
xs, ys = np.arange(0, W, STEP), np.arange(0, H, STEP)
inside = mask[np.ix_(ys, xs)]
quad = inside[:-1, :-1] & inside[1:, :-1] & inside[:-1, 1:] & inside[1:, 1:]
node = -np.ones(inside.shape, int)
used = np.zeros(inside.shape, bool)
used[:-1, :-1] |= quad; used[1:, :-1] |= quad; used[:-1, 1:] |= quad; used[1:, 1:] |= quad
node[used] = np.arange(used.sum())
jj, ii = np.nonzero(used)
px, py = xs[ii], ys[jj]
bottom = py.max()
X = (px - W / 2) * scale; Y = (bottom - py) * scale; Z = height[py, px]
front = np.stack([X, Y, Z], 1)
uv = np.stack([px / (W - 1), py / (H - 1)], 1)
qj, qi = np.nonzero(quad)
a, b, c, d = node[qj, qi], node[qj, qi + 1], node[qj + 1, qi + 1], node[qj + 1, qi]
tris = np.concatenate([np.stack([a, d, c], 1), np.stack([a, c, b], 1)])
# Ön yüzün yumuşak normalleri
n = np.zeros_like(front)
fn = np.cross(front[tris[:, 1]] - front[tris[:, 0]], front[tris[:, 2]] - front[tris[:, 0]])
for k in range(3): np.add.at(n, tris[:, k], fn)
n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)

# Arka yüz ve kenar duvarları (düz renk)
back = front.copy(); back[:, 2] = 0
back_n = np.tile([0, 0, -1.0], (len(back), 1))
back_tris = tris[:, ::-1]
edges = {}
for t in tris:
    for k in range(3):
        e = (t[k], t[(k + 1) % 3]); r = (e[1], e[0])
        if r in edges: del edges[r]
        else: edges[e] = 1
sp, sn, st = [], [], []
for (u, v) in edges:
    p0, p1 = front[u], front[v]; q0, q1 = back[u], back[v]
    nn = np.cross(p1 - p0, [0, 0, -1.0]); nn /= max(np.linalg.norm(nn), 1e-12)
    base = len(sp); sp += [p0, p1, q1, q0]; sn += [nn] * 4
    st += [[base, base + 2, base + 1], [base, base + 3, base + 2]]
rim_p = np.concatenate([back, np.array(sp)]); rim_n = np.concatenate([back_n, np.array(sn)])
rim_t = np.concatenate([back_tris, np.array(st) + len(back)])

# Doku: arka plan pikselleri nesnenin ortalama rengine boyanır (kenarda arka plan sızmasın)
tex = np.asarray(photo).copy(); tex[~mask] = tex[mask].mean(0).astype('uint8')
buf = io.BytesIO(); Image.fromarray(tex).save(buf, 'PNG'); png = buf.getvalue()

chunks, views, accessors = [], [], []
def add(data, target=None):
    raw = data.tobytes() if hasattr(data, 'tobytes') else data
    off = sum(len(c) for c in chunks); chunks.append(raw + b'\0' * ((4 - len(raw) % 4) % 4))
    v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(raw)}
    if target: v['target'] = target
    views.append(v); return len(views) - 1
def acc(arr, kind, comp, target, minmax=False):
    arr = np.ascontiguousarray(arr, dtype='<f4' if comp == 5126 else '<u4')
    a_ = {'bufferView': add(arr, target), 'componentType': comp, 'count': len(arr) if kind != 'SCALAR' else arr.size, 'type': kind}
    if minmax: a_['min'] = arr.min(0).tolist(); a_['max'] = arr.max(0).tolist()
    accessors.append(a_); return len(accessors) - 1
prim0 = {'attributes': {'POSITION': acc(front, 'VEC3', 5126, 34962, True), 'NORMAL': acc(n, 'VEC3', 5126, 34962), 'TEXCOORD_0': acc(uv, 'VEC2', 5126, 34962)}, 'indices': acc(tris.reshape(-1), 'SCALAR', 5125, 34963), 'material': 0}
prim1 = {'attributes': {'POSITION': acc(rim_p, 'VEC3', 5126, 34962, True), 'NORMAL': acc(rim_n, 'VEC3', 5126, 34962)}, 'indices': acc(rim_t.reshape(-1), 'SCALAR', 5125, 34963), 'material': 1}
img_view = add(png)
gltf = {
    'asset': {'version': '2.0', 'generator': 'tools/kabartma.py'}, 'scene': 0, 'scenes': [{'nodes': [0]}],
    'nodes': [{'name': 'arma', 'children': [1, 2]}, {'name': 'on_yuz', 'mesh': 0}, {'name': 'arka_ve_kenar', 'mesh': 1}],
    'meshes': [{'primitives': [prim0]}, {'primitives': [prim1]}],
    'materials': [
        {'name': 'kabartma', 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0.35, 'roughnessFactor': 0.45}},
        {'name': 'arka', 'pbrMetallicRoughness': {'baseColorFactor': [0.22, 0.16, 0.06, 1], 'metallicFactor': 0.6, 'roughnessFactor': 0.6}},
    ],
    'textures': [{'source': 0, 'sampler': 0}], 'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
    'images': [{'bufferView': img_view, 'mimeType': 'image/png'}],
    'bufferViews': views, 'accessors': accessors, 'buffers': [{'byteLength': sum(len(c) for c in chunks)}],
}
js = json.dumps(gltf, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
binary = b''.join(chunks)
with open(out_path, 'wb') as f:
    f.write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(js) + 8 + len(binary)))
    f.write(struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(binary)) + b'BIN\0' + binary)
print(f'üçgen: ön {len(tris)}, arka ve kenar {len(rim_t)} | boyut {X.max() - X.min():.3f} x {Y.max():.3f} x {Z.max():.3f} m | {out_path}')
