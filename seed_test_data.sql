-- =========================================================================
-- TEPEBAŞI BELEDİYESİ TEMİZLİK İŞLERİ - KAPSAMLI TEST VERİLERİ (SEED DATA)
-- 65 Damperlik Atık + 65 Konteyner Arızası + 10 Vatandaş Şikayeti
-- Oluşturulma Tarihi: 21.08.2026 16:53:11
-- =========================================================================

-- 1.1 Damperlik Atık Paketi (25 Adet)
INSERT INTO `bulkWasteReports` (`reportedBy`, `region`, `neighborhood`, `wasteType`, `description`, `latitude`, `longitude`, `dueAt`, `status`, `requiresExcavator`, `createdAt`) VALUES
  (1, 'Batı Bölgesi', 'Çamlıca Mahallesi', 'Hafriyat ve Taş Yığını', 'Yol kenarına bırakılmış yaklaşık 2 kamyonluk moloz ve beton parçaları. (Çamlıca Mahallesi)', '39.78545', '30.474884', '2026-08-20 02:03:11', 'bekliyor', 0, '2026-08-19 02:03:11'),
  (1, 'Merkez Bölgesi', 'Şeker Mahallesi', 'Moloz / İnşaat Atığı', 'Boş arsaya dökülmüş hafriyat toprağı ve taş birikintisi, kepçe gerekiyor. (Şeker Mahallesi)', '39.772909', '30.511574', '2026-08-20 17:48:11', 'bekliyor', 1, '2026-08-19 17:48:11'),
  (1, 'Kuzey Bölgesi', 'Fatih Mahallesi', 'Tadilat ve Seramik Kırıkları', 'Yıkım sonrası kalan kırık kiremit ve harç yığını. (Fatih Mahallesi)', '39.796602', '30.522676', '2026-08-22 06:53:11', 'bekliyor', 0, '2026-08-21 06:53:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'Büyük Hacimli Ev Eşyası', 'İş yeri önünde birikmiş çok sayıda ahşap palet ve ambalaj malzemesi. (Eskibağlar Mahallesi)', '39.785581', '30.517315', '2026-08-20 00:31:11', 'bekliyor', 0, '2026-08-19 00:31:11'),
  (1, 'Kırsal', 'Zincirlikuyu Mahallesi', 'Hafriyat ve Taş Yığını', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Zincirlikuyu Mahallesi)', '39.81909', '30.530905', '2026-08-20 23:04:11', 'bekliyor', 1, '2026-08-19 23:04:11'),
  (1, 'Merkez Bölgesi', 'Işıklar Mahallesi', 'Tadilat ve Seramik Kırıkları', 'Boş arsaya dökülmüş hafriyat toprağı ve taş birikintisi, kepçe gerekiyor. (Işıklar Mahallesi)', '39.775986', '30.526424', '2026-08-20 03:38:11', 'bekliyor', 0, '2026-08-19 03:38:11'),
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'Palet ve Ahşap Kasalar', 'Boş arsaya dökülmüş hafriyat toprağı ve taş birikintisi, kepçe gerekiyor. (Batıkent Mahallesi)', '39.794342', '30.475745', '2026-08-21 19:51:11', 'bekliyor', 0, '2026-08-20 19:51:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'Palet ve Ahşap Kasalar', 'Park çevresi temizliği sonrası toplanan büyük ağaç ve çalı budama dalları. (Eskibağlar Mahallesi)', '39.785778', '30.508384', '2026-08-22 12:52:11', 'bekliyor', 1, '2026-08-21 12:52:11'),
  (1, 'Merkez Bölgesi', 'Işıklar Mahallesi', 'Hafriyat ve Taş Yığını', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Işıklar Mahallesi)', '39.785584', '30.536499', '2026-08-21 08:28:11', 'bekliyor', 0, '2026-08-20 08:28:11'),
  (1, 'Merkez Bölgesi', 'Güllük Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Site bahçesinden budanan büyük ağaç dalları yola taşmış. (Güllük Mahallesi)', '39.784576', '30.523999', '2026-08-21 10:58:11', 'bekliyor', 1, '2026-08-20 10:58:11'),
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'Tadilat ve Seramik Kırıkları', 'Dükkan tadilatından çıkan beton parçaları, kepçeyle yüklenmeli. (Batıkent Mahallesi)', '39.799959', '30.465268', '2026-08-21 21:43:11', 'bekliyor', 1, '2026-08-20 21:43:11'),
  (1, 'Kuzey Bölgesi', 'Kumlubel Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Konteyner yanına bırakılmış kırık baza, yatak ve masa parçaları. (Kumlubel Mahallesi)', '39.794783', '30.536212', '2026-08-20 12:29:11', 'bekliyor', 0, '2026-08-19 12:29:11'),
  (1, 'Batı Bölgesi', 'Sazova Mahallesi', 'Moloz / İnşaat Atığı', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Sazova Mahallesi)', '39.76307', '30.474542', '2026-08-20 16:08:11', 'bekliyor', 0, '2026-08-19 16:08:11'),
  (1, 'Merkez Bölgesi', 'Hoşnudiye Mahallesi', 'Eski Mobilya / Koltuk', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Hoşnudiye Mahallesi)', '39.780794', '30.513756', '2026-08-20 04:29:11', 'bekliyor', 0, '2026-08-19 04:29:11'),
  (1, 'Merkez Bölgesi', 'Yenibağlar Mahallesi', 'Budama / Bahçe Dal Atığı', 'Dükkan tadilatından çıkan beton parçaları, kepçeyle yüklenmeli. (Yenibağlar Mahallesi)', '39.792039', '30.513616', '2026-08-20 17:40:11', 'bekliyor', 0, '2026-08-19 17:40:11'),
  (1, 'Merkez Bölgesi', 'Yenibağlar Mahallesi', 'Palet ve Ahşap Kasalar', 'Apartman bahçe temizliğinden çıkan büyük hacimli dal ve yaprak yığını. (Yenibağlar Mahallesi)', '39.784098', '30.509441', '2026-08-21 01:07:11', 'bekliyor', 1, '2026-08-20 01:07:11'),
  (1, 'Kırsal', 'Muttalip Mahallesi', 'Moloz / İnşaat Atığı', 'Yıkım sonrası kalan kırık kiremit ve harç yığını. (Muttalip Mahallesi)', '39.825118', '30.55942', '2026-08-20 15:54:11', 'bekliyor', 1, '2026-08-19 15:54:11'),
  (1, 'Kırsal', 'Muttalip Mahallesi', 'Budama / Bahçe Dal Atığı', 'Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları. (Muttalip Mahallesi)', '39.833678', '30.564502', '2026-08-22 04:23:11', 'bekliyor', 0, '2026-08-21 04:23:11'),
  (1, 'Batı Bölgesi', 'Ertuğrulgazi Mahallesi', 'Moloz / İnşaat Atığı', 'Site bahçesinden budanan büyük ağaç dalları yola taşmış. (Ertuğrulgazi Mahallesi)', '39.779661', '30.479052', '2026-08-21 01:15:11', 'bekliyor', 0, '2026-08-20 01:15:11'),
  (1, 'Batı Bölgesi', 'Ertuğrulgazi Mahallesi', 'Moloz / İnşaat Atığı', 'Konteyner yanına bırakılmış kırık baza, yatak ve masa parçaları. (Ertuğrulgazi Mahallesi)', '39.773449', '30.488692', '2026-08-20 07:31:11', 'bekliyor', 0, '2026-08-19 07:31:11'),
  (1, 'Kuzey Bölgesi', 'Kumlubel Mahallesi', 'Hafriyat ve Taş Yığını', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Kumlubel Mahallesi)', '39.80334', '30.542311', '2026-08-21 06:33:11', 'bekliyor', 0, '2026-08-20 06:33:11'),
  (1, 'Merkez Bölgesi', 'Mamure Mahallesi', 'Hafriyat ve Taş Yığını', 'Dükkan tadilatından çıkan beton parçaları, kepçeyle yüklenmeli. (Mamure Mahallesi)', '39.785938', '30.524802', '2026-08-22 04:38:11', 'bekliyor', 0, '2026-08-21 04:38:11'),
  (1, 'Kuzey Bölgesi', 'Yeşiltepe Mahallesi', 'Hafriyat ve Taş Yığını', 'Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları. (Yeşiltepe Mahallesi)', '39.806738', '30.511449', '2026-08-20 07:30:11', 'bekliyor', 1, '2026-08-19 07:30:11'),
  (1, 'Kırsal', 'Çukurhisar Mahallesi', 'Palet ve Ahşap Kasalar', 'Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları. (Çukurhisar Mahallesi)', '39.81564', '30.361689', '2026-08-22 03:11:11', 'bekliyor', 1, '2026-08-21 03:11:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Boş arsaya dökülmüş hafriyat toprağı ve taş birikintisi, kepçe gerekiyor. (Zafer Mahallesi)', '39.792813', '30.53104', '2026-08-20 05:22:11', 'bekliyor', 0, '2026-08-19 05:22:11');

-- 1.2 Damperlik Atık Paketi (25 Adet)
INSERT INTO `bulkWasteReports` (`reportedBy`, `region`, `neighborhood`, `wasteType`, `description`, `latitude`, `longitude`, `dueAt`, `status`, `requiresExcavator`, `createdAt`) VALUES
  (1, 'Kırsal', 'Zincirlikuyu Mahallesi', 'Karton ve Plastik Ambalaj Yığını', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Zincirlikuyu Mahallesi)', '39.823395', '30.524032', '2026-08-20 19:29:11', 'bekliyor', 0, '2026-08-19 19:29:11'),
  (1, 'Merkez Bölgesi', 'Mustafa Kemal Paşa Mahallesi', 'Moloz / İnşaat Atığı', 'Dükkan tadilatından çıkan beton parçaları, kepçeyle yüklenmeli. (Mustafa Kemal Paşa Mahallesi)', '39.774028', '30.520996', '2026-08-21 23:17:11', 'bekliyor', 0, '2026-08-20 23:17:11'),
  (1, 'Merkez Bölgesi', 'Yenibağlar Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Yol kenarına bırakılmış yaklaşık 2 kamyonluk moloz ve beton parçaları. (Yenibağlar Mahallesi)', '39.794742', '30.5086', '2026-08-20 20:29:11', 'bekliyor', 0, '2026-08-19 20:29:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'Karton ve Plastik Ambalaj Yığını', 'Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları. (Zafer Mahallesi)', '39.793683', '30.525199', '2026-08-22 00:24:11', 'bekliyor', 0, '2026-08-21 00:24:11'),
  (1, 'Kuzey Bölgesi', 'Kumlubel Mahallesi', 'Büyük Hacimli Ev Eşyası', 'İş yeri önünde birikmiş çok sayıda ahşap palet ve ambalaj malzemesi. (Kumlubel Mahallesi)', '39.794384', '30.532455', '2026-08-19 20:05:11', 'bekliyor', 0, '2026-08-18 20:05:11'),
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'Tadilat ve Seramik Kırıkları', 'Bina tadilatından çıkan çuvallanmış harç, sıva ve tuğla atıkları. (Batıkent Mahallesi)', '39.805047', '30.470107', '2026-08-20 20:35:11', 'bekliyor', 1, '2026-08-19 20:35:11'),
  (1, 'Kuzey Bölgesi', 'Fatih Mahallesi', 'Moloz / İnşaat Atığı', 'Kaldırım kenarını kapatan büyük mobilya atıkları ve süngerler. (Fatih Mahallesi)', '39.800129', '30.514758', '2026-08-22 04:49:11', 'bekliyor', 0, '2026-08-21 04:49:11'),
  (1, 'Merkez Bölgesi', 'Işıklar Mahallesi', 'Palet ve Ahşap Kasalar', 'Site bahçesinden budanan büyük ağaç dalları yola taşmış. (Işıklar Mahallesi)', '39.779093', '30.535205', '2026-08-21 02:24:11', 'bekliyor', 0, '2026-08-20 02:24:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'Hafriyat ve Taş Yığını', 'Bina tadilatından çıkan çuvallanmış harç, sıva ve tuğla atıkları. (Zafer Mahallesi)', '39.793556', '30.530493', '2026-08-22 07:04:11', 'bekliyor', 1, '2026-08-21 07:04:11'),
  (1, 'Kuzey Bölgesi', 'Fatih Mahallesi', 'Palet ve Ahşap Kasalar', 'Yol kenarına bırakılmış yaklaşık 2 kamyonluk moloz ve beton parçaları. (Fatih Mahallesi)', '39.808091', '30.518805', '2026-08-22 13:11:11', 'bekliyor', 0, '2026-08-21 13:11:11'),
  (1, 'Batı Bölgesi', 'Şirintepe Mahallesi', 'Hafriyat ve Taş Yığını', 'Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları. (Şirintepe Mahallesi)', '39.807057', '30.496466', '2026-08-19 21:16:11', 'bekliyor', 0, '2026-08-18 21:16:11'),
  (1, 'Merkez Bölgesi', 'Yenibağlar Mahallesi', 'Palet ve Ahşap Kasalar', 'Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları. (Yenibağlar Mahallesi)', '39.786627', '30.514905', '2026-08-22 10:37:11', 'bekliyor', 0, '2026-08-21 10:37:11'),
  (1, 'Batı Bölgesi', 'Ertuğrulgazi Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Dükkan tadilatından çıkan beton parçaları, kepçeyle yüklenmeli. (Ertuğrulgazi Mahallesi)', '39.770673', '30.491256', '2026-08-22 13:26:11', 'bekliyor', 1, '2026-08-21 13:26:11'),
  (1, 'Batı Bölgesi', 'Sazova Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Park çevresi temizliği sonrası toplanan büyük ağaç ve çalı budama dalları. (Sazova Mahallesi)', '39.76282', '30.469086', '2026-08-19 19:36:11', 'bekliyor', 1, '2026-08-18 19:36:11'),
  (1, 'Merkez Bölgesi', 'Mustafa Kemal Paşa Mahallesi', 'Eski Mobilya / Koltuk', 'Boş arsaya dökülmüş hafriyat toprağı ve taş birikintisi, kepçe gerekiyor. (Mustafa Kemal Paşa Mahallesi)', '39.782512', '30.526449', '2026-08-20 23:16:11', 'bekliyor', 0, '2026-08-19 23:16:11'),
  (1, 'Merkez Bölgesi', 'Hoşnudiye Mahallesi', 'Budama / Bahçe Dal Atığı', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Hoşnudiye Mahallesi)', '39.782611', '30.523016', '2026-08-22 08:40:11', 'bekliyor', 0, '2026-08-21 08:40:11'),
  (1, 'Merkez Bölgesi', 'Işıklar Mahallesi', 'Eski Mobilya / Koltuk', 'İş yeri önünde birikmiş çok sayıda ahşap palet ve ambalaj malzemesi. (Işıklar Mahallesi)', '39.775484', '30.525792', '2026-08-20 23:06:11', 'bekliyor', 0, '2026-08-19 23:06:11'),
  (1, 'Kuzey Bölgesi', 'Fatih Mahallesi', 'Büyük Hacimli Ev Eşyası', 'İş yeri önünde birikmiş çok sayıda ahşap palet ve ambalaj malzemesi. (Fatih Mahallesi)', '39.796529', '30.523795', '2026-08-20 08:16:11', 'bekliyor', 1, '2026-08-19 08:16:11'),
  (1, 'Merkez Bölgesi', 'Mamure Mahallesi', 'Moloz / İnşaat Atığı', 'Park çevresi temizliği sonrası toplanan büyük ağaç ve çalı budama dalları. (Mamure Mahallesi)', '39.780029', '30.534314', '2026-08-21 02:39:11', 'bekliyor', 0, '2026-08-20 02:39:11'),
  (1, 'Merkez Bölgesi', 'Yenibağlar Mahallesi', 'Palet ve Ahşap Kasalar', 'Yıkım sonrası kalan kırık kiremit ve harç yığını. (Yenibağlar Mahallesi)', '39.786247', '30.504357', '2026-08-20 04:35:11', 'bekliyor', 1, '2026-08-19 04:35:11'),
  (1, 'Kırsal', 'Çukurhisar Mahallesi', 'Hafriyat ve Taş Yığını', 'Dükkan tadilatından çıkan beton parçaları, kepçeyle yüklenmeli. (Çukurhisar Mahallesi)', '39.811394', '30.35762', '2026-08-20 10:36:11', 'bekliyor', 0, '2026-08-19 10:36:11'),
  (1, 'Merkez Bölgesi', 'Mamure Mahallesi', 'Hafriyat ve Taş Yığını', 'Site bahçesinden budanan büyük ağaç dalları yola taşmış. (Mamure Mahallesi)', '39.782039', '30.533397', '2026-08-20 13:39:11', 'bekliyor', 0, '2026-08-19 13:39:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'Eski Mobilya / Koltuk', 'Site bahçesinden budanan büyük ağaç dalları yola taşmış. (Bahçelievler Mahallesi)', '39.789071', '30.516758', '2026-08-22 02:37:11', 'bekliyor', 0, '2026-08-21 02:37:11'),
  (1, 'Kırsal', 'Çukurhisar Mahallesi', 'Palet ve Ahşap Kasalar', 'Kaldırım kenarını kapatan büyük mobilya atıkları ve süngerler. (Çukurhisar Mahallesi)', '39.812167', '30.353166', '2026-08-20 18:44:11', 'bekliyor', 0, '2026-08-19 18:44:11'),
  (1, 'Kuzey Bölgesi', 'Tunalı Mahallesi', 'Palet ve Ahşap Kasalar', 'Yıkım sonrası kalan kırık kiremit ve harç yığını. (Tunalı Mahallesi)', '39.796669', '30.537366', '2026-08-22 07:18:11', 'bekliyor', 0, '2026-08-21 07:18:11');

-- 1.3 Damperlik Atık Paketi (15 Adet)
INSERT INTO `bulkWasteReports` (`reportedBy`, `region`, `neighborhood`, `wasteType`, `description`, `latitude`, `longitude`, `dueAt`, `status`, `requiresExcavator`, `createdAt`) VALUES
  (1, 'Batı Bölgesi', 'Çamlıca Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Yıkım sonrası kalan kırık kiremit ve harç yığını. (Çamlıca Mahallesi)', '39.785187', '30.475619', '2026-08-21 15:14:11', 'bekliyor', 0, '2026-08-20 15:14:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'Moloz / İnşaat Atığı', 'Konteyner yanına bırakılmış kırık baza, yatak ve masa parçaları. (Eskibağlar Mahallesi)', '39.786711', '30.511111', '2026-08-20 20:35:11', 'bekliyor', 0, '2026-08-19 20:35:11'),
  (1, 'Merkez Bölgesi', 'Şeker Mahallesi', 'Karton ve Plastik Ambalaj Yığını', 'Apartman bahçe temizliğinden çıkan büyük hacimli dal ve yaprak yığını. (Şeker Mahallesi)', '39.771535', '30.500345', '2026-08-22 06:36:11', 'bekliyor', 1, '2026-08-21 06:36:11'),
  (1, 'Batı Bölgesi', 'Sazova Mahallesi', 'Moloz / İnşaat Atığı', 'Apartman bahçe temizliğinden çıkan büyük hacimli dal ve yaprak yığını. (Sazova Mahallesi)', '39.765614', '30.464874', '2026-08-21 11:04:11', 'bekliyor', 0, '2026-08-20 11:04:11'),
  (1, 'Merkez Bölgesi', 'Şeker Mahallesi', 'Eski Mobilya / Koltuk', 'Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları. (Şeker Mahallesi)', '39.779985', '30.506386', '2026-08-20 05:55:11', 'bekliyor', 0, '2026-08-19 05:55:11'),
  (1, 'Kuzey Bölgesi', 'Yeşiltepe Mahallesi', 'Eski Mobilya / Koltuk', 'Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları. (Yeşiltepe Mahallesi)', '39.80517', '30.508488', '2026-08-20 02:07:11', 'bekliyor', 0, '2026-08-19 02:07:11'),
  (1, 'Merkez Bölgesi', 'Mustafa Kemal Paşa Mahallesi', 'Tadilat ve Seramik Kırıkları', 'İş yeri önünde birikmiş çok sayıda ahşap palet ve ambalaj malzemesi. (Mustafa Kemal Paşa Mahallesi)', '39.782188', '30.524548', '2026-08-20 18:59:11', 'bekliyor', 0, '2026-08-19 18:59:11'),
  (1, 'Kırsal', 'Muttalip Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Kaldırım kenarını kapatan büyük mobilya atıkları ve süngerler. (Muttalip Mahallesi)', '39.831062', '30.558041', '2026-08-20 10:40:11', 'bekliyor', 0, '2026-08-19 10:40:11'),
  (1, 'Merkez Bölgesi', 'Şeker Mahallesi', 'Palet ve Ahşap Kasalar', 'Boş arsaya dökülmüş hafriyat toprağı ve taş birikintisi, kepçe gerekiyor. (Şeker Mahallesi)', '39.77788', '30.500055', '2026-08-21 05:48:11', 'bekliyor', 0, '2026-08-20 05:48:11'),
  (1, 'Merkez Bölgesi', 'Mamure Mahallesi', 'Palet ve Ahşap Kasalar', 'Konteyner yanına bırakılmış kırık baza, yatak ve masa parçaları. (Mamure Mahallesi)', '39.780787', '30.530667', '2026-08-20 04:03:11', 'bekliyor', 1, '2026-08-19 04:03:11'),
  (1, 'Merkez Bölgesi', 'Mustafa Kemal Paşa Mahallesi', 'Tadilat ve Seramik Kırıkları', 'Apartman bahçe temizliğinden çıkan büyük hacimli dal ve yaprak yığını. (Mustafa Kemal Paşa Mahallesi)', '39.77271', '30.517165', '2026-08-21 07:31:11', 'bekliyor', 1, '2026-08-20 07:31:11'),
  (1, 'Kuzey Bölgesi', 'Fatih Mahallesi', 'Budama / Bahçe Dal Atığı', 'Dükkan tadilatından çıkan beton parçaları, kepçeyle yüklenmeli. (Fatih Mahallesi)', '39.799155', '30.519802', '2026-08-20 03:28:11', 'bekliyor', 0, '2026-08-19 03:28:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'Büyük Hacimli Ev Eşyası', 'İş yeri önünde birikmiş çok sayıda ahşap palet ve ambalaj malzemesi. (Eskibağlar Mahallesi)', '39.786172', '30.510607', '2026-08-20 14:30:11', 'bekliyor', 0, '2026-08-19 14:30:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'Büyük Hacimli Ev Eşyası', 'Bina tadilatından çıkan çuvallanmış harç, sıva ve tuğla atıkları. (Zafer Mahallesi)', '39.798255', '30.526945', '2026-08-21 19:30:11', 'bekliyor', 1, '2026-08-20 19:30:11'),
  (1, 'Kuzey Bölgesi', 'Tunalı Mahallesi', 'Budama / Bahçe Dal Atığı', 'Site bahçesinden budanan büyük ağaç dalları yola taşmış. (Tunalı Mahallesi)', '39.790163', '30.538505', '2026-08-21 19:25:11', 'bekliyor', 0, '2026-08-20 19:25:11');

-- 2.1 Konteyner Arızası Paketi (25 Adet)
INSERT INTO `containerFaults` (`reportedBy`, `region`, `neighborhood`, `faultType`, `description`, `latitude`, `longitude`, `status`, `createdAt`) VALUES
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'kol', 'Tekerlek kilitleme mekanizması arızalı, kayıyor. (Batıkent Mahallesi)', '39.79953', '30.474423', 'bekliyor', '2026-08-19 03:24:11'),
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'diğer', 'Gövde alt kısmı çürümüş ve yarılmış, kaynakla takviye gerekli. (Batıkent Mahallesi)', '39.804639', '30.473488', 'bekliyor', '2026-08-19 13:05:11'),
  (1, 'Merkez Bölgesi', 'Işıklar Mahallesi', 'diğer', 'Konteynerin sol ön tekeri/ayağı kırılmış, yana yatık duruyor. (Işıklar Mahallesi)', '39.777645', '30.53225', 'bekliyor', '2026-08-21 09:59:11'),
  (1, 'Kırsal', 'Çukurhisar Mahallesi', 'diğer', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Çukurhisar Mahallesi)', '39.811623', '30.36379', 'bekliyor', '2026-08-19 15:06:11'),
  (1, 'Merkez Bölgesi', 'Uluönder Mahallesi', 'kapak', 'Gövde alt kısmı çürümüş ve yarılmış, kaynakla takviye gerekli. (Uluönder Mahallesi)', '39.79436', '30.508909', 'bekliyor', '2026-08-19 17:37:11'),
  (1, 'Merkez Bölgesi', 'Uluönder Mahallesi', 'kapak', 'Konteyner gövde sacı delinmiş, çöp suyu sızdırıyor. (Uluönder Mahallesi)', '39.805783', '30.509422', 'bekliyor', '2026-08-20 15:26:11'),
  (1, 'Kuzey Bölgesi', 'Fatih Mahallesi', 'kol', 'Konteyner gövde sacı delinmiş, çöp suyu sızdırıyor. (Fatih Mahallesi)', '39.801688', '30.51927', 'bekliyor', '2026-08-19 13:47:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'diğer', 'Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş. (Eskibağlar Mahallesi)', '39.782891', '30.516366', 'bekliyor', '2026-08-20 16:50:11'),
  (1, 'Merkez Bölgesi', 'Hoşnudiye Mahallesi', 'ayak', 'Tekerlek bilyaları dağılmış, hareket ettirilemiyor. (Hoşnudiye Mahallesi)', '39.778085', '30.522452', 'bekliyor', '2026-08-19 19:45:11'),
  (1, 'Kırsal', 'Zincirlikuyu Mahallesi', 'ayak', 'Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş. (Zincirlikuyu Mahallesi)', '39.827886', '30.518948', 'bekliyor', '2026-08-19 22:49:11'),
  (1, 'Merkez Bölgesi', 'Mustafa Kemal Paşa Mahallesi', 'kapak', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Mustafa Kemal Paşa Mahallesi)', '39.782585', '30.518245', 'bekliyor', '2026-08-20 13:34:11'),
  (1, 'Kuzey Bölgesi', 'Kumlubel Mahallesi', 'diğer', 'Tekerlek bilyaları dağılmış, hareket ettirilemiyor. (Kumlubel Mahallesi)', '39.798128', '30.543801', 'bekliyor', '2026-08-18 19:48:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'kapak', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Zafer Mahallesi)', '39.79224', '30.537853', 'bekliyor', '2026-08-19 09:29:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'ayak', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Zafer Mahallesi)', '39.801772', '30.528953', 'bekliyor', '2026-08-20 13:47:11'),
  (1, 'Batı Bölgesi', 'Şirintepe Mahallesi', 'kapak', 'Konteynerin sol ön tekeri/ayağı kırılmış, yana yatık duruyor. (Şirintepe Mahallesi)', '39.798695', '30.491441', 'bekliyor', '2026-08-19 20:03:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'diğer', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Bahçelievler Mahallesi)', '39.787256', '30.514455', 'bekliyor', '2026-08-21 10:47:11'),
  (1, 'Kırsal', 'Muttalip Mahallesi', 'kapak', 'Konteyner kaldırma pimi yerinden çıkmış. (Muttalip Mahallesi)', '39.82713', '30.564929', 'bekliyor', '2026-08-19 22:51:11'),
  (1, 'Kuzey Bölgesi', 'Tunalı Mahallesi', 'diğer', 'Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş. (Tunalı Mahallesi)', '39.797975', '30.541063', 'bekliyor', '2026-08-21 04:42:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'ayak', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Zafer Mahallesi)', '39.798954', '30.529856', 'bekliyor', '2026-08-21 05:27:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'kapak', 'Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş. (Bahçelievler Mahallesi)', '39.779619', '30.517305', 'bekliyor', '2026-08-20 03:09:11'),
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'ayak', 'Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş. (Batıkent Mahallesi)', '39.795877', '30.468362', 'bekliyor', '2026-08-19 06:02:11'),
  (1, 'Merkez Bölgesi', 'Uluönder Mahallesi', 'kapak', 'Tekerlek kilitleme mekanizması arızalı, kayıyor. (Uluönder Mahallesi)', '39.805972', '30.502456', 'bekliyor', '2026-08-20 23:52:11'),
  (1, 'Kırsal', 'Zincirlikuyu Mahallesi', 'kapak', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Zincirlikuyu Mahallesi)', '39.818785', '30.518035', 'bekliyor', '2026-08-21 03:23:11'),
  (1, 'Batı Bölgesi', 'Ertuğrulgazi Mahallesi', 'kol', 'Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor. (Ertuğrulgazi Mahallesi)', '39.772064', '30.481671', 'bekliyor', '2026-08-20 11:29:11'),
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'gövde', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Batıkent Mahallesi)', '39.800941', '30.468253', 'bekliyor', '2026-08-20 15:25:11');

-- 2.2 Konteyner Arızası Paketi (25 Adet)
INSERT INTO `containerFaults` (`reportedBy`, `region`, `neighborhood`, `faultType`, `description`, `latitude`, `longitude`, `status`, `createdAt`) VALUES
  (1, 'Kuzey Bölgesi', 'Yeşiltepe Mahallesi', 'kol', 'Konteyner kaldırma pimi yerinden çıkmış. (Yeşiltepe Mahallesi)', '39.80438', '30.51164', 'bekliyor', '2026-08-21 12:00:11'),
  (1, 'Batı Bölgesi', 'Sazova Mahallesi', 'ayak', 'Tekerlek bilyaları dağılmış, hareket ettirilemiyor. (Sazova Mahallesi)', '39.770419', '30.477206', 'bekliyor', '2026-08-19 02:40:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'kapak', 'Gövde alt kısmı çürümüş ve yarılmış, kaynakla takviye gerekli. (Bahçelievler Mahallesi)', '39.78484', '30.518295', 'bekliyor', '2026-08-20 09:09:11'),
  (1, 'Kuzey Bölgesi', 'Kumlubel Mahallesi', 'kol', 'Konteyner kapağı menteşesinden çıkmış, kapanmıyor. (Kumlubel Mahallesi)', '39.802262', '30.538092', 'bekliyor', '2026-08-19 21:43:11'),
  (1, 'Batı Bölgesi', 'Şirintepe Mahallesi', 'gövde', 'Konteyner gövde sacı delinmiş, çöp suyu sızdırıyor. (Şirintepe Mahallesi)', '39.808893', '30.499792', 'bekliyor', '2026-08-20 00:12:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'kol', 'Konteynerin sol ön tekeri/ayağı kırılmış, yana yatık duruyor. (Zafer Mahallesi)', '39.796602', '30.525432', 'bekliyor', '2026-08-19 06:22:11'),
  (1, 'Batı Bölgesi', 'Sazova Mahallesi', 'kapak', 'Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor. (Sazova Mahallesi)', '39.766679', '30.471259', 'bekliyor', '2026-08-21 12:14:11'),
  (1, 'Merkez Bölgesi', 'Mamure Mahallesi', 'kapak', 'Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor. (Mamure Mahallesi)', '39.777739', '30.522334', 'bekliyor', '2026-08-20 11:36:11'),
  (1, 'Batı Bölgesi', 'Şirintepe Mahallesi', 'kapak', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Şirintepe Mahallesi)', '39.810771', '30.488807', 'bekliyor', '2026-08-19 01:18:11'),
  (1, 'Batı Bölgesi', 'Ertuğrulgazi Mahallesi', 'diğer', 'Konteyner kapağı menteşesinden çıkmış, kapanmıyor. (Ertuğrulgazi Mahallesi)', '39.770891', '30.487765', 'bekliyor', '2026-08-20 10:07:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'gövde', 'Tekerlek kilitleme mekanizması arızalı, kayıyor. (Bahçelievler Mahallesi)', '39.785359', '30.512607', 'bekliyor', '2026-08-18 21:10:11'),
  (1, 'Kırsal', 'Zincirlikuyu Mahallesi', 'diğer', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Zincirlikuyu Mahallesi)', '39.825114', '30.527711', 'bekliyor', '2026-08-20 09:21:11'),
  (1, 'Kırsal', 'Muttalip Mahallesi', 'kol', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Muttalip Mahallesi)', '39.829028', '30.564798', 'bekliyor', '2026-08-19 03:34:11'),
  (1, 'Merkez Bölgesi', 'Uluönder Mahallesi', 'gövde', 'Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş. (Uluönder Mahallesi)', '39.795728', '30.508289', 'bekliyor', '2026-08-21 08:10:11'),
  (1, 'Merkez Bölgesi', 'Işıklar Mahallesi', 'kapak', 'Konteynerin sol ön tekeri/ayağı kırılmış, yana yatık duruyor. (Işıklar Mahallesi)', '39.778563', '30.531804', 'bekliyor', '2026-08-20 01:36:11'),
  (1, 'Merkez Bölgesi', 'Mustafa Kemal Paşa Mahallesi', 'ayak', 'Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş. (Mustafa Kemal Paşa Mahallesi)', '39.775792', '30.526951', 'bekliyor', '2026-08-20 14:41:11'),
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'gövde', 'Konteyner gövde sacı delinmiş, çöp suyu sızdırıyor. (Batıkent Mahallesi)', '39.793341', '30.475651', 'bekliyor', '2026-08-19 13:51:11'),
  (1, 'Merkez Bölgesi', 'Güllük Mahallesi', 'kapak', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Güllük Mahallesi)', '39.782235', '30.530586', 'bekliyor', '2026-08-19 14:39:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'kol', 'Tekerlek kilitleme mekanizması arızalı, kayıyor. (Bahçelievler Mahallesi)', '39.780322', '30.517551', 'bekliyor', '2026-08-19 20:21:11'),
  (1, 'Batı Bölgesi', 'Şirintepe Mahallesi', 'gövde', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Şirintepe Mahallesi)', '39.806832', '30.491335', 'bekliyor', '2026-08-19 00:02:11'),
  (1, 'Kırsal', 'Zincirlikuyu Mahallesi', 'kol', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Zincirlikuyu Mahallesi)', '39.826682', '30.530712', 'bekliyor', '2026-08-19 09:20:11'),
  (1, 'Kuzey Bölgesi', 'Yeşiltepe Mahallesi', 'gövde', 'Kapak sacı ezilmiş ve içeri bükülmüş. (Yeşiltepe Mahallesi)', '39.810743', '30.509344', 'bekliyor', '2026-08-20 17:19:11'),
  (1, 'Batı Bölgesi', 'Sazova Mahallesi', 'diğer', 'Tekerlek kilitleme mekanizması arızalı, kayıyor. (Sazova Mahallesi)', '39.774984', '30.465639', 'bekliyor', '2026-08-21 06:23:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'kapak', 'Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor. (Bahçelievler Mahallesi)', '39.784718', '30.523854', 'bekliyor', '2026-08-19 12:54:11'),
  (1, 'Batı Bölgesi', 'Şirintepe Mahallesi', 'kapak', 'Gövde alt kısmı çürümüş ve yarılmış, kaynakla takviye gerekli. (Şirintepe Mahallesi)', '39.808346', '30.495705', 'bekliyor', '2026-08-20 12:34:11');

-- 2.3 Konteyner Arızası Paketi (15 Adet)
INSERT INTO `containerFaults` (`reportedBy`, `region`, `neighborhood`, `faultType`, `description`, `latitude`, `longitude`, `status`, `createdAt`) VALUES
  (1, 'Merkez Bölgesi', 'Şeker Mahallesi', 'kapak', 'Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor. (Şeker Mahallesi)', '39.778086', '30.502433', 'bekliyor', '2026-08-21 08:28:11'),
  (1, 'Kuzey Bölgesi', 'Kumlubel Mahallesi', 'diğer', 'Kapak yay mekanizması kopmuş, kapak açık kalıyor. (Kumlubel Mahallesi)', '39.807844', '30.533497', 'bekliyor', '2026-08-19 02:21:11'),
  (1, 'Kuzey Bölgesi', 'Kumlubel Mahallesi', 'gövde', 'Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor. (Kumlubel Mahallesi)', '39.800082', '30.541215', 'bekliyor', '2026-08-19 18:49:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'kol', 'Tekerlek kilitleme mekanizması arızalı, kayıyor. (Zafer Mahallesi)', '39.800726', '30.5268', 'bekliyor', '2026-08-18 22:27:11'),
  (1, 'Batı Bölgesi', 'Ertuğrulgazi Mahallesi', 'diğer', 'Konteyner gövde sacı delinmiş, çöp suyu sızdırıyor. (Ertuğrulgazi Mahallesi)', '39.771437', '30.489218', 'bekliyor', '2026-08-19 10:39:11'),
  (1, 'Kırsal', 'Muttalip Mahallesi', 'kol', 'Tekerlek kilitleme mekanizması arızalı, kayıyor. (Muttalip Mahallesi)', '39.833007', '30.564433', 'bekliyor', '2026-08-20 23:23:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'ayak', 'Tekerlek bilyaları dağılmış, hareket ettirilemiyor. (Eskibağlar Mahallesi)', '39.785358', '30.513425', 'bekliyor', '2026-08-19 18:03:11'),
  (1, 'Merkez Bölgesi', 'Mamure Mahallesi', 'ayak', 'Konteyner kapağı menteşesinden çıkmış, kapanmıyor. (Mamure Mahallesi)', '39.778339', '30.522675', 'bekliyor', '2026-08-20 19:48:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'gövde', 'Tekerlek bilyaları dağılmış, hareket ettirilemiyor. (Zafer Mahallesi)', '39.793036', '30.528202', 'bekliyor', '2026-08-21 06:09:11'),
  (1, 'Merkez Bölgesi', 'Işıklar Mahallesi', 'kapak', 'Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor. (Işıklar Mahallesi)', '39.776715', '30.526366', 'bekliyor', '2026-08-19 17:36:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'ayak', 'Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor. (Eskibağlar Mahallesi)', '39.779792', '30.505048', 'bekliyor', '2026-08-20 14:24:11'),
  (1, 'Merkez Bölgesi', 'Güllük Mahallesi', 'diğer', 'Kapak sacı ezilmiş ve içeri bükülmüş. (Güllük Mahallesi)', '39.782989', '30.531728', 'bekliyor', '2026-08-19 19:42:11'),
  (1, 'Kuzey Bölgesi', 'Zafer Mahallesi', 'ayak', 'Konteyner gövde sacı delinmiş, çöp suyu sızdırıyor. (Zafer Mahallesi)', '39.800518', '30.537659', 'bekliyor', '2026-08-21 10:01:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'gövde', 'Konteyner kaldırma pimi yerinden çıkmış. (Eskibağlar Mahallesi)', '39.790101', '30.514508', 'bekliyor', '2026-08-19 12:37:11'),
  (1, 'Kuzey Bölgesi', 'Fatih Mahallesi', 'ayak', 'Konteyner kaldırma pimi yerinden çıkmış. (Fatih Mahallesi)', '39.799464', '30.521021', 'bekliyor', '2026-08-19 12:19:11');

-- 3. Vatandaş Şikayetleri Paketi (10 Adet)
INSERT INTO `citizenComplaints` (`reportedBy`, `region`, `neighborhood`, `description`, `latitude`, `longitude`, `status`, `dueAt`, `createdAt`) VALUES
  (1, 'Batı Bölgesi', 'Batıkent Mahallesi', 'Konteyner çevresine çok miktarda evsel atık ve poşet taşmış, sokakta koku yapıyor. (Batıkent Mahallesi)', '39.801459', '30.469145', 'açık', '2026-08-21 11:53:11', '2026-08-21 09:53:11'),
  (1, 'Batı Bölgesi', 'Çamlıca Mahallesi', 'Park kenarındaki çöp kutuları tamamen dolmuş, piknik atıkları çimlere yayılmış. (Çamlıca Mahallesi)', '39.782623', '30.48119', 'açık', '2026-08-21 14:53:11', '2026-08-21 10:53:11'),
  (1, 'Batı Bölgesi', 'Şirintepe Mahallesi', 'Sokak girişinde çöp birikintisi oluşmuş, acil süpürge aracıyla temizlik rica ediyoruz. (Şirintepe Mahallesi)', '39.802969', '30.491687', 'açık', '2026-08-21 14:53:11', '2026-08-21 11:53:11'),
  (1, 'Merkez Bölgesi', 'Uluönder Mahallesi', 'Pazar yeri sonrası kalan sebze ve poşet atıkları rüzgarda çevreye dağılıyor. (Uluönder Mahallesi)', '39.801585', '30.508637', 'açık', '2026-08-21 11:53:11', '2026-08-21 09:53:11'),
  (1, 'Batı Bölgesi', 'Ertuğrulgazi Mahallesi', 'Site önündeki çöp konteynerleri yetersiz kalıyor, ilave konteyner konulması gerek. (Ertuğrulgazi Mahallesi)', '39.776034', '30.486175', 'açık', '2026-08-21 16:53:11', '2026-08-21 10:53:11'),
  (1, 'Batı Bölgesi', 'Sazova Mahallesi', 'Apartman önüne tadilat molozları dökülmüş, araç geçişini zorlaştırıyor. (Sazova Mahallesi)', '39.770316', '30.469454', 'açık', '2026-08-21 16:53:11', '2026-08-21 11:53:11'),
  (1, 'Merkez Bölgesi', 'Yenibağlar Mahallesi', 'Konteyner arkasında çöp poşetleri patlamış, sokak hayvanları dağıtıyor. (Yenibağlar Mahallesi)', '39.78561', '30.505135', 'açık', '2026-08-21 11:53:11', '2026-08-21 09:53:11'),
  (1, 'Merkez Bölgesi', 'Bahçelievler Mahallesi', 'Ağaç budama dalları yola taşmış durumda, süpürge ekibi yönlendirilebilir mi? (Bahçelievler Mahallesi)', '39.786689', '30.51832', 'açık', '2026-08-21 14:53:11', '2026-08-21 10:53:11'),
  (1, 'Merkez Bölgesi', 'Eskibağlar Mahallesi', 'Kaldırım üzerindeki çöp yığını günlerdir alınmamış, sinek ve koku yapıyor. (Eskibağlar Mahallesi)', '39.781735', '30.510114', 'açık', '2026-08-21 12:53:11', '2026-08-21 11:53:11'),
  (1, 'Merkez Bölgesi', 'Hoşnudiye Mahallesi', 'Çöp konteynerinin kapağı açık kalmış ve koku yayılıyor, temizlenip dezenfekte edilmeli. (Hoşnudiye Mahallesi)', '39.778145', '30.521491', 'açık', '2026-08-21 12:53:11', '2026-08-21 09:53:11');
