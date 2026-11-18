package no.bpmtech.twa.ui.components

import android.content.Intent
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import no.bpmtech.twa.theme.BpmColors

@Composable
fun BpmResultCard(result: AnalysisResult) {
    val context = LocalContext.current
    val shape = RoundedCornerShape(20.dp)

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BpmColors.Signal.copy(alpha = 0.22f), shape),
        shape = shape,
        color = BpmColors.InkSoft,
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = result.mode.title.uppercase(),
                style = MaterialTheme.typography.labelLarge,
                color = BpmColors.Signal,
                letterSpacing = 1.2.sp,
            )
            Text(
                text = result.bpm.toString(),
                style = MaterialTheme.typography.displayLarge.copy(
                    fontSize = 72.sp,
                    fontWeight = FontWeight.Bold,
                ),
                color = BpmColors.Text,
                modifier = Modifier.semantics {
                    contentDescription = "${result.bpm} beats per minute"
                },
            )
            Text(
                text = "BPM",
                style = MaterialTheme.typography.titleLarge,
                color = BpmColors.TextMuted,
            )
            result.confidence?.let { confidence ->
                Text(
                    text = "Confidence ${(confidence * 100).toInt()}%",
                    style = MaterialTheme.typography.bodyMedium,
                    color = BpmColors.TextFaint,
                )
            }
            if (!result.sourceName.isNullOrBlank()) {
                Text(
                    text = result.sourceName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = BpmColors.TextFaint,
                    textAlign = TextAlign.Center,
                    maxLines = 2,
                )
            }
            if (result.candidates.size > 1) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    result.candidates.drop(1).forEach { candidate ->
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = BpmColors.SurfaceStrong,
                        ) {
                            Text(
                                text = "${candidate.bpm} · ${candidate.relation}",
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                style = MaterialTheme.typography.labelLarge,
                                color = BpmColors.TextMuted,
                            )
                        }
                    }
                }
            }
            Button(
                onClick = {
                    val share = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, result.shareText)
                    }
                    context.startActivity(Intent.createChooser(share, "Share BPM"))
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BpmColors.Signal,
                    contentColor = BpmColors.Ink,
                ),
                shape = RoundedCornerShape(12.dp),
            ) {
                Text("Share BPM", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
