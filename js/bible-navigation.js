import { BibleAPI } from './supabase-client.js';

// Bible books data (Reina Valera 1960)
export const BIBLE_BOOKS = [
    // Antiguo Testamento
    { name: 'Génesis', testament: 'Antiguo', chapters: 50 },
    { name: 'Éxodo', testament: 'Antiguo', chapters: 40 },
    { name: 'Levítico', testament: 'Antiguo', chapters: 27 },
    { name: 'Números', testament: 'Antiguo', chapters: 36 },
    { name: 'Deuteronomio', testament: 'Antiguo', chapters: 34 },
    { name: 'Josué', testament: 'Antiguo', chapters: 24 },
    { name: 'Jueces', testament: 'Antiguo', chapters: 21 },
    { name: 'Rut', testament: 'Antiguo', chapters: 4 },
    { name: '1 Samuel', testament: 'Antiguo', chapters: 31 },
    { name: '2 Samuel', testament: 'Antiguo', chapters: 24 },
    { name: '1 Reyes', testament: 'Antiguo', chapters: 22 },
    { name: '2 Reyes', testament: 'Antiguo', chapters: 25 },
    { name: '1 Crónicas', testament: 'Antiguo', chapters: 29 },
    { name: '2 Crónicas', testament: 'Antiguo', chapters: 36 },
    { name: 'Esdras', testament: 'Antiguo', chapters: 10 },
    { name: 'Nehemías', testament: 'Antiguo', chapters: 13 },
    { name: 'Ester', testament: 'Antiguo', chapters: 10 },
    { name: 'Job', testament: 'Antiguo', chapters: 42 },
    { name: 'Salmos', testament: 'Antiguo', chapters: 150 },
    { name: 'Proverbios', testament: 'Antiguo', chapters: 31 },
    { name: 'Eclesiastés', testament: 'Antiguo', chapters: 12 },
    { name: 'Cantares', testament: 'Antiguo', chapters: 8 },
    { name: 'Isaías', testament: 'Antiguo', chapters: 66 },
    { name: 'Jeremías', testament: 'Antiguo', chapters: 52 },
    { name: 'Lamentaciones', testament: 'Antiguo', chapters: 5 },
    { name: 'Ezequiel', testament: 'Antiguo', chapters: 48 },
    { name: 'Daniel', testament: 'Antiguo', chapters: 12 },
    { name: 'Oseas', testament: 'Antiguo', chapters: 14 },
    { name: 'Joel', testament: 'Antiguo', chapters: 3 },
    { name: 'Amós', testament: 'Antiguo', chapters: 9 },
    { name: 'Abdías', testament: 'Antiguo', chapters: 1 },
    { name: 'Jonás', testament: 'Antiguo', chapters: 4 },
    { name: 'Miqueas', testament: 'Antiguo', chapters: 7 },
    { name: 'Nahúm', testament: 'Antiguo', chapters: 3 },
    { name: 'Habacuc', testament: 'Antiguo', chapters: 3 },
    { name: 'Sofonías', testament: 'Antiguo', chapters: 3 },
    { name: 'Hageo', testament: 'Antiguo', chapters: 2 },
    { name: 'Zacarías', testament: 'Antiguo', chapters: 14 },
    { name: 'Malaquías', testament: 'Antiguo', chapters: 4 },
    // Nuevo Testamento
    { name: 'Mateo', testament: 'Nuevo', chapters: 28 },
    { name: 'Marcos', testament: 'Nuevo', chapters: 16 },
    { name: 'Lucas', testament: 'Nuevo', chapters: 24 },
    { name: 'Juan', testament: 'Nuevo', chapters: 21 },
    { name: 'Hechos', testament: 'Nuevo', chapters: 28 },
    { name: 'Romanos', testament: 'Nuevo', chapters: 16 },
    { name: '1 Corintios', testament: 'Nuevo', chapters: 16 },
    { name: '2 Corintios', testament: 'Nuevo', chapters: 13 },
    { name: 'Gálatas', testament: 'Nuevo', chapters: 6 },
    { name: 'Efesios', testament: 'Nuevo', chapters: 6 },
    { name: 'Filipenses', testament: 'Nuevo', chapters: 4 },
    { name: 'Colosenses', testament: 'Nuevo', chapters: 4 },
    { name: '1 Tesalonicenses', testament: 'Nuevo', chapters: 5 },
    { name: '2 Tesalonicenses', testament: 'Nuevo', chapters: 3 },
    { name: '1 Timoteo', testament: 'Nuevo', chapters: 6 },
    { name: '2 Timoteo', testament: 'Nuevo', chapters: 4 },
    { name: 'Tito', testament: 'Nuevo', chapters: 3 },
    { name: 'Filemón', testament: 'Nuevo', chapters: 1 },
    { name: 'Hebreos', testament: 'Nuevo', chapters: 13 },
    { name: 'Santiago', testament: 'Nuevo', chapters: 5 },
    { name: '1 Pedro', testament: 'Nuevo', chapters: 5 },
    { name: '2 Pedro', testament: 'Nuevo', chapters: 3 },
    { name: '1 Juan', testament: 'Nuevo', chapters: 5 },
    { name: '2 Juan', testament: 'Nuevo', chapters: 1 },
    { name: '3 Juan', testament: 'Nuevo', chapters: 1 },
    { name: 'Judas', testament: 'Nuevo', chapters: 1 },
    { name: 'Apocalipsis', testament: 'Nuevo', chapters: 22 }
];

export class BibleNavigation {
    constructor() {
        this.books = BIBLE_BOOKS;
        this.currentBook = null;
        this.currentChapter = null;
    }

    // Generate the Bible menu
    generateBibleMenu() {
        const bibleNavItem = document.querySelector('.nav-item.bible');
        if (!bibleNavItem) return;

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';

        // Add Search Bar
        dropdownMenu.appendChild(this.createSearchBar());

        // Add Old Testament Group
        dropdownMenu.appendChild(this.createTestamentGroup('Antiguo testamento', 'Antiguo'));

        // Add New Testament Group
        dropdownMenu.appendChild(this.createTestamentGroup('Nuevo testamento', 'Nuevo'));

        bibleNavItem.appendChild(dropdownMenu);
    }

    // Helper to create the search bar
    createSearchBar() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'bible-search-container';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Buscar... e.g. Genesis 1:1';
        searchInput.className = 'bible-search-input';

        searchInput.addEventListener('click', (e) => e.stopPropagation());

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(searchInput.value);
            }
        });

        searchContainer.appendChild(searchInput);
        return searchContainer;
    }

    // Handle the search logic
    handleSearch(query) {
        if (!query.trim()) return;

        const normalizedQuery = this.normalizeText(query.trim());

        // Regex to match: [Book] [Chapter] [Verse/Range]
        // Group 1: Book Name (allows numbers at start for 1 Samuel, etc)
        // Group 2: Chapter
        // Group 3: Optional start verse
        // Group 4: Optional end verse
        const regex = /^([1-3]?\s*[a-zñ]+(?:\s+[a-zñ]+)*)\s*(?:(\d+))?\s*(?:[:\s]\s*(\d+))?(?:\s*[-]\s*(\d+))?$/i;
        const match = normalizedQuery.match(regex);

        if (!match) {
            alert('Formato de búsqueda no reconocido. Use: Libro [Capítulo] [Versículo]');
            return;
        }

        const bookNameInput = match[1].trim();
        const chapter = match[2] ? parseInt(match[2]) : 1;
        const startVerse = match[3] ? parseInt(match[3]) : null;
        const endVerse = match[4] ? parseInt(match[4]) : null;

        // Find book index
        const bookIndex = this.books.findIndex(b =>
            this.normalizeText(b.name) === bookNameInput ||
            this.normalizeText(b.name).replace(/\s/g, '') === bookNameInput.replace(/\s/g, '')
        );

        if (bookIndex === -1) {
            alert('Libro no encontrado.');
            return;
        }

        const book = this.books[bookIndex];

        // Validate chapter
        if (chapter > book.chapters || chapter < 1) {
            alert(`El libro ${book.name} solo tiene ${book.chapters} capítulos.`);
            return;
        }

        this.navigateToChapter(bookIndex, chapter, { startVerse, endVerse });
    }

    normalizeText(text) {
        return text.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Helper to create a testament group
    createTestamentGroup(title, testamentValue) {
        const groupItem = document.createElement('div');
        groupItem.className = 'dropdown-item expandable';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'dropdown-item-header';
        groupHeader.innerHTML = `
            <span style="font-weight: 600; color: var(--accent-primary);">${title}</span>
            <span class="expand-arrow">▼</span>
        `;
        groupItem.appendChild(groupHeader);

        const booksSubmenu = document.createElement('div');
        booksSubmenu.className = 'submenu-vertical';

        this.books.forEach((book, index) => {
            if (book.testament === testamentValue) {
                booksSubmenu.appendChild(this.createBookItem(book, index));
            }
        });

        groupItem.appendChild(booksSubmenu);

        groupHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            groupItem.classList.toggle('expanded');
        });

        return groupItem;
    }

    // Helper to create an individual book item with chapters
    createBookItem(book, index) {
        const bookItem = document.createElement('div');
        bookItem.className = 'dropdown-item expandable';

        const bookHeader = document.createElement('div');
        bookHeader.className = 'dropdown-item-header';
        bookHeader.innerHTML = `
            <span>${book.name}</span>
            <span class="expand-arrow">▼</span>
        `;
        bookItem.appendChild(bookHeader);

        const chaptersSubmenu = document.createElement('div');
        chaptersSubmenu.className = 'submenu-vertical';

        for (let i = 1; i <= book.chapters; i++) {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'submenu-item';
            chapterItem.textContent = `Capítulo ${i}`;
            chapterItem.dataset.bookIndex = index;
            chapterItem.dataset.chapter = i;

            chapterItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateToChapter(index, i);
            });

            chaptersSubmenu.appendChild(chapterItem);
        }

        bookItem.appendChild(chaptersSubmenu);

        bookHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            bookItem.classList.toggle('expanded');
        });

        return bookItem;
    }

    // This method is no longer needed but keeping it for compatibility
    generateChaptersSubmenu(book, bookIndex) {
        return document.createElement('div');
    }

    // Navigate to a specific chapter
    navigateToChapter(bookIndex, chapterNumber, options = {}) {
        this.currentBook = bookIndex;
        this.currentChapter = chapterNumber;

        // Dispatch custom event for chapter navigation
        const event = new CustomEvent('navigateToChapter', {
            detail: {
                book: this.books[bookIndex],
                bookIndex: bookIndex,
                chapter: chapterNumber,
                ...options
            }
        });
        document.dispatchEvent(event);
    }

    // Get next chapter
    getNextChapter() {
        if (this.currentBook === null || this.currentChapter === null) return null;

        const currentBook = this.books[this.currentBook];

        if (this.currentChapter < currentBook.chapters) {
            return {
                bookIndex: this.currentBook,
                chapter: this.currentChapter + 1
            };
        } else if (this.currentBook < this.books.length - 1) {
            return {
                bookIndex: this.currentBook + 1,
                chapter: 1
            };
        }

        return null;
    }

    // Get previous chapter
    getPreviousChapter() {
        if (this.currentBook === null || this.currentChapter === null) return null;

        if (this.currentChapter > 1) {
            return {
                bookIndex: this.currentBook,
                chapter: this.currentChapter - 1
            };
        } else if (this.currentBook > 0) {
            const previousBook = this.books[this.currentBook - 1];
            return {
                bookIndex: this.currentBook - 1,
                chapter: previousBook.chapters
            };
        }

        return null;
    }
}

// Generate Studies menu
export function generateStudiesMenu() {
    const studiesNavItem = document.querySelector('.nav-item.studies');
    if (!studiesNavItem) return;

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';

    // Helper to create a testament group for studies
    const createStudyTestamentGroup = (title, testamentValue) => {
        const groupItem = document.createElement('div');
        groupItem.className = 'dropdown-item expandable';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'dropdown-item-header';
        groupHeader.innerHTML = `
            <span style="font-weight: 600; color: var(--accent-primary);">${title}</span>
            <span class="expand-arrow">▼</span>
        `;
        groupItem.appendChild(groupHeader);

        const booksSubmenu = document.createElement('div');
        booksSubmenu.className = 'submenu-vertical';

        BIBLE_BOOKS.forEach((book, index) => {
            if (book.testament === testamentValue) {
                const bookItem = document.createElement('div');
                bookItem.className = 'submenu-item';
                bookItem.textContent = book.name;
                bookItem.dataset.bookIndex = index;

                bookItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const event = new CustomEvent('navigateToBookStudy', {
                        detail: {
                            book: book,
                            bookIndex: index
                        }
                    });
                    document.dispatchEvent(event);
                });

                booksSubmenu.appendChild(bookItem);
            }
        });

        groupItem.appendChild(booksSubmenu);
        groupHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            groupItem.classList.toggle('expanded');
        });

        return groupItem;
    };

    // Estudios de libros header (optional, if we want to keep the "Estudios de libros" level)
    // The user asked to group them, so let's put OT and NT directly or inside a "Libros" item.
    // Based on "agregar en Biblia... un menu que agrupe todos los libros del Antiguo testamento y otro mas abajo que diga Nuevo testamento"
    // I will put them directly.

    dropdownMenu.appendChild(createStudyTestamentGroup('Antiguo testamento', 'Antiguo'));
    dropdownMenu.appendChild(createStudyTestamentGroup('Nuevo testamento', 'Nuevo'));

    // Estudios temáticos
    const thematicStudiesItem = document.createElement('div');
    thematicStudiesItem.className = 'dropdown-item';
    thematicStudiesItem.textContent = 'Estudios temáticos';

    thematicStudiesItem.addEventListener('click', (e) => {
        e.stopPropagation();
        const event = new CustomEvent('navigateToThematicStudies');
        document.dispatchEvent(event);
    });

    dropdownMenu.appendChild(thematicStudiesItem);

    studiesNavItem.appendChild(dropdownMenu);
}
