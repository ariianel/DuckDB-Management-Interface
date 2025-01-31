document.addEventListener("DOMContentLoaded", function () {
    // Sélectionner le bouton "update" et les conteneurs correspondants
    const crudContenant = document.querySelector('.crud-contenant');
    const deleteContenant = document.querySelector('.delete-contenant');
    const deleteBtn = document.getElementById('delete-btn');
    
    // R E A D : simple display
    const deleteSimpleDisplayContenant = document.querySelector('.delete-simple-display-contenant');
    const deleteSimpleDisplayBtn = document.getElementById('specific-rows-btn'); // Correction ici
    const readHowDisplayContenant = document.querySelector('.read-how-display-contenant');

    // R E A D : simple display >> how to display data
    const tableList = document.getElementById('table-list3');
    const deleteHowDisplayContenant = document.querySelector('.delete-choose-columns-contenant');
    //table evaluatoin results
    const deleteEvaluationResultsBtn = document.getElementById('delete-evaluation-results-btn');
    const deleteEvaluationResultsStep = document.getElementById('delete-evaluation_results-table');
    //table evaluation runs
    const deleteEvaluationRunsBtn = document.getElementById('delete-evaluation-runs-btn');
    const deleteEvaluationRunsStep = document.getElementById('delete-evaluation_runs-table');
    //table task configs
    const deleteTaskConfigsBtn = document.getElementById('delete-task-configs-btn');
    const deleteTaskConfigsStep = document.getElementById('delete-task_configs-table');  
    //table task metrics
    const deleteTaskMetricsBtn = document.getElementById('delete-task-metrics-btn');
    const deleteTaskMetricsStep = document.getElementById('delete-task_metrics-table'); 
    //table task summaries
    const deleteTaskSummariesBtn = document.getElementById('delete-task-summaries-btn');
    const deleteTaskSummariesStep = document.getElementById('delete-task_summaries-table');
    //table general summary
    const deleteGeneralSummaryBtn = document.getElementById('delete-general-summary-btn');
    const deleteGeneralStep = document.getElementById('delete-general_summary-table'); 

    const chooseColumnsSentence = document.querySelector('.delete-choose-columns-contenant');

    const deleteValidationContenant = document.querySelector('.delete-validation-buttons');

    // Sélectionner tous les boutons
    const deleteButtons = document.querySelectorAll('.delete-simple-display-btn');

// Ajouter un écouteur d'événement à chaque bouton
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Vérifier si l'élément existe
            if (deleteValidationContenant) {
                // Changer le display en flex
                deleteValidationContenant.style.display = 'flex';
            } else {
                console.error("L'élément .validation-buttons n'a pas été trouvé");
            }
        });
    });


    const tableMapping = {
        "delete-evaluation-runs-btn": "Table \"evaluation_runs\"",
        "delete-task-configs-btn": "Table \"task_configs\"",
        "delete-task-metrics-btn": "Table \"task_metrics\"",
        "delete-evaluation-results-btn": "Table \"tasks_evaluation_results\"",
        "delete-task-summaries-btn": "Table \"tasks_summaries\"",
        "delete-general-summary-btn": "Table \"general_summary\""
    };
    
    // Données des colonnes des tables (simulées)
    const tableColumns = {
        "Table \"evaluation_runs\"": [
            "run_id", "model_name", "num_fewshot_seeds", "override_batch_size",
            "max_samples", "job_id", "start_time", "end_time", "total_evaluation_time", 
            "model_sha", "model_dtype", "model_size", "lighteval_sha"
        ],
        "Table \"task_configs\"": [
            "task_id", "task_base_name", "prompt_function", "hf_repo",
            "hf_subset", "hf_revision", "hf_filter", "trust_dataset", 
            "few_shots_split", "few_shots_select", "generation_size", 
            "generation_grammar", "output_regex", "num_samples", 
            "original_num_docs", "effective_num_docs", 
            "must_remove_duplicate_docs", "version", "frozen"
        ],
        "Table \"task_metrics\"": [
            "metric_id", "metric_name", "higher_is_better", "category",
            "use_case", "sample_level_fn", "corpus_level_fn"
        ],
        "Table \"tasks_evaluation_results\"": [
            "run_id", "task_id", "em", "em_stderr", "qem",
            "qem_stderr", "pem", "pem_stderr", "pqem", "pqem_stderr"
        ],
        "Table \"aggregated_evaluation_results\"": [
            "run_id", "result_type", "em", "em_stderr", "qem",
            "qem_stderr", "pem", "pem_stderr", "pqem", "pqem_stderr"
        ],
        "Table \"tasks_summaries\"": [
            "run_id", "task_id", "truncated", "non_truncated",
            "padded", "non_padded", "effective_few_shots", 
            "num_truncated_few_shots"
        ],
        "Table \"general_summary\"": [
            "run_id", "truncated", "non_truncated",
            "padded", "non_padded", "num_truncated_few_shots"
        ]
    };


    //-----------------------------------------------------------------------------------
    // U P D A T E >> how would you like to update the data ? -----------------------------------------
    
    //Bouton " specific columns in row" event
    deleteSimpleDisplayBtn.addEventListener("click", function () {
        // Cacher le conteneur UPDATE
        deleteContenant.style.display = 'none';
            
        // Afficher le conteneur UPDATE
        deleteSimpleDisplayContenant.style.display = 'flex';

        // Afficher et masquer les étapes correspondantes
        showStep('delete-choose-table-step');
    });

    // Gestion de la fermeture de l'étape "choose table"
    const closeUpdateChooseStepBtn = document.querySelector(".delete-choose-table-close-step");
    if (closeUpdateChooseStepBtn) {
        closeUpdateChooseStepBtn.addEventListener("click", function () {
            // Cacher la section choose update et réafficher update
            deleteContenant.style.display = "flex";
            deleteSimpleDisplayContenant.style.display = "none";

            document.getElementById("delete-where-condition").style.display = "none";
            
            // Masquer l'étape update
            hideStep('delete-choose-table-step');
            
            // Masquer la table sélectionnée
            tableList.style.display = "none";
            deleteHowDisplayContenant.style.display = "none";

            document.querySelectorAll('.table-item3').forEach(element => {
                element.style.display = "none";
            });
            
            // Masquer les boutons select all et execute
            deleteValidationContenant.style.display = "none";
    
            // Supprimer tous les checkboxes et inputs du container
            const fieldsContainer = document.getElementById("delete-fields-container");
            fieldsContainer.innerHTML = ""; 
    
            // Réinitialiser toutes les checkboxes (au cas où elles seraient encore présentes)
            document.querySelectorAll(".field-checkbox").forEach(checkbox => {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event("change")); // Déclencher l'event pour masquer l'input
            });
    
            // Réinitialiser le texte du bouton de sélection
            const toggleSelectionBtn = document.getElementById("deletetoggle-selection-btn");
            if (toggleSelectionBtn) {
                toggleSelectionBtn.textContent = "Tout sélectionner";
                allSelected = false;
            }

            // Clear and hide WHERE condition
            const whereCondition = document.getElementById("delete-where-condition");
            const whereField = document.getElementById("delete-where-field");
            const whereValue = document.getElementById("delete-where-value");

            // Reset select and input
            whereField.innerHTML = "";
            whereValue.value = "";

            // Hide the whole WHERE section
            whereCondition.style.display = "none";
        });
    }
    
    //--------------------------------------------------------------------------------------
    // U P D A T E >> GESTION DES TABLES A MODIF -----------------------------------------
    //-----------------------------------------------------------------------------------

    //EVALUATION RESULTS 
    deleteEvaluationResultsBtn.addEventListener("click", function () {
        document.getElementById('table-list3').style.display = "block"; // Afficher le parent
        deleteEvaluationResultsStep.style.display = "flex";
        // Afficher le conteneur READ >> simple display >> how to display data
        deleteHowDisplayContenant.style.display = "flex";
        // Cacher le conteneur READ >> simple display
        deleteSimpleDisplayContenant.style.display = "none";

        //readHowDisplayContenant.style.display = "none";
        //affiche les boutons SElect All et execute
        deleteValidationContenant.style.display = "flex";

        buffer = "Table \"evaluation_results\"";
    });

    //EVALUATION RUNS
    deleteEvaluationRunsBtn.addEventListener("click", function () {
        document.getElementById('table-list3').style.display = "block"; // Afficher le parent
        deleteEvaluationRunsStep.style.display = "flex";
        // Afficher le conteneur READ >> simple display >> how to display data
        deleteHowDisplayContenant.style.display = "flex";
        // Cacher le conteneur READ >> simple display
        deleteSimpleDisplayContenant.style.display = "none";
        //affiche les boutons SElect All et execute
        deleteValidationContenant.style.display = "flex";

        buffer = "Table \"evaluation_runs\"";
    });

    //TASK CONFIGS
    deleteTaskConfigsBtn.addEventListener("click", function () {
        document.getElementById('table-list3').style.display = "block";
        // Afficher la table sélectionnée
        deleteTaskConfigsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        deleteHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        deleteSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        deleteValidationContenant.style.display = "flex";
        buffer = "Table \"task_configs\"";
    });

    //TASK METRICS
    deleteTaskMetricsBtn.addEventListener("click", function () {
        document.getElementById('table-list3').style.display = "block";
        // Afficher la table sélectionnée
        deleteTaskMetricsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        deleteHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        deleteSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        deleteValidationContenant.style.display = "flex";
        buffer = "Table \"task_metrics\"";

    }); 
    //TASK SUMMARIES
    deleteTaskSummariesBtn.addEventListener("click", function () {

        document.getElementById('table-list3').style.display = "block";
        // Afficher la table sélectionnée
        deleteTaskSummariesStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        deleteHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        deleteSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        deleteValidationContenant.style.display = "flex";
        buffer = "Table \"tasks_summaries\"";

    }); 

    ////GENERAL SUMMARY
    deleteGeneralSummaryBtn.addEventListener("click", function () {

        document.getElementById('table-list3').style.display = "block";
        // Afficher la table sélectionnée
        deleteGeneralStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        deleteHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        deleteSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        deleteValidationContenant.style.display = "flex";
        buffer = "Table \"general_summary\"";

    });

    if (deleteBtn && crudContenant && deleteContenant) {
        // Événement au clic du bouton UPDATE
        deleteBtn.addEventListener("click", function () {
            // Cacher le conteneur CRUD
            crudContenant.style.display = 'none';
            
            // Afficher le conteneur update
            deleteContenant.style.display = 'flex';

            // Afficher et masquer les étapes correspondantes
            showStep('delete-step');
            hideStep('create-step');
            hideStep('read-step');
            hideStep('update-step');
        });
    } else {
        console.error("Un des éléments nécessaires (update-btn, crud-contenant, update-contenant) est introuvable.");
    }

    // U P D A T E >> GESTION DES CHECKBOX CHAMPTS DE TABLE ET INPUT 
    document.querySelectorAll(".delete-simple-display-btn").forEach(button => {
        button.addEventListener("click", function () {
            const tableName = tableMapping[this.id];
            if (tableName) {
                displayFields(tableName);
            }
        });
    });

    document.getElementById("delete-where-condition").style.display = "none";

    function displayFields(tableName) {
        const fieldsContainer = document.getElementById("delete-fields-container");
        const whereField = document.getElementById("delete-where-field");
        fieldsContainer.innerHTML = "";
        whereField.innerHTML = "";

        if (tableColumns[tableName]) {
            document.getElementById("delete-where-condition").style.display = "block";
            const fieldsList = document.createElement("ul");

            tableColumns[tableName].forEach(column => {
                // Ajouter tous les champs dans le select WHERE
                const option = document.createElement("option");
                option.value = column;
                option.textContent = column;
                whereField.appendChild(option);

            });

            fieldsContainer.appendChild(fieldsList);
        }
    }

    // Bouton pour basculer entre sélectionner et désélectionner toutes les checkboxes
    let allSelected = false;
    document.getElementById("delete-toggle-selection-btn").addEventListener("click", function () {
        allSelected = !allSelected;
        document.querySelectorAll(".field-checkbox").forEach(checkbox => {
            checkbox.checked = allSelected;
            checkbox.dispatchEvent(new Event("change"));
        });
        this.textContent = allSelected ? "Deselect all" : "Select all";
    });

    // Bouton pour valider et masquer tout sauf un message de récupération
    document.getElementById("delete-validate-btn").addEventListener("click", function () {
        const fieldsContainer = document.getElementById("delete-fields-container");
        fieldsContainer.innerHTML = "<p>The selected values ​​are being processed...</p>";
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // INES ici tu peux ajouter le code pour récupérer et envoyer les données !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        console.log("Selected data ready for processing.");
    });

    // ---------------------------------------------------------------------------------------------------------------------------------------------------------------
    // UPDATE Gestion de la fermeture de l'étape "update"
    const closeStepBtn = document.querySelector(".delete-close-step");
    if (closeStepBtn) {
        closeStepBtn.addEventListener("click", function () {
            // Cacher la section update et réafficher CRUD
            deleteContenant.style.display = "none";
            crudContenant.style.display = "flex";

            // Masquer l'étape update
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
            document.querySelector(".msg-info").style.display = 'none';

            step.style.display = "none";
        }
    }

    
});
