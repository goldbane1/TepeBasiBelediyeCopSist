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
      final res = await _api.trpcQuery('operations.driverShifts.active');
      if (res != null && res['shift'] != null) {
        return DriverShift.fromJson(res['shift']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // 5. Yeni Damperlik Atık Bildir
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

  // 6. Yeni Konteyner Arızası Bildir
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

  // 7. Damperlik Atık Topla (Sadece Damperli Mesaisi Olan Şoför veya Yönetim)
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

  // 8. Konteyner Arızası Onar (Sadece Kaynak Personeli veya Yönetim)
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

  // 9. Vatandaş Şikayetini Çözüm Fotoğrafı İle Onaya Gönder (Şoför)
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
}
