import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

# Delete existing users
User.objects.all().delete()
print("Deleted all users")

# Create test staff user
staff_user = User.objects.create_user(
    email='staff@test.com',
    username='staff@test.com',
    password='Staff123!',
    first_name='Test',
    last_name='Staff',
    role='staff'
)

# Create test admin user
admin_user = User.objects.create_user(
    email='admin@test.com',
    username='admin@test.com',
    password='Admin123!',
    first_name='Test',
    last_name='Admin',
    role='admin'
)

print('Created users:')
for u in User.objects.all():
    print(f"  - {u.email} ({u.role})")
