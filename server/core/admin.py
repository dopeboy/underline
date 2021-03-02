import json
from django.contrib import admin
from django.db import models
from django.utils.html import format_html
from django.forms import widgets
from django.db.models import JSONField
from pygments import highlight
from pygments.lexers import JsonLexer
from pygments.formatters import HtmlFormatter
from django.utils.safestring import mark_safe


from .models import (
    League,
    Team,
    Position,
    Player,
    CurrentDate,
    Line,
    Game,
    Subline,
    Slip,
    Pick,
    Deposit,
)


class TeamAdmin(admin.ModelAdmin):
    readonly_fields = ["logo"]  # this is for the change form
    list_display = [field.name for field in Team._meta.fields if field.name != "id"]

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
    list_display = [field.name for field in Player._meta.fields if field.name != "id"]

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


class SublineAdmin(admin.TabularInline):
    model = Subline
    extra = 1
    can_delete = False


def make_published(modeladmin, request, queryset):
    sublines = Subline.objects.filter(line__in=queryset)
    for s in sublines:
        s.visible=False
        s.save()


make_published.short_description = (
    "For the selected lines, mark all sublines that roll up to them as invisible"
)


class LineAdmin(admin.ModelAdmin):
    list_per_page = 500
    list_display = [field.name for field in Line._meta.fields if field.name != "id"]
    list_display.append("gametime")
    list_editable = (
        "nba_points_actual",
        "invalidated",
    )
    inlines = [
        SublineAdmin,
    ]
    actions = [make_published]

    def get_queryset(self, request):
        qs = super(LineAdmin, self).get_queryset(request)
        qs = qs.annotate(models.Count("game__datetime"))
        return qs

    def gametime(self, obj):
        return obj.game.datetime

    gametime.admin_order_field = "game__datetime"


class GameAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Game._meta.fields if field.name != "id"]

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class CurrentDateAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in CurrentDate._meta.fields if field.name != "id"
    ]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class DepositAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Deposit._meta.fields if field.name != "id"]

    readonly_fields = (
        "prettified_transaction_details",
        "prettified_order_details",
    )
    exclude = [
        "transaction_details",
        "order_details",
    ]

    def prettify_json(self, data):
        # Convert the data to sorted, indented JSON
        response = json.dumps(data, sort_keys=True, indent=2)

        # Truncate the data. Alter as needed
        response = response[:5000]

        # Get the Pygments formatter
        formatter = HtmlFormatter(style="colorful")

        # Highlight the data
        response = highlight(response, JsonLexer(), formatter)

        # Get the stylesheet
        style = "<style>" + formatter.get_style_defs() + "</style><br>"

        # Safe the output
        return mark_safe(style + response)

    def prettified_transaction_details(self, instance):
        return self.prettify_json(instance.transaction_details)

    def prettified_order_details(self, instance):
        return self.prettify_json(instance.order_details)

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


class PickTabularInline(admin.TabularInline):
    list_display = [field.name for field in Pick._meta.fields if field.name != "id"]
    readonly_fields = ("won",)
    model = Pick
    extra = 0
    can_delete = False


class SlipAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Slip._meta.fields if field.name != "id"]
    list_display.append("payout_amount")
    list_display.append("won")
    list_display.append("complete")
    list_display.append("invalidated")
    list_display.append("is_owner_ftp")
    inlines = [
        PickTabularInline,
    ]


class PickAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Pick._meta.fields if field.name != "id"]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Team, TeamAdmin)

# Register your models here.
admin.site.register(League)
admin.site.register(Slip, SlipAdmin)
admin.site.register(Position)
admin.site.register(Pick, PickAdmin)
admin.site.register(Line, LineAdmin)
admin.site.register(CurrentDate, CurrentDateAdmin)
admin.site.register(Player, PlayerAdmin)
admin.site.register(Game, GameAdmin)
admin.site.register(Deposit, DepositAdmin)
