# Graph Report - Resilience  (2026-09-04)

## Corpus Check
- 233 files · ~111,264 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2606 nodes · 5566 edges · 150 communities (119 shown, 19 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 206 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `810ebab3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- foundation_input/service.py
- ResilienceJarPage.tsx
- ScenarioSimulatorPage.tsx
- test_scheme_navigator_chat.py
- test_engine.py
- DomainError
- scheme-navigator/api.ts
- emergency_fund_ledger.py
- WeeklySurplus
- test_scheme_navigator_explainer.py
- calculate_financial_score
- current_user_id
- scenario_simulator/engine.py
- properties
- ShockScenario
- App.tsx
- foundation_input/routes.py
- evaluate_rule
- income-reality/types.ts
- .update_contribution
- properties
- scheme_navigator/schemas.py
- chat
- scripts
- test_scheme_navigator_api.py
- properties
- compilerOptions
- AuthContext.tsx
- ApiModel
- resilience_jar/service.py
- properties
- ContributionRepository
- scenario_simulator/router.py
- EssentialExpense
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
- SavingsGoalChart.tsx
- timedelta
- $defs
- required
- properties
- SavingsPage.tsx
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
- Setback Planner
- resilience_jar/models.py
- compilerOptions
- cpf_rate_bps
- required
- PlatformEarning
- properties
- required
- integer
- dependencies
- Foundation Input
- required
- required
- foundation_input/schemas.py
- apiRequest
- foundation.ts
- SimulationRequest
- result_to_dict
- main.py
- required
- Feature 03 — Emergency Fund
- IncomeRealityRequest
- required
- required
- null
- Codebase Structure
- Income Reality
- frontend/package.json
- scripts
- Resilience
- .get_summary
- recorded_cpf_cents
- savings/api.ts
- SqlFinancialContextRepository
- formatMoney
- ._at_least_one_field
- FinancialScoreCard.tsx
- required
- Backend
- weekly_amounts
- Frontend
- routing.ts
- LLMUnavailableError
- disclaimers
- $defs
- Feature — Savings Goals
- ShockScenarioPayload
- tsconfig.json
- AGENTS.md
- core/__init__.py
- db/__init__.py
- foundation_input/__init__.py
- app/__init__.py
- tests/__init__.py
- integration/__init__.py
- ResilienceJarRouteTests
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
- Transaction
- Supabase
- calculations.py
- db_support.py
- Emergency Fund and Savings Goals — calculation model
- README.md
- test_foundation_api.py
- scenario-simulator.schema.json
- savings_goals/__init__.py
- WeeklyTrendChart.tsx
- sql_repositories.py

## God Nodes (most connected - your core abstractions)
1. `ShockScenario` - 51 edges
2. `calculate_financial_score()` - 42 edges
3. `DomainError` - 37 edges
4. `evaluate_rule()` - 37 edges
5. `simulate()` - 36 edges
6. `throwaway_user()` - 36 edges
7. `ResilienceJarService` - 35 edges
8. `current_user_id()` - 30 edges
9. `apiRequest()` - 29 edges
10. `LLMUnavailableError` - 27 edges

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

## Communities (150 total, 19 thin omitted)

### Community 0 - "foundation_input/service.py"
Cohesion: 0.16
Nodes (41): Base, EmergencyFundContribution, EmergencySavingsSnapshot, IdempotencyReceipt, Profile, RecurringWorkCost, WeeklyEarning, WeeklyEntry (+33 more)

### Community 1 - "ResilienceJarPage.tsx"
Cohesion: 0.07
Nodes (58): HttpResilienceJarApi, jarPath(), readCachedSummary(), ResilienceJarApi, writeCachedSummary(), clone(), fixtureRecommendationAmounts, FixtureResilienceJarApi (+50 more)

### Community 2 - "ScenarioSimulatorPage.tsx"
Cohesion: 0.06
Nodes (52): ResultSource, simulateScenario(), SimulationOutcome, BaselineEditor(), BaselineEditorProps, Bar, BufferChart(), BufferChartProps (+44 more)

### Community 3 - "test_scheme_navigator_chat.py"
Cohesion: 0.06
Nodes (56): build_chat_prompt(), ChatMessage, Renders the user-turn prompt. Pure, so tests can assert on it exactly., evaluate_all(), EvaluationResponse, ChatMessage, FailingClient, Any (+48 more)

### Community 4 - "test_engine.py"
Cohesion: 0.09
Nodes (49): IncomeAssumptions, Editable default assumptions for the Income Reality Engine. These are prototype…, calculate_cpf_cents(), calculate_income_reality(), calculate_recent_trend(), calculate_week_breakdown(), PlatformEarning, Deterministic Income Reality calculations. Pure, framework-independent… (+41 more)

### Community 5 - "DomainError"
Cohesion: 0.12
Nodes (39): DomainError, Any, Exception, The single application error type rendered by the global handler., A named user savings goal. ``goal_type`` is always ``savings`` here., SavingsGoal, SavingsGoalContribution, add_contribution() (+31 more)

### Community 6 - "scheme-navigator/api.ts"
Cohesion: 0.06
Nodes (47): SchemeNavigator, evaluateAnswers(), EvaluationRequest, explainResult(), ExplanationRequest, fetchQuestionnaire(), sendChatMessage(), sampleResult (+39 more)

### Community 7 - "emergency_fund_ledger.py"
Cohesion: 0.15
Nodes (17): emergency_fund_balance(), emergency_fund_net_activity_cents(), EssentialExpense, RecurringWorkCost, UUID, The one place emergency-fund money is defined.…, Weekly-normalised amount for one row: monthly amounts become ``* 12 // 52``., ``B = O + D - W`` for the user, or 0 when there is no profile row. (+9 more)

### Community 8 - "WeeklySurplus"
Cohesion: 0.11
Nodes (8): InMemoryContributionRepository, InMemoryFinancialContextRepository, InMemoryPlanRepository, Contribution, date, JarPlan, In-memory twin of the SQL context, including the emergency-fund balance. The…, WeeklySurplus

### Community 9 - "test_scheme_navigator_explainer.py"
Cohesion: 0.08
Nodes (47): build_prompt(), explain(), _fallback(), ExplanationResponse, SchemeResult, Plain-language explanation of an already-decided scheme result. The safety…, Deterministic explanation used whenever the LLM is unavailable., Explains ``result`` in plain language, degrading rather than failing. (+39 more)

### Community 10 - "calculate_financial_score"
Cohesion: 0.07
Nodes (82): _apply_band_cap(), _band_for(), calculate_financial_score(), _cash_flow_component(), _clamp_fraction(), _clamp_int(), ComponentResult, DepositInput (+74 more)

### Community 11 - "current_user_id"
Cohesion: 0.08
Nodes (46): AsyncClient, current_user_id(), _decode(), delete_auth_user(), _get_http_client(), _issuer(), _jwks_client(), Any (+38 more)

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

### Community 16 - "foundation_input/routes.py"
Cohesion: 0.18
Nodes (32): alias, account_delete(), bootstrap(), data_reset(), essential_delete(), essential_put(), onboarding(), profile_update() (+24 more)

### Community 17 - "evaluate_rule"
Cohesion: 0.11
Nodes (15): evaluate_rule(), SchemeResult, Evaluate a single rule against the answers collected so far. Missing…, parametrize, Tests for the deterministic scheme evaluator. Covers matched, not-matched,…, A minimal synthetic rule exercising every supported operator, kept independent…, Answers arrive as JSON from a browser; the evaluator must never crash on a…, TestAnswerCoercion (+7 more)

### Community 18 - "income-reality/types.ts"
Cohesion: 0.13
Nodes (25): IncomeRealityPage, fetchIncomeBreakdown(), AssumptionsEditor(), AssumptionsEditorProps, IncomeBreakdownCard(), IncomeBreakdownCardProps, IncomeRealityView(), IncomeRealityViewProps (+17 more)

### Community 19 - ".update_contribution"
Cohesion: 0.31
Nodes (3): Contribution, ``B``, optionally with one entry's effect backed out of it., ContributionWrite

### Community 20 - "properties"
Cohesion: 0.11
Nodes (18): type, description, minimum, type, type, type, average_net_income_cents, conservative_weekly_income_cents (+10 more)

### Community 21 - "scheme_navigator/schemas.py"
Cohesion: 0.08
Nodes (38): Scoped assistant for questions about the Scheme Navigator. A free-text box is…, Renders answers using their questionnaire labels. Raw keys like…, Questionnaire labels the person has not filled in yet. Derived from the fields…, _render_answers(), unanswered_questions(), _coerce(), coerce_answers(), _coerce_date() (+30 more)

### Community 22 - "chat"
Cohesion: 0.33
Nodes (10): chat(), _fallback(), ChatResponse, SchemeResult, Explains the person's results from the evaluator alone. "Why did I match this?"…, Answers from the evaluator where possible, and always routes onward. No apology…, Answers the latest message, degrading rather than failing., _results_summary() (+2 more)

### Community 23 - "scripts"
Cohesion: 0.07
Nodes (27): devDependencies, jsdom, supabase, engines, node, npm, jsdom, name (+19 more)

### Community 24 - "test_scheme_navigator_api.py"
Cohesion: 0.08
Nodes (18): _matched_result(), Any, fixture, parametrize, Integration tests exercising the Scheme Navigator through FastAPI., With no API key the endpoint must still answer, not 500., The frontend posts ``{"rule_id": ..., "answers": {...}}`` (snake_case, matching…, The chat panel must never surface a 500 because the LLM is down. (+10 more)

### Community 25 - "properties"
Cohesion: 0.14
Nodes (14): format, type, properties, format, type, enum, minLength, type (+6 more)

### Community 26 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx (+18 more)

### Community 27 - "AuthContext.tsx"
Cohesion: 0.14
Nodes (19): AuthContext, authenticate(), AuthProvider(), AuthValue, readStoredSession(), refreshSession(), storeSession(), useAuth() (+11 more)

### Community 28 - "ApiModel"
Cohesion: 0.12
Nodes (17): ApiModel, BaseModel, model_validator, Self, Request and response models for Savings Goals. Responses use the shared…, SavingsGoalContributionCreate, SavingsGoalContributionResponse, SavingsGoalCreate (+9 more)

### Community 29 - "resilience_jar/service.py"
Cohesion: 0.13
Nodes (18): APIRouter, build_demo_service(), create_router(), Create the feature router without coupling it to shared app composition., AmountGoalInput, ContributionPatch, ContributionWrite, CoverageGoalInput (+10 more)

### Community 30 - "properties"
Cohesion: 0.18
Nodes (11): items, type, $ref, properties, contributions, recommendation, weekly_essential_expenses_cents, additionalProperties (+3 more)

### Community 31 - "ContributionRepository"
Cohesion: 0.14
Nodes (8): ContributionRepository, FinancialContextRepository, PlanRepository, Contribution, date, JarPlan, Protocol, date

### Community 32 - "scenario_simulator/router.py"
Cohesion: 0.17
Nodes (18): Depends, post, UUID, FastAPI routes for the Scenario Simulator. Workstream 1 mounts this router on…, simulate_scenario(), BaselineFinancesPayload, BaselineSummaryResponse, OfficialResourceResponse (+10 more)

### Community 33 - "EssentialExpense"
Cohesion: 0.57
Nodes (8): EssentialExpense, EssentialExpenseInput, EssentialExpenseResponse, _apply_essential(), _essential_model(), _essential_response(), put_essential_expense(), EssentialExpense

### Community 34 - "required"
Cohesion: 0.13
Nodes (15): required, buffer_at_horizon_cents, buffer_holds_through_horizon, buffer_runway_weeks, first_shortfall_week, full_income_resumes_week, horizon_weeks, lowest_buffer_cents (+7 more)

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
Cohesion: 0.12
Nodes (17): type, type, type, type, buffer_at_horizon_cents, buffer_holds_through_horizon, lowest_buffer_cents, lowest_buffer_week (+9 more)

### Community 41 - "properties"
Cohesion: 0.12
Nodes (16): minimum, maximum, minimum, type, horizon_weeks, income_reduction_percent, recovery_weeks, unexpected_cost_cents (+8 more)

### Community 42 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, jsdom, openapi-typescript, @playwright/test, @tailwindcss/vite, @types/node, vite, @vitejs/plugin-react (+9 more)

### Community 43 - "properties"
Cohesion: 0.14
Nodes (16): minimum, type, minimum, type, minimum, type, type, minimum (+8 more)

### Community 44 - "SavingsGoalChart.tsx"
Cohesion: 0.22
Nodes (8): buildSavingsProgressSeries(), formatChartDate(), GoalChartTooltip(), SavingsGoalChart(), SavingsGoalChartProps, SavingsProgressPoint, toTimestamp(), SavingsContribution

### Community 45 - "timedelta"
Cohesion: 0.35
Nodes (11): _create(), Coverage for POST/PATCH /foundation/transactions, including occurredUntil., test_create_and_bootstrap_round_trip_occurred_until(), test_create_transaction_rejects_range_over_366_days(), test_update_transaction_clears_range_with_null(), test_update_transaction_full_body_still_works_as_replace(), test_update_transaction_happy_path_partial(), test_update_transaction_ownership_404() (+3 more)

### Community 46 - "$defs"
Cohesion: 0.17
Nodes (11): additionalProperties, type, $defs, AssumptionsIn, WeekBreakdownOut, description, $id, $schema (+3 more)

### Community 47 - "required"
Cohesion: 0.13
Nodes (14): additionalProperties, $id, weekly_essential_expenses_cents, required, $schema, title, type, completion_projection (+6 more)

### Community 48 - "properties"
Cohesion: 0.13
Nodes (15): $ref, properties, goal, target_amount_cents, target_frequency, updated_at, weekly_target_cents, minimum (+7 more)

### Community 49 - "SavingsPage.tsx"
Cohesion: 0.18
Nodes (16): SavingsPage, TransactionEditor(), errorMessage(), GoalRow(), openEdit(), submitContribution(), submitEdit(), GoalRowProps (+8 more)

### Community 50 - "Scheme Navigator — Questionnaire & Deterministic Evaluator"
Cohesion: 0.14
Nodes (14): Current assumptions (reversible), Interfaces, Interfaces added in the explainer pass, Known limitations / follow-up, No dead ends, Scheme facts come from SupportGoWhere, Scheme Navigator — Questionnaire & Deterministic Evaluator, Tests (+6 more)

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
Cohesion: 0.09
Nodes (23): properties, properties, minimum, type, emergency_savings_cents, weekly_essential_expenses_cents, weekly_fixed_work_costs_cents, weekly_gross_earnings_cents (+15 more)

### Community 56 - "scheme_navigator.py"
Cohesion: 0.12
Nodes (26): chat_turn(), evaluate(), explain_result(), get_llm_client(), get_questionnaire(), ChatResponse, Depends, EvaluationResponse (+18 more)

### Community 57 - "properties"
Cohesion: 0.17
Nodes (12): default, minimum, type, default, type, essential_expenses_cents, platform_earnings, week_start (+4 more)

### Community 58 - "required"
Cohesion: 0.20
Nodes (12): required, required, weekly_essential_expenses_cents, emergency_savings_cents, emergency_savings_weeks_of_essentials, runway_weeks, weekly_fixed_work_costs_cents, weekly_gross_earnings_cents (+4 more)

### Community 59 - "properties"
Cohesion: 0.22
Nodes (9): type, type, type, properties, description, last_reviewed, name, url (+1 more)

### Community 60 - "properties"
Cohesion: 0.22
Nodes (9): type, type, properties, detail, id, severity, title, type (+1 more)

### Community 61 - "Setback Planner"
Cohesion: 0.17
Nodes (11): Business rules and assumptions, Deferred, Files, Follow-up, HTTP, Interfaces, Known limitations, Safety boundaries (+3 more)

### Community 62 - "resilience_jar/models.py"
Cohesion: 0.16
Nodes (21): CompletionProjection, GoalReview, JarSummary, Milestone, Recommendation, completion_projection_dict(), contribution_dict(), goal_dict() (+13 more)

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
Cohesion: 0.22
Nodes (11): items, type, $ref, actions, resources, weeks, items, type (+3 more)

### Community 68 - "required"
Cohesion: 0.20
Nodes (11): ScenarioResultResponse, weeks, additionalProperties, required, type, required, actions, baseline (+3 more)

### Community 69 - "integer"
Cohesion: 0.22
Nodes (13): type, type, type, type, type, integer, null, buffer_runway_weeks (+5 more)

### Community 70 - "dependencies"
Cohesion: 0.18
Nodes (11): dexie, dependencies, dexie, react, react-dom, react-router-dom, recharts, react (+3 more)

### Community 71 - "Foundation Input"
Cohesion: 0.22
Nodes (9): Endpoints, Foundation Input, Limitations, Notable fixes, Offline behaviour, PostgreSQL foundation, Setup and environment, Shared contracts other features depend on (+1 more)

### Community 72 - "required"
Cohesion: 0.20
Nodes (10): additionalProperties, required, type, plan, goal, goal_expense_baseline_cents, recommendation_method, target_amount_cents (+2 more)

### Community 73 - "required"
Cohesion: 0.17
Nodes (12): required, required, amount_cents, as_of_week_start, current_weekly_expenses_cents, expense_change_cents, history_weeks_used, latest_surplus_cents (+4 more)

### Community 74 - "foundation_input/schemas.py"
Cohesion: 0.15
Nodes (11): EarningInput, FoundationBootstrap, OnboardingRequest, model_validator, Partial update for a transaction: every field is optional. Only fields present…, TransactionPatch, VariableCostInput, WeeklyEntryUpsert (+3 more)

### Community 75 - "apiRequest"
Cohesion: 0.15
Nodes (20): EMPTY_BOOTSTRAP, FoundationContext, FoundationProvider(), accessTokenProvider(), ApiError, apiRequest(), fetchBootstrap(), isApiErrorBody() (+12 more)

### Community 76 - "foundation.ts"
Cohesion: 0.10
Nodes (30): averageWeeklyLeftover(), Overview(), FoundationContextValue, adaptTransactions(), addDays(), daysInclusive(), hasSplitFixture, SPLIT_FIXTURE_PATH (+22 more)

### Community 77 - "SimulationRequest"
Cohesion: 0.25
Nodes (8): $ref, SimulationRequest, baseline, scenario, $ref, additionalProperties, properties, type

### Community 78 - "result_to_dict"
Cohesion: 0.24
Nodes (6): ScenarioResult, Return the result as nested dicts and lists, ready for JSON encoding., result_to_dict(), _to_plain(), Guard the response schemas against engine drift. The schemas import pydantic,…, TransportContractTests

### Community 79 - "main.py"
Cohesion: 0.18
Nodes (8): health(), get, ready(), request_id_middleware(), Write the live application's OpenAPI document to contracts/openapi. Run from…, test_income_reality_router_is_mounted_in_shared_app(), test_health_endpoint(), middleware

### Community 80 - "required"
Cohesion: 0.12
Nodes (17): additionalProperties, required, type, additionalProperties, required, type, completion_projection, progress (+9 more)

### Community 81 - "Feature 03 — Emergency Fund"
Cohesion: 0.22
Nodes (9): Business rules, Design decisions, Feature 03 — Emergency Fund, Frontend flow, Integration, Interfaces, Limitations and follow-up, Scope (+1 more)

### Community 82 - "IncomeRealityRequest"
Cohesion: 0.14
Nodes (14): $ref, IncomeRealityRequest, IncomeRealityResponse, additionalProperties, properties, required, type, additionalProperties (+6 more)

### Community 83 - "required"
Cohesion: 0.20
Nodes (10): TrendSummaryOut, additionalProperties, required, type, average_net_income_cents, conservative_weekly_income_cents, max_net_income_cents, min_net_income_cents (+2 more)

### Community 84 - "required"
Cohesion: 0.25
Nodes (8): PreparatoryActionResponse, additionalProperties, required, type, detail, resource_ids, severity, title

### Community 85 - "null"
Cohesion: 0.08
Nodes (35): format, type, minimum, type, type, minimum, type, additionalProperties (+27 more)

### Community 86 - "Codebase Structure"
Cohesion: 0.25
Nodes (8): Codebase Structure, Decision, Deferred work, Dependency boundaries, Directory map, Error envelope, Feature map, Shared modules

### Community 87 - "Income Reality"
Cohesion: 0.29
Nodes (6): Assumptions and business rules, Income Reality, Interfaces, Known limitations, Tests performed, User-visible scope

### Community 88 - "frontend/package.json"
Cohesion: 0.25
Nodes (7): engines, node, name, packageManager, private, type, version

### Community 89 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, generate:api, preview, test, test:integration, test:watch

### Community 90 - "Resilience"
Cohesion: 0.10
Nodes (21): 1. Clone and install the root tooling, 2. Create and activate a Python virtual environment, 3. Install the backend dependencies, 4. Create the environment files, 5. Start Supabase and apply the migrations, 6. Run the API, 7. Run the client, 8. Confirm it works (+13 more)

### Community 91 - ".get_summary"
Cohesion: 0.33
Nodes (4): GoalReview, JarPlan, JarSummary, PlanPatch

### Community 92 - "recorded_cpf_cents"
Cohesion: 0.29
Nodes (7): integer, null, recorded_cpf_cents, default, description, minimum, type

### Community 93 - "savings/api.ts"
Cohesion: 0.16
Nodes (11): goalPath(), HttpSavingsApi, SavingsApi, fakeApi(), makeGoal(), SavingsContributionCreate, SavingsGoal, SavingsGoalCreate (+3 more)

### Community 94 - "SqlFinancialContextRepository"
Cohesion: 0.22
Nodes (5): WeeklyEntry, ``S_w = income_w - variable_costs_w - R - E`` per Monday-Sunday week. A ranged…, Same definition as the transaction path, using the week's own snapshots.…, SqlFinancialContextRepository, _week_surplus()

### Community 95 - "formatMoney"
Cohesion: 0.26
Nodes (7): CurrentWeekCard(), mondayOf(), weekIncome(), KeyFigures(), useSavingsSummary(), TrendTooltip(), formatMoney()

### Community 97 - "FinancialScoreCard.tsx"
Cohesion: 0.14
Nodes (14): fetchFinancialScore(), FINANCIAL_SCORE_COMPONENT_LINKS, FinancialScore, FinancialScoreBand, FinancialScoreComponent, FinancialScoreComponentId, FinancialScoreComponentStatus, FinancialScoreMissingInput (+6 more)

### Community 98 - "required"
Cohesion: 0.22
Nodes (9): OfficialResourceResponse, id, additionalProperties, required, type, description, last_reviewed, name (+1 more)

### Community 99 - "Backend"
Cohesion: 0.29
Nodes (7): AI configuration, Authentication, Backend, Environment, Placement rules, Run and verify, URL prefixes and errors

### Community 100 - "weekly_amounts"
Cohesion: 0.24
Nodes (12): daily_amounts(), date, Pure, framework-free spreading of a ranged transaction across calendar days.…, Split ``amount_cents`` evenly across the inclusive day range. Effective end is…, Aggregate :func:`daily_amounts` onto the Monday of each day's ISO week., weekly_amounts(), _load_cases(), Loads the shared contract fixture and checks transaction_spread against it. (+4 more)

### Community 101 - "Frontend"
Cohesion: 0.25
Nodes (7): Checks, Environment, Frontend, Offline behaviour, Placement rules, Run locally, Visual system

### Community 103 - "LLMUnavailableError"
Cohesion: 0.12
Nodes (40): GeminiClient, LLMUnavailableError, _parse_response(), Any, LLM transport for the AI features. This module knows how to talk to a model and…, Google Gemini implementation of ``LLMClient``. Talks to the ``generateContent``…, Turns a ``generateContent`` response body into the parsed JSON object.…, Raised when no answer could be obtained. Callers treat this as "fall back to… (+32 more)

### Community 104 - "disclaimers"
Cohesion: 0.29
Nodes (7): items, type, type, disclaimers, resource_ids, items, type

### Community 105 - "$defs"
Cohesion: 0.20
Nodes (10): additionalProperties, type, additionalProperties, type, $defs, BaselineFinancesPayload, BaselineSummaryResponse, ScenarioSummaryResponse (+2 more)

### Community 106 - "Feature — Savings Goals"
Cohesion: 0.29
Nodes (7): Calculations, Feature — Savings Goals, Interfaces, Limitations and follow-up, Scope, Storage, Tests

### Community 107 - "ShockScenarioPayload"
Cohesion: 0.33
Nodes (6): ShockScenarioPayload, additionalProperties, required, type, income_reduction_percent, weeks_affected

### Community 124 - "ResilienceJarRouteTests"
Cohesion: 0.14
Nodes (13): domain_error_handler(), _envelope(), http_exception_handler(), Any, HTTPException, _request_id(), validation_error_handler(), ResilienceJarRouteTests (+5 more)

### Community 144 - "Financial Score"
Cohesion: 0.14
Nodes (14): Band cap: no visible buffer, no "resilient" label, `cash_flow` (max 30), Component `detail` text names where to go, Components, `emergency_fund` (max 40), Financial Score, Limitations, `missingInputs` (+6 more)

### Community 145 - "throwaway_user"
Cohesion: 0.16
Nodes (24): last_monday(), date, A client authenticated as a fresh user, cleaned up on exit., singapore_today(), throwaway_user(), Database-backed checks for the emergency-fund model.…, The double-count regression: saving a week used to add ``N`` twice., test_foundation_transactions_round_trip_and_are_user_scoped() (+16 more)

### Community 147 - "Transaction"
Cohesion: 0.35
Nodes (11): Transaction, post, transaction_create(), TransactionInput, TransactionResponse, create_transaction(), _optional_text(), Partial update: only fields present in the request body are applied. A full… (+3 more)

### Community 150 - "Supabase"
Cohesion: 0.29
Nodes (7): Applying migrations locally, Directory responsibilities, Local workflow, Migrations, Shared project workflow, Supabase, What is persisted

### Community 157 - "calculations.py"
Cohesion: 0.12
Nodes (22): calculate_completion_projection(), calculate_milestones(), calculate_progress(), _one_decimal(), CompletionProjection, date, JarPlan, Milestone (+14 more)

### Community 158 - "db_support.py"
Cohesion: 0.24
Nodes (12): get_engine(), get_session(), delete_profile(), UUID, Helpers for tests that talk to the real database. Every test gets its own…, A session plus a fresh profile row, for testing repositories directly., throwaway_session(), test_contribution_repository_round_trips_and_scopes_by_user() (+4 more)

### Community 160 - "Emergency Fund and Savings Goals — calculation model"
Cohesion: 0.17
Nodes (12): 1. Two separate ledgers, 2. Emergency fund balance, 3. Weekly essential expenses, 4.1 Default goal history and the 2026-09-03 backfill, 4. Goal, target, and "reached", 5. Weekly saving target and projection, 6. Recommended weekly saving, 7. Savings goals (+4 more)

### Community 161 - "README.md"
Cohesion: 0.14
Nodes (7): Shared Contracts, Branch integration record (historical), Resolved since this merge, What this integration fixed, Initial Prototype Scaffold (historical), Product boundary, Shared conventions carried forward

### Community 168 - "test_foundation_api.py"
Cohesion: 0.22
Nodes (10): Regression test: a brand-new user (no bootstrap call, no profile row yet) must…, Same regression as above, for the recurring-work-cost PUT endpoint., A bootstrap call for a brand-new user must commit the profile it creates, not…, test_bootstrap_alone_persists_the_profile_row(), test_bootstrap_and_week_revision_contract(), test_brand_new_user_can_put_a_recurring_work_cost_as_their_first_write(), test_brand_new_user_can_put_an_essential_expense_as_their_first_write(), test_reset_requires_confirmation_and_returns_empty_profile() (+2 more)

### Community 175 - "scenario-simulator.schema.json"
Cohesion: 0.33
Nodes (5): description, $id, oneOf, $schema, title

### Community 189 - "WeeklyTrendChart.tsx"
Cohesion: 0.15
Nodes (17): BAND_LABEL, shortDate(), weekCosts(), weekIncome(), WeeklyTrendChart(), IncomeTrendChart(), shortDate(), BalanceChartPoint (+9 more)

### Community 195 - "sql_repositories.py"
Cohesion: 0.14
Nodes (17): EmergencyFundPlan, Contribution, JarPlan, _contribution_from_record(), _plan_from_record(), _plan_values(), Contribution, date (+9 more)

## Knowledge Gaps
- **603 isolated node(s):** `$schema`, `$id`, `title`, `description`, `type` (+598 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 972 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Session` connect `db_support.py` to `AuthContext.tsx`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `get_session()` connect `db_support.py` to `foundation_input/routes.py`, `calculate_financial_score`, `DomainError`, `resilience_jar/service.py`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `current_user_id()` connect `current_user_id` to `scenario_simulator/router.py`, `test_engine.py`, `DomainError`, `calculate_financial_score`, `foundation_input/routes.py`, `throwaway_user`, `scheme_navigator.py`, `resilience_jar/service.py`, `db_support.py`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `ShockScenario` (e.g. with `_horizon_weeks()` and `_income_factor()`) actually correct?**
  _`ShockScenario` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `DomainError` (e.g. with `data_reset()` and `ResilienceJarRouteTests`) actually correct?**
  _`DomainError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `evaluate_rule()` (e.g. with `SchemeRule` and `SchemeStatus`) actually correct?**
  _`evaluate_rule()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `simulate()` (e.g. with `BaselineFinances` and `ShockScenario`) actually correct?**
  _`simulate()` has 2 INFERRED edges - model-reasoned connections that need verification._