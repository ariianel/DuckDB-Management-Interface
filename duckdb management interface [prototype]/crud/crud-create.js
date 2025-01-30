document.addEventListener("DOMContentLoaded", function () {

    // START BY CHOOSING AN OPERATION ***********************************************

    // conteneurs CRUD et Create
    const crudContenant = document.querySelector('.crud-contenant');
    const createContenant = document.querySelector('.create-contenant');
    const crudButtons = document.querySelectorAll('.crud-btn'); //tout les boutons
    const createBtn = document.getElementById('create-btn');

    // Ajouter un événement de clic à chaque bouton CRUD
    crudButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Supprimer l'état "actif" de tous les boutons
            crudButtons.forEach(btn => btn.classList.remove('active'));

            // Ajouter l'état "actif" au bouton cliqué
            this.classList.add('active');
        });
    });

    // C  R  E  A  T  E   -----------------------------------------------------------------------------------------------------------------------------------------------------

    // Ajouter un événement de clic pour le bouton Create
    createBtn.addEventListener('click', function () {
        crudContenant.style.display = 'none';
        createContenant.style.display = 'flex';

        showStep('create-step');
        hideStep('update-step');
        hideStep('delete-step');
    });

    //C  R  E  A  T  E  :  INSERT DATA INTO EXISTING TABLE  --------------------------------------------------

    const insertBtn = document.getElementById("insert-btn");
    const tableList = document.getElementById("table-list");
    const formContainer = document.getElementById("form-container");
    const selectedTableName = document.getElementById("selected-table-name");
    const tableItems = document.querySelectorAll(".table-item");
    const closeButtons = document.querySelectorAll(".close-step2");
    const insertDataStep = document.getElementById("insert-data-step");
    const closeStepBtn = document.querySelector("#insert-data-step .insert-close-step");
    const runQuery = document.getElementById("run-query-btn");
    const importJsonFileBtn = document.getElementById("import-json-file-btn");

    runQuery.addEventListener("click", function () {

    });

    // GESTION DES ETAPES ---

    // Affichage de la liste des tables au clic sur "Insert data into Existing Table"
    insertBtn.addEventListener("click", function () {
        tableList.style.display = "block";
        insertDataStep.style.display = "flex"; // Affiche l'étape
        tableList.style.display = "block"; // Affiche la liste des tables
        runQuery.style.display = "block";
    });

    // Clic sur la croix de l'étape en cours pour masquer cette même étape
    closeStepBtn.addEventListener("click", function () {
        insertDataStep.style.display = "none"; // Cache l'étape
        tableList.style.display = "none"; // Cache la liste des tables
        formContainer.style.display = "none";
    
    });

    //Affiche l'ajout d'un JSON file <<<<<<<<<<<<<<<<<
    const jsonImportSection = document.getElementById('json-import-section');
    const jsonFileInput = document.getElementById('json-file-input');
    const jsonDisplayContainer = document.getElementById('json-display-container');
    const processJsonBtn = document.getElementById('process-json-btn');
    const importJsonFileStep = document.getElementById("import-json-file-step");
    const closeJsonFileStep = document.querySelector("#import-json-file-step .import-json-file-step");


    // Événement pour afficher/masquer la section JSON
    importJsonFileBtn.addEventListener('click', () => {
        jsonImportSection.style.display = jsonImportSection.style.display === 'none' ? 'block' : 'none';
        importJsonFileStep.style.display = "flex";
    });

    //evenement quand on clique sur la creoix de l'étape
    closeJsonFileStep.addEventListener("click", function () {
        importJsonFileStep.style.display = "none";
        jsonImportSection.style.display = "none"    
    });

    // Événement pour traiter le fichier JSON


    // GESTION TABLE OU INSERER LES DONNEE

    // Clic sur une table pour afficher le formulaire et masquer les autres tables
    tableItems.forEach(item => {
        item.addEventListener("click", function () {
            // Masquer toutes les autres tables sauf celle sélectionnée
            tableItems.forEach(li => {
                if (li !== item) li.style.display = "none";
            });

            // Afficher le formulaire et mettre à jour le nom de la table
            selectedTableName.textContent = item.textContent.trim();
            formContainer.style.display = "block";
        });
    });


    // Gestion des clics sur la croix de chaque table listé pour annuler et revenir à l'étape précédente
    closeButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation(); // Empêche la propagation du clic à l'élément parent

            // Réafficher toutes les tables et masquer le formulaire
            tableItems.forEach(li => li.style.display = "flex");
            formContainer.style.display = "none";
            
        });
    });

    // TABLE DATA INSERTION MANAGEMENT --------------

    const columnContainer = document.getElementById("table-columns");
    const inputContainer = document.getElementById("input-fields");


    // Données des colonnes des tables (simulées)
    const tableColumns = {
        "Table \"evaluation_runs\"": [
            "model_name", "num_fewshot_seeds", "override_batch_size",
            "max_samples", "job_id", "start_time", "end_time", "total_evaluation_time", 
            "model_sha", "model_dtype", "model_size", "lighteval_sha"
        ],
        "Table \"task_configs\"": [
            "task_base_name", "prompt_function", "hf_repo",
            "hf_subset", "hf_revision", "hf_filter", "trust_dataset", 
            "few_shots_split", "few_shots_select", "generation_size", 
            "generation_grammar", "output_regex", "num_samples", 
            "original_num_docs", "effective_num_docs", 
            "must_remove_duplicate_docs", "version", "frozen"
        ],
        "Table \"task_metrics\"": [
            "metric_name", "higher_is_better", "category",
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
            "truncated", "non_truncated",
            "padded", "non_padded", "num_truncated_few_shots"
        ]
    };

    // Affichage de la liste des tables et étape "Insert Data"
    insertBtn.addEventListener("click", function () {
        tableList.style.display = "block";
        showStep('insert-data-step');
        insertBtn.classList.add("selected");
    });

    // Clic sur une table pour afficher les colonnes et les champs de saisie
    tableItems.forEach(item => {
        item.addEventListener("click", function () {
            const tableName = item.textContent.trim();
            selectedTableName.textContent = tableName;

            // Nettoyer les colonnes et champs précédents
            columnContainer.innerHTML = "";
            inputContainer.innerHTML = "";

            // Ajouter les colonnes et champs correspondants
            if (tableColumns[tableName]) {
                tableColumns[tableName].forEach(column => {
                    let columnDiv = document.createElement("div");
                    columnDiv.textContent = column;
                    columnContainer.appendChild(columnDiv);

                    let inputField = document.createElement("input");
                    inputField.setAttribute("type", "text");
                    inputField.setAttribute("name", column);
                    inputField.setAttribute("placeholder", "Enter " + column);
                    inputContainer.appendChild(inputField);
                });
            }

            // Afficher le formulaire
            formContainer.style.display = "block";
        });
    });


    /*updateBtn.addEventListener('click', function () {
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
    });*/

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

            if(step.classList.contains('crud-step')){
                const crudButtons = document.querySelectorAll('.crud-btn');

                crudButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.classList.remove('tmp');
                });
            }

            if(step.classList.contains('create-btn-step')){
                const createButtons = document.querySelectorAll('.create-btn');

                createButtons.forEach(btn => {
                    btn.classList.remove('tmp');
                    btn.classList.remove('selected');
                });
            }

            if(step.classList.contains('read-btn-step')){
                const readButtons = document.querySelectorAll('.read-btn');

                readButtons.forEach(btn => {
                    btn.classList.remove('tmp');
                    btn.classList.remove('selected');
                });
            }

        }
    }

    // Gérer la suppression des étapes lorsque l'utilisateur clique sur la croix
    const closeSteps = document.querySelectorAll('.steps');
    closeSteps.forEach(cross => {
        cross.addEventListener('click', function () {
            const stepId = this.getAttribute('id'); // Récupère l'étape à fermer
            hideStep(stepId);

            // Afficher le conteneur CRUD et masquer le conteneur Create
            if(stepId === 'create-step'){
                crudContenant.style.display = 'flex';
                createContenant.style.display = 'none';
                jsonImportSection.style.display = 'none';
            }

        });
    });
    
    // Gestion des clics sur la croix de chaque table listée pour annuler
    closeButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            tableItems.forEach(li => li.style.display = "flex");
            formContainer.style.display = "none";
        });
    });
    
});
