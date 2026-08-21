import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class ReportWasteScreen extends StatefulWidget {
  const ReportWasteScreen({super.key});

  @override
  State<ReportWasteScreen> createState() => _ReportWasteScreenState();
}

class _ReportWasteScreenState extends State<ReportWasteScreen> {
  String _selectedNeighborhood = AppConstants.neighborhoods.first['name']!;
  String _selectedWasteType = AppConstants.wasteTypes.first;
  final _descriptionController = TextEditingController();
  final _latController = TextEditingController(text: AppConstants.tepebasiCenterLat.toString());
  final _lonController = TextEditingController(text: AppConstants.tepebasiCenterLon.toString());
  bool _requiresExcavator = false;
  String? _photoBase64;
  bool _isLoading = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    _latController.dispose();
    _lonController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition();
        setState(() {
          _latController.text = pos.latitude.toStringAsFixed(6);
          _lonController.text = pos.longitude.toStringAsFixed(6);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("GPS konumu başarıyla alındı."), backgroundColor: AppTheme.primaryGreen),
          );
        }
      }
    } catch (_) {
      // Fallback
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source, maxWidth: 1280, maxHeight: 1280, imageQuality: 80);
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        setState(() {
          _photoBase64 = "data:image/jpeg;base64,${base64Encode(bytes)}";
        });
      }
    } catch (e) {
      print("[Camera Error] $e");
    }
  }

  void _submit() async {
    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Lütfen atık açıklamasını girin."), backgroundColor: AppTheme.accentRed),
      );
      return;
    }

    setState(() => _isLoading = true);

    final neighborhoodObj = AppConstants.neighborhoods.firstWhere(
      (n) => n['name'] == _selectedNeighborhood,
      orElse: () => {"name": _selectedNeighborhood, "region": "Merkez Bölgesi"},
    );

    final ops = Provider.of<OperationsProvider>(context, listen: false);
    try {
      final ok = await ops.reportBulkWaste(
        region: neighborhoodObj['region']!,
        neighborhood: _selectedNeighborhood,
        wasteType: _selectedWasteType,
        description: _descriptionController.text.trim(),
        latitude: double.tryParse(_latController.text) ?? AppConstants.tepebasiCenterLat,
        longitude: double.tryParse(_lonController.text) ?? AppConstants.tepebasiCenterLon,
        requiresExcavator: _requiresExcavator,
        photoBase64: _photoBase64,
      );

      if (mounted) {
        setState(() => _isLoading = false);
        if (ok) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Damperlik atık başarıyla bildirildi!"), backgroundColor: AppTheme.primaryGreen),
          );
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Bildirim gönderilemedi: $e"), backgroundColor: AppTheme.accentRed),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Damperlik Atık Bildir")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Mahalle Seçimi
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Mahalle Seçimi", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedNeighborhood,
                      decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                      items: AppConstants.neighborhoods.map((n) {
                        return DropdownMenuItem(value: n['name'], child: Text(n['name']!));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedNeighborhood = val);
                      },
                    ),
                    const SizedBox(height: 16),

                    const Text("Atık Türü", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedWasteType,
                      decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                      items: AppConstants.wasteTypes.map((w) {
                        return DropdownMenuItem(value: w, child: Text(w));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedWasteType = val);
                      },
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Açıklama & Kepçe Durumu
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Atık Detayı / Açıklama", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: "Örn: Sokak köşesinde yaklaşık 1 kamyonluk moloz yığını...",
                      ),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text("Kepçe / İş Makinesi Gerekiyor mu?", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      subtitle: const Text("Büyük hacimli moloz veya taş yığınları için", style: TextStyle(fontSize: 12)),
                      value: _requiresExcavator,
                      activeColor: AppTheme.accentAmber,
                      onChanged: (val) => setState(() => _requiresExcavator = val),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // GPS & Konum
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Konum Koordinatları", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        TextButton.icon(
                          onPressed: _getCurrentLocation,
                          icon: const Icon(Icons.my_location_rounded, size: 16),
                          label: const Text("Anlık GPS Al", style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _latController,
                            decoration: const InputDecoration(labelText: "Enlem (Lat)"),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _lonController,
                            decoration: const InputDecoration(labelText: "Boylam (Lon)"),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Fotoğraf Ekleme
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Saha Fotoğrafı", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.camera),
                            icon: const Icon(Icons.camera_alt_outlined),
                            label: const Text("Fotoğraf Çek"),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library_outlined),
                            label: const Text("Galeriden Seç"),
                          ),
                        ),
                      ],
                    ),
                    if (_photoBase64 != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                        child: const Row(
                          children: [
                            Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 18),
                            SizedBox(width: 8),
                            Text("Fotoğraf başarıyla eklendi ve sıkıştırıldı.", style: TextStyle(fontSize: 12, color: AppTheme.primaryGreenDark)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            CustomButton(
              text: "Damperlik Atık Bildirimini Kaydet",
              icon: Icons.send_rounded,
              isLoading: _isLoading,
              onPressed: _submit,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
