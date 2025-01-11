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

import * as duckdbduckdbWasm from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.1-dev106.0/+esm";
window.duckdbduckdbWasm = duckdbduckdbWasm;

let db;
let conn;
let configTasks;
let tasksArray;
let results;
let results2;
let average_all;
let average_all2;
let resultArray;
let resultArray2;
let average_allArray;
let average_allArray2;

const getDb = async () => {

    const duckdb = window.duckdbduckdbWasm;

    if (window._db) return window._db;

    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
            type: "text/javascript",
        })
    );

    const worker = new Worker(worker_url);
    const logger = new CustomLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);

    // Configuration pour le stockage persistant
    const config = {
        path: 'my_database',
        storageType: 'indexeddb',
    };

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker, config);
    URL.revokeObjectURL(worker_url);

    window._db = db;
    return db;
};


async function saveToLocalStorage(conn) {
    try {
        const dataEvaluationRun = await conn.query(`SELECT * FROM evaluation_runs`);
        const evaluationRuns = dataEvaluationRun.toArray();
        localStorage.setItem('duckdb_evaluation_runs', JSON.stringify(evaluationRuns));

        const dataTaskMetrics = await conn.query(`SELECT * FROM task_metrics`);
        const taskMetrics = dataTaskMetrics.toArray();
        localStorage.setItem('duckdb_task_metrics', JSON.stringify(taskMetrics));

        const dataTaskConfigs = await conn.query(`SELECT * FROM task_configs`);
        const taskConfigs = dataTaskConfigs.toArray();
        localStorage.setItem('duckdb_task_configs', JSON.stringify(taskConfigs));

        // Modification pour les résultats agrégés
        const dataAggregated = await conn.query(`
            SELECT 
                run_id,
                result_type,
                CAST(em AS FLOAT) as em,
                CAST(em_stderr AS FLOAT) as em_stderr,
                CAST(qem AS FLOAT) as qem,
                CAST(qem_stderr AS FLOAT) as qem_stderr,
                CAST(pem AS FLOAT) as pem,
                CAST(pem_stderr AS FLOAT) as pem_stderr,
                CAST(pqem AS FLOAT) as pqem,
                CAST(pqem_stderr AS FLOAT) as pqem_stderr
            FROM aggregated_evaluation_results
        `);
        const taskAggregated = dataAggregated.toArray();
        localStorage.setItem('duckdb_aggregated_evaluation_results', JSON.stringify(taskAggregated));

        // Modification pour les résultats d'évaluation
        const dataEvaluationResults = await conn.query(`
            SELECT
                run_id,
                task_id,
                CAST(em AS FLOAT) as em,
                CAST(em_stderr AS FLOAT) as em_stderr,
                CAST(qem AS FLOAT) as qem,
                CAST(qem_stderr AS FLOAT) as qem_stderr,
                CAST(pem AS FLOAT) as pem,
                CAST(pem_stderr AS FLOAT) as pem_stderr,
                CAST(pqem AS FLOAT) as pqem,
                CAST(pqem_stderr AS FLOAT) as pqem_stderr
            FROM evaluation_results
        `);
        const evaluationResults = dataEvaluationResults.toArray();
        localStorage.setItem('duckdb_evaluation_results', JSON.stringify(evaluationResults));

        console.log('Données sauvegardées dans localStorage');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

function formatToTimestamp(dateString) {
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').split('.')[0]; // Format: "YYYY-MM-DD HH:MM:SS"
}

async function loadFromLocalStorage(conn) {
    try {
        const savedDataEvaluationRuns = localStorage.getItem('duckdb_evaluation_runs');
        if (savedDataEvaluationRuns) {
            const evaluationRuns = JSON.parse(savedDataEvaluationRuns);

            for (const run of evaluationRuns) {

                const startTime = formatToTimestamp(run.start_time);
                const endTime = formatToTimestamp(run.end_time);

                await conn.query(`
                    INSERT INTO evaluation_runs (
                        run_id, model_name, num_fewshot_seeds, override_batch_size,
                        max_samples, job_id, start_time, end_time, total_evaluation_time
                    ) VALUES (
                        ${run.run_id}, '${run.model_name}', ${run.num_fewshot_seeds},
                        ${run.override_batch_size}, ${run.max_samples}, ${run.job_id},
                        '${startTime}', '${endTime}', '${run.total_evaluation_time}'
                    );
                `);
            }
        }

        const savedDataTaskMetrics = localStorage.getItem('duckdb_task_metrics');
        if (savedDataTaskMetrics) {
            const taskMetrics = JSON.parse(savedDataTaskMetrics);

            for (const task of taskMetrics) {

                await conn.query(`
                    INSERT INTO task_metrics (metric_id, metric_name, higher_is_better,
                                              category, use_case, sample_level_fn, 
                                              corpus_level_fn)
                    VALUES (
                               ${task.metric_id},
                               '${task.metric_name}',
                               ${task.higher_is_better},
                               '${task.category}',
                               '${task.use_case}',
                               '${task.sample_level_fn}',
                               '${task.corpus_level_fn}'
                           );
                `);
            }
        }

        const savedDataTaskConfig = localStorage.getItem('duckdb_task_configs');
        if (savedDataTaskConfig) {
            const taskConfig = JSON.parse(savedDataTaskConfig);

            for (const task of taskConfig) {

                await conn.query(`
                    INSERT INTO task_configs (task_id, task_base_name, prompt_function, hf_repo, hf_subset,
                                              trust_dataset, generation_size,
                                              original_num_docs, effective_num_docs, must_remove_duplicate_docs,
                                              version, frozen)
                    VALUES (${task.task_id}, '${task.task_base_name}',
                            '${task.prompt_function}', '${task.hf_repo}',
                            '${task.hf_subset}', '${task.trust_dataset}',
                            '${task.generation_size}', '${task.original_num_docs}',
                            '${task.effective_num_docs}', '${task.must_remove_duplicate_docs}', '${task.version}',
                            '${task.frozen}');
                `);
            }
        }

        const savedAggregated = localStorage.getItem('duckdb_aggregated_evaluation_results');
        if (savedAggregated) {
            const taskAggregated = JSON.parse(savedAggregated);

            for (const aggregated of taskAggregated) {
                await conn.query(`
                    INSERT INTO aggregated_evaluation_results (
                        run_id, result_type, 
                        em, em_stderr, qem, qem_stderr,
                        pem, pem_stderr, pqem, pqem_stderr
                    ) VALUES (
                        ${aggregated.run_id}, 
                        '${aggregated.result_type}',
                        ${parseFloat(aggregated.em)}, 
                        ${parseFloat(aggregated.em_stderr)},
                        ${parseFloat(aggregated.qem)}, 
                        ${parseFloat(aggregated.qem_stderr)},
                        ${parseFloat(aggregated.pem)}, 
                        ${parseFloat(aggregated.pem_stderr)},
                        ${parseFloat(aggregated.pqem)}, 
                        ${parseFloat(aggregated.pqem_stderr)}
                    );
                `);
            }
        }

        const savedDataEvaluationResults = localStorage.getItem('duckdb_evaluation_results');
        if (savedDataEvaluationResults) {
            const evaluationResults = JSON.parse(savedDataEvaluationResults);

            for (const result of evaluationResults) {
                await conn.query(`
                    INSERT INTO evaluation_results (
                        run_id, task_id,
                        em, em_stderr, qem, qem_stderr,
                        pem, pem_stderr, pqem, pqem_stderr
                    ) VALUES (
                        ${result.run_id}, 
                        ${result.task_id},
                        ${parseFloat(result.em)}, 
                        ${parseFloat(result.em_stderr)},
                        ${parseFloat(result.qem)}, 
                        ${parseFloat(result.qem_stderr)},
                        ${parseFloat(result.pem)}, 
                        ${parseFloat(result.pem_stderr)},
                        ${parseFloat(result.pqem)}, 
                        ${parseFloat(result.pqem_stderr)}
                    );
                `);
            }
        }
        console.log('Données restaurées depuis localStorage');

    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
}

const initializeDb = async () => {
    try {
        console.log('Initialisation de la base de données...');
        db = await getDb();
        conn = await db.connect();

        // Création de la séquence et de la table
        await conn.query(`
            CREATE SEQUENCE IF NOT EXISTS run_id_sequence START 1;
            
            CREATE TABLE IF NOT EXISTS evaluation_runs (
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
            
            CREATE SEQUENCE metric_id_sequence START 1;
            
            CREATE OR REPLACE TABLE task_metrics (
                metric_id INTEGER PRIMARY KEY, 
                metric_name VARCHAR NOT NULL, 
                higher_is_better BOOLEAN, 
                category VARCHAR,
                use_case VARCHAR, 
                sample_level_fn VARCHAR,
                corpus_level_fn VARCHAR
            );
            
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
            
            CREATE OR REPLACE TABLE evaluation_results (
                run_id INTEGER REFERENCES evaluation_runs(run_id),
                task_id INTEGER REFERENCES task_configs(task_id),
                em DECIMAL(10,4), 
                em_stderr DECIMAL(10,4),
                qem DECIMAL(10,4), 
                qem_stderr DECIMAL(10,4),
                pem DECIMAL(10,4), 
                pem_stderr DECIMAL(10,4), 
                pqem DECIMAL(10,4),
                pqem_stderr DECIMAL(10,4),
                
                PRIMARY KEY(run_id, task_id)
            );
            
            CREATE OR REPLACE TABLE aggregated_evaluation_results (
                run_id INTEGER REFERENCES evaluation_runs(run_id),
                result_type VARCHAR CHECK (result_type IN ('average', 'all')),
                em DECIMAL(10,4), 
                em_stderr DECIMAL(10,4),
                qem DECIMAL(10,4), 
                qem_stderr DECIMAL(10,4),
                pem DECIMAL(10,4), 
                pem_stderr DECIMAL(10,4), 
                pqem DECIMAL(10,4),
                pqem_stderr DECIMAL(10,4),
                
                PRIMARY KEY(run_id, result_type)
            );
        `);

        console.log('Table evaluation_runs créée');
        console.log('Table task_metrics créée');
        console.log('Table task_configs créée');
        console.log('Table evaluation_results créée');
        console.log('Table aggregated_evaluation_results créée');


        // Charger les données sauvegardées si elles existent
        await loadFromLocalStorage(conn);

        // Vérifier si la table est vide après le chargement
        const countEvalRuns = await checkTableContents(conn, 'evaluation_runs');

        const countTaskMetrics = await checkTableContents(conn, 'task_metrics');

        const countTaskConfig = await checkTableContents(conn, 'task_configs');

        const countEvaluationResults = await checkTableContents(conn, 'evaluation_results');

        const countTaskAggregated = await checkTableContents(conn, 'aggregated_evaluation_results');


        if(countEvalRuns === 0 || countTaskMetrics === 0 || countTaskConfig === 0
            || countTaskAggregated === 0 || countEvaluationResults === 0){
            await loadJsonFiles();
        }

        if (countEvalRuns === 0) {
            console.log('Insertion des données initiales...');
            await loadEvaluationRuns();
            console.log('Données initiales insérées');

            await saveToLocalStorage(conn);
        }

        if (countTaskMetrics === 0) {
            console.log('Insertion des données initiales...');
            await loadTaskMetrics();
            console.log('Données initiales insérées');

            await saveToLocalStorage(conn);
        }

        if (countTaskConfig === 0) {
            console.log('Insertion des données initiales...');
            await loadTaskConfig();
            console.log('Données initiales insérées');

            await saveToLocalStorage(conn);
        }

        if (countEvaluationResults === 0) {
            console.log('Insertion des données initiales...');
            await loadEvaluationResults();
            console.log('Données initiales insérées');

            await saveToLocalStorage(conn);
        }

        if (countTaskAggregated === 0) {
            console.log('Insertion des données initiales...');
            await loadAverageAllResults();
            console.log('Données initiales insérées');

            await saveToLocalStorage(conn);
        }

    } catch (error) {
        console.log(`ERREUR: ${error.message}`);
        console.error("Erreur complète:", error);
    }
};

async function checkTableContents(conn, tableName) {
    const result = await conn.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const count = Number.parseInt(result.get(0).count);
    console.log(`Table ${tableName} contient ${count} enregistrements`);

    if (count > 0) {
        const data = await conn.query(`SELECT * FROM ${tableName} LIMIT 5`);
        console.log(`Contenu de ${tableName}: ${data.toString()}`);
    }
    return count;
}

async function loadJsonFiles() {
    try {
        db = await getDb();
        conn = await db.connect();

        // Installation des extensions
        await conn.query("INSTALL json;");
        await conn.query("LOAD json;");
        await conn.query("SET autoinstall_known_extensions=1;");

        // Création des tables temporaires avec une structure plus plate
        await conn.query(`
            CREATE OR REPLACE TABLE temp_json_data AS
            SELECT * FROM read_json_auto('http://localhost:10000/results1.json');
        `);

        await conn.query(`
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
        resultArray = Object.keys(results)
            .filter(key => key !== "helm|mmlu:_average|5" && key !== "all")
            .map(key => {
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
        resultArray2 = Object.keys(results2)
            .filter(key => key !== "helm|mmlu:_average|5" && key !== "all")
            .map(key => {
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

        average_all = data.results;
        average_allArray = Object.keys(average_all)
            .filter(key => key === "helm|mmlu:_average|5" ||  key === "all")
            .map(key => {
            const result = average_all[key];
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

        average_all2 = data2.results;
        average_allArray2 = Object.keys(average_all2)
            .filter(key => key === "helm|mmlu:_average|5" || key === "all")
            .map(key => {
            const result = average_all2[key];
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
        //console.log(average_allArray2);

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
                metric_id INTEGER PRIMARY KEY, 
                metric_name VARCHAR NOT NULL, 
                higher_is_better BOOLEAN, 
                category VARCHAR,
                use_case VARCHAR, 
                sample_level_fn VARCHAR,
                corpus_level_fn VARCHAR
            );
            
            INSERT INTO task_metrics (metric_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
            SELECT 
                nextval('metric_id_sequence'),
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].metric_name') AS metric_name,
                json_extract(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].higher_is_better')::BOOLEAN AS higher_is_better,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].category') AS category,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].use_case') AS use_case,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].sample_level_fn') AS sample_level_fn,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[0].corpus_level_fn') AS corpus_level_fn
            FROM temp_json_data;
            
            INSERT INTO task_metrics (metric_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
            SELECT 
                nextval('metric_id_sequence'),
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].metric_name') AS metric_name,
                json_extract(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].higher_is_better')::BOOLEAN AS higher_is_better,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].category') AS category,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].use_case') AS use_case,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].sample_level_fn') AS sample_level_fn,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[1].corpus_level_fn') AS corpus_level_fn
            FROM temp_json_data;
            
            INSERT INTO task_metrics (metric_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
            SELECT 
                nextval('metric_id_sequence'),
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].metric_name') AS metric_name,
                json_extract(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].higher_is_better')::BOOLEAN AS higher_is_better,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].category') AS category,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].use_case') AS use_case,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].sample_level_fn') AS sample_level_fn,
                json_extract_string(config_tasks, '$.helm|mmlu:abstract_algebra.metric[2].corpus_level_fn') AS corpus_level_fn
            FROM temp_json_data;
            
            INSERT INTO task_metrics (metric_id, metric_name, higher_is_better, category, use_case, sample_level_fn, corpus_level_fn)
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
                task_id INTEGER REFERENCES task_configs(task_id),
                em DECIMAL(10,4), 
                em_stderr DECIMAL(10,4),
                qem DECIMAL(10,4), 
                qem_stderr DECIMAL(10,4),
                pem DECIMAL(10,4), 
                pem_stderr DECIMAL(10,4), 
                pqem DECIMAL(10,4),
                pqem_stderr DECIMAL(10,4),
                
                PRIMARY KEY(run_id, task_id)
            );
        `);

        for (const result of resultArray) {
            await conn.query(`
                INSERT INTO evaluation_results (run_id, task_id, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (1,
                       (SELECT task_id FROM task_configs WHERE '${result.key}' LIKE '%' || task_base_name || '%'),
                       ${result.em}, ${result.em_stderr},
                       ${result.qem}, ${result.qem_stderr},
                       ${result.pem}, ${result.pem_stderr},
                       ${result.pqem}, ${result.pqem_stderr});
            `);
        }

        for (const result of resultArray2) {
            await conn.query(`
                INSERT INTO evaluation_results (run_id, task_id, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (2,
                       (SELECT task_id FROM task_configs WHERE '${result.key}' LIKE '%' || task_base_name || '%'),
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

async function loadAverageAllResults(){
    try {
        await conn.query(`
            
            CREATE OR REPLACE TABLE aggregated_evaluation_results (
                run_id INTEGER REFERENCES evaluation_runs(run_id),
                result_type VARCHAR CHECK (result_type IN ('average', 'all')),
                em DECIMAL(10,4), 
                em_stderr DECIMAL(10,4),
                qem DECIMAL(10,4), 
                qem_stderr DECIMAL(10,4),
                pem DECIMAL(10,4), 
                pem_stderr DECIMAL(10,4), 
                pqem DECIMAL(10,4),
                pqem_stderr DECIMAL(10,4),
                
                PRIMARY KEY(run_id, result_type)
            );
        `);

        for (const result of average_allArray) {

            const resultType = result.key === "all" ? "all" : "average";

            await conn.query(`
                INSERT INTO aggregated_evaluation_results (run_id, result_type, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (1, '${resultType}',
                       ${result.em}, ${result.em_stderr},
                       ${result.qem}, ${result.qem_stderr},
                       ${result.pem}, ${result.pem_stderr},
                       ${result.pqem}, ${result.pqem_stderr});
            `);
        }

        for (const result of average_allArray2) {

            const resultType = result.key === "all" ? "all" : "average";

            await conn.query(`
                INSERT INTO aggregated_evaluation_results (run_id, result_type, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (2, '${resultType}',
                       ${result.em}, ${result.em_stderr},
                       ${result.qem}, ${result.qem_stderr},
                       ${result.pem}, ${result.pem_stderr},
                       ${result.pqem}, ${result.pqem_stderr});
            `);
        }

        // Vérifier l'insertion
        const result = await conn.query("SELECT * FROM aggregated_evaluation_results LIMIT 5");
        console.log("Données de aggregated_evaluation_results : ", result.toString());


    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
        conn.close();
    }
}

initializeDb();