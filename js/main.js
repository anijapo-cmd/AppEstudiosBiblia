import { BibleNavigation, generateStudiesMenu } from './bible-navigation.js';
import { ChapterViewer } from './chapter-viewer.js';
import { BookStudyEditor } from './book-study.js';
import { ThemeManager } from './theme-manager.js';
import supabase from './supabase-client.js';

class BibleApp {
  constructor() {
    this.bibleNav = new BibleNavigation();
    this.chapterViewer = new ChapterViewer('.main-content');
    this.bookStudyEditor = new BookStudyEditor('.main-content');
    this.themeManager = new ThemeManager();
    this.currentView = 'home';
  }

  init() {
    // Generate menus
    this.bibleNav.generateBibleMenu();
    generateStudiesMenu();

    // Setup theme toggle
    this.themeManager.setupToggleButton();

    // Setup event listeners
    this.setupEventListeners();

    // Initialize auth listener
    this.initAuth();

    // Show home view
    this.showHome();
  }

  async initAuth() {
    const headerAuthBtn = document.getElementById('headerAuthBtn');
    const headerUserProfile = document.getElementById('headerUserProfile');
    const headerUsername = document.getElementById('headerUsername');
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');

    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Initial session check:", session ? session.user.email : "No session");
    await this.updateAuthUI(session);

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.updateAuthUI(session);
    });

    if (headerLogoutBtn) {
      headerLogoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
      });
    }
  }

  async updateAuthUI(session) {
    const headerAuthBtn = document.getElementById('headerAuthBtn');
    const headerUserProfile = document.getElementById('headerUserProfile');
    const headerUsername = document.getElementById('headerUsername');

    if (!headerAuthBtn || !headerUserProfile) return;

    if (session) {
      headerAuthBtn.classList.add('hidden');
      headerUserProfile.classList.remove('hidden');

      // Get username and admin status from profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, is_admin')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        headerUsername.textContent = profile.username;
        this.updateAdminNav(profile.is_admin);
      } else {
        // Fallback or Error
        headerUsername.textContent = session.user.email.split('@')[0];

        // Safety check for Esteban if profile fetch failed
        const isEsteban = session.user.email === 'anijapo@gmail.com';
        this.updateAdminNav(isEsteban);
      }
    } else {
      headerAuthBtn.classList.remove('hidden');
      headerUserProfile.classList.add('hidden');
      this.updateAdminNav(false);
    }
  }

  updateAdminNav(isAdmin) {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    let adminLink = document.getElementById('navAdminLink');

    if (isAdmin) {
      if (!adminLink) {
        adminLink = document.createElement('div');
        adminLink.id = 'navAdminLink';
        adminLink.className = 'nav-item';
        adminLink.textContent = 'Administrar';
        adminLink.style.cursor = 'pointer';
        adminLink.onclick = () => window.location.href = 'admin.html';
        nav.appendChild(adminLink);
      }
    } else {
      if (adminLink) {
        adminLink.remove();
      }
    }
  }

  setupEventListeners() {
    // Chapter navigation
    document.addEventListener('navigateToChapter', (e) => {
      this.showChapter(e.detail.bookIndex, e.detail.chapter);
    });

    // Book study navigation
    document.addEventListener('navigateToBookStudy', (e) => {
      this.showBookStudy(e.detail.bookIndex);
    });

    // Thematic studies navigation
    document.addEventListener('navigateToThematicStudies', () => {
      this.showThematicStudies();
    });

    // Home navigation
    document.addEventListener('navigateToHome', () => {
      this.showHome();
    });

    // Logo click
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
      logoContainer.addEventListener('click', () => {
        this.showHome();
      });
    }
  }

  showHome() {
    this.currentView = 'home';
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
      <div class="fade-in" style="text-align: center; padding: 4rem 2rem;">
        <img src="assets/logo.png" alt="Biblia" style="max-width: 400px; width: 100%; margin-bottom: 2rem;">
        <h1 style="font-size: 2.5rem; color: var(--accent-primary); margin-bottom: 1rem;">
          Bienvenido a la Aplicación de Estudios Bíblicos
        </h1>
        <p style="font-size: 1.25rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
          Explora la Palabra de Dios a través de la Biblia Reina Valera 1960 y profundiza tu conocimiento con estudios detallados.
        </p>
        <div style="margin-top: 3rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <div style="background: var(--bg-secondary); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); max-width: 300px;">
            <h3 style="color: var(--accent-primary); margin-bottom: 1rem;">📖 Biblia</h3>
            <p style="color: var(--text-secondary);">Navega por los 66 libros de la Biblia y lee cada capítulo</p>
          </div>
          <div style="background: var(--bg-secondary); padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); max-width: 300px;">
            <h3 style="color: var(--accent-primary); margin-bottom: 1rem;">📚 Estudios</h3>
            <p style="color: var(--text-secondary);">Crea y edita estudios detallados de cada libro bíblico</p>
          </div>
        </div>
      </div>
    `;
  }

  async showChapter(bookIndex, chapterNumber) {
    this.currentView = 'chapter';
    await this.chapterViewer.render(bookIndex, chapterNumber);
  }

  async showBookStudy(bookIndex) {
    this.currentView = 'bookStudy';
    await this.bookStudyEditor.render(bookIndex);
  }

  showThematicStudies() {
    this.currentView = 'thematicStudies';
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
      <div class="fade-in" style="text-align: center; padding: 4rem 2rem;">
        <h1 style="font-size: 2rem; color: var(--accent-primary); margin-bottom: 1rem;">
          Estudios Temáticos
        </h1>
        <p style="color: var(--text-muted);">
          Esta funcionalidad estará disponible próximamente.
        </p>
      </div>
    `;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new BibleApp();
  app.init();
});
