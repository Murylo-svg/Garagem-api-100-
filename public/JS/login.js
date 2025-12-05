// public/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const formLogin = document.getElementById('formLogin');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');

    formLogin.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();

        if (!email || !senha) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Email_login: email,
                    Senha_login: senha
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userName', data.nomeUsuario || email);

                showToast(`Login bem-sucedido! Bem-vindo(a), ${data.nomeUsuario || email}!`, 'success');

                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);

            } else {
                throw new Error(data.message || 'Erro ao fazer login. Verifique suas credenciais.');
            }
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            showToast(error.message, 'error');
            senhaInput.value = '';
        }
    });
});