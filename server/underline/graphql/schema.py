import graphene
import json

from django.db.models import Q
import decimal
import requests
from graphene_django import DjangoObjectType
from pytz import timezone, utc
from core.models import (
    Team,
    Player,
    Line,
    CurrentDate,
    Game,
    Subline,
    Slip,
    Pick,
    Deposit,
)
from accounts.models import User
from graphql_jwt.decorators import login_required

from turfpy.measurement import boolean_point_in_polygon
from geojson import Point, Polygon, Feature
from django.conf import settings
from graphql_jwt.utils import jwt_payload
from sendgrid.helpers.mail import Mail
from sendgrid import SendGridAPIClient


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
    won = graphene.Boolean()

    class Meta:
        model = Pick

    def resolve_won(parent, info):
        return parent.won


class MySlipType(DjangoObjectType):
    picks = graphene.List(MyPickType)
    payout_amount = graphene.Int()
    won = graphene.Boolean()
    complete = graphene.Boolean()
    invalidated = graphene.Boolean()

    def resolve_picks(parent, info):
        return Pick.objects.filter(slip=parent)

    def resolve_pay_amount(parent, info):
        return parent.payout_amount

    def resolve_won(parent, info):
        return parent.won

    def resolve_complete(parent, info):
        return parent.complete

    def resolve_invalidated(parent, info):
        return parent.invalidated

    class Meta:
        model = Slip


class Query(graphene.ObjectType):
    todays_sublines = graphene.List(SublineType)
    me = graphene.Field(UserType)
    active_slips = graphene.List(MySlipType)
    complete_slips = graphene.List(MySlipType)
    current_date = graphene.Date()

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
            line__in=Line.objects.filter(game__in=todays_games, invalidated=False)
            .filter(player__premier=True)
            .order_by("game__datetime")
        ).filter(visible=True)

        # Needed to fill reset_cache below
        len(q1)

        q2 = Subline.objects.filter(
            line__in=Line.objects.filter(game__in=todays_games, invalidated=False)
            .filter(player__premier=False)
            .order_by("game__datetime")
        ).filter(visible=True)

        for line in q2:
            q1._result_cache.append(line)

        return q1

    @login_required
    def resolve_me(self, info, **kawargs):
        return info.context.user

    @login_required
    def resolve_active_slips(self, info, **kawargs):
        return [
            slip
            for slip in Slip.objects.filter(owner=info.context.user).order_by(
                "-datetime_created"
            )
            if slip.complete == False and slip.invalidated == False
        ]

    @login_required
    def resolve_complete_slips(self, info, **kawargs):
        return [
            slip
            for slip in Slip.objects.filter(owner=info.context.user).order_by(
                "-datetime_created"
            )
            if slip.complete == True or slip.invalidated == True
        ]

    def resolve_current_date(self, info, **kawargs):
        return CurrentDate.objects.first().date


class PickType(graphene.InputObjectType):
    # This is the subline_id
    id = graphene.ID(required=True)
    under = graphene.Boolean(required=True)


class CreateSlip(graphene.Mutation):
    class Arguments:
        picks = graphene.List(PickType, required=True)
        entry_amount = graphene.Int(required=True)
        creator_code = graphene.String(required=False)

    # The class attributes define the response of the mutation
    success = graphene.Boolean()
    free_to_play = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, picks, entry_amount, creator_code):
        # Create the slip
        slip = Slip.objects.create(
            owner=info.context.user,
            entry_amount=entry_amount,
            free_to_play=info.context.user.free_to_play,
            creator_code=creator_code,
        )

        for p in picks:
            subline = Subline.objects.get(id=int(p["id"]))
            Pick.objects.create(subline=subline, slip=slip, under_nba_points=p["under"])

        u = info.context.user
        previous_wallet_balance = u.wallet_balance
        u.wallet_balance -= entry_amount
        u.save()

        if not settings.DEBUG:
            ftp_text = (
                "free to play" if info.context.user.free_to_play else "pay to play"
            )
            message = Mail(
                from_email="support@underlinesports.com",
                to_emails="support@underlinesports.com",
                subject=f"[AUTOMATED EMAIL] {info.context.user.first_name} {info.context.user.last_name} created a slip",
                html_content=f"Type of slip: {ftp_text}<br/><br/>Entry amount: {entry_amount}<br/><br/>Wallet balance before: {previous_wallet_balance}<br/><br/>Wallet balance after: {u.wallet_balance}<br/><br/>Check out it <a href='{settings.DOMAIN}/admin/core/slip/{slip.id}/change/'>here.</a>",
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(message)

        return CreateSlip(success=True, free_to_play=info.context.user.free_to_play)


class CreateUser(graphene.Mutation):
    class Arguments:
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        phone_number = graphene.String(required=True)
        birth_date = graphene.Date(required=True)
        email_address = graphene.String(required=True)
        password = graphene.String(required=True)

    # The class attributes define the response of the mutation
    success = graphene.Boolean()
    free_to_play = graphene.Boolean()

    @classmethod
    def mutate(
        cls,
        root,
        info,
        first_name,
        last_name,
        phone_number,
        birth_date,
        email_address,
        password,
    ):
        # If user is from PTP eligible state, set slip to that. Else slip is FTP
        ip = info.context.META.get("HTTP_X_FORWARDED_FOR").split(",")[-1].strip()
        r = requests.get(
            f"http://api.ipstack.com/{ip}?access_key=1317f58b9d36a89840ecf6edb5af41be&format=1"
        )

        country_code = r.json()["country_code"]
        region_name = r.json()["region_name"]
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

        free_to_play = region_name not in approved_states

        user = User.objects.create_user(
            email=email_address.lower(),
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            birth_date=birth_date,
            free_to_play=free_to_play,
            wallet_balance=100 if free_to_play else 0,
        )

        return CreateUser(success=True, free_to_play=free_to_play)


class RecordDeposit(graphene.Mutation):
    class Arguments:
        amount = graphene.Float(required=True)
        transaction_details = graphene.String(required=True)
        order_details = graphene.String(required=True)

    # The class attributes define the response of the mutation
    success = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, amount, transaction_details, order_details):
        Deposit.objects.create(
            user=info.context.user,
            amount=amount,
            transaction_details=json.loads(transaction_details),
            order_details=json.loads(order_details),
        )

        u = info.context.user
        u.wallet_balance += decimal.Decimal(amount)
        u.save()

        return RecordDeposit(success=True)


class Mutation(graphene.ObjectType):
    create_slip = CreateSlip.Field()
    create_user = CreateUser.Field()
    record_deposit = RecordDeposit.Field()
