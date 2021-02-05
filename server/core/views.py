import requests

from django.contrib.auth.mixins import UserPassesTestMixin
from django.conf import settings
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.shortcuts import render
from django.views import View

from .models import League, Team, Position, Player


class SuperuserRequiredMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_superuser


class SyncAirtableView(SuperuserRequiredMixin, View):
    def get(self, request, format=None):
        headers = {"Authorization": f"Bearer {settings.AIRTABLE_API_KEY}"}
        nfl = League.objects.get(acronym="NFL")

        # Team sync below (100 records or less)
        """
        r = requests.get(
            "https://api.airtable.com/v0/appivbMrWRByj23y3/NFL%20Teams?view=Grid%20view",
            headers=headers,
        )
        data = r.json()

        Team.objects.all().delete()
        for record in data["records"]:
            Team.objects.create(
                name=record["fields"]["Team Name"],
                abbreviation=record["fields"]["City Abbreviation"],
                location=record["fields"]["City Name"],
                league=nfl,
                image_url=record["fields"]["Image"][0]["thumbnails"]["large"][
                    "url"
                ],
            )
        """

        offset = None
        all_records_synced = False
        while all_records_synced == False:

            # Player Sync (> 100 records)
            r = requests.get(
                "https://api.airtable.com/v0/appivbMrWRByj23y3/All%20players?view=Grid%20view"
                + (f"&offset={offset}" if offset else ""),
                headers=headers,
            )
            data = r.json()

            for record in data["records"]:
                team = Team.objects.get(abbreviation=record["fields"]["Team"])
                position = Position.objects.get(acronym=record["fields"]["Position"])

                person, created = Player.objects.update_or_create(
                    name=record["fields"]["Name"],
                    defaults={
                        "team": team,
                        "position": position,
                        "headshot_url": record["fields"]["Image"][0]["thumbnails"][
                            "large"
                        ]["url"],
                    },
                )

            if "offset" in data:
                offset = data["offset"]
            else:
                all_records_synced = True

        return HttpResponseRedirect(reverse("admin:index"))
