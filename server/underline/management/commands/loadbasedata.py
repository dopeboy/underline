from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.core.management import call_command
import json

class Command(BaseCommand):
    args = ''
    help = 'Loads the initial data in to database'
    def handle(self, *args, **options):
        # Your Code
        call_command('loaddata', 'core/fixtures/leagues.json', verbosity=0)
        call_command('loaddata', 'core/fixtures/teams.json', verbosity=0)
        call_command('loaddata', 'core/fixtures/positions.json', verbosity=0)
        call_command('loaddata', 'core/fixtures/players.json', verbosity=0)
        call_command('loaddata', 'core/fixtures/currentdate.json', verbosity=0)
        result = {'message': "Successfully loaded base data"}
        return json.dumps(result)
