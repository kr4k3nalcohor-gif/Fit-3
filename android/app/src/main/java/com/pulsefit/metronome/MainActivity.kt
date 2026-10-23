package com.pulsefit.metronome

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.material.icons.filled.Watch
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            PulseFitNativeApp(
                onStartService = { bpm, beats, vibrationMs ->
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_START
                        putExtra(MetronomeService.EXTRA_BPM, bpm)
                        putExtra(MetronomeService.EXTRA_BEATS, beats)
                        putExtra(MetronomeService.EXTRA_VIBRATION_MS, vibrationMs)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(intent)
                    } else {
                        startService(intent)
                    }
                },
                onStopService = {
                    val intent = Intent(this, MetronomeService::class.java).apply {
                        action = MetronomeService.ACTION_STOP
                    }
                    startService(intent)
                },
                onUpdateBpm = { bpm ->
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
    onStartService: (bpm: Int, beats: Int, vibrationMs: Long) -> Unit,
    onStopService: () -> Unit,
    onUpdateBpm: (bpm: Int) -> Unit
) {
    var isPlaying by remember { mutableStateOf(false) }
    var bpm by remember { mutableStateOf(160) }
    var beats by remember { mutableStateOf(4) }
    var vibrationMs by remember { mutableStateOf(85L) }
    var showTempoDialog by remember { mutableStateOf(false) }
    var showBeatsDialog by remember { mutableStateOf(false) }

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
                    text = "PulseFit APK",
                    color = Color.White,
                    fontSize = 22.sp,
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
                        text = "Samsung Fit 3 Sync",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // Visual BPM Status Ring
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(200.dp)
                    .clip(CircleShape)
                    .background(
                        if (isPlaying) Color(0x33F43F5E) else Color(0xFF0F172A)
                    )
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "$bpm",
                        fontSize = 58.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "BPM · CADENCIA",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF38BDF8)
                    )
                }
            }

            // --- THE 3 REQUESTED BUTTONS ---
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // --- BOTÓN 1: PLAY Y STOP ---
                Button(
                    onClick = {
                        isPlaying = !isPlaying
                        if (isPlaying) {
                            onStartService(bpm, beats, vibrationMs)
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
                        .clickable { showTempoDialog = true },
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
                                onUpdateBpm(bpm)
                            }) {
                                Icon(Icons.Default.Remove, contentDescription = "-5", tint = Color.White)
                            }
                            IconButton(onClick = {
                                bpm = (bpm + 5).coerceAtMost(260)
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
                        .clickable { showBeatsDialog = true },
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
