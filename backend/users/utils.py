import string
import secrets
from django.conf import settings
from django.core.mail import EmailMessage, get_connection

from .models import EmailSettings


def generate_temporary_password(length=12):
    """
    Generate a secure temporary password.
    Includes uppercase, lowercase, digits, and special characters.
    """
    characters = string.ascii_letters + string.digits + '!@#$%^&*'
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password


def get_active_email_settings():
    saved_settings = EmailSettings.objects.order_by("-updated_at").first()
    if saved_settings:
        return {
            "host": saved_settings.email_host,
            "port": saved_settings.email_port,
            "use_tls": saved_settings.email_use_tls,
            "username": saved_settings.email_host_user,
            "password": saved_settings.email_host_password,
            "from_email": saved_settings.default_from_email,
            "is_custom": True,
        }

    return {
        "host": settings.EMAIL_HOST,
        "port": settings.EMAIL_PORT,
        "use_tls": settings.EMAIL_USE_TLS,
        "username": settings.EMAIL_HOST_USER,
        "password": settings.EMAIL_HOST_PASSWORD,
        "from_email": settings.DEFAULT_FROM_EMAIL,
        "is_custom": False,
    }


def send_system_email(subject, message, recipient_list):
    email_settings = get_active_email_settings()
    connection = get_connection(
        host=email_settings["host"],
        port=email_settings["port"],
        username=email_settings["username"],
        password=email_settings["password"],
        use_tls=email_settings["use_tls"],
        fail_silently=False,
    )
    email = EmailMessage(
        subject=subject,
        body=message,
        from_email=email_settings["from_email"],
        to=recipient_list,
        connection=connection,
    )
    email.send()


def send_account_creation_email(user, temporary_password):
    """
    Send account creation email with temporary password.
    """
    subject = 'Your Assessment System Account Created'
    
    # Determine dashboard URL based on user role
    if user.role == 'admin':
        dashboard_url = 'http://localhost:5173/programchair/dashboard'
    else:
        dashboard_url = 'http://localhost:5173/faculty/dashboard'
    
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
        send_system_email(subject, message, [user.email])
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
        send_system_email(subject, message, [user.email])
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False
