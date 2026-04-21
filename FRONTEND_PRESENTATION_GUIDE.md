# Frontend Presentation Guide

This document explains how the frontend side of the Students Outcomes Assessment System works.

## 1. What the Frontend Does

The frontend is the **React web app** inside:

```text
frontend/src
```

Its job is to:

- Show the user interface
- Handle page navigation
- Handle forms, clicks, filters, modals, and buttons
- Call the Django backend API using Axios
- Store returned data in React state
- Display data as cards, tables, charts, and reports

Short explanation:

> The frontend is the part users interact with. It displays the pages, sends requests to the backend, receives JSON data, and updates the interface.

## 2. High-Level Frontend Flow

```text
User opens React app
   ↓
React Router decides which page to show
   ↓
Page/component loads
   ↓
Axios requests data from Django API
   ↓
React stores data in component state
   ↓
UI updates and displays the data
```

Presentation line:

> The frontend handles user interaction and page display. When it needs data, it calls the Django API using Axios, then React updates the UI based on the response.

## 3. Main Frontend Files

Important files and folders:

```text
frontend/src/main.jsx
frontend/src/App.jsx
frontend/src/components/ProtectedRoute.jsx
frontend/src/pages/Login.jsx
frontend/src/pages/programchair/
frontend/src/pages/faculty/
frontend/src/components/
frontend/src/hooks/
frontend/src/data/
```

Meaning:

```text
main.jsx                  Starts the React app
App.jsx                   Defines the routes/pages
ProtectedRoute.jsx        Protects pages based on login and role
Login.jsx                 Handles login
pages/programchair        Program Chair pages
pages/faculty             Faculty pages
components                Reusable UI pieces
hooks                     Reusable data/loading logic
data                      Static or mock data files
```

## 4. React App Entry Point

The frontend starts at:

```text
frontend/src/main.jsx
```

The usual flow is:

```text
index.html
   ↓
main.jsx
   ↓
App.jsx
   ↓
selected page/component
```

Presentation line:

> The React app starts from `main.jsx`, then loads `App.jsx`, where the main routes are defined.

## 5. Routing

Routing is handled in:

```text
frontend/src/App.jsx
```

React Router maps URLs to pages.

Examples:

```jsx
<Route path="/" element={<Login />} />

<Route 
  path="/programchair/dashboard" 
  element={
    <ProtectedRoute>
      <ProgramChairDashboard />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/faculty/dashboard" 
  element={
    <ProtectedRoute>
      <FacultyDashboard />
    </ProtectedRoute>
  } 
/>
```

Common routes:

```text
/                         Login page
/programchair/dashboard   Program Chair dashboard
/programchair/courses     Courses page
/programchair/classes     Classes page
/programchair/assessment  Assessment page
/programchair/reports     Reports page
/faculty/dashboard        Faculty dashboard
/faculty/classes          Faculty classes
/faculty/assessments      Faculty assessments
/faculty/reports          Faculty reports
```

Presentation line:

> The frontend uses React Router. `App.jsx` maps each URL path to a specific page, such as the login page, Program Chair dashboard, Faculty dashboard, Courses page, Assessment page, and Reports page.

## 6. Protected Routes

Protected pages use:

```text
frontend/src/components/ProtectedRoute.jsx
```

This component checks:

```javascript
const accessToken = localStorage.getItem('accessToken')
const userRole = localStorage.getItem('userRole')
```

If there is no token:

```text
User is redirected to login
```

If a Faculty user opens a Program Chair page:

```text
User is redirected to /faculty/dashboard
```

If a Program Chair user opens a Faculty page:

```text
User is redirected to /programchair/dashboard
```

Presentation line:

> ProtectedRoute checks if the user has a login token and whether their role is allowed for the route. This prevents users from opening pages outside their role.

## 7. Login Page

Login is handled in:

```text
frontend/src/pages/Login.jsx
```

Login flow:

1. User selects Program Chair or Faculty.
2. User enters email and password.
3. React sends the login request using Axios.
4. Backend returns JWT tokens.
5. Frontend stores tokens in `localStorage`.
6. Frontend fetches the user details.
7. Frontend checks the actual role from the backend.
8. User is redirected to the correct dashboard.

Login request example:

```javascript
const response = await axios.post(`${API_BASE_URL}/users/login/`, {
  email,
  password,
});
```

Token storage:

```javascript
localStorage.setItem("accessToken", access);
localStorage.setItem("refreshToken", refresh);
localStorage.setItem("userRole", userRole);
localStorage.setItem("userId", String(userId));
```

Role redirect:

```text
admin -> /programchair/dashboard
staff -> /faculty/dashboard
```

Presentation line:

> The login page sends the email and password to the Django API. If the login is valid, the backend returns JWT tokens. The frontend stores those tokens and uses the user role to redirect to the correct dashboard.

## 8. What Is Axios?

Axios is the HTTP client used by the frontend.

Simple explanation:

> Axios is the tool React uses to communicate with the Django backend.

The frontend cannot directly access the database. It requests data from backend API endpoints.

API base URL:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
```

Meaning:

```text
If VITE_API_URL exists, use it.
Otherwise, use http://localhost:8000/api.
```

Example request:

```javascript
const response = await axios.get(`${API_BASE_URL}/reports/dashboard/`);
```

Meaning:

```text
Request report dashboard data from Django.
```

Common methods:

```text
GET     Fetch data
POST    Submit or create data
PUT     Replace or update data
PATCH   Partially update data
DELETE  Remove data
```

Presentation line:

> Axios is the bridge between React and Django. React uses Axios to send API requests, and Django returns JSON data for the frontend to display.

## 9. React State

React state stores data that can change on the page.

Example:

```javascript
const [dashboardData, setDashboardData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");
```

Meaning:

```text
dashboardData  Stores backend data
isLoading      Tracks whether data is still loading
error          Stores an error message if request fails
```

Typical loading flow:

```javascript
useEffect(() => {
  fetchDashboardData();
}, []);
```

Meaning:

> When the page opens, React automatically calls the function to load dashboard data.

Presentation line:

> React state controls what the user sees. While data is loading, the page can show a loading message. Once Axios receives data from the backend, React updates the state and re-renders the page.

## 10. React Hooks Used

Common hooks in the frontend:

```text
useState      Stores changing data
useEffect     Runs code when a page loads or when data changes
useMemo       Optimizes calculated values
useCallback   Optimizes reusable functions
useRef        References DOM elements or persistent values
```

Examples:

```javascript
useState
```

Used for data like forms, loading states, selected filters, and API responses.

```javascript
useEffect
```

Used to load data when a page opens.

```javascript
useMemo
```

Used to calculate derived data like dashboard stats from API results.

```javascript
useCallback
```

Used for functions like `fetchReport` or `fetchDashboardData` so they do not get recreated unnecessarily.

Presentation line:

> The frontend uses React hooks to manage state, load data, and update the interface efficiently.

## 11. Program Chair Pages

Program Chair pages are in:

```text
frontend/src/pages/programchair
```

Main pages:

```text
Dashboard.jsx         Summary and quick actions
StudentOutcomes.jsx   Student outcome management
Courses.jsx           Course and SO mapping
Classes.jsx           Sections, faculty, and students
Assessment.jsx        Score input
Reports.jsx           Analytics and reports
PastReports.jsx       Archived reports
```

Presentation line:

> The Program Chair side contains the full management workflow: dashboard, student outcomes, courses, classes, assessment, and reports.

## 12. Faculty Pages

Faculty pages are in:

```text
frontend/src/pages/faculty
```

Main pages:

```text
Dashboard.jsx       Faculty summary
Classess.jsx        Assigned classes
Assessments.jsx     Assessment score input
Reports.jsx         Reports for assigned sections
PastReports.jsx     Archived reports
```

Presentation line:

> The Faculty side is a more limited interface. It focuses on assigned sections, grade input, and reports.

## 13. Reusable Components

Components are in:

```text
frontend/src/components
```

Important folders:

```text
components/ui/             Buttons, dialogs, inputs, tables, etc.
components/dashboard/      Navbar, footer, getting started modal
components/courses/        Course cards, modals, mapping matrix
components/classes/        Section cards, faculty forms, student forms
components/assessment/     Assessment-related views and modals
components/reports/        Report cards, charts, summary tables
components/grading/        Grade input and student grading table
```

Presentation line:

> The frontend is component-based. Repeated UI parts like buttons, cards, tables, modals, and report sections are separated into reusable components.

## 14. Dashboard Page Example

Program Chair dashboard:

```text
frontend/src/pages/programchair/Dashboard.jsx
```

What it does:

1. Loads dashboard data from the backend.
2. Stores the response in React state.
3. Extracts metrics like total SOs, courses, students, and average performance.
4. Displays stat cards, progress bars, quick actions, and recent activity.

API used:

```text
GET /api/reports/dashboard/
```

Presentation line:

> The dashboard is not hardcoded. It requests live data from the reports API, then displays metrics like total student outcomes, mapped courses, students assessed, and average performance.

## 15. Reports Page Example

Reports page:

```text
frontend/src/pages/programchair/Reports.jsx
```

What it does:

- Loads report data
- Supports filters
- Shows SO-level reports
- Shows course-level summaries
- Exports report view as PDF through browser print
- Finalizes semester
- Saves custom summary table changes

Main API calls:

```text
GET  /api/reports/dashboard/
POST /api/reports/save_summary_table/
POST /api/reports/finalize_semester/
```

Presentation line:

> The Reports page calls the backend reports API, displays the calculated data, and allows the Program Chair to filter, export, save report customizations, and finalize the semester.

## 16. Assessment Page Example

Assessment page:

```text
frontend/src/pages/programchair/Assessment.jsx
frontend/src/pages/faculty/Assessments.jsx
```

The Assessment page uses multiple API endpoints:

```text
GET  /api/sections/load_all/
GET  /api/student-outcomes/
GET  /api/assessments/load_grades/
POST /api/assessments/save_grades/
POST /api/assessments/summary/
```

Frontend responsibility:

- Let user select course, section, and SO
- Display students
- Display criteria or indicators
- Let user input scores
- Submit scores to backend
- Show assessment status

Presentation line:

> The Assessment page combines several backend resources: sections, students, student outcomes, and previous grades. The user enters scores, then Axios sends those scores to the assessment API.

## 17. How Data Appears on Screen

Frontend data rendering flow:

```text
Backend sends JSON
   ↓
Axios receives JSON
   ↓
React saves JSON in state
   ↓
JSX maps data into UI
```

Example concept:

```javascript
stats.map((stat) => (
  <div>{stat.value}</div>
))
```

Meaning:

```text
For each stat in the data, React creates a visual UI element.
```

Presentation line:

> React uses JSX to convert data into visible UI elements. When the data changes, React automatically updates the displayed page.

## 18. Loading and Error States

Many pages track loading and error states.

Example:

```javascript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState("");
```

Possible UI states:

```text
Loading     Show spinner or loading text
Success     Show data
Error       Show error message and retry option
Empty       Show no data message
```

Presentation line:

> The frontend handles loading, success, error, and empty states so the user gets feedback while data is being requested from the backend.

## 19. Frontend and Backend Relationship

The frontend is responsible for:

```text
UI display
Navigation
User input
Calling APIs
Showing results
```

The backend is responsible for:

```text
Authentication
Validation
Database operations
Business logic
Report calculations
Returning JSON
```

Presentation line:

> The frontend focuses on interaction and display, while the backend handles database operations and calculations.

## 20. Frontend Summary Script

Use this if asked to explain the frontend:

> The frontend is built with React and Vite. React Router handles page navigation, so each URL loads a specific page like dashboard, courses, classes, assessment, or reports. ProtectedRoute checks the user token and role before allowing access to pages.
>
> The frontend communicates with the Django backend using Axios. For example, the dashboard calls `/api/reports/dashboard/`, the login page calls `/api/users/login/`, and the assessment page calls `/api/assessments/save_grades/`.
>
> Data from the backend is returned as JSON. React stores that data in state using hooks like `useState` and `useEffect`, then displays it through reusable components such as cards, tables, modals, and charts.
>
> In short, the frontend is responsible for user interaction, page navigation, displaying data, and sending user actions to the backend API.

## 21. Short Answer

If someone asks, "How does the frontend work?", answer:

> The frontend is a React app. It uses React Router to switch between pages, ProtectedRoute to restrict access based on user role, Axios to communicate with the Django API, and React state to display live data from the backend. The pages are split by role: Program Chair pages for managing the whole assessment process, and Faculty pages for assigned classes and grading.

## 22. Likely Frontend Questions and Answers

### Why did you use React?

> React is good for building interactive dashboards. Our system needs dynamic tables, filters, modals, forms, charts, and role-based pages, so React fits the frontend requirements.

### What is Vite?

> Vite is the development and build tool for the React app. It runs the local frontend server and builds the production frontend files.

### What is React Router?

> React Router handles navigation. It maps URLs like `/programchair/dashboard` or `/faculty/reports` to the correct React page.

### What is ProtectedRoute?

> ProtectedRoute is a custom component that checks if the user is logged in and if their role is allowed to access the requested page.

### What is Axios?

> Axios is the library React uses to send HTTP requests to the Django backend API.

### How does the frontend get data?

> It sends Axios requests to API endpoints such as `/api/reports/dashboard/`, then stores the JSON response in React state.

### How does the frontend know where to redirect after login?

> After login, it fetches the user's role from the backend. If the role is `admin`, it redirects to the Program Chair dashboard. If the role is `staff`, it redirects to the Faculty dashboard.

### Is the dashboard hardcoded?

> No. The dashboard requests data from the backend reports API and displays the returned metrics.

### How does the frontend save grades?

> The Assessment page collects the selected section, student outcome, school year, and student scores, then sends them to `/api/assessments/save_grades/` using Axios.

### What does React state do?

> React state stores changing data on the page, such as API responses, selected filters, form inputs, loading states, and error messages.

## 23. Important Sentence to Remember

> The frontend displays the workflow, but the backend owns the data and calculations. React asks the API for data, stores the response in state, and renders it for the user.

