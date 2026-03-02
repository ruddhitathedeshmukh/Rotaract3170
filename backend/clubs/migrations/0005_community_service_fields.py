# Generated migration for Community Service fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clubs', '0004_alter_meeting_status_project'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='community_capital_deployed',
            field=models.CharField(blank=True, default='0', max_length=50),
        ),
        migrations.AddField(
            model_name='project',
            name='lives_touched',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='project',
            name='service_hours',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='project',
            name='news_publication_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='news_publication_image',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='project',
            name='news_publication_link',
            field=models.URLField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='project',
            name='news_telecasting_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='news_telecasting_link',
            field=models.URLField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='project',
            name='women_empowerment',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='news_points',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='project',
            name='women_empowerment_points',
            field=models.IntegerField(default=0),
        ),
    ]