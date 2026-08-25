# TEPEBAŞI BELEDİYESİ TEMİZLİK İŞLERİ MÜDÜRLÜĞÜ
## Saha Operasyonları ve Atık Yönetim Sistemi — Yapay Zeka Devir ve Teknik Mimari Dokümanı (AI Handover & Technical Specification)

> **Bu Dokümanın Amacı:**  
> Projeyi devralacak veya üzerinde çalışacak herhangi bir Yapay Zeka modelinin (LLM/Agent) ya da yazılım mühendisinin, sistemin tüm mimarisini, iş mantığını, veritabanı kurallarını, rol yetkilendirmelerini, tRPC uç noktalarını ve bileşen hiyerarşisini eksiksiz anlayarak doğrudan hatasız kod geliştirmesini sağlamaktır.

---

## 1. Proje Genel Özeti (Executive Summary)

Tepebaşı Belediyesi Temizlik İşleri Müdürlüğü için geliştirilmiş; saha temizlik araçlarının vardiya/mesai takibini, çöp kamyonu ve damperli araç operasyonlarını, damperlik hafriyat/moloz atık bildirim ve toplama süreçlerini, arızalı çöp konteynerlerinin kaynak/onarım yönetimini, vatandaş şikayetlerinin coğrafi koordinat bazlı takibini ve yönetimsel raporlamaları tek merkezden yöneten **full-stack operasyonel yönetim yazılımıdır**.

---

## 2. Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Kütüphane | Açıklama |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | SPA (Single Page Application) yapısı |
| **Tip Güvenliği** | TypeScript | Uçtan uca tip güvenliği (0 error politikası) |
| **Stil & Tasarım** | Tailwind CSS + Vanilla CSS | Modern, responsive, mobil uyumlu kart/grid arayüzü |
| **Bileşen Kütüphanesi** | Radix UI / shadcn/ui | Dialog, Card, Badge, Input, Textarea, Tooltip |
| **Harita & Coğrafi Bilgi** | Leaflet + React-Leaflet + OpenStreetMap Nominatim | Özel SVG pinler, canlı mesafe/konum, ters ve düz geocoding |
| **İstemci-Sunucu İletişimi**| tRPC (v10+) + TanStack React Query | Tip güvenli RPC API çağrıları |
| **Backend Runtime** | Node.js + Express | REST & tRPC sunucusu |
| **Veritabanı & ORM** | MySQL 8.0+ / MariaDB + Drizzle ORM | İlişkisel veritabanı ve sorgu katmanı |
| **Kimlik Doğrulama** | JWT (JSON Web Token) + bcryptjs | Rol bazlı oturum ve şifreleme |
| **İkon Seti** | Lucide React | Modern ikonlar |
| **Bildirimler** | Sonner | Toast bildirimleri |

---

## 3. Veritabanı Mimarisi ve Katı Kurallar (Database Architecture)

### ⚠️ KRİTİK VERİTABANI KURALI (Single Source of Truth):
1. **Otomatik DDL Yasaktır:** Sunucu başlangıcında (`server/db.ts` veya `server/_core/index.ts`) otomatik tablo oluşturan/güncelleyen (`CREATE TABLE IF NOT EXISTS` döngüleri) kodlar **çalıştırılmaz**. Terminal çıktısını kirletmemek ve canlı veriyi korumak için DDL işlemleri kullanıcı tarafından manuel uygulanır.
2. **Kılavuz Dosya:** `schema.sql` dosyası projenin tek ve kesin **veritabanı referansıdır**. Yapılan her şema değişikliği hem `drizzle/schema.ts` dosyasına hem de `schema.sql` dosyasına yazılmalıdır.

### Tablo Yapıları ve İlişkileri (9 Tablo):

```
+-----------------------------------------------------------------------------------+
|                                  VERİTABANI ŞEMASI                                |
+-----------------------------------------------------------------------------------+

1. [users] (Kullanıcılar / Personel)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── openId (VARCHAR(64), UNIQUE)
   ├── name (TEXT)
   ├── email (VARCHAR(320))
   ├── username (VARCHAR(64), UNIQUE)
   ├── passwordHash (VARCHAR(255))
   ├── isLocalAccount (BOOLEAN, DEFAULT false)
   ├── role (ENUM/VARCHAR: 'yönetim', 'şoför', 'kaynak personeli', 'kademe personeli')
   └── createdAt, updatedAt, lastSignedIn (TIMESTAMP)

2. [neighborhoods] (Dinamik Tepebaşı Mahalleleri)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── region (VARCHAR(100)) -> 'Batı Bölgesi', 'Merkez Bölgesi', 'Kuzey Bölgesi', 'Kırsal'
   ├── name (VARCHAR(100), UNIQUE) -> 'Batıkent Mahallesi', 'Şirintepe Mahallesi' vb.
   └── createdAt (TIMESTAMP)

3. [vehicles] (Araç Envanteri)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── type (VARCHAR(64)) -> 'çöp kamyonu', 'damperli kamyon'
   ├── capacityTon (VARCHAR(24))
   ├── brand (VARCHAR(100))
   ├── plate (VARCHAR(16), UNIQUE) -> Örn: '26 ABC 001'
   ├── status (VARCHAR(64), DEFAULT 'aktif') -> 'aktif', 'arızalı', 'bakımda'
   └── createdAt (TIMESTAMP)

4. [shifts] (Saha Mesaileri / Vardiyalar)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── driverId (INT, FK -> users.id)
   ├── vehicleId (INT, FK -> vehicles.id)
   ├── region (VARCHAR(100))
   ├── neighborhood (VARCHAR(100))
   ├── vehicleType (ENUM: 'çöp kamyonu', 'damperli kamyon')
   ├── shiftHours (VARCHAR(32)) -> '08:00 - 16:00', '16:00 - 00:00', '00:00 - 08:00'
   ├── startKm (INT)
   ├── startFullness (ENUM: 'boş', 'dolu')
   ├── endKm (INT, NULLABLE)
   ├── endFullness (ENUM: 'boş', 'dolu', NULLABLE)
   ├── tonnage (VARCHAR(24), NULLABLE)
   ├── tonnageReceiptUrl (TEXT, NULLABLE - JSON string / Base64 fotoğraflar)
   ├── faultReported (BOOLEAN, DEFAULT false)
   ├── status (ENUM: 'açık', 'tamamlandı')
   ├── startedAt (TIMESTAMP)
   └── endedAt (TIMESTAMP, NULLABLE)

5. [vehicleFaults] (Araç Arıza ve Bakım Kayıtları)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── vehicleId (INT, FK -> vehicles.id)
   ├── reportedBy (INT, FK -> users.id)
   ├── description (TEXT)
   ├── severity (ENUM: 'düşük', 'orta', 'yüksek')
   ├── status (ENUM: 'kademe_onayı_bekliyor', 'bakımda', 'onarım_tamamlandı')
   ├── approvalNote (TEXT, NULLABLE)
   ├── createdAt, updatedAt (TIMESTAMP)
   └── resolvedAt (TIMESTAMP, NULLABLE)

6. [bulkWasteReports] (Damperlik Hafriyat / Moloz / Kaba Atık Bildirimleri)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── reportedBy (INT, FK -> users.id)
   ├── region (VARCHAR(100))
   ├── neighborhood (VARCHAR(100))
   ├── wasteType (VARCHAR(100)) -> 'Hafriyat / Moloz', 'Budama / Dal Atığı', 'Mobilya / Kaba Eşya', 'Diğer'
   ├── description (TEXT)
   ├── latitude (VARCHAR(32))
   ├── longitude (VARCHAR(32))
   ├── photoUrl (TEXT, NULLABLE - Base64/URL fotoğraf)
   ├── dueAt (TIMESTAMP, DEFAULT NOW + 2 GÜN) -> Toplama süresi sınırı
   ├── status (ENUM: 'bekliyor', 'toplandı')
   ├── collectedVehicleId (INT, NULLABLE)
   ├── collectedDriverId (INT, NULLABLE)
   ├── collectedAt (TIMESTAMP, NULLABLE)
   └── createdAt (TIMESTAMP)

7. [containerFaults] (Konteyner Arıza & Kaynak Kayıtları)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── reportedBy (INT, FK -> users.id)
   ├── region (VARCHAR(100))
   ├── neighborhood (VARCHAR(100))
   ├── faultType (ENUM: 'kol', 'ayak', 'gövde', 'kapak', 'diğer')
   ├── description (TEXT)
   ├── latitude (VARCHAR(32))
   ├── longitude (VARCHAR(32))
   ├── photoUrl (TEXT, NULLABLE)
   ├── status (ENUM: 'bekliyor', 'onarım_tamamlandı')
   ├── repairedBy (INT, NULLABLE)
   ├── repairNote (TEXT, NULLABLE)
   ├── createdAt (TIMESTAMP)
   └── repairedAt (TIMESTAMP, NULLABLE)

8. [citizenComplaints] (Vatandaş Şikayetleri)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── reportedBy (INT, NULLABLE)
   ├── region (VARCHAR(100))
   ├── neighborhood (VARCHAR(100))
   ├── description (TEXT)
   ├── latitude (VARCHAR(32))
   ├── longitude (VARCHAR(32))
   ├── photoUrl (TEXT, NULLABLE)
   ├── dueAt (TIMESTAMP, DEFAULT NOW + 24 SAAT) -> Aciliyet süresi
   ├── status (ENUM: 'açık', 'çözüldü')
   ├── resolvedBy (INT, NULLABLE)
   ├── resolvedAt (TIMESTAMP, NULLABLE)
   └── createdAt (TIMESTAMP)

9. [auditLogs] (Sistem Denetim ve Güvenlik Logları)
   ├── id (PK, INT AUTO_INCREMENT)
   ├── userId (INT, FK -> users.id)
   ├── action (VARCHAR(100))
   ├── details (TEXT)
   └── createdAt (TIMESTAMP)
```

---

## 4. Kullanıcı Rolleri ve Yetki Matrisi (Role-Based Access Control)

Sistemde 4 temel rol tanımlıdır (`users.role`):

| Yetenek / Ekran | `yönetim` | `şoför` | `kaynak personeli` | `kademe personeli` |
| :--- | :---: | :---: | :---: | :---: |
| **Genel Dashboard & İstatistikler** | ✅ | ✅ | ✅ | ✅ |
| **Tüm Operasyonlar Haritası** | ✅ | ✅ | ✅ | ✅ |
| **Mesai Başlatma / Bitirme (Kendi Adına)** | ❌ | ✅ | ❌ | ❌ |
| **Şoför Adına Mesai Başlatma & Bitirme** | ✅ | ❌ | ❌ | ❌ |
| **Şoför Geçmiş 10 Mesai Tablosu** | ❌ | ✅ (Kendi mesaileri) | ❌ | ❌ |
| **Damperlik Atık Bildirme (Saha Kaydı)** | ✅ | ✅ (Çöp kamyonu şoförü) | ❌ | ❌ |
| **Damperlik Atığı Toplayıp Kapatma** | ✅ | ✅ (Damperli kamyon şoförü) | ❌ | ✅ |
| **Konteyner Arızası Bildirme** | ✅ | ✅ | ✅ | ✅ |
| **Konteyner Onarımını Tamamlama/Kapatma** | ✅ | ✅ | ✅ (Esas sorumlu) | ✅ |
| **Vatandaş Şikayeti Kaydetme** | ✅ | ✅ | ✅ | ✅ |
| **Vatandaş Şikayetini Çözüp Kapatma** | ✅ | ✅ (Bölgedeki şoför) | ❌ | ❌ |
| **Araç Envanteri Ekle/Düzenle/Sil** | ✅ | ❌ | ❌ | ✅ |
| **Araç Arıza Bildirme** | ✅ | ✅ | ✅ | ✅ |
| **Araç Kademe Onayı & Bakımdan Çıkarma** | ✅ | ❌ | ❌ | ✅ |
| **Mahalle Yönetimi (Ekle/Düzenle/Sil)** | ✅ | ❌ | ❌ | ❌ |
| **Yönetim Raporları, CRUD ve Veri Sıfırlama**| ✅ | ❌ | ❌ | ❌ |
| **Personel / Kullanıcı Yönetimi** | ✅ | ❌ | ❌ | ❌ |

---

## 5. Kritik İş Mantığı ve İş Akışları (Business Logic & Workflows)

### 5.1. Mesai ve Vardiya Yönetimi (`shifts`)
- **3 Sabit Vardiya Saati:** `08:00 - 16:00`, `16:00 - 00:00`, `00:00 - 08:00`.
- **Dinamik Mahalle:** Şoför veya yönetici mesai başlatırken veritabanındaki `neighborhoods` listesinden seçim yapar. Seçilen mahalleye bağlı `region` (bölge) otomatik set edilir.
- **Tek Aktif Mesai Kuralı:** Bir şoförün aynı anda yalnızca 1 açık mesaisi olabilir.
- **Mesai Bitirme:** Bitiş kilometresi girilir (`endKm >= startKm`). İsteğe bağlı kantar fişi fotoğrafları (`tonnageReceipts` Base64 dizisi) ve tonaj bilgisi kaydedilir.

### 5.2. Şoför Görev Bölgesi Şikayet Alarmı
- Şoför aktif bir mesaideyken (`activeShift`), mesai yaptığı mahallede (`activeShift.neighborhood`) açık bir vatandaş şikayeti (`citizenComplaints.status = 'açık'`) varsa:
  - Dashboard'un en tepesinde yanıp sönen kırmızı acil durum uyarı banner'ı belirir (`🚨 GÖREV BÖLGENİZDE X AÇIK ŞİKAYET VAR`).
  - Şoför tek tıkla şikayeti inceleyip sahada temizliği tamamlayarak şikayeti kapatabilir.

### 5.3. Damperlik Atık Çözümü (`bulkWasteReports`)
- Çöp kamyonu şoförleri konteyner dışı büyük moloz/dal/eşya gördüklerinde bildirim oluşturur.
- Bildirime otomatik olarak `NOW() + 2 GÜN` termin tarihi atanır.
- **Harita İkazı:** 2 günü geçmemiş atıklar haritada yeşil pin, 2 günü geçmiş atıklar kırmızı pin (acil) olarak görünür.
- Damperli kamyon şoförü haritadan veya listeden atığın yanına giderek doğrudan **"Toplandı / Çözüldü"** butonuyla kaydı kapatır.

### 5.4. Konteyner Arıza Çözümü (`containerFaults`)
- Kırık kaldırma kolu, tekerlek, delik sac, hasarlı kapak arızaları fotoğraflı ve koordinatlı bildirilir.
- Kaynak personeli haritadan veya listeden arızayı seçer, onarım notunu yazar ve kaydı onarılmış olarak kapatır.

### 5.5. Konum ve Geocoding Mimarisi (Forward & Reverse Geocoding)
Tüm operasyonel bildirim formlarında iki yönlü OpenStreetMap (Nominatim) entegrasyonu vardır:
1. **Düz Geocoding (Forward Geocoding - Adresten Koordinat Bulma):**
   - Kullanıcı bir sokak, cadde veya mahalle ismi yazar (Örn: *İsmet İnönü Caddesi*, *Şirintepe*).
   - Sistem Nominatim API'sine `query + ", Tepebaşı, Eskişehir"` sorgusu atar.
   - Enlem (`latitude`) ve boylam (`longitude`) otomatik doldurulur, açık adres kullanıcıya teyit ettirilir.
2. **Ters Geocoding (Reverse Geocoding - GPS'ten Adres Bulma):**
   - Kullanıcı **"Anlık GPS Al"** butonuna basar (`navigator.geolocation` yüksek hassasiyet modu).
   - Alınan koordinat Nominatim reverse API'sine gönderilerek mahalle ve sokak adı form alanına doldurulur.

### 5.6. Operasyon Haritası ve Pin Özellikleri (`OperationsMap.tsx`)
- **Tekil Harita Filtreleme:** Her operasyon sekmesinde (`Konteyner`, `Damperlik Atık`, `Şikayetler`) sadece o kategoriye ait özel harita gösterilir.
- **Fotoğraf Önizleme & Lightbox:** Pin tıklandığında yüklenen fotoğrafın küçük önizlemesi çıkar; tıklandığında tam ekran yüksek çözünürlüklü Lightbox açılır.
- **Doğrudan Pinden Kapatma:** Yetkili personel pin üzerindeki butona basarak listede aramaya gerek kalmadan görevi haritadan kapatabilir.
- **Kompakt Bildirim Tablosu:** Ana haritanın altında fotoğrafsız, kompakt, doğrudan pine odaklayan (`Pini Göster`) bir özet bildirim listesi bulunur.

---

## 6. Proje Dosya ve Dizin Yapısı (Directory Structure)

```
TepeBasiTemizlikYEni/
├── client/                               # Frontend (React + Vite + TS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                       # Radix UI / shadcn atomik bileşenleri
│   │   │   ├── OperationsWorkspace.tsx   # Ana Workspace yönlendiricisi, Dashboard, Şoför Mesai & Vardiya Paneli, Damperlik Atık Paneli
│   │   │   ├── FieldOperations.tsx       # Konteyner Arıza Çözümü ve Vatandaş Şikayetleri Panelleri (Formlar + Haritalar + Listeler)
│   │   │   ├── FleetOperations.tsx       # Araç Envanteri ve Araç Arıza/Bakım Panelleri
│   │   │   ├── ManagementOperations.tsx  # Mahalle Yönetimi, Genel Raporlar, Full CRUD Yönetimi, Veri Sıfırlama, Personel Paneli
│   │   │   └── OperationsMap.tsx         # Leaflet harita bileşeni (SVG Markerlar, Lightbox, Pinden Kapatma)
│   │   ├── pages/
│   │   │   ├── Home.tsx                  # Ana sayfa kabuğu (Sidebar, Header, Rol Değiştirici, View Switcher)
│   │   │   └── Auth.tsx                  # Giriş ve kayıt ekranı
│   │   ├── lib/
│   │   │   ├── trpc.ts                   # tRPC React Client tanımları
│   │   │   └── utils.ts                  # Tailwind sınıf birleştirici (cn)
│   │   ├── App.tsx                       # React kök bileşeni ve tRPC Provider
│   │   └── main.tsx                      # Vite giriş noktası
├── server/                               # Backend (Node.js + Express + tRPC)
│   ├── _core/
│   │   ├── index.ts                      # Express sunucu başlatıcı, tRPC middleware
│   │   └── trpc.ts                       # tRPC context, publicProcedure, protectedProcedure
│   ├── routers/
│   │   ├── operations.ts                 # Ana tRPC router'ı (shifts, bulkWaste, containerFaults, complaints, vehicles, faults, neighborhoods, reports)
│   │   └── auth.ts                       # Kullanıcı giriş, kayıt, session router'ı
│   ├── operations-db.ts                  # Veritabanı sorgu fonksiyonları (Drizzle ORM yardımcıları)
│   └── db.ts                             # MySQL connection pool ve Drizzle instance'ı
├── drizzle/
│   └── schema.ts                         # Drizzle ORM TypeScript şema tanımları
├── schema.sql                            # Veritabanı tek kaynak SQL dosyası (Tablolar + Seed Verileri + Migrationlar)
├── package.json                          # Bağımlılıklar ve scriptler
├── tsconfig.json                         # TypeScript yapılandırması
├── tailwind.config.ts                    # Tailwind CSS yapılandırması
└── AI_HANDOVER.md                        # (Bu Dosya) Proje devir ve mimari kılavuzu
```

---

## 7. tRPC API Uç Noktaları Özeti (tRPC API Endpoints)

Tüm sorgu ve mutasyonlar `trpc.operations.*` altında toplanmıştır:

### `shifts` (Mesailer)
- `current` (Query): Şoförün mevcut açık mesaisini döner.
- `driverHistory` (Query): Şoförün son 10 tamamlanan mesaisini döner.
- `start` (Mutation): Yeni mesai başlatır (şoför kendisi veya yönetici şoför adına).
- `finish` (Mutation): Mesaiyi sonlandırır (km, doluluk, kantar fişi fotoğrafları, arıza kaydı).
- `update` (Mutation - Admin): Mesai kaydını günceller.
- `remove` (Mutation - Admin): Mesai kaydını siler.

### `neighborhoods` (Mahalleler)
- `list` (Query): Tanımlı mahalleleri alfabetik/bölgeye göre döner.
- `create` (Mutation): Yeni mahalle ekler (`name`, `region`).
- `update` (Mutation): Mahalle adını ve bölgesini günceller.
- `remove` (Mutation): Mahalleyi siler.

### `bulkWaste` (Damperlik Atıklar)
- `list` (Query): Tüm damperlik atıkları döner.
- `create` (Mutation): Yeni atık bildirir (tür, mahalle, koordinat, fotoğraf).
- `collect` (Mutation): Atığı toplandı olarak işaretler.
- `update` (Mutation - Admin): Damperlik atık kaydını günceller.
- `remove` (Mutation - Admin): Damperlik atık kaydını siler.

### `containerFaults` (Konteyner Arızaları)
- `list` (Query): Tüm konteyner arızalarını döner.
- `create` (Mutation): Yeni konteyner arızası bildirir.
- `repair` (Mutation): Arızayı onarım notuyla kapatır.
- `update` (Mutation - Admin): Konteyner arıza kaydını günceller.
- `remove` (Mutation - Admin): Konteyner arıza kaydını siler.

### `complaints` (Vatandaş Şikayetleri)
- `list` (Query): Tüm şikayetleri döner.
- `create` (Mutation): Yeni şikayet kaydeder (mahalle, açıklama, koordinat, fotoğraf).
- `acknowledge` (Mutation): Şikayeti çözüldü olarak kapatır.
- `update` (Mutation - Admin): Şikayet kaydını günceller.
- `remove` (Mutation - Admin): Şikayet kaydını siler.

### `vehicles` & `faults` (Filo ve Bakım)
- `vehicles.list`, `vehicles.create`, `vehicles.updateStatus`, `vehicles.remove`
- `faults.list`, `faults.create`, `faults.review` (kademe onayı)

### `reports` (Yönetim ve Raporlama)
- `summary` (Query): Dashboard ve yönetim için özet operasyon sayıları.
- `resetData` (Mutation - Admin): Seçilen kategorilerdeki operasyonel verileri kalıcı temizler ve denetim loguna yazar.

---

## 8. Geliştirici & Yapay Zeka İlkeleri (Guidelines for Next AI / Developer)

1. **Tip Uyumluluğu:** Kod tabanında `npx tsc --noEmit` çalıştırıldığında **daima 0 hata** vermelidir. `any` kullanımı en aza indirilmeli, `drizzle/schema.ts` ve tRPC çıktı tipleriyle tam uyumlu çalışılmalıdır.
2. **Gereksiz Başlık ve Metin Kalabalığından Kaçının:** Arayüz minimal, sade, ferah ve işlev odaklı tutulmalıdır. Kartların içine gereksiz uzun açıklama paragrafları ve tekrarlı üst banner'lar eklenmemelidir.
3. **Mobil Uyum ve Kamera Desteği:** Saha personelinin mobil cihazlardan fotoğraf çekeceği unutulmamalıdır; dosya inputlarında `accept="image/*"` ve `capture="environment"` parametreleri korunmalıdır.
4. **Veritabanı Güncellemeleri:** Drizzle şemasında yapılan her değişiklik eş zamanlı olarak `schema.sql` dosyasına yansıtılmalıdır. Sunucu başlangıcında asla otomatik DDL çalıştırılmamalıdır.
5. **DOKÜMANTASYON GÜNCELLEME KURALI (ZORUNLU):** Projede yapılan her yeni özellik, hata düzeltmesi, şema veya arayüz değişikliğinde `AI_HANDOVER.md` dosyasının **"9. Değişiklik ve Güncelleme Geçmişi (Changelog)"** bölümüne yeni bir sürüm başlığı altında maddeler halinde ekleme yapılmalıdır.

---

## 9. Değişiklik ve Güncelleme Geçmişi (Changelog & History)

### [v2.4.11] - 2026-08-21 (Son Güncelleme)
- **Sunucu Tarafında Otomatik Görsel Optimizasyonu (`sharp` Entegrasyonu):**
  - Akıllı telefon kameralarından gelen büyük çözünürlüklü (12-48 MP / 10+ MB) ham görseller, `server/routers/operations.ts` içindeki `uploadImage` fonksiyonunda `sharp` motorundan geçirilerek otomatik yön düzeltme (`.rotate()`), maksimum 1600x1600px orantılı boyutlandırma (`fit: 'inside', withoutEnlargement: true`) ve %80 JPEG kalitesiyle sıkıştırıldı.
  - Fotoğraf boyutları ortalama 10 MB'tan ~200-300 KB seviyesine indirildi (%95+ disk tasarrufu); tonaj fişleri, rakamlar ve plakaların kristal netliği korundu.
  - Olası beklenmeyen dosya/format hatalarında sistemin kesintiye uğramaması için fail-safe fallback mimarisi kuruldu.
- **Fiziksel Dosya Silme Altyapısı (`storageDelete`):**
  - `server/storage.ts` içerisine `storageDelete(relKeyOrUrl)` fonksiyonu eklenerek silinen fotoğrafların sadece veritabanından değil, sunucunun `uploads/` disk alanından da fiziki olarak silinmesi ve disk alanının anında geri kazanılması sağlandı.
- **Yönetim Panelinde Tekil Görsel Silme Desteği:**
  - Tonaj fişi inceleme modalında her bir fiş kartının yanına 🗑️ *"Sil"* butonu eklendi.
  - Damperlik atık, konteyner arızası ve vatandaş şikayeti listelerine fotoğraf önizleme butonları ile lightbox modalı içerisine 🗑️ *"Görseli Sil"* aksiyonu eklendi.
  - Backend tarafında `photos.deleteSingle` prosedürü ve `server/operations-db.ts` üzerinde `removeShiftReceiptPhoto`, `removeBulkWastePhoto`, `removeContainerFaultPhoto`, `removeCitizenComplaintPhoto` fonksiyonları geliştirildi. Silme işlemleri `FOTOĞRAF_SİLİNDİ` denetim loguna bağlandı.
- **Yönetim Paneli Toplu Görsel ve Depolama Temizleme:**
  - Yönetim Paneli **⚠️ Veri Sıfırlama** sekmesine **"Sunucu Depolama & Görsel / Fotoğraf Temizleme"** paneli eklendi:
    - 📅 **Bugünkü Görselleri Sil:** Son 24 saat içinde yüklenen fotoğrafları temizler.
    - ⏱️ **7+ Günlük Görselleri Sil:** 1 haftadan eski tüm operasyon fotoğraflarını diskten siler.
    - 🗓️ **30+ Günlük Görselleri Sil:** 1 aydan eski arşiv fotoğraflarını temizler.
    - ⚠️ **Tüm Görselleri Sıfırla:** Sistemdeki tüm fotoğrafları diskten ve veritabanından kalıcı olarak temizler.
  - Backend tarafında `photos.purge` prosedürü ve `reports.resetData` içine `photosScope` desteği entegre edildi.
- **Reddedilen / Tekrar Açılan Şikayetlerde Çözüm Fotoğrafının Sıfırlanması:**
  - Yönetici tarafından reddedilen veya çözümü onaylanmayıp tekrar "açık" duruma getirilen vatandaş şikayetlerinde, eski çözüm fotoğrafı ve çözücü bilgileri (`resolutionPhotoUrl`, `resolvedBy`, `resolvedAt`) veritabanında otomatik olarak `null` yapıldı ve eski görsel dosyası `storageDelete` ile diskten temizlendi.
  - `OperationsMap.tsx` ve `FieldOperations.tsx` üzerindeki harita pin detay kartlarında ve saha listelerinde, şikayet "açık" durumdayken eski çözüm fotoğrafının kesinlikle gösterilmemesi kuralı (`status !== "açık"`) güvenceye alındı.



### [v2.4.10] - 2026-08-21
- **Damperlik Atık ve Arıza Çözümü Açıklama Alanlarının İsteğe Bağlı Hale Getirilmesi:**

  - Damperlik Atık Çözümü (`bulkWasteReports`), Konteyner Arıza Çözümü (`containerFaults`) ve Araç Arıza Çözümü (`vehicleFaults`) bildirim formlarındaki "Açıklama" alanı zorunlu olmaktan çıkarılarak `(İsteğe Bağlı)` formatına getirildi.
  - Backend tRPC mutasyonlarında (`bulkWaste.create`, `containerFaults.create`, `vehicleFaults.create`) `description` alanı `z.string().optional().default("")` olarak revize edildi; boş bırakılması durumunda sistem otomatik olarak `"Açıklama belirtilmedi"` varsayılanını atar.

### [v2.4.9] - 2026-08-21
- **Damperlik Atık Bildirimine Kepçe Gereksinimi (`requiresExcavator`) Entegrasyonu:**
  - `bulkWasteReports` tablosuna `requiresExcavator TINYINT(1) DEFAULT 0` kolonu eklendi (`drizzle/schema.ts`, `schema.sql`).
  - Saha Damperlik Atık bildirim formuna `🚜 Kepçe Gerekli Değil` (varsayılan) ve `🚜 Kepçe Gerekli` (vurgulu amber) seçim butonları eklendi.
  - Damperlik atık listesinde, harita pin popup detayında ve yönetim tablosunda `🚜 Kepçe Gerekli` rozeti ve filtreleme göstergesi entegre edildi.
- **Bildiren Şoför / Personel İsminin Pin ve Listelerde Gösterilmesi:**
  - `server/operations-db.ts` içerisindeki `listBulkWasteReports`, `listContainerFaults` ve `listCitizenComplaints` sorguları `users` tablosuyla left-join edilerek bildiren personelin adı (`reporterName`) çekildi.
  - Damperlik atık kartlarında, konteyner arıza kartlarında, vatandaş şikayetlerinde ve harita pin detay kartlarında `👤 Bildiren: [Şoför/Personel Adı]` alanı gösterildi.
- **Damperli ve Konteyner Çözüm Sayfalarındaki "Haritada Gör" Butonunun Sayfa İçi Haritaya Odaklanması:**
  - Kullanıcı Damperlik Atık Çözümü, Konteyner Arıza Çözümü veya Vatandaş Şikayetleri sayfasındayken "Haritada Gör" butonuna bastığında genel haritaya yönlenmek yerine, doğrudan bulunduğu sayfadaki üst haritayı ilgili pine odaklayıp popup'ı açması ve sayfayı pürüzsüzce yukarı kaydırması (`selectedOperationId` + smooth scroll) sağlandı.
- **Damperli Atık Silme & Harita Senkronizasyonu:**
  - Damperlik atık paneline yönetim için doğrudan silme aksiyonu eklendi; silinen veya toplanan atıkların haritadan ve listelerden anında kaybolması için tRPC `refresh()` ve bileşik anahtarlı (`${category}-${id}`) optimistic state yönetimi optimize edildi.

### [v2.4.8] - 2026-08-20
- **Tonaj Fişi ve Modal Dialoglarının React Portal (`createPortal`) Mimarisine Geçirilmesi:**
  - Tablodaki satır/mesai sayısı arttıkça sayfa uzadığında, CSS transform efektlerinden dolayı `position: fixed` modal katmanının viewport dışına taşması ve arka planın devasa uzaması sorunu kökten çözüldü.
  - Tüm modallar (`receiptModal`, `editingShift`, `editingWaste`, `editingContainer`, `editingComplaint`, `showPurgeModal`, `editingUser`) doğrudan `document.body` üzerine teleport eden React Portal yapısına geçirildi. Sayfada kaç satır olursa olsun modal daima ekranın tam merkezine sabitlenir.
- **Çoklu Tonaj Fişi Galeri Düzeni (Multi-Image Grid):**
  - 1 adet tonaj fişi yüklendiğinde kompakt tekli kart görünümü (`max-w-md`), 2 veya daha fazla tonaj fişi olduğunda ise yan yana 2 sütunlu (`max-w-2xl grid-cols-1 sm:grid-cols-2`) nizamlı kart ızgarası devreye alınarak dikey taşma ve üst üste binme sorunları giderildi.
  - Her bir fiş için `h-[46vh]` sabit yükseklikli ve `object-contain` özellikli beyaz zeminli çerçeve oluşturularak fişlerin birbirini ezmesi engellendi.
- **CSS `fadeIn` Animasyonu İyileştirmesi:**
  - `client/src/index.css` dosyasındaki `.view-transition` `fadeIn` animasyonundan `translateY` kaldırılarak saf opaklık geçişine dönüştürüldü ve çocuk bileşenlerdeki sabit konumlandırma bozulmaları önlendi.

### [v2.4.7] - 2026-08-20
- **Mahalle Analiz Tablosu Tarih ve Metrik Sıralaması (Sorting):**
  - Analiz çubuğuna ve tablo başlıklarına gelişmiş sıralama özelliği entegre edildi.
  - Seçenekler: `📅 Tarih (Yeniden Eskiye)`, `📅 Tarih (Eskiden Yeniye)`, `⚖️ Tonaj (Çoktan Aza)`, `⚖️ Tonaj (Azdan Çoka)`, `🚛 Sefer (En Çok Sefer)`, `🔤 Mahalle Adı (A-Z)`.
  - Tablo sütun başlıklarına (`Mahalle`, `Son Sefer Tarihi`, `Çöp Seferi`, `Toplam Tonaj`) tıklandığında anlık yön göstergeli (▲ / ▼) dinamik sıralama tetiklenir.
- **Tonaj Fişi Modal Arka Plan & Ölçek Dengelemesi:**
  - Geniş ekranlarda tüm sayfayı karartan koyu siyah arka plan katmanı kaldırıldı; hafif, ferah ve modern `bg-black/35 backdrop-blur-xs` arayüz filtresine dönüştürüldü.
  - Fiş modalının genişliği kompakt (`max-w-md`) ölçeğe çekildi; fotoğraflar doğal oranlarında ve net biçimde gösterilerek görsel ferahlık sağlandı.

### [v2.4.6] - 2026-08-20
- **Mahalle Denetim Tablosuna Sefer Tarihi Sütunu:**
  - "Mahalle Bazlı Kapsamlı Tonaj ve Operasyon Denetim Tablosu"na her mahalle için son yapılan seferin kesin tarihini (`📅 Son Sefer Tarihi`, örn: `20.08.2026` veya `Son: 20.08.2026 (2 Sefer)`) gösteren özel bir sütun eklendi.
- **Kantar Fişi Terminolojisinin "Tonaj Fişi" Olarak Güncellenmesi:**
  - Projedeki tüm sekme, buton, tablo başlığı ve modal metinlerindeki *"Kantar Fişi"* ibareleri belediye operasyon standardı gereği *"Tonaj Fişi"* olarak revize edildi.
- **Tonaj Fişi Modal & Görüntüleme Optimizasyonu (Lightbox İyileştirmesi):**
  - Fiş görüntüleme modalının aşırı karartıcı arka planı yumuşatılarak modern `bg-slate-950/60 backdrop-blur-sm` yarı saydam efektine dönüştürüldü.
  - Kart boyutu dengeli `max-w-xl` ölçeğine getirildi; fiş fotoğraflarının orijinal en-boy oranı ve netliği korundu.
  - Fiş detaylarına `Tam Boyut Aç` (`ExternalLink`) butonu eklenerek küçük kantar/tonaj yazılarını orijinal çözünürlükte yeni sekmede inceleme imkanı sağlandı.

### [v2.4.5] - 2026-08-20
- **Tarihe Göre Dinamik Filtreleme (Tek Gün & Tarih Aralığı Seçimi):**
  - "Mahalle Bazlı Kapsamlı Tonaj ve Operasyon Denetim Tablosu" ve üstündeki tüm KPI kartlarına takvimden özel gün (`[🎯 Belirli Gün Seç]`) ve tarih aralığı (`[↔️ Tarih Aralığı]`) seçme özellikleri eklendi.
  - Seçilen günün tarihi (Örn: *20 Ağustos 2026 Perşembe*) rozette gösterilir ve tüm mahallelerin sefer sayıları, tonajları, atık/arıza/şikayet sayıları ve vardiya dağılımları seçilen tarihe göre anında yeniden hesaplanıp listelenir.

### [v2.5.0] - 2026-08-21
- **Rol Bazlı Operasyonel Yetki Ayrımı (Role Security & Access Hardening):**
  - **Konteyner Arızası Kapatma:** Yalnızca `kaynak personeli` ve `yönetim` rolleri konteyner arızalarını onarıp kapatabilir. Şoförler ve kademe personeli arıza kaydı açabilir ancak kapatamaz.
  - **Damperlik Atık Toplama:** Yalnızca `yönetim` ve **aktif olarak damperli kamyon ile mesaiye çıkmış olan şoförler** toplayıp kapatabilir. Çöp kamyonu şoförleri ve kademe personeli atığı toplayamaz; harita pin kartında "Atığı Topla" butonu çöp kamyonu şoförlerine gösterilmez.
  - **Harita Pin Senkronizasyonu:** Başarısız işlem durumunda pinin haritadan kaybolması (premature optimistic removal) engellendi; pinler yalnızca backend mutasyonu başarıyla tamamlandığında güncellenir.
- **Operasyon Özeti (Dashboard) Aktif Vatandaş Şikayetleri Bölümü:**
  - Operasyon Özeti sayfasının altına tüm aktif/onay bekleyen vatandaş şikayetlerini gösteren **"Aktif Vatandaş Şikayetleri"** özet kartı eklendi.
  - "Haritada Gör / İncele" butonuna tıklandığında kullanıcıyı doğrudan detaylı şikayet yönetimi olan **"Vatandaş Şikayetleri"** sekmesine taşır.
- **Mobil Uyumluluk & Konum/GPS Arayüz Düzenlemeleri:**
  - Anlık GPS konumu alındığında gelen uzun adres dizesinin mobil ekranlarda taşması ve sayfayı genişletmesi engellendi (`truncate max-w-full overflow-hidden`).
  - "Adresi Bul" ve "Anlık Konum" butonları mobil ekranlarda yatayda esnek hizalandı.
  - Enlem ve Boylam kutuları mobilde alt alta kaba durmak yerine yan yana 2 sütunlu kompakt bir alana alındı.
- **Fotoğraf İnceleme Lightbox Z-Index & Portal Optimizasyonu:**
  - Harita pin kartlarından ve listelerden açılan fotoğraf Lightbox pencereleri `createPortal(..., document.body)` ile en üst DOM katmanına (`z-[99999]`) taşındı.
  - Fotoğraf kapatıldığında pin detay kartı arkada bozulmadan açık kalmaya devam eder.
- **Bildirim Mesajları (Sonner Toasts) %100 Mat ve Yüksek Kontrast:**
  - Saydam/transparan zemin yerine %100 opak/mat zeminler ve yüksek kontrastlı renkler (`#064e3b` yeşil, `#7f1d1d` kırmızı, `#78350f` kehribar, `#0c4a6e` mavi) uygulandı.
  - `z-index: 999999` ve derin gölge (`shadow-2xl`) ile tüm harita, menü ve form pencerelerinin en üstünde net okunurluk sağlandı.
- **İstemci Taraflı Görsel Ön Sıkıştırma (HTML5 Canvas Compression):**
  - Mobil kamera çekimleri (10-15MB) istemcide canvas ile 1280px / ~120KB seviyesine sıkıştırılarak mobil veri tasarrufu ve hızlı yükleme sağlandı.
- **Tepebaşı Kapsamlı Test & Demo Veri Paketi (`seed_test_data.sql` / `server/seed-test-data.ts`):**
  - Gerçek Tepebaşı mahalleleri ve harita koordinatlarıyla 65 Damperlik Atık, 65 Konteyner Arızası ve 10 Vatandaş Şikayeti (toplam 140 operasyonel kayıt) SQL ve script olarak projeye eklendi.
  - TiDB Cloud ve MySQL uyumlu 25'şerli optimize edilmiş batch INSERT bloklarıyla hatasız içe aktarma sağlandı.

### [v2.4.15] - 2026-08-21


- **Yönetim Raporları ve Analiz Sayfasına Kapsamlı "Sistem Denetim Logları" Sekmesi Eklendi:**
  - `ManagementOperations.tsx` içerisine **`📜 Sistem Denetim Logları`** sekmesi ve üst navigasyon rozeti eklendi.
  - **4 Boyutlu KPI İstatistik Kartları:**
    1. 📊 *Filtrelenen İşlemler* (dinamik sayı).
    2. 📅 *Bugünkü Hareketler* (günün toplam işlem hacmi).
    3. 👤 *En Aktif Personel* (seçilen zaman aralığında en çok işlem gerçekleştiren kullanıcı ve adedi).
    4. ⚡ *En Çok Yapılan İşlem* (en yoğun gerçekleşen eylem türü).
  - **Kapsamlı Filtreleme ve Arama Paneli:**
    - **Zaman Aralığı:** `[📅 Bugünün Logları]`, `[⏱️ Son 7 Gün]`, `[🗓️ Bu Ay]`, `[📊 Tüm Zamanlar]`, `[🎯 Belirli Gün Seç]` (takvimden gün seçimi) ve `[↔️ Tarih Aralığı]` (başlangıç/bitiş tarihleri).
    - **Eylem Kategorisi (Pills):** `[Tüm Eylemler]`, `[🚛 Mesailer]`, `[📦 Damperlik Atık]`, `[🏗️ Konteyner Arızası]`, `[🚨 Vatandaş Şikayeti]`, `[🔧 Araç & Kademe]`, `[⚙️ Yönetim & Sistem]`.
    - **Personel Filtresi:** Sistemdeki tüm kullanıcıları isim, kullanıcı adı ve rolleriyle listeleyen dropdown filtresi.
    - **Canlı Metin Arama:** İşlem detayı, eylem adı, kullanıcı bilgisi ve ID bazlı anlık arama.
  - **Denetim İzi Tablosu:**
    - Tarih & Saat (Türkçe yerel format ve "Bugün" etiketi),
    - Personel / Aktör (Avatar, İsim, @kullanıcı_adı, Rol rozeti),
    - Eylem Türü (Renkli ve ikonlu eylem rozetleri: ✅ Başlatıldı/Kapatıldı/Onaylandı, 📢 Bildirildi, ✏️ Güncellendi, 🗑️ Silindi/Sıfırlandı),
    - Hedef Varlık ve Kayıt ID (`mesai #42`, `damperlik_atık #14`, vb.),
    - İşlem Detayı ve Açıklama kutusu.
  - **Sayfalama (Pagination):** Sayfa başına 25 kayıt, önceki/sonraki sayfa kontrolleri ve sayfa göstergesi.
  - **Backend Log Limiti Artırımı:** `listAuditLogs` sorgusu 100 kayıttan 1000 kayda çıkarılarak yöneticilerin geçmişe dönük geniş hareketleri analiz edebilmesi sağlandı.

### [v2.6.0] - 2026-08-25
- **PWA (Progressive Web App) & "Ana Ekrana Ekle" Desteği:**
  - Web uygulamasının hem Android hem iOS (iPhone/iPad) cihazlarda App Store/Play Store'a ihtiyaç duymadan gerçek bir mobil uygulama gibi ana ekrana eklenip **tam ekran (standalone, adres çubuğu olmadan)** çalışması sağlandı.
  - `client/public/manifest.json` dosyası yapılandırıldı (`display: "standalone"`, `theme_color: "#083d2d"`, `icons: [192x192, 512x512]`).
  - `PWAInstallPrompt.tsx` bileşeni entegre edildi:
    - **Android / Chrome:** Doğal `beforeinstallprompt` API'si ile tek tıkla yükleme daveti.
    - **iOS / Safari:** Safari'nin Paylaş (`⬆️`) ve "Ana Ekrana Ekle" adımlarını gösteren görsel rehber modalı.
    - **Rahatsız Etmeme:** Kullanıcı "Daha Sonra" dediğinde 2 gün boyunca tekrar sormayan, uygulama zaten standalone açıldığında hiç görünmeyen akıllı kontrol.
  - `manifest.json` ve arayüzdeki logo kırpılma/yakınlaşma sorunları `purpose: "any"` ve `p-2.5` nefes payı ile tam ölçekli hale getirildi.
- **Haritada GPS Konumu & Navigasyon Buton Çakışmasının Çözümü:**
  - Haritada bir pine dokunulup alt detay kartı açıldığında, arka plandaki floating `[📍 Şu Anki Konumumu Göster]` butonu otomatik olarak gizlenerek çakışma sıfırlandı.
  - Detay kartı içindeki buton `[🧭 Yol Tarifi Al]` olarak belirginleştirildi; kart kapatıldığında veya haritada boşluğa dokunulduğunda GPS butonu tekrar görünür hale gelir.
- **Giriş Ekranı (Login Landing) Mobil Ergonomisi:**
  - Kısayoldan veya mobilden girildiğinde dikey ekran boşlukları optimize edildi, giriş kartı doğrudan odak noktasına getirildi ve form alanları dokunmatik ekranlara uygun hale getirildi.
- **Konteyner Arıza & Onarım Yetki Sınırlandırması:**
  - Şoför ve kademe personelinin ekranlarından konteyner arıza bildirme ve kapatma sekmeleri kaldırıldı.
  - Backend API (`containerFaults.create` ve `containerFaults.repair`) yalnızca **`kaynak personeli`** ve **`yönetim`** rollerine sınırlandırıldı.
- **175 Metre Geofencing & Saha Konum Doğrulaması:**
  - Damperlik atık toplama işleminde (`bulkWaste.collect`), yalnızca damperli araçla mesaisi açık olan şoförler ve yöneticiler atık toplayabilir (kademe personeli bu yetkiden çıkarılmıştır). Şoförlerin atık koordinatına en fazla **175 metre** yakınlıkta olması zorunluluğu getirildi (Haversine formülü ile sunucuda ve istemcide doğrulanır). Yönetim personeli konum kısıtlamasından muaftır.
  - Damperlik atık toplama işleminde fotoğraf yükleme isteğe bağlıdır.

- **12 Saatlik Kararlı Vardiya Oturumu (Sessioning) & Mobil Safari/Chrome Çıkış Koruması:**
  - Sunucu JWT token ömrü ve istemci Session Cookie süresi tam **12 saat** (`12 * 60 * 60 * 1000 ms`) olarak senkronize edildi.
  - Cookie güvenlik politikası `sameSite: "lax"` olarak güncellenerek iOS Safari (Apple ITP) ve Android Chrome mobil tarayıcılarında oturumun erken düşmesi engellendi.
  - İstemci `useAuth` hook'unda `retry: 1` eklenerek kırsal alan ve tünellerdeki 1-2 saniyelik geçici mobil ağ kopmalarında kullanıcının sistemden atılması önlendi.
- **Sayfa Yenileme (F5) ve Sekme Durumunun Korunması (Navigation Persistence):**
  - Kullanıcının bulunduğu aktif sekme `localStorage` (`tepebasi_app_view`) ve URL sorgu parametresi (`?view=...`) ile senkronize edildi. Sayfa yenilendiğinde (F5) veya veri mutasyonları sonrası kullanıcı bulunduğu sekmede kalır, ana sayfaya atılmaz.
- **Sol Menü (Sidebar) Ergonomisi & Kullanıcı Profili Üste Taşıma:**
  - Aktif kullanıcı profili ve `[Çıkış]` butonu, sol menünün en altından alınıp doğrudan **Tepebaşı Belediyesi logosunun hemen altına** yerleştirildi. Böylece uzun menü listelerinde aşağı kaydırma ihtiyacı ortadan kaldırıldı.
- **Üst Başlıkta Kompakt "Yenile" Butonu (`[🔄 Yenile]`):**
  - Üst header alanına sayfa ve operasyonel verileri sıfırdan tazeleyen kompakt `[🔄 Yenile]` butonu entegre edildi.
- **Damperlik Atık Listesinde Canlı GPS Mesafe Rozeti & En Yakındakiler Sıralaması:**
  - Damperlik atık listesindeki her kaydın üzerine şoförün anlık GPS mesafesi rozet olarak eklendi (`📍 65m Toplamaya Uygun ✅` / `📍 340m` / `📍 1.2 km`).
  - `[⚡ En Yakındakiler / Normal Sıralama]` butonu ile şoföre en yakın atıklar otomatik ilk sıraya dizilir. Şoför 175 metre içindeyken haritayı açmadan doğrudan listeden atığı toplayabilir.
- **Titreşimli Geri Bildirim (Haptic Feedback):**
  - Atık toplama, şikayet kapatma, konteyner tamamlama ve form işlemlerinde mobil cihazlarda dokunsal titreşim (`navigator.vibrate`) desteği devreye alındı.
- **Operasyon Haritası Sadeleştirmesi:**
  - Harita üzerindeki gereksiz şoför pinleri ve kılavuz simgeleri kaldırılarak sadece operasyonel atık/arıza/şikayet pinleri bırakıldı. Şoförün kendi telefon GPS konumunu görmesi için `[📍 Şu Anki Konumumu Göster]` butonu aktifleştirildi.

### [v2.4.14] - 2026-08-21


- **Toolbar Navigasyon Düzeni & İsim Sadeleştirmesi:**
  - `Mesai Yönetimi` menü öğesi, şoförler ve yöneticiler için doğrudan `Operasyon Özeti` (Dashboard) öğesinin hemen altına taşındı.
  - Toolbar üzerindeki `Operasyon Haritası & Bildirimler` menü başlığı `Operasyon Haritası` olarak sadeleştirildi.
- **Mesai Başlatma Ekranı Sadeleştirmesi:**
  - Şoför mesai başlatma formundan `Bölge` giriş kutusu kaldırıldı; bölge bilgisi seçilen mahalleye göre otomatik doldurulur.
- **Mesai Sonlandırmada Tonaj Girişi Zorunluluğu & Fiş İsteğe Bağlılığı:**
  - Mesai sonlandırma formunda tonaj bilgisi girişi zorunlu (`Tonaj (Zorunlu)`) hale getirildi; kantar/tonaj fişi fotoğrafı yükleme ise isteğe bağlı (`Tonaj Fişi (İsteğe Bağlı)`) bırakıldı. Şoförler tonaj bilgisini girip fiş fotoğrafı yüklemeden de mesaiyi kapatabilir.
- **Vatandaş Şikayet Kaydı Yetkilendirmesi:**
  - Vatandaş şikayeti bildirme formu (`ComplaintPanel`) ve backend mutasyonu (`complaints.create`) yalnızca `yönetim` rolüne tahsis edildi; şoförler için bildirim formu gizlendi ve sadece harita & çözüm akışı aktif bırakıldı.

### [v2.4.12] - 2026-08-21
- **Operasyonel Listelerde Yalnızca Aktif ve Bekleyen Kayıtların Listelenmesi:**
  - **Damperli Atık Listesi:** Saha çözümü ve yönetim sekmelerinde çözülen (`toplandı`) atıklar filtrelenerek yalnızca toplanma bekleyen (`status: 'bekliyor'`) damperlik atıklar listelenir.
  - **Konteyner Arıza Listesi:** Saha onarımı ve yönetim sekmelerinde onarımı tamamlanan konteynerler filtrelenerek yalnızca onarım bekleyen (`status: 'bekliyor'`) arızalar listelenir.
  - **Vatandaş Şikayet Listesi:** Saha şikayetleri ve yönetim sekmelerinde onaylanarak kapatılan şikayetler filtrelenerek yalnızca müdahale bekleyen (`status: 'açık'`) ve yönetici onayı bekleyen (`status: 'onay_bekliyor'`) şikayetler listelenir.

### [v2.4.11] - 2026-08-21
- **Vatandaş Şikayetlerinde Zorunlu Çözüm Fotoğrafı & Yönetici Onay Akışı:**
  - Şoförler artık vatandaş şikayetlerini fotoğraf yüklemeden kapatamaz.
  - Şoför "Çözüm Fotoğrafı Yükle & Kapat" butonuna bastığında kamera/galeri destekli fotoğraf yükleme modalı açılır ve müdahale sonrası temizlik fotoğrafı yüklenir.
  - Şikayet doğrudan kapanmaz, `onay_bekliyor` (⏳ Yönetici Onayı Bekliyor) durumuna geçer.
  - Yönetici, şikayetler panelinden ve haritadan yüklenen çözüm fotoğrafını inceleyerek "✅ Onayla & Kapat" veya "❌ Reddet" (tekrar açık duruma getir) işlemi gerçekleştirir.
  - Şikayet listelerinde ve harita kartlarında bildiren, çözen şoför ve onaylayan yönetici bilgileri açıkça gösterilir.
- **Araç Yağ Bakım Kilometresi (`nextOilMaintenanceKm`):**
  - `vehicles` tablosuna `nextOilMaintenanceKm` kolonu eklendi.
  - Sadece **kademe personeli** ve **yönetim** rolleri tarafından yeni araç ekleme formunda ve "Araç Bilgisi Düzenle" modalında belirlenebilir/güncellenebilir.
  - Araçlar listesinde "Yağ Bakımı (KM)" sütunu olarak listelenir.
  - Şoför veya yönetici mesai başlatırken ilgili aracı seçtiğinde araç seçiminin altında belirgin bir bilgilendirme kartı çıkar: `🛢️ Bu aracın [X] KM'de yağ bakımı bulunmaktadır.`
  - Araç seçim dropdown seçeneklerinde de `[🛢️ X KM]` etiketi yer alır.

### [v2.4.10] - 2026-08-21
- **Açıklama Alanlarının İsteğe Bağlı Yapılması:**
  - Damperlik atık, konteyner arızası ve araç arıza bildirimlerindeki açıklama alanları isteğe bağlı hale getirildi (boş bırakıldığında otomatik `"Açıklama belirtilmedi"` fallback'i atanır).

### [v2.4.4] - 2026-08-20
- **Kantar / Tonaj Fişi İnceleme & Lightbox:**
  - Yönetim Raporları (`Mesailer` sekmesi) tablosunda kantar fişi yüklenmiş tüm mesailere `📸 Kantar Fişi (X)` butonu eklendi.
  - Tıklandığında kantar fişlerini tam çözünürlükte gösteren modern bir Lightbox modalı açılır.
  - Mesai düzenleme modalına da yüklenen fiş fotoğraflarının önizleme küçük resimleri ve büyütme butonu entegre edildi.
- **Mahalle Bazlı Kapsamlı Tonaj & Günlük Denetim Analizi (`Genel Özet` Sekmesi):**
  - Yönetim raporlarının `Genel Özet` sekmesi günlük belediye denetim standartlarına uygun kapsamlı bir analiz merkezine dönüştürüldü:
    1. **Zaman Aralığı Filtresi:** `[📅 Bugünün Denetimi]`, `[⏱️ Son 7 Gün]`, `[🗓️ Bu Ay]`, `[📊 Tüm Zamanlar]`, `[🎯 Belirli Gün Seç]`, `[↔️ Tarih Aralığı]`.
    2. **Bölge & Mahalle Arama:** Dinamik bölge filtreleme ve arama desteği.
    3. **KPI Kartları:** Toplam Tonaj, Sefer Başına Ortalama Tonaj, En Çok Atık Çıkan Mahalle (% Payıyla), Bekleyen Saha İşleri.
    4. **Vardiya Tonaj Analizi:** Gündüz, Akşam ve Gece vardiyalarının ayrı ayrı tonaj, sefer ve yüzde dağılım göstergesi.
    5. **Mahalle Bazlı Kapsamlı Denetim Matrisi:** Her mahalle için tamamlanan sefer sayısı, çekilen toplam tonaj, sefer ortalaması, görsel ilerleme çubuğuyla tonaj payı, damperlik atık, konteyner arızası, vatandaş şikayeti ve denetim durumu rozeti (🟢 Temiz, 🟡 Müdahale Bekliyor, 🔵 Mesai Sürüyor, ⚪ Sefer Yapılmadı).

---
*Doküman Sürümü: v2.6.0 (Canlı Şema, Mobil Saha UX & Operasyonel Devir Standardı)*  
*Son Güncelleme: 2026-08-25*



