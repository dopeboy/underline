from django.db import models


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


class Position(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE)
    name = models.CharField(max_length=128)
    acronym = models.CharField(max_length=16)

    def __str__(self):
        return f"{self.name} ({self.acronym}) - {self.league.acronym}"


class Player(models.Model):
    name = models.CharField(max_length=128)
    position = models.ForeignKey(Position, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    headshot_url = models.CharField(max_length=512, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.team.league.acronym} - {self.team.name})"
