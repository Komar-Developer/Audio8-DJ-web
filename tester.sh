#!/bin/bash
# Audio 8 DJ tester: checks the Mac, the driver and the sound at 44.1 / 48 / 88.2 / 96 kHz,
# writes ~/Desktop/a8dj-tester.txt and opens a pre-filled GitHub report.
#   curl -fsSL https://komar-developer.github.io/Audio8-DJ-web/tester.sh | bash
REPO="Komar-Developer/Audio8-DJ-web"
OUT="$HOME/Desktop/a8dj-tester.txt"
case "$(defaults read -g AppleLocale 2>/dev/null)" in es*) ES=1 ;; *) ES=0 ;; esac
t() { if [ "$ES" = 1 ]; then printf '%s' "$1"; else printf '%s' "$2"; fi; }
ask() { local a; printf '\n%s ' "$1" > /dev/tty; read -r a < /dev/tty; printf '%s' "$a"; }
T() { perl -e 'alarm shift; exec @ARGV' "$@"; }
note() { echo "$*" >> "$OUT"; }

[ "$(uname)" = "Darwin" ] || { echo "$(t 'Este test es para Mac.' 'This test is for Mac.')"; exit 1; }
: > "$OUT"
echo; echo "== Audio 8 DJ tester =="
echo "$(t 'Conecta la Audio 8 DJ y unos auriculares o altavoces a la salida A (1/2).' 'Connect the Audio 8 DJ and headphones or speakers to output A (1/2).')"

ARCH=$(uname -m); CHIP=$(sysctl -n machdep.cpu.brand_string 2>/dev/null)
MODEL=$(sysctl -n hw.model 2>/dev/null); MACOS="$(sw_vers -productVersion) ($(sw_vers -buildVersion))"
DRV=/Library/Audio/Plug-Ins/HAL/OpenA8DJ.driver
APP="/Applications/OpenA8DJ Control Center.app"
DV=$(defaults read "$DRV/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo "-")
DA=$(lipo -archs "$DRV/Contents/MacOS/OpenA8DJHAL" 2>/dev/null || echo "-")
AV=$(defaults read "$APP/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo "-")
USB=$(ioreg -p IOUSB -w0 2>/dev/null | grep -io "Audio 8[^<@]*" | head -1)
note "Audio 8 DJ tester  $(date '+%Y-%m-%d %H:%M')"
note "Mac: $MODEL · $CHIP · $ARCH"; note "macOS: $MACOS"
note "Driver: $DV ($DA) · App: $AV"; note "USB: ${USB:-not found}"

if [ "$DV" = "-" ]; then echo "$(t 'No encuentro el driver instalado. Instala primero el DMG.' 'The driver is not installed. Install the DMG first.')"; note "RESULT: driver not installed"; fi
if [ -z "$USB" ]; then echo "$(t 'No veo la Audio 8 DJ por USB. Conectala y vuelve a lanzar el test.' 'The Audio 8 DJ is not on USB. Connect it and run the test again.')"; fi

DEV=$(say -a '?' 2>/dev/null | grep -i "audio 8" | head -1 | awk '{print $1}')
note "Output device for say: ${DEV:-none}"
RES=""
if [ -n "$DEV" ] && [ "$DV" != "-" ]; then
  for R in 44100 48000 88200 96000; do
    K=$(awk "BEGIN{printf \"%g\", $R/1000}")
    a=$(ask "$(t "Pon $K kHz en el icono A8 de la barra de menus (Frequency) y pulsa Intro. Escribe x para saltarla:" "Set $K kHz in the A8 menu bar icon (Frequency) and press Enter. Type x to skip it:")")
    [ "$a" = "x" ] && { RES="$RES $K:skip"; note "$R: skipped"; continue; }
    CUR=$(system_profiler SPAudioDataType 2>/dev/null | awk '/Audio 8/{f=1} f&&/Current SampleRate/{print $3; exit}')
    say -a "$DEV" "$(t "Prueba de Audio 8 a $K kilohercios. Uno, dos, tres, cuatro, cinco." "Audio 8 test at $K kilohertz. One, two, three, four, five.")"
    STATS=$(T 6 /usr/local/bin/opena8dj-control stream-stats 2>&1 | grep -E "sample-rate|underrun|timeline" | head -4 | tr '\n' ' ')
    ok=$(ask "$(t '¿Se ha oido bien, sin cortes ni ruido? (s/n):' 'Did it sound right, no dropouts or noise? (y/n):')")
    case "$ok" in s*|S*|y*|Y*) v=ok ;; *) v=FAIL ;; esac
    RES="$RES $K:$v"; note "$R: $v (device rate ${CUR:-?}) $STATS"
  done
else
  note "Sound test: not run"
fi

DJ=$(ask "$(t '¿Que software de DJ has probado y como ha ido? (Intro para omitir):' 'Which DJ software did you try and how did it go? (Enter to skip):')")
note "DJ software: $DJ"
note ""; note "== system_profiler SPAudioDataType (Audio 8)"
system_profiler SPAudioDataType 2>/dev/null | awk '/Audio 8/{f=1} f{print; n++} n>12{exit}' >> "$OUT"
note ""; note "== driver log (last 3 min)"
log show --last 3m --style compact --predicate 'eventMessage CONTAINS "A8DJ" OR eventMessage CONTAINS "OpenA8DJ"' 2>/dev/null | tail -60 >> "$OUT"
echo; echo "$(t 'Informe guardado en' 'Report saved to') $OUT"

enc() { osascript -l JavaScript -e 'function run(a){return encodeURIComponent(a[0])}' "$1"; }
SUM="Sound:${RES:- not run}"
URL="https://github.com/$REPO/issues/new?template=tester.yml&title=$(enc "[Tester Apple Silicon] $MODEL · macOS $(sw_vers -productVersion)")&mac=$(enc "$MODEL · $CHIP · $ARCH")&macos=$(enc "$MACOS")&version=$(enc "Driver $DV ($DA) · App $AV")&dj=$(enc "$DJ")&result=$(enc "$SUM")"
echo "$(t 'Se abre el informe en GitHub: arrastra a8dj-tester.txt del Escritorio al recuadro y pulsa Create.' 'The GitHub report opens: drag a8dj-tester.txt from the Desktop into the box and click Create.')"
open "$URL"
