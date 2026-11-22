# Prácticas de Glhea

Prácticas interactivas de español. Página principal: `index.html` (se arma sola desde `practices.js`).

## Añadir una práctica nueva
1. Sube el archivo de la práctica, por ejemplo `pasado.html`. Debe cargar `firebase-config.js` y `track.js`
   (copia uno de los existentes como base).
2. Abre `practices.js` y agrega una línea:
   `{ id: "pasado", title: "Past tense", desc: "Short description · 30 questions" }`
   - `id` = nombre del archivo sin `.html` (mínimo 3 letras, minúsculas, sin espacios).
3. Listo: aparece en la página principal y en el panel del profesor (`profe.html`).

La tarjeta pasa sola de **New** → **In progress** → **✓ Completed** según lo que haga Glhea.

## Archivos
- `track.js`: guarda resultados y progreso (Firebase Firestore).
- `firestore.rules`: reglas de seguridad que se pegan en la consola de Firebase.
- `profe.html`: panel del profesor (requiere login).
