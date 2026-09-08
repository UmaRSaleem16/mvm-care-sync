import logging

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger('caresync')

RESEND_API_URL = 'https://api.resend.com/emails'


class ResendEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        api_key = getattr(settings, 'RESEND_API_KEY', '')
        if not api_key:
            logger.warning('ResendEmailBackend: RESEND_API_KEY not set — emails skipped')
            return 0

        sent = 0
        for msg in email_messages:
            html_body = None
            for content, mime in getattr(msg, 'alternatives', []):
                if mime == 'text/html':
                    html_body = content
                    break

            from_email = msg.from_email or settings.DEFAULT_FROM_EMAIL
            payload = {
                'from': f'MVM CareSync <{from_email}>',
                'to': msg.to,
                'subject': msg.subject,
            }
            if html_body:
                payload['html'] = html_body
            else:
                payload['text'] = msg.body or ' '

            try:
                resp = requests.post(
                    RESEND_API_URL,
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json',
                    },
                    json=payload,
                    timeout=15,
                )
                resp.raise_for_status()
                logger.info('Resend: sent to %s — %s', msg.to, msg.subject)
                sent += 1
            except requests.HTTPError as exc:
                logger.error('Resend HTTP error %s: %s', exc.response.status_code, exc.response.text)
                if not self.fail_silently:
                    raise
            except Exception as exc:
                logger.error('Resend send failed: %s', exc)
                if not self.fail_silently:
                    raise

        return sent
