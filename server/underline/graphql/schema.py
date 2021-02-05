import graphene
from graphene_django import DjangoObjectType

from core.models import Player


class PlayerType(DjangoObjectType):
    class Meta:
        model = Player


class Query(graphene.ObjectType):
    yay = graphene.String()
    all_players = graphene.List(PlayerType)

    def resolve_yay(self, info, **kwargs):
        return "this came from the backend!"

    def resolve_all_players(self, info, **kwargs):
        return Player.objects.all()
