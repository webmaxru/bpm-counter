package no.bpmtech.twa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import no.bpmtech.twa.services.MetronomeEngine
import no.bpmtech.twa.theme.BpmColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MetronomeScreen() {
    val scope = rememberCoroutineScope()
    val metronome = remember { MetronomeEngine(scope) }
    val bpm by metronome.bpm.collectAsState()
    val beatsPerBar by metronome.beatsPerBar.collectAsState()
    val isRunning by metronome.isRunning.collectAsState()
    val currentBeat by metronome.currentBeat.collectAsState()
    var draft by remember { mutableStateOf("120") }
    val focusManager = LocalFocusManager.current

    DisposableEffect(Unit) {
        onDispose { metronome.release() }
    }

    fun commitDraft() {
        draft.toDoubleOrNull()?.let { metronome.setBpm(it) }
        draft = "%.0f".format(metronome.bpm.value)
        focusManager.clearFocus()
    }

    Scaffold(
        containerColor = BpmColors.Ink,
        topBar = {
            TopAppBar(
                title = { Text("Metronome", color = BpmColors.Text) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BpmColors.Ink),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BpmColors.BackgroundBrush)
                .padding(padding)
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = "%.0f".format(bpm),
                style = MaterialTheme.typography.displayLarge.copy(fontSize = 84.sp),
                color = BpmColors.Text,
                fontWeight = FontWeight.Bold,
            )
            Text("BPM", style = MaterialTheme.typography.titleLarge, color = BpmColors.TextMuted)

            Row(
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier.semantics {
                    contentDescription = "Beat ${maxOf(currentBeat, 0) + 1} of $beatsPerBar"
                },
            ) {
                repeat(beatsPerBar) { index ->
                    val active = index == currentBeat
                    val scale by animateFloatAsState(if (active) 1.2f else 1f, label = "beat")
                    Box(
                        modifier = Modifier
                            .size(18.dp)
                            .scale(scale)
                            .background(
                                if (active) BpmColors.Accent else BpmColors.SurfaceStrong,
                                CircleShape,
                            )
                            .border(1.dp, BpmColors.Signal.copy(alpha = 0.35f), CircleShape),
                    )
                }
            }

            Slider(
                value = bpm.toFloat(),
                onValueChange = {
                    metronome.setBpm(it.toDouble())
                    draft = "%.0f".format(metronome.bpm.value)
                },
                valueRange = MetronomeEngine.MIN_BPM.toFloat()..MetronomeEngine.MAX_BPM.toFloat(),
                colors = SliderDefaults.colors(
                    thumbColor = BpmColors.Signal,
                    activeTrackColor = BpmColors.Signal,
                    inactiveTrackColor = BpmColors.SurfaceStrong,
                ),
                modifier = Modifier.fillMaxWidth(),
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                OutlinedTextField(
                    value = draft,
                    onValueChange = { draft = it },
                    label = { Text("BPM") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Decimal,
                        imeAction = ImeAction.Done,
                    ),
                    keyboardActions = KeyboardActions(onDone = { commitDraft() }),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = BpmColors.Text,
                        unfocusedTextColor = BpmColors.Text,
                        focusedBorderColor = BpmColors.Signal,
                        unfocusedBorderColor = BpmColors.TextFaint,
                        focusedLabelColor = BpmColors.Signal,
                        unfocusedLabelColor = BpmColors.TextMuted,
                        cursorColor = BpmColors.Signal,
                    ),
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                )
                androidx.compose.material3.IconButton(
                    onClick = { metronome.setBeatsPerBar(beatsPerBar - 1) },
                    modifier = Modifier.width(56.dp).semantics {
                        contentDescription = "Fewer beats per bar"
                    },
                ) {
                    Text("−", color = BpmColors.Text)
                }
                Text(
                    text = "$beatsPerBar/4",
                    color = BpmColors.TextMuted,
                    modifier = Modifier.width(48.dp),
                )
                androidx.compose.material3.IconButton(
                    onClick = { metronome.setBeatsPerBar(beatsPerBar + 1) },
                    modifier = Modifier.width(56.dp).semantics {
                        contentDescription = "More beats per bar"
                    },
                ) {
                    Text("+", color = BpmColors.Text)
                }
            }

            if (isRunning) {
                SecondaryButton(
                    text = "Stop",
                    onClick = {
                        commitDraft()
                        metronome.stop()
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            } else {
                PrimaryButton(
                    text = "Start",
                    onClick = {
                        commitDraft()
                        metronome.start()
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            Spacer(Modifier.weight(1f))
        }
    }
}
