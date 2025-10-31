// menu.js
document.addEventListener('DOMContentLoaded', function() {
    const menuIcon = document.getElementById('menu-icon');
    const menuDropdown = document.getElementById('menu-dropdown');

    if (menuIcon && menuDropdown) {
        menuIcon.addEventListener('click', function() {
            menuIcon.classList.toggle('active');
            menuDropdown.classList.toggle('active');
        });

        // Opcional: Fechar o menu se clicar fora dele
        document.addEventListener('click', function(event) {
            // Verifica se o clique não foi no ícone do menu nem dentro do dropdown
            const isClickInsideMenu = menuDropdown.contains(event.target);
            const isClickOnIcon = menuIcon.contains(event.target);

            if (!isClickInsideMenu && !isClickOnIcon && menuDropdown.classList.contains('active')) {
                menuIcon.classList.remove('active');
                menuDropdown.classList.remove('active');
            }
        });
    }
});