document.addEventListener("DOMContentLoaded", function () {



    const queryItems = document.querySelectorAll('.query-item');

    queryItems.forEach(item => {
        item.addEventListener('click', function () {
            const isSelected = this.getAttribute('data-selected') === 'true';

            // Réinitialiser tous les éléments
            queryItems.forEach(q => q.setAttribute('data-selected', 'false'));

            // Basculer l'état de l'élément cliqué
            this.setAttribute('data-selected', isSelected ? 'false' : 'true');
            // Supprime l'état actif de toutes les queries
            queryItems.forEach((query) => query.classList.remove("active"));

            // Ajoute l'état actif à l'élément cliqué
            item.classList.add("active");
        });
    });



    const sqlEditor = CodeMirror.fromTextArea(document.getElementById("sqlEditor"), {
        mode: "text/x-sql", 
        theme: "material", 
        lineNumbers: true, 
        autoCloseBrackets: true, 
        matchBrackets: true,
        extraKeys: {
            "Ctrl-Space": "autocomplete"
        }
    });

    // Fixer la taille de CodeMirror
    sqlEditor.setSize("100%", "200px"); // Largeur fixe, hauteur fixe

    document.querySelector(".run-query-btn").addEventListener("click", function (event) {
        const button = event.target;

        // Faire disparaître le bouton
        button.style.display = "none"; // Cache le bouton

        const sqlQuery = sqlEditor.getValue(); // Obtenez le contenu du CodeMirror
        console.log("Requête SQL :", sqlQuery);

        // Ajoutez ici le code pour exécuter la requête (appel API ou autre logique)
    });

    // Sélectionner les boutons
    const sqlButton = document.getElementById('sqlButton');
    const queryButton = document.getElementById('queryButton');
    const logo = document.getElementById('logo');
    const buttonContainer = document.querySelector('.img-buttons-contenant'); // Assurez-vous que cette classe est correcte

    // Activer sqlButton au chargement
    sqlButton.classList.add('active');
    queryButton.classList.add('inactive');

    // Fonction pour activer un bouton et désactiver l'autre
    function toggleActive(buttonToActivate, buttonToDeactivate) {
        buttonToActivate.classList.add('active');
        buttonToActivate.classList.remove('inactive');

        buttonToDeactivate.classList.add('inactive');
        buttonToDeactivate.classList.remove('active');
    }

    // Ajouter des événements de clic aux boutons
    sqlButton.addEventListener('click', function () {
        toggleActive(sqlButton, queryButton);
        // Mode "normal" pour SQL Console
        buttonContainer.style.display = 'block'; // Remet en mode block
        logo.style.display = 'block'; // Affiche le logo en mode normal
    });

    queryButton.addEventListener('click', function () {
        toggleActive(queryButton, sqlButton);
        // Mode "flex" pour Frequently Used Query
        buttonContainer.style.display = 'flex'; // Active le mode flex
        logo.style.display = 'flex'; // Active le mode flex pour le logo
    });

    const queriesContenant = document.querySelector(".queries-contenant");

    queryButton.addEventListener("click", () => {
        // Afficher les queries
        queriesContenant.classList.add("visible");

        // Marquer le bouton Query comme actif
        queryButton.classList.add("active");
        sqlButton.classList.remove("active");
    });

    sqlButton.addEventListener("click", () => {
        // Masquer les queries
        queriesContenant.classList.remove("visible");

        // Marquer le bouton SQL comme actif
        sqlButton.classList.add("active");
        queryButton.classList.remove("active");
    });
});
