# Generated by Django 3.1.6 on 2021-05-08 18:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_slip_creator_slip'),
        ('accounts', '0009_auto_20210507_2140'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='current_creator_slip',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='core.slip'),
        ),
    ]
