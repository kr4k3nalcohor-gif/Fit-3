package com.pulsefit.metronome

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Watch
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            PulseFitNativeApp(
                onStartService = { bpm, beats, vibrationMs, vibratePhone ->
                    Log.i("MainActivity", "Starting MetronomeService: BPM=$bpm, beats=$beats, vibration=${vibrationMs}ms, vibratePhone=$vibratePhone")
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_START
                        putExtra(MetronomeService.EXTRA_BPM, bpm)
                        putExtra(MetronomeService.EXTRA_BEATS, beats)
                        putExtra(MetronomeService.EXTRA_VIBRATION_MS, vibrationMs)
                        putExtra(MetronomeService.EXTRA_VIBRATE_PHONE, vibratePhone)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(intent)
                    } else {
                        startService(intent)
                    }
                },
                onStopService = {
                    Log.i("MainActivity", "Stopping MetronomeService")
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_STOP
                    }
                    startService(intent)
                },
                onUpdateBpm = { bpm ->
                    Log.i("MainActivity", "Updating MetronomeService BPM to $bpm")
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_SET_BPM
                        putExtra(MetronomeService.EXTRA_BPM, bpm)
                    }
                    startService(intent)
                }
            )
        }
    }
}

@Composable
fun PulseFitNativeApp(
    onStartService: (bpm: Int, beats: Int, vibrationMs: Long, vibratePhone: Boolean) -> Unit,
    onStopService: () -> Unit,
    onUpdateBpm: (bpm: Int) -> Unit
) {
    val context = LocalContext.current
    var isPlaying by remember { mutableStateOf(MetronomeService.isServiceRunning) }
    var bpm by remember { mutableStateOf(MetronomeService.currentBpm) }
    var beats by remember { mutableStateOf(4) }
    var vibrationMs by remember { mutableStateOf(85L) }
    var vibratePhone by remember { mutableStateOf(false) } // Default: False (Fit 3 vibrates, NOT the phone!)
    var showTempoDialog by remember { mutableStateOf(false) }
    var showBeatsDialog by remember { mutableStateOf(false) }

    // Listen to broadcast updates from MetronomeService (e.g. when user changes BPM on Galaxy Fit 3 Media Controller!)
    DisposableEffect(Unit) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                if (intent?.action == MetronomeService.ACTION_BPM_UPDATED) {
                    val updatedBpm = intent.getIntExtra(MetronomeService.EXTRA_BPM, bpm)
                    Log.d("MainActivity", "BPM updated via Service broadcast: $updatedBpm")
                    bpm = updatedBpm
                }
            }
        }
        val filter = IntentFilter(MetronomeService.ACTION_BPM_UPDATED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
        onDispose {
            try {
                context.unregisterReceiver(receiver)
            } catch (unregisteredException: IllegalArgumentException) {
                Log.d("MainActivity", "BroadcastReceiver was already unregistered", unregisteredException)
            } catch (receiverException: Exception) {
                Log.w("MainActivity", "Error unregistering receiver", receiverException)
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF090D16)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PulseFit",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Watch,
                        contentDescription = "Galaxy Fit 3",
                        tint = Color(0xFFFB7185),
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Fit 3 Sincronizado",
                        color = Color(0xFF38BDF8),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Visual BPM Status Ring (Updates live when Fit 3 triggers +/- 5 BPM!)
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(210.dp)
                    .clip(CircleShape)
                    .background(
                        if (isPlaying) Color(0x33F43F5E) else Color(0xFF0F172A)
                    )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "$bpm",
                        fontSize = 64.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "BPM · EN RITMO",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF38BDF8)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Controlable ±5 desde Fit 3",
                        fontSize = 10.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            }

            // Mode indicator banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.VolumeUp,
                        contentDescription = null,
                        tint = Color(0xFF34D399),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Sonido en móvil · Vibración en Fit 3",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "El teléfono suena como metrónomo. La pulsera vibra en la muñeca.",
                            color = Color(0xFF94A3B8),
                            fontSize = 10.sp
                        )
                    }
                }
            }

            // --- THE 3 CORE BUTTONS ---
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // --- BOTÓN 1: PLAY Y STOP ---
                Button(
                    onClick = {
                        isPlaying = !isPlaying
                        Log.d("MainActivity", "User clicked Play/Stop. New isPlaying state: $isPlaying")
                        if (isPlaying) {
                            onStartService(bpm, beats, vibrationMs, vibratePhone)
                        } else {
                            onStopService()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(68.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isPlaying) Color(0xFFE11D48) else Color(0xFF059669)
                    )
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.size(28.dp),
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (isPlaying) "DETENER METRÓNOMO" else "1. INICIAR RITMO (PLAY)",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                // --- BOTÓN 2: AJUSTE DE TIEMPO (BPM) ---
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            Log.d("MainActivity", "User opened Tempo dialog")
                            showTempoDialog = true
                        },
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "2. AJUSTE DE TIEMPO",
                                color = Color(0xFF38BDF8),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "$bpm BPM",
                                color = Color.White,
                                fontSize = 26.sp,
                                fontWeight = FontWeight.ExtraBold,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Row {
                            IconButton(onClick = {
                                bpm = (bpm - 5).coerceAtLeast(30)
                                Log.d("MainActivity", "Decremented BPM (-5) to: $bpm")
                                onUpdateBpm(bpm)
                            }) {
                                Icon(Icons.Default.Remove, contentDescription = "-5", tint = Color.White)
                            }
                            IconButton(onClick = {
                                bpm = (bpm + 5).coerceAtMost(260)
                                Log.d("MainActivity", "Incremented BPM (+5) to: $bpm")
                                onUpdateBpm(bpm)
                            }) {
                                Icon(Icons.Default.Add, contentDescription = "+5", tint = Color.White)
                            }
                        }
                    }
                }

                // --- BOTÓN 3: AJUSTE DE COMPÁS ---
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            Log.d("MainActivity", "User opened Beats dialog")
                            showBeatsDialog = true
                        },
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131B2E))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "3. AJUSTE DE COMPÁS",
                                color = Color(0xFF34D399),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "$beats/4 TIEMPOS",
                                color = Color.White,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Icon(
                            imageVector = Icons.Default.Tune,
                            contentDescription = "Configurar",
                            tint = Color(0xFF34D399)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
        }

        // Tempo Dialog
        if (showTempoDialog) {
            AlertDialog(
                onDismissRequest = { showTempoDialog = false },
                title = { Text("Ajustar Tiempo (BPM)") },
                text = {
                    Column {
                        Text("Cadencia actual: $bpm BPM", fontWeight = FontWeight.Bold)
                        Slider(
                            value = bpm.toFloat(),
                            onValueChange = {
                                bpm = it.toInt()
                                Log.d("MainActivity", "Slider changed BPM to: $bpm")
                                onUpdateBpm(bpm)
                            },
                            valueRange = 40f..240f
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showTempoDialog = false }) {
                        Text("Aceptar")
                    }
                }
            )
        }

        // Beats Dialog
        if (showBeatsDialog) {
            AlertDialog(
                onDismissRequest = { showBeatsDialog = false },
                title = { Text("Ajustar Compás") },
                text = {
                    Column {
                        listOf(4, 3, 2, 1, 6).forEach { b ->
                            TextButton(
                                onClick = {
                                    beats = b
                                    Log.d("MainActivity", "User selected beats: $b/4")
                                    showBeatsDialog = false
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("$b/4 ${if (b == 4) "(Estándar)" else if (b == 1) "(Continuo)" else ""}")
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showBeatsDialog = false }) {
                        Text("Cerrar")
                    }
                }
            )
        }
    }
}
