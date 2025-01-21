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
    const updateBtn = document.getElementById('update-btn');
    const deleteBtn = document.getElementById('delete-btn');

    // Ajouter un événement de clic pour le bouton Create
    createBtn.addEventListener('click', function () {
        crudContenant.style.display = 'none';
        createContenant.style.display = 'flex';
        showStep('create-step');
        hideStep('update-step');
        hideStep('delete-step');
    });

    updateBtn.addEventListener('click', function () {
        crudContenant.style.display = 'none';
        createContenant.style.display = 'flex';
        showStep('update-step');
        hideStep('create-step');
        hideStep('delete-step');
    });

    deleteBtn.addEventListener('click', function () {
        crudContenant.style.display = 'none';
        createContenant.style.display = 'flex';
        showStep('delete-step');
        hideStep('create-step');
        hideStep('update-step');
    });

    // Fonction pour afficher l'étape correspondante
    function showStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.style.display = 'flex';
        }
    }

    // Fonction pour masquer l'étape correspondante
    function hideStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.style.display = 'none';
        }
    }

    // Gérer la suppression des étapes lorsque l'utilisateur clique sur la croix
    const closeSteps = document.querySelectorAll('.close-step');
    closeSteps.forEach(cross => {
        cross.addEventListener('click', function () {
            const stepId = this.getAttribute('data-step'); // Récupère l'étape à fermer
            hideStep(stepId);

            // Afficher le conteneur CRUD et masquer le conteneur Create
            crudContenant.style.display = 'flex';
            createContenant.style.display = 'none';
        });
    });
});
