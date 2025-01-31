document.addEventListener("DOMContentLoaded", function () {
    // Sélectionner le bouton "update" et les conteneurs correspondants
    const crudContenant = document.querySelector('.crud-contenant');
    const updateContenant = document.querySelector('.update-contenant');
    const updateBtn = document.getElementById('update-btn');
    
    // R E A D : simple display
    const updateSimpleDisplayContenant = document.querySelector('.update-simple-display-contenant');
    const updateSimpleDisplayBtn = document.getElementById('specific-columns-in-row-btn'); // Correction ici
    const readHowDisplayContenant = document.querySelector('.read-how-display-contenant');

    // R E A D : simple display >> how to display data
    const tableList = document.getElementById('table-list2');
    const updateHowDisplayContenant = document.querySelector('.update-choose-columns-contenant');
    //table evaluatoin results
    const updateEvaluationResultsBtn = document.getElementById('update-evaluation-results-btn');
    const updateEvaluationResultsStep = document.getElementById('evaluation_results-table');
    //table evaluation runs
    const evaluationRunsBtn = document.getElementById('update-evaluation-runs-btn');
    const evaluationRunsStep = document.getElementById('evaluation_runs-table');
    //table task configs
    const taskConfigsBtn = document.getElementById('update-task-configs-btn');
    const taskConfigsStep = document.getElementById('update-task_configs-table');  
    //table task metrics
    const taskMetricsBtn = document.getElementById('update-task-metrics-btn');
    const taskMetricsStep = document.getElementById('task_metrics-table');
    //table task summaries
    const taskSummariesBtn = document.getElementById('update-task-summaries-btn');
    const taskSummariesStep = document.getElementById('tasks_summaries-table');
    //table general summary
    const generalSummaryBtn = document.getElementById('update-general-summary-btn');
    const generalStep = document.getElementById('general_summary-table');

    const chooseColumnsSentence = document.querySelector('.update-choose-columns-contenant');

    const validationContenant = document.querySelector('.validation-buttons');

    // Sélectionner tous les boutons
    const buttons = document.querySelectorAll('.update-simple-display-btn');

// Ajouter un écouteur d'événement à chaque bouton
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Vérifier si l'élément existe
            if (validationContenant) {
                // Changer le display en flex
                validationContenant.style.display = 'flex';
            } else {
                console.error("L'élément .validation-buttons n'a pas été trouvé");
            }
        });
    });


    const tableMapping = {
        "update-evaluation-runs-btn": "Table \"evaluation_runs\"",
        "update-task-configs-btn": "Table \"task_configs\"",
        "update-task-metrics-btn": "Table \"task_metrics\"",
        "update-evaluation-results-btn": "Table \"tasks_evaluation_results\"",
        "update-task-summaries-btn": "Table \"tasks_summaries\"",
        "update-general-summary-btn": "Table \"general_summary\""
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
    updateSimpleDisplayBtn.addEventListener("click", function () {
        // Cacher le conteneur UPDATE
        updateContenant.style.display = 'none';
            
        // Afficher le conteneur UPDATE
        updateSimpleDisplayContenant.style.display = 'flex';

        // Afficher et masquer les étapes correspondantes
        showStep('update-choose-table-step');
    });

    // Gestion de la fermeture de l'étape "choose table"
    const closeUpdateChooseStepBtn = document.querySelector(".update-choose-table-close-step");
    if (closeUpdateChooseStepBtn) {
        closeUpdateChooseStepBtn.addEventListener("click", function () {
            // Cacher la section choose update et réafficher update
            updateContenant.style.display = "flex";
            updateSimpleDisplayContenant.style.display = "none";
            
            // Masquer l'étape update
            hideStep('update-choose-table-step');
            
            // Masquer la table sélectionnée
            tableList.style.display = "none";
            updateHowDisplayContenant.style.display = "none";
            
            // Masquer les boutons select all et execute
            validationContenant.style.display = "none";
    
            // Supprimer tous les checkboxes et inputs du container
            const fieldsContainer = document.getElementById("fields-container");
            fieldsContainer.innerHTML = ""; 
    
            // Réinitialiser toutes les checkboxes (au cas où elles seraient encore présentes)
            document.querySelectorAll(".field-checkbox").forEach(checkbox => {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event("change")); // Déclencher l'event pour masquer l'input
            });
    
            // Réinitialiser le texte du bouton de sélection
            const toggleSelectionBtn = document.getElementById("toggle-selection-btn");
            if (toggleSelectionBtn) {
                toggleSelectionBtn.textContent = "Tout sélectionner";
                allSelected = false;
            }

            // Clear and hide WHERE condition
            const whereCondition = document.getElementById("where-condition");
            const whereField = document.getElementById("where-field");
            const whereValue = document.getElementById("where-value");

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
    updateEvaluationResultsBtn.addEventListener("click", function () {
        const allTableItems = document.querySelectorAll('.table-item2');
        allTableItems.forEach(item => {
            item.style.display = "none";
        });

        document.getElementById('table-list2').style.display = "block"; // Afficher le parent
        updateEvaluationResultsStep.style.display = "flex";
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = "flex";
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = "none";

        //readHowDisplayContenant.style.display = "none";
        //affiche les boutons SElect All et execute
        validationContenant.style.display = "flex";

        buffer = "Table \"evaluation_results\"";
    });

    //EVALUATION RUNS
    evaluationRunsBtn.addEventListener("click", function () {
        const allTableItems = document.querySelectorAll('.table-item2');
        allTableItems.forEach(item => {
            item.style.display = "none";
        });

        document.getElementById('table-list2').style.display = "block"; // Afficher le parent
        evaluationRunsStep.style.display = "flex";
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = "flex";
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = "none";
        //affiche les boutons SElect All et execute
        validationContenant.style.display = "flex";

        buffer = "Table \"evaluation_runs\"";
    });

    //TASK CONFIGS
    taskConfigsBtn.addEventListener("click", function () {
        const allTableItems = document.querySelectorAll('.table-item2');
        allTableItems.forEach(item => {
            item.style.display = "none";
        });

        document.getElementById('table-list2').style.display = "block";
        // Afficher la table sélectionnée
        taskConfigsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        validationContenant.style.display = "flex";
        buffer = "Table \"task_configs\"";
    });

    //TASK METRICS
    taskMetricsBtn.addEventListener("click", function () {
        const allTableItems = document.querySelectorAll('.table-item2');
        allTableItems.forEach(item => {
            item.style.display = "none";
        });

        document.getElementById('table-list2').style.display = "block";
        // Afficher la table sélectionnée
        taskMetricsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        validationContenant.style.display = "flex";
        buffer = "Table \"task_metrics\"";

    }); 
    //TASK SUMMARIES
    taskSummariesBtn.addEventListener("click", function () {
        const allTableItems = document.querySelectorAll('.table-item2');
        allTableItems.forEach(item => {
            item.style.display = "none";
        });

        document.getElementById('table-list2').style.display = "block";
        // Afficher la table sélectionnée
        taskSummariesStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        validationContenant.style.display = "flex";
        buffer = "Table \"tasks_summaries\"";

    }); 

    ////GENERAL SUMMARY
    generalSummaryBtn.addEventListener("click", function () {
        const allTableItems = document.querySelectorAll('.table-item2');
        allTableItems.forEach(item => {
            item.style.display = "none";
        });

        document.getElementById('table-list2').style.display = "block";
        // Afficher la table sélectionnée
        generalStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
        //affiche les boutons SElect All et execute
        validationContenant.style.display = "flex";
        buffer = "Table \"general_summary\"";

    });

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

    // U P D A T E >> GESTION DES CHECKBOX CHAMPTS DE TABLE ET INPUT 
    document.querySelectorAll(".update-simple-display-btn").forEach(button => {
        button.addEventListener("click", function () {
            const tableName = tableMapping[this.id];
            if (tableName) {
                displayFields(tableName);
            }
        });
    });

    document.getElementById("where-condition").style.display = "none";

    function displayFields(tableName) {
        const fieldsContainer = document.getElementById("fields-container");
        const whereField = document.getElementById("where-field");
        fieldsContainer.innerHTML = "";
        whereField.innerHTML = "";

        if (tableColumns[tableName]) {
            document.getElementById("where-condition").style.display = "block";
            const fieldsList = document.createElement("ul");

            tableColumns[tableName].forEach(column => {
                // Ajouter tous les champs dans le select WHERE
                const option = document.createElement("option");
                option.value = column;
                option.textContent = column;
                whereField.appendChild(option);

                // Vérifier si c'est un champ ID
                const isIdField = column.toLowerCase().includes('_id') || column.toLowerCase() === 'id';

                // Ne créer les inputs que pour les champs non-ID
                if (!isIdField) {
                    const listItem = document.createElement("li");

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.className = "field-checkbox";
                    checkbox.style.marginRight = "10px";
                    checkbox.dataset.field = column;

                    const label = document.createElement("label");
                    label.textContent = column;
                    label.style.marginRight = "10px";

                    const input = document.createElement("input");
                    input.type = "text";
                    input.className = "field-input";
                    input.style.display = "none";
                    input.style.marginLeft = "10px";
                    input.placeholder = "Enter your value";
                    input.dataset.field = column;

                    checkbox.addEventListener("change", function () {
                        input.style.display = this.checked ? "inline-block" : "none";
                    });

                    listItem.appendChild(checkbox);
                    listItem.appendChild(label);
                    listItem.appendChild(input);
                    fieldsList.appendChild(listItem);
                }
            });

            fieldsContainer.appendChild(fieldsList);
        }
    }

    // Bouton pour basculer entre sélectionner et désélectionner toutes les checkboxes
    let allSelected = false;
    document.getElementById("toggle-selection-btn").addEventListener("click", function () {
        allSelected = !allSelected;
        document.querySelectorAll(".field-checkbox").forEach(checkbox => {
            checkbox.checked = allSelected;
            checkbox.dispatchEvent(new Event("change"));
        });
        this.textContent = allSelected ? "Deselect all" : "Select all";
    });

    // Bouton pour valider et masquer tout sauf un message de récupération
    document.getElementById("validate-btn").addEventListener("click", function () {
        const fieldsContainer = document.getElementById("fields-container");
        fieldsContainer.innerHTML = "<p>The selected values ​​are being processed...</p>";
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // INES ici tu peux ajouter le code pour récupérer et envoyer les données !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        console.log("Selected data ready for processing.");
    });

    // ---------------------------------------------------------------------------------------------------------------------------------------------------------------
    // UPDATE Gestion de la fermeture de l'étape "update"
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
            document.querySelector(".msg-info").style.display = 'none';

            step.style.display = "none";
        }
    }

    
});
