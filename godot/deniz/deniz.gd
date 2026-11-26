## Deniz yüzeyi düğümü. deniz.gdshader'lı malzemesi olan MeshInstance3D'ye takılır.
## Her karede shader'a "zaman" yazar ve aynı dalga formülüyle su yüksekliğini hesaplar,
## böylece gemi, kayık ve yüzen nesneler dalgayla birlikte inip kalkabilir.
class_name Deniz
extends MeshInstance3D

var zaman := 0.0
var _mat: ShaderMaterial

## Hava durumuna göre deniz ayarları. hava("firtina", 20.0) gibi çağrılır; değerler verilen sürede yumuşakça geçer.
const HAVALAR := {
	# Açık, güneşli, sakin: turkuaz, dibi görünen su; küçük dalgacıklar, köpük yalnız kıyıda
	"sakin": {
		"dalga_1": Vector4(1.0, 0.25, 0.10, 18.0), "dalga_2": Vector4(0.6, 0.8, 0.08, 9.0),
		"dalga_3": Vector4(-0.3, 1.0, 0.06, 5.0), "dalga_4": Vector4(0.9, -0.5, 0.05, 2.5),
		"yukseklik_carpani": 0.45, "hiz": 0.8, "renk_sig": Color(0.16, 0.62, 0.60), "renk_derin": Color(0.02, 0.25, 0.36),
		"derinlik_olcegi": 0.12, "saydamlik_derinligi": 5.0, "kiyi_kopugu": 0.8, "tepe_kopugu": 0.0, "puruz": 0.04, "dalgacik_gucu": 0.5,
	},
	# Güneşli ama rüzgârlı: mavi, orta boy dalgalar, tepelerde az köpük
	"dalgali": {
		"dalga_1": Vector4(1.0, 0.25, 0.20, 34.0), "dalga_2": Vector4(0.7, 0.75, 0.16, 19.0),
		"dalga_3": Vector4(-0.3, 1.0, 0.12, 9.5), "dalga_4": Vector4(1.0, -0.6, 0.08, 4.5),
		"yukseklik_carpani": 1.0, "hiz": 1.0, "renk_sig": Color(0.10, 0.42, 0.48), "renk_derin": Color(0.015, 0.10, 0.20),
		"derinlik_olcegi": 0.18, "saydamlik_derinligi": 2.5, "kiyi_kopugu": 1.2, "tepe_kopugu": 0.25, "puruz": 0.06, "dalgacik_gucu": 0.7,
	},
	# Yağmurlu, kapalı: gri-yeşil, donuk yüzey (yağmur suyu pürüzlendirir), bulanık su
	"yagmur": {
		"dalga_1": Vector4(1.0, 0.25, 0.18, 30.0), "dalga_2": Vector4(0.7, 0.75, 0.15, 16.0),
		"dalga_3": Vector4(-0.3, 1.0, 0.12, 8.0), "dalga_4": Vector4(1.0, -0.6, 0.10, 3.5),
		"yukseklik_carpani": 0.8, "hiz": 1.0, "renk_sig": Color(0.17, 0.27, 0.27), "renk_derin": Color(0.03, 0.07, 0.09),
		"derinlik_olcegi": 0.35, "saydamlik_derinligi": 1.2, "kiyi_kopugu": 1.5, "tepe_kopugu": 0.2, "puruz": 0.25, "dalgacik_gucu": 1.2,
	},
	# Kış fırtınası: koyu çelik rengi, uzun ve yüksek dalgalar, bol köpük
	"firtina": {
		"dalga_1": Vector4(1.0, 0.2, 0.22, 60.0), "dalga_2": Vector4(0.8, 0.6, 0.17, 34.0),
		"dalga_3": Vector4(-0.2, 1.0, 0.12, 16.0), "dalga_4": Vector4(1.0, -0.5, 0.08, 7.0),
		"yukseklik_carpani": 1.6, "hiz": 1.2, "renk_sig": Color(0.12, 0.20, 0.22), "renk_derin": Color(0.015, 0.035, 0.05),
		"derinlik_olcegi": 0.4, "saydamlik_derinligi": 1.0, "kiyi_kopugu": 2.5, "tepe_kopugu": 0.4, "puruz": 0.18, "dalgacik_gucu": 1.0,
	},
}
@export_enum("sakin", "dalgali", "yagmur", "firtina") var baslangic_havasi := "sakin"
var _eski := {}
var _hedef := {}
var _gecis := 1.0
var _sure := 1.0

## Denizi verilen hava durumuna geçirir. sure: geçişin saniyesi (0 = hemen).
func hava(ad: String, sure := 10.0) -> void:
	if _mat == null or not HAVALAR.has(ad):
		return
	_hedef = HAVALAR[ad]
	_eski = {}
	for k in _hedef:
		_eski[k] = _mat.get_shader_parameter(k)
	_sure = maxf(sure, 0.001)
	_gecis = 0.0

func _ready() -> void:
	_mat = get_active_material(0) as ShaderMaterial
	if _mat == null:
		push_warning("Deniz: 0 numaralı malzeme deniz.gdshader'lı bir ShaderMaterial olmalı.")
		return
	hava(baslangic_havasi, 0.0)

func _process(delta: float) -> void:
	zaman += delta
	if _mat:
		_mat.set_shader_parameter("zaman", zaman)
		if _gecis < 1.0:
			_gecis = minf(1.0, _gecis + delta / _sure)
			var t := smoothstep(0.0, 1.0, _gecis)
			for k in _hedef:
				var a = _eski[k]
				var b = _hedef[k]
				if a == null:
					_mat.set_shader_parameter(k, b)
				elif a is Vector4:
					_mat.set_shader_parameter(k, (a as Vector4).lerp(b, t))
				elif a is Color or b is Color:
					var ca := a as Color if a is Color else Color(a.x, a.y, a.z)
					_mat.set_shader_parameter(k, ca.lerp(b, t))
				else:
					_mat.set_shader_parameter(k, lerpf(float(a), float(b), t))

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
