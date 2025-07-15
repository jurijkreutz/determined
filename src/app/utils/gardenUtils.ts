// Utility functions for the Grow-a-Garden feature

// Recovery task activity IDs
export const RECOVERY_TASK_IDS = ['PS1', 'F2', 'R1', 'R2'];

// Constants for streak management
export const PRODUCTIVE_DAY_THRESHOLD = 51; // Points needed for a day to count as productive
export const STREAK_PAUSE_DAYS = 2; // Number of consecutive low-point days to pause streak
export const STREAK_RESET_DAYS = 3; // Number of consecutive low-point days to reset streak
export const MIN_PRODUCTIVE_DAYS_PER_WEEK = 4; // Minimum productive days needed in a 7-day window
export const MORNING_CUTOFF_HOUR = 12; // Hour (0-23) before which we show morning messages
export const EVENING_HOUR = 18; // Hour after which we consider the day nearly over

// Function to get the appropriate emoji based on points
export function getGardenEmoji(points: number): string {
  if (points <= 50) return '🌱'; // Seedling - Rest/light day
  if (points <= 80) return '🌿'; // Sprout - Maintenance day
  if (points <= 110) return '🌸'; // Bloom - Productive day
  if (points <= 130) return '🌳'; // Young tree - Peak day
  return '🌴'; // Big palm - Exceptional day
}

// Function to get a future day emoji - different from regular garden emojis
export function getFutureDayEmoji(): string {
  return '📅'; // Calendar emoji for future days
}

// Function to check if a day qualifies for streak protection
// Returns true if it's a seedling day (≤50 points) but has at least one recovery task
export function hasStreakProtection(
  emoji: string,
  recoveryTaskCount: number
): boolean {
  return emoji === '🌱' && recoveryTaskCount >= 1;
}

// Function to check if a day qualifies for bonus points
// Returns true if it's a seedling day with three recovery tasks
export function hasRecoveryBonus(
  emoji: string,
  recoveryTaskCount: number
): boolean {
  return emoji === '🌱' && recoveryTaskCount >= 3;
}

// Format for storing daily garden data
export interface GardenDayData {
  date: string;
  points: number;
  emoji: string;
  recoveryTaskCount: number;
  hasStreakProtection: boolean;
  hasBonus: boolean;
  streakCount?: number; // Current streak count
  streakStatus?: 'active' | 'paused' | 'reset'; // Current status of the streak
  lowPointDaysInARow?: number; // Count of consecutive low-point days
  streakMessage?: string; // Message to show the user about their streak
  bonusPoints?: number; // From previous day's recovery bonus
}

// Get formatted date for Vienna timezone (UTC+2)
export function getViennaDate(): string {
  const now = new Date();
  // Add 2 hours for Vienna time
  const viennaTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return viennaTime.toISOString().split('T')[0];
}

// Get current hour in Vienna timezone (0-23)
export function getViennaHour(): number {
  const now = new Date();
  // Vienna is UTC+2
  return (now.getUTCHours() + 2) % 24;
}

// Check if it's time to refresh garden data (5:00 AM Vienna time)
export function isGardenRefreshTime(): boolean {
  const viennaHour = getViennaHour();
  const viennaMinute = new Date().getUTCMinutes();

  // Return true if it's between 5:00 AM and 5:05 AM Vienna time
  return viennaHour === 5 && viennaMinute < 5;
}

// Check if it's morning (before noon)
export function isMorning(): boolean {
  return getViennaHour() < MORNING_CUTOFF_HOUR;
}

// Check if it's evening (after the evening cutoff hour)
export function isEvening(): boolean {
  return getViennaHour() >= EVENING_HOUR;
}

// Streak Management Functions

// Check if a day is considered productive (>= 51 points)
export function isProductiveDay(points: number): boolean {
  return points >= PRODUCTIVE_DAY_THRESHOLD;
}

// Get previous N dates from a given date
export function getPreviousDates(fromDate: string, numberOfDays: number): string[] {
  const dates: string[] = [];
  const date = new Date(fromDate);

  for (let i = 1; i <= numberOfDays; i++) {
    date.setDate(date.getDate() - 1);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

// Calculate streak status based on current and previous days
export function calculateStreakStatus(
  currentData: GardenDayData,
  gardenStore: Record<string, GardenDayData>
): {
  streakCount: number;
  streakStatus: 'active' | 'paused' | 'reset';
  lowPointDaysInARow: number;
  streakMessage: string;
} {
  const currentDate = currentData.date;
  const currentPoints = currentData.points;
  const hasProtection = currentData.hasStreakProtection;
  const isCurrentDateToday = currentDate === getViennaDate();
  const isMorningTime = isMorning();

  // Get previous 7 days for streak calculations
  const previousDates = getPreviousDates(currentDate, 7);

  // Count consecutive low-point days
  let lowPointDaysInARow = 0;

  // If current day is low-point, start count at 1
  if (!isProductiveDay(currentPoints) && !hasProtection) {
    lowPointDaysInARow = 1;

    // Count previous consecutive low-point days
    for (let i = 0; i < previousDates.length; i++) {
      const prevDate = previousDates[i];
      const prevData = gardenStore[prevDate];

      // If no data or day was productive, break the count
      if (!prevData || isProductiveDay(prevData.points) || prevData.hasStreakProtection) {
        break;
      }

      lowPointDaysInARow++;
    }
  }

  // Check for weekly minimum (at least 4 productive days in any 7-day window)
  const last7Days = [currentDate, ...previousDates.slice(0, 6)];
  const daysWithData = last7Days.filter(date => {
    return date === currentDate || gardenStore[date];
  }).length;

  const productiveDaysInWeek = last7Days.filter(date => {
    const data = date === currentDate ? currentData : gardenStore[date];
    return data && (isProductiveDay(data.points) || data.hasStreakProtection);
  }).length;

  // Get previous day's streak data to build upon
  const prevDayData = gardenStore[previousDates[0]];
  const prevStreakCount = prevDayData?.streakCount || 0;
  const prevStreakStatus = prevDayData?.streakStatus || 'active';

  // Default values
  let streakCount = 0;
  let streakStatus: 'active' | 'paused' | 'reset' = 'active';
  let streakMessage = '';

  // Special case for today with 0 points in the morning
  if (isCurrentDateToday && isMorningTime && currentPoints === 0) {
    // For morning with no points yet, give encouraging message instead of streak warnings
    streakStatus = prevStreakStatus;
    streakCount = prevStreakCount;

    // Different messages based on streak status
    if (streakStatus === 'active' && streakCount > 0) {
      streakMessage = "Good morning! Start the day by earning some points to maintain your streak!";
    } else if (streakStatus === 'paused') {
      streakMessage = "Good morning! Today's your chance to earn 51+ points and save your streak!";
    } else {
      streakMessage = "Have a great day! Start with earning some points!";
    }

    return {
      streakCount,
      streakStatus,
      lowPointDaysInARow,
      streakMessage
    };
  }

  // Rule 1: Current day is productive - increment or maintain streak
  if (isProductiveDay(currentPoints) || hasProtection) {
    // If previous streak was paused, resume it
    if (prevStreakStatus === 'paused') {
      streakStatus = 'active';
      streakCount = prevStreakCount;
      streakMessage = 'Streak saved! Keep going!';
    }
    // If previous streak was active, increment it
    else if (prevStreakStatus === 'active') {
      streakStatus = 'active';
      streakCount = prevStreakCount + 1;
      streakMessage = streakCount > 1 ? `${streakCount} day streak! Keep it up!` : 'Streak started!';
    }
    // If previous streak was reset, start a new one
    else {
      streakStatus = 'active';
      streakCount = 1;
      streakMessage = 'New streak started!';
    }
  }
  // Rule 2 & 3: One low-point day does nothing, two pauses
  else if (lowPointDaysInARow === 1) {
    streakStatus = 'active';
    streakCount = prevStreakCount;

    // More motivational messaging during the day, "rest day" only in evening
    if (isCurrentDateToday) {
      if (isEvening()) {
        streakMessage = 'Rest day! Try for a productive day tomorrow.';
      } else {
        const pointsNeeded = PRODUCTIVE_DAY_THRESHOLD - currentPoints;
        streakMessage = `You need ${pointsNeeded} more points today to maintain your productivity streak!`;
      }
    } else {
      streakMessage = 'Low-point day. One more and your streak will pause.';
    }
  }
  else if (lowPointDaysInARow === 2) {
    streakStatus = 'paused';
    streakCount = prevStreakCount;
    streakMessage = 'Streak paused! Earn 51+ points in the next 24h to save it.';
  }
  // Rule 4: Three consecutive low-point days resets streak
  else if (lowPointDaysInARow >= 3) {
    streakStatus = 'reset';
    streakCount = 0;
    streakMessage = 'Streak reset! Three consecutive low-point days.';
  }

  // Rule 5: Fewer than 4 productive days in a 7-day window resets streak
  // BUT only apply this rule if we have at least 7 days of data
  if (productiveDaysInWeek < MIN_PRODUCTIVE_DAYS_PER_WEEK && daysWithData >= 7) {
    streakStatus = 'reset';
    streakCount = 0;
    streakMessage = 'Streak reset! Fewer than 4 productive days in the last week.';
  }

  // Special messaging for beginners (first week)
  if (daysWithData < 7) {
    // For beginners, provide encouragement instead of strict streak rules
    if (isProductiveDay(currentPoints) || hasProtection) {
      // Productive day messaging for beginners
      if (streakCount === 1) {
        streakMessage = "Great start! You've begun your productivity journey!";
      } else if (streakCount === 2) {
        streakMessage = "Two days in a row! You're building momentum!";
      } else if (streakCount === 3) {
        streakMessage = "Three-day streak! You're establishing a pattern!";
      }
    } else if (lowPointDaysInARow === 1) {
      // More gentle messaging for first low-point day in the beginning
      if (isCurrentDateToday) {
        if (isMorningTime && currentPoints === 0) {
          streakMessage = "Have a great day! Start with earning some points!";
        } else if (isEvening()) {
          streakMessage = "Rest day! Try for a productive day tomorrow.";
        } else {
          const pointsNeeded = PRODUCTIVE_DAY_THRESHOLD - currentPoints;
          streakMessage = `Just ${pointsNeeded} more points needed today to have a productive day!`;
        }
      } else {
        streakMessage = "Rest day! Try for a productive day tomorrow.";
      }
    }
  }

  return {
    streakCount,
    streakStatus,
    lowPointDaysInARow,
    streakMessage
  };
}
