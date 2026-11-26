## Yüzen nesne (gemi, kayık, fıçı). Node3D'ye takılır; "deniz" alanına Deniz düğümü verilir.
## Nesneyi su yüksekliğine oturtur ve dalganın eğimine göre yumuşakça yatırır.
extends Node3D

@export var deniz: Deniz
@export var su_cekimi := 0.3        ## gövdenin suya gömülen kısmı (metre)
@export var yatma := 0.6            ## 0 = hiç yatmaz, 1 = dalgaya tam uyar
@export var yumusaklik := 3.0       ## büyüdükçe daha çabuk uyar

func _process(delta: float) -> void:
	if deniz == null:
		return
	var p := global_position
	var hedef_y := deniz.yukseklik(p.x, p.z) - su_cekimi
	p.y = lerpf(p.y, hedef_y, clampf(delta * yumusaklik, 0.0, 1.0))
	global_position = p
	var n := Vector3.UP.lerp(deniz.normal(p.x, p.z), yatma).normalized()
	var ileri := -global_transform.basis.z
	var sag := ileri.cross(n).normalized()
	ileri = n.cross(sag).normalized()
	var hedef := Basis(sag, n, -ileri)
	global_transform.basis = global_transform.basis.slerp(hedef, clampf(delta * yumusaklik, 0.0, 1.0)).orthonormalized()
