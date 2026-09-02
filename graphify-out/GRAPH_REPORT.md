# Graph Report - Resilience  (2026-09-03)

## Corpus Check
- 196 files · ~97,227 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2155 nodes · 3924 edges · 142 communities (108 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 159 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5ad3a152`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- foundation_input/routes.py
- ResilienceJarPage.tsx
- ScenarioSimulatorPage.tsx
- test_scheme_navigator_chat.py
- test_engine.py
- build_questionnaire
- scheme-navigator/types.ts
- resilience_jar/service.py
- ServiceTestCase
- test_scheme_navigator_explainer.py
- LLMUnavailableError
- main.py
- scenario_simulator/engine.py
- properties
- ShockScenario
- App.tsx
- serializers.py
- evaluate_rule
- income-reality/types.ts
- ResilienceJarService
- properties
- Lessons Learnt
- scheme_navigator.py
- scripts
- test_scheme_navigator_api.py
- properties
- compilerOptions
- What You Must Do When Invoked
- What You Must Do When Invoked
- IncomeRealityRequest
- properties
- ContributionRepository
- scenario_simulator/router.py
- WeeklyEntryIn
- required
- BaselineFinances
- properties
- properties
- enum
- items
- properties
- properties
- devDependencies
- properties
- properties
- Agent Session Log
- $defs
- required
- properties
- integer
- Scheme Navigator — Questionnaire & Deterministic Evaluator
- recommend_weekly_savings
- simulate
- weeks
- required
- properties
- properties
- required
- properties
- properties
- Scenario Simulator
- Initial Prototype Collaboration Scaffold
- compilerOptions
- cpf_rate_bps
- required
- examples
- properties
- required
- dependencies
- Feature 1 — Foundation Input
- required
- required
- $defs
- graphify reference: extra exports and benchmark
- result_to_dict
- graphify reference: extra exports and benchmark
- required
- Feature 03 — Emergency Fund
- test_router.py
- IncomeRealityResponse
- null
- SimulationRequest
- Codebase Structure
- Feature 2 — Income Reality Engine
- frontend/package.json
- scripts
- Resilience
- Mandatory Agent Rules
- recorded_cpf_cents
- disclaimers
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- README.md
- api.generated.ts
- Backend
- chat.py
- Frontend
- routing.ts
- Supabase
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native AGENTS.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- tsconfig.json
- AGENTS.md
- .agents/skills/graphify/references/extraction-spec.md
- core/__init__.py
- db/__init__.py
- foundation_input/__init__.py
- app/__init__.py
- tests/__init__.py
- integration/__init__.py
- .codex/skills/graphify/references/extraction-spec.md
- contracts/README.md
- tailwindcss
- @testing-library/jest-dom
- @testing-library/react
- @testing-library/user-event
- @types/react
- @types/react-dom
- typescript
- vite-plugin-pwa
- evaluate_all
- required
- ShockScenarioPayload

## God Nodes (most connected - your core abstractions)
1. `ShockScenario` - 51 edges
2. `ResilienceJarService` - 42 edges
3. `simulate()` - 36 edges
4. `evaluate_rule()` - 30 edges
5. `Lessons Learnt` - 29 edges
6. `ResilienceJarPage()` - 25 edges
7. `DomainError` - 24 edges
8. `BaselineFinances` - 24 edges
9. `project_weeks()` - 23 edges
10. `build_chat_prompt()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `recommend_weekly_savings()` --uses--> `RecommendationMethod`  [INFERRED]
  backend/app/features/resilience_jar/calculations.py → backend/app/features/resilience_jar/models.py
- `recommend_weekly_savings()` --uses--> `WeeklySurplus`  [INFERRED]
  backend/app/features/resilience_jar/calculations.py → backend/app/features/resilience_jar/models.py
- `InMemoryPlanRepository` --uses--> `JarPlan`  [INFERRED]
  backend/app/features/resilience_jar/memory.py → backend/app/features/resilience_jar/models.py
- `InMemoryContributionRepository` --uses--> `Contribution`  [INFERRED]
  backend/app/features/resilience_jar/memory.py → backend/app/features/resilience_jar/models.py
- `ResilienceJarService` --uses--> `RecommendationMethod`  [INFERRED]
  backend/app/features/resilience_jar/service.py → backend/app/features/resilience_jar/models.py

## Import Cycles
- None detected.

## Communities (142 total, 23 thin omitted)

### Community 0 - "foundation_input/routes.py"
Cohesion: 0.06
Nodes (101): alias, DomainError, Any, Exception, Base, EmergencySavingsSnapshot, EssentialExpense, IdempotencyReceipt (+93 more)

### Community 1 - "ResilienceJarPage.tsx"
Cohesion: 0.06
Nodes (61): HttpResilienceJarApi, readCachedSummary(), ResilienceJarApi, ResilienceJarApiError, writeCachedSummary(), clone(), fixtureRecommendationAmounts, FixtureResilienceJarApi (+53 more)

### Community 2 - "ScenarioSimulatorPage.tsx"
Cohesion: 0.06
Nodes (58): ScenarioSimulatorPage, ResultSource, simulateScenario(), SimulationOutcome, BaselineEditor(), BaselineEditorProps, Bar, BufferChart() (+50 more)

### Community 3 - "test_scheme_navigator_chat.py"
Cohesion: 0.08
Nodes (46): build_chat_prompt(), ChatMessage, Renders the user-turn prompt. Pure, so tests can assert on it exactly., ChatMessage, FailingClient, ChatMessage, SchemeResult, Chatbot tests. The LLM is a stub throughout; no test reaches the network. The… (+38 more)

### Community 4 - "test_engine.py"
Cohesion: 0.09
Nodes (47): IncomeAssumptions, Editable default assumptions for the Income Reality Engine. These are prototype…, calculate_cpf_cents(), calculate_income_reality(), calculate_recent_trend(), calculate_week_breakdown(), PlatformEarning, Deterministic Income Reality calculations. Pure, framework-independent… (+39 more)

### Community 5 - "build_questionnaire"
Cohesion: 0.12
Nodes (19): get_questionnaire(), get, QuestionnaireField, Returns only the questions actually needed by the currently loaded scheme…, Questionnaire labels the person has not filled in yet. Derived from the fields…, unanswered_questions(), Registry of every questionnaire field a scheme rule can reference. A rule's…, build_questionnaire() (+11 more)

### Community 6 - "scheme-navigator/types.ts"
Cohesion: 0.09
Nodes (36): SchemeNavigator, evaluateAnswers(), explainResult(), fetchQuestionnaire(), sendChatMessage(), ChatContext, ChatContextValue, ChatProvider() (+28 more)

### Community 7 - "resilience_jar/service.py"
Cohesion: 0.14
Nodes (25): calculate_completion_projection(), calculate_milestones(), calculate_progress(), _one_decimal(), CompletionProjection, date, JarPlan, Milestone (+17 more)

### Community 8 - "ServiceTestCase"
Cohesion: 0.08
Nodes (9): build_demo_service(), InMemoryContributionRepository, InMemoryFinancialContextRepository, InMemoryPlanRepository, Contribution, date, JarPlan, WeeklySurplus (+1 more)

### Community 9 - "test_scheme_navigator_explainer.py"
Cohesion: 0.11
Nodes (35): build_prompt(), explain(), Explains ``result`` in plain language, degrading rather than failing., Renders the user-turn prompt. Pure and separate from the API call so tests can…, snippets_for(), Otherwise the model answers about that scheme from memory instead., test_every_rule_has_curated_sources(), FailingClient (+27 more)

### Community 10 - "LLMUnavailableError"
Cohesion: 0.08
Nodes (23): chat_turn(), explain_result(), get_llm_client(), ChatResponse, Depends, ExplanationResponse, post, Provides the explainer's model client, or ``None`` when unconfigured. Declared… (+15 more)

### Community 11 - "main.py"
Cohesion: 0.09
Nodes (23): get_settings(), Settings, get_engine(), get_session(), Session, demo_user(), Depends, domain_error_handler() (+15 more)

### Community 12 - "scenario_simulator/engine.py"
Cohesion: 0.11
Nodes (30): _baseline_summary(), BaselineSummary, ScenarioSummary, Deterministic shock-model calculations. This module has no framework, database,…, Scale a non-negative cent amount by a fraction, truncating to whole cents.…, _scaled(), _scenario_summary(), build_actions() (+22 more)

### Community 13 - "properties"
Cohesion: 0.06
Nodes (35): type, type, WeekProjectionResponse, type, type, essential_expenses_cents, gross_earnings_cents, work_costs_cents (+27 more)

### Community 14 - "ShockScenario"
Cohesion: 0.12
Nodes (13): _horizon_weeks(), _income_factor(), project_weeks(), Return the earnings multiplier for a week as an exact fraction. Recovery ramps…, Project each week of the scenario from the first affected week onward., One financial shock the user wants to prepare for. Time away from work is the…, ShockScenario, HorizonTests (+5 more)

### Community 15 - "App.tsx"
Cohesion: 0.06
Nodes (64): App(), createInputSnapshots(), EARNING_CATEGORIES, EmergencyFund(), EMPTY_ONBOARDING_DRAFT, Entries(), ESSENTIAL_CATEGORIES, ImportCsv() (+56 more)

### Community 16 - "serializers.py"
Cohesion: 0.10
Nodes (25): CompletionProjection, GoalReview, JarSummary, Recommendation, create_demo_router(), create_router(), Create the feature router without coupling it to shared app composition., completion_projection_dict() (+17 more)

### Community 17 - "evaluate_rule"
Cohesion: 0.13
Nodes (13): evaluate_rule(), SchemeResult, Evaluate a single rule against the answers collected so far. Missing…, parametrize, Tests for the deterministic scheme evaluator. Covers matched, not-matched,…, A minimal synthetic rule exercising every supported operator, kept independent…, TestBoundaryValues, TestMatched (+5 more)

### Community 18 - "income-reality/types.ts"
Cohesion: 0.13
Nodes (26): IncomeRealityPage, fetchIncomeBreakdown(), AssumptionsEditor(), AssumptionsEditorProps, IncomeBreakdownCard(), IncomeBreakdownCardProps, IncomeRealityView(), IncomeRealityViewProps (+18 more)

### Community 19 - "ResilienceJarService"
Cohesion: 0.21
Nodes (8): DomainError, Any, Contribution, Exception, GoalReview, JarPlan, JarSummary, ResilienceJarService

### Community 20 - "properties"
Cohesion: 0.07
Nodes (28): type, description, minimum, type, TrendSummaryOut, type, type, average_net_income_cents (+20 more)

### Community 21 - "Lessons Learnt"
Cohesion: 0.07
Nodes (30): 2026-09-01 — Audit every reachable Git reference, 2026-09-01 — Brace PowerShell variables before punctuation, 2026-09-01 — Create a package.json before ad hoc `npm install` in a scratch directory, 2026-09-01 — Distinguish negative checks from command errors, 2026-09-01 — Purge only verified sensitive objects, 2026-09-01 — Refresh PATH from the registry after a mid-session winget install, 2026-09-01 — Replace existing files with update patches, 2026-09-01 — Request repository-metadata write access (+22 more)

### Community 22 - "scheme_navigator.py"
Cohesion: 0.11
Nodes (31): evaluate(), EvaluationResponse, HTTP routes for the Scheme Navigator. This module only adapts HTTP <-> the…, Evaluates the submitted answers against every loaded scheme rule. Any field a…, _condition_passes(), Deterministic evaluation of scheme rules against user answers. No AI or network…, _fallback(), ExplanationResponse (+23 more)

### Community 23 - "scripts"
Cohesion: 0.07
Nodes (26): devDependencies, jsdom, supabase, engines, node, npm, jsdom, name (+18 more)

### Community 24 - "test_scheme_navigator_api.py"
Cohesion: 0.10
Nodes (18): _matched_result(), Any, fixture, parametrize, Integration tests exercising the Scheme Navigator through FastAPI., With no API key the endpoint must still answer, not 500., The chat panel must never surface a 500 because the LLM is down., Only user/assistant turns are accepted; no injecting a system turn. (+10 more)

### Community 25 - "properties"
Cohesion: 0.08
Nodes (26): minimum, format, type, properties, format, type, enum, minLength (+18 more)

### Community 26 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+17 more)

### Community 27 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 28 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 29 - "IncomeRealityRequest"
Cohesion: 0.25
Nodes (8): IncomeRealityRequest, additionalProperties, required, type, required, weeks, assumptions_applied, trend

### Community 30 - "properties"
Cohesion: 0.10
Nodes (22): additionalProperties, required, type, items, type, additionalProperties, required, type (+14 more)

### Community 31 - "ContributionRepository"
Cohesion: 0.14
Nodes (9): ContributionRepository, FinancialContextRepository, PlanRepository, Contribution, date, JarPlan, Protocol, date (+1 more)

### Community 32 - "scenario_simulator/router.py"
Cohesion: 0.19
Nodes (16): post, FastAPI routes for the Scenario Simulator. Workstream 1 mounts this router on…, simulate_scenario(), BaselineFinancesPayload, BaselineSummaryResponse, OfficialResourceResponse, PreparatoryActionResponse, BaseModel (+8 more)

### Community 33 - "WeeklyEntryIn"
Cohesion: 0.40
Nodes (5): WeeklyEntryIn, additionalProperties, required, type, week_start

### Community 34 - "required"
Cohesion: 0.13
Nodes (15): required, buffer_at_horizon_cents, buffer_holds_through_horizon, buffer_runway_weeks, first_shortfall_week, full_income_resumes_week, horizon_weeks, lowest_buffer_cents (+7 more)

### Community 35 - "BaselineFinances"
Cohesion: 0.17
Nodes (6): BaselineFinances, The user's normal week, as confirmed in the income and expense flows., _require_non_negative(), action_ids(), BufferRunwayTests, Cents

### Community 36 - "properties"
Cohesion: 0.12
Nodes (17): minimum, type, type, description, type, cpf_cents, gross_earnings_cents, net_income_cents (+9 more)

### Community 37 - "properties"
Cohesion: 0.12
Nodes (17): format, type, maximum, minimum, type, enum, as_of_week_start, history_weeks_used (+9 more)

### Community 38 - "enum"
Cohesion: 0.12
Nodes (17): properties, remaining_cents, status, weeks_remaining, minimum, enum, minimum, active (+9 more)

### Community 39 - "items"
Cohesion: 0.12
Nodes (17): additionalProperties, properties, required, type, items, type, enum, milestones (+9 more)

### Community 40 - "properties"
Cohesion: 0.10
Nodes (20): type, type, type, type, buffer_at_horizon_cents, buffer_holds_through_horizon, buffer_runway_weeks, first_shortfall_week (+12 more)

### Community 41 - "properties"
Cohesion: 0.12
Nodes (16): minimum, maximum, minimum, type, horizon_weeks, income_reduction_percent, recovery_weeks, unexpected_cost_cents (+8 more)

### Community 42 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, jsdom, openapi-typescript, @playwright/test, @tailwindcss/vite, @types/node, vite, @vitejs/plugin-react (+9 more)

### Community 43 - "properties"
Cohesion: 0.14
Nodes (16): minimum, type, minimum, type, minimum, type, minimum, minimum (+8 more)

### Community 44 - "properties"
Cohesion: 0.13
Nodes (15): properties, minimum, type, emergency_savings_cents, emergency_savings_weeks_of_essentials, runway_weeks, weekly_gross_earnings_cents, weekly_net_work_income_cents (+7 more)

### Community 45 - "Agent Session Log"
Cohesion: 0.11
Nodes (18): 2026-09-01 — Income Reality Engine (workstream 2) initial implementation, 2026-09-01 — Income Reality Engine (workstream 2) integration seam and live demo, 2026-09-01 — Income Reality Engine (workstream 2) test execution follow-up, 2026-09-01 — Initial collaboration scaffold, 2026-09-01 — Purge sensitive objects from local Git storage, 2026-09-01 — Remove private context from Git history, 2026-09-01 — Shared codebase folder scaffold, 2026-09-02 — Add Graphify cross-agent project integration (+10 more)

### Community 46 - "$defs"
Cohesion: 0.13
Nodes (14): additionalProperties, type, $defs, AssumptionsIn, PlatformEarning, description, $id, additionalProperties (+6 more)

### Community 47 - "required"
Cohesion: 0.13
Nodes (14): additionalProperties, $id, weekly_essential_expenses_cents, required, $schema, title, type, completion_projection (+6 more)

### Community 48 - "properties"
Cohesion: 0.13
Nodes (15): minimum, $ref, properties, goal, goal_expense_baseline_cents, target_amount_cents, target_frequency, weekly_target_cents (+7 more)

### Community 49 - "integer"
Cohesion: 0.43
Nodes (8): type, type, type, type, type, integer, null, type

### Community 50 - "Scheme Navigator — Questionnaire & Deterministic Evaluator"
Cohesion: 0.14
Nodes (14): Current assumptions (reversible), Interfaces, Interfaces added in the explainer pass, Known limitations / follow-up, No dead ends, Scheme facts come from SupportGoWhere, Scheme Navigator — Questionnaire & Deterministic Evaluator, Tests performed (+6 more)

### Community 51 - "recommend_weekly_savings"
Cohesion: 0.27
Nodes (7): _median(), Recommendation, recommend_weekly_savings(), RecommendationTests, week(), Fraction, RecommendationMethod

### Community 52 - "simulate"
Cohesion: 0.21
Nodes (5): ScenarioResult, Run one scenario and return every figure the results screen displays., simulate(), BaselineTests, ResultContractTests

### Community 53 - "weeks"
Cohesion: 0.14
Nodes (14): $ref, properties, $ref, items, type, items, assumptions, platform_breakdown (+6 more)

### Community 54 - "required"
Cohesion: 0.15
Nodes (13): additionalProperties, required, type, $defs, contribution, goal, oneOf, id (+5 more)

### Community 55 - "properties"
Cohesion: 0.15
Nodes (13): additionalProperties, properties, type, BaselineFinancesPayload, weekly_essential_expenses_cents, weekly_fixed_work_costs_cents, weekly_variable_work_costs_cents, minimum (+5 more)

### Community 57 - "properties"
Cohesion: 0.17
Nodes (12): default, minimum, type, default, type, essential_expenses_cents, platform_earnings, week_start (+4 more)

### Community 58 - "required"
Cohesion: 0.15
Nodes (15): required, additionalProperties, required, type, BaselineSummaryResponse, weekly_essential_expenses_cents, emergency_savings_cents, emergency_savings_weeks_of_essentials (+7 more)

### Community 59 - "properties"
Cohesion: 0.22
Nodes (9): type, type, type, properties, description, last_reviewed, name, url (+1 more)

### Community 60 - "properties"
Cohesion: 0.22
Nodes (9): type, type, properties, detail, id, severity, title, type (+1 more)

### Community 61 - "Scenario Simulator"
Cohesion: 0.17
Nodes (11): Business rules and assumptions, Deferred, Files, Follow-up, HTTP, Interfaces, Known limitations, Safety boundaries (+3 more)

### Community 62 - "Initial Prototype Collaboration Scaffold"
Cohesion: 0.17
Nodes (12): Documentation requirement, Initial Prototype Collaboration Scaffold, Integration order (completed), Original branch convention, Product boundary, Repository hygiene, Shared integration contracts, Workstream 1 — Foundation & data intake (+4 more)

### Community 63 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowImportingTsExtensions, composite, module, moduleResolution, noEmit, skipLibCheck, types (+3 more)

### Community 64 - "cpf_rate_bps"
Cohesion: 0.18
Nodes (11): default, description, type, properties, default, description, maximum, minimum (+3 more)

### Community 65 - "required"
Cohesion: 0.18
Nodes (11): WeekBreakdownOut, essential_expenses_cents, gross_earnings_cents, work_costs_cents, additionalProperties, required, type, cpf_cents (+3 more)

### Community 66 - "examples"
Cohesion: 0.18
Nodes (11): minimum, type, examples, minLength, type, properties, gross_cents, platform (+3 more)

### Community 67 - "properties"
Cohesion: 0.22
Nodes (11): items, type, $ref, actions, resources, weeks, items, type (+3 more)

### Community 68 - "required"
Cohesion: 0.20
Nodes (11): ScenarioResultResponse, weeks, additionalProperties, required, type, required, actions, baseline (+3 more)

### Community 70 - "dependencies"
Cohesion: 0.18
Nodes (11): dexie, dependencies, dexie, react, react-dom, react-router-dom, recharts, react (+3 more)

### Community 71 - "Feature 1 — Foundation Input"
Cohesion: 0.17
Nodes (11): Complete local runbook, Current integration and follow-up, Environment and secret handoff, Feature 1 — Foundation Input, PostgreSQL foundation, Shared contracts other features depend on, Supabase status and hosted-project procedure, User-visible scope (+3 more)

### Community 72 - "required"
Cohesion: 0.20
Nodes (10): additionalProperties, required, type, plan, goal, goal_expense_baseline_cents, recommendation_method, target_amount_cents (+2 more)

### Community 73 - "required"
Cohesion: 0.20
Nodes (10): recommendation, additionalProperties, required, type, amount_cents, as_of_week_start, history_weeks_used, latest_surplus_cents (+2 more)

### Community 74 - "$defs"
Cohesion: 0.15
Nodes (12): $defs, OfficialResourceResponse, ScenarioSummaryResponse, description, $id, additionalProperties, type, oneOf (+4 more)

### Community 77 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 78 - "result_to_dict"
Cohesion: 0.28
Nodes (6): ScenarioResult, Return the result as nested dicts and lists, ready for JSON encoding., result_to_dict(), _to_plain(), Guard the response schemas against engine drift. The schemas import pydantic,…, TransportContractTests

### Community 79 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 80 - "required"
Cohesion: 0.22
Nodes (9): additionalProperties, required, type, progress, contribution_total_cents, coverage_days, coverage_weeks, goal_target_cents (+1 more)

### Community 81 - "Feature 03 — Emergency Fund"
Cohesion: 0.22
Nodes (8): Business rules, Feature 03 — Emergency Fund, Frontend flow, Integration, Interfaces, Limitations and follow-up, Scope, Verification performed

### Community 82 - "test_router.py"
Cohesion: 0.29
Nodes (3): _load(), Integration test for the Income Reality router, crossing the FastAPI…, test_breakdown_endpoint_matches_every_fixture_response()

### Community 83 - "IncomeRealityResponse"
Cohesion: 0.25
Nodes (8): $ref, IncomeRealityResponse, additionalProperties, properties, type, assumptions_applied, trend, $ref

### Community 84 - "null"
Cohesion: 0.18
Nodes (18): type, minimum, type, type, type, properties, type, integer (+10 more)

### Community 85 - "SimulationRequest"
Cohesion: 0.25
Nodes (8): $ref, SimulationRequest, baseline, scenario, $ref, additionalProperties, properties, type

### Community 86 - "Codebase Structure"
Cohesion: 0.25
Nodes (7): Codebase Structure, Decision, Deferred work, Dependency boundaries, Directory map, Feature map, Validation performed

### Community 87 - "Feature 2 — Income Reality Engine"
Cohesion: 0.25
Nodes (7): Assumptions and business rules, Current integration verification and follow-up, Feature 2 — Income Reality Engine, Historical branch verification, Interfaces, Known limitations, User-visible scope

### Community 88 - "frontend/package.json"
Cohesion: 0.25
Nodes (7): engines, node, name, packageManager, private, type, version

### Community 89 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, generate:api, preview, test, test:integration, test:watch

### Community 90 - "Resilience"
Cohesion: 0.14
Nodes (14): 1. Clone and read the agent rules, 2. Install prerequisites, 3. Install and configure, 4. Start the local stack, 5. Verify changes, Integrated features, License, Local setup (+6 more)

### Community 91 - "Mandatory Agent Rules"
Cohesion: 0.29
Nodes (6): Autonomy, Code quality, Documentation, Mandatory Agent Rules, Memory, Scope

### Community 92 - "recorded_cpf_cents"
Cohesion: 0.29
Nodes (7): integer, null, recorded_cpf_cents, default, description, minimum, type

### Community 93 - "disclaimers"
Cohesion: 0.29
Nodes (7): items, type, type, disclaimers, resource_ids, items, type

### Community 94 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 95 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 96 - "README.md"
Cohesion: 0.18
Nodes (5): Decisions and interfaces, Development branch full-feature integration, Limitations, Scope, Verification

### Community 97 - "api.generated.ts"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

### Community 99 - "Backend"
Cohesion: 0.50
Nodes (3): Backend, Placement rules, Run and verify

### Community 100 - "chat.py"
Cohesion: 0.24
Nodes (12): chat(), _fallback(), ChatResponse, SchemeResult, Scoped assistant for questions about the Scheme Navigator. A free-text box is…, Renders answers using their questionnaire labels. Raw keys like…, Explains the person's results from the evaluator alone. "Why did I match this?"…, Answers from the evaluator where possible, and always routes onward. No apology… (+4 more)

### Community 101 - "Frontend"
Cohesion: 0.33
Nodes (5): Frontend, Placement rules, Run and verify, Run locally, Visual system and mobile behaviour

### Community 102 - "routing.ts"
Cohesion: 0.50
Nodes (3): AppPath, AppRoute, resolveAppRoute()

### Community 103 - "Supabase"
Cohesion: 0.40
Nodes (4): Directory responsibilities, Local workflow, Shared project workflow, Supabase

### Community 104 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 105 - "graphify reference: commit hook and native AGENTS.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native AGENTS.md integration, graphify reference: commit hook and native AGENTS.md integration

### Community 106 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 107 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 108 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 109 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 144 - "evaluate_all"
Cohesion: 0.22
Nodes (8): evaluate_all(), EvaluationResponse, fixture, It comes from the rules engine, which is the authoritative part. Opening with…, results(), test_deterministic_reply_is_laid_out_to_be_skimmed(), test_deterministic_reply_never_apologises_for_itself(), TestEvaluateAll

### Community 150 - "required"
Cohesion: 0.14
Nodes (14): PreparatoryActionResponse, id, required, additionalProperties, required, type, description, detail (+6 more)

### Community 151 - "ShockScenarioPayload"
Cohesion: 0.33
Nodes (6): ShockScenarioPayload, additionalProperties, required, type, income_reduction_percent, weeks_affected

## Knowledge Gaps
- **667 isolated node(s):** `Settings`, `$schema`, `$id`, `title`, `description` (+662 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 937 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ShockScenario` connect `ShockScenario` to `scenario_simulator/router.py`, `BaselineFinances`, `scenario_simulator/engine.py`, `result_to_dict`, `simulate`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `simulate()` connect `simulate` to `scenario_simulator/router.py`, `BaselineFinances`, `scenario_simulator/engine.py`, `result_to_dict`, `ShockScenario`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `ResilienceJarService` connect `ResilienceJarService` to `ServiceTestCase`, `serializers.py`, `ContributionRepository`, `resilience_jar/service.py`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `ShockScenario` (e.g. with `_horizon_weeks()` and `_income_factor()`) actually correct?**
  _`ShockScenario` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `ResilienceJarService` (e.g. with `create_router()` and `AmountGoal`) actually correct?**
  _`ResilienceJarService` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `simulate()` (e.g. with `BaselineFinances` and `ShockScenario`) actually correct?**
  _`simulate()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `evaluate_rule()` (e.g. with `SchemeRule` and `SchemeStatus`) actually correct?**
  _`evaluate_rule()` has 2 INFERRED edges - model-reasoned connections that need verification._