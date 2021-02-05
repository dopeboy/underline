from django.urls import path, re_path, include
from .views import SyncAirtableView

urlpatterns = [
    path("sync_airtable", SyncAirtableView.as_view(), name="sync_airtable"),
]
