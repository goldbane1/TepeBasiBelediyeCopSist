import '../core/api_client.dart';
import '../models/operations_models.dart';

class OperationsService {
  final ApiClient _api = ApiClient();

  // 1. Damperlik Atıkları Getir
  Future<List<BulkWasteReport>> getBulkWasteReports() async {
    try {
      final res = await _api.trpcQuery('operations.bulkWaste.list');
      final list = res is List ? res : [];
      return list.map((item) => BulkWasteReport.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  // 2. Konteyner Arızalarını Getir
  Future<List<ContainerFault>> getContainerFaults() async {
    try {
      final res = await _api.trpcQuery('operations.containerFaults.list');
      final list = res is List ? res : [];
      return list.map((item) => ContainerFault.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  // 3. Vatandaş Şikayetlerini Getir
  Future<List<CitizenComplaint>> getCitizenComplaints() async {
    try {
      final res = await _api.trpcQuery('operations.complaints.list');
      final list = res is List ? res : [];
      return list.map((item) => CitizenComplaint.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  // 4. Şoförün Aktif Mesaisini Getir
  Future<DriverShift?> getActiveShift() async {
    try {
      final res = await _api.trpcQuery('operations.shifts.current');
      if (res != null) {
        return DriverShift.fromJson(res);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // 5. Vardiya Başlat
  Future<bool> startShift({
    required int vehicleId,
    required String region,
    required String neighborhood,
    required String shiftHours,
  }) async {
    try {
      final res = await _api.trpcMutate('operations.shifts.start', {
        'vehicleId': vehicleId,
        'region': region,
        'neighborhood': neighborhood,
        'shiftHours': shiftHours,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 6. Vardiya Bitir
  Future<bool> endShift(int shiftId) async {
    try {
      final res = await _api.trpcMutate('operations.shifts.end', {
        'shiftId': shiftId,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 7. Vardiya Geçmişi
  Future<List<DriverShift>> getShiftsList() async {
    try {
      final res = await _api.trpcQuery('operations.shifts.list');
      final list = res is List ? res : [];
      return list.map((item) => DriverShift.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  // 8. Araç Filosunu Getir
  Future<List<Vehicle>> getVehicles() async {
    try {
      final res = await _api.trpcQuery('operations.vehicles.list');
      final list = res is List ? res : [];
      return list.map((item) => Vehicle.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  // 9. Yeni Araç Ekle
  Future<bool> createVehicle({
    required String type,
    required String capacityTon,
    required String brand,
    required String plate,
    required String status,
    int? nextOilMaintenanceKm,
  }) async {
    try {
      final res = await _api.trpcMutate('operations.vehicles.create', {
        'type': type,
        'capacityTon': capacityTon,
        'brand': brand,
        'plate': plate,
        'status': status,
        'nextOilMaintenanceKm': nextOilMaintenanceKm,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 10. Araç Durumu Güncelle (Aktif/Bakımda/Arızalı)
  Future<bool> updateVehicleStatus(int id, String status) async {
    try {
      final res = await _api.trpcMutate('operations.vehicles.updateStatus', {
        'id': id,
        'status': status,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 11. Araç Arızalarını Getir
  Future<List<VehicleFault>> getVehicleFaults() async {
    try {
      final res = await _api.trpcQuery('operations.vehicleFaults.list');
      final list = res is List ? res : [];
      return list.map((item) => VehicleFault.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  // 12. Araç Arıza Bildir
  Future<bool> reportVehicleFault({
    required int vehicleId,
    required String faultType,
    required String description,
  }) async {
    try {
      final res = await _api.trpcMutate('operations.vehicleFaults.report', {
        'vehicleId': vehicleId,
        'faultType': faultType,
        'description': description,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 13. Araç Arızası Onar
  Future<bool> repairVehicleFault(int id, {required String repairNote}) async {
    try {
      final res = await _api.trpcMutate('operations.vehicleFaults.repair', {
        'id': id,
        'repairNote': repairNote,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 14. Yeni Damperlik Atık Bildir
  Future<bool> reportBulkWaste({
    required String region,
    required String neighborhood,
    required String wasteType,
    required String description,
    required double latitude,
    required double longitude,
    required bool requiresExcavator,
    String? photoBase64,
  }) async {
    try {
      final res = await _api.trpcMutate('operations.bulkWaste.report', {
        'region': region,
        'neighborhood': neighborhood,
        'wasteType': wasteType,
        'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'requiresExcavator': requiresExcavator,
        'photo': photoBase64,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 15. Damperlik Atık Topla
  Future<bool> collectBulkWaste(int id, {int? vehicleId}) async {
    try {
      final res = await _api.trpcMutate('operations.bulkWaste.collect', {
        'id': id,
        'vehicleId': vehicleId,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 16. Yeni Konteyner Arızası Bildir
  Future<bool> reportContainerFault({
    required String region,
    required String neighborhood,
    required String faultType,
    required String description,
    required double latitude,
    required double longitude,
    String? photoBase64,
  }) async {
    try {
      final res = await _api.trpcMutate('operations.containerFaults.report', {
        'region': region,
        'neighborhood': neighborhood,
        'faultType': faultType,
        'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'photo': photoBase64,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 17. Konteyner Arızası Onar
  Future<bool> repairContainerFault(int id, {String? repairNote, String? repairPhotoBase64}) async {
    try {
      final res = await _api.trpcMutate('operations.containerFaults.repair', {
        'id': id,
        'repairNote': repairNote,
        'repairPhoto': repairPhotoBase64,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 18. Vatandaş Şikayetini Çözüm Fotoğrafı İle Onaya Gönder
  Future<bool> resolveComplaint(int id, {required String resolutionPhotoBase64}) async {
    try {
      final res = await _api.trpcMutate('operations.complaints.resolve', {
        'id': id,
        'resolutionPhoto': resolutionPhotoBase64,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 19. Şikayet Çözümünü Onayla (Yönetim)
  Future<bool> approveComplaint(int id) async {
    try {
      final res = await _api.trpcMutate('operations.complaints.approve', {'id': id});
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 20. Şikayet Çözümünü Reddet (Yönetim)
  Future<bool> rejectComplaint(int id) async {
    try {
      final res = await _api.trpcMutate('operations.complaints.reject', {'id': id});
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 21. Personel Listesini Getir (Yönetim)
  Future<List<ManagedUser>> getUsersList() async {
    try {
      final res = await _api.trpcQuery('operations.users.list');
      final list = res is List ? res : [];
      return list.map((item) => ManagedUser.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }

  // 22. Yeni Personel Oluştur (Yönetim)
  Future<bool> createUser({
    required String name,
    required String username,
    required String password,
    required String role,
  }) async {
    try {
      final res = await _api.trpcMutate('operations.users.create', {
        'name': name,
        'username': username,
        'password': password,
        'role': role,
      });
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 23. Personel Sil (Yönetim)
  Future<bool> deleteUser(int id) async {
    try {
      final res = await _api.trpcMutate('operations.users.delete', {'id': id});
      return res != null;
    } catch (e) {
      rethrow;
    }
  }

  // 24. Denetim Günlüklerini Getir (Yönetim)
  Future<List<AuditLog>> getAuditLogs() async {
    try {
      final res = await _api.trpcQuery('operations.reports.auditLogs');
      final list = res is List ? res : [];
      return list.map((item) => AuditLog.fromJson(item)).toList();
    } catch (e) {
      return [];
    }
  }
}
