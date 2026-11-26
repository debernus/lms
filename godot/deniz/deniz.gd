## Deniz yüzeyi düğümü. deniz.gdshader'lı malzemesi olan MeshInstance3D'ye takılır.
## Her karede shader'a "zaman" yazar ve aynı dalga formülüyle su yüksekliğini hesaplar,
## böylece gemi, kayık ve yüzen nesneler dalgayla birlikte inip kalkabilir.
class_name Deniz
extends MeshInstance3D

var zaman := 0.0
var _mat: ShaderMaterial

func _ready() -> void:
	_mat = get_active_material(0) as ShaderMaterial
	if _mat == null:
		push_warning("Deniz: 0 numaralı malzeme deniz.gdshader'lı bir ShaderMaterial olmalı.")

func _process(delta: float) -> void:
	zaman += delta
	if _mat:
		_mat.set_shader_parameter("zaman", zaman)

## Dünya koordinatında (x, z) noktasındaki su yüzeyinin y değeri.
func yukseklik(x: float, z: float) -> float:
	if _mat == null:
		return global_position.y
	var hedef := Vector2(x, z)
	var q := hedef
	var y := 0.0
	# Gerstner dalgası noktaları yatayda da kaydırır; birkaç adımda doğru noktaya yaklaşılır.
	for _i in 3:
		var o := _kayma(q)
		q = hedef - Vector2(o.x, o.z)
		y = o.y
	return global_position.y + y

## Su yüzeyinin o noktadaki normali (nesneyi dalgaya göre yatırmak için).
func normal(x: float, z: float) -> Vector3:
	var e := 0.5
	var h := yukseklik(x, z)
	var hx := yukseklik(x + e, z)
	var hz := yukseklik(x, z + e)
	return Vector3(h - hx, e, h - hz).normalized()

func _kayma(xz: Vector2) -> Vector3:
	var carpan: float = _mat.get_shader_parameter("yukseklik_carpani")
	var t: float = zaman * float(_mat.get_shader_parameter("hiz"))
	var toplam := Vector3.ZERO
	for ad in ["dalga_1", "dalga_2", "dalga_3", "dalga_4"]:
		var d: Vector4 = _mat.get_shader_parameter(ad)
		var yon := Vector2(d.x, d.y).normalized()
		var k := TAU / d.w
		var c := sqrt(9.8 / k)
		var f := k * (yon.dot(xz) - c * t)
		var a := d.z * carpan / k
		toplam += Vector3(yon.x * a * cos(f), a * sin(f), yon.y * a * cos(f))
	return toplam
