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
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),

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

              if (type == "damper" && (operation as BulkWasteReport).requiresExcavator)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(6)),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
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

              if (type == "damper") ...[
                if (isDamperDriver || isManager)
                  CustomButton(
                    text: "Damperlik Atığı Topla & Kapat",
                    icon: Icons.check_circle_outline,
                    backgroundColor: AppTheme.accentAmber,
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final success = await ops.collectBulkWaste(operation.id);
                      if (context.mounted) {
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
                    backgroundColor: AppTheme.accentRed,
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final success = await ops.repairContainerFault(operation.id, note: "Mobil sahadan onarıldı.");
                      if (context.mounted) {
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
        if (item.latitude != 0.0 && item.longitude != 0.0) {
          markers.add(
            Marker(
              point: LatLng(item.latitude, item.longitude),
              width: 38,
              height: 38,
              child: GestureDetector(
                onTap: () => _showPinDetailSheet(item, "damper"),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.accentAmber,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                  ),
                  child: const Icon(Icons.inventory_2_rounded, size: 18, color: Colors.white),
                ),
              ),
            ),
          );
        }
      }
    }

    // 2. Konteyner Arızası Markerları (Kırmızı)
    if (ops.selectedFilterType == "tümü" || ops.selectedFilterType == "arıza") {
      for (final item in ops.filteredContainerFaults) {
        if (item.latitude != 0.0 && item.longitude != 0.0) {
          markers.add(
            Marker(
              point: LatLng(item.latitude, item.longitude),
              width: 38,
              height: 38,
              child: GestureDetector(
                onTap: () => _showPinDetailSheet(item, "arıza"),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.accentRed,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                  ),
                  child: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.white),
                ),
              ),
            ),
          );
        }
      }
    }

    // 3. Vatandaş Şikayeti Markerları (Mor)
    if (ops.selectedFilterType == "tümü" || ops.selectedFilterType == "şikayet") {
      for (final item in ops.filteredComplaints) {
        if (item.latitude != 0.0 && item.longitude != 0.0) {
          markers.add(
            Marker(
              point: LatLng(item.latitude, item.longitude),
              width: 38,
              height: 38,
              child: GestureDetector(
                onTap: () => _showPinDetailSheet(item, "şikayet"),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
                  ),
                  child: const Icon(Icons.record_voice_over_rounded, size: 18, color: Colors.white),
                ),
              ),
            ),
          );
        }
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Tepebaşı Canlı Harita"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchAllOperations(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // OpenStreetMap
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

          // Üst Kategori & Mahalle Filtreleri Barı
          Positioned(
            top: 10,
            left: 10,
            right: 10,
            child: Column(
              children: [
                // Mahalle Dropdown
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 18, color: AppTheme.primaryGreen),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: ops.selectedNeighborhood,
                            isExpanded: true,
                            style: const TextStyle(fontSize: 13, color: AppTheme.textMain, fontWeight: FontWeight.bold),
                            items: [
                              const DropdownMenuItem(value: "Tümü", child: Text("Tüm Tepebaşı (Mahalle Filtresiz)")),
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
                      Text(
                        "${markers.length} Pin",
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),

                // Kategori Seçim Hapları (Pills)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterPill(
                        label: "Tümü (${ops.bulkWasteList.length + ops.containerFaultsList.length + ops.complaintsList.length})",
                        isSelected: ops.selectedFilterType == "tümü",
                        color: AppTheme.primaryGreen,
                        onTap: () => ops.setFilterType("tümü"),
                      ),
                      const SizedBox(width: 6),
                      _FilterPill(
                        label: "📦 Damper (${ops.bulkWasteList.length})",
                        isSelected: ops.selectedFilterType == "damper",
                        color: AppTheme.accentAmber,
                        onTap: () => ops.setFilterType("damper"),
                      ),
                      const SizedBox(width: 6),
                      _FilterPill(
                        label: "🏗️ Arıza (${ops.containerFaultsList.length})",
                        isSelected: ops.selectedFilterType == "arıza",
                        color: AppTheme.accentRed,
                        onTap: () => ops.setFilterType("arıza"),
                      ),
                      const SizedBox(width: 6),
                      _FilterPill(
                        label: "🚨 Şikayet (${ops.complaintsList.length})",
                        isSelected: ops.selectedFilterType == "şikayet",
                        color: const Color(0xFF7C3AED),
                        onTap: () => ops.setFilterType("şikayet"),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Sağ Alt Merkeze Odaklan Butonu
          Positioned(
            bottom: 20,
            right: 16,
            child: FloatingActionButton.small(
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.primaryGreen,
              onPressed: () {
                _mapController.move(
                  const LatLng(AppConstants.tepebasiCenterLat, AppConstants.tepebasiCenterLon),
                  AppConstants.defaultZoom,
                );
              },
              child: const Icon(Icons.my_location_rounded),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool isSelected;
  final Color color;
  final VoidCallback onTap;

  const _FilterPill({required this.label, required this.isSelected, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? color : AppTheme.borderSubtle, width: 1.5),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1))],
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textMain,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
