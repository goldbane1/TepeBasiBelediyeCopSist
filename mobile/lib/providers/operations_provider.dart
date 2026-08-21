import 'package:flutter/material.dart';
import '../models/operations_models.dart';
import '../services/operations_service.dart';

class OperationsProvider with ChangeNotifier {
  final OperationsService _service = OperationsService();

  List<BulkWasteReport> _bulkWasteList = [];
  List<ContainerFault> _containerFaultsList = [];
  List<CitizenComplaint> _complaintsList = [];
  List<Vehicle> _vehiclesList = [];
  List<VehicleFault> _vehicleFaultsList = [];
  List<DriverShift> _shiftsList = [];
  List<ManagedUser> _usersList = [];
  List<AuditLog> _auditLogsList = [];
  DriverShift? _activeShift;

  bool _isLoading = false;
  String _selectedNeighborhood = "Tümü";
  String _selectedFilterType = "tümü";
  String _searchQuery = "";

  List<BulkWasteReport> get bulkWasteList => _bulkWasteList;
  List<ContainerFault> get containerFaultsList => _containerFaultsList;
  List<CitizenComplaint> get complaintsList => _complaintsList;
  List<Vehicle> get vehiclesList => _vehiclesList;
  List<VehicleFault> get vehicleFaultsList => _vehicleFaultsList;
  List<DriverShift> get shiftsList => _shiftsList;
  List<ManagedUser> get usersList => _usersList;
  List<AuditLog> get auditLogsList => _auditLogsList;
  DriverShift? get activeShift => _activeShift;
  bool get isLoading => _isLoading;
  String get selectedNeighborhood => _selectedNeighborhood;
  String get selectedFilterType => _selectedFilterType;
  String get searchQuery => _searchQuery;

  // Filtreli Damperlik Atık
  List<BulkWasteReport> get filteredBulkWaste {
    var list = _bulkWasteList.where((item) => item.isPending).toList();
    if (_selectedNeighborhood != "Tümü") {
      list = list.where((item) => item.neighborhood == _selectedNeighborhood).toList();
    }
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((item) =>
          item.description.toLowerCase().contains(q) ||
          item.neighborhood.toLowerCase().contains(q) ||
          item.wasteType.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  // Filtreli Konteyner Arızaları
  List<ContainerFault> get filteredContainerFaults {
    var list = _containerFaultsList.where((item) => item.isPending).toList();
    if (_selectedNeighborhood != "Tümü") {
      list = list.where((item) => item.neighborhood == _selectedNeighborhood).toList();
    }
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((item) =>
          item.description.toLowerCase().contains(q) ||
          item.neighborhood.toLowerCase().contains(q) ||
          item.faultType.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  // Filtreli Vatandaş Şikayetleri
  List<CitizenComplaint> get filteredComplaints {
    var list = _complaintsList.where((item) => item.isOpen || item.isPendingApproval).toList();
    if (_selectedNeighborhood != "Tümü") {
      list = list.where((item) => item.neighborhood == _selectedNeighborhood).toList();
    }
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((item) =>
          item.description.toLowerCase().contains(q) ||
          item.neighborhood.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  void setNeighborhoodFilter(String neighborhood) {
    _selectedNeighborhood = neighborhood;
    notifyListeners();
  }

  void setFilterType(String type) {
    _selectedFilterType = type;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  // Tüm Verileri Senkronize Çek
  Future<void> fetchAllOperations() async {
    _isLoading = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.getBulkWasteReports(),
        _service.getContainerFaults(),
        _service.getCitizenComplaints(),
        _service.getActiveShift(),
        _service.getVehicles(),
        _service.getVehicleFaults(),
        _service.getShiftsList(),
      ]);

      _bulkWasteList = results[0] as List<BulkWasteReport>;
      _containerFaultsList = results[1] as List<ContainerFault>;
      _complaintsList = results[2] as List<CitizenComplaint>;
      _activeShift = results[3] as DriverShift?;
      _vehiclesList = results[4] as List<Vehicle>;
      _vehicleFaultsList = results[5] as List<VehicleFault>;
      _shiftsList = results[6] as List<DriverShift>;
    } catch (_) {
      // ignore
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Yönetim Özel Verileri
  Future<void> fetchManagementData() async {
    try {
      final results = await Future.wait([
        _service.getUsersList(),
        _service.getAuditLogs(),
      ]);
      _usersList = results[0] as List<ManagedUser>;
      _auditLogsList = results[1] as List<AuditLog>;
      notifyListeners();
    } catch (_) {}
  }

  // Damperlik Atık Bildir
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
    final ok = await _service.reportBulkWaste(
      region: region,
      neighborhood: neighborhood,
      wasteType: wasteType,
      description: description,
      latitude: latitude,
      longitude: longitude,
      requiresExcavator: requiresExcavator,
      photoBase64: photoBase64,
    );
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Konteyner Arızası Bildir
  Future<bool> reportContainerFault({
    required String region,
    required String neighborhood,
    required String faultType,
    required String description,
    required double latitude,
    required double longitude,
    String? photoBase64,
  }) async {
    final ok = await _service.reportContainerFault(
      region: region,
      neighborhood: neighborhood,
      faultType: faultType,
      description: description,
      latitude: latitude,
      longitude: longitude,
      photoBase64: photoBase64,
    );
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Damper Atığı Topla
  Future<bool> collectBulkWaste(int id) async {
    final ok = await _service.collectBulkWaste(id, vehicleId: _activeShift?.vehicleId);
    if (ok) {
      _bulkWasteList.removeWhere((item) => item.id == id);
      notifyListeners();
    }
    return ok;
  }

  // Konteyner Arızası Onar
  Future<bool> repairContainerFault(int id, {String? note, String? photoBase64}) async {
    final ok = await _service.repairContainerFault(id, repairNote: note, repairPhotoBase64: photoBase64);
    if (ok) {
      _containerFaultsList.removeWhere((item) => item.id == id);
      notifyListeners();
    }
    return ok;
  }

  // Vatandaş Şikayeti Çöz (Şoför)
  Future<bool> resolveComplaint(int id, {required String photoBase64}) async {
    final ok = await _service.resolveComplaint(id, resolutionPhotoBase64: photoBase64);
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Şikayeti Onayla (Yönetim)
  Future<bool> approveComplaint(int id) async {
    final ok = await _service.approveComplaint(id);
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Şikayeti Reddet (Yönetim)
  Future<bool> rejectComplaint(int id) async {
    final ok = await _service.rejectComplaint(id);
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Vardiya Başlat
  Future<bool> startShift({
    required int vehicleId,
    required String region,
    required String neighborhood,
    required String shiftHours,
  }) async {
    final ok = await _service.startShift(
      vehicleId: vehicleId,
      region: region,
      neighborhood: neighborhood,
      shiftHours: shiftHours,
    );
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Vardiya Bitir
  Future<bool> endShift(int shiftId) async {
    final ok = await _service.endShift(shiftId);
    if (ok) {
      _activeShift = null;
      await fetchAllOperations();
    }
    return ok;
  }

  // Yeni Araç Ekle
  Future<bool> createVehicle({
    required String type,
    required String capacityTon,
    required String brand,
    required String plate,
    required String status,
    int? nextOilMaintenanceKm,
  }) async {
    final ok = await _service.createVehicle(
      type: type,
      capacityTon: capacityTon,
      brand: brand,
      plate: plate,
      status: status,
      nextOilMaintenanceKm: nextOilMaintenanceKm,
    );
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Araç Durumu Güncelle
  Future<bool> updateVehicleStatus(int id, String status) async {
    final ok = await _service.updateVehicleStatus(id, status);
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Araç Arıza Bildir
  Future<bool> reportVehicleFault({
    required int vehicleId,
    required String faultType,
    required String description,
  }) async {
    final ok = await _service.reportVehicleFault(
      vehicleId: vehicleId,
      faultType: faultType,
      description: description,
    );
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Araç Arızası Onar
  Future<bool> repairVehicleFault(int id, {required String repairNote}) async {
    final ok = await _service.repairVehicleFault(id, repairNote: repairNote);
    if (ok) await fetchAllOperations();
    return ok;
  }

  // Personel Ekle (Yönetim)
  Future<bool> createUser({
    required String name,
    required String username,
    required String password,
    required String role,
  }) async {
    final ok = await _service.createUser(name: name, username: username, password: password, role: role);
    if (ok) await fetchManagementData();
    return ok;
  }

  // Personel Sil (Yönetim)
  Future<bool> deleteUser(int id) async {
    final ok = await _service.deleteUser(id);
    if (ok) await fetchManagementData();
    return ok;
  }
}
