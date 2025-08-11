package com.example.smartlayout

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppRoot(
                openMagicplan = {
                    // Example deep link to magicplan, actual scheme to be configured by user account
                    val uri = Uri.parse("magicplan://open")
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                }
            )
        }
    }
}

@Composable
fun AppRoot(openMagicplan: () -> Unit) {
    val navController = rememberNavController()
    Surface(color = MaterialTheme.colorScheme.background) {
        AppNavHost(navController = navController, openMagicplan = openMagicplan)
    }
}

@Composable
fun AppNavHost(navController: NavHostController, openMagicplan: () -> Unit) {
    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onScanRoom = { openMagicplan() },
                onObjectDetection = { navController.navigate("detect") },
                onSearch = { navController.navigate("search") }
            )
        }
        composable("detect") {
            com.example.smartlayout.screens.DetectScreen()
        }
        composable("search") { com.example.smartlayout.screens.SearchScreen() }
    }
}

@Composable
fun HomeScreen(
    onScanRoom: () -> Unit,
    onObjectDetection: () -> Unit,
    onSearch: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Button(onClick = onScanRoom, modifier = Modifier.padding(vertical = 8.dp)) {
            Text(text = "Scan Room")
        }
        Button(onClick = onObjectDetection, modifier = Modifier.padding(vertical = 8.dp)) {
            Text(text = "Object Detection")
        }
        Button(onClick = onSearch, modifier = Modifier.padding(vertical = 8.dp)) {
            Text(text = "Search")
        }
    }
}

@Composable
fun PlaceholderScreen(text: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text)
    }
}