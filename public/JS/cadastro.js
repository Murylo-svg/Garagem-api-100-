// cadastro.js
document.addEventListener('DOMContentLoaded', function() {
    const formCadastro = document.getElementById('formCadastro');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    const mensagemDiv = document.getElementById('mensagem');

    formCadastro.addEventListener('submit', async function(event) {
        event.preventDefault();

        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();
        const confirmarSenha = confirmarSenhaInput.value.trim();

        mensagemDiv.textContent = '';
        mensagemDiv.style.color = 'red';

        // --- VALIDAÇÕES CLIENTE-SIDE ---
        if (senha.length < 6) {
            mensagemDiv.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            return;
        }
        if (senha !== confirmarSenha) {
            mensagemDiv.textContent = 'As senhas não conferem.';
            return;
        }
        if (!nome || !email || !senha || !confirmarSenha) {
            mensagemDiv.textContent = 'Por favor, preencha todos os campos.';
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            mensagemDiv.textContent = 'Por favor, insira um email válido.';
            return;
        }

        // --- REQUISIÇÃO PARA O BACKEND ---
        try {
            const response = await fetch('http://127.0.0.1:3306/api/usuarios', { // URL da sua API de cadastro
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Nome_Usuario: nome, // Corresponde ao nome da coluna no MySQL
                    Email_login: email, // Corresponde ao nome da coluna no MySQL
                    Senha_login: senha // Corresponde ao nome da coluna no MySQL
                    // Idade pode ser adicionada aqui se o formulário tiver um campo para isso
                })
            });

            const data = await response.json();

            if (response.ok) { // Se a resposta HTTP for 2xx (Sucesso)
                mensagemDiv.textContent = data.message || 'Cadastro realizado com sucesso!';
                mensagemDiv.style.color = 'green';
                formCadastro.reset();

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else { // Se a resposta HTTP for um erro (4xx, 5xx)
                mensagemDiv.textContent = data.message || 'Erro no cadastro. Tente novamente.';
            }
        } catch (error) {
            console.error('Erro na requisição de cadastro:', error);
            mensagemDiv.textContent = 'Erro ao conectar com o servidor. Verifique sua conexão.';
        }
    });
});