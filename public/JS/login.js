document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const feedbackEl = document.getElementById('feedback');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.mensagem || 'Erro ao fazer login.');
            }

            // Armazena os dados do usuário no localStorage para usar em outras páginas
            localStorage.setItem('usuarioLogado', JSON.stringify(result.usuario));

            feedbackEl.textContent = 'Login bem-sucedido! Redirecionando...';
            feedbackEl.style.color = 'green';
            
            // Redireciona para a página principal (index.html)
            setTimeout(() => {
                window.location.href = '../index.html'; // Ajuste o caminho se necessário
            }, 1500);

        } catch (error) {
            feedbackEl.textContent = error.message;
            feedbackEl.style.color = 'red';
        }
    });
});