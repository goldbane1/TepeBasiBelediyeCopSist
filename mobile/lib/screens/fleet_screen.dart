import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class FleetScreen extends StatefulWidget {
  const FleetScreen({super.key});

  @override
  State<FleetScreen> createState() => _FleetScreenState();
}

class _FleetScreenState extends State<FleetScreen> {
  void _showAddVehicleModal(BuildContext context) {
    final plateController = TextEditingController();
    final brandController = TextEditingController();
    final capacityController = TextEditingController(text: "13");
    String selectedType = "çöp kamyonu";
    String selectedStatus = "aktif";

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          title: const Text("Yeni Araç Ekle", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: plateController,
                  decoration: const InputDecoration(labelText: "Plaka (Örn: 26 TP 105)"),
                  textCapitalization: TextCapitalization.characters,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: brandController,
                  decoration: const InputDecoration(labelText: "Marka / Model (Örn: Mercedes Atego)"),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: capacityController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Kapasite (Ton)"),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: selectedType,
                  decoration: const InputDecoration(labelText: "Araç Tipi"),
                  items: const [
                    DropdownMenuItem(value: "çöp kamyonu", child: Text("Çöp Kamyonu")),
                    DropdownMenuItem(value: "damperli kamyon", child: Text("Damperli Kamyon")),
                  ],
                  onChanged: (val) => setModalState(() => selectedType = val!),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: selectedStatus,
                  decoration: const InputDecoration(labelText: "Başlangıç Durumu"),
                  items: const [
                    DropdownMenuItem(value: "aktif", child: Text("Aktif")),
                    DropdownMenuItem(value: "bakımda", child: Text("Bakımda")),
                    DropdownMenuItem(value: "arızalı", child: Text("Arızalı")),
                  ],
                  onChanged: (val) => setModalState(() => selectedStatus = val!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("İptal")),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
              onPressed: () async {
                if (plateController.text.trim().isEmpty || brandController.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                final ops = Provider.of<OperationsProvider>(context, listen: false);
                final ok = await ops.createVehicle(
                  type: selectedType,
                  capacityTon: capacityController.text.trim(),
                  brand: brandController.text.trim(),
                  plate: plateController.text.trim().toUpperCase(),
                  status: selectedStatus,
                );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? "Araç filoya başarıyla eklendi." : "Araç eklenemedi."),
                      backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                    ),
                  );
                }
              },
              child: const Text("Kaydet & Ekle"),
            ),
          ],
        ),
      ),
    );
  }

  void _showStatusDialog(BuildContext context, Vehicle vehicle) {
    final ops = Provider.of<OperationsProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    final canManage = (user?.isManager ?? false) || (user?.isMechanic ?? false);

    if (!canManage) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Araç durumunu yalnızca Kademe ve Yönetim personeli güncelleyebilir.")),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("${vehicle.plate} Durumu", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.check_circle_rounded, color: AppTheme.primaryGreen),
              title: const Text("Aktif (Göreve Hazır)"),
              onTap: () async {
                Navigator.pop(ctx);
                await ops.updateVehicleStatus(vehicle.id, "aktif");
              },
            ),
            ListTile(
              leading: const Icon(Icons.build_rounded, color: AppTheme.accentAmber),
              title: const Text("Bakımda"),
              onTap: () async {
                Navigator.pop(ctx);
                await ops.updateVehicleStatus(vehicle.id, "bakımda");
              },
            ),
            ListTile(
              leading: const Icon(Icons.error_rounded, color: AppTheme.accentRed),
              title: const Text("Arızalı (Hizmet Dışı)"),
              onTap: () async {
                Navigator.pop(ctx);
                await ops.updateVehicleStatus(vehicle.id, "arızalı");
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final canAdd = (user?.isManager ?? false) || (user?.isMechanic ?? false);
    final list = ops.vehiclesList;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Araç Filosu Yönetimi"),
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
              ? const Center(child: Text("Filoda kayıtlı araç bulunamadı.", style: TextStyle(color: AppTheme.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: list.length,
                  itemBuilder: (ctx, idx) {
                    final v = list[idx];
                    Color statusColor = AppTheme.primaryGreen;
                    if (v.status == "bakımda") statusColor = AppTheme.accentAmber;
                    if (v.status == "arızalı") statusColor = AppTheme.accentRed;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: statusColor.withValues(alpha: 0.15),
                              child: Icon(Icons.local_shipping_rounded, color: statusColor, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(v.plate, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  const SizedBox(height: 2),
                                  Text("${v.brand} • ${v.capacityTon} Ton Kapasite", style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                                  const SizedBox(height: 4),
                                  Text("Tip: ${v.type.toUpperCase()}", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMain)),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                OperationBadge(label: v.status.toUpperCase(), color: statusColor),
                                const SizedBox(height: 6),
                                if (canAdd)
                                  OutlinedButton(
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      minimumSize: Size.zero,
                                    ),
                                    onPressed: () => _showStatusDialog(context, v),
                                    child: const Text("Durum Değiştir", style: TextStyle(fontSize: 11)),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: canAdd
          ? FloatingActionButton.extended(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_rounded),
              label: const Text("Yeni Araç Ekle"),
              onPressed: () => _showAddVehicleModal(context),
            )
          : null,
    );
  }
}
