import datetime
import urllib.parse
from pytz import timezone, utc
import requests
import urllib

from django.contrib.auth.mixins import UserPassesTestMixin
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.shortcuts import render
from django.views import View

from .models import (
    League,
    Team,
    Position,
    Player,
    CurrentDate,
    Line,
    Game,
    Subline,
    LineCategory,
)


class SuperuserRequiredMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_superuser


class RunWholeShebang(SuperuserRequiredMixin, View):
    def sync_games_for_date(self, cd):
        headers = {"Authorization": f"Bearer {settings.AIRTABLE_API_KEY}"}
        nba = League.objects.get(acronym="NBA")

        offset = None
        all_records_synced = False
        airtable_date_filter = f'SEARCH("{cd.date.strftime("%Y-%m-%d")}",{{Date}})'
        quoted_airtable_date_filter = urllib.parse.quote_plus(airtable_date_filter)

        while all_records_synced == False:
            r = requests.get(
                f"https://api.airtable.com/v0/appsIaaLtmzxMRopo/Week%201%20Games%20(12%2F22-28)?view=Grid%20view&filterByFormula={quoted_airtable_date_filter}"
                + (f"&offset={offset}" if offset else ""),
                headers=headers,
            )
            data = r.json()

            for record in data["records"]:
                home_team = Team.objects.get(
                    abbreviation=record["fields"]["Home Team"].strip(), league=nba
                )
                away_team = Team.objects.get(
                    abbreviation=record["fields"]["Away Team"].strip(), league=nba
                )
                gt = record["fields"]["Time"].rstrip(" EST").rstrip(" PST")
                date_time_obj = datetime.datetime.strptime(
                    f'{record["fields"]["Date"]} {gt}',
                    "%Y-%m-%d %I:%M %p",
                )

                if "EST" in record["fields"]["Time"]:
                    localtz = timezone("America/New_York")
                    date_time_obj = localtz.localize(date_time_obj)
                elif "PST" in record["fields"]["Time"]:
                    localtz = timezone("America/Los_Angeles")
                    date_time_obj = localtz.localize(date_time_obj)

                game, created = Game.objects.update_or_create(
                    league=nba,
                    home_team=home_team,
                    away_team=away_team,
                    datetime=date_time_obj,
                )

            if "offset" in data:
                offset = data["offset"]
            else:
                all_records_synced = True

    def create_line(self, category, value, player, todays_game):
        line, created = Line.objects.update_or_create(
            player=player, game=todays_game, category=category
        )

        subline, created = Subline.objects.update_or_create(
            line=line,
            defaults={
                "projected_value": value,
                "visible": True,
            },
        )

    def sync_lines_for_date(self, cd):
        headers = {"Authorization": f"Bearer {settings.AIRTABLE_API_KEY}"}
        nba = League.objects.get(acronym="NBA")

        offset = None
        all_records_synced = False
        airtable_date_filter = f'SEARCH("{cd.date.strftime("%Y-%m-%d")}",{{Date}})'
        quoted_airtable_date_filter = urllib.parse.quote_plus(airtable_date_filter)

        while all_records_synced == False:
            r = requests.get(
                f"https://api.airtable.com/v0/appugpzfLrIqV0Qfd/master?view=Grid%20view&filterByFormula={quoted_airtable_date_filter}"
                + (f"&offset={offset}" if offset else ""),
                headers=headers,
            )
            data = r.json()

            todays_games = []
            for game in Game.objects.all():
                if game.pst_gametime.date() == cd.date:
                    todays_games.append(game)

            if not todays_games:
                print("No games today")
                return

            # Lookup player. Check if player is playing in a game today. If not, skip.
            for record in data["records"]:
                try:
                    player = Player.objects.get(
                        name=record["fields"]["Player name"].strip()
                    )

                    todays_game = None
                    for game in todays_games:
                        if (
                            player.team == game.home_team
                            or player.team == game.away_team
                        ):
                            todays_game = game
                            break

                    if not todays_game:
                        raise Exception()

                    league = League.objects.get(acronym="NBA")

                    if "Projected points" in record["fields"]:
                        self.create_line(
                            LineCategory.objects.get(
                                league=league,
                                category="Points",
                            ),
                            record["fields"]["Projected points"],
                            player,
                            todays_game,
                        )

                    if "Projected rebounds" in record["fields"]:
                        self.create_line(
                            LineCategory.objects.get(
                                league=league,
                                category="Rebounds",
                            ),
                            record["fields"]["Projected rebounds"],
                            player,
                            todays_game,
                        )

                    if "Projected assists" in record["fields"]:
                        self.create_line(
                            LineCategory.objects.get(
                                league=league,
                                category="Assists",
                            ),
                            record["fields"]["Projected assists"],
                            player,
                            todays_game,
                        )

                    if "Projected fantasy points" in record["fields"]:
                        self.create_line(
                            LineCategory.objects.get(
                                league=league,
                                category="Fantasy points",
                            ),
                            record["fields"]["Projected fantasy points"],
                            player,
                            todays_game,
                        )

                except Exception as e:
                    print(e)
                    print(
                        f'This player either does not exist or is not playing today: {record["fields"]["Player name"]}'
                    )

            if "offset" in data:
                offset = data["offset"]
            else:
                all_records_synced = True

    # 1) Change system date to current date
    # 2) Sync games from airtable for current date
    # 3) Sync lines from airtable for current date
    def get(self, request, format=None):
        # (1)
        cd = CurrentDate.objects.first()
        cd.date = datetime.datetime.now(timezone("US/Pacific")).date()
        cd.save()

        # TODO disable
        from datetime import timedelta

        cd.date = datetime.datetime.now(timezone("US/Pacific")).date() - timedelta(
            days=3
        )
        cd.save()

        # (2)
        self.sync_games_for_date(cd)

        # (3)
        self.sync_lines_for_date(cd)

        return HttpResponseRedirect(reverse("admin:index"))


class SyncPlayers(SuperuserRequiredMixin, View):
    def get(self, request, format=None):
        headers = {"Authorization": f"Bearer {settings.AIRTABLE_API_KEY}"}
        nba = League.objects.get(acronym="NBA")

        offset = None
        all_records_synced = False
        while all_records_synced == False:
            # Player Sync (> 100 records)
            r = requests.get(
                "https://api.airtable.com/v0/appCCoXer81BO8Ltu/All?view=Grid%20view"
                + (f"&offset={offset}" if offset else ""),
                headers=headers,
            )
            data = r.json()

            for record in data["records"]:
                team = Team.objects.get(abbreviation=record["fields"]["Team"].strip())

                pos = []
                for p in record["fields"]["Position"]:
                    pos.append(Position.objects.get(acronym=p))

                player, created = Player.objects.update_or_create(
                    name=record["fields"]["Name"],
                    defaults={
                        "team": team,
                        "premier": True
                        if "Premier Player" in record["fields"]
                        else False,
                        "headshot_url": record["fields"]["Image"][0]["thumbnails"][
                            "large"
                        ]["url"],
                    },
                )

                player.positions.set(pos)

            if "offset" in data:
                offset = data["offset"]
            else:
                all_records_synced = True

        return HttpResponseRedirect(reverse("admin:index"))


class SyncGames(SuperuserRequiredMixin, View):
    def get(self, request, format=None):
        headers = {"Authorization": f"Bearer {settings.AIRTABLE_API_KEY}"}
        nba = League.objects.get(acronym="NBA")

        offset = None
        all_records_synced = False

        while all_records_synced == False:
            r = requests.get(
                f"https://api.airtable.com/v0/appsIaaLtmzxMRopo/Week%201%20Games%20(12%2F22-28)?view=Grid%20view"
                + (f"&offset={offset}" if offset else ""),
                headers=headers,
            )
            data = r.json()

            for record in data["records"]:
                home_team = Team.objects.get(
                    abbreviation=record["fields"]["Home Team"].strip(), league=nba
                )
                away_team = Team.objects.get(
                    abbreviation=record["fields"]["Away Team"].strip(), league=nba
                )
                gt = record["fields"]["Time"].rstrip(" EST").rstrip(" PST")
                date_time_obj = datetime.datetime.strptime(
                    f'{record["fields"]["Date"]} {gt}',
                    "%Y-%m-%d %I:%M %p",
                )

                if "EST" in record["fields"]["Time"]:
                    localtz = timezone("America/New_York")
                    date_time_obj = localtz.localize(date_time_obj)
                elif "PST" in record["fields"]["Time"]:
                    localtz = timezone("America/Los_Angeles")
                    date_time_obj = localtz.localize(date_time_obj)

                game, created = Game.objects.update_or_create(
                    league=nba,
                    home_team=home_team,
                    away_team=away_team,
                    datetime=date_time_obj,
                )

            if "offset" in data:
                offset = data["offset"]
            else:
                all_records_synced = True

        return HttpResponseRedirect(reverse("admin:index"))


class SyncLines(SuperuserRequiredMixin, View):
    def get(self, request, format=None):
        headers = {"Authorization": f"Bearer {settings.AIRTABLE_API_KEY}"}
        nba = League.objects.get(acronym="NBA")

        """
        # Team sync below (100 records or less)
        r = requests.get(
            "https://api.airtable.com/v0/appCCoXer81BO8Ltu/Teams?view=Grid%20view",
            headers=headers,
        )
        data = r.json()

        Team.objects.all().delete()
        for record in data["records"]:
            Team.objects.create(
                name=record["fields"]["Team Name"],
                abbreviation=record["fields"]["Team Abbreviation"],
                location=record["fields"]["City Name"],
                league=nba,
                logo_url=record["fields"]["Logo"][0]["thumbnails"]["large"]["url"],
            )
        """

        offset = None
        all_records_synced = False
        cd = CurrentDate.objects.first()
        sheet_name = f'{cd.date.strftime("%m/%d/%y")} Players'

        while all_records_synced == False:
            r = requests.get(
                f"https://api.airtable.com/v0/appsIaaLtmzxMRopo/{urllib.parse.quote(sheet_name, safe='')}?view=Grid%20view"
                + (f"&offset={offset}" if offset else ""),
                headers=headers,
            )
            data = r.json()

            for record in data["records"]:
                player = Player.objects.get(
                    name=record["fields"]["Name"].strip(),
                )

                # Find the game with this player's team
                games = Game.objects.filter(
                    Q(home_team=player.team) | Q(away_team=player.team),
                )

                game = None
                for g in games:
                    """
                    print(player)
                    print(g)
                    print(g.datetime.astimezone(timezone("US/Pacific")).date())
                    print(cd.date)
                    """
                    if g.datetime.astimezone(timezone("US/Pacific")).date() == cd.date:
                        game = g
                        break

                line, created = Line.objects.update_or_create(
                    player=player,
                    game=game,
                    defaults={
                        "points_line": None
                        if "Points Line" not in record["fields"]
                        else record["fields"]["Points Line"],
                        "points_actual": None
                        if "Points Actual" not in record["fields"]
                        else record["fields"]["Points Actual"],
                    },
                )

            if "offset" in data:
                offset = data["offset"]
            else:
                all_records_synced = True

        return HttpResponseRedirect(reverse("admin:index"))
