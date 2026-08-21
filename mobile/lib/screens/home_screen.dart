import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../widgets/custom_widgets.dart';
import 'audit_logs_screen.dart';
import 'bulk_waste_screen.dart';
import 'complaints_screen.dart';
import 'container_faults_screen.dart';
import 'driver_shift_screen.dart';
import 'fleet_screen.dart';
import 'login_screen.dart';
import 'map_screen.dart';
import 'neighborhoods_screen.dart';
import 'report_fault_screen.dart';
import 'report_waste_screen.dart';
import 'users_management_screen.dart';
import 'vehicle_faults_screen.dart';

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

  final List<Widget> _bottomTabs = const [
    _DashboardTab(),
    MapScreen(),
    BulkWasteScreen(),
    ContainerFaultsScreen(),
    ComplaintsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // Drawer Header
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF064E3B), AppTheme.primaryGreen],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),

              currentAccountPicture: const CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(Icons.person_rounded, size: 36, color: AppTheme.primaryGreen),
              ),
              accountName: Text(user?.name ?? "Tepebaşı Personeli", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              accountEmail: Text(user?.roleFormatted ?? "Personel", style: const TextStyle(color: Colors.white70)),
            ),

            // 1. Ana Operasyonlar Grubu
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text("ANA OPERASYONLAR", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_rounded, color: AppTheme.primaryGreen),
              title: const Text("Operasyon Özeti"),
              selected: _currentIndex == 0,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 0);
              },
            ),
            ListTile(
              leading: const Icon(Icons.map_rounded, color: AppTheme.primaryGreen),
              title: const Text("Canlı Saha Haritası"),
              selected: _currentIndex == 1,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2_rounded, color: AppTheme.accentAmber),
              title: const Text("Damperlik Atık Yönetimi"),
              selected: _currentIndex == 2,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 2);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_rounded, color: AppTheme.accentRed),
              title: const Text("Konteyner Arıza & Kaynak"),
              selected: _currentIndex == 3,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 3);
              },
            ),
            ListTile(
              leading: const Icon(Icons.record_voice_over_rounded, color: Color(0xFF7C3AED)),
              title: const Text("Vatandaş Şikayetleri"),
              selected: _currentIndex == 4,
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 4);
              },
            ),

            const Divider(),

            // 2. Saha & Filo Yönetimi Grubu
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text("FİLO & SAHA YÖNETİMİ", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
            ),
            ListTile(
              leading: const Icon(Icons.schedule_rounded, color: AppTheme.primaryGreen),
              title: const Text("Şoför Mesai & Vardiya"),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const DriverShiftScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.local_shipping_rounded, color: Color(0xFF0284C7)),
              title: const Text("Araç Filosu"),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const FleetScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.build_rounded, color: AppTheme.accentRed),
              title: const Text("Araç Arızaları & Kademe"),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const VehicleFaultsScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.location_city_rounded, color: AppTheme.primaryGreen),
              title: const Text("Tepebaşı Mahalleleri"),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const NeighborhoodsScreen()));
              },
            ),

            if (user?.isManager ?? false) ...[
              const Divider(),
              // 3. Yönetim Paneli Grubu
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Text("SİSTEM YÖNETİMİ", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
              ),
              ListTile(
                leading: const Icon(Icons.people_alt_rounded, color: Color(0xFF7C3AED)),
                title: const Text("Personel Yönetimi"),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const UsersManagementScreen()));
                },
              ),
              ListTile(
                leading: const Icon(Icons.history_rounded, color: AppTheme.primaryGreen),
                title: const Text("Denetim Logları & Raporlar"),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const AuditLogsScreen()));
                },
              ),
            ],

            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: AppTheme.accentRed),
              title: const Text("Oturumu Kapat", style: TextStyle(color: AppTheme.accentRed, fontWeight: FontWeight.bold)),
              onTap: () async {
                await auth.logout();
                if (context.mounted) {
                  Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
                }
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _bottomTabs,
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
                    title: "Toplam Araç",
                    count: ops.vehiclesList.length.toString(),
                    icon: Icons.local_shipping_rounded,
                    color: const Color(0xFF0284C7),
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
