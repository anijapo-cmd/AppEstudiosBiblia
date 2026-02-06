// Supabase Client Configuration
const SUPABASE_URL = 'https://osmgxarjafncrwefgdzw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbWd4YXJqYWZuY3J3ZWZnZHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg0MDQsImV4cCI6MjA4NDQxNDQwNH0.SbxeioVzmVn-kd3-VoDBnavSwgh7oYzaZKOv15_SBDU';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bible Books API
export const BibleAPI = {
  // Get all books
  async getAllBooks() {
    const { data, error } = await supabase
      .from('bible_books')
      .select('*')
      .order('book_order');

    if (error) {
      console.error('Error fetching books:', error);
      return [];
    }
    return data;
  },

  // Get a specific book by ID
  async getBook(bookId) {
    const { data, error } = await supabase
      .from('bible_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Error fetching book:', error);
      return null;
    }
    return data;
  },

  // Get chapter verses (returns array of verse objects)
  async getChapter(bookId, chapterNumber) {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .order('verse_number');

    if (error) {
      console.error('Error fetching chapter verses:', error);
      return [];
    }
    return data;
  },

  // Get specific verse
  async getVerse(bookId, chapterNumber, verseNumber) {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .eq('verse_number', verseNumber)
      .single();

    if (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
    return data;
  },

  // Search verses by text
  async searchVerses(searchTerm, bookId = null) {
    let query = supabase
      .from('bible_verses')
      .select(`
        *,
        bible_books!inner(name, testament)
      `)
      .ilike('text', `%${searchTerm}%`)
      .limit(50);

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching verses:', error);
      return [];
    }
    return data;
  },

  // Get all chapters for a book
  async getBookChapters(bookId) {
    const { data, error } = await supabase
      .from('bible_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number');

    if (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
    return data;
  }
};

// Book Studies API
export const StudiesAPI = {
  // Helper to get current user session
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get study for a specific book
  async getBookStudy(bookId) {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('book_studies')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching book study:', error);
      return null;
    }
    return data;
  },

  // Create or update book study
  async saveBookStudy(bookId, studyData) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('book_studies')
      .upsert({
        user_id: user.id,
        book_id: bookId,
        ...studyData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, book_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving book study:', error);
      throw error;
    }
    return data;
  },

  // Get all thematic studies
  async getThematicStudies() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('thematic_studies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching thematic studies:', error);
      return [];
    }
    return data;
  },

  // Create thematic study
  async createThematicStudy(studyData) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('thematic_studies')
      .insert({
        ...studyData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating thematic study:', error);
      throw error;
    }
    return data;
  },

  // Update thematic study
  async updateThematicStudy(id, studyData) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('thematic_studies')
      .update({
        ...studyData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Security check
      .select()
      .single();

    if (error) {
      console.error('Error updating thematic study:', error);
      throw error;
    }
    return data;
  },

  // Delete thematic study
  async deleteThematicStudy(id) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('thematic_studies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Security check

    if (error) {
      console.error('Error deleting thematic study:', error);
      throw error;
    }
  }
};

export default supabase;
