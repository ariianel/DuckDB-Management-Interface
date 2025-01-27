document.addEventListener("DOMContentLoaded", function () {
    
    // R E A D  ------------------------------------------------------------
    // Sélectionner le bouton "Read" et les conteneurs correspondants
    const runQuery = document.getElementById("run-query-btn");
    const crudContenant = document.querySelector('.crud-contenant');
    const readContenant = document.querySelector('.read-contenant');
    const readBtn = document.getElementById('read-btn'); // Correction ici

    // R E A D : simple display
    const readSimpleDisplayContenant = document.querySelector('.read-simple-display-contenant');
    const readSimpleDisplayBtn = document.getElementById('read-insert-btn'); // Correction ici

    //  R E A D : simple display >> how to display data
    const tableList = document.getElementById('table-list2');
    const readHowDisplayContenant = document.querySelector('.read-how-display-contenant');
    //table evaluatoin results
    const evaluationResultsBtn = document.getElementById('evaluation-results-btn');
    const evaluationResultsStep = document.getElementById('evaluation_results-table');
    //table evaluation runs
    const evaluationRunsBtn = document.getElementById('evaluation-runs-btn');
    const evaluationRunsStep = document.getElementById('evaluation_runs-table');
    //table task configs
    const taskConfigsBtn = document.getElementById('task-configs-btn');
    const taskConfigsStep = document.getElementById('task_configs-table');  
    //table task metrics
    const taskMetricsBtn = document.getElementById('task-metrics-btn');
    const taskMetricsStep = document.getElementById('task_metrics-table'); 
    //table task summaries
    const taskSummariesBtn = document.getElementById('task-summaries-btn');
    const taskSummariesStep = document.getElementById('tasks_summaries-table'); 
    //table general summary
    const generalSummaryBtn = document.getElementById('general-summary-btn');
    const generalStep = document.getElementById('general_summary-table'); 

    //  R E A D : simple display >> how to display data >> read all data -----------------------------------------
    const readAllDataBtn = document.getElementById('read-all-data-btn');
    const queryRunningSentence = document.getElementById('query-running-sentence');
    const readAllDataContenant = document.querySelector('.read-all-data-display-contenant');

    // R E A D : simple display >> how to display data >> select columns -----------------------------------------
    const readSpecificDataBtn = document.getElementById('specific-columns-btn');
    const columnsContainer = document.getElementById("columns-container");
    const columnsList = document.getElementById("columns-list");

    let buffer = "";

    const tableColumns = {
        "Table \"evaluation_runs\"": [
            "prout_test", "model_name", "num_fewshot_seeds", "override_batch_size", 
            "max_samples", "job_id", "start_time", "end_time", "total_evaluation_time", 
            "model_sha", "model_dtype", "model_size", "lighteval_sha"
        ],
        "Table \"evaluation_results\"": [
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


    if (readBtn && crudContenant && readContenant) {
        // Événement au clic du bouton READ
        readBtn.addEventListener("click", function () {
            // Cacher le conteneur CRUD
            crudContenant.style.display = 'none';
            
            // Afficher le conteneur Read
            readContenant.style.display = 'flex';

            // Afficher et masquer les étapes correspondantes
            showStep('read-step');
            hideStep('create-step');
        });
    } else {
        console.error("Un des éléments nécessaires (read-btn, crud-contenant, read-contenant) est introuvable.");
    }

    // Gestion de la fermeture de l'étape "read"
    const closeStepBtn = document.querySelector(".read-close-step");
    if (closeStepBtn) {
        closeStepBtn.addEventListener("click", function () {
            // Cacher la section Read et réafficher CRUD
            readContenant.style.display = "none";
            crudContenant.style.display = "flex";

            // Masquer l'étape read
            hideStep('read-step');
        });
    }

    // R E A D >> simple display -----------------------------------------

    
    if (readSimpleDisplayBtn && readSimpleDisplayContenant) {
        // Événement au clic du bouton READ
        readSimpleDisplayBtn.addEventListener("click", function () {
            // Cacher le conteneur READ
            readContenant.style.display = 'none';
            
            // Afficher le conteneur READ >> simple display
            readSimpleDisplayContenant.style.display = 'flex';

            // Afficher et masquer les étapes correspondantes
            showStep('read-simple-display-step');
        });
    } else {
        console.error("Un des éléments nécessaires (read-simple-display-btn, crud-contenant, read-simple-display-contenant) est introuvable.");
    }

    // Gestion de la fermeture de l'étape "simple display" !!!!!!!!!!!!!!!!!!!!!!!!!
    const closeSimpleDisplayStepBtn = document.querySelector(".read-simple-display-close-step");
    if (closeSimpleDisplayStepBtn) {
        closeSimpleDisplayStepBtn.addEventListener("click", function () {
            // Cacher la section simple display et réafficher read
            readContenant.style.display = "flex";
            readSimpleDisplayContenant.style.display = "none";
            // Masquer l'étape read
            hideStep('read-simple-display-step');
            //masquer la table selectionnés
            tableList.style.display = "none";
            //masquer le conteneur "how to display data ?"
            readHowDisplayContenant.style.display = "none";
            //retirer la phrase
            queryRunningSentence.style.display = "none";
            //masquer le contenant qui dit que la requête s'exécute
            readAllDataContenant.style.display = "none"
            // masquer les colonnes de la table
            columnsContainer.style.display = "none";

        });


    }


    // R E A D >> simple display >> how to display data -----------------------------------------
    
    //gestion des tables ---

    //EVALUATION RESULTS
    evaluationResultsBtn.addEventListener("click", function () {
       

        // Afficher la liste des tables si elle est cachée
        if (tableList.style.display === "none") {
            tableList.style.display = "block"; // Affiche la liste complète des tables
        }

        // Cacher toutes les autres tables sauf celle sélectionnée
        document.querySelectorAll(".table-item2").forEach(item => {
            if (item !== evaluationResultsStep) {
                item.style.display = "none";
            }
        });

        // Afficher la table sélectionnée
        evaluationResultsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        readHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        readSimpleDisplayContenant.style.display = 'none';
        buffer = "Table \"evaluation_results\"";
    });

    //EVALUATION RUNS
    evaluationRunsBtn.addEventListener("click", function () {

        // Afficher la liste des tables si elle est cachée
        if (tableList.style.display === "none") {
            tableList.style.display = "block"; // Affiche la liste complète des tables
        }

        // Cacher toutes les autres tables sauf celle sélectionnée
        document.querySelectorAll(".table-item2").forEach(item => {
            if (item !== evaluationRunsStep) {
                item.style.display = "none";
            }
        });

        // Afficher la table sélectionnée
        evaluationRunsStep .style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        readHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        readSimpleDisplayContenant.style.display = 'none';

        buffer = "Table \"evaluation_runs\"";
    });

    //TASK CONFIGS
    taskConfigsBtn.addEventListener("click", function () {
        // Afficher la liste des tables si elle est cachée
        if (tableList.style.display === "none") {
            tableList.style.display = "block"; // Affiche la liste complète des tables
        }

        // Cacher toutes les autres tables sauf celle sélectionnée
        document.querySelectorAll(".table-item2").forEach(item => {
            if (item !== taskConfigsStep) {
                item.style.display = "none";
            }
        });

        // Afficher la table sélectionnée
        taskConfigsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        readHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        readSimpleDisplayContenant.style.display = 'none';
        buffer = "Table \"task_configs\"";
    });

    //TASK METRICS
    taskMetricsBtn.addEventListener("click", function () {
        // Afficher la liste des tables si elle est cachée
        if (tableList.style.display === "none") {
            tableList.style.display = "block"; // Affiche la liste complète des tables
        }

        // Cacher toutes les autres tables sauf celle sélectionnée
        document.querySelectorAll(".table-item2").forEach(item => {
            if (item !== taskMetricsStep) {
                item.style.display = "none";
            }
        }); 

        // Afficher la table sélectionnée
        taskMetricsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        readHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        readSimpleDisplayContenant.style.display = 'none';
        buffer = "Table \"task_metrics\"";

    }); 
    //TASK SUMMARIES
    taskSummariesBtn.addEventListener("click", function () {
        // Afficher la liste des tables si elle est cachée
        if (tableList.style.display === "none") {
            tableList.style.display = "block"; // Affiche la liste complète des tables
        }

        // Cacher toutes les autres tables sauf celle sélectionnée
        document.querySelectorAll(".table-item2").forEach(item => {
            if (item !== taskSummariesStep) {
                item.style.display = "none";
            }
        }); 

        // Afficher la table sélectionnée
        taskSummariesStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        readHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        readSimpleDisplayContenant.style.display = 'none';
        buffer = "Table \"tasks_summaries\"";

    }); 




     // R E A D >> simple display >> how to display data >> read all data -----------------------------------------
    
    readAllDataBtn.addEventListener("click", function () {

        //afficher la phrase
        queryRunningSentence.style.display = "block";
        //masquer le bout "Add Entry"
        runQuery.style.display = "none";
        // Afficher le conteneur READ >> simple display >> how to display data
        readHowDisplayContenant.style.display = 'none';
        // Afficher et masquer les étapes correspondantes
        showStep('read-simple-display-step');
        //afficher le contenant qui dit que la requête s'exécute
        readAllDataContenant.style.display = "flex"

        //INES CODER ICI POUR LA REQUETE
        //quand tu veux afficher tes données retire la phrase "query is running" 
        //queryRunningSentence.style.display = "none";

    });

    // R E A D >> simple display >> how to display data >> read specific columns
    // simple display >> how to display data >> read all data -----------------------------------------


    // Événement au clic sur le bouton "Read Specific Columns"
    // Fonction pour afficher les colonnes de la table sélectionnée avec des checkboxes
    function displayTableColumns(tableName) {
        // Vérifie si le nom de la table est défini dans l'objet tableColumns
        if (tableColumns[tableName]) {
            columnsList.innerHTML = ''; // Nettoyer la liste avant d'ajouter de nouvelles colonnes

            // Boucle à travers chaque colonne de la table sélectionnée
            tableColumns[tableName].forEach(column => {
                const columnDiv = document.createElement("div");
                columnDiv.classList.add("column-item");

                // Créer une checkbox pour chaque colonne
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = column;
                checkbox.name = column;
                checkbox.value = column;

                // Créer un label pour la colonne
                const label = document.createElement("label");
                label.htmlFor = column;
                label.textContent = column;

                // Ajouter la checkbox et le label au conteneur
                columnDiv.appendChild(checkbox);
                columnDiv.appendChild(label);
                columnsList.appendChild(columnDiv);
            });

            // Afficher le conteneur des colonnes
            columnsContainer.style.display = "block";
        } else {
            console.error("Aucune colonne trouvée pour la table sélectionnée.");
        }
    }

    // Ajouter un écouteur d'événement pour le bouton "Read Specific Columns"
    readSpecificDataBtn.addEventListener("click", function () {
        // Vérifie si une table a été sélectionnée en utilisant la variable `buffer`
        if (buffer) {
            displayTableColumns(buffer);
        } else {
            alert("Veuillez d'abord sélectionner une table.");
        }
    });






    


 

    // F O N C T I O N S -------------------------
    
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
