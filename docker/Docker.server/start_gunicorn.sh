#!/bin/bash

NAME="app-wsgi"                         # Name of the application
DJANGODIR=/code/server                  # Django project directory
WSGI_MODULE=underline.wsgi:application    # Django WSGI module
DJANGO_SETTINGS_MODULE=underline.settings # Django settings
SOCKFILE=/tmp/gunicorn.sock             # we will communicate using this unix socket
LOGFILE=/var/log/gunicorn/access.log    # WSGI log here
USER=app                                # the user to run as
GROUP=app                               # the group to run as
NUM_WORKERS=2                           # how many worker processes should spawn
TIMEOUT=120

echo "Starting $NAME as `whoami`"

EXTRAOPTS=''
if [ "${DJANGO_DEBUG}" = "true" ]; then
    EXTRAOPTS='--reload'
fi

# Start gunicorn
exec gunicorn \
    --name $NAME \
    --workers $NUM_WORKERS \
    --user $USER \
    --timeout $TIMEOUT \
    --group $GROUP \
    --log-level debug \
    --bind unix:$SOCKFILE \
    --access-logfile $LOGFILE \
    $EXTRAOPTS \
    $WSGI_MODULE
