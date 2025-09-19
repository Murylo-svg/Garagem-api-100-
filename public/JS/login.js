// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do formulário
    const form = document.getElementById('formLogin');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const mensagemDiv = document.getElementById('mensagem');

    // Se o formulário não existir, o script para
    if (!form) return;

    // Função para exibir mensagens
    const exibirMensagem = (msg, tipo) => {
        mensagemDiv.textContent = msg;
        mensagemDiv.className = tipo;
    };

    // Adiciona o evento de envio do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        // --- Validação no Frontend ---
        if (!email || !senha) {
            exibirMensagem('Por favor, preencha todos os campos.', 'erro');
            return;
        }

        // --- Envio dos dados para a API de login ---
        try {
            const resposta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
            });

            const dados = await resposta.json();

            if (resposta.ok) { // Se o login foi bem-sucedido
                // **PASSO MAIS IMPORTANTE: SALVAR O TOKEN!**
                // O token é a "chave" que prova que o usuário está logado.
                localStorage.setItem('token', dados.token);
                
                exibirMensagem('Login bem-sucedido! Redirecionando...', 'sucesso');

                // Redireciona para a página principal/dashboard após 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/dashboard.html'; // Altere para sua página principal
                }, 1500);

            } else {
                // Se o servidor retornou erro (credenciais inválidas, etc.)
                exibirMensagem(dados.error || 'Ocorreu um erro desconhecido.', 'erro');
            }
        } catch (error) {
            // Se houve erro de rede
            console.error('Erro na requisição:', error);
            exibirMensagem('Não foi possível conectar ao servidor. Tente novamente mais tarde.', 'erro');
        }
    });
});