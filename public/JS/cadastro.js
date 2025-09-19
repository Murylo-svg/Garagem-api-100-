// js/cadastro.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do formulário
    const form = document.getElementById('formCadastro');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    const mensagemDiv = document.getElementById('mensagem'); // Um <div> para exibir feedback

    // Se o formulário não existir nesta página, o script para de executar
    if (!form) return;

    // Função para exibir mensagens de erro ou sucesso
    const exibirMensagem = (msg, tipo) => {
        mensagemDiv.textContent = msg;
        // Adiciona uma classe para estilizar a mensagem (ex: .sucesso, .erro)
        mensagemDiv.className = tipo; 
    };

    // Adiciona um evento que é disparado quando o formulário é enviado
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o comportamento padrão de recarregar a página

        // Pega os valores dos campos, removendo espaços em branco
        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;

        // --- Validação no Frontend ---
        if (senha !== confirmarSenha) {
            exibirMensagem('As senhas não são iguais.', 'erro');
            return;
        }

        if (senha.length < 6) {
            exibirMensagem('A senha deve ter pelo menos 6 caracteres.', 'erro');
            return;
        }

        // --- Envio dos dados para a API ---
        try {
            // Faz a requisição POST para o endpoint de registro no backend
            const resposta = await fetch('/api/auth/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nome, email, senha }),
            });

            const dados = await resposta.json();

            if (resposta.ok) { // Se a resposta foi bem-sucedida (status 2xx)
                exibirMensagem('Cadastro realizado com sucesso! Redirecionando...', 'sucesso');
                form.reset(); // Limpa o formulário
                
                // Espera 2 segundos e redireciona o usuário para a página de login
                setTimeout(() => {
                    window.location.href = '/login.html'; // Altere se o nome da sua página for diferente
                }, 2000);
            } else {
                // Se o servidor retornou um erro (ex: email já existe)
                exibirMensagem(dados.error || 'Ocorreu um erro desconhecido.', 'erro');
            }
        } catch (error) {
            // Se houve um erro de rede (servidor fora do ar, etc.)
            console.error('Erro na requisição:', error);
            exibirMensagem('Não foi possível conectar ao servidor. Tente novamente mais tarde.', 'erro');
        }
    });
});