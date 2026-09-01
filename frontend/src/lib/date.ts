export function currentMonday(now = new Date()): string {
  const singapore = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Singapore" }));
  const day = singapore.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  singapore.setDate(singapore.getDate() + offset);
  return `${singapore.getFullYear()}-${String(singapore.getMonth() + 1).padStart(2, "0")}-${String(singapore.getDate()).padStart(2, "0")}`;
}

export function isMonday(value: string): boolean {
  return new Date(`${value}T00:00:00+08:00`).getDay() === 1;
}
