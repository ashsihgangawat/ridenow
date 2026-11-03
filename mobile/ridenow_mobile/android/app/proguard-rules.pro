# Razorpay Android SDK ProGuard Rules
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !class/merging/vertical*,!class/merging/horizontal*
-keepclasseswithmembers class * {
    public void onPaymentSuccess(java.lang.String);
    public void onPaymentError(int, java.lang.String);
}

