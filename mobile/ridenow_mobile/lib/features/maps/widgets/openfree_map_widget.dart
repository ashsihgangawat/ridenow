import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../rider/models/nearby_driver_model.dart';
import 'ridenow_map_widget.dart';

export 'ridenow_map_widget.dart';

/// OpenFreeMapWidget adapter forwarding to the unified RideNowMapWidget
class OpenFreeMapWidget extends StatefulWidget {
  final LatLng? pickupPoint;
  final LatLng? destinationPoint;
  final LatLng? driverPoint;
  final LatLng? riderCurrentLocation;
  final List<NearbyDriverModel>? nearbyDrivers;
  final Function(NearbyDriverModel)? onDriverTap;
  final double driverHeading;
  final List<LatLng>? routePolyline;
  final Function(LatLng)? onMapTap;
  final MapController? mapController;
  final double controlsBottomPadding;
  final bool showControls;
  final bool isPickerMode;
  final String? pickerPromptText;
  final VoidCallback? onConfirmPickerLocation;

  const OpenFreeMapWidget({
    super.key,
    this.pickupPoint,
    this.destinationPoint,
    this.driverPoint,
    this.riderCurrentLocation,
    this.nearbyDrivers,
    this.onDriverTap,
    this.driverHeading = 0.0,
    this.routePolyline,
    this.onMapTap,
    this.mapController,
    this.controlsBottomPadding = 24.0,
    this.showControls = true,
    this.isPickerMode = false,
    this.pickerPromptText,
    this.onConfirmPickerLocation,
  });

  @override
  State<OpenFreeMapWidget> createState() => OpenFreeMapWidgetState();
}

class OpenFreeMapWidgetState extends State<OpenFreeMapWidget> {
  final GlobalKey<RideNowMapWidgetState> _innerKey =
      GlobalKey<RideNowMapWidgetState>();

  void recenter() => _innerKey.currentState?.recenter();
  void zoomIn() => _innerKey.currentState?.zoomIn();
  void zoomOut() => _innerKey.currentState?.zoomOut();
  void fitRoute() => _innerKey.currentState?.fitRoute();

  @override
  Widget build(BuildContext context) {
    return RideNowMapWidget(
      key: _innerKey,
      pickupPoint: widget.pickupPoint,
      destinationPoint: widget.destinationPoint,
      driverPoint: widget.driverPoint,
      riderCurrentLocation: widget.riderCurrentLocation,
      nearbyDrivers: widget.nearbyDrivers,
      onDriverTap: widget.onDriverTap,
      driverHeading: widget.driverHeading,
      routePolyline: widget.routePolyline,
      onMapTap: widget.onMapTap,
      mapController: widget.mapController,
      controlsBottomPadding: widget.controlsBottomPadding,
      showControls: widget.showControls,
      isPickerMode: widget.isPickerMode,
      pickerPromptText: widget.pickerPromptText,
      onConfirmPickerLocation: widget.onConfirmPickerLocation,
    );
  }
}
