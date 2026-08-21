class BulkWasteReport {
  final int id;
  final int reportedBy;
  final String region;
  final String neighborhood;
  final String wasteType;
  final String description;
  final double latitude;
  final double longitude;
  final bool requiresExcavator;
  final String? photoUrl;
  final String status; // "bekliyor", "toplandı"
  final DateTime? dueAt;
  final DateTime createdAt;

  BulkWasteReport({
    required this.id,
    required this.reportedBy,
    required this.region,
    required this.neighborhood,
    required this.wasteType,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.requiresExcavator,
    this.photoUrl,
    required this.status,
    this.dueAt,
    required this.createdAt,
  });

  factory BulkWasteReport.fromJson(Map<String, dynamic> json) {
    return BulkWasteReport(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      reportedBy: json['reportedBy'] is int ? json['reportedBy'] : int.parse(json['reportedBy'].toString()),
      region: json['region'] ?? '',
      neighborhood: json['neighborhood'] ?? '',
      wasteType: json['wasteType'] ?? '',
      description: json['description'] ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
      requiresExcavator: json['requiresExcavator'] == 1 || json['requiresExcavator'] == true,
      photoUrl: json['photoUrl'],
      status: json['status'] ?? 'bekliyor',
      dueAt: json['dueAt'] != null ? DateTime.tryParse(json['dueAt'].toString()) : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isPending => status == 'bekliyor';
  bool get isCollected => status == 'toplandı';
}

class ContainerFault {
  final int id;
  final int reportedBy;
  final String region;
  final String neighborhood;
  final String faultType; // "kol", "ayak", "gövde", "kapak", "diğer"
  final String description;
  final double latitude;
  final double longitude;
  final String? photoUrl;
  final String? repairPhotoUrl;
  final String status; // "bekliyor", "onarım_tamamlandı"
  final String? repairNote;
  final DateTime createdAt;
  final DateTime? repairedAt;

  ContainerFault({
    required this.id,
    required this.reportedBy,
    required this.region,
    required this.neighborhood,
    required this.faultType,
    required this.description,
    required this.latitude,
    required this.longitude,
    this.photoUrl,
    this.repairPhotoUrl,
    required this.status,
    this.repairNote,
    required this.createdAt,
    this.repairedAt,
  });

  factory ContainerFault.fromJson(Map<String, dynamic> json) {
    return ContainerFault(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      reportedBy: json['reportedBy'] is int ? json['reportedBy'] : int.parse(json['reportedBy'].toString()),
      region: json['region'] ?? '',
      neighborhood: json['neighborhood'] ?? '',
      faultType: json['faultType'] ?? 'diğer',
      description: json['description'] ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
      photoUrl: json['photoUrl'],
      repairPhotoUrl: json['repairPhotoUrl'],
      status: json['status'] ?? 'bekliyor',
      repairNote: json['repairNote'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      repairedAt: json['repairedAt'] != null ? DateTime.tryParse(json['repairedAt'].toString()) : null,
    );
  }

  bool get isPending => status == 'bekliyor';
  bool get isRepaired => status == 'onarım_tamamlandı';
}

class CitizenComplaint {
  final int id;
  final int reportedBy;
  final String region;
  final String neighborhood;
  final String description;
  final double latitude;
  final double longitude;
  final String? photoUrl;
  final String? resolutionPhotoUrl;
  final String status; // "açık", "onay_bekliyor", "onaylandı"
  final DateTime? dueAt;
  final DateTime createdAt;
  final DateTime? resolvedAt;

  CitizenComplaint({
    required this.id,
    required this.reportedBy,
    required this.region,
    required this.neighborhood,
    required this.description,
    required this.latitude,
    required this.longitude,
    this.photoUrl,
    this.resolutionPhotoUrl,
    required this.status,
    this.dueAt,
    required this.createdAt,
    this.resolvedAt,
  });

  factory CitizenComplaint.fromJson(Map<String, dynamic> json) {
    return CitizenComplaint(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      reportedBy: json['reportedBy'] is int ? json['reportedBy'] : int.parse(json['reportedBy'].toString()),
      region: json['region'] ?? '',
      neighborhood: json['neighborhood'] ?? '',
      description: json['description'] ?? '',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
      photoUrl: json['photoUrl'],
      resolutionPhotoUrl: json['resolutionPhotoUrl'],
      status: json['status'] ?? 'açık',
      dueAt: json['dueAt'] != null ? DateTime.tryParse(json['dueAt'].toString()) : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      resolvedAt: json['resolvedAt'] != null ? DateTime.tryParse(json['resolvedAt'].toString()) : null,
    );
  }

  bool get isOpen => status == 'açık';
  bool get isPendingApproval => status == 'onay_bekliyor';
  bool get isResolved => status == 'onaylandı';
}

class DriverShift {
  final int id;
  final int driverId;
  final int vehicleId;
  final String vehiclePlate;
  final String vehicleType; // "çöp kamyonu", "damperli kamyon", "kepçe", "yol süpürme"
  final String shift; // "gündüz", "gece"
  final String region;
  final String neighborhood;
  final DateTime startedAt;
  final DateTime? endedAt;
  final String status; // "aktif", "tamamlandı"

  DriverShift({
    required this.id,
    required this.driverId,
    required this.vehicleId,
    required this.vehiclePlate,
    required this.vehicleType,
    required this.shift,
    required this.region,
    required this.neighborhood,
    required this.startedAt,
    this.endedAt,
    required this.status,
  });

  factory DriverShift.fromJson(Map<String, dynamic> json) {
    return DriverShift(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      driverId: json['driverId'] is int ? json['driverId'] : int.parse(json['driverId'].toString()),
      vehicleId: json['vehicleId'] is int ? json['vehicleId'] : int.parse(json['vehicleId'].toString()),
      vehiclePlate: json['vehiclePlate'] ?? json['plateNumber'] ?? '26 TP 001',
      vehicleType: json['vehicleType'] ?? 'çöp kamyonu',
      shift: json['shift'] ?? 'gündüz',
      region: json['region'] ?? '',
      neighborhood: json['neighborhood'] ?? '',
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endedAt: json['endedAt'] != null ? DateTime.tryParse(json['endedAt'].toString()) : null,
      status: json['status'] ?? 'aktif',
    );
  }

  bool get isActive => status == 'aktif';
  bool get isDamperTruck => vehicleType.toLowerCase().contains('damper');
}
