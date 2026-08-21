class BulkWasteReport {
  final int id;
  final int reportedBy;
  final String region;
  final String neighborhood;
  final String wasteType;
  final String description;
  final double latitude;
  final double longitude;
  final String status;
  final bool requiresExcavator;
  final String? photoUrl;
  final DateTime? createdAt;
  final DateTime? dueAt;

  BulkWasteReport({
    required this.id,
    required this.reportedBy,
    required this.region,
    required this.neighborhood,
    required this.wasteType,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.status,
    required this.requiresExcavator,
    this.photoUrl,
    this.createdAt,
    this.dueAt,
  });

  factory BulkWasteReport.fromJson(Map<String, dynamic> json) {
    return BulkWasteReport(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      reportedBy: json['reportedBy'] is int ? json['reportedBy'] : int.tryParse(json['reportedBy']?.toString() ?? '0') ?? 0,
      region: json['region'] ?? 'Tepebaşı',
      neighborhood: json['neighborhood'] ?? '',
      wasteType: json['wasteType'] ?? '',
      description: json['description'] ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
      status: json['status'] ?? 'bekliyor',
      requiresExcavator: json['requiresExcavator'] == true || json['requiresExcavator'] == 1,
      photoUrl: json['photoUrl'] ?? json['photo'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      dueAt: json['dueAt'] != null ? DateTime.tryParse(json['dueAt'].toString()) : null,
    );
  }

  bool get isPending => status == "bekliyor";
}

class ContainerFault {
  final int id;
  final int reportedBy;
  final String region;
  final String neighborhood;
  final String faultType;
  final String description;
  final double latitude;
  final double longitude;
  final String status;
  final String? photoUrl;
  final DateTime? createdAt;

  ContainerFault({
    required this.id,
    required this.reportedBy,
    required this.region,
    required this.neighborhood,
    required this.faultType,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.status,
    this.photoUrl,
    this.createdAt,
  });

  factory ContainerFault.fromJson(Map<String, dynamic> json) {
    return ContainerFault(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      reportedBy: json['reportedBy'] is int ? json['reportedBy'] : int.tryParse(json['reportedBy']?.toString() ?? '0') ?? 0,
      region: json['region'] ?? 'Tepebaşı',
      neighborhood: json['neighborhood'] ?? '',
      faultType: json['faultType'] ?? '',
      description: json['description'] ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
      status: json['status'] ?? 'bekliyor',
      photoUrl: json['photoUrl'] ?? json['photo'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  bool get isPending => status == "bekliyor";
}

class CitizenComplaint {
  final int id;
  final int reportedBy;
  final String region;
  final String neighborhood;
  final String description;
  final double latitude;
  final double longitude;
  final String status;
  final String? resolutionPhotoUrl;
  final DateTime? dueAt;
  final DateTime? createdAt;

  CitizenComplaint({
    required this.id,
    required this.reportedBy,
    required this.region,
    required this.neighborhood,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.status,
    this.resolutionPhotoUrl,
    this.dueAt,
    this.createdAt,
  });

  factory CitizenComplaint.fromJson(Map<String, dynamic> json) {
    return CitizenComplaint(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      reportedBy: json['reportedBy'] is int ? json['reportedBy'] : int.tryParse(json['reportedBy']?.toString() ?? '0') ?? 0,
      region: json['region'] ?? 'Tepebaşı',
      neighborhood: json['neighborhood'] ?? '',
      description: json['description'] ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
      status: json['status'] ?? 'açık',
      resolutionPhotoUrl: json['resolutionPhotoUrl'],
      dueAt: json['dueAt'] != null ? DateTime.tryParse(json['dueAt'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  bool get isOpen => status == "açık";
  bool get isPendingApproval => status == "onay_bekliyor";
  bool get isResolved => status == "çözüldü";
}

class DriverShift {
  final int id;
  final int userId;
  final int vehicleId;
  final String region;
  final String neighborhood;
  final String shiftHours;
  final String status;
  final String? vehicleType;
  final String? vehiclePlate;
  final DateTime? startTime;
  final DateTime? endTime;

  DriverShift({
    required this.id,
    required this.userId,
    required this.vehicleId,
    required this.region,
    required this.neighborhood,
    required this.shiftHours,
    required this.status,
    this.vehicleType,
    this.vehiclePlate,
    this.startTime,
    this.endTime,
  });

  factory DriverShift.fromJson(Map<String, dynamic> json) {
    return DriverShift(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['userId'] is int ? json['userId'] : int.tryParse(json['userId'].toString()) ?? 0,
      vehicleId: json['vehicleId'] is int ? json['vehicleId'] : int.tryParse(json['vehicleId'].toString()) ?? 0,
      region: json['region'] ?? 'Tepebaşı',
      neighborhood: json['neighborhood'] ?? '',
      shiftHours: json['shiftHours'] ?? '08:00 - 16:00',
      status: json['status'] ?? 'aktif',
      vehicleType: json['vehicleType'],
      vehiclePlate: json['vehiclePlate'],
      startTime: json['startTime'] != null ? DateTime.tryParse(json['startTime'].toString()) : null,
      endTime: json['endTime'] != null ? DateTime.tryParse(json['endTime'].toString()) : null,
    );
  }

  bool get isDamperTruck => vehicleType == "damperli kamyon";
  bool get isActive => status == "aktif";
}

class Vehicle {
  final int id;
  final String type; // "çöp kamyonu", "damperli kamyon"
  final String capacityTon;
  final String brand;
  final String plate;
  final String status; // "aktif", "arızalı", "bakımda"
  final int? nextOilMaintenanceKm;

  Vehicle({
    required this.id,
    required this.type,
    required this.capacityTon,
    required this.brand,
    required this.plate,
    required this.status,
    this.nextOilMaintenanceKm,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      type: json['type'] ?? 'çöp kamyonu',
      capacityTon: json['capacityTon']?.toString() ?? '',
      brand: json['brand'] ?? '',
      plate: json['plate'] ?? '',
      status: json['status'] ?? 'aktif',
      nextOilMaintenanceKm: json['nextOilMaintenanceKm'] != null ? int.tryParse(json['nextOilMaintenanceKm'].toString()) : null,
    );
  }

  bool get isDamper => type == "damperli kamyon";
  bool get isActive => status == "aktif";
}

class VehicleFault {
  final int id;
  final int vehicleId;
  final int reportedBy;
  final String faultType; // motor, hidrolik, fren, lastik, elektrik, periyodik, diğer
  final String description;
  final String status; // bekliyor, inceleniyor, onarıldı, parça_bekliyor
  final String? repairNote;
  final String? vehiclePlate;
  final String? vehicleBrand;
  final DateTime? createdAt;

  VehicleFault({
    required this.id,
    required this.vehicleId,
    required this.reportedBy,
    required this.faultType,
    required this.description,
    required this.status,
    this.repairNote,
    this.vehiclePlate,
    this.vehicleBrand,
    this.createdAt,
  });

  factory VehicleFault.fromJson(Map<String, dynamic> json) {
    return VehicleFault(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      vehicleId: json['vehicleId'] is int ? json['vehicleId'] : int.tryParse(json['vehicleId'].toString()) ?? 0,
      reportedBy: json['reportedBy'] is int ? json['reportedBy'] : int.tryParse(json['reportedBy'].toString()) ?? 0,
      faultType: json['faultType'] ?? 'motor',
      description: json['description'] ?? '',
      status: json['status'] ?? 'bekliyor',
      repairNote: json['repairNote'],
      vehiclePlate: json['vehiclePlate'],
      vehicleBrand: json['vehicleBrand'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  bool get isPending => status == "bekliyor" || status == "inceleniyor" || status == "parça_bekliyor";
}

class ManagedUser {
  final int id;
  final String openId;
  final String name;
  final String username;
  final String role; // "şoför", "kaynak personeli", "kademe personeli", "yönetim"
  final bool isLocalAccount;
  final DateTime? lastSignedIn;

  ManagedUser({
    required this.id,
    required this.openId,
    required this.name,
    required this.username,
    required this.role,
    required this.isLocalAccount,
    this.lastSignedIn,
  });

  factory ManagedUser.fromJson(Map<String, dynamic> json) {
    return ManagedUser(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      openId: json['openId'] ?? '',
      name: json['name'] ?? json['username'] ?? '',
      username: json['username'] ?? '',
      role: json['role'] ?? 'şoför',
      isLocalAccount: json['isLocalAccount'] == true || json['isLocalAccount'] == 1,
      lastSignedIn: json['lastSignedIn'] != null ? DateTime.tryParse(json['lastSignedIn'].toString()) : null,
    );
  }
}

class AuditLog {
  final int id;
  final int? userId;
  final String action;
  final String? details;
  final DateTime? createdAt;
  final String? userName;

  AuditLog({
    required this.id,
    this.userId,
    required this.action,
    this.details,
    this.createdAt,
    this.userName,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) {
    return AuditLog(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      userId: json['userId'] != null ? int.tryParse(json['userId'].toString()) : null,
      action: json['action'] ?? '',
      details: json['details']?.toString(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      userName: json['userName'],
    );
  }
}
