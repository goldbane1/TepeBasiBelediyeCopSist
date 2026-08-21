import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';
import 'bulk_waste_screen.dart';
import 'complaints_screen.dart';
import 'container_faults_screen.dart';
import 'login_screen.dart';
import 'map_screen.dart';
import 'report_fault_screen.dart';
import 'report_waste_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<OperationsProvider>(context, listen: false).fetchAllOperations();
    });
  }

  final List<Widget> _tabs = const [
    _DashboardTab(),
    MapScreen(),
    BulkWasteScreen(),
    ContainerFaultsScreen(),
    ComplaintsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        backgroundColor: Colors.white,
        indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded, color: AppTheme.primaryGreen),
            label: "Özet",
          ),
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map_rounded, color: AppTheme.primaryGreen),
            label: "Harita",
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2_rounded, color: AppTheme.accentAmber),
            label: "Damper",
          ),
          NavigationDestination(
            icon: Icon(Icons.delete_outline_rounded),
            selectedIcon: Icon(Icons.delete_rounded, color: AppTheme.accentRed),
            label: "Konteyner",
          ),
          NavigationDestination(
            icon: Icon(Icons.record_voice_over_outlined),
            selectedIcon: Icon(Icons.record_voice_over_rounded, color: Color(0xFF7C3AED)),
            label: "Şikayetler",
          ),
        ],
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final ops = Provider.of<OperationsProvider>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Tepebaşı Temizlik Sahası"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ops.fetchAllOperations(),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ops.fetchAllOperations(),
        color: AppTheme.primaryGreen,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Kullanıcı Bilgi Kartı
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
                      child: const Icon(Icons.person_rounded, color: AppTheme.primaryGreen, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? "Personel",
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                          ),
                          const SizedBox(height: 4),
                          OperationBadge(
                            label: user?.roleFormatted ?? "Personel",
                            color: AppTheme.primaryGreen,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Canlı Saha İstatistik Kartları (KPI)
            const Text(
              "Canlı Saha Durumu",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain),
            ),
            const SizedBox(height: 10),

            Row(
              children: [
                Expanded(
                  child: _KpiCard(
                    title: "Damperlik Atık",
                    count: ops.bulkWasteList.length.toString(),
                    icon: Icons.inventory_2_rounded,
                    color: AppTheme.accentAmber,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _KpiCard(
                    title: "Konteyner Arızası",
                    count: ops.containerFaultsList.length.toString(),
                    icon: Icons.delete_outline_rounded,
                    color: AppTheme.accentRed,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: _KpiCard(
                    title: "Açık Şikayet",
                    count: ops.complaintsList.length.toString(),
                    icon: Icons.record_voice_over_rounded,
                    color: const Color(0xFF7C3AED),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _KpiCard(
                    title: "Toplam Nokta",
                    count: (ops.bulkWasteList.length + ops.containerFaultsList.length + ops.complaintsList.length).toString(),
                    icon: Icons.map_rounded,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Hızlı Bildirim İşlemleri
            const Text(
              "Hızlı Saha İşlemleri",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain),
            ),
            const SizedBox(height: 10),

            Row(
              children: [
                Expanded(
                  child: CustomButton(
                    text: "Atık Bildir",
                    icon: Icons.camera_alt_rounded,
                    backgroundColor: AppTheme.accentAmber,
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportWasteScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: CustomButton(
                    text: "Arıza Bildir",
                    icon: Icons.build_circle_rounded,
                    backgroundColor: AppTheme.accentRed,
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportFaultScreen()));
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Son Bekleyen Damperlik Atıklar Önizlemesi
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "Bekleyen Damper Atıklar",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                ),
                Text(
                  "${ops.bulkWasteList.length} Nokta",
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (ops.isLoading)
              const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppTheme.primaryGreen)))
            else if (ops.bulkWasteList.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text("Bekleyen atık kaydı bulunmuyor.", style: TextStyle(color: AppTheme.textMuted)),
              )
            else
              ...ops.bulkWasteList.take(5).map((item) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.amber,
                      child: Icon(Icons.inventory_2_rounded, color: Colors.white, size: 20),
                    ),
                    title: Text(item.neighborhood, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    subtitle: Text(item.description, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                    trailing: OperationBadge(label: item.wasteType, color: AppTheme.accentAmber),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String title;
  final String count;
  final IconData icon;
  final Color color;

  const _KpiCard({required this.title, required this.count, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 24),
                Text(
                  count,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
