from celery import Celery
from celery import shared_task

app = Celery()


@shared_task
def sample_task():
    print("The sample task just ran.")
