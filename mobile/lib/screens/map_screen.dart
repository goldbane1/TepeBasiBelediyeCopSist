import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OperationsProvider>(context, listen: false).fetchAllOperations();
    });
  }

  void _showPinDetailSheet(dynamic operation, String type) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final ops = Provider.of<OperationsProvider>(context, listen: false);
    final user = auth.user;
    final isDriver = user?.isDriver ?? false;
    final isDamperDriver = isDriver && (ops.activeShift?.isDamperTruck ?? false);
    final isWelder = user?.isWelder ?? false;
    final isManager = user?.isManager ?? false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Üst Çizgi
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Başlık & Rozet
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      type == "damper"
                          ? "📦 Damperlik Atık"
                          : type == "arıza"
                              ? "🏗️ Konteyner Arızası"
                              : "🚨 Vatandaş Şikayeti",
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  OperationBadge(
                    label: operation.neighborhood ?? '',
                    color: AppTheme.primaryGreen,
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Açıklama
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.bgLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Text(
                  operation.description ?? '',
                  style: const TextStyle(fontSize: 14, color: AppTheme.textMain),
                ),
              ),
              const SizedBox(height: 12),

              // Ek Bilgiler
              if (type == "damper" && (operation as BulkWasteReport).requiresExcavator)
                const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, size: 16, color: AppTheme.accentAmber),
                      SizedBox(width: 6),
                      Text("Bu atık için kepçe gereklidir.", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accentAmber)),
                    ],
                  ),
                ),

              if (type == "arıza")
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    "Arıza Türü: ${(operation as ContainerFault).faultType.toUpperCase()}",
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                  ),
                ),

              const SizedBox(height: 16),

              // Rol Bazlı Aksiyon Butonları
              if (type == "damper") ...[
                if (isDamperDriver || isManager)
                  CustomButton(
                    text: "Damperlik Atığı Topla & Kapat",
                    icon: Icons.check_circle_outline,
                    backgroundColor: AppTheme.primaryGreen,
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final success = await ops.collectBulkWaste(operation.id);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success ? "Atık başarıyla toplandı!" : "İşlem gerçekleştirilemedi."),
                            backgroundColor: success ? AppTheme.primaryGreen : AppTheme.accentRed,
                          ),
                        );
                      }
                    },
                  )
                else
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(8)),
                    child: const Text(
                      "ℹ️ Bu atığı sadece Damperli Kamyon ile mesaide olan şoför veya yönetim toplayabilir.",
                      style: TextStyle(fontSize: 12, color: Color(0xFFB45309)),
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],

              if (type == "arıza") ...[
                if (isWelder || isManager)
                  CustomButton(
                    text: "Onarımı Tamamla & Kapat",
                    icon: Icons.build_circle_outlined,
                    backgroundColor: AppTheme.primaryGreen,
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final success = await ops.repairContainerFault(operation.id, note: "Mobil sahadan onarıldı.");
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success ? "Konteyner arızası onarıldı!" : "İşlem başarısız."),
                            backgroundColor: success ? AppTheme.primaryGreen : AppTheme.accentRed,
                          ),
                        );
                      }
                    },
                  )
                else
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                    child: const Text(
                      "ℹ️ Konteyner arızalarını yalnızca Kaynak Personeli ve Yönetim kapatabilir.",
                      style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      textAlign: TextAlign.center,
                    ),
                  ),

              ],

              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);

    // Marker Listesi Oluştur
    final markers = <Marker>[];

    // 1. Damperlik Atık Markerları (Turuncu)
    if (ops.selectedFilterType == "tümü" || ops.selectedFilterType == "damper") {
      for (final item in ops.filteredBulkWaste) {
        markers.add(
          Marker(
            point: LatLng(item.latitude, item.longitude),
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showPinDetailSheet(item, "damper"),
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.accentAmber,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                ),
                child: const Icon(Icons.inventory_2_rounded, size: 20, color: Colors.white),
              ),
            ),
          ),
        );
      }
    }

    // 2. Konteyner Arızası Markerları (Kırmızı)
    if (ops.selectedFilterType == "tümü" || ops.selectedFilterType == "arıza") {
      for (final item in ops.filteredContainerFaults) {
        markers.add(
          Marker(
            point: LatLng(item.latitude, item.longitude),
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showPinDetailSheet(item, "arıza"),
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.accentRed,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                ),
                child: const Icon(Icons.delete_outline_rounded, size: 20, color: Colors.white),
              ),
            ),
          ),
        );
      }
    }

    // 3. Vatandaş Şikayeti Markerları (Mor)
    if (ops.selectedFilterType == "tümü" || ops.selectedFilterType == "şikayet") {
      for (final item in ops.filteredComplaints) {
        markers.add(
          Marker(
            point: LatLng(item.latitude, item.longitude),
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () => _showPinDetailSheet(item, "şikayet"),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED), // purple-600
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                ),
                child: const Icon(Icons.record_voice_over_rounded, size: 20, color: Colors.white),
              ),
            ),
          ),
        );
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Tepebaşı Canlı Saha Haritası"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchAllOperations(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // OpenStreetMap Katmanı
          FlutterMap(
            mapController: _mapController,
            options: const MapOptions(
              initialCenter: LatLng(AppConstants.tepebasiCenterLat, AppConstants.tepebasiCenterLon),
              initialZoom: AppConstants.defaultZoom,
              minZoom: 10,
              maxZoom: 18,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'tr.bel.tepebasi.temizlik',
              ),
              MarkerLayer(markers: markers),
            ],
          ),

          // Üst Filtre Barı (Mahalle & Tür Seçici)
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 2))],
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 20, color: AppTheme.primaryGreen),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: ops.selectedNeighborhood,
                        isExpanded: true,
                        icon: const Icon(Icons.arrow_drop_down_rounded),
                        style: const TextStyle(fontSize: 13, color: AppTheme.textMain, fontWeight: FontWeight.w600),
                        items: [
                          const DropdownMenuItem(value: "Tümü", child: Text("Tüm Tepebaşı (Hepsi)")),
                          ...AppConstants.neighborhoods.map((n) {
                            return DropdownMenuItem(value: n['name'], child: Text(n['name']!));
                          }),
                        ],
                        onChanged: (val) {
                          if (val != null) ops.setNeighborhoodFilter(val);
                        },
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: AppTheme.bgLight, borderRadius: BorderRadius.circular(8)),
                    child: Text(
                      "${ops.totalActivePoints} Nokta",
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
