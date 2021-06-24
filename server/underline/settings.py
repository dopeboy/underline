import django_heroku
import os
import environ
from celery.schedules import crontab
from datetime import timedelta


root = environ.Path(__file__) - 2  # two folders back (/a/b/ - 2 = /)
DEFAULT_ENV_PATH = environ.Path(__file__) - 3  # default location of .env file
DEFAULT_ENV_FILE = DEFAULT_ENV_PATH.path(".env")()
env = environ.Env(
    DEBUG=(bool, False),
)  # set default values and casting
environ.Env.read_env(env.str("ENV_PATH", DEFAULT_ENV_FILE))  # reading .env file

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = root()

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env("DJANGO_DEBUG", default=False)

ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

# Application definition

INSTALLED_APPS = [
    # Standard Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party apps
    "graphene_django",
    "corsheaders",
    # Our apps
    "underline",
    "accounts",
    "core",
    "import_export",
]

if DEBUG:
    INSTALLED_APPS.append("debug_toolbar")

MIDDLEWARE = []

if DEBUG:
    MIDDLEWARE += [
        "debug_toolbar.middleware.DebugToolbarMiddleware",
    ]

MIDDLEWARE += [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

AUTHENTICATION_BACKENDS = [
    "graphql_jwt.backends.JSONWebTokenBackend",
    "django.contrib.auth.backends.ModelBackend",
]

ROOT_URLCONF = "underline.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "underline.wsgi.application"


# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases

DATABASES = {
    "default": env.db(),
}

AUTH_USER_MODEL = "accounts.User"

# Password validation
# https://docs.djangoproject.com/en/2.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "US/Pacific"

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.1/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = "/code/server/static"

REACT_APP_DIR = os.path.join("client")
if not DEBUG:
    STATICFILES_DIRS = [
        os.path.join(REACT_APP_DIR, "build", "static"),
    ]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

###################
# Custom settings, not standard in Django
###################
# Graphene

GRAPHENE = {
    "SCHEMA": "underline.schema.schema",  # Where your Graphene schema lives
    "RELAY_CONNECTION_MAX_LIMIT": 50,
    "MIDDLEWARE": [
        "graphql_jwt.middleware.JSONWebTokenMiddleware",
    ],
}

GRAPHQL_JWT = {
    "JWT_EXPIRATION_DELTA": timedelta(days=30),
}

GRAPHQL_DEBUG = env("GRAPHQL_DEBUG", default=DEBUG)

if not DEBUG:
    django_heroku.settings(locals())
    # TODO - needs more investigation. For now:
    # https://github.com/kennethreitz/dj-database-url/issues/107
    del DATABASES["default"]["OPTIONS"]["sslmode"]


# 3rd party settings
AIRTABLE_API_KEY = "keySnrFwxbtOCs96y"
SENDGRID_API_KEY = (
    "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"
)
FANTASY_DATA_API_KEY = "5027edf53fce4983bc2db1733e760b9a"

# Environmental
if DEBUG:
    DOMAIN = "http://127.0.0.1:5000"
    INSTALLED_APPS.append("django_extensions")

    # For debug toolbar
    DEBUG_TOOLBAR_CONFIG = {"SHOW_TOOLBAR_CALLBACK": lambda _request: DEBUG}
else:
    SECURE_SSL_REDIRECT = True
    DOMAIN = "https://underlinefantasy.com"

CELERY_BROKER_URL = "redis://redis:6379" if DEBUG else os.environ.get("REDIS_URL")
CELERY_RESULT_BACKEND = "redis://redis:6379" if DEBUG else os.environ.get("REDIS_URL")
CELERY_ACCEPT_CONTENT = ["application/json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TIMEZONE = "US/Pacific"
CELERY_RESULT_SERIALIZER = "json"
CELERY_BEAT_SCHEDULE = {
    "remove_lines_when_game_starts": {
        "task": "core.tasks.remove_lines_when_game_starts",
        "schedule": crontab(minute="*/30"),
    },
    "top_off_free_to_play_user_balances": {
        "task": "core.tasks.top_off_free_to_play_user_balances",
        "schedule": crontab(minute=0, hour=0),
    },
    "update_player_scores": {
        "task": "core.tasks.update_player_scores",
        "schedule": crontab(minute=0),
    },
    "send_slip_emails": {
        "task": "core.tasks.send_slip_emails",
        "schedule": crontab(minute=0, hour=8),
    },
}
