import supabase from './supabase-client.js';
import { ThemeManager } from './theme-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    const themeManager = new ThemeManager();
    themeManager.setupToggleButton();

    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authSubtitle = document.getElementById('authSubtitle');
    const authMessage = document.getElementById('authMessage');

    // Tab Switching
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authSubtitle.textContent = 'Accede a tu cuenta de estudios';
        hideMessage();
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        authSubtitle.textContent = 'Crea una cuenta nueva';
        hideMessage();
    });

    // Helper Functions
    function showMessage(text, type = 'error') {
        authMessage.textContent = text;
        authMessage.className = `auth-message ${type}`;
        authMessage.classList.remove('hidden');
    }

    function hideMessage() {
        authMessage.classList.add('hidden');
    }

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = loginForm.querySelector('button');

        submitBtn.disabled = true;
        hideMessage();

        try {
            let email = identifier;

            // If it doesn't look like an email, try to find the email associated with the username in profiles
            if (!identifier.includes('@')) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('username', identifier)
                    .single();

                if (profileError || !profile) {
                    throw new Error('Usuario no encontrado');
                }
                email = profile.email;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            showMessage('¡Ingreso exitoso! Redirigiendo...', 'success');
            setTimeout(() => window.location.href = 'index.html', 1500);

        } catch (error) {
            showMessage(error.message);
            submitBtn.disabled = false;
        }
    });

    // Register Logic
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const submitBtn = registerForm.querySelector('button');

        submitBtn.disabled = true;
        hideMessage();

        try {
            // Validation: Password match
            if (password !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            // Validation: Unique Username
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (existingUser) {
                throw new Error('El nombre de usuario ya está en uso');
            }

            // Supabase Auth Sign Up
            // We pass username in user_metadata so the trigger handle_new_user picks it up
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;

            if (data.user && data.session) {
                showMessage('¡Registro exitoso!', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                showMessage('Se ha enviado un correo de confirmación. Por favor revisa tu bandeja de entrada.', 'success');
            }

        } catch (error) {
            showMessage(error.message);
            submitBtn.disabled = false;
        }
    });
});
