import graphene
import json

from django.db.models import Q
from graphene_django import DjangoObjectType
from pytz import timezone, utc
from core.models import Team, Player, Line, CurrentDate, Game, Subline, Slip, Pick
from accounts.models import User
from graphql_jwt.decorators import login_required

from turfpy.measurement import boolean_point_in_polygon
from geojson import Point, Polygon, Feature
from django.conf import settings


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


class SublineType(DjangoObjectType):
    line = graphene.Field(LineType)

    class Meta:
        model = Subline


class MyPickType(DjangoObjectType):
    subline = graphene.Field(SublineType)

    class Meta:
        model = Pick


class MySlipType(DjangoObjectType):
    picks = graphene.List(MyPickType)

    def resolve_picks(parent, info):
        return Pick.objects.filter(slip=parent)

    class Meta:
        model = Slip


class Query(graphene.ObjectType):
    todays_sublines = graphene.List(SublineType)
    me = graphene.Field(UserType)
    approved_location = graphene.Field(
        graphene.Boolean, lat=graphene.Float(), lng=graphene.Float()
    )
    active_slips = graphene.List(MySlipType)
    inactive_slips = graphene.List(MySlipType)

    # Get today's date. Find all the games that lie on today's
    # date. Get all the lines that roll up to these dates. Get all the sublines
    # that these lines roll up to.
    def resolve_todays_sublines(self, info, **kwargs):
        cd = CurrentDate.objects.first()
        todays_games = []

        for game in Game.objects.all():
            if game.pst_gametime.date() == cd.date:
                todays_games.append(game)

        # Hacky way to append two pre-sorted querysets
        # Might be better way
        # https://stackoverflow.com/questions/18235419/how-to-chain-django-querysets-preserving-individual-order
        q1 = Subline.objects.filter(
            line__in=Line.objects.filter(game__in=todays_games)
            .filter(player__premier=True)
            .order_by("game__datetime")
        ).filter(visible=True)

        # Needed to fill reset_cache below
        len(q1)

        q2 = Subline.objects.filter(
            line__in=Line.objects.filter(game__in=todays_games)
            .filter(player__premier=False)
            .order_by("game__datetime")
        ).filter(visible=True)

        for line in q2:
            q1._result_cache.append(line)

        return q1

    @login_required
    def resolve_me(self, info, **kawargs):
        return info.context.user

    def resolve_active_slips(self, info, **kawargs):
        return [
            slip
            for slip in Slip.objects.filter(owner=info.context.user)
            if slip.complete == False
        ]

    def resolve_inactive_slips(self, info, **kawargs):
        return [
            slip
            for slip in Slip.objects.filter(owner=info.context.user)
            if slip.complete == True
        ]

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

        with open(f"{settings.BASE_DIR}/gz_2010_us_040_00_20m.json") as f:
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


class PickType(graphene.InputObjectType):
    # This is the subline_id
    id = graphene.ID(required=True)
    under = graphene.Boolean(required=True)


class SlipMutation(graphene.Mutation):
    class Arguments:
        picks = graphene.List(PickType)

    # The class attributes define the response of the mutation
    success = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, picks):
        # Create the slip
        slip = Slip.objects.create(owner=info.context.user)

        for p in picks:
            subline = Subline.objects.get(id=int(p["id"]))
            Pick.objects.create(subline=subline, slip=slip, under_nba_points=p["under"])

        return SlipMutation(success=True)


class Mutation(graphene.ObjectType):
    create_slip = SlipMutation.Field()
