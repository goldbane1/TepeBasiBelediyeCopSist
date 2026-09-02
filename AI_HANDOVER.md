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
| **Ana Sayfa / Hızlı İşlem Menüsü** | ✅ | ✅ | ✅ | ✅ |
| **Tüm Operasyonlar Haritası** | ✅ | ✅ | ❌ (Kendi sayfasındaki özel haritayı kullanır) | ❌ |
| **Mesai Başlatma / Bitirme (Kendi Adına)** | ❌ | ✅ | ❌ | ❌ |
| **Şoför Adına Mesai Başlatma & Bitirme** | ✅ | ❌ | ❌ | ❌ |
| **Şoför Geçmiş 10 Mesai Tablosu** | ❌ | ✅ (Kendi mesaileri) | ❌ | ❌ |
| **Damperlik Atık Bildirme (Saha Kaydı)** | ✅ | ✅ (Aktif mesaisi olan tüm şoförler) | ❌ | ❌ |
| **Damperlik Atığı Toplayıp Kapatma** | ✅ | ✅ (Damperli kamyon şoförü + 175m GPS) | ❌ | ❌ |
| **Konteyner Arızası Bildirme** | ✅ | ✅ (Sade dokunmatik form) | ✅ | ❌ |
| **Konteyner Onarımını Tamamlama/Kapatma** | ✅ | ❌ | ✅ (175m GPS Doğrulaması ile Tek Sorumlu) | ❌ |
| **Vatandaş Şikayeti Kaydetme** | ✅ | ❌ | ❌ | ❌ |
| **Vatandaş Şikayetini Çözüm Fotoğrafıyla Kapatma** | ✅ | ✅ (Çözüm fotoğrafı ile onay_bekliyor) | ❌ | ❌ |
| **Vatandaş Şikayetini Onaylama & Kesin Kapatma** | ✅ | ❌ | ❌ | ❌ |
| **Araç Envanteri Ekle/Düzenle/Sil** | ✅ | ❌ | ❌ | ✅ |
| **Araç Yağ Bakım KM Tanımlama (`nextOilMaintenanceKm`)**| ✅ | ❌ | ❌ | ✅ |
| **Araç Arıza Bildirme** | ✅ | ✅ | ✅ | ✅ |
| **Araç Kademe Onayı & Bakımdan Çıkarma** | ✅ | ❌ | ❌ | ✅ |
| **Mahalle Yönetimi (Ekle/Düzenle/Sil)** | ✅ | ❌ | ❌ | ❌ |
| **Yönetim Raporları, CRUD ve Veri Sıfırlama**| ✅ | ❌ | ❌ | ❌ |
| **Personel / Kullanıcı Yönetimi** | ✅ | ❌ | ❌ | ❌ |
| **Profil Bilgileri & Şifre Güncelleme** | ✅ | ✅ | ✅ | ✅ |

---

## 5. Kritik İş Mantığı ve İş Akışları (Business Logic & Workflows)

### 5.1. Mesai ve Vardiya Yönetimi (`shifts`)
- **3 Sabit Vardiya Saati:** `08:00 - 16:00`, `16:00 - 00:00`, `00:00 - 08:00`.
- **Dinamik Mahalle:** Şoför veya yönetici mesai başlatırken veritabanındaki `neighborhoods` listesinden seçim yapar. Seçilen mahalleye bağlı `region` (bölge) otomatik set edilir.
- **Tek Aktif Mesai Kuralı:** Bir şoförün aynı anda yalnızca 1 açık mesaisi olabilir.
- **Aktif Mesai Kartı (Dashboard & Mesai Ekranı En Üstü):** Şoför mesai başlattığında aktif mesai bilgisi ve sonlandırma formu hem Mesai ekranının hem de Ana Sayfa'nın (Dashboard) en tepesinde sabitlenir. Şoför sayfayı kaydırmak zorunda kalmadan doğrudan Ana Sayfa'dan tek tıkla mesai bitirme işlemine erişebilir veya mesai yönetiminde en üstteki formdan bitirebilir.
- **Mesai Bitirme:** Bitiş kilometresi girilir (`endKm >= startKm`). Zorunlu tonaj bilgisi ve isteğe bağlı kantar fişi fotoğrafları (`tonnageReceipts` Base64 dizisi) kaydedilir.

### 5.2. Şoför Görev Bölgesi Şikayet Alarmı
- Şoför aktif bir mesaideyken (`activeShift`), mesai yaptığı mahallede (`activeShift.neighborhood`) açık bir vatandaş şikayeti (`citizenComplaints.status = 'açık'`) varsa:
  - Dashboard'un en tepesinde yanıp sönen kırmızı acil durum uyarı banner'ı belirir (`🚨 GÖREV BÖLGENİZDE X AÇIK ŞİKAYET VAR`).
  - Şoför tek tıkla şikayeti inceleyip sahada temizliği tamamlayarak şikayeti kapatabilir.

### 5.3. Damperlik Atık Çözümü (`bulkWasteReports`)
- Aktif mesaisi olan tüm şoförler (çöp kamyonu veya damperli kamyon) gördükleri atıkları tek tıkla GPS konumu alarak bildirebilir (`bulkWaste.create`).
- Bildirime otomatik olarak `NOW() + 2 GÜN` (veya acilse 24 saat) termin tarihi atanır.
- **Harita İkazı:** Süresi geçmemiş atıklar yeşil pin, süresi geçmiş atıklar kırmızı pin (acil) olarak görünür.
- **175m Saha Konum Doğrulaması:** Damperli kamyon şoförü atığın yanına gittiğinde sistem anlık GPS mesafesini kontrol eder; şoför 175 metre mesafe içindeyse atığı toplayabilir (`bulkWaste.collect`). Yönetim personeli konum kısıtlamasından muaftır.

### 5.4. Konteyner Arıza Çözümü (`containerFaults`)
- Şoförler ve kaynak personeli, sahada karşılaştıkları arızalı çöp konteynerlerini (kaldırma kolu, ayak/tekerlek, gövde, kapak vb.) tek tıkla GPS alarak sade formla bildirebilir (`containerFaults.create`).
- **Kaynak Personeli & 175m Saha Doğrulaması:** Arıza listesinden veya haritadan kaydı seçer, onarım notunu yazar ve kaydı onarılmış (`onarım_tamamlandı`) olarak kapatır (`containerFaults.repair`). Kaynak personeli onarımı tamamlarken cihazın GPS konumu alınır ve konteynere en fazla **175 metre** mesafede olması zorunlu tutulur. Şoför ve kademe personelinin arıza kapatma yetkisi yoktur.

### 5.5. Vatandaş Şikayetleri & Yönetici Onay Akışı (`citizenComplaints`)
- Şikayet bildirme yetkisi yalnızca **yönetim** rolündedir (`complaints.create`).
- Şoför sahada şikayetli bölgeyi temizledikten sonra **zorunlu çözüm fotoğrafı** yükleyerek çözüldü talebi gönderir (`status = 'onay_bekliyor'`).
- Yönetici, şikayet panelinden veya haritadan yüklenen çözüm fotoğrafını inceleyerek "✅ Onayla & Kapat" veya "❌ Reddet" işlemi uygular (`complaints.approve` / `complaints.reject`).

### 5.6. Rol Güvenliği (Route Guard) & Hızlı İşlem Menüsü (Quick Launcher)
- Ana sayfada her rolün yetkilerine uygun, 2 sütunlu mobil dokunmatik butonlardan oluşan Hızlı İşlem Menüsü bulunur.
- Hesap geçişlerinde veya yetkisiz `?view=...` sorgularında sistem kullanıcının rol yetkilerini kontrol eder; yetkisiz erişim denemelerinde kullanıcıyı anında güvenli `dashboard` (Ana Sayfa) ekranına yönlendirir.
- Yeni oturum açılışlarında her zaman Ana Sayfa'ya yönlendirilir; oturum açıkken yapılan sayfa yenilemelerinde (F5) aktif sekme korunur.
- **Otomatik Sayfa Başı Kaydırma (Scroll to Top):** Menüden veya hızlı butonlardan herhangi bir sayfaya geçildiğinde ekran otomatik olarak en üst konuma (`top: 0`) kaydırılır; mobilde önceki sayfanın kaydırma konumunda kalınması önlenir.

### 5.7. Konum ve Geocoding Mimarisi (Forward & Reverse Geocoding)
Tüm operasyonel bildirim formlarında iki yönlü OpenStreetMap (Nominatim) entegrasyonu vardır:
1. **Düz Geocoding (Forward Geocoding - Adresten Koordinat Bulma):**
   - Kullanıcı bir sokak, cadde veya mahalle ismi yazar. Sistem Nominatim API'sine `query + ", Tepebaşı, Eskişehir"` sorgusu atar.
   - Enlem (`latitude`) ve boylam (`longitude`) otomatik doldurulur.
2. **Ters Geocoding (Reverse Geocoding - GPS'ten Adres Bulma):**
   - Kullanıcı **"Anlık GPS Al"** butonuna basar (`navigator.geolocation` yüksek hassasiyet modu).
   - Alınan koordinat Nominatim reverse API'sine gönderilerek mahalle ve sokak adı form alanına doldurulur.


### 5.8. Operasyon Haritası ve Pin Özellikleri (`OperationsMap.tsx`)
- **Rol Bazlı Harita Görünürlüğü:**
  - `kademe personeli`: Operasyon haritası menüsünden ve arayüzünden kaldırılmıştır.
  - `kaynak personeli`: Haritada **yalnızca konteyner arızaları** pinleri görünür; damperlik atık ve şikayet sekmeleri kaynakçılar için tamamen gizlenir.
- **Tekil Harita Filtreleme:** Her operasyon sekmesinde (`Konteyner`, `Damperlik Atık`, `Şikayetler`) sadece o kategoriye ait özel harita gösterilir.
- **Fotoğraf Önizleme & Lightbox:** Pin tıklandığında yüklenen fotoğrafın küçük önizlemesi çıkar; tıklandığında tam ekran yüksek çözünürlüklü Lightbox açılır.
- **Doğrudan Pinden Kapatma:** Yetkili personel pin üzerindeki butona basarak listede aramaya gerek kalmadan görevi haritadan kapatabilir.
- **Kompakt Bildirim Tablosu:** Ana haritanın altında fotoğrafsız, kompakt, doğrudan pine odaklayan (`Pini Göster`) bir özet bildirim listesi bulunur.



---


### 5.9. Yönetim Raporları, Denetim ve Resmi Raporlama Motoru (`ManagementOperations.tsx`)
- **Kurumsal Enterprise SaaS Tasarımı:**
  - Sekme gezinme yapısı tek satırlı, yatayda kaydırılabilir Segmented Control mimarisine dönüştürülmüştür.
  - Riskli fabrika ayarlarına döndürme ("Sıfırlama") eylemi ana sekmelerden izole edilerek sağda kırmızı onay butonu olarak konumlandırılmıştır.
  - Arayüzdeki tüm gayriciddi semboller/emojiler kaldırılmış; yerlerine ince, kurumsal Lucide SVG ikonları entegre edilmiştir.
  - Tüm sekmelere, 4 ana KPI kartına, vardiya analizine ve tablo sütun başlıklarına Radix UI tabanlı `AdminInfoTooltip` `(i)` açıklama rozetleri yerleştirilmiştir.
- **Global Tarih & Dönem Filtresi:**
  - Tarih filtresi sekmelerin dışına çıkarılarak tüm sekmelerin (`Genel Bakış`, `Mesai & Tonaj`, `Damperlik Atık`, `Konteynerler`, `Şikayetler`, `Sistem Logları`) üzerinde çalışan **Global Üst Araç Çubuğu** haline getirilmiştir.
  - Kullanıcı hangi sekmede olursa olsun tek tıkla dönem ("Bugün", "Son 7 Gün", "Bu Ay", "Belirli Gün", "Tarih Aralığı") değiştirebilir; tüm alt ekranlar anlık senkronize olur.
- **Canlı "Saha Yoğunluğu" Göstergesi:**
  - Seçili denetim döneminden bağımsız olarak her zaman **Bugün** sahada çalışan araç sayısını (`todayActiveShiftsCount`), kantarda tartılan bugünkü net atık tonajını (`todayAuditTonnage`) ve bugün intikal etmiş açık saha işlerini (`todayTotalWaiting`) gösteren canlı zümrüt durum şeridi devreye alınmıştır.
- **Akıllı Hızlı Görünüm Filtreleri & Mahalle Detay Çekmecesi (Slide-Over Sheet):**
  - Mahalle tablosunun üstüne Linear/Stripe stili 1-tıkla hızlı filtreleme butonları eklenmiştir (`Tüm Mahalleler`, `Müdahale Bekleyenler`, `Sefer Yapılmayanlar`, `En Yüksek Tonaj İlk 10`, `Temiz Mahalleler`).
  - Tablonun sıfır sonuçta çöküp ekranı yukarı fırlatmasını önleyen `min-h-[500px]` taban yüksekliği ve kurumsal boş durum (Empty State) tasarımı sağlanmıştır.
  - Satırlara tıklandığında sağdan kayarak açılan `Sheet` detay çekmecesi eklenmiştir. Mahallenin kantar fişi fotoğrafları, araç plakaları, şoförleri, molozları, arızalı konteynerleri ve şikayetleri 4 iç sekmede lightbox modal desteğiyle incelenebilir.
- **Açık Adresli Resmi Belediye A4 PDF ve UTF-8 BOM Excel (CSV) Raporlama Motoru:**
  - 6 ana sekmenin her biri için sol üstte büyük zümrüt yeşili 'TEMİZLİK İŞLERİ MÜDÜRLÜĞÜ' antetli başlığıyla seçilen döneme özgü resmi A4 yatay PDF ve Türkçe karakter uyumlu Excel dışa aktarma sistemi geliştirilmiştir.
  - Damperlik atık, konteyner arızası ve vatandaş şikayetleri raporlarına cadde, sokak ve bina detayını içeren **"Açık Adres / Konum Detayı"** sütunu entegre edilmiştir.
  - Tüm resmi PDF çıktılarının altına Tepebaşı Belediyesi operasyonel hiyerarşisine tam uyumlu **3 resmi imza alanı** yerleştirilmiştir:
    1. **Saha Sorumlusu** (İmza)
    2. **Vardiya Amiri** (İmza / Kaşe)
    3. **Temizlik İşleri Müdürü** (İmza / Mühür)
- **Güvenlik ve İzolasyon:**
  - Tüm geliştirmeler %100 oranında `client/src/components/ManagementOperations.tsx` içerisinde tutulmuştur. Şoför mesai akışı, mobil kamera optimizasyonu, veritabanı şeması ve backend tRPC yönlendiricileri kesinlikle değiştirilmemiştir.

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

### [v2.12.0] - 2026-09-03 (Son Güncelleme / Güncel Sürüm)
- **Yönetim Paneli Kurumsal Enterprise SaaS Yenilemesi:**
  - Sekme gezinme yapısı tek satırlı, yatayda kaydırılabilir Segmented Control mimarisine dönüştürüldü.
  - Riskli fabrika ayarlarına döndürme ("Sıfırlama") eylemi ana sekmelerden izole edilerek sağda kırmızı onay butonu olarak konumlandırıldı.
  - Arayüzdeki tüm gayriciddi semboller/emojiler kaldırıldı; kurumsal Lucide SVG ikonları entegre edildi.
  - Tüm sekmelere, 4 ana KPI kartına, vardiya analizine ve tablo sütun başlıklarına Radix UI tabanlı `AdminInfoTooltip` `(i)` açıklama rozetleri eklendi.
- **Global Tarih & Dönem Filtre Çubuğu:**
  - Tarih filtresi sekmelerin dışına çıkarılarak tüm sekmelerin üzerinde çalışan **Global Üst Araç Çubuğu** haline getirildi.
  - Kullanıcı hangi sekmede olursa olsun tek tıkla dönem ("Bugün", "Son 7 Gün", "Bu Ay", "Belirli Gün", "Tarih Aralığı") değiştirebilir; tüm alt ekranlar anlık senkronize olur.
- **Canlı "Saha Yoğunluğu" Göstergesi:**
  - Seçili dönem filtresinden bağımsız olarak her zaman **Bugün** sahada çalışan araç sayısını (`todayActiveShiftsCount`), kantarda tartılan bugünkü net atık tonajını (`todayAuditTonnage`) ve bugün intikal etmiş açık saha işlerini (`todayTotalWaiting`) gösteren canlı durum şeridi devreye alındı.
- **Akıllı Hızlı Görünüm Filtreleri & Mahalle Detay Çekmecesi (Slide-Over Sheet):**
  - Mahalle tablosunun üstüne Linear/Stripe stili 1-tıkla hızlı filtreleme butonları eklendi (`Tüm Mahalleler`, `Müdahale Bekleyenler`, `Sefer Yapılmayanlar`, `En Yüksek Tonaj İlk 10`, `Temiz Mahalleler`).
  - Tablonun sıfır sonuçta çöküp ekranı yukarı fırlatmasını önleyen `min-h-[500px]` taban yüksekliği ve kurumsal boş durum (Empty State) tasarımı uygulandı.
  - Satırlara tıklandığında sağdan kayarak açılan `Sheet` detay çekmecesi eklendi. Mahallenin kantar fişi fotoğrafları, araç plakaları, şoförleri, molozları, arızalı konteynerleri ve şikayetleri 4 iç sekmede lightbox modal desteğiyle sunulur.
- **Açık Adresli Resmi Belediye A4 PDF ve UTF-8 BOM Excel (CSV) Raporlama Motoru:**
  - 6 ana sekmenin her biri için seçilen döneme özgü resmi A4 yatay PDF ve Türkçe karakter uyumlu Excel dışa aktarma sistemi tamamlandı.
  - Konteyner veritabanı tarih sütunu uyuşmazlığı (`createdAt || reportedAt`) giderilerek 0 arıza durumunda bile resmi tutanak basılması sağlandı.
  - Damperlik atık, konteyner arızası ve vatandaş şikayetleri raporlarına cadde, sokak ve bina detayını içeren **"Açık Adres / Konum Detayı"** sütunu entegre edildi.
  - Tüm resmi PDF çıktılarının altına Tepebaşı Belediyesi hiyerarşisine tam uyumlu **3 resmi imza alanı** yerleştirildi:
    1. **Saha Sorumlusu** (İmza)
    2. **Vardiya Amiri** (İmza / Kaşe)
    3. **Temizlik İşleri Müdürü** (İmza / Mühür)
- **Güvenlik ve İzolasyon:**
  - Yapılan tüm geliştirmeler %100 oranında `client/src/components/ManagementOperations.tsx` içerisinde tutuldu. Şoför mesai akışı, mobil kamera optimizasyonu, veritabanı şeması ve backend tRPC yönlendiricileri tamamen izole kaldı.

### [v2.11.0] - 2026-09-02
- **Harita Altyapısı, Katman ve Zoom Optimizasyonları:**
  - Filigranlı harita sağlayıcıları (CartoDB) ve kararsız sistemler kaldırıldı; Leaflet harita omurgası %100 açık kaynaklı ve ücretsiz olan **Açık Harita (OpenStreetMap)** varsayılanına geçirildi.
  - Alternatif olarak dükkan, market ve ticari işletme etiketleri filtrelenmiş sade **Google Haritalar (Sade)** katmanı entegre edildi.
  - Haritaya kesin zoom sınırları (`minZoom: 10`, `maxZoom: 18`, `maxNativeZoom: 18`) tanımlanarak aşırı yakınlaşmada oluşan beyaz ekran boşluğuna düşme hatası kalıcı olarak giderildi.
  - Haritada herhangi bir binaya veya sokağa tıklandığında anlık olarak o noktanın sokak ve kapı numarasını gösteren etkileşimli Leaflet bilgi balonu (`popup`) eklendi.
  - Tüm harita standartları Yönetim, Şoför ve Kaynak Personeli olmak üzere tüm roller için ortaklaştırıldı.
- **Giriş Ekranı & URL Temizleme Yönlendirmeleri:**
  - Giriş yapılmamış ziyaretlerde veya oturum kapatıldığında tarayıcı adres çubuğundaki `?view=harita` gibi yetkisiz/eski sayfa parametreleri otomatik temizlenerek temiz ve kurumsal kök URL (`/`) yönlendirmesi devreye alındı.
  - Giriş sayfasındaki alt bilgi metni temizlendi.
- **Kullanıcı Profili & Şifre Düzenleme Arayüzü:**
  - Sol kenar çubuğundaki kullanıcı profil kartında tıklama ile profil modalı açılma davranışı korundu; mükerrer şifre değiştir butonu kaldırılarak arayüz sadeleştirildi.
  - Profil düzenleme modalındaki sekmeler genişletilerek `Kullanıcı Bilgileri` ve `Şifre Değiştir` başlıklarının taşması engellendi.

### [v2.10.0] - 2026-08-29
- **Konteyner Arıza Onarımında 175m Geofence / GPS Doğrulaması:**
  - Kaynak personeli konteyner arızasını onarırken (`containerFaults.repair`), damperlik atık toplamada olduğu gibi anlık GPS kontrolü devreye alındı. Konteynere en fazla 175 metre mesafede olunması zorunlu kılındı.
- **Mobilde Otomatik Sayfa Başı Kaydırma (Scroll to Top):**
  - Menüden veya hızlı butonlardan sayfa geçişi yapıldığında ekran otomatik olarak en tepeye (`top: 0`) kaydırılarak mobil kullanıcının kaldığı yerden değil, sayfa başından başlaması sağlandı.
- **Arızalı Konteyner Bildirim Formu Emoji Sadeleştirmesi:**
  - Arıza türü butonlarındaki sembol/emojiler kaldırılarak doğrudan kurumsal buton metinlerine dönüştürüldü.

### [v2.9.0] - 2026-08-29
- **Canlı Oturum Geçmişi & Sayfa Yenileme Koruma Standardı:**
  - Kullanıcı sayfayı yenilediğinde (F5 / Ctrl+R) sistemin varsayılan sekmeye dönmesi engellendi; aktif sekme LocalStorage ve URL parametreleriyle korunur hale getirildi.
  - Güvenli oturum sonlandırma ve oturum açma akışları optimize edildi.

### [v2.8.0] - 2026-08-29
- **Rol Geçiş Güvenliği ve Yetkisiz Route Koruması:**
  - Kullanıcı rolleri arası geçişlerde yetkisiz ekranlara doğrudan erişim denemeleri engellendi; kullanıcılar otomatik olarak kendi rol yetkilerine uygun ekrana yönlendirildi.
- **Hızlı Başlatıcı (Quick Launcher):**
  - Mobil kullanıcılar için ana sayfada 2 sütunlu, dokunmatik hızlı aksiyon butonları devreye alındı.

### [v2.7.0] - 2026-08-29
- **Çevrimdışı ve Gecikmeli GPS Konum Takibi:**
  - Saha operasyonlarında GPS sinyalinin zayıf olduğu bölgelerde son bilinen geçerli koordinatın kullanılması ve kullanıcıya durum bildirimi yapılması sağlandı.
- **Servis Katmanı İyileştirmeleri:**
  - tRPC hata yönetimi ve bağlantı kesintilerinde kullanıcı bilgilendirme modalları eklendi.

### [v2.6.0] - 2026-08-25
- **Görsel Optimizasyonu ve Boyut Düşürme (Sharp WebP/JPEG 1600px %95 Tasarruf):**
  - Saha şoförlerinin ve personelinin yüklediği yüksek çözünürlüklü mobil kamera fotoğrafları (12 MP, 10 MB+) Sharp kütüphanesi ile otomatik olarak 1600px sınırına küçültüldü ve WebP/JPEG formatında sıkıştırıldı.
  - Ortalama dosya boyutu 10 MB'tan ~150-200 KB seviyesine indirildi (%98 disk tasarrufu); tonaj fişlerinin okunabilirliği korundu.
- **Fiziksel Dosya Silme Altyapısı (`storageDelete`):**
  - Silinen kayıtların fotoğraflarının sunucu diskinden de fiziki olarak silinmesi sağlandı.
- **Yönetim Panelinde Toplu Depolama Temizleme:**
  - Veri Sıfırlama sekmesine belirli periyotlara göre fotoğrafları temizleme araçları eklendi.

### [v2.5.0] - 2026-08-21
- **Saha Şoförü Dashboard Aktif Mesai Kartı ve Hızlı Sonlandırma:**
  - Şoför aktif bir mesaideyken ana sayfanın en tepesinde açık mesai detayları gösterildi ve tek tıkla mesai bitirme formuna erişim sağlandı.
- **Şoför Görev Bölgesi Açık Şikayet Alarmı:**
  - Şoförün görev yaptığı mahallede açık vatandaş şikayeti varsa ana sayfada acil durum banner'ı tetiklendi.

### [v2.4.15] - 2026-08-21
- **Vardiya Saatleri ve Bölge Filtreleme Optimizasyonları:**
  - 3 sabit vardiya saati tanımlandı: `08:00 - 16:00`, `16:00 - 00:00`, `00:00 - 08:00`.
  - Dinamik mahalle ve bölge eşleştirmeleri optimize edildi.

### [v2.4.14] - 2026-08-21
- **Mahalle Yönetimi ve Dinamik Bölge Atamaları:**
  - Tepebaşı ilçesine ait merkez ve kırsal mahallelerin dinamik yönetimi için CRUD paneli devreye alındı.

### [v2.4.12] - 2026-08-21
- **Gelişmiş Filtreleme ve Arama Mekanizmaları:**
  - Mesai ve kantar kayıtlarında şoför, araç plakası ve tarihe göre anlık filtreleme eklendi.

### [v2.4.11] - 2026-08-21
- **Görüntü Boyut Düşürme ve Disk Tasarrufu:**
  - Yüklenen kantar fişlerinin ve operasyon fotoğraflarının ilk sıkıştırma altyapısı kuruldu.

### [v2.4.10] - 2026-08-21
- **Damperlik Atık ve Arıza Çözümü Açıklama Alanlarının İsteğe Bağlı Hale Getirilmesi:**
  - Açıklama alanları zorunlu olmaktan çıkarılarak isteğe bağlı hale getirildi; boş bırakıldığında sistem varsayılanı atandı.

### [v2.4.9] - 2026-08-21
- **Damperlik Atık Bildirimine Kepçe Gereksinimi (`requiresExcavator`) Entegrasyonu:**
  - `bulkWasteReports` tablosuna kepçe gereksinimi eklendi; harita ve yönetimde kepçe rozetleri gösterildi.
- **Bildiren Personel Bilgisinin Pinlerde Gösterilmesi:**
  - Bildirimi yapan şoför veya personelin adı harita detaylarında görüntülendi.

### [v2.4.8] - 2026-08-20
- **Tonaj Fişi ve Modal Dialoglarının React Portal (`createPortal`) Mimarisine Geçirilmesi:**
  - Modalların viewport dışına taşması ve arka plan uzama sorunu React Portal ile çözüldü.
- **Çoklu Tonaj Fişi Galeri Düzeni (Multi-Image Grid):**
  - Yan yana 2 sütunlu kantar fişi galeri düzeni kuruldu.

### [v2.4.7] - 2026-08-20
- **Mahalle Analiz Tablosu Dinamik Sıralama (Sorting):**
  - Tarih, tonaj, sefer ve mahalle adına göre çift yönlü sütun sıralaması entegre edildi.

### [v2.4.6] - 2026-08-20
- **Şikayet Fotoğrafı Doğrulama ve Yönetici Onay Akışı:**
  - Vatandaş şikayetlerinin çözümünde şoförün çözüm fotoğrafı yüklemesi zorunlu kılındı; yönetici onaylamadan şikayetin kapanması engellendi.

### [v2.4.5] - 2026-08-20
- **İlk Kararlı Sürüm (Initial Stable Baseline):**
  - Sistem çekirdek modülleri, veritabanı şeması ve kullanıcı rolleri devreye alındı.

---
*Doküman Sürümü: v2.12.0 (Yönetim Paneli Kurumsal SaaS Yenilemesi, Global Tarih Filtresi, Mahalle Çekmecesi, Açık Adresli PDF & 3 Yetkili Resmi İmza Standardı)*  
*Son Güncelleme: 2026-09-03*
