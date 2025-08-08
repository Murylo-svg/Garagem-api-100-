document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');
    const feedbackEl = document.getElementById('feedback');

    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch('http://localhost:3001/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome, email, senha }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.mensagem || 'Ocorreu um erro.');
            }

            feedbackEl.textContent = 'Cadastro realizado com sucesso! Redirecionando para o login...';
            feedbackEl.style.color = 'green';

            // Redireciona para a página de login após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            feedbackEl.textContent = error.message;
            feedbackEl.style.color = 'red';
        }
    });
});