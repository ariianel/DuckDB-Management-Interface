console.log("script.js chargé");

const getDb = async () => {
    try {
        const duckdb = window.duckdbduckdbWasm;
        // @ts-ignore
        if (window._db) return window._db;
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

        // Select a bundle based on browser checks
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        const worker_url = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], {
                type: "text/javascript",
            })
        );

        // Instantiate the asynchronus version of DuckDB-wasm
        const worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(worker_url);
        window._db = db;
        return db;

    } catch (error) {
        console.error("Failed to initialize DuckDB:", error);
        throw error;
    }
};

import * as duckdbduckdbWasm from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev106.0/+esm";
console.log("duckdbduckdbWasm:", window.duckdbduckdbWasm);
window.duckdbduckdbWasm = duckdbduckdbWasm;
getDb().then(async (db) => {
    const conn = await db.connect();
    const result = await conn.query(`
          CREATE OR REPLACE TABLE friends (friend_name VARCHAR, friend_age INTEGER);
          INSERT INTO friends (friend_name, friend_age) VALUES ('Alice', 30);
          INSERT INTO friends (friend_name, friend_age) VALUES ('Gizmo', 25);
          INSERT INTO friends (friend_name, friend_age) VALUES ('Alien junior', 18);
          SELECT * FROM friends WHERE friend_age >= 26;
        `);
    console.log(result.toString());
});

let temp_json_data;
let temp_json_data2;
let db;
let conn;

async function loadJsonFiles() {
    try {
        db = await getDb();
        conn = await db.connect();

        // Installation des extensions
        await conn.query("INSTALL json;");
        await conn.query("LOAD json;");
        await conn.query("SET autoinstall_known_extensions=1;");

        // Création des tables temporaires avec une structure plus plate
        temp_json_data = await conn.query(`
            CREATE OR REPLACE TABLE temp_json_data AS
            SELECT * FROM read_json_auto('http://localhost:10000/results1.json');
        `);

        temp_json_data2 = await conn.query(`
            CREATE OR REPLACE TABLE temp_json_data2 AS
            SELECT * FROM read_json_auto('http://localhost:10000/results2.json');
        `);

    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
    }
}

async function loadEvaluastionRuns(){
    try {
    // Table evaluation_runs
    await conn.query(`
            CREATE SEQUENCE run_id_sequence START 1;
            
            CREATE OR REPLACE TABLE evaluation_runs (
                run_id INTEGER PRIMARY KEY, 
                model_name VARCHAR NOT NULL, 
                num_fewshot_seeds INTEGER, 
                override_batch_size INTEGER,
                max_samples INTEGER, 
                job_id INTEGER,
                start_time TIMESTAMP, 
                end_time TIMESTAMP, 
                total_evaluation_time VARCHAR
            );
            
            INSERT INTO evaluation_runs (run_id, model_name, num_fewshot_seeds, override_batch_size, max_samples, job_id, start_time, end_time, total_evaluation_time)
            SELECT 
              nextval('run_id_sequence'),
              config_general.model_name,
              config_general.num_fewshot_seeds,
              config_general.override_batch_size,
              config_general.max_samples,
              config_general.job_id,
              TO_TIMESTAMP(config_general.start_time),
              TO_TIMESTAMP(config_general.end_time),
              config_general.total_evaluation_time_secondes
            FROM temp_json_data;
            
            INSERT INTO evaluation_runs (run_id, model_name, num_fewshot_seeds, override_batch_size, max_samples, job_id, start_time, end_time, total_evaluation_time)
            SELECT 
              nextval('run_id_sequence'),
              config_general.model_name,
              config_general.num_fewshot_seeds,
              config_general.override_batch_size,
              config_general.max_samples,
              config_general.job_id,
              TO_TIMESTAMP(config_general.start_time),
              TO_TIMESTAMP(config_general.end_time),
              config_general.total_evaluation_time_secondes
            FROM temp_json_data2;
        `);

    const result = await conn.query("SELECT * FROM evaluation_runs;");
    console.log("Données de evaluation_runs : ", result.toString());

    conn.close();

    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
    }
}

/*async function loadTaskConfig() {
    try {
        // Extraire les objets `config_task` du fichier JSON
        // Vous pouvez supposer que `config_task` est une clé dans l'objet JSON global
        const configTasks = await conn.query(`
            SELECT *
            FROM temp_json_data
            WHERE json_extract(json_data, '$.config_tasks') IS NOT NULL
        `);

        // Pour chaque objet `config_task`, extraire les sous-objets et insérer dans la base de données
        configTasks.forEach(task => {
            const configTaskData = JSON.parse(task.value).config_tasks;

            // Si config_tasks est un objet, vous devez insérer chaque sous-objet comme une ligne dans la table
            Object.keys(configTaskData).forEach(taskKey => {
                const configTask = configTaskData[taskKey];

                // Préparer l'insertion dans la table `task_configs`
                const insertSQL = `
                    INSERT INTO task_configs (task_id, task_base_name, prompt_function, hf_repo, hf_subset, hf_avail_splits, trust_dataset, evaluation_splits, generation_size, stop_sequence, original_num_docs, effective_num_docs, version, frozen, suite)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                // Insérer les données spécifiques à chaque config_task
                conn.run(insertSQL, [
                    configTask.task_id,
                    configTask.task_base_name,
                    configTask.prompt_function,
                    configTask.hf_repo,
                    configTask.hf_subset,
                    configTask.hf_avail_splits,
                    configTask.trust_dataset,
                    configTask.evaluation_splits,
                    configTask.generation_size,
                    configTask.stop_sequence,
                    configTask.original_num_docs,
                    configTask.effective_num_docs,
                    configTask.version,
                    configTask.frozen,
                    configTask.suite
                ]);
            });
        });

        const result = await conn.query("SELECT * FROM task_configs;");
        console.log("Données insérées dans task_configs:", result.toString());

        conn.close();
    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON:", error);
    }
}*/

loadJsonFiles().then(() => {
    loadEvaluastionRuns();
    //loadTaskConfig();
});