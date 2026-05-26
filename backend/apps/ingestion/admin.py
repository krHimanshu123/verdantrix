from django.contrib import admin

from .models import DataSource, RawRecord

admin.site.register(DataSource)
admin.site.register(RawRecord)
