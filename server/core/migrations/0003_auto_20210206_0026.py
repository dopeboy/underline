# Generated by Django 3.1.6 on 2021-02-06 00:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_currentdate'),
    ]

    operations = [
        migrations.AlterField(
            model_name='currentdate',
            name='date',
            field=models.DateField(),
        ),
        migrations.CreateModel(
            name='PlayersForADate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('premier', models.BooleanField(default=False)),
                ('points_line', models.IntegerField(blank=True, null=True)),
                ('points_actual', models.IntegerField(blank=True, null=True)),
                ('points_over', models.BooleanField(null=True)),
                ('player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.player')),
            ],
        ),
    ]