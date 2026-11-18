package no.bpmtech.twa.ui

import android.Manifest
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import no.bpmtech.twa.model.AnalysisResult
import no.bpmtech.twa.services.AudioCaptureService
import no.bpmtech.twa.services.BpmAnalysisError
import no.bpmtech.twa.services.BpmAnalysisService
import no.bpmtech.twa.theme.BpmColors
import no.bpmtech.twa.ui.components.BpmResultCard
import kotlin.math.floor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalyzeScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val capture = remember { AudioCaptureService(scope) }
    val analyzer = remember { BpmAnalysisService() }

    var result by remember { mutableStateOf<AnalysisResult?>(null) }
    var isAnalyzing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var usePeaksEngine by remember { mutableStateOf(false) }
    var optionsOpen by remember { mutableStateOf(false) }

    val captureState by capture.state.collectAsState()
    val elapsed by capture.elapsedSeconds.collectAsState()

    val lifecycle = androidx.lifecycle.compose.LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, capture) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_STOP) {
                capture.cancel()
            }
        }
        lifecycle.addObserver(observer)
        onDispose {
            lifecycle.removeObserver(observer)
            capture.cancel()
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) {
            capture.startRecording(context)
        } else {
            errorMessage = "Microphone access is required to record. Enable it in Settings."
        }
    }

    val fileLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            isAnalyzing = true
            errorMessage = null
            try {
                result = analyzer.analyzeUri(
                    context = context,
                    uri = uri,
                    mode = AnalysisResult.Mode.FILE,
                    sourceName = uri.lastPathSegment ?: "Audio file",
                    usePeaksEngine = usePeaksEngine,
                )
            } catch (error: BpmAnalysisError) {
                errorMessage = error.message
            } catch (error: Exception) {
                errorMessage = error.message ?: "Analysis failed."
            } finally {
                isAnalyzing = false
            }
        }
    }

    Scaffold(
        containerColor = BpmColors.Ink,
        topBar = {
            TopAppBar(
                title = { Text("BPM Techno", color = BpmColors.Text) },
                actions = {
                    IconButton(onClick = { optionsOpen = true }) {
                        Icon(Icons.Default.Tune, contentDescription = "Analysis options", tint = BpmColors.Text)
                    }
                    DropdownMenu(expanded = optionsOpen, onDismissRequest = { optionsOpen = false }) {
                        DropdownMenuItem(
                            text = {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                ) {
                                    Text("Peaks engine")
                                    Switch(
                                        checked = usePeaksEngine,
                                        onCheckedChange = { usePeaksEngine = it },
                                    )
                                }
                            },
                            onClick = { usePeaksEngine = !usePeaksEngine },
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BpmColors.Ink,
                    titleContentColor = BpmColors.Text,
                ),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BpmColors.BackgroundBrush)
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Native tempo tools",
                    style = MaterialTheme.typography.headlineLarge,
                    color = BpmColors.Text,
                )
                Text(
                    text = "Record a clip or open a track. Analysis uses the same Realtime BPM Analyzer engine as the web app.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = BpmColors.TextMuted,
                )
            }

            AnimatedVisibility(visible = result != null) {
                result?.let { BpmResultCard(it) }
            }

            CardBlock {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Default.Mic, contentDescription = null, tint = BpmColors.Text)
                    Text("Record & analyze", style = MaterialTheme.typography.titleLarge, color = BpmColors.Text)
                }
                Text(
                    text = "Capture at least a few bars, then stop to read the tempo.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = BpmColors.TextMuted,
                )
                if (capture.isRecording) {
                    Text(
                        text = formatElapsed(elapsed),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = BpmColors.Signal,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (capture.isRecording) {
                        PrimaryButton(
                            text = "Stop & analyze",
                            onClick = {
                                scope.launch {
                                    isAnalyzing = true
                                    errorMessage = null
                                    try {
                                        val audio = capture.stopRecording() ?: return@launch
                                        result = analyzer.analyzeSamples(
                                            samples = audio.samples,
                                            sampleRate = audio.sampleRate,
                                            mode = AnalysisResult.Mode.RECORDING,
                                            sourceName = "Microphone recording",
                                            usePeaksEngine = usePeaksEngine,
                                        )
                                    } catch (error: BpmAnalysisError) {
                                        errorMessage = error.message
                                    } catch (error: Exception) {
                                        errorMessage = error.message ?: "Analysis failed."
                                    } finally {
                                        isAnalyzing = false
                                    }
                                }
                            },
                            enabled = !isAnalyzing,
                            modifier = Modifier.weight(1f),
                        )
                        SecondaryButton(
                            text = "Cancel",
                            onClick = { capture.cancel() },
                            modifier = Modifier.weight(1f),
                        )
                    } else {
                        PrimaryButton(
                            text = "Start recording",
                            onClick = {
                                errorMessage = null
                                if (capture.hasMicPermission(context)) {
                                    capture.startRecording(context)
                                } else {
                                    permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                }
                            },
                            enabled = !isAnalyzing,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
                if (captureState is AudioCaptureService.State.Unauthorized) {
                    Text(
                        text = "Microphone access is required to record. Enable it in Settings.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = BpmColors.Danger,
                    )
                }
                val failed = captureState as? AudioCaptureService.State.Failed
                if (failed != null) {
                    Text(failed.message, style = MaterialTheme.typography.bodyMedium, color = BpmColors.Danger)
                }
            }

            CardBlock {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Default.Folder, contentDescription = null, tint = BpmColors.Text)
                    Text("Analyze a file", style = MaterialTheme.typography.titleLarge, color = BpmColors.Text)
                }
                Text(
                    text = "MP3, WAV, M4A, AAC, FLAC, and OGG are supported.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = BpmColors.TextMuted,
                )
                SecondaryButton(
                    text = "Choose audio file",
                    onClick = {
                        errorMessage = null
                        fileLauncher.launch(arrayOf("audio/*"))
                    },
                    enabled = !isAnalyzing && captureState !is AudioCaptureService.State.Recording,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            if (isAnalyzing) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    CircularProgressIndicator(color = BpmColors.Signal)
                    Spacer(Modifier.padding(8.dp))
                    Text("Analyzing on-device…", color = BpmColors.TextMuted)
                }
            }

            errorMessage?.let { message ->
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = BpmColors.Surface,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        text = message,
                        color = BpmColors.Danger,
                        modifier = Modifier.padding(14.dp),
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }

            Text(
                text = "Tempo is detected on this device with Realtime BPM Analyzer for Java/Kotlin. Audio is never uploaded.",
                style = MaterialTheme.typography.bodyMedium,
                color = BpmColors.TextFaint,
            )
            Spacer(Modifier.height(12.dp))
        }
    }
}

@Composable
private fun CardBlock(content: @Composable () -> Unit) {
    val shape = RoundedCornerShape(18.dp)
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BpmColors.Text.copy(alpha = 0.08f), shape),
        shape = shape,
        color = BpmColors.Surface.copy(alpha = 0.92f),
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            content = { content() },
        )
    }
}

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = BpmColors.Accent,
            contentColor = BpmColors.Ink,
            disabledContainerColor = BpmColors.Accent.copy(alpha = 0.4f),
        ),
    ) {
        Text(text, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(52.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = BpmColors.Text),
        border = androidx.compose.foundation.BorderStroke(1.dp, BpmColors.TextFaint.copy(alpha = 0.35f)),
    ) {
        Text(text, fontWeight = FontWeight.SemiBold)
    }
}

private fun formatElapsed(seconds: Double): String {
    val total = floor(seconds).toInt()
    return "%d:%02d".format(total / 60, total % 60)
}
