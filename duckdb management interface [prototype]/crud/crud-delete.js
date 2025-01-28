document.addEventListener("DOMContentLoaded", function () {
    // Sélectionner le bouton "Delete" et les conteneurs correspondants
    const crudContenant = document.querySelector('.crud-contenant');
    const deleteContenant = document.querySelector('.delete-contenant');
    const deleteBtn = document.getElementById('delete-btn'); // Correction ici

    if (deleteBtn && crudContenant && deleteContenant) {
        // Événement au clic du bouton READ
        deleteBtn.addEventListener("click", function () {
            // Cacher le conteneur CRUD
            crudContenant.style.display = 'none';
            
            // Afficher le conteneur Read
            deleteContenant.style.display = 'flex';

            // Afficher et masquer les étapes correspondantes
            showStep('delete-step');
            hideStep('create-step');
            hideStep('read-step');
            hideStep('update-step');
        });
    } else {
        console.error("Un des éléments nécessaires (delete-btn, crud-contenant, delete-contenant) est introuvable.");
    }

    // Gestion de la fermeture de l'étape "delete"
    const closeStepBtn = document.querySelector(".delete-close-step");
    if (closeStepBtn) {
        closeStepBtn.addEventListener("click", function () {
            // Cacher la section delete et réafficher CRUD
            deleteContenant.style.display = "none";
            crudContenant.style.display = "flex";
            //masque l'étape delete
            hideStep('delete-step');
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
