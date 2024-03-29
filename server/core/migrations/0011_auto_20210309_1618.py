# Generated by Django 3.1.6 on 2021-03-10 00:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_slip_free_to_play'),
    ]

    operations = [
        migrations.CreateModel(
            name='FreeToPlaySlip',
            fields=[
            ],
            options={
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('core.slip',),
        ),
        migrations.CreateModel(
            name='PaidSlip',
            fields=[
            ],
            options={
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('core.slip',),
        ),
        migrations.AddField(
            model_name='slip',
            name='creator_code',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
    ]
