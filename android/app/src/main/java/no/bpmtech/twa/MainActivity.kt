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
import no.bpmtech.twa.ui.TabNavigationRequest

class MainActivity : ComponentActivity() {
    private var navigationRequest by mutableStateOf<TabNavigationRequest?>(null)
    private var navigationSequence = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        applyNavigationIntent(intent)

        setContent {
            BpmTechnoTheme(darkTheme = true) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = BpmColors.Ink,
                ) {
                    RootScreen(navigationRequest = navigationRequest)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        applyNavigationIntent(intent)
    }

    private fun applyNavigationIntent(intent: Intent?) {
        val tab = tabFromIntent(intent) ?: return
        navigationSequence += 1
        navigationRequest = TabNavigationRequest(tab = tab, id = navigationSequence)
    }

    private fun tabFromIntent(intent: Intent?): String? {
        val data = intent?.data ?: return null
        return data.getQueryParameter("tab")
    }
}
