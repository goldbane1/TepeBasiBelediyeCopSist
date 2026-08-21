class AppConstants {
  // Varsayılan API URL'i (Android Emülatör için 10.0.2.2:3000, Fiziksel cihaz için yerel IP)
  static const String defaultLocalHost = "10.0.2.2";
  static const int defaultPort = 3000;
  static const String defaultBaseUrl = "http://$defaultLocalHost:$defaultPort/api";

  // Tepebaşı Merkez Koordinatları (Eskişehir)
  static const double tepebasiCenterLat = 39.7890;
  static const double tepebasiCenterLon = 30.5080;
  static const double defaultZoom = 13.5;

  // Mahalleler ve Bölgeleri
  static const List<Map<String, String>> neighborhoods = [
    {"name": "Batıkent Mahallesi", "region": "Batı Bölgesi"},
    {"name": "Çamlıca Mahallesi", "region": "Batı Bölgesi"},
    {"name": "Şirintepe Mahallesi", "region": "Batı Bölgesi"},
    {"name": "Uluönder Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Ertuğrulgazi Mahallesi", "region": "Batı Bölgesi"},
    {"name": "Sazova Mahallesi", "region": "Batı Bölgesi"},
    {"name": "Yenibağlar Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Bahçelievler Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Eskibağlar Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Hoşnudiye Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Fatih Mahallesi", "region": "Kuzey Bölgesi"},
    {"name": "Yeşiltepe Mahallesi", "region": "Kuzey Bölgesi"},
    {"name": "Zafer Mahallesi", "region": "Kuzey Bölgesi"},
    {"name": "Kumlubel Mahallesi", "region": "Kuzey Bölgesi"},
    {"name": "Tunalı Mahallesi", "region": "Kuzey Bölgesi"},
    {"name": "Güllük Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Işıklar Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Mamure Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Mustafa Kemal Paşa Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Şeker Mahallesi", "region": "Merkez Bölgesi"},
    {"name": "Zincirlikuyu Mahallesi", "region": "Kırsal"},
    {"name": "Muttalip Mahallesi", "region": "Kırsal"},
    {"name": "Çukurhisar Mahallesi", "region": "Kırsal"},
  ];

  // Atık Türleri
  static const List<String> wasteTypes = [
    "Moloz / İnşaat Atığı",
    "Budama / Bahçe Dal Atığı",
    "Eski Mobilya / Koltuk",
    "Hafriyat ve Taş Yığını",
    "Palet ve Ahşap Kasalar",
    "Karton ve Plastik Ambalaj Yığını",
    "Büyük Hacimli Ev Eşyası",
    "Tadilat ve Seramik Kırıkları",
  ];

  // Konteyner Arıza Türleri
  static const List<String> faultTypes = [
    "kol",
    "ayak",
    "gövde",
    "kapak",
    "diğer",
  ];

  // Vardiyalar
  static const List<String> shifts = [
    "gündüz",
    "gece",
  ];
}
