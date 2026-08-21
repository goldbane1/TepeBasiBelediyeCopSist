import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class VehicleFaultsScreen extends StatefulWidget {
  const VehicleFaultsScreen({super.key});

  @override
  State<VehicleFaultsScreen> createState() => _VehicleFaultsScreenState();
}

class _VehicleFaultsScreenState extends State<VehicleFaultsScreen> {
  void _showReportFaultModal(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context, listen: false);
    int? selectedVehicleId;
    String selectedFaultType = "motor";
    final descController = TextEditingController();

    if (ops.vehiclesList.isNotEmpty) {
      selectedVehicleId = ops.vehiclesList.first.id;
    }

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          title: const Text("Araç Arızası Bildir", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  value: selectedVehicleId,
                  decoration: const InputDecoration(labelText: "Arızalı Araç"),
                  items: ops.vehiclesList.map((v) {
                    return DropdownMenuItem(value: v.id, child: Text("${v.plate} - ${v.brand}"));
                  }).toList(),
                  onChanged: (val) => setModalState(() => selectedVehicleId = val),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: selectedFaultType,
                  decoration: const InputDecoration(labelText: "Arıza Kategorisi"),
                  items: const [
                    DropdownMenuItem(value: "motor", child: Text("Motor & Güç Aktarma")),
                    DropdownMenuItem(value: "hidrolik", child: Text("Hidrolik & Pres Sistemi")),
                    DropdownMenuItem(value: "fren", child: Text("Fren Sistemi")),
                    DropdownMenuItem(value: "lastik", child: Text("Lastik & Jant")),
                    DropdownMenuItem(value: "elektrik", child: Text("Elektrik & Aydınlatma")),
                    DropdownMenuItem(value: "periyodik", child: Text("Periyodik Bakım")),
                    DropdownMenuItem(value: "diğer", child: Text("Diğer")),
                  ],
                  onChanged: (val) => setModalState(() => selectedFaultType = val!),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: "Arıza Detayı & Belirtileri"),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("İptal")),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentRed),
              onPressed: () async {
                if (selectedVehicleId == null || descController.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                final ok = await ops.reportVehicleFault(
                  vehicleId: selectedVehicleId!,
                  faultType: selectedFaultType,
                  description: descController.text.trim(),
                );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? "Araç arızası kademeye iletildi." : "Arıza bildirilemedi."),
                      backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                    ),
                  );
                }
              },
              child: const Text("Bildir"),
            ),
          ],
        ),
      ),
    );
  }

  void _showRepairModal(BuildContext context, VehicleFault fault) {
    final noteController = TextEditingController(text: "Parça değişimi ve bakım tamamlandı.");

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("${fault.vehiclePlate ?? 'Araç'} Arızasını Kapat", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Arıza: ${fault.description}", style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 12),
            TextField(
              controller: noteController,
              decoration: const InputDecoration(labelText: "Kademe Bakım Notu"),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("İptal")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
            onPressed: () async {
              Navigator.pop(ctx);
              final ops = Provider.of<OperationsProvider>(context, listen: false);
              final ok = await ops.repairVehicleFault(fault.id, repairNote: noteController.text.trim());
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok ? "Araç onarımı tamamlandı ve aktif edildi." : "İşlem başarısız."),
                    backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                  ),
                );
              }
            },
            child: const Text("Onarımı Tamamla"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final canRepair = (user?.isManager ?? false) || (user?.isMechanic ?? false);
    final list = ops.vehicleFaultsList;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Araç Arızaları & Kademe"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchAllOperations(),
          ),
        ],
      ),
      body: ops.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : list.isEmpty
              ? const Center(child: Text("Bekleyen araç arızası bulunamadı.", style: TextStyle(color: AppTheme.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: list.length,
                  itemBuilder: (ctx, idx) {
                    final f = list[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(f.vehiclePlate ?? 'Araç', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                OperationBadge(label: "${f.faultType.toUpperCase()} ARIZASI", color: AppTheme.accentRed),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(f.description, style: const TextStyle(fontSize: 14, color: AppTheme.textMain)),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                OperationBadge(label: f.status.toUpperCase(), color: f.status == "onarıldı" ? AppTheme.primaryGreen : AppTheme.accentAmber),
                                if (canRepair && f.isPending)
                                  ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                                    onPressed: () => _showRepairModal(context, f),
                                    icon: const Icon(Icons.build_rounded, size: 16),
                                    label: const Text("Onarımı Kapat"),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.accentRed,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.warning_amber_rounded),
        label: const Text("Arıza Bildir"),
        onPressed: () => _showReportFaultModal(context),
      ),
    );
  }
}
