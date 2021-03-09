from celery import Celery
from celery import shared_task

app = Celery()


# Every half hour, pull up all games that are happening
@shared_task
def remove_lines_when_game_starts():
    print("The sample task just ran.")
