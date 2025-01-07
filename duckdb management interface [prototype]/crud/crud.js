document.addEventListener("DOMContentLoaded", function () {
    // Sélectionner tous les boutons CRUD
    const crudButtons = document.querySelectorAll('.crud-btn');

    // Ajouter un événement de clic à chaque bouton CRUD
    crudButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Supprimer l'état "actif" de tous les boutons
            crudButtons.forEach(btn => btn.classList.remove('active'));

            // Ajouter l'état "actif" au bouton cliqué
            this.classList.add('active');
        });
    });

    // Sélection des conteneurs CRUD et Create
    const crudContenant = document.querySelector('.crud-contenant');
    const createContenant = document.querySelector('.create-contenant');

    // Bouton Create
    const createBtn = document.getElementById('create-btn');

    // Ajouter un événement de clic pour le bouton Create
    createBtn.addEventListener('click', function () {
        // Masquer le conteneur CRUD
        crudContenant.style.display = 'none';

        // Afficher le conteneur Create
        createContenant.style.display = 'flex';
    });

    // Sélectionner les boutons de Create
    const createButtons = document.querySelectorAll('.create-btn');

    // Ajouter un événement de clic à chaque bouton Create
    createButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Supprimer l'état "actif" de tous les boutons
            createButtons.forEach(btn => btn.classList.remove('active'));

            // Ajouter l'état "actif" au bouton cliqué
            this.classList.add('active');
        });
    });


    // Sélectionner les boutons CRUD
    const readBtn = document.getElementById('read-btn');
    const updateBtn = document.getElementById('update-btn');
    const deleteBtn = document.getElementById('delete-btn');
    
    // Fonction pour afficher l'étape correspondante
    function showStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.style.display = 'flex'; // Afficher l'étape
        }
    }

    // Fonction pour masquer l'étape correspondante
    function hideStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.style.display = 'none'; // Masquer l'étape
        }
    }

    // Ajouter un événement pour chaque bouton CRUD
    createBtn.addEventListener('click', function () {
        showStep('create-step');
        hideStep('create-view-step');
        hideStep('update-step');
        hideStep('delete-step');
    });

    readBtn.addEventListener('click', function () {
        hideStep('create-step');
        hideStep('create-view-step');
        hideStep('update-step');
        hideStep('delete-step');
    });

    updateBtn.addEventListener('click', function () {
        showStep('update-step');
        hideStep('create-step');
        hideStep('create-view-step');
        hideStep('delete-step');
    });

    deleteBtn.addEventListener('click', function () {
        showStep('delete-step');
        hideStep('create-step');
        hideStep('create-view-step');
        hideStep('update-step');
    });

    // Gérer la suppression des étapes lorsque l'utilisateur clique sur la croix
    const closeSteps = document.querySelectorAll('.close-step');
    closeSteps.forEach(cross => {
        cross.addEventListener('click', function () {
            const stepId = this.getAttribute('data-step');
            hideStep(stepId);
        });
    });
});
