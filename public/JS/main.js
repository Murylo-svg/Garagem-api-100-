// main.js
document.addEventListener('DOMContentLoaded', () => {

    // Função auxiliar para obter o cabeçalho de autorização
    function getAuthHeader() {
        const token = localStorage.getItem('userToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // -----------------------------------------
    // 1. LÓGICA DO MENU HAMBÚRGUER (sem alterações de backend)
    // -----------------------------------------
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

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
    // 2. LÓGICA PARA AGENDAMENTOS (AGORA COM BACKEND)
    // -----------------------------------------
    const formAgendamento = document.getElementById('formAgendamento');
    const listaAgendamentos = document.getElementById('listaAgendamentos');
    const agendamentoMensagemDiv = document.getElementById('agendamentoMensagem'); // Adicionado para mensagens de agendamento

    if (formAgendamento && listaAgendamentos) {
        carregarAgendamentos(); // Carrega agendamentos do backend

        formAgendamento.addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = document.getElementById('data').value;
            const hora = document.getElementById('hora').value;
            const descricao = document.getElementById('descricao').value;

            if (data && hora && descricao) {
                const agendamento = { data, hora, descricao };
                await salvarAgendamento(agendamento);
                formAgendamento.reset();
                listaAgendamentos.innerHTML = ''; // Limpa a lista para recarregar do backend
                carregarAgendamentos();
            } else {
                exibirMensagem(agendamentoMensagemDiv, 'Por favor, preencha todos os campos do agendamento.', 'red');
            }
        });
    }

    async function salvarAgendamento(agendamento) {
        try {
            const response = await fetch('http://localhost:3001/api/agendamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader() // Inclui o token de autenticação
                },
                body: JSON.stringify(agendamento)
            });

            const data = await response.json();
            if (response.ok) {
                exibirMensagem(agendamentoMensagemDiv, data.message || 'Agendamento adicionado com sucesso!', 'green');
            } else {
                exibirMensagem(agendamentoMensagemDiv, data.message || 'Erro ao adicionar agendamento.', 'red');
            }
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            exibirMensagem(agendamentoMensagemDiv, 'Erro de conexão ao salvar agendamento.', 'red');
        }
    }

    async function carregarAgendamentos() {
        listaAgendamentos.innerHTML = '<p>Carregando agendamentos...</p>';
        try {
            const response = await fetch('http://localhost:3001/api/agendamentos', {
                headers: getAuthHeader()
            });
            const agendamentos = await response.json();

            listaAgendamentos.innerHTML = ''; // Limpa a mensagem de carregamento
            if (response.ok && agendamentos.length > 0) {
                agendamentos.sort((a, b) => new Date(a.data + 'T' + a.hora) - new Date(b.data + 'T' + b.hora));
                agendamentos.forEach(agendamento => adicionarAgendamentoNaLista(agendamento));
            } else if (response.ok) {
                listaAgendamentos.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
            } else {
                exibirMensagem(agendamentoMensagemDiv, agendamentos.message || 'Erro ao carregar agendamentos.', 'red');
                listaAgendamentos.innerHTML = '<p>Erro ao carregar agendamentos.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            exibirMensagem(agendamentoMensagemDiv, 'Erro de conexão ao carregar agendamentos.', 'red');
            listaAgendamentos.innerHTML = '<p>Erro de conexão ao carregar agendamentos.</p>';
        }
    }

    function adicionarAgendamentoNaLista(agendamento) {
        const li = document.createElement('li');
        li.className = 'agendamento-item';
        li.dataset.id = agendamento.ID_Agendamento || agendamento.id; // Supondo ID_Agendamento do backend

        li.innerHTML = `
            <p><strong>Data:</strong> ${formatarData(agendamento.data)}</p>
            <p><strong>Hora:</strong> ${agendamento.hora}</p>
            <p><strong>Descrição:</strong> ${agendamento.descricao}</p>
            <button class="delete-btn" data-id="${agendamento.ID_Agendamento || agendamento.id}">Excluir</button>
        `;
        listaAgendamentos.appendChild(li);

        li.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const idParaExcluir = e.target.dataset.id;
            await excluirAgendamento(idParaExcluir);
            // Após excluir no backend, recarrega a lista para refletir a mudança
            listaAgendamentos.innerHTML = '';
            carregarAgendamentos();
        });
    }

    async function excluirAgendamento(id) {
        try {
            const response = await fetch(`http://localhost:3001/api/agendamentos/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            const data = await response.json();
            if (response.ok) {
                exibirMensagem(agendamentoMensagemDiv, data.message || 'Agendamento excluído com sucesso!', 'green');
            } else {
                exibirMensagem(agendamentoMensagemDiv, data.message || 'Erro ao excluir agendamento.', 'red');
            }
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
            exibirMensagem(agendamentoMensagemDiv, 'Erro de conexão ao excluir agendamento.', 'red');
        }
    }

    function formatarData(dataString) {
        const date = new Date(dataString); // Cria um objeto Date a partir da string
        // Garante que o mês e o dia tenham 2 dígitos (ex: 01, 02)
        const dia = String(date.getUTCDate()).padStart(2, '0');
        const mes = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
        const ano = date.getUTCFullYear();
        return `${dia}/${mes}/${ano}`;
    }


    // -----------------------------------------
    // 3. LÓGICA PARA VEÍCULOS (AGORA COM BACKEND)
    // -----------------------------------------
    const formVeiculo = document.getElementById('formVeiculo');
    const listaVeiculos = document.getElementById('listaVeiculos');
    const veiculoMensagemDiv = document.getElementById('veiculoMensagem'); // Adicionado para mensagens de veículo

    if (formVeiculo && listaVeiculos) {
        carregarVeiculos(); // Carrega veículos do backend

        formVeiculo.addEventListener('submit', async (e) => {
            e.preventDefault();

            const modelo = document.getElementById('modeloVeiculo').value;
            const placa = document.getElementById('placaVeiculo').value;
            const ano = document.getElementById('anoVeiculo').value;
            // Adicionando proprietario e cor, que estão nas tabelas do MySQL
            const nomeProprietario = localStorage.getItem('userName') || 'Desconhecido'; // Pegar do usuário logado
            const cor = document.getElementById('corVeiculo') ? document.getElementById('corVeiculo').value : 'Não Informada'; // Se você adicionar um campo de cor

            if (modelo && placa && ano) {
                const veiculo = {
                    modelo: modelo,
                    placa: placa,
                    ano: ano,
                    cor: cor, // Adicionado
                    nomeProprietario: nomeProprietario // Adicionado
                };
                await salvarVeiculo(veiculo);
                formVeiculo.reset();
                listaVeiculos.innerHTML = ''; // Limpa a lista para recarregar do backend
                carregarVeiculos();
            } else {
                exibirMensagem(veiculoMensagemDiv, 'Por favor, preencha todos os campos do veículo (Modelo, Placa, Ano).', 'red');
            }
        });
    }

    async function salvarVeiculo(veiculo) {
        try {
            const response = await fetch('http://localhost:3001/api/veiculos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(veiculo)
            });

            const data = await response.json();
            if (response.ok) {
                exibirMensagem(veiculoMensagemDiv, data.message || 'Veículo adicionado com sucesso!', 'green');
            } else {
                exibirMensagem(veiculoMensagemDiv, data.message || 'Erro ao adicionar veículo.', 'red');
            }
        } catch (error) {
            console.error('Erro ao salvar veículo:', error);
            exibirMensagem(veiculoMensagemDiv, 'Erro de conexão ao salvar veículo.', 'red');
        }
    }

    async function carregarVeiculos() {
        listaVeiculos.innerHTML = '<p>Carregando veículos...</p>';
        try {
            const response = await fetch('http://localhost:3001/api/veiculos', {
                headers: getAuthHeader()
            });
            const veiculos = await response.json();

            listaVeiculos.innerHTML = ''; // Limpa a mensagem de carregamento
            if (response.ok && veiculos.length > 0) {
                veiculos.forEach(veiculo => adicionarVeiculoNaLista(veiculo));
            } else if (response.ok) {
                listaVeiculos.innerHTML = '<p>Nenhum veículo encontrado.</p>';
            } else {
                exibirMensagem(veiculoMensagemDiv, veiculos.message || 'Erro ao carregar veículos.', 'red');
                listaVeiculos.innerHTML = '<p>Erro ao carregar veículos.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
            exibirMensagem(veiculoMensagemDiv, 'Erro de conexão ao carregar veículos.', 'red');
            listaVeiculos.innerHTML = '<p>Erro de conexão ao carregar veículos.</p>';
        }
    }

    function adicionarVeiculoNaLista(veiculo) {
        const li = document.createElement('li');
        li.className = 'veiculo-item';
        li.dataset.id = veiculo.ID_Veiculo || veiculo.id; // Supondo ID_Veiculo do backend

        li.innerHTML = `
            <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
            <p><strong>Placa:</strong> ${veiculo.placa}</p>
            <p><strong>Ano:</strong> ${veiculo.ano}</p>
            <p><strong>Cor:</strong> ${veiculo.cor || 'N/A'}</p>
            <button class="delete-btn" data-id="${veiculo.ID_Veiculo || veiculo.id}">Excluir</button>
        `;
        listaVeiculos.appendChild(li);

        li.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const idParaExcluir = e.target.dataset.id;
            await excluirVeiculo(idParaExcluir);
            // Após excluir no backend, recarrega a lista para refletir a mudança
            listaVeiculos.innerHTML = '';
            carregarVeiculos();
        });
    }

    async function excluirVeiculo(id) {
        try {
            const response = await fetch(`http://localhost:3001/api/veiculos/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            const data = await response.json();
            if (response.ok) {
                exibirMensagem(veiculoMensagemDiv, data.message || 'Veículo excluído com sucesso!', 'green');
            } else {
                exibirMensagem(veiculoMensagemDiv, data.message || 'Erro ao excluir veículo.', 'red');
            }
        } catch (error) {
            console.error('Erro ao excluir veículo:', error);
            exibirMensagem(veiculoMensagemDiv, 'Erro de conexão ao excluir veículo.', 'red');
        }
    }

    // Função auxiliar para exibir mensagens temporárias
    function exibirMensagem(elemento, texto, cor) {
        if (elemento) {
            elemento.textContent = texto;
            elemento.style.color = cor;
            setTimeout(() => {
                elemento.textContent = '';
            }, 3000); // Mensagem desaparece após 3 segundos
        }
    }
});