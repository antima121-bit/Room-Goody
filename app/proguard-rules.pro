# Keep ML Kit and Hilt generated classes safe
-keep class dagger.hilt.** { *; }
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**