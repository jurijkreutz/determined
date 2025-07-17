# Determined - Productivity Tracking & Garden Growth System

## Project Overview

Determined is a productivity tracking application built with Next.js, React 19, MongoDB, and TailwindCSS. The application helps users track their daily activities and visualize their productivity through a unique "Grow-a-Garden" metaphor where productivity levels are represented by different plant emojis.

## Tech Stack

- **Frontend**: Next.js 15.3.5, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Styling**: TailwindCSS 4
- **Language**: TypeScript

## Core Features

1. **Activity Tracking**: Log predefined or custom activities with point values
2. **Grow-a-Garden**: Visualize productivity with plant emojis based on daily point totals
3. **Streak Management**: Track consecutive productive days
4. **Mystery Quests**: Daily challenges with point rewards
5. **Calendar View**: Monthly and weekly views of productivity garden

## Folder Structure

```
determined/
├── public/               # Static assets
├── src/                  # Source code
│   └── app/              # Next.js App Router structure
│       ├── api/          # API routes
│       │   ├── activities/       # Activity-related endpoints
│       │   ├── garden/           # Garden/streak-related endpoints
│       │   └── settings/         # User settings endpoints
│       ├── components/           # React components
│       ├── data/                 # Static data definitions
│       ├── settings/             # Settings page
│       ├── types/                # TypeScript type definitions
│       ├── utils/                # Utility functions
│       ├── favicon.ico           # Site favicon
│       ├── globals.css           # Global styles
│       ├── layout.tsx            # Root layout component
│       └── page.tsx              # Home page component
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── OVERVIEW.md           # This file
```

## Component Breakdown

### Main Page Components

- **page.tsx**: Main application page that assembles all components
- **layout.tsx**: Root layout with global structure

### Activity System

- **ActivityForm.tsx**: Form for adding predefined or custom activities
- **ActivityList.tsx**: Displays logged activities for a given day
- **predefinedActivities.ts**: Contains definitions of all predefined activities with point values

### Garden & Streak System

- **GardenEmoji.tsx**: Displays appropriate plant emoji based on day's points
- **MonthCalendar.tsx**: Calendar view with garden emojis for each day
- **StreakDisplay.tsx**: Shows current streak status and messages
- **gardenUtils.ts**: Utility functions for garden/streak management

### Mystery Quest System

- **MysteryQuestCard.tsx**: Displays daily mystery quest
- **mysteryQuests.ts**: Contains all possible mystery quests

### UI Components

- **Snackbar.tsx**: Toast notification component
- **DayDetailsPopup.tsx**: Popup showing day details
- **AboutBox.tsx**: Information about the application

## API Routes

### Activities API

- **GET /api/activities**: Retrieves activities for a specific date
- **POST /api/activities**: Creates a new activity
- **GET /api/activities/week**: Gets activity data for the current week

### Garden API

- **GET /api/garden**: Gets garden data for a specific date or range
- **POST /api/garden/sync**: Syncs garden data for a date
  
## Data Models

### Activities

The application uses several activity models:

- **PredefinedActivity**: Template for an activity (id, name, category, points, etc.)
- **UserActivity**: Recorded instance of an activity with timestamp
- **DailyActivityCount**: Tracks how many times each activity was performed in a day

### Garden

- **GardenDayData**: Daily garden status with points, emoji, streak info

## Core Mechanics

### Points System

- Activities have different point values based on difficulty
- Some activities have diminishing returns (75%, 50%)
- Daily caps limit how many times certain activities can be logged

### Garden Growth

Based on daily point totals:
- **🌱 Seedling**: ≤ 50 points (Rest/light day)
- **🌿 Sprout**: 51-80 points (Maintenance day)
- **🌸 Bloom**: 81-110 points (Productive day)
- **🌳 Young tree**: 111-130 points (Peak day)
- **🌴 Big palm**: >130 points (Exceptional day)

### Streak Management

- Productive days require ≥51 points
- Streaks pause after 2 consecutive low-point days
- Streaks reset after 3 consecutive low-point days
- Recovery activities can protect streaks on low-point days

### Mystery Quests

- Daily randomized challenges with varying difficulty levels (🟢, 🟡, 🔴)
- Completing quests rewards additional points

## How Components Connect

1. **Main Page Flow**: 
   - `page.tsx` integrates all main components
   - Activities feed into the garden visualization

2. **Activity System Flow**:
   - `ActivityForm` → POST to `/api/activities` → Database → `ActivityList` (refresh)
   - Points update → `GardenEmoji` update

3. **Garden System Flow**:
   - Activities generate points → `gardenUtils` calculates emoji and streak status
   - `GardenEmoji` displays appropriate plant
   - `MonthCalendar` shows monthly garden progress
   - `StreakDisplay` shows current streak status

4. **Todo System Flow**:
   - `ToDoList` displays user tasks (maximum 5 per day)
   - Todo items can be created, updated, and deleted via `/api/todos` endpoints
   - Users earn points when completing tasks (capped at 40 points per day)
   - At midnight, open tasks are automatically marked as "missed" with a 20% point penalty
   - Users can "snooze" tasks to the next day (with a 5-point penalty)

5. **Data Backup & Restore Flow**:
   - `BackupRestore` component provides UI for data management
   - `/api/backup` handles exporting and importing user data

## Additional Components

### Todo Management
- **ToDoList.tsx**: UI for task management with the following features:
  - Shows today's To-Do items with their status (open, done, snoozed, missed)
  - Allows marking items as done (earning points, capped at 40 per day)
  - Allows snoozing items (moving to tomorrow, with 5-point penalty)
  - Supports editing and deleting tasks
  - Maximum 5 tasks per day with 1-20 points each
- **todoProcessing.ts**: Handles end-of-day processing for missed tasks:
  - Runs at 00:05 Vienna time daily
  - Marks open tasks from previous day as "missed"
  - Applies 20% point penalty to the daily garden data
- API endpoints:
  - `/api/todos` - CRUD operations for todos
  - `/api/todos/process-missed` - Processes missed todos at day's end
  - `/api/todos/reset-by-activity` - Resets todos when activity is deleted

### Workout Tracking
- **WorkoutNotes.tsx**: Interface for logging workout details
- **workouts.ts**: Type definitions for workout data
- `/api/workouts` endpoint for workout data management


### Suggestions & Planning
- **DailySuggestionSlots.tsx**: Provides activity suggestions based on user patterns
- **DateSelector.tsx**: UI component for selecting dates

### Data Management
- **BackupRestore.tsx**: Interface for exporting/importing user data
- **storageUtils.ts**: Utilities for data persistence and management
- `/api/backup` endpoint for data operations

### Utility Components
- **GardenRefresher.tsx** and **GardenRefresherWrapper.tsx**: Handle garden data refreshing
- **Snackbar.tsx**: Provides toast notifications throughout the app

## Configuration Files
- **next.config.ts**: Next.js configuration
- **tsconfig.json**: TypeScript configuration
- **postcss.config.mjs**: PostCSS configuration for TailwindCSS
- **eslint.config.mjs**: ESLint rules for code quality

## Component Documentation and Maintenance Guidelines

Every component in this project has been documented with a detailed header comment that explains:
- The component's purpose and functionality
- Key features and capabilities
- Connection to other parts of the system
- Special behaviors or states

### For AI Agents and Developers

When working with this codebase, please follow these guidelines:

1. **Update Component Comments**: When modifying a component's functionality, ensure you also update its header comment to reflect the changes.

2. **Maintain Documentation Standards**: Each component's comment should clearly explain its purpose, key features, and relationships with other components.

3. **Keep OVERVIEW.md Updated**: When adding new features or changing existing functionality, update this OVERVIEW.md file to ensure it accurately reflects the current state of the application.

4. **Comment Format**: Follow the established format for component comments:
   ```typescript
   /**
    * ComponentName Component
    * 
    * Brief description of what the component does and its role in the application.
    * 
    * Key features:
    * - Feature 1
    * - Feature 2
    * - Feature 3
    */
   ```

Following these guidelines will ensure that the documentation remains accurate and helpful for all users of this codebase.

IMPORTANT for AI AGENT: Make sure that you check for linting errors and fix them before finishing your changes!