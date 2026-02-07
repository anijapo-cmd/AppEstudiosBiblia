import { BibleAPI } from './supabase-client.js';
import { BIBLE_BOOKS } from './bible-navigation.js';

export class ChapterViewer {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.currentBook = null;
    this.currentChapter = null;
    this.bookData = null;
  }

  async render(bookIndex, chapterNumber, options = {}) {
    this.currentBook = bookIndex;
    this.currentChapter = chapterNumber;
    this.bookData = BIBLE_BOOKS[bookIndex];
    this.navOptions = options;

    const verses = await BibleAPI.getChapter(bookIndex + 1, chapterNumber);

    if (!verses || verses.length === 0) {
      this.renderPlaceholder();
      return;
    }

    this.container.innerHTML = `
      <div class="chapter-viewer fade-in">
        <div class="chapter-header">
          <h1 class="chapter-title">${this.bookData.name} ${chapterNumber}</h1>
        </div>
        <div class="chapter-content">
          ${this.formatVerses(verses, options)}
        </div>
      </div>
      ${this.renderNavigationArrows()}
    `;

    this.attachArrowListeners();

    if (options.startVerse) {
      setTimeout(() => {
        const verse = document.querySelector(`.verse[data-verse="${options.startVerse}"]`);
        if (verse) {
          verse.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }

  formatVerses(verses, options = {}) {
    return verses.map(verse => {
      const isHighlighted = options.startVerse && (
        (!options.endVerse && verse.verse_number == options.startVerse) ||
        (options.endVerse && verse.verse_number >= options.startVerse && verse.verse_number <= options.endVerse)
      );

      return `
          <p class="verse ${isHighlighted ? 'highlighted' : ''}" data-verse="${verse.verse_number}">
            <span class="verse-number">${verse.verse_number}</span>
            ${verse.text}
          </p>
        `;
    }).join('');
  }


  renderPlaceholder() {
    this.container.innerHTML = `
      <div class="chapter-viewer fade-in">
        <div class="chapter-header">
          <h1 class="chapter-title">${this.bookData.name} ${this.currentChapter}</h1>
        </div>
        <div class="chapter-content">
          <p style="text-align: center; color: var(--text-muted); padding: 2rem;">
            El contenido de este capítulo aún no está disponible.
          </p>
        </div>
      </div>
      ${this.renderNavigationArrows()}
    `;

    this.attachArrowListeners();
  }

  renderNavigationArrows() {
    const hasPrevious = this.currentChapter > 1 || this.currentBook > 0;
    const hasNext = this.currentChapter < this.bookData.chapters ||
      this.currentBook < BIBLE_BOOKS.length - 1;

    return `
      <div class="chapter-nav-arrows left">
        <button class="nav-arrow" id="prev-chapter" ${!hasPrevious ? 'disabled' : ''}>
          ←
        </button>
      </div>
      <div class="chapter-nav-arrows right">
        <button class="nav-arrow" id="next-chapter" ${!hasNext ? 'disabled' : ''}>
          →
        </button>
      </div>
    `;
  }

  attachArrowListeners() {
    const prevBtn = document.getElementById('prev-chapter');
    const nextBtn = document.getElementById('next-chapter');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigatePrevious());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateNext());
    }
  }

  navigatePrevious() {
    if (this.currentChapter > 1) {
      this.render(this.currentBook, this.currentChapter - 1);
    } else if (this.currentBook > 0) {
      const previousBook = BIBLE_BOOKS[this.currentBook - 1];
      this.render(this.currentBook - 1, previousBook.chapters);
    }
  }

  navigateNext() {
    if (this.currentChapter < this.bookData.chapters) {
      this.render(this.currentBook, this.currentChapter + 1);
    } else if (this.currentBook < BIBLE_BOOKS.length - 1) {
      this.render(this.currentBook + 1, 1);
    }
  }
}
