import graphene

from graphene_django import DjangoObjectType
from pytz import timezone, utc
from core.models import Team, Player, Line, CurrentDate, Game


class TeamType(DjangoObjectType):
    class Meta:
        model = Team


class GameType(DjangoObjectType):
    home_team = graphene.Field(TeamType)
    away_team = graphene.Field(TeamType)

    class Meta:
        model = Game


class PlayerType(DjangoObjectType):
    class Meta:
        model = Player


class LineType(DjangoObjectType):
    player = graphene.Field(PlayerType)
    game = graphene.Field(GameType)

    class Meta:
        model = Line


class Query(graphene.ObjectType):
    yay = graphene.String()
    todays_lines = graphene.List(LineType)

    def resolve_yay(self, info, **kwargs):
        return "this came from the backend!"

    # Get today's date. Find all the games that lie on today's
    # date. Get all the lines that roll up to these dates
    def resolve_todays_lines(self, info, **kwargs):
        cd = CurrentDate.objects.first()
        todays_games = []

        for game in Game.objects.all():
            if game.pst_gametime.date() == cd.date:
                todays_games.append(game)

        lines = Line.objects.filter(game__in=todays_games)

        return lines
