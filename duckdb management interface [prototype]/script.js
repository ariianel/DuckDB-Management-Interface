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
let taskSummary;
let taskSummary_allArray;
let taskSummary2;
let taskSummary_allArray2;

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

        const dataGeneralSummary = await conn.query(`SELECT * FROM general_summary`);
        const generalSummary  = dataGeneralSummary.toArray();
        localStorage.setItem('duckdb_general_summary', JSON.stringify(generalSummary));

        const dataTaskSummary = await conn.query(`SELECT * FROM task_summaries`);
        const taskSummary  = dataTaskSummary.toArray();
        localStorage.setItem('duckdb_task_summary', JSON.stringify(taskSummary));

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
                        max_samples, job_id, start_time, end_time, total_evaluation_time, 
                        model_sha, model_dtype, model_size,lighteval_sha
                    ) VALUES (
                        ${run.run_id}, '${run.model_name}', ${run.num_fewshot_seeds},
                        ${run.override_batch_size}, ${run.max_samples}, ${run.job_id},
                        '${startTime}', '${endTime}', '${run.total_evaluation_time}',
                        '${run.model_sha}', '${run.model_dtype}', ${run.model_size}, '${run.lighteval_sha}'
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
                    INSERT INTO task_configs (task_id, task_base_name, prompt_function, hf_repo, hf_subset ,hf_revision ,hf_filter ,few_shots_split ,few_shots_select,
                                              trust_dataset, generation_size, generation_grammar, output_regex, num_samples,
                                              original_num_docs, effective_num_docs, must_remove_duplicate_docs,
                                              version, frozen)
                    VALUES (${task.task_id}, '${task.task_base_name}',
                            '${task.prompt_function}', '${task.hf_repo}',
                            '${task.hf_subset}','${task.hf_revision}','${task.hf_filter}','${task.few_shots_split}',${task.few_shots_select}, '${task.trust_dataset}',
                            '${task.generation_size}', ${task.generation_grammar}, ${task.output_regex}, ${task.num_samples},'${task.original_num_docs}',
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

        const savedDataGeneralSummary = localStorage.getItem('duckdb_general_summary');
        if (savedDataGeneralSummary) {
            const generalSummary = JSON.parse(savedDataGeneralSummary);

            for (const sum of generalSummary) {

                await conn.query(`
                    INSERT INTO general_summary (run_id, truncated, non_truncated, padded, non_padded, num_truncated_few_shots)
                    VALUES (${sum.run_id}, '${sum.truncated}',
                            '${sum.non_truncated}', '${sum.padded}',
                            '${sum.non_padded}','${sum.num_truncated_few_shots}');
                `);
            }
        }

        const savedDataTaskSummary = localStorage.getItem('duckdb_task_summary');
        if (savedDataTaskSummary) {
            const taskSummary = JSON.parse(savedDataTaskSummary);

            for (const sum of taskSummary) {

                await conn.query(`
                    INSERT INTO task_summaries (run_id, task_id, truncated, non_truncated,
                                                 padded ,non_padded ,effective_few_shots ,
                                                 num_truncated_few_shots)
                    VALUES (${sum.run_id}, ${sum.task_id},
                            ${sum.truncated}, ${sum.non_truncated},
                            ${sum.padded},${sum.non_padded},
                            ${sum.effective_few_shots},${sum.num_truncated_few_shots});
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
                total_evaluation_time VARCHAR,
                model_sha VARCHAR,
                model_dtype VARCHAR,
                model_size INTEGER,
                lighteval_sha VARCHAR
            );
            
            CREATE SEQUENCE metric_id_sequence START 1;
            
            CREATE TABLE IF NOT EXISTS task_metrics (
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
                hf_revision VARCHAR,
                hf_filter VARCHAR,
                few_shots_split VARCHAR,
                few_shots_select INTEGER,
                trust_dataset BOOLEAN,
                generation_size INTEGER,
                generation_grammar INTEGER,
                output_regex INTEGER,
                num_samples INTEGER,
                original_num_docs INTEGER,
                effective_num_docs INTEGER,
                must_remove_duplicate_docs BOOLEAN,
                version INTEGER,
                frozen BOOLEAN
            );
            
            CREATE TABLE IF NOT EXISTS evaluation_results (
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
            
            CREATE TABLE IF NOT EXISTS aggregated_evaluation_results (
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
                    
            CREATE SEQUENCE general_id_sequence START 1;
                        
            CREATE TABLE IF NOT EXISTS general_summary (
                run_id INTEGER PRIMARY KEY REFERENCES evaluation_runs(run_id),
                truncated INTEGER,
                non_truncated INTEGER,
                padded INTEGER,
                non_padded INTEGER,
                num_truncated_few_shots INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS task_summaries (
                run_id INTEGER REFERENCES evaluation_runs(run_id),
                task_id INTEGER REFERENCES task_configs(task_id),
                truncated INTEGER,
                non_truncated INTEGER,
                padded INTEGER,
                non_padded INTEGER,
                effective_few_shots FLOAT,
                num_truncated_few_shots INTEGER,
                
                PRIMARY KEY (run_id, task_id)
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

        const countGeneralSummary = await checkTableContents(conn, 'general_summary');

        const countTaskSummary = await checkTableContents(conn, 'task_summaries');

        if(countEvalRuns === 0 || countTaskMetrics === 0 || countTaskConfig === 0 || countTaskSummary === 0
            || countTaskAggregated === 0 || countEvaluationResults === 0 || countGeneralSummary === 0){
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

        if (countGeneralSummary === 0) {
            console.log('Insertion des données initiales...');
            await loadGeneralSummary();
            console.log('Données initiales insérées');

            await saveToLocalStorage(conn);
        }

        if (countTaskSummary === 0) {
            console.log('Insertion des données initiales countTaskSummary...');
            await loadTaskSummary();
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
                hf_revision: task.hf_revision,
                hf_filter: task.hf_filter,
                few_shots_split: task.few_shots_split,
                few_shots_select: task.few_shots_select,
                trust_dataset: task.trust_dataset,
                generation_size: task.generation_size,
                generation_grammar: task.generation_grammar,
                output_regex: task.output_regex,
                num_samples: task.num_samples,
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

        taskSummary = data.summary_tasks;
        taskSummary_allArray = Object.keys(taskSummary)
            .filter(key => key !== "helm|mmlu:_average|5" && key !== "all")
            .map(key => {
                const result = taskSummary[key];
                return {
                    key,
                    truncated: result.truncated,
                    non_truncated: result.non_truncated,
                    padded: result.padded,
                    non_padded: result.non_padded,
                    effective_few_shots: result.effective_few_shots,
                    num_truncated_few_shots: result.num_truncated_few_shots,
                };
            });

        taskSummary2 = data2.summary_tasks;
        taskSummary_allArray2 = Object.keys(taskSummary2)
            .filter(key => key !== "helm|mmlu:_average|5" && key !== "all")
            .map(key => {
                const result = taskSummary2[key];
                return {
                    key,
                    truncated: result.truncated,
                    non_truncated: result.non_truncated,
                    padded: result.padded,
                    non_padded: result.non_padded,
                    effective_few_shots: result.effective_few_shots,
                    num_truncated_few_shots: result.num_truncated_few_shots,
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
                total_evaluation_time VARCHAR,
                model_sha VARCHAR,
                model_dtype VARCHAR,
                model_size INTEGER,
                lighteval_sha VARCHAR
            );
            
            INSERT INTO evaluation_runs (run_id, model_name, num_fewshot_seeds, override_batch_size, max_samples, job_id, start_time,
             end_time, total_evaluation_time, model_sha, model_dtype, model_size,lighteval_sha)
            SELECT 
              nextval('run_id_sequence'),
              config_general.model_name,
              config_general.num_fewshot_seeds,
              config_general.override_batch_size,
              config_general.max_samples,
              config_general.job_id,
              TO_TIMESTAMP(config_general.start_time),
              TO_TIMESTAMP(config_general.end_time),
              config_general.total_evaluation_time_secondes,
              config_general.model_sha,
              config_general.model_dtype,
              config_general.model_size,
              config_general.lighteval_sha
            FROM temp_json_data;
            
            INSERT INTO evaluation_runs (run_id, model_name, num_fewshot_seeds, override_batch_size, max_samples, job_id, start_time,
             end_time, total_evaluation_time, model_sha, model_dtype, model_size,lighteval_sha)
            SELECT 
              nextval('run_id_sequence'),
              config_general.model_name,
              config_general.num_fewshot_seeds,
              config_general.override_batch_size,
              config_general.max_samples,
              config_general.job_id,
              TO_TIMESTAMP(config_general.start_time),
              TO_TIMESTAMP(config_general.end_time),
              config_general.total_evaluation_time_secondes,
              config_general.model_sha,
              config_general.model_dtype,
              config_general.model_size,
              config_general.lighteval_sha
            FROM temp_json_data2;
        `);

    const result = await conn.query("SELECT * FROM evaluation_runs;");
    console.log("Données de evaluation_runs : ", result.toString());


    } catch (error) {
        console.error("Erreur lors du chargement des fichiers JSON :", error);
        conn.close();
    }
}

async function loadGeneralSummary(){
    try {
        // Table evaluation_runs
        await conn.query(`
        
            CREATE SEQUENCE general_id_sequence START 1;

            CREATE TABLE IF NOT EXISTS general_summary (
                run_id INTEGER PRIMARY KEY REFERENCES evaluation_runs(run_id),
                truncated INTEGER,
                non_truncated INTEGER,
                padded INTEGER,
                non_padded INTEGER,
                num_truncated_few_shots INTEGER
            );
            
            INSERT INTO general_summary (run_id, truncated, non_truncated, padded, non_padded, num_truncated_few_shots)
            SELECT 
              nextval('general_id_sequence'),
              summary_general.truncated,
              summary_general.non_truncated,
              summary_general.padded,
              summary_general.non_padded,
              summary_general.num_truncated_few_shots
            FROM temp_json_data;

            INSERT INTO general_summary (run_id, truncated, non_truncated, padded, non_padded, num_truncated_few_shots)
            SELECT
                nextval('general_id_sequence'),
                summary_general.truncated,
                summary_general.non_truncated,
                summary_general.padded,
                summary_general.non_padded,
                summary_general.num_truncated_few_shots
            FROM temp_json_data2;
        `);

        const result = await conn.query("SELECT * FROM general_summary;");
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

            CREATE OR REPLACE TABLE task_configs (
                task_id INTEGER PRIMARY KEY,
                task_base_name VARCHAR NOT NULL,
                prompt_function VARCHAR,
                hf_repo VARCHAR,
                hf_subset VARCHAR,
                hf_revision VARCHAR,
                hf_filter VARCHAR,
                few_shots_split VARCHAR,
                few_shots_select INTEGER,
                trust_dataset BOOLEAN,
                generation_size INTEGER,
                generation_grammar INTEGER,
                output_regex INTEGER,
                num_samples INTEGER,
                original_num_docs INTEGER,
                effective_num_docs INTEGER,
                must_remove_duplicate_docs BOOLEAN,
                version INTEGER,
                frozen BOOLEAN
            );
        `);

        // Insérer toutes les données dans une seule transaction
        for (const task of tasksArray) {
            await conn.query(`
                INSERT INTO task_configs (task_id, task_base_name, prompt_function, hf_repo, hf_subset ,hf_revision ,hf_filter ,few_shots_split ,few_shots_select,
                    trust_dataset, generation_size, generation_grammar, output_regex, num_samples,
                    original_num_docs, effective_num_docs, must_remove_duplicate_docs,
                    version, frozen)
                VALUES (nextval('task_id_sequence'), '${task.task_base_name}',
                    '${task.prompt_function}', '${task.hf_repo}',
                    '${task.hf_subset}','${task.hf_revision}','${task.hf_filter}','${task.few_shots_split}',${task.few_shots_select}, '${task.trust_dataset}',
                    '${task.generation_size}', ${task.generation_grammar}, ${task.output_regex}, ${task.num_samples},'${task.original_num_docs}',
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

async function loadTaskSummary() {
    try {
        await conn.query(`

            CREATE SEQUENCE task_id_sequence START 1;

            CREATE TABLE IF NOT EXISTS task_summaries (
                run_id INTEGER REFERENCES evaluation_runs(run_id),
                task_id INTEGER REFERENCES task_configs(task_id),
                truncated INTEGER,
                non_truncated INTEGER,
                padded INTEGER,
                non_padded INTEGER,
                effective_few_shots FLOAT,
                num_truncated_few_shots INTEGER,
                PRIMARY KEY (run_id, task_id)
            );
        `);

        // Insérer toutes les données dans une seule transaction
        for (const task of taskSummary_allArray) {
            await conn.query(`
                 INSERT INTO task_summaries (run_id, task_id, truncated, non_truncated, 
                                          padded ,non_padded ,effective_few_shots ,
                                          num_truncated_few_shots)
                VALUES (1, (SELECT t.task_id FROM task_configs as t WHERE '${task.key}' LIKE '%' || t.task_base_name || '%'),
                    ${task.truncated}, ${task.non_truncated},
                    ${task.padded},${task.non_padded},
                    ${task.effective_few_shots},${task.num_truncated_few_shots});
            `);
        }

        for (const task of taskSummary_allArray2) {
            await conn.query(`
                INSERT INTO task_summaries (run_id, task_id, truncated, non_truncated, 
                                          padded ,non_padded ,effective_few_shots ,
                                          num_truncated_few_shots)
                VALUES (2, (SELECT t.task_id FROM task_configs as t WHERE '${task.key}' LIKE '%' || t.task_base_name || '%'),
                        ${task.truncated}, ${task.non_truncated},
                        ${task.padded},${task.non_padded},
                        ${task.effective_few_shots},${task.num_truncated_few_shots})
            `);
        }

        // Vérifier l'insertion
        const result = await conn.query("SELECT * FROM task_summaries LIMIT 5;");
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

let usedQuery = false;

initializeDb();

let sqlEditor = CodeMirror.fromTextArea(document.getElementById("sqlEditor"), {
    mode: "text/x-sql",           // Définit le mode pour le SQL
    theme: "tomorrow-night-bright",            // Thème de l'éditeur
    lineNumbers: true,            // Affiche les numéros de ligne
    autoCloseBrackets: true,      // Fermeture automatique des parenthèses
    matchBrackets: true,          // Correspondance des parenthèses
    extraKeys: {
        "Ctrl-Space": "autocomplete" // Raccourci pour l'autocomplétion
    }
});

let sqlResult = CodeMirror.fromTextArea(document.getElementById("sqlResult"), {
    mode: "text/x-sql",           // Définit le mode pour le SQL
    theme: "tomorrow-night-bright",            // Thème de l'éditeur
    lineNumbers: true,            // Affiche les numéros de ligne
    autoCloseBrackets: true,      // Fermeture automatique des parenthèses
    matchBrackets: true,          // Correspondance des parenthèses
    readOnly: true,
    extraKeys: {
        "Ctrl-Space": "autocomplete" // Raccourci pour l'autocomplétion
    }
});

// Fixer la taille de CodeMirror
sqlEditor.setSize("100%", "400px"); // Largeur et hauteur fixes
sqlResult.setSize("100%", "350px"); // Largeur et hauteur fixes

sqlResult.getWrapperElement().style.display = "none";

let sqlQuery;

sqlEditor.on('change', function(cm, changeObj) {
    const runQueryBtn = document.querySelector('.run-query-btn');

    // Check if there's any content
    if (sqlEditor.getValue().trim() !== '') {
        runQueryBtn.style.color = 'black';
        runQueryBtn.style.borderColor = 'black';
        runQueryBtn.style.backgroundColor = '#FFF100';
        runQueryBtn.style.transform = 'scale(1.05)';  // Slight scale up
        runQueryBtn.style.transition = 'all 0.3s ease';
    } else {
        runQueryBtn.style.color = 'white';
        runQueryBtn.style.borderColor = 'white';
        runQueryBtn.style.backgroundColor = '';  // Reset to default
        runQueryBtn.style.transform = 'scale(1)';
    }
});

let btnClear = document.querySelector(".clear-btn");
let msgError = document.querySelector(".msg-error");
btnClear.style.display = "none";
msgError.style.display = "none";

document.getElementById('sqlButton').addEventListener("click", function (event) {
    // Force read-only to false using multiple methods
    sqlEditor.setOption('readOnly', false);

    // Optional: Add visual indication of read-only state
    const editorWrapper = sqlEditor.getWrapperElement();
    editorWrapper.style.pointerEvents = 'auto';

    usedQuery = false;
    sqlResult.setSize("100%", "350px");

    btnClear.style.display = "none";
    msgError.style.display = "none";
    document.querySelector(".run-query-btn").style.display = "block";
    sqlResult.getWrapperElement().style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";
});

document.querySelector(".run-query-btn").addEventListener("click", function (event) {

    const button = event.target;
    button.style.display = "none";

    console.log(usedQuery);

    if(usedQuery === false){
        btnClear.style.display = "block";
    }

    // Récupérer le contenu de l'éditeur SQL
    sqlQuery = sqlEditor.getValue().trim();

    if(sqlQuery === ""){
        msgError.style.display = "block";
        msgError.textContent = "To execute a query you need to write somethings !"
        return;
    }
    else{
        executeSQL()
    }

});

async function executeSQL(){
    try {
        const result = await conn.query(sqlQuery);
        console.log(result.toString());

        sqlResult.setValue(result.toString());
        sqlResult.getWrapperElement().style.display = "block";
        sqlResult.refresh();

    } catch(error){
        msgError.style.display = "block";
        msgError.textContent = "Syntax error, please check your query !"
    }
}

btnClear.addEventListener("click", function(){
    document.querySelector(".run-query-btn").style.display = "block";

    sqlResult.getWrapperElement().style.display = "none";
    btnClear.style.display = "none";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";
});

let queryButton = document.getElementById('queryButton'); // Bouton Query

queryButton.addEventListener("click", function(){

    sqlEditor.setOption('readOnly', true);

    // Optional: Add visual indication of read-only state
    const editorWrapper = sqlEditor.getWrapperElement();
    editorWrapper.style.pointerEvents = 'none';

    usedQuery = true;
    sqlResult.setSize("100%", "400px");
    document.querySelector(".run-query-btn").style.display = "none";

    document.querySelectorAll('.query-item').forEach(item => {
        item.setAttribute('data-selected', 'false');
        item.classList.remove('active');
    });

    sqlResult.getWrapperElement().style.display = "none";
    btnClear.style.display = "none";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";

});

document.querySelector(".query-stat").addEventListener("click", function(event){
    console.log(usedQuery)

    sqlResult.getWrapperElement().style.display = "none";
    document.querySelector(".run-query-btn").style.display = "block";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";

    sqlEditor.setValue("SELECT\n" +
        "    tc.task_base_name,\n" +
        "    er.pqem,\n" +
        "    er.pqem_stderr,\n" +
        "    CASE\n" +
        "        WHEN er.pqem_stderr > 0.2 THEN 'Peu fiable'\n" +
        "        WHEN er.pqem_stderr > 0.1 THEN 'Moyennement fiable'\n" +
        "        ELSE 'Fiable'\n" +
        "    END AS fiabilite\n" +
        "FROM evaluation_results er\n" +
        "JOIN task_configs tc ON er.task_id = tc.task_id;");

    sqlEditor.refresh();
});

document.querySelector(".query-areas").addEventListener("click", function(event){
    sqlResult.getWrapperElement().style.display = "none";
    document.querySelector(".run-query-btn").style.display = "block";
    btnClear.style.display = "none";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";

    sqlEditor.setValue("SELECT\n" +
        "    tc.task_base_name,\n" +
        "    er.pqem,\n" +
        "    er.pqem_stderr\n" +
        "FROM evaluation_results er\n" +
        "JOIN task_configs tc ON er.task_id = tc.task_id\n" +
        "WHERE  er.run_id = 1 \n" +
        "ORDER BY er.pqem DESC\n" +
        "LIMIT 5;");

    sqlEditor.refresh();
});

document.querySelector(".query-average").addEventListener("click", function(event){
    sqlResult.getWrapperElement().style.display = "none";
    document.querySelector(".run-query-btn").style.display = "block";
    btnClear.style.display = "none";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";

    sqlEditor.setValue("SELECT \n" +
        "    run_id,\n" +
        "    CORR(pem, pqem) as corr_pem_pqem,\n" +
        "FROM evaluation_results\n" +
        "GROUP BY run_id;");

    sqlEditor.refresh();
});

document.querySelector(".query-trends").addEventListener("click", function(event){
    sqlResult.getWrapperElement().style.display = "none";
    document.querySelector(".run-query-btn").style.display = "block";
    btnClear.style.display = "none";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";

    sqlEditor.setValue("SELECT\n" +
        "    REGEXP_EXTRACT(tc.task_base_name, 'mmlu:(.*)_') AS categorie,\n" +
        "    AVG(er.pqem) as score_moyen,\n" +
        "    COUNT(*) as nombre_taches\n" +
        "FROM evaluation_results er\n" +
        "JOIN task_configs tc ON er.task_id = tc.task_id\n" +
        "GROUP BY categorie\n" +
        "ORDER BY score_moyen DESC;");

    sqlEditor.refresh();
});

document.querySelector(".query-time").addEventListener("click", function(event){
    sqlResult.getWrapperElement().style.display = "none";
    document.querySelector(".run-query-btn").style.display = "block";
    btnClear.style.display = "none";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";

    sqlEditor.setValue("SELECT \n" +
        "    er.run_id,\n" +
        "    e.model_name,\n" +
        "    e.total_evaluation_time,\n" +
        "    er.pqem " +
        "FROM aggregated_evaluation_results er \n" +
        "JOIN evaluation_runs e ON er.run_id = e.run_id\n" +
        "WHERE er.result_type = 'all' \n" +
        "ORDER BY e.total_evaluation_time DESC;");

    sqlEditor.refresh();
});