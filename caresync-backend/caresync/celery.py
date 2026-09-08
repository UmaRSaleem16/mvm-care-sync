import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'caresync.settings.development')

app = Celery('caresync')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
