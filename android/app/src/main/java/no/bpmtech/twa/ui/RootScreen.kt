package no.bpmtech.twa.ui

import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import no.bpmtech.twa.theme.BpmColors

data class TabNavigationRequest(
    val tab: String,
    val id: Long,
)

enum class AppDestination(val route: String, val label: String) {
    Analyze("analyze", "Analyze"),
    Tap("tap", "Tap"),
    Metronome("metronome", "Metronome"),
}

@Composable
fun RootScreen(navigationRequest: TabNavigationRequest? = null) {
    val navController = rememberNavController()
    val start = routeForTab(navigationRequest?.tab) ?: AppDestination.Analyze.route
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route ?: start

    LaunchedEffect(navigationRequest?.id) {
        val route = routeForTab(navigationRequest?.tab) ?: return@LaunchedEffect
        navController.navigate(route) {
            popUpTo(navController.graph.findStartDestination().id) {
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
    }

    Scaffold(
        containerColor = BpmColors.Ink,
        bottomBar = {
            NavigationBar(containerColor = BpmColors.InkSoft) {
                AppDestination.entries.forEach { destination ->
                    val selected = currentRoute == destination.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(destination.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = when (destination) {
                                    AppDestination.Analyze -> Icons.Default.GraphicEq
                                    AppDestination.Tap -> Icons.Default.TouchApp
                                    AppDestination.Metronome -> Icons.Default.Timer
                                },
                                contentDescription = destination.label,
                            )
                        },
                        label = { Text(destination.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = BpmColors.Accent,
                            selectedTextColor = BpmColors.Accent,
                            unselectedIconColor = BpmColors.TextFaint,
                            unselectedTextColor = BpmColors.TextFaint,
                            indicatorColor = BpmColors.SurfaceStrong,
                        ),
                    )
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = start,
            modifier = Modifier
                .padding(padding)
                .consumeWindowInsets(padding),
        ) {
            composable(AppDestination.Analyze.route) { AnalyzeScreen() }
            composable(AppDestination.Tap.route) { TapTempoScreen() }
            composable(AppDestination.Metronome.route) { MetronomeScreen() }
        }
    }
}

private fun routeForTab(tab: String?): String? =
    when (tab?.lowercase()) {
        "tap" -> AppDestination.Tap.route
        "metronome" -> AppDestination.Metronome.route
        "analyze" -> AppDestination.Analyze.route
        else -> null
    }
