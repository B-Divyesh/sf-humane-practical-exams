use std::{
    collections::HashMap,
    env,
    net::{IpAddr, SocketAddr},
    path::PathBuf,
    sync::Arc,
    time::{Duration, Instant},
};

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use axum::{
    body::Body,
    extract::{ConnectInfo, DefaultBodyLimit, Multipart, Path, Query, State},
    http::{header, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use chrono::{Duration as ChronoDuration, Utc};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{sqlite::SqlitePoolOptions, Row, SqlitePool};
use thiserror::Error;
use tower_http::{
    catch_panic::CatchPanicLayer,
    compression::CompressionLayer,
    limit::RequestBodyLimitLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::{info, warn};
use uuid::Uuid;

static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("./migrations");

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    cipher: Aes256Gcm,
    rate_windows: Arc<tokio::sync::Mutex<HashMap<IpAddr, (Instant, u32)>>>,
}

#[derive(Debug, Error)]
enum AppError {
    #[error("{0}")]
    BadRequest(String),
    #[error("This capability link is not valid for that action.")]
    Forbidden,
    #[error("That record was not found or has already been deleted.")]
    NotFound,
    #[error("The service could not complete the request.")]
    Internal,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        };
        (status, Json(json!({ "error": self.to_string() }))).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(error: sqlx::Error) -> Self {
        tracing::error!(%error, "database request failed");
        Self::Internal
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct RubricCriterion {
    id: String,
    label: String,
    description: String,
    max_score: i64,
}
#[derive(Debug, Deserialize)]
struct CriterionInput {
    label: String,
    #[serde(default)]
    description: String,
    max_score: i64,
}
#[derive(Debug, Deserialize)]
struct CreateExam {
    title: String,
    brief: String,
    duration_minutes: i64,
    deletion_days: i64,
    #[serde(default)]
    accommodations: String,
    #[serde(default)]
    provider_name: String,
    criteria: Vec<CriterionInput>,
}
#[derive(Debug, Serialize)]
struct ExamView {
    role: &'static str,
    exam: Exam,
}
#[derive(Debug, Serialize)]
struct Exam {
    id: String,
    title: String,
    brief: String,
    duration_minutes: i64,
    deletion_days: i64,
    accommodations: String,
    provider_name: Option<String>,
    rubric: Vec<RubricCriterion>,
    created_at: String,
}
#[derive(Debug, Deserialize)]
struct TokenBody {
    token: String,
}
#[derive(Debug, Deserialize)]
struct StartBody {
    token: String,
    alias: String,
}
#[derive(Debug, Deserialize)]
struct EvidenceBody {
    token: String,
    work_log: String,
    command_history: String,
}
#[derive(Debug, Deserialize)]
struct CheckpointBody {
    token: String,
    label: String,
    content: String,
}
#[derive(Debug, Deserialize)]
struct AssessBody {
    token: String,
    scores: HashMap<String, i64>,
    notes: String,
    outcome: String,
}
#[derive(Debug, Deserialize)]
struct TokenQuery {
    token: String,
}
#[derive(Debug, Clone, Serialize)]
struct Checkpoint {
    id: String,
    label: String,
    hash: String,
    created_at: String,
}
#[derive(Debug, Serialize)]
struct Assessment {
    scores: HashMap<String, i64>,
    notes: String,
    outcome: String,
    assessed_at: String,
}
#[derive(Debug, Serialize)]
struct Submission {
    id: String,
    alias: String,
    status: String,
    started_at: String,
    submitted_at: Option<String>,
    delete_at: String,
    artifact_name: Option<String>,
    artifact_size: Option<i64>,
    checkpoint_count: usize,
    work_log: String,
    command_history: String,
    checkpoints: Vec<Checkpoint>,
    assessment: Option<Assessment>,
    outcome: Option<String>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("humane_practical_exams=info".parse().unwrap()),
        )
        .init();
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://data/humane-exams.db?mode=rwc".into());
    if database_url.starts_with("sqlite://data/") {
        std::fs::create_dir_all("data").expect("create data directory");
    }
    let db = SqlitePoolOptions::new()
        .max_connections(8)
        .connect(&database_url)
        .await
        .expect("connect database");
    MIGRATOR.run(&db).await.expect("run database migrations");
    let secret = match env::var("SUBMISSION_ENCRYPTION_KEY") {
        Ok(value) if value.len() >= 32 => value,
        _ if env::var("APP_ENV").as_deref() == Ok("production") => {
            panic!("SUBMISSION_ENCRYPTION_KEY must contain at least 32 characters in production")
        }
        _ => {
            warn!("SUBMISSION_ENCRYPTION_KEY is unset or short; using an insecure development key");
            "development-only-key-change-before-deploy".into()
        }
    };
    let key: [u8; 32] = Sha256::digest(secret.as_bytes()).into();
    let state = AppState {
        db,
        cipher: Aes256Gcm::new(&key.into()),
        rate_windows: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
    };
    spawn_cleanup(state.clone());

    let dist = PathBuf::from(env::var("STATIC_DIR").unwrap_or_else(|_| "dist".into()));
    let fallback = ServeFile::new(dist.join("index.html"));
    let middleware_state = state.clone();
    let app = build_app(state)
        .fallback_service(ServeDir::new(dist).fallback(fallback))
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new(16 * 1024 * 1024))
        .layer(CompressionLayer::new())
        .layer(middleware::from_fn_with_state(
            middleware_state,
            security_headers,
        ))
        .layer(CatchPanicLayer::new())
        .layer(TraceLayer::new_for_http());
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8080);
    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .expect("bind port");
    info!(port, "service listening");
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .expect("serve requests");
}

fn build_app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/exams", post(create_exam))
        .route("/api/exams/:id", get(view_exam))
        .route("/api/exams/:id/start", post(start_submission))
        .route("/api/exams/:id/submissions", get(list_submissions))
        .route("/api/submissions/:id", get(get_submission))
        .route("/api/submissions/:id/evidence", post(save_evidence))
        .route("/api/submissions/:id/checkpoints", post(add_checkpoint))
        .route(
            "/api/submissions/:id/artifact",
            post(upload_artifact).get(download_artifact),
        )
        .route("/api/submissions/:id/submit", post(submit_submission))
        .route("/api/submissions/:id/assessment", post(save_assessment))
        .route("/api/submissions/:id/export", get(export_submission))
        .route("/api/submissions/:id/delete", post(delete_submission))
        .with_state(state)
}

async fn security_headers(
    State(state): State<AppState>,
    request: Request<Body>,
    next: Next,
) -> Response {
    let ip = request
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|value| value.0.ip())
        .unwrap_or(IpAddr::from([0, 0, 0, 0]));
    let mut windows = state.rate_windows.lock().await;
    let entry = windows.entry(ip).or_insert((Instant::now(), 0));
    if entry.0.elapsed() >= Duration::from_secs(60) {
        *entry = (Instant::now(), 0);
    }
    if entry.1 >= 300 {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(json!({ "error": "Too many requests. Wait a moment and try again." })),
        )
            .into_response();
    }
    entry.1 += 1;
    drop(windows);
    let path = request.uri().path().to_owned();
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("no-referrer"),
    );
    headers.insert(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static("default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.sociobot.in; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self' https://api.sociobot.in"));
    headers.insert(
        header::HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("camera=(), microphone=(), geolocation=(), browsing-topics=()"),
    );
    if path.starts_with("/assets/") {
        headers.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        );
    } else if !path.starts_with("/api/") && path != "/health" {
        headers.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static("public, max-age=300"),
        );
    }
    response
}

async fn health() -> Json<Value> {
    Json(json!({ "status": "ok", "build": option_env!("BUILD_SHA").unwrap_or("development") }))
}

async fn create_exam(
    State(state): State<AppState>,
    Json(input): Json<CreateExam>,
) -> Result<Json<Value>, AppError> {
    let title = clean(&input.title, 120, "Exam title")?;
    let brief = clean(&input.brief, 12_000, "Task brief")?;
    if brief.chars().count() < 40 {
        return Err(AppError::BadRequest(
            "Task brief must be at least 40 characters.".into(),
        ));
    }
    if !(10..=1440).contains(&input.duration_minutes) {
        return Err(AppError::BadRequest(
            "Working time must be between 10 and 1,440 minutes.".into(),
        ));
    }
    if !(1..=365).contains(&input.deletion_days) {
        return Err(AppError::BadRequest(
            "Deletion period must be between 1 and 365 days.".into(),
        ));
    }
    if input.criteria.is_empty() || input.criteria.len() > 20 {
        return Err(AppError::BadRequest(
            "Add between 1 and 20 rubric criteria.".into(),
        ));
    }
    let rubric: Vec<RubricCriterion> = input
        .criteria
        .into_iter()
        .map(|item| {
            if item.label.trim().is_empty() || !(1..=20).contains(&item.max_score) {
                return Err(AppError::BadRequest(
                    "Each rubric criterion needs a name and a maximum score from 1 to 20.".into(),
                ));
            }
            Ok(RubricCriterion {
                id: Uuid::new_v4().to_string(),
                label: item.label.trim().chars().take(100).collect(),
                description: item.description.trim().chars().take(500).collect(),
                max_score: item.max_score,
            })
        })
        .collect::<Result<_, _>>()?;
    let id = Uuid::new_v4().to_string();
    let candidate_token = random_token();
    let assessor_token = random_token();
    let now = Utc::now().to_rfc3339();
    let accommodations: String = input.accommodations.trim().chars().take(2000).collect();
    let provider = optional_clean(&input.provider_name, 100);
    sqlx::query("INSERT INTO exams (id,title,brief,duration_minutes,deletion_days,accommodations,provider_name,rubric_json,candidate_token_hash,assessor_token_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        .bind(&id).bind(title).bind(brief).bind(input.duration_minutes).bind(input.deletion_days).bind(accommodations).bind(provider)
        .bind(serde_json::to_string(&rubric).map_err(|_| AppError::Internal)?).bind(token_hash(&candidate_token)).bind(token_hash(&assessor_token)).bind(now).execute(&state.db).await?;
    Ok(Json(
        json!({ "exam_id": id, "candidate_token": candidate_token, "assessor_token": assessor_token }),
    ))
}

async fn view_exam(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<TokenQuery>,
) -> Result<Json<ExamView>, AppError> {
    let (exam, candidate_hash, assessor_hash) = load_exam(&state.db, &id).await?;
    let supplied = token_hash(&query.token);
    let role = if constant_eq(&supplied, &candidate_hash) {
        "candidate"
    } else if constant_eq(&supplied, &assessor_hash) {
        "assessor"
    } else {
        return Err(AppError::Forbidden);
    };
    Ok(Json(ExamView { role, exam }))
}

async fn start_submission(
    State(state): State<AppState>,
    Path(exam_id): Path<String>,
    Json(input): Json<StartBody>,
) -> Result<Json<Value>, AppError> {
    let (exam, candidate_hash, _) = load_exam(&state.db, &exam_id).await?;
    require_token(&input.token, &candidate_hash)?;
    let id = Uuid::new_v4().to_string();
    let started = Utc::now();
    let delete_at = started + ChronoDuration::days(exam.deletion_days);
    let alias = if input.alias.trim().is_empty() {
        "Candidate"
    } else {
        input.alias.trim()
    };
    if alias.chars().count() > 80 {
        return Err(AppError::BadRequest(
            "Candidate alias must be 80 characters or fewer.".into(),
        ));
    }
    sqlx::query("INSERT INTO submissions (id,exam_id,alias_encrypted,work_log_encrypted,command_history_encrypted,status,started_at,delete_at) VALUES (?,?,?,?,?,'in_progress',?,?)")
        .bind(&id).bind(&exam_id).bind(encrypt(&state, alias.as_bytes())?).bind(encrypt(&state, b"")?).bind(encrypt(&state, b"")?).bind(started.to_rfc3339()).bind(delete_at.to_rfc3339()).execute(&state.db).await?;
    let submission = load_submission(&state, &id).await?;
    Ok(Json(json!({ "submission": submission })))
}

async fn save_evidence(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<EvidenceBody>,
) -> Result<Json<Value>, AppError> {
    let role = authorize_submission(&state, &id, &input.token).await?;
    if role != "candidate" {
        return Err(AppError::Forbidden);
    }
    if input.work_log.chars().count() > 30_000 || input.command_history.chars().count() > 30_000 {
        return Err(AppError::BadRequest(
            "Each evidence field must be 30,000 characters or fewer.".into(),
        ));
    }
    ensure_editable(&state.db, &id).await?;
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "UPDATE submissions SET work_log_encrypted=?, command_history_encrypted=? WHERE id=?",
    )
    .bind(encrypt(&state, input.work_log.as_bytes())?)
    .bind(encrypt(&state, input.command_history.as_bytes())?)
    .bind(&id)
    .execute(&state.db)
    .await?;
    Ok(Json(json!({ "saved_at": now })))
}

async fn add_checkpoint(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<CheckpointBody>,
) -> Result<Json<Value>, AppError> {
    let role = authorize_submission(&state, &id, &input.token).await?;
    if role != "candidate" {
        return Err(AppError::Forbidden);
    }
    ensure_editable(&state.db, &id).await?;
    let label = clean(&input.label, 100, "Checkpoint label")?;
    if input.content.is_empty() || input.content.chars().count() > 4000 {
        return Err(AppError::BadRequest(
            "Checkpoint content must be between 1 and 4,000 characters.".into(),
        ));
    }
    let checkpoint = Checkpoint {
        id: Uuid::new_v4().to_string(),
        label,
        hash: hex::encode(Sha256::digest(input.content.as_bytes())),
        created_at: Utc::now().to_rfc3339(),
    };
    sqlx::query("INSERT INTO checkpoints (id,submission_id,label,content_encrypted,hash,created_at) VALUES (?,?,?,?,?,?)")
        .bind(&checkpoint.id).bind(&id).bind(&checkpoint.label).bind(encrypt(&state, input.content.as_bytes())?).bind(&checkpoint.hash).bind(&checkpoint.created_at).execute(&state.db).await?;
    Ok(Json(json!({ "checkpoint": checkpoint })))
}

async fn upload_artifact(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<TokenQuery>,
    mut multipart: Multipart,
) -> Result<Json<Value>, AppError> {
    let role = authorize_submission(&state, &id, &query.token).await?;
    if role != "candidate" {
        return Err(AppError::Forbidden);
    }
    ensure_editable(&state.db, &id).await?;
    let field = multipart
        .next_field()
        .await
        .map_err(|_| AppError::BadRequest("Could not read the uploaded artifact.".into()))?
        .ok_or_else(|| AppError::BadRequest("Choose an artifact to upload.".into()))?;
    let raw_name = field.file_name().unwrap_or("artifact.bin");
    let name: String = raw_name
        .chars()
        .filter(|c| !c.is_control() && *c != '/' && *c != '\\')
        .take(180)
        .collect();
    let bytes = field
        .bytes()
        .await
        .map_err(|_| AppError::BadRequest("Could not read the uploaded artifact.".into()))?;
    if bytes.is_empty() || bytes.len() > 15 * 1024 * 1024 {
        return Err(AppError::BadRequest(
            "Artifact must be between 1 byte and 15 MB.".into(),
        ));
    }
    sqlx::query("UPDATE submissions SET artifact_encrypted=?, artifact_name_encrypted=?, artifact_size=? WHERE id=?")
        .bind(encrypt(&state, &bytes)?).bind(encrypt(&state, name.as_bytes())?).bind(bytes.len() as i64).bind(&id).execute(&state.db).await?;
    Ok(Json(json!({ "name": name, "size": bytes.len() })))
}

async fn submit_submission(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<TokenBody>,
) -> Result<Json<Value>, AppError> {
    let role = authorize_submission(&state, &id, &input.token).await?;
    if role != "candidate" {
        return Err(AppError::Forbidden);
    }
    ensure_editable(&state.db, &id).await?;
    let row = sqlx::query("SELECT length(artifact_encrypted) AS artifact, length(work_log_encrypted) AS work FROM submissions WHERE id=?").bind(&id).fetch_one(&state.db).await?;
    if row.get::<Option<i64>, _>("artifact").is_none() && row.get::<i64, _>("work") < 29 {
        return Err(AppError::BadRequest(
            "Add a work log or artifact before submitting.".into(),
        ));
    }
    let now = Utc::now().to_rfc3339();
    sqlx::query("UPDATE submissions SET status='submitted', submitted_at=? WHERE id=?")
        .bind(&now)
        .bind(&id)
        .execute(&state.db)
        .await?;
    Ok(Json(json!({ "submitted_at": now })))
}

async fn list_submissions(
    State(state): State<AppState>,
    Path(exam_id): Path<String>,
    Query(query): Query<TokenQuery>,
) -> Result<Json<Value>, AppError> {
    let (_, _, assessor_hash) = load_exam(&state.db, &exam_id).await?;
    require_token(&query.token, &assessor_hash)?;
    let rows = sqlx::query("SELECT id FROM submissions WHERE exam_id=? ORDER BY started_at DESC")
        .bind(&exam_id)
        .fetch_all(&state.db)
        .await?;
    let mut values = Vec::with_capacity(rows.len());
    for row in rows {
        values.push(load_submission(&state, row.get("id")).await?);
    }
    Ok(Json(json!({ "submissions": values })))
}

async fn get_submission(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<TokenQuery>,
) -> Result<Json<Value>, AppError> {
    authorize_submission(&state, &id, &query.token).await?;
    Ok(Json(
        json!({ "submission": load_submission(&state, &id).await? }),
    ))
}

async fn save_assessment(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<AssessBody>,
) -> Result<Json<Value>, AppError> {
    let role = authorize_submission(&state, &id, &input.token).await?;
    if role != "assessor" {
        return Err(AppError::Forbidden);
    }
    if input.notes.chars().count() > 8000 {
        return Err(AppError::BadRequest(
            "Feedback must be 8,000 characters or fewer.".into(),
        ));
    }
    let allowed = [
        "meets",
        "partially_meets",
        "does_not_meet",
        "needs_follow_up",
    ];
    if !allowed.contains(&input.outcome.as_str()) {
        return Err(AppError::BadRequest(
            "Choose a valid overall decision.".into(),
        ));
    }
    let exam_id: String = sqlx::query_scalar("SELECT exam_id FROM submissions WHERE id=?")
        .bind(&id)
        .fetch_one(&state.db)
        .await?;
    let (exam, _, _) = load_exam(&state.db, &exam_id).await?;
    for criterion in &exam.rubric {
        match input.scores.get(&criterion.id) {
            Some(score) if *score >= 0 && *score <= criterion.max_score => (),
            _ => {
                return Err(AppError::BadRequest(
                    "Every criterion needs a score within its allowed range.".into(),
                ))
            }
        }
    }
    let now = Utc::now().to_rfc3339();
    sqlx::query("INSERT INTO assessments (submission_id,scores_json,notes_encrypted,outcome,assessed_at) VALUES (?,?,?,?,?) ON CONFLICT(submission_id) DO UPDATE SET scores_json=excluded.scores_json, notes_encrypted=excluded.notes_encrypted, outcome=excluded.outcome, assessed_at=excluded.assessed_at")
        .bind(&id).bind(serde_json::to_string(&input.scores).map_err(|_| AppError::Internal)?).bind(encrypt(&state, input.notes.as_bytes())?).bind(&input.outcome).bind(&now).execute(&state.db).await?;
    sqlx::query("UPDATE submissions SET status='assessed' WHERE id=?")
        .bind(&id)
        .execute(&state.db)
        .await?;
    Ok(Json(json!({ "assessed_at": now })))
}

async fn download_artifact(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<TokenQuery>,
) -> Result<Response, AppError> {
    authorize_submission(&state, &id, &query.token).await?;
    let row = sqlx::query(
        "SELECT artifact_encrypted, artifact_name_encrypted FROM submissions WHERE id=?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await?;
    let encrypted: Option<Vec<u8>> = row.try_get("artifact_encrypted")?;
    let encrypted_name: Option<Vec<u8>> = row.try_get("artifact_name_encrypted")?;
    let bytes = decrypt(&state, encrypted.as_deref().ok_or(AppError::NotFound)?)?;
    let name = String::from_utf8(decrypt(
        &state,
        encrypted_name.as_deref().ok_or(AppError::NotFound)?,
    )?)
    .map_err(|_| AppError::Internal)?;
    let mime = mime_guess::from_path(&name).first_or_octet_stream();
    let disposition = format!(
        "attachment; filename=\"{}\"",
        name.replace(['"', '\r', '\n'], "_")
    );
    Ok((
        [
            (header::CONTENT_TYPE, mime.as_ref()),
            (header::CONTENT_DISPOSITION, disposition.as_str()),
        ],
        bytes,
    )
        .into_response())
}

async fn export_submission(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<TokenQuery>,
) -> Result<Response, AppError> {
    let role = authorize_submission(&state, &id, &query.token).await?;
    let submission = load_submission(&state, &id).await?;
    let exam_id: String = sqlx::query_scalar("SELECT exam_id FROM submissions WHERE id=?")
        .bind(&id)
        .fetch_one(&state.db)
        .await?;
    let (exam, _, _) = load_exam(&state.db, &exam_id).await?;
    let record = json!({ "format": "humane-practical-exam/v1", "exported_at": Utc::now().to_rfc3339(), "accessed_as": role, "exam": exam, "submission": submission, "integrity_note": "Checkpoint hashes are SHA-256 fingerprints of candidate-chosen content recorded at the listed times. They do not prove identity or authorship." });
    let bytes = serde_json::to_vec_pretty(&record).map_err(|_| AppError::Internal)?;
    let disposition = format!("attachment; filename=\"assessment-{}.json\"", id);
    Ok((
        [
            (header::CONTENT_TYPE, "application/json; charset=utf-8"),
            (header::CONTENT_DISPOSITION, disposition.as_str()),
        ],
        bytes,
    )
        .into_response())
}

async fn delete_submission(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<TokenBody>,
) -> Result<Json<Value>, AppError> {
    let role = authorize_submission(&state, &id, &input.token).await?;
    if role != "assessor" {
        return Err(AppError::Forbidden);
    }
    sqlx::query("DELETE FROM submissions WHERE id=?")
        .bind(&id)
        .execute(&state.db)
        .await?;
    Ok(Json(json!({ "deleted": true })))
}

async fn load_exam(db: &SqlitePool, id: &str) -> Result<(Exam, String, String), AppError> {
    let row = sqlx::query("SELECT * FROM exams WHERE id=?")
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound)?;
    let rubric = serde_json::from_str(row.get("rubric_json")).map_err(|_| AppError::Internal)?;
    Ok((
        Exam {
            id: row.get("id"),
            title: row.get("title"),
            brief: row.get("brief"),
            duration_minutes: row.get("duration_minutes"),
            deletion_days: row.get("deletion_days"),
            accommodations: row.get("accommodations"),
            provider_name: row.get("provider_name"),
            rubric,
            created_at: row.get("created_at"),
        },
        row.get("candidate_token_hash"),
        row.get("assessor_token_hash"),
    ))
}

async fn authorize_submission(
    state: &AppState,
    id: &str,
    token: &str,
) -> Result<&'static str, AppError> {
    let row = sqlx::query("SELECT e.candidate_token_hash,e.assessor_token_hash,s.delete_at FROM submissions s JOIN exams e ON e.id=s.exam_id WHERE s.id=?").bind(id).fetch_optional(&state.db).await?.ok_or(AppError::NotFound)?;
    if row.get::<String, _>("delete_at") < Utc::now().to_rfc3339() {
        sqlx::query("DELETE FROM submissions WHERE id=?")
            .bind(id)
            .execute(&state.db)
            .await?;
        return Err(AppError::NotFound);
    }
    let supplied = token_hash(token);
    if constant_eq(&supplied, row.get("candidate_token_hash")) {
        Ok("candidate")
    } else if constant_eq(&supplied, row.get("assessor_token_hash")) {
        Ok("assessor")
    } else {
        Err(AppError::Forbidden)
    }
}

async fn load_submission(state: &AppState, id: &str) -> Result<Submission, AppError> {
    let row = sqlx::query("SELECT * FROM submissions WHERE id=?")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;
    let checkpoint_rows = sqlx::query("SELECT id,label,hash,created_at FROM checkpoints WHERE submission_id=? ORDER BY created_at").bind(id).fetch_all(&state.db).await?;
    let checkpoints: Vec<Checkpoint> = checkpoint_rows
        .into_iter()
        .map(|r| Checkpoint {
            id: r.get("id"),
            label: r.get("label"),
            hash: r.get("hash"),
            created_at: r.get("created_at"),
        })
        .collect();
    let assessment_row = sqlx::query("SELECT * FROM assessments WHERE submission_id=?")
        .bind(id)
        .fetch_optional(&state.db)
        .await?;
    let assessment = assessment_row
        .map(|r| -> Result<Assessment, AppError> {
            Ok(Assessment {
                scores: serde_json::from_str(r.get("scores_json"))
                    .map_err(|_| AppError::Internal)?,
                notes: decrypt_string(state, r.get("notes_encrypted"))?,
                outcome: r.get("outcome"),
                assessed_at: r.get("assessed_at"),
            })
        })
        .transpose()?;
    let artifact_name = row
        .get::<Option<Vec<u8>>, _>("artifact_name_encrypted")
        .map(|value| decrypt_string(state, value))
        .transpose()?;
    Ok(Submission {
        id: row.get("id"),
        alias: decrypt_string(state, row.get("alias_encrypted"))?,
        status: row.get("status"),
        started_at: row.get("started_at"),
        submitted_at: row.get("submitted_at"),
        delete_at: row.get("delete_at"),
        artifact_name,
        artifact_size: row.get("artifact_size"),
        checkpoint_count: checkpoints.len(),
        work_log: decrypt_string(state, row.get("work_log_encrypted"))?,
        command_history: decrypt_string(state, row.get("command_history_encrypted"))?,
        outcome: assessment.as_ref().map(|a| a.outcome.clone()),
        checkpoints,
        assessment,
    })
}

async fn ensure_editable(db: &SqlitePool, id: &str) -> Result<(), AppError> {
    let status: String = sqlx::query_scalar("SELECT status FROM submissions WHERE id=?")
        .bind(id)
        .fetch_optional(db)
        .await?
        .ok_or(AppError::NotFound)?;
    if status != "in_progress" {
        return Err(AppError::BadRequest(
            "Submitted evidence can no longer be changed.".into(),
        ));
    }
    Ok(())
}

fn encrypt(state: &AppState, plaintext: &[u8]) -> Result<Vec<u8>, AppError> {
    let mut nonce = [0_u8; 12];
    OsRng.fill_bytes(&mut nonce);
    let encrypted = state
        .cipher
        .encrypt(Nonce::from_slice(&nonce), plaintext)
        .map_err(|_| AppError::Internal)?;
    let mut value = nonce.to_vec();
    value.extend(encrypted);
    Ok(value)
}
fn decrypt(state: &AppState, value: &[u8]) -> Result<Vec<u8>, AppError> {
    if value.len() < 28 {
        return Err(AppError::Internal);
    }
    state
        .cipher
        .decrypt(Nonce::from_slice(&value[..12]), &value[12..])
        .map_err(|_| AppError::Internal)
}
fn decrypt_string(state: &AppState, value: Vec<u8>) -> Result<String, AppError> {
    String::from_utf8(decrypt(state, &value)?).map_err(|_| AppError::Internal)
}
fn random_token() -> String {
    let mut value = [0_u8; 32];
    OsRng.fill_bytes(&mut value);
    hex::encode(value)
}
fn token_hash(value: &str) -> String {
    hex::encode(Sha256::digest(value.as_bytes()))
}
fn require_token(value: &str, expected: &str) -> Result<(), AppError> {
    if constant_eq(&token_hash(value), expected) {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}
fn constant_eq(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.as_bytes()
        .iter()
        .zip(b.as_bytes())
        .fold(0, |diff, (x, y)| diff | (x ^ y))
        == 0
}
fn clean(value: &str, max: usize, name: &str) -> Result<String, AppError> {
    let value = value.trim();
    if value.is_empty() || value.chars().count() > max {
        Err(AppError::BadRequest(format!(
            "{name} is required and must be {max} characters or fewer."
        )))
    } else {
        Ok(value.into())
    }
}
fn optional_clean(value: &str, max: usize) -> Option<String> {
    let value: String = value.trim().chars().take(max).collect();
    (!value.is_empty()).then_some(value)
}

fn spawn_cleanup(state: AppState) {
    tokio::spawn(async move {
        loop {
            match sqlx::query("DELETE FROM submissions WHERE delete_at < ?")
                .bind(Utc::now().to_rfc3339())
                .execute(&state.db)
                .await
            {
                Ok(result) if result.rows_affected() > 0 => info!(
                    deleted = result.rows_affected(),
                    "expired submissions purged"
                ),
                Err(error) => warn!(%error, "submission cleanup failed"),
                _ => {}
            }
            tokio::time::sleep(Duration::from_secs(3600)).await;
        }
    });
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("install Ctrl+C handler");
    };
    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("install signal handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
    info!("graceful shutdown started");
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::to_bytes, http::Request};
    use tower::ServiceExt;
    async fn state() -> AppState {
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .unwrap();
        MIGRATOR.run(&db).await.unwrap();
        let key: [u8; 32] = Sha256::digest(b"test-key").into();
        AppState {
            db,
            cipher: Aes256Gcm::new(&key.into()),
            rate_windows: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
        }
    }
    #[tokio::test]
    async fn encryption_round_trips_and_uses_random_nonces() {
        let state = state().await;
        let a = encrypt(&state, b"candidate evidence").unwrap();
        let b = encrypt(&state, b"candidate evidence").unwrap();
        assert_ne!(a, b);
        assert_eq!(decrypt(&state, &a).unwrap(), b"candidate evidence");
    }
    #[test]
    fn tokens_are_hashed_and_compared() {
        let token = random_token();
        let hash = token_hash(&token);
        assert_ne!(token, hash);
        assert!(require_token(&token, &hash).is_ok());
        assert!(require_token("wrong", &hash).is_err());
    }

    #[tokio::test]
    async fn create_and_open_exam_with_role_capabilities() {
        let app = build_app(state().await);
        let payload = json!({
            "title": "Deploy a small service",
            "brief": "Build and verify a small HTTP service, then explain the decisions you made.",
            "duration_minutes": 60,
            "deletion_days": 14,
            "accommodations": "Assistive technology is permitted.",
            "criteria": [{ "label": "Works", "description": "Service responds", "max_score": 4 }]
        });
        let response = app
            .clone()
            .oneshot(
                Request::post("/api/exams")
                    .header("content-type", "application/json")
                    .body(Body::from(payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let created: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 1024 * 1024).await.unwrap())
                .unwrap();
        let id = created["exam_id"].as_str().unwrap();
        let token = created["candidate_token"].as_str().unwrap();
        let response = app
            .oneshot(
                Request::get(format!("/api/exams/{id}?token={token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let opened: Value =
            serde_json::from_slice(&to_bytes(response.into_body(), 1024 * 1024).await.unwrap())
                .unwrap();
        assert_eq!(opened["role"], "candidate");
        assert_eq!(opened["exam"]["title"], "Deploy a small service");
    }
}
