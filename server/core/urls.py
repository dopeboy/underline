from django.urls import path, re_path, include
from .views import SyncGames, SyncPlayers, SyncLines, RunWholeShebang


urlpatterns = [
    path("sync_players", SyncPlayers.as_view(), name="sync_players"),
    path("sync_games", SyncGames.as_view(), name="sync_games"),
    path("sync_lines", SyncLines.as_view(), name="sync_lines"),
    path("run_whole_shebang", RunWholeShebang.as_view(), name="run_whole_shebang"),
]
