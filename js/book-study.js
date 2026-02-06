import { StudiesAPI } from './supabase-client.js';
import { BIBLE_BOOKS } from './bible-navigation.js';

export class BookStudyEditor {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.currentBookIndex = null;
    this.currentBook = null;
    this.isEditMode = false;
    this.studyData = null;
    this.originalData = null;
    this.outlineDraft = { chapters: '', title: '', points: [], step: 1 }; // 1: chapters, 2: title, 3: points
  }

  async render(bookIndex) {
    this.currentBookIndex = bookIndex;
    this.currentBook = BIBLE_BOOKS[bookIndex];

    // Load study data from Supabase
    this.studyData = await StudiesAPI.getBookStudy(bookIndex + 1);

    if (!this.studyData) {
      this.studyData = this.getEmptyStudyData();
    }

    this.originalData = JSON.parse(JSON.stringify(this.studyData));

    this.container.innerHTML = this.renderHTML();
    this.attachEventListeners();
  }

  refresh() {
    this.collectFormValues();
    this.container.innerHTML = this.renderHTML();
    this.attachEventListeners();
  }

  collectFormValues() {
    if (!this.isEditMode) return;

    const values = {
      keyword_title: document.getElementById('keyword-title')?.value,
      keyword_content: document.getElementById('keyword-content')?.value,
      gospel_title: document.getElementById('gospel-title')?.value,
      gospel_content: document.getElementById('gospel-content')?.value,
      fundamental_doctrine_title: document.getElementById('fundamental-title')?.value,
      fundamental_doctrine_content: document.getElementById('fundamental-content')?.value,
      adjacent_doctrine_title: document.getElementById('adjacent-title')?.value,
      adjacent_doctrine_content: document.getElementById('adjacent-content')?.value,
      historical_writers: document.getElementById('historical-writers')?.value,
      historical_date: document.getElementById('historical-date')?.value,
      historical_place: document.getElementById('historical-place')?.value,
      historical_motive: document.getElementById('historical-motive')?.value,
      book_purpose: document.getElementById('book-purpose')?.value
    };

    // Update studyData only if elements exist to avoid overwriting with null/undefined
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) {
        this.studyData[key] = value;
      }
    }
  }

  getStudyDataForSave() {
    const data = { ...this.studyData };
    // Remove metadata fields that might interfere with upsert if necessary, 
    // but keep book_id
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    return data;
  }

  getEmptyStudyData() {
    return {
      keyword_title: '',
      keyword_content: '',
      outline: { sections: [] },
      gospel_title: '',
      gospel_content: '',
      fundamental_doctrine_title: '',
      fundamental_doctrine_content: '',
      adjacent_doctrine_title: '',
      adjacent_doctrine_content: '',
      parallel_books: { historical: [], doctrinal: [] },
      historical_writers: '',
      historical_date: '',
      historical_place: '',
      historical_motive: '',
      book_purpose: '',
      highlighted_paragraphs: []
    };
  }

  renderHTML() {
    return `
      <div class="book-study-container fade-in">
        ${this.renderHeader()}
        ${this.renderInternalNav()}
        ${this.renderSections()}
      </div>
    `;
  }

  renderHeader() {
    return `
      <div class="book-study-header">
        <div class="book-study-title">
          <img src="assets/logo.png" alt="Biblia" style="height: 40px; cursor: pointer;" id="logo-home">
          <span>Libro de ${this.currentBook.name}</span>
        </div>
        <div class="header-actions">
          ${this.isEditMode ? `
            <button class="btn btn-success" id="save-btn">Guardar</button>
            <button class="btn btn-secondary" id="cancel-btn">Cancelar</button>
          ` : `
            <button class="btn btn-primary" id="edit-btn">Modificar</button>
          `}
        </div>
      </div>
    `;
  }

  renderInternalNav() {
    const sections = [
      'Palabra Clave',
      'Bosquejo',
      'Evangelio',
      'Doctrina Fundamental',
      'Doctrina Adyacente',
      'Libros Paralelos',
      'Datos Históricos',
      'Motivo o propósito del libro',
      'Párrafos destacados'
    ];

    return `
      <nav class="internal-nav">
        <div class="hamburger-menu" id="hamburger">
          <div class="hamburger-line"></div>
          <div class="hamburger-line"></div>
          <div class="hamburger-line"></div>
        </div>
        <ul class="internal-nav-list" id="internal-nav-list">
          ${sections.map(section => `
            <li class="internal-nav-item" data-section="${this.getSectionId(section)}">
              ${section}
            </li>
          `).join('')}
        </ul>
      </nav>
    `;
  }

  getSectionId(sectionName) {
    return sectionName.toLowerCase().replace(/\s+/g, '-').replace(/ó/g, 'o').replace(/í/g, 'i');
  }

  renderSections() {
    return `
      ${this.renderKeywordSection()}
      ${this.renderOutlineSection()}
      ${this.renderGospelSection()}
      ${this.renderFundamentalDoctrineSection()}
      ${this.renderAdjacentDoctrineSection()}
      ${this.renderParallelBooksSection()}
      ${this.renderHistoricalDataSection()}
      ${this.renderPurposeSection()}
      ${this.renderHighlightedParagraphsSection()}
    `;
  }

  renderKeywordSection() {
    return `
      <section class="study-section" id="palabra-clave">
        <h2 class="section-title">Palabra Clave</h2>
        ${this.isEditMode ? `
          <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="keyword-title" 
                   value="${this.studyData.keyword_title || ''}" 
                   placeholder="Ingrese el título">
          </div>
          <div class="form-group">
            <label class="form-label form-content-indented">Contenido</label>
            <div class="form-content-indented">
              <textarea class="form-textarea" id="keyword-content" 
                        placeholder="Ingrese el contenido">${this.studyData.keyword_content || ''}</textarea>
            </div>
          </div>
        ` : `
          ${this.studyData.keyword_title ? `<h3 class="section-subtitle">${this.studyData.keyword_title}</h3>` : ''}
          <div class="section-content">${this.studyData.keyword_content || '<p style="color: var(--text-muted);">Sin contenido</p>'}</div>
        `}
      </section>
    `;
  }

  renderOutlineSection() {
    const outline = this.studyData.outline || { sections: [] };

    return `
      <section class="study-section" id="bosquejo">
        <h2 class="section-title">Bosquejo</h2>
        ${this.isEditMode ? this.renderOutlineEdit(outline) : this.renderOutlineView(outline)}
      </section>
    `;
  }

  renderOutlineEdit(outline) {
    return `
      <div id="outline-editor">
        <div id="outline-controls-top" style="margin-bottom: 2rem;">
          ${!this.isAddingSection ? `
            <button class="btn btn-primary" id="show-add-section" style="width: 100%; border: 2px dashed var(--accent-primary); background: transparent; color: var(--accent-primary); padding: 15px; font-weight: bold; border-radius: var(--radius-lg);">
              + Añadir Nueva Sección de Bosquejo
            </button>
          ` : ''}

          <div id="outline-draft-container" class="${this.isAddingSection ? '' : 'hidden'}" style="background-color: var(--bg-tertiary); padding: 2rem; border-radius: var(--radius-xl); border: 2px solid var(--accent-primary);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="color: var(--accent-primary); margin: 0;">Añadiendo Nueva Sección</h3>
              <button class="btn btn-secondary" id="cancel-draft" style="padding: 5px 15px;">Cancelar</button>
            </div>
            
            <!-- Step 1: Chapters -->
            <div class="form-group ${this.outlineDraft.step === 1 ? '' : 'hidden'}" id="draft-step-1">
              <label class="form-label" style="font-weight: bold; margin-bottom: 0.8rem;">Ingrese Capítulos</label>
              <div class="input-with-button">
                <input type="text" class="form-input" id="draft-chapters" placeholder="P. ej: 1 - 11" value="${this.outlineDraft.chapters}">
                <button class="btn btn-primary" id="add-draft-chapters">Añadir</button>
              </div>
            </div>

            <!-- Preview Chapters & Step 2: Title -->
            <div id="draft-step-2-container" class="${this.outlineDraft.step >= 2 ? '' : 'hidden'}">
              <h3 style="font-size: 1.2rem; margin-bottom: 1rem; color: var(--text-primary);">Capítulo ${this.outlineDraft.chapters}</h3>
              
              <div class="form-group ${this.outlineDraft.step === 2 ? '' : 'hidden'}" id="draft-step-2">
                <label class="form-label" style="font-weight: bold; margin-bottom: 0.8rem;">Ingreso de Título</label>
                <div class="input-with-button">
                  <input type="text" class="form-input" id="draft-title" placeholder="P. ej: 4 Eventos que dieron origen..." value="${this.outlineDraft.title}">
                  <button class="btn btn-primary" id="add-draft-title">Añadir</button>
                </div>
              </div>
            </div>

            <!-- Preview Title & Step 3: Points -->
            <div id="draft-step-3-container" class="${this.outlineDraft.step >= 3 ? '' : 'hidden'}">
              <ul style="list-style: disc; margin-left: 2rem; margin-bottom: 1rem; font-weight: 600;">
                <li>${this.outlineDraft.title ? (this.outlineDraft.title.endsWith(':') ? this.outlineDraft.title : this.outlineDraft.title + ':') : ''}</li>
              </ul>
              
              <ol id="draft-points-list" style="margin-left: 4rem; margin-bottom: 1rem; color: var(--text-secondary); list-style-type: decimal;">
                ${this.outlineDraft.points.map((p, i) => `
                  <li style="margin-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                      <span>${p}</span>
                      <button class="remove-btn remove-draft-point" data-point-index="${i}" style="font-size: 0.8rem; color: #e53e3e; background: none; border: none; cursor: pointer;">✕</button>
                    </div>
                  </li>
                `).join('')}
              </ol>
              
              <div class="form-group ${this.outlineDraft.step === 3 ? '' : 'hidden'}" id="draft-step-3">
                <label class="form-label" style="font-weight: bold; margin-bottom: 0.8rem;">Puntos Principales</label>
                <div class="input-with-button" style="margin-bottom: 1.5rem;">
                  <input type="text" class="form-input" id="draft-point" placeholder="Ingrese un punto principal">
                  <button class="btn btn-primary" id="add-draft-point">Añadir</button>
                </div>
                <button class="btn btn-success" id="finalize-outline-section" style="width: 100%; padding: 12px; font-weight: bold; font-size: 1.1rem;">
                  Guardar Sección
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="outline-sections-list">
          ${((outline && outline.sections) || []).map((section, index) => `
            <div class="outline-section-preview" style="margin-bottom: 1.5rem; padding: 1.5rem; border-radius: var(--radius-lg); position: relative; background-color: var(--bg-secondary); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
              <button class="remove-btn remove-section" data-section-index="${index}" style="position: absolute; top: 15px; right: 15px; color: #e53e3e; background: none; border: none; cursor: pointer; font-size: 1.2rem;">✕</button>
              <h3 style="font-size: 1.1rem; margin-bottom: 0.8rem; color: var(--text-primary); font-weight: bold;">Capítulo ${section.chapters || ''}</h3>
              <ul style="list-style: disc; margin-left: 2rem; margin-bottom: 0.8rem; font-weight: 600; color: var(--text-primary);">
                <li>${section.title ? (section.title.endsWith(':') ? section.title : section.title + ':') : ''}</li>
              </ul>
              <ol style="margin-left: 4rem; color: var(--text-secondary); list-style-type: decimal;">
                ${(section.points || []).map(point => `<li style="margin-bottom: 0.4rem;">${point}</li>`).join('')}
              </ol>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderOutlineView(outline) {
    if (!outline || !outline.sections || outline.sections.length === 0) {
      return '<p style="color: var(--text-muted);">Sin contenido</p>';
    }

    return outline.sections.map(section => `
      <div class="outline-display-block" style="margin-bottom: 2rem;">
        <h3 class="section-subtitle" style="margin-bottom: 0.5rem;">Capítulo ${section.chapters || ''}</h3>
        <ul style="list-style: disc; margin-left: 2rem; margin-bottom: 0.8rem; font-weight: 600; color: var(--text-primary);">
          <li>${section.title ? (section.title.endsWith(':') ? section.title : section.title + ':') : ''}</li>
        </ul>
        <ol style="margin-left: 4rem; color: var(--text-secondary); line-height: 1.6;">
          ${(section.points || []).map(point => `<li style="margin-bottom: 0.4rem;">${point}</li>`).join('')}
        </ol>
      </div>
    `).join('');
  }

  renderGospelSection() {
    return `
      <section class="study-section" id="evangelio">
        <h2 class="section-title">Evangelio</h2>
        ${this.isEditMode ? `
          <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="gospel-title" 
                   value="${this.studyData.gospel_title || ''}" 
                   placeholder="Ingrese el título">
          </div>
          <div class="form-group">
            <label class="form-label form-content-indented">Contenido</label>
            <div class="form-content-indented">
              <textarea class="form-textarea" id="gospel-content" 
                        placeholder="Ingrese el contenido">${this.studyData.gospel_content || ''}</textarea>
            </div>
          </div>
        ` : `
          ${this.studyData.gospel_title ? `<h3 class="section-subtitle">${this.studyData.gospel_title}</h3>` : ''}
          <div class="section-content">${this.studyData.gospel_content || '<p style="color: var(--text-muted);">Sin contenido</p>'}</div>
        `}
      </section>
    `;
  }

  renderFundamentalDoctrineSection() {
    return `
      <section class="study-section" id="doctrina-fundamental">
        <h2 class="section-title">Doctrina Fundamental</h2>
        ${this.isEditMode ? `
          <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="fundamental-title" 
                   value="${this.studyData.fundamental_doctrine_title || ''}" 
                   placeholder="Ingrese el título">
          </div>
          <div class="form-group">
            <label class="form-label form-content-indented">Contenido</label>
            <div class="form-content-indented">
              <textarea class="form-textarea" id="fundamental-content" 
                        placeholder="Ingrese el contenido">${this.studyData.fundamental_doctrine_content || ''}</textarea>
            </div>
          </div>
        ` : `
          ${this.studyData.fundamental_doctrine_title ? `<h3 class="section-subtitle">${this.studyData.fundamental_doctrine_title}</h3>` : ''}
          <div class="section-content">${this.studyData.fundamental_doctrine_content || '<p style="color: var(--text-muted);">Sin contenido</p>'}</div>
        `}
      </section>
    `;
  }

  renderAdjacentDoctrineSection() {
    return `
      <section class="study-section" id="doctrina-adyacente">
        <h2 class="section-title">Doctrina Adyacente</h2>
        ${this.isEditMode ? `
          <div class="form-group">
            <label class="form-label">Título</label>
            <input type="text" class="form-input" id="adjacent-title" 
                   value="${this.studyData.adjacent_doctrine_title || ''}" 
                   placeholder="Ingrese el título">
          </div>
          <div class="form-group">
            <label class="form-label form-content-indented">Contenido</label>
            <div class="form-content-indented">
              <textarea class="form-textarea" id="adjacent-content" 
                        placeholder="Ingrese el contenido">${this.studyData.adjacent_doctrine_content || ''}</textarea>
            </div>
          </div>
        ` : `
          ${this.studyData.adjacent_doctrine_title ? `<h3 class="section-subtitle">${this.studyData.adjacent_doctrine_title}</h3>` : ''}
          <div class="section-content">${this.studyData.adjacent_doctrine_content || '<p style="color: var(--text-muted);">Sin contenido</p>'}</div>
        `}
      </section>
    `;
  }

  renderParallelBooksSection() {
    const parallelBooks = this.studyData.parallel_books || { historical: [], doctrinal: [] };

    return `
      <section class="study-section" id="libros-paralelos">
        <h2 class="section-title">Libros Paralelos</h2>
        ${this.isEditMode ? this.renderParallelBooksEdit(parallelBooks) : this.renderParallelBooksView(parallelBooks)}
      </section>
    `;
  }

  renderParallelBooksEdit(parallelBooks) {
    return `
      <div>
        <h3 class="section-subtitle">Históricos:</h3>
        <div class="input-with-button">
          <input type="text" class="form-input" id="historical-book-input" 
                 placeholder="Ingrese un libro histórico">
          <button class="btn btn-primary" id="add-historical-book">Añadir</button>
        </div>
        <ul class="dynamic-list" id="historical-books-list">
          ${parallelBooks.historical.map((book, index) => `
            <li class="dynamic-list-item">
              <span>${book}</span>
              <button class="remove-btn" data-type="historical" data-index="${index}">✕</button>
            </li>
          `).join('')}
        </ul>

        <h3 class="section-subtitle" style="margin-top: 1.5rem;">Doctrinales:</h3>
        <div class="input-with-button">
          <input type="text" class="form-input" id="doctrinal-book-input" 
                 placeholder="Ingrese un libro doctrinal">
          <button class="btn btn-primary" id="add-doctrinal-book">Añadir</button>
        </div>
        <ul class="dynamic-list" id="doctrinal-books-list">
          ${parallelBooks.doctrinal.map((book, index) => `
            <li class="dynamic-list-item">
              <span>${book}</span>
              <button class="remove-btn" data-type="doctrinal" data-index="${index}">✕</button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  renderParallelBooksView(parallelBooks) {
    if ((!parallelBooks.historical || parallelBooks.historical.length === 0) &&
      (!parallelBooks.doctrinal || parallelBooks.doctrinal.length === 0)) {
      return '<p style="color: var(--text-muted);">Sin contenido</p>';
    }

    return `
      ${parallelBooks.historical && parallelBooks.historical.length > 0 ? `
        <h3 class="section-subtitle">Históricos:</h3>
        <ul class="section-content">
          ${parallelBooks.historical.map(book => `<li>${book}</li>`).join('')}
        </ul>
      ` : ''}
      ${parallelBooks.doctrinal && parallelBooks.doctrinal.length > 0 ? `
        <h3 class="section-subtitle">Doctrinales:</h3>
        <ul class="section-content">
          ${parallelBooks.doctrinal.map(book => `<li>${book}</li>`).join('')}
        </ul>
      ` : ''}
    `;
  }

  renderHistoricalDataSection() {
    return `
      <section class="study-section" id="datos-historicos">
        <h2 class="section-title">Datos Históricos</h2>
        ${this.isEditMode ? `
          <div class="historical-data-grid">
            <div class="historical-data-item">
              <label>1. Escritores:</label>
              <input type="text" class="form-input" id="historical-writers" 
                     value="${this.studyData.historical_writers || ''}" 
                     placeholder="Ingrese los escritores">
            </div>
            <div class="historical-data-item">
              <label>2. Fecha de los eventos:</label>
              <input type="text" class="form-input" id="historical-date" 
                     value="${this.studyData.historical_date || ''}" 
                     placeholder="Ingrese la fecha">
            </div>
            <div class="historical-data-item">
              <label>3. Lugar de los eventos:</label>
              <input type="text" class="form-input" id="historical-place" 
                     value="${this.studyData.historical_place || ''}" 
                     placeholder="Ingrese el lugar">
            </div>
            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">4. Motivo del libro:</label>
              <textarea class="form-textarea" id="historical-motive" 
                        placeholder="Ingrese el motivo">${this.studyData.historical_motive || ''}</textarea>
            </div>
          </div>
        ` : `
          <div class="section-content">
            ${this.studyData.historical_writers ? `<p><strong>1. Escritores:</strong> ${this.studyData.historical_writers}</p>` : ''}
            ${this.studyData.historical_date ? `<p><strong>2. Fecha de los eventos:</strong> ${this.studyData.historical_date}</p>` : ''}
            ${this.studyData.historical_place ? `<p><strong>3. Lugar de los eventos:</strong> ${this.studyData.historical_place}</p>` : ''}
            ${this.studyData.historical_motive ? `<p><strong>4. Motivo del libro:</strong> ${this.studyData.historical_motive}</p>` : ''}
            ${!this.studyData.historical_writers && !this.studyData.historical_date &&
        !this.studyData.historical_place && !this.studyData.historical_motive ?
        '<p style="color: var(--text-muted);">Sin contenido</p>' : ''}
          </div>
        `}
      </section>
    `;
  }

  renderPurposeSection() {
    return `
      <section class="study-section" id="motivo-o-proposito-del-libro">
        <h2 class="section-title">Motivo o propósito del libro</h2>
        ${this.isEditMode ? `
          <div class="form-group">
            <textarea class="form-textarea" id="book-purpose" 
                      placeholder="Ingrese el motivo o propósito">${this.studyData.book_purpose || ''}</textarea>
          </div>
        ` : `
          <div class="section-content">${this.studyData.book_purpose || '<p style="color: var(--text-muted);">Sin contenido</p>'}</div>
        `}
      </section>
    `;
  }

  renderHighlightedParagraphsSection() {
    const paragraphs = this.studyData.highlighted_paragraphs || [];

    return `
      <section class="study-section" id="parrafos-destacados">
        <h2 class="section-title">Párrafos destacados</h2>
        ${this.isEditMode ? `
          <div class="input-with-button">
            <textarea class="form-textarea" id="paragraph-input" 
                      placeholder="Ingrese un párrafo destacado" 
                      style="min-height: 80px;"></textarea>
            <button class="btn btn-primary" id="add-paragraph">Añadir</button>
          </div>
          <ol class="dynamic-list" id="paragraphs-list">
            ${paragraphs.map((paragraph, index) => `
              <li class="dynamic-list-item">
                <span>${paragraph}</span>
                <button class="remove-btn" data-paragraph-index="${index}">✕</button>
              </li>
            `).join('')}
          </ol>
        ` : `
          ${paragraphs.length > 0 ? `
            <ol class="section-content">
              ${paragraphs.map(p => `<li>${p}</li>`).join('')}
            </ol>
          ` : '<p style="color: var(--text-muted);">Sin contenido</p>'}
        `}
      </section>
    `;
  }

  attachEventListeners() {
    // Logo home button
    const logoHome = document.getElementById('logo-home');
    if (logoHome) {
      logoHome.addEventListener('click', () => {
        const event = new CustomEvent('navigateToHome');
        document.dispatchEvent(event);
      });
    }

    // Edit/Save/Cancel buttons
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    if (editBtn) {
      editBtn.addEventListener('click', () => this.enterEditMode());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveStudy());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelEdit());
    }

    // Internal navigation
    this.setupInternalNavigation();

    // Edit mode specific listeners
    if (this.isEditMode) {
      this.attachEditModeListeners();
    }
  }

  setupInternalNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navList = document.getElementById('internal-nav-list');

    if (hamburger) {
      hamburger.addEventListener('click', () => {
        navList.classList.toggle('active');
      });
    }

    const navItems = document.querySelectorAll('.internal-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const sectionId = item.dataset.section;
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          navList.classList.remove('active');
        }
      });
    });
  }

  attachEditModeListeners() {
    // Outline section listeners
    this.attachOutlineListeners();

    // Parallel books listeners
    this.attachParallelBooksListeners();

    // Highlighted paragraphs listeners
    this.attachParagraphsListeners();
  }

  attachOutlineListeners() {
    const showAddBtn = document.getElementById('show-add-section');
    if (showAddBtn) {
      showAddBtn.addEventListener('click', () => {
        this.isAddingSection = true;
        this.outlineDraft = { chapters: '', title: '', points: [], step: 1 };
        this.isEditMode = true;
        this.refresh();
        setTimeout(() => {
          const el = document.getElementById('outline-draft-container');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    }

    const cancelDraftBtn = document.getElementById('cancel-draft');
    if (cancelDraftBtn) {
      cancelDraftBtn.addEventListener('click', () => {
        this.isAddingSection = false;
        this.outlineDraft = { chapters: '', title: '', points: [], step: 1 };
        this.refresh();
      });
    }

    const addChaptersBtn = document.getElementById('add-draft-chapters');
    if (addChaptersBtn) {
      addChaptersBtn.addEventListener('click', () => {
        const val = document.getElementById('draft-chapters').value.trim();
        if (val) {
          this.outlineDraft.chapters = val;
          this.outlineDraft.step = 2;
          this.refresh();
        }
      });
    }

    const addTitleBtn = document.getElementById('add-draft-title');
    if (addTitleBtn) {
      addTitleBtn.addEventListener('click', () => {
        const val = document.getElementById('draft-title').value.trim();
        if (val) {
          this.outlineDraft.title = val;
          this.outlineDraft.step = 3;
          this.refresh();
        }
      });
    }

    const addPointBtn = document.getElementById('add-draft-point');
    if (addPointBtn) {
      addPointBtn.addEventListener('click', () => {
        const val = document.getElementById('draft-point').value.trim();
        if (val) {
          this.outlineDraft.points.push(val);
          this.refresh();
        }
      });
    }

    document.querySelectorAll('.remove-draft-point').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.pointIndex);
        this.outlineDraft.points.splice(idx, 1);
        this.refresh();
      });
    });

    const finalizeBtn = document.getElementById('finalize-outline-section');
    if (finalizeBtn) {
      finalizeBtn.addEventListener('click', () => {
        if (!this.studyData.outline) this.studyData.outline = { sections: [] };
        if (!this.studyData.outline.sections) this.studyData.outline.sections = [];
        this.studyData.outline.sections.push({
          chapters: this.outlineDraft.chapters,
          title: this.outlineDraft.title,
          points: [...this.outlineDraft.points]
        });
        this.isAddingSection = false;
        this.outlineDraft = { chapters: '', title: '', points: [], step: 1 };
        this.refresh();
      });
    }

    document.querySelectorAll('.remove-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.sectionIndex);
        this.studyData.outline.sections.splice(idx, 1);
        this.refresh();
      });
    });
  }

  attachParallelBooksListeners() {
    const addHistoricalBtn = document.getElementById('add-historical-book');
    const addDoctrinalBtn = document.getElementById('add-doctrinal-book');

    if (addHistoricalBtn) {
      addHistoricalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.getElementById('historical-book-input');
        const value = input.value.trim();
        if (value) {
          if (!this.studyData.parallel_books) {
            this.studyData.parallel_books = { historical: [], doctrinal: [] };
          }
          if (!this.studyData.parallel_books.historical) this.studyData.parallel_books.historical = [];
          this.studyData.parallel_books.historical.push(value);
          this.refresh();
          // The new input will be empty anyway because it's re-rendered
        }
      });
    }

    if (addDoctrinalBtn) {
      addDoctrinalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.getElementById('doctrinal-book-input');
        const value = input.value.trim();
        if (value) {
          if (!this.studyData.parallel_books) {
            this.studyData.parallel_books = { historical: [], doctrinal: [] };
          }
          if (!this.studyData.parallel_books.doctrinal) this.studyData.parallel_books.doctrinal = [];
          this.studyData.parallel_books.doctrinal.push(value);
          this.refresh();
        }
      });
    }

    document.querySelectorAll('#libros-paralelos .remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = btn.dataset.type;
        const index = parseInt(btn.dataset.index);
        if (this.studyData.parallel_books && this.studyData.parallel_books[type]) {
          this.studyData.parallel_books[type].splice(index, 1);
          this.refresh();
        }
      });
    });
  }

  attachParagraphsListeners() {
    const addParagraphBtn = document.getElementById('add-paragraph');

    if (addParagraphBtn) {
      addParagraphBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.getElementById('paragraph-input');
        const value = input.value.trim();
        if (value) {
          if (!this.studyData.highlighted_paragraphs) {
            this.studyData.highlighted_paragraphs = [];
          }
          this.studyData.highlighted_paragraphs.push(value);
          this.refresh();
        }
      });
    }

    document.querySelectorAll('#parrafos-destacados .remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.paragraphIndex);
        if (this.studyData.highlighted_paragraphs) {
          this.studyData.highlighted_paragraphs.splice(index, 1);
          this.refresh();
        }
      });
    });
  }

  async enterEditMode() {
    const user = await StudiesAPI.getCurrentUser();
    if (!user) {
      alert('Debes iniciar sesión para modificar los estudios.');
      return;
    }
    this.isEditMode = true;
    this.render(this.currentBookIndex);
  }

  cancelEdit() {
    this.studyData = JSON.parse(JSON.stringify(this.originalData));
    this.isEditMode = false;
    this.render(this.currentBookIndex);
  }

  async saveStudy() {
    this.collectFormValues();

    // Ensure outline is also up to date
    this.studyData.outline = this.collectOutlineData();

    try {
      const dataToSave = this.getStudyDataForSave();
      await StudiesAPI.saveBookStudy(this.currentBookIndex + 1, dataToSave);

      // Update originalData with the latest
      this.originalData = JSON.parse(JSON.stringify(this.studyData));
      this.isEditMode = false;

      // Re-render to show non-edit view
      await this.render(this.currentBookIndex);
      alert('Estudio guardado exitosamente');
    } catch (error) {
      console.error('Error saving study:', error);
      if (error.message === 'No user logged in') {
        alert('Debes iniciar sesión para guardar tus estudios.');
      } else {
        alert('Error al guardar el estudio. Por favor, intente nuevamente.');
      }
    }
  }

  collectOutlineData() {
    // Now outline sections are updated in-place via draft system,
    // so we just return the current state of studyData.outline
    return this.studyData.outline || { sections: [] };
  }
}
