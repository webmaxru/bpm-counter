package no.bpmtech.twa.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

object BpmColors {
    val Ink = Color(0xFF071C2B)
    val InkSoft = Color(0xFF0A2638)
    val Surface = Color(0xFF0C3046)
    val SurfaceStrong = Color(0xFF113E57)
    val Text = Color(0xFFF7F3ED)
    val TextMuted = Color(0xFFB9CFD8)
    val TextFaint = Color(0xFF87A9B7)
    val Accent = Color(0xFFFFB36B)
    val AccentStrong = Color(0xFFFF8B5C)
    val Signal = Color(0xFF69DED5)
    val Danger = Color(0xFFFF8B7A)

    val BackgroundBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF297E97).copy(alpha = 0.28f),
            Ink,
            Color(0xFFFF8B5C).copy(alpha = 0.08f),
        ),
    )
}
