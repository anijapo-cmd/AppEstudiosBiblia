import supabase from './supabase-client.js';
import { ThemeManager } from './theme-manager.js';

class AdminPanel {
    constructor() {
        this.themeManager = new ThemeManager();
        this.currentUser = null;
        this.books = [];
        this.init();
    }

    async init() {
        this.themeManager.setupToggleButton();

        // Auth Guard
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'auth.html';
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (!profile || !profile.is_admin) {
            alert('Acceso restringido: Solo administradores.');
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = profile;
        const headerUsername = document.getElementById('headerUsername');
        if (headerUsername) headerUsername.textContent = profile.username;

        this.setupEventListeners();
        this.loadUsers();
        this.loadBooks();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.admin-menu-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));

                item.classList.add('active');
                document.getElementById(`${item.dataset.tab}Tab`).classList.remove('hidden');
            });
        });

        // User Management
        document.getElementById('btnNewUser').addEventListener('click', () => this.showUserModal());
        document.getElementById('btnCancelUser').addEventListener('click', () => this.hideUserModal());
        document.getElementById('userForm').addEventListener('submit', (e) => this.handleUserSubmit(e));

        // Bible Editor
        document.getElementById('bookSelect').addEventListener('change', (e) => this.handleBookChange(e));
        document.getElementById('chapterSelect').addEventListener('change', (e) => this.loadVerses());
        document.getElementById('btnAddVerse').addEventListener('click', () => this.addNewVerse());

        // Logout
        document.getElementById('headerLogoutBtn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // --- User Management ---
    async loadUsers() {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('username');

        if (error) {
            console.error('Error fetching users:', error);
            return;
        }

        const tbody = document.getElementById('usersList');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.is_admin ? '<span class="badge badge-admin">Admin</span>' : ''}</td>
                <td>
                    <button class="action-btn btn-edit" title="Editar" onclick="window.adminPanel.editUser('${user.id}')">✏️</button>
                    ${user.username !== 'Esteban' ? `<button class="action-btn btn-delete" title="Eliminar" onclick="window.adminPanel.deleteUser('${user.id}')">🗑️</button>` : ''}
                </td>
            </tr>
        `).join('');
    }

    showUserModal(user = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('userForm');

        form.reset();
        document.getElementById('userId').value = user ? user.id : '';
        document.getElementById('userName').value = user ? user.username : '';
        document.getElementById('userEmail').value = user ? user.email : '';
        document.getElementById('pwHint').style.display = user ? 'block' : 'none';

        title.textContent = user ? 'Editar Usuario' : 'Nuevo Usuario';
        modal.classList.remove('hidden');
    }

    hideUserModal() {
        document.getElementById('userModal').classList.add('hidden');
    }

    async handleUserSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const username = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        submitBtn.disabled = true;

        try {
            if (id) {
                // Update existing user via RPC
                const { error } = await supabase.rpc('admin_update_user', {
                    target_user_id: id,
                    new_username: username,
                    new_email: email,
                    new_password: password || null
                });

                if (error) throw error;

                alert('Usuario actualizado correctamente.');
            } else {
                // Create user (standard signUp)
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username },
                        // In Admin mode, we might want to skip email confirmation if possible, 
                        // but JS SDK doesn't allow it without Service Key.
                    }
                });
                if (error) throw error;
                alert('Usuario creado. Se ha enviado un correo de confirmación.');
            }

            this.hideUserModal();
            this.loadUsers();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
        }
    }

    async editUser(id) {
        const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        this.showUserModal(user);
    }

    async deleteUser(id) {
        if (!confirm('¿Estás seguro de eliminar este usuario? Se borrará de la base de datos de autenticación y su perfil.')) return;

        try {
            const { error } = await supabase.rpc('admin_delete_user', {
                target_user_id: id
            });

            if (error) throw error;
            this.loadUsers();
            alert('Usuario eliminado correctamente.');
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }

    // --- Bible Editor ---
    async loadBooks() {
        const { data: books } = await supabase
            .from('bible_books')
            .select('*')
            .order('book_order');

        this.books = books || [];
        const bookSelect = document.getElementById('bookSelect');
        bookSelect.innerHTML = '<option value="">Seleccionar Libro</option>' +
            this.books.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }

    async handleBookChange(e) {
        const bookId = e.target.value;
        const chapterSelect = document.getElementById('chapterSelect');
        const btnAddVerse = document.getElementById('btnAddVerse');

        if (!bookId) {
            chapterSelect.disabled = true;
            btnAddVerse.disabled = true;
            return;
        }

        const book = this.books.find(b => b.id == bookId);
        chapterSelect.disabled = false;
        btnAddVerse.disabled = false;

        let html = '<option value="">Capítulo</option>';
        for (let i = 1; i <= book.total_chapters; i++) {
            html += `<option value="${i}">${i}</option>`;
        }
        chapterSelect.innerHTML = html;
        document.getElementById('verseList').innerHTML = '<p class="empty-message">Selecciona un capítulo</p>';
    }

    async loadVerses() {
        const bookId = document.getElementById('bookSelect').value;
        const chapterNum = document.getElementById('chapterSelect').value;
        const container = document.getElementById('verseList');

        if (!bookId || !chapterNum) return;

        container.innerHTML = '<p class="empty-message">Cargando versículos...</p>';

        const { data: verses, error } = await supabase
            .from('bible_verses')
            .select('*')
            .eq('book_id', bookId)
            .eq('chapter_number', chapterNum)
            .order('verse_number');

        if (error) {
            container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            return;
        }

        if (verses.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay versículos en este capítulo.</p>';
            return;
        }

        container.innerHTML = verses.map(v => `
            <div class="verse-item" id="verse-${v.id}">
                <div class="verse-number">${v.verse_number}</div>
                <div class="verse-text" contenteditable="true" onblur="window.adminPanel.saveVerse(${v.id}, this)">${v.text}</div>
                <button class="action-btn btn-delete" onclick="window.adminPanel.deleteVerse(${v.id})" title="Borrar Versículo">🗑️</button>
            </div>
        `).join('');
    }

    async saveVerse(id, element) {
        let newText = element.innerText.trim();

        // Auto-correct common orthographic issues: 
        // 1. Capital letter after comma: ,A -> , A
        // 2. Space after punctuation: ,.!?
        newText = newText
            .replace(/,([A-ZÁÉÍÓÚÑ])/g, ', $1') // Comma + Capital
            .replace(/([,\.!\?])([^\s0-9\)])/g, '$1 $2'); // Missing space after punct (except numbers/closing parenthesis)

        const { error } = await supabase
            .from('bible_verses')
            .update({ text: newText })
            .eq('id', id);

        if (error) {
            alert('Error al guardar: ' + error.message);
            element.innerText = 'Error - Recargar';
        } else {
            console.log('Versículo guardado:', id);
            element.innerText = newText; // Show corrected text in UI
            element.classList.add('fade-in');
            setTimeout(() => element.classList.remove('fade-in'), 500);
        }
    }

    async deleteVerse(id) {
        if (!confirm('¿Eliminar este versículo?')) return;

        const { error } = await supabase
            .from('bible_verses')
            .delete()
            .eq('id', id);

        if (error) alert('Error: ' + error.message);
        else this.loadVerses();
    }

    async addNewVerse() {
        const bookId = document.getElementById('bookSelect').value;
        const chapterNum = document.getElementById('chapterSelect').value;
        if (!bookId || !chapterNum) return;

        // Get last verse number
        const { data: lastVerse } = await supabase
            .from('bible_verses')
            .select('verse_number')
            .eq('book_id', bookId)
            .eq('chapter_number', chapterNum)
            .order('verse_number', { ascending: false })
            .limit(1)
            .single();

        const nextNum = (lastVerse ? lastVerse.verse_number : 0) + 1;
        const text = prompt('Texto del nuevo versículo:');

        if (text) {
            const { error } = await supabase
                .from('bible_verses')
                .insert({
                    book_id: bookId,
                    chapter_number: chapterNum,
                    verse_number: nextNum,
                    text: text
                });

            if (error) alert('Error: ' + error.message);
            else this.loadVerses();
        }
    }
}

// Global instance for inline onclicks
window.adminPanel = new AdminPanel();
