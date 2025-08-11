package com.example.smartlayout.util

import android.graphics.Bitmap
import androidx.palette.graphics.Palette

object ColorUtils {
    data class DominantColor(val colorString: String)

    fun extractDominantColor(bitmap: Bitmap): DominantColor {
        val palette = Palette.from(bitmap).clearFilters().generate()
        val swatch = palette.dominantSwatch
        val colorInt = swatch?.rgb ?: 0xFF000000.toInt()
        val hex = String.format("#%06X", 0xFFFFFF and colorInt)
        return DominantColor(colorString = hex)
    }
}