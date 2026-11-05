import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../services/geoapify_geocoding_service.dart';
import '../services/photon_geocoding_service.dart';

class PickupDestinationSearchPanel extends StatefulWidget {
  final String pickupAddress;
  final String dropAddress;
  final LatLng pickupPoint;
  final Function(LatLng point, String address) onPickupSelected;
  final Function(LatLng point, String address) onDestinationSelected;
  final VoidCallback? onChooseOnMap;
  final VoidCallback? onBack;

  const PickupDestinationSearchPanel({
    super.key,
    required this.pickupAddress,
    required this.dropAddress,
    required this.pickupPoint,
    required this.onPickupSelected,
    required this.onDestinationSelected,
    this.onChooseOnMap,
    this.onBack,
  });

  @override
  State<PickupDestinationSearchPanel> createState() =>
      _PickupDestinationSearchPanelState();
}

class _PickupDestinationSearchPanelState
    extends State<PickupDestinationSearchPanel> {
  final TextEditingController _pickupCtrl = TextEditingController();
  final TextEditingController _destCtrl = TextEditingController();
  final FocusNode _destFocus = FocusNode();
  final FocusNode _pickupFocus = FocusNode();
  final GeoapifyGeocodingService _geocoding = GeoapifyGeocodingService();

  List<GeocodingResult> _suggestions = [];
  bool _isSearching = false;
  String _activeField = 'drop'; // 'pickup' | 'drop'

  final List<Map<String, dynamic>> _quickPlaces = [
    {
      'title': 'Indore Airport (IDR)',
      'subtitle': 'Devi Ahilyabai Holkar Airport',
      'lat': 22.7217,
      'lng': 75.8011,
      'icon': Icons.flight_takeoff_rounded,
    },
    {
      'title': 'Indore Junction Railway Station',
      'subtitle': 'Chhoti Gwaltoli, Indore',
      'lat': 22.7177,
      'lng': 75.8682,
      'icon': Icons.train_rounded,
    },
    {
      'title': 'Rajwada Palace',
      'subtitle': 'Rajwada, Old Heritage Center, Indore',
      'lat': 22.7196,
      'lng': 75.8577,
      'icon': Icons.account_balance_rounded,
    },
    {
      'title': '56 Dukan (Chappan Dukan)',
      'subtitle': 'New Palasia, Food Street, Indore',
      'lat': 22.7244,
      'lng': 75.8839,
      'icon': Icons.restaurant_rounded,
    },
    {
      'title': 'Vijay Nagar Square',
      'subtitle': 'AB Road, Commercial Hub, Indore',
      'lat': 22.7533,
      'lng': 75.8937,
      'icon': Icons.business_rounded,
    },
  ];

  @override
  void initState() {
    super.initState();
    _pickupCtrl.text = widget.pickupAddress;
    _destCtrl.text = widget.dropAddress;

    _destFocus.addListener(() {
      if (_destFocus.hasFocus) {
        setState(() => _activeField = 'drop');
        _performSearch(_destCtrl.text);
      }
    });

    _pickupFocus.addListener(() {
      if (_pickupFocus.hasFocus) {
        setState(() => _activeField = 'pickup');
        _performSearch(_pickupCtrl.text);
      }
    });
  }

  @override
  void didUpdateWidget(PickupDestinationSearchPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pickupAddress != oldWidget.pickupAddress &&
        !_pickupFocus.hasFocus) {
      _pickupCtrl.text = widget.pickupAddress;
    }
    if (widget.dropAddress != oldWidget.dropAddress && !_destFocus.hasFocus) {
      _destCtrl.text = widget.dropAddress;
    }
  }

  @override
  void dispose() {
    _pickupCtrl.dispose();
    _destCtrl.dispose();
    _pickupFocus.dispose();
    _destFocus.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) {
      if (mounted) setState(() => _suggestions = []);
      return;
    }

    setState(() => _isSearching = true);
    final results = await _geocoding.autocomplete(
      clean,
      referencePoint: widget.pickupPoint,
      limit: 6,
    );

    if (mounted) {
      setState(() {
        _isSearching = false;
        _suggestions = results;
      });
    }
  }

  void _onSelectPlace(String title, String subtitle, LatLng point) {
    final fullAddr = subtitle.isNotEmpty ? '$title, $subtitle' : title;
    if (_activeField == 'pickup') {
      _pickupCtrl.text = fullAddr;
      widget.onPickupSelected(point, fullAddr);
      _destFocus.requestFocus();
    } else {
      _destCtrl.text = fullAddr;
      widget.onDestinationSelected(point, fullAddr);
      _destFocus.unfocus();
    }
    setState(() => _suggestions = []);
  }

  @override
  Widget build(BuildContext context) {
    final hasFocus = _destFocus.hasFocus || _pickupFocus.hasFocus;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 1. Search Box Container
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Dotted Timeline Indicator (Green Dot -> Dotted Line -> Black Square)
                Column(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    Container(
                      width: 2,
                      height: 28,
                      color: Colors.grey.shade300,
                      margin: const EdgeInsets.symmetric(vertical: 2),
                    ),
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),

                // Input Text Fields
                Expanded(
                  child: Column(
                    children: [
                      // Pickup Field
                      TextField(
                        controller: _pickupCtrl,
                        focusNode: _pickupFocus,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Current location',
                          hintStyle: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 14,
                          ),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 4),
                          border: InputBorder.none,
                        ),
                        onChanged: _performSearch,
                      ),
                      Divider(height: 14, thickness: 0.8, color: Colors.grey.shade200),

                      // Destination Field
                      TextField(
                        controller: _destCtrl,
                        focusNode: _destFocus,
                        autofocus: false,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Colors.black,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Where to?',
                          hintStyle: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 4),
                          border: InputBorder.none,
                        ),
                        onChanged: _performSearch,
                      ),
                    ],
                  ),
                ),

                // Action Clear / Search / Map Pin Icon
                if (hasFocus || _destCtrl.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20, color: Colors.black54),
                    onPressed: () {
                      _destCtrl.clear();
                      _destFocus.unfocus();
                      setState(() => _suggestions = []);
                    },
                  )
                else
                  InkWell(
                    onTap: widget.onChooseOnMap,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.map_rounded, size: 14, color: Colors.black87),
                          SizedBox(width: 4),
                          Text(
                            'Map',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // 2. Autocomplete Suggestions Dropdown
          if (_isSearching)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFFFC727)),
                ),
              ),
            )
          else if (_suggestions.isNotEmpty)
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 250),
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                itemCount: _suggestions.length,
                separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade200),
                itemBuilder: (context, index) {
                  final s = _suggestions[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    leading: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(Icons.location_on_rounded, size: 16, color: Colors.black87),
                      ),
                    ),
                    title: Text(
                      s.name,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      '${s.street.isNotEmpty ? "${s.street}, " : ""}${s.city}',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    onTap: () => _onSelectPlace(s.name, s.street, s.point),
                  );
                },
              ),
            )
          // 3. Quick Landmarks / Recent Places (when destination is empty and focused)
          else if (hasFocus && _destCtrl.text.isEmpty)
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 220),
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                itemCount: _quickPlaces.length,
                separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100),
                itemBuilder: (context, index) {
                  final p = _quickPlaces[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    leading: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(p['icon'] as IconData, size: 16, color: const Color(0xFFF59E0B)),
                      ),
                    ),
                    title: Text(
                      p['title'] as String,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    subtitle: Text(
                      p['subtitle'] as String,
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                    ),
                    onTap: () => _onSelectPlace(
                      p['title'] as String,
                      p['subtitle'] as String,
                      LatLng(p['lat'] as double, p['lng'] as double),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

