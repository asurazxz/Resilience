# Graph Report - Resilience  (2026-09-03)

## Corpus Check
- 297 files · ~159,368 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3049 nodes · 5931 edges · 193 communities (144 shown, 33 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 192 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1d621a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ApiModel
- ResilienceJarPage.tsx
- ScenarioSimulatorPage.tsx
- test_scheme_navigator_chat.py
- test_engine.py
- savings_goals/service.py
- scheme-navigator/api.ts
- test_resilience_jar_sql.py
- WeeklySurplus
- test_scheme_navigator_explainer.py
- calculate_financial_score
- current_user_id
- scenario_simulator/engine.py
- properties
- ShockScenario
- App.tsx
- resilience_jar/routes.py
- evaluate_rule
- income-reality/types.ts
- ResilienceJarService
- properties
- Lessons Learnt
- scheme_navigator/schemas.py
- scripts
- test_scheme_navigator_api.py
- properties
- compilerOptions
- What You Must Do When Invoked
- What You Must Do When Invoked
- ServiceTestCase
- properties
- ContributionRepository
- scenario_simulator/router.py
- foundation_input/routes.py
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
- validate.py
- Agent Session Log
- $defs
- required
- properties
- compress.py
- Scheme Navigator — Questionnaire & Deterministic Evaluator
- recommend_weekly_savings
- simulate
- weeks
- required
- properties
- scheme_navigator.py
- properties
- required
- properties
- properties
- Scenario Simulator
- Initial Prototype Collaboration Scaffold
- compilerOptions
- cpf_rate_bps
- required
- PlatformEarning
- properties
- required
- caveman-compress/README.md
- dependencies
- Feature 1 — Foundation Input
- required
- required
- sql_repositories.py
- lib/api.ts
- foundation.ts
- graphify reference: extra exports and benchmark
- result_to_dict
- graphify reference: extra exports and benchmark
- required
- Feature 03 — Emergency Fund
- IncomeRealityRequest
- cli.py
- required
- null
- Codebase Structure
- Feature 2 — Income Reality Engine
- frontend/package.json
- scripts
- Resilience
- Mandatory Agent Rules
- recorded_cpf_cents
- savings/api.ts
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- Development branch full-feature integration
- FinancialScoreCard.tsx
- required
- Backend
- weekly_amounts
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
- Financial Score
- throwaway_user
- Path
- EssentialExpense
- cavecrew/SKILL.md
- Caveman Help
- Caveman Compress
- caveman/SKILL.md
- caveman-commit
- caveman-explore/package.json
- caveman-learn/package.json
- caveman-review
- resilience_jar/service.py
- foundation_input/service.py
- Emergency Fund and Savings Goals — calculation model
- Review Caveman evidence
- Manage eval-gated experiments
- caveman-setup/SKILL.md
- get_bootstrap
- Evaluate an optimization observation
- caveman-stats
- evaluator.py
- Feature — Savings Goals
- benchmark.py
- caveman-discover/SKILL.md
- skills/caveman-learn — the Caveman Learn editing skill (MIT, public)
- caveman-learn skill
- caveman-explore/tests/skill-file.test.mjs
- $defs
- caveman-learn/tests/skill-file.test.mjs
- scripts/__init__.py
- investigate-first/SKILL.md
- lean-build/SKILL.md
- migration/SKILL.md
- safe-refactor/SKILL.md
- surgical-patch/SKILL.md
- verify-and-stop/SKILL.md
- savings_goals/__init__.py
- _fallback
- SavingsGoalChart.tsx
- SavingsPage.tsx
- SqlContributionRepository
- Transaction
- RecurringWorkCost

## God Nodes (most connected - your core abstractions)
1. `ShockScenario` - 51 edges
2. `calculate_financial_score()` - 42 edges
3. `Lessons Learnt` - 39 edges
4. `DomainError` - 37 edges
5. `evaluate_rule()` - 37 edges
6. `simulate()` - 36 edges
7. `throwaway_user()` - 36 edges
8. `ResilienceJarService` - 35 edges
9. `current_user_id()` - 30 edges
10. `apiRequest()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `throwaway_user()` --indirect_call--> `current_user_id()`  [INFERRED]
  backend/tests/integration/db_support.py → backend/app/core/auth.py
- `data_reset()` --uses--> `DomainError`  [INFERRED]
  backend/app/features/foundation_input/routes.py → backend/app/core/errors.py
- `ResilienceJarRouteTests` --uses--> `DomainError`  [INFERRED]
  backend/tests/integration/test_resilience_jar_routes.py → backend/app/core/errors.py
- `ServiceTestCase` --uses--> `DomainError`  [INFERRED]
  backend/tests/unit/test_resilience_jar_service.py → backend/app/core/errors.py
- `emergency_fund_balance()` --uses--> `Profile`  [INFERRED]
  backend/app/features/emergency_fund_ledger.py → backend/app/db/models.py

## Import Cycles
- None detected.

## Communities (193 total, 33 thin omitted)

### Community 0 - "ApiModel"
Cohesion: 0.15
Nodes (15): ApiModel, EarningInput, FoundationBootstrap, InputSnapshot, OnboardingRequest, ProfileUpdate, BaseModel, model_validator (+7 more)

### Community 1 - "ResilienceJarPage.tsx"
Cohesion: 0.06
Nodes (60): HttpResilienceJarApi, jarPath(), readCachedSummary(), ResilienceJarApi, writeCachedSummary(), clone(), fixtureRecommendationAmounts, FixtureResilienceJarApi (+52 more)

### Community 2 - "ScenarioSimulatorPage.tsx"
Cohesion: 0.06
Nodes (53): ScenarioSimulatorPage, ResultSource, simulateScenario(), SimulationOutcome, BaselineEditor(), BaselineEditorProps, Bar, BufferChart() (+45 more)

### Community 3 - "test_scheme_navigator_chat.py"
Cohesion: 0.07
Nodes (55): build_chat_prompt(), chat(), ChatMessage, Renders the user-turn prompt. Pure, so tests can assert on it exactly., Answers the latest message, degrading rather than failing., ChatMessage, Any, ChatMessage (+47 more)

### Community 4 - "test_engine.py"
Cohesion: 0.09
Nodes (49): IncomeAssumptions, Editable default assumptions for the Income Reality Engine. These are prototype…, calculate_cpf_cents(), calculate_income_reality(), calculate_recent_trend(), calculate_week_breakdown(), PlatformEarning, Deterministic Income Reality calculations. Pure, framework-independent… (+41 more)

### Community 5 - "savings_goals/service.py"
Cohesion: 0.08
Nodes (50): A named user savings goal. ``goal_type`` is always ``savings`` here., SavingsGoal, SavingsGoalContribution, add_contribution(), create_goal(), delete_contribution(), delete_goal(), list_goals() (+42 more)

### Community 6 - "scheme-navigator/api.ts"
Cohesion: 0.06
Nodes (47): SchemeNavigator, evaluateAnswers(), EvaluationRequest, explainResult(), ExplanationRequest, fetchQuestionnaire(), sendChatMessage(), sampleResult (+39 more)

### Community 7 - "test_resilience_jar_sql.py"
Cohesion: 0.16
Nodes (13): EmergencyFundPlan, JarPlan, _plan_from_record(), _plan_values(), JarPlan, SqlFinancialContextRepository, SqlPlanRepository, The SQL adapters and the jar HTTP routes against the real database. (+5 more)

### Community 8 - "WeeklySurplus"
Cohesion: 0.13
Nodes (9): build_demo_service(), InMemoryContributionRepository, InMemoryFinancialContextRepository, InMemoryPlanRepository, Contribution, date, JarPlan, In-memory twin of the SQL context, including the emergency-fund balance. The… (+1 more)

### Community 9 - "test_scheme_navigator_explainer.py"
Cohesion: 0.09
Nodes (46): build_prompt(), explain(), _fallback(), ExplanationResponse, SchemeResult, Plain-language explanation of an already-decided scheme result. The safety…, Deterministic explanation used whenever the LLM is unavailable., Explains ``result`` in plain language, degrading rather than failing. (+38 more)

### Community 10 - "calculate_financial_score"
Cohesion: 0.07
Nodes (82): _apply_band_cap(), _band_for(), calculate_financial_score(), _cash_flow_component(), _clamp_fraction(), _clamp_int(), ComponentResult, DepositInput (+74 more)

### Community 11 - "current_user_id"
Cohesion: 0.08
Nodes (42): AsyncClient, current_user_id(), _decode(), _get_http_client(), _issuer(), _jwks_client(), Any, HTTPException (+34 more)

### Community 12 - "scenario_simulator/engine.py"
Cohesion: 0.11
Nodes (30): _baseline_summary(), BaselineSummary, ScenarioSummary, Deterministic shock-model calculations. This module has no framework, database,…, Scale a non-negative cent amount by a fraction, truncating to whole cents.…, _scaled(), _scenario_summary(), build_actions() (+22 more)

### Community 13 - "properties"
Cohesion: 0.06
Nodes (35): type, type, WeekProjectionResponse, type, type, essential_expenses_cents, gross_earnings_cents, work_costs_cents (+27 more)

### Community 14 - "ShockScenario"
Cohesion: 0.14
Nodes (12): _horizon_weeks(), _income_factor(), project_weeks(), Return the earnings multiplier for a week as an exact fraction. Recovery ramps…, Project each week of the scenario from the first affected week onward., One financial shock the user wants to prepare for. Time away from work is the…, ShockScenario, HorizonTests (+4 more)

### Community 15 - "App.tsx"
Cohesion: 0.09
Nodes (30): App(), EMPTY_ONBOARDING_DRAFT, Entries(), ESSENTIAL_CATEGORIES, FinancialDetailsSection(), IncomeReality(), isDesktopViewport(), NAV_LINKS (+22 more)

### Community 16 - "resilience_jar/routes.py"
Cohesion: 0.15
Nodes (21): CompletionProjection, GoalReview, JarSummary, Milestone, Recommendation, completion_projection_dict(), contribution_dict(), goal_dict() (+13 more)

### Community 17 - "evaluate_rule"
Cohesion: 0.11
Nodes (15): evaluate_rule(), SchemeResult, Evaluate a single rule against the answers collected so far. Missing…, parametrize, Tests for the deterministic scheme evaluator. Covers matched, not-matched,…, A minimal synthetic rule exercising every supported operator, kept independent…, Answers arrive as JSON from a browser; the evaluator must never crash on a…, TestAnswerCoercion (+7 more)

### Community 18 - "income-reality/types.ts"
Cohesion: 0.12
Nodes (26): IncomeRealityPage, CurrentWeekCard(), mondayOf(), weekIncome(), fetchIncomeBreakdown(), AssumptionsEditor(), AssumptionsEditorProps, IncomeBreakdownCard() (+18 more)

### Community 19 - "ResilienceJarService"
Cohesion: 0.20
Nodes (8): Contribution, GoalReview, JarPlan, JarSummary, ``B``, optionally with one entry's effect backed out of it., ResilienceJarService, ContributionWrite, PlanPatch

### Community 20 - "properties"
Cohesion: 0.11
Nodes (18): type, description, minimum, type, type, type, average_net_income_cents, conservative_weekly_income_cents (+10 more)

### Community 21 - "Lessons Learnt"
Cohesion: 0.05
Nodes (40): 2026-09-01 — Audit every reachable Git reference, 2026-09-01 — Brace PowerShell variables before punctuation, 2026-09-01 — Create a package.json before ad hoc `npm install` in a scratch directory, 2026-09-01 — Distinguish negative checks from command errors, 2026-09-01 — Purge only verified sensitive objects, 2026-09-01 — Refresh PATH from the registry after a mid-session winget install, 2026-09-01 — Replace existing files with update patches, 2026-09-01 — Request repository-metadata write access (+32 more)

### Community 22 - "scheme_navigator/schemas.py"
Cohesion: 0.09
Nodes (32): Scoped assistant for questions about the Scheme Navigator. A free-text box is…, Renders answers using their questionnaire labels. Raw keys like…, Questionnaire labels the person has not filled in yet. Derived from the fields…, _render_answers(), unanswered_questions(), Registry of every questionnaire field a scheme rule can reference. A rule's…, build_questionnaire(), get_required_field_keys() (+24 more)

### Community 23 - "scripts"
Cohesion: 0.07
Nodes (26): devDependencies, jsdom, supabase, engines, node, npm, jsdom, name (+18 more)

### Community 24 - "test_scheme_navigator_api.py"
Cohesion: 0.08
Nodes (18): _matched_result(), Any, fixture, parametrize, Integration tests exercising the Scheme Navigator through FastAPI., With no API key the endpoint must still answer, not 500., The frontend posts ``{"rule_id": ..., "answers": {...}}`` (snake_case, matching…, The chat panel must never surface a 500 because the LLM is down. (+10 more)

### Community 25 - "properties"
Cohesion: 0.14
Nodes (14): format, type, properties, format, type, enum, minLength, type (+6 more)

### Community 26 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+18 more)

### Community 27 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 28 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 29 - "ServiceTestCase"
Cohesion: 0.11
Nodes (12): APIRouter, create_router(), Create the feature router without coupling it to shared app composition., ContributionPatch, ContributionWrite, _normalised_note(), OpeningBalanceRequest, PlanPatch (+4 more)

### Community 30 - "properties"
Cohesion: 0.18
Nodes (11): items, type, $ref, properties, contributions, recommendation, weekly_essential_expenses_cents, additionalProperties (+3 more)

### Community 31 - "ContributionRepository"
Cohesion: 0.14
Nodes (8): ContributionRepository, FinancialContextRepository, PlanRepository, Contribution, date, JarPlan, Protocol, date

### Community 32 - "scenario_simulator/router.py"
Cohesion: 0.17
Nodes (18): Depends, post, UUID, FastAPI routes for the Scenario Simulator. Workstream 1 mounts this router on…, simulate_scenario(), BaselineFinancesPayload, BaselineSummaryResponse, OfficialResourceResponse (+10 more)

### Community 33 - "foundation_input/routes.py"
Cohesion: 0.22
Nodes (27): alias, bootstrap(), data_reset(), essential_delete(), essential_put(), onboarding(), profile_update(), date (+19 more)

### Community 34 - "required"
Cohesion: 0.11
Nodes (18): required, required, buffer_at_horizon_cents, buffer_holds_through_horizon, buffer_runway_weeks, first_shortfall_week, full_income_resumes_week, horizon_weeks (+10 more)

### Community 35 - "BaselineFinances"
Cohesion: 0.20
Nodes (5): BaselineFinances, The user's normal week, as confirmed in the income and expense flows., _require_non_negative(), BufferRunwayTests, Cents

### Community 36 - "properties"
Cohesion: 0.12
Nodes (17): minimum, type, type, description, type, cpf_cents, gross_earnings_cents, net_income_cents (+9 more)

### Community 37 - "properties"
Cohesion: 0.12
Nodes (17): minimum, type, maximum, minimum, type, enum, amount_cents, history_weeks_used (+9 more)

### Community 38 - "enum"
Cohesion: 0.12
Nodes (16): properties, remaining_cents, status, minimum, type, enum, active, complete (+8 more)

### Community 39 - "items"
Cohesion: 0.12
Nodes (17): additionalProperties, properties, required, type, items, type, enum, milestones (+9 more)

### Community 40 - "properties"
Cohesion: 0.08
Nodes (31): type, type, type, type, type, type, minimum, type (+23 more)

### Community 41 - "properties"
Cohesion: 0.12
Nodes (17): ShockScenarioPayload, maximum, minimum, type, income_reduction_percent, recovery_weeks, unexpected_cost_cents, weeks_affected (+9 more)

### Community 42 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, jsdom, openapi-typescript, @playwright/test, @tailwindcss/vite, @types/node, vite, @vitejs/plugin-react (+9 more)

### Community 43 - "properties"
Cohesion: 0.14
Nodes (16): minimum, type, minimum, type, minimum, type, type, minimum (+8 more)

### Community 44 - "validate.py"
Cohesion: 0.13
Nodes (23): count_bullets(), extract_code_blocks(), extract_fenced_spans(), extract_headings(), extract_indented_code_blocks(), extract_inline_codes(), extract_paths(), extract_urls() (+15 more)

### Community 45 - "Agent Session Log"
Cohesion: 0.08
Nodes (24): 2026-09-01 — Income Reality Engine (workstream 2) initial implementation, 2026-09-01 — Income Reality Engine (workstream 2) integration seam and live demo, 2026-09-01 — Income Reality Engine (workstream 2) test execution follow-up, 2026-09-01 — Initial collaboration scaffold, 2026-09-01 — Purge sensitive objects from local Git storage, 2026-09-01 — Remove private context from Git history, 2026-09-01 — Shared codebase folder scaffold, 2026-09-02 — Add Graphify cross-agent project integration (+16 more)

### Community 46 - "$defs"
Cohesion: 0.17
Nodes (11): additionalProperties, type, $defs, AssumptionsIn, WeekBreakdownOut, description, $id, $schema (+3 more)

### Community 47 - "required"
Cohesion: 0.13
Nodes (14): additionalProperties, $id, weekly_essential_expenses_cents, required, $schema, title, type, completion_projection (+6 more)

### Community 48 - "properties"
Cohesion: 0.13
Nodes (15): $ref, properties, goal, target_amount_cents, target_frequency, updated_at, weekly_target_cents, minimum (+7 more)

### Community 49 - "compress.py"
Cohesion: 0.12
Nodes (25): build_compress_prompt(), build_fix_prompt(), call_claude(), _compress_file_locked(), first_nonblank_line(), mask_code_blocks(), r"""Strip an outer ```markdown ... ``` fence when it wraps the ENTIRE output.…, Write ``text`` to ``path`` atomically as UTF-8. Path.write_text() truncates the… (+17 more)

### Community 50 - "Scheme Navigator — Questionnaire & Deterministic Evaluator"
Cohesion: 0.14
Nodes (14): Current assumptions (reversible), Interfaces, Interfaces added in the explainer pass, Known limitations / follow-up, No dead ends, Scheme facts come from SupportGoWhere, Scheme Navigator — Questionnaire & Deterministic Evaluator, Tests performed (+6 more)

### Community 51 - "recommend_weekly_savings"
Cohesion: 0.27
Nodes (7): _median(), Fraction, Recommendation, recommend_weekly_savings(), RecommendationTests, week(), RecommendationMethod

### Community 52 - "simulate"
Cohesion: 0.14
Nodes (7): ScenarioResult, Run one scenario and return every figure the results screen displays., simulate(), action_ids(), BaselineTests, OneOffCostTests, ResultContractTests

### Community 53 - "weeks"
Cohesion: 0.12
Nodes (16): $ref, properties, $ref, items, type, items, assumptions_applied, platform_breakdown (+8 more)

### Community 54 - "required"
Cohesion: 0.15
Nodes (13): additionalProperties, required, type, $defs, contribution, goal, oneOf, id (+5 more)

### Community 55 - "properties"
Cohesion: 0.08
Nodes (27): properties, additionalProperties, properties, type, BaselineSummaryResponse, minimum, type, emergency_savings_cents (+19 more)

### Community 56 - "scheme_navigator.py"
Cohesion: 0.07
Nodes (36): chat_turn(), evaluate(), explain_result(), get_llm_client(), get_questionnaire(), ChatResponse, Depends, EvaluationResponse (+28 more)

### Community 57 - "properties"
Cohesion: 0.17
Nodes (12): default, minimum, type, default, type, essential_expenses_cents, platform_earnings, week_start (+4 more)

### Community 58 - "required"
Cohesion: 0.20
Nodes (12): required, required, weekly_essential_expenses_cents, emergency_savings_cents, emergency_savings_weeks_of_essentials, runway_weeks, weekly_fixed_work_costs_cents, weekly_gross_earnings_cents (+4 more)

### Community 59 - "properties"
Cohesion: 0.17
Nodes (12): OfficialResourceResponse, type, type, type, additionalProperties, properties, type, description (+4 more)

### Community 60 - "properties"
Cohesion: 0.11
Nodes (19): PreparatoryActionResponse, type, items, type, type, type, additionalProperties, properties (+11 more)

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
Cohesion: 0.15
Nodes (13): WeeklyEntryIn, essential_expenses_cents, gross_earnings_cents, work_costs_cents, required, additionalProperties, required, type (+5 more)

### Community 66 - "PlatformEarning"
Cohesion: 0.12
Nodes (17): PlatformEarning, minimum, type, examples, minLength, type, additionalProperties, properties (+9 more)

### Community 67 - "properties"
Cohesion: 0.12
Nodes (19): items, type, $ref, SimulationRequest, $ref, actions, baseline, resources (+11 more)

### Community 68 - "required"
Cohesion: 0.20
Nodes (11): ScenarioResultResponse, weeks, additionalProperties, required, type, required, actions, baseline (+3 more)

### Community 69 - "caveman-compress/README.md"
Cohesion: 0.09
Nodes (20): Before / After, Benchmarks, How It Work, <img src="../../docs/assets/dancing-rock.svg" width="20" height="20" alt="rock"/> Caveman (285 tokens), Install, Original (706 tokens), Part of Caveman, Security (+12 more)

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
Cohesion: 0.17
Nodes (12): required, required, amount_cents, as_of_week_start, current_weekly_expenses_cents, expense_change_cents, history_weeks_used, latest_surplus_cents (+4 more)

### Community 74 - "sql_repositories.py"
Cohesion: 0.10
Nodes (35): EmergencyFundContribution, get_engine(), get_session(), emergency_fund_balance(), emergency_fund_net_activity_cents(), EssentialExpense, RecurringWorkCost, UUID (+27 more)

### Community 75 - "lib/api.ts"
Cohesion: 0.10
Nodes (32): { useFoundationMock }, AuthContext, authenticate(), AuthProvider(), AuthValue, readStoredSession(), refreshSession(), storeSession() (+24 more)

### Community 76 - "foundation.ts"
Cohesion: 0.08
Nodes (36): averageWeeklyLeftover(), Overview(), SetbackPlanner(), FoundationContextValue, AdaptedIncomeRealityWeeks, adaptFoundationWeeks(), adaptTransactions(), addDays() (+28 more)

### Community 77 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 78 - "result_to_dict"
Cohesion: 0.24
Nodes (6): ScenarioResult, Return the result as nested dicts and lists, ready for JSON encoding., result_to_dict(), _to_plain(), Guard the response schemas against engine drift. The schemas import pydantic,…, TransportContractTests

### Community 79 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 80 - "required"
Cohesion: 0.12
Nodes (17): additionalProperties, required, type, additionalProperties, required, type, completion_projection, progress (+9 more)

### Community 81 - "Feature 03 — Emergency Fund"
Cohesion: 0.22
Nodes (9): 2026-09-03 changes, Business rules, Feature 03 — Emergency Fund, Frontend flow, Integration, Interfaces, Limitations and follow-up, Scope (+1 more)

### Community 82 - "IncomeRealityRequest"
Cohesion: 0.14
Nodes (14): $ref, IncomeRealityRequest, IncomeRealityResponse, additionalProperties, properties, required, type, additionalProperties (+6 more)

### Community 83 - "cli.py"
Cohesion: 0.19
Nodes (15): main(), print_usage(), backup_dir_for(), Out-of-tree backup dir for filepath, keyed by its parent dir name — kept…, detect_file_type(), _is_code_line(), _is_json_content(), _is_yaml_content() (+7 more)

### Community 84 - "required"
Cohesion: 0.20
Nodes (10): TrendSummaryOut, additionalProperties, required, type, average_net_income_cents, conservative_weekly_income_cents, max_net_income_cents, min_net_income_cents (+2 more)

### Community 85 - "null"
Cohesion: 0.08
Nodes (35): format, type, minimum, type, type, minimum, type, additionalProperties (+27 more)

### Community 86 - "Codebase Structure"
Cohesion: 0.22
Nodes (8): Codebase Structure, Decision, Deferred work, Dependency boundaries, Directory map, Error envelope, Feature map, Validation performed

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

### Community 93 - "savings/api.ts"
Cohesion: 0.13
Nodes (14): KeyFigures(), useSavingsSummary(), goalPath(), HttpSavingsApi, SavingsApi, GoalRowProps, fakeApi(), makeGoal() (+6 more)

### Community 94 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 95 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 96 - "Development branch full-feature integration"
Cohesion: 0.33
Nodes (5): Decisions and interfaces, Development branch full-feature integration, Limitations, Scope, Verification

### Community 97 - "FinancialScoreCard.tsx"
Cohesion: 0.14
Nodes (14): fetchFinancialScore(), FINANCIAL_SCORE_COMPONENT_LINKS, FinancialScore, FinancialScoreBand, FinancialScoreComponent, FinancialScoreComponentId, FinancialScoreComponentStatus, FinancialScoreMissingInput (+6 more)

### Community 98 - "required"
Cohesion: 0.18
Nodes (11): id, required, required, description, detail, last_reviewed, name, resource_ids (+3 more)

### Community 99 - "Backend"
Cohesion: 0.33
Nodes (5): Authentication, Backend, Placement rules, Run and verify, URL prefixes and errors

### Community 100 - "weekly_amounts"
Cohesion: 0.16
Nodes (16): WeeklyEntry, ``S_w = income_w - variable_costs_w - R - E`` per Monday-Sunday week. A ranged…, Same definition as the transaction path, using the week's own snapshots.…, _week_surplus(), daily_amounts(), date, Pure, framework-free spreading of a ranged transaction across calendar days.…, Split ``amount_cents`` evenly across the inclusive day range. Effective end is… (+8 more)

### Community 101 - "Frontend"
Cohesion: 0.33
Nodes (5): Frontend, Placement rules, Run and verify, Run locally, Visual system and mobile behaviour

### Community 102 - "routing.ts"
Cohesion: 0.50
Nodes (3): AppPath, AppRoute, resolveAppRoute()

### Community 103 - "Supabase"
Cohesion: 0.29
Nodes (6): Applying migrations locally, Directory responsibilities, Local workflow, Shared project workflow, Supabase, What is persisted

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

### Community 144 - "Financial Score"
Cohesion: 0.15
Nodes (12): Band cap: no visible buffer, no "resilient" label, `cash_flow` (max 30), Component `detail` text names where to go, Components, `emergency_fund` (max 40), Financial Score, `missingInputs`, `nextStep` (+4 more)

### Community 145 - "throwaway_user"
Cohesion: 0.05
Nodes (60): domain_error_handler(), _envelope(), health(), http_exception_handler(), Any, get, HTTPException, ready() (+52 more)

### Community 146 - "Path"
Cohesion: 0.15
Nodes (17): compress_file(), file_lock(), is_sensitive_path(), lock_path_for(), LockTimeoutError, Path, Raised when another process holds the compress lock past LOCK_WAIT_SECONDS., Cross-session lock path keyed on the same (parent-dir-name, stem) identity… (+9 more)

### Community 147 - "EssentialExpense"
Cohesion: 0.57
Nodes (8): EssentialExpense, EssentialExpenseInput, EssentialExpenseResponse, _apply_essential(), _essential_model(), _essential_response(), put_essential_expense(), EssentialExpense

### Community 148 - "cavecrew/SKILL.md"
Cohesion: 0.14
Nodes (12): cavecrew, Example chaining, How to invoke, Model overrides, See also, What it does, Auto-clarity (inherited), Chaining patterns (+4 more)

### Community 149 - "Caveman Help"
Cohesion: 0.14
Nodes (12): caveman-help, Example output, How to invoke, See also, What it does, Caveman Help, Configure Default Mode, Deactivate (+4 more)

### Community 151 - "Caveman Compress"
Cohesion: 0.17
Nodes (11): Boundaries, Caveman Compress, Compress, Compression Rules, Pattern, Preserve EXACTLY (never modify), Preserve Structure, Process (+3 more)

### Community 152 - "caveman/SKILL.md"
Cohesion: 0.17
Nodes (10): caveman, Example output, How to invoke, See also, What it does, Auto-Clarity, Boundaries, Intensity (+2 more)

### Community 153 - "caveman-commit"
Cohesion: 0.18
Nodes (9): caveman-commit, Example output, How to invoke, See also, What it does, Auto-Clarity, Boundaries, Examples (+1 more)

### Community 154 - "caveman-explore/package.json"
Cohesion: 0.18
Nodes (10): description, files, SKILL.md, license, name, private, scripts, test (+2 more)

### Community 155 - "caveman-learn/package.json"
Cohesion: 0.18
Nodes (10): description, files, SKILL.md, license, name, private, scripts, test (+2 more)

### Community 156 - "caveman-review"
Cohesion: 0.18
Nodes (9): caveman-review, Example output, How to invoke, See also, What it does, Auto-Clarity, Boundaries, Examples (+1 more)

### Community 157 - "resilience_jar/service.py"
Cohesion: 0.12
Nodes (28): calculate_completion_projection(), calculate_milestones(), calculate_progress(), _one_decimal(), CompletionProjection, date, JarPlan, Milestone (+20 more)

### Community 159 - "foundation_input/service.py"
Cohesion: 0.20
Nodes (24): DomainError, Any, Exception, The single application error type rendered by the global handler., Base, EmergencySavingsSnapshot, IdempotencyReceipt, WeeklyEarning (+16 more)

### Community 160 - "Emergency Fund and Savings Goals — calculation model"
Cohesion: 0.17
Nodes (12): 1. Two separate ledgers, 2. Emergency fund balance, 3. Weekly essential expenses, 4.1 Default goal history and the 2026-09-03 backfill, 4. Goal, target, and "reached", 5. Weekly saving target and projection, 6. Recommended weekly saving, 7. Savings goals (+4 more)

### Community 162 - "Review Caveman evidence"
Cohesion: 0.25
Nodes (7): Hard rules, Review Caveman evidence, Step 1 — Load context, Step 2 — Establish baseline, Step 3 — Test the leading explanation with traces, Step 4 — Inspect representative traces, Step 5 — Report

### Community 163 - "Manage eval-gated experiments"
Cohesion: 0.25
Nodes (7): Manage eval-gated experiments, Non-negotiable gates, Step 1 — Load project and experiment, Step 2 — Evaluate evidence, Step 3 — Propose one action, Step 4 — Block unsafe execution, Step 5 — Re-read after external operator action

### Community 164 - "caveman-setup/SKILL.md"
Cohesion: 0.25
Nodes (7): Failure templates (use verbatim, filled in — never soften), Rules (non-negotiable), Step 1 — Find every live LLM callsite, Step 2 — Pick the app slug, Step 3 — Wire each callsite, Step 4 — Verify with one real request, Step 5 — Report

### Community 165 - "get_bootstrap"
Cohesion: 0.36
Nodes (11): Profile, ProfileResponse, complete_onboarding(), ensure_profile(), get_bootstrap(), _profile_response(), FoundationBootstrap, ``latestEmergencySavingsCents`` is the stored opening balance ``O``.… (+3 more)

### Community 166 - "Evaluate an optimization observation"
Cohesion: 0.29
Nodes (6): 1. Read the exact observations, 2. Ask the operator to choose, 3. Design a candidate and paired eval, 4. Apply only the approved candidate, 5. Report observations, not savings, Evaluate an optimization observation

### Community 167 - "caveman-stats"
Cohesion: 0.29
Nodes (5): caveman-stats, Example output, How to invoke, See also, What it does

### Community 168 - "evaluator.py"
Cohesion: 0.31
Nodes (8): _coerce(), coerce_answers(), _coerce_date(), _coerce_number(), _condition_passes(), Deterministic evaluation of scheme rules against user answers. No AI or network…, Return the typed answer, or ``_UNANSWERED`` when it cannot be used. An answer…, Drop unknown keys and anything that does not fit its field's type.

### Community 169 - "Feature — Savings Goals"
Cohesion: 0.29
Nodes (7): Calculations, Feature — Savings Goals, Interfaces, Limitations and follow-up, Scope, Storage, Tests

### Community 170 - "benchmark.py"
Cohesion: 0.60
Nodes (5): benchmark_pair(), count_tokens(), main(), print_table(), Path

### Community 171 - "caveman-discover/SKILL.md"
Cohesion: 0.33
Nodes (5): Step 1 — Inventory the workflows, Step 2 — Name them, Step 3 — Propose, then apply, Step 4 — Verify, Step 5 — Report

### Community 172 - "skills/caveman-learn — the Caveman Learn editing skill (MIT, public)"
Cohesion: 0.40
Nodes (4): Boundary (binding), Install path, Layout, skills/caveman-learn — the Caveman Learn editing skill (MIT, public)

### Community 173 - "caveman-learn skill"
Cohesion: 0.40
Nodes (4): caveman-learn skill, Honesty, Install, What it does

### Community 175 - "$defs"
Cohesion: 0.15
Nodes (12): additionalProperties, type, $defs, BaselineFinancesPayload, ScenarioSummaryResponse, description, $id, oneOf (+4 more)

### Community 188 - "_fallback"
Cohesion: 0.40
Nodes (6): _fallback(), ChatResponse, SchemeResult, Explains the person's results from the evaluator alone. "Why did I match this?"…, Answers from the evaluator where possible, and always routes onward. No apology…, _results_summary()

### Community 189 - "SavingsGoalChart.tsx"
Cohesion: 0.08
Nodes (29): BAND_LABEL, FinancialScoreDial(), shortDate(), TrendTooltip(), weekCosts(), weekIncome(), WeeklyTrendChart(), IncomeTrendChart() (+21 more)

### Community 190 - "SavingsPage.tsx"
Cohesion: 0.22
Nodes (15): TransactionEditor(), singaporeToday(), errorMessage(), GoalRow(), openEdit(), submitContribution(), submitEdit(), SavingsPage() (+7 more)

### Community 195 - "SqlContributionRepository"
Cohesion: 0.30
Nodes (6): Contribution, _contribution_from_record(), Contribution, date, SqlContributionRepository, test_contribution_repository_round_trips_and_scopes_by_user()

### Community 196 - "Transaction"
Cohesion: 0.35
Nodes (11): Transaction, post, transaction_create(), TransactionInput, TransactionResponse, create_transaction(), _optional_text(), Partial update: only fields present in the request body are applied. A full… (+3 more)

### Community 197 - "RecurringWorkCost"
Cohesion: 0.57
Nodes (8): RecurringWorkCost, RecurringWorkCostInput, RecurringWorkCostResponse, _apply_recurring(), put_recurring_cost(), RecurringWorkCost, _recurring_model(), _recurring_response()

## Knowledge Gaps
- **882 isolated node(s):** `name`, `version`, `license`, `private`, `type` (+877 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1316 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Session` connect `sql_repositories.py` to `lib/api.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `get_session()` connect `sql_repositories.py` to `resilience_jar/routes.py`, `foundation_input/routes.py`, `calculate_financial_score`, `savings_goals/service.py`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `current_user_id()` connect `current_user_id` to `scenario_simulator/router.py`, `foundation_input/routes.py`, `test_engine.py`, `savings_goals/service.py`, `calculate_financial_score`, `sql_repositories.py`, `resilience_jar/routes.py`, `throwaway_user`, `scheme_navigator.py`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `ShockScenario` (e.g. with `_horizon_weeks()` and `_income_factor()`) actually correct?**
  _`ShockScenario` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `DomainError` (e.g. with `data_reset()` and `ResilienceJarRouteTests`) actually correct?**
  _`DomainError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `evaluate_rule()` (e.g. with `SchemeRule` and `SchemeStatus`) actually correct?**
  _`evaluate_rule()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _882 weakly-connected nodes found - possible documentation gaps or missing edges._