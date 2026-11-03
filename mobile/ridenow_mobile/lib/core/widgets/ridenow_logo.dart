import 'package:flutter/material.dart';

class RideNowLogo extends StatelessWidget {
  final double height;
  final double? width;
  final BoxFit fit;
  final bool isDark;
  final EdgeInsetsGeometry? padding;

  const RideNowLogo({
    super.key,
    this.height = 36.0,
    this.width,
    this.fit = BoxFit.contain,
    this.isDark = false,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    Widget imageWidget = Image.asset(
      'assets/images/ridenow_logo.png',
      height: height,
      width: width,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        // High quality fallback in case of asset loading lag
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.black,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.navigation_rounded,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
            RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: height * 0.6,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : Colors.black,
                  letterSpacing: -0.5,
                ),
                children: const [
                  TextSpan(text: 'Ride'),
                  TextSpan(
                    text: 'Now',
                    style: TextStyle(
                      decoration: TextDecoration.underline,
                      decorationColor: Color(0xFFFFC727),
                      decorationThickness: 3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );

    // If on a dark background, wrap in a subtle light badge or render clearly
    if (isDark) {
      imageWidget = Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: imageWidget,
      );
    }

    if (padding != null) {
      return Padding(padding: padding!, child: imageWidget);
    }

    return imageWidget;
  }
}

