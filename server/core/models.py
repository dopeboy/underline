from django.db import models
from pytz import timezone, utc
from django.utils import timezone as tz


from accounts.models import User

# US based date (PST - EST)
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


class LineCategory(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE)
    category = models.CharField(max_length=128)
    display_order = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f"{self.league.acronym} - {self.category}"


class Line(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    category = models.ForeignKey(LineCategory, on_delete=models.CASCADE)

    actual_value = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True
    )
    datetime_created = models.DateTimeField(auto_now_add=True)

    invalidated = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.player.name} - {self.game} [{self.category.category}]"

    def game_date(self):
        return self.game.datetime

    game_date.short_description = "Game date PST"


class Subline(models.Model):
    line = models.ForeignKey(Line, on_delete=models.CASCADE)
    projected_value = models.DecimalField(
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
    free_to_play = models.BooleanField(default=False)
    creator_code = models.CharField(max_length=128, blank=True, null=True)
    creator_slip = models.BooleanField(default=False)

    # For every attached pick, find every attached subline.
    # For every attached line, see if actual points filled out.
    @property
    def complete(self):
        return (
            Pick.objects.filter(slip=self, subline__line__actual_value=None).count()
            == 0
        )

    # For every attached pick, find every attached subline.
    # For every attached line, see if invalidated is true. If so,
    # the entire slip is invalidated
    @property
    def invalidated(self):
        return (
            Pick.objects.filter(slip=self, subline__line__invalidated=True).count() != 0
        )

    @property
    def payout_amount(self):
        num_picks = self.pick_set.count()

        if num_picks == 2:
            return self.entry_amount * 3
        elif num_picks == 3:
            return self.entry_amount * 6
        elif num_picks == 4:
            return self.entry_amount * 10
        elif num_picks == 5:
            return self.entry_amount * 20

    @property
    def won(self):
        for pick in self.pick_set.all():
            # None or false
            if not pick.won:
                return False

        return True


class FreeToPlaySlipManager(models.Manager):
    def get_queryset(self):
        return (
            super(FreeToPlaySlipManager, self).get_queryset().filter(free_to_play=True)
        )


class PaidSlipManager(models.Manager):
    def get_queryset(self):
        return super(PaidSlipManager, self).get_queryset().filter(free_to_play=False)


class FreeToPlaySlip(Slip):
    objects = FreeToPlaySlipManager()

    class Meta:
        proxy = True


class PaidSlip(Slip):
    objects = PaidSlipManager()

    class Meta:
        proxy = True


class Pick(models.Model):
    subline = models.ForeignKey(Subline, on_delete=models.CASCADE)
    slip = models.ForeignKey(Slip, on_delete=models.CASCADE)
    under = models.BooleanField(null=True)

    datetime_created = models.DateTimeField(auto_now_add=True)

    @property
    def won(self):
        actual_value = self.subline.line.actual_value

        if actual_value == None:
            return None
        elif self.subline.line.invalidated:
            return False
        elif self.under:
            return actual_value < self.subline.projected_value
        elif not self.under:
            return actual_value > self.subline.projected_value
