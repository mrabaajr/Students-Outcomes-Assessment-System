import string
import secrets
from django.core.mail import send_mail
from django.conf import settings


def generate_temporary_password(length=12):
    """
    Generate a secure temporary password.
    Includes uppercase, lowercase, digits, and special characters.
    """
    characters = string.ascii_letters + string.digits + '!@#$%^&*'
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password


def send_account_creation_email(user, temporary_password):
    """
    Send account creation email with temporary password.
    """
    subject = 'Your Assessment System Account Created'
    
    # Determine dashboard URL based on user role
    if user.role == 'admin':
        dashboard_url = 'http://localhost:5173/programchair/dashboard'
    else:
        dashboard_url = 'http://localhost:5173/staff/dashboard'
    
    message = f"""
Hello {user.first_name} {user.last_name},

Your account has been created on the Students Outcomes Assessment System.

Email: {user.email}
Temporary Password: {temporary_password}

Please log in using your email and the temporary password above. We strongly recommend changing your password after your first login.

After logging in, you will be directed to your dashboard:
{dashboard_url}

If you have any questions or issues, please contact the system administrator.

Best regards,
Assessment System Team
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


def send_password_reset_email(user, reset_token):
    """
    Send password reset email.
    """
    subject = 'Password Reset Request - Assessment System'
    
    reset_url = f'http://localhost:5173/reset-password?token={reset_token}'
    
    message = f"""
Hello {user.first_name} {user.last_name},

You requested a password reset. Click the link below to reset your password:

{reset_url}

This link will expire in 24 hours.

If you did not request this, please ignore this email.

Best regards,
Assessment System Team
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False
