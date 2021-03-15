from celery import Celery
from celery import shared_task
from datetime import datetime
from pytz import timezone, utc

from accounts.models import User
from .models import CurrentDate, Game

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
