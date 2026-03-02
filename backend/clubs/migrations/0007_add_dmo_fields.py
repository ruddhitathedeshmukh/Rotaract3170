# Generated migration for DMO fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clubs', '0006_add_professional_service_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='organizing_club_service',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='organizing_community_service',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='organizing_professional_service',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='organizing_international_service',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='category_points',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='project',
            name='category',
            field=models.CharField(
                choices=[
                    ('club_service', 'Club Service Avenue'),
                    ('community_service', 'Community Service Avenue'),
                    ('professional_service', 'Professional Service Avenue'),
                    ('professional_development', 'Professional Development Avenue'),
                    ('international_service', 'International Service Avenue'),
                    ('sports_wellness', 'Sports and Wellness Avenue'),
                    ('environment', 'Environment Avenue'),
                    ('dmo', 'Designated Monthly Observation'),
                ],
                max_length=50
            ),
        ),
    ]