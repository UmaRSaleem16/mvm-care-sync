import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        detail = exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
        exc = ValidationError(detail=detail)

    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'error': True,
            'status_code': response.status_code,
            'detail': response.data,
        }
    else:
        logger.exception('Unhandled exception', exc_info=exc)
        response = Response(
            {'error': True, 'status_code': 500, 'detail': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,  # noqa: E501
        )

    return response
