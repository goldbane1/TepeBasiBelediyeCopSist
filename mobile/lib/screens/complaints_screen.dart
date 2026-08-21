import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class ComplaintsScreen extends StatefulWidget {
  const ComplaintsScreen({super.key});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen> {
  void _openResolutionModal(CitizenComplaint complaint) {
    String? photoBase64;
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
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
                  const Text("Vatandaş Şikayetini Çözümle", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    "${complaint.neighborhood} - ${complaint.description}",
                    style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 16),
                  const Text("Temizlik Sonrası Çözüm Fotoğrafı:", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final picker = ImagePicker();
                      final img = await picker.pickImage(source: ImageSource.camera, maxWidth: 1280, imageQuality: 80);
                      if (img != null) {
                        final bytes = await img.readAsBytes();
                        setModalState(() {
                          photoBase64 = "data:image/jpeg;base64,${base64Encode(bytes)}";
                        });
                      }
                    },
                    icon: const Icon(Icons.camera_alt),
                    label: const Text("Kameradan Çözüm Fotoğrafı Çek"),
                  ),
                  if (photoBase64 != null) ...[
                    const SizedBox(height: 10),
                    const Row(
                      children: [
                        Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 16),
                        SizedBox(width: 6),
                        Text("Çözüm fotoğrafı hazır.", style: TextStyle(fontSize: 12, color: AppTheme.primaryGreen)),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),
                  CustomButton(
                    text: "Temizlendi Olarak Onaya Gönder",
                    isLoading: isSubmitting,
                    onPressed: photoBase64 == null
                        ? null
                        : () async {
                            setModalState(() => isSubmitting = true);
                            final ops = Provider.of<OperationsProvider>(context, listen: false);
                            final ok = await ops.resolveComplaint(complaint.id, photoBase64: photoBase64!);
                            if (mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(ok ? "Şikayet çözümü onaya gönderildi!" : "İşlem başarısız."),
                                  backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                                ),
                              );
                            }
                          },
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final complaints = ops.filteredComplaints;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Vatandaş Şikayetleri"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ops.fetchAllOperations(),
          ),
        ],
      ),
      body: complaints.isEmpty
          ? const Center(
              child: Text("Bölgenizde bekleyen aktif şikayet bulunmuyor.", style: TextStyle(color: AppTheme.textMuted)),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: complaints.length,
              itemBuilder: (ctx, idx) {
                final c = complaints[idx];
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
                            OperationBadge(label: c.neighborhood, color: const Color(0xFF7C3AED)),
                            OperationBadge(
                              label: c.isOpen ? "AÇIK" : "ONAY BEKLİYOR",
                              color: c.isOpen ? AppTheme.accentRed : AppTheme.accentAmber,
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(c.description, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () => _openResolutionModal(c),
                              icon: const Icon(Icons.camera_alt, size: 16),
                              label: const Text("Çöz & Fotoğraf Yükle"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryGreen,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
                            ),
                          ],
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
