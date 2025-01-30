
document.addEventListener("DOMContentLoaded", function () {
    // ** Gestion des éléments "query-item" **
    const queryItems = document.querySelectorAll('.query-item');

    // Ajout d'un gestionnaire de clic pour requête (5 requêtes)
    queryItems.forEach(item => {
        item.addEventListener('click', function () {
            const isSelected = this.getAttribute('data-selected') === 'true';

            // Réinitialise l'état de sélection pour tous les éléments
            queryItems.forEach(q => q.setAttribute('data-selected', 'false'));

            // Basculer l'état de l'élément cliqué
            this.setAttribute('data-selected', isSelected ? 'false' : 'true');

            // Supprime la classe active pour tous les items
            queryItems.forEach(query => query.classList.remove("active"));

            // Ajoute la classe active à l'élément cliqué
            item.classList.add("active");
        });
    });

    // ** Gestion des boutons SQL et Query **
    const sqlButton = document.getElementById('sqlButton');   // Bouton SQL
    const queryButton = document.getElementById('queryButton'); // Bouton Query
    const logo = document.getElementById('logo');               // Logo à gérer dynamiquement
    const buttonContainer = document.querySelector('.img-buttons-contenant'); // Conteneur des boutons

    // Activer le bouton SQL par défaut
    sqlButton.classList.add('active');
    queryButton.classList.add('inactive');

    // Fonction générique pour basculer l'état actif/inactif entre deux boutons
    function toggleActive(buttonToActivate, buttonToDeactivate) {
        buttonToActivate.classList.add('active');
        buttonToActivate.classList.remove('inactive');

        buttonToDeactivate.classList.add('inactive');
        buttonToDeactivate.classList.remove('active');
    }

    // Ajout d'événements de clic pour activer/désactiver les boutons
    sqlButton.addEventListener('click', function () {
        toggleActive(sqlButton, queryButton);

        // Affiche le conteneur et le logo en mode "block"
        buttonContainer.style.display = 'flex';
        logo.style.display = 'block';
    });

    queryButton.addEventListener('click', function () {
        toggleActive(queryButton, sqlButton);

        // Affiche le conteneur et le logo en mode "flex"
        buttonContainer.style.display = 'flex';
        logo.style.display = 'flex';
    });

    // ** Gestion de l'affichage des queries **
    const queriesContenant = document.querySelector(".queries-contenant");

    // Afficher les queries lorsque le bouton "queryButton" est cliqué
    queryButton.addEventListener("click", () => {
        queriesContenant.classList.add("visible"); // Rendre le conteneur visible
        queryButton.classList.add("active");      // Activer le bouton Query
        sqlButton.classList.remove("active");     // Désactiver le bouton SQL
    });

    // Masquer les queries lorsque le bouton "sqlButton" est cliqué
    sqlButton.addEventListener("click", () => {
        queriesContenant.classList.remove("visible"); // Rendre le conteneur invisible
        sqlButton.classList.add("active");           // Activer le bouton SQL
        queryButton.classList.remove("active");      // Désactiver le bouton Query
    });
});
