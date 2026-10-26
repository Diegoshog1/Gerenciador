# Vidro — tela inicial para Google TV

A interface inteira é `app/src/main/assets/index.html` (dá pra abrir no navegador do PC para testar com as setas).
O app Android só carrega essa página e oferece a ponte `window.TV` (lista de apps, abrir app, configurações, entradas, busca).

O APK é gerado pelo GitHub Actions (workflow "Vidro (APK da Google TV)") e fica em *Artifacts* como `Vidro-apk`.

Instalar pelo PC/Ally com ADB:

    adb connect IP_DA_TV:5555
    adb install -r Vidro.apk
