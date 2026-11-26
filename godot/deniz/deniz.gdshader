// Deniz yüzeyi (Godot 4.x, Forward+). Dört Gerstner dalgasının toplamı; kıyıda açılan renk, köpük, ince dalgacıklar.
// Kullanım: bölünmüş bir PlaneMesh'e (örn. 400 x 400 m, 200 x 200 bölme) bu shader'lı ShaderMaterial verin.
// "zaman" değerini deniz.gd her karede yazar; böylece yüzen nesneler aynı dalgayı hesaplayabilir.
shader_type spatial;
render_mode world_vertex_coords, depth_draw_always, cull_back;

// Her dalga: (yön x, yön z, diklik 0..1, dalga boyu metre). Dikliklerin toplamı 1'i geçmesin.
uniform vec4 dalga_1 = vec4(1.0, 0.25, 0.20, 34.0);
uniform vec4 dalga_2 = vec4(0.7, 0.75, 0.16, 19.0);
uniform vec4 dalga_3 = vec4(-0.3, 1.0, 0.12, 9.5);
uniform vec4 dalga_4 = vec4(1.0, -0.6, 0.08, 4.5);
uniform float yukseklik_carpani = 1.0;
uniform float hiz = 1.0;
uniform float zaman = 0.0;

uniform vec3 renk_sig : source_color = vec3(0.10, 0.42, 0.44);
uniform vec3 renk_derin : source_color = vec3(0.015, 0.09, 0.16);
uniform vec3 renk_kopuk : source_color = vec3(0.92, 0.95, 0.96);
uniform float derinlik_olcegi = 0.18;      // büyüdükçe su daha çabuk koyulaşır
uniform float saydamlik_derinligi = 2.5;   // bu derinlikten sonra dip görünmez (metre)
uniform float kiyi_kopugu = 1.2;           // kıyı köpüğünün genişliği (metre)
uniform float tepe_kopugu = 0.3;           // dalga tepesi köpüğü: 0 = yok, 1 = çok
uniform float puruz = 0.06;

// İnce dalgacıklar: iki NoiseTexture2D (Seamless ve As Normal Map açık) verin; boş bırakılırsa etkisizdir.
uniform sampler2D dalgacik_a : hint_normal, repeat_enable, filter_linear_mipmap;
uniform sampler2D dalgacik_b : hint_normal, repeat_enable, filter_linear_mipmap;
uniform float dalgacik_olcegi = 0.06;
uniform float dalgacik_gucu = 0.6;
uniform sampler2D kopuk_dokusu : repeat_enable, filter_linear_mipmap; // isteğe bağlı gri gürültü

uniform sampler2D derinlik_dokusu : hint_depth_texture, repeat_disable, filter_nearest;

varying vec3 dunya;
varying float tepe;

void gerstner(vec4 d, vec2 xz, float t, inout vec3 p, inout vec3 teget, inout vec3 ikincil) {
	vec2 yon = normalize(d.xy);
	float k = 6.2831853 / d.w;
	float c = sqrt(9.8 / k);
	float f = k * (dot(yon, xz) - c * t);
	float q = d.z * yukseklik_carpani;
	float a = q / k;
	p.x += yon.x * a * cos(f);
	p.y += a * sin(f);
	p.z += yon.y * a * cos(f);
	teget += vec3(-yon.x * yon.x * q * sin(f), yon.x * q * cos(f), -yon.x * yon.y * q * sin(f));
	ikincil += vec3(-yon.x * yon.y * q * sin(f), yon.y * q * cos(f), -yon.y * yon.y * q * sin(f));
}

void vertex() {
	vec3 p = VERTEX;
	vec2 xz = VERTEX.xz;
	vec3 teget = vec3(1.0, 0.0, 0.0);
	vec3 ikincil = vec3(0.0, 0.0, 1.0);
	float t = zaman * hiz;
	gerstner(dalga_1, xz, t, p, teget, ikincil);
	gerstner(dalga_2, xz, t, p, teget, ikincil);
	gerstner(dalga_3, xz, t, p, teget, ikincil);
	gerstner(dalga_4, xz, t, p, teget, ikincil);
	tepe = p.y - VERTEX.y;
	VERTEX = p;
	NORMAL = normalize(cross(ikincil, teget));
	TANGENT = normalize(teget);
	BINORMAL = normalize(ikincil);
	dunya = p;
}

void fragment() {
	float t = zaman * hiz;
	// İnce dalgacıklar: iki yönde kayan iki normal haritası
	vec2 uv = dunya.xz * dalgacik_olcegi;
	vec3 n1 = texture(dalgacik_a, uv + vec2(0.021, 0.013) * t).rgb;
	vec3 n2 = texture(dalgacik_b, uv * 1.7 - vec2(0.017, 0.024) * t).rgb;
	NORMAL_MAP = normalize(n1 + n2 - vec3(0.5, 0.5, 0.0));
	NORMAL_MAP_DEPTH = dalgacik_gucu;

	// Suyun altındaki zemine kadar olan derinlik (görüş uzayında)
	float ham = texture(derinlik_dokusu, SCREEN_UV).r;
	vec4 arka = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, ham, 1.0);
	arka.xyz /= arka.w;
	float derinlik = max(0.0, VERTEX.z - arka.z);

	vec3 renk = mix(renk_sig, renk_derin, 1.0 - exp(-derinlik * derinlik_olcegi));

	// Köpük: kıyıda ve dalga tepelerinde
	float gurultu = texture(kopuk_dokusu, dunya.xz * 0.12 + vec2(0.03, 0.02) * t).r;
	gurultu = mix(0.65, gurultu, step(0.001, gurultu));
	float kiyi = (1.0 - smoothstep(0.0, kiyi_kopugu, derinlik)) * smoothstep(0.25, 0.75, gurultu + 0.35 * sin(derinlik * 6.0 - t * 2.0));
	float ust = smoothstep(1.0 - tepe_kopugu, 1.25 - tepe_kopugu, tepe / max(0.05, yukseklik_carpani) * 0.55 + gurultu * 0.45);
	float kopuk = clamp(max(kiyi, ust * tepe_kopugu), 0.0, 1.0);

	ALBEDO = mix(renk, renk_kopuk, kopuk);
	ROUGHNESS = mix(puruz, 0.6, kopuk);
	METALLIC = 0.0;
	SPECULAR = 0.6;
	// Sığ yerde dip görünür; derinleştikçe su opaklaşır. Kıyı çizgisi yumuşar.
	ALPHA = clamp(max(smoothstep(0.0, saydamlik_derinligi, derinlik) * 0.97, kopuk) * smoothstep(0.0, 0.08, derinlik), 0.0, 1.0);
}
