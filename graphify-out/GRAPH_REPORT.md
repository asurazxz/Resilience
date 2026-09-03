# Graph Report - Resilience  (2026-09-03)

## Corpus Check
- 264 files · ~138,634 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2787 nodes · 5259 edges · 188 communities (138 shown, 35 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 209 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4585b98b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- foundation_input/service.py
- ResilienceJarPage.tsx
- ScenarioSimulatorPage.tsx
- test_scheme_navigator_chat.py
- test_engine.py
- savings_goals/service.py
- scheme-navigator/types.ts
- sql_repositories.py
- WeeklySurplus
- test_scheme_navigator_explainer.py
- LLMUnavailableError
- current_user_id
- scenario_simulator/engine.py
- properties
- ShockScenario
- App.tsx
- resilience_jar/models.py
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
- resilience_jar/service.py
- properties
- ContributionRepository
- scenario_simulator/router.py
- FoundationContext.tsx
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
- examples
- properties
- required
- caveman-compress/README.md
- dependencies
- Feature 1 — Foundation Input
- required
- required
- $defs
- lib/api.ts
- foundation.ts
- graphify reference: extra exports and benchmark
- result_to_dict
- graphify reference: extra exports and benchmark
- required
- Feature 03 — Emergency Fund
- IncomeRealityRequest
- cli.py
- test_resilience_jar_sql.py
- null
- Codebase Structure
- Feature 2 — Income Reality Engine
- frontend/package.json
- scripts
- Resilience
- Mandatory Agent Rules
- recorded_cpf_cents
- apiRequest
- graphify reference: query, path, explain
- graphify reference: query, path, explain
- Development branch full-feature integration
- api.generated.ts
- required
- Backend
- _fallback
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
- IncomeRealityResponse
- WeeklyEntryIn
- Path
- SavingsPage.tsx
- cavecrew/SKILL.md
- Caveman Help
- domain_error_handler
- Caveman Compress
- caveman/SKILL.md
- caveman-commit
- caveman-explore/package.json
- caveman-learn/package.json
- caveman-review
- evaluator.py
- TestClient
- ResilienceJarRouteTests
- Emergency Fund and Savings Goals — calculation model
- Review Caveman evidence
- Manage eval-gated experiments
- caveman-setup/SKILL.md
- main.py
- Evaluate an optimization observation
- caveman-stats
- stub_llm
- Feature — Savings Goals
- benchmark.py
- caveman-discover/SKILL.md
- skills/caveman-learn — the Caveman Learn editing skill (MIT, public)
- caveman-learn skill
- caveman-explore/tests/skill-file.test.mjs
- ._at_least_one_field
- caveman-learn/tests/skill-file.test.mjs
- scripts/__init__.py
- investigate-first/SKILL.md
- lean-build/SKILL.md
- migration/SKILL.md
- safe-refactor/SKILL.md
- surgical-patch/SKILL.md
- verify-and-stop/SKILL.md
- savings_goals/__init__.py

## God Nodes (most connected - your core abstractions)
1. `ShockScenario` - 51 edges
2. `evaluate_rule()` - 37 edges
3. `DomainError` - 36 edges
4. `simulate()` - 36 edges
5. `ResilienceJarService` - 33 edges
6. `Lessons Learnt` - 31 edges
7. `current_user_id()` - 29 edges
8. `ResilienceJarPage()` - 26 edges
9. `apiRequest()` - 26 edges
10. `BaselineFinances` - 24 edges

## Surprising Connections (you probably didn't know these)
- `throwaway_user()` --indirect_call--> `current_user_id()`  [INFERRED]
  backend/tests/integration/db_support.py → backend/app/core/auth.py
- `ResilienceJarRouteTests` --uses--> `DomainError`  [INFERRED]
  backend/tests/integration/test_resilience_jar_routes.py → backend/app/core/errors.py
- `ServiceTestCase` --uses--> `DomainError`  [INFERRED]
  backend/tests/unit/test_resilience_jar_service.py → backend/app/core/errors.py
- `_profile_response()` --uses--> `Profile`  [INFERRED]
  backend/app/features/foundation_input/service.py → backend/app/db/models.py
- `_weekly_cents()` --uses--> `RecurringWorkCost`  [INFERRED]
  backend/app/features/emergency_fund_ledger.py → backend/app/db/models.py

## Import Cycles
- None detected.

## Communities (188 total, 35 thin omitted)

### Community 0 - "foundation_input/service.py"
Cohesion: 0.07
Nodes (98): alias, DomainError, Any, Exception, The single application error type rendered by the global handler., Base, EmergencySavingsSnapshot, EssentialExpense (+90 more)

### Community 1 - "ResilienceJarPage.tsx"
Cohesion: 0.06
Nodes (62): HttpResilienceJarApi, jarPath(), readCachedSummary(), ResilienceJarApi, writeCachedSummary(), clone(), fixtureRecommendationAmounts, FixtureResilienceJarApi (+54 more)

### Community 2 - "ScenarioSimulatorPage.tsx"
Cohesion: 0.06
Nodes (58): ScenarioSimulatorPage, ResultSource, simulateScenario(), SimulationOutcome, BaselineEditor(), BaselineEditorProps, Bar, BufferChart() (+50 more)

### Community 3 - "test_scheme_navigator_chat.py"
Cohesion: 0.07
Nodes (54): build_chat_prompt(), chat(), ChatMessage, Renders the user-turn prompt. Pure, so tests can assert on it exactly., Answers the latest message, degrading rather than failing., ChatMessage, ChatMessage, fixture (+46 more)

### Community 4 - "test_engine.py"
Cohesion: 0.09
Nodes (49): IncomeAssumptions, Editable default assumptions for the Income Reality Engine. These are prototype…, calculate_cpf_cents(), calculate_income_reality(), calculate_recent_trend(), calculate_week_breakdown(), PlatformEarning, Deterministic Income Reality calculations. Pure, framework-independent… (+41 more)

### Community 5 - "savings_goals/service.py"
Cohesion: 0.08
Nodes (50): A named user savings goal. ``goal_type`` is always ``savings`` here., SavingsGoal, SavingsGoalContribution, add_contribution(), create_goal(), delete_contribution(), delete_goal(), list_goals() (+42 more)

### Community 6 - "scheme-navigator/types.ts"
Cohesion: 0.09
Nodes (36): SchemeNavigator, evaluateAnswers(), explainResult(), fetchQuestionnaire(), sendChatMessage(), ChatContext, ChatContextValue, ChatProvider() (+28 more)

### Community 7 - "sql_repositories.py"
Cohesion: 0.11
Nodes (29): EmergencyFundPlan, calculate_completion_projection(), calculate_milestones(), calculate_progress(), _one_decimal(), CompletionProjection, date, JarPlan (+21 more)

### Community 8 - "WeeklySurplus"
Cohesion: 0.12
Nodes (9): build_demo_service(), InMemoryContributionRepository, InMemoryFinancialContextRepository, InMemoryPlanRepository, Contribution, date, JarPlan, In-memory twin of the SQL context, including the emergency-fund balance. The… (+1 more)

### Community 9 - "test_scheme_navigator_explainer.py"
Cohesion: 0.09
Nodes (46): build_prompt(), explain(), _fallback(), ExplanationResponse, SchemeResult, Plain-language explanation of an already-decided scheme result. The safety…, Deterministic explanation used whenever the LLM is unavailable., Explains ``result`` in plain language, degrading rather than failing. (+38 more)

### Community 10 - "LLMUnavailableError"
Cohesion: 0.16
Nodes (8): GroqClient, LLMUnavailableError, Any, LLM transport for the AI features. This module knows how to talk to a model and…, Raised when no answer could be obtained. Callers treat this as "fall back to…, Groq implementation of ``LLMClient``. Groq's OpenAI-compatible API accepts…, FailingClient, Any

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
Cohesion: 0.11
Nodes (29): App(), EMPTY_ONBOARDING_DRAFT, Entries(), ESSENTIAL_CATEGORIES, IncomeReality(), isDesktopViewport(), NAV_LINKS, Onboarding() (+21 more)

### Community 16 - "resilience_jar/models.py"
Cohesion: 0.15
Nodes (22): CompletionProjection, Contribution, GoalReview, JarSummary, Milestone, Recommendation, completion_projection_dict(), contribution_dict() (+14 more)

### Community 17 - "evaluate_rule"
Cohesion: 0.11
Nodes (15): evaluate_rule(), SchemeResult, Evaluate a single rule against the answers collected so far. Missing…, parametrize, Tests for the deterministic scheme evaluator. Covers matched, not-matched,…, A minimal synthetic rule exercising every supported operator, kept independent…, Answers arrive as JSON from a browser; the evaluator must never crash on a…, TestAnswerCoercion (+7 more)

### Community 18 - "income-reality/types.ts"
Cohesion: 0.13
Nodes (25): IncomeRealityPage, fetchIncomeBreakdown(), AssumptionsEditor(), AssumptionsEditorProps, IncomeBreakdownCard(), IncomeBreakdownCardProps, IncomeRealityView(), IncomeRealityViewProps (+17 more)

### Community 19 - "ResilienceJarService"
Cohesion: 0.17
Nodes (9): Resilience Jar feature package., Contribution, GoalReview, JarPlan, JarSummary, ``B``, optionally with one entry's effect backed out of it., ResilienceJarService, ContributionWrite (+1 more)

### Community 20 - "properties"
Cohesion: 0.07
Nodes (28): type, description, minimum, type, TrendSummaryOut, type, type, average_net_income_cents (+20 more)

### Community 21 - "Lessons Learnt"
Cohesion: 0.06
Nodes (32): 2026-09-01 — Audit every reachable Git reference, 2026-09-01 — Brace PowerShell variables before punctuation, 2026-09-01 — Create a package.json before ad hoc `npm install` in a scratch directory, 2026-09-01 — Distinguish negative checks from command errors, 2026-09-01 — Purge only verified sensitive objects, 2026-09-01 — Refresh PATH from the registry after a mid-session winget install, 2026-09-01 — Replace existing files with update patches, 2026-09-01 — Request repository-metadata write access (+24 more)

### Community 22 - "scheme_navigator/schemas.py"
Cohesion: 0.10
Nodes (26): Scoped assistant for questions about the Scheme Navigator. A free-text box is…, Renders answers using their questionnaire labels. Raw keys like…, Questionnaire labels the person has not filled in yet. Derived from the fields…, _render_answers(), unanswered_questions(), Registry of every questionnaire field a scheme rule can reference. A rule's…, build_questionnaire(), get_required_field_keys() (+18 more)

### Community 23 - "scripts"
Cohesion: 0.07
Nodes (26): devDependencies, jsdom, supabase, engines, node, npm, jsdom, name (+18 more)

### Community 24 - "test_scheme_navigator_api.py"
Cohesion: 0.11
Nodes (11): _matched_result(), parametrize, Integration tests exercising the Scheme Navigator through FastAPI., With no API key the endpoint must still answer, not 500., The chat panel must never surface a 500 because the LLM is down., Only user/assistant turns are accepted; no injecting a system turn., test_chat_answers_with_the_model_when_configured(), test_chat_degrades_when_no_model_is_configured() (+3 more)

### Community 25 - "properties"
Cohesion: 0.14
Nodes (14): format, type, properties, format, type, enum, minLength, type (+6 more)

### Community 26 - "compilerOptions"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+17 more)

### Community 27 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 28 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 29 - "resilience_jar/service.py"
Cohesion: 0.12
Nodes (16): APIRouter, create_router(), Create the feature router without coupling it to shared app composition., AmountGoalInput, ContributionPatch, ContributionWrite, CoverageGoalInput, _normalised_note() (+8 more)

### Community 30 - "properties"
Cohesion: 0.18
Nodes (11): items, type, $ref, properties, contributions, recommendation, weekly_essential_expenses_cents, additionalProperties (+3 more)

### Community 31 - "ContributionRepository"
Cohesion: 0.13
Nodes (9): ContributionRepository, FinancialContextRepository, PlanRepository, Contribution, date, JarPlan, Protocol, date (+1 more)

### Community 32 - "scenario_simulator/router.py"
Cohesion: 0.17
Nodes (18): Depends, post, UUID, FastAPI routes for the Scenario Simulator. Workstream 1 mounts this router on…, simulate_scenario(), BaselineFinancesPayload, BaselineSummaryResponse, OfficialResourceResponse (+10 more)

### Community 33 - "FoundationContext.tsx"
Cohesion: 0.29
Nodes (11): EMPTY_BOOTSTRAP, FoundationContext, FoundationProvider(), fetchBootstrap(), bootstrapKey(), cacheBootstrap(), clearOfflineData(), offlineDb (+3 more)

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
Cohesion: 0.10
Nodes (20): 2026-09-01 — Income Reality Engine (workstream 2) initial implementation, 2026-09-01 — Income Reality Engine (workstream 2) integration seam and live demo, 2026-09-01 — Income Reality Engine (workstream 2) test execution follow-up, 2026-09-01 — Initial collaboration scaffold, 2026-09-01 — Purge sensitive objects from local Git storage, 2026-09-01 — Remove private context from Git history, 2026-09-01 — Shared codebase folder scaffold, 2026-09-02 — Add Graphify cross-agent project integration (+12 more)

### Community 46 - "$defs"
Cohesion: 0.13
Nodes (14): additionalProperties, type, $defs, AssumptionsIn, PlatformEarning, description, $id, additionalProperties (+6 more)

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
Nodes (7): _median(), Recommendation, recommend_weekly_savings(), RecommendationTests, week(), Fraction, RecommendationMethod

### Community 52 - "simulate"
Cohesion: 0.14
Nodes (7): ScenarioResult, Run one scenario and return every figure the results screen displays., simulate(), action_ids(), BaselineTests, OneOffCostTests, ResultContractTests

### Community 53 - "weeks"
Cohesion: 0.14
Nodes (14): $ref, properties, $ref, items, type, items, assumptions, platform_breakdown (+6 more)

### Community 54 - "required"
Cohesion: 0.15
Nodes (13): additionalProperties, required, type, $defs, contribution, goal, oneOf, id (+5 more)

### Community 55 - "properties"
Cohesion: 0.08
Nodes (27): properties, additionalProperties, properties, type, BaselineSummaryResponse, minimum, type, emergency_savings_cents (+19 more)

### Community 56 - "scheme_navigator.py"
Cohesion: 0.09
Nodes (33): chat_turn(), evaluate(), explain_result(), get_llm_client(), get_questionnaire(), ChatResponse, Depends, EvaluationResponse (+25 more)

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
Cohesion: 0.18
Nodes (11): WeekBreakdownOut, essential_expenses_cents, gross_earnings_cents, work_costs_cents, additionalProperties, required, type, cpf_cents (+3 more)

### Community 66 - "examples"
Cohesion: 0.18
Nodes (11): minimum, type, examples, minLength, type, properties, gross_cents, platform (+3 more)

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

### Community 74 - "$defs"
Cohesion: 0.15
Nodes (12): additionalProperties, type, $defs, BaselineFinancesPayload, ScenarioSummaryResponse, description, $id, oneOf (+4 more)

### Community 75 - "lib/api.ts"
Cohesion: 0.13
Nodes (19): AuthContext, authenticate(), AuthProvider(), AuthValue, readStoredSession(), refreshSession(), storeSession(), User (+11 more)

### Community 76 - "foundation.ts"
Cohesion: 0.12
Nodes (26): FoundationContextValue, AdaptedIncomeRealityWeeks, adaptFoundationWeeks(), adaptTransactions(), aggregatePlatformEarnings(), platformName(), weeklyAmount(), weeklyNormalisedTotal() (+18 more)

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
Cohesion: 0.25
Nodes (8): IncomeRealityRequest, additionalProperties, required, type, required, weeks, assumptions_applied, trend

### Community 83 - "cli.py"
Cohesion: 0.19
Nodes (15): main(), print_usage(), backup_dir_for(), Out-of-tree backup dir for filepath, keyed by its parent dir name — kept…, detect_file_type(), _is_code_line(), _is_json_content(), _is_yaml_content() (+7 more)

### Community 84 - "test_resilience_jar_sql.py"
Cohesion: 0.06
Nodes (63): EmergencyFundContribution, Profile, get_engine(), get_session(), emergency_fund_balance(), emergency_fund_net_activity_cents(), EssentialExpense, RecurringWorkCost (+55 more)

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

### Community 93 - "apiRequest"
Cohesion: 0.17
Nodes (11): goalPath(), HttpSavingsApi, SavingsApi, SavingsContribution, SavingsContributionCreate, SavingsGoal, SavingsGoalCreate, SavingsGoalList (+3 more)

### Community 94 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 95 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 96 - "Development branch full-feature integration"
Cohesion: 0.33
Nodes (5): Decisions and interfaces, Development branch full-feature integration, Limitations, Scope, Verification

### Community 97 - "api.generated.ts"
Cohesion: 0.33
Nodes (5): components, $defs, operations, paths, webhooks

### Community 98 - "required"
Cohesion: 0.18
Nodes (11): id, required, required, description, detail, last_reviewed, name, resource_ids (+3 more)

### Community 99 - "Backend"
Cohesion: 0.33
Nodes (5): Authentication, Backend, Placement rules, Run and verify, URL prefixes and errors

### Community 100 - "_fallback"
Cohesion: 0.40
Nodes (6): _fallback(), ChatResponse, SchemeResult, Explains the person's results from the evaluator alone. "Why did I match this?"…, Answers from the evaluator where possible, and always routes onward. No apology…, _results_summary()

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

### Community 144 - "IncomeRealityResponse"
Cohesion: 0.25
Nodes (8): $ref, IncomeRealityResponse, additionalProperties, properties, type, assumptions_applied, trend, $ref

### Community 145 - "WeeklyEntryIn"
Cohesion: 0.40
Nodes (5): WeeklyEntryIn, additionalProperties, required, type, week_start

### Community 146 - "Path"
Cohesion: 0.15
Nodes (17): compress_file(), file_lock(), is_sensitive_path(), lock_path_for(), LockTimeoutError, Path, Raised when another process holds the compress lock past LOCK_WAIT_SECONDS., Cross-session lock path keyed on the same (parent-dir-name, stem) identity… (+9 more)

### Community 147 - "SavingsPage.tsx"
Cohesion: 0.20
Nodes (13): SavingsPage, TransactionEditor(), errorMessage(), FundOverview(), GoalCard(), submit(), GoalCardProps, SavingsPage() (+5 more)

### Community 148 - "cavecrew/SKILL.md"
Cohesion: 0.14
Nodes (12): cavecrew, Example chaining, How to invoke, Model overrides, See also, What it does, Auto-clarity (inherited), Chaining patterns (+4 more)

### Community 149 - "Caveman Help"
Cohesion: 0.14
Nodes (12): caveman-help, Example output, How to invoke, See also, What it does, Caveman Help, Configure Default Mode, Deactivate (+4 more)

### Community 150 - "domain_error_handler"
Cohesion: 0.28
Nodes (11): domain_error_handler(), _envelope(), http_exception_handler(), Any, HTTPException, _request_id(), validation_error_handler(), exception_handler (+3 more)

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

### Community 157 - "evaluator.py"
Cohesion: 0.31
Nodes (8): _coerce(), coerce_answers(), _coerce_date(), _coerce_number(), _condition_passes(), Deterministic evaluation of scheme rules against user answers. No AI or network…, Return the typed answer, or ``_UNANSWERED`` when it cannot be used. An answer…, Drop unknown keys and anything that does not fit its field's type.

### Community 158 - "TestClient"
Cohesion: 0.28
Nodes (6): test_income_reality_router_is_mounted_in_shared_app(), test_bootstrap_and_week_revision_contract(), test_reset_requires_confirmation_and_returns_empty_profile(), test_week_id_cannot_be_reused_for_a_different_week(), test_health_endpoint(), TestClient

### Community 160 - "Emergency Fund and Savings Goals — calculation model"
Cohesion: 0.22
Nodes (9): 1. Two separate ledgers, 2. Emergency fund balance, 3. Weekly essential expenses, 4. Goal, target, and "reached", 5. Weekly saving target and projection, 6. Recommended weekly saving (unchanged), 7. Savings goals, 8. Worked example (+1 more)

### Community 162 - "Review Caveman evidence"
Cohesion: 0.25
Nodes (7): Hard rules, Review Caveman evidence, Step 1 — Load context, Step 2 — Establish baseline, Step 3 — Test the leading explanation with traces, Step 4 — Inspect representative traces, Step 5 — Report

### Community 163 - "Manage eval-gated experiments"
Cohesion: 0.25
Nodes (7): Manage eval-gated experiments, Non-negotiable gates, Step 1 — Load project and experiment, Step 2 — Evaluate evidence, Step 3 — Propose one action, Step 4 — Block unsafe execution, Step 5 — Re-read after external operator action

### Community 164 - "caveman-setup/SKILL.md"
Cohesion: 0.25
Nodes (7): Failure templates (use verbatim, filled in — never soften), Rules (non-negotiable), Step 1 — Find every live LLM callsite, Step 2 — Pick the app slug, Step 3 — Wire each callsite, Step 4 — Verify with one real request, Step 5 — Report

### Community 165 - "main.py"
Cohesion: 0.29
Nodes (6): health(), get, ready(), request_id_middleware(), Write the live application's OpenAPI document to contracts/openapi. Run from…, middleware

### Community 166 - "Evaluate an optimization observation"
Cohesion: 0.29
Nodes (6): 1. Read the exact observations, 2. Ask the operator to choose, 3. Design a candidate and paired eval, 4. Apply only the approved candidate, 5. Report observations, not savings, Evaluate an optimization observation

### Community 167 - "caveman-stats"
Cohesion: 0.29
Nodes (5): caveman-stats, Example output, How to invoke, See also, What it does

### Community 168 - "stub_llm"
Cohesion: 0.33
Nodes (5): Any, fixture, Overrides the model dependency so no test reaches the network., stub_llm(), StubClient

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

## Knowledge Gaps
- **837 isolated node(s):** `name`, `version`, `license`, `private`, `type` (+832 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1215 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Session` connect `test_resilience_jar_sql.py` to `lib/api.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `DomainError` connect `foundation_input/service.py` to `scenario_simulator/router.py`, `savings_goals/service.py`, `main.py`, `sql_repositories.py`, `ResilienceJarService`, `test_resilience_jar_sql.py`, `domain_error_handler`, `scheme_navigator.py`, `resilience_jar/service.py`, `ResilienceJarRouteTests`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `get_session()` connect `test_resilience_jar_sql.py` to `foundation_input/service.py`, `savings_goals/service.py`, `resilience_jar/service.py`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `ShockScenario` (e.g. with `_horizon_weeks()` and `_income_factor()`) actually correct?**
  _`ShockScenario` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `evaluate_rule()` (e.g. with `SchemeRule` and `SchemeStatus`) actually correct?**
  _`evaluate_rule()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `DomainError` (e.g. with `data_reset()` and `ResilienceJarRouteTests`) actually correct?**
  _`DomainError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `simulate()` (e.g. with `BaselineFinances` and `ShockScenario`) actually correct?**
  _`simulate()` has 2 INFERRED edges - model-reasoned connections that need verification._