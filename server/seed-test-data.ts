import dotenv from "dotenv";
import { getDb } from "./db.js";
import { bulkWasteReports, containerFaults, citizenComplaints, users } from "../drizzle/schema.js";

dotenv.config();

// Tepebaşı Mahalleri ve Merkez Koordinatları (Yaklaşık)
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

const FAULT_TYPES: Array<"kol" | "ayak" | "gövde" | "kapak" | "diğer"> = [
  "kol",
  "ayak",
  "gövde",
  "kapak",
  "diğer",
];

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
    urgency: "yüksek" as const,
    dueHours: 2,
  },
  {
    desc: "Park kenarındaki çöp kutuları tamamen dolmuş, piknik atıkları çimlere yayılmış.",
    urgency: "orta" as const,
    dueHours: 4,
  },
  {
    desc: "Sokak girişinde çöp birikintisi oluşmuş, acil süpürge aracıyla temizlik rica ediyoruz.",
    urgency: "orta" as const,
    dueHours: 3,
  },
  {
    desc: "Pazar yeri sonrası kalan sebze ve poşet atıkları rüzgarda çevreye dağılıyor.",
    urgency: "yüksek" as const,
    dueHours: 2,
  },
  {
    desc: "Site önündeki çöp konteynerleri yetersiz kalıyor, ilave konteyner konulması veya sık alınması gerek.",
    urgency: "orta" as const,
    dueHours: 6,
  },
  {
    desc: "Apartman önüne tadilat molozları dökülmüş, araç geçişini zorlaştırıyor.",
    urgency: "orta" as const,
    dueHours: 5,
  },
  {
    desc: "Konteyner arkasında çöp poşetleri patlamış, sokak hayvanları dağıtıyor.",
    urgency: "yüksek" as const,
    dueHours: 2,
  },
  {
    desc: "Ağaç budama dalları yola taşmış durumda, süpürge ekibi yönlendirilebilir mi?",
    urgency: "orta" as const,
    dueHours: 4,
  },
  {
    desc: "Kaldırım üzerindeki çöp yığını günlerdir alınmamış, sinek ve koku yapıyor.",
    urgency: "yüksek" as const,
    dueHours: 1, // Overdue/Acil simülasyonu
  },
  {
    desc: "Çöp konteynerinin kapağı açık kalmış ve koku yayılıyor, temizlenip dezenfekte edilmesi gerek.",
    urgency: "orta" as const,
    dueHours: 3,
  },
];

// Koordinatlara rastgele küçük sapma (±200-800m) ekleme fonksiyonu
function jitterCoord(baseCoord: number, maxOffset = 0.006) {
  const delta = (Math.random() - 0.5) * 2 * maxOffset;
  return Number((baseCoord + delta).toFixed(6));
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
  console.log("=== TEPEBAŞI TEST VERİSİ YÜKLEME BAŞLATILIYOR ===");
  const db = await getDb();
  if (!db) {
    console.error("Veritabanı bağlantısı kurulamadı!");
    process.exit(1);
  }

  // 1. Sistemdeki kullanıcıları al
  const allUsers = await db.select().from(users);
  const driverUsers = allUsers.filter(u => u.role === "şoför");
  const adminUsers = allUsers.filter(u => u.role === "yönetim");
  const defaultUserId = driverUsers[0]?.id || adminUsers[0]?.id || allUsers[0]?.id || 1;

  console.log(`Kullanıcılar tespit edildi: Toplam ${allUsers.length} kullanıcı, varsayılan atanan ID: ${defaultUserId}`);

  // 2. 50 Tane Damperlik Atık Ekle
  console.log("\n📦 50 Adet Damperlik Atık oluşturuluyor...");
  const bulkWasteInserts = [];
  for (let i = 0; i < 50; i++) {
    const neighborhoodObj = getRandomItem(NEIGHBORHOOD_CENTERS);
    const wasteType = getRandomItem(WASTE_TYPES);
    const desc = getRandomItem(WASTE_DESCRIPTIONS);
    const requiresExcavator = Math.random() < 0.35; // %35 ihtimalle kepçe gerekli
    const lat = jitterCoord(neighborhoodObj.lat);
    const lon = jitterCoord(neighborhoodObj.lon);
    const randomUser = driverUsers.length > 0 ? getRandomItem(driverUsers).id : defaultUserId;
    
    // Rastgele son 3 gün içerisinde bir tarih
    const pastMinutes = Math.floor(Math.random() * 4000) + 10;
    const createdAt = new Date(Date.now() - pastMinutes * 60 * 1000);

    bulkWasteInserts.push({
      reportedBy: randomUser,
      region: neighborhoodObj.region,
      neighborhood: neighborhoodObj.name,
      wasteType,
      description: `${desc} (${neighborhoodObj.name})`,
      latitude: String(lat),
      longitude: String(lon),
      requiresExcavator: requiresExcavator ? 1 : 0,
      photoUrl: null,
      status: "bekliyor" as const,
      createdAt,
    });
  }

  for (const item of bulkWasteInserts) {
    await db.insert(bulkWasteReports).values(item as any);
  }
  console.log("✅ 50 Adet Damperlik Atık başarıyla eklendi.");

  // 3. 50 Tane Konteyner Arızası Ekle
  console.log("\n🏗️ 50 Adet Konteyner Arızası oluşturuluyor...");
  const containerInserts = [];
  for (let i = 0; i < 50; i++) {
    const neighborhoodObj = getRandomItem(NEIGHBORHOOD_CENTERS);
    const faultType = getRandomItem(FAULT_TYPES);
    const desc = getRandomItem(FAULT_DESCRIPTIONS);
    const lat = jitterCoord(neighborhoodObj.lat);
    const lon = jitterCoord(neighborhoodObj.lon);
    const randomUser = driverUsers.length > 0 ? getRandomItem(driverUsers).id : defaultUserId;

    const pastMinutes = Math.floor(Math.random() * 4000) + 10;
    const createdAt = new Date(Date.now() - pastMinutes * 60 * 1000);

    containerInserts.push({
      reportedBy: randomUser,
      region: neighborhoodObj.region,
      neighborhood: neighborhoodObj.name,
      faultType,
      description: `${desc} (${neighborhoodObj.name})`,
      latitude: String(lat),
      longitude: String(lon),
      photoUrl: null,
      status: "bekliyor" as const,
      createdAt,
    });
  }

  for (const item of containerInserts) {
    await db.insert(containerFaults).values(item as any);
  }
  console.log("✅ 50 Adet Konteyner Arızası başarıyla eklendi.");

  // 4. 10 Tane Vatandaş Şikayeti Ekle
  console.log("\n🚨 10 Adet Vatandaş Şikayeti oluşturuluyor...");
  const complaintInserts = [];
  for (let i = 0; i < COMPLAINT_DATA.length; i++) {
    const data = COMPLAINT_DATA[i];
    const neighborhoodObj = NEIGHBORHOOD_CENTERS[i % NEIGHBORHOOD_CENTERS.length];
    const lat = jitterCoord(neighborhoodObj.lat, 0.004);
    const lon = jitterCoord(neighborhoodObj.lon, 0.004);
    const randomUser = adminUsers.length > 0 ? getRandomItem(adminUsers).id : defaultUserId;

    const createdAt = new Date(Date.now() - (4 - (i % 3)) * 3600 * 1000);
    // dueAt: createdAt + dueHours
    const dueAt = new Date(createdAt.getTime() + data.dueHours * 3600 * 1000);

    complaintInserts.push({
      reportedBy: randomUser,
      region: neighborhoodObj.region,
      neighborhood: neighborhoodObj.name,
      description: `${data.desc} (${neighborhoodObj.name})`,
      latitude: String(lat),
      longitude: String(lon),
      urgency: data.urgency,
      status: "açık" as const,
      dueAt,
      createdAt,
    });
  }

  for (const item of complaintInserts) {
    await db.insert(citizenComplaints).values(item as any);
  }
  console.log("✅ 10 Adet Vatandaş Şikayeti başarıyla eklendi.");

  console.log("\n🎉 TÜM TEST VERİLERİ BAŞARIYLA EKLENDİ!");
  console.log("--------------------------------------------------");
  console.log("📊 Eklenen Özet:");
  console.log("  • Damperlik Atık: 50 Adet (Farklı Tepebaşı mahalleleri, kepçe gereksinimleri ve koordinatlarıyla)");
  console.log("  • Konteyner Arızası: 50 Adet (Kol, ayak, gövde, kapak türlerinde)");
  console.log("  • Vatandaş Şikayeti: 10 Adet (Açık ve acil süreleriyle)");
  console.log("--------------------------------------------------");
  process.exit(0);
}

seedData().catch(err => {
  console.error("Test verisi ekleme hatası:", err);
  process.exit(1);
});
