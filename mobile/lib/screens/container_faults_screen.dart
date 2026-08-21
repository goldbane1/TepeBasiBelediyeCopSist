import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';
import 'report_fault_screen.dart';

class ContainerFaultsScreen extends StatelessWidget {
  const ContainerFaultsScreen({super.key});

  void _showRepairDialog(BuildContext context, ContainerFault item) {
    final ops = Provider.of<OperationsProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final user = auth.user;
    final isWelder = user?.isWelder ?? false;
    final isManager = user?.isManager ?? false;

    if (!isWelder && !isManager) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Konteyner arızalarını yalnızca Kaynak Personeli ve Yönetim onarıp kapatabilir."),
          backgroundColor: AppTheme.accentRed,
        ),
      );
      return;
    }

    final noteController = TextEditingController(text: "Kaynak ve onarım tamamlandı.");

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Konteyner Onarımı Kapat", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("${item.neighborhood} - ${item.faultType.toUpperCase()} Arızası", style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: noteController,
              decoration: const InputDecoration(labelText: "Onarım Notu"),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("İptal")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
            onPressed: () async {
              Navigator.pop(ctx);
              final ok = await ops.repairContainerFault(item.id, note: noteController.text.trim());
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok ? "Konteyner onarımı başarıyla kaydedildi!" : "İşlem başarısız."),
                    backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                  ),
                );
              }
            },
            child: const Text("Onarımı Kapat"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final list = ops.filteredContainerFaults;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Konteyner Arıza Yönetimi"),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            tooltip: "Yeni Arıza Bildir",
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportFaultScreen()));
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
                    hintText: "Arıza türü, parça veya mahalle ara...",
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
                      color: AppTheme.accentRed,
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
                        child: Text("Filtrelere uygun bekleyen konteyner arızası bulunamadı.", style: TextStyle(color: AppTheme.textMuted)),
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
                                      OperationBadge(label: "${item.faultType.toUpperCase()} ARIZASI", color: AppTheme.accentRed),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    item.description,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMain),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        "Konum: ${item.latitude.toStringAsFixed(4)}, ${item.longitude.toStringAsFixed(4)}",
                                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                      ),
                                      ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppTheme.accentRed,
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        ),
                                        onPressed: () => _showRepairDialog(context, item),
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
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.accentRed,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.build_circle_rounded),
        label: const Text("Yeni Arıza Bildir"),
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportFaultScreen()));
        },
      ),
    );
  }
}
