# Generated by Django 3.1.6 on 2021-02-18 22:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_auto_20210218_2219'),
    ]

    operations = [
        migrations.AlterField(
            model_name='slip',
            name='datetime_created',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]