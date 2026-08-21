import 'package:flutter/material.dart';
import '../models/operations_models.dart';
import '../services/operations_service.dart';

class OperationsProvider with ChangeNotifier {
  final OperationsService _service = OperationsService();

  List<BulkWasteReport> _bulkWasteList = [];
  List<ContainerFault> _containerFaultsList = [];
  List<CitizenComplaint> _complaintsList = [];
  DriverShift? _activeShift;

  bool _isLoading = false;
  String _selectedNeighborhood = "Tümü";
  String _selectedFilterType = "tümü"; // "tümü", "damper", "arıza", "şikayet"

  List<BulkWasteReport> get bulkWasteList => _bulkWasteList;
  List<ContainerFault> get containerFaultsList => _containerFaultsList;
  List<CitizenComplaint> get complaintsList => _complaintsList;
  DriverShift? get activeShift => _activeShift;
  bool get isLoading => _isLoading;
  String get selectedNeighborhood => _selectedNeighborhood;
  String get selectedFilterType => _selectedFilterType;

  // Filtrelenmiş Liste Getiricileri
  List<BulkWasteReport> get filteredBulkWaste {
    var list = _bulkWasteList.where((item) => item.isPending).toList();
    if (_selectedNeighborhood != "Tümü") {
      list = list.where((item) => item.neighborhood == _selectedNeighborhood).toList();
    }
    return list;
  }

  List<ContainerFault> get filteredContainerFaults {
    var list = _containerFaultsList.where((item) => item.isPending).toList();
    if (_selectedNeighborhood != "Tümü") {
      list = list.where((item) => item.neighborhood == _selectedNeighborhood).toList();
    }
    return list;
  }

  List<CitizenComplaint> get filteredComplaints {
    var list = _complaintsList.where((item) => item.isOpen || item.isPendingApproval).toList();
    if (_selectedNeighborhood != "Tümü") {
      list = list.where((item) => item.neighborhood == _selectedNeighborhood).toList();
    }
    return list;
  }

  int get totalActivePoints =>
      filteredBulkWaste.length + filteredContainerFaults.length + filteredComplaints.length;

  void setNeighborhoodFilter(String neighborhood) {
    _selectedNeighborhood = neighborhood;
    notifyListeners();
  }

  void setFilterType(String type) {
    _selectedFilterType = type;
    notifyListeners();
  }

  Future<void> fetchAllOperations() async {
    _isLoading = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.getBulkWasteReports(),
        _service.getContainerFaults(),
        _service.getCitizenComplaints(),
        _service.getActiveShift(),
      ]);

      _bulkWasteList = results[0] as List<BulkWasteReport>;
      _containerFaultsList = results[1] as List<ContainerFault>;
      _complaintsList = results[2] as List<CitizenComplaint>;
      _activeShift = results[3] as DriverShift?;
    } catch (e) {
      print("[Operations Provider] Fetch error: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Yeni Damperlik Atık Bildir
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
    if (ok) {
      await fetchAllOperations();
    }
    return ok;
  }

  // Yeni Konteyner Arızası Bildir
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
    if (ok) {
      await fetchAllOperations();
    }
    return ok;
  }

  // Damper Atığı Topla
  Future<bool> collectBulkWaste(int id) async {
    try {
      final ok = await _service.collectBulkWaste(id, vehicleId: _activeShift?.vehicleId);
      if (ok) {
        _bulkWasteList.removeWhere((item) => item.id == id);
        notifyListeners();
      }
      return ok;
    } catch (e) {
      return false;
    }
  }


  // Konteyner Arızası Onar
  Future<bool> repairContainerFault(int id, {String? note, String? photoBase64}) async {
    try {
      final ok = await _service.repairContainerFault(id, repairNote: note, repairPhotoBase64: photoBase64);
      if (ok) {
        _containerFaultsList.removeWhere((item) => item.id == id);
        notifyListeners();
      }
      return ok;
    } catch (e) {
      return false;
    }
  }

  // Vatandaş Şikayeti Çöz
  Future<bool> resolveComplaint(int id, {required String photoBase64}) async {
    try {
      final ok = await _service.resolveComplaint(id, resolutionPhotoBase64: photoBase64);
      if (ok) {
        final idx = _complaintsList.indexWhere((c) => c.id == id);
        if (idx != -1) {
          _complaintsList.removeAt(idx);
          notifyListeners();
        }
      }
      return ok;
    } catch (e) {
      return false;
    }
  }
}
