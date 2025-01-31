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
    const evaluationRunsStep = document.getElementById('update-evaluation_runs-table');
    //table task configs
    const taskConfigsBtn = document.getElementById('update-task-configs-btn');
    const taskConfigsStep = document.getElementById('update-task_configs-table');  
    //table task metrics
    const taskMetricsBtn = document.getElementById('update-task-metrics-btn');
    const taskMetricsStep = document.getElementById('update-task_metrics-table'); 
    //table task summaries
    const taskSummariesBtn = document.getElementById('update-task-summaries-btn');
    const taskSummariesStep = document.getElementById('update-tasks_summaries-table'); 
    //table general summary
    const generalSummaryBtn = document.getElementById('update-general-summary-btn');
    const generalStep = document.getElementById('update-general_summary-table'); 

    const chooseColumnsSentence = document.querySelector('.update-choose-columns-contenant');
    
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

    // U P D A T E >> simple display >> how to display data -----------------------------------------
    
    updateSimpleDisplayBtn.addEventListener("click", function () {
        // Cacher le conteneur READ
        updateContenant.style.display = 'none';
            
        // Afficher le conteneur UPDATE
        updateSimpleDisplayContenant.style.display = 'flex';

        // Afficher et masquer les étapes correspondantes
        showStep('update-choose-table-step');
    });

    // Gestion de la fermeture de l'étape "simple display" !!!!!!!!!!!!!!!!!!!!!!!!!
    const closeUpdateChooseStepBtn = document.querySelector(".update-choose-table-close-step");
    if (closeUpdateChooseStepBtn) {
        closeUpdateChooseStepBtn.addEventListener("click", function () {
            // Cacher la section simple display et réafficher read
            updateContenant.style.display = "flex";
            updateSimpleDisplayContenant.style.display = "none";
            // Masquer l'étape read
            hideStep('update-choose-table-step');
            //masquer la table selectionnés
            tableList.style.display = "none";
            //masquer le conteneur "how to display data ?"
            updateHowDisplayContenant.style.display = "none";

        });


    }

    // R E A D >> simple display >> how to display data -----------------------------------------
    
    //gestion des tables ---

    //EVALUATION RESULTS
    updateEvaluationResultsBtn.addEventListener("click", function () {

        // Afficher la liste des tables si elle est cachée
        if (tableList.style.display === "none") {
            tableList.style.display = "block"; // Affiche la liste complète des tables
        }

        // Cacher toutes les autres tables sauf celle sélectionnée
        document.querySelectorAll(".table-item2").forEach(item => {
            if (item !== updateEvaluationResultsStep) {
                item.style.display = "none";
            }
        });

        // Afficher la table sélectionnée
        updateEvaluationResultsStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
        readHowDisplayContenant.style.display = 'none';
        buffer = "Table \"evaluation_results\"";
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
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
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
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
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
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
        buffer = "Table \"tasks_summaries\"";

    }); 

    ////GENERAL SUMMARY
    generalSummaryBtn.addEventListener("click", function () {
        // Afficher la liste des tables si elle est cachée
        if (tableList.style.display === "none") {
            tableList.style.display = "block"; // Affiche la liste complète des tables
        }

        // Cacher toutes les autres tables sauf celle sélectionnée
        document.querySelectorAll(".table-item2").forEach(item => {
            if (item !== generalStep) {
                item.style.display = "none";
            }
        }); 

        // Afficher la table sélectionnée
        generalStep.style.display = 'flex';
        // Afficher le conteneur READ >> simple display >> how to display data
        updateHowDisplayContenant.style.display = 'flex';
        // Cacher le conteneur READ >> simple display
        updateSimpleDisplayContenant.style.display = 'none';
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
