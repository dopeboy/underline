# Generated by Django 3.1.6 on 2021-06-24 20:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_movement_creator'),
    ]

    operations = [
        migrations.AddField(
            model_name='movement',
            name='line',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='core.line'),
        ),
    ]
