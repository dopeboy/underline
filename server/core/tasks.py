import requests

from celery import Celery
from celery import shared_task
from django.conf import settings
from datetime import datetime, timedelta
from pytz import timezone, utc
from random import randint

from accounts.models import User
from .models import CurrentDate, Game, Player, Line, Pick, Subline
from sendgrid.helpers.mail import Mail
from sendgrid import SendGridAPIClient
from django.utils import dateformat

app = Celery()

# Every half hour, pull up all games that are happening now.
# For each game, for each attached line, make every attached
# subline invisible.
@shared_task
def remove_lines_when_game_starts():
    # Add current PST time to the system date
    cd = CurrentDate.objects.first().date
    date = datetime.now(tz=utc)
    time = date.astimezone(timezone("US/Pacific")).time()
    dt = datetime.combine(cd, time)

    # For debugging
    # dt = dt.replace(hour=19, minute=0)

    for game in Game.objects.all():
        # Check m/d/y & h:m
        if (
            game.pst_gametime.date() == dt.date()
            and game.pst_gametime.hour == dt.hour
            and game.pst_gametime.minute == dt.minute
        ):
            for line in game.line_set.all():
                line.subline_set.all().update(visible=False)


# Every midnight PST, set balance of free to play users to $100
@shared_task
def top_off_free_to_play_user_balances():
    User.objects.filter(free_to_play=True).update(wallet_balance=100)


# every hour, get the players' scores and save them.
# TODO - just run once
@shared_task
def update_player_scores():
    headers = {"Ocp-Apim-Subscription-Key": f"{settings.FANTASY_DATA_API_KEY}"}
    cd = CurrentDate.objects.first()
    formatted_date = cd.date.strftime("%Y-%m-%d")

    r = requests.get(
        f"https://fly.sportsdata.io/api/nba/fantasy/json/PlayerGameStatsByDate/{formatted_date}",
        headers=headers,
    )
    data = r.json()

    todays_games = []
    for game in Game.objects.all():
        if game.pst_gametime.date() == cd.date:
            todays_games.append(game)

    # Find player in our system. Find game they played in today.
    # Find all lines connected to that. Update each subline's actual pts
    for record in data:
        try:
            player = Player.objects.get(name=record["Name"])

            todays_game = None
            for game in todays_games:
                if player.team == game.home_team or player.team == game.away_team:
                    todays_game = game
                    break

            if not todays_game:
                raise Exception()

            lines = Line.objects.filter(player=player, game=game)
            for line in lines:
                if line.category.category == "Points":
                    line.actual_value = record["Points"]
                    line.save()
                elif line.category.category == "Rebounds":
                    line.actual_value = record["Rebounds"]
                    line.save()
                elif line.category.category == "Assists":
                    line.actual_value = record["Assists"]
                    line.save()
                elif line.category.category == "Fantasy Points":
                    line.actual_value = record["FantasyPoints"]
                    line.save()

        except Exception as e:
            print(e)
            print("Error with updating player score OR player didn't play today")


# This runs at noon PST everyday
# For yesterday, find all slips created and send emails.
# In each email, send outcome of the slip and if new lines exist for today, a preview of those
@shared_task
def send_slip_emails():
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)

    # Find all the games for yesterday. Find all the lines that roll up those
    # games. Find all the slips attached to those lines.
    games = Game.objects.filter(datetime__date=yesterday)
    yesterdays_picks = Pick.objects.filter(
        subline__line__game__datetime__date=yesterday
    )

    yesterdays_slips = []
    for pick in yesterdays_picks:
        if pick.slip not in yesterdays_slips:
            yesterdays_slips.append(pick.slip)

    users_with_slips_yesterday = {}
    for slip in yesterdays_slips:
        if slip.owner.id not in users_with_slips_yesterday:
            users_with_slips_yesterday[slip.owner.id] = []
        users_with_slips_yesterday[slip.owner.id].append(slip)

    # Find all the sub lines for today
    today_sublines = Subline.objects.filter(
        line__game__datetime__date=today, visible=True
    )

    today_lines = []
    if today_sublines.count():
        first_subline = today_sublines[randint(0, today_sublines.count() - 1)]
        second_subline = today_sublines[randint(0, today_sublines.count() - 1)]
        third_subline = today_sublines[randint(0, today_sublines.count() - 1)]

        today_lines = [
            {
                "src": first_subline.line.player.headshot_url,
                "name": str(first_subline.line.player),
                "game": str(first_subline.line.game),
                "projection": f"{str(round(first_subline.projected_value, 1))} {first_subline.line.category.category}",
            },
            {
                "src": second_subline.line.player.headshot_url,
                "name": str(second_subline.line.player),
                "game": str(second_subline.line.game),
                "projection": f"{str(round(second_subline.projected_value, 1))} {second_subline.line.category.category}",
            },
            {
                "src": third_subline.line.player.headshot_url,
                "name": str(third_subline.line.player),
                "game": str(third_subline.line.game),
                "projection": f"{str(round(third_subline.projected_value, 1))} {third_subline.line.category.category}",
            },
        ]

    for user_id in users_with_slips_yesterday:
        u = User.objects.get(id=user_id)

        slips = users_with_slips_yesterday[user_id]
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
            to_emails="arithmetic@gmail.com" if settings.DEBUG else slip.owner.email,
        )

        ftp = " Free to Play " if u.free_to_play else " "
        yesterday_str = dateformat.format(yesterday, "F jS")
        today_str = dateformat.format(today, "F jS")
        subject = f"Underline{ftp}Results for {yesterday_str}"
        body = f"Hey {u.first_name} - here are your{ftp}results for {yesterday_str}."

        # pass custom values for our HTML placeholders
        payload = {
            "subject": subject,
            "body": body,
            "todayDate": today_str,
            "slips": slips_sg,
            "todayLines": today_lines,
        }

        message.dynamic_template_data = payload
        message.template_id = "d-83f3ae1c712a4e45af4744e2818489a8"

        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        response = sg.send(message)
        code, body, headers = (
            response.status_code,
            response.body,
            response.headers,
        )
