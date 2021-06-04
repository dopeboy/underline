import json
from django.contrib import admin
from django.conf import settings
from django.db import models
from django.utils.html import format_html
from django.forms import widgets
from django.db.models import JSONField
from pygments import highlight
from pygments.lexers import JsonLexer
from pygments.formatters import HtmlFormatter
from django.utils.safestring import mark_safe
from sendgrid import SendGridAPIClient
from random import randint
from sendgrid.helpers.mail import Mail

from import_export.admin import ExportMixin

from import_export import resources

from accounts.models import User
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
    FreeToPlaySlip,
    PaidSlip,
    Pick,
    Deposit,
    LineCategory,
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
    search_fields = ["name"]

    def headshot(self, obj):
        return format_html(
            '<img src="{0}" style="max-width: 200px" />'.format(obj.headshot_url)
        )


class SublineAdmin(admin.TabularInline):
    model = Subline
    extra = 1
    can_delete = False


def make_sublines_invisible(modeladmin, request, queryset):
    sublines = Subline.objects.filter(line__in=queryset)
    for s in sublines:
        s.visible = False
        s.save()


make_sublines_invisible.short_description = (
    "For the selected lines, mark all sublines that roll up to them as invisible"
)


class LineResource(resources.ModelResource):
    class Meta:
        model = Line


class LineAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = LineResource
    list_per_page = 50
    list_display = [field.name for field in Line._meta.fields if field.name != "id"]
    list_display.append("gametime")
    list_display.append("has_subline_visible")
    list_editable = (
        "actual_value",
        "invalidated",
    )
    inlines = [
        SublineAdmin,
    ]
    actions = [make_sublines_invisible]
    ordering = ("-datetime_created",)
    autocomplete_fields = [
        "player",
    ]

    def get_queryset(self, request):
        qs = super(LineAdmin, self).get_queryset(request)
        qs = qs.annotate(models.Count("game__datetime")).select_related(
            "player", "player__team"
        )
        return qs

    def gametime(self, obj):
        return obj.game.datetime

    def has_subline_visible(self, obj):
        return obj.subline_set.filter(visible=True).count() != 0

    gametime.admin_order_field = "game__datetime"


class GameAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Game._meta.fields if field.name != "id"]
    ordering = ("-datetime",)

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

    # Before saving, for the current date, find all slips created and send emails
    # In each email, send outcome of the slip and if new lines exist, a preview of those
    def save_model(self, request, obj, form, change):
        cd = CurrentDate.objects.first()
        d = cd.date

        # Hacky - needs revisiting

        # Find all the games for this date. Find all the lines that roll up those
        # games. Find all the slips attached to those lines.
        todays_picks = Pick.objects.filter(subline__line__game__datetime__date=d)

        todays_slips = []
        for pick in todays_picks:
            if pick.slip not in todays_slips:
                todays_slips.append(pick.slip)

        users_with_slips_today = {}
        for slip in todays_slips:
            if slip.owner.id not in users_with_slips_today:
                users_with_slips_today[slip.owner.id] = []
            users_with_slips_today[slip.owner.id].append(slip)

        for user_id in users_with_slips_today:
            u = User.objects.get(id=user_id)

            slips = users_with_slips_today[user_id]
            slips_sg = []

            for slip in slips:
                slips_sg.append(
                    {
                        "numPicks": slip.pick_set.count(),
                        "payoutAmount": f"${slip.payout_amount}",
                        "outcome": "Won" if slip.won else "Lost",
                    }
                )

            message = Mail(
                from_email="support@underlinesports.com",
                to_emails="arithmetic@gmail.com"
                if settings.DEBUG
                else slip.owner.email,
            )

            ftp = " Free to Play " if u.free_to_play else " "
            today = cd.date.strftime("%B %d")
            tomorrow = obj.date.strftime("%B %d")
            subject = f"Underline{ftp}Results for {today}"
            body = f"Hey {u.first_name} - Below are your{ftp}results for {today}."

            # pass custom values for our HTML placeholders
            payload = {
                "subject": subject,
                "body": body,
                "tomorrow_date": tomorrow,
                "slips": slips_sg,
            }

            # Find all the sub lines for the next system date
            tomorrow_sublines = Subline.objects.filter(
                line__game__datetime__date=obj.date, visible=True
            )

            if tomorrow_sublines.count():
                first_subline = tomorrow_sublines[
                    randint(0, tomorrow_sublines.count() - 1)
                ]
                second_subline = tomorrow_sublines[
                    randint(0, tomorrow_sublines.count() - 1)
                ]
                third_subline = tomorrow_sublines[
                    randint(0, tomorrow_sublines.count() - 1)
                ]

                payload["newPicks"] = [
                    {
                        "src": first_subline.line.player.headshot_url,
                        "name": str(first_subline.line.player),
                        "game": str(first_subline.line.game),
                        "pointProjection": str(round(first_subline.nba_points_line, 1)),
                    },
                    {
                        "src": second_subline.line.player.headshot_url,
                        "name": str(second_subline.line.player),
                        "game": str(second_subline.line.game),
                        "pointProjection": str(
                            round(second_subline.nba_points_line, 1)
                        ),
                    },
                    {
                        "src": third_subline.line.player.headshot_url,
                        "name": str(third_subline.line.player),
                        "game": str(third_subline.line.game),
                        "pointProjection": str(round(third_subline.nba_points_line, 1)),
                    },
                ]

            message.dynamic_template_data = payload
            message.template_id = "d-83f3ae1c712a4e45af4744e2818489a8"

            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)
            code, body, headers = (
                response.status_code,
                response.body,
                response.headers,
            )
            """
            print(f"Response code: {code}")
            print(f"Response headers: {headers}")
            print(f"Response body: {body}")
            print("Dynamic Messages Sent!")
            """

        super(CurrentDateAdmin, self).save_model(request, obj, form, change)


class DepositResource(resources.ModelResource):
    class Meta:
        model = Deposit


class DepositAdmin(ExportMixin, admin.ModelAdmin):
    list_display = [field.name for field in Deposit._meta.fields if field.name != "id"]
    resource_class = DepositResource

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
    readonly_fields = (
        "won",
        "subline",
    )
    model = Pick
    extra = 0
    can_delete = False


class SlipResource(resources.ModelResource):
    class Meta:
        model = Slip


class SlipAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = SlipResource
    list_per_page = 20
    list_display = [field.name for field in Slip._meta.fields]
    list_display.append("payout_amount")
    list_display.append("won")
    list_display.append("complete")
    list_display.append("invalidated")
    list_display.append("status")
    list_display.append("num_picks_total")
    list_display.append("num_picks_won")
    inlines = [
        PickTabularInline,
    ]
    ordering = ("-datetime_created",)

    def status(self, obj):
        if obj.invalidated:
            return "Invalidated"
        elif not obj.complete:
            return "Incomplete"
        else:
            if obj.won:
                return "Won"
            else:
                return "Lost"

    def num_picks_total(self, obj):
        return obj.pick_set.count()

    def num_picks_won(self, obj):
        picks = obj.pick_set.all()
        cnt = 0

        for pick in picks:
            if pick.won:
                cnt = cnt + 1

        return cnt


class FreeToPlaySlipsAdmin(SlipAdmin):
    pass


class PaidSlipAdmin(SlipAdmin):
    pass


class PickAdmin(admin.ModelAdmin):
    list_display = [field.name for field in Pick._meta.fields if field.name != "id"]

    def has_add_permission(self, request, obj=None):
        return False


class LineCategoryAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in LineCategory._meta.fields if field.name != "id"
    ]

    class Meta:
        model = LineCategory

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


admin.site.register(Team, TeamAdmin)

# Register your models here.
admin.site.register(League)
admin.site.register(Slip, SlipAdmin)
admin.site.register(FreeToPlaySlip, FreeToPlaySlipsAdmin)
admin.site.register(PaidSlip, PaidSlipAdmin)
admin.site.register(Position)
admin.site.register(Pick, PickAdmin)
admin.site.register(Line, LineAdmin)
admin.site.register(CurrentDate, CurrentDateAdmin)
admin.site.register(Player, PlayerAdmin)
admin.site.register(Game, GameAdmin)
admin.site.register(Deposit, DepositAdmin)
admin.site.register(LineCategory, LineCategoryAdmin)
