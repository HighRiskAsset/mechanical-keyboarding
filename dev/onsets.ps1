$ErrorActionPreference = 'Stop'
$env:PATH += ';C:\Users\Foxglove\AppData\Local\Microsoft\WinGet\Links'

# Counts percussive attacks per second. Band-passes to 1.5-6 kHz first, which
# is where a drum transient lives and where the key clicks live too, so this
# measures the same thing the typing has to survive.
Add-Type -TypeDefinition @'
public class Onsets {
  public static double[] Envelope(short[] x, int sr, int hop){
    int n = x.Length / hop;
    double[] e = new double[n];
    for (int f = 0; f < n; f++){
      double s = 0;
      int b = f * hop;
      for (int i = 0; i < hop && b + i < x.Length; i++){ double v = x[b+i]/32768.0; s += v*v; }
      e[f] = System.Math.Sqrt(s / hop);
    }
    return e;
  }
}
'@

$bgm = 'C:\dev\mechanical-keyboarding\assets\bgm'
$scratch = Split-Path -Parent $MyInvocation.MyCommand.Path
$filter = if ($args.Count -gt 0) { $args[0] } else { '*' }
$rows = @()

foreach ($f in Get-ChildItem "$bgm\$filter.mp3" | Sort-Object Name) {
  $raw = Join-Path $scratch 'onset.pcm'
  # band-pass to the transient band, then down to mono 22.05k
  & ffmpeg -v error -y -i $f.FullName -af "highpass=f=1500,lowpass=f=6000" -f s16le -acodec pcm_s16le -ac 1 -ar 22050 $raw 2>$null
  $bytes = [System.IO.File]::ReadAllBytes($raw)
  $n = [int]($bytes.Length / 2)
  if ($n -lt 22050) { continue }
  $samples = New-Object 'System.Int16[]' $n
  [System.Buffer]::BlockCopy($bytes, 0, $samples, 0, $n * 2)

  $sr = 22050; $hop = 220                      # 10 ms frames
  $env = [Onsets]::Envelope($samples, $sr, $hop)
  $dur = $n / [double]$sr

  # an onset is a frame whose energy jumps well above the local average and
  # whose predecessor did not — a rising edge, not a loud patch
  $win = 20                                    # 200 ms of local context
  $onsets = 0; $armed = $true
  for ($i = $win; $i -lt $env.Length; $i++) {
    $sum = 0.0
    for ($k = $i - $win; $k -lt $i; $k++) { $sum += $env[$k] }
    $avg = $sum / $win
    if ($avg -le 0) { continue }
    if ($env[$i] -gt $avg * 1.8 -and $armed) { $onsets++; $armed = $false }
    elseif ($env[$i] -lt $avg * 1.2) { $armed = $true }
  }

  $per = [math]::Round($onsets / $dur, 2)
  $rows += [pscustomobject]@{
    Track    = $f.BaseName
    Sec      = [math]::Round($dur)
    Onsets   = $onsets
    PerSec   = $per
    PerMin   = [math]::Round($per * 60)
    Feel     = if ($per -ge 2.6) { 'BUSY  (double-time)' } elseif ($per -ge 1.6) { 'medium' } else { 'half-time' }
  }
  Remove-Item $raw -ErrorAction SilentlyContinue
}
$rows | Sort-Object PerSec -Descending | Format-Table -AutoSize
