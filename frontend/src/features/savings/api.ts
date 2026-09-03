import { apiRequest } from "../../lib/api";
import type {
  SavingsContributionCreate,
  SavingsGoal,
  SavingsGoalCreate,
  SavingsGoalList,
  SavingsGoalPatch,
} from "./types";

const goalPath = (path = "") => `/savings-goals${path}`;
const id = (value: string) => encodeURIComponent(value);

export interface SavingsApi {
  listGoals(): Promise<SavingsGoal[]>;
  createGoal(payload: SavingsGoalCreate): Promise<SavingsGoal>;
  updateGoal(goalId: string, patch: SavingsGoalPatch): Promise<SavingsGoal>;
  deleteGoal(goalId: string): Promise<void>;
  addContribution(
    goalId: string,
    payload: SavingsContributionCreate,
  ): Promise<SavingsGoal>;
  deleteContribution(goalId: string, contributionId: string): Promise<void>;
}

export class HttpSavingsApi implements SavingsApi {
  async listGoals(): Promise<SavingsGoal[]> {
    const response = await apiRequest<SavingsGoalList>(goalPath());
    return response.goals;
  }

  createGoal(payload: SavingsGoalCreate): Promise<SavingsGoal> {
    return apiRequest<SavingsGoal>(goalPath(), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  updateGoal(goalId: string, patch: SavingsGoalPatch): Promise<SavingsGoal> {
    return apiRequest<SavingsGoal>(goalPath(`/${id(goalId)}`), {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  }

  async deleteGoal(goalId: string): Promise<void> {
    await apiRequest<void>(goalPath(`/${id(goalId)}`), { method: "DELETE" });
  }

  /** Returns the whole updated goal, so the caller never recomputes totals. */
  addContribution(
    goalId: string,
    payload: SavingsContributionCreate,
  ): Promise<SavingsGoal> {
    return apiRequest<SavingsGoal>(goalPath(`/${id(goalId)}/contributions`), {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async deleteContribution(
    goalId: string,
    contributionId: string,
  ): Promise<void> {
    await apiRequest<void>(
      goalPath(`/${id(goalId)}/contributions/${id(contributionId)}`),
      { method: "DELETE" },
    );
  }
}
