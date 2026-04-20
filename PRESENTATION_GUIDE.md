# Students Outcomes Assessment System - Presentation Guide

Use this document as a shared explanation for the team before the presentation.

## 1. Short Project Explanation

Our project is a **Students Outcomes Assessment System**. It helps the Program Chair and Faculty manage outcomes-based assessment in one platform.

The system organizes:

- Student Outcomes (SOs)
- Performance Indicators and criteria
- Courses
- Course-to-SO mappings
- Class sections
- Faculty assignments
- Student enrollments
- Assessment scores
- Reports and archived semester summaries

Simple explanation:

> The system follows the assessment pipeline: define outcomes, map them to courses, assign sections and students, input scores, then generate reports.

## 2. Problem Being Solved

Student outcome assessment is often handled manually using spreadsheets and separate documents. This makes it hard to track:

- Which courses assess which outcomes
- Which faculty are assigned to sections
- Which students are enrolled
- Which outcomes are already assessed
- Whether the target performance level was achieved
- How to generate consistent reports

Presentation line:

> The problem we are solving is that student outcome assessment usually involves scattered files. Our system centralizes the workflow so assessment data can be entered once and reused for reports.

## 3. User Roles

The system has two main roles.

### Program Chair

In the database, this role is stored as `admin`.

The Program Chair can:

- Log in to the Program Chair dashboard
- Manage Student Outcomes
- Manage course mappings
- Manage classes and faculty
- View and input assessments
- Generate reports
- Finalize a semester and archive reports

### Faculty

In the database, this role is stored as `staff`.

Faculty can:

- Log in to the Faculty dashboard
- View assigned classes
- Input assessment grades
- View reports related to assigned sections

Presentation line:

> We use role-based access. Program Chairs have the full management view, while Faculty accounts focus on assigned classes and assessment input.

## 4. Tech Stack

The system uses:

- **Frontend:** React with Vite
- **Backend:** Django REST Framework
- **Database:** SQLite for development/demo
- **Authentication:** JWT tokens using SimpleJWT
- **HTTP Client:** Axios
- **Styling/UI:** Tailwind CSS and reusable React components

Presentation line:

> The system uses React for the frontend and Django REST Framework for the backend API. The frontend communicates with the backend through API endpoints, and authentication is handled using JWT tokens.

## 5. Overall Architecture

```text
React Web App
   |
   | Axios HTTP requests
   v
Django REST Framework API
   |
   | Django models, serializers, viewsets
   v
SQLite Database
```

Presentation line:

> The frontend does not directly access the database. It sends requests to the Django REST API. The backend validates the request, works with the database, and returns JSON data to the frontend.

## 6. What Is Django REST Framework?

Django REST Framework, or DRF, is the backend tool we used to create API endpoints.

An API endpoint is a URL that the frontend can request to get or send data.

Example local DRF API URLs:

```text
http://127.0.0.1:8000/api/
http://127.0.0.1:8000/api/sections/
http://127.0.0.1:8000/api/students/
http://127.0.0.1:8000/api/courses/
http://127.0.0.1:8000/api/student-outcomes/
http://127.0.0.1:8000/api/assessments/
http://127.0.0.1:8000/api/reports/dashboard/
```

Important note:

```text
Correct:   http://127.0.0.1:8000/api/sections/
Incorrect: http://172.0.0.1/api/sections/
```

`127.0.0.1` and `localhost` usually mean "this computer."

Common local addresses:

```text
Frontend: http://localhost:5173/
Backend:  http://127.0.0.1:8000/
API:      http://127.0.0.1:8000/api/
```

Presentation line:

> Django REST Framework exposes our backend data through API endpoints. For example, `/api/sections/` returns section data, `/api/courses/` returns course data, and `/api/reports/dashboard/` returns calculated report data.

Useful official DRF links:

- [Django REST Framework official site](https://www.django-rest-framework.org/)
- [Serializers](https://www.django-rest-framework.org/api-guide/serializers/)
- [ViewSets](https://www.django-rest-framework.org/api-guide/viewsets/)
- [Routers](https://www.django-rest-framework.org/api-guide/routers/)
- [Permissions](https://www.django-rest-framework.org/api-guide/permissions/)
- [Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [ViewSets and Routers tutorial](https://www.django-rest-framework.org/tutorial/6-viewsets-and-routers/)

## 7. DRF Concepts Used in the Project

### Models

Models define the database structure.

Example:

```text
StudentOutcome
- number
- title
- description
```

### Serializers

Serializers convert Django model data into JSON and validate incoming JSON before saving.

Simple explanation:

> A serializer is like a translator between Django database objects and JSON data used by the frontend.

### ViewSets

ViewSets group API behavior in one class.

A ViewSet can support:

```text
GET     list records
POST    create record
GET     retrieve one record
PUT     update record
DELETE  delete record
```

### Routers

Routers automatically generate API URLs from ViewSets.

Example from the system:

```python
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'student-outcomes', StudentOutcomeViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'assessments', AssessmentViewSet)
router.register(r'reports', ReportViewSet)
```

This creates routes like:

```text
GET    /api/sections/
POST   /api/sections/
GET    /api/sections/1/
PUT    /api/sections/1/
DELETE /api/sections/1/
```

Presentation line:

> We used DRF routers and viewsets so we did not have to manually write every API URL. The router registers each ViewSet and automatically creates standard API routes.

## 8. What Is Axios?

Axios is a JavaScript HTTP client.

In simple terms:

> Axios is the tool our React frontend uses to send requests to the Django backend.

The frontend cannot directly read the database. It must ask the backend API for data.

Example login request:

```javascript
const response = await axios.post(`${API_BASE_URL}/users/login/`, {
  email,
  password,
});
```

Meaning:

> Send the email and password to the backend login API.

Example report request:

```javascript
const res = await axios.get(`${API_BASE_URL}/reports/dashboard/`);
```

Meaning:

> Ask the backend for dashboard report data.

Common HTTP methods:

```text
GET     fetch data
POST    create or submit data
PUT     replace/update data
PATCH   partially update data
DELETE  remove data
```

Examples in our system:

```text
Login              POST /api/users/login/
Load reports       GET  /api/reports/dashboard/
Save grades        POST /api/assessments/save_grades/
Load sections      GET  /api/sections/
Import students    POST /api/sections/{id}/import-csv/
```

Presentation line:

> Axios acts as the communication layer between React and Django. React uses Axios to send HTTP requests such as GET, POST, PUT, and DELETE. Django processes the request and returns JSON data, which React displays in the interface.

Useful Axios link:

- [Axios official documentation](https://axios-http.com/docs/intro)

## 9. Login and Authentication Flow

The login flow works like this:

1. User selects a role: Program Chair or Faculty.
2. User enters email and password.
3. Frontend sends credentials to `/api/users/login/`.
4. Backend checks the email and password.
5. Backend returns JWT access and refresh tokens.
6. Frontend stores tokens in `localStorage`.
7. Frontend fetches the user details to confirm the actual role.
8. User is redirected based on role.

Routes:

```text
Program Chair -> /programchair/dashboard
Faculty       -> /faculty/dashboard
```

Presentation line:

> We do not just trust the selected role from the login screen. After login, the system fetches the user record from the backend and checks the role stored in the database.

## 10. Main Database Models

### User

Stores user account information and role.

```text
User
- email
- username
- role: admin or staff
- department
```

### StudentOutcome

Represents a required program outcome.

```text
StudentOutcome
- number
- title
- description
```

### PerformanceIndicator

Each Student Outcome can have multiple performance indicators.

```text
PerformanceIndicator
- student_outcome
- number
- description
```

### PerformanceCriterion

Each performance indicator can have rubric criteria.

```text
PerformanceCriterion
- performance_indicator
- name
- order
```

### Course

Stores course information.

```text
Course
- code
- name
- curriculum
- year_level
- semester
- credits
```

### CourseSOMapping

Connects courses to student outcomes.

```text
CourseSOMapping
- course
- curriculum
- academic_year
- semester
- mapped_sos
```

Presentation line:

> The CourseSOMapping model tells the system which student outcomes are assessed by each course.

### Section

Represents a class section for a course.

```text
Section
- name
- course
- faculty
- semester
- academic_year
- is_active
```

### Student

Stores student information.

```text
Student
- student_id
- first_name
- last_name
- program
- year_level
```

### Enrollment

Connects students to sections and courses.

```text
Enrollment
- student
- section
- course
```

### Assessment

Represents one assessment session for a section and student outcome.

```text
Assessment
- section
- student_outcome
- school_year
```

### Grade

Stores the actual score.

```text
Grade
- assessment
- student
- criterion or performance_indicator
- score
```

### ReportTemplate and SemesterArchive

Used for saved report configuration and finalized semester archives.

## 11. Main Program Chair Workflow

### Step 1: Login

The Program Chair logs in and is redirected to the Program Chair dashboard.

### Step 2: Dashboard

The dashboard shows:

- Total student outcomes assessed
- Courses mapped
- Students assessed
- Average performance
- SO assessment progress
- Recent activity
- Quick actions

The dashboard gets data from:

```text
GET /api/reports/dashboard/
```

### Step 3: Student Outcomes

Student Outcomes define what students are expected to demonstrate.

Each SO can have:

- Performance indicators
- Criteria
- Rubric-related scoring basis

### Step 4: Courses and SO Mapping

The Courses page maps courses to student outcomes.

Presentation line:

> The course mapping tells the system which outcomes are assessed by each course. This mapping is later used by the assessment and reporting modules.

### Step 5: Classes

The Classes page manages:

- Sections
- Assigned faculty
- Students
- Enrollments
- CSV student import

Presentation line:

> Sections connect a course to a real class offering. They also connect faculty and students, so the system knows who teaches the class and who should be assessed.

Important endpoints:

```text
GET  /api/sections/load_all/
POST /api/sections/bulk_save/
POST /api/sections/{id}/import-csv/
```

## 12. Assessment Workflow

The assessment flow is:

```text
Student Outcome
   ↓
Course SO Mapping
   ↓
Course
   ↓
Section
   ↓
Students
   ↓
Assessment scores
   ↓
Reports
```

Presentation line:

> The Assessment page combines data from student outcomes, course mappings, sections, and enrolled students. Once the user selects a section and SO, the system loads the students and rubric criteria, then allows scores to be saved.

Important endpoints:

```text
GET  /api/assessments/load_grades/
POST /api/assessments/save_grades/
POST /api/assessments/summary/
GET  /api/assessments/export_csv/
```

When saving grades:

1. The frontend sends section ID, SO ID, school year, and score data.
2. Backend creates or updates an `Assessment`.
3. Backend deletes old grades for that assessment.
4. Backend inserts the new grade records.
5. Backend returns how many grades were saved.

Presentation line:

> A grade is stored per student and per criterion or performance indicator. This lets the system calculate performance by student, course, section, and student outcome.

## 13. Reports Workflow

Reports are generated from saved assessment data.

Main endpoint:

```text
GET /api/reports/dashboard/
```

The report data includes:

- Total SOs assessed
- Total courses
- Total sections
- Total students
- Average performance
- Completion rate
- SO performance
- Course summary
- SO summary tables
- Filter options

The backend converts raw rubric scores into percentages:

```text
average percentage = (average raw score / 6) * 100
```

The target level is usually:

```text
80%
```

Presentation line:

> The Reports module aggregates grades and converts raw rubric scores into performance percentages. It summarizes results by student outcome, course, section, and school year.

## 14. Semester Finalization

The Program Chair can finalize the semester.

When finalized:

1. The backend builds a report snapshot.
2. It saves the snapshot into `SemesterArchive`.
3. It removes active sections and enrollments from the live semester.
4. Past reports remain available.

Endpoint:

```text
POST /api/reports/finalize_semester/
```

Presentation line:

> Finalizing a semester preserves the current report data as an archive, then clears the active sections so the next semester can start fresh.

## 15. Faculty Workflow

Faculty users have a focused workflow.

They can:

- View assigned sections
- See class rosters
- Input scores
- View section-level reports

Presentation line:

> Faculty users only see their assigned sections. This prevents faculty from accessing classes that are not assigned to them.

## 16. Is SQLite Fine?

Yes, SQLite is fine for the current project scope.

Presentation answer:

> We used SQLite because the project is currently a prototype and demonstration system. It keeps setup simple and lets us focus on the assessment workflow. However, the system is built with Django's ORM, so we can migrate to PostgreSQL later without rewriting the whole application logic.

Why SQLite is fine for now:

```text
- Easy setup
- No separate database server needed
- Built into Django defaults
- Good for development and demos
- Enough for small user volume
- Database is stored in one file
```

When PostgreSQL or MySQL would be better:

```text
- Many simultaneous users
- Heavy write concurrency
- Larger datasets
- Production backups
- Cloud database operations
- More robust database administration
```

Balanced answer:

> SQLite is fine for development, testing, demos, and small deployments. For a full production deployment with many faculty users entering grades at the same time, PostgreSQL would be a better long-term choice.

Useful links:

- [SQLite appropriate uses](https://www.sqlite.org/whentouse.html)
- [Django database documentation](https://docs.djangoproject.com/en/5.1/ref/databases/)

## 17. Security Explanation

Authentication uses JWT tokens.

After login:

1. Backend returns access and refresh tokens.
2. Frontend stores them in `localStorage`.
3. Requests include the token in the Authorization header.
4. Protected routes check if the user has a token and correct role.

Presentation line:

> Authentication uses JWT tokens. After login, the access token is sent with API requests using the Authorization header. The frontend also has route protection, so users are redirected if they try to access a route outside their role.

If asked about production improvements:

> Some backend endpoints are currently permissive for development and integration testing. For production, the next hardening step is to make all write operations require authenticated role checks.

## 18. Presentation Script

Good day. Our project is the Students Outcomes Assessment System. It is designed to help program chairs and faculty manage outcomes-based assessment in one platform.

The main problem is that assessment data is usually handled manually through spreadsheets, which makes it difficult to track course mappings, student scores, and reports consistently.

Our system has two user roles: Program Chair and Faculty. The Program Chair manages student outcomes, courses, class sections, faculty assignments, assessments, and reports. Faculty users can view their assigned sections, input student scores, and monitor performance.

Technically, the system uses React for the frontend and Django REST Framework for the backend. The frontend communicates with the backend through API endpoints, and authentication is handled using JWT tokens.

The core workflow starts with defining Student Outcomes. These outcomes are mapped to courses. Then the Program Chair creates sections, assigns faculty, and enrolls students. During assessment, scores are entered per student and per performance criterion. Finally, the reports module aggregates those scores and calculates outcome attainment, course performance, and completion rates.

One important feature is semester finalization. At the end of the semester, the Program Chair can archive the current reports, so past results are preserved while the system is prepared for the next semester.

Overall, the system helps make student outcome assessment more organized, traceable, and easier to report.

## 19. Likely Questions and Answers

### Why did you use Django REST Framework?

> Because it makes it easier to expose database models as API endpoints. It also supports serializers, viewsets, permissions, and authentication, which are useful for this kind of system.

### Why React?

> React is good for building interactive dashboards. Our app needs dynamic tables, filters, modals, forms, charts, and role-based pages, so React fits the frontend requirements.

### What is Axios?

> Axios is the JavaScript library our React frontend uses to send HTTP requests to the Django backend API.

### What is the most important relationship in the database?

> The most important relationship is the connection between courses, student outcomes, sections, students, and assessments. Courses are mapped to SOs, sections belong to courses, students are enrolled in sections, and assessments store scores for a section and SO.

### How are reports generated?

> Reports are generated by aggregating saved grades. The backend computes averages, pass rates, completion rates, and attainment percentages, then sends that structured data to the frontend for charts and tables.

### How does the system know what outcomes a course should assess?

> Through the `CourseSOMapping` model. It stores which Student Outcomes are mapped to each course for a curriculum, semester, and academic year.

### How does the system separate Program Chair and Faculty?

> Each user has a role field. Program Chair users are `admin`, while Faculty users are `staff`. The frontend redirects users based on role, and backend queries filter faculty data so staff users only see assigned sections.

### What happens when grades are saved?

> The backend creates or updates an Assessment record for the selected section, SO, and school year. Then it saves Grade records for each student and criterion or performance indicator.

### What is your target attainment?

> The reports use 80% as the target level. If the calculated attainment percentage reaches 80% or higher, the outcome is considered attained.

### Is SQLite okay?

> Yes, for our current project scope. SQLite is acceptable for development, testing, and demonstration. For full production use with many concurrent users, we would migrate to PostgreSQL or MySQL.

### What can still be improved?

> The next improvements would be stricter backend permissions, better audit logging, full password reset support, more export formats, and migration from SQLite to PostgreSQL for production.

## 20. Key Sentence to Remember

> The system follows the assessment pipeline: define outcomes, map them to courses, assign sections and students, input scores, then generate reports.

