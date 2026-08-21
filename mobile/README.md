# Tepebaşı Belediyesi Temizlik İşleri - Mobil Saha Uygulaması (Flutter)

Bu mobil uygulama, sahadaki çöp kamyonu şoförleri, kepçe operatörleri ve kaynak personeli için yerel (Android/iOS) olarak geliştirilmiştir.

---

## 🚀 Yerel Geliştirme ve Çalıştırma Adımları

### 1. Yerel Backend'i Başlatın
Uygulamanın ana dizininde bilgisayarınızdaki backend'i çalıştırın:
```bash
pnpm dev
```
*(Backend `http://localhost:3000` üzerinde çalışacak ve yerel XAMPP MySQL veritabanınıza bağlanacaktır)*

---

### 2. Mobil Uygulamayı Çalıştırma

1. **Android Emülatörde Çalıştırma:**
   ```bash
   cd mobile
   flutter run
   ```
   *(Emülatör otomatik olarak `http://10.0.2.2:3000/api` üzerinden bilgisayarınızdaki yerel SQL sunucusuna bağlanır)*

2. **Kendi Fiziksel Telefonunuzda Çalıştırma (Aynı Wi-Fi):**
   * Giriş ekranındaki **"Yerel Sunucu Bağlantı Ayarları"** butonuna basarak bilgisayarınızın yerel IP adresini girin:
     `http://192.168.1.XX:3000/api`

---

## 📱 Özellikler
* **Canlı Tepebaşı Haritası (`flutter_map`):** 65 Damperlik atık, 65 Konteyner arızası ve vatandaş şikayetlerinin interaktif renkli pinleri.
* **Damperlik Atık Bildir & Topla:** Kamera ve GPS desteğiyle yerinde atık kaydı ve damperli şoför toplama onay akışı.
* **Konteyner Arıza Bildir & Onar:** Kol, ayak, gövde, kapak arızaları ve kaynak personeli onarım sistemi.
* **Vatandaş Şikayetleri:** Çözüm fotoğrafı çekerek onaya gönderme.
* **İstemci Taraflı Fotoğraf Sıkıştırma:** Mobil kameradan çekilen fotoğraflar otomatik olarak ~120KB boyutuna sıkıştırılarak hızlıca aktarılır.
