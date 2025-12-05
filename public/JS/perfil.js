// public/JS/perfil.js
document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const emailInput = document.getElementById('profile-email');
    const nameInput = document.getElementById('profile-name');
    const ageInput = document.getElementById('profile-age');

    function getAuthHeader() {
        const token = localStorage.getItem('userToken');
        if (!token) {
            window.location.href = '/login/login.html'; // Redirect if not logged in
        }
        return { 'Authorization': `Bearer ${token}` };
    }

    async function fetchProfile() {
        try {
            const response = await fetch('/api/users/profile', { headers: getAuthHeader() });
            const user = await response.json();

            if (!response.ok) {
                throw new Error(user.message || 'Erro ao carregar perfil.');
            }

            emailInput.value = user.Email_login;
            nameInput.value = user.Nome_Usuario;
            ageInput.value = user.Idade || '';

        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            Nome_Usuario: nameInput.value,
            Idade: ageInput.value,
        };

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(updatedData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro ao atualizar perfil.');
            }

            showToast('Perfil atualizado com sucesso!', 'success');
            // Update the name in localStorage if it changed
            localStorage.setItem('userName', result.user.Nome_Usuario);

        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    fetchProfile();
});
