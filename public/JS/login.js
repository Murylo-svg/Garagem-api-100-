// Aguarda o conteúdo do DOM ser completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function() {

    // Seleciona os elementos do formulário de login
    const formLogin = document.getElementById('formLogin');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const mensagemDiv = document.getElementById('mensagem');

    // Adiciona um "escutador" para o evento de submit do formulário
    formLogin.addEventListener('submit', function(event) {
        // Previne o comportamento padrão do formulário (que é recarregar a página)
        event.preventDefault();

        // Pega os valores dos campos, removendo espaços em branco no início e no fim
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();

        // Limpa mensagens anteriores
        mensagemDiv.textContent = '';
        mensagemDiv.style.color = 'red'; // Cor padrão para erros

        // --- VALIDAÇÕES BÁSICAS NO CLIENTE ---

        // 1. Validação de campos vazios
        if (!email || !senha) {
            mensagemDiv.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        // 2. Validação simples de formato de email (pode ser mais robusta)
        if (!email.includes('@') || !email.includes('.')) {
            mensagemDiv.textContent = 'Por favor, insira um email válido.';
            return;
        }

        // --- SIMULAÇÃO DE LOGIN COM SERVIDOR (REAL-WORLD SCENARIO) ---
        // Em um cenário real, você faria uma requisição HTTP (fetch ou XMLHttpRequest) para seu backend aqui.

        console.log('Tentando logar com:', { email, senha });

        // Exemplo de requisição (ASSUMA que o servidor está rodando em http://localhost:3001)
        fetch('http://localhost:3001/api/auth/login', { // Altere para a URL do seu backend
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        })
        .then(response => response.json()) // Converte a resposta para JSON
        .then(data => {
            if (data.token) { // Se o login foi bem-sucedido e retornou um token
                mensagemDiv.textContent = `Login bem-sucedido! Bem-vindo(a), ${data.nomeUsuario}!`;
                mensagemDiv.style.color = 'green';
                
                // Opcional: Salvar o token no localStorage para manter o usuário logado
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userName', data.nomeUsuario);

                // Redireciona para uma página protegida (ex: dashboard)
                setTimeout(() => {
                    window.location.href = 'index.html'; // Altere para a página principal após o login
                }, 1500); // 1.5 segundos
            } else {
                // Se o servidor retornou um erro (ex: credenciais inválidas)
                mensagemDiv.textContent = data.error || 'Erro ao fazer login. Verifique suas credenciais.';
                mensagemDiv.style.color = 'red';
            }
        })
        .catch(error => {
            // Lidar com erros de rede ou servidor não acessível
            console.error('Erro na requisição de login:', error);
            mensagemDiv.textContent = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';
            mensagemDiv.style.color = 'red';
        });

        // Limpa o campo da senha por segurança após a tentativa de login (mantém o email)
        senhaInput.value = '';
    });
});