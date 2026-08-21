import fs from "fs";
import path from "path";

// Tepebaşı Mahalleri ve Merkez Koordinatları
const NEIGHBORHOOD_CENTERS = [
  { name: "Batıkent Mahallesi", region: "Batı Bölgesi", lat: 39.7985, lon: 30.4720 },
  { name: "Çamlıca Mahallesi", region: "Batı Bölgesi", lat: 39.7820, lon: 30.4780 },
  { name: "Şirintepe Mahallesi", region: "Batı Bölgesi", lat: 39.8050, lon: 30.4950 },
  { name: "Uluönder Mahallesi", region: "Merkez Bölgesi", lat: 39.7990, lon: 30.5050 },
  { name: "Ertuğrulgazi Mahallesi", region: "Batı Bölgesi", lat: 39.7760, lon: 30.4850 },
  { name: "Sazova Mahallesi", region: "Batı Bölgesi", lat: 39.7680, lon: 30.4710 },
  { name: "Yenibağlar Mahallesi", region: "Merkez Bölgesi", lat: 39.7890, lon: 30.5080 },
  { name: "Bahçelievler Mahallesi", region: "Merkez Bölgesi", lat: 39.7860, lon: 30.5180 },
  { name: "Eskibağlar Mahallesi", region: "Merkez Bölgesi", lat: 39.7840, lon: 30.5120 },
  { name: "Hoşnudiye Mahallesi", region: "Merkez Bölgesi", lat: 39.7810, lon: 30.5190 },
  { name: "Fatih Mahallesi", region: "Kuzey Bölgesi", lat: 39.8020, lon: 30.5210 },
  { name: "Yeşiltepe Mahallesi", region: "Kuzey Bölgesi", lat: 39.8090, lon: 30.5150 },
  { name: "Zafer Mahallesi", region: "Kuzey Bölgesi", lat: 39.7950, lon: 30.5310 },
  { name: "Kumlubel Mahallesi", region: "Kuzey Bölgesi", lat: 39.8010, lon: 30.5390 },
  { name: "Tunalı Mahallesi", region: "Kuzey Bölgesi", lat: 39.7910, lon: 30.5350 },
  { name: "Güllük Mahallesi", region: "Merkez Bölgesi", lat: 39.7850, lon: 30.5260 },
  { name: "Işıklar Mahallesi", region: "Merkez Bölgesi", lat: 39.7820, lon: 30.5320 },
  { name: "Mamure Mahallesi", region: "Merkez Bölgesi", lat: 39.7790, lon: 30.5280 },
  { name: "Mustafa Kemal Paşa Mahallesi", region: "Merkez Bölgesi", lat: 39.7770, lon: 30.5210 },
  { name: "Şeker Mahallesi", region: "Merkez Bölgesi", lat: 39.7740, lon: 30.5050 },
  { name: "Zincirlikuyu Mahallesi", region: "Kırsal", lat: 39.8250, lon: 30.5250 },
  { name: "Muttalip Mahallesi", region: "Kırsal", lat: 39.8310, lon: 30.5650 },
  { name: "Çukurhisar Mahallesi", region: "Kırsal", lat: 39.8150, lon: 30.3600 },
];

const WASTE_TYPES = [
  "Moloz / İnşaat Atığı",
  "Budama / Bahçe Dal Atığı",
  "Eski Mobilya / Koltuk",
  "Hafriyat ve Taş Yığını",
  "Palet ve Ahşap Kasalar",
  "Karton ve Plastik Ambalaj Yığını",
  "Büyük Hacimli Ev Eşyası",
  "Tadilat ve Seramik Kırıkları",
];

const WASTE_DESCRIPTIONS = [
  "Yol kenarına bırakılmış yaklaşık 2 kamyonluk moloz ve beton parçaları.",
  "Park çevresi temizliği sonrası toplanan büyük ağaç ve çalı budama dalları.",
  "Konteyner yanına atılmış eski çekyat, baza ve kırık dolap parçaları.",
  "Bina tadilatından çıkan çuvallanmış harç, sıva ve tuğla atıkları.",
  "İş yeri önünde birikmiş çok sayıda ahşap palet ve ambalaj malzemesi.",
  "Boş arsaya dökülmüş hafriyat toprağı ve taş birikintisi, kepçe gerekiyor.",
  "Sokak köşesine bırakılmış eski mutfak dolapları ve sunta parçaları.",
  "Apartman bahçe temizliğinden çıkan büyük hacimli dal ve yaprak yığını.",
  "Yıkım sonrası kalan kırık kiremit ve harç yığını.",
  "Kaldırım kenarını kapatan büyük mobilya atıkları ve süngerler.",
];

const FAULT_TYPES = ["kol", "ayak", "gövde", "kapak", "diğer"];

const FAULT_DESCRIPTIONS = [
  "Konteyner kaldırma kolu sağ taraftan kaynak yerinden kopmuş.",
  "Konteynerin sol ön tekeri/ayağı kırılmış, yana yatık duruyor.",
  "Konteyner gövde sacı delinmiş, çöp suyu sızdırıyor.",
  "Konteyner kapağı menteşesinden çıkmış, kapanmıyor.",
  "Ayak basma pedalı mekanizması sıkışmış, kapak açılmıyor.",
  "Konteyner kolu eğilmiş, çöp kamyonu asansörü tutamıyor.",
  "Tekerlek bilyaları dağılmış, hareket ettirilemiyor.",
  "Gövde alt kısmı çürümüş ve yarılmış, kaynakla takviye gerekli.",
  "Kapak sacı ezilmiş ve içeri bükülmüş.",
  "Konteyner kaldırma pimi yerinden çıkmış.",
];

const COMPLAINT_DATA = [
  {
    desc: "Konteyner çevresine çok miktarda evsel atık ve poşet taşmış, sokakta koku yapıyor.",
    urgency: "yüksek",
    dueHours: 2,
  },
  {
    desc: "Park kenarındaki çöp kutuları tamamen dolmuş, piknik atıkları çimlere yayılmış.",
    urgency: "orta",
    dueHours: 4,
  },
  {
    desc: "Sokak girişinde çöp birikintisi oluşmuş, acil süpürge aracıyla temizlik rica ediyoruz.",
    urgency: "orta",
    dueHours: 3,
  },
  {
    desc: "Pazar yeri sonrası kalan sebze ve poşet atıkları rüzgarda çevreye dağılıyor.",
    urgency: "yüksek",
    dueHours: 2,
  },
  {
    desc: "Site önündeki çöp konteynerleri yetersiz kalıyor, ilave konteyner konulması veya sık alınması gerek.",
    urgency: "orta",
    dueHours: 6,
  },
  {
    desc: "Apartman önüne tadilat molozları dökülmüş, araç geçişini zorlaştırıyor.",
    urgency: "orta",
    dueHours: 5,
  },
  {
    desc: "Konteyner arkasında çöp poşetleri patlamış, sokak hayvanları dağıtıyor.",
    urgency: "yüksek",
    dueHours: 2,
  },
  {
    desc: "Ağaç budama dalları yola taşmış durumda, süpürge ekibi yönlendirilebilir mi?",
    urgency: "orta",
    dueHours: 4,
  },
  {
    desc: "Kaldırım üzerindeki çöp yığını günlerdir alınmamış, sinek ve koku yapıyor.",
    urgency: "yüksek",
    dueHours: 1,
  },
  {
    desc: "Çöp konteynerinin kapağı açık kalmış ve koku yayılıyor, temizlenip dezenfekte edilmesi gerek.",
    urgency: "orta",
    dueHours: 3,
  },
];

function jitterCoord(baseCoord, maxOffset = 0.006) {
  const delta = (Math.random() - 0.5) * 2 * maxOffset;
  return Number((baseCoord + delta).toFixed(6));
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

let sql = `-- =========================================================================
-- TEPEBAŞI BELEDİYESİ TEMİZLİK İŞLERİ - TEST VERİLERİ (SEED DATA)
-- 50 Damperlik Atık, 50 Konteyner Arızası, 10 Vatandaş Şikayeti
-- Oluşturulma Tarihi: ${new Date().toLocaleString("tr-TR")}
-- =========================================================================

-- 1. 50 ADET DAMPERLİK ATIK (bulkWasteReports)
INSERT INTO \`bulkWasteReports\` (\`reportedBy\`, \`region\`, \`neighborhood\`, \`wasteType\`, \`description\`, \`latitude\`, \`longitude\`, \`requiresExcavator\`, \`photoUrl\`, \`status\`, \`createdAt\`) VALUES
`;

const wasteRows = [];
for (let i = 0; i < 50; i++) {
  const n = getRandomItem(NEIGHBORHOOD_CENTERS);
  const wt = getRandomItem(WASTE_TYPES);
  const desc = getRandomItem(WASTE_DESCRIPTIONS);
  const reqExc = Math.random() < 0.35 ? 1 : 0;
  const lat = jitterCoord(n.lat);
  const lon = jitterCoord(n.lon);
  const pastMinutes = Math.floor(Math.random() * 4000) + 10;
  const createdAt = formatDate(new Date(Date.now() - pastMinutes * 60 * 1000));

  wasteRows.push(
    `  (1, '${escapeSql(n.region)}', '${escapeSql(n.name)}', '${escapeSql(wt)}', '${escapeSql(desc + " (" + n.name + ")")}', '${lat}', '${lon}', ${reqExc}, NULL, 'bekliyor', '${createdAt}')`
  );
}
sql += wasteRows.join(",\n") + ";\n\n";

sql += `-- 2. 50 ADET KONTEYNER ARIZASI (containerFaults)\n`;
sql += `INSERT INTO \`containerFaults\` (\`reportedBy\`, \`region\`, \`neighborhood\`, \`faultType\`, \`description\`, \`latitude\`, \`longitude\`, \`photoUrl\`, \`status\`, \`createdAt\`) VALUES\n`;

const containerRows = [];
for (let i = 0; i < 50; i++) {
  const n = getRandomItem(NEIGHBORHOOD_CENTERS);
  const ft = getRandomItem(FAULT_TYPES);
  const desc = getRandomItem(FAULT_DESCRIPTIONS);
  const lat = jitterCoord(n.lat);
  const lon = jitterCoord(n.lon);
  const pastMinutes = Math.floor(Math.random() * 4000) + 10;
  const createdAt = formatDate(new Date(Date.now() - pastMinutes * 60 * 1000));

  containerRows.push(
    `  (1, '${escapeSql(n.region)}', '${escapeSql(n.name)}', '${escapeSql(ft)}', '${escapeSql(desc + " (" + n.name + ")")}', '${lat}', '${lon}', NULL, 'bekliyor', '${createdAt}')`
  );
}
sql += containerRows.join(",\n") + ";\n\n";

sql += `-- 3. 10 ADET VATANDAŞ ŞİKAYETİ (citizenComplaints)\n`;
sql += `INSERT INTO \`citizenComplaints\` (\`reportedBy\`, \`region\`, \`neighborhood\`, \`description\`, \`latitude\`, \`longitude\`, \`status\`, \`dueAt\`, \`createdAt\`) VALUES\n`;

const complaintRows = [];
for (let i = 0; i < COMPLAINT_DATA.length; i++) {
  const c = COMPLAINT_DATA[i];
  const n = NEIGHBORHOOD_CENTERS[i % NEIGHBORHOOD_CENTERS.length];
  const lat = jitterCoord(n.lat, 0.004);
  const lon = jitterCoord(n.lon, 0.004);
  const createdAtDate = new Date(Date.now() - (4 - (i % 3)) * 3600 * 1000);
  const dueAtDate = new Date(createdAtDate.getTime() + c.dueHours * 3600 * 1000);

  complaintRows.push(
    `  (1, '${escapeSql(n.region)}', '${escapeSql(n.name)}', '${escapeSql(c.desc + " (" + n.name + ")")}', '${lat}', '${lon}', 'açık', '${formatDate(dueAtDate)}', '${formatDate(createdAtDate)}')`
  );
}
sql += complaintRows.join(",\n") + ";\n";


fs.writeFileSync(path.join(process.cwd(), "seed_test_data.sql"), sql, "utf-8");
console.log("✅ 'seed_test_data.sql' dosyası başarıyla oluşturuldu! (Toplam 110 kayıt: 50 Atık + 50 Arıza + 10 Şikayet)");
