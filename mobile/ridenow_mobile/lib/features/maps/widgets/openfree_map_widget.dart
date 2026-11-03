import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../app/config/environment.dart';
import '../../../app/theme/app_theme.dart';

class OpenFreeMapWidget extends StatefulWidget {
  final LatLng? pickupPoint;
  final LatLng? destinationPoint;
  final LatLng? driverPoint;
  final double driverHeading;
  final List<LatLng>? routePolyline;
  final Function(LatLng)? onMapTap;
  final MapController? mapController;
  final double controlsBottomPadding;

  const OpenFreeMapWidget({
    super.key,
    this.pickupPoint,
    this.destinationPoint,
    this.driverPoint,
    this.driverHeading = 0.0,
    this.routePolyline,
    this.onMapTap,
    this.mapController,
    this.controlsBottomPadding = 24.0,
  });

  @override
  State<OpenFreeMapWidget> createState() => OpenFreeMapWidgetState();
}

class OpenFreeMapWidgetState extends State<OpenFreeMapWidget> {
  late final MapController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.mapController ?? MapController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.routePolyline != null && widget.routePolyline!.isNotEmpty) {
        fitRoute();
      }
    });
  }

  @override
  void didUpdateWidget(OpenFreeMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.routePolyline != null &&
        widget.routePolyline != oldWidget.routePolyline &&
        widget.routePolyline!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) => fitRoute());
    }
  }

  void recenter() {
    final center = widget.driverPoint ??
        widget.pickupPoint ??
        const LatLng(
          EnvironmentConfig.defaultLatitude,
          EnvironmentConfig.defaultLongitude,
        );
    _controller.move(center, 15.0);
  }

  void zoomIn() {
    _controller.move(
      _controller.camera.center,
      (_controller.camera.zoom + 1).clamp(3.0, 19.0),
    );
  }

  void zoomOut() {
    _controller.move(
      _controller.camera.center,
      (_controller.camera.zoom - 1).clamp(3.0, 19.0),
    );
  }

  void fitRoute() {
    final points = <LatLng>[];
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
            45,
            90,
            45,
            widget.controlsBottomPadding + 40,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final initialCenter = widget.pickupPoint ??
        const LatLng(
          EnvironmentConfig.defaultLatitude,
          EnvironmentConfig.defaultLongitude,
        );

    return Stack(
      children: [
        // 1. FlutterMap Core Canvas
        FlutterMap(
          mapController: _controller,
          options: MapOptions(
            initialCenter: initialCenter,
            initialZoom: 14.5,
            minZoom: 4.0,
            maxZoom: 18.5,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.all,
            ),
            onTap: (_, point) {
              if (widget.onMapTap != null) widget.onMapTap!(point);
            },
          ),
          children: [
            // OpenFreeMap / OSM Vector & Raster Tiles with sleek balanced nav theme
            TileLayer(
              urlTemplate: EnvironmentConfig.tileUrlPattern,
              userAgentPackageName: 'com.ridenow.app',
              tileBuilder: (context, widgetChild, tile) {
                // High-clarity subtle dark mode matrix (crisp roads, distinct text)
                return ColorFiltered(
                  colorFilter: const ColorFilter.matrix([
                    0.55, 0.00, 0.00, 0.00, 0.00,
                    0.00, 0.55, 0.00, 0.00, 0.00,
                    0.00, 0.00, 0.60, 0.00, 0.00,
                    0.00, 0.00, 0.00, 1.00, 0.00,
                  ]),
                  child: widgetChild,
                );
              },
            ),

            // 2. High-Visibility Navigation Polyline
            if (widget.routePolyline != null && widget.routePolyline!.isNotEmpty)
              PolylineLayer(
                polylines: [
                  // Outer road shadow / border
                  Polyline(
                    points: widget.routePolyline!,
                    strokeWidth: 8.0,
                    color: Colors.black.withOpacity(0.7),
                  ),
                  // Outer Cyan/Blue Glow
                  Polyline(
                    points: widget.routePolyline!,
                    strokeWidth: 6.5,
                    color: const Color(0xFF3B82F6),
                  ),
                  // Core Vibrant Yellow Line
                  Polyline(
                    points: widget.routePolyline!,
                    strokeWidth: 4.0,
                    color: const Color(0xFFFFC727),
                  ),
                ],
              ),

            // 3. Navigation Markers Layer
            MarkerLayer(
              markers: [
                // A. Pickup Marker (Vibrant Green Pin with Badge)
                if (widget.pickupPoint != null)
                  Marker(
                    point: widget.pickupPoint!,
                    width: 70,
                    height: 56,
                    alignment: Alignment.topCenter,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.4),
                                blurRadius: 4,
                              ),
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
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withOpacity(0.6),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.my_location_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ),

                // B. Destination Marker (Red Flag Pin with Badge)
                if (widget.destinationPoint != null)
                  Marker(
                    point: widget.destinationPoint!,
                    width: 70,
                    height: 56,
                    alignment: Alignment.topCenter,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.4),
                                blurRadius: 4,
                              ),
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
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFEF4444).withOpacity(0.6),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.flag_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ),

                // C. Driver Live Vehicle Marker
                if (widget.driverPoint != null)
                  Marker(
                    point: widget.driverPoint!,
                    width: 44,
                    height: 44,
                    child: Transform.rotate(
                      angle: widget.driverHeading * (3.1415926535 / 180.0),
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFFC727),
                            width: 2.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFFC727).withOpacity(0.7),
                              blurRadius: 12,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.navigation_rounded,
                          color: Color(0xFFFFC727),
                          size: 24,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),

        // 4. Floating Navigation Map Controls (Zoom In, Zoom Out, Fit Route, Recenter)
        Positioned(
          right: 14,
          bottom: widget.controlsBottomPadding,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Zoom In (+)
              _buildMapControlBtn(
                heroTag: 'map_zoom_in_${identityHashCode(this)}',
                icon: Icons.add,
                tooltip: 'Zoom In',
                onPressed: zoomIn,
              ),
              const SizedBox(height: 8),

              // Zoom Out (-)
              _buildMapControlBtn(
                heroTag: 'map_zoom_out_${identityHashCode(this)}',
                icon: Icons.remove,
                tooltip: 'Zoom Out',
                onPressed: zoomOut,
              ),
              const SizedBox(height: 8),

              // Fit Full Route (🗺️)
              if (widget.routePolyline != null && widget.routePolyline!.isNotEmpty) ...[
                _buildMapControlBtn(
                  heroTag: 'map_fit_route_${identityHashCode(this)}',
                  icon: Icons.alt_route_rounded,
                  tooltip: 'View Full Route',
                  color: const Color(0xFF38BDF8),
                  onPressed: fitRoute,
                ),
                const SizedBox(height: 8),
              ],

              // Recenter (📍)
              _buildMapControlBtn(
                heroTag: 'map_recenter_${identityHashCode(this)}',
                icon: Icons.my_location_rounded,
                tooltip: 'Recenter',
                color: const Color(0xFFFFC727),
                iconColor: Colors.black,
                onPressed: recenter,
              ),
            ],
          ),
        ),

        // 5. Attribution Tag
        Positioned(
          left: 10,
          bottom: widget.controlsBottomPadding + 4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.65),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              'OpenFreeMap • OSRM',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 9,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMapControlBtn({
    required String heroTag,
    required IconData icon,
    required String tooltip,
    required VoidCallback onPressed,
    Color color = const Color(0xFF0F172A),
    Color iconColor = const Color(0xFFFFC727),
  }) {
    return SizedBox(
      width: 42,
      height: 42,
      child: FloatingActionButton(
        heroTag: heroTag,
        backgroundColor: color,
        foregroundColor: iconColor,
        elevation: 4,
        tooltip: tooltip,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0x33FFC727), width: 1),
        ),
        onPressed: onPressed,
        child: Icon(icon, size: 20),
      ),
    );
  }
}
