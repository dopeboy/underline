# Generated by Django 3.1.6 on 2021-03-02 19:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_wallet_balance'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='free_to_play',
            field=models.BooleanField(default=False),
        ),
    ]
