class CustomLogger {
    log() {
        // Pas d'action, logs désactivés
    }
    warn() {
        // Pas d'action, warnings désactivés
    }
    error() {
        // Affiche uniquement les erreurs
        console.error(...arguments);
    }
}

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
        const logger = new CustomLogger();
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
window.duckdbduckdbWasm = duckdbduckdbWasm;

let temp_json_data;
let temp_json_data2;
let db;
let conn;
let configTasks;
let tasksArray;
let results;
let results2;
let resultArray;
let resultArray2;


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

        const filePath = 'http://localhost:10000/results1.json';
        const filePath2 = 'http://localhost:10000/results2.json';

        const response = await fetch(filePath);  // Attendre la réponse
        const data = await response.json();      // Attendre la conversion en JSON

        // Transformer 'config_tasks' en tableau d'objets
        configTasks = data.config_tasks;
        tasksArray = Object.keys(configTasks).map(key => {
            const task = configTasks[key];
            return {
                task_base_name: task.name,
                prompt_function: task.prompt_function,
                hf_repo: task.hf_repo,
                hf_subset: task.hf_subset,
                trust_dataset: task.trust_dataset,
                generation_size: task.generation_size,
                original_num_docs: task.original_num_docs,
                effective_num_docs: task.effective_num_docs,
                must_remove_duplicate_docs: task.must_remove_duplicate_docs,
                version: task.version,
                frozen: task.frozen,
            };
        });

        results = data.results;
        resultArray = Object.keys(results).map(key => {
            const result = results[key];
            return {
                key,
                em: result.em,
                em_stderr: result.em_stderr,
                qem: result.qem,
                qem_stderr: result.qem_stderr,
                pem: result.pem,
                pem_stderr: result.pem_stderr,
                pqem: result.pqem,
                pqem_stderr: result.pqem_stderr,
            };
        });

        const response2 = await fetch(filePath2);  // Attendre la réponse
        const data2 = await response2.json();

        results2 = data2.results;
        resultArray2 = Object.keys(results2).map(key => {
            const result = results2[key];
            return {
                key,
                em: result.em,
                em_stderr: result.em_stderr,
                qem: result.qem,
                qem_stderr: result.qem_stderr,
                pem: result.pem,
                pem_stderr: result.pem_stderr,
                pqem: result.pqem,
                pqem_stderr: result.pqem_stderr,
            };
        });

        // Afficher le tableau pour vérifier
        //console.log(tasksArray);
        //console.log(resultArray);

    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
    }
}

async function loadEvaluationRuns(){
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
            
            INSERT INTO evaluation_runs (run_id, model_name, num_fewshot_seeds, override_batch_size, max_samples, job_id, start_time,
             end_time, total_evaluation_time)
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
            
            INSERT INTO evaluation_runs (run_id, model_name, num_fewshot_seeds, override_batch_size, max_samples, job_id, start_time,
             end_time, total_evaluation_time)
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


    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
        conn.close();
    }
}

async function loadTaskConfig() {
    try {
        await conn.query(`

            CREATE SEQUENCE task_id_sequence START 1;

            CREATE TABLE IF NOT EXISTS task_configs (
                task_id INTEGER PRIMARY KEY,
                task_base_name VARCHAR NOT NULL,
                prompt_function VARCHAR,
                hf_repo VARCHAR,
                hf_subset VARCHAR,
                trust_dataset BOOLEAN,
                generation_size INTEGER,
                original_num_docs INTEGER,
                effective_num_docs INTEGER,
                must_remove_duplicate_docs BOOLEAN,
                version INTEGER,
                frozen BOOLEAN,
            );
        `);

        // Insérer toutes les données dans une seule transaction
        for (const task of tasksArray) {
            await conn.query(`
                INSERT INTO task_configs (task_id, task_base_name, prompt_function, hf_repo, hf_subset,
                                          trust_dataset, generation_size,
                                          original_num_docs, effective_num_docs, must_remove_duplicate_docs,
                                          version, frozen)
                VALUES (nextval('task_id_sequence'), '${task.task_base_name}',
                        '${task.prompt_function}', '${task.hf_repo}',
                        '${task.hf_subset}', '${task.trust_dataset}',
                        '${task.generation_size}', '${task.original_num_docs}',
                        '${task.effective_num_docs}', '${task.must_remove_duplicate_docs}', '${task.version}',
                        '${task.frozen}');
            `);
        }

        // Vérifier l'insertion
        const result = await conn.query("SELECT * FROM task_configs LIMIT 5;");
        console.log("Données de task_configs : ", result.toString());

    } catch (error) {
        // En cas d'erreur, annuler la transaction
        console.error("Erreur lors du chargement des fichiers JSON :", error);
        conn.close();
    }
}



async function loadTaskMetrics(){
    try {
        // Table evaluation_runs
        await conn.query(`
            CREATE SEQUENCE metric_id_sequence START 1;
            
            CREATE OR REPLACE TABLE task_metrics (
                task_id INTEGER PRIMARY KEY, 
                metric_name VARCHAR NOT NULL, 
                higher_is_better BOOLEAN, 
                category VARCHAR,
                use_case VARCHAR, 
                sample_level_fn VARCHAR,
                corpus_level_fn VARCHAR
            );
            
            INSERT INTO task_metrics (task_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
            SELECT 
                nextval('metric_id_sequence'),
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].metric_name') AS metric_name,
                json_extract(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].higher_is_better')::BOOLEAN AS higher_is_better,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].category') AS category,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].use_case') AS use_case,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].sample_level_fn') AS sample_level_fn,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].corpus_level_fn') AS corpus_level_fn
            FROM temp_json_data;
            
            INSERT INTO task_metrics (task_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
            SELECT 
                nextval('metric_id_sequence'),
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].metric_name') AS metric_name,
                json_extract(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].higher_is_better')::BOOLEAN AS higher_is_better,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].category') AS category,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].use_case') AS use_case,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].sample_level_fn') AS sample_level_fn,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].corpus_level_fn') AS corpus_level_fn
            FROM temp_json_data;
            
            INSERT INTO task_metrics (task_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
            SELECT 
                nextval('metric_id_sequence'),
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].metric_name') AS metric_name,
                json_extract(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].higher_is_better')::BOOLEAN AS higher_is_better,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].category') AS category,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].use_case') AS use_case,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].sample_level_fn') AS sample_level_fn,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].corpus_level_fn') AS corpus_level_fn
            FROM temp_json_data;
            
            INSERT INTO task_metrics (task_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
            SELECT 
                nextval('metric_id_sequence'),
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[3].metric_name') AS metric_name,
                json_extract(config_tasks, '$.helm|mmlu:abstract_algebra.metric[3].higher_is_better')::BOOLEAN AS higher_is_better,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[3].category') AS category,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[3].use_case') AS use_case,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[3].sample_level_fn') AS sample_level_fn,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[3].corpus_level_fn') AS corpus_level_fn
            FROM temp_json_data;
            
        `);

        const result = await conn.query("SELECT * FROM task_metrics;");
        console.log("Données de task_metrics : ", result.toString());

    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
        conn.close();
    }
}

async function loadEvaluationResults(){
    try {
        await conn.query(`
            
            CREATE OR REPLACE TABLE evaluation_results (
                run_id INTEGER REFERENCES evaluation_runs(run_id),
                task_id INTEGER,
                em DECIMAL(10,4), 
                em_stderr DECIMAL(10,4),
                qem DECIMAL(10,4), 
                qem_stderr DECIMAL(10,4),
                pem DECIMAL(10,4), 
                pem_stderr DECIMAL(10,4), 
                pqem DECIMAL(10,4),
                pqem_stderr DECIMAL(10,4),
                
            );
        `);

        for (const result of resultArray) {
            await conn.query(`
                INSERT INTO evaluation_results (run_id, task_id, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (1,
                        COALESCE(
                        (SELECT task_id FROM task_configs WHERE '${result.key}' LIKE '%' || task_base_name || '%'),
                        0
                        ),
                       ${result.em}, ${result.em_stderr},
                       ${result.qem}, ${result.qem_stderr},
                       ${result.pem}, ${result.pem_stderr},
                       ${result.pqem}, ${result.pqem_stderr});
            `);
        }

        for (const result of resultArray2) {
            await conn.query(`
                INSERT INTO evaluation_results (run_id, task_id, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (1,
                        COALESCE(
                        (SELECT task_id FROM task_configs WHERE '${result.key}' LIKE '%' || task_base_name || '%'),
                        0
                        ),
                       ${result.em}, ${result.em_stderr},
                       ${result.qem}, ${result.qem_stderr},
                       ${result.pem}, ${result.pem_stderr},
                       ${result.pqem}, ${result.pqem_stderr});
            `);
        }

        // Vérifier l'insertion
        const result = await conn.query("SELECT * FROM evaluation_results LIMIT 5");
        console.log("Données de evaluation_results : ", result.toString());


    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
        conn.close();
    }
}


loadJsonFiles().then(() => {
    loadEvaluationRuns();
    loadTaskMetrics();
    loadTaskConfig();
    loadEvaluationResults();
});