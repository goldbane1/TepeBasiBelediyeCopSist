import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';
import 'report_waste_screen.dart';

class BulkWasteScreen extends StatelessWidget {
  const BulkWasteScreen({super.key});

  void _showCollectDialog(BuildContext context, BulkWasteReport item) {
    final ops = Provider.of<OperationsProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    final isDamperDriver = (user?.isDriver ?? false) && (ops.activeShift?.isDamperTruck ?? false);
    final isManager = user?.isManager ?? false;

    if (!isDamperDriver && !isManager) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Bu işlem için aktif Damperli Kamyon mesaisi veya yönetim yetkisi gereklidir."),
          backgroundColor: AppTheme.accentAmber,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Damperlik Atığı Kaldır", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Text("${item.neighborhood} adresindeki atığı toplandı olarak işaretlemek istiyor musunuz?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("İptal")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
            onPressed: () async {
              Navigator.pop(ctx);
              final ok = await ops.collectBulkWaste(item.id);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok ? "Damperlik atık başarıyla toplandı!" : "İşlem başarısız."),
                    backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                  ),
                );
              }
            },
            child: const Text("Topla & Kapat"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final list = ops.filteredBulkWaste;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Damperlik Atık Yönetimi"),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            tooltip: "Yeni Atık Bildir",
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportWasteScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchAllOperations(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Arama & Mahalle Filtresi
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  onChanged: (val) => ops.setSearchQuery(val),
                  decoration: InputDecoration(
                    hintText: "Atık türü, sokak veya mahalle ara...",
                    prefixIcon: const Icon(Icons.search_rounded, size: 20),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    suffixIcon: ops.searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () => ops.setSearchQuery(""),
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.filter_list_rounded, size: 18, color: AppTheme.textMuted),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: ops.selectedNeighborhood,
                          isExpanded: true,
                          style: const TextStyle(fontSize: 13, color: AppTheme.textMain, fontWeight: FontWeight.w600),
                          items: [
                            const DropdownMenuItem(value: "Tümü", child: Text("Tüm Mahalleler (Filtresiz)")),
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
                    OperationBadge(
                      label: "${list.length} Bekleyen",
                      color: AppTheme.accentAmber,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.borderSubtle),

          // Liste
          Expanded(
            child: ops.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                : list.isEmpty
                    ? const Center(
                        child: Text("Filtrelere uygun bekleyen damperlik atık bulunamadı.", style: TextStyle(color: AppTheme.textMuted)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: list.length,
                        itemBuilder: (ctx, idx) {
                          final item = list[idx];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      OperationBadge(label: item.neighborhood, color: AppTheme.primaryGreen),
                                      OperationBadge(label: item.wasteType, color: AppTheme.accentAmber),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    item.description,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMain),
                                  ),
                                  const SizedBox(height: 8),
                                  if (item.requiresExcavator)
                                    Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(6)),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.warning_amber_rounded, size: 14, color: AppTheme.accentAmber),
                                          SizedBox(width: 4),
                                          Text("Kepçe / İş Makinesi Gerekli", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.accentAmber)),
                                        ],
                                      ),
                                    ),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        "Konum: ${item.latitude.toStringAsFixed(4)}, ${item.longitude.toStringAsFixed(4)}",
                                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                      ),
                                      ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppTheme.accentAmber,
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        ),
                                        onPressed: () => _showCollectDialog(context, item),
                                        icon: const Icon(Icons.check_circle_outline, size: 16),
                                        label: const Text("Atığı Topla"),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.accentAmber,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.camera_alt_rounded),
        label: const Text("Yeni Atık Bildir"),
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportWasteScreen()));
        },
      ),
    );
  }
}
