import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../app/config/environment.dart';
import '../../rider/models/nearby_driver_model.dart';

/// Reusable premium interactive map widget for RideNow Rider & Driver apps
/// Inspired by Uber and Ola modern ride-hailing interfaces
class RideNowMapWidget extends StatefulWidget {
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

  const RideNowMapWidget({
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
  State<RideNowMapWidget> createState() => RideNowMapWidgetState();
}

class RideNowMapWidgetState extends State<RideNowMapWidget>
    with SingleTickerProviderStateMixin {
  late final MapController _controller;
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _controller = widget.mapController ?? MapController();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.9, end: 1.25).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.routePolyline != null && widget.routePolyline!.isNotEmpty) {
        fitRoute();
      }
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(RideNowMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.routePolyline != null &&
        widget.routePolyline != oldWidget.routePolyline &&
        widget.routePolyline!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => fitRoute());
    }
  }

  void recenter() {
    final center = widget.riderCurrentLocation ??
        widget.driverPoint ??
        widget.pickupPoint ??
        const LatLng(
          EnvironmentConfig.defaultLatitude,
          EnvironmentConfig.defaultLongitude,
        );
    _controller.move(center, 15.5);
  }

  void zoomIn() {
    final curZoom = _controller.camera.zoom;
    _controller.move(_controller.camera.center, (curZoom + 1).clamp(3.0, 19.0));
  }

  void zoomOut() {
    final curZoom = _controller.camera.zoom;
    _controller.move(_controller.camera.center, (curZoom - 1).clamp(3.0, 19.0));
  }

  void fitRoute() {
    final points = <LatLng>[];
    if (widget.riderCurrentLocation != null) points.add(widget.riderCurrentLocation!);
    if (widget.pickupPoint != null) points.add(widget.pickupPoint!);
    if (widget.destinationPoint != null) points.add(widget.destinationPoint!);
    if (widget.driverPoint != null) points.add(widget.driverPoint!);
    if (widget.routePolyline != null) points.addAll(widget.routePolyline!);

    if (points.isNotEmpty) {
      final bounds = LatLngBounds.fromPoints(points);
      _controller.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: EdgeInsets.fromLTRB(
            48,
            100,
            48,
            widget.controlsBottomPadding + 44,
          ),
        ),
      );
    }
  }

  LatLng get centerPoint => _controller.camera.center;

  @override
  Widget build(BuildContext context) {
    final initialCenter = widget.riderCurrentLocation ??
        widget.driverPoint ??
        widget.pickupPoint ??
        const LatLng(
          EnvironmentConfig.defaultLatitude,
          EnvironmentConfig.defaultLongitude,
        );

    return Stack(
      fit: StackFit.expand,
      children: [
        // 1. Full-Screen High-Clarity Vector/Raster Navigation Map (Uber/Ola Style)
        Positioned.fill(
          child: FlutterMap(
            mapController: _controller,
            options: MapOptions(
              initialCenter: initialCenter,
              initialZoom: 15.2,
              minZoom: 4.0,
              maxZoom: 19.0,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all,
              ),
              onTap: (_, point) {
                if (widget.onMapTap != null) widget.onMapTap!(point);
              },
            ),
            children: [
              // Clean, crisp light navigation map tiles (CartoDB Voyager / OSM with zero gloomy dark filter)
              TileLayer(
                urlTemplate: EnvironmentConfig.tileUrlPattern,
                fallbackUrl: EnvironmentConfig.osmTileUrlPattern,
                userAgentPackageName: 'com.ridenow.app',
                maxZoom: 19,
              ),

              // 2. High-Visibility Navigation Polyline (Uber-Style Neon Core)
              if (widget.routePolyline != null && widget.routePolyline!.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    // Outer Road Shadow
                    Polyline(
                      points: widget.routePolyline!,
                      strokeWidth: 8.5,
                      color: Colors.black.withOpacity(0.65),
                    ),
                    // Outer Electric Blue Halo
                    Polyline(
                      points: widget.routePolyline!,
                      strokeWidth: 6.5,
                      color: const Color(0xFF2563EB),
                    ),
                    // Core Vibrant Yellow Line
                    Polyline(
                      points: widget.routePolyline!,
                      strokeWidth: 4.2,
                      color: const Color(0xFFFFC727),
                    ),
                  ],
                ),

              // 3. Markers Layer
              MarkerLayer(
                markers: [
                  // A. Rider Current Location Marker (Uber Pulsing Blue Beacon)
                  if (widget.riderCurrentLocation != null)
                    Marker(
                      point: widget.riderCurrentLocation!,
                      width: 52,
                      height: 52,
                      child: AnimatedBuilder(
                        animation: _pulseAnimation,
                        builder: (context, child) {
                          return Stack(
                            alignment: Alignment.center,
                            children: [
                              // Outer Pulsing Aura
                              Container(
                                width: 44 * _pulseAnimation.value,
                                height: 44 * _pulseAnimation.value,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2563EB).withOpacity(0.20),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              // Mid Ring
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF3B82F6).withOpacity(0.38),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              // Inner Core Blue Dot with White Ring
                              Container(
                                width: 16,
                                height: 16,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1D4ED8),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2.8),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF2563EB).withOpacity(0.7),
                                      blurRadius: 8,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),

                  // B. Pickup Marker (Uber Black Circle Pin)
                  if (widget.pickupPoint != null && widget.riderCurrentLocation == null)
                    Marker(
                      point: widget.pickupPoint!,
                      width: 72,
                      height: 56,
                      alignment: Alignment.topCenter,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(6),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 4),
                              ],
                            ),
                            child: const Text(
                              'PICKUP',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: Colors.black,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2.5),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.4), blurRadius: 6),
                              ],
                            ),
                            child: const Center(
                              child: Icon(Icons.my_location_rounded, color: Color(0xFFFFC727), size: 14),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // C. Destination Marker (Uber Red Flag Pin)
                  if (widget.destinationPoint != null)
                    Marker(
                      point: widget.destinationPoint!,
                      width: 72,
                      height: 56,
                      alignment: Alignment.topCenter,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444),
                              borderRadius: BorderRadius.circular(6),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 4),
                              ],
                            ),
                            child: const Text(
                              'DROP',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2.5),
                              boxShadow: [
                                BoxShadow(color: const Color(0xFFEF4444).withOpacity(0.5), blurRadius: 8),
                              ],
                            ),
                            child: const Icon(Icons.flag_rounded, color: Colors.white, size: 14),
                          ),
                        ],
                      ),
                    ),

                  // D. Assigned Live Driver Vehicle Marker (during active ride)
                  if (widget.driverPoint != null)
                    Marker(
                      point: widget.driverPoint!,
                      width: 46,
                      height: 46,
                      child: Transform.rotate(
                        angle: widget.driverHeading * (math.pi / 180.0),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFFFFC727), width: 2.5),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFFC727).withOpacity(0.6),
                                blurRadius: 10,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.navigation_rounded, color: Color(0xFFFFC727), size: 24),
                        ),
                      ),
                    ),

                  // E. Real-Time Nearby Active Drivers
                  if (widget.nearbyDrivers != null && widget.nearbyDrivers!.isNotEmpty)
                    ...widget.nearbyDrivers!.map((driver) {
                      IconData iconData = Icons.electric_rickshaw_rounded;
                      Color accentColor = const Color(0xFF10B981); // Auto (Green)

                      if (driver.isBike) {
                        iconData = Icons.two_wheeler_rounded;
                        accentColor = const Color(0xFFFFC727); // Bike (Yellow)
                      } else if (driver.isCar) {
                        iconData = Icons.directions_car_filled_rounded;
                        accentColor = const Color(0xFF38BDF8); // Cab (Sky Blue)
                      }

                      return Marker(
                        point: driver.location,
                        width: 42,
                        height: 42,
                        child: GestureDetector(
                          onTap: () {
                            if (widget.onDriverTap != null) {
                              widget.onDriverTap!(driver);
                            }
                          },
                          child: Transform.rotate(
                            angle: driver.heading * (math.pi / 180.0),
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                shape: BoxShape.circle,
                                border: Border.all(color: accentColor, width: 2.4),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.35),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(iconData, color: accentColor, size: 21),
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ],
          ),
        ),

        // 4. Center Pin Overlay (when user selects destination directly on map)
        if (widget.isPickerMode)
          Align(
            alignment: Alignment.center,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 10)],
                  ),
                  child: Text(
                    widget.pickerPromptText ?? 'Move map to choose destination',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Icon(Icons.location_on_rounded, color: Color(0xFFEF4444), size: 44),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.4),
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ),

        // 5. Floating Map Control Buttons (Recenter, Zoom In, Zoom Out)
        if (widget.showControls)
          Positioned(
            right: 16,
            bottom: widget.controlsBottomPadding,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Zoom In
                _buildMapActionFab(
                  icon: Icons.add_rounded,
                  onTap: zoomIn,
                  tooltip: 'Zoom In',
                ),
                const SizedBox(height: 8),

                // Zoom Out
                _buildMapActionFab(
                  icon: Icons.remove_rounded,
                  onTap: zoomOut,
                  tooltip: 'Zoom Out',
                ),
                const SizedBox(height: 8),

                // Fit Route (if polyline exists)
                if (widget.routePolyline != null && widget.routePolyline!.isNotEmpty) ...[
                  _buildMapActionFab(
                    icon: Icons.alt_route_rounded,
                    onTap: fitRoute,
                    tooltip: 'Fit Route',
                    accentColor: const Color(0xFFFFC727),
                  ),
                  const SizedBox(height: 8),
                ],

                // Recenter GPS Button
                _buildMapActionFab(
                  icon: Icons.my_location_rounded,
                  onTap: recenter,
                  tooltip: 'Current GPS Location',
                  accentColor: const Color(0xFF2563EB),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildMapActionFab({
    required IconData icon,
    required VoidCallback onTap,
    required String tooltip,
    Color? accentColor,
  }) {
    return Material(
      elevation: 4,
      shape: const CircleBorder(),
      color: Colors.white,
      shadowColor: Colors.black26,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(shape: BoxShape.circle),
          child: Icon(
            icon,
            size: 22,
            color: accentColor ?? const Color(0xFF0F172A),
          ),
        ),
      ),
    );
  }
}
