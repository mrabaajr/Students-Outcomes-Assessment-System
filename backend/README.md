# Backend structure
This is the Django REST API backend for the Students Outcomes Assessment System.

## Setup

1. Create virtual environment:
   ```
   python -m venv venv
   ```

2. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```
   python manage.py makemigrations
   python manage.py migrate
   ```

5. Create superuser:
   ```
   python manage.py createsuperuser
   ```

6. Run server:
   ```
   python manage.py runserver
   ```

## API Endpoints

- Authentication: `/api/auth/login/`, `/api/auth/register/`, `/api/auth/users/me/`
- Assessments: `/api/assessments/outcomes/`, `/api/assessments/assessments/`, `/api/assessments/results/`
- Token: `/api/token/`, `/api/token/refresh/`
