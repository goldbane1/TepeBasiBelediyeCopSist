import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class NeighborhoodsScreen extends StatelessWidget {
  const NeighborhoodsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final neighborhoods = AppConstants.neighborhoods;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Tepebaşı Mahalleleri"),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: neighborhoods.length,
        itemBuilder: (ctx, idx) {
          final n = neighborhoods[idx];
          final name = n['name']!;
          final wasteCount = ops.bulkWasteList.where((w) => w.neighborhood == name && w.isPending).length;
          final faultCount = ops.containerFaultsList.where((f) => f.neighborhood == name && f.isPending).length;
          final complaintCount = ops.complaintsList.where((c) => c.neighborhood == name && c.isOpen).length;
          final totalTasks = wasteCount + faultCount + complaintCount;

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: totalTasks > 0 ? AppTheme.accentAmber.withValues(alpha: 0.15) : AppTheme.primaryGreen.withValues(alpha: 0.15),
                child: Icon(
                  Icons.location_city_rounded,
                  color: totalTasks > 0 ? AppTheme.accentAmber : AppTheme.primaryGreen,
                  size: 20,
                ),
              ),
              title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text(
                "Koordinat: ${n['lat']}, ${n['lon']}",
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
              trailing: totalTasks > 0
                  ? OperationBadge(
                      label: "$totalTasks Bekleyen İş",
                      color: AppTheme.accentAmber,
                    )
                  : const OperationBadge(
                      label: "Temiz & Sorunsuz",
                      color: AppTheme.primaryGreen,
                    ),
            ),
          );
        },
      ),
    );
  }
}
