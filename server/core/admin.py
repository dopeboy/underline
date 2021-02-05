from django.contrib import admin
from django.utils.html import format_html

from .models import League, Team, Position, Player


class TeamAdmin(admin.ModelAdmin):
    readonly_fields = ["logo"]  # this is for the change form

    def logo(self, obj):
        return format_html(
            '<img src="{0}" style="max-width: 200px" />'.format(obj.logo_url)
        )


class PlayerAdmin(admin.ModelAdmin):
    list_per_page = 500
    readonly_fields = ["headshot"]  # this is for the change form

    def headshot(self, obj):
        return format_html(
            '<img src="{0}" style="max-width: 200px" />'.format(obj.headshot_url)
        )


admin.site.register(Team, TeamAdmin)

# Register your models here.
admin.site.register(League)
admin.site.register(Position)
admin.site.register(Player, PlayerAdmin)
