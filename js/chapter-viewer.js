import { BibleAPI } from './supabase-client.js';
import { BIBLE_BOOKS } from './bible-navigation.js';

export class ChapterViewer {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.currentBook = null;
    this.currentChapter = null;
    this.bookData = null;
  }

  async render(bookIndex, chapterNumber) {
    this.currentBook = bookIndex;
    this.currentChapter = chapterNumber;
    this.bookData = BIBLE_BOOKS[bookIndex];

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
          ${this.formatVerses(verses)}
        </div>
      </div>
      ${this.renderNavigationArrows()}
    `;

    this.attachArrowListeners();
    this.setupScrollTracking();
  }

  formatVerses(verses) {
    return verses.map(verse => `
          <p class="verse">
            <span class="verse-number">${verse.verse_number}</span>
            ${verse.text}
          </p>
        `).join('');
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
    this.setupScrollTracking();
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

  setupScrollTracking() {
    const leftArrows = document.querySelector('.chapter-nav-arrows.left');
    const rightArrows = document.querySelector('.chapter-nav-arrows.right');

    if (!leftArrows || !rightArrows) return;

    const updateArrowPosition = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Calculate the center position
      const centerY = scrollY + (windowHeight / 2);
      const maxY = documentHeight - (windowHeight / 2);
      const minY = windowHeight / 2;

      const clampedY = Math.max(minY, Math.min(centerY, maxY));

      leftArrows.style.top = `${clampedY}px`;
      rightArrows.style.top = `${clampedY}px`;
    };

    window.addEventListener('scroll', updateArrowPosition);
    window.addEventListener('resize', updateArrowPosition);

    // Initial position
    updateArrowPosition();
  }
}
