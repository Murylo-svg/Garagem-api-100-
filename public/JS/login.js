// Aguarda o conteúdo do DOM ser completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function() {

    // Seleciona os elementos do formulário
    const formCadastro = document.getElementById('formCadastro');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    const mensagemDiv = document.getElementById('mensagem');

    // Adiciona um "escutador" para o evento de submit do formulário
    formCadastro.addEventListener('submit', function(event) {
        // Previne o comportamento padrão do formulário (que é recarregar a página)
        event.preventDefault();

        // Pega os valores dos campos, removendo espaços em branco no início e no fim
        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();
        const confirmarSenha = confirmarSenhaInput.value.trim();

        // Limpa mensagens anteriores
        mensagemDiv.textContent = '';
        mensagemDiv.style.color = 'red'; // Cor padrão para erros

        // --- VALIDAÇÕES ---

        // 1. Validação do comprimento da senha
        if (senha.length < 6) {
            mensagemDiv.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            return; // Para a execução se a senha for inválida
        }

        // 2. Validação de confirmação de senha
        if (senha !== confirmarSenha) {
            mensagemDiv.textContent = 'As senhas não conferem.';
            return; // Para a execução se as senhas forem diferentes
        }

        // --- SUCESSO ---

        // Se todas as validações passaram
        console.log('Dados do Cadastro:', { nome, email, senha }); // Mostra os dados no console
        
        // Exibe mensagem de sucesso para o usuário
        mensagemDiv.textContent = 'Cadastro realizado com sucesso!';
        mensagemDiv.style.color = 'green';

        // Limpa o formulário após o sucesso
        formCadastro.reset();

        // Opcional: Redireciona para a página de login após alguns segundos
        setTimeout(() => {
            window.location.href = '/login.html'; // Redireciona para a página de login
        }, 2000); // 2000 milissegundos = 2 segundos
    });
});