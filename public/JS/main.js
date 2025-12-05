// public/JS/main.js
document.addEventListener('DOMContentLoaded', () => {

    function getAuthHeader() {
        const token = localStorage.getItem('userToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    const formAgendamento = document.getElementById('formAgendamento');
    const listaAgendamentos = document.getElementById('listaAgendamentos');
    const formVeiculo = document.getElementById('formVeiculo');
    const listaVeiculos = document.getElementById('listaVeiculos');

    if (formAgendamento && listaAgendamentos) {
        carregarAgendamentos();

        formAgendamento.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = document.getElementById('data').value;
            const hora = document.getElementById('hora').value;
            const descricao = document.getElementById('descricao').value;

            if (data && hora && descricao) {
                const agendamento = { data, hora, descricao };
                await salvarAgendamento(agendamento);
                formAgendamento.reset();
            } else {
                showToast('Por favor, preencha todos os campos do agendamento.', 'error');
            }
        });
    }

    async function salvarAgendamento(agendamento) {
        try {
            const response = await fetch('/api/agendamentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(agendamento)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao adicionar agendamento.');
            }
            showToast('Agendamento adicionado com sucesso!', 'success');
            carregarAgendamentos();
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            showToast(error.message, 'error');
        }
    }

    async function carregarAgendamentos() {
        // The skeleton loader is already in the HTML. We just need to replace it.
        try {
            const response = await fetch('/api/agendamentos', { headers: getAuthHeader() });
            const agendamentos = await response.json();

            listaAgendamentos.innerHTML = '';
            if (response.ok && agendamentos.length > 0) {
                agendamentos.forEach(agendamento => adicionarAgendamentoNaLista(agendamento));
            } else if (response.ok) {
                listaAgendamentos.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
            } else {
                throw new Error(agendamentos.message || 'Erro ao carregar agendamentos.');
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            listaAgendamentos.innerHTML = `<p style="color: var(--accent-color);">${error.message}</p>`;
        }
    }

    function adicionarAgendamentoNaLista(agendamento) {
        const item = document.createElement('div');
        item.className = 'skeleton-card'; // Re-using the card style
        item.dataset.id = agendamento._id;

        item.innerHTML = `
            <p><strong>Data:</strong> ${new Date(agendamento.data).toLocaleDateString()}</p>
            <p><strong>Hora:</strong> ${agendamento.hora}</p>
            <p><strong>Descrição:</strong> ${agendamento.descricao}</p>
            <button class="btn delete-btn" style="width: auto; background-color: #555;" data-id="${agendamento._id}">Excluir</button>
        `;
        listaAgendamentos.appendChild(item);

        item.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            await excluirAgendamento(id);
        });
    }

    async function excluirAgendamento(id) {
        if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
        try {
            const response = await fetch(`/api/agendamentos/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao excluir agendamento.');
            }
            showToast('Agendamento excluído com sucesso!', 'success');
            carregarAgendamentos();
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
            showToast(error.message, 'error');
        }
    }

    // --- VEÍCULOS ---
    if (formVeiculo && listaVeiculos) {
        carregarVeiculos();

        formVeiculo.addEventListener('submit', async (e) => {
            e.preventDefault();
            const modelo = document.getElementById('modeloVeiculo').value;
            const placa = document.getElementById('placaVeiculo').value;
            const ano = document.getElementById('anoVeiculo').value;
            const nomeProprietario = localStorage.getItem('userName') || 'Desconhecido';

            if (modelo && placa && ano) {
                const veiculo = { modelo, placa, ano, nomeProprietario };
                await salvarVeiculo(veiculo);
                formVeiculo.reset();
            } else {
                showToast('Por favor, preencha todos os campos do veículo.', 'error');
            }
        });
    }

    async function salvarVeiculo(veiculo) {
        try {
            const response = await fetch('/api/veiculos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(veiculo)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao adicionar veículo.');
            }
            showToast('Veículo adicionado com sucesso!', 'success');
            carregarVeiculos();
        } catch (error) {
            console.error('Erro ao salvar veículo:', error);
            showToast(error.message, 'error');
        }
    }

    async function carregarVeiculos() {
        // Skeleton loader is in the HTML
        try {
            const response = await fetch('/api/veiculos', { headers: getAuthHeader() });
            const veiculos = await response.json();

            listaVeiculos.innerHTML = '';
            if (response.ok && veiculos.length > 0) {
                veiculos.forEach(veiculo => adicionarVeiculoNaLista(veiculo));
            } else if (response.ok) {
                listaVeiculos.innerHTML = '<p>Nenhum veículo encontrado.</p>';
            } else {
                throw new Error(veiculos.message || 'Erro ao carregar veículos.');
            }
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
            listaVeiculos.innerHTML = `<p style="color: var(--accent-color);">${error.message}</p>`;
        }
    }

    function adicionarVeiculoNaLista(veiculo) {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'vehicle-list-item-wrapper';

        const itemLink = document.createElement('a');
        itemLink.href = `/veiculo.html?id=${veiculo._id}`;
        itemLink.className = 'vehicle-list-item';
        itemLink.innerHTML = `
            <h4>${veiculo.modelo}</h4>
            <p>${veiculo.placa}</p>
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn delete-btn-list';
        deleteBtn.textContent = 'Excluir';
        deleteBtn.dataset.id = veiculo._id;

        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent navigation
            e.stopPropagation(); // Stop event from bubbling to the link
            const id = e.target.dataset.id;
            await excluirVeiculo(id);
        });

        itemWrapper.appendChild(itemLink);
        itemWrapper.appendChild(deleteBtn);
        listaVeiculos.appendChild(itemWrapper);
    }

    async function excluirVeiculo(id) {
        if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
        try {
            const response = await fetch(`/api/veiculos/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao excluir veículo.');
            }
            showToast('Veículo excluído com sucesso!', 'success');
            carregarVeiculos();
        } catch (error) {
            console.error('Erro ao excluir veículo:', error);
            showToast(error.message, 'error');
        }
    }
});