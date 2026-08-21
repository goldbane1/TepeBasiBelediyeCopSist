import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class AuditLogsScreen extends StatefulWidget {
  const AuditLogsScreen({super.key});

  @override
  State<AuditLogsScreen> createState() => _AuditLogsScreenState();
}

class _AuditLogsScreenState extends State<AuditLogsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OperationsProvider>(context, listen: false).fetchManagementData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final list = ops.auditLogsList;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Sistem Denetim Logları"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchManagementData(),
          ),
        ],
      ),
      body: list.isEmpty
          ? const Center(child: Text("Kayıtlı işlem geçmişi bulunamadı.", style: TextStyle(color: AppTheme.textMuted)))
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              itemBuilder: (ctx, idx) {
                final log = list[idx];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
                          child: const Icon(Icons.history_rounded, size: 18, color: AppTheme.primaryGreen),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(log.action, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              if (log.details != null && log.details!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(log.details!, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                              ],
                              const SizedBox(height: 6),
                              Text(
                                "İşlem Yapan: ${log.userName ?? 'Sistem'} • ${log.createdAt?.toString().substring(0, 16) ?? ''}",
                                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
