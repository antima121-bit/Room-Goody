package com.example.smartlayout.util

object ShapeUtils {
    // Placeholder: real implementation would use OpenCV or ML; here we keep a simple heuristic API.
    fun estimateShape(width: Int, height: Int): String {
        return when {
            width == height -> "square"
            width > height -> "rectangle"
            else -> "portrait-rectangle"
        }
    }

    fun estimateSize(width: Int, height: Int): String {
        val area = width.toLong() * height.toLong()
        return when {
            area > 2_000_000 -> "large"
            area > 500_000 -> "medium"
            else -> "small"
        }
    }
}