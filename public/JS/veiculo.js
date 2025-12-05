// public/js/veiculo.js
document.addEventListener('DOMContentLoaded', () => {
    const vehicleDetailsContainer = document.getElementById('vehicle-details-container');
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('id');

    const additionalDetailsModal = document.getElementById('additional-details-modal');
    const closeButton = additionalDetailsModal.querySelector('.close-button');
    const additionalDetailsForm = document.getElementById('additional-details-form');
    const valorFipeInput = document.getElementById('valor-fipe');
    const recallPendenteInput = document.getElementById('recall-pendente');
    const proximaRevisaoInput = document.getElementById('proxima-revisao');

    let vehicleState = JSON.parse(localStorage.getItem(`vehicleState_${vehicleId}`)) || {
        isOn: false,
        speed: 0,
        maxSpeed: 200,
    };

    let currentVehicleData = null; // To store fetched vehicle data

    function getAuthHeader() {
        const token = localStorage.getItem('userToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    function saveState() {
        localStorage.setItem(`vehicleState_${vehicleId}`, JSON.stringify(vehicleState));
    }

    async function fetchVehicleDetails() {
        if (!vehicleId) {
            vehicleDetailsContainer.innerHTML = '<p style="color: var(--accent-color);">ID do veículo não fornecido.</p>';
            return;
        }

        try {
            const token = localStorage.getItem('userToken');
            const headers = token ? { headers: getAuthHeader() } : {};
            const response = await fetch(`/api/veiculos/${vehicleId}`, headers);
            const vehicle = await response.json();

            if (!response.ok) {
                throw new Error(vehicle.message || 'Erro ao carregar detalhes do veículo.');
            }

            currentVehicleData = vehicle; // Store fetched data
            renderVehicleDetails(vehicle);

        } catch (error) {
            console.error('Erro:', error);
            vehicleDetailsContainer.innerHTML = `<p style="color: var(--accent-color);">${error.message}</p>`;
        }
    }

    function renderVehicleDetails(vehicle) {
        const token = localStorage.getItem('userToken');
        const loggedInUserId = token ? jwt_decode(token).id : null;
        const isOwner = loggedInUserId && vehicle.ID_Usuario._id === loggedInUserId;
        const isLoggedIn = !!token;

        vehicleDetailsContainer.innerHTML = `
            <div class="vehicle-card">
                <h2>${vehicle.modelo}</h2>
                <p><strong>Placa:</strong> ${vehicle.placa}</p>
                <p><strong>Ano:</strong> ${vehicle.ano}</p>
                <p><strong>Proprietário:</strong> ${vehicle.ID_Usuario.Nome_Usuario}</p>
                
                <div class="simulation-panel">
                    <h3>Simulador</h3>
                    <p><strong>Status:</strong> <span id="status-text">${vehicleState.isOn ? 'Ligado' : 'Desligado'}</span></p>
                    <p><strong>Velocidade:</strong> <span id="speed-text">${vehicleState.speed}</span> km/h</p>
                    <div class="controls">
                        <button id="toggle-engine-btn" class="btn" ${!isLoggedIn ? 'disabled' : ''}>${vehicleState.isOn ? 'Desligar' : 'Ligar'}</button>
                        <button id="accelerate-btn" class="btn" ${!vehicleState.isOn || !isLoggedIn ? 'disabled' : ''}>Acelerar</button>
                        <button id="brake-btn" class="btn" ${!vehicleState.isOn || !isLoggedIn ? 'disabled' : ''}>Frear</button>
                    </div>
                </div>

                <div class="additional-details-summary">
                    <h3>Detalhes Adicionais</h3>
                    <p><strong>Valor FIPE (Est.):</strong> ${vehicle.valorFIPE || 'N/A'}</p>
                    <p><strong>Recall Pendente:</strong> ${vehicle.recallPendente ? 'Sim' : 'Não'}</p>
                    <p><strong>Próxima Revisão (km):</strong> ${vehicle.proximaRevisaoKm || 'N/A'}</p>
                    <button id="open-additional-details-modal" class="btn" style="width: auto;">${isOwner ? 'Editar Detalhes' : 'Ver Detalhes'}</button>
                </div>

                ${isOwner ? `
                <div class="admin-panel">
                    <div class="share-panel">
                        <h3>Compartilhar</h3>
                        <div class="form-group">
                            <input type="email" id="share-email" placeholder="Email do usuário">
                            <button id="share-btn" class="btn">Compartilhar</button>
                        </div>
                    </div>
                    <div class="privacy-panel">
                        <h3>Privacidade</h3>
                        <div class="form-group">
                            <label for="privacy-toggle">Tornar veículo público</label>
                            <input type="checkbox" id="privacy-toggle" ${vehicle.isPublic ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        addEventListeners(isLoggedIn, isOwner);
    }

    function addEventListeners(isLoggedIn, isOwner) {
        const toggleEngineBtn = document.getElementById('toggle-engine-btn');
        const accelerateBtn = document.getElementById('accelerate-btn');
        const brakeBtn = document.getElementById('brake-btn');

        if (isLoggedIn) {
            toggleEngineBtn.addEventListener('click', toggleEngine);
            accelerateBtn.addEventListener('click', accelerate);
            brakeBtn.addEventListener('click', brake);
        } else {
            // Disable simulation buttons if not logged in
            toggleEngineBtn.disabled = true;
            accelerateBtn.disabled = true;
            brakeBtn.disabled = true;
        }

        const openModalBtn = document.getElementById('open-additional-details-modal');
        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => {
                additionalDetailsModal.style.display = 'block';
                if (isOwner && currentVehicleData) {
                    valorFipeInput.value = currentVehicleData.valorFIPE || '';
                    recallPendenteInput.checked = currentVehicleData.recallPendente || false;
                    proximaRevisaoInput.value = currentVehicleData.proximaRevisaoKm || '';
                } else {
                    // Disable inputs if not owner
                    valorFipeInput.disabled = true;
                    recallPendenteInput.disabled = true;
                    proximaRevisaoInput.disabled = true;
                    additionalDetailsForm.querySelector('#save-additional-details').style.display = 'none';
                }
            });
        }

        closeButton.addEventListener('click', () => {
            additionalDetailsModal.style.display = 'none';
            // Re-enable inputs if they were disabled
            valorFipeInput.disabled = false;
            recallPendenteInput.disabled = false;
            proximaRevisaoInput.disabled = false;
            additionalDetailsForm.querySelector('#save-additional-details').style.display = 'block';
        });

        window.addEventListener('click', (event) => {
            if (event.target == additionalDetailsModal) {
                additionalDetailsModal.style.display = 'none';
                // Re-enable inputs if they were disabled
                valorFipeInput.disabled = false;
                recallPendenteInput.disabled = false;
                proximaRevisaoInput.disabled = false;
                additionalDetailsForm.querySelector('#save-additional-details').style.display = 'block';
            }
        });

        if (isOwner) {
            const shareBtn = document.getElementById('share-btn');
            if(shareBtn) shareBtn.addEventListener('click', shareVehicle);

            const privacyToggle = document.getElementById('privacy-toggle');
            if(privacyToggle) privacyToggle.addEventListener('change', togglePrivacy);

            additionalDetailsForm.addEventListener('submit', saveAdditionalDetails);
        }
    }

    function updateUI() {
        document.getElementById('status-text').textContent = vehicleState.isOn ? 'Ligado' : 'Desligado';
        document.getElementById('speed-text').textContent = vehicleState.speed;
        document.getElementById('toggle-engine-btn').textContent = vehicleState.isOn ? 'Desligar' : 'Ligar';
        
        const token = localStorage.getItem('userToken');
        const isLoggedIn = !!token;

        document.getElementById('accelerate-btn').disabled = !vehicleState.isOn || !isLoggedIn;
        document.getElementById('brake-btn').disabled = !vehicleState.isOn || !isLoggedIn;
        saveState();
    }

    function toggleEngine() {
        vehicleState.isOn = !vehicleState.isOn;
        if (!vehicleState.isOn) {
            vehicleState.speed = 0; // Carro desliga e para
        }
        updateUI();
    }

    function accelerate() {
        if (vehicleState.isOn) {
            vehicleState.speed = Math.min(vehicleState.speed + 10, vehicleState.maxSpeed);
            updateUI();
        }
    }

    function brake() {
        if (vehicleState.isOn) {
            vehicleState.speed = Math.max(vehicleState.speed - 10, 0);
            updateUI();
        }
    }

    async function shareVehicle() {
        const email = document.getElementById('share-email').value;
        if (!email) {
            showToast('Por favor, insira um email para compartilhar.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/veiculos/${vehicleId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            showToast(data.message, 'success');
            document.getElementById('share-email').value = '';
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function togglePrivacy() {
        try {
            const response = await fetch(`/api/vehicles/${vehicleId}/toggle-privacy`, {
                method: 'PUT',
                headers: { ...getAuthHeader() },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            showToast(data.message, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function saveAdditionalDetails(e) {
        e.preventDefault();
        const updatedDetails = {
            valorFIPE: valorFipeInput.value,
            recallPendente: recallPendenteInput.checked,
            proximaRevisaoKm: parseInt(proximaRevisaoInput.value) || null,
        };

        try {
            const response = await fetch(`/api/veiculos/${vehicleId}/additional-details`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(updatedDetails),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            showToast('Detalhes adicionais salvos com sucesso!', 'success');
            additionalDetailsModal.style.display = 'none';
            fetchVehicleDetails(); // Re-fetch to update displayed details
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // Helper function to decode JWT
    function jwt_decode(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    fetchVehicleDetails();
});
