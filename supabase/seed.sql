-- Seed data dummy (identitas FIKTIF). Jalankan SETELAH semua migration.
-- Akun uji: pelanggan@phelya.id, kurir@phelya.id, admin@phelya.id (+5 pelanggan lain), password sama: Phelya123!
-- Catatan: lamaran seed memakai cv_path placeholder (berkas fisik tidak ada di Storage). Lamaran baru lewat form mengunggah CV asli.

-- ===== Referensi =====
insert into public.kota (id, nama, lat, lng) values
 ('semarang','Semarang',-6.9667,110.4167),('jakarta','Jakarta',-6.2088,106.8456),('bandung','Bandung',-6.9175,107.6191),
 ('surabaya','Surabaya',-7.2575,112.7521),('yogyakarta','Yogyakarta',-7.7956,110.3695),('solo','Surakarta',-7.5755,110.8243),
 ('cirebon','Cirebon',-6.7063,108.557),('tegal','Tegal',-6.8694,109.1402),('malang','Malang',-7.9666,112.6326),
 ('bogor','Bogor',-6.5971,106.806),('denpasar','Denpasar',-8.6705,115.2126)
on conflict do nothing;

insert into public.zona_tarif (nama, max_km, per_kg) values
 ('Zona 1 · Dalam Kota',40,8000),('Zona 2 · Antar Kota Dekat',250,11000),
 ('Zona 3 · Antar Provinsi',700,15000),('Zona 4 · Jarak Jauh',null,21000)
on conflict do nothing;

insert into public.layanan (id, nama, singkat, deskripsi, pengali, min_berat, max_zona, estimasi) values
 ('reguler','Phelya Reguler','Hemat','Pilihan paling hemat untuk kiriman harian tanpa terburu-buru.',1,1,null,'{"1":"1 hari","2":"2 hari","3":"3 hari","4":"4 – 6 hari"}'),
 ('kilat','Phelya Kilat','Besok Sampai','Garansi sampai esok hari untuk kota-kota utama. Prioritas di hub.',1.6,1,null,'{"1":"Hari ini","2":"1 hari","3":"1 – 2 hari","4":"2 – 3 hari"}'),
 ('same_day','Phelya Same Day','Dalam Kota','Dijemput dan diantar di hari yang sama, khusus dalam kota atau kota dekat.',2.4,1,2,'{"1":"6 – 8 jam","2":"Hari ini"}'),
 ('kargo','Phelya Kargo','> 10 kg','Muatan besar dan berat, mulai 10 kg, via truk khusus.',0.7,10,null,'{"1":"1 – 2 hari","2":"2 – 3 hari","3":"3 – 5 hari","4":"5 – 8 hari"}')
on conflict do nothing;

-- ===== Akun uji (identitas fiktif, password sama untuk semua) =====
create temp table _u (email text, nama text, hp text, kota text, tier text, role text);
insert into _u values
 ('pelanggan@phelya.id','Budi Santoso','081234567890','semarang','Gold','pelanggan'),
 ('kopi.nusantara@phelya.id','Toko Kopi Nusantara','081200110022','jakarta','Silver','pelanggan'),
 ('beautyglow@phelya.id','Beauty Glow Official','081288001122','jakarta','Gold','pelanggan'),
 ('distro.prima@phelya.id','Distro Bandung Prima','081255667700','bandung','Silver','pelanggan'),
 ('jepara.wood@phelya.id','Jepara Furniture Wood','081244110099','semarang','Bronze','pelanggan'),
 ('elmakmur@phelya.id','Elektronik Makmur','081266553311','jakarta','Bronze','pelanggan'),
 ('kurir@phelya.id','Bambang Setiawan','081311110001','jakarta','Bronze','kurir'),
 ('admin@phelya.id','Joko Purnomo','081300000001','jakarta','Bronze','admin');

with ins as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
  select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', u.email,
    extensions.crypt('Phelya123!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('nama', u.nama), now(), now(),
    '', '', '', '', '', '', '', ''
  from _u u where not exists (select 1 from auth.users x where x.email = u.email)
  returning id, email)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), ins.id, jsonb_build_object('sub', ins.id::text, 'email', ins.email, 'email_verified', true),
       'email', ins.id::text, now(), now(), now() from ins;

update public.profiles p set role = u.role, hp = u.hp, kota_id = u.kota, tier = u.tier
  from _u u where p.email = u.email;

-- ===== Kurir =====
insert into public.kurir (user_id, kode, nama, hp, kendaraan, plat, hub, aktif) values
 ((select id from public.profiles where email = 'kurir@phelya.id'),'PE-402','Bambang Setiawan','081311110001','Honda Beat','B 4920 PHE','Jakarta Selatan',true),
 (null,'PE-117','Rian Gunawan','081311110002','Honda Beat','B 1234 PXX','Jakarta Pusat',true),
 (null,'PE-233','Dedi Kusuma','081311110003','Blind Van','H 9801 TR','Semarang DC',true),
 (null,'PE-310','Wulan Sari','081311110004','Yamaha NMAX','D 2210 WLN','Bandung Kota',true),
 (null,'PE-455','Agus Prakoso','081311110005','Vario 150','L 5521 AGS','Surabaya Timur',false),
 (null,'PE-512','Siti Rahmawati','081311110006','Honda Beat','H 3342 STR','Semarang DC',true)
on conflict do nothing;

-- ===== Order (ongkir/zona/jarak dihitung oleh hitung_ongkir, bukan angka tulisan tangan) =====
create temp table _o (resi text, owner_email text, p_nama text, p_hp text, p_kota text, p_alamat text,
  r_nama text, r_hp text, r_kota text, r_alamat text, isi text, berat numeric, layanan text, bayar text,
  status text, kurir_kode text, dibuat timestamptz, estimasi timestamptz, alasan text, diterima text);
insert into _o values
 ('PEX2610310001','pelanggan@phelya.id','Budi Santoso','081234567890','semarang','Jl. Pandanaran No. 21, Semarang Tengah','Dewi Lestari','085711223344','jakarta','Jl. Cipete Raya No. 8, Jakarta Selatan','Pakaian batik',2,'reguler','lunas','dalam_perjalanan','PE-402','2026-10-30T09:10:00+07:00','2026-11-01T16:30:00+07:00',null,null),
 ('PEX2610310002','kopi.nusantara@phelya.id','Toko Kopi Nusantara','081200110022','jakarta','Jl. Menteng Raya No. 45, Jakarta Pusat','Sarah Amanda','081355667788','jakarta','Jl. Tebet Barat Dalam VII No. 14, Jakarta Selatan','Biji kopi 1,5 kg',2,'same_day','lunas','diambil','PE-402','2026-10-31T10:20:00+07:00','2026-10-31T18:00:00+07:00',null,null),
 ('PEX2610310003','pelanggan@phelya.id','Budi Santoso','081234567890','semarang','Jl. Pandanaran No. 21, Semarang Tengah','Rian Pratama','081299887766','surabaya','Jl. Darmo Permai III No. 3, Surabaya','Dokumen kontrak',1,'kilat','menunggu','menunggu_kurir',null,'2026-10-31T13:45:00+07:00','2026-11-01T17:00:00+07:00',null,null),
 ('PEX2610309887','pelanggan@phelya.id','Budi Santoso','081234567890','jakarta','Jl. Cipete Raya No. 8, Jakarta Selatan','Citra Kirana','081377889900','bandung','Jl. Citra Kirana No. 5, Bandung','Sepatu',1,'reguler','lunas','sampai','PE-402','2026-10-28T08:00:00+07:00','2026-10-30T16:00:00+07:00',null,'Yang Bersangkutan'),
 ('PEX2610309501','beautyglow@phelya.id','Beauty Glow Official','081288001122','jakarta','Jl. Gatot Subroto Kav. 12, Jakarta Selatan','Dewi Lestari','085711223344','semarang','Jl. Pemuda No. 100, Semarang','Kosmetik (3 box)',3,'kilat','lunas','dalam_perjalanan','PE-233','2026-10-30T15:00:00+07:00','2026-10-31T20:00:00+07:00',null,null),
 ('PEX2610309112','distro.prima@phelya.id','Distro Bandung Prima','081255667700','bandung','Jl. Braga No. 30, Bandung','Budi Prasetyo','081233445566','jakarta','Jl. Kebon Jeruk Raya No. 7, Jakarta Barat','Kaos 20 pcs',5,'reguler','menunggu','menunggu_kurir',null,'2026-10-31T08:15:00+07:00','2026-11-02T16:00:00+07:00',null,null),
 ('PEX2610308760','jepara.wood@phelya.id','Jepara Furniture Wood','081244110099','semarang','Jl. Kaligawe Km 5, Semarang','CV Sentosa Mebel','081200998877','jakarta','Jl. Pluit Raya No. 17, Jakarta Utara','Meja kayu jati (45 kg)',45,'kargo','lunas','dalam_perjalanan','PE-233','2026-10-29T07:30:00+07:00','2026-11-02T15:00:00+07:00',null,null),
 ('PEX2610308333','elmakmur@phelya.id','Elektronik Makmur','081266553311','jakarta','Jl. Kelapa Gading Raya No. 3, Jakarta Utara','Agus Hendra','081211002200','bogor','Perumahan Taman Sari Blok C-12, Bogor','Headset gaming',1,'reguler','cod','gagal','PE-117','2026-10-29T09:00:00+07:00','2026-10-30T16:00:00+07:00','Alamat tidak ditemukan',null),
 ('PEX2610307990','pelanggan@phelya.id','Budi Santoso','081234567890','semarang','Jl. Pandanaran No. 21, Semarang Tengah','Nina Marlina','081233221100','yogyakarta','Jl. Kaliurang Km 5, Yogyakarta','Oleh-oleh lumpia',2,'reguler','menunggu','dibatalkan',null,'2026-10-27T10:00:00+07:00','2026-10-29T16:00:00+07:00',null,null);

insert into public.orders (resi, owner_id, pengirim_nama, pengirim_hp, pengirim_kota, pengirim_alamat,
  penerima_nama, penerima_hp, penerima_kota, penerima_alamat, isi, berat, layanan_id, zona_id, jarak_km, ongkir,
  bayar, bayar_dikonfirmasi_at, bayar_dikonfirmasi_oleh, status, kurir_id, alasan_gagal, diterima_oleh, dibuat, estimasi)
select o.resi, p.id, o.p_nama, o.p_hp, o.p_kota, o.p_alamat, o.r_nama, o.r_hp, o.r_kota, o.r_alamat, o.isi, o.berat,
  o.layanan, h.zona_id, h.jarak_km, h.ongkir, o.bayar,
  case when o.bayar = 'lunas' then o.dibuat + interval '1 hour' end,
  case when o.bayar = 'lunas' then (select id from public.profiles where email = 'admin@phelya.id') end,
  o.status, k.id, o.alasan, o.diterima, o.dibuat, o.estimasi
from _o o
join public.profiles p on p.email = o.owner_email
left join public.kurir k on k.kode = o.kurir_kode
cross join lateral public.hitung_ongkir(o.p_kota, o.r_kota, o.berat, o.layanan) h
on conflict do nothing;

-- ===== Riwayat pelacakan =====
insert into public.tracking_events (resi, waktu, judul, lokasi, deskripsi) values
 ('PEX2610310001','2026-10-31T14:33:00+07:00','Dalam perjalanan ke Hub Jakarta Timur','Tol Cipali KM 102','Paket sedang dalam perjalanan darat bersama armada truk PE-402.'),
 ('PEX2610310001','2026-10-31T09:15:00+07:00','Paket telah disortir','Semarang DC','Paket diproses di lokasi sortir Semarang dan dimuat ke kontainer tujuan.'),
 ('PEX2610310001','2026-10-30T16:40:00+07:00','Paket tiba di hub','Hub Semarang Tengah','Paket diterima di hub dari drop point asal.'),
 ('PEX2610310001','2026-10-30T11:05:00+07:00','Paket diambil kurir','Semarang Tengah','Kurir menjemput paket dari alamat pengirim.'),
 ('PEX2610310001','2026-10-30T09:10:00+07:00','Pesanan dibuat','Semarang','Pesanan diterima sistem Phelya Express.'),
 ('PEX2610310002','2026-10-31T11:10:00+07:00','Paket diambil kurir','Menteng, Jakarta Pusat','Kurir Bambang S. mengambil paket dari toko.'),
 ('PEX2610310002','2026-10-31T10:20:00+07:00','Pesanan dibuat','Jakarta','Pesanan diterima sistem Phelya Express.'),
 ('PEX2610310003','2026-10-31T13:45:00+07:00','Pesanan dibuat','Semarang','Menunggu kurir ditugaskan untuk penjemputan.'),
 ('PEX2610309887','2026-10-30T10:45:00+07:00','Paket diterima','Bandung','Diterima oleh Yang Bersangkutan.'),
 ('PEX2610309887','2026-10-30T08:30:00+07:00','Kurir mengantar paket','Bandung Kota','Kurir sedang menuju alamat penerima.'),
 ('PEX2610309887','2026-10-29T19:00:00+07:00','Tiba di hub tujuan','Hub Bandung Kota','Paket diterima di hub tujuan.'),
 ('PEX2610309887','2026-10-28T13:20:00+07:00','Paket diambil kurir','Jakarta Selatan','Kurir menjemput paket dari pengirim.'),
 ('PEX2610309887','2026-10-28T08:00:00+07:00','Pesanan dibuat','Jakarta','Pesanan diterima sistem Phelya Express.'),
 ('PEX2610309501','2026-10-31T12:20:00+07:00','Dalam perjalanan ke kota tujuan','Tol Trans Jawa KM 340','Armada PE-233 menuju Semarang DC.'),
 ('PEX2610309501','2026-10-31T05:10:00+07:00','Berangkat dari hub transit','Hub Jakarta Pusat','Paket diberangkatkan dari hub utama.'),
 ('PEX2610309501','2026-10-30T18:30:00+07:00','Paket tiba di hub','Hub Jakarta Pusat','Paket masuk proses sortir ekspres.'),
 ('PEX2610309501','2026-10-30T16:10:00+07:00','Paket diambil kurir','Jakarta Selatan','Kurir menjemput paket.'),
 ('PEX2610309501','2026-10-30T15:00:00+07:00','Pesanan dibuat','Jakarta','Pesanan diterima sistem Phelya Express.'),
 ('PEX2610309112','2026-10-31T08:15:00+07:00','Pesanan dibuat','Bandung','Menunggu kurir ditugaskan.'),
 ('PEX2610308760','2026-10-31T06:00:00+07:00','Dalam perjalanan truk kargo','Pekalongan','Muatan sedang diangkut via truk kargo.'),
 ('PEX2610308760','2026-10-30T20:00:00+07:00','Paket dimuat ke truk','Semarang DC','Paket kargo dimuat dan diamankan.'),
 ('PEX2610308760','2026-10-29T12:00:00+07:00','Paket diambil kurir','Semarang','Kurir menjemput muatan kargo.'),
 ('PEX2610308760','2026-10-29T07:30:00+07:00','Pesanan dibuat','Semarang','Pesanan diterima sistem Phelya Express.'),
 ('PEX2610308333','2026-10-30T15:20:00+07:00','Gagal kirim','Bogor','Alamat penerima tidak ditemukan. Paket dikembalikan ke hub.'),
 ('PEX2610308333','2026-10-30T11:00:00+07:00','Kurir mengantar paket','Bogor','Kurir menuju alamat penerima.'),
 ('PEX2610308333','2026-10-29T15:00:00+07:00','Paket diambil kurir','Jakarta Utara','Kurir menjemput paket.'),
 ('PEX2610308333','2026-10-29T09:00:00+07:00','Pesanan dibuat','Jakarta','Pesanan diterima sistem Phelya Express.'),
 ('PEX2610307990','2026-10-27T10:30:00+07:00','Pesanan dibatalkan','Semarang','Dibatalkan oleh pengirim sebelum diambil kurir.'),
 ('PEX2610307990','2026-10-27T10:00:00+07:00','Pesanan dibuat','Semarang','Pesanan diterima sistem Phelya Express.');

-- ===== Karier =====
insert into public.lowongan (slug, judul, divisi, kategori, tipe, lokasi, batas, gaji, urgent, deskripsi, tanggung, kualifikasi) values
 ('kurir-motor-last-mile-jabodetabek','Kurir Motor Last Mile (Jabodetabek)','Operasional Hub','Kurir & Driver','Full Time','Hub Jakarta Selatan','2026-11-15T00:00:00+07:00','UMR + Insentif Paket',true,'Mengantar paket ke alamat penerima di area Jabodetabek dengan aman dan tepat waktu, serta memperbarui status pengiriman lewat aplikasi kurir.',
  array['Menjemput dan mengantar paket sesuai rute harian','Memperbarui status dan mengunggah foto bukti terima','Menjaga kondisi barang selama pengantaran','Menjaga komunikasi ramah dengan pengirim dan penerima'],
  array['Memiliki SIM C dan motor pribadi','Pendidikan minimal SMA/SMK','Menguasai area Jabodetabek','Jujur, disiplin, dan siap bekerja shift']),
 ('staf-gudang-sortir-paket','Staf Gudang & Sortir Paket','Gudang & DC','Gudang & Hub','Full Time','Hub Semarang DC','2026-11-20T00:00:00+07:00','UMK + Tunjangan Shift',false,'Memilah, memindai, dan menata paket sesuai tujuan di pusat distribusi Semarang.',
  array['Memindai dan menyortir paket masuk','Menata paket per rute pengiriman','Menjaga kebersihan dan keamanan area gudang','Melaporkan paket rusak atau tidak sesuai'],
  array['Pendidikan minimal SMA/SMK','Sehat jasmani dan teliti','Bersedia kerja shift','Pengalaman gudang menjadi nilai tambah']),
 ('customer-care-specialist','Customer Care Specialist','Customer Care','Customer Service','Full Time','Head Office Jakarta','2026-11-25T00:00:00+07:00','Kompetitif + Bonus Kinerja',false,'Melayani pertanyaan pelanggan seputar pelacakan, tarif, dan keluhan melalui telepon, chat, dan email.',
  array['Menjawab pertanyaan pelanggan dengan ramah','Menindaklanjuti keluhan hingga tuntas','Mencatat dan melaporkan isu berulang','Menjaga target kepuasan pelanggan'],
  array['Pendidikan minimal D3','Komunikasi lisan dan tulisan baik','Familiar dengan tools helpdesk','Sabar dan solutif']),
 ('frontend-engineer-logistics-portal','Frontend Engineer (Logistics Portal)','Teknologi & IT','Teknologi & IT','Hybrid','Jakarta Pusat / Hybrid','2026-11-30T00:00:00+07:00','Sesuai pengalaman',false,'Membangun portal pelanggan, kurir, dan admin yang cepat dan mudah dipakai menggunakan Next.js.',
  array['Membangun antarmuka responsif dengan Next.js','Berkolaborasi dengan desainer dan backend','Menulis kode yang rapi dan teruji','Menjaga performa dan aksesibilitas'],
  array['Menguasai JavaScript dan React','Paham Tailwind CSS','Terbiasa memakai Git','Pengalaman REST API menjadi nilai tambah']),
 ('field-operations-supervisor','Field Operations Supervisor','Operasional','Operasional','Full Time','Hub Surabaya','2026-11-18T00:00:00+07:00','Kompetitif + Tunjangan',false,'Memimpin tim kurir harian, memantau SLA, dan memastikan operasional hub berjalan lancar.',
  array['Memantau performa kurir harian','Mengelola jadwal dan rute pengantaran','Menangani eskalasi pengiriman bermasalah','Menyusun laporan operasional'],
  array['Pendidikan minimal S1','Pengalaman logistik minimal 2 tahun','Kemampuan kepemimpinan','Mampu menganalisis data sederhana']),
 ('kurir-kargo-semarang','Driver Truk Kargo','Operasional Hub','Kurir & Driver','Full Time','Hub Semarang DC','2026-12-05T00:00:00+07:00','Gaji + Uang Jalan',false,'Mengemudikan truk kargo antar kota dan menjaga muatan tetap aman sampai tujuan.',
  array['Mengemudikan truk sesuai rute','Memeriksa kondisi kendaraan sebelum jalan','Menjaga keamanan muatan','Melaporkan kendala di perjalanan'],
  array['Memiliki SIM B1/B2','Pengalaman menyetir truk 2 tahun','Sehat dan disiplin','Bersedia perjalanan antar kota'])
on conflict do nothing;

insert into public.lamaran (lowongan_slug, nama, email, hp, kota, pesan, cv_path, cv_ukuran, status) values
 ('kurir-motor-last-mile-jabodetabek','Andi Wijaya','andi.wijaya@contoh.example','081311220001','Jakarta Selatan','Siap bekerja shift dan hafal area Jabodetabek.','cv/seed/andi-wijaya.pdf',184320,'baru'),
 ('staf-gudang-sortir-paket','Rina Marlina','rina.marlina@contoh.example','081311220002','Semarang',null,'cv/seed/rina-marlina.pdf',152400,'diproses'),
 ('customer-care-specialist','Dimas Pratama','dimas.pratama@contoh.example','081311220003','Jakarta Pusat','Berpengalaman 2 tahun di layanan pelanggan.','cv/seed/dimas-pratama.pdf',203776,'wawancara'),
 ('frontend-engineer-logistics-portal','Nadia Putri','nadia.putri@contoh.example','081311220004','Jakarta Pusat','Portofolio ada di CV.','cv/seed/nadia-putri.pdf',241664,'diterima'),
 ('field-operations-supervisor','Hendra Saputra','hendra.saputra@contoh.example','081311220005','Surabaya',null,'cv/seed/hendra-saputra.pdf',176128,'ditolak')
on conflict do nothing;

-- ===== Notifikasi in-app (contoh; lamaran sudah otomatis lewat trigger) =====
insert into public.notifications (user_id, tipe, judul, isi, url, resi, dibaca_at, created_at)
select p.id, n.tipe, n.judul, n.isi, n.url, n.resi, n.dibaca, n.dibuat
from (values
 ('pelanggan@phelya.id','status_berubah','Paket PEX2610310001','Status paket PEX2610310001: Dalam Perjalanan.','/dashboard/pesanan/PEX2610310001','PEX2610310001',null::timestamptz,'2026-10-31T14:33:00+07:00'::timestamptz),
 ('pelanggan@phelya.id','pembayaran','Pembayaran diterima','Pembayaran paket PEX2610309887 telah dikonfirmasi.','/dashboard/pesanan/PEX2610309887','PEX2610309887','2026-10-28T09:30:00+07:00'::timestamptz,'2026-10-28T09:00:00+07:00'::timestamptz),
 ('kurir@phelya.id','kurir_ditugaskan','Tugas baru PEX2610310002','Anda ditugaskan menjemput paket PEX2610310002.','/kurir/tugas/PEX2610310002','PEX2610310002',null::timestamptz,'2026-10-31T10:30:00+07:00'::timestamptz),
 ('kurir@phelya.id','kurir_ditugaskan','Tugas baru PEX2610310001','Anda ditugaskan menjemput paket PEX2610310001.','/kurir/tugas/PEX2610310001','PEX2610310001','2026-10-30T10:00:00+07:00'::timestamptz,'2026-10-30T09:30:00+07:00'::timestamptz),
 ('admin@phelya.id','order_baru','Pesanan baru PEX2610310003','Pesanan PEX2610310003 menunggu penugasan kurir.','/admin/order','PEX2610310003',null::timestamptz,'2026-10-31T13:45:00+07:00'::timestamptz),
 ('admin@phelya.id','order_baru','Pesanan baru PEX2610309112','Pesanan PEX2610309112 menunggu penugasan kurir.','/admin/order','PEX2610309112','2026-10-31T09:00:00+07:00'::timestamptz,'2026-10-31T08:15:00+07:00'::timestamptz)
) as n(email, tipe, judul, isi, url, resi, dibaca, dibuat)
join public.profiles p on p.email = n.email;

drop table _u; drop table _o;
