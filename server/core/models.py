from django.db import models
from pytz import timezone, utc

from accounts.models import User


class CurrentDate(models.Model):
    date = models.DateField()

    class Meta:
        verbose_name = "Change the current date"
        verbose_name_plural = "Change the current date"

    def __str__(self):
        return self.date.strftime("%m/%d/%Y")


class League(models.Model):
    acronym = models.CharField(max_length=16)
    long_name = models.CharField(max_length=128)

    def __str__(self):
        return self.acronym


class Team(models.Model):
    name = models.CharField(max_length=128)
    abbreviation = models.CharField(max_length=128)
    location = models.CharField(max_length=128)
    logo_url = models.CharField(max_length=512)
    league = models.ForeignKey(League, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.league.acronym})"


class Game(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE)
    home_team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="home_games"
    )
    away_team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="away_games"
    )
    datetime = models.DateTimeField()

    def __str__(self):
        return f"{self.away_team.abbreviation} @ {self.home_team.abbreviation} ({self.pst_gametime.strftime('%m/%d/%y %-I:%M %p')} PST)"

    @property
    def pst_gametime(self):
        return self.datetime.astimezone(timezone("US/Pacific"))


class Position(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE)
    name = models.CharField(max_length=128)
    acronym = models.CharField(max_length=16)

    def __str__(self):
        return f"{self.name} ({self.acronym}) - {self.league.acronym}"


class Player(models.Model):
    name = models.CharField(max_length=128)
    positions = models.ManyToManyField(Position)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    headshot_url = models.CharField(max_length=512, blank=True, null=True)
    premier = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.team.league.acronym} - {self.team.name})"


class Line(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)

    # NBA specific
    nba_points_actual = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )

    def __str__(self):
        return f"{self.player.name} - {self.game}"


class Subline(models.Model):
    line = models.ForeignKey(Line, on_delete=models.CASCADE)

    # NBA specific
    nba_points_line = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )

    # Visible in lobby
    visible = models.BooleanField(default=True)

    def is_nba_points_over(self):
        if self.nba_points_line is not None and self.line.nba_points_actual is not None:
            return self.line.nba_points_actual > self.nba_points_line
        return None


class Slip(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    datetime_created = models.DateTimeField()

    # For every line, find if points_actual is filled.
    @property
    def complete(self):
        # (lambda line: False if (line.points_actual) else False)(Pick)
        return True


class Pick(models.Model):
    subline = models.ForeignKey(Subline, on_delete=models.CASCADE)
    slip = models.ForeignKey(Slip, on_delete=models.CASCADE)

    # NBA specific
    over_nba_points = models.BooleanField(null=True)

    datetime_created = models.DateTimeField()
