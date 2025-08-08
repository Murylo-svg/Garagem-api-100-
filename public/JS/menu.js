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
            if (!menuIcon.contains(event.target) && !menuDropdown.contains(event.target)) {
                menuIcon.classList.remove('active');
                menuDropdown.classList.remove('active');
            }
        });
    }
});