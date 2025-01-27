document.addEventListener("DOMContentLoaded", function () {
    // Sélectionner le bouton "update" et les conteneurs correspondants
    const crudContenant = document.querySelector('.crud-contenant');
    const updateContenant = document.querySelector('.update-contenant');
    const updateBtn = document.getElementById('update-btn'); // Correction ici

    if (updateBtn && crudContenant && updateContenant) {
        // Événement au clic du bouton UPDATE
        updateBtn.addEventListener("click", function () {
            // Cacher le conteneur CRUD
            crudContenant.style.display = 'none';
            
            // Afficher le conteneur update
            updateContenant.style.display = 'flex';

            // Afficher et masquer les étapes correspondantes
            showStep('update-step');
            hideStep('create-step');
            hideStep('read-step');
            hideStep('delete-step');
        });
    } else {
        console.error("Un des éléments nécessaires (update-btn, crud-contenant, update-contenant) est introuvable.");
    }

    // Gestion de la fermeture de l'étape "update"
    const closeStepBtn = document.querySelector(".update-close-step");
    if (closeStepBtn) {
        closeStepBtn.addEventListener("click", function () {
            // Cacher la section update et réafficher CRUD
            updateContenant.style.display = "none";
            crudContenant.style.display = "flex";

            // Masquer l'étape update
            hideStep('update-step');
        });
    }

    // Fonction pour afficher une étape
    function showStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.style.display = "flex";
        }
    }

    // Fonction pour masquer une étape
    function hideStep(stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.style.display = "none";
        }
    }
});
