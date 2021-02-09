from django.db import models
from pytz import timezone, utc


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
    points_line = models.IntegerField(blank=True, null=True)
    points_actual = models.IntegerField(blank=True, null=True)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.player.name} line"

    def points_over(self):
        if points_line is not None and points_actual is not None:
            return points_actual > points_line
        return None
