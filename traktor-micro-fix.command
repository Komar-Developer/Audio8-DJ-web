#!/bin/bash
# Da a Traktor permiso de micrófono (entrada de audio) directamente en TCC.db.
DB="$HOME/Library/Application Support/com.apple.TCC/TCC.db"
NOW=$(date +%s)

echo "== Permiso de micrófono para Traktor =="

if ! sqlite3 "$DB" "select count(*) from access;" >/dev/null 2>&1; then
  echo
  echo "Terminal no puede leer los permisos de macOS."
  echo "Ve a Ajustes del Sistema > Privacidad y seguridad > Acceso total al disco,"
  echo "activa Terminal, cierra Terminal por completo y vuelve a abrir este archivo."
  open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles" 2>/dev/null
  read -r -p "Pulsa Intro para salir." _
  exit 1
fi

IDS=""
while IFS= read -r app; do
  [ -d "$app" ] || continue
  id=$(defaults read "$app/Contents/Info" CFBundleIdentifier 2>/dev/null) || continue
  case " $IDS " in *" $id "*) ;; *) IDS="$IDS $id"; echo "Encontrado: $app ($id)";; esac
done < <(mdfind "kMDItemCFBundleIdentifier == 'com.native-instruments.Traktor*'" 2>/dev/null; ls -d /Applications/Native\ Instruments/Traktor*/Traktor*.app /Applications/Traktor*.app 2>/dev/null)

if [ -z "$IDS" ]; then
  echo "No encuentro Traktor en este Mac."
  read -r -p "Pulsa Intro para salir." _
  exit 1
fi

cp "$DB" "$HOME/Desktop/TCC-copia-$NOW.db" && echo "Copia de seguridad: ~/Desktop/TCC-copia-$NOW.db"
osascript -e 'tell application id "com.native-instruments.Traktor" to quit' >/dev/null 2>&1
pkill -x "Traktor Pro 4" 2>/dev/null; pkill -x "Traktor Pro 3" 2>/dev/null; sleep 1

for id in $IDS; do
  sqlite3 "$DB" "DELETE FROM access WHERE service='kTCCServiceMicrophone' AND client='$id';
INSERT INTO access (service, client, client_type, auth_value, auth_reason, auth_version, flags, last_modified)
VALUES ('kTCCServiceMicrophone', '$id', 0, 2, 2, 1, 0, $NOW);" \
    && echo "Permiso concedido: $id" || echo "No se pudo escribir el permiso para $id"
done

killall tccd 2>/dev/null
echo
sqlite3 "$DB" "select client, auth_value from access where service='kTCCServiceMicrophone' and client like 'com.native-instruments.Traktor%';" \
  | sed 's/|2$/  -> permitido/'
echo
echo "Listo. Abre Traktor: debe aparecer en Ajustes > Privacidad y seguridad > Micrófono."
echo "Puedes quitar a Terminal de 'Acceso total al disco' cuando acabes."
read -r -p "Pulsa Intro para cerrar." _
exit 0
