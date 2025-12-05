// public/js/garagem-publica.js
document.addEventListener('DOMContentLoaded', () => {
    const publicVehicleList = document.getElementById('public-vehicle-list');

    async function fetchPublicVehicles() {
        try {
            const response = await fetch('/api/vehicles/public');
            const vehicles = await response.json();

            publicVehicleList.innerHTML = ''; // Clear skeletons

            if (!response.ok) {
                throw new Error(vehicles.message || 'Erro ao carregar veículos públicos.');
            }

            if (vehicles.length === 0) {
                publicVehicleList.innerHTML = '<p>Nenhum veículo público encontrado.</p>';
                return;
            }

            vehicles.forEach(vehicle => {
                const vehicleCard = document.createElement('div');
                vehicleCard.className = 'public-vehicle-card';
                vehicleCard.innerHTML = `
                    <h4>${vehicle.modelo}</h4>
                    <p><strong>Proprietário:</strong> ${vehicle.ID_Usuario.Nome_Usuario}</p>
                    <p><strong>Valor FIPE (Est.):</strong> ${vehicle.valorFIPE || 'N/A'}</p>
                    <p><strong>Recall Pendente:</strong> ${vehicle.recallPendente ? 'Sim' : 'Não'}</p>
                    <p><strong>Próxima Revisão (km):</strong> ${vehicle.proximaRevisaoKm || 'N/A'}</p>
                    <a href="/veiculo.html?id=${vehicle._id}" class="btn-view">Ver Detalhes</a>
                `;
                publicVehicleList.appendChild(vehicleCard);
            });

        } catch (error) {
            console.error('Erro:', error);
            publicVehicleList.innerHTML = `<p style="color: var(--accent-color);">${error.message}</p>`;
        }
    }

    fetchPublicVehicles();
});
