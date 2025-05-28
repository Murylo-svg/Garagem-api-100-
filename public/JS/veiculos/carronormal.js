// js/veiculos/carroNormal.js
function initCarroNormal(cardElement) {
    if (!cardElement) {
        console.error("Elemento do card do Carro Normal não fornecido para inicialização.");
        return;
    }

    const veiculoId = 'normal'; // Usado para encontrar os spans de status corretos
    const maxSpeed = 180;

    const statusMotorEl = cardElement.querySelector(`#status-motor-${veiculoId}`);
    const velocidadeEl = cardElement.querySelector(`#velocidade-${veiculoId}`);
    const statusBuzinaEl = cardElement.querySelector(`#status-buzina-${veiculoId}`);

    if (!statusMotorEl || !velocidadeEl || !statusBuzinaEl) {
        console.warn(`Elementos de status para o Carro Normal não encontrados dentro do card.`);
        return;
    }

    // Adiciona listeners aos botões dentro deste card específico
    cardElement.addEventListener('click', function(event) {
        const button = event.target.closest('.botoes-acao button');
        if (!button) return; // Não foi um clique em um botão de ação

        // Verifica se o botão pertence a este veículo (pelo data-attribute)
        // Isso é uma dupla checagem, já que estamos no escopo do card, mas não custa.
        if (button.dataset.veiculo !== veiculoId) return;

        const acao = button.classList[0]; // btn-ligar, btn-acelerar, etc.

        if (acao === 'btn-ligar') {
            if (statusMotorEl.textContent === 'Desligado') {
                statusMotorEl.textContent = 'Ligado';
                statusMotorEl.style.color = 'green';
            } else {
                statusMotorEl.textContent = 'Desligado';
                statusMotorEl.style.color = 'red';
                velocidadeEl.textContent = '0';
            }
        } else if (statusMotorEl.textContent === 'Ligado') {
            if (acao === 'btn-acelerar') {
                let velAtual = parseInt(velocidadeEl.textContent);
                velocidadeEl.textContent = Math.min(velAtual + 10, maxSpeed);
            } else if (acao === 'btn-frear') {
                let velAtual = parseInt(velocidadeEl.textContent);
                velocidadeEl.textContent = Math.max(velAtual - 15, 0);
            } else if (acao === 'btn-buzinar') {
                statusBuzinaEl.textContent = 'BUZINANDO!';
                statusBuzinaEl.style.color = 'orange';
                setTimeout(() => {
                   statusBuzinaEl.textContent = 'Silêncio';
                   statusBuzinaEl.style.color = 'inherit';
                }, 1000);
            }
        }
    });

    console.log("Controles do Carro Normal inicializados.");
}