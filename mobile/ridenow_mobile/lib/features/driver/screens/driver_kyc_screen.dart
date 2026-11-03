import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/network/api_endpoints.dart';
import '../../auth/providers/auth_provider.dart';

class DriverKycScreen extends ConsumerStatefulWidget {
  const DriverKycScreen({super.key});

  @override
  ConsumerState<DriverKycScreen> createState() => _DriverKycScreenState();
}

class _DriverKycScreenState extends ConsumerState<DriverKycScreen> {
  String _docType = 'DRIVING_LICENSE';
  final _docNumberCtrl = TextEditingController(text: 'DL-042018002931');
  final _fileUrlCtrl = TextEditingController(
    text:
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
  );

  bool _isUploading = false;
  String? _statusMsg;

  Future<void> _uploadDoc() async {
    setState(() {
      _isUploading = true;
      _statusMsg = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final res = await api.post(
        ApiEndpoints.uploadKycDoc,
        data: {
          'documentType': _docType,
          'documentNumber': _docNumberCtrl.text.trim(),
          'fileUrl': _fileUrlCtrl.text.trim(),
        },
      );

      if (res.data['success'] == true) {
        setState(() {
          _statusMsg =
              'Success: $_docType submitted for Super Admin review within 24 hours.';
          _isUploading = false;
        });
      } else {
        setState(() {
          _statusMsg = res.data['message'] ?? 'Upload failed';
          _isUploading = false;
        });
      }
    } catch (e) {
      setState(() {
        _statusMsg = e.toString();
        _isUploading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver KYC Verification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.shield, color: AppTheme.primaryYellow),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Indian MVA 2019 Mandatory Commercial Compliance',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              if (_statusMsg != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: _statusMsg!.startsWith('Success')
                        ? AppTheme.successGreen.withOpacity(0.15)
                        : AppTheme.errorRed.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _statusMsg!.startsWith('Success')
                          ? AppTheme.successGreen
                          : AppTheme.errorRed,
                    ),
                  ),
                  child: Text(
                    _statusMsg!,
                    style: TextStyle(
                      color: _statusMsg!.startsWith('Success')
                          ? AppTheme.successGreen
                          : AppTheme.errorRed,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

              DropdownButtonFormField<String>(
                initialValue: _docType,
                dropdownColor: AppTheme.surfaceDark,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
                decoration: const InputDecoration(labelText: 'Document Type'),
                items: const [
                  DropdownMenuItem(
                    value: 'DRIVING_LICENSE',
                    child: Text('Commercial Driving Licence (DL)'),
                  ),
                  DropdownMenuItem(
                    value: 'VEHICLE_RC',
                    child: Text('Registration Certificate (RC)'),
                  ),
                  DropdownMenuItem(
                    value: 'INSURANCE',
                    child: Text('Commercial Vehicle Insurance'),
                  ),
                  DropdownMenuItem(
                    value: 'AADHAAR',
                    child: Text('Aadhaar / ID Proof'),
                  ),
                ],
                onChanged: (val) =>
                    setState(() => _docType = val ?? 'DRIVING_LICENSE'),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _docNumberCtrl,
                style: const TextStyle(
                  color: Colors.white,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                ),
                decoration: const InputDecoration(
                  labelText: 'Document / Certificate Number',
                ),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _fileUrlCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 12),
                decoration: const InputDecoration(
                  labelText: 'Document Scan URL',
                  helperText:
                      'Pre-filled with verified government sample template.',
                  helperStyle: TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 10,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              ElevatedButton.icon(
                onPressed: _isUploading ? null : _uploadDoc,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryYellow,
                ),
                icon: const Icon(
                  Icons.cloud_upload_outlined,
                  color: Colors.black,
                ),
                label: _isUploading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.black,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Submit Document for Review'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
