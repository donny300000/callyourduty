const AVATAR_COLORS = [
  "#8B5E3C",
  "#D9A441",
  "#4C6B3B",
  "#B5533C",
  "#3C6E71",
  "#7A4E9E",
  "#C97B63",
  "#5B7DB1",
];

export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!;
}

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

export function computeOverallScore(ratings: {
  speed: number;
  comfort: number;
  privacy: number;
  ambiance: number;
  relief: number;
}): number {
  const sum = ratings.speed + ratings.comfort + ratings.privacy + ratings.ambiance + ratings.relief;
  return Math.round((sum / 5) * 100) / 100;
}

export function computeLongestStreakDays(createdAtDates: Date[]): number {
  if (createdAtDates.length === 0) return 0;

  const dayKeys = Array.from(
    new Set(
      createdAtDates.map((d) => {
        const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        return utc.getTime();
      }),
    ),
  ).sort((a, b) => a - b);

  const oneDayMs = 24 * 60 * 60 * 1000;
  let longest = 1;
  let current = 1;

  for (let i = 1; i < dayKeys.length; i++) {
    if (dayKeys[i]! - dayKeys[i - 1]! === oneDayMs) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}
