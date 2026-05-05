// Malaysian federal public holidays.
// Source: official Federal Government calendar (KL/Putrajaya/Labuan).
// Variable Islamic / lunar dates can shift ±1 day by official proclamation —
// update on confirmation each year.
//
// Keys are ISO calendar dates (YYYY-MM-DD) in Malaysian local time.

const HOLIDAYS_2025: Record<string, string> = {
  "2025-01-01": "New Year's Day",
  "2025-01-29": "Chinese New Year",
  "2025-01-30": "Chinese New Year (Day 2)",
  "2025-02-01": "Federal Territory Day",
  "2025-03-31": "Hari Raya Aidilfitri",
  "2025-04-01": "Hari Raya Aidilfitri (Day 2)",
  "2025-05-01": "Labour Day",
  "2025-05-12": "Wesak Day",
  "2025-06-02": "Agong's Birthday",
  "2025-06-07": "Hari Raya Aidiladha",
  "2025-06-27": "Awal Muharram",
  "2025-08-31": "Merdeka Day",
  "2025-09-05": "Maulidur Rasul",
  "2025-09-16": "Malaysia Day",
  "2025-10-20": "Deepavali",
  "2025-12-25": "Christmas Day",
};

const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-02-01": "Federal Territory Day",
  "2026-02-17": "Chinese New Year",
  "2026-02-18": "Chinese New Year (Day 2)",
  "2026-03-19": "Hari Raya Aidilfitri",
  "2026-03-20": "Hari Raya Aidilfitri (Day 2)",
  "2026-05-01": "Labour Day",
  "2026-05-26": "Hari Raya Aidiladha",
  "2026-05-31": "Wesak Day",
  "2026-06-01": "Agong's Birthday",
  "2026-06-15": "Awal Muharram",
  "2026-08-23": "Maulidur Rasul",
  "2026-08-31": "Merdeka Day",
  "2026-09-16": "Malaysia Day",
  "2026-11-08": "Deepavali",
  "2026-12-25": "Christmas Day",
};

const HOLIDAYS_2027: Record<string, string> = {
  "2027-01-01": "New Year's Day",
  "2027-02-01": "Federal Territory Day",
  "2027-02-06": "Chinese New Year",
  "2027-02-07": "Chinese New Year (Day 2)",
  "2027-03-09": "Hari Raya Aidilfitri",
  "2027-03-10": "Hari Raya Aidilfitri (Day 2)",
  "2027-05-01": "Labour Day",
  "2027-05-16": "Hari Raya Aidiladha",
  "2027-05-21": "Wesak Day",
  "2027-06-05": "Awal Muharram",
  "2027-06-07": "Agong's Birthday",
  "2027-08-13": "Maulidur Rasul",
  "2027-08-31": "Merdeka Day",
  "2027-09-16": "Malaysia Day",
  "2027-10-28": "Deepavali",
  "2027-12-25": "Christmas Day",
};

const ALL_HOLIDAYS: Record<string, string> = {
  ...HOLIDAYS_2025,
  ...HOLIDAYS_2026,
  ...HOLIDAYS_2027,
};

export function getMalaysiaHoliday(iso: string): string | null {
  return ALL_HOLIDAYS[iso] ?? null;
}

export function isMalaysiaHoliday(iso: string): boolean {
  return iso in ALL_HOLIDAYS;
}
