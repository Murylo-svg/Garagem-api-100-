// login.js
document.addEventListener('DOMContentLoaded', function() {
    const formLogin = document.getElementById('formLogin');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const mensagemDiv = document.getElementById('mensagem');

    formLogin.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();

        mensagemDiv.textContent = '';
        mensagemDiv.style.color = 'red';

        // --- VALIDAÇÕES BÁSICAS NO CLIENTE ---
        if (!email || !senha) {
            mensagemDiv.textContent = 'Por favor, preencha todos os campos.';
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            mensagemDiv.textContent = 'Por favor, insira um email válido.';
            return;
        }

        // --- REQUISIÇÃO PARA O BACKEND DE LOGIN ---
        try {
            const response = await fetch('http://localhost:3001/api/auth/login', { // URL da sua API de login
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Email_login: email, // Corresponde ao nome da coluna no MySQL
                    Senha_login: senha // Corresponde ao nome da coluna no MySQL
                })
            });

            const data = await response.json();

            if (response.ok && data.token) { // Se o login foi bem-sucedido e retornou um token
                mensagemDiv.textContent = `Login bem-sucedido! Bem-vindo(a), ${data.nomeUsuario || email}!`;
                mensagemDiv.style.color = 'green';

                // Salvar o token e o nome do usuário no localStorage
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userName', data.nomeUsuario || email); // Use o nome retornado ou o email

                // Redireciona para a página principal ou dashboard
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // Se o servidor retornou um erro (ex: credenciais inválidas)
                mensagemDiv.textContent = data.message || 'Erro ao fazer login. Verifique suas credenciais.';
            }
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            mensagemDiv.textContent = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';
        } finally {
            // Limpa o campo da senha por segurança após a tentativa de login
            senhaInput.value = '';
        }
    });
});