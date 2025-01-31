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

        // Save sequence current values
        /*const sequences = [
            'run_id_sequence',
            'metric_id_sequence',
            'task_id_sequence',
            'general_id_sequence'
        ];*/

        // Get and save each sequence value
        /*for (const seqName of sequences) {
            const seqValue = await conn.query(`
                SELECT last_value FROM ${seqName};
            `);
            const currentValue = seqValue.toArray()[0].last_value;
            localStorage.setItem(`duckdb_${seqName}`, currentValue.toString());
        }*/

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
        // Restore sequence values first
        /*const sequences = [
            'run_id_sequence',
            'metric_id_sequence',
            'task_id_sequence',
            'general_id_sequence'
        ];

        for (const seqName of sequences) {
            const savedValue = localStorage.getItem(`duckdb_${seqName}`);
            if (savedValue) {
                // Reset sequence to saved value
                await conn.query(`
                    DROP SEQUENCE IF EXISTS ${seqName};
                    CREATE SEQUENCE ${seqName} START ${parseInt(savedValue) + 1};
                `);
            }
        }*/

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

        if(countEvalRuns !== 0 || countTaskMetrics === 0 || countTaskConfig === 0 || countTaskSummary === 0
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
        const data = await conn.query(`SELECT * FROM ${tableName} LIMIT 5;`);
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

        // Récupérer le port depuis l'URL actuelle
        const currentUrl = new URL(window.location.href);
        const PORT = currentUrl.port || '80'; // Port par défaut si non spécifié
        const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}${PORT ? ':' + PORT : ''}`;

        // Création des tables temporaires avec une structure plus plate
        await conn.query(`
            CREATE OR REPLACE TABLE temp_json_data AS
            SELECT * FROM read_json_auto('${baseUrl}/results1.json');
        `);

        await conn.query(`
            CREATE OR REPLACE TABLE temp_json_data2 AS
            SELECT * FROM read_json_auto('${baseUrl}/results2.json');
        `);

        const filePath = `${baseUrl}/results1.json`;
        const filePath2 = `${baseUrl}/results2.json`;

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

let sqlResultCrud = CodeMirror.fromTextArea(document.getElementById("sqlResultCrud"), {
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
sqlResultCrud.setSize("100%", "250px"); // Largeur et hauteur fixes


sqlResult.getWrapperElement().style.display = "none";
sqlResultCrud.getWrapperElement().style.display = "none";


let sqlQuery;

let runQueryBtnConsole = document.querySelector('#run-query-console');


sqlEditor.on('change', function(cm, changeObj) {
    // Check if there's any content
    if (sqlEditor.getValue().trim() !== '') {
        runQueryBtnConsole.style.color = 'black';
        runQueryBtnConsole.style.borderColor = 'black';
        runQueryBtnConsole.style.backgroundColor = '#FFF100';
        runQueryBtnConsole.style.transform = 'scale(1.05)';  // Slight scale up
        runQueryBtnConsole.style.transition = 'all 0.3s ease';
    } else {
        runQueryBtnConsole.style.color = 'white';
        runQueryBtnConsole.style.borderColor = 'white';
        runQueryBtnConsole.style.backgroundColor = '';  // Reset to default
        runQueryBtnConsole.style.transform = 'scale(1)';
    }
});

let btnClearMain = document.querySelector("#clear-btn-main");
let msgError = document.querySelector(".msg-error");
btnClearMain.style.display = "none";
msgError.style.display = "none";

document.getElementById('sqlButton').addEventListener("click", function (event) {
    // Force read-only to false using multiple methods
    sqlEditor.setOption('readOnly', false);

    // Optional: Add visual indication of read-only state
    const editorWrapper = sqlEditor.getWrapperElement();
    editorWrapper.style.pointerEvents = 'auto';

    usedQuery = false;
    sqlResult.setSize("100%", "350px");

    btnClearMain.style.display = "none";
    msgError.style.display = "none";
    runQueryBtnConsole.style.display = "block";
    sqlResult.getWrapperElement().style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";
});

runQueryBtnConsole.addEventListener("click", function (event) {

    const button = event.target;
    button.style.display = "none";

    console.log(usedQuery);

    if(usedQuery === false){
        btnClearMain.style.display = "block";
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

btnClearMain.addEventListener("click", function(){
    runQueryBtnConsole.style.display = "block";

    sqlResult.getWrapperElement().style.display = "none";
    btnClearMain.style.display = "none";
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
    runQueryBtnConsole.style.display = "none";

    document.querySelectorAll('.query-item').forEach(item => {
        item.setAttribute('data-selected', 'false');
        item.classList.remove('active');
    });

    sqlResult.getWrapperElement().style.display = "none";
    btnClearMain.style.display = "none";
    msgError.style.display = "none";

    sqlResult.setValue("");
    sqlEditor.setValue("");
    msgError.textContent = "";

});

document.querySelector(".query-stat").addEventListener("click", function(event){
    console.log(usedQuery)

    sqlResult.getWrapperElement().style.display = "none";
    runQueryBtnConsole.style.display = "block";
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
    runQueryBtnConsole.style.display = "block";
    btnClearMain.style.display = "none";
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
    runQueryBtnConsole.style.display = "block";
    btnClearMain.style.display = "none";
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
    runQueryBtnConsole.style.display = "block";
    btnClearMain.style.display = "none";
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
    runQueryBtnConsole.style.display = "block";
    btnClearMain.style.display = "none";
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
        msgInfo.style.display = 'none';
        step.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const displayButtons = document.querySelectorAll('.read-simple-display-btn');

    if (displayButtons.length > 0) {
        displayButtons.forEach(button => {
            button.addEventListener('click', function() {
                displayButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
            });
        });
    }
});

const crudContenant = document.querySelector('.crud-contenant');
const createContenant = document.querySelector('.create-contenant');
const readContenant = document.querySelector('.read-contenant');
const updateContenant = document.querySelector('.update-contenant');
const deleteContenant = document.querySelector('.delete-contenant');
let clearBtnCrud = document.querySelector("#clear-btn-crud");
let msgInfo = document.querySelector(".msg-info");

clearBtnCrud.style.display = "none";

clearBtnCrud.addEventListener("click", function(){
    msgInfo.style.display = "none";
    msgInfo.textContent = "";
    clearBtnCrud.style.display = "none";
    jsonDisplayContainer.style.display = "none"
    jsonDisplayContainer.textContent = "";

    const tdChildren = document.querySelectorAll("#container-crud > *");

    tdChildren.forEach(child => {
        child.style.display = "none";
    });

    const thChildren = document.querySelectorAll("#query > *");

    thChildren.forEach(child => {
        child.style.display = "none";
    });

    const crudButtons = document.querySelectorAll('.crud-btn');

    crudButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('tmp');
    });

    const createButtons = document.querySelectorAll('.create-btn');

    createButtons.forEach(btn => {
        btn.classList.remove('tmp');
        btn.classList.remove('selected');
    });

    const readSimpleButtons = document.querySelectorAll('.read-simple-display-btn');

    readSimpleButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    crudContenant.style.display = 'flex';
    createContenant.style.display = 'none';
    readContenant.style.display = 'none';
    updateContenant.style.display = 'none';
    deleteContenant.style.display = 'none';
    document.querySelector(".read-how-display-contenant").style.display = "none";

    sqlResultCrud.getWrapperElement().style.display = "none";
    sqlResultCrud.setValue("");

    document.querySelector(".update-choose-columns-contenant").style.display = "none";

})

const createBtn = document.getElementById('create-btn');
const readBtn = document.getElementById('read-btn');

// Ajouter un événement de clic pour le bouton Create
createBtn.addEventListener('click', function () {

    const crudButtons = document.querySelectorAll('.crud-btn');

    // Retirer la classe active de tous les boutons
    crudButtons.forEach(btn => {
        btn.classList.remove('tmp');
    });

    this.classList.add('tmp');

    crudContenant.style.display = 'none';
    createContenant.style.display = 'flex';
    showStep('create-step');
    hideStep('update-step');
    hideStep('delete-step');
});

// Ajouter un événement de clic pour le bouton Create
readBtn.addEventListener('click', function () {

    const crudButtons = document.querySelectorAll('.crud-btn');

    // Retirer la classe active de tous les boutons
    crudButtons.forEach(btn => {
        btn.classList.remove('tmp');
    });

    this.classList.add('tmp');
});

const jsonImportSection = document.getElementById('json-import-section');

let insertBTN = document.querySelector('#insert-btn');

insertBTN.addEventListener("click", function(){
    const createButton = document.querySelectorAll('.create-buttons');

    // Retirer la classe active de tous les boutons
    createButton.forEach(btn => {
        btn.classList.remove('tmp');
    });

    jsonImportSection.style.display = "none";

    // Ajouter la classe active au bouton Create
    this.classList.add('tmp');
});

let readSpecificDataBtn = document.querySelector('#specific-columns-btn');

readSpecificDataBtn.addEventListener("click", function(){
    const createButton = document.querySelectorAll('.create-buttons');

    // Retirer la classe active de tous les boutons
    createButton.forEach(btn => {
        btn.classList.remove('tmp');
    });

    sqlResultCrud.getWrapperElement().style.display = "none";
    clearBtnCrud.style.display = "none";

    // Ajouter la classe active au bouton Create
    this.classList.add('tmp');
});

const tableItems = document.querySelectorAll('.table-item');

tableItems.forEach(item => {
    item.addEventListener('click', function () {

        tableItems.forEach(i => i.classList.remove('active'));

        this.classList.add('active');
    });
});

let runQueryBtnCRUD = document.querySelector("#run-query-btn");

runQueryBtnCRUD.style.display = "none";

runQueryBtnCRUD.addEventListener("click", executeCRUD);

function executeCRUD(){

    console.log("jsp");

    if(createBtn.classList.contains('tmp'))
    {
        if(insertBTN.classList.contains('tmp'))
        {
            if(document.getElementById("table-evaluation-runs").classList.contains('active'))
            {
                insertDataEvaluationRuns();
            }
            if(document.getElementById("table-task-metrics").classList.contains('active'))
            {
                insertDataTaskMetrics();
            }
            if(document.getElementById("table-task-configs").classList.contains('active'))
            {
                insertDataTaskConfigs();
            }
            if(document.getElementById("table-general-summary").classList.contains('active'))
            {
                insertDataGeneralSummary();
            }
            if(document.getElementById("table-tasks-evaluation-results").classList.contains('active'))
            {
                insertDataEvaluationResults();
            }
            if(document.getElementById("table-tasks-summaries").classList.contains('active'))
            {
                insertDataTasksSummaries();
            }
            if(document.getElementById("table-aggregated-evaluation-results").classList.contains('active'))
            {
                insertDataAggregatedEvaluationResults();
            }
        }
    }

    if(readBtn.classList.contains("tmp")){
        console.log("ok");
        if(readSpecificDataBtn.classList.contains("tmp"))
        {

            const activeButton = document.querySelector('.read-simple-display-btn.active');

            if (activeButton) {
                const tableName = buttonTableMap[activeButton.id];
                readSpecificDataFromTable(tableName);
                runQueryBtnCRUD.style.display = "none";
            }
        }
    }
}

const buttonTableMap = {
    'evaluation-results-btn': 'evaluation_results',
    'evaluation-runs-btn': 'evaluation_runs',
    'task-configs-btn': 'task_configs',
    'task-metrics-btn': 'task_metrics',
    'task-summaries-btn': 'task_summaries',
    'general-summary-btn': 'general_summary'
};

async function insertDataEvaluationRuns() {

    const idResult = await conn.query('SELECT run_id FROM evaluation_runs ORDER BY run_id DESC LIMIT 1;');
    const id = await idResult.toArray();
    const run_id = id[0]?.run_id + 1;

    const model_name = document.querySelector("input[name='model_name']").value || null;
    const num_fewshot_seeds = document.querySelector("input[name='num_fewshot_seeds']").value || null;
    const override_batch_size = document.querySelector("input[name='override_batch_size']").value || null;
    const max_samples = document.querySelector("input[name='max_samples']").value || null;
    const job_id = document.querySelector("input[name='job_id']").value || null;
    const start_time = document.querySelector("input[name='start_time']").value || null;
    const end_time = document.querySelector("input[name='end_time']").value || null;
    const total_evaluation_time = document.querySelector("input[name='total_evaluation_time']").value || null;
    const model_sha = document.querySelector("input[name='model_sha']").value || null;
    const model_dtype = document.querySelector("input[name='model_dtype']").value || null;
    const model_size = document.querySelector("input[name='model_size']").value || null;
    const lighteval_sha = document.querySelector("input[name='lighteval_sha']").value || null;

    // Construire dynamiquement la requête
    const query = `
        INSERT INTO evaluation_runs (
            run_id, model_name, num_fewshot_seeds, override_batch_size,
            max_samples, job_id, start_time, end_time, total_evaluation_time, 
            model_sha, model_dtype, model_size, lighteval_sha
        ) VALUES (
            ${run_id ? `'${run_id}'` : "NULL"},
            ${model_name ? `'${model_name}'` : "NULL"},
            ${num_fewshot_seeds || "NULL"},
            ${override_batch_size || "NULL"},
            ${max_samples || "NULL"},
            ${job_id || "NULL"},
            ${start_time ? `'${start_time}'` : "NULL"},
            ${end_time ? `'${end_time}'` : "NULL"},
            ${total_evaluation_time || "NULL"},
            ${model_sha ? `'${model_sha}'` : "NULL"},
            ${model_dtype ? `'${model_dtype}'` : "NULL"},
            ${model_size || "NULL"},
            ${lighteval_sha ? `'${lighteval_sha}'` : "NULL"}
        );
    `;

    try {
        // Exécuter la requête
        await conn.query(query);

        msgInfo.style.display = "block";
        msgInfo.style.color = "#12b912";
        msgInfo.textContent = "The data has been successfully inserted!";

        console.log("Les données ont été insérées avec succès !");

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";

        await saveToLocalStorage(conn);
    } catch (error) {
        msgInfo.style.display = "block";
        msgInfo.style.color = "#af1111";
        msgInfo.textContent = "Error inserting data";

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";
    }
}

async function insertDataTaskConfigs() {
    const idResult = await conn.query('SELECT task_id FROM task_configs ORDER BY task_id DESC LIMIT 1;');
    const id = await idResult.toArray();
    const task_id = id[0]?.task_id + 1;

    const task_base_name = document.querySelector("input[name='task_base_name']").value || null;
    const prompt_function = document.querySelector("input[name='prompt_function']").value || null;
    const hf_repo = document.querySelector("input[name='hf_repo']").value || null;
    const hf_subset = document.querySelector("input[name='hf_subset']").value || null;
    const hf_revision = document.querySelector("input[name='hf_revision']").value || null;
    const hf_filter = document.querySelector("input[name='hf_filter']").value || null;
    const trust_dataset = document.querySelector("input[name='trust_dataset']").value || null;
    const few_shots_split = document.querySelector("input[name='few_shots_split']").value || null;
    const few_shots_select = document.querySelector("input[name='few_shots_select']").value || null;
    const generation_size = document.querySelector("input[name='generation_size']").value || null;
    const generation_grammar = document.querySelector("input[name='generation_grammar']").value || null;
    const output_regex = document.querySelector("input[name='output_regex']").value || null;
    const num_samples = document.querySelector("input[name='num_samples']").value || null;
    const original_num_docs = document.querySelector("input[name='original_num_docs']").value || null;
    const effective_num_docs = document.querySelector("input[name='effective_num_docs']").value || null;
    const must_remove_duplicate_docs = document.querySelector("input[name='must_remove_duplicate_docs']").value || null;
    const version = document.querySelector("input[name='version']").value || null;
    const frozen = document.querySelector("input[name='frozen']").value || null;


    const query = `
        INSERT INTO task_configs (
            task_id, task_base_name, prompt_function, hf_repo, hf_subset, hf_revision, hf_filter, few_shots_split, few_shots_select,
            trust_dataset, generation_size, generation_grammar, output_regex, num_samples,
            original_num_docs, effective_num_docs, must_remove_duplicate_docs,
            version, frozen
        ) VALUES (
                     ${task_id !== null && task_id !== undefined ? `'${task_id}'` : "NULL"},
                     ${task_base_name !== null && task_base_name !== undefined ? `'${task_base_name}'` : "NULL"},
                     ${prompt_function !== null && prompt_function !== undefined ? `'${prompt_function}'` : "NULL"},
                     ${hf_repo !== null && hf_repo !== undefined ? `'${hf_repo}'` : "NULL"},
                     ${hf_subset !== null && hf_subset !== undefined ? `'${hf_subset}'` : "NULL"},
                     ${hf_revision !== null && hf_revision !== undefined ? `'${hf_revision}'` : "NULL"},
                     ${hf_filter !== null && hf_filter !== undefined ? `'${hf_filter}'` : "NULL"},
                     ${few_shots_split !== null && few_shots_split !== undefined ? `'${few_shots_split}'` : "NULL"},
                     ${few_shots_select !== null && few_shots_select !== undefined ? `${few_shots_select}` : "NULL"},
                     ${trust_dataset !== null && trust_dataset !== undefined ? `'${trust_dataset}'` : "NULL"},
                     ${generation_size !== null && generation_size !== undefined ? `'${generation_size}'` : "NULL"},
                     ${generation_grammar !== null && generation_grammar !== undefined ? `${generation_grammar}` : "NULL"},
                     ${output_regex !== null && output_regex !== undefined ? `'${output_regex}'` : "NULL"},
                     ${num_samples !== null && num_samples !== undefined ? `${num_samples}` : "NULL"},
                     ${original_num_docs !== null && original_num_docs !== undefined ? `'${original_num_docs}'` : "NULL"},
                     ${effective_num_docs !== null && effective_num_docs !== undefined ? `'${effective_num_docs}'` : "NULL"},
                     ${must_remove_duplicate_docs !== null && must_remove_duplicate_docs !== undefined ? `'${must_remove_duplicate_docs}'` : "NULL"},
                     ${version !== null && version !== undefined ? `'${version}'` : "NULL"},
                     ${frozen !== null && frozen !== undefined ? `'${frozen}'` : "NULL"}
                 );
    `;

    try {
        // Exécuter la requête
        await conn.query(query);

        msgInfo.style.display = "block";
        msgInfo.style.color = "#12b912";
        msgInfo.textContent = "The data has been successfully inserted!";

        console.log("Les données ont été insérées avec succès !");

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";

        await saveToLocalStorage(conn);
    } catch (error) {
        msgInfo.style.display = "block";
        msgInfo.style.color = "#af1111";
        msgInfo.textContent = "Error inserting data";

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";
    }
}

async function insertDataTaskMetrics() {
    const idResult = await conn.query('SELECT metric_id FROM task_metrics ORDER BY metric_id DESC LIMIT 1;');
    const id = await idResult.toArray();
    const metric_id = id[0]?.metric_id + 1;

    const metric_name = document.querySelector("input[name='metric_name']").value || null;
    const higher_is_better = document.querySelector("input[name='higher_is_better']").value || null;
    const category = document.querySelector("input[name='category']").value || null;
    const use_case = document.querySelector("input[name='use_case']").value || null;
    const sample_level_fn = document.querySelector("input[name='sample_level_fn']").value || null;
    const corpus_level_fn = document.querySelector("input[name='corpus_level_fn']").value || null;

    // Construire dynamiquement la requête
    const query = `
        INSERT INTO task_metrics (
              metric_id, metric_name, higher_is_better, category, 
              use_case, sample_level_fn, corpus_level_fn
        )VALUES (
            ${metric_id ? `'${metric_id}'` : "NULL"},
            ${metric_name ? `'${metric_name}'` : "NULL"},
            ${higher_is_better || "NULL"},
            ${category || "NULL"},
            ${use_case || "NULL"},
            ${sample_level_fn || "NULL"},
            ${corpus_level_fn ? `'${corpus_level_fn}'` : "NULL"},
        );
    `;

    try {
        // Exécuter la requête
        await conn.query(query);

        msgInfo.style.display = "block";
        msgInfo.style.color = "#12b912";
        msgInfo.textContent = "The data has been successfully inserted!";

        console.log("Les données ont été insérées avec succès !");

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";

        await saveToLocalStorage(conn);
    } catch (error) {
        msgInfo.style.display = "block";
        msgInfo.style.color = "#af1111";
        msgInfo.textContent = "Error inserting data";

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";
    }
}

async function insertDataEvaluationResults() {
    const run_id = document.querySelector("input[name='run_id']").value || null;
    const task_id = document.querySelector("input[name='task_id']").value || null;
    const em = document.querySelector("input[name='em']").value || null;
    const em_stderr = document.querySelector("input[name='em_stderr']").value || null;
    const qem = document.querySelector("input[name='qem']").value || null;
    const qem_stderr = document.querySelector("input[name='qem_stderr']").value || null;
    const pem = document.querySelector("input[name='pem']").value || null;
    const pem_stderr = document.querySelector("input[name='pem_stderr']").value || null;
    const pqem = document.querySelector("input[name='pqem']").value || null;
    const pqem_stderr = document.querySelector("input[name='pqem_stderr']").value || null;

    // Construire dynamiquement la requête
    const query = `
        INSERT INTO evaluation_results (
            run_id, task_id, em, em_stderr, qem, 
            qem_stderr, pem, pem_stderr, pqem, pqem_stderr
        ) VALUES (
            ${run_id ? `'${run_id}'` : "NULL"},
            ${task_id ? `'${task_id}'` : "NULL"},
            ${em || "NULL"},
            ${em_stderr || "NULL"},
            ${qem || "NULL"},
            ${qem_stderr || "NULL"},
            ${pem ? `'${pem}'` : "NULL"},
            ${pem_stderr ? `'${pem_stderr}'` : "NULL"},
            ${pqem || "NULL"},
            ${pqem_stderr ? `'${pqem_stderr}'` : "NULL"},
        );
    `;

    try {
        // Exécuter la requête
        await conn.query(query);

        msgInfo.style.display = "block";
        msgInfo.style.color = "#12b912";
        msgInfo.textContent = "The data has been successfully inserted!";

        console.log("Les données ont été insérées avec succès !");

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";

        await saveToLocalStorage(conn);
    } catch (error) {
        msgInfo.style.display = "block";
        msgInfo.style.color = "#af1111";
        msgInfo.textContent = "Error inserting data";

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";
    }
}

async function insertDataAggregatedEvaluationResults() {
    const run_id = document.querySelector("input[name='run_id']").value || null;
    const result_type = document.querySelector("input[name='result_type']").value || null;
    const em = document.querySelector("input[name='em']").value || null;
    const em_stderr = document.querySelector("input[name='em_stderr']").value || null;
    const qem = document.querySelector("input[name='qem']").value || null;
    const qem_stderr = document.querySelector("input[name='qem_stderr']").value || null;
    const pem = document.querySelector("input[name='pem']").value || null;
    const pem_stderr = document.querySelector("input[name='pem_stderr']").value || null;
    const pqem = document.querySelector("input[name='pqem']").value || null;
    const pqem_stderr = document.querySelector("input[name='pqem_stderr']").value || null;

    // Construire dynamiquement la requête
    const query = `
        INSERT INTO aggregated_evaluation_results (
            run_id, result_type, em, em_stderr, qem, 
            qem_stderr, pem, pem_stderr, pqem, pqem_stderr
        ) VALUES (
            ${run_id ? `'${run_id}'` : "NULL"},
            ${result_type ? `'${result_type}'` : "NULL"},
            ${em || "NULL"},
            ${em_stderr || "NULL"},
            ${qem || "NULL"},
            ${qem_stderr || "NULL"},
            ${pem ? `'${pem}'` : "NULL"},
            ${pem_stderr ? `'${pem_stderr}'` : "NULL"},
            ${pqem || "NULL"},
            ${pqem_stderr ? `'${pqem_stderr}'` : "NULL"},
        );
    `;

    try {
        // Exécuter la requête
        await conn.query(query);

        msgInfo.style.display = "block";
        msgInfo.style.color = "#12b912";
        msgInfo.textContent = "The data has been successfully inserted!";

        console.log("Les données ont été insérées avec succès !");

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";

        await saveToLocalStorage(conn);
    } catch (error) {
        msgInfo.style.display = "block";
        msgInfo.style.color = "#af1111";
        msgInfo.textContent = "Error inserting data";

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";
    }
}

async function insertDataTasksSummaries() {
    const run_id = document.querySelector("input[name='run_id']").value || null;
    const task_id = document.querySelector("input[name='task_id']").value || null;
    const truncated = document.querySelector("input[name='truncated']").value || null;
    const non_truncated = document.querySelector("input[name='non_truncated']").value || null;
    const padded = document.querySelector("input[name='padded']").value || null;
    const non_padded = document.querySelector("input[name='non_padded']").value || null;
    const effective_few_shots = document.querySelector("input[name='effective_few_shots']").value || null;
    const num_truncated_few_shots = document.querySelector("input[name='num_truncated_few_shots']").value || null;

    // Construire dynamiquement la requête
    const query = `
        INSERT INTO task_summaries (
            run_id, task_id, truncated, non_truncated, padded,
            non_padded, effective_few_shots, num_truncated_few_shots
        ) VALUES (
            ${run_id ? `'${run_id}'` : "NULL"},
            ${task_id ? `'${task_id}'` : "NULL"},
            ${truncated || "NULL"},
            ${non_truncated || "NULL"},
            ${padded || "NULL"},
            ${non_padded || "NULL"},
            ${effective_few_shots ? `'${effective_few_shots}'` : "NULL"},
            ${num_truncated_few_shots ? `'${num_truncated_few_shots}'` : "NULL"},
        
        );
    `;

    try {
        // Exécuter la requête
        await conn.query(query);

        msgInfo.style.display = "block";
        msgInfo.style.color = "#12b912";
        msgInfo.textContent = "The data has been successfully inserted!";

        console.log("Les données ont été insérées avec succès !");

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";

        await saveToLocalStorage(conn);
    } catch (error) {
        msgInfo.style.display = "block";
        msgInfo.style.color = "#af1111";
        msgInfo.textContent = "Error inserting data";

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";
    }
}

async function insertDataGeneralSummary() {
    const idResult = await conn.query('SELECT run_id FROM general_summary ORDER BY run_id DESC LIMIT 1;');
    const id = await idResult.toArray();
    const run_id = id[0]?.run_id + 1;

    const truncated = document.querySelector("input[name='truncated']").value || null;
    const non_truncated = document.querySelector("input[name='non_truncated']").value || null;
    const padded = document.querySelector("input[name='padded']").value || null;
    const non_padded = document.querySelector("input[name='non_padded']").value || null;
    const num_truncated_few_shots = document.querySelector("input[name='num_truncated_few_shots']").value || null;

    // Construire dynamiquement la requête
    const query = `
        INSERT INTO general_summary (
            run_id, truncated, non_truncated, padded,
            non_padded, num_truncated_few_shots
        ) VALUES (
            ${run_id ? `'${run_id}'` : "NULL"},
            ${truncated || "NULL"},
            ${non_truncated || "NULL"},
            ${padded || "NULL"},
            ${non_padded || "NULL"},
            ${num_truncated_few_shots ? `'${num_truncated_few_shots}'` : "NULL"},
        );
    `;

    try {
        // Exécuter la requête
        await conn.query(query);

        msgInfo.style.display = "block";
        msgInfo.style.color = "#12b912";
        msgInfo.textContent = "The data has been successfully inserted!";

        console.log("Les données ont été insérées avec succès !");

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";

        await saveToLocalStorage(conn);
    } catch (error) {
        msgInfo.style.display = "block";
        msgInfo.style.color = "#af1111";
        msgInfo.textContent = "Error inserting data";

        document.querySelector("#run-query-btn").style.display = "none";
        clearBtnCrud.style.display = "block";
    }
}

const columnsContainer = document.getElementById("columns-container");

document.querySelector("#read-all-data-btn").addEventListener("click", function() {
    // Créer un map des IDs de boutons et leurs noms de table correspondants
    const buttonTableMap = {
        'evaluation-results-btn': 'evaluation_results',
        'aggregated_evaluation-results-btn': 'aggregated_evaluation_results',
        'evaluation-runs-btn': 'evaluation_runs',
        'task-configs-btn': 'task_configs',
        'task-metrics-btn': 'task_metrics',
        'task-summaries-btn': 'task_summaries',
        'general-summary-btn': 'general_summary'
    };

    columnsContainer.style.display ="none";
    runQueryBtnCRUD.style.display ="none";


    // Trouver le bouton actif
    const activeButton = document.querySelector('.read-simple-display-btn.active');

    if (activeButton && buttonTableMap[activeButton.id]) {
        readAllFromTable(buttonTableMap[activeButton.id]);

        const clearButton = document.querySelector('#clear-btn-crud');
        if (clearButton) {
            clearButton.style.display = "block";
        }
    }
});

async function readAllFromTable(tableName) {
    try {
        const result = await conn.query(`select * from ${tableName};`);

        if (sqlResultCrud) {
            sqlResultCrud.setValue(result.toString());
            sqlResultCrud.getWrapperElement().style.display = "block";
            sqlResultCrud.refresh();
        }
    } catch(error) {
        const msgInfo = document.querySelector('.msg-info');
        if (msgInfo) {
            msgInfo.style.color = "#af1111";
            msgInfo.style.display = "block";
            msgInfo.textContent = "Syntax error, please check your query!";
        }
    }
}

document.querySelector("#specific-columns-btn").addEventListener("click", function()
{
    runQueryBtnCRUD.style.display = "block";

});

async function readSpecificDataFromTable(tableName) {
    // Récupérer toutes les checkboxes
    const checkboxes = document.querySelectorAll('.column-item input[type="checkbox"]');

    // Tableau pour stocker les colonnes sélectionnées
    const selectedColumns = [];

    // Vérifier chaque checkbox
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedColumns.push(checkbox.value);
        }
    });

    // Vérifier si des colonnes ont été sélectionnées
    if (selectedColumns.length > 0) {
        try {
            const columnsString = selectedColumns.join(', ');

            // Construire et exécuter la requête
            const query = `SELECT ${columnsString} FROM ${tableName};`;
            const result = await conn.query(query);

            // Afficher le résultat
            sqlResultCrud.setValue(result.toString());
            sqlResultCrud.getWrapperElement().style.display = "block";
            sqlResultCrud.refresh();

            // Afficher le bouton clear
            clearBtnCrud.style.display = "block";

        } catch(error) {
            clearBtnCrud.style.display = "block";
            // Gestion des erreurs
            msgInfo.style.color = "#af1111";
            msgInfo.style.display = "block";
            msgInfo.textContent = "Syntax error, please check your query!";
        }
    } else {
        clearBtnCrud.style.display = "block";
        // Message si aucune colonne n'est sélectionnée
        msgInfo.style.color = "#af1111";
        msgInfo.style.display = "block";
        msgInfo.textContent = "Please select at least one column!";
    }
}

// Gestionnaire d'événements pour l'interface utilisateur
const processJsonBtn = document.getElementById('process-json-btn');
const jsonFileInput = document.getElementById('json-file-input');
const jsonDisplayContainer = document.getElementById('json-display-container');
jsonDisplayContainer.style.display = "none"

processJsonBtn.addEventListener('click', () => {
    const file = jsonFileInput.files[0];

    if (!file) {
        alert('Please select a JSON file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const jsonContent = JSON.parse(event.target.result);
            jsonDisplayContainer.style.display = "block"
            jsonDisplayContainer.textContent = JSON.stringify(jsonContent, null, 4);

            console.log("Fichier JSON chargé :", jsonContent);

            msgInfo.style.display = "block";
            clearBtnCrud.style.display = "block";

            await insertDataFromJsonFile(jsonContent);
        } catch (error) {
            alert('Invalid JSON file.');
            console.error(error);
        }
    };
    reader.readAsText(file);
});

async function insertDataFromJsonFile(jsonData) {
    try {
        // Convert JSON data into array format if it isn't already
        const jsonArray = Array.isArray(jsonData) ? jsonData : [jsonData];

        // Create a buffer from the JSON data
        const jsonBuffer = new TextEncoder().encode(JSON.stringify(jsonArray));

        // Register the buffer as a virtual file in DuckDB
        await db.registerFileBuffer('data.json', jsonBuffer);

        // Create a table from the JSON data using DuckDB's auto schema detection
        await conn.query(`
            CREATE OR REPLACE TABLE temp_data AS 
            SELECT * FROM read_json_auto('data.json');
        `);

        console.log("Data successfully loaded into DuckDB!");

        // Verify the data was loaded correctly
        const result = await conn.query("SELECT * FROM temp_data;");
        const data = await result.toArray();
        console.log(data.toString());

        // Get the highest run_id
        const idResult = await conn.query('SELECT run_id FROM evaluation_runs ORDER BY run_id DESC LIMIT 1;');
        const id = await idResult.toArray();
        console.log(id.toString());

        const highestRunId = id[0]?.run_id + 1;
        console.log("Highest run_id: ", highestRunId);

        // Insertion d'evaluation runs
        await conn.query(`
            INSERT INTO evaluation_runs (
                run_id, model_name, num_fewshot_seeds, override_batch_size, 
                max_samples, job_id, start_time, end_time, 
                total_evaluation_time, model_sha, model_dtype, 
                model_size, lighteval_sha
            )
            SELECT 
                ${highestRunId},
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
            FROM temp_data
        `);

        const result1 = await conn.query("SELECT * FROM evaluation_runs;");
        const data1 = await result1.toArray();
        console.log(data1.toString());

        await conn.query(`
            INSERT INTO general_summary (
                run_id, truncated, non_truncated, padded,
                non_padded, num_truncated_few_shots
            )
            SELECT
                ${highestRunId},
                summary_general.truncated,
                summary_general.non_truncated,
                summary_general.padded,
                summary_general.non_padded,
                summary_general.num_truncated_few_shots
            FROM temp_data;
        `);

        const result2 = await conn.query(`SELECT * FROM general_summary WHERE run_id = ${highestRunId};`);
        const data2 = await result2.toArray();
        console.log(data2.toString());

        taskSummary = jsonData.summary_tasks;
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

        for (const task of taskSummary_allArray) {
            await conn.query(`
                 INSERT INTO task_summaries (run_id, task_id, truncated, non_truncated, 
                                          padded ,non_padded ,effective_few_shots ,
                                          num_truncated_few_shots)
                VALUES (${highestRunId}, (SELECT t.task_id FROM task_configs as t WHERE '${task.key}' LIKE '%' || t.task_base_name || '%'),
                    ${task.truncated}, ${task.non_truncated},
                    ${task.padded},${task.non_padded},
                    ${task.effective_few_shots},${task.num_truncated_few_shots});
            `);
        }

        const result3 = await conn.query(`SELECT * FROM task_summaries WHERE run_id = ${highestRunId} LIMIT 5;`);
        const data3 = await result3.toArray();
        console.log(data3.toString());

        results = jsonData.results;
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

        for (const result of resultArray) {
            await conn.query(`
                INSERT INTO evaluation_results (run_id, task_id, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (${highestRunId},
                       (SELECT task_id FROM task_configs WHERE '${result.key}' LIKE '%' || task_base_name || '%'),
                       ${result.em}, ${result.em_stderr},
                       ${result.qem}, ${result.qem_stderr},
                       ${result.pem}, ${result.pem_stderr},
                       ${result.pqem}, ${result.pqem_stderr});
            `);
        }

        const result4 = await conn.query(`SELECT * FROM evaluation_results WHERE run_id = ${highestRunId} LIMIT 5;`);
        const data4 = await result4.toArray();
        console.log(data4.toString());

        average_all = jsonData.results;
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

        for (const result of average_allArray) {

            const resultType = result.key === "all" ? "all" : "average";

            await conn.query(`
                INSERT INTO aggregated_evaluation_results (run_id, result_type, em, em_stderr, qem, qem_stderr, pem, pem_stderr, pqem, pqem_stderr)
                VALUES (${highestRunId}, '${resultType}',
                       ${result.em}, ${result.em_stderr},
                       ${result.qem}, ${result.qem_stderr},
                       ${result.pem}, ${result.pem_stderr},
                       ${result.pqem}, ${result.pqem_stderr});
            `);
        }

        const result5 = await conn.query(`SELECT * FROM aggregated_evaluation_results WHERE run_id = ${highestRunId} LIMIT 5;`);
        const data5 = await result5.toArray();
        console.log(data5.toString());

        msgInfo.textContent = "Your JSON was succesful load ! ";
        msgInfo.style.color = "#12b912";

        await saveToLocalStorage(conn);

    } catch (error) {
        msgInfo.textContent = "Error loading data into DuckDB";
        msgInfo.style.color = "#af1111";
    }
}

const buttons = document.querySelectorAll('.update-simple-display-btn');

buttons.forEach(button => {
    button.addEventListener('click', function() {

        buttons.forEach(btn => btn.classList.remove('tmp'));

        this.classList.add('tmp');
    });
});

document.querySelector("#validate-btn").addEventListener("click", function(){
    const buttonTableMap = {
        'update-evaluation-results-btn': 'evaluation_results',
        'update-evaluation-runs-btn': 'evaluation_runs',
        'update-task-configs-btn': 'task_configs',
        'update-task-metrics-btn': 'task_metrics',
        'update-task-summaries-btn': 'task_summaries',
        'update-general-summary-btn': 'general_summary'
    };

    for (const [btnId, tableName] of Object.entries(buttonTableMap)) {
        if (document.getElementById(btnId).classList.contains('tmp')) {
            console.log("coucou je suis la encore hehe");
            updateTableData(tableName);
            break;
        }
    }
});

async function updateTableData(tableName) {
    const fieldsContainer = document.getElementById("fields-container");
    const checkboxes = fieldsContainer.querySelectorAll('.field-checkbox');
    const whereField = document.getElementById("where-field");
    const whereValue = document.getElementById("where-value");

    let updateFields = [];
    let updateValues = [];

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const label = checkbox.nextElementSibling.textContent;
            const value = checkbox.nextElementSibling.nextElementSibling.value;

            if (value) {
                updateFields.push(label);
                updateValues.push(value);
            }
        }
    });

    if (updateFields.length === 0) {
        const msgInfo = document.querySelector('.msg-info');
        if (msgInfo) {
            msgInfo.style.color = "#af1111";
            msgInfo.style.display = "block";
            msgInfo.textContent = "Please select at least one field to update!";
        }
        return;
    }

    try {
        const setClause = updateFields.map((field, index) =>
            `${field} = '${updateValues[index]}'`
        ).join(', ');

        // Construire la clause WHERE si une valeur est spécifiée
        let whereClause = '';
        if (whereValue.value.trim() !== '') {
            whereClause = ` WHERE ${whereField.value} = '${whereValue.value}'`;
        }

        const query = `UPDATE ${tableName} SET ${setClause}${whereClause};`;
        console.log("Query:", query); // Pour débugger

        await conn.query(query);

        const msgInfo = document.querySelector('.msg-info');
        if (msgInfo) {
            msgInfo.style.color = "#28a745";
            msgInfo.style.display = "block";
            msgInfo.textContent = "Update successful!";
        }


    } catch(error) {
        const msgInfo = document.querySelector('.msg-info');
        if (msgInfo) {
            msgInfo.style.color = "#af1111";
            msgInfo.style.display = "block";
            msgInfo.textContent = "Error during update: " + error.message;
        }
    }
}







