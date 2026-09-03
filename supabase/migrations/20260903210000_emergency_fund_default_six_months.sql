-- The shipped default for a coverage-mode emergency-fund goal was 4 weeks;
-- it is now DEFAULT_COVERAGE_WEEKS = 26 (roughly six months of essential
-- expenses). Rows created before this change still hold the old default and
-- would keep showing a four-week goal forever, so this migration overwrites
-- every coverage-mode plan still sitting at goal_weeks = 4 to 26.
--
-- Trade-off (recorded deliberately, not silently): four was also a value a
-- user could have chosen on purpose. Because the shipped default and a
-- deliberate choice of four are indistinguishable in this column, this
-- migration cannot tell them apart and overwrites both. Anyone who
-- genuinely wanted a four-week goal will need to re-set it after this runs.
-- See documentation/features/emergency-fund-model.md section 4 for the
-- full write-up of this decision.
update resilience.emergency_fund_plans
   set goal_weeks = 26
 where goal_mode = 'coverage' and goal_weeks = 4;

-- resilience.emergency_fund_plans.goal_weeks has no column-level default
-- declared (it is nullable; the application always supplies a value via
-- DEFAULT_COVERAGE_WEEKS on every insert), so there is no database default
-- to realign here. Nothing further to change in the schema.
