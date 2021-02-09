from django.contrib import admin
from django.utils.html import format_html

from .models import League, Team, Position, Player, CurrentDate, Line, Game


class TeamAdmin(admin.ModelAdmin):
    readonly_fields = ["logo"]  # this is for the change form

    def logo(self, obj):
        return format_html(
            '<img src="{0}" style="max-width: 200px" />'.format(obj.logo_url)
        )

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PlayerAdmin(admin.ModelAdmin):
    list_per_page = 500
    readonly_fields = ["headshot"]  # this is for the change form

    def headshot(self, obj):
        return format_html(
            '<img src="{0}" style="max-width: 200px" />'.format(obj.headshot_url)
        )

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class CurrentDateAdmin(admin.ModelAdmin):
    def has_add_permission(self, request, obj=None):
        return False


class LineAdmin(admin.ModelAdmin):
    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class GameAdmin(admin.ModelAdmin):
    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Team, TeamAdmin)

# Register your models here.
admin.site.register(League)
admin.site.register(Position)
admin.site.register(Line, LineAdmin)
admin.site.register(CurrentDate, CurrentDateAdmin)
admin.site.register(Player, PlayerAdmin)
admin.site.register(Game, GameAdmin)
