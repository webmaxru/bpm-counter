package no.bpmtech.twa.ui

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import no.bpmtech.twa.model.AnalysisResult
import no.bpmtech.twa.services.TapTempoService
import no.bpmtech.twa.theme.BpmColors
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TapTempoScreen() {
    val context = LocalContext.current
    val engine = remember { TapTempoService() }
    var displayedBpm by remember { mutableStateOf<Double?>(null) }
    var tapCount by remember { mutableIntStateOf(0) }

    Scaffold(
        containerColor = BpmColors.Ink,
        topBar = {
            TopAppBar(
                title = { Text("Tap tempo", color = BpmColors.Text) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BpmColors.Ink),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BpmColors.BackgroundBrush)
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(28.dp),
        ) {
            Spacer(Modifier.height(12.dp))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = displayedBpm?.let { formatBpm(it) } ?: "--",
                    style = MaterialTheme.typography.displayLarge.copy(fontSize = 84.sp),
                    color = BpmColors.Text,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.semantics {
                        contentDescription = displayedBpm?.let { "$it beats per minute" } ?: "No tempo yet"
                    },
                )
                Text("BPM", style = MaterialTheme.typography.titleLarge, color = BpmColors.TextMuted)
            }
            Text(
                text = if (tapCount == 0) {
                    "Tap along with the beat. Tempo resets after a short pause."
                } else {
                    "Recent taps: $tapCount of ${TapTempoService.MAX_TAPS}"
                },
                style = MaterialTheme.typography.bodyMedium,
                color = BpmColors.TextMuted,
                textAlign = TextAlign.Center,
            )
            PrimaryButton(
                text = "Tap the beat",
                onClick = {
                    vibrateTap(context)
                    engine.tap()
                    tapCount = engine.tapTimes.size
                    displayedBpm = engine.bpm
                },
                modifier = Modifier.fillMaxWidth(),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                SecondaryButton(
                    text = "Reset",
                    onClick = {
                        engine.reset()
                        tapCount = 0
                        displayedBpm = null
                    },
                    enabled = tapCount > 0,
                    modifier = Modifier.weight(1f),
                )
                displayedBpm?.let { bpm ->
                    SecondaryButton(
                        text = "Share",
                        onClick = {
                            val result = AnalysisResult(
                                bpm = bpm.roundToInt(),
                                bpmExact = bpm,
                                confidence = null,
                                candidates = emptyList(),
                                mode = AnalysisResult.Mode.TAP,
                                sourceName = null,
                            )
                            val share = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, result.shareText)
                            }
                            context.startActivity(Intent.createChooser(share, "Share BPM"))
                        },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

private fun formatBpm(value: Double): String =
    if (value == value.toInt().toDouble()) value.toInt().toString() else "%.1f".format(value)

@Suppress("DEPRECATION")
private fun vibrateTap(context: Context) {
    val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val manager = context.getSystemService(VibratorManager::class.java)
        manager?.defaultVibrator
    } else {
        context.getSystemService(Vibrator::class.java)
    } ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(VibrationEffect.createOneShot(25, VibrationEffect.DEFAULT_AMPLITUDE))
    } else {
        vibrator.vibrate(25)
    }
}
