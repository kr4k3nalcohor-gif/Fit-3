/**
 * Generates an authentic high-resolution square album artwork (carátula)
 * for PulseFit that matches the Samsung Galaxy Fit 3 Media Controller display.
 * The carátula displays the dynamic BPM, athletic pulse rings, and tempo marking.
 */

export function generateCaratulaDataUrl(
  bpm: number,
  beats: number,
  currentBeat: number,
  isPlaying: boolean
): string {
  if (typeof document === 'undefined') return '/caratula-fit3.png';

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '/caratula-fit3.png';

  // Background deep dark sporty gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 512);
  bgGrad.addColorStop(0, '#090D16');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Outer ambient glow ring
  const centerX = 256;
  const centerY = 256;

  const glowGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 240);
  if (isPlaying) {
    const isAccent = currentBeat === 0;
    glowGrad.addColorStop(0, isAccent ? 'rgba(244, 63, 94, 0.45)' : 'rgba(56, 189, 248, 0.35)');
    glowGrad.addColorStop(0.6, isAccent ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.1)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    glowGrad.addColorStop(0, 'rgba(51, 65, 85, 0.3)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric tempo track circles
  ctx.lineWidth = 3;
  ctx.strokeStyle = isPlaying ? 'rgba(56, 189, 248, 0.25)' : 'rgba(51, 65, 85, 0.2)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = isPlaying ? (currentBeat === 0 ? '#F43F5E' : '#38BDF8') : '#475569';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
  ctx.stroke();

  // Pulse wave arcs (Soundcorset athletic style)
  const numBars = 32;
  for (let i = 0; i < numBars; i++) {
    const angle = (i / numBars) * Math.PI * 2;
    const barHeight = isPlaying ? 10 + Math.sin((i + currentBeat * 4) * 0.8) * 16 : 8;
    const r1 = 160;
    const r2 = r1 + barHeight;

    const x1 = centerX + Math.cos(angle) * r1;
    const y1 = centerY + Math.sin(angle) * r1;
    const x2 = centerX + Math.cos(angle) * r2;
    const y2 = centerY + Math.sin(angle) * r2;

    ctx.strokeStyle = isPlaying
      ? i % 4 === 0
        ? '#F43F5E'
        : '#38BDF8'
      : '#334155';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('PULSEFIT • GALAXY FIT 3', centerX, 68);

  // Big Central BPM Display
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 108px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${bpm}`, centerX, 260);

  // Subtitle "BPM"
  ctx.fillStyle = isPlaying ? '#38BDF8' : '#64748B';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('BPM • EN RITMO', centerX, 305);

  // Beat Dots indicator
  const dotSpacing = 28;
  const startX = centerX - ((beats - 1) * dotSpacing) / 2;
  const dotY = 350;

  for (let b = 0; b < beats; b++) {
    const dx = startX + b * dotSpacing;
    const isActive = isPlaying && b === currentBeat;
    const isFirst = b === 0;

    ctx.beginPath();
    ctx.arc(dx, dotY, isActive ? 9 : 6, 0, Math.PI * 2);

    if (isActive) {
      ctx.fillStyle = isFirst ? '#F43F5E' : '#38BDF8';
      ctx.shadowColor = isFirst ? '#F43F5E' : '#38BDF8';
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = '#334155';
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Footer marking (Moderato / Allegro etc.)
  let tempoLabel = 'MODERATO';
  if (bpm < 80) tempoLabel = 'ANDANTE / ADAGIO';
  else if (bpm < 120) tempoLabel = 'MODERATO';
  else if (bpm < 160) tempoLabel = 'ALLEGRO';
  else if (bpm < 185) tempoLabel = 'RUNNING CADENCE';
  else tempoLabel = 'PRESTO / SPRINT';

  ctx.fillStyle = '#F43F5E';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(`${tempoLabel} • COMPÁS ${beats}/4`, centerX, 445);

  return canvas.toDataURL('image/png');
}
