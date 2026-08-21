import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class DriverShiftScreen extends StatefulWidget {
  const DriverShiftScreen({super.key});

  @override
  State<DriverShiftScreen> createState() => _DriverShiftScreenState();
}

class _DriverShiftScreenState extends State<DriverShiftScreen> {
  int? _selectedVehicleId;
  String _selectedNeighborhood = "Hoşnudiye";
  String _selectedShiftHour = "08:00 - 16:00";
  bool _submitting = false;

  final List<String> _shiftHoursList = [
    "08:00 - 16:00",
    "16:00 - 00:00",
    "00:00 - 08:00",
  ];

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final activeShift = ops.activeShift;
    final availableVehicles = ops.vehiclesList.where((v) => v.isActive).toList();


    return Scaffold(
      appBar: AppBar(
        title: const Text("Şoför Mesai & Vardiya"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchAllOperations(),
          ),
        ],
      ),
      body: ops.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Aktif Mesai Kartı
                if (activeShift != null) ...[
                  Card(
                    color: const Color(0xFFECFDF5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.check_circle_rounded, color: AppTheme.primaryGreen, size: 22),
                                  SizedBox(width: 8),
                                  Text(
                                    "DEVAM EDEN MESAİ",
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.primaryGreen),
                                  ),
                                ],
                              ),
                              OperationBadge(label: activeShift.shiftHours, color: AppTheme.primaryGreen),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            "Görev Bölgesi: ${activeShift.neighborhood} Mahallesi",
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMain),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Araç: ${activeShift.vehiclePlate ?? 'Tanımlı Değil'} (${activeShift.vehicleType ?? 'Kamyon'})",
                            style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                          ),
                          const SizedBox(height: 16),
                          CustomButton(
                            text: "Mesaiyi Sonlandır (Bitir)",
                            icon: Icons.stop_circle_outlined,
                            backgroundColor: AppTheme.accentRed,
                            isLoading: _submitting,
                            onPressed: () async {
                              setState(() => _submitting = true);
                              final ok = await ops.endShift(activeShift.id);
                              setState(() => _submitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(ok ? "Mesainiz başarıyla sonlandırıldı." : "Hata oluştu."),
                                    backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                                  ),
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  // Yeni Mesai Başlatma Formu
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.play_circle_outline_rounded, color: AppTheme.primaryGreen, size: 22),
                              SizedBox(width: 8),
                              Text(
                                "Yeni Mesai Başlat",
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textMain),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Araç Seçimi
                          const Text("Görev Yapılacak Araç", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textMain)),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<int>(
                            value: _selectedVehicleId,
                            hint: const Text("Araç Seçiniz"),
                            isExpanded: true,
                            items: availableVehicles.map((v) {
                              return DropdownMenuItem<int>(
                                value: v.id,
                                child: Text("${v.plate} - ${v.brand} (${v.type})"),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedVehicleId = val),
                          ),
                          const SizedBox(height: 14),

                          // Vardiya Saatleri
                          const Text("Vardiya Saatleri", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textMain)),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            value: _selectedShiftHour,
                            isExpanded: true,
                            items: _shiftHoursList.map((h) {
                              return DropdownMenuItem<String>(value: h, child: Text(h));
                            }).toList(),

                            onChanged: (val) {
                              if (val != null) setState(() => _selectedShiftHour = val);
                            },
                          ),
                          const SizedBox(height: 14),

                          // Mahalle
                          const Text("Başlangıç Mahallesi", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textMain)),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            value: _selectedNeighborhood,
                            isExpanded: true,
                            items: AppConstants.neighborhoods.map((n) {
                              return DropdownMenuItem<String>(value: n['name'], child: Text(n['name']!));
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedNeighborhood = val);
                            },
                          ),
                          const SizedBox(height: 20),

                          CustomButton(
                            text: "Mesaiye Başla",
                            icon: Icons.play_arrow_rounded,
                            backgroundColor: AppTheme.primaryGreen,
                            isLoading: _submitting,
                            onPressed: () async {
                              if (_selectedVehicleId == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text("Lütfen mesaide kullanılacak aracı seçin."), backgroundColor: AppTheme.accentRed),
                                );
                                return;
                              }
                              setState(() => _submitting = true);
                              final ok = await ops.startShift(
                                vehicleId: _selectedVehicleId!,
                                region: "Tepebaşı",
                                neighborhood: _selectedNeighborhood,
                                shiftHours: _selectedShiftHour,
                              );
                              setState(() => _submitting = false);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(ok ? "Mesainiz başarıyla başlatıldı!" : "Mesai başlatılamadı."),
                                    backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                                  ),
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Vardiya Geçmişi
                const Text(
                  "Vardiya / Sefer Geçmişi",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                ),
                const SizedBox(height: 10),

                if (ops.shiftsList.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text("Henüz tamamlanmış vardiya kaydı bulunmuyor.", style: TextStyle(color: AppTheme.textMuted)),
                  )
                else
                  ...ops.shiftsList.take(10).map((shift) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: shift.isActive ? AppTheme.primaryGreen : Colors.grey.shade400,
                          child: Icon(Icons.local_shipping_rounded, color: Colors.white, size: 18),
                        ),
                        title: Text("${shift.neighborhood} Mahallesi", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        subtitle: Text(
                          "Araç: ${shift.vehiclePlate ?? 'Plaka Yok'} • Vardiya: ${shift.shiftHours}",
                          style: const TextStyle(fontSize: 12),
                        ),
                        trailing: OperationBadge(
                          label: shift.isActive ? "Aktif" : "Tamamlandı",
                          color: shift.isActive ? AppTheme.primaryGreen : Colors.grey,
                        ),
                      ),
                    );
                  }),
              ],
            ),
    );
  }
}
