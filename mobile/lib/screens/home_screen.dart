import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import 'complaints_screen.dart';
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

  final List<Widget> _pages = [
    const _DashboardTab(),
    const MapScreen(),
    const ComplaintsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppTheme.primaryGreen),
            label: "Operasyon",
          ),
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map, color: AppTheme.primaryGreen),
            label: "Harita",
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_active_outlined),
            selectedIcon: Icon(Icons.notifications_active, color: AppTheme.primaryGreen),
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
        title: const Text("Tepebaşı Temizlik Saha"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: "Çıkış Yap",
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ops.fetchAllOperations(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Kullanıcı Hoşgeldin Kartı
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryGreenDark, AppTheme.primaryGreen],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppTheme.primaryGreen.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: Colors.white24,
                    child: Text(
                      user?.fullName.isNotEmpty == true ? user!.fullName[0].toUpperCase() : 'P',
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? "Saha Personeli",
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(6)),
                          child: Text(
                            user?.role.toUpperCase() ?? "ŞOFÖR",
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Özet Sayaçlar
            Row(
              children: [
                Expanded(
                  child: _SummaryBox(
                    label: "Damperlik Atık",
                    count: ops.bulkWasteList.length,
                    icon: Icons.inventory_2_rounded,
                    color: AppTheme.accentAmber,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryBox(
                    label: "Konteyner Arıza",
                    count: ops.containerFaultsList.length,
                    icon: Icons.delete_outline_rounded,
                    color: AppTheme.accentRed,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryBox(
                    label: "Vatandaş Şikayet",
                    count: ops.complaintsList.length,
                    icon: Icons.record_voice_over_rounded,
                    color: const Color(0xFF7C3AED),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            const Text("Hızlı Saha İşlemleri", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textMain)),
            const SizedBox(height: 12),

            // Hızlı Butonlar
            _ActionButtonCard(
              title: "Damperlik Atık Bildir",
              subtitle: "Yol kenarı, moloz veya bahçe atığı kaydı oluştur",
              icon: Icons.add_circle_outline_rounded,
              color: AppTheme.accentAmber,
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportWasteScreen()));
              },
            ),
            const SizedBox(height: 10),

            _ActionButtonCard(
              title: "Konteyner Arızası Bildir",
              subtitle: "Kırık kol, ayak, kapak veya gövde arızası kaydet",
              icon: Icons.report_problem_outlined,
              color: AppTheme.accentRed,
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportFaultScreen()));
              },
            ),
            const SizedBox(height: 10),

            _ActionButtonCard(
              title: "Vatandaş Şikayetleri & Çözüm",
              subtitle: "Bölgenizdeki açık şikayetleri çöz ve fotoğrafla",
              icon: Icons.assignment_outlined,
              color: const Color(0xFF7C3AED),
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ComplaintsScreen()));
              },
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SummaryBox extends StatelessWidget {
  final String label;
  final int count;
  final IconData icon;
  final Color color;

  const _SummaryBox({required this.label, required this.count, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        children: [
          Icon(icon, size: 22, color: color),
          const SizedBox(height: 6),
          Text(count.toString(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 2),
          Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _ActionButtonCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionButtonCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textMain)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppTheme.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
