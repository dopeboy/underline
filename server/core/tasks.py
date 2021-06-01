import requests

from celery import Celery
from celery import shared_task
from django.conf import settings
from datetime import datetime
from pytz import timezone, utc

from accounts.models import User
from .models import CurrentDate, Game, Player, Line

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


# At 330AM PST, get the players' scores and save them.
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

            l = Line.objects.get(player=player, game=game)
            l.nba_points_actual = record["Points"]
            l.save()

        except Exception as e:
            print(e)
            print("Error with updating player score OR player didn't play today")
