package no.bpmtech.twa

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import no.bpmtech.twa.theme.BpmColors
import no.bpmtech.twa.theme.BpmTechnoTheme
import no.bpmtech.twa.ui.RootScreen

class MainActivity : ComponentActivity() {
    private var initialTab by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        initialTab = tabFromIntent(intent)

        setContent {
            BpmTechnoTheme(darkTheme = true) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BpmColors.Ink,
                ) {
                    RootScreen(initialTab = initialTab)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        initialTab = tabFromIntent(intent)
    }

    private fun tabFromIntent(intent: Intent?): String? {
        val data = intent?.data ?: return null
        return data.getQueryParameter("tab")
    }
}
