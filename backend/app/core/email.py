"""
Email service for sending invitations and notifications
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP (async)
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body (optional)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    # If SMTP is not configured, log and return False
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.warning(f"SMTP not configured. Would send email to {to_email} with subject: {subject}")
        logger.info(f"Email content:\n{html_body}")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.FROM_EMAIL
        msg['To'] = to_email
        
        # Add text and HTML parts
        if text_body:
            text_part = MIMEText(text_body, 'plain')
            msg.attach(text_part)
        
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Send email using aiosmtplib
        # According to Brevo docs: https://developers.brevo.com/docs/smtp-integration
        # - Port 587 or 2525: Use STARTTLS (non-encrypted connection upgraded to TLS)
        # - Port 465: Use SSL/TLS (encrypted connection from start)
        # We're using port 587, so we use start_tls=True
        smtp = aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=True,  # STARTTLS for port 587 (Brevo requirement)
        )
        await smtp.connect()
        await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        await smtp.send_message(msg)
        await smtp.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}", exc_info=True)
        return False


async def send_invitation_email(
    to_email: str,
    inviter_name: str,
    family_name: str,
    invitation_token: str,
    is_new_user: bool = False
) -> bool:
    """
    Send family invitation email
    
    Args:
        to_email: Recipient email address
        inviter_name: Name of the person sending the invitation
        family_name: Name of the family
        invitation_token: Invitation token for accepting
        is_new_user: Whether this is a new user (needs to set password)
    
    Returns:
        True if email sent successfully, False otherwise
    """
    invitation_url = f"{settings.FRONTEND_URL}/accept-invitation?token={invitation_token}"
    
    if is_new_user:
        subject = f"Invitation to join {family_name} on WealthoMeter"
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #22c55e;">Welcome to WealthoMeter!</h2>
              <p>Hello,</p>
              <p><strong>{inviter_name}</strong> has invited you to join the <strong>{family_name}</strong> family on WealthoMeter.</p>
              <p>WealthoMeter helps families track and manage their wealth together.</p>
              <p style="margin: 30px 0;">
                <a href="{invitation_url}" 
                   style="background-color: #22c55e; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation & Set Up Account
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="{invitation_url}" style="color: #22c55e; word-break: break-all;">{invitation_url}</a>
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This invitation link will expire in 7 days.
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
        """
        text_body = f"""
        Welcome to WealthoMeter!
        
        {inviter_name} has invited you to join the {family_name} family on WealthoMeter.
        
        WealthoMeter helps families track and manage their wealth together.
        
        Accept your invitation and set up your account:
        {invitation_url}
        
        This invitation link will expire in 7 days.
        
        If you didn't expect this invitation, you can safely ignore this email.
        """
    else:
        subject = f"Invitation to join {family_name} on WealthoMeter"
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #22c55e;">You've been invited!</h2>
              <p>Hello,</p>
              <p><strong>{inviter_name}</strong> has invited you to join the <strong>{family_name}</strong> family on WealthoMeter.</p>
              <p style="margin: 30px 0;">
                <a href="{invitation_url}" 
                   style="background-color: #22c55e; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="{invitation_url}" style="color: #22c55e; word-break: break-all;">{invitation_url}</a>
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This invitation link will expire in 7 days.
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
        """
        text_body = f"""
        You've been invited!
        
        {inviter_name} has invited you to join the {family_name} family on WealthoMeter.
        
        Accept your invitation:
        {invitation_url}
        
        This invitation link will expire in 7 days.
        
        If you didn't expect this invitation, you can safely ignore this email.
        """
    
    return await send_email(to_email, subject, html_body, text_body)

