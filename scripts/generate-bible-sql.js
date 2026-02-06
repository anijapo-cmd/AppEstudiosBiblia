// Script Node.js para descargar y procesar la Biblia RV1960
// Este script descarga el JSON completo y genera inserts SQL

const https = require('https');
const fs = require('fs');

const BIBLE_URL = 'https://raw.githubusercontent.com/dscottpi/bibles/master/RVR1960%20-%20Spanish.json';

// Mapeo de nombres de libros a IDs
const bookMapping = {
    'Génesis': 1, 'Éxodo': 2, 'Levítico': 3, 'Números': 4, 'Deuteronomio': 5,
    'Josué': 6, 'Jueces': 7, 'Rut': 8, '1 Samuel': 9, '2 Samuel': 10,
    '1 Reyes': 11, '2 Reyes': 12, '1 Crónicas': 13, '2 Crónicas': 14, 'Esdras': 15,
    'Nehemías': 16, 'Ester': 17, 'Job': 18, 'Salmos': 19, 'Proverbios': 20,
    'Eclesiastés': 21, 'Cantares': 22, 'Isaías': 23, 'Jeremías': 24, 'Lamentaciones': 25,
    'Ezequiel': 26, 'Daniel': 27, 'Oseas': 28, 'Joel': 29, 'Amós': 30,
    'Abdías': 31, 'Jonás': 32, 'Miqueas': 33, 'Nahúm': 34, 'Habacuc': 35,
    'Sofonías': 36, 'Hageo': 37, 'Zacarías': 38, 'Malaquías': 39,
    'Mateo': 40, 'Marcos': 41, 'Lucas': 42, 'Juan': 43, 'Hechos': 44,
    'Romanos': 45, '1 Corintios': 46, '2 Corintios': 47, 'Gálatas': 48, 'Efesios': 49,
    'Filipenses': 50, 'Colosenses': 51, '1 Tesalonicenses': 52, '2 Tesalonicenses': 53, '1 Timoteo': 54,
    '2 Timoteo': 55, 'Tito': 56, 'Filemón': 57, 'Hebreos': 58, 'Santiago': 59,
    '1 Pedro': 60, '2 Pedro': 61, '1 Juan': 62, '2 Juan': 63, '3 Juan': 64,
    'Judas': 65, 'Apocalipsis': 66
};

console.log('Descargando Biblia RV1960...');

https.get(BIBLE_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Descarga completada. Procesando...');

        const bibleData = JSON.parse(data);
        let sqlOutput = '-- Biblia Reina-Valera 1960 - Importación Completa\n';
        sqlOutput += '-- Generado automáticamente\n\n';
        sqlOutput += 'BEGIN;\n\n';

        let totalVerses = 0;

        for (const [bookName, chapters] of Object.entries(bibleData)) {
            const bookId = bookMapping[bookName];

            if (!bookId) {
                console.log(`Advertencia: Libro no mapeado: ${bookName}`);
                continue;
            }

            console.log(`Procesando: ${bookName} (ID: ${bookId})...`);

            sqlOutput += `-- ${bookName}\n`;

            for (const [chapterNum, verses] of Object.entries(chapters)) {
                for (const [verseNum, verseText] of Object.entries(verses)) {
                    const cleanText = verseText.trim().replace(/'/g, "''");
                    sqlOutput += `INSERT INTO bible_verses (book_id, chapter_number, verse_number, text) VALUES (${bookId}, ${chapterNum}, ${verseNum}, '${cleanText}');\n`;
                    totalVerses++;
                }
            }

            sqlOutput += '\n';
        }

        sqlOutput += 'COMMIT;\n';

        fs.writeFileSync('bible_complete_rv1960.sql', sqlOutput);
        console.log(`\n✓ Completado!`);
        console.log(`Total de versículos: ${totalVerses}`);
        console.log(`Archivo generado: bible_complete_rv1960.sql`);
    });
}).on('error', (err) => {
    console.error('Error descargando:', err.message);
});
