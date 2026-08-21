import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/operations_models.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';

class UsersManagementScreen extends StatefulWidget {
  const UsersManagementScreen({super.key});

  @override
  State<UsersManagementScreen> createState() => _UsersManagementScreenState();
}

class _UsersManagementScreenState extends State<UsersManagementScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OperationsProvider>(context, listen: false).fetchManagementData();
    });
  }

  void _showAddUserModal(BuildContext context) {
    final nameController = TextEditingController();
    final usernameController = TextEditingController();
    final passwordController = TextEditingController(text: "123456");
    String selectedRole = "şoför";

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          title: const Text("Yeni Personel Ekle", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: "Ad Soyad (Örn: Mehmet Demir)"),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: usernameController,
                  decoration: const InputDecoration(labelText: "Kullanıcı Adı (Örn: mehmet_d)"),
                  autocorrect: false,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: passwordController,
                  decoration: const InputDecoration(labelText: "Giriş Şifresi"),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: selectedRole,
                  decoration: const InputDecoration(labelText: "Personel Görevi / Rolü"),
                  items: const [
                    DropdownMenuItem(value: "şoför", child: Text("Çöp / Damper Şoförü")),
                    DropdownMenuItem(value: "kaynak personeli", child: Text("Kaynak & Konteyner Personeli")),
                    DropdownMenuItem(value: "kademe personeli", child: Text("Kademe & Bakım Personeli")),
                    DropdownMenuItem(value: "yönetim", child: Text("Sistem Yöneticisi")),
                  ],
                  onChanged: (val) => setModalState(() => selectedRole = val!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("İptal")),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
              onPressed: () async {
                if (nameController.text.trim().isEmpty || usernameController.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                final ops = Provider.of<OperationsProvider>(context, listen: false);
                final ok = await ops.createUser(
                  name: nameController.text.trim(),
                  username: usernameController.text.trim().toLowerCase(),
                  password: passwordController.text.trim(),
                  role: selectedRole,
                );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? "Personel hesabı oluşturuldu." : "Personel eklenemedi."),
                      backgroundColor: ok ? AppTheme.primaryGreen : AppTheme.accentRed,
                    ),
                  );
                }
              },
              child: const Text("Hesap Oluştur"),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ops = Provider.of<OperationsProvider>(context);
    final list = ops.usersList;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Personel & Yetki Yönetimi"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchManagementData(),
          ),
        ],
      ),
      body: list.isEmpty
          ? const Center(child: Text("Personel listesi yükleniyor...", style: TextStyle(color: AppTheme.textMuted)))
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              itemBuilder: (ctx, idx) {
                final u = list[idx];
                Color roleColor = AppTheme.primaryGreen;
                if (u.role == "kaynak personeli") roleColor = AppTheme.accentAmber;
                if (u.role == "kademe personeli") roleColor = const Color(0xFF2563EB);
                if (u.role == "yönetim") roleColor = const Color(0xFF7C3AED);

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: roleColor.withValues(alpha: 0.15),
                      child: Icon(Icons.person_rounded, color: roleColor),
                    ),
                    title: Text(u.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text("Kullanıcı Adı: @${u.username}", style: const TextStyle(fontSize: 12)),
                    trailing: OperationBadge(label: u.role.toUpperCase(), color: roleColor),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_alt_1_rounded),
        label: const Text("Yeni Personel"),
        onPressed: () => _showAddUserModal(context),
      ),
    );
  }
}
