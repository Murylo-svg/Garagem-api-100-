// main.js

// Espera o conteúdo da página carregar completamente ANTES de executar qualquer script.
// Usamos apenas UM 'DOMContentLoaded' para organizar todo o código.
document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------
    // 1. LÓGICA DO MENU HAMBÚRGUER
    // -----------------------------------------
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Opcional: Fecha o menu se o usuário clicar fora dele
        document.addEventListener('click', (event) => {
            const isClickInsideMenu = navMenu.contains(event.target);
            const isClickOnHamburger = hamburgerBtn.contains(event.target);

            if (!isClickInsideMenu && !isClickOnHamburger && navMenu.classList.contains('active')) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // -----------------------------------------
    // 2. LÓGICA PARA AGENDAMENTOS
    // -----------------------------------------
    const formAgendamento = document.getElementById('formAgendamento');
    const listaAgendamentos = document.getElementById('listaAgendamentos');
    const storageKeyAgendamentos = 'agendamentosGaragem'; // Chave única para o localStorage

    // Verifica se os elementos do formulário de agendamento existem antes de adicionar os eventos
    if (formAgendamento && listaAgendamentos) {
        // Carrega os agendamentos salvos ao iniciar a página
        carregarAgendamentos();

        formAgendamento.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede que a página recarregue

            const data = document.getElementById('data').value;
            const hora = document.getElementById('hora').value;
            const descricao = document.getElementById('descricao').value;

            if (data && hora && descricao) {
                const agendamento = {
                    id: Date.now(), // Cria um ID único baseado no tempo
                    data,
                    hora,
                    descricao
                };
                salvarAgendamento(agendamento);
                adicionarAgendamentoNaLista(agendamento);
                formAgendamento.reset();
            } else {
                alert('Por favor, preencha todos os campos do agendamento.');
            }
        });
    }

    function salvarAgendamento(agendamento) {
        const agendamentos = JSON.parse(localStorage.getItem(storageKeyAgendamentos)) || [];
        agendamentos.push(agendamento);
        localStorage.setItem(storageKeyAgendamentos, JSON.stringify(agendamentos));
    }

    function carregarAgendamentos() {
        const agendamentos = JSON.parse(localStorage.getItem(storageKeyAgendamentos)) || [];
        // Ordena por data antes de exibir
        agendamentos.sort((a, b) => new Date(a.data + 'T' + a.hora) - new Date(b.data + 'T' + b.hora));
        agendamentos.forEach(agendamento => adicionarAgendamentoNaLista(agendamento));
    }

    function adicionarAgendamentoNaLista(agendamento) {
        const li = document.createElement('li');
        li.className = 'agendamento-item';
        li.dataset.id = agendamento.id;

        li.innerHTML = `
            <p><strong>Data:</strong> ${formatarData(agendamento.data)}</p>
            <p><strong>Hora:</strong> ${agendamento.hora}</p>
            <p><strong>Descrição:</strong> ${agendamento.descricao}</p>
            <button class="delete-btn">Excluir</button>
        `;
        listaAgendamentos.appendChild(li);

        li.querySelector('.delete-btn').addEventListener('click', () => {
            excluirAgendamento(agendamento.id);
            li.remove(); // Remove o item da tela imediatamente
        });
    }

    function excluirAgendamento(id) {
        let agendamentos = JSON.parse(localStorage.getItem(storageKeyAgendamentos)) || [];
        agendamentos = agendamentos.filter(ag => ag.id !== id);
        localStorage.setItem(storageKeyAgendamentos, JSON.stringify(agendamentos));
    }

    function formatarData(dataString) {
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    // -----------------------------------------
    // 3. LÓGICA PARA VEÍCULOS
    // -----------------------------------------
    const formVeiculo = document.getElementById('formVeiculo');
    const listaVeiculos = document.getElementById('listaVeiculos');
    const storageKeyVeiculos = 'veiculosGaragem'; // Chave única para o localStorage

    // Verifica se os elementos do formulário de veículos existem
    if (formVeiculo && listaVeiculos) {
        // Carrega os veículos salvos ao iniciar a página
        carregarVeiculos();

        formVeiculo.addEventListener('submit', (e) => {
            e.preventDefault();

            const modelo = document.getElementById('modeloVeiculo').value;
            const placa = document.getElementById('placaVeiculo').value;
            const ano = document.getElementById('anoVeiculo').value;

            if (modelo && placa && ano) {
                const veiculo = {
                    id: Date.now(),
                    modelo,
                    placa,
                    ano
                };
                salvarVeiculo(veiculo);
                adicionarVeiculoNaLista(veiculo);
                formVeiculo.reset();
            } else {
                alert('Por favor, preencha todos os campos do veículo.');
            }
        });
    }

    function salvarVeiculo(veiculo) {
        const veiculos = JSON.parse(localStorage.getItem(storageKeyVeiculos)) || [];
        veiculos.push(veiculo);
        localStorage.setItem(storageKeyVeiculos, JSON.stringify(veiculos));
    }

    function carregarVeiculos() {
        const veiculos = JSON.parse(localStorage.getItem(storageKeyVeiculos)) || [];
        veiculos.forEach(veiculo => adicionarVeiculoNaLista(veiculo));
    }

    function adicionarVeiculoNaLista(veiculo) {
        const li = document.createElement('li');
        li.className = 'veiculo-item';
        li.dataset.id = veiculo.id;

        li.innerHTML = `
            <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
            <p><strong>Placa:</strong> ${veiculo.placa}</p>
            <p><strong>Ano:</strong> ${veiculo.ano}</p>
            <button class="delete-btn">Excluir</button>
        `;
        listaVeiculos.appendChild(li);

        li.querySelector('.delete-btn').addEventListener('click', () => {
            excluirVeiculo(veiculo.id);
            li.remove();
        });
    }

    function excluirVeiculo(id) {
        let veiculos = JSON.parse(localStorage.getItem(storageKeyVeiculos)) || [];
        veiculos = veiculos.filter(v => v.id !== id);
        localStorage.setItem(storageKeyVeiculos, JSON.stringify(veiculos));
    }
});