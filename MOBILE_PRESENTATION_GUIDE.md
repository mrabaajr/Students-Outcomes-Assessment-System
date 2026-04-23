# Mobile App Presentation Guide

This document explains the mobile app side of the Students Outcomes Assessment System so the team can present it clearly.

## 1. What the Mobile App Is

The mobile app is the **React Native / Expo version** of the Students Outcomes Assessment System.

Its purpose is to bring the same core workflow from the web app into a mobile-friendly experience:

- Login with role-based access
- Restore user session securely
- Show Program Chair and Faculty dashboards
- View classes and sections
- Open assessment screens
- Input and save grades
- View reports
- Export report files

Short explanation:

> The mobile app is a handheld version of the assessment system. It connects to the same Django backend API as the web app, but presents the workflow in a mobile-first interface using React Native.

## 2. Mobile Tech Stack

The mobile app uses:

- **Expo**
- **React Native**
- **React Navigation**
- **Axios**
- **Expo Secure Store**
- **Expo Print**
- **Expo Sharing**
- **Expo File System**
- **Expo Document Picker**

Presentation line:

> The mobile app is built with Expo and React Native. It uses React Navigation for screen flow, Axios for API requests, and Expo Secure Store to keep session tokens safely on the device.

## 3. Project Structure

Main mobile app folder:

```text
mobile/
```

Important files:

```text
mobile/App.js
mobile/src/App.js
mobile/src/navigation/RootNavigator.js
mobile/src/context/AuthContext.js
mobile/src/config/api.js
mobile/src/services/
mobile/src/screens/
mobile/src/components/
mobile/src/theme/colors.js
```

Meaning:

```text
App.js                 Entry point
src/App.js             Wraps app with providers and navigation
RootNavigator.js       Role-based screen flow
AuthContext.js         Login, logout, and session restore logic
config/api.js          API base URL setup
services/              API calls and data normalization
screens/               Actual mobile app pages
components/            Reusable mobile UI pieces
theme/colors.js        Shared mobile color palette
```

## 4. App Entry Point

The mobile app starts at:

```text
mobile/App.js
```

That file simply loads:

```text
mobile/src/App.js
```

The real app wrapper is in `src/App.js`.

It sets up:

- `SafeAreaProvider`
- `AuthProvider`
- `NavigationContainer`
- `RootNavigator`

Flow:

```text
App.js
   ↓
src/App.js
   ↓
AuthProvider
   ↓
NavigationContainer
   ↓
RootNavigator
```

Presentation line:

> The mobile app starts with `App.js`, then wraps the application with authentication context and navigation so the correct screens can be shown based on login status.

## 5. API Base URL

The mobile app gets its API base URL from:

```text
mobile/src/config/api.js
```

Logic:

```javascript
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : "http://127.0.0.1:8000/api");
```

Meaning:

- On Android emulator: use `http://10.0.2.2:8000/api`
- On iOS simulator: use `http://127.0.0.1:8000/api`
- On a real phone: use your computer's LAN IP through `EXPO_PUBLIC_API_URL`

Presentation line:

> The mobile app points to the same Django backend API as the web app. The base URL changes depending on whether the app is running on Android, iOS, or a physical device.

## 6. Authentication Flow

Authentication is managed in:

```text
mobile/src/context/AuthContext.js
mobile/src/services/auth.js
mobile/src/services/storage.js
mobile/src/services/apiClient.js
```

### Login flow

1. User enters email and password.
2. User chooses a role: Program Chair or Faculty.
3. Mobile app calls `/users/login/`.
4. Backend returns access and refresh tokens.
5. Mobile app decodes the access token to get `user_id`.
6. Mobile app calls `/users/{id}/` to fetch full user data.
7. Role is normalized.
8. Tokens and role are stored using `Expo Secure Store`.
9. `Authorization: Bearer <token>` is attached to future requests.

Presentation line:

> The mobile app uses the same backend login flow as the web app. After a successful login, the session is stored securely on the device and reused for future API calls.

## 7. Why Secure Store Is Important

Unlike the web app, which uses `localStorage`, the mobile app uses:

```text
Expo Secure Store
```

This is safer for mobile devices because tokens are stored in protected device storage instead of regular app memory.

Presentation line:

> On mobile, we store tokens using Expo Secure Store instead of plain local storage. That gives us a more appropriate mobile session storage approach.

## 8. Session Restore on App Launch

One strong part of the mobile app is that it restores the user session when the app opens.

Bootstrapping flow:

1. App reads stored token and role from Secure Store.
2. If there is an access token, it attaches it to the API client.
3. It tries to fetch the current user.
4. If the token is invalid, the session is cleared.
5. If successful, the app stays signed in.

Presentation line:

> The mobile app restores the last valid session automatically. This means users do not need to log in every time they reopen the app, unless the token is invalid or expired.

## 9. Role-Based Navigation

Navigation is handled in:

```text
mobile/src/navigation/RootNavigator.js
```

The app checks:

- `isAuthenticated`
- `isBootstrapping`
- `session.userRole`

Then it decides which screen stack to show.

### If not authenticated

Show:

```text
LoginScreen
```

### If authenticated as Program Chair

Show:

```text
ProgramChairDashboard
ProgramChairStudentOutcomes
ProgramChairOutcomeRubric
ProgramChairCourses
ProgramChairClasses
ProgramChairAssessments
ProgramChairAssessmentEntry
ProgramChairReports
ProgramChairPastReports
ProgramChairSettings
```

### If authenticated as Faculty

Show:

```text
FacultyDashboard
FacultyClasses
FacultyAssessments
FacultyAssessmentEntry
FacultyReports
FacultyPastReports
FacultySettings
```

Presentation line:

> The app uses role-based navigation. Program Chair and Faculty users see different screen flows after login, based on the role stored in the authenticated session.

## 10. Mobile Login Screen

The login screen is:

```text
mobile/src/screens/LoginScreen.js
```

What it does:

- Lets the user choose Program Chair or Faculty
- Accepts email and password
- Shows and hides password
- Handles validation errors
- Calls `signIn`
- Shows loading state while logging in

UI behavior:

- Animated hero section
- Role selection cards
- Email and password fields
- Error banner
- Sign in button

Presentation line:

> The mobile login screen mirrors the same login logic as the web app, but uses a mobile-first layout with role selection, inline validation, and secure session setup.

## 11. Mobile API Client

The mobile app uses a shared Axios client:

```text
mobile/src/services/apiClient.js
```

What it does:

- Sets a shared base URL
- Applies request timeout
- Attaches the access token to headers

Meaning:

> Instead of every screen creating its own API client, the app uses one shared Axios instance so requests stay consistent.

Presentation line:

> The mobile app uses a shared API client so all screens talk to the backend consistently, including authentication headers.

## 12. Services Layer

A key part of the mobile app design is the services layer:

```text
mobile/src/services/
```

Important services:

```text
auth.js
apiClient.js
storage.js
mobileData.js
assessmentMobile.js
reportsMobile.js
usersMobile.js
studentOutcomes.js
```

Purpose of the services layer:

- Keep API request logic out of the screen components
- Normalize backend data into mobile-friendly shape
- Reuse the same API logic across multiple screens

Presentation line:

> We separated API logic into service files. This keeps the screens focused on UI and interaction, while the services handle requests, transformation, and reusable data logic.

## 13. Data Normalization

One practical mobile design choice is normalization.

Example:

The backend may return fields like:

```text
course_code
course_name
academic_year
student_count
```

The mobile app converts them into a cleaner object for screen use:

```text
courseCode
courseName
academicYear
studentCount
```

This happens in service files like:

```text
mobile/src/services/mobileData.js
mobile/src/services/assessmentMobile.js
```

Presentation line:

> The services normalize backend responses into a consistent mobile format, so the screens do not have to deal with mixed field names from raw API responses.

## 14. Mobile Dashboards

The app has two dashboards:

```text
ProgramChairDashboardScreen.js
FacultyDashboardScreen.js
```

### Program Chair dashboard

Loads:

- Student outcomes count
- Course mapping count
- Total students
- Active sections
- Quick actions
- Recent sections
- Recent activity

The Program Chair dashboard pulls data using:

```text
fetchProgramChairDashboardData()
```

That service calls:

- `/student-outcomes/`
- `/course-so-mappings/`
- `/sections/load_all/`

### Faculty dashboard

Loads:

- Assigned sections
- Total students
- Active classes
- Coverage summary
- Quick actions
- Recent activity

It uses:

```text
fetchFacultyDashboardData()
```

That service calls:

- `/sections/`

Presentation line:

> The mobile dashboards summarize key information for each role and give quick access to the next actions users are most likely to take.

## 15. Program Chair Mobile Screens

Main Program Chair screens:

```text
ProgramChairDashboardScreen.js
ProgramChairStudentOutcomesScreen.js
ProgramChairCoursesScreen.js
ProgramChairClassesScreen.js
ProgramChairAssessmentsScreen.js
ProgramChairReportsScreen.js
ProgramChairPastReportsScreen.js
SettingsScreen.js
```

### Program Chair capabilities in the mobile app

- View dashboard metrics
- View and manage student outcomes
- Open rubric screens
- View mapped courses
- Manage sections, faculty, and students
- Import student CSV files
- Open assessment filtering and assessment entry
- View reports and save summary edits
- Export reports as PDF
- View past reports
- Open settings

Presentation line:

> The Program Chair mobile flow covers the same administrative assessment workflow as the web app, but in a touch-first interface.

## 16. Faculty Mobile Screens

Main Faculty screens:

```text
FacultyDashboardScreen.js
FacultyClassesScreen.js
FacultyAssessmentsScreen.js
FacultyReportsScreen.js
FacultyPastReportsScreen.js
SettingsScreen.js
```

### Faculty capabilities in the mobile app

- View dashboard
- View assigned classes
- Open assessment entry
- Input grades
- View report summaries
- View past reports
- Open settings

Presentation line:

> The Faculty mobile experience is focused on daily tasks: viewing assigned sections, grading students, and checking section-level report summaries.

## 17. Classes Screen

The Program Chair classes screen is one of the most feature-rich parts of the mobile app.

It supports:

- Viewing sections
- Adding/editing sections
- Assigning faculty
- Adding/editing students
- Viewing student rosters
- Creating and editing faculty accounts
- Importing CSV student lists using `expo-document-picker`

Presentation line:

> On mobile, the classes module handles section management, student rosters, and faculty assignment in one screen flow, including CSV import support.

## 18. Assessments on Mobile

Assessment logic is in:

```text
mobile/src/services/assessmentMobile.js
mobile/src/screens/ProgramChairAssessmentsScreen.js
mobile/src/screens/FacultyAssessmentsScreen.js
```

Main mobile assessment API endpoints:

```text
GET  /student-outcomes/
GET  /sections/load_all/
GET  /sections/
GET  /course-so-mappings/
POST /assessments/summary/
GET  /assessments/load_grades/
POST /assessments/save_grades/
```

What the mobile assessment flow does:

1. Load outcomes, sections, and course mappings.
2. Filter by course, section, faculty, semester, school year, or student outcome.
3. Show assessment status such as:
   - Assessed
   - Incomplete
   - Not Yet Assessed
4. Open assessment entry screen.
5. Load saved grades for the selected section and outcome.
6. Let the user input scores from 1 to 6.
7. Save grades back to the backend.

Presentation line:

> The mobile assessment screen brings together outcomes, section data, and saved grades so users can open a class, select an outcome, and grade directly from the phone.

## 19. Assessment Entry

Assessment entry screens support:

- Section selection
- Student outcome selection
- Student list
- Performance criteria or indicators
- Grade chips from 1 to 6
- Autosave behavior
- Save success feedback

This is strong to mention in a presentation because it shows the app is not just a viewer; it supports actual assessment work.

Presentation line:

> The mobile assessment entry screen is interactive. Users can select a section, choose a mapped outcome, grade each student using score chips, and save the results back to the backend.

## 20. Reports on Mobile

Mobile reports are in:

```text
ProgramChairReportsScreen.js
FacultyReportsScreen.js
```

The Program Chair reports screen supports:

- Loading dashboard-level report data
- Filtering by school year, course, section, and outcome
- Switching between SO-level and course-level views
- Editing summary table values
- Saving summary table changes
- Exporting reports as PDF using Expo Print
- Sharing exported files using Expo Sharing
- Opening past reports

Main API endpoints:

```text
GET  /reports/dashboard/
POST /reports/save_summary_table/
```

Presentation line:

> The mobile reports screen is not only for viewing. It also allows filtering, editing report summary values, saving them to the backend, and exporting reports as PDF from the device.

## 21. Export Features

The mobile app includes file export features.

### CSV export

Assessment/course data can be exported as CSV using:

- `expo-file-system`
- `expo-sharing`

### PDF export

Reports can be exported as PDF using:

- `expo-print`
- `expo-sharing`

Presentation line:

> The mobile app can generate files directly on the device. It supports CSV export for assessment-related data and PDF export for report summaries, then shares those files using the phone's sharing options.

## 22. UI Structure on Mobile

The mobile app uses reusable UI and layout components:

```text
mobile/src/components/layout/AppScreen.js
mobile/src/components/ui/InfoCard.js
mobile/src/components/ui/StatCard.js
mobile/src/components/ui/ActionCard.js
mobile/src/components/navigation/AppSidebar.js
```

This keeps the UI consistent across screens.

Common mobile UI patterns in the app:

- Hero section with title and subtitle
- Info cards
- Quick action cards
- Filter rows and dropdown pickers
- Scroll-based layouts
- Modals for forms and pickers
- Touch-friendly buttons and chips

Presentation line:

> The app uses shared mobile UI components so screens stay visually consistent and easier to maintain.

## 23. Current State of the Mobile App

Important note for the team:

The `mobile/README.md` still says the dashboard is a starter placeholder, but the current codebase is already more advanced than that.

Based on the actual source code, the mobile app already has:

- Real login flow
- Secure token storage
- Session restore
- Role-based navigation
- Program Chair dashboard
- Faculty dashboard
- Classes screen with section and student management
- Assessment filtering and entry
- Reports with export support
- Past reports screens
- Settings screen

Balanced presentation line:

> The mobile app is already functionally connected to the backend for the main workflow. Some polish and refinement can still improve it, but it is beyond a placeholder shell.

## 24. Difference Between Web and Mobile

The mobile app uses the same backend as the web app.

Shared backend:

- Same login API
- Same JWT-based authentication
- Same sections, outcomes, assessments, and reports endpoints

Main difference:

- The web app is built for larger dashboards and full desktop workflows.
- The mobile app is optimized for quick access, touch interaction, and on-the-go use.

Presentation line:

> The web app and mobile app share the same backend, business logic, and data, but the mobile app presents the workflow in a more compact, touch-first format.

## 25. Mobile Summary Script

Use this if asked to explain the mobile app:

> The mobile app is built with Expo and React Native and connects to the same Django REST API used by the web app. It supports secure login, session restore, and role-based navigation for Program Chair and Faculty users.
>
> After authentication, the app loads the correct screen flow based on role. Program Chair users can open dashboards, classes, assessments, reports, and past reports. Faculty users can open their assigned classes, input grades, and review report summaries.
>
> The app uses Axios for API requests, Expo Secure Store for token storage, and React Navigation for screen flow. It also supports mobile-specific features like CSV import, PDF export, and file sharing.
>
> Overall, the mobile app brings the assessment workflow to a handheld device while still using the same backend data and logic as the web system.

## 26. Short Answer

If someone asks, “How does the mobile app work?”, answer:

> The mobile app is a React Native version of the system. It uses secure token storage, role-based navigation, and API services to connect to the Django backend. Once the user logs in, the app loads the correct mobile screens for Program Chair or Faculty and allows them to work with classes, assessments, and reports directly on the device.

## 27. Likely Mobile App Questions and Answers

### Why did you use React Native / Expo?

> Expo and React Native let us build a mobile app using JavaScript while still creating a real native app experience for Android and iOS.

### Does the mobile app have a separate backend?

> No. It uses the same Django REST API as the web app.

### How does the mobile app store login tokens?

> It uses Expo Secure Store, which is more appropriate for mobile session storage than plain local storage.

### How does the app know whether to show Program Chair or Faculty screens?

> After login, the app stores the user role in the session. `RootNavigator` checks that role and shows the correct screen stack.

### Can the mobile app save grades?

> Yes. It loads current grades from the backend and sends updated grades back through the assessment API.

### Can the mobile app export files?

> Yes. It can export assessment/report data as CSV or PDF and share files using the device's sharing features.

### Is the mobile app only a viewer?

> No. It supports interactive workflows such as login, grading, section management, student editing, report editing, and export.

### Is the mobile app finished?

> It already supports the main workflow and is connected to the backend, but like most apps it can still benefit from more polish, testing, and UX refinement.

## 28. One Important Sentence to Remember

> The mobile app is not a separate system; it is a mobile interface for the same assessment platform, using the same backend, same data, and same core workflow as the web app.

