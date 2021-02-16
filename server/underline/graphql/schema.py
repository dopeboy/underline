import graphene
import json

from django.db.models import Q
from graphene_django import DjangoObjectType
from pytz import timezone, utc
from core.models import Team, Player, Line, CurrentDate, Game
from accounts.models import User
from graphql_jwt.decorators import login_required

from turfpy.measurement import boolean_point_in_polygon
from geojson import Point, Polygon, Feature


class TeamType(DjangoObjectType):
    class Meta:
        model = Team


class UserType(DjangoObjectType):
    class Meta:
        model = User
        exclude = ("password",)


class GameType(DjangoObjectType):
    home_team = graphene.Field(TeamType)
    away_team = graphene.Field(TeamType)

    class Meta:
        model = Game


class PlayerType(DjangoObjectType):
    team = graphene.Field(TeamType)

    class Meta:
        model = Player


class LineType(DjangoObjectType):
    player = graphene.Field(PlayerType)
    game = graphene.Field(GameType)

    class Meta:
        model = Line


class Query(graphene.ObjectType):
    todays_lines = graphene.List(LineType)
    me = graphene.Field(UserType)
    approved_location = graphene.Field(
        graphene.Boolean, lat=graphene.Float(), lng=graphene.Float()
    )

    # Get today's date. Find all the games that lie on today's
    # date. Get all the lines that roll up to these dates
    def resolve_todays_lines(self, info, **kwargs):
        cd = CurrentDate.objects.first()
        todays_games = []

        for game in Game.objects.all():
            if game.pst_gametime.date() == cd.date:
                todays_games.append(game)

        # Hacky way to append two pre-sorted querysets
        # Might be better way
        # https://stackoverflow.com/questions/18235419/how-to-chain-django-querysets-preserving-individual-order
        q1 = (
            Line.objects.filter(game__in=todays_games)
            .filter(player__premier=True)
            .order_by("game__datetime")
        )

        # Needed to fill reset_cache below
        len(q1)

        q2 = (
            Line.objects.filter(game__in=todays_games)
            .filter(player__premier=False)
            .order_by("game__datetime")
        )

        for line in q2:
            q1._result_cache.append(line)

        return q1

    @login_required
    def resolve_me(self, info, **kawargs):
        return info.context.user

    @login_required
    def resolve_approved_location(self, info, lat, lng):
        point = Feature(geometry=Point((lng, lat)))

        approved_states = [
            "Arkansas",
            "California",
            "District of Columbia",
            "Florida",
            "Georgia",
            "Kansas",
            "New Mexico",
            "North Dakota",
            "Oklahoma",
            "Oregon",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Texas",
            "Utah",
            "West Virginia",
            "Wyoming",
            "Colorado",
        ]

        with open("gz_2010_us_040_00_20m.json") as f:
            js = json.load(f)

        for feature in js["features"]:
            features = feature["geometry"]

            if feature["properties"]["NAME"] in approved_states:
                if features["type"] == "Polygon":
                    p = Polygon(features["coordinates"])
                    if boolean_point_in_polygon(point, p):
                        return True
                else:
                    for polygon in features["coordinates"]:
                        p = Polygon(polygon)
                        if boolean_point_in_polygon(point, p):
                            return True

        return False
