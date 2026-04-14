#!/usr/bin/env python
"""
Test SMTP Email Configuration
Verifies that the email backend can connect and send test emails.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.mail import send_mail, get_connection
from django.conf import settings

def test_smtp_connection():
    """Test SMTP connection without sending email"""
    print("=" * 60)
    print("TESTING SMTP CONNECTION")
    print("=" * 60)
    
    print(f"\n📧 Email Configuration:")
    print(f"  EMAIL_HOST:       {settings.EMAIL_HOST}")
    print(f"  EMAIL_PORT:       {settings.EMAIL_PORT}")
    print(f"  EMAIL_USE_TLS:    {settings.EMAIL_USE_TLS}")
    print(f"  EMAIL_HOST_USER:  {settings.EMAIL_HOST_USER}")
    print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    
    try:
        print("\n🔗 Testing connection to SMTP server...")
        connection = get_connection()
        connection.open()
        connection.close()
        print("✅ SMTP connection successful!")
        return True
    except Exception as e:
        print(f"❌ SMTP connection failed: {str(e)}")
        return False

def test_send_email(recipient_email=None):
    """Test sending an actual email"""
    print("\n" + "=" * 60)
    print("TESTING EMAIL SEND")
    print("=" * 60)
    
    if not recipient_email:
        recipient_email = settings.EMAIL_HOST_USER
        print(f"\n📨 Using EMAIL_HOST_USER as recipient: {recipient_email}")
    else:
        print(f"\n📨 Sending test email to: {recipient_email}")
    
    try:
        subject = "SMTP Test - Assessment System"
        message = """
        Hello,
        
        This is a test email from the Students Outcomes Assessment System.
        
        If you received this, your SMTP configuration is working correctly!
        
        Best regards,
        Assessment System
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )
        print(f"✅ Test email sent successfully to {recipient_email}!")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n🚀 Starting SMTP Tests\n")
    
    # Test connection
    connection_ok = test_smtp_connection()
    
    if connection_ok:
        # Ask if user wants to send test email
        response = input("\n\n📬 Send a test email? (y/n): ").strip().lower()
        if response == 'y':
            recipient = input("Enter recipient email (press Enter to use EMAIL_HOST_USER): ").strip()
            if recipient:
                test_send_email(recipient)
            else:
                test_send_email()
    
    print("\n" + "=" * 60)
    print("✨ Test Complete")
    print("=" * 60 + "\n")
