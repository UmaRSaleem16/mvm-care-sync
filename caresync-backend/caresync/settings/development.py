from .base import *  # noqa

DEBUG = True

REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] += [  # noqa
    'rest_framework.renderers.BrowsableAPIRenderer',
]

CORS_ALLOW_ALL_ORIGINS = True
