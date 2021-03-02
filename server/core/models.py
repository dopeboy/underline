from django.db import models
from pytz import timezone, utc
from django.utils import timezone as tz


from accounts.models import User


class CurrentDate(models.Model):
    date = models.DateField()

    class Meta:
        verbose_name = "System date"
        verbose_name_plural = "System date"

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


class Deposit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    transaction_details = models.JSONField()
    order_details = models.JSONField()
    datetime_created = models.DateTimeField(auto_now_add=True)


class Line(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)

    # NBA specific
    nba_points_actual = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )
    datetime_created = models.DateTimeField(auto_now_add=True)

    invalidated = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.player.name} - {self.game}"

    def game_date(self):
        return self.game.datetime

    game_date.short_description = "Game date PST"


class Subline(models.Model):
    line = models.ForeignKey(Line, on_delete=models.CASCADE)

    # NBA specific
    nba_points_line = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )

    # Visible in lobby
    visible = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.line}"


class Slip(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    entry_amount = models.PositiveIntegerField()
    datetime_created = models.DateTimeField(auto_now_add=True)

    # For every attached pick, find every attached subline.
    # For every attached line, see if actual points filled out.
    @property
    def complete(self):
        for p in Pick.objects.filter(slip=self):
            if p.subline.line.nba_points_actual == None:
                return False
        return True

    # For every attached pick, find every attached subline.
    # For every attached line, see if invalidated is true. If so,
    # the entire slip is invalidated
    @property
    def invalidated(self):
        for p in Pick.objects.filter(slip=self):
            if p.subline.line.invalidated:
                return True
        return False

    @property
    def payout_amount(self):
        if self.pick_set.count() == 2:
            return self.entry_amount * 3
        elif self.pick_set.count() == 3:
            return self.entry_amount * 6
        elif self.pick_set.count() == 4:
            return self.entry_amount * 10
        elif self.pick_set.count() == 5:
            return self.entry_amount * 20

    @property
    def won(self):
        for pick in self.pick_set.all():
            # None or false
            if not pick.won:
                return False

        return True


class Pick(models.Model):
    subline = models.ForeignKey(Subline, on_delete=models.CASCADE)
    slip = models.ForeignKey(Slip, on_delete=models.CASCADE)

    # NBA specific
    under_nba_points = models.BooleanField(null=True)

    datetime_created = models.DateTimeField(auto_now_add=True)

    @property
    def won(self):
        actual_points = self.subline.line.nba_points_actual

        if actual_points == None:
            return None
        elif self.subline.line.invalidated:
            return False
        elif self.under_nba_points:
            return actual_points < self.subline.nba_points_line
        elif not self.under_nba_points:
            return actual_points > self.subline.nba_points_line
