// public/JS/cadastro.js
document.addEventListener('DOMContentLoaded', function() {
    const formCadastro = document.getElementById('formCadastro');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');

    formCadastro.addEventListener('submit', async function(event) {
        event.preventDefault();

        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();
        const confirmarSenha = confirmarSenhaInput.value.trim();

        if (senha.length < 6) {
            showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }
        if (senha !== confirmarSenha) {
            showToast('As senhas não conferem.', 'error');
            return;
        }
        if (!nome || !email || !senha) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Nome_Usuario: nome,
                    Email_login: email,
                    Senha_login: senha
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message || 'Cadastro realizado com sucesso!', 'success');
                formCadastro.reset();
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                throw new Error(data.message || 'Erro no cadastro. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro na requisição de cadastro:', error);
            showToast(error.message, 'error');
        }
    });
});