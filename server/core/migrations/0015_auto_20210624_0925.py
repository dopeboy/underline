# Generated by Django 3.1.6 on 2021-06-24 16:25

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_auto_20210602_1450'),
    ]

    operations = [
        migrations.CreateModel(
            name='Movement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('cap', models.IntegerField()),
                ('datetime_created', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='SubMovement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('swing', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('minimum', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('datetime_created', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.linecategory')),
                ('movement', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.movement')),
            ],
        ),
        migrations.AddField(
            model_name='subline',
            name='movement',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='core.movement'),
        ),
    ]
