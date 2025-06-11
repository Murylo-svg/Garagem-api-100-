// js/veiculos/caminhao.js
function initCaminhao(cardElement) {
    if (!cardElement) {
        console.error("Elemento do card do Caminhão não fornecido para inicialização.");
        return;
    }

    const veiculoId = 'caminhao';
    const maxSpeed = 120;

    const statusMotorEl = cardElement.querySelector(`#status-motor-${veiculoId}`);
    const velocidadeEl = cardElement.querySelector(`#velocidade-${veiculoId}`);
    const statusBuzinaEl = cardElement.querySelector(`#status-buzina-${veiculoId}`);

    if (!statusMotorEl || !velocidadeEl || !statusBuzinaEl) {
        console.warn(`Elementos de status para o Caminhão não encontrados dentro do card.`);
        return;
    }

    cardElement.addEventListener('click', function(event) {
        const button = event.target.closest('.botoes-acao button');
        if (!button) return;
        if (button.dataset.veiculo !== veiculoId) return;

        const acao = button.classList[0];

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
                velocidadeEl.textContent = Math.min(velAtual + 5, maxSpeed); // Acelera mais devagar
            } else if (acao === 'btn-frear') {
                let velAtual = parseInt(velocidadeEl.textContent);
                velocidadeEl.textContent = Math.max(velAtual - 10, 0); // Freia mais devagar
            } else if (acao === 'btn-buzinar') {
                statusBuzinaEl.textContent = 'FOOOOOM!'; // Buzina potente
                statusBuzinaEl.style.color = 'darkred';
                setTimeout(() => {
                   statusBuzinaEl.textContent = 'Silêncio';
                   statusBuzinaEl.style.color = 'inherit';
                }, 1500);
            }
        }
    });

    console.log("Controles do Caminhão inicializados.");
}