class UserSession {
  final int id;
  final String username;
  final String fullName;
  final String role; // "şoför", "kaynak personeli", "kademe personeli", "yönetim"
  final String? region;
  final String? shift;

  UserSession({
    required this.id,
    required this.username,
    required this.fullName,
    required this.role,
    this.region,
    this.shift,
  });

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      username: json['username'] ?? '',
      fullName: json['fullName'] ?? json['name'] ?? json['username'] ?? '',
      role: json['role'] ?? 'şoför',
      region: json['region'],
      shift: json['shift'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'fullName': fullName,
      'role': role,
      'region': region,
      'shift': shift,
    };
  }

  String get name => fullName;
  bool get isDriver => role == "şoför";
  bool get isWelder => role == "kaynak personeli";
  bool get isMechanic => role == "kademe personeli";
  bool get isManager => role == "yönetim";

  String get roleFormatted {
    switch (role) {
      case "şoför":
        return "Çöp / Damper Şoförü";
      case "kaynak personeli":
        return "Kaynak & Konteyner Personeli";
      case "kademe personeli":
        return "Kademe & Bakım Personeli";
      case "yönetim":
        return "Sistem Yöneticisi";
      default:
        return role;
    }
  }
}
