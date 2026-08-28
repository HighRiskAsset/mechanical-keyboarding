$ErrorActionPreference = 'Stop'
$env:PATH += ';C:\Users\Foxglove\AppData\Local\Microsoft\WinGet\Links'

Add-Type -TypeDefinition @'
public class Chroma {
  public static double[] Analyze(short[] x, int sr){
    double[] ch = new double[12];
    int N = x.Length;
    double[] buf = new double[N];
    for (int i=0;i<N;i++) buf[i] = x[i]/32768.0;
    for (int m=36; m<84; m++){
      double f = 440.0*System.Math.Pow(2.0,(m-69)/12.0);
      double w = 2.0*System.Math.PI*f/sr;
      double cw = System.Math.Cos(w), sw = System.Math.Sin(w);
      double coeff = 2.0*cw;
      double s1=0, s2=0, s0=0;
      for (int i=0;i<N;i++){ s0 = buf[i] + coeff*s1 - s2; s2 = s1; s1 = s0; }
      double re = s1 - s2*cw, im = s2*sw;
      ch[m%12] += System.Math.Sqrt(re*re + im*im)/N;
    }
    return ch;
  }
}
'@

$NOTES = @('C','C#','D','D#','E','F','F#','G','G#','A','A#','B')
$MAJ = @(6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88)
$MIN = @(6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17)

function Pearson($a,$b){
  $n=$a.Count; $ma=($a|Measure-Object -Average).Average; $mb=($b|Measure-Object -Average).Average
  $num=0.0; $da=0.0; $db=0.0
  for($i=0;$i -lt $n;$i++){ $x=$a[$i]-$ma; $y=$b[$i]-$mb; $num+=$x*$y; $da+=$x*$x; $db+=$y*$y }
  if($da -eq 0 -or $db -eq 0){ return 0 }
  return $num/[Math]::Sqrt($da*$db)
}

$bgm = 'C:\dev\mechanical-keyboarding\assets\bgm'
$scratch = Split-Path -Parent $MyInvocation.MyCommand.Path
$results = @()

$filter = if ($args.Count -gt 0) { $args[0] } else { '*' }
foreach ($f in Get-ChildItem "$bgm\$filter.mp3" | Sort-Object Name) {
  $raw = Join-Path $scratch 'tmp.pcm'
  $dur = [double](& ffprobe -v error -show_entries format=duration -of csv=p=0 $f.FullName)
  $start = [Math]::Max(0, $dur*0.15)
  $len = [Math]::Min(45, $dur*0.7)
  & ffmpeg -v error -y -ss $start -t $len -i $f.FullName -f s16le -acodec pcm_s16le -ac 1 -ar 22050 $raw 2>$null
  $bytes = [System.IO.File]::ReadAllBytes($raw)
  $n = [int]($bytes.Length/2)
  $samples = New-Object 'System.Int16[]' $n
  [System.Buffer]::BlockCopy($bytes,0,$samples,0,$n*2)

  $ch = [Chroma]::Analyze($samples, 22050)
  $sum = ($ch | Measure-Object -Sum).Sum
  $chn = @(); foreach($v in $ch){ $chn += ($v/$sum) }

  $best = -2.0; $bestKey = 0; $bestMode = 'major'
  for ($r=0; $r -lt 12; $r++){
    $rot = @(); for($i=0;$i -lt 12;$i++){ $rot += $chn[($i+$r)%12] }
    $rMaj = Pearson $rot $MAJ
    $rMin = Pearson $rot $MIN
    if ($rMaj -gt $best){ $best=$rMaj; $bestKey=$r; $bestMode='major' }
    if ($rMin -gt $best){ $best=$rMin; $bestKey=$r; $bestMode='minor' }
  }

  # scale-degree strengths relative to detected tonic
  $deg = @(); for($i=0;$i -lt 12;$i++){ $deg += $chn[($i+$bestKey)%12] }
  $b3=$deg[3]; $n3=$deg[4]; $b6=$deg[8]; $n6=$deg[9]; $b7=$deg[10]; $n7=$deg[11]

  $mode = if ($n3 -gt $b3) { if ($b7 -gt $n7) {'mixolydian'} else {'ionian/major'} }
          else { if ($n6 -gt $b6) {'DORIAN'} else {'aeolian/minor'} }

  $results += [pscustomobject]@{
    Track = $f.BaseName
    Key   = "$($NOTES[$bestKey]) $bestMode"
    Mode  = $mode
    Conf  = '{0:N2}' -f $best
    third = '{0:N3}/{1:N3}' -f $b3,$n3
    sixth = '{0:N3}/{1:N3}' -f $b6,$n6
    sevth = '{0:N3}/{1:N3}' -f $b7,$n7
  }
  Remove-Item $raw -ErrorAction SilentlyContinue
}
$results | Format-Table -AutoSize
