import { StudiesAPI } from './supabase-client.js';

export class ThematicStudies {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.studies = [];
        this.filteredStudies = [];
        this.doctrines = [];
        this.currentView = 'list'; // 'list', 'create', 'view'
        this.formData = {
            citations: [],
            tags: [],
            media: []
        };
    }

    async init() {
        await this.loadData();
        this.render();
    }

    async loadData() {
        this.studies = await StudiesAPI.getThematicStudies();
        this.filteredStudies = [...this.studies];
        this.doctrines = [...new Set(this.studies.map(s => s.doctrine_type).filter(Boolean))];
    }

    render() {
        if (this.currentView === 'list') {
            this.renderList();
        } else if (this.currentView === 'create') {
            this.renderForm();
        } else if (this.currentView === 'view') {
            this.renderView();
        }
    }

    // --- LIST VIEW ---
    renderList() {
        this.container.innerHTML = `
            <div class="thematic-container fade-in">
                <header class="studies-header">
                    <div class="search-bar-container">
                        <div class="search-input-wrapper">
                            <input type="text" id="studySearch" placeholder="Buscar estudios..." value="${this.searchQuery || ''}">
                            <span class="search-icon">🔍</span>
                        </div>
                        <button class="btn btn-primary" id="btnGoToCreate">+ Agregar</button>
                    </div>

                    <div class="studies-nav">
                        <button class="doctrine-hamburger" id="doctrineToggle">☰</button>
                        <div class="doctrine-list" id="doctrineList">
                            <div class="doctrine-chip active" data-type="all">Todos</div>
                            ${this.doctrines.map(d => `<div class="doctrine-chip" data-type="${d}">${d}</div>`).join('')}
                        </div>
                    </div>
                </header>

                <div class="studies-grid" id="studiesGrid">
                    ${this.renderGridItems()}
                </div>
            </div>
        `;

        this.setupListListeners();
    }

    renderGridItems() {
        if (this.filteredStudies.length === 0) {
            return `<p class="empty-message">No se encontraron estudios.</p>`;
        }

        return this.filteredStudies.map(study => {
            const firstImage = (study.media || []).find(m => m.type === 'image');
            const imageUrl = firstImage ? firstImage.url : 'assets/placeholder-study.jpg';

            return `
                <div class="study-card" onclick="window.thematicStudies.viewStudy('${study.id}')">
                    <img src="${imageUrl}" alt="${study.title}" class="study-card-image" onerror="this.src='assets/placeholder-study.jpg'">
                    <div class="study-card-content">
                        <span class="study-card-type">${study.doctrine_type}</span>
                        <h3 class="study-card-title">${study.title}</h3>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupListListeners() {
        document.getElementById('btnGoToCreate')?.addEventListener('click', () => {
            this.currentView = 'create';
            this.resetFormData();
            this.render();
        });

        const searchInput = document.getElementById('studySearch');
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterStudies();
        });

        document.getElementById('doctrineToggle')?.addEventListener('click', () => {
            document.getElementById('doctrineList').classList.toggle('active');
        });

        document.querySelectorAll('.doctrine-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.doctrine-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedDoctrine = chip.dataset.type;
                this.filterStudies();
                document.getElementById('doctrineList').classList.remove('active');
            });
        });
    }

    filterStudies() {
        this.filteredStudies = this.studies.filter(s => {
            const title = s.title ? s.title.toLowerCase() : '';
            const doctrine = s.doctrine_type ? s.doctrine_type.toLowerCase() : '';
            const search = this.searchQuery || '';

            const matchesSearch = title.includes(search) || doctrine.includes(search);
            const matchesType = !this.selectedDoctrine || this.selectedDoctrine === 'all' || s.doctrine_type === this.selectedDoctrine;
            return matchesSearch && matchesType;
        });

        const grid = document.getElementById('studiesGrid');
        if (grid) grid.innerHTML = this.renderGridItems();
    }

    // --- CREATE/FORM VIEW ---
    resetFormData() {
        this.editingId = null;
        this.formData = {
            citations: [],
            tags: [],
            media: []
        };
    }

    renderForm() {
        this.container.innerHTML = `
            <div class="thematic-container fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1>${this.editingId ? 'Editar Estudio' : 'Nuevo Estudio'}</h1>
                    <button class="btn btn-secondary" onclick="window.thematicStudies.cancelForm()">Volver</button>
                </div>

                <div class="study-form-container">
                    <form id="thematicStudyForm">
                        <!-- Título -->
                        <div class="form-group-custom">
                            <label>Título del estudio</label>
                            <input type="text" id="f_title" placeholder="Ej: La Gracia de Dios" required class="form-input">
                        </div>

                        <!-- Tipo de Doctrina -->
                        <div class="form-group-custom">
                            <label>Tipo de doctrina</label>
                            <div id="doctrineSelectGroup" class="input-row">
                                <select id="f_doctrine_select" class="form-input">
                                    <option value="">Seleccione un tipo</option>
                                    ${this.doctrines.map(d => `<option value="${d}">${d}</option>`).join('')}
                                </select>
                                <button type="button" class="btn btn-primary" id="btnShowAddDoctrine">Añadir</button>
                            </div>
                            <div id="doctrineInputGroup" class="input-row hidden">
                                <input type="text" id="f_doctrine_new" placeholder="Nuevo tipo de doctrina" class="form-input">
                                <button type="button" class="btn btn-primary" id="btnAddDoctrine">Agregar</button>
                                <button type="button" class="btn btn-secondary" id="btnCancelAddDoctrine">Cancelar</button>
                            </div>
                        </div>

                        <!-- Citas Relacionadas -->
                        <div class="form-group-custom">
                            <label>Citas relacionadas</label>
                            <div class="input-row">
                                <input type="text" id="f_citation" placeholder="Ej: Juan 3:16" class="form-input">
                                <button type="button" class="btn btn-primary" id="btnAddCitation">Agregar</button>
                            </div>
                            <div id="citationList" class="dynamic-list">
                                ${this.renderCitations()}
                            </div>
                        </div>

                        <!-- Introducción -->
                        <div class="form-group-custom">
                            <label>Introducción (Breve)</label>
                            <textarea id="f_intro" class="form-textarea" style="min-height: 80px;"></textarea>
                        </div>

                        <!-- Contenido -->
                        <div class="form-group-custom">
                            <label>Contenido</label>
                            <textarea id="f_content" class="form-textarea" style="min-height: 300px;"></textarea>
                        </div>

                        <!-- Etiquetas -->
                        <div class="form-group-custom">
                            <label>Etiquetas</label>
                            <div class="input-row">
                                <input type="text" id="f_tag" placeholder="Ej: Redención" class="form-input">
                                <button type="button" class="btn btn-primary" id="btnAddTag">Agregar</button>
                            </div>
                            <div id="tagList" class="chip-container">
                                ${this.renderTags()}
                            </div>
                        </div>

                        <!-- Multimedia -->
                        <div class="form-group-custom">
                            <label>Imágenes y Videos</label>
                            <div class="input-row">
                                <input type="url" id="f_media_url" placeholder="URL de imagen o YouTube" class="form-input">
                                <button type="button" class="btn btn-primary" id="btnAddMedia">Añadir</button>
                            </div>
                            <div id="mediaList" class="media-preview-container">
                                ${this.renderMediaPreviews()}
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.2rem; margin-top: 1rem;">
                            Guardar Estudio
                        </button>
                    </form>
                </div>
            </div>
        `;

        this.setupFormListeners();
    }

    renderCitations() {
        return this.formData.citations.map((c, i) => `
            <div class="citation-item">
                <span>${c}</span>
                <span class="remove-x" onclick="window.thematicStudies.removeCitation(${i})">✕</span>
            </div>
        `).join('');
    }

    renderTags() {
        return this.formData.tags.map((t, i) => `
            <div class="tag-chip">
                <span>${t}</span>
                <span class="remove-x" onclick="window.thematicStudies.removeTag(${i})">✕</span>
            </div>
        `).join('');
    }

    renderMediaPreviews() {
        return this.formData.media.map((m, i) => `
            <div class="media-preview">
                <img src="${m.thumb}" alt="Preview" onerror="this.src='assets/placeholder-media.jpg'">
                <div class="remove-overlay" onclick="window.thematicStudies.removeMedia(${i})">✕</div>
            </div>
        `).join('');
    }

    setupFormListeners() {
        const titleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

        // Doctrine Toggling
        const btnShowAdd = document.getElementById('btnShowAddDoctrine');
        const btnCancelAdd = document.getElementById('btnCancelAddDoctrine');
        const btnAddDoc = document.getElementById('btnAddDoctrine');
        const selectGroup = document.getElementById('doctrineSelectGroup');
        const inputGroup = document.getElementById('doctrineInputGroup');

        btnShowAdd?.addEventListener('click', () => {
            selectGroup.classList.add('hidden');
            inputGroup.classList.remove('hidden');
            document.getElementById('f_doctrine_new').focus();
        });

        btnCancelAdd?.addEventListener('click', () => {
            inputGroup.classList.add('hidden');
            selectGroup.classList.remove('hidden');
            document.getElementById('f_doctrine_new').value = '';
        });

        btnAddDoc?.addEventListener('click', () => {
            const val = titleCase(document.getElementById('f_doctrine_new').value.trim());
            if (!val) return;

            if (this.doctrines.includes(val)) {
                alert('Este tipo de doctrina ya existe.');
                return;
            }

            this.doctrines.push(val);
            const select = document.getElementById('f_doctrine_select');
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            select.appendChild(opt);
            select.value = val;

            inputGroup.classList.add('hidden');
            selectGroup.classList.remove('hidden');
            document.getElementById('f_doctrine_new').value = '';
        });

        // Dynamic Lists
        document.getElementById('btnAddCitation')?.addEventListener('click', () => {
            const val = titleCase(document.getElementById('f_citation').value.trim());
            if (!val) return;
            if (this.formData.citations.includes(val)) return;
            this.formData.citations.push(val);
            document.getElementById('f_citation').value = '';
            document.getElementById('citationList').innerHTML = this.renderCitations();
        });

        document.getElementById('btnAddTag')?.addEventListener('click', () => {
            const val = titleCase(document.getElementById('f_tag').value.trim());
            if (!val) return;
            if (this.formData.tags.includes(val)) return;
            this.formData.tags.push(val);
            document.getElementById('f_tag').value = '';
            document.getElementById('tagList').innerHTML = this.renderTags();
        });

        document.getElementById('btnAddMedia')?.addEventListener('click', () => {
            const url = document.getElementById('f_media_url').value.trim();
            if (!url) return;

            let type = 'image';
            let thumb = url;

            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                type = 'video';
                const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
                thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }

            this.formData.media.push({ type, url, thumb });
            document.getElementById('f_media_url').value = '';
            document.getElementById('mediaList').innerHTML = this.renderMediaPreviews();
        });

        // Form Submit
        document.getElementById('thematicStudyForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const studyData = {
                title: titleCase(document.getElementById('f_title').value.trim()),
                doctrine_type: document.getElementById('f_doctrine_select').value,
                introduction: document.getElementById('f_intro').value.trim(),
                content: document.getElementById('f_content').value.trim(),
                citations: this.formData.citations,
                tags: this.formData.tags,
                media: this.formData.media
            };

            // Validation for existing title
            const exists = this.studies.find(s => {
                const sameTitle = s.title.toLowerCase() === studyData.title.toLowerCase();
                const isDifferentId = String(s.id) !== String(this.editingId);
                return sameTitle && isDifferentId;
            });

            if (exists) {
                alert('Ya existe un estudio con este título.');
                return;
            }

            try {
                if (this.editingId) {
                    await StudiesAPI.updateThematicStudy(this.editingId, studyData);
                } else {
                    await StudiesAPI.createThematicStudy(studyData);
                }
                alert('Estudio guardado correctamente.');
                this.editingId = null;
                this.currentView = 'list';
                await this.init();
            } catch (error) {
                alert('Error al guardar: ' + error.message);
            }
        });
    }

    // Helper methods for inline removal
    removeCitation(i) {
        this.formData.citations.splice(i, 1);
        document.getElementById('citationList').innerHTML = this.renderCitations();
    }
    removeTag(i) {
        this.formData.tags.splice(i, 1);
        document.getElementById('tagList').innerHTML = this.renderTags();
    }
    removeMedia(i) {
        this.formData.media.splice(i, 1);
        document.getElementById('mediaList').innerHTML = this.renderMediaPreviews();
    }

    cancelForm() {
        this.editingId = null;
        this.currentView = 'list';
        this.render();
    }

    // --- VIEW STUDY ---
    async viewStudy(id) {
        this.selectedStudy = this.studies.find(s => s.id == id);
        if (!this.selectedStudy) {
            console.error('No se encontró el estudio con ID:', id);
            return;
        }
        this.currentView = 'view';
        this.render();
    }

    renderView() {
        const s = this.selectedStudy;
        this.container.innerHTML = `
            <div class="thematic-container fade-in">
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                    <button class="btn btn-secondary" onclick="window.thematicStudies.cancelForm()">← Volver</button>
                    <button class="btn btn-secondary" onclick="window.thematicStudies.editStudy('${s.id}')">✏️ Editar</button>
                </div>

                <div class="view-study-header">
                    <span class="view-study-type">${s.doctrine_type}</span>
                    <h1 class="view-study-title">${s.title}</h1>
                    <div class="chip-container" style="justify-content: center;">
                        ${(s.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('')}
                    </div>
                </div>

                <div class="view-section">
                    <div class="view-introduction">
                        ${s.introduction || ''}
                    </div>
                </div>

                <div class="view-section">
                    <h2 class="view-section-title">Contenido</h2>
                    <div class="view-content">
                        ${s.content?.replace(/\n/g, '<br>') || ''}
                    </div>
                </div>

                ${(s.citations && s.citations.length > 0) ? `
                    <div class="view-section">
                        <h2 class="view-section-title">Citas relacionadas</h2>
                        <div class="dynamic-list">
                            ${s.citations.map(c => `<div class="citation-item">${c}</div>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${(s.media && s.media.length > 0) ? `
                    <div class="view-section">
                        <h2 class="view-section-title">Multimedia</h2>
                        <div class="view-media-grid">
                            ${s.media.map(m => {
            if (m.type === 'video') {
                const videoId = m.url.split('v=')[1]?.split('&')[0] || m.url.split('/').pop();
                return `
                                        <div class="view-media-item">
                                            <iframe width="100%" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                                        </div>
                                    `;
            } else {
                return `
                                        <div class="view-media-item">
                                            <img src="${m.url}" alt="Study image">
                                        </div>
                                    `;
            }
        }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    editStudy(id) {
        const s = this.studies.find(st => st.id == id);
        if (!s) return;
        this.editingId = id;
        this.formData = {
            citations: [...(s.citations || [])],
            tags: [...(s.tags || [])],
            media: [...(s.media || [])]
        };
        this.currentView = 'create';
        this.render();

        // Populate fields (needs timeout or manual set after render)
        setTimeout(() => {
            document.getElementById('f_title').value = s.title;
            document.getElementById('f_doctrine_select').value = s.doctrine_type;
            document.getElementById('f_intro').value = s.introduction;
            document.getElementById('f_content').value = s.content;
        }, 0);
    }
}
